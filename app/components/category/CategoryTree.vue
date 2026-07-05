<script setup lang="ts">
// カテゴリツリーの再帰ノード（ADR-011 面4）。D&D は vuedraggable（SortableJS）の
// ネストリスト構成。空の子リストにも drop できるよう emptyInsertThreshold を持つ
import draggable from 'vuedraggable'
import type { CatNode } from '~/composables/useCategoryAdmin'

const props = defineProps<{
  nodes: CatNode[]
  parentId: string | null
  onMove: (id: string, parentId: string | null, index: number) => void
  onAddChild: (parentId: string | null) => void
  onRename: (id: string, name: string) => void
  onRemove: (id: string) => void
}>()

const editingId = ref<string | null>(null)
const editName = ref('')
const confirmingId = ref<string | null>(null)

// vuedraggable の change: 移動先リスト側に added（親またぎ）か moved（同一親内）が届く
interface DragChange {
  added?: { element: CatNode, newIndex: number }
  moved?: { element: CatNode, newIndex: number }
}

function onChange(evt: DragChange) {
  const e = evt.added ?? evt.moved
  if (e) props.onMove(e.element.id, props.parentId, e.newIndex)
}

function startRename(node: CatNode) {
  editingId.value = node.id
  editName.value = node.name
}

function commitRename() {
  if (editingId.value && editName.value.trim()) {
    props.onRename(editingId.value, editName.value.trim())
  }
  editingId.value = null
}
</script>

<template>
  <!-- 行全体がドラッグ対象。操作系（ボタン・改名入力）からのドラッグ開始だけ除外する -->
  <draggable
    :list="nodes"
    group="categories"
    item-key="id"
    filter=".act, .rename"
    :prevent-on-filter="false"
    :empty-insert-threshold="16"
    :animation="150"
    class="tree"
    @change="onChange"
  >
    <template #item="{ element }">
      <div class="node">
        <div class="row">
          <span class="grip">⠿</span>
          <input
            v-if="editingId === element.id"
            v-model="editName"
            class="rename"
            @keydown.enter="commitRename"
            @keydown.esc="editingId = null"
            @blur="commitRename"
          >
          <template v-else>
            <span
              class="name"
              @dblclick="startRename(element)"
            >{{ element.name }}</span>
            <span
              v-if="element.entryCount"
              class="count"
            >{{ element.entryCount }}篇</span>
          </template>
          <span class="actions">
            <button
              class="act"
              title="子の章を増やす"
              @click="onAddChild(element.id)"
            >＋子</button>
            <button
              class="act"
              @click="startRename(element)"
            >改名</button>
            <template v-if="confirmingId === element.id">
              <!-- 退避が起きる削除は結果を言い切る（ADR-011 面4: エントリは書きつけへ退避） -->
              <button
                class="act danger"
                @click="onRemove(element.id); confirmingId = null"
              >{{ element.entryCount ? `${element.entryCount}篇を書きつけに戻して削除する` : '削除する' }}</button>
              <button
                class="act"
                @click="confirmingId = null"
              >やめる</button>
            </template>
            <button
              v-else
              class="act"
              @click="confirmingId = element.id"
            >削除</button>
          </span>
        </div>
        <CategoryTree
          class="children"
          :nodes="element.children"
          :parent-id="element.id"
          :on-move="onMove"
          :on-add-child="onAddChild"
          :on-rename="onRename"
          :on-remove="onRemove"
        />
      </div>
    </template>
  </draggable>
</template>

<style scoped>
.tree { min-height: 4px; }
.children {
  margin-left: 26px;
  border-left: 1px solid var(--line-soft);
  padding-left: 10px;
}
.node { padding: 2px 0; }
.row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid transparent;
  background: transparent;
  cursor: grab;
  user-select: none;
}
.row:hover { border-color: var(--line-soft); background: var(--accent-wash); }
.grip {
  color: var(--text-faint);
  font-size: 13px;
}
.name {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: .06em;
}
.count {
  font-family: var(--font-sans);
  font-size: 10.5px;
  color: var(--text-soft);
}
.rename {
  user-select: text;
  font-family: var(--font-serif);
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--accent);
  outline: none;
  padding: 0 2px;
}
.actions {
  margin-left: auto;
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity .15s ease;
}
.row:hover .actions { opacity: 1; }
.act {
  font-family: var(--font-sans);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .08em;
  color: var(--accent-muted);
  background: transparent;
  border: 1px solid var(--accent-line);
  padding: 3px 9px;
  cursor: pointer;
  transition: color .15s ease, border-color .15s ease;
}
.act:hover { color: var(--accent); border-color: var(--accent); }
.act.danger {
  color: var(--danger);
  border-color: var(--danger);
}

/* SortableJS のドラッグ中プレースホルダ */
:deep(.sortable-ghost) { opacity: .35; }
</style>
