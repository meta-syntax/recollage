// 表示用フォーマッタ（feed / entry 両フィーチャーで共有）
import type { Category } from '~~/shared/types/category'

// 表示タイトルの規約（shared/types/entry.ts）: 書き捨て（title: null）は body 先頭行でフォールバック
export function displayTitle(title: string | null, body: string): string {
  if (title) return title
  const line = body
    .split('\n')
    .map(s => s.trim())
    .find(s => s && s !== '---')
  return line ?? '無題'
}

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return `${y}年${m}月${d}日`
}

// Amazon の書影サムネ(_SY160 等)を大きめサイズに差し替える。
export function upscale(url: string): string {
  return url.replace(/_S[XY]\d+/, '_SY450')
}

export function buildCategoryLabel(cats: Category[]) {
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
