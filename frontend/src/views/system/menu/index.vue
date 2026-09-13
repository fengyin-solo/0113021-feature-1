<template>
  <div class="menu-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>菜单管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增菜单
          </el-button>
        </div>
      </template>

      <el-table :data="menuList" border stripe style="width: 100%" row-key="menuId" default-expand-all>
        <el-table-column prop="menuName" label="菜单名称" min-width="200" />
        <el-table-column prop="icon" label="图标" width="100">
          <template #default="{ row }">
            <el-icon v-if="row.icon"><component :is="row.icon" /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由地址" min-width="200" />
        <el-table-column prop="component" label="组件路径" min-width="200" />
        <el-table-column prop="perms" label="权限标识" width="150" />
        <el-table-column prop="menuType" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.menuType === 'M' ? 'primary' : row.menuType === 'C' ? 'success' : 'warning'" size="small">
              {{ row.menuType === 'M' ? '目录' : row.menuType === 'C' ? '菜单' : '按钮' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? '显示' : '隐藏' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleAdd(row)">添加子菜单</el-button>
            <el-button type="success" size="small" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="menuForm" :rules="rules" ref="menuFormRef" label-width="100px">
        <el-form-item label="上级菜单" prop="parentId">
          <el-tree-select
            v-model="menuForm.parentId"
            :data="menuTree"
            :props="{ value: 'menuId', label: 'menuName', children: 'children' }"
            placeholder="选择上级菜单"
            check-strictly
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="菜单名称" prop="menuName">
          <el-input v-model="menuForm.menuName" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item label="菜单类型" prop="menuType">
          <el-radio-group v-model="menuForm.menuType">
            <el-radio value="M">目录</el-radio>
            <el-radio value="C">菜单</el-radio>
            <el-radio value="F">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="menuForm.menuType !== 'F'" label="路由地址" prop="path">
          <el-input v-model="menuForm.path" placeholder="请输入路由地址" />
        </el-form-item>
        <el-form-item v-if="menuForm.menuType === 'C'" label="组件路径" prop="component">
          <el-input v-model="menuForm.component" placeholder="请输入组件路径" />
        </el-form-item>
        <el-form-item v-if="menuForm.menuType === 'F'" label="权限标识" prop="perms">
          <el-input v-model="menuForm.perms" placeholder="请输入权限标识" />
        </el-form-item>
        <el-form-item v-if="menuForm.menuType !== 'F'" label="图标" prop="icon">
          <el-input v-model="menuForm.icon" placeholder="请输入图标名称" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="menuForm.sort" :min="0" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="menuForm.status">
            <el-radio :value="1">显示</el-radio>
            <el-radio :value="0">隐藏</el-radio>
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
const menuFormRef = ref<FormInstance>()

const menuList = ref([
  { menuId: 1, parentId: 0, menuName: '系统管理', icon: 'Setting', path: '/system', component: '', perms: '', menuType: 'M', sort: 1, status: 1, children: [
    { menuId: 11, parentId: 1, menuName: '用户管理', icon: 'User', path: '/system/user', component: 'system/user/index', perms: 'system:user:list', menuType: 'C', sort: 1, status: 1 },
    { menuId: 12, parentId: 1, menuName: '角色管理', icon: 'UserFilled', path: '/system/role', component: 'system/role/index', perms: 'system:role:list', menuType: 'C', sort: 2, status: 1 },
    { menuId: 13, parentId: 1, menuName: '菜单管理', icon: 'Menu', path: '/system/menu', component: 'system/menu/index', perms: 'system:menu:list', menuType: 'C', sort: 3, status: 1 }
  ]},
  { menuId: 2, parentId: 0, menuName: '井位管理', icon: 'Location', path: '/well', component: '', perms: '', menuType: 'M', sort: 2, status: 1, children: [
    { menuId: 21, parentId: 2, menuName: '井位列表', icon: 'List', path: '/well', component: 'well/index', perms: 'well:list', menuType: 'C', sort: 1, status: 1 }
  ]},
  { menuId: 3, parentId: 0, menuName: '钻井监控', icon: 'Monitor', path: '/drilling', component: '', perms: '', menuType: 'M', sort: 3, status: 1, children: [
    { menuId: 31, parentId: 3, menuName: '实时监控', icon: 'VideoPlay', path: '/drilling', component: 'drilling/index', perms: 'drilling:view', menuType: 'C', sort: 1, status: 1 }
  ]}
])

const menuTree = ref([{ menuId: 0, menuName: '主类目', children: menuList.value }])

const menuForm = reactive({
  menuId: null,
  parentId: 0,
  menuName: '',
  menuType: 'C',
  path: '',
  component: '',
  perms: '',
  icon: '',
  sort: 0,
  status: 1
})

const rules = {
  menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  menuType: [{ required: true, message: '请选择菜单类型', trigger: 'change' }]
}

const handleAdd = (row?: any) => {
  isEdit.value = false
  dialogTitle.value = '新增菜单'
  Object.assign(menuForm, { menuId: null, parentId: row ? row.menuId : 0, menuName: '', menuType: 'C', path: '', component: '', perms: '', icon: '', sort: 0, status: 1 })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  dialogTitle.value = '编辑菜单'
  Object.assign(menuForm, row)
  dialogVisible.value = true
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确定要删除菜单 ${row.menuName} 吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功')
  })
}

const handleSubmit = () => {
  if (!menuFormRef.value) return
  menuFormRef.value.validate((valid) => {
    if (valid) {
      dialogVisible.value = false
      ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
    }
  })
}
</script>

<style scoped lang="scss">
.menu-container {
  width: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
