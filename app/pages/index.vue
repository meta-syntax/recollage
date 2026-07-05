<script setup lang="ts">
const { count, issueNo, issueDate, composedAt, navCats, feature, sides, rest, compositionKey, recompose } = useFeed()
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
    />
    <FeedToc :cats="navCats" />

    <!-- 誌面本体。組み直しごとに版が下からフェードインして差し替わる -->
    <Transition
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
            過去の自分と、出会い直す。
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

    <FeedColophon :count="count" />
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

/* 一面 */
.frontpage {
  display: grid;
  grid-template-columns: 1.6fr auto 1fr;
  padding: 36px 0 32px;
  border-bottom: 1px solid rgba(38, 33, 26, .35);
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

/* 多段組 */
.columns {
  columns: 282px;
  column-gap: 42px;
  column-rule: 1px solid rgba(38, 33, 26, .28);
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
