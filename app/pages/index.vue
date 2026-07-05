<script setup lang="ts">
const { count, issueNo, issueDate, navCats, feature, sides, rest, recompose } = useFeed()

const composedAt = ref('—')

function stamp() {
  const t = new Date()
  composedAt.value = `${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}`
}

function onRecompose() {
  recompose()
  stamp()
}

onMounted(stamp)
</script>

<template>
  <div class="paper">
    <!-- 最上段の細い帯 -->
    <div class="topbar">
      <span>{{ issueDate }}</span>
      <span class="topbar-no">第{{ issueNo }}号</span>
      <span>本日の収録 {{ count }} 篇</span>
    </div>

    <!-- マストヘッド -->
    <header class="masthead">
      <div>
        <div class="brand-tag">
          じぶんの脳みそを覗ける雑誌
        </div>
        <h1 class="brand-title">
          Recollage
        </h1>
        <div class="brand-sub">
          レコラージュ ── 私的編集誌
        </div>
      </div>
      <div class="masthead-right">
        <div class="actions">
          <button
            class="btn"
            @click="onRecompose"
          >
            ⟲ 誌面を組み直す
          </button>
          <button class="btn btn-primary">
            ＋ 記録する
          </button>
        </div>
        <div class="composed">
          本日 {{ composedAt }} 編成 ・ 開くたびに誌面は変わります
        </div>
      </div>
    </header>

    <!-- カテゴリ目次（二重罫） -->
    <div class="toc">
      <div class="toc-inner">
        <nav class="toc-nav">
          <span class="toc-item toc-item--active">すべて</span>
          <span
            v-for="c in navCats"
            :key="c"
            class="toc-item"
          >{{ c }}</span>
        </nav>
      </div>
    </div>

    <!-- 一面（特集 + 縦書き仕切り + 中見出し2本） -->
    <section class="frontpage">
      <article
        v-if="feature"
        class="feature"
      >
        <div class="feature-head">
          <div class="feature-head-left">
            <span class="badge">特集</span>
            <span class="feature-cat">{{ feature.categoryLabel }}</span>
          </div>
          <span class="feature-date">{{ feature.date }}</span>
        </div>
        <h2 class="feature-title">
          {{ feature.title }}
        </h2>
        <template v-if="feature.image">
          <div class="figure">
            <img
              :src="feature.image"
              :alt="feature.title"
            >
          </div>
          <div class="figure-cap">
            <span>{{ feature.caption }}</span>
            <span>書影</span>
          </div>
        </template>
        <p class="feature-body">
          {{ feature.excerpt }}
        </p>
        <div class="readmore">
          <span>つづきを読む ──→</span>
        </div>
      </article>

      <div class="divider">
        過去の自分と、出会い直す。
      </div>

      <div class="sides">
        <article
          v-for="s in sides"
          :key="s.id"
          class="side-article"
        >
          <div class="side-head">
            <span class="side-cat">{{ s.categoryLabel }}</span>
            <span class="side-date">{{ s.date }}</span>
          </div>
          <h3 class="side-title">
            {{ s.title }}
          </h3>
          <p class="side-body">
            {{ s.excerpt }}
          </p>
        </article>
      </div>
    </section>

    <!-- 多段組の誌面 -->
    <section class="columns">
      <article
        v-for="c in rest"
        :key="c.id"
        class="col-article"
      >
        <template v-if="c.image">
          <div class="figure col-figure">
            <img
              :src="c.image"
              :alt="c.title"
            >
          </div>
          <div class="figure-cap">
            <span>{{ c.caption }}</span>
            <span>書影</span>
          </div>
        </template>
        <div class="col-head">
          <span class="col-cat">{{ c.categoryLabel }}</span>
          <span class="col-date">{{ c.date }}</span>
        </div>
        <template v-if="c.density !== 'S'">
          <h3 class="col-title">
            {{ c.title }}
          </h3>
          <p class="col-body">
            {{ c.excerpt }}
          </p>
        </template>
        <div
          v-else
          class="memo"
        >
          <span class="memo-mark">■</span>
          <p class="memo-text">
            {{ c.title }}
          </p>
        </div>
      </article>
    </section>

    <!-- 奥付 -->
    <footer class="colophon">
      <div class="colophon-inner">
        <div class="colophon-end">
          ── 本日の誌面は、ここまで ──
        </div>
        <div class="colophon-note">
          Recollage はあなたの {{ count }} 篇の記録からこの誌面を編みました。組み直すたび、別の出会いがあります。
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.paper {
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 44px;
  min-height: 100vh;
  color: #26211a;
  font-family: 'Shippori Mincho B1', serif;
}

/* 帯 */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 12px 2px 10px;
  border-bottom: 1px solid rgba(38, 33, 26, .4);
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 11px;
  letter-spacing: .16em;
  color: rgba(38, 33, 26, .66);
}
.topbar-no { font-weight: 700; color: rgba(38, 33, 26, .8); }

/* マストヘッド */
.masthead {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 32px;
  padding: 30px 0 24px;
}
.brand-tag {
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .34em;
  color: #25407c;
  margin-bottom: 10px;
}
.brand-title {
  margin: 0;
  font-family: 'Bodoni Moda', serif;
  font-weight: 850;
  font-size: 64px;
  line-height: 1;
  letter-spacing: .005em;
  color: #26211a;
}
.brand-sub {
  margin-top: 12px;
  font-size: 13px;
  letter-spacing: .2em;
  color: rgba(38, 33, 26, .72);
}
.masthead-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  padding-bottom: 4px;
}
.actions { display: flex; gap: 10px; }
.btn {
  font-family: 'Shippori Mincho B1', serif;
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: .14em;
  color: #25407c;
  background: transparent;
  border: 1px solid #25407c;
  border-radius: 0;
  padding: 11px 20px;
  cursor: pointer;
  transition: background .2s ease, color .2s ease;
}
.btn:hover { background: #25407c; color: #f5eedd; }
.btn-primary { color: #f5eedd; background: #25407c; }
.btn-primary:hover { background: #1b2f5e; }
.composed {
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 10.5px;
  letter-spacing: .1em;
  color: rgba(38, 33, 26, .55);
}

/* 目次（二重罫） */
.toc { border-top: 3px solid #26211a; }
.toc-inner { border-top: 1px solid #26211a; margin-top: 2px; }
.toc-nav {
  display: flex;
  gap: 26px;
  align-items: baseline;
  padding: 12px 2px;
  border-bottom: 1px solid rgba(38, 33, 26, .35);
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 12.5px;
  font-weight: 500;
  color: rgba(38, 33, 26, .75);
  overflow-x: auto;
}
.toc-item { cursor: pointer; white-space: nowrap; transition: color .15s; }
.toc-item:hover { color: #25407c; }
.toc-item--active {
  font-weight: 700;
  color: #25407c;
  border-bottom: 2px solid #25407c;
  padding-bottom: 3px;
}

/* 一面 */
.frontpage {
  display: grid;
  grid-template-columns: 1.6fr auto 1fr;
  padding: 36px 0 32px;
  border-bottom: 1px solid rgba(38, 33, 26, .35);
}
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

/* 図版枠（書影） */
.figure {
  border: 1px solid rgba(38, 33, 26, .4);
  background: #ece1c6;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 18px;
}
.figure img { display: block; max-width: 100%; height: auto; max-height: 340px; }
.figure-cap {
  display: flex;
  justify-content: space-between;
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 10.5px;
  letter-spacing: .08em;
  color: rgba(38, 33, 26, .6);
  margin: 8px 0 16px;
}

/* 縦書き仕切り */
.divider {
  writing-mode: vertical-rl;
  border-left: 1px solid rgba(38, 33, 26, .3);
  border-right: 1px solid rgba(38, 33, 26, .3);
  padding: 8px 17px;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: .42em;
  color: rgba(37, 64, 124, .8);
}

/* 中見出し */
.sides { padding-left: 38px; display: flex; flex-direction: column; }
.side-article {
  padding: 4px 0 24px;
  margin-bottom: 24px;
  border-bottom: 1px solid rgba(38, 33, 26, .25);
  cursor: pointer;
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

/* 多段組 */
.columns {
  columns: 282px;
  column-gap: 42px;
  column-rule: 1px solid rgba(38, 33, 26, .28);
  padding: 10px 0 18px;
}
.col-article {
  break-inside: avoid;
  padding: 20px 6px 22px;
  border-bottom: 1px solid rgba(38, 33, 26, .25);
  cursor: pointer;
  transition: background .2s;
}
.col-article:hover { background: rgba(37, 64, 124, .045); }
.col-figure img { max-height: 240px; }
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
.col-title {
  margin: 0 0 9px;
  font-size: 19.5px;
  line-height: 1.65;
  font-weight: 700;
  text-wrap: pretty;
  transition: color .2s;
}
.col-article:hover .col-title { color: #25407c; }
.col-body {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.95;
  color: rgba(38, 33, 26, .78);
  text-wrap: pretty;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
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

/* 奥付 */
.colophon { border-top: 2px solid #26211a; margin-top: 8px; }
.colophon-inner {
  border-top: 1px solid rgba(38, 33, 26, .55);
  margin-top: 2px;
  padding: 30px 0 64px;
  text-align: center;
}
.colophon-end { font-size: 13.5px; letter-spacing: .3em; color: rgba(38, 33, 26, .8); }
.colophon-note {
  margin-top: 14px;
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 11px;
  letter-spacing: .14em;
  color: rgba(38, 33, 26, .55);
}
</style>
