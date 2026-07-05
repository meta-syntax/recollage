<script setup lang="ts">
const route = useRoute()
const id = String(route.params.id)
</script>

<template>
  <div class="paper">
    <div class="return-bar">
      <NuxtLink
        :to="`/entries/${id}`"
        class="return-link"
      >
        ←── 記事に戻る
      </NuxtLink>
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
