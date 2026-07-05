<script setup lang="ts">
defineProps<{
  count: number
}>()
</script>

<template>
  <footer class="colophon">
    <div class="colophon-inner">
      <div class="colophon-end">
        ── 本日の誌面は、ここまで ──
      </div>
      <div class="colophon-note">
        Recollage はあなたの {{ count }} 篇の記録からこの誌面を編みました。組み直すたび、誌面は別の表情を見せます。
      </div>
    </div>
  </footer>
</template>

<style scoped>
.colophon { border-top: 2px solid var(--line-strong); margin-top: 8px; }
.colophon-inner {
  border-top: 1px solid var(--line);
  margin-top: 2px;
  padding: 30px 0 64px;
  text-align: center;
}
.colophon-end { font-size: 13.5px; letter-spacing: .3em; color: var(--text-muted); }
.colophon-note {
  margin-top: 14px;
  font-family: var(--font-sans);
  font-size: 11px;
  letter-spacing: .14em;
  color: var(--text-soft);
}
</style>
