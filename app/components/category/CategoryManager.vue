<script setup lang="ts">
// カテゴリ管理面（ADR-011 面4）: ツリー＋追加・改名・削除・D&D 移動
const { tree, error, move, addChild, rename, remove } = useCategoryAdmin()
</script>

<template>
  <div class="manager">
    <p
      v-if="error"
      class="error"
    >
      {{ error }}
    </p>

    <CategoryTree
      :nodes="tree"
      :parent-id="null"
      :on-move="move"
      :on-add-child="addChild"
      :on-rename="rename"
      :on-remove="remove"
    />

    <button
      class="add-root"
      @click="addChild(null)"
    >
      ＋ 章を増やす
    </button>

    <p class="note">
      ⠿ を掴んでドラッグすると並べ替え・別の章の中への移動ができます。名前はダブルクリックでも改名できます。
      エントリの付いた章を削除すると、エントリは「断片」へ戻ります。
    </p>
  </div>
</template>

<style scoped>
.manager {
  padding: 30px 0 60px;
}
.error {
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 12px;
  color: #8c2f22;
  border: 1px solid rgba(140, 47, 34, .4);
  padding: 10px 14px;
  margin: 0 0 18px;
}
.add-root {
  font-family: 'Shippori Mincho B1', serif;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: .14em;
  color: #25407c;
  background: transparent;
  border: 1px dashed rgba(37, 64, 124, .5);
  padding: 10px 22px;
  margin-top: 16px;
  cursor: pointer;
  transition: border-color .2s ease;
}
.add-root:hover { border-color: #25407c; }
.note {
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 11px;
  line-height: 1.9;
  letter-spacing: .06em;
  color: rgba(38, 33, 26, .55);
  margin-top: 26px;
}
</style>
