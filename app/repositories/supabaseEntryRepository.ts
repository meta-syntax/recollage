// Supabase 実装（ADR-013）: EntryRepository を Supabase 直（RLS）で満たす。
// DB は snake_case、ドメイン型は camelCase。マッピングは純関数として export しテスト対象にする。
// 観測可能挙動は MockEntryRepository と同じ（差分は ADR-013 で明記したものだけ）。
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Entry, EntrySource, Visual } from '~~/shared/types/entry'
import type { Category } from '~~/shared/types/category'
import { embeddingText } from '~~/shared/utils/embeddingText'
import type { EntryDraft, EntryRepository, SearchHit } from './entryRepository'

// ── 行 ↔ ドメイン マッピング ─────────────────────────────

export interface EntryRow {
  id: string
  title: string | null
  body: string
  key_points: string[]
  background: string | null
  category_id: string | null
  visual: Visual | null
  source: EntrySource
  created_at: string
  updated_at: string
  last_viewed_at: string | null
  view_count: number
}

export interface CategoryRow {
  id: string
  name: string
  parent_id: string | null
  sort_order: number
}

export function toEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    keyPoints: row.key_points,
    background: row.background,
    categoryId: row.category_id,
    visual: row.visual,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastViewedAt: row.last_viewed_at,
    viewCount: row.view_count,
  }
}

export function toEntryRow(entry: Entry): EntryRow {
  return {
    id: entry.id,
    title: entry.title,
    body: entry.body,
    key_points: entry.keyPoints,
    background: entry.background,
    category_id: entry.categoryId,
    visual: entry.visual,
    source: entry.source,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
    last_viewed_at: entry.lastViewedAt,
    view_count: entry.viewCount,
  }
}

export function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    sortOrder: row.sort_order,
  }
}

export function toCategoryRow(cat: Category): CategoryRow {
  return {
    id: cat.id,
    name: cat.name,
    parent_id: cat.parentId,
    sort_order: cat.sortOrder,
  }
}

// ── ヘルパ ────────────────────────────────────────────

/** supabase 応答の error が非 null なら message を throw する */
function throwOn(error: { message: string } | null): void {
  if (error) throw new Error(error.message)
}

/**
 * entries の読み取りカラム（embedding を除く全カラム）。
 * ADR-015: 768次元ベクトルを一覧・取得で転送しないため select('*') は使わない
 */
const ENTRY_COLUMNS = 'id, title, body, key_points, background, category_id, visual, source, created_at, updated_at, last_viewed_at, view_count'

/**
 * embedding をローカル推論（Nitro /api/embed → Ruri v3）で計算する。
 * 失敗しても書き込みを止めない（ADR-015: nullable が不変条件）
 */
async function tryEmbed(e: { title: string | null, keyPoints: string[], body: string }): Promise<number[] | null> {
  try {
    const { embedding } = await $fetch<{ embedding: number[] }>('/api/embed', {
      method: 'POST',
      body: { text: embeddingText(e) },
    })
    return embedding
  }
  catch {
    return null
  }
}

/** ilike パターンに埋め込む文字列のエスケープ（% _ \ をリテラル扱いにする） */
function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, m => `\\${m}`)
}

/** match_entries RPC の行（0002_embeddings.sql） */
export interface MatchRow {
  id: string
  title: string | null
  body: string
  category_id: string | null
  similarity: number
}

/**
 * 索引のマージ（ADR-016）: タイトル一致を先頭に、ベクトルヒットを重複除去して続ける。
 * 純関数としてテスト対象にする
 */
export function mergeSearchHits(titleRows: Omit<MatchRow, 'similarity'>[], vectorRows: MatchRow[], limit: number): SearchHit[] {
  const hits: SearchHit[] = titleRows.map(r => ({
    id: r.id,
    title: r.title,
    body: r.body,
    categoryId: r.category_id,
    similarity: null,
  }))
  const seen = new Set(hits.map(h => h.id))
  for (const r of vectorRows) {
    if (seen.has(r.id)) continue
    hits.push({ id: r.id, title: r.title, body: r.body, categoryId: r.category_id, similarity: r.similarity })
  }
  return hits.slice(0, limit)
}

/** parentId の兄弟を sortOrder 順に取り出し、0..n の連番を振り直す（ADR-011: 兄弟全件書き換え） */
function renumber(cats: Category[], parentId: string | null): void {
  cats
    .filter(c => c.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .forEach((c, i) => {
      c.sortOrder = i
    })
}

// ── リポジトリ ────────────────────────────────────────

export class SupabaseEntryRepository implements EntryRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listEntries(): Promise<Entry[]> {
    const { data, error } = await this.client.from('entries').select(ENTRY_COLUMNS).order('created_at')
    throwOn(error)
    return ((data ?? []) as unknown as EntryRow[]).map(toEntry)
  }

  async listCategories(): Promise<Category[]> {
    const { data, error } = await this.client.from('categories').select('*').order('sort_order')
    throwOn(error)
    return ((data ?? []) as CategoryRow[]).map(toCategory)
  }

  async getEntry(id: string): Promise<Entry | null> {
    const { data, error } = await this.client.from('entries').select(ENTRY_COLUMNS).eq('id', id).maybeSingle()
    throwOn(error)
    return data ? toEntry(data as unknown as EntryRow) : null
  }

  async recordView(id: string): Promise<void> {
    // read-then-write（ADR-013: RPC 化しない）。行が無ければ何もしない
    const { data, error } = await this.client.from('entries').select('view_count').eq('id', id).maybeSingle()
    throwOn(error)
    if (!data) return
    const { error: updateError } = await this.client.from('entries').update({
      last_viewed_at: new Date().toISOString(),
      view_count: (data as { view_count: number }).view_count + 1,
    }).eq('id', id)
    throwOn(updateError)
  }

  async createEntry(draft: EntryDraft): Promise<Entry> {
    const now = new Date().toISOString()
    const entry: Entry = {
      id: `manual-${crypto.randomUUID()}`,
      ...draft,
      source: { kind: 'manual' },
      createdAt: now,
      updatedAt: now,
      lastViewedAt: null,
      viewCount: 0,
    }
    const embedding = await tryEmbed(entry)
    const { error } = await this.client.from('entries').insert({ ...toEntryRow(entry), embedding })
    throwOn(error)
    return entry
  }

  async updateEntry(id: string, draft: EntryDraft): Promise<Entry> {
    const now = new Date().toISOString()
    const embedding = await tryEmbed(draft)
    const { data, error } = await this.client.from('entries').update({
      title: draft.title,
      body: draft.body,
      key_points: draft.keyPoints,
      background: draft.background,
      category_id: draft.categoryId,
      visual: draft.visual,
      updated_at: now,
      ...(embedding ? { embedding } : {}),
    }).eq('id', id).select(ENTRY_COLUMNS).maybeSingle()
    throwOn(error)
    if (!data) throw new Error(`エントリが見つかりません: ${id}`)
    return toEntry(data as unknown as EntryRow)
  }

  async createCategory(name: string, parentId: string | null): Promise<Category> {
    // sort_order = 現在の兄弟数（兄弟は常に 0..n-1 の連番、という不変条件を維持）
    const cats = await this.listCategories()
    const cat: Category = {
      id: `cat-${crypto.randomUUID()}`,
      name,
      parentId,
      sortOrder: cats.filter(c => c.parentId === parentId).length,
    }
    const { error } = await this.client.from('categories').insert(toCategoryRow(cat))
    throwOn(error)
    return cat
  }

  async renameCategory(id: string, name: string): Promise<void> {
    const { error } = await this.client.from('categories').update({ name }).eq('id', id)
    throwOn(error)
  }

  async moveCategory(id: string, parentId: string | null, index: number): Promise<void> {
    // 全カテゴリをメモリ上で mock と同じアルゴリズムで並べ替え、変わった行だけ per-row update
    const cats = await this.listCategories()
    const before = new Map(cats.map(c => [c.id, { parentId: c.parentId, sortOrder: c.sortOrder }]))

    const next = cats.map(c => ({ ...c }))
    const target = next.find(c => c.id === id)
    if (!target) throw new Error(`カテゴリが見つかりません: ${id}`)
    const oldParentId = target.parentId
    target.parentId = parentId
    const siblings = next
      .filter(c => c.parentId === parentId && c.id !== id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    siblings.splice(index, 0, target)
    siblings.forEach((c, i) => {
      c.sortOrder = i
    })
    if (oldParentId !== parentId) renumber(next, oldParentId)

    const changed = next.filter((c) => {
      const b = before.get(c.id)!
      return b.parentId !== c.parentId || b.sortOrder !== c.sortOrder
    })
    await Promise.all(changed.map(async (c) => {
      const { error } = await this.client.from('categories')
        .update({ parent_id: c.parentId, sort_order: c.sortOrder })
        .eq('id', c.id)
      throwOn(error)
    }))
  }

  async deleteCategory(id: string): Promise<void> {
    const cats = await this.listCategories()
    if (cats.some(c => c.parentId === id)) {
      throw new Error('子カテゴリがあるため削除できません。先に子を移動または削除してください')
    }
    const parentId = cats.find(c => c.id === id)?.parentId ?? null
    // 所属エントリは FK on delete set null で自動退避（updateEntry ループは書かない）
    const { error } = await this.client.from('categories').delete().eq('id', id)
    throwOn(error)
    // 旧親の兄弟を連番に振り直す
    const siblings = cats
      .filter(c => c.parentId === parentId && c.id !== id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    await Promise.all(siblings.map(async (c, i) => {
      if (c.sortOrder === i) return
      const { error } = await this.client.from('categories').update({ sort_order: i }).eq('id', c.id)
      throwOn(error)
    }))
  }

  async searchEntries(query: string, limit = 8): Promise<SearchHit[]> {
    // タイトル部分一致（確実な再訪）とクエリ embedding（曖昧な想起）を並行で引く。
    // embedding の計算失敗時はタイトル一致のみに縮退する（ADR-015 と同じ失敗方針）
    const [titleRes, queryEmbedding] = await Promise.all([
      this.client.from('entries')
        .select('id, title, body, category_id')
        .ilike('title', `%${escapeLike(query)}%`)
        .order('updated_at', { ascending: false })
        .limit(limit),
      $fetch<{ embedding: number[] }>('/api/embed', {
        method: 'POST',
        body: { text: query, type: 'query' },
      }).then(r => r.embedding).catch(() => null),
    ])
    throwOn(titleRes.error)
    const titleRows = (titleRes.data ?? []) as Omit<MatchRow, 'similarity'>[]

    let vectorRows: MatchRow[] = []
    if (queryEmbedding) {
      const { data, error } = await this.client.rpc('match_entries', {
        query_embedding: queryEmbedding,
        match_count: limit,
      })
      throwOn(error)
      vectorRows = (data ?? []) as MatchRow[]
    }
    return mergeSearchHits(titleRows, vectorRows, limit)
  }

  async getAffinities(recentIds: string[]): Promise<Record<string, number>> {
    if (recentIds.length === 0) return {}
    const { data, error } = await this.client.rpc('feed_affinity', { recent_ids: recentIds })
    throwOn(error)
    return Object.fromEntries(
      ((data ?? []) as { id: string, affinity: number }[]).map(r => [r.id, r.affinity]),
    )
  }
}
