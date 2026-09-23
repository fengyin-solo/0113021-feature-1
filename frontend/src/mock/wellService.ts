import type {
  Well,
  WellListParams,
  WellListResult,
  WellStatistics,
  ConflictDetail,
  WellQuery
} from '@/types/well'
import { QUERY_FIELD_LABELS, WELL_STATUSES, WELL_TYPES } from '@/constants/well'
import { seedWells } from './wellSeed'

/**
 * 井位本地模拟服务。
 *
 * 项目当前没有可用后端（/api 代理指向 8080 但无服务），原 src/api/well.ts
 * 的 HTTP 契约保持不动，这里用内存数据实现同构接口，供组合检索、分页、详情
 * 与编辑流程真实跑通。后续接入后端时，只需让 Pinia store 改回调用
 * src/api/well.ts 即可。
 */

/** 与 axios 响应拦截器一致的返回结构 */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

/** 业务异常（携带 code，供 UI 区分条件冲突与请求失败） */
export class WellApiError extends Error {
  code: number
  conflicts?: ConflictDetail[]

  constructor(code: number, message: string, conflicts?: ConflictDetail[]) {
    super(message)
    this.name = 'WellApiError'
    this.code = code
    this.conflicts = conflicts
  }
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const LATENCY = 300

// 模块级内存数据源：应用生命周期内 CRUD 均对它生效
let wells: Well[] = clone(seedWells)
let nextId = wells.reduce((max, w) => Math.max(max, w.id), 0) + 1

/**
 * 仅用于演示“请求失败”场景的一次性开关：
 * 置位后下一次列表请求必定失败（网络错误），随后自动清除，
 * 因此“重试”发出的是全新请求，不会沿用旧结果。
 */
let failNextListRequest = false

export function armNextListFailure(): void {
  failNextListRequest = true
}

function delay<T>(value: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(value())
      } catch (err) {
        reject(err)
      }
    }, LATENCY)
  })
}

function nowString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const includes = (value: string | undefined, keyword: string | undefined): boolean => {
  if (!keyword) return true
  return (value || '').toLowerCase().includes(keyword.trim().toLowerCase())
}

function buildConflicts(matched: Well, query: Partial<WellQuery>): ConflictDetail[] {
  const conflicts: ConflictDetail[] = []
  const pushIfMismatch = (field: keyof WellQuery, expected: string | undefined) => {
    if (!expected) return
    const actual = matched[field]
    if (actual !== expected) {
      conflicts.push({
        field,
        fieldLabel: QUERY_FIELD_LABELS[field],
        expected,
        actual,
        wellCode: matched.wellCode
      })
    }
  }
  pushIfMismatch('wellType', query.wellType)
  pushIfMismatch('blockName', query.blockName)
  pushIfMismatch('status', query.status)
  return conflicts
}

function filterWells(query: Partial<WellQuery>): Well[] {
  return wells
    .filter(w => includes(w.wellCode, query.wellCode))
    .filter(w => includes(w.wellName, query.wellName))
    .filter(w => !query.wellType || w.wellType === query.wellType)
    .filter(w => !query.blockName || w.blockName === query.blockName)
    .filter(w => !query.status || w.status === query.status)
}

function ok<T>(data: T): ApiResponse<T> {
  return { code: 200, message: 'success', data }
}

/** 井位分页列表（组合条件 AND 过滤，井号冲突时给出 40901 及冲突明细） */
export function fetchWellList(params: WellListParams = {}): Promise<ApiResponse<WellListResult>> {
  const query: Partial<WellQuery> = {
    wellCode: params.wellCode?.trim() || '',
    wellName: params.wellName?.trim() || '',
    wellType: params.wellType || '',
    blockName: params.blockName || '',
    status: params.status || ''
  }
  const page = Math.max(1, params.page || 1)
  const size = Math.max(1, params.size || 10)

  if (failNextListRequest) {
    failNextListRequest = false
    return new Promise((_resolve, reject) => {
      setTimeout(() => reject(new WellApiError(500, '井位列表请求失败：网络异常或服务暂不可用')), LATENCY)
    })
  }

  return delay(() => {
    // 条件冲突判定：井号（去空格后）精确命中某口井，但井型/区块/状态与该井实际值矛盾。
    // 与“无匹配”区分开，直接向用户说明是哪一项条件与该井冲突。
    if (query.wellCode) {
      const exact = wells.find(w => w.wellCode.toLowerCase() === query.wellCode!.toLowerCase())
      if (exact) {
        const conflicts = buildConflicts(exact, query)
        if (conflicts.length > 0) {
          throw new WellApiError(
            40901,
            `井号 ${exact.wellCode} 存在，但与所选${conflicts.map(c => c.fieldLabel).join('、')}条件冲突`,
            conflicts
          )
        }
      }
    }

    const filtered = filterWells(query)
    const start = (page - 1) * size
    return ok({
      rows: clone(filtered.slice(start, start + size)),
      total: filtered.length,
      page,
      size
    })
  })
}

/** 井位详情 */
export function fetchWellDetail(id: number): Promise<ApiResponse<Well>> {
  return delay(() => {
    const well = wells.find(w => w.id === id)
    if (!well) {
      throw new WellApiError(40404, '井位不存在或已被删除')
    }
    return ok(clone(well))
  })
}

/** 全部井位（下拉选择等入口使用，与列表/统计同一数据源，保证总数一致） */
export function fetchAllWells(): Promise<ApiResponse<Well[]>> {
  return delay(() => ok(clone(wells)))
}

/** 区块选项（由当前台账数据派生） */
export function fetchBlocks(): Promise<ApiResponse<string[]>> {
  return delay(() => {
    const set = new Set(wells.map(w => w.blockName).filter(Boolean))
    return ok(Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-CN')))
  })
}

/** 井位统计（驾驶舱等入口与列表使用同一数据源） */
export function fetchWellStatistics(): Promise<ApiResponse<WellStatistics>> {
  return delay(() => {
    const statusCounts: Record<string, number> = {}
    WELL_STATUSES.forEach(s => { statusCounts[s] = 0 })
    wells.forEach(w => {
      statusCounts[w.status] = (statusCounts[w.status] || 0) + 1
    })
    return ok({ total: wells.length, statusCounts })
  })
}

export interface WellSavePayload {
  id?: number | null
  wellCode: string
  wellName: string
  wellType: string
  blockName: string
  longitude: number | null
  latitude: number | null
  designDepth: number | null
  status: string
}

function validatePayload(payload: WellSavePayload, excludeId?: number) {
  const code = payload.wellCode?.trim()
  const name = payload.wellName?.trim()
  if (!code) throw new WellApiError(40001, '井号不能为空')
  if (!name) throw new WellApiError(40001, '井名不能为空')
  if (!payload.wellType || !WELL_TYPES.includes(payload.wellType as typeof WELL_TYPES[number])) {
    throw new WellApiError(40001, '请选择正确的井型')
  }
  if (payload.status && !WELL_STATUSES.includes(payload.status as typeof WELL_STATUSES[number])) {
    throw new WellApiError(40001, '请选择正确的状态')
  }
  const duplicated = wells.find(w => w.wellCode.toLowerCase() === code.toLowerCase() && w.id !== excludeId)
  if (duplicated) {
    throw new WellApiError(40902, `井号 ${code} 已存在（${duplicated.wellName}），不能重复登记`)
  }
  return { code, name }
}

/** 新增井位 */
export function createWell(payload: WellSavePayload): Promise<ApiResponse<Well>> {
  return delay(() => {
    const { code, name } = validatePayload(payload)
    const well: Well = {
      id: nextId++,
      wellCode: code,
      wellName: name,
      wellType: payload.wellType,
      blockName: payload.blockName?.trim() || '',
      longitude: payload.longitude,
      latitude: payload.latitude,
      designDepth: payload.designDepth,
      status: payload.status,
      createTime: nowString()
    }
    wells.unshift(well)
    return ok(clone(well))
  })
}

/** 编辑井位 */
export function updateWell(payload: WellSavePayload & { id: number }): Promise<ApiResponse<Well>> {
  return delay(() => {
    const index = wells.findIndex(w => w.id === payload.id)
    if (index === -1) {
      throw new WellApiError(40404, '井位不存在或已被删除，无法编辑')
    }
    const { code, name } = validatePayload(payload, payload.id)
    wells[index] = {
      ...wells[index],
      wellCode: code,
      wellName: name,
      wellType: payload.wellType,
      blockName: payload.blockName?.trim() || '',
      longitude: payload.longitude,
      latitude: payload.latitude,
      designDepth: payload.designDepth,
      status: payload.status
    }
    return ok(clone(wells[index]))
  })
}

/** 删除井位 */
export function removeWell(id: number): Promise<ApiResponse<{ id: number }>> {
  return delay(() => {
    const index = wells.findIndex(w => w.id === id)
    if (index === -1) {
      throw new WellApiError(40404, '井位不存在或已被删除，删除未执行')
    }
    wells.splice(index, 1)
    return ok({ id })
  })
}
