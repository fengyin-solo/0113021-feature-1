/** 井型、状态等枚举集中维护，列表 / 详情 / 模拟服务共用 */

export const WELL_TYPES = ['探井', '开发井', '评价井'] as const

export const WELL_STATUSES = ['钻井中', '生产中', '待修井', '关停井'] as const

/** 状态对应的 el-tag 类型 */
export const STATUS_TAG_TYPE: Record<string, 'success' | 'primary' | 'warning' | 'danger' | 'info'> = {
  生产中: 'success',
  钻井中: 'primary',
  待修井: 'warning',
  关停井: 'danger'
}

/** 状态对应的展示色（驾驶舱饼图等） */
export const STATUS_COLOR: Record<string, string> = {
  生产中: '#22c55e',
  钻井中: '#3b82f6',
  待修井: '#f59e0b',
  关停井: '#ef4444'
}

export const QUERY_FIELD_LABELS: Record<string, string> = {
  wellCode: '井号',
  wellName: '井名',
  wellType: '井型',
  blockName: '区块',
  status: '状态'
}

export const createEmptyQuery = () => ({
  wellCode: '',
  wellName: '',
  wellType: '',
  blockName: '',
  status: ''
})
