// embedding 対象テキストの組み立て（ADR-015）。
// 書き込み元3経路（アプリUI・MCP・バックフィル)で同一の組み立てを保証する純関数。

export interface Embeddable {
  title: string | null
  keyPoints: string[]
  body: string
}

// Ruri v3 は最大8192トークン。安全側の文字数上限で素朴に切り詰める
const MAX_CHARS = 8000

export function embeddingText(e: Embeddable): string {
  const parts = [e.title, e.keyPoints.join('\n'), e.body].filter(Boolean)
  return parts.join('\n').slice(0, MAX_CHARS)
}
