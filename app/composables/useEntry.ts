import type { BodyBlock } from '~/utils/parseBody'

export interface EntryDetailVM {
  id: string
  title: string
  categoryLabel: string
  date: string
  image: string | null
  mermaid: string | null
  caption: string | null
  keyPoints: string[]
  background: string | null
  blocks: BodyBlock[]
}

export function useEntry(id: string) {
  // ADR-001: データソースはこの1点でだけ選ぶ（ADR-013: ファクトリに一本化）
  const repo = useEntryRepository()

  const { data, status, refresh } = useAsyncData(`entry:${id}`, async () => {
    const [entry, categories] = await Promise.all([
      repo.getEntry(id),
      repo.listCategories(),
    ])
    return { entry, categories }
  }, {
    // stale-while-revalidate: 再訪時は前回の内容を即座に出し、裏で最新化（useFeed と同型）
    getCachedData: (key, nuxtApp, ctx) =>
      ctx.cause === 'refresh:manual' ? undefined : nuxtApp.payload.data[key],
  })

  // 閲覧記録は「詳細を開いたとき」のみ（ADR-008）。表示とは独立に一度だけ打つ
  onMounted(() => {
    repo.recordView(id)
    refresh()
  })

  const entry = computed<EntryDetailVM | null>(() => {
    const e = data.value?.entry
    if (!e) return null
    const label = buildCategoryLabel(data.value!.categories)
    return {
      id: e.id,
      title: displayTitle(e.title, e.body),
      categoryLabel: label(e.categoryId).full,
      date: fmtDate(e.createdAt),
      image: e.visual?.type === 'image' ? upscale(e.visual.content) : null,
      mermaid: e.visual?.type === 'mermaid' ? e.visual.content : null,
      caption: e.background ?? null,
      keyPoints: e.keyPoints,
      background: e.background,
      blocks: parseBody(e.body),
    }
  })

  const notFound = computed(() => status.value === 'success' && !data.value?.entry)

  return { entry, notFound }
}
