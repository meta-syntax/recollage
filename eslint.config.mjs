// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // Claude Design のデザインカンプ関連（生成物・アプリ非依存のビューア）は lint 対象外。
  {
    ignores: ['support.js', '*.dc.html'],
  },
  // 追加のルールはここに書く
)
