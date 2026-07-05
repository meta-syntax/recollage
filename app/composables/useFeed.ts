import type { Entry } from '~~/shared/types/entry'
import type { Density } from '~~/shared/utils/deriveDensity'
import { deriveDensity } from '~~/shared/utils/deriveDensity'
import { composeFeed } from '~~/shared/utils/feedScore'
import type { EntryRepository } from '~/repositories/entryRepository'
import { MockEntryRepository } from '~/repositories/mockEntryRepository'

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
    caption: e.background ?? null,
    fragment: e.categoryId === null,
  }
}

export function useFeed() {
  // ADR-001: データソースはこの1点でだけ選ぶ。フェーズ4は Supabase 実装に差し替え
  const repo: EntryRepository = new MockEntryRepository()

  const { data } = useAsyncData('feed', async () => {
    const [entries, categories] = await Promise.all([
      repo.listEntries(),
      repo.listCategories(),
    ])
    return { entries, categories }
  })

  // 号の状態（seed・基準時刻）はアプリ寿命 → stores/feed.ts
  const { seed, composedAtMs, recompose } = useFeedComposition()

  // スコア降順（Recency + Resurface + ε）に編成したカードVM列
  const vms = computed<FeedCardVM[]>(() => {
    if (!data.value) return []
    const label = buildCategoryLabel(data.value.categories)
    return composeFeed(data.value.entries, composedAtMs.value, seed.value)
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
  const count = computed(() => vms.value.length)
  const issueNo = computed(() => 100 + vms.value.length)

  // マストヘッドに出す組成時刻。号（seed）が同じ間は表示も変わらない
  const composedAt = computed(() => {
    const t = new Date(composedAtMs.value)
    return `${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}`
  })

  // 目次はカテゴリ定義順で固定（組み直し＝スコア順の変化に影響されない）
  const navCats = computed(() => {
    if (!data.value) return []
    const label = buildCategoryLabel(data.value.categories)
    const present = new Set(data.value.entries.map(e => label(e.categoryId).leaf))
    const ordered = data.value.categories
      .map(c => c.name)
      .filter(name => present.has(name))
    if (present.has('断片')) ordered.push('断片')
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
    feature: computed(() => arranged.value.feature),
    sides: computed(() => arranged.value.sides),
    rest: computed(() => arranged.value.rest),
    // 誌面の版を識別するキー。組み直しで変わる（誌面差し替えアニメーションのトリガー）
    compositionKey: computed(() => seed.value),
    recompose,
  }
}
