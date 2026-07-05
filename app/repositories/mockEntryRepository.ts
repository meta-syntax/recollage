// モック実装（フェーズ3）: 静的JSONを返す。
// data/mock/（実データ。著作権物を含むため gitignore）があればそれを、
// 無ければ data/sample/（コミット済みダミー）を読む。
// import.meta.glob はマッチ0件でもビルドが通るため、clone 直後・CI でも動く。
//
// 書き込み系（閲覧記録・新規作成・編集）はすべて localStorage にオーバーレイする。
// JSON は読み取り専用のまま、読み出し時にマージ。フェーズ4は Supabase 実装で
// 各メソッドを INSERT/UPDATE に差し替えるだけで、UI 層は変更不要（ADR-001）。
//   recollage:views      閲覧記録（lastViewedAt / viewCount）
//   recollage:created    アプリ内で作成したエントリ（Entry 全体）
//   recollage:edits      JSON 由来エントリへの編集パッチ（EntryDraft + updatedAt）
//   recollage:categories カテゴリツリーの全量スナップショット（初回変更時に JSON から複製）
//     ※ スナップショット方式のため、以降 JSON 側にカテゴリを足しても反映されない（モック負債）

import type { Entry } from '~~/shared/types/entry'
import type { Category } from '~~/shared/types/category'
import type { EntryDraft, EntryRepository } from './entryRepository'

const mock = import.meta.glob('../../data/mock/*.json', { eager: true, import: 'default' })
const sample = import.meta.glob('../../data/sample/*.json', { eager: true, import: 'default' })

function load<T>(file: string): T {
  const hit = Object.entries(mock).find(([k]) => k.endsWith(`/${file}`))
    ?? Object.entries(sample).find(([k]) => k.endsWith(`/${file}`))
  if (!hit) {
    throw new Error(`${file} が見つかりません。scripts/import-obsidian.ts で data/mock/ を生成するか、data/sample/ を確認してください`)
  }
  return hit[1] as T
}

const VIEWS_KEY = 'recollage:views'
const CREATED_KEY = 'recollage:created'
const EDITS_KEY = 'recollage:edits'
const CATS_KEY = 'recollage:categories'

interface ViewRecord {
  lastViewedAt: string
  viewCount: number
}

type EditRecord = EntryDraft & { updatedAt: string }

function readStorage<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback
  try {
    return JSON.parse(localStorage.getItem(key) ?? '') as T
  }
  catch {
    return fallback
  }
}

function readViews(): Record<string, ViewRecord> {
  return readStorage(VIEWS_KEY, {})
}

function readCreated(): Entry[] {
  return readStorage(CREATED_KEY, [])
}

function readEdits(): Record<string, EditRecord> {
  return readStorage(EDITS_KEY, {})
}

export class MockEntryRepository implements EntryRepository {
  async listEntries(): Promise<Entry[]> {
    const views = readViews()
    const edits = readEdits()
    const overlay = (e: Entry): Entry => {
      const patch = edits[e.id]
      const v = views[e.id]
      return {
        ...e,
        ...(patch ?? {}),
        ...(v ? { lastViewedAt: v.lastViewedAt, viewCount: v.viewCount } : {}),
      }
    }
    return [...load<Entry[]>('entries.json'), ...readCreated()].map(overlay)
  }

  async listCategories(): Promise<Category[]> {
    return readStorage<Category[] | null>(CATS_KEY, null) ?? load<Category[]>('categories.json')
  }

  async getEntry(id: string): Promise<Entry | null> {
    return (await this.listEntries()).find(e => e.id === id) ?? null
  }

  async recordView(id: string): Promise<void> {
    if (typeof localStorage === 'undefined') return
    const entry = await this.getEntry(id)
    if (!entry) return
    const views = readViews()
    views[id] = {
      lastViewedAt: new Date().toISOString(),
      viewCount: entry.viewCount + 1,
    }
    localStorage.setItem(VIEWS_KEY, JSON.stringify(views))
  }

  async createEntry(draft: EntryDraft): Promise<Entry> {
    const now = new Date().toISOString()
    const entry: Entry = {
      id: `manual-${crypto.randomUUID()}`,
      ...draft,
      source: { kind: 'manual' },
      createdAt: now,
      updatedAt: now,
      lastViewedAt: null,
      viewCount: 0,
    }
    localStorage.setItem(CREATED_KEY, JSON.stringify([...readCreated(), entry]))
    return entry
  }

  async updateEntry(id: string, draft: EntryDraft): Promise<Entry> {
    const now = new Date().toISOString()
    const created = readCreated()
    const inCreated = created.findIndex(e => e.id === id)
    if (inCreated >= 0) {
      // アプリ内作成分は recollage:created の中で直接更新する
      const updated: Entry = { ...created[inCreated]!, ...draft, updatedAt: now }
      created[inCreated] = updated
      localStorage.setItem(CREATED_KEY, JSON.stringify(created))
      return updated
    }
    const base = await this.getEntry(id)
    if (!base) throw new Error(`エントリが見つかりません: ${id}`)
    // JSON 由来分は読み取り専用のまま、パッチをオーバーレイする
    const edits = readEdits()
    edits[id] = { ...draft, updatedAt: now }
    localStorage.setItem(EDITS_KEY, JSON.stringify(edits))
    return { ...base, ...draft, updatedAt: now }
  }

  /** カテゴリの全量スナップショットを取得（未変更なら JSON から複製）して書き戻す */
  private async mutateCategories(fn: (cats: Category[]) => Category[]): Promise<Category[]> {
    const cats = fn(await this.listCategories())
    localStorage.setItem(CATS_KEY, JSON.stringify(cats))
    return cats
  }

  /** parentId の兄弟を sortOrder 順に取り出し、0..n の連番を振り直す（ADR-011: 兄弟全件書き換え） */
  private static renumber(cats: Category[], parentId: string | null): void {
    cats
      .filter(c => c.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .forEach((c, i) => {
        c.sortOrder = i
      })
  }

  async createCategory(name: string, parentId: string | null): Promise<Category> {
    const cat: Category = { id: `cat-${crypto.randomUUID()}`, name, parentId, sortOrder: Number.MAX_SAFE_INTEGER }
    await this.mutateCategories((cats) => {
      const next = [...cats, cat]
      MockEntryRepository.renumber(next, parentId)
      return next
    })
    return cat
  }

  async renameCategory(id: string, name: string): Promise<void> {
    await this.mutateCategories(cats =>
      cats.map(c => (c.id === id ? { ...c, name } : c)),
    )
  }

  async moveCategory(id: string, parentId: string | null, index: number): Promise<void> {
    await this.mutateCategories((cats) => {
      const next = cats.map(c => ({ ...c }))
      const target = next.find(c => c.id === id)
      if (!target) throw new Error(`カテゴリが見つかりません: ${id}`)
      const oldParentId = target.parentId
      // 新しい兄弟列の index 位置に割り込ませてから、旧・新両方の兄弟列を連番に振り直す
      target.parentId = parentId
      const siblings = next
        .filter(c => c.parentId === parentId && c.id !== id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
      siblings.splice(index, 0, target)
      siblings.forEach((c, i) => {
        c.sortOrder = i
      })
      if (oldParentId !== parentId) MockEntryRepository.renumber(next, oldParentId)
      return next
    })
  }

  async deleteCategory(id: string): Promise<void> {
    const cats = await this.listCategories()
    if (cats.some(c => c.parentId === id)) {
      throw new Error('子カテゴリがあるため削除できません。先に子を移動または削除してください')
    }
    // 所属エントリは断片へ退避（ADR-011: カスケード削除はしない）
    const affected = (await this.listEntries()).filter(e => e.categoryId === id)
    for (const e of affected) {
      await this.updateEntry(e.id, {
        title: e.title,
        body: e.body,
        keyPoints: e.keyPoints,
        background: e.background,
        categoryId: null,
        visual: e.visual,
      })
    }
    const parentId = cats.find(c => c.id === id)?.parentId ?? null
    await this.mutateCategories((current) => {
      const next = current.filter(c => c.id !== id)
      MockEntryRepository.renumber(next, parentId)
      return next
    })
  }
}
