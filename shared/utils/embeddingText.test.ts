// embeddingText（ADR-015）: 書き込み3経路で同一の組み立てを保証する純関数のテスト
import { describe, expect, it } from 'vitest'
import { embeddingText } from './embeddingText'

describe('embeddingText', () => {
  it('title・keyPoints・body を改行連結する', () => {
    expect(embeddingText({ title: 'T', keyPoints: ['k1', 'k2'], body: 'B' }))
      .toBe('T\nk1\nk2\nB')
  })

  it('title なし・keyPoints 空（書き捨て）は body のみになる', () => {
    expect(embeddingText({ title: null, keyPoints: [], body: 'B' })).toBe('B')
  })

  it('上限を超える本文は切り詰める', () => {
    const long = 'あ'.repeat(10000)
    expect(embeddingText({ title: null, keyPoints: [], body: long }).length).toBe(8000)
  })
})
