// 認証ガード（ADR-013）。dataSource が supabase のときだけ効く。
// mock 運用時・ログインページは素通し。それ以外は session 無しなら /login へ。
import { getSupabaseClient } from '~/repositories/supabaseClient'

export default defineNuxtRouteMiddleware(async (to) => {
  const { dataSource } = useRuntimeConfig().public
  if (dataSource !== 'supabase' || to.path === '/login') return

  const { data } = await getSupabaseClient().auth.getSession()
  if (!data.session) return navigateTo('/login')
})
