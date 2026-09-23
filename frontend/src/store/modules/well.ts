import { defineStore } from 'pinia'
import {
  WellRecord,
  WellQuery,
  SearchScheme,
  emptyQuery,
  PAGE_SIZE_OPTIONS
} from '@/views/well/constants'
import { filterWells } from '@/views/well/query'

const WELL_DATA_KEY = 'well_ledger_data_v1'
const QUERY_SESSION_KEY = 'well_query_session_v1'
const SCHEMES_KEY = 'well_search_schemes_v1'

// 初始井位数据：与历史台账完全一致，已有井位数据不受影响
const SEED_WELLS: WellRecord[] = [
  { id: 1, wellCode: 'A-001', wellName: 'A-01井', wellType: '开发井', blockName: '胜利油田', longitude: 118.5236, latitude: 38.2356, designDepth: 3500, status: '生产中', createTime: '2024-01-01 10:00:00' },
  { id: 2, wellCode: 'B-003', wellName: 'B-03井', wellType: '探井', blockName: '胜利油田', longitude: 118.8562, latitude: 38.5123, designDepth: 4200, status: '钻井中', createTime: '2024-01-02 14:30:00' },
  { id: 3, wellCode: 'C-002', wellName: 'C-02井', wellType: '开发井', blockName: '胜利油田', longitude: 119.1254, latitude: 38.3456, designDepth: 3800, status: '生产中', createTime: '2024-01-03 09:15:00' },
  { id: 4, wellCode: 'D-005', wellName: 'D-05井', wellType: '评价井', blockName: '胜利油田', longitude: 118.6587, latitude: 38.7895, designDepth: 4000, status: '待修井', createTime: '2024-01-04 16:45:00' },
  { id: 5, wellCode: 'E-001', wellName: 'E-01井', wellType: '开发井', blockName: '胜利油田', longitude: 118.9563, latitude: 38.4562, designDepth: 3600, status: '关停井', createTime: '2024-01-05 11:20:00' }
]

interface QuerySession {
  query: WellQuery
  page: number
  size: number
  scrollTop: number
}

interface FetchResult {
  list: WellRecord[]
  total: number
  page: number
  size: number
  totalAll: number
}

// 请求序号：只接受最新一次请求的结果，防止慢响应覆盖新条件结果
let requestSeq = 0

const loadWellData = (): WellRecord[] => {
  try {
    const raw = localStorage.getItem(WELL_DATA_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed as WellRecord[]
    }
  } catch {
    // 本地数据损坏时回退到初始数据
  }
  return SEED_WELLS.map((w) => ({ ...w }))
}

const loadSchemes = (): SearchScheme[] => {
  try {
    const raw = localStorage.getItem(SCHEMES_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed as SearchScheme[]
    }
  } catch {
    // 忽略损坏的本地方案
  }
  return []
}

const defaultSession = (): QuerySession => ({
  query: emptyQuery(),
  page: 1,
  size: 10,
  scrollTop: 0
})

const loadSession = (): QuerySession => {
  try {
    const raw = sessionStorage.getItem(QUERY_SESSION_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        query: { ...emptyQuery(), ...(parsed.query || {}) },
        page: Number(parsed.page) > 0 ? Number(parsed.page) : 1,
        size: PAGE_SIZE_OPTIONS.includes(Number(parsed.size)) ? Number(parsed.size) : 10,
        scrollTop: Number(parsed.scrollTop) || 0
      }
    }
  } catch {
    // 忽略损坏的会话
  }
  return defaultSession()
}

export const useWellStore = defineStore('well', {
  state: () => ({
    // 井位主数据（编辑、删除、新增直接作用于此，台账原流程保持一致）
    wells: loadWellData(),
    // 列表页当前展示结果与状态
    list: [] as WellRecord[],
    total: 0,
    totalAll: 0,
    query: loadSession().query,
    page: loadSession().page,
    size: loadSession().size,
    scrollTop: loadSession().scrollTop,
    loading: false,
    error: '' as string,
    loaded: false,
    // 可保存的命名检索方案
    schemes: loadSchemes(),
    // 用于演示请求失败：开启后下一次列表请求会失败
    mockFailNext: false
  }),

  getters: {
    blockOptions: (state): string[] => {
      const set = new Set<string>()
      state.wells.forEach((w) => {
        if (w.blockName) set.add(w.blockName)
      })
      return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-CN'))
    },
    // 不同入口（驾驶舱、台账列表）统一从这里取数，保证总数一致
    statistics: (state) => {
      const countByStatus = (status: string) =>
        state.wells.filter((w) => w.status === status).length
      return {
        wellCount: state.wells.length,
        drillingCount: countByStatus('钻井中'),
        productionCount: countByStatus('生产中'),
        maintenanceCount: countByStatus('待修井'),
        shutdownCount: countByStatus('关停井')
      }
    },
    getWellById: (state) => (id: number) => state.wells.find((w) => w.id === id)
  },

  actions: {
    persistWells() {
      localStorage.setItem(WELL_DATA_KEY, JSON.stringify(this.wells))
    },
    persistSchemes() {
      localStorage.setItem(SCHEMES_KEY, JSON.stringify(this.schemes))
    },
    persistSession() {
      const session: QuerySession = {
        query: this.query,
        page: this.page,
        size: this.size,
        scrollTop: this.scrollTop
      }
      sessionStorage.setItem(QUERY_SESSION_KEY, JSON.stringify(session))
    },

    setQuery(query: WellQuery) {
      this.query = { ...query }
      this.page = 1
      this.persistSession()
    },
    setPage(page: number) {
      this.page = page
      this.persistSession()
    },
    setSize(size: number) {
      this.size = size
      this.page = 1
      this.persistSession()
    },
    setScrollTop(scrollTop: number) {
      this.scrollTop = scrollTop
      this.persistSession()
    },

    // 模拟后端列表接口：组合过滤 + 分页。每次请求都返回新结果，
    // 失败时抛出，由调用方展示原因并重试；过期响应会被丢弃。
    async fetchWells(): Promise<FetchResult> {
      const seq = ++requestSeq
      this.loading = true
      this.error = ''
      // 关键：请求一旦开始，旧结果立即下线，避免失败/重试时沿用旧结果
      this.list = []
      this.persistSession()

      const shouldFail = this.mockFailNext
      if (shouldFail) this.mockFailNext = false

      await new Promise((resolve) => setTimeout(resolve, 400))

      if (shouldFail) {
        if (seq === requestSeq) {
          this.loading = false
          this.error = '井位列表请求失败（网络异常或服务不可用），请检查网络后点击「重试」'
          this.total = 0
        }
        throw new Error('请求失败')
      }

      const matched = filterWells(this.wells, this.query)
      const total = matched.length
      // 删除数据等场景下当前页可能越界，收敛到最后一个有效页
      const maxPage = Math.max(1, Math.ceil(total / this.size) || 1)
      if (this.page > maxPage) this.page = maxPage

      const start = (this.page - 1) * this.size
      const pageList = matched.slice(start, start + this.size)

      // 只接受最后一次请求的结果，杜绝慢响应覆盖新条件
      if (seq !== requestSeq) {
        throw new Error('stale response')
      }

      this.list = pageList
      this.total = total
      this.totalAll = this.wells.length
      this.loading = false
      this.loaded = true
      this.persistSession()
      return { list: pageList, total, page: this.page, size: this.size, totalAll: this.totalAll }
    },

    saveScheme(name: string, query: WellQuery) {
      const now = new Date().toLocaleString('zh-CN', { hour12: false })
      const existing = this.schemes.find((s) => s.name === name)
      if (existing) {
        existing.query = { ...query }
        existing.updatedAt = now
      } else {
        this.schemes.unshift({
          id: Date.now(),
          name,
          query: { ...query },
          updatedAt: now
        })
      }
      this.persistSchemes()
    },
    deleteScheme(id: number) {
      this.schemes = this.schemes.filter((s) => s.id !== id)
      this.persistSchemes()
    },

    nextId() {
      return this.wells.reduce((max, w) => Math.max(max, w.id), 0) + 1
    },
    wellCodeExists(code: string, excludeId?: number) {
      return this.wells.some((w) => w.wellCode === code && w.id !== excludeId)
    },
    addWell(data: Omit<WellRecord, 'id' | 'createTime'>) {
      const well: WellRecord = {
        ...data,
        id: this.nextId(),
        createTime: new Date()
          .toLocaleString('zh-CN', { hour12: false })
          .replace(/\//g, '-')
      }
      this.wells.unshift(well)
      this.persistWells()
      return well
    },
    updateWell(data: WellRecord) {
      const index = this.wells.findIndex((w) => w.id === data.id)
      if (index !== -1) {
        this.wells[index] = { ...data }
        this.persistWells()
      }
    },
    removeWell(id: number) {
      this.wells = this.wells.filter((w) => w.id !== id)
      this.persistWells()
    }
  }
})
