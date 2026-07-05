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
            <button
              v-if="confirmingId !== element.id"
              class="act"
              @click="confirmingId = element.id"
            >削除</button>
            <button
              v-else
              class="act danger"
              @blur="confirmingId = null"
              @click="onRemove(element.id); confirmingId = null"
            >削除する？</button>
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
  border-left: 1px solid rgba(38, 33, 26, .2);
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
.row:hover { border-color: rgba(38, 33, 26, .3); background: rgba(37, 64, 124, .035); }
.grip {
  color: rgba(38, 33, 26, .45);
  font-size: 13px;
}
.name {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: .06em;
}
.count {
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 10.5px;
  color: rgba(38, 33, 26, .55);
}
.rename {
  user-select: text;
  font-family: 'Shippori Mincho B1', serif;
  font-size: 15px;
  font-weight: 600;
  color: #26211a;
  background: transparent;
  border: none;
  border-bottom: 1px solid #25407c;
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
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .08em;
  color: rgba(37, 64, 124, .8);
  background: transparent;
  border: 1px solid rgba(37, 64, 124, .35);
  padding: 3px 9px;
  cursor: pointer;
  transition: color .15s ease, border-color .15s ease;
}
.act:hover { color: #25407c; border-color: #25407c; }
.act.danger {
  color: #8c2f22;
  border-color: #8c2f22;
}

/* SortableJS のドラッグ中プレースホルダ */
:deep(.sortable-ghost) { opacity: .35; }
</style>
