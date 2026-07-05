// モック実装（フェーズ3）: 静的JSONを返す。
// data/mock/（実データ。著作権物を含むため gitignore）があればそれを、
// 無ければ data/sample/（コミット済みダミー）を読む。
// import.meta.glob はマッチ0件でもビルドが通るため、clone 直後・CI でも動く。
//
// 閲覧記録（lastViewedAt / viewCount）は localStorage にオーバーレイする。
// JSON は読み取り専用のまま、読み出し時にマージ。フェーズ4は Supabase 実装で
// recordView を UPDATE に差し替えるだけで、UI 層は変更不要（ADR-001）。

import type { Entry } from '~~/shared/types/entry'
import type { Category } from '~~/shared/types/category'
import type { EntryRepository } from './entryRepository'

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

interface ViewRecord {
  lastViewedAt: string
  viewCount: number
}

function readViews(): Record<string, ViewRecord> {
  if (typeof localStorage === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(VIEWS_KEY) ?? '{}')
  }
  catch {
    return {}
  }
}

export class MockEntryRepository implements EntryRepository {
  async listEntries(): Promise<Entry[]> {
    const views = readViews()
    return load<Entry[]>('entries.json').map((e) => {
      const v = views[e.id]
      return v ? { ...e, lastViewedAt: v.lastViewedAt, viewCount: v.viewCount } : e
    })
  }

  async listCategories(): Promise<Category[]> {
    return load<Category[]>('categories.json')
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
}
