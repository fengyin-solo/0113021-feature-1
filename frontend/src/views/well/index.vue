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
      
      <el-form :model="queryForm" inline class="mb-20">
        <el-form-item label="井名">
          <el-input v-model="queryForm.wellName" placeholder="请输入井名" clearable />
        </el-form-item>
        <el-form-item label="井型">
          <el-select v-model="queryForm.wellType" placeholder="请选择井型" clearable>
            <el-option label="探井" value="探井" />
            <el-option label="开发井" value="开发井" />
            <el-option label="评价井" value="评价井" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="请选择状态" clearable>
            <el-option label="钻井中" value="钻井中" />
            <el-option label="生产中" value="生产中" />
            <el-option label="待修井" value="待修井" />
            <el-option label="关停井" value="关停井" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" border stripe style="width: 100%" v-loading="loading">
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

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        class="mt-20"
        @size-change="handleQuery"
        @current-change="handleQuery"
      />
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
            <el-option label="探井" value="探井" />
            <el-option label="开发井" value="开发井" />
            <el-option label="评价井" value="评价井" />
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
            <el-option label="钻井中" value="钻井中" />
            <el-option label="生产中" value="生产中" />
            <el-option label="待修井" value="待修井" />
            <el-option label="关停井" value="关停井" />
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
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const wellFormRef = ref<FormInstance>()

const queryForm = reactive({
  wellName: '',
  wellType: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const tableData = ref([
  { id: 1, wellCode: 'A-001', wellName: 'A-01井', wellType: '开发井', blockName: '胜利油田', longitude: 118.5236, latitude: 38.2356, designDepth: 3500, status: '生产中', createTime: '2024-01-01 10:00:00' },
  { id: 2, wellCode: 'B-003', wellName: 'B-03井', wellType: '探井', blockName: '胜利油田', longitude: 118.8562, latitude: 38.5123, designDepth: 4200, status: '钻井中', createTime: '2024-01-02 14:30:00' },
  { id: 3, wellCode: 'C-002', wellName: 'C-02井', wellType: '开发井', blockName: '胜利油田', longitude: 119.1254, latitude: 38.3456, designDepth: 3800, status: '生产中', createTime: '2024-01-03 09:15:00' },
  { id: 4, wellCode: 'D-005', wellName: 'D-05井', wellType: '评价井', blockName: '胜利油田', longitude: 118.6587, latitude: 38.7895, designDepth: 4000, status: '待修井', createTime: '2024-01-04 16:45:00' },
  { id: 5, wellCode: 'E-001', wellName: 'E-01井', wellType: '开发井', blockName: '胜利油田', longitude: 118.9563, latitude: 38.4562, designDepth: 3600, status: '关停井', createTime: '2024-01-05 11:20:00' }
])

pagination.total = tableData.value.length

const wellForm = reactive({
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

const wellRules = {
  wellCode: [{ required: true, message: '请输入井号', trigger: 'blur' }],
  wellName: [{ required: true, message: '请输入井名', trigger: 'blur' }],
  wellType: [{ required: true, message: '请选择井型', trigger: 'change' }]
}

const getStatusType = (status: string) => {
  const map: Record<string, any> = {
    '生产中': 'success',
    '钻井中': 'primary',
    '待修井': 'warning',
    '关停井': 'danger'
  }
  return map[status] || 'info'
}

const handleQuery = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 500)
}

const handleReset = () => {
  Object.assign(queryForm, { wellName: '', wellType: '', status: '' })
  handleQuery()
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增井位'
  Object.assign(wellForm, { id: null, wellCode: '', wellName: '', wellType: '', blockName: '', longitude: null, latitude: null, designDepth: null, status: '' })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  dialogTitle.value = '编辑井位'
  Object.assign(wellForm, row)
  dialogVisible.value = true
}

const handleView = (row: any) => {
  ElMessage.info('查看井位详情: ' + row.wellName)
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确定要删除 ${row.wellName} 吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功')
  })
}

const handleSubmit = () => {
  if (!wellFormRef.value) return
  wellFormRef.value.validate((valid) => {
    if (valid) {
      dialogVisible.value = false
      ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
    }
  })
}
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

.mt-20 {
  margin-top: 20px;
}
</style>
