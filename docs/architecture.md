# アーキテクチャ

確定日: 2026-06-11（設計セッション）

前提: Nuxt 4（`app/` ディレクトリ構造、`shared/` はアプリ・Nitro両参照）。

## ディレクトリ構造

```
recollage/
├── app/
│   ├── components/
│   │   ├── ui/              # 第1層: デザインプリミティブ（ドメイン非依存）
│   │   ├── feed/            # 第2層: FeedGrid / FeedCardLarge / FeedCardMedium / FeedCardSmall
│   │   ├── category/        # CategoryTree
│   │   └── visual/          # MermaidRenderer / GeneratedImage
│   ├── composables/
│   │   ├── useEntries.ts    # UIステート管理
│   │   └── useFeed.ts       # フィード編成ロジック（新着＋忘れかけ＋関連の混合）
│   ├── pages/
│   │   ├── index.vue        # フィード（主戦場）
│   │   ├── entries/[id].vue # エントリ詳細
│   │   └── categories.vue   # カテゴリツリー
│   └── layouts/
├── shared/
│   ├── types/               # Entry, Category（data-model.md 参照）
│   └── utils/               # カード密度導出 等の純粋関数
├── server/                  # 秘匿キーが必要な処理のみ（画像生成・LLM・embedding生成）
├── data/mock/               # 変換スクリプトの出力JSON（フェーズ2〜3）
├── scripts/
│   └── import-obsidian.ts   # Obsidian→JSON変換（Node単体実行、アプリ非依存）
└── docs/
    ├── data-model.md
    ├── architecture.md（このファイル）
    ├── open-questions.md
    └── adr/                 # 設計判断の記録（1判断1ファイル）
```

## レイヤー構造（ADR-001 / ADR-004）

```
pages / components
      ↓
composables/        # UIステートの管理（useFeed, useEntries）
      ↓
repositories/       # EntryRepository インターフェース（データアクセスの唯一の窓口）
      ↓ 実装を差し替え
  ├ MockEntryRepository      # フェーズ3: data/mock/*.json
  ├ SupabaseEntryRepository  # フェーズ4: CRUD直叩き（RLS保護）
  └ $fetch('/api/...')       # 秘匿系: server/api/ → 画像生成・LLM・embedding
```

依存は上から下への一方向のみ。データソースの変更（モック→Supabase）はrepository実装の差し替えだけで完結し、composables以上は無傷。

## コンポーネント依存ルール（ADR-005）

1. **ui/ はドメインを知らない** — `Entry` 等のドメイン型をimportしない。propsはプリミティブ型のみ
2. **フィーチャー間の相互importは禁止** — 共有したくなったら ui/ に降ろすか composable に抽出する
3. **pages/ は組むだけ** — レイアウトとフィーチャーの組み合わせのみ。ロジックを書かない

Nuxt Layers は現段階で不採用（ADR-005 の再評価条件参照）。

## レンダリング戦略（ADR-003）

routeRules によるルート単位宣言。デフォルトはCSR（`ssr: false`）。

```typescript
routeRules: {
  '/**': { ssr: false },
  // 将来、エントリの公開共有面を作ったら該当ルートのみ prerender / ssr を有効化
}
```

CSRの初期ロード対策（スケルトン・ローカルキャッシュ・SW・バンドル予算・画像最適化）は ADR-003 に詳細を記載。

## 品質ゲート（初期セットアップ要件）

対外公開（ポートフォリオ）前提のため、以下は「あると良い」ではなく必須装備:

- ESLint
- TypeScript strict
- Vitest（repositoryモックでcomposable・utils をテスト）
- GitHub Actions CI（lint / typecheck / test / **バンドルサイズ予算チェック**）

## 開発フェーズ

| # | フェーズ | 状態 |
|---|---|---|
| 1 | データモデル初版 | 完了（docs/data-model.md） |
| 1.5 | フィード編成アルゴリズム設計 | 完了（ADR-008） |
| 2 | Obsidian→JSON変換スクリプト | 完了（scripts/import-obsidian.ts、21件 → data/mock/） |
| 3 | Nuxtモックフィード（仮説検証） | 未着手 |
| 4 | Supabase移行・認証・入力フォーム | フェーズ3の手応え待ち |

検証仮説:「自分のデータがビジュアルカードで並んだとき、実際にスクロールして読み返すか」

## ADR一覧

| # | タイトル |
|---|---|
| ADR-001 | repository層をデータ境界にする |
| ADR-002 | カード密度は保存せず導出する |
| ADR-003 | レンダリング戦略: routeRulesハイブリッド、デフォルトCSR |
| ADR-004 | APIレイヤー: Supabase直＋秘匿系のみNitro |
| ADR-005 | コンポーネント2層構造とNuxt Layers不採用 |
| ADR-006 | 既製CMS不採用 — コンテンツ管理面は自作する |
| ADR-007 | CSS戦略: Tailwind v4＋デザイントークン2層 |
| ADR-008 | フィード編成アルゴリズム（スコア式・間隔反復resurface・セッションシード） |
| ADR-009 | Lint/整形: ESLint Stylistic に一本化（Prettier不採用） |
| ADR-010 | Tailwind導入手段: first-party Viteプラグイン（モジュール不採用） |
