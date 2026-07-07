# Recollage — プロジェクトルール

学習ナレッジWebアプリ（Nuxt 4・全ルートCSR・Supabase）。雑誌メタファーの個人開発。

## セッションの入口（読む順）

1. `HANDOVER.md` — 現在地・未コミット・次のアクション。**全体書き直し運用・40行以内**（冒頭の趣旨ヘッダに従う。日付付き追記を積まない）
2. `docs/adr/` — 設計判断の正。運用ルールは `docs/adr/README.md`。実装との整合は 2026-07-07 に全16本監査済み
3. `docs/mock-debt.md` — 意図的な先送りの台帳。**ここに載っていない ADR 違反は「実装漏れ」として扱う**

## 検査（作業後に必ず3点）

```
npm test          # Vitest（shared/utils の純関数）
npx nuxt typecheck
npm run lint      # vue/no-v-html warning 2件は既知・意図的採用
```

## 規約（ESLint が機械的に落とすもの）

- `useState` は `app/stores/` のみ（状態の寿命はディレクトリで宣言する）
- `ui/` は shared/types・repositories を import しない（ADR-005 ルール1）
- フィーチャー間のコンポーネント相互利用禁止。共有するなら ui/ へ降ろす（ADR-005 ルール2。テンプレートのタグ名で検査される）

機械化できない規約は ADR が正。迷ったら該当 ADR を読んでから変える。

## データ

- 実データは Supabase のみ（接続情報は `.env`、gitignore 対象）。`NUXT_PUBLIC_DATA_SOURCE=supabase`
- バックアップ: `npm run export:db` → `data/export/`（gitignore 対象）。**スキーマ変更・大きな作業の前に実行する**
- `docs/` はアプリのリポジトリには載せない。**docs/ 内の独立プライベートリポ（recollage-docs）で版管理する**——docs/ を変更したら docs/ 内で commit・push すること。`data/mock` はローカル実データ（著作権）、コミット用ダミーは `data/sample`

## セッション終了時

`/logger` → `/wrap-up` の順で呼ぶ（エピソードは記憶DB、引き継ぎは HANDOVER）。
