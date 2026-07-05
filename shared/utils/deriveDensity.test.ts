import { describe, expect, it } from 'vitest'
import { deriveDensity } from './deriveDensity'

describe('deriveDensity（ADR-002）', () => {
  it('visual があれば大（mermaid でも）', () => {
    expect(deriveDensity({ title: null, keyPoints: [], visual: { type: 'image', content: 'x.jpg' } })).toBe('L')
    expect(deriveDensity({ title: null, keyPoints: [], visual: { type: 'mermaid', content: 'graph TD' } })).toBe('L')
  })

  it('title と keyPoints（1件以上）が揃えば中', () => {
    expect(deriveDensity({ title: 'T', keyPoints: ['p1'], visual: null })).toBe('M')
  })

  it('どちらか欠ければ小（書き捨ては物理的に小さく表示）', () => {
    expect(deriveDensity({ title: 'T', keyPoints: [], visual: null })).toBe('S')
    expect(deriveDensity({ title: null, keyPoints: ['p1'], visual: null })).toBe('S')
    expect(deriveDensity({ title: null, keyPoints: [], visual: null })).toBe('S')
  })
})
