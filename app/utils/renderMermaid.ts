// Mermaid は必ず遅延ロード（ADR-003）。initialize はプロセスで1回だけ
let loader: Promise<typeof import('mermaid').default> | null = null
let seq = 0

function load() {
  loader ??= import('mermaid').then(({ default: mermaid }) => {
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral' })
    return mermaid
  })
  return loader
}

/** コードを SVG 文字列に描画する。不正コードは throw（呼び出し側でフォールバック） */
export async function renderMermaid(code: string): Promise<string> {
  const mermaid = await load()
  const id = `mmd-${++seq}`
  try {
    const { svg } = await mermaid.render(id, code)
    return svg
  }
  catch (e) {
    // mermaid v10+ は失敗時 body 直下に描画用 <div id="dmmd-…"> を残すことがある → 除去
    document.getElementById(`d${id}`)?.remove()
    throw e
  }
}
