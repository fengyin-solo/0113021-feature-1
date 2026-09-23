<template>
  <div class="well-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>井位管理</span>
          <div class="header-actions">
            <el-tooltip content="模拟下一次列表请求失败（用于验证失败提示与重试）" placement="top">
              <el-button @click="triggerMockFail">模拟网络异常</el-button>
            </el-tooltip>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>新增井位
            </el-button>
          </div>
        </div>
      </template>

      <!-- 组合检索：井号、井型、区块、状态可同时启用，逐步缩小范围 -->
      <el-form :model="queryForm" inline class="query-form">
        <el-form-item label="井号">
          <el-input
            v-model="queryForm.wellCode"
            placeholder="请输入井号关键字"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="井名">
          <el-input
            v-model="queryForm.wellName"
            placeholder="请输入井名关键字"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="井型">
          <el-select v-model="queryForm.wellType" placeholder="全部井型" clearable style="width: 150px">
            <el-option v-for="t in WELL_TYPES" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="区块">
          <el-select
            v-model="queryForm.blockName"
            placeholder="全部区块"
            clearable
            filterable
            allow-create
            style="width: 170px"
          >
            <el-option v-for="b in wellStore.blockOptions" :key="b" :label="b" :value="b" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部状态" clearable style="width: 150px">
            <el-option v-for="s in WELL_STATUSES" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><RefreshLeft /></el-icon>重置
          </el-button>
          <el-dropdown trigger="click" @command="handleSchemeCommand">
            <el-button>
              <el-icon><Star /></el-icon>保存/调用方案<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="save">保存当前组合条件…</el-dropdown-item>
                <el-dropdown-item v-if="wellStore.schemes.length" divided disabled>
                  已保存方案（{{ wellStore.schemes.length }}）
                </el-dropdown-item>
                <el-dropdown-item
                  v-for="scheme in wellStore.schemes"
                  :key="scheme.id"
                  :command="`apply:${scheme.id}`"
                >
                  <div class="scheme-item">
                    <span>{{ scheme.name }}</span>
                    <span class="scheme-desc">{{ describeScheme(scheme.query) }}</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item
                  v-for="scheme in wellStore.schemes"
                  :key="`del-${scheme.id}`"
                  :command="`delete:${scheme.id}`"
                  class="scheme-delete"
                >
                  <el-icon><Delete /></el-icon>删除「{{ scheme.name }}」
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-form-item>
      </el-form>

      <!-- 当前生效条件：支持逐个移除，逐步放宽范围 -->
      <div v-if="activeConditions.length" class="active-conditions">
        <span class="active-label">当前条件：</span>
        <el-tag
          v-for="cond in activeConditions"
          :key="cond.key"
          closable
          type="primary"
          effect="light"
          @close="removeCondition(cond.key)"
        >
          {{ cond.label }}：{{ cond.value }}
        </el-tag>
        <span class="active-count">共匹配 {{ wellStore.total }} 口井（台账总计 {{ wellStore.totalAll }} 口）</span>
      </div>

      <el-table
        :data="wellStore.list"
        border
        stripe
        style="width: 100%"
        v-loading="wellStore.loading"
        :empty-text="tableEmptyText"
      >
        <el-table-column prop="wellCode" label="井号" width="120" />
        <el-table-column prop="wellName" label="井名" width="120" />
        <el-table-column prop="wellType" label="井型" width="100" />
        <el-table-column prop="blockName" label="区块" width="120" />
        <el-table-column prop="longitude" label="经度" width="120" />
        <el-table-column prop="latitude" label="纬度" width="120" />
        <el-table-column prop="designDepth" label="设计井深(m)" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleView(row)">查看</el-button>
            <el-button type="primary" size="small" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 请求失败：清空旧结果并说明原因，重试成功后才展示新数据 -->
      <el-alert
        v-if="wellStore.error"
        type="error"
        show-icon
        :closable="false"
        class="mt-20"
      >
        <template #default>
          <div class="error-bar">
            <span>{{ wellStore.error }}</span>
            <el-button type="primary" size="small" :loading="wellStore.loading" @click="reload">重试</el-button>
          </div>
        </template>
      </el-alert>

      <!-- 无匹配/条件冲突：说明是哪些条件叠加导致，并给出放宽建议 -->
      <el-alert
        v-else-if="!wellStore.loading && wellStore.loaded && wellStore.total === 0"
        :title="emptyAlertTitle"
        :description="emptyAnalysis.suggestion"
        :type="activeConditions.length >= 2 ? 'warning' : 'info'"
        show-icon
        :closable="false"
        class="mt-20"
      >
        <div v-if="emptyAnalysis.suggestions.length" class="empty-suggestions">
          <span>可尝试：</span>
          <el-button
            v-for="s in emptyAnalysis.suggestions"
            :key="s.key"
            size="small"
            link
            type="primary"
            @click="removeCondition(s.key)"
          >
            去掉「{{ s.label }}」（{{ s.count }} 口）
          </el-button>
        </div>
      </el-alert>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="wellStore.total"
        :page-sizes="PAGE_SIZE_OPTIONS"
        layout="total, sizes, prev, pager, next, jumper"
        class="mt-20"
      />
    </el-card>

    <!-- 新增/编辑弹窗（沿用原台账编辑流程） -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false">
      <el-form :model="wellForm" :rules="wellRules" ref="wellFormRef" label-width="100px">
        <el-form-item label="井号" prop="wellCode">
          <el-input v-model="wellForm.wellCode" placeholder="请输入井号" />
        </el-form-item>
        <el-form-item label="井名" prop="wellName">
          <el-input v-model="wellForm.wellName" placeholder="请输入井名" />
        </el-form-item>
        <el-form-item label="井型" prop="wellType">
          <el-select v-model="wellForm.wellType" placeholder="请选择井型" style="width: 100%">
            <el-option v-for="t in WELL_TYPES" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="区块" prop="blockName">
          <el-input v-model="wellForm.blockName" placeholder="请输入区块" />
        </el-form-item>
        <el-form-item label="经度" prop="longitude">
          <el-input-number v-model="wellForm.longitude" :precision="6" style="width: 100%" />
        </el-form-item>
        <el-form-item label="纬度" prop="latitude">
          <el-input-number v-model="wellForm.latitude" :precision="6" style="width: 100%" />
        </el-form-item>
        <el-form-item label="设计井深" prop="designDepth">
          <el-input-number v-model="wellForm.designDepth" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="wellForm.status" placeholder="请选择状态" style="width: 100%">
            <el-option v-for="s in WELL_STATUSES" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗：返回列表时恢复条件、分页与滚动位置 -->
    <WellDetailDialog v-model="detailVisible" :well-id="detailId" @back="restoreScroll" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus'
import { useWellStore } from '@/store/modules/well'
import {
  WellQuery,
  WellRecord,
  emptyQuery,
  WELL_TYPES,
  WELL_STATUSES,
  PAGE_SIZE_OPTIONS
} from './constants'
import { getActiveConditions, analyzeEmpty, matchWell } from './query'
import WellDetailDialog from './WellDetailDialog.vue'

const route = useRoute()
const router = useRouter()
const wellStore = useWellStore()

const queryForm = reactive<WellQuery>({ ...emptyQuery() })

const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const wellFormRef = ref<FormInstance>()

const detailVisible = ref(false)
const detailId = ref<number | null>(null)

// 与 store 双向绑定，分页变化自动持久化并重新查询
const currentPage = computed({
  get: () => wellStore.page,
  set: (val: number) => wellStore.setPage(val)
})
const pageSize = computed({
  get: () => wellStore.size,
  set: (val: number) => wellStore.setSize(val)
})

// 查询/重置会主动把页码复位为 1，由此触发的分页 watcher 需要抑制，避免冗余请求
let paginationMuted = false
watch([currentPage, pageSize], () => {
  if (paginationMuted) return
  reload()
})

const activeConditions = computed(() => getActiveConditions(queryForm))

const emptyAnalysis = computed(() => analyzeEmpty(wellStore.wells, queryForm))

// 条件冲突提示：多个条件叠加无结果时明确说明
const emptyAlertTitle = computed(() => {
  if (activeConditions.value.length >= 2) {
    const names = activeConditions.value.map((c) => c.label).join('、')
    return `条件冲突或无匹配：${names} 同时满足时没有井位，请移除或放宽某个条件`
  }
  return emptyAnalysis.value.reason
})

const tableEmptyText = computed(() => {
  if (wellStore.loading) return '正在查询…'
  if (wellStore.error) return '请求失败，请重试'
  if (!wellStore.loaded) return ''
  return '暂无符合条件的井位'
})

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    生产中: 'success',
    钻井中: 'primary',
    待修井: 'warning',
    关停井: 'danger'
  }
  return map[status] || 'info'
}

const describeScheme = (query: WellQuery) => {
  const conds = getActiveConditions(query)
  return conds.length ? conds.map((c) => c.value).join(' / ') : '全部井位'
}

// ---------- 查询与恢复 ----------

const scrollContainer = (): HTMLElement | null => {
  const el = document.querySelector('.layout-container .el-main') as HTMLElement | null
  return el || document.querySelector('.el-main')
}

// 节流保存滚动位置，避免频繁写入 sessionStorage
let scrollTimer: ReturnType<typeof setTimeout> | null = null
const saveScroll = () => {
  if (scrollTimer) return
  scrollTimer = setTimeout(() => {
    scrollTimer = null
    const el = scrollContainer()
    if (el) wellStore.setScrollTop(el.scrollTop)
  }, 150)
}

const flushScroll = () => {
  if (scrollTimer) {
    clearTimeout(scrollTimer)
    scrollTimer = null
  }
  const el = scrollContainer()
  if (el) wellStore.setScrollTop(el.scrollTop)
}

const restoreScroll = () => {
  nextTick(() => {
    const el = scrollContainer()
    if (el && wellStore.scrollTop) el.scrollTop = wellStore.scrollTop
  })
}

// 分页变化与显式查询可能同帧发生，收敛同帧重复请求；在途期间的变更会在完成后补查
let fetching = false
let pending = false
const reload = async () => {
  if (fetching) {
    pending = true
    return
  }
  fetching = true
  saveScroll()
  try {
    await wellStore.fetchWells()
    syncUrl()
    restoreScroll()
  } catch {
    // 失败原因已写入 store 并在页面展示，这里无需再处理
  } finally {
    fetching = false
  }
  if (pending) {
    pending = false
    reload()
  }
}

const syncFormFromStore = () => {
  Object.assign(queryForm, wellStore.query)
}

const syncUrl = () => {
  const params: Record<string, string> = {}
  const q = wellStore.query
  if (q.wellCode.trim()) params.wellCode = q.wellCode.trim()
  if (q.wellName.trim()) params.wellName = q.wellName.trim()
  if (q.wellType) params.wellType = q.wellType
  if (q.blockName) params.blockName = q.blockName
  if (q.status) params.status = q.status
  if (wellStore.page > 1) params.page = String(wellStore.page)
  const query = new URLSearchParams(params).toString()
  router.replace({ path: '/well', query: query ? Object.fromEntries(new URLSearchParams(query)) : {} })
}

const applyQuery = async (query: WellQuery, options: { resetPage?: boolean; pushUrl?: boolean } = {}) => {
  const { resetPage = true, pushUrl = true } = options
  const next = { ...emptyQuery(), ...query }
  Object.assign(queryForm, next)
  // setQuery/setSize 会把页码复位到 1，抑制随之触发的分页 watcher
  paginationMuted = true
  if (resetPage) wellStore.setQuery(next)
  else wellStore.query = next
  if (pushUrl) syncUrl()
  await nextTick()
  paginationMuted = false
  await reload()
}

const handleSearch = () => {
  applyQuery({ ...queryForm })
}

const handleReset = () => {
  applyQuery(emptyQuery())
}

const removeCondition = (key: keyof WellQuery) => {
  const next = { ...queryForm, [key]: '' }
  applyQuery(next)
}

// ---------- 保存方案 ----------

const handleSchemeCommand = async (command: string) => {
  if (command === 'save') {
    try {
      const { value } = await ElMessageBox.prompt('请输入检索方案名称', '保存组合条件', {
        confirmButtonText: '保存',
        cancelButtonText: '取消',
        inputValue: `方案${wellStore.schemes.length + 1}`,
        inputValidator: (val) => !!val?.trim() || '方案名称不能为空'
      })
      wellStore.saveScheme(value!.trim(), { ...queryForm })
      ElMessage.success(`检索方案「${value!.trim()}」已保存`)
    } catch {
      // 用户取消输入
    }
    return
  }

  const [action, idStr] = command.split(':')
  const id = Number(idStr)
  const scheme = wellStore.schemes.find((s) => s.id === id)
  if (!scheme) return

  if (action === 'apply') {
    ElMessage.success(`已调用方案「${scheme.name}」`)
    applyQuery(scheme.query)
  } else if (action === 'delete') {
    try {
      await ElMessageBox.confirm(`确定删除检索方案「${scheme.name}」吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      wellStore.deleteScheme(scheme.id)
      ElMessage.success('方案已删除')
    } catch {
      // 用户取消
    }
  }
}

// ---------- 新增 / 编辑 / 删除 / 查看 ----------

const wellForm = reactive({
  id: null as number | null,
  wellCode: '',
  wellName: '',
  wellType: '',
  blockName: '',
  longitude: null as number | null,
  latitude: null as number | null,
  designDepth: null as number | null,
  status: ''
})

const wellRules = {
  wellCode: [
    { required: true, message: '请输入井号', trigger: 'blur' },
    {
      validator: (_rule: unknown, value: string, callback: (err?: Error) => void) => {
        if (value && wellStore.wellCodeExists(value.trim(), wellForm.id ?? undefined)) {
          callback(new Error('该井号已存在，请使用其他井号'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  wellName: [{ required: true, message: '请输入井名', trigger: 'blur' }],
  wellType: [{ required: true, message: '请选择井型', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const resetWellForm = () => {
  Object.assign(wellForm, {
    id: null,
    wellCode: '',
    wellName: '',
    wellType: '',
    blockName: '',
    longitude: null,
    latitude: null,
    designDepth: null,
    status: ''
  })
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增井位'
  resetWellForm()
  dialogVisible.value = true
}

const handleEdit = (row: WellRecord) => {
  flushScroll()
  isEdit.value = true
  dialogTitle.value = '编辑井位'
  Object.assign(wellForm, {
    id: row.id,
    wellCode: row.wellCode,
    wellName: row.wellName,
    wellType: row.wellType,
    blockName: row.blockName,
    longitude: row.longitude,
    latitude: row.latitude,
    designDepth: row.designDepth,
    status: row.status
  })
  dialogVisible.value = true
}

const handleView = (row: WellRecord) => {
  flushScroll()
  detailId.value = row.id
  detailVisible.value = true
}

const handleDelete = (row: WellRecord) => {
  ElMessageBox.confirm(`确定要删除 ${row.wellName}（${row.wellCode}）吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      wellStore.removeWell(row.id)
      ElMessage.success('删除成功')
      await reload()
    })
    .catch(() => {})
}

const handleSubmit = () => {
  if (!wellFormRef.value) return
  wellFormRef.value.validate(async (valid) => {
    if (!valid) return
    const payload = {
      wellCode: wellForm.wellCode.trim(),
      wellName: wellForm.wellName.trim(),
      wellType: wellForm.wellType,
      blockName: wellForm.blockName.trim(),
      longitude: wellForm.longitude,
      latitude: wellForm.latitude,
      designDepth: wellForm.designDepth,
      status: wellForm.status
    }

    if (isEdit.value && wellForm.id !== null) {
      const original = wellStore.getWellById(wellForm.id)
      wellStore.updateWell({
        id: wellForm.id,
        ...payload,
        createTime: original?.createTime || ''
      })
      ElMessage.success('编辑成功')
      dialogVisible.value = false
      // 编辑后按当前条件重新检索；若该井不再满足条件会如实从结果中消失
      await reload()
    } else {
      const created = wellStore.addWell(payload)
      dialogVisible.value = false
      ElMessage.success('新增成功')
      // 新增后按当前组合条件重新检索；不满足条件时如实提示
      if (!matchWell(created, wellStore.query)) {
        ElMessage.info('新井位不满足当前组合条件，重置条件后即可查看')
      }
      await reload()
    }
  })
}

// 用于页面上验证失败链路
const triggerMockFail = () => {
  wellStore.mockFailNext = true
  reload()
}

// ---------- 初始化：URL 入口 / 会话恢复 ----------

const buildQueryFromRoute = (): { query: WellQuery; page: number } | null => {
  const q = route.query
  const next = emptyQuery()
  let hasFilter = false
  const readStr = (key: string): string => {
    const val = q[key]
    if (typeof val === 'string' && val.trim()) {
      hasFilter = true
      return val.trim()
    }
    return ''
  }
  next.wellCode = readStr('wellCode')
  next.wellName = readStr('wellName')
  next.wellType = readStr('wellType')
  next.blockName = readStr('blockName')
  next.status = readStr('status')
  const routePage = Number(q.page)
  if (hasFilter || routePage > 0) {
    return { query: next, page: routePage > 0 ? routePage : 1 }
  }
  return null
}

const onScroll = () => saveScroll()

onMounted(async () => {
  const el = scrollContainer()
  el?.addEventListener('scroll', onScroll, { passive: true })

  // 默认恢复上次会话（条件、分页、滚动位置）
  syncFormFromStore()

  // URL 显式带条件的入口（如驾驶舱按状态跳转、外部分享链接）优先
  const entry = buildQueryFromRoute()
  if (entry) {
    Object.assign(queryForm, entry.query)
    wellStore.query = { ...entry.query }
    wellStore.page = entry.page
    syncUrl()
  }
  await reload()
  restoreScroll()
})

onBeforeUnmount(() => {
  flushScroll()
  const el = scrollContainer()
  el?.removeEventListener('scroll', onScroll)
})

// 已在本页面时，外部入口（如驾驶舱卡片）带条件跳转过来也能即时响应
watch(
  () => route.query,
  async (val, oldVal) => {
    if (!val || JSON.stringify(val) === JSON.stringify(oldVal || {})) return
    // 本页面自身写入的 URL 与 store 一致，仅响应外部进入的新条件
    const entry = buildQueryFromRoute()
    if (!entry) return
    const sameQuery = JSON.stringify(entry.query) === JSON.stringify(wellStore.query)
    const samePage = entry.page === wellStore.page
    if (sameQuery && samePage) return
    Object.assign(queryForm, entry.query)
    wellStore.query = { ...entry.query }
    wellStore.page = entry.page
    await reload()
  }
)
</script>

<style scoped lang="scss">
.well-container {
  width: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.query-form {
  margin-bottom: 0;
}

.active-conditions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 4px 0 16px;

  .active-label {
    font-size: 13px;
    color: #64748b;
  }

  .active-count {
    margin-left: auto;
    font-size: 13px;
    color: #64748b;
  }
}

.mt-20 {
  margin-top: 20px;
}

.error-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.empty-suggestions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin-top: 6px;
}

.scheme-item {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .scheme-desc {
    font-size: 12px;
    color: #94a3b8;
  }
}

:deep(.scheme-delete) {
  color: #ef4444;
}
</style>
