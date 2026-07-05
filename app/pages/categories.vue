<script setup lang="ts">
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
      <span class="mode">章立てを整える</span>
    </div>

    <CategoryManager />
  </div>
</template>

<style scoped>
.paper {
  max-width: 780px;
  margin: 0 auto;
  padding: 0 44px;
  min-height: 100vh;
  color: #26211a;
  font-family: 'Shippori Mincho B1', serif;
}
.return-bar {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
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
.mode {
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .3em;
  color: rgba(38, 33, 26, .55);
}
</style>
