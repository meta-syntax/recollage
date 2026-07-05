import type { Entry } from '~~/shared/types/entry'
import type { Category } from '~~/shared/types/category'
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
}

const WEEK = ['日', '月', '火', '水', '木', '金', '土']

function buildCategoryLabel(cats: Category[]) {
  const byId = new Map(cats.map(c => [c.id, c]))
  return (id: string | null): { full: string, leaf: string } => {
    if (!id) return { full: '断片', leaf: '断片' }
    const c = byId.get(id)
    if (!c) return { full: id, leaf: id }
    if (c.parentId && byId.has(c.parentId)) {
      return { full: `${byId.get(c.parentId)!.name} › ${c.name}`, leaf: c.name }
    }
    return { full: c.name, leaf: c.name }
  }
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return `${y}年${m}月${d}日`
}

// Amazon の書影サムネ(_SY160 等)を大きめサイズに差し替える。
function upscale(url: string): string {
  return url.replace(/_S[XY]\d+/, '_SY450')
}

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
    title: e.title ?? '無題',
    excerpt: excerptOf(e),
    image: e.visual?.type === 'image' ? upscale(e.visual.content) : null,
    caption: e.background ?? null,
  }
}

function newSeed(): string {
  return Math.random().toString(36).slice(2)
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

  // ADR-008: セッションシードは起動時に1回生成し、スクロール中は不変。
  // 「組み直す」で seed と基準時刻を更新（=新しい号を編む）。
  // CSR 前提（ADR-003, ssr:false）なので Math.random / Date.now を直接使える。
  const seed = ref(newSeed())
  const composedAtMs = ref(Date.now())

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

  function recompose() {
    seed.value = newSeed()
    composedAtMs.value = Date.now()
  }

  return {
    count,
    issueNo,
    issueDate,
    navCats,
    feature: computed(() => arranged.value.feature),
    sides: computed(() => arranged.value.sides),
    rest: computed(() => arranged.value.rest),
    // 誌面の版を識別するキー。組み直しで変わる（誌面差し替えアニメーションのトリガー）
    compositionKey: computed(() => seed.value),
    recompose,
  }
}
