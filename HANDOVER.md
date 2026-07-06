# Recollage HANDOVER

最終更新: 2026-07-06（昼）

## 現状サマリ

**2026-07-06: mock-debt #5（Mermaid）返済完了**。誌面・詳細での描画／編集フォームのライブプレビュー／CodeMirror 6 でのコード入力エディタ化、あわせて編集→詳細の履歴遷移バグ（「誌面に戻る」が edit に着地）を修正。聡太の目視検収まで完了。技術判断は ADR-012 に記録。**本日分はすべて未コミット**。

フェーズ3・3.5 ＋ ADR-011（CMS入力・編集体験）は 7/5 までに完了済み。git はローカル main が大きく先行、**リモートは init のみ・push＝公開の判断は聡太待ちのまま**。

- 不具合修正: 詳細→誌面で recompose が走る問題を解消（seed をページ寿命の ref → `app/stores/feed.ts` の `useState` へ。store の配置基準は参照アーキ ADR-004 に従い「ページを跨いで生きるべき状態のみ」）
- CMS（ADR-011 面1〜4）: すべてモック先行実装。書き込みは localStorage オーバーレイ（`recollage:created` / `recollage:edits` / `recollage:categories`。mock-debt #9・#10）
  - 面1: ＋記録する → モーダル、body のみ、Cmd+Enter
  - 面2: 保存後「整える」トースト＋書きつけカード（S）に「未整理 — 整える」の徴
  - 面3: `/entries/[id]/edit` 一枚フォーム。入口3つ（トースト／徴／詳細ページ）同一着地
  - 面4: `/categories` ツリー管理。行全体D&D（vuedraggable@next）・追加・改名（ダブルクリック可）・削除は子持ち拒否＋「N篇を書きつけに戻して削除する」の明示確認
- 目次: カテゴリ選択で章フィルタ（サブツリー込み）。状態は `?cat=` クエリ同期（参照アーキ ADR-004）。詳細の「誌面に戻る」は履歴 back でフィルタ保持
- デザイントークン: ADR-007 ステップ3・4完了。primitive 6原色＋3書体＋mono（`@theme`）、semantic 19トークン（`:root`）。コンポーネント内の生 hex は残存ゼロ（タイプスケール・スペーシングは未着手）
- **docs/ は聡太のコミットで git 管理外になった**（.gitignore 追加・ローカルには残存）。以降ドキュメント変更はコミットしない

## 次のアクション

1. **検証仮説の判定**（1〜2週間、日常使用）— フェーズ4 GO/NO-GO の入力。初期誌面は乱択（コールドアーカイブ、open-questions「検証中に確認」）と認識した上で、Resurface は閲覧履歴が溜まってから評価。キャプチャ＋mermaid が入ったので新規記録 → Recency の実地観測も可能
2. 残タスク（洗い出し済み・優先順は聡太判断）: 号情報の意味付け（#8）／AI機能（検索・RAG・関連表示 = w_related 有効化。roadmap 未登録）／フェーズ4 Supabase 移行（localStorage マイグレーション #10 とセット）／CI（#3、push 開始時）
3. 後始末（軽微・未実施）: `docs/mock-debt.md` の #5 を返済済みへ移動／本日分のコミット単位の判断（聡太）／`vue/no-v-html` warning 2件の抑制コメント可否（聡太判断）

## 参照

- タスク台帳: `docs/roadmap.md`（タスク2・3 実装完了済みに更新済み）
- 意図的先送り: `docs/mock-debt.md`（#9 カテゴリスナップショット・#10 書き込み localStorage 先行を追加）
- 未決論点: `docs/open-questions.md`（優先度高は空。コールドアーカイブは「検証中に確認」へ整理済み）
- CMS 設計の決定: `docs/adr/ADR-011-cms-capture-and-editing.md`
- mermaid の技術判断: `docs/adr/ADR-012-mermaid-rendering-and-editor.md`（実装仕様の詳細は `docs/specs/mermaid-*.md` 3本）
- 委譲ワークフローの定義: `~/.claude/skills/delegate/SKILL.md`・`~/business/secretary/desk/projects/delegation-workflow.md`

## 知見（このセッションで得たもの）

- **状態の寿命はディレクトリで宣言する**: recompose バグの本質は「コンポーネント寿命か・アプリ寿命か」が implicit だったこと。`stores/`（useState ベース・Pinia 不採用）に置くことで寿命が構造で読めるようになった。Pinia は「状態に振る舞いが付く・store が増える」まで不要（参照アーキ ADR-004 の使い分け基準がそのまま効いた）
- **既存要件の変更提案は、初出と根拠の確認が先**: カテゴリD&D を上下ボタンに変えようと提案 → 構想メモの「ラフに分類して溜まったら一括整理」という使用モデルが D&D の価値を最大化する場面だと指摘され撤回。テストデータの規模（6カテゴリ）から効果を見積もる誤りを2度やった
- **SortableJS は合成 PointerEvent で動かせない**（isTrusted 系の壁）。D&D の自動検証はデータ変異ロジックのユニットテスト（`mockEntryRepository.test.ts` 7件）＋実ドラッグの手動確認に分けるのが現実的
- vuedraggable の行全体ドラッグは `filter=".act, .rename"`＋`:prevent-on-filter="false"` で操作系と共存できる
- `[id].vue` と `[id]/edit.vue` は共存不可（前者が親レイアウト化して子が描画されない）→ `[id]/index.vue` へ移動が正解
- 削除確認 UI で `@blur` の暗黙キャンセルは、キャンセルボタンの click と競合する（blur が先に走り標的が消える）。明示ボタン一本化が安全

## 環境メモ

- `npm test`（Vitest 30件）/ lint（error 0・`vue/no-v-html` warning 2件は意図的採用）/ `nuxt typecheck` すべてグリーン（2026-07-06 昼時点）
- dev サーバーは localhost:3000 で起動中（表示は cmux surface:17。旧 surface:14 は聡太が閉じた）
- localStorage に検証の名残: `recollage:created` に実エントリ「CSS多段組とbreak-inside」（読書カテゴリ・内容は正しい技術メモ）。`/categories` に「新しい章」が数個（聡太のD&D確認分）— 不要なら削除ボタンで消せる
- 閲覧記録リセット: `localStorage.removeItem('recollage:views')`。カテゴリを JSON 初期状態に戻す: `removeItem('recollage:categories')`
