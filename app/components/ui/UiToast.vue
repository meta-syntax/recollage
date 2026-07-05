<script setup lang="ts">
// ui層（ADR-005）: ドメインを知らないトースト。一定時間で自ら close を通知する
const props = withDefaults(defineProps<{
  message: string
  actionLabel?: string
  durationMs?: number
}>(), {
  actionLabel: undefined,
  durationMs: 6000,
})

const emit = defineEmits<{
  action: []
  close: []
}>()

let timer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  timer = setTimeout(() => emit('close'), props.durationMs)
})

onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <Teleport to="body">
    <div class="toast">
      <span class="message">{{ message }}</span>
      <button
        v-if="actionLabel"
        class="action"
        @click="$emit('action')"
      >
        {{ actionLabel }}
      </button>
      <button
        class="dismiss"
        aria-label="閉じる"
        @click="$emit('close')"
      >
        ×
      </button>
    </div>
  </Teleport>
</template>

<style scoped>
.toast {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 18px;
  background: var(--surface-inverse);
  color: var(--text-inverse);
  font-family: var(--font-serif);
  font-size: 13.5px;
  letter-spacing: .08em;
  box-shadow: 4px 4px 0 var(--shadow);
}
.action {
  color: var(--text-inverse);
  background: transparent;
  border: 1px solid var(--line-inverse);
  padding: 5px 14px;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: .14em;
  cursor: pointer;
  transition: background .2s ease, color .2s ease;
}
.action:hover { background: var(--surface); color: var(--text); }
.dismiss {
  color: var(--text-inverse-muted);
  background: transparent;
  border: none;
  font-size: 15px;
  cursor: pointer;
  padding: 0 2px;
}
.dismiss:hover { color: var(--text-inverse); }
</style>
