

# データモデル v1

確定日: 2026-06-11（設計セッション）

モック段階（フェーズ2〜3）はこの型のJSONを `data/mock/` に置く。Supabase移行（フェーズ4）時にこの定義をテーブルへ写す。型定義の実体は `shared/types/` に置く（アプリ・Nitroサーバ両方から参照するため）。

## Entry

```typescript
interface Entry {
  id: string
  title: string | null      // 書き捨てはnull。表示はbody先頭行でフォールバック
  body: string               // Markdown。唯一の必須フィールド
  keyPoints: string[]        // 要点（箇条書き）。中カードの表示素材
  background: string | null  // 背景・文脈
  categoryId: string | null
  visual: {
    type: 'image' | 'mermaid'
    content: string          // typeに応じて画像URL or Mermaidコード
  } | null
  source: {
    kind: 'manual' | 'obsidian'
    path?: string            // インポート元のVault内パス
    importedAt?: string
  }
  createdAt: string          // ISO 8601。インポート時は元ノートの作成日を入れる
  updatedAt: string
  lastViewedAt: string | null // resurfacing（忘れかけ判定）用
  viewCount: number
}
```

### フィールドの設計意図

- **title が nullable**: 「最低限、本文だけで保存できる」要件（書き捨てOK）のため。カード表示時は body 先頭行でフォールバックする
- **keyPoints は配列**: 自由テキストでなく箇条書き配列にすることで、中カードに「先頭1〜2個だけ抜粋」という表示制御ができる
- **createdAt はコンテンツの誕生日**: Obsidianインポート時は元ノートの作成日を入れる。「忘れかけ」判定の土台は書いた日であり、取り込んだ日ではない。取り込み日時は `source.importedAt` に分離
- **visual は単一オブジェクト**: v1の割り切り。複数ビジュアル・再生成履歴の扱いは未決（`open-questions.md` 参照）
- **lastViewedAt / viewCount**: フィードのresurfacing（出会い直し編成）に必要なため最初から持つ

## Category

```typescript
interface Category {
  id: string
  name: string
  parentId: string | null   // ツリー構造（例: 物理学 > 量子力学 > シュレディンガーの猫）
  sortOrder: number          // 兄弟間の表示順。暫定で整数連番
}
```

- **sortOrder は暫定で整数連番**: D&Dでの並べ替え・階層変更に耐える順序表現（fractional indexing 等）は学習後に再議論する（`open-questions.md` 参照）

## カード密度の導出（保存しない）

カードの密度（サイズ・情報量）はカラムとして持たず、フィールドの充足状況から導出する。詳細は ADR-002。

| 密度 | 条件 |
|---|---|
| 大 | visual あり |
| 中 | title と keyPoints（1件以上）あり |
| 小 | 上記未満（bodyのみ等） |

導出ロジックは1関数に集約する（`shared/utils/` 想定。フィードとカードコンポーネントの双方が同じ判定を使う）。

## 将来の拡張（今は持たない）

- **embedding ベクトル**: 関連表示・RAG用。Supabase移行時に pgvector で追加する。JSONモック段階では持たない
