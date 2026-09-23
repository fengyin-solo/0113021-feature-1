<template>
  <div class="well-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>井位管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增井位
          </el-button>
        </div>
      </template>

      <el-form :model="queryForm" inline class="query-form" @submit.prevent>
        <el-form-item label="井号">
          <el-input
            v-model="queryForm.wellCode"
            placeholder="请输入井号"
            clearable
            style="width: 160px"
            @keyup.enter="handleQuery"
            @clear="handleQuery"
          />
        </el-form-item>
        <el-form-item label="井名">
          <el-input
            v-model="queryForm.wellName"
            placeholder="请输入井名"
            clearable
            style="width: 160px"
            @keyup.enter="handleQuery"
            @clear="handleQuery"
          />
        </el-form-item>
        <el-form-item label="井型">
          <el-select
            v-model="queryForm.wellType"
            placeholder="全部井型"
            clearable
            style="width: 130px"
            @change="handleQuery"
          >
            <el-option v-for="t in wellTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="区块">
          <el-select
            v-model="queryForm.blockName"
            placeholder="全部区块"
            clearable
            filterable
            style="width: 150px"
            @change="handleQuery"
          >
            <el-option v-for="b in wellStore.blocks" :key="b" :label="b" :value="b" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryForm.status"
            placeholder="全部状态"
            clearable
            style="width: 130px"
            @change="handleQuery"
          >
            <el-option v-for="s in wellStatuses" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button @click="handleSaveScheme">
            <el-icon><Star /></el-icon>保存检索
          </el-button>
          <el-dropdown trigger="click" @command="handleSchemeCommand">
            <el-button>
              已保存检索<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="scheme in wellStore.schemes"
                  :key="scheme.name"
                  :command="{ action: 'apply', name: scheme.name }"
                >
                  <div class="scheme-item">
                    <span class="scheme-name">{{ scheme.name }}</span>
                    <el-icon
                      class="scheme-delete"
                      title="删除该检索方案"
                      @click.stop="handleDeleteScheme(scheme.name)"
                    ><Delete /></el-icon>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item v-if="wellStore.schemes.length === 0" disabled>
                  暂无保存的检索方案
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-form-item>
      </el-form>

      <!-- 活动筛选条件：可逐项移除 -->
      <div v-if="activeFilterTags.length > 0" class="active-filters">
        <span class="active-filters-label">已选条件：</span>
        <el-tag
          v-for="filter in activeFilterTags"
          :key="filter.field"
          closable
          size="small"
          class="filter-tag"
          @close="removeFilter(filter.field)"
        >
          {{ filter.label }}：{{ filter.value }}
        </el-tag>
      </div>

      <!-- 条件冲突：井号存在但与井型/区块/状态矛盾 -->
      <el-alert
        v-if="wellStore.errorType === 'conflict'"
        type="error"
        show-icon
        :closable="false"
        class="result-alert"
      >
        <template #title>
          <div class="alert-title">{{ wellStore.errorMessage }}</div>
        </template>
        <div class="conflict-body">
          <div v-for="c in wellStore.conflicts" :key="c.field" class="conflict-line">
            <el-tag type="danger" size="small">{{ c.fieldLabel }}</el-tag>
            条件为「{{ c.expected }}」，但该井实际为「{{ c.actual }}」
          </div>
          <div class="alert-actions">
            <el-button type="primary" size="small" @click="clearConflictFilters">
              清除冲突条件后查询
            </el-button>
            <el-button size="small" @click="retry">保留条件重试</el-button>
          </div>
        </div>
      </el-alert>

      <!-- 请求失败：旧结果已清空，重试发起全新请求 -->
      <el-alert
        v-else-if="wellStore.errorType === 'network'"
        type="error"
        show-icon
        :closable="false"
        class="result-alert"
        :title="`${wellStore.errorMessage}。当前列表数据已清空，请检查网络后重试。`"
      >
        <div class="alert-actions">
          <el-button type="primary" size="small" :loading="wellStore.loading" @click="retry">
            重新查询
          </el-button>
        </div>
      </el-alert>

      <el-table :data="wellStore.rows" border stripe style="width: 100%" v-loading="wellStore.loading">
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
        <template #empty>
          <el-empty
            v-if="!wellStore.loading && wellStore.errorType === null"
            description="未找到符合条件的井位，请放宽或调整井号、井型、区块、状态条件后再试"
          >
            <el-button type="primary" size="small" @click="handleReset">清空全部条件</el-button>
          </el-empty>
        </template>
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="wellStore.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        class="mt-20"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />

      <div class="dev-tools">
        <el-button link type="info" size="small" @click="handleSimulateFailure">
          模拟下一次请求失败（演示失败与重试）
        </el-button>
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="wellForm" :rules="wellRules" ref="wellFormRef" label-width="100px">
        <el-form-item label="井号" prop="wellCode">
          <el-input v-model="wellForm.wellCode" placeholder="请输入井号" />
        </el-form-item>
        <el-form-item label="井名" prop="wellName">
          <el-input v-model="wellForm.wellName" placeholder="请输入井名" />
        </el-form-item>
        <el-form-item label="井型" prop="wellType">
          <el-select v-model="wellForm.wellType" placeholder="请选择井型" style="width: 100%">
            <el-option v-for="t in wellTypes" :key="t" :label="t" :value="t" />
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
            <el-option v-for="s in wellStatuses" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus'
import { useWellStore } from '@/store/modules/well'
import { WELL_TYPES, WELL_STATUSES, STATUS_TAG_TYPE } from '@/constants/well'
import type { Well, WellQuery } from '@/types/well'

const route = useRoute()
const router = useRouter()
const wellStore = useWellStore()

const wellTypes = WELL_TYPES
const wellStatuses = WELL_STATUSES

const LIST_QUERY_STORAGE = 'well-list-query'
const SCROLL_STORAGE = 'well-list-scroll'

const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const wellFormRef = ref<FormInstance>()

const queryForm = reactive({
  wellCode: '',
  wellName: '',
  wellType: '',
  blockName: '',
  status: ''
})

const currentPage = ref(1)
const pageSize = ref(10)

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
  wellCode: [{ required: true, message: '请输入井号', trigger: 'blur' }],
  wellName: [{ required: true, message: '请输入井名', trigger: 'blur' }],
  wellType: [{ required: true, message: '请选择井型', trigger: 'change' }]
}

const getStatusType = (status: string) => STATUS_TAG_TYPE[status] || 'info'

// ---------- URL 查询参数：条件与分页的唯一可分享/可恢复载体 ----------

const QUERY_FIELDS = ['wellCode', 'wellName', 'wellType', 'blockName', 'status'] as const

/** 当前已应用的筛选条件标签（始终与地址栏 / 表单一致，失败或冲突时也如实展示） */
const activeFilterTags = computed(() => {
  const labelsMap: Record<string, string> = {
    wellCode: '井号',
    wellName: '井名',
    wellType: '井型',
    blockName: '区块',
    status: '状态'
  }
  return QUERY_FIELDS
    .filter(field => queryForm[field])
    .map(field => ({ field, label: labelsMap[field], value: queryForm[field] }))
})

const readString = (value: unknown): string => {
  if (Array.isArray(value)) return value[0] || ''
  return typeof value === 'string' ? value : ''
}

const parseRouteQuery = () => ({
  wellCode: readString(route.query.wellCode),
  wellName: readString(route.query.wellName),
  wellType: readString(route.query.wellType),
  blockName: readString(route.query.blockName),
  status: readString(route.query.status),
  page: Math.max(1, parseInt(readString(route.query.page), 10) || 1),
  size: Math.max(1, parseInt(readString(route.query.size), 10) || 10)
})

/** 将条件 + 分页写回地址栏；条件与当前一致时直接重新请求（如点击“查询”） */
const navigateQuery = (
  query: Partial<WellQuery>,
  options: { page?: number; size?: number } = {}
) => {
  const target: Record<string, string> = {}
  QUERY_FIELDS.forEach(field => {
    const value = (query[field] || '').trim()
    if (value) target[field] = value
  })
  target.page = String(options.page ?? 1)
  target.size = String(options.size ?? pageSize.value)

  // 用解析后的对象比较，规避中文百分号编码差异
  const current: Record<string, string> = {}
  Object.keys(route.query).forEach(key => {
    const v = route.query[key]
    current[key] = Array.isArray(v) ? (v[0] || '') : (typeof v === 'string' ? v : '')
  })
  const sameKeys = Object.keys(target).every(k => current[k] === target[k])
  const sameLength = Object.keys(current).every(k => target[k] === current[k])
  if (sameKeys && sameLength) {
    // 参数未变化（如重复点击查询/重试）：直接发新请求，不依赖旧结果
    wellStore.loadList({ query, page: Number(target.page), size: Number(target.size) })
    return
  }
  router.push({ path: '/well', query: target })
}

/** 地址栏 → 表单/分页 → 数据。分页、详情返回、浏览器前进后退都走这里 */
const syncFromRoute = async () => {
  const parsed = parseRouteQuery()
  queryForm.wellCode = parsed.wellCode
  queryForm.wellName = parsed.wellName
  queryForm.wellType = parsed.wellType
  queryForm.blockName = parsed.blockName
  queryForm.status = parsed.status
  currentPage.value = parsed.page
  pageSize.value = parsed.size

  sessionStorage.setItem(LIST_QUERY_STORAGE, JSON.stringify(route.query))

  await wellStore.loadList({
    query: {
      wellCode: parsed.wellCode,
      wellName: parsed.wellName,
      wellType: parsed.wellType,
      blockName: parsed.blockName,
      status: parsed.status
    },
    page: parsed.page,
    size: parsed.size
  })
  await restoreScroll()
}

const handleQuery = () => {
  navigateQuery({ ...queryForm }, { page: 1, size: pageSize.value })
}

const handleReset = () => {
  Object.assign(queryForm, { wellCode: '', wellName: '', wellType: '', blockName: '', status: '' })
  navigateQuery({}, { page: 1, size: pageSize.value })
}

const retry = () => {
  // 按地址栏当前条件（而非上次成功的旧条件）重新发起请求
  const parsed = parseRouteQuery()
  wellStore.loadList({
    query: {
      wellCode: parsed.wellCode,
      wellName: parsed.wellName,
      wellType: parsed.wellType,
      blockName: parsed.blockName,
      status: parsed.status
    },
    page: currentPage.value,
    size: pageSize.value
  })
}

const removeFilter = (field: keyof WellQuery) => {
  const next = { ...queryForm, [field]: '' }
  Object.assign(queryForm, next)
  navigateQuery(next, { page: 1, size: pageSize.value })
}

/** 冲突时：移除所有与该井实际值矛盾的条件后重新查询 */
const clearConflictFilters = () => {
  const conflictFields = new Set(wellStore.conflicts.map(c => c.field))
  const next: Partial<WellQuery> = { ...queryForm }
  conflictFields.forEach(field => {
    next[field] = ''
  })
  Object.assign(queryForm, next)
  navigateQuery(next, { page: 1, size: pageSize.value })
}

const handleSizeChange = (size: number) => {
  navigateQuery({ ...queryForm }, { page: 1, size })
}

const handleCurrentChange = (page: number) => {
  navigateQuery({ ...queryForm }, { page, size: pageSize.value })
}

// ---------- 可保存的组合检索方案 ----------

const handleSaveScheme = async () => {
  try {
    const { value } = await ElMessageBox.prompt('请输入检索方案名称', '保存组合检索', {
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      inputPlaceholder: '例如：胜利油田-生产中的开发井'
    })
    const query: Partial<WellQuery> = {}
    QUERY_FIELDS.forEach(field => {
      const v = queryForm[field].trim()
      if (v) query[field] = v
    })
    const scheme = wellStore.saveScheme(value, query)
    ElMessage.success(`检索方案「${scheme.name}」已保存，下次可直接使用`)
  } catch {
    // 用户取消
  }
}

const handleSchemeCommand = (command: { action: string; name: string }) => {
  if (command.action !== 'apply') return
  const scheme = wellStore.schemes.find(s => s.name === command.name)
  if (!scheme) return
  Object.assign(queryForm, {
    wellCode: '',
    wellName: '',
    wellType: '',
    blockName: '',
    status: '',
    ...scheme.query
  })
  navigateQuery(scheme.query, { page: 1, size: pageSize.value })
}

const handleDeleteScheme = (name: string) => {
  ElMessageBox.confirm(`确定删除检索方案「${name}」吗？删除后不可恢复。`, '提示', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    wellStore.removeScheme(name)
    ElMessage.success('检索方案已删除')
  }).catch(() => {})
}

// ---------- 滚动位置恢复（查看详情/切换菜单返回列表后） ----------

const getScrollContainer = (): HTMLElement | null => {
  return document.querySelector('.layout-container .main-content')
}

const restoreScroll = async () => {
  const top = Number(sessionStorage.getItem(SCROLL_STORAGE) || '0')
  sessionStorage.removeItem(SCROLL_STORAGE)
  if (!top) return
  await nextTick()
  requestAnimationFrame(() => {
    getScrollContainer()?.scrollTo({ top })
  })
}

onBeforeRouteLeave(() => {
  const top = getScrollContainer()?.scrollTop || 0
  if (top > 0) sessionStorage.setItem(SCROLL_STORAGE, String(top))
})

// ---------- 新增 / 编辑 / 查看 / 删除 ----------

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

const handleEdit = (row: Well) => {
  isEdit.value = true
  dialogTitle.value = '编辑井位'
  Object.assign(wellForm, JSON.parse(JSON.stringify(row)))
  dialogVisible.value = true
}

const handleView = (row: Well) => {
  sessionStorage.setItem(LIST_QUERY_STORAGE, JSON.stringify(route.query))
  router.push(`/well/detail/${row.id}`)
}

const handleDelete = (row: Well) => {
  ElMessageBox.confirm(`确定要删除 ${row.wellName}（${row.wellCode}）吗？删除后各入口总数同步更新。`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await wellStore.deleteWell(row.id)
      // 删除后按当前条件刷新，拿到真实总数；当前页删空时回退到最后一个有效页
      await wellStore.loadList({
        query: { ...queryForm },
        page: currentPage.value,
        size: pageSize.value
      })
      ElMessage.success('删除成功')
      const maxPage = Math.max(1, Math.ceil(wellStore.total / pageSize.value))
      if (currentPage.value > maxPage) {
        navigateQuery({ ...queryForm }, { page: maxPage, size: pageSize.value })
      }
    } catch (err) {
      ElMessage.error(err instanceof Error ? err.message : '删除失败')
    }
  }).catch(() => {})
}

const handleSubmit = () => {
  if (!wellFormRef.value) return
  wellFormRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      if (isEdit.value && wellForm.id) {
        await wellStore.updateWell({ ...wellForm, id: wellForm.id })
        ElMessage.success('编辑成功')
      } else {
        await wellStore.createWell({ ...wellForm })
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
      // 保持当前条件与页码重新拉取；若新增井位不满足条件则不会出现在列表中
      await wellStore.loadList({
        query: { ...queryForm },
        page: currentPage.value,
        size: pageSize.value
      })
    } catch (err) {
      ElMessage.error(err instanceof Error ? err.message : '保存失败')
    }
  })
}

// ---------- 失败演示入口 ----------

const handleSimulateFailure = () => {
  wellStore.simulateNextListFailure()
  retry()
}

// 地址栏变化（分页、详情返回、前进后退、入口下钻）→ 重新同步。
// 首次进入由 onMounted 处理，这里只响应挂载之后的变化。
onMounted(async () => {
  await wellStore.loadBlocks()
  await syncFromRoute()
})

watch(
  () => route.query,
  () => {
    syncFromRoute()
  },
  { deep: true }
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

.query-form {
  margin-bottom: 0;
}

.active-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;

  .active-filters-label {
    font-size: 13px;
    color: #64748b;
  }

  .filter-tag {
    margin-right: 0;
  }
}

.result-alert {
  margin-bottom: 12px;
}

.alert-title {
  font-weight: 600;
}

.conflict-body {
  .conflict-line {
    margin-top: 4px;
    font-size: 13px;
    color: #475569;
    display: flex;
    align-items: center;
    gap: 6px;
  }
}

.alert-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.scheme-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 220px;

  .scheme-delete {
    color: #94a3b8;

    &:hover {
      color: #ef4444;
    }
  }
}

.dev-tools {
  margin-top: 8px;
  text-align: right;
}

.mt-20 {
  margin-top: 20px;
}
</style>
