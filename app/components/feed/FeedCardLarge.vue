<script setup lang="ts">
import type { FeedCardVM } from '~/composables/useFeed'

defineProps<{
  card: FeedCardVM
}>()
</script>

<template>
  <article class="feature">
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
  </article>
</template>

<style scoped>
.feature { padding-right: 38px; }
.feature-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 14px;
  margin-bottom: 14px;
}
.feature-head-left { display: flex; align-items: baseline; gap: 12px; }
.badge {
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .22em;
  color: #f5eedd;
  background: #25407c;
  padding: 4px 10px 3px;
}
.feature-cat {
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: .12em;
  color: #25407c;
}
.feature-date {
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 11px;
  letter-spacing: .1em;
  color: rgba(38, 33, 26, .55);
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
.feature-title:hover { color: #25407c; }
.feature-body {
  margin: 0;
  font-size: 15px;
  line-height: 2.1;
  color: rgba(38, 33, 26, .88);
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
  color: #25407c;
  border-bottom: 1px solid rgba(37, 64, 124, .55);
  padding-bottom: 2px;
  cursor: pointer;
  transition: border-color .2s;
}
.readmore span:hover { border-bottom-color: #25407c; }
</style>
