// Category — カテゴリのドメイン型（data-model.md v1 準拠）
// ツリー構造（parentId）で階層化する。

export interface Category {
  id: string
  name: string
  /** ツリー構造。トップレベルは null（例: 物理学 > 量子力学 > シュレディンガーの猫） */
  parentId: string | null
  /** 兄弟間の表示順。暫定で整数連番（fractional indexing は学習後に再議論） */
  sortOrder: number
}
