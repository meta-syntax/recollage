// embedding バックフィル（ADR-015）: embedding が null のエントリを一括計算する。
// 移行済みの既存データ・埋め込み失敗で null のまま残った行が対象。再実行安全（冪等）。
//
//   node scripts/backfill-embeddings.ts

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { embeddingText } from '../shared/utils/embeddingText.ts'
import { embed } from '../server/utils/embedder.ts'

// .env 読み込み（mcp-server.ts と同じ素朴なパース。プロセス常駐しないスクリプトなので共有化しない）
const env: Record<string, string> = {}
for (const line of readFileSync(join(import.meta.dirname, '..', '.env'), 'utf-8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]!] = m[2]!.trim()
}
const url = env.NUXT_PUBLIC_SUPABASE_URL
const secretKey = env.SUPABASE_SECRET_KEY
if (!url || !secretKey) {
  console.error('.env に NUXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY が必要です')
  process.exit(1)
}

const supabase = createClient(url, secretKey, { auth: { persistSession: false } })

const { data, error } = await supabase.from('entries')
  .select('id, title, body, key_points')
  .is('embedding', null)
if (error) throw new Error(error.message)

const rows = (data ?? []) as { id: string, title: string | null, body: string, key_points: string[] }[]
console.log(`embedding 未計算: ${rows.length}件`)

for (const [i, row] of rows.entries()) {
  const embedding = await embed(embeddingText({ title: row.title, keyPoints: row.key_points, body: row.body }), 'passage')
  const { error: updateError } = await supabase.from('entries').update({ embedding }).eq('id', row.id)
  if (updateError) throw new Error(`${row.id}: ${updateError.message}`)
  console.log(`[${i + 1}/${rows.length}] ${row.id}`)
}

console.log('完了')
