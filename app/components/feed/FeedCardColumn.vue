<script setup lang="ts">
// 多段組のカード（密度 L/M）。書きつけ（S）は FeedCardSmall が担う。
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
    <UiFigure
      v-if="card.image"
      :src="card.image"
      :alt="card.title"
      :caption="card.caption"
      dense
    />
    <UiMermaid
      v-else-if="card.mermaid"
      :code="card.mermaid"
      :caption="card.caption"
      dense
    />
    <div class="col-head">
      <span class="col-cat">{{ card.categoryLabel }}</span>
      <span class="col-date">{{ card.date }}</span>
    </div>
    <h3 class="col-title">
      {{ card.title }}
    </h3>
    <p class="col-body">
      {{ card.excerpt }}
    </p>
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
.col-title {
  margin: 0 0 9px;
  font-size: 19.5px;
  line-height: 1.65;
  font-weight: 700;
  text-wrap: pretty;
  transition: color .2s;
}
.col-article:hover .col-title { color: var(--accent); }
.col-body {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.95;
  color: var(--text-muted);
  text-wrap: pretty;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
