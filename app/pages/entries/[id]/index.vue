<script setup lang="ts">
const route = useRoute()
const { entry, notFound } = useEntry(String(route.params.id))

// 誌面から来た場合は履歴で戻る（?cat= の章フィルタを保持）。直接ランディング時のみ / へ
const router = useRouter()
function backToFeed() {
  if (router.options.history.state.back) router.back()
  else navigateTo('/')
}
</script>

<template>
  <div class="paper">
    <div class="return-bar">
      <button
        class="return-link"
        @click="backToFeed"
      >
        ←── 誌面に戻る
      </button>
      <NuxtLink
        v-if="entry"
        :to="`/entries/${entry.id}/edit`"
        class="return-link"
      >
        整える ──→
      </NuxtLink>
    </div>

    <EntryArticle
      v-if="entry"
      :entry="entry"
    />

    <div
      v-else-if="notFound"
      class="notfound"
    >
      この記録は見つかりませんでした。
      <NuxtLink
        to="/"
        class="return-link"
      >
        誌面に戻る
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.paper {
  max-width: 980px;
  margin: 0 auto;
  padding: 0 44px;
  min-height: 100vh;
  color: var(--text);
  font-family: var(--font-serif);
}
.return-bar {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 18px 2px 14px;
  border-bottom: 1px solid var(--line);
}
.return-link {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .14em;
  color: var(--accent);
  text-decoration: none;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
}
.return-link:hover { border-bottom: 1px solid var(--accent); }
.notfound {
  padding: 80px 0;
  text-align: center;
  font-size: 14px;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}
</style>
