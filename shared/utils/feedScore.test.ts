// feedScore の回帰テスト（ADR-008 の帰結:「カーブ特性を回帰テストする」）
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FEED_SCORE_CONFIG,
  applyFrozenOrder,
  composeFeed,
  epsilon,
  feedScore,
  recency,
  resurface,
  type Scorable,
} from './feedScore'

const DAY_MS = 24 * 60 * 60 * 1000
const CFG = DEFAULT_FEED_SCORE_CONFIG
const NOW = Date.parse('2026-07-01T00:00:00Z')

function entry(over: Partial<Scorable> & { id: string }): Scorable {
  return { createdAt: '2026-06-01T00:00:00Z', lastViewedAt: null, viewCount: 0, ...over }
}

/** NOW から days 日前の ISO 文字列 */
function daysAgo(days: number): string {
  return new Date(NOW - days * DAY_MS).toISOString()
}

describe('recency', () => {
  it('Δ=0 で 1、τ 日で 1/e', () => {
    expect(recency(0, 7)).toBe(1)
    expect(recency(7 * DAY_MS, 7)).toBeCloseTo(1 / Math.E, 10)
  })

  it('単調減少する', () => {
    const points = [0, 1, 3, 7, 14, 30].map(d => recency(d * DAY_MS, 7))
    for (let i = 1; i < points.length; i++) {
      expect(points[i]!).toBeLessThan(points[i - 1]!)
    }
  })

  it('未来の createdAt（負のΔ）は 1 にクランプされ 0〜1 を破らない', () => {
    expect(recency(-3 * DAY_MS, 7)).toBe(1)
  })
})

describe('resurface（間隔反復の山型）', () => {
  it('直後は低い（さっき見た）', () => {
    expect(resurface(0, 0, CFG)).toBe(0)
    expect(resurface(1 * 60 * 60 * 1000, 0, CFG)).toBeLessThan(0.01)
  })

  it('最適間隔（I_base=7日, viewCount=0）でピーク=1', () => {
    expect(resurface(7 * DAY_MS, 0, CFG)).toBeCloseTo(1, 10)
    // ピークの両側では下がる
    expect(resurface(2 * DAY_MS, 0, CFG)).toBeLessThan(1)
    expect(resurface(30 * DAY_MS, 0, CFG)).toBeLessThan(1)
  })

  it('放置しすぎると緩やかに下がる（単調減少域）', () => {
    const points = [7, 14, 30, 90, 365].map(d => resurface(d * DAY_MS, 0, CFG))
    for (let i = 1; i < points.length; i++) {
      expect(points[i]!).toBeLessThan(points[i - 1]!)
    }
  })

  it('viewCount が増えるとピークが右（長い間隔）へ移動する', () => {
    // viewCount=1 → I = 7·2 = 14日 がピーク
    expect(resurface(14 * DAY_MS, 1, CFG)).toBeCloseTo(1, 10)
    // 同じ Δseen=7日 なら、閲覧済み（vc=1）のほうが未閲覧（vc=0）より低い
    expect(resurface(7 * DAY_MS, 1, CFG)).toBeLessThan(resurface(7 * DAY_MS, 0, CFG))
  })
})

describe('epsilon（誌面の揺らぎ）', () => {
  it('同じ seed + id なら決定論的', () => {
    expect(epsilon('s1', 'e1', 0.15)).toBe(epsilon('s1', 'e1', 0.15))
  })

  it('seed が変わると値が変わる（起動ごとに誌面が変わる）', () => {
    expect(epsilon('s1', 'e1', 0.15)).not.toBe(epsilon('s2', 'e1', 0.15))
  })

  it('全エントリで [-a, +a] に収まる', () => {
    for (let i = 0; i < 200; i++) {
      const v = epsilon('seed', `entry-${i}`, 0.15)
      expect(Math.abs(v)).toBeLessThanOrEqual(0.15)
    }
  })
})

describe('feedScore / composeFeed', () => {
  it('lastViewedAt が null なら createdAt を時間基準にする（コールドスタート）', () => {
    const unviewed = entry({ id: 'a', createdAt: daysAgo(7), lastViewedAt: null })
    const justViewed = entry({ id: 'a', createdAt: daysAgo(7), lastViewedAt: daysAgo(0) })
    // 未閲覧は「7日前に触れた」扱い → Resurface ピーク。さっき見たなら Resurface=0
    expect(feedScore(unviewed, NOW, 'seed'))
      .toBeGreaterThan(feedScore(justViewed, NOW, 'seed'))
  })

  it('全件未閲覧でも新着順に潰れない: 最適間隔の忘れかけが今日の新着を上回る', () => {
    // ADR-008 の設計意図そのもの。今日の新着 S≈0.5（Recency のみ）、
    // 7日前の未閲覧 S≈0.5·e⁻¹ + 0.5·1 ≈ 0.68
    const today = entry({ id: 'today', createdAt: daysAgo(0) })
    const week = entry({ id: 'week', createdAt: daysAgo(7) })
    const noEps = { ...CFG, epsilonAmplitude: 0 }
    expect(feedScore(week, NOW, 's', noEps))
      .toBeGreaterThan(feedScore(today, NOW, 's', noEps))
  })

  it('同一 seed なら順序が安定する（スクロール中に並びが変わらない）', () => {
    const entries = Array.from({ length: 30 }, (_, i) =>
      entry({ id: `e${i}`, createdAt: daysAgo(i * 3) }))
    const a = composeFeed(entries, NOW, 'session-1').map(e => e.id)
    const b = composeFeed(entries, NOW, 'session-1').map(e => e.id)
    expect(a).toEqual(b)
  })

  it('seed が変わると誌面が変わる', () => {
    const entries = Array.from({ length: 30 }, (_, i) =>
      entry({ id: `e${i}`, createdAt: daysAgo(i * 3) }))
    const a = composeFeed(entries, NOW, 'session-1').map(e => e.id)
    const b = composeFeed(entries, NOW, 'session-2').map(e => e.id)
    expect(a).not.toEqual(b)
  })

  it('ε はスコアの大小関係を破壊しない（大差のペアは揺らぎで逆転しない）', () => {
    const strong = entry({ id: 'strong', createdAt: daysAgo(7) }) // ≈0.68
    const weak = entry({ id: 'weak', createdAt: daysAgo(90) }) // ≈0.02
    for (let i = 0; i < 50; i++) {
      const [first] = composeFeed([strong, weak], NOW, `seed-${i}`)
      expect(first!.id).toBe('strong')
    }
  })

  it('wRelated=0 のとき affinity はスコアに影響しない（mock モードの形骸化確認）', () => {
    const e = entry({ id: 'a', createdAt: daysAgo(3) })
    const cfg = { ...CFG, wRelated: 0 }
    expect(feedScore(e, NOW, 's', cfg, 0)).toBe(feedScore(e, NOW, 's', cfg, 1))
  })

  it('affinity は wRelated 倍で線形に加算される（ADR-015）', () => {
    const e = entry({ id: 'a', createdAt: daysAgo(3) })
    expect(feedScore(e, NOW, 's', CFG, 1) - feedScore(e, NOW, 's', CFG, 0))
      .toBeCloseTo(CFG.wRelated, 10)
  })

  it('composeFeed は affinityOf を各エントリに適用する（近い記録が浮かぶ）', () => {
    // 同条件の2件に affinity だけ差をつける。ε(±0.15) を超える差になるよう wRelated=0.3 × affinity 1.0
    const a = entry({ id: 'a', createdAt: daysAgo(30) })
    const b = entry({ id: 'b', createdAt: daysAgo(30) })
    for (let i = 0; i < 50; i++) {
      const [first] = composeFeed([a, b], NOW, `seed-${i}`, CFG, id => (id === 'b' ? 1 : 0))
      expect(first!.id).toBe('b')
    }
  })

  it('composeFeed は affinityOf 省略で従来挙動（affinity 全 0）と一致する', () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      entry({ id: `e${i}`, createdAt: daysAgo(i * 5) }))
    const withoutFn = composeFeed(entries, NOW, 's').map(e => e.id)
    const zeroFn = composeFeed(entries, NOW, 's', CFG, () => 0).map(e => e.id)
    expect(withoutFn).toEqual(zeroFn)
  })
})

describe('applyFrozenOrder（号の並び順凍結）', () => {
  it('スナップショット順に並べ直す（entries の順序に依存しない）', () => {
    const entries = [entry({ id: 'a' }), entry({ id: 'b' }), entry({ id: 'c' })]
    expect(applyFrozenOrder(entries, ['c', 'a', 'b']).map(e => e.id)).toEqual(['c', 'a', 'b'])
  })

  it('閲覧で lastViewedAt / viewCount が変わっても順序は不変', () => {
    const before = [entry({ id: 'a' }), entry({ id: 'b' })]
    const order = composeFeed(before, NOW, 's').map(e => e.id)
    const after = [
      entry({ id: 'a', lastViewedAt: daysAgo(0), viewCount: 5 }),
      entry({ id: 'b' }),
    ]
    expect(applyFrozenOrder(after, order).map(e => e.id)).toEqual(order)
  })

  it('order に無い id（号の途中で増えた分）は作成日降順で先頭に置く', () => {
    const entries = [
      entry({ id: 'old' }),
      entry({ id: 'new1', createdAt: daysAgo(1) }),
      entry({ id: 'new2', createdAt: daysAgo(0) }),
    ]
    expect(applyFrozenOrder(entries, ['old']).map(e => e.id)).toEqual(['new2', 'new1', 'old'])
  })

  it('order にあるが entries に無い id（削除済み）は無視する', () => {
    const entries = [entry({ id: 'a' })]
    expect(applyFrozenOrder(entries, ['gone', 'a']).map(e => e.id)).toEqual(['a'])
  })

  it('空の order なら entries 全件が作成日降順で並ぶ', () => {
    const entries = [entry({ id: 'a', createdAt: daysAgo(2) }), entry({ id: 'b', createdAt: daysAgo(1) })]
    expect(applyFrozenOrder(entries, []).map(e => e.id)).toEqual(['b', 'a'])
  })
})
