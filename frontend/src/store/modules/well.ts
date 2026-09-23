import { defineStore } from 'pinia'
import type {
  Well,
  WellQuery,
  WellListResult,
  WellStatistics,
  SearchScheme,
  ConflictDetail,
  WellListErrorType
} from '@/types/well'
import {
  fetchWellList,
  fetchWellDetail,
  fetchAllWells,
  fetchBlocks,
  fetchWellStatistics,
  createWell as serviceCreateWell,
  updateWell as serviceUpdateWell,
  removeWell,
  armNextListFailure,
  WellApiError
} from '@/mock/wellService'

const SCHEME_STORAGE_KEY = 'well-search-schemes'

interface WellState {
  /** 当前列表页数据 */
  rows: Well[]
  total: number
  page: number
  size: number
  loading: boolean
  /** 最近一次成功加载对应的查询条件（用于详情返回后恢复） */
  lastQuery: Partial<WellQuery>
  /** 请求失败类型：conflict=条件冲突，network=请求失败；null=正常 */
  errorType: WellListErrorType | null
  errorMessage: string
  conflicts: ConflictDetail[]
  /** 最近一次列表请求序号，用于丢弃过期响应（竞态保护） */
  requestSeq: number

  /** 全量井位（其它入口下拉等使用，与列表同一数据源） */
  allWells: Well[]
  allWellsLoading: boolean
  allWellsError: string
  /** 全量数据是否至少成功加载过一次，避免覆盖旧数据 */
  allWellsLoaded: boolean

  blocks: string[]

  statistics: WellStatistics | null
  statisticsLoading: boolean
  statisticsError: string

  schemes: SearchScheme[]
}

interface ListOptions {
  query?: Partial<WellQuery>
  page?: number
  size?: number
}

const emptyResult: WellListResult = { rows: [], total: 0, page: 1, size: 10 }

export const useWellStore = defineStore('well', {
  state: (): WellState => ({
    rows: [],
    total: 0,
    page: 1,
    size: 10,
    loading: false,
    lastQuery: {},
    errorType: null,
    errorMessage: '',
    conflicts: [],
    requestSeq: 0,

    allWells: [],
    allWellsLoading: false,
    allWellsError: '',
    allWellsLoaded: false,

    blocks: [],

    statistics: null,
    statisticsLoading: false,
    statisticsError: '',

    schemes: loadSchemes()
  }),

  getters: {},

  actions: {
    /**
     * 加载井位列表。
     * 失败时清空旧结果（重试不会沿用旧数据），并区分条件冲突 / 请求失败。
     * 过期响应一律丢弃，只有最后一次请求能写回页面。
     */
    async loadList(options: ListOptions = {}): Promise<boolean> {
      const query = options.query ?? this.lastQuery
      const page = options.page ?? this.page
      const size = options.size ?? this.size

      const seq = ++this.requestSeq
      this.loading = true
      try {
        const res = await fetchWellList({ ...query, page, size })
        if (seq !== this.requestSeq) return false

        const result = res.data ?? emptyResult
        this.rows = result.rows
        this.total = result.total
        this.page = result.page
        this.size = result.size
        this.lastQuery = { ...query }
        this.errorType = null
        this.errorMessage = ''
        this.conflicts = []
        return true
      } catch (err) {
        if (seq !== this.requestSeq) return false

        // 关键要求：失败后不得沿用旧结果
        this.rows = []
        this.total = 0
        this.conflicts = []

        if (err instanceof WellApiError && err.code === 40901) {
          this.errorType = 'conflict'
          this.errorMessage = err.message
          this.conflicts = err.conflicts || []
        } else {
          this.errorType = 'network'
          this.errorMessage = err instanceof Error ? err.message : '请求失败，请稍后重试'
        }
        return false
      } finally {
        if (seq === this.requestSeq) {
          this.loading = false
        }
      }
    },

    /** 演示用：让下一次列表请求失败（仅开发联调可见的入口调用） */
    simulateNextListFailure() {
      armNextListFailure()
    },

    async loadDetail(id: number): Promise<Well> {
      const res = await fetchWellDetail(id)
      return res.data
    },

    /** 加载全量井位；已加载过时刷新数据，失败则保留旧数据并给出提示 */
    async ensureAllWells(force = false): Promise<Well[]> {
      if (this.allWellsLoading || (this.allWellsLoaded && !force)) {
        return this.allWells
      }
      this.allWellsLoading = true
      this.allWellsError = ''
      try {
        const res = await fetchAllWells()
        this.allWells = res.data
        this.allWellsLoaded = true
        return this.allWells
      } catch (err) {
        this.allWellsError = err instanceof Error ? err.message : '井位数据加载失败'
        return this.allWells
      } finally {
        this.allWellsLoading = false
      }
    },

    async loadBlocks(): Promise<string[]> {
      try {
        const res = await fetchBlocks()
        this.blocks = res.data
        return this.blocks
      } catch {
        return this.blocks
      }
    },

    async loadStatistics(force = false): Promise<WellStatistics | null> {
      if (this.statisticsLoading || (this.statistics && !force)) {
        return this.statistics
      }
      this.statisticsLoading = true
      this.statisticsError = ''
      try {
        const res = await fetchWellStatistics()
        this.statistics = res.data
        return this.statistics
      } catch (err) {
        this.statisticsError = err instanceof Error ? err.message : '统计数据加载失败'
        return this.statistics
      } finally {
        this.statisticsLoading = false
      }
    },

    /** 新增；成功后全量/统计同源刷新 */
    async createWell(payload: Parameters<typeof serviceCreateWell>[0]): Promise<Well> {
      const res = await serviceCreateWell(payload)
      await Promise.all([this.ensureAllWells(true), this.loadBlocks(), this.loadStatistics(true)])
      return res.data
    },

    /** 编辑；成功后若列表中已有该行则同步更新，并刷新全量/统计 */
    async updateWell(payload: Parameters<typeof serviceUpdateWell>[0]): Promise<Well> {
      const res = await serviceUpdateWell(payload)
      const index = this.rows.findIndex(w => w.id === res.data.id)
      if (index !== -1) this.rows[index] = res.data
      await Promise.all([this.ensureAllWells(true), this.loadBlocks(), this.loadStatistics(true)])
      return res.data
    },

    async deleteWell(id: number): Promise<void> {
      await removeWell(id)
      await Promise.all([this.ensureAllWells(true), this.loadBlocks(), this.loadStatistics(true)])
    },

    // ---------- 可保存的组合检索方案（localStorage 持久化，跨会话保留） ----------

    saveScheme(name: string, query: Partial<WellQuery>): SearchScheme {
      const trimmed = name.trim()
      if (!trimmed) throw new Error('请输入方案名称')
      const scheme: SearchScheme = {
        name: trimmed,
        query: { ...query },
        savedAt: new Date().toISOString()
      }
      const index = this.schemes.findIndex(s => s.name === trimmed)
      if (index !== -1) {
        this.schemes[index] = scheme
      } else {
        this.schemes.unshift(scheme)
      }
      persistSchemes(this.schemes)
      return scheme
    },

    removeScheme(name: string) {
      this.schemes = this.schemes.filter(s => s.name !== name)
      persistSchemes(this.schemes)
    }
  }
})

function loadSchemes(): SearchScheme[] {
  try {
    const raw = localStorage.getItem(SCHEME_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistSchemes(schemes: SearchScheme[]) {
  try {
    localStorage.setItem(SCHEME_STORAGE_KEY, JSON.stringify(schemes))
  } catch {
    // 隐私模式等场景下降级为仅内存生效
  }
}
