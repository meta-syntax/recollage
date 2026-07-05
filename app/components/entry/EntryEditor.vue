<script setup lang="ts">
// 整えの一枚フォーム（ADR-011 面3）。入口3つ（トースト／書きつけカードの徴／詳細ページ）の共通着地点
import type { EntryDraft, EntryRepository } from '~/repositories/entryRepository'
import { MockEntryRepository } from '~/repositories/mockEntryRepository'

const props = defineProps<{
  id: string
}>()

// ADR-001: データソースはこの1点でだけ選ぶ
const repo: EntryRepository = new MockEntryRepository()

const { data, status } = useAsyncData(`entry-edit:${props.id}`, async () => {
  const [entry, categories] = await Promise.all([
    repo.getEntry(props.id),
    repo.listCategories(),
  ])
  return { entry, categories }
})

const title = ref('')
const body = ref('')
const keyPointsText = ref('')
const background = ref('')
const categoryId = ref<string | null>(null)
const visualType = ref<'none' | 'image' | 'mermaid'>('none')
const visualContent = ref('')

// フォームへの流し込みはロード完了時の一度だけ（編集中の再フェッチで上書きしない）
const loaded = ref(false)
watch(data, (d) => {
  if (!d?.entry || loaded.value) return
  loaded.value = true
  const e = d.entry
  title.value = e.title ?? ''
  body.value = e.body
  keyPointsText.value = e.keyPoints.join('\n')
  background.value = e.background ?? ''
  categoryId.value = e.categoryId
  visualType.value = e.visual?.type ?? 'none'
  visualContent.value = e.visual?.content ?? ''
}, { immediate: true })

// カテゴリ選択肢: 定義順（sortOrder）の階層順、子はインデント。ツリーの管理は /categories（面4）
const categoryOptions = computed(() => {
  const cats = data.value?.categories ?? []
  const out: { id: string, label: string }[] = []
  const walk = (parentId: string | null, depth: number) => {
    cats
      .filter(c => c.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .forEach((c) => {
        out.push({ id: c.id, label: `${'　'.repeat(depth)}${c.name}` })
        walk(c.id, depth + 1)
      })
  }
  walk(null, 0)
  return out
})

const notFound = computed(() => status.value === 'success' && !data.value?.entry)
const saving = ref(false)

async function save() {
  if (saving.value || !body.value.trim()) return
  saving.value = true
  try {
    const draft: EntryDraft = {
      title: title.value.trim() || null,
      body: body.value,
      keyPoints: keyPointsText.value.split('\n').map(s => s.trim()).filter(Boolean),
      background: background.value.trim() || null,
      categoryId: categoryId.value,
      visual: visualType.value === 'none' || !visualContent.value.trim()
        ? null
        : { type: visualType.value, content: visualContent.value.trim() },
    }
    await repo.updateEntry(props.id, draft)
    await Promise.all([
      refreshNuxtData('feed'),
      refreshNuxtData(`entry:${props.id}`),
      refreshNuxtData(`entry-edit:${props.id}`),
    ])
    navigateTo(`/entries/${props.id}`)
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div
    v-if="notFound"
    class="notfound"
  >
    この記録は見つかりませんでした。
  </div>

  <form
    v-else-if="loaded"
    class="editor"
    @submit.prevent="save"
  >
    <label class="field">
      <span class="label">見出し</span>
      <input
        v-model="title"
        type="text"
        class="input"
        placeholder="本文の書き出しがタイトルの代わりになります"
      >
    </label>

    <label class="field">
      <span class="label">本文</span>
      <textarea
        v-model="body"
        class="input"
        rows="12"
      />
    </label>

    <label class="field">
      <span class="label">要点</span>
      <textarea
        v-model="keyPointsText"
        class="input"
        rows="4"
        placeholder="1行にひとつ"
      />
    </label>

    <label class="field">
      <span class="label">背景・文脈</span>
      <textarea
        v-model="background"
        class="input"
        rows="3"
      />
    </label>

    <label class="field">
      <span class="label">カテゴリ</span>
      <select
        v-model="categoryId"
        class="input"
      >
        <option :value="null">書きつけのまま</option>
        <option
          v-for="opt in categoryOptions"
          :key="opt.id"
          :value="opt.id"
        >{{ opt.label }}</option>
      </select>
    </label>

    <div class="field">
      <span class="label">図版</span>
      <div class="visual-row">
        <select
          v-model="visualType"
          class="input visual-type"
        >
          <option value="none">
            なし
          </option>
          <option value="image">
            画像
          </option>
          <option value="mermaid">
            Mermaid
          </option>
        </select>
        <input
          v-if="visualType === 'image'"
          v-model="visualContent"
          type="text"
          class="input visual-content"
          placeholder="画像の URL"
        >
      </div>
      <textarea
        v-if="visualType === 'mermaid'"
        v-model="visualContent"
        class="input"
        rows="6"
        placeholder="Mermaid コード"
      />
    </div>

    <div class="foot">
      <button
        type="submit"
        class="submit"
        :disabled="!body.trim() || saving"
      >
        整える
      </button>
    </div>
  </form>
</template>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 34px 0 60px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.label {
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .22em;
  color: #25407c;
}
.input {
  font-family: 'Shippori Mincho B1', serif;
  font-size: 15px;
  line-height: 1.9;
  color: #26211a;
  background: transparent;
  border: 1px solid rgba(38, 33, 26, .4);
  padding: 10px 14px;
  outline: none;
  resize: vertical;
}
.input:focus { border-color: #25407c; }
.input::placeholder { color: rgba(38, 33, 26, .38); }
select.input { cursor: pointer; }
.visual-row { display: flex; gap: 10px; }
.visual-type { width: 160px; }
.visual-content { flex: 1; }
.foot {
  display: flex;
  justify-content: flex-end;
  padding-top: 6px;
  border-top: 1px solid rgba(38, 33, 26, .25);
}
.submit {
  font-family: 'Shippori Mincho B1', serif;
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: .14em;
  color: #f5eedd;
  background: #25407c;
  border: 1px solid #25407c;
  padding: 11px 30px;
  margin-top: 16px;
  cursor: pointer;
  transition: background .2s ease;
}
.submit:hover:not(:disabled) { background: #1b2f5e; }
.submit:disabled { opacity: .45; cursor: default; }
.notfound {
  padding: 80px 0;
  text-align: center;
  font-size: 14px;
  color: rgba(38, 33, 26, .7);
}
</style>
