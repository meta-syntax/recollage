<script setup lang="ts">
// 図版枠（書影）。第1層: ドメインを知らない（props はプリミティブのみ・ADR-005）
defineProps<{
  src: string
  alt: string
  caption: string | null
  /** 多段組など高さを詰めたい文脈で true */
  dense?: boolean
}>()
</script>

<template>
  <div>
    <div
      class="figure"
      :class="{ 'figure--dense': dense }"
    >
      <img
        :src="src"
        :alt="alt"
        loading="lazy"
      >
    </div>
    <div class="figure-cap">
      <span>{{ caption }}</span>
      <span>書影</span>
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
.figure img { display: block; max-width: 100%; height: auto; max-height: 340px; }
.figure--dense img { max-height: 240px; }
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
