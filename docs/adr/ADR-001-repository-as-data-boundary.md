# ADR-001: repository層をデータ境界にする

- ステータス: 採用
- 日付: 2026-06-11

## コンテキスト

開発はモックフィードによる仮説検証（静的JSON）から始め、手応えが出たらSupabaseへ移行する計画。検証用のモック実装が「捨てプロトタイプ」になると、検証と本実装の二度手間が発生する。

## 決定

データアクセスを `EntryRepository` インターフェースに集約し、UI層（pages / components / composables）はデータソースを一切知らない構造にする。

- 依存方向: pages/components → composables → repositories → 実装（一方向のみ）
- 実装の差し替え: `MockEntryRepository`（JSON）→ `SupabaseEntryRepository`（CRUD直）→ `$fetch('/api/...')`（秘匿系）

## 帰結

- モック→Supabase移行はrepository実装を1個足して差し替えるだけ。composables以上のコードは変更不要
- テストはrepositoryモックを注入して書ける（Vitest）
- 抽象一枚分の初期コストを払う。単一データソースの段階では冗長に見えるが、移行計画が確定している以上、回収は確実
