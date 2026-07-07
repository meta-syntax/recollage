<script setup lang="ts">
// 索引（ADR-016）: 誌面に検索窓を常設せず、奥付の導線と ⌘K からモーダルで開く。
// 検索の実行経路はリポジトリのみ（ADR-001: データソースを知らない）
import type { SearchHit } from '~/repositories/entryRepository'

const open = useIndexOpen()
const repo = useEntryRepository()

const inputEl = ref<HTMLInputElement | null>(null)
const query = ref('')
const hits = ref<SearchHit[]>([])
const searching = ref(false)
const searched = ref(false)

let timer: ReturnType<typeof setTimeout> | undefined
let seq = 0

// 毎打鍵で embedding 推論を走らせない（350ms デバウンス）。古い応答は seq で捨てる
watch(query, (q) => {
  clearTimeout(timer)
  const trimmed = q.trim()
  if (!trimmed) {
    seq++
    hits.value = []
    searched.value = false
    searching.value = false
    return
  }
  searching.value = true
  timer = setTimeout(async () => {
    const mySeq = ++seq
    try {
      const result = await repo.searchEntries(trimmed)
      if (mySeq !== seq) return
      hits.value = result
      searched.value = true
    }
    finally {
      if (mySeq === seq) searching.value = false
    }
  }, 350)
})

// ⌘K / Ctrl+K でどこからでも開閉する
function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    open.value = !open.value
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

// 開くたびに前回の検索を引き継がない
watch(open, (o) => {
  if (!o) return
  query.value = ''
  hits.value = []
  searched.value = false
  nextTick(() => inputEl.value?.focus())
})

function go(id: string) {
  open.value = false
  navigateTo(`/entries/${id}`)
}

function snippetOf(h: SearchHit): string {
  return h.body.replace(/\s+/g, ' ').trim().slice(0, 72)
}
</script>

<template>
  <UiModal
    :open="open"
    @close="open = false"
  >
    <div class="index">
      <div class="index-head">
        <span class="index-title">索引</span>
        <span class="index-hint">語句からでも、話題からでも</span>
      </div>
      <input
        ref="inputEl"
        v-model="query"
        class="index-input"
        type="text"
        placeholder="あの話、どこに書いたか"
      >
      <div
        v-if="searching"
        class="index-status"
      >
        索引を繰っています……
      </div>
      <ul
        v-else-if="hits.length"
        class="index-hits"
      >
        <li
          v-for="h in hits"
          :key="h.id"
        >
          <button
            class="hit"
            type="button"
            @click="go(h.id)"
          >
            <span class="hit-title">{{ displayTitle(h.title, h.body) }}</span>
            <span class="hit-snippet">{{ snippetOf(h) }}</span>
            <span
              v-if="h.similarity !== null"
              class="hit-sim"
            >近さ {{ h.similarity.toFixed(2) }}</span>
          </button>
        </li>
      </ul>
      <div
        v-else-if="searched"
        class="index-status"
      >
        見当たりませんでした
      </div>
    </div>
  </UiModal>
</template>

<style scoped>
.index {
  padding: 26px 30px 30px;
  font-family: var(--font-serif);
}
.index-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}
.index-title {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: .5em;
}
.index-hint {
  font-family: var(--font-sans);
  font-size: 10.5px;
  letter-spacing: .14em;
  color: var(--text-soft);
}
.index-input {
  width: 100%;
  margin-top: 16px;
  padding: 9px 2px;
  border: 0;
  border-bottom: 1px solid var(--line-strong);
  background: transparent;
  font-family: var(--font-serif);
  font-size: 15px;
  color: var(--text);
}
.index-input:focus {
  outline: none;
  border-bottom-color: var(--accent-muted);
}
.index-input::placeholder { color: var(--text-soft); }
.index-status {
  padding: 22px 2px 4px;
  font-size: 12.5px;
  letter-spacing: .18em;
  color: var(--text-muted);
  text-align: center;
}
.index-hits {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  max-height: 46vh;
  overflow-y: auto;
}
.hit {
  display: block;
  width: 100%;
  padding: 12px 2px;
  border: 0;
  border-bottom: 1px solid var(--line-soft);
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-family: var(--font-serif);
  color: var(--text);
}
.hit:hover .hit-title { color: var(--accent-muted); }
.hit-title {
  display: block;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
}
.hit-snippet {
  display: block;
  margin-top: 3px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-muted);
}
.hit-sim {
  display: block;
  margin-top: 4px;
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: .16em;
  color: var(--text-soft);
}
</style>
