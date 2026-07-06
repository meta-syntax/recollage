import type { Entry } from '~~/shared/types/entry'
import type { Density } from '~~/shared/utils/deriveDensity'
import { deriveDensity } from '~~/shared/utils/deriveDensity'
import { composeFeed } from '~~/shared/utils/feedScore'

export type { Density }

export interface FeedCardVM {
  id: string
  density: Density
  categoryLabel: string
  categoryLeaf: string
  date: string
  title: string
  excerpt: string
  image: string | null
  mermaid: string | null
  caption: string | null
  /** 未整理（categoryId なし）。カードに徴と「整える」導線を出す（ADR-011 面2） */
  fragment: boolean
}

const WEEK = ['日', '月', '火', '水', '木', '金', '土']

// fmtDate / upscale / buildCategoryLabel は app/utils/format.ts（auto-import）

function excerptOf(e: Entry): string {
  const para = e.body
    .split('\n')
    .map(s => s.trim())
    .find(s => s && s !== '---')
  return para || e.keyPoints[0] || ''
}

function toVM(e: Entry, label: ReturnType<typeof buildCategoryLabel>): FeedCardVM {
  const { full, leaf } = label(e.categoryId)
  return {
    id: e.id,
    density: deriveDensity(e),
    categoryLabel: full,
    categoryLeaf: leaf,
    date: fmtDate(e.createdAt),
    title: displayTitle(e.title, e.body),
    excerpt: excerptOf(e),
    image: e.visual?.type === 'image' ? upscale(e.visual.content) : null,
    mermaid: e.visual?.type === 'mermaid' ? e.visual.content : null,
    caption: e.background ?? null,
    fragment: e.categoryId === null,
  }
}

/** 目次で「書きつけ」（categoryId なし）を選ぶときのクエリ値 */
export const FRAGMENT_CAT = '__fragment__'

export function useFeed() {
  // ADR-001: データソースはこの1点でだけ選ぶ（ADR-013: ファクトリに一本化）
  const repo = useEntryRepository()

  const { data } = useAsyncData('feed', async () => {
    const [entries, categories] = await Promise.all([
      repo.listEntries(),
      repo.listCategories(),
    ])
    return { entries, categories }
  })

  // 号の状態（seed・基準時刻）はアプリ寿命 → stores/feed.ts
  const { seed, composedAtMs, recompose } = useFeedComposition()

  // 目次の選択カテゴリは URL クエリで同期（リロード・詳細から戻るでも復元される）
  const route = useRoute()
  const router = useRouter()
  const selectedCat = computed<string | null>(() => {
    const q = route.query.cat
    return typeof q === 'string' && q ? q : null
  })
  function selectCat(id: string | null) {
    router.replace({ query: { ...route.query, cat: id ?? undefined } })
  }

  // 選択カテゴリのサブツリー全体を対象にする（読書を選べば Kindle本・Audible も含む）
  const filterIds = computed<Set<string> | 'fragment' | null>(() => {
    const sel = selectedCat.value
    if (!sel) return null
    if (sel === FRAGMENT_CAT) return 'fragment'
    const cats = data.value?.categories ?? []
    const ids = new Set<string>()
    const walk = (id: string) => {
      ids.add(id)
      cats.filter(c => c.parentId === id).forEach(c => walk(c.id))
    }
    walk(sel)
    return ids
  })

  // スコア降順（Recency + Resurface + ε）に編成したカードVM列
  const vms = computed<FeedCardVM[]>(() => {
    if (!data.value) return []
    const label = buildCategoryLabel(data.value.categories)
    const f = filterIds.value
    return composeFeed(data.value.entries, composedAtMs.value, seed.value)
      .filter(e => f === null
        ? true
        : f === 'fragment'
          ? e.categoryId === null
          : e.categoryId !== null && f.has(e.categoryId))
      .map(e => toVM(e, label))
  })

  // 号情報はデータから決定論的に算出（最新エントリの作成日を発行日に見立てる）
  const issueDate = computed(() => {
    const entries = data.value?.entries ?? []
    const maxIso = entries.reduce(
      (a, e) => (e.createdAt > a ? e.createdAt : a),
      entries[0]?.createdAt ?? '2026-01-01',
    )
    const [iy, im, id] = maxIso.slice(0, 10).split('-').map(Number)
    return `${iy}年${im}月${id}日 ${WEEK[new Date(iy!, im! - 1, id).getDay()]}曜日`
  })
  // 収録数は表示中（フィルタ後）の篇数、号数は号全体の総数から（章の切り替えで号は変わらない）
  const count = computed(() => vms.value.length)
  const issueNo = computed(() => 100 + (data.value?.entries.length ?? 0))

  // マストヘッドに出す組成時刻。号（seed）が同じ間は表示も変わらない
  const composedAt = computed(() => {
    const t = new Date(composedAtMs.value)
    return `${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}`
  })

  // 目次はツリー順（親 → sortOrder 順の子）で固定（組み直し＝スコア順の変化に影響されない）。
  // サブツリーにエントリを持つカテゴリだけを載せる
  const navCats = computed<{ id: string, label: string }[]>(() => {
    if (!data.value) return []
    const { categories: cats, entries } = data.value
    const direct = new Set(entries.map(e => e.categoryId).filter(Boolean))
    const hasInSubtree = (id: string): boolean =>
      direct.has(id) || cats.filter(c => c.parentId === id).some(c => hasInSubtree(c.id))
    const ordered: { id: string, label: string }[] = []
    const walk = (parentId: string | null) => {
      cats
        .filter(c => c.parentId === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .forEach((c) => {
          if (hasInSubtree(c.id)) ordered.push({ id: c.id, label: c.name })
          walk(c.id)
        })
    }
    walk(null)
    if (entries.some(e => e.categoryId === null)) ordered.push({ id: FRAGMENT_CAT, label: '書きつけ' })
    return ordered
  })

  // 誌面の振り分け: スコア上位の大カードを特集に、中カードを両袖に
  const arranged = computed(() => {
    const list = vms.value
    const feature = list.find(v => v.density === 'L') ?? list[0] ?? null
    const sides = list.filter(v => v.id !== feature?.id && v.density === 'M').slice(0, 2)
    const used = new Set<string>([feature?.id ?? '', ...sides.map(s => s.id)])
    const rest = list.filter(v => !used.has(v.id))
    return { feature, sides, rest }
  })

  return {
    count,
    issueNo,
    issueDate,
    composedAt,
    navCats,
    selectedCat,
    selectCat,
    feature: computed(() => arranged.value.feature),
    sides: computed(() => arranged.value.sides),
    rest: computed(() => arranged.value.rest),
    // 誌面の版を識別するキー。組み直し・章の切り替えで変わる（誌面差し替えアニメーションのトリガー）
    compositionKey: computed(() => `${seed.value}:${selectedCat.value ?? 'all'}`),
    recompose,
  }
}
