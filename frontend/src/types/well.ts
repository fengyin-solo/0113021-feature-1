/** 井位主数据 */
export interface Well {
  id: number
  /** 井号（全局唯一） */
  wellCode: string
  /** 井名 */
  wellName: string
  /** 井型：探井 / 开发井 / 评价井 */
  wellType: string
  /** 所属区块 */
  blockName: string
  longitude: number | null
  latitude: number | null
  /** 设计井深(m) */
  designDepth: number | null
  /** 状态：钻井中 / 生产中 / 待修井 / 关停井 */
  status: string
  createTime: string
}

/** 组合检索条件（均为可选，条件之间为 AND） */
export interface WellQuery {
  /** 井号（模糊匹配） */
  wellCode: string
  /** 井名（模糊匹配，保留原台账的井名检索） */
  wellName: string
  wellType: string
  blockName: string
  status: string
}

export interface WellListParams extends Partial<WellQuery> {
  page?: number
  size?: number
}

export interface WellListResult {
  rows: Well[]
  total: number
  page: number
  size: number
}

export interface WellStatistics {
  total: number
  statusCounts: Record<string, number>
}

/** 可保存的检索方案 */
export interface SearchScheme {
  name: string
  query: Partial<WellQuery>
  savedAt: string
}

/** 条件冲突明细（井号存在但与井型/区块/状态等条件矛盾） */
export interface ConflictDetail {
  /** 冲突条件字段 */
  field: keyof WellQuery
  /** 字段中文名 */
  fieldLabel: string
  /** 用户选择的期望值 */
  expected: string
  /** 该井号对应的实际值 */
  actual: string
  /** 精确命中的井号 */
  wellCode: string
}

/** 列表加载失败的类型：条件冲突 / 请求失败 */
export type WellListErrorType = 'conflict' | 'network'
