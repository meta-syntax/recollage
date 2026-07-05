<script setup lang="ts">
defineProps<{
  cats: string[]
}>()
</script>

<template>
  <div class="toc">
    <div class="toc-inner">
      <nav class="toc-nav">
        <span class="toc-item toc-item--active">すべて</span>
        <span
          v-for="c in cats"
          :key="c"
          class="toc-item"
        >{{ c }}</span>
        <NuxtLink
          to="/categories"
          class="toc-item toc-manage"
        >章立てを整える ✎</NuxtLink>
      </nav>
    </div>
  </div>
</template>

<style scoped>
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
.toc-manage {
  margin-left: auto;
  color: rgba(38, 33, 26, .5);
  text-decoration: none;
  font-size: 11.5px;
}
</style>
