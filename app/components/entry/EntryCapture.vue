<script setup lang="ts">
// 書き捨てキャプチャ（ADR-011 面1）＋保存後の「整える」トースト（面2）。
// body だけを書いて綴じる。title/カテゴリ等は聞かない（null 保存 → 断片）
import type { EntryRepository } from '~/repositories/entryRepository'
import { MockEntryRepository } from '~/repositories/mockEntryRepository'

const open = defineModel<boolean>('open', { required: true })

// ADR-001: データソースはこの1点でだけ選ぶ
const repo: EntryRepository = new MockEntryRepository()

const body = ref('')
const saving = ref(false)
// 直近に綴じたエントリのID。トースト表示中だけ値を持つ
const savedId = ref<string | null>(null)

const textareaEl = ref<HTMLTextAreaElement | null>(null)
watch(open, (v) => {
  if (v) nextTick(() => textareaEl.value?.focus())
})

async function save() {
  const text = body.value.trim()
  if (!text || saving.value) return
  saving.value = true
  try {
    const entry = await repo.createEntry({
      title: null,
      body: text,
      keyPoints: [],
      background: null,
      categoryId: null,
      visual: null,
    })
    body.value = ''
    open.value = false
    savedId.value = entry.id
    await refreshNuxtData('feed')
  }
  finally {
    saving.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    save()
  }
}
</script>

<template>
  <UiModal
    :open="open"
    @close="open = false"
  >
    <div class="capture">
      <div class="head">
        断片を綴じる
      </div>
      <textarea
        ref="textareaEl"
        v-model="body"
        class="body"
        rows="7"
        placeholder="いま頭にあることを、そのまま。1行目が見出しの代わりになります"
        @keydown="onKeydown"
      />
      <div class="foot">
        <span class="hint">⌘+Enter で綴じる</span>
        <button
          class="submit"
          :disabled="!body.trim() || saving"
          @click="save"
        >
          綴じる
        </button>
      </div>
    </div>
  </UiModal>

  <UiToast
    v-if="savedId"
    message="断片を綴じました"
    action-label="整える"
    @action="navigateTo(`/entries/${savedId}/edit`)"
    @close="savedId = null"
  />
</template>

<style scoped>
.capture {
  display: flex;
  flex-direction: column;
  padding: 26px 30px 24px;
}
.head {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: .3em;
  color: #25407c;
  margin-bottom: 16px;
}
.body {
  font-family: 'Shippori Mincho B1', serif;
  font-size: 15px;
  line-height: 1.9;
  color: #26211a;
  background: transparent;
  border: 1px solid rgba(38, 33, 26, .4);
  padding: 14px 16px;
  resize: vertical;
  outline: none;
}
.body:focus { border-color: #25407c; }
.body::placeholder { color: rgba(38, 33, 26, .38); }
.foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 14px;
}
.hint {
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 10.5px;
  letter-spacing: .1em;
  color: rgba(38, 33, 26, .55);
}
.submit {
  font-family: 'Shippori Mincho B1', serif;
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: .14em;
  color: #f5eedd;
  background: #25407c;
  border: 1px solid #25407c;
  padding: 10px 26px;
  cursor: pointer;
  transition: background .2s ease;
}
.submit:hover:not(:disabled) { background: #1b2f5e; }
.submit:disabled { opacity: .45; cursor: default; }
</style>
