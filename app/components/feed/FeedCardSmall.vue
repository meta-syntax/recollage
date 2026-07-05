<script setup lang="ts">
// 断片（密度 S・書き捨てメモ）。多段組の中で物理的に小さく表示する（ADR-002）。
import type { FeedCardVM } from '~/composables/useFeed'

defineProps<{
  card: FeedCardVM
}>()
</script>

<template>
  <article class="col-article">
    <div class="col-head">
      <span class="col-cat">{{ card.categoryLabel }}</span>
      <span class="col-date">{{ card.date }}</span>
    </div>
    <div class="memo">
      <span class="memo-mark">■</span>
      <p class="memo-text">
        {{ card.title }}
      </p>
    </div>
  </article>
</template>

<style scoped>
.col-article {
  break-inside: avoid;
  padding: 20px 6px 22px;
  border-bottom: 1px solid rgba(38, 33, 26, .25);
  cursor: pointer;
  transition: background .2s;
}
.col-article:hover { background: rgba(37, 64, 124, .045); }
.col-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 7px;
}
.col-cat {
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .12em;
  color: #25407c;
}
.col-date {
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 10px;
  letter-spacing: .1em;
  color: rgba(38, 33, 26, .55);
}
.memo { display: flex; gap: 11px; margin-top: 4px; }
.memo-mark { color: #25407c; font-size: 10px; line-height: 2.6; }
.memo-text {
  margin: 0;
  font-size: 15.5px;
  line-height: 1.95;
  font-weight: 500;
  text-wrap: pretty;
}
</style>
