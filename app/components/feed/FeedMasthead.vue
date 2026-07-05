<script setup lang="ts">
defineProps<{
  composedAt: string
}>()

defineEmits<{
  recompose: []
  record: []
}>()
</script>

<template>
  <header class="masthead">
    <div>
      <div class="brand-tag">
        じぶんの頭のなかを覗ける雑誌
      </div>
      <h1 class="brand-title">
        Recollage
      </h1>
      <div class="brand-sub">
        レコラージュ ── 私的編集誌
      </div>
    </div>
    <div class="masthead-right">
      <div class="actions">
        <button
          class="btn"
          @click="$emit('recompose')"
        >
          ⟲ 誌面を組み直す
        </button>
        <button
          class="btn btn-primary"
          @click="$emit('record')"
        >
          ＋ 記録する
        </button>
      </div>
      <div class="composed">
        本日 {{ composedAt }} 編成 ・ 開くたびに誌面は変わります
      </div>
    </div>
  </header>
</template>

<style scoped>
.masthead {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 32px;
  padding: 30px 0 24px;
}
.brand-tag {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .34em;
  color: var(--accent);
  margin-bottom: 10px;
}
.brand-title {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 850;
  font-size: 64px;
  line-height: 1;
  letter-spacing: .005em;
  color: var(--text);
}
.brand-sub {
  margin-top: 12px;
  font-size: 13px;
  letter-spacing: .2em;
  color: var(--text-muted);
}
.masthead-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  padding-bottom: 4px;
}
.actions { display: flex; gap: 10px; }
.btn {
  font-family: var(--font-serif);
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: .14em;
  color: var(--accent);
  background: transparent;
  border: 1px solid var(--accent);
  border-radius: 0;
  padding: 11px 20px;
  cursor: pointer;
  transition: background .2s ease, color .2s ease;
}
.btn:hover { background: var(--accent); color: var(--text-inverse); }
.btn-primary { color: var(--text-inverse); background: var(--accent); }
.btn-primary:hover { background: var(--accent-strong); }
.composed {
  font-family: var(--font-sans);
  font-size: 10.5px;
  letter-spacing: .1em;
  color: var(--text-soft);
}
</style>
