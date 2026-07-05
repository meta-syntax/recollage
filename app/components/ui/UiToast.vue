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
  background: #26211a;
  color: #f5eedd;
  font-family: 'Shippori Mincho B1', serif;
  font-size: 13.5px;
  letter-spacing: .08em;
  box-shadow: 4px 4px 0 rgba(38, 33, 26, .3);
}
.action {
  color: #f5eedd;
  background: transparent;
  border: 1px solid rgba(245, 238, 221, .6);
  padding: 5px 14px;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: .14em;
  cursor: pointer;
  transition: background .2s ease, color .2s ease;
}
.action:hover { background: #f5eedd; color: #26211a; }
.dismiss {
  color: rgba(245, 238, 221, .6);
  background: transparent;
  border: none;
  font-size: 15px;
  cursor: pointer;
  padding: 0 2px;
}
.dismiss:hover { color: #f5eedd; }
</style>
