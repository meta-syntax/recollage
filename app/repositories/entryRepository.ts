// データ境界（ADR-001）
// UI層（pages / components / composables）はこの interface だけを知り、
// データソース（JSON / Supabase / API）を一切知らない。
// 差し替え: MockEntryRepository → SupabaseEntryRepository → $fetch('/api/...')

import type { Entry } from '~~/shared/types/entry'
import type { Category } from '~~/shared/types/category'

export interface EntryRepository {
  listEntries(): Promise<Entry[]>
  listCategories(): Promise<Category[]>
  getEntry(id: string): Promise<Entry | null>
  /** 閲覧記録。詳細を開いたときのみ呼ぶ（ADR-008: lastViewedAt 更新・viewCount++） */
  recordView(id: string): Promise<void>
}
