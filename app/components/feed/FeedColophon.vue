<script setup lang="ts">
defineProps<{
  count: number
}>()

const indexOpen = useIndexOpen()
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
      <button
        class="colophon-index"
        type="button"
        @click="indexOpen = true"
      >
        索引を繰る <span class="colophon-kbd">⌘K</span>
      </button>
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
.colophon-index {
  margin-top: 20px;
  padding: 5px 14px;
  border: 1px solid var(--line);
  background: transparent;
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: 11px;
  letter-spacing: .22em;
  color: var(--text-muted);
}
.colophon-index:hover {
  border-color: var(--line-strong);
  color: var(--text);
}
.colophon-kbd {
  letter-spacing: .06em;
  color: var(--text-soft);
}
</style>
