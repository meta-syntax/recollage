<script setup lang="ts">
// dev 専用の localStorage → Supabase 一括移行（ADR-013）。
// MockEntryRepository を直接読むと JSON＋localStorage オーバーレイのマージ結果が得られる。
// upsert(onConflict: id) なので再実行しても安全（冪等）。
import type { Category } from '~~/shared/types/category'
import { MockEntryRepository } from '~/repositories/mockEntryRepository'
import { getSupabaseClient } from '~/repositories/supabaseClient'
import { toCategoryRow, toEntryRow } from '~/repositories/supabaseEntryRepository'

const busy = ref(false)
const error = ref<string | null>(null)
const result = ref<{ cats: number, entries: number } | null>(null)
const cleaned = ref<string[] | null>(null)

const CLEAN_KEYS = [
  'recollage:views',
  'recollage:created',
  'recollage:edits',
  'recollage:categories',
]

async function migrate() {
  if (busy.value) return
  busy.value = true
  error.value = null
  cleaned.value = null
  try {
    const mockRepo = new MockEntryRepository()
    const [categories, entries] = await Promise.all([
      mockRepo.listCategories(),
      mockRepo.listEntries(),
    ])

    // categories が先（entries の FK 先）。親が子より先になるよう深さ昇順で並べ替える
    const byId = new Map(categories.map(c => [c.id, c]))
    const depth = (c: Category): number => {
      const parent = c.parentId ? byId.get(c.parentId) : null
      return parent ? depth(parent) + 1 : 0
    }
    const sortedCats = [...categories].sort((a, b) => depth(a) - depth(b))

    const client = getSupabaseClient()
    const catRes = await client.from('categories').upsert(sortedCats.map(toCategoryRow), { onConflict: 'id' })
    if (catRes.error) throw new Error(catRes.error.message)
    const entryRes = await client.from('entries').upsert(entries.map(toEntryRow), { onConflict: 'id' })
    if (entryRes.error) throw new Error(entryRes.error.message)

    result.value = { cats: categories.length, entries: entries.length }
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
  finally {
    busy.value = false
  }
}

function cleanup() {
  const removed = CLEAN_KEYS.filter(k => localStorage.getItem(k) !== null)
  removed.forEach(k => localStorage.removeItem(k))
  cleaned.value = removed
}
</script>

<template>
  <div class="paper">
    <div class="return-bar">
      <NuxtLink
        to="/"
        class="return-link"
      >
        ←── 誌面に戻る
      </NuxtLink>
      <span class="mode">localStorage → Supabase 移行</span>
    </div>

    <div class="body">
      <p class="lead">
        localStorage のオーバーレイ（閲覧記録・作成・編集・カテゴリ）を JSON とマージして Supabase へ upsert します。再実行しても安全です。
      </p>

      <button
        class="action"
        :disabled="busy"
        @click="migrate"
      >
        移行を実行
      </button>

      <p
        v-if="error"
        class="error"
      >
        {{ error }}
      </p>

      <template v-if="result">
        <p class="done">
          カテゴリ {{ result.cats }}件 / エントリ {{ result.entries }}件を移行しました。
        </p>

        <button
          class="action ghost"
          @click="cleanup"
        >
          localStorage を掃除
        </button>

        <p
          v-if="cleaned"
          class="done"
        >
          <template v-if="cleaned.length">
            削除したキー: {{ cleaned.join(' / ') }}
          </template>
          <template v-else>
            削除対象のキーはありませんでした。
          </template>
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.paper {
  max-width: 780px;
  margin: 0 auto;
  padding: 0 44px;
  min-height: 100vh;
  color: var(--text);
  font-family: var(--font-serif);
}
.return-bar {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 18px 2px 14px;
  border-bottom: 1px solid var(--line);
}
.return-link {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .14em;
  color: var(--accent);
  text-decoration: none;
}
.return-link:hover { border-bottom: 1px solid var(--accent); }
.mode {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .3em;
  color: var(--text-soft);
}
.body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 18px;
  padding: 28px 2px;
}
.lead {
  font-size: 14px;
  line-height: 1.9;
  color: var(--text-body);
}
.action {
  font-family: var(--font-serif);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: .14em;
  color: var(--text-inverse);
  background: var(--accent);
  border: 1px solid var(--accent);
  padding: 11px 26px;
  cursor: pointer;
  transition: background .2s ease;
}
.action:hover:not(:disabled) { background: var(--accent-strong); }
.action:disabled { opacity: .45; cursor: default; }
.action.ghost {
  color: var(--accent);
  background: transparent;
}
.action.ghost:hover { background: var(--accent-wash); }
.error {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--danger);
}
.done {
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-body);
}
</style>
