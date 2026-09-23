import { WellQuery, WellRecord } from './constants'

export const normalize = (value: string) => value.trim().toLowerCase()

// 判断单口井是否满足全部已启用条件（条件之间为“与”关系）
export const matchWell = (well: WellRecord, query: WellQuery): boolean => {
  const conditions: Array<(w: WellRecord) => boolean> = []

  if (query.wellCode.trim()) {
    const keyword = normalize(query.wellCode)
    conditions.push((w) => normalize(w.wellCode).includes(keyword))
  }
  if (query.wellName.trim()) {
    const keyword = normalize(query.wellName)
    conditions.push((w) => normalize(w.wellName).includes(keyword))
  }
  if (query.wellType) {
    conditions.push((w) => w.wellType === query.wellType)
  }
  if (query.blockName) {
    conditions.push((w) => w.blockName === query.blockName)
  }
  if (query.status) {
    conditions.push((w) => w.status === query.status)
  }

  return conditions.every((cond) => cond(well))
}

export const filterWells = (wells: WellRecord[], query: WellQuery): WellRecord[] =>
  wells.filter((well) => matchWell(well, query))

export interface ActiveCondition {
  key: keyof WellQuery
  label: string
  value: string
}

// 当前实际生效（非空）的检索条件
export const getActiveConditions = (query: WellQuery): ActiveCondition[] => {
  const list: ActiveCondition[] = []
  if (query.wellCode.trim()) list.push({ key: 'wellCode', label: '井号', value: query.wellCode.trim() })
  if (query.wellName.trim()) list.push({ key: 'wellName', label: '井名', value: query.wellName.trim() })
  if (query.wellType) list.push({ key: 'wellType', label: '井型', value: query.wellType })
  if (query.blockName) list.push({ key: 'blockName', label: '区块', value: query.blockName })
  if (query.status) list.push({ key: 'status', label: '状态', value: query.status })
  return list
}

export interface EmptyAnalysis {
  reason: string
  suggestion: string
  // 按“逐个放宽条件”尝试后，能匹配到数据的放宽方案
  suggestions: Array<{ key: keyof WellQuery; label: string; count: number }>
}

// 无匹配时说明具体是哪些条件叠加导致没有结果，并给出可放宽的条件建议
export const analyzeEmpty = (wells: WellRecord[], query: WellQuery): EmptyAnalysis => {
  const active = getActiveConditions(query)
  const conditionText = active.map((c) => `${c.label}「${c.value}」`).join('、')

  if (wells.length === 0) {
    return {
      reason: '台账中暂无任何井位数据',
      suggestion: '请先通过「新增井位」录入数据',
      suggestions: []
    }
  }

  const suggestions: EmptyAnalysis['suggestions'] = []
  active.forEach((cond) => {
    const relaxed: WellQuery = { ...query, [cond.key]: '' }
    const count = filterWells(wells, relaxed).length
    if (count > 0) {
      suggestions.push({ key: cond.key, label: cond.label, count })
    }
  })

  let suggestion: string
  if (suggestions.length > 0) {
    const top = suggestions[0]
    suggestion = `条件之间是“同时满足”关系，可尝试去掉「${top.label}」条件（去掉后有 ${top.count} 口井匹配），逐步缩小范围`
  } else if (active.length > 0) {
    suggestion = '井号/井名关键字或所选枚举可能与现有井位不一致，请检查后重试'
  } else {
    suggestion = ''
  }

  return {
    reason: `没有同时满足 ${conditionText} 的井位`,
    suggestion,
    suggestions
  }
}
