<template>
  <div class="role-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>角色管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增角色
          </el-button>
        </div>
      </template>

      <el-table :data="roleList" border stripe style="width: 100%">
        <el-table-column prop="roleId" label="角色ID" width="80" />
        <el-table-column prop="roleName" label="角色名称" width="150" />
        <el-table-column prop="roleKey" label="角色标识" width="150" />
        <el-table-column prop="description" label="角色描述" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" size="small" link @click="handlePermission(row)">分配权限</el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="roleForm" :rules="rules" ref="roleFormRef" label-width="100px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="roleForm.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色标识" prop="roleKey">
          <el-input v-model="roleForm.roleKey" placeholder="请输入角色标识" />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input v-model="roleForm.description" type="textarea" :rows="3" placeholder="请输入角色描述" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="roleForm.sort" :min="0" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="roleForm.status">
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
const roleFormRef = ref<FormInstance>()

const roleList = ref([
  { roleId: 1, roleName: '超级管理员', roleKey: 'super_admin', description: '拥有系统所有权限', sort: 1, status: 1, createTime: '2024-01-01 10:00:00' },
  { roleId: 2, roleName: '生产管理员', roleKey: 'production_admin', description: '生产数据管理相关权限', sort: 2, status: 1, createTime: '2024-01-02 11:00:00' },
  { roleId: 3, roleName: '钻井工程师', roleKey: 'drilling_engineer', description: '钻井数据监控相关权限', sort: 3, status: 1, createTime: '2024-01-03 09:30:00' },
  { roleId: 4, roleName: '现场操作员', roleKey: 'field_operator', description: '现场数据录入权限', sort: 4, status: 1, createTime: '2024-01-04 14:20:00' },
  { roleId: 5, roleName: 'HSE管理员', roleKey: 'hse_admin', description: '安全环保管理权限', sort: 5, status: 1, createTime: '2024-01-05 16:45:00' }
])

const roleForm = reactive({
  roleId: null,
  roleName: '',
  roleKey: '',
  description: '',
  sort: 0,
  status: 1
})

const rules = {
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  roleKey: [{ required: true, message: '请输入角色标识', trigger: 'blur' }]
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增角色'
  Object.assign(roleForm, { roleId: null, roleName: '', roleKey: '', description: '', sort: 0, status: 1 })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  dialogTitle.value = '编辑角色'
  Object.assign(roleForm, row)
  dialogVisible.value = true
}

const handlePermission = (row: any) => {
  ElMessage.info('分配权限: ' + row.roleName)
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确定要删除角色 ${row.roleName} 吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功')
  })
}

const handleSubmit = () => {
  if (!roleFormRef.value) return
  roleFormRef.value.validate((valid) => {
    if (valid) {
      dialogVisible.value = false
      ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
    }
  })
}
</script>

<style scoped lang="scss">
.role-container {
  width: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
