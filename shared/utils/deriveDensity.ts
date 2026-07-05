// カード密度の導出（ADR-002）
// 密度は保存せず、フィールドの充足状況から導出する。
// フィード編成・カードコンポーネント・インポート検証ログが必ずこの1関数を共有する。

import type { Entry } from '../types/entry'

export type Density = 'L' | 'M' | 'S'

/** 判定に使うフィールドだけの Entry サブセット */
export type DensitySource = Pick<Entry, 'title' | 'keyPoints' | 'visual'>

/** 大=visual あり / 中=title と keyPoints（1件以上）あり / 小=それ未満 */
export function deriveDensity(e: DensitySource): Density {
  if (e.visual) return 'L'
  if (e.title && e.keyPoints.length > 0) return 'M'
  return 'S'
}
