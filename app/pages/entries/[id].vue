<script setup lang="ts">
const route = useRoute()
const { entry, notFound } = useEntry(String(route.params.id))
</script>

<template>
  <div class="paper">
    <div class="return-bar">
      <NuxtLink
        to="/"
        class="return-link"
      >
        ←── 誌面に戻る
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
  color: #26211a;
  font-family: 'Shippori Mincho B1', serif;
}
.return-bar {
  padding: 18px 2px 14px;
  border-bottom: 1px solid rgba(38, 33, 26, .4);
}
.return-link {
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .14em;
  color: #25407c;
  text-decoration: none;
}
.return-link:hover { border-bottom: 1px solid #25407c; }
.notfound {
  padding: 80px 0;
  text-align: center;
  font-size: 14px;
  color: rgba(38, 33, 26, .7);
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}
</style>
