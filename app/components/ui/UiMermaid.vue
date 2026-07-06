<script setup lang="ts">
// 図解枠（Mermaid）。第1層: ドメインを知らない（props はプリミティブのみ・ADR-005）
const props = defineProps<{
  code: string
  caption: string | null
  /** 多段組など高さを詰めたい文脈で true */
  dense?: boolean
  /** 詳細ページの本文全幅など高さ上限を緩めたい文脈で true */
  tall?: boolean
}>()

// 描画結果の SVG 文字列。失敗時は null にしてフォールバック表示へ
const svg = ref<string | null>(null)
const failed = ref(false)

async function draw() {
  failed.value = false
  try {
    // mermaid は遅延ロード（ADR-003）。描画は CSR 前提で一瞬なのでプレースホルダは置かない
    svg.value = await renderMermaid(props.code)
  }
  catch (e) {
    // 不正コードは正常系（ユーザー入力）。throw を UI に漏らさずフォールバックする（D4）
    console.error(e)
    svg.value = null
    failed.value = true
  }
}

onMounted(draw)
watch(() => props.code, draw)
</script>

<template>
  <div>
    <div
      class="figure"
      :class="{ 'figure--dense': dense, 'figure--tall': tall }"
    >
      <div
        v-if="failed"
        class="figure-fallback"
      >
        <p class="figure-fallback-msg">
          図解を描画できませんでした
        </p>
        <pre class="figure-fallback-code">{{ code }}</pre>
      </div>
      <!-- securityLevel: 'strict' で mermaid 側がサニタイズ済み。入力元も自分の localStorage のみ -->
      <div
        v-else-if="svg"
        class="figure-svg"
        v-html="svg"
      />
    </div>
    <div class="figure-cap">
      <span>{{ caption }}</span>
      <span>図解</span>
    </div>
  </div>
</template>

<style scoped>
.figure {
  border: 1px solid var(--line);
  background: var(--surface-dim);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 18px;
}
.figure-svg { display: flex; justify-content: center; width: 100%; }
.figure-svg :deep(svg) { display: block; max-width: 100%; height: auto; max-height: 340px; }
.figure--dense .figure-svg :deep(svg) { max-height: 240px; }
.figure--tall .figure-svg :deep(svg) { max-height: 480px; }
.figure-fallback { width: 100%; }
.figure-fallback-msg {
  margin: 0 0 8px;
  font-family: var(--font-sans);
  font-size: 12px;
  letter-spacing: .08em;
  color: var(--text-soft);
}
.figure-fallback-code {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--text-body);
}
.figure-cap {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-sans);
  font-size: 10.5px;
  letter-spacing: .08em;
  color: var(--text-soft);
  margin: 8px 0 16px;
}
</style>
