// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // Claude Design のデザインカンプ関連（生成物・アプリ非依存のビューア）は lint 対象外。
  {
    ignores: ['support.js', '*.dc.html'],
  },
  // 状態の寿命はディレクトリで宣言する: useState（アプリ寿命の状態）は app/stores/ にのみ置く
  {
    files: ['app/components/**', 'app/composables/**', 'app/pages/**'],
    rules: {
      'no-restricted-syntax': ['error', {
        selector: 'CallExpression[callee.name="useState"]',
        message: 'useState は app/stores/ にのみ置く（状態の寿命はディレクトリで宣言する）',
      }],
    },
  },
)
