<script setup lang="ts">
// 書きつけ（密度 S・書き捨てメモ）。多段組の中で物理的に小さく表示する（ADR-002）。
import type { FeedCardVM } from '~/composables/useFeed'

defineProps<{
  card: FeedCardVM
}>()
</script>

<template>
  <NuxtLink
    :to="`/entries/${card.id}`"
    class="col-article"
  >
    <div class="col-head">
      <span class="col-cat">{{ card.categoryLabel }}</span>
      <span class="col-date">{{ card.date }}</span>
    </div>
    <!-- 未整理の徴＝編集への入口（ADR-011 面2・面3）。カード本体は詳細への NuxtLink のため click は止める -->
    <button
      v-if="card.fragment"
      class="arrange"
      @click.prevent.stop="navigateTo(`/entries/${card.id}/edit`)"
    >
      未整理 — 整える
    </button>
    <div class="memo">
      <span class="memo-mark">■</span>
      <p class="memo-text">
        {{ card.title }}
      </p>
    </div>
  </NuxtLink>
</template>

<style scoped>
.col-article {
  display: block;
  break-inside: avoid;
  padding: 20px 6px 22px;
  border-bottom: 1px solid var(--line-soft);
  cursor: pointer;
  transition: background .2s;
  color: inherit;
  text-decoration: none;
}
.col-article:hover { background: var(--accent-wash); }
.col-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 7px;
}
.col-cat {
  font-family: var(--font-sans);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .12em;
  color: var(--accent);
}
.col-date {
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: .1em;
  color: var(--text-soft);
}
.arrange {
  font-family: var(--font-sans);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .12em;
  color: var(--accent-muted);
  background: transparent;
  border: 1px dashed var(--accent-line);
  padding: 3px 9px;
  margin-top: 2px;
  cursor: pointer;
  transition: color .2s ease, border-color .2s ease;
}
.arrange:hover { color: var(--accent); border-color: var(--accent); }
.memo { display: flex; gap: 11px; margin-top: 4px; }
.memo-mark { color: var(--accent); font-size: 10px; line-height: 2.6; }
.memo-text {
  margin: 0;
  font-size: 15.5px;
  line-height: 1.95;
  font-weight: 500;
  text-wrap: pretty;
}
</style>
