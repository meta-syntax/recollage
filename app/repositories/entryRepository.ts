// データ境界（ADR-001）
// UI層（pages / components / composables）はこの interface だけを知り、
// データソース（JSON / Supabase / API）を一切知らない。
// 差し替え: MockEntryRepository → SupabaseEntryRepository → $fetch('/api/...')

import type { Entry, Visual } from '~~/shared/types/entry'
import type { Category } from '~~/shared/types/category'

/** ユーザーが編集できるフィールドの集合（ADR-011）。書き捨ては body 以外すべて null/空 */
export interface EntryDraft {
  title: string | null
  body: string
  keyPoints: string[]
  background: string | null
  categoryId: string | null
  visual: Visual | null
}

export interface EntryRepository {
  listEntries(): Promise<Entry[]>
  listCategories(): Promise<Category[]>
  getEntry(id: string): Promise<Entry | null>
  /** 閲覧記録。詳細を開いたときのみ呼ぶ（ADR-008: lastViewedAt 更新・viewCount++） */
  recordView(id: string): Promise<void>
  /** 書き捨てキャプチャ・整えの入口（ADR-011 面1・面3） */
  createEntry(draft: EntryDraft): Promise<Entry>
  updateEntry(id: string, draft: EntryDraft): Promise<Entry>
}
