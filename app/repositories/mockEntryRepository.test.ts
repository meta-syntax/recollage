// カテゴリ書き込み系（ADR-011 面4）の回帰テスト。
// D&D の UI 操作はここでは扱わず、確定時に呼ばれる moveCategory 等の
// 「sortOrder 整数連番のまま兄弟全件書き換え」の不変条件を固定する。
import { beforeEach, describe, expect, it } from 'vitest'
import type { Category } from '~~/shared/types/category'
import { MockEntryRepository } from './mockEntryRepository'

// Node 環境用の localStorage スタブ
const store = new Map<string, string>()
globalThis.localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() {
    return store.size
  },
} as Storage

const seed: Category[] = [
  { id: 'a', name: 'A', parentId: null, sortOrder: 0 },
  { id: 'a1', name: 'A1', parentId: 'a', sortOrder: 0 },
  { id: 'a2', name: 'A2', parentId: 'a', sortOrder: 1 },
  { id: 'b', name: 'B', parentId: null, sortOrder: 1 },
]

const repo = new MockEntryRepository()

async function snapshot(): Promise<string[]> {
  return (await repo.listCategories())
    .sort((x, y) => x.id.localeCompare(y.id))
    .map(c => `${c.id}:${c.parentId ?? 'root'}:${c.sortOrder}`)
}

beforeEach(() => {
  store.clear()
  localStorage.setItem('recollage:categories', JSON.stringify(seed))
})

describe('moveCategory', () => {
  it('同一親内の並べ替え: 兄弟全件が 0..n の連番に振り直される', async () => {
    await repo.moveCategory('a2', 'a', 0)
    expect(await snapshot()).toEqual(['a:root:0', 'a1:a:1', 'a2:a:0', 'b:root:1'])
  })

  it('親またぎの移動: 旧・新両方の兄弟列が連番になる', async () => {
    await repo.moveCategory('a1', null, 1)
    expect(await snapshot()).toEqual(['a:root:0', 'a1:root:1', 'a2:a:0', 'b:root:2'])
  })

  it('末尾への移動も index どおりに入る', async () => {
    await repo.moveCategory('b', 'a', 2)
    expect(await snapshot()).toEqual(['a:root:0', 'a1:a:0', 'a2:a:1', 'b:a:2'])
  })
})

describe('createCategory', () => {
  it('兄弟の末尾に連番で追加される', async () => {
    const cat = await repo.createCategory('C', null)
    expect(cat.parentId).toBeNull()
    const cats = await repo.listCategories()
    expect(cats.find(c => c.id === cat.id)?.sortOrder).toBe(2)
  })
})

describe('renameCategory', () => {
  it('名前だけが変わり、階層・順序は不変', async () => {
    await repo.renameCategory('a1', '改名後')
    const cats = await repo.listCategories()
    expect(cats.find(c => c.id === 'a1')?.name).toBe('改名後')
    expect(await snapshot()).toEqual(['a:root:0', 'a1:a:0', 'a2:a:1', 'b:root:1'])
  })
})

describe('deleteCategory', () => {
  it('子カテゴリを持つカテゴリの削除は拒否される', async () => {
    await expect(repo.deleteCategory('a')).rejects.toThrow('子カテゴリ')
    expect((await repo.listCategories())).toHaveLength(4)
  })

  it('葉の削除後、残る兄弟が連番に振り直される', async () => {
    await repo.deleteCategory('a1')
    expect(await snapshot()).toEqual(['a:root:0', 'a2:a:0', 'b:root:1'])
  })
})
