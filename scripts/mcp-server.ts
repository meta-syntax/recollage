// Recollage MCP サーバー（roadmap タスク4 / ADR-004・ADR-013 準拠）
//
// AI との壁打ちの学び・結論を Supabase の entries へ直接書き込む。
// scripts/ の流儀どおり Node 単体実行・アプリ非依存（Nuxt を経由しない）。
//
//   node scripts/mcp-server.ts
//
// 認証: secret key（RLS バイパス）。ローカルの信頼済みプロセス限定の使い方。
// 接続情報はリポジトリの .env から読む（MCP 登録側に秘密を書かない）:
//   NUXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY

import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Category } from '../shared/types/category.ts'
import { embeddingText } from '../shared/utils/embeddingText.ts'
import { embed } from '../server/utils/embedder.ts'

// ---- .env 読み込み（依存を増やさない素朴なパース。値に # や改行を含む想定はしない） ----

function loadEnv(): Record<string, string> {
  const path = join(import.meta.dirname, '..', '.env')
  const env: Record<string, string> = {}
  for (const line of readFileSync(path, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) env[m[1]!] = m[2]!.trim()
  }
  return env
}

const env = loadEnv()
const url = env.NUXT_PUBLIC_SUPABASE_URL
const secretKey = env.SUPABASE_SECRET_KEY
if (!url || !secretKey) {
  console.error('.env に NUXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY が必要です')
  process.exit(1)
}

const supabase = createClient(url, secretKey, { auth: { persistSession: false } })

/** embedding のローカル推論（ADR-015）。失敗しても書き込みを止めない（nullable が不変条件） */
async function tryEmbed(e: { title: string | null, keyPoints: string[], body: string }): Promise<number[] | null> {
  try {
    return await embed(embeddingText(e), 'passage')
  }
  catch {
    return null
  }
}

// ---- ツール定義 ----

const server = new McpServer({ name: 'recollage', version: '1.0.0' })

server.tool(
  'create_entry',
  'Recollage（学習ナレッジ誌面アプリ）にエントリを書き込む。AI との壁打ちで得た学び・結論・調査結果の記録に使う。body だけの書き捨ても可（アプリ側の「整える」導線に乗る）。カテゴリを付ける場合は先に list_categories で id を確認する。',
  {
    body: z.string().min(1).describe('本文（Markdown）。唯一の必須フィールド'),
    title: z.string().optional().describe('タイトル。省略時は書き捨て扱い（本文先頭行で表示される）'),
    keyPoints: z.array(z.string()).optional().describe('要点の箇条書き'),
    background: z.string().optional().describe('背景・文脈（なぜこの話題になったか）'),
    categoryId: z.string().optional().describe('list_categories で得たカテゴリ id'),
    mermaid: z.string().optional().describe('図解する場合の Mermaid コード（ビジュアルとして誌面カードに描画される）'),
  },
  async ({ body, title, keyPoints, background, categoryId, mermaid }) => {
    const now = new Date().toISOString()
    const embedding = await tryEmbed({ title: title ?? null, keyPoints: keyPoints ?? [], body })
    const row = {
      id: `mcp-${randomUUID()}`,
      title: title ?? null,
      body,
      key_points: keyPoints ?? [],
      background: background ?? null,
      category_id: categoryId ?? null,
      visual: mermaid ? { type: 'mermaid', content: mermaid } : null,
      source: { kind: 'mcp' },
      created_at: now,
      updated_at: now,
      last_viewed_at: null,
      view_count: 0,
      embedding,
    }
    const { error } = await supabase.from('entries').insert(row)
    if (error) {
      return { content: [{ type: 'text' as const, text: `書き込みに失敗しました: ${error.message}` }], isError: true }
    }
    return { content: [{ type: 'text' as const, text: `エントリを記録しました: ${row.id}${title ? `（${title}）` : '（書き捨て）'}` }] }
  },
)

server.tool(
  'list_categories',
  'Recollage のカテゴリツリーを取得する。create_entry で categoryId を指定する前に呼ぶ。',
  {},
  async () => {
    const { data, error } = await supabase.from('categories').select('*').order('sort_order')
    if (error) {
      return { content: [{ type: 'text' as const, text: `取得に失敗しました: ${error.message}` }], isError: true }
    }
    const cats: Category[] = (data ?? []).map(r => ({
      id: r.id as string,
      name: r.name as string,
      parentId: r.parent_id as string | null,
      sortOrder: r.sort_order as number,
    }))
    const lines: string[] = []
    const walk = (parentId: string | null, depth: number) => {
      for (const c of cats.filter(c => c.parentId === parentId)) {
        lines.push(`${'  '.repeat(depth)}- ${c.name} (id: ${c.id})`)
        walk(c.id, depth + 1)
      }
    }
    walk(null, 0)
    return { content: [{ type: 'text' as const, text: lines.join('\n') || 'カテゴリがありません' }] }
  },
)

server.tool(
  'search_entries',
  'Recollage のエントリを意味検索する（embedding コサイン類似）。壁打ち中に「この話題、前に記録したか」を確認するときや、append_to_entry の追記先を特定するときに使う。',
  {
    query: z.string().min(1).describe('検索クエリ（自然文でよい）'),
    limit: z.number().int().min(1).max(20).optional().describe('取得件数。省略時 5'),
  },
  async ({ query, limit }) => {
    const queryEmbedding = await embed(query, 'query')
    const { data, error } = await supabase.rpc('match_entries', {
      query_embedding: queryEmbedding,
      match_count: limit ?? 5,
    })
    if (error) {
      return { content: [{ type: 'text' as const, text: `検索に失敗しました: ${error.message}` }], isError: true }
    }
    const rows = (data ?? []) as { id: string, title: string | null, body: string, category_id: string | null, similarity: number }[]
    if (rows.length === 0) {
      return { content: [{ type: 'text' as const, text: '該当するエントリがありません（embedding 未計算の可能性もある）' }] }
    }
    const lines = rows.map((r) => {
      const heading = r.title ?? r.body.split('\n').map(s => s.trim()).find(s => s && s !== '---') ?? '(空)'
      const snippet = r.body.replace(/\s+/g, ' ').slice(0, 80)
      return `- ${heading} (id: ${r.id}, 類似度: ${r.similarity.toFixed(3)})\n  ${snippet}`
    })
    return { content: [{ type: 'text' as const, text: lines.join('\n') }] }
  },
)

server.tool(
  'append_to_entry',
  '既存エントリの本文末尾に追記する（追記専用。タイトル・要点・カテゴリは変更しない）。同じテーマの学びを育てるときに使う。追記先の id は search_entries で特定する。',
  {
    id: z.string().min(1).describe('追記先エントリの id'),
    text: z.string().min(1).describe('追記する本文（Markdown）'),
  },
  async ({ id, text }) => {
    const { data, error } = await supabase.from('entries')
      .select('id, title, body, key_points').eq('id', id).maybeSingle()
    if (error) {
      return { content: [{ type: 'text' as const, text: `取得に失敗しました: ${error.message}` }], isError: true }
    }
    if (!data) {
      return { content: [{ type: 'text' as const, text: `エントリが見つかりません: ${id}` }], isError: true }
    }
    const row = data as { id: string, title: string | null, body: string, key_points: string[] }
    const date = new Date().toLocaleDateString('sv-SE') // ローカルタイムの YYYY-MM-DD
    const body = `${row.body}\n\n---\n\n（追記 ${date}）\n\n${text}`
    const embedding = await tryEmbed({ title: row.title, keyPoints: row.key_points, body })
    const { error: updateError } = await supabase.from('entries').update({
      body,
      updated_at: new Date().toISOString(),
      ...(embedding ? { embedding } : {}),
    }).eq('id', id)
    if (updateError) {
      return { content: [{ type: 'text' as const, text: `追記に失敗しました: ${updateError.message}` }], isError: true }
    }
    return { content: [{ type: 'text' as const, text: `追記しました: ${id}${row.title ? `（${row.title}）` : ''}` }] }
  },
)

await server.connect(new StdioServerTransport())
