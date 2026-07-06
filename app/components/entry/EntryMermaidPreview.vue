<script setup lang="ts">
// 編集フォーム（整える・ADR-011 面3）の Mermaid ライブプレビュー（第2層・D1）。
// ライブ編集特有のUX（デバウンス・直前の成功描画の保持・レースガード）はここに閉じ込め、
// 確定コンテンツ用の第1層 UiMermaid には持ち込まない。
const props = defineProps<{ code: string }>()

const svg = ref<string | null>(null) // 直前に成功した描画を保持し続ける（D2）
const invalid = ref(false) // 現在の code が描画失敗中か
let timer: ReturnType<typeof setTimeout> | undefined
let seq = 0

async function render(code: string) {
  const my = ++seq
  try {
    // 描画は既存 renderMermaid を直接使う（遅延ロード・initialize 一回済み・D4）
    const result = await renderMermaid(code)
    if (my !== seq) return // 古い結果は捨てる（D3）
    svg.value = result
    invalid.value = false
  }
  catch {
    if (my !== seq) return
    invalid.value = true // svg は据え置き（D2）
  }
}

// 入力途中のコードはほぼ常に不正なので 400ms デバウンス（D2）
watch(() => props.code, (code) => {
  clearTimeout(timer)
  if (!code.trim()) {
    svg.value = null
    invalid.value = false
    return
  }
  timer = setTimeout(() => render(code), 400)
}, { immediate: true })

onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <!-- 成功SVGが無くても構文エラー中は枠を出す（種別切替の再 mount で消えないように）。
       code が空白のみのとき（svg=null かつ invalid=false）だけ枠ごと非表示 -->
  <div
    v-if="svg || invalid"
    class="preview"
    :class="{ 'preview--error': !svg && invalid }"
  >
    <span class="preview-label">プレビュー</span>
    <!-- securityLevel: 'strict' で mermaid 側がサニタイズ済み。入力元も自分の localStorage のみ。
         直前に成功した SVG があれば失敗中も据え置きで表示（D2） -->
    <div
      v-if="svg"
      class="preview-svg"
      v-html="svg"
    />
    <!-- 成功SVGが無く構文エラー中: エラーであることと原文を等幅で示す -->
    <pre
      v-else
      class="preview-fallback-code"
    >{{ code }}</pre>
    <span
      v-if="invalid"
      class="preview-hint"
    >構文エラー</span>
  </div>
</template>

<style scoped>
.preview {
  position: relative;
  border: 1px solid var(--line);
  background: var(--surface-dim);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 18px;
}
.preview-label {
  position: absolute;
  top: 8px;
  left: 12px;
  font-family: var(--font-sans);
  font-size: 10.5px;
  letter-spacing: .08em;
  color: var(--text-soft);
}
.preview-svg { display: flex; justify-content: center; width: 100%; }
.preview-svg :deep(svg) { display: block; max-width: 100%; height: auto; max-height: 340px; }
/* SVG が無い構文エラー状態: 左寄せにし、ラベル・ヒントと重ならないよう上下に余白を足す */
.preview--error {
  justify-content: flex-start;
  align-items: stretch;
  padding: 30px 18px 26px;
}
.preview-fallback-code {
  width: 100%;
  margin: 0;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--text-body);
}
.preview-hint {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-family: var(--font-sans);
  font-size: 10.5px;
  letter-spacing: .08em;
  color: var(--text-soft);
}
</style>
