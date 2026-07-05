<script setup lang="ts">
// ui層（ADR-005）: ドメインを知らないモーダルの器。開閉と閉じる操作だけを担う
const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

watch(() => props.open, (open) => {
  if (open) document.addEventListener('keydown', onKeydown)
  else document.removeEventListener('keydown', onKeydown)
})

onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="backdrop"
        @click.self="$emit('close')"
      >
        <div
          class="panel"
          role="dialog"
          aria-modal="true"
        >
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--scrim);
}
.panel {
  width: min(640px, 100%);
  background: var(--surface);
  border: 1px solid var(--line-strong);
  box-shadow: 6px 6px 0 var(--shadow);
}

.modal-enter-active { transition: opacity .22s ease; }
.modal-enter-active .panel { transition: transform .22s cubic-bezier(.22, .61, .36, 1); }
.modal-leave-active { transition: opacity .15s ease; }
.modal-enter-from { opacity: 0; }
.modal-enter-from .panel { transform: translateY(14px); }
.modal-leave-to { opacity: 0; }
</style>
