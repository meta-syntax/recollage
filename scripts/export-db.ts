// DB バックアップ: categories / entries の全行を JSON に書き出す（読み取りのみ・何度でも安全）。
// 学習記録の実体は Supabase にしかないため、復元可能なスナップショットを手元に残す手段。
// embedding 列も含める（バックフィルで再計算可能だが、含めておけば復元がそのまま済む）。
//
//   npm run export:db
//
// 出力: data/export/recollage-<ISO日時>.json（.gitignore 対象）

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

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

const { data: categories, error: catError } = await supabase.from('categories').select('*').order('id')
if (catError) throw new Error(catError.message)
const { data: entries, error: entError } = await supabase.from('entries').select('*').order('id')
if (entError) throw new Error(entError.message)

const outDir = join(import.meta.dirname, '..', 'data', 'export')
mkdirSync(outDir, { recursive: true })
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const outPath = join(outDir, `recollage-${stamp}.json`)
writeFileSync(outPath, JSON.stringify({ exportedAt: new Date().toISOString(), categories, entries }, null, 2))

console.log(`カテゴリ ${categories!.length}件・エントリ ${entries!.length}件 → ${outPath}`)
