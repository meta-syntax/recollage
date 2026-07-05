<script setup lang="ts">
import type { EntryDetailVM } from '~/composables/useEntry'

defineProps<{
  entry: EntryDetailVM
}>()
</script>

<template>
  <article class="article">
    <div class="article-head">
      <span class="article-cat">{{ entry.categoryLabel }}</span>
      <span class="article-date">{{ entry.date }} 記</span>
    </div>

    <h1 class="article-title">
      {{ entry.title }}
    </h1>

    <div class="article-layout">
      <div class="article-main">
        <div
          v-if="entry.keyPoints.length"
          class="keypoints"
        >
          <div class="keypoints-label">
            要点
          </div>
          <ul class="keypoints-list">
            <li
              v-for="(p, i) in entry.keyPoints"
              :key="i"
            >
              {{ p }}
            </li>
          </ul>
        </div>

        <div class="body">
          <template
            v-for="(b, i) in entry.blocks"
            :key="i"
          >
            <p
              v-if="b.type === 'p'"
              class="body-p"
            >
              {{ b.text }}
            </p>
            <h2
              v-else-if="b.type === 'h'"
              class="body-h"
            >
              {{ b.text }}
            </h2>
            <ul
              v-else-if="b.type === 'ul'"
              class="body-ul"
            >
              <li
                v-for="(item, j) in b.items"
                :key="j"
              >
                {{ item }}
              </li>
            </ul>
            <div
              v-else
              class="body-hr"
            >
              ✦
            </div>
          </template>
        </div>

        <div
          v-if="entry.background"
          class="background"
        >
          {{ entry.background }}
        </div>
      </div>

      <aside
        v-if="entry.image"
        class="article-side"
      >
        <UiFigure
          :src="entry.image"
          :alt="entry.title"
          :caption="entry.caption"
        />
      </aside>
    </div>
  </article>
</template>

<style scoped>
.article { padding: 34px 0 40px; }
.article-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 14px;
  margin-bottom: 16px;
}
.article-cat {
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .14em;
  color: #25407c;
}
.article-date {
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 11px;
  letter-spacing: .1em;
  color: rgba(38, 33, 26, .55);
}
.article-title {
  margin: 0 0 28px;
  font-size: 40px;
  line-height: 1.5;
  font-weight: 800;
  letter-spacing: .01em;
  text-wrap: pretty;
  padding-bottom: 22px;
  border-bottom: 1px solid rgba(38, 33, 26, .35);
}

.article-layout {
  display: grid;
  grid-template-columns: 1.7fr 1fr;
  gap: 46px;
}
@media (max-width: 860px) {
  .article-layout { grid-template-columns: 1fr; }
}
.article-side { min-width: 0; }

/* 要点囲み */
.keypoints {
  border: 1px solid rgba(38, 33, 26, .4);
  padding: 18px 22px 16px;
  margin-bottom: 28px;
  background: rgba(37, 64, 124, .035);
}
.keypoints-label {
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .28em;
  color: #25407c;
  margin-bottom: 10px;
}
.keypoints-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.keypoints-list li {
  font-size: 14px;
  line-height: 1.9;
  padding-left: 16px;
  position: relative;
}
.keypoints-list li::before {
  content: '■';
  position: absolute;
  left: 0;
  top: 0;
  font-size: 9px;
  line-height: 2.9;
  color: #25407c;
}

/* 本文 */
.body-p {
  margin: 0 0 1.6em;
  font-size: 15.5px;
  line-height: 2.15;
  color: rgba(38, 33, 26, .9);
  text-wrap: pretty;
}
.body-h {
  margin: 1.8em 0 .8em;
  font-size: 20px;
  line-height: 1.7;
  font-weight: 700;
}
.body-ul {
  margin: 0 0 1.6em;
  padding-left: 1.4em;
  font-size: 15px;
  line-height: 2.05;
  color: rgba(38, 33, 26, .9);
}
.body-hr {
  text-align: center;
  color: rgba(37, 64, 124, .6);
  font-size: 12px;
  margin: 2em 0;
}

/* 出自・文脈 */
.background {
  margin-top: 34px;
  padding-top: 14px;
  border-top: 1px solid rgba(38, 33, 26, .25);
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 12px;
  letter-spacing: .08em;
  color: rgba(38, 33, 26, .6);
}
</style>
