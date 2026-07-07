# Recollage HANDOVER

> **趣旨**: 次セッションが最短で作業に入るための引き継ぎ「のみ」を書く。
> - 更新は**全体の書き直し**で行う。日付付きの追記を積み上げない
> - 終わったことは書かない: 経緯は git log、設計判断は docs/adr/、意図的な先送りは docs/mock-debt.md、学び・エピソードは記憶DB（/logger）へ
> - 推論の根拠を渡す必要があるときだけ `## 推論ログ` 節を /handover スキルが置換管理する
> - 目安40行以内。超えたら削る

最終更新: 2026-07-07（昼）

## 現在地

Supabase 移行（ADR-013）・MCP v1/v2（ADR-014/015）・embedding 検索と w_related 有効化（ADR-015）・アプリ内索引（ADR-016）・SWR＋号の並び順凍結（ADR-008 追記）・ローディング統一（UiLoadingDots＋spa-loading-template）まで完了。ADR 全16本と実装の照合監査済み・乖離ゼロ。モデル非依存の基盤（CI・ADR-005 規約の ESLint 化・CLAUDE.md・DB エクスポート）も整備済み。フェーズ4 GO/NO-GO の検証仮説を日常使用で判定する期間に入っている。

## 未コミット

- ローディング一式: `app/spa-loading-template.html`・`app/components/ui/UiLoadingDots.vue`（新規）、index.vue / entries/[id]/index.vue / SearchIndexModal.vue（差し替え）、UiFigure.vue（`loading="lazy"`）
- 基盤整備: `.github/workflows/ci.yml`・`CLAUDE.md`・`scripts/export-db.ts`（新規）、eslint.config.mjs（ADR-005 の2ルール追加・発火確認済み）、package.json（vue-tsc・export:db）、.gitignore（data/export・docs/ 理由コメント）
- HANDOVER.md（本ファイル。docs/ 配下は gitignore 対象でコミット外）

## 次のアクション

1. **検証仮説の判定**（1〜2週間、日常使用）— フェーズ4 GO/NO-GO の入力
2. **push**: CI（lint＋typecheck＋test）は push して初めて効く。docs/ は独立プライベートリポ `meta-syntax/recollage-docs` へ push 済み
3. w_related（0.3）の重み調整は検証期間の体感で
4. mock-debt #6 残り（永続キャッシュ・SW）・#11（Obsidian 再インポート）・#12（サムネイル生成）は台帳参照
5. localStorage の掃除: `/dev/migrate` のボタン未実行（押しても実害なし）
6. スキーマ変更や大きな作業の前に `npm run export:db` でバックアップを取る習慣

## 環境メモ

- dev サーバー: localhost:3000。検査: `npm test`（54件）/ `npx nuxt typecheck` / `npx eslint .`（warning 2件は既知）
- `.env`: `NUXT_PUBLIC_DATA_SOURCE=supabase`・接続情報・`SUPABASE_SECRET_KEY`（gitignore 対象）
- Supabase プロジェクト: `oerpgucyepzgshgxpyij`（ユーザー1名作成済み）
- MCP `recollage`（user スコープ登録済み）: create_entry / list_categories / search_entries / append_to_entry
