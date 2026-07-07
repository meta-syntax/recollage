// embedding 計算（ADR-015）。モデルをブラウザに載せられないため Nitro に置く。
// 秘密は扱わない（ローカル推論）。呼び出し元は SupabaseEntryRepository の create/update。
import { embed } from '../utils/embedder'

export default defineEventHandler(async (event) => {
  const { text, type } = await readBody<{ text?: string, type?: 'passage' | 'query' }>(event)
  if (!text) {
    throw createError({ statusCode: 400, statusMessage: 'text は必須です' })
  }
  return { embedding: await embed(text, type ?? 'passage') }
})
