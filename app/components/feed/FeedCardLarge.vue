<script setup lang="ts">
import type { FeedCardVM } from '~/composables/useFeed'

defineProps<{
  card: FeedCardVM
}>()
</script>

<template>
  <NuxtLink
    :to="`/entries/${card.id}`"
    class="feature"
  >
    <div class="feature-head">
      <div class="feature-head-left">
        <span class="badge">特集</span>
        <span class="feature-cat">{{ card.categoryLabel }}</span>
      </div>
      <span class="feature-date">{{ card.date }}</span>
    </div>
    <h2 class="feature-title">
      {{ card.title }}
    </h2>
    <UiFigure
      v-if="card.image"
      :src="card.image"
      :alt="card.title"
      :caption="card.caption"
    />
    <p class="feature-body">
      {{ card.excerpt }}
    </p>
    <div class="readmore">
      <span>つづきを読む ──→</span>
    </div>
  </NuxtLink>
</template>

<style scoped>
.feature {
  display: block;
  padding-right: 38px;
  color: inherit;
  text-decoration: none;
}
.feature-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 14px;
  margin-bottom: 14px;
}
.feature-head-left { display: flex; align-items: baseline; gap: 12px; }
.badge {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .22em;
  color: var(--text-inverse);
  background: var(--accent);
  padding: 4px 10px 3px;
}
.feature-cat {
  font-family: var(--font-sans);
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: .12em;
  color: var(--accent);
}
.feature-date {
  font-family: var(--font-sans);
  font-size: 11px;
  letter-spacing: .1em;
  color: var(--text-soft);
}
.feature-title {
  margin: 0 0 20px;
  font-size: 38px;
  line-height: 1.5;
  font-weight: 800;
  letter-spacing: .01em;
  text-wrap: pretty;
  cursor: pointer;
  transition: color .2s;
}
.feature-title:hover { color: var(--accent); }
.feature-body {
  margin: 0;
  font-size: 15px;
  line-height: 2.1;
  color: var(--text-body);
  text-wrap: pretty;
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.readmore { margin-top: 16px; }
.readmore span {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: .12em;
  color: var(--accent);
  border-bottom: 1px solid var(--accent-line);
  padding-bottom: 2px;
  cursor: pointer;
  transition: border-color .2s;
}
.readmore span:hover { border-bottom-color: var(--accent); }
</style>
