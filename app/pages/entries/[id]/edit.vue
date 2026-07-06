<script setup lang="ts">
const route = useRoute()
const id = String(route.params.id)

// 詳細から来た場合は履歴で戻る。push で詳細を積み直すと、
// 詳細側の「誌面に戻る」（履歴 back）が編集画面に着地してしまう
const router = useRouter()
function backToArticle() {
  if (router.options.history.state.back === `/entries/${id}`) router.back()
  else navigateTo(`/entries/${id}`, { replace: true })
}
</script>

<template>
  <div class="paper">
    <div class="return-bar">
      <button
        class="return-link"
        @click="backToArticle"
      >
        ←── 記事に戻る
      </button>
      <span class="mode">整える</span>
    </div>

    <EntryEditor :id="id" />
  </div>
</template>

<style scoped>
.paper {
  max-width: 780px;
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
.mode {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .3em;
  color: var(--text-soft);
}
</style>
