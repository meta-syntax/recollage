# モック負債リスト（フェーズ3）

最終更新: 2026-07-05

「意図的にあとで払う」と決めた項目の台帳。設計監査（docs/設計監査-2026-07-04.md）の指摘を受けて作成。
**フェーズ4の入り口でこのリストをチェックリスト化し、1項目ずつ「払う / さらに先送り」を判断する。**
ここに載っていない ADR 違反は「負債」ではなく「実装漏れ」として扱う。

## 返済済み（2026-07-05）

| 項目 | 対応 |
|---|---|
| フィード編成が乱択（ADR-008 違反・監査 高-1） | `shared/utils/feedScore.ts` 実装＋Vitest 回帰テスト＋useFeed 配線 |
| repository 層不在（ADR-001 違反・監査 高-2） | `app/repositories/` に interface＋MockEntryRepository |
| 密度導出が2実装2定義（ADR-002 違反・監査 中-1） | `shared/utils/deriveDensity.ts` に集約 |
| clone してもビルド不能（監査 中-2） | `data/sample/` 作成＋glob フォールバック（mock→sample） |
| ssr 設定未反映（ADR-003・監査 中-4） | nuxt.config に `routeRules: {'/**': {ssr: false}}` |
| YAML 誤パースが無音（監査 低） | 想定外構造で throw（ファイルパス付き） |
| テスト0 | Vitest 導入（`npm test`）。CI は未導入（下記） |
| index.vue モノリス（ADR-005 違反・監査 低） | ui/ ＋ feed/ の2層に分割（同日）。index.vue は 137行、pages は組むだけに |

## 未返済（意図的な先送り）

| # | 項目 | 内容 | 払うタイミング |
|---|---|---|---|
| 2 | 生 hex 直書き | ADR-007 の Primitive/Semantic トークン・`@theme` 未導入。コンポーネント分割で各 scoped CSS に色・フォントの重複が分散した（分割時に許容した負債）。Claude Design からの「値の逆抽出」が前提タスク（open-questions「あえて先送り」） | トークン逆抽出の実施時にまとめて |
| 3 | CI 未導入 | architecture.md は「必須装備」と明記。Vitest はローカルで動く状態まで整備済み | リモートに push を始めるとき（GitHub Actions で lint＋test） |
| 4 | `lastViewedAt` が永遠に null | 詳細画面が無く閲覧記録の更新経路が無い。Resurface の viewCount 項が実データで検証できない | フェーズ4（詳細画面＋書き込み系 repository） |
| 5 | Mermaid ビジュアル未対応 | `visual.type === 'mermaid'` のカードは画像なし扱いで描画。密度判定は L になる（ADR-002 準拠） | Mermaid エントリを実際に作るとき（遅延ロード必須・ADR-003） |
| 6 | スケルトンUI・ローカルキャッシュ・SW | ADR-003 の CSR 弱点対策1〜3が全て未実装。現状は静的JSONなので実害なし | フェーズ4（実データ取得にレイテンシが生まれるとき） |
| 7 | data/sample の画像が外部URL | picsum.photos 依存。オフライン・CI のビジュアルリグレッションでは差し替えが要る | CI でスクリーンショット比較を始めるとき |
| 8 | 号情報が仮ロジック | 号数=100+件数、発行日=最新エントリ作成日。プロダクトとしての意味付けは未設計 | フィード検証の結果次第（消すかもしれない） |
