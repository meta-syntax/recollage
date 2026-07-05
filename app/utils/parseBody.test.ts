import { describe, expect, it } from 'vitest'
import { parseBody } from './parseBody'

describe('parseBody', () => {
  it('Kindle ハイライト形式（--- 区切りの段落）を分割する', () => {
    expect(parseBody('一つ目の引用。\n---\n二つ目の引用。')).toEqual([
      { type: 'p', text: '一つ目の引用。' },
      { type: 'hr' },
      { type: 'p', text: '二つ目の引用。' },
    ])
  })

  it('箇条書きを ul にまとめる', () => {
    expect(parseBody('- 一点目\n- 二点目\n\n締めの段落')).toEqual([
      { type: 'ul', items: ['一点目', '二点目'] },
      { type: 'p', text: '締めの段落' },
    ])
  })

  it('見出しと空行区切りの段落', () => {
    expect(parseBody('## 気づき\n本文1行目\n2行目\n\n次の段落')).toEqual([
      { type: 'h', text: '気づき' },
      { type: 'p', text: '本文1行目\n2行目' },
      { type: 'p', text: '次の段落' },
    ])
  })

  it('空文字は空配列', () => {
    expect(parseBody('')).toEqual([])
  })
})
