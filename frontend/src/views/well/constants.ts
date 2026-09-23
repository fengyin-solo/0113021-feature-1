// 井位台账领域常量与类型定义

export const WELL_TYPES = ['探井', '开发井', '评价井'] as const

export const WELL_STATUSES = ['钻井中', '生产中', '待修井', '关停井'] as const

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export interface WellRecord {
  id: number
  wellCode: string
  wellName: string
  wellType: string
  blockName: string
  longitude: number | null
  latitude: number | null
  designDepth: number | null
  status: string
  createTime: string
}

// 组合检索条件：井号、井型、区块、状态（井名为历史筛选项，保留兼容）
export interface WellQuery {
  wellCode: string
  wellName: string
  wellType: string
  blockName: string
  status: string
}

export const emptyQuery = (): WellQuery => ({
  wellCode: '',
  wellName: '',
  wellType: '',
  blockName: '',
  status: ''
})

// 可保存的命名检索方案
export interface SearchScheme {
  id: number
  name: string
  query: WellQuery
  updatedAt: string
}
