// アプリ寿命のセッション状態のみを置く（判定: ページを離れて戻っても生きているべきか）。
// ページローカルの状態（フォーム入力・ロード状態等）は composable 内 ref に置き、ここへ昇格させない。

function newSeed(): string {
  return Math.random().toString(36).slice(2)
}

// ADR-008: セッションシードは起動時に1回生成し、スクロール中・ページ遷移を跨いで不変。
// 「組み直す」で seed と基準時刻を更新（=新しい号を編む）。
// CSR 前提（ADR-003, ssr:false）なので Math.random / Date.now を直接使える。
export function useFeedComposition() {
  const seed = useState('feed-seed', () => newSeed())
  const composedAtMs = useState('feed-composed-at', () => Date.now())

  function recompose() {
    seed.value = newSeed()
    composedAtMs.value = Date.now()
  }

  return { seed, composedAtMs, recompose }
}
