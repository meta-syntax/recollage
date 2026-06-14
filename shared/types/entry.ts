// Entry — エントリのドメイン型（data-model.md v1 準拠）
// アプリ・Nitroサーバ両方から参照するため shared/types に置く。

/** カードのビジュアル素材。type に応じて content が画像URL or Mermaidコード。 */
export interface Visual {
  type: 'image' | 'mermaid'
  /** type='image' なら画像URL、type='mermaid' なら Mermaidコード */
  content: string
}

/** エントリの出自。manual=アプリ内入力 / obsidian=インポート。 */
export interface EntrySource {
  kind: 'manual' | 'obsidian'
  /** インポート元の Vault 内パス */
  path?: string
  /** 取り込み日時（ISO 8601）。コンテンツの誕生日は createdAt 側に持つ */
  importedAt?: string
}

export interface Entry {
  id: string
  /** 書き捨ては null。表示は body 先頭行でフォールバック */
  title: string | null
  /** Markdown。唯一の必須フィールド */
  body: string
  /** 要点（箇条書き）。中カードの表示素材 */
  keyPoints: string[]
  /** 背景・文脈 */
  background: string | null
  categoryId: string | null
  visual: Visual | null
  source: EntrySource
  /** ISO 8601。インポート時は元ノートの作成日を入れる（取り込み日ではない） */
  createdAt: string
  updatedAt: string
  /** resurfacing（忘れかけ判定）用。未閲覧は null */
  lastViewedAt: string | null
  viewCount: number
}
