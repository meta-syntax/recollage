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

    <div
      class="article-layout"
      :class="{ 'article-layout--single': entry.mermaid && !entry.image }"
    >
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

        <!-- 図解は aside だと占有幅が小さく読めない。書影が記事冒頭の右上に立つのと同様、冒頭に全幅で立てる -->
        <UiMermaid
          v-if="entry.mermaid"
          :code="entry.mermaid"
          :caption="entry.caption"
          tall
        />

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
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .14em;
  color: var(--accent);
}
.article-date {
  font-family: var(--font-sans);
  font-size: 11px;
  letter-spacing: .1em;
  color: var(--text-soft);
}
.article-title {
  margin: 0 0 28px;
  font-size: 40px;
  line-height: 1.5;
  font-weight: 800;
  letter-spacing: .01em;
  text-wrap: pretty;
  padding-bottom: 22px;
  border-bottom: 1px solid var(--line);
}

.article-layout {
  display: grid;
  grid-template-columns: 1.7fr 1fr;
  gap: 46px;
}
/* 図解エントリは aside が無い。空の右カラムを出さず単一カラムにし、行長が間延びしない幅に整える */
.article-layout--single { grid-template-columns: 1fr; }
.article-layout--single .article-main {
  max-width: 760px;
  margin-inline: auto;
}
@media (max-width: 860px) {
  .article-layout { grid-template-columns: 1fr; }
}
.article-side { min-width: 0; }

/* 要点囲み */
.keypoints {
  border: 1px solid var(--line);
  padding: 18px 22px 16px;
  margin-bottom: 28px;
  background: var(--accent-wash);
}
.keypoints-label {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .28em;
  color: var(--accent);
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
  color: var(--accent);
}

/* 本文 */
.body-p {
  margin: 0 0 1.6em;
  font-size: 15.5px;
  line-height: 2.15;
  color: var(--text-body);
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
  color: var(--text-body);
}
.body-hr {
  text-align: center;
  color: var(--accent-soft);
  font-size: 12px;
  margin: 2em 0;
}

/* 出自・文脈 */
.background {
  margin-top: 34px;
  padding-top: 14px;
  border-top: 1px solid var(--line-soft);
  font-family: var(--font-sans);
  font-size: 12px;
  letter-spacing: .08em;
  color: var(--text-soft);
}
</style>
