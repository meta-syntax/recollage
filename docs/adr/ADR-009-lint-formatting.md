# ADR-009: Lint/整形 — ESLint Stylistic に一本化（Prettier不採用）

- ステータス: 採用
- 日付: 2026-06-14

## コンテキスト

対外公開前提のため Lint は必須装備（architecture.md「品質ゲート」）。コードフォーマットの担い手として2系統がある。

- A. **Prettier 併用**: フォーマットはPrettier、ルールチェックはESLint。広く使われるが、ESLintの整形系ルールと責務が重なり設定競合が起きやすく、2ツールの管理が要る
- B. **ESLint Stylistic に寄せる**: 整形もESLintで行う。ESLintコアは整形系ルールを凍結し [ESLint Stylistic](https://eslint.style/)（`@stylistic/*`）へ外出しした。Nuxt公式の `@nuxt/eslint` がこれを統合しており、`stylistic: true` でopt-inできる

Nuxtは flat config 前提で `@nuxt/eslint` モジュールによるプロジェクト対応設定を推奨しており、整形は「Prettier併用」「ESLint Stylistic」のどちらでもよいという立場。

## 決定

**B（ESLint Stylistic に一本化）** を採用する。Prettierは入れない。

- `@nuxt/eslint` モジュールを使い、flat config（`eslint.config.mjs` → `withNuxt()`）で構成する
- 整形は `eslint: { config: { stylistic: true } }` で有効化する
- 整形ポリシーは Nuxt/Stylistic のデフォルト値をそのまま使う（独自カスタマイズしない。セミコロンなし・シングルクォート・2スペース等）

## 理由

- フォーマットとルールチェックを1ツールに集約でき、Prettier↔ESLintの設定競合・二重管理が発生しない
- `@nuxt/eslint` が Vue/TS/Stylistic の各 recommended を合成して適用するため、個別配線が要らない
- 整形ポリシーを独自値で持つと、設定の維持コストとアップストリーム（Nuxt/Stylistic）のデフォルト更新への追従コストが発生する。デフォルト準拠ならどちらも不要

## 帰結

- `npm run lint` / `lint:fix` で整形まで完結する。CI（architecture.md 品質ゲート）の lint ステップに乗せられる
- 適用される推奨ルールはベース（Vue/TS/コアの recommended）まで。型情報を使う型認識ルール（type-checked）や strict 系は**この決定では有効化していない**。lint強度の引き上げは未決事項として切り出す（再評価条件参照）

## 再評価条件

- **lint強度**: 型認識ルール（`recommended-type-checked` / `strict`）の採否は保留中。`tsconfigPath` 指定で型認識を、`strict: true` で strict 系を opt-in できる。コード量が増えて実行時バグの検出価値が上がった段階で判断する → `open-questions.md`
- 特定の整形ポリシーが要件として必要になった場合は `stylistic` をオブジェクト指定で上書きする（決定の変更ではなく値の調整）
- Prettierでしか得られない要件（対応エディタ・他言語の整形等）が生じた場合はAの再検討
