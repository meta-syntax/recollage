// 索引モーダル（ADR-016）の開閉状態。奥付の導線と ⌘K の両方から開くため useState で共有する
export function useIndexOpen() {
  return useState('index-open', () => false)
}
