// エントリ本文（Markdown軽量サブセット）→ ブロック配列。
// 実データは Kindle ハイライト（--- 区切り）・箇条書き・段落程度なので、
// フルの Markdown ライブラリは入れず、必要になった時点で遅延ロード導入する（ADR-003 バンドル規律）。

export type BodyBlock
  = | { type: 'p', text: string }
    | { type: 'h', text: string }
    | { type: 'ul', items: string[] }
    | { type: 'hr' }

export function parseBody(body: string): BodyBlock[] {
  const blocks: BodyBlock[] = []
  let para: string[] = []
  let list: string[] = []

  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: 'p', text: para.join('\n') })
      para = []
    }
  }
  const flushList = () => {
    if (list.length) {
      blocks.push({ type: 'ul', items: list })
      list = []
    }
  }

  for (const raw of body.split('\n')) {
    const line = raw.trim()
    if (!line) {
      flushPara()
      flushList()
      continue
    }
    if (/^-{3,}$/.test(line)) {
      flushPara()
      flushList()
      blocks.push({ type: 'hr' })
      continue
    }
    if (line.startsWith('- ')) {
      flushPara()
      list.push(line.slice(2).trim())
      continue
    }
    if (/^#{1,6}\s/.test(line)) {
      flushPara()
      flushList()
      blocks.push({ type: 'h', text: line.replace(/^#{1,6}\s*/, '') })
      continue
    }
    flushList()
    para.push(line)
  }
  flushPara()
  flushList()
  return blocks
}
