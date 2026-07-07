// 索引モーダル（ADR-016）の開閉状態。奥付の導線（FeedColophon）と
// モーダル本体（SearchIndexModal、app.vue 直下）がページを跨いで共有する
export function useIndexOpen() {
  return useState('index-open', () => false)
}
