# ADR-010: Tailwind 導入手段 — first-party Viteプラグイン（モジュール不採用）

- ステータス: 採用
- 日付: 2026-06-14

## コンテキスト

ADR-007 で Tailwind v4＋CSSファースト（`@theme` トークン）を採用済み。その v4 を Nuxt にどう組み込むかで2案がある。

- A. **`@nuxtjs/tailwindcss`（コミュニティモジュール）**: Nuxtで長く標準だったが、v3世代（PostCSS＋`tailwind.config.js`前提）の設計
- B. **`@tailwindcss/vite`（Tailwind公式の first-party Viteプラグイン）**: v4ネイティブ。Tailwind公式のNuxtガイドが案内する経路

## 決定

**B（`@tailwindcss/vite`）** を採用する。`@nuxtjs/tailwindcss` モジュールは使わない。

- `nuxt.config.ts` の `vite.plugins` に `tailwindcss()` を登録する
- CSS入口は `app/assets/css/main.css` の `@import "tailwindcss";`、`css` 配列に登録する
- `tailwind.config.js` は置かない（v4はJS configをデフォルトで読まない。設定は `@theme` のCSSファーストに集約＝ADR-007）

## 理由

- `@nuxtjs/tailwindcss` はv3構成（PostCSS＋JS config）に引き戻す。ADR-007 で決めたCSSファースト方針と噛み合わない
- v4の新エンジン（Rust製Oxide）の性能を引き出すのは Vite直結プラグイン。公式もこの経路を推奨
- 依存と設定が最小（CSS1行＋プラグイン登録のみ、`content` 配列も不要＝自動検出）

## 帰結

- v3資産の移行など、どうしてもJS configが要る場合は CSS に `@config "..."` を書いてopt-in復活できる（エスケープハッチ。新規実装では使わない）
- ADR-007（トークン2層）の `@theme` 記述はこのプラグイン構成の上にそのまま乗る

## 再評価条件

- `@nuxtjs/tailwindcss` が v4 で Viteプラグインを上回る統合価値（Nuxt固有の最適化・DX）を提供するようになった場合に再検討する
