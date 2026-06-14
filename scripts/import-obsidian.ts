// Obsidian → JSON 変換スクリプト（フェーズ2）
//
// 読書アーカイブ Vault の Kindle / Audible / Novels / Anime ノートを Entry[] に変換し、
// data/mock/ に出力する。アプリ非依存・Node 単体実行（依存ゼロ）。
//
//   node scripts/import-obsidian.ts [vaultパス]
//
// vaultパス省略時は下記 DEFAULT_VAULT を使う。

import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import type { Dirent } from 'node:fs'
import { basename, join, relative } from 'node:path'
import type { Entry } from '../shared/types/entry.ts'
import type { Category } from '../shared/types/category.ts'

const DEFAULT_VAULT = '/Users/souta_kobayashi/30_learning/読書アーカイブ'
const VAULT = process.argv[2] ?? DEFAULT_VAULT
const OUT_DIR = join(import.meta.dirname, '..', 'data', 'mock')
const IMPORTED_AT = new Date().toISOString()

// ── カテゴリツリー（固定）─────────────────────────────
// 検証段階はソース種別ベースの2階層ツリー。genre/タグ由来の細分化は将来。
const CATEGORIES: Category[] = [
  { id: 'reading', name: '読書', parentId: null, sortOrder: 0 },
  { id: 'kindle', name: 'Kindle本', parentId: 'reading', sortOrder: 0 },
  { id: 'audible', name: 'Audible', parentId: 'reading', sortOrder: 1 },
  { id: 'story', name: '物語', parentId: null, sortOrder: 1 },
  { id: 'novel', name: '小説', parentId: 'story', sortOrder: 0 },
  { id: 'anime', name: 'アニメ', parentId: 'story', sortOrder: 1 },
]

// ── 小さなユーティリティ ─────────────────────────────

function stripQuotes(v: string): string {
  const t = v.trim()
  if ((t.startsWith('\'') && t.endsWith('\'')) || (t.startsWith('"') && t.endsWith('"'))) {
    return t.slice(1, -1)
  }
  return t
}

/** 簡易 YAML パーサー（フラット key:value・1段ネスト・配列に対応。本 Vault の frontmatter で十分） */
function parseYaml(text: string): Record<string, unknown> {
  const root: Record<string, unknown> = {}
  let currentKey: string | null = null
  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    const indent = line.length - line.trimStart().length
    const trimmed = line.trim()
    if (indent === 0) {
      const idx = trimmed.indexOf(':')
      if (idx < 0) continue
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim()
      currentKey = key
      root[key] = val === '' ? null : stripQuotes(val)
    }
    else if (currentKey) {
      if (trimmed.startsWith('- ')) {
        if (!Array.isArray(root[currentKey])) root[currentKey] = []
        ;
        (root[currentKey] as unknown[]).push(stripQuotes(trimmed.slice(2)))
      }
      else {
        const idx = trimmed.indexOf(':')
        if (idx < 0) continue
        if (root[currentKey] === null || typeof root[currentKey] !== 'object' || Array.isArray(root[currentKey])) {
          root[currentKey] = {}
        }
        const k = trimmed.slice(0, idx).trim()
        const v = trimmed.slice(idx + 1).trim()
                ;(root[currentKey] as Record<string, unknown>)[k] = stripQuotes(v)
      }
    }
  }
  return root
}

function parseFrontmatter(raw: string): { data: Record<string, unknown>, body: string } {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!m) return { data: {}, body: raw }
  return { data: parseYaml(m[1]), body: raw.slice(m[0].length) }
}

/** Markdown の `## 見出し` セクション本文を取り出す（次の `## ` 手前まで） */
function section(body: string, heading: string): string {
  const re = new RegExp(`^#+\\s*${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*$`, 'm')
  const m = body.match(re)
  if (!m || m.index === undefined) return ''
  const after = body.slice(m.index + m[0].length)
  const next = after.search(/^#{1,3}\s/m)
  return (next >= 0 ? after.slice(0, next) : after).trim()
}

/** `- ` 箇条書きを配列で抽出 */
function bullets(text: string): string[] {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('- '))
    .map(l => l.slice(2).trim())
    .filter(Boolean)
}

function firstH1(body: string): string | null {
  const m = body.match(/^#\s+(.+)$/m)
  return m ? m[1].trim() : null
}

function toISO(d: Date): string {
  return d.toISOString()
}

/** frontmatter の日付文字列 → ISO。空・不正は null */
function dateOr(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const d = new Date(value.trim())
  return Number.isNaN(d.getTime()) ? null : toISO(d)
}

function slug(name: string): string {
  return name.replace(/\.md$/, '').replace(/\s+/g, '-').slice(0, 60)
}

/** ADR-002 のカード密度導出（検証ログ用の簡易版。本体はフェーズ3で shared/utils に実装） */
function density(e: Entry): '大' | '中' | '小' {
  if (e.visual) return '大'
  if (e.title && e.keyPoints.length > 0) return '中'
  return '小'
}

// ── ファイル収集 ─────────────────────────────

function walk(dir: string): string[] {
  const out: string[] = []
  let dirents: Dirent[]
  try {
    dirents = readdirSync(dir, { withFileTypes: true })
  }
  catch {
    return out
  }
  for (const ent of dirents) {
    const p = join(dir, ent.name)
    if (ent.isDirectory()) out.push(...walk(p))
    else if (ent.name.endsWith('.md')) out.push(p)
  }
  return out
}

// ── 各ソースのパーサー ─────────────────────────────

function parseKindle(path: string): Entry | null {
  const raw = readFileSync(path, 'utf8')
  const { data, body } = parseFrontmatter(raw)
  const sync = (data['kindle-sync'] ?? {}) as Record<string, string>
  const asin = sync.asin
  if (!asin) return null

  // Highlights 部分を抽出し、location / ^ref を除去
  const hi = body.indexOf('## Highlights')
  let highlights = hi >= 0 ? body.slice(hi + '## Highlights'.length) : body
  highlights = highlights
    .replace(/ — location: \[\d+\]\([^)]*\)/g, '')
    .replace(/\s*\^ref-\w+/g, '')
    .trim()

  // 短いハイライト（80字以内）を先頭3件 keyPoints に
  const keyPoints = highlights
    .split(/\n-{3,}\n/)
    .map(s => s.trim())
    .filter(s => s && s.length <= 80)
    .slice(0, 3)

  const createdAt = dateOr(sync.lastAnnotatedDate) ?? toISO(statSync(path).birthtime)
  return {
    id: `kindle-${asin}`,
    title: firstH1(body) ?? sync.title ?? null,
    body: highlights,
    keyPoints,
    background: sync.author ?? null,
    categoryId: 'kindle',
    visual: sync.bookImageUrl ? { type: 'image', content: sync.bookImageUrl } : null,
    source: { kind: 'obsidian', path: relative(VAULT, path), importedAt: IMPORTED_AT },
    createdAt,
    updatedAt: toISO(statSync(path).mtime),
    lastViewedAt: null,
    viewCount: 0,
  }
}

function parseAudible(path: string): Entry | null {
  const raw = readFileSync(path, 'utf8')
  const { body } = parseFrontmatter(raw)
  const fileBase = basename(path, '.md')

  // タイトル: テンプレ形式 `- 書籍タイトル: ○○` → セクション形式 `## 書籍タイトル` → ファイル名 の順
  let title = body.match(/^-\s*書籍タイトル:\s*(.+)$/m)?.[1].trim() ?? ''
  if (!title) title = bullets(section(body, '書籍タイトル'))[0] ?? ''
  if (!title) title = fileBase.replace(/^\d{4}-\d{2}-\d{2}\s*/, '').replace(/Audibleメモ$/, '').trim()
  if (!title) title = fileBase

  const dateLine = body.match(/^-\s*日付:\s*(\d{4}-\d{2}-\d{2})/m)
  const fileDate = fileBase.match(/^(\d{4}-\d{2}-\d{2})/)
  const createdAt
    = dateOr(dateLine?.[1]) ?? dateOr(fileDate?.[1]) ?? toISO(statSync(path).birthtime)

  // keyPoints: 「今日のキーワード」優先、なければ「明日活かせそうなこと」
  let keyPoints = bullets(section(body, '今日のキーワード'))
  if (keyPoints.length === 0) keyPoints = bullets(section(body, '明日活かせそうなこと'))
  keyPoints = keyPoints.slice(0, 4)

  const summary = section(body, 'サマリー')
  const background = summary || null

  // 本文先頭の重複見出し（# YYYY-MM-DD Audibleメモ / # Audibleメモ）を除去
  const cleanBody = body
    .replace(/^#\s+\d{4}-\d{2}-\d{2}\s*Audibleメモ\s*$/m, '')
    .replace(/^#\s+Audibleメモ\s*$/m, '')
    .trim()

  return {
    id: `audible-${slug(fileBase)}`,
    title,
    body: cleanBody,
    keyPoints,
    background,
    categoryId: 'audible',
    visual: null,
    source: { kind: 'obsidian', path: relative(VAULT, path), importedAt: IMPORTED_AT },
    createdAt,
    updatedAt: toISO(statSync(path).mtime),
    lastViewedAt: null,
    viewCount: 0,
  }
}

/** Novels / Anime（frontmatter: status/genre/rating/author/started/finished） */
function parseFrontmatterNote(path: string, categoryId: 'novel' | 'anime'): Entry | null {
  const raw = readFileSync(path, 'utf8')
  const { data, body } = parseFrontmatter(raw)
  const keyPoints = bullets(section(body, '感想')).slice(0, 4)
  const createdAt
    = dateOr(data.finished) ?? dateOr(data.started) ?? toISO(statSync(path).birthtime)

  return {
    id: `${categoryId}-${slug(basename(path))}`,
    title: firstH1(body) ?? basename(path, '.md'),
    body: body.trim(),
    keyPoints,
    background: typeof data.author === 'string' && data.author ? data.author : null,
    categoryId,
    visual: null,
    source: { kind: 'obsidian', path: relative(VAULT, path), importedAt: IMPORTED_AT },
    createdAt,
    updatedAt: toISO(statSync(path).mtime),
    lastViewedAt: null,
    viewCount: 0,
  }
}

// ── メイン ─────────────────────────────

function main() {
  const skip = (p: string) => /\/(_sample_|index\.md$)/.test(p) || basename(p).startsWith('_sample_')

  const kindleFiles = walk(join(VAULT, 'ReadingNotes', 'Kindle')).filter(p => !skip(p))
  const audibleFiles = walk(join(VAULT, 'ReadingNotes', 'Audible')).filter(p => !skip(p))
  const novelFiles = walk(join(VAULT, 'Novels')).filter(p => !skip(p))
  const animeFiles = walk(join(VAULT, 'Anime')).filter(p => !skip(p))

  // Kindle は asin で重複排除（highlightsCount が多い方を残す）
  const kindleByAsin = new Map<string, Entry>()
  const kindleHi = new Map<string, number>()
  for (const f of kindleFiles) {
    const e = parseKindle(f)
    if (!e) continue
    const raw = readFileSync(f, 'utf8')
    const { data } = parseFrontmatter(raw)
    const sync = (data['kindle-sync'] ?? {}) as Record<string, string>
    const count = Number(sync.highlightsCount ?? 0)
    if (!kindleByAsin.has(e.id) || count > (kindleHi.get(e.id) ?? -1)) {
      kindleByAsin.set(e.id, e)
      kindleHi.set(e.id, count)
    }
  }

  const entries: Entry[] = [
    ...kindleByAsin.values(),
    ...audibleFiles.map(parseAudible).filter((e): e is Entry => e !== null),
    ...novelFiles.map(f => parseFrontmatterNote(f, 'novel')).filter((e): e is Entry => e !== null),
    ...animeFiles.map(f => parseFrontmatterNote(f, 'anime')).filter((e): e is Entry => e !== null),
  ]

  // createdAt 降順（新しい順）で安定させておく
  entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(join(OUT_DIR, 'entries.json'), JSON.stringify(entries, null, 2) + '\n')
  writeFileSync(join(OUT_DIR, 'categories.json'), JSON.stringify(CATEGORIES, null, 2) + '\n')

  // 検証ログ
  const byCat = (id: string) => entries.filter(e => e.categoryId === id).length
  const byDensity = (d: '大' | '中' | '小') => entries.filter(e => density(e) === d).length
  console.log(`✅ ${entries.length} entries → ${relative(process.cwd(), OUT_DIR)}/entries.json`)
  console.log(`   カテゴリ別: Kindle=${byCat('kindle')} Audible=${byCat('audible')} 小説=${byCat('novel')} アニメ=${byCat('anime')}`)
  console.log(`   密度別: 大=${byDensity('大')} 中=${byDensity('中')} 小=${byDensity('小')}`)
  console.log(`   Kindle重複排除: ${kindleFiles.length}ファイル → ${kindleByAsin.size}件`)
}

main()
