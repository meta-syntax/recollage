// ローカル embedding（ADR-015）。記憶システム（~/.claude/memory/server/embedder.mjs）と同一構成。
// Nitro（/api/embed）と scripts/（MCP サーバー・バックフィル）の両方から使う。
// モデル本体（約300MB）は初回推論時に DL され node_modules 配下にキャッシュされる。

import { pipeline } from '@huggingface/transformers'

// 日本語特化 ModernBERT-ja。選定知見は ADR-015 参照（JMTEB 77.24・q8 で文書1件23ms）
const MODEL_NAME = 'sirasagi62/ruri-v3-310m-ONNX'
const DTYPE = 'q8'

type Extractor = Awaited<ReturnType<typeof pipeline<'feature-extraction'>>>

let extractor: Promise<Extractor> | null = null

function getExtractor(): Promise<Extractor> {
  extractor ??= pipeline('feature-extraction', MODEL_NAME, { dtype: DTYPE })
  return extractor
}

/** Ruri v3 のプレフィックス規約: 文書は「検索文書: 」、クエリは「検索クエリ: 」 */
export async function embed(text: string, type: 'passage' | 'query' = 'passage'): Promise<number[]> {
  const ext = await getExtractor()
  const prefix = type === 'passage' ? '検索文書: ' : '検索クエリ: '
  const output = await ext(prefix + text, { pooling: 'mean', normalize: true })
  return Array.from(output.data as Float32Array)
}
