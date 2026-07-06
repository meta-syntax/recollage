// 行 ↔ ドメインのマッピング（ADR-013）の回帰テスト。
// DB は snake_case・ドメインは camelCase。往復で全フィールドが保存されること、
// null フィールド（title / background / categoryId / visual / lastViewedAt / parentId）の扱いを固定する。
import { describe, expect, it } from 'vitest'
import type { Entry } from '~~/shared/types/entry'
import type { Category } from '~~/shared/types/category'
import type { CategoryRow, EntryRow } from './supabaseEntryRepository'
import { toCategory, toCategoryRow, toEntry, toEntryRow } from './supabaseEntryRepository'

describe('toEntry / toEntryRow', () => {
  const full: Entry = {
    id: 'manual-1',
    title: 'タイトル',
    body: '本文',
    keyPoints: ['a', 'b'],
    background: '背景',
    categoryId: 'cat-1',
    visual: { type: 'image', content: 'https://example.com/x.png' },
    source: { kind: 'obsidian', path: 'vault/note.md', importedAt: '2026-01-01T00:00:00.000Z' },
    createdAt: '2026-01-02T03:04:05.000Z',
    updatedAt: '2026-01-03T03:04:05.000Z',
    lastViewedAt: '2026-01-04T03:04:05.000Z',
    viewCount: 7,
  }

  it('domain → row → domain で全フィールドが保存される', () => {
    expect(toEntry(toEntryRow(full))).toEqual(full)
  })

  it('row → domain の列名マッピングが正しい', () => {
    const row = toEntryRow(full)
    expect(row.key_points).toEqual(['a', 'b'])
    expect(row.category_id).toBe('cat-1')
    expect(row.created_at).toBe('2026-01-02T03:04:05.000Z')
    expect(row.last_viewed_at).toBe('2026-01-04T03:04:05.000Z')
    expect(row.view_count).toBe(7)
  })

  it('null フィールド（書き捨て）を保持する', () => {
    const fragment: Entry = {
      id: 'manual-2',
      title: null,
      body: '書きつけ',
      keyPoints: [],
      background: null,
      categoryId: null,
      visual: null,
      source: { kind: 'manual' },
      createdAt: '2026-02-01T00:00:00.000Z',
      updatedAt: '2026-02-01T00:00:00.000Z',
      lastViewedAt: null,
      viewCount: 0,
    }
    const row = toEntryRow(fragment)
    expect(row.title).toBeNull()
    expect(row.background).toBeNull()
    expect(row.category_id).toBeNull()
    expect(row.visual).toBeNull()
    expect(row.last_viewed_at).toBeNull()
    expect(toEntry(row)).toEqual(fragment)
  })

  it('row → domain 起点でも往復で保存される', () => {
    const row: EntryRow = {
      id: 'obsidian-1',
      title: null,
      body: 'md',
      key_points: ['k'],
      background: null,
      category_id: null,
      visual: { type: 'mermaid', content: 'graph TD; A-->B' },
      source: { kind: 'obsidian' },
      created_at: '2026-03-01T00:00:00.000Z',
      updated_at: '2026-03-01T00:00:00.000Z',
      last_viewed_at: null,
      view_count: 0,
    }
    expect(toEntryRow(toEntry(row))).toEqual(row)
  })
})

describe('toCategory / toCategoryRow', () => {
  const child: Category = { id: 'cat-2', name: '量子力学', parentId: 'cat-1', sortOrder: 3 }
  const root: Category = { id: 'cat-1', name: '物理学', parentId: null, sortOrder: 0 }

  it('domain → row → domain で全フィールドが保存される', () => {
    expect(toCategory(toCategoryRow(child))).toEqual(child)
  })

  it('列名マッピングが正しい（parentId ↔ parent_id / sortOrder ↔ sort_order）', () => {
    const row = toCategoryRow(child)
    expect(row.parent_id).toBe('cat-1')
    expect(row.sort_order).toBe(3)
  })

  it('parentId null（トップレベル）を保持する', () => {
    const row = toCategoryRow(root)
    expect(row.parent_id).toBeNull()
    expect(toCategory(row)).toEqual(root)
  })

  it('row → domain 起点でも往復で保存される', () => {
    const row: CategoryRow = { id: 'cat-3', name: 'x', parent_id: null, sort_order: 1 }
    expect(toCategoryRow(toCategory(row))).toEqual(row)
  })
})
