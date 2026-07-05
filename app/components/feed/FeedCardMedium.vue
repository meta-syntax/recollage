<script setup lang="ts">
import type { FeedCardVM } from '~/composables/useFeed'

defineProps<{
  card: FeedCardVM
}>()
</script>

<template>
  <NuxtLink
    :to="`/entries/${card.id}`"
    class="side-article"
  >
    <div class="side-head">
      <span class="side-cat">{{ card.categoryLabel }}</span>
      <span class="side-date">{{ card.date }}</span>
    </div>
    <h3 class="side-title">
      {{ card.title }}
    </h3>
    <p class="side-body">
      {{ card.excerpt }}
    </p>
  </NuxtLink>
</template>

<style scoped>
.side-article {
  display: block;
  padding: 4px 0 24px;
  margin-bottom: 24px;
  border-bottom: 1px solid rgba(38, 33, 26, .25);
  cursor: pointer;
  color: inherit;
  text-decoration: none;
}
.side-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
}
.side-cat {
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .12em;
  color: #25407c;
}
.side-date {
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 10.5px;
  letter-spacing: .1em;
  color: rgba(38, 33, 26, .55);
}
.side-title {
  margin: 0 0 10px;
  font-size: 21.5px;
  line-height: 1.65;
  font-weight: 700;
  text-wrap: pretty;
  transition: color .2s;
}
.side-article:hover .side-title { color: #25407c; }
.side-body {
  margin: 0;
  font-size: 13.5px;
  line-height: 2;
  color: rgba(38, 33, 26, .78);
  text-wrap: pretty;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
