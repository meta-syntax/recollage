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
  // ADR-005 ルール1: ui/（第1層）はドメインを知らない。shared/types・repositories を import しない
  {
    files: ['app/components/ui/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['**/shared/types/*', '**/repositories/*'],
          message: 'ui/ はドメインを知らない（props はプリミティブのみ・ADR-005）',
        }],
      }],
    },
  },
  // ADR-005 ルール2: フィーチャー間の相互利用禁止（＋ui/ からのフィーチャー利用禁止）。
  // Nuxt の auto-import は import 文を残さないため、テンプレートのタグ名で検査する。
  // 共有したくなったら ui/ に降ろすか composable に抽出する
  ...Object.entries({
    ui: ['Category', 'Entry', 'Feed', 'Search'],
    category: ['Entry', 'Feed', 'Search'],
    entry: ['Category', 'Feed', 'Search'],
    feed: ['Category', 'Entry', 'Search'],
    search: ['Category', 'Entry', 'Feed'],
  }).map(([dir, banned]) => ({
    files: [`app/components/${dir}/**`],
    rules: {
      'vue/no-restricted-syntax': ['error', {
        selector: `VElement[rawName=/^(${banned.join('|')})[A-Z]/], VElement[rawName=/^(${banned.map(b => b.toLowerCase()).join('|')})-/]`,
        message: `${dir}/ から他フィーチャーのコンポーネントは使わない（ADR-005。共有するなら ui/ へ降ろす）`,
      }],
    },
  })),
)
