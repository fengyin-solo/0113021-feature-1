<template>
  <div class="user-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增用户
          </el-button>
        </div>
      </template>

      <el-form :model="queryForm" inline class="mb-20">
        <el-form-item label="用户名">
          <el-input v-model="queryForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="真实姓名">
          <el-input v-model="queryForm.realName" placeholder="请输入真实姓名" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="请选择状态" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="userList" border stripe style="width: 100%">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="userId" label="用户ID" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="realName" label="真实姓名" width="120" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="roles" label="角色" width="200">
          <template #default="{ row }">
            <el-tag v-for="role in row.roles" :key="role" size="small" style="margin-right: 5px;">{{ role }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" size="small" link @click="handleRole(row)">分配角色</el-button>
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
      <el-form :model="userForm" :rules="rules" ref="userFormRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" :disabled="isEdit" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="userForm.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="部门" prop="department">
          <el-input v-model="userForm.department" placeholder="请输入部门" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="userForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
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
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'

const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const userFormRef = ref<FormInstance>()

const queryForm = reactive({
  username: '',
  realName: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const userList = ref([
  { userId: 1, username: 'admin', realName: '系统管理员', email: 'admin@oilfield.com', phone: '13800138001', department: '信息中心', roles: ['超级管理员'], status: 1, createTime: '2024-01-01 10:00:00' },
  { userId: 2, username: 'manager', realName: '生产经理', email: 'manager@oilfield.com', phone: '13800138002', department: '生产部', roles: ['生产管理员'], status: 1, createTime: '2024-01-02 11:00:00' },
  { userId: 3, username: 'engineer', realName: '钻井工程师', email: 'engineer@oilfield.com', phone: '13800138003', department: '工程部', roles: ['钻井工程师'], status: 1, createTime: '2024-01-03 09:30:00' },
  { userId: 4, username: 'operator', realName: '现场操作员', email: 'operator@oilfield.com', phone: '13800138004', department: '作业区', roles: ['现场操作员'], status: 1, createTime: '2024-01-04 14:20:00' },
  { userId: 5, username: 'hse', realName: 'HSE管理员', email: 'hse@oilfield.com', phone: '13800138005', department: '安全环保部', roles: ['HSE管理员'], status: 1, createTime: '2024-01-05 16:45:00' }
])

pagination.total = userList.value.length

const userForm = reactive({
  userId: null,
  username: '',
  password: '',
  realName: '',
  email: '',
  phone: '',
  department: '',
  status: 1
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }]
}

const handleQuery = () => {
  ElMessage.success('查询成功')
}

const handleReset = () => {
  Object.assign(queryForm, { username: '', realName: '', status: '' })
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增用户'
  Object.assign(userForm, { userId: null, username: '', password: '', realName: '', email: '', phone: '', department: '', status: 1 })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  dialogTitle.value = '编辑用户'
  Object.assign(userForm, row)
  dialogVisible.value = true
}

const handleRole = (row: any) => {
  ElMessage.info('分配角色: ' + row.username)
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确定要删除用户 ${row.username} 吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功')
  })
}

const handleSubmit = () => {
  if (!userFormRef.value) return
  userFormRef.value.validate((valid) => {
    if (valid) {
      dialogVisible.value = false
      ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
    }
  })
}
</script>

<style scoped lang="scss">
.user-container {
  width: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mb-20 {
  margin-bottom: 20px;
}

.mt-20 {
  margin-top: 20px;
}
</style>
