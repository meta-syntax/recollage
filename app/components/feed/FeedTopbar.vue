<script setup lang="ts">
defineProps<{
  issueDate: string
  issueNo: number
  count: number
}>()
</script>

<template>
  <div class="topbar">
    <span>{{ issueDate }}</span>
    <span class="topbar-no">第{{ issueNo }}号</span>
    <span>本日の掲載 {{ count }} 篇</span>
  </div>
</template>

<style scoped>
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
</style>
