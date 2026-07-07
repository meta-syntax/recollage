<script setup lang="ts">
const { loading, count, issueNo, issueDate, composedAt, navCats, selectedCat, selectCat, feature, sides, rest, compositionKey, recompose } = useFeed()

const captureOpen = ref(false)

const taglines = [
  '過去の自分と、出会い直す。',
  '忘れた頃に、届く一篇。',
  '記憶は沈む。だから、掬う。',
  '書いたままで、終わらせない。',
]
// compositionKey は `${seed}:${selectedCat}` の文字列。号ごとに文言を変えるため
// 文字列を数値へ畳んで（簡易ハッシュ）配列インデックスにする
const tagline = computed(() => {
  const hash = [...compositionKey.value].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 0)
  return taglines[Math.abs(hash) % taglines.length]
})
</script>

<template>
  <div class="paper">
    <FeedTopbar
      :issue-date="issueDate"
      :issue-no="issueNo"
      :count="count"
    />
    <FeedMasthead
      :composed-at="composedAt"
      @recompose="recompose"
      @record="captureOpen = true"
    />
    <EntryCapture v-model:open="captureOpen" />
    <FeedToc
      :cats="navCats"
      :active="selectedCat"
      @select="selectCat"
    />

    <!-- 初回コールドロードのみ（再訪は SWR キャッシュで即表示） -->
    <div
      v-if="loading"
      class="composing"
    >
      <UiLoadingDots />
    </div>

    <!-- 誌面本体。組み直しごとに版が下からフェードインして差し替わる -->
    <Transition
      v-else
      name="sheet"
      mode="out-in"
      appear
    >
      <div :key="compositionKey">
        <!-- 一面（特集 + 縦書き仕切り + 中見出し2本） -->
        <section class="frontpage">
          <FeedCardLarge
            v-if="feature"
            :card="feature"
          />

          <div class="divider">
            {{ tagline }}
          </div>

          <div class="sides">
            <FeedCardMedium
              v-for="s in sides"
              :key="s.id"
              :card="s"
            />
          </div>
        </section>

        <!-- 多段組の誌面 -->
        <section class="columns">
          <template
            v-for="c in rest"
            :key="c.id"
          >
            <FeedCardSmall
              v-if="c.density === 'S'"
              :card="c"
            />
            <FeedCardColumn
              v-else
              :card="c"
            />
          </template>
        </section>
      </div>
    </Transition>

    <FeedColophon
      v-if="!loading"
      :count="count"
    />
  </div>
</template>

<style scoped>
.paper {
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 44px;
  min-height: 100vh;
  color: var(--text);
  font-family: var(--font-serif);
}

/* 初回ロード中の表示（ドットの色は color を継承） */
.composing {
  padding: 140px 0;
  text-align: center;
  color: var(--text-soft);
}

/* 一面 */
.frontpage {
  display: grid;
  grid-template-columns: 1.6fr auto 1fr;
  padding: 36px 0 32px;
  border-bottom: 1px solid var(--line);
}

/* 縦書き仕切り */
.divider {
  writing-mode: vertical-rl;
  border-left: 1px solid var(--line-soft);
  border-right: 1px solid var(--line-soft);
  padding: 8px 17px;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: .42em;
  color: var(--accent-muted);
}

/* 中見出し */
.sides { padding-left: 38px; display: flex; flex-direction: column; }

/* 多段組 */
.columns {
  columns: 282px;
  column-gap: 42px;
  column-rule: 1px solid var(--line-soft);
  padding: 10px 0 18px;
}

/* 誌面差し替え: 旧版はその場でフェードアウト → 新版が下からフェードイン */
.sheet-enter-active {
  transition: opacity .5s cubic-bezier(.22, .61, .36, 1), transform .5s cubic-bezier(.22, .61, .36, 1);
}
.sheet-leave-active {
  transition: opacity .18s ease;
}
.sheet-enter-from {
  opacity: 0;
  transform: translateY(28px);
}
.sheet-leave-to {
  opacity: 0;
}
</style>
