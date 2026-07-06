// リポジトリ生成の一本化（ADR-013）。runtimeConfig public.dataSource で切替。
// UI 層はこのファクトリだけを呼び、データソースを知らない（ADR-001）。
import type { EntryRepository } from '~/repositories/entryRepository'
import { MockEntryRepository } from '~/repositories/mockEntryRepository'
import { SupabaseEntryRepository } from '~/repositories/supabaseEntryRepository'
import { getSupabaseClient } from '~/repositories/supabaseClient'

let instance: EntryRepository | null = null

export function useEntryRepository(): EntryRepository {
  if (instance) return instance
  const { dataSource } = useRuntimeConfig().public
  instance = dataSource === 'supabase'
    ? new SupabaseEntryRepository(getSupabaseClient())
    : new MockEntryRepository()
  return instance
}
