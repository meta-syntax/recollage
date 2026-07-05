// カテゴリ管理（ADR-011 面4）の状態とアクション。/categories 面の頭脳
import type { Entry } from '~~/shared/types/entry'
import type { Category } from '~~/shared/types/category'
import type { EntryRepository } from '~/repositories/entryRepository'
import { MockEntryRepository } from '~/repositories/mockEntryRepository'

export interface CatNode {
  id: string
  name: string
  /** 直接所属するエントリ数（削除時に断片へ退避される数） */
  entryCount: number
  children: CatNode[]
}

function buildTree(cats: Category[], entries: Entry[]): CatNode[] {
  const count = new Map<string, number>()
  entries.forEach((e) => {
    if (e.categoryId) count.set(e.categoryId, (count.get(e.categoryId) ?? 0) + 1)
  })
  const walk = (parentId: string | null): CatNode[] =>
    cats
      .filter(c => c.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(c => ({
        id: c.id,
        name: c.name,
        entryCount: count.get(c.id) ?? 0,
        children: walk(c.id),
      }))
  return walk(null)
}

export function useCategoryAdmin() {
  // ADR-001: データソースはこの1点でだけ選ぶ
  const repo: EntryRepository = new MockEntryRepository()

  const { data, refresh } = useAsyncData('category-admin', async () => {
    const [categories, entries] = await Promise.all([
      repo.listCategories(),
      repo.listEntries(),
    ])
    return { categories, entries }
  })

  // D&D がその場で並べ替えるため、data から組み直した可変コピーを持つ
  const tree = ref<CatNode[]>([])
  watch(data, (d) => {
    if (d) tree.value = buildTree(d.categories, d.entries)
  }, { immediate: true })

  const error = ref<string | null>(null)

  // どの操作も: 実行 → repository を信頼できる状態として再取得 → 誌面側のキャッシュも更新
  async function commit(fn: () => Promise<unknown>) {
    error.value = null
    try {
      await fn()
    }
    catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    }
    await Promise.all([refresh(), refreshNuxtData('feed')])
  }

  return {
    tree,
    error,
    move: (id: string, parentId: string | null, index: number) =>
      commit(() => repo.moveCategory(id, parentId, index)),
    addChild: (parentId: string | null) =>
      commit(() => repo.createCategory('新しい章', parentId)),
    rename: (id: string, name: string) =>
      commit(() => repo.renameCategory(id, name)),
    remove: (id: string) =>
      commit(() => repo.deleteCategory(id)),
  }
}
