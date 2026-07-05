// モック実装（フェーズ3）: 静的JSONを返す。
// data/mock/（実データ。著作権物を含むため gitignore）があればそれを、
// 無ければ data/sample/（コミット済みダミー）を読む。
// import.meta.glob はマッチ0件でもビルドが通るため、clone 直後・CI でも動く。

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

export class MockEntryRepository implements EntryRepository {
  async listEntries(): Promise<Entry[]> {
    return load<Entry[]>('entries.json')
  }

  async listCategories(): Promise<Category[]> {
    return load<Category[]>('categories.json')
  }
}
