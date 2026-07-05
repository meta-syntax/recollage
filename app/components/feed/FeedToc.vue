<script setup lang="ts">
defineProps<{
  cats: { id: string, label: string }[]
  /** 選択中のカテゴリID（null = すべて） */
  active: string | null
}>()

defineEmits<{
  select: [id: string | null]
}>()
</script>

<template>
  <div class="toc">
    <div class="toc-inner">
      <nav class="toc-nav">
        <button
          class="toc-item"
          :class="{ 'toc-item--active': active === null }"
          @click="$emit('select', null)"
        >
          すべて
        </button>
        <button
          v-for="c in cats"
          :key="c.id"
          class="toc-item"
          :class="{ 'toc-item--active': active === c.id }"
          @click="$emit('select', c.id)"
        >
          {{ c.label }}
        </button>
        <NuxtLink
          to="/categories"
          class="toc-item toc-manage"
        >章立てを整える ✎</NuxtLink>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.toc { border-top: 3px solid var(--line-strong); }
.toc-inner { border-top: 1px solid var(--line-strong); margin-top: 2px; }
.toc-nav {
  display: flex;
  gap: 26px;
  align-items: baseline;
  padding: 12px 2px;
  border-bottom: 1px solid var(--line);
  font-family: var(--font-sans);
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-muted);
  overflow-x: auto;
}
.toc-item {
  cursor: pointer;
  white-space: nowrap;
  transition: color .15s;
  background: transparent;
  border: none;
  padding: 0;
  font: inherit;
  color: inherit;
}
.toc-item:hover { color: var(--accent); }
.toc-item--active {
  font-weight: 700;
  color: var(--accent);
  border-bottom: 2px solid var(--accent);
  padding-bottom: 3px;
}
.toc-manage {
  margin-left: auto;
  color: var(--text-soft);
  text-decoration: none;
  font-size: 11.5px;
}
</style>
