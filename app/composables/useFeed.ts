import type { Entry } from '~~/shared/types/entry'
import type { Category } from '~~/shared/types/category'
import entriesJson from '~~/data/mock/entries.json'
import categoriesJson from '~~/data/mock/categories.json'

// カード密度（ADR-002）。保存値ではなくフィールド充足から導出する。
// 大(L)=書影あり / 小(S)=本文が短い断片 / 中(M)=その他。
export type Density = 'L' | 'M' | 'S'

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

function deriveDensity(e: Entry): Density {
  if (e.visual?.type === 'image') return 'L'
  if (e.body.length < 250) return 'S'
  return 'M'
}

function fmtDate(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split('-').map(Number)
  return `${m}月${d}日`
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

export function useFeed() {
  const cats = categoriesJson as unknown as Category[]
  const entries = entriesJson as unknown as Entry[]
  const label = buildCategoryLabel(cats)
  const vms = entries.map(e => toVM(e, label))

  // 号情報はデータから決定論的に算出（new Date(now) を使わずハイドレーション差異を避ける）
  const maxIso = entries.reduce(
    (a, e) => (e.createdAt > a ? e.createdAt : a),
    entries[0]?.createdAt ?? '2026-01-01',
  )
  const [iy, im, id] = maxIso.slice(0, 10).split('-').map(Number)
  const issueDate = `${iy}年${im}月${id}日 ${WEEK[new Date(iy, im - 1, id).getDay()]}曜日`
  const issueNo = 100 + vms.length
  const navCats = [...new Set(vms.map(v => v.categoryLeaf))]

  // 初期順序は決定論的（createdAt 降順のまま）。再編成はクライアントのみで実行。
  const order = ref<string[]>(vms.map(v => v.id))

  const arranged = computed(() => {
    const byId = new Map(vms.map(v => [v.id, v]))
    const list = order.value
      .map(oid => byId.get(oid))
      .filter((v): v is FeedCardVM => !!v)
    const feature = list.find(v => v.density === 'L') ?? list[0] ?? null
    const sides = list.filter(v => v.id !== feature?.id && v.density === 'M').slice(0, 2)
    const used = new Set<string>([feature?.id ?? '', ...sides.map(s => s.id)])
    const rest = list.filter(v => !used.has(v.id))
    return { feature, sides, rest }
  })

  function recompose() {
    const a = [...order.value]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    order.value = a
  }

  return {
    count: vms.length,
    issueNo,
    issueDate,
    navCats,
    feature: computed(() => arranged.value.feature),
    sides: computed(() => arranged.value.sides),
    rest: computed(() => arranged.value.rest),
    recompose,
  }
}
