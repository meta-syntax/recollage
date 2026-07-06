<script setup lang="ts">
// 第1層のコードエディタ（ADR-005: ドメインを知らない・プリミティブのみ）。
// CodeMirror 6 一式を遅延ロードし（ADR-003）、ロード完了までは等幅 textarea をフォールバックとして立てる。
// v-model を共有するため、フォールバックと CM で内容は連続する。
import type { EditorView as EditorViewType } from '@codemirror/view'

const model = defineModel<string>({ required: true })
const props = defineProps<{ placeholder?: string }>()

const host = ref<HTMLElement | null>(null)
const ready = ref(false)

// EditorView は CM ロード後にだけ存在。watch / onUnmounted から触れるよう setup スコープに保持する
let view: EditorViewType | null = null

onMounted(async () => {
  // CodeMirror は遅延ロード（ADR-003）。ロード中は下のフォールバック textarea が立つ
  const [{ minimalSetup }, { EditorView, lineNumbers, keymap, placeholder }, { indentWithTab, insertNewlineKeepIndent }, { mermaid }]
    = await Promise.all([
      import('codemirror'),
      import('@codemirror/view'),
      import('@codemirror/commands'),
      import('codemirror-lang-mermaid'),
    ])
  // await 中にアンマウントされていたら中断
  if (!host.value) return

  view = new EditorView({
    parent: host.value,
    doc: model.value,
    extensions: [
      // 独自 keymap を minimalSetup より前に置き、既定の Enter バインドより優先させる
      // （extensions は先頭ほど高優先）。Enter は前行のインデントを継続、Tab はインデント挿入
      keymap.of([
        { key: 'Enter', run: insertNewlineKeepIndent },
        indentWithTab,
      ]),
      minimalSetup,
      lineNumbers(),
      mermaid(),
      ...(props.placeholder ? [placeholder(props.placeholder)] : []),
      // CM 内の編集を v-model へ反映
      EditorView.updateListener.of((u) => {
        if (u.docChanged) model.value = u.state.doc.toString()
      }),
      // 見た目は最小調整のみ（D5・ADR-007: 生 hex / 生 font-family は使わずトークン参照）
      EditorView.theme({
        '&': {
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          color: 'var(--text)',
          backgroundColor: 'var(--surface-dim)',
          border: '1px solid var(--line)',
        },
        '&.cm-focused': { outline: 'none', borderColor: 'var(--accent)' },
        '.cm-scroller': { lineHeight: '1.6', minHeight: '220px' },
        // drawSelection 無効時の保険として native caret もアクセント色に
        '.cm-content': { caretColor: 'var(--accent)' },
        // minimalSetup は drawSelection を含むためキャレットは .cm-cursor のボーダー描画。
        // 誌面のアクセント（藍）に揃える。focused 側のセレクタにも入れ base theme に負けないようにする
        '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--accent)' },
        '&.cm-focused .cm-cursor': { borderLeftColor: 'var(--accent)' },
        // 選択ハイライトは CM 既定の青系（アクセント淡色とも紛らわしい）をやめ、弁柄の淡色に。
        // primitive 直参照は ui/ まで許容（main.css 規約）。drawSelection 使用時は focused 側が効く
        '.cm-selectionBackground': {
          backgroundColor: 'color-mix(in srgb, var(--color-bengara) 18%, transparent)',
        },
        '&.cm-focused .cm-selectionBackground': {
          backgroundColor: 'color-mix(in srgb, var(--color-bengara) 18%, transparent)',
        },
        // フォーカス時は base テーマの深いセレクタ（&light.cm-focused > .cm-scroller >
        // .cm-selectionLayer .cm-selectionBackground = #d7d4f0）に浅い指定が詳細度で負ける。
        // 同形をミラーし（&light→&・同詳細度）、後注入の theme を勝たせる
        '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
          backgroundColor: 'color-mix(in srgb, var(--color-bengara) 18%, transparent)',
        },
        // ドラッグ中の native ::selection は main.css グローバル指定（背景=藍・文字=反転白）を
        // 拾ってしまう。背景は弁柄レイヤに任せ、文字色は元の使用色に保つ。
        // highlight 継承仕様上 inherit は親 ::selection の白を継ぐため具体色を指定。
        // currentColor で構文ハイライト色を保ち、-webkit-text-fill-color も併記して確実にする
        '.cm-content ::selection': {
          'color': 'currentColor',
          '-webkit-text-fill-color': 'currentColor',
          'backgroundColor': 'transparent',
        },
        '.cm-gutters': {
          backgroundColor: 'transparent',
          color: 'var(--text-faint)',
          border: 'none',
        },
      }),
    ],
  })
  ready.value = true
})

// 外部からの model 変更（フォームロード時の流し込みなど）を CM に反映。
// 自分の updateListener 由来の変更と無限ループしないよう、値が同一なら何もしない
watch(model, (val) => {
  if (!view) return
  const current = view.state.doc.toString()
  if ((val ?? '') === current) return
  view.dispatch({ changes: { from: 0, to: current.length, insert: val ?? '' } })
})

onUnmounted(() => view?.destroy())
</script>

<template>
  <div class="code-editor">
    <!-- CM のマウント先。ロード後はここにエディタが立つ -->
    <div
      ref="host"
      class="code-editor-host"
    />
    <!-- CM ロード完了までのフォールバック。内容は v-model 共有で連続する -->
    <textarea
      v-if="!ready"
      v-model="model"
      class="code-editor-fallback"
      rows="10"
      spellcheck="false"
      :placeholder="placeholder"
    />
  </div>
</template>

<style scoped>
.code-editor { display: flex; flex-direction: column; }
/* フォールバック textarea は編集フォームの等幅入力欄と同トーン（.input.input-mono 相当） */
.code-editor-fallback {
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
  color: var(--text);
  background: var(--surface-dim);
  border: 1px solid var(--line);
  padding: 10px 14px;
  outline: none;
  resize: vertical;
  caret-color: var(--accent);
}
.code-editor-fallback:focus { border-color: var(--accent); }
.code-editor-fallback::placeholder { color: var(--text-faint); }
/* CM の選択色（弁柄淡色）とフォールバックの選択色を揃える。
   グローバル ::selection の白文字継承を避けるため文字色を具体色で上書き */
.code-editor-fallback::selection { background: color-mix(in srgb, var(--color-bengara) 18%, transparent); color: var(--text); }
</style>
