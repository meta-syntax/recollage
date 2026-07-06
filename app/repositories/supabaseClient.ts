// Supabase クライアントのモジュールレベル singleton。
// Nuxt コンテキスト内（composable / middleware / setup）から呼ばれる前提。
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (client) return client
  const { supabaseUrl, supabaseAnonKey } = useRuntimeConfig().public
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase の接続情報がありません。.env の NUXT_PUBLIC_SUPABASE_URL / NUXT_PUBLIC_SUPABASE_ANON_KEY を設定してください')
  }
  client = createClient(supabaseUrl as string, supabaseAnonKey as string)
  return client
}
