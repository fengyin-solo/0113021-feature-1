<template>
  <div class="well-detail-container">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button :icon="ArrowLeft" @click="goBack">返回列表</el-button>
            <span class="title">井位详情</span>
            <el-tag v-if="detail" :type="getStatusType(detail.status)" size="small">
              {{ detail.status }}
            </el-tag>
          </div>
        </div>
      </template>

      <el-result
        v-if="errorMessage"
        icon="error"
        title="井位详情加载失败"
        :sub-title="errorMessage"
      >
        <template #extra>
          <el-button type="primary" :loading="loading" @click="loadDetail">重试</el-button>
          <el-button @click="goBack">返回列表</el-button>
        </template>
      </el-result>

      <template v-else-if="detail">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="井号">{{ detail.wellCode }}</el-descriptions-item>
          <el-descriptions-item label="井名">{{ detail.wellName }}</el-descriptions-item>
          <el-descriptions-item label="井型">{{ detail.wellType }}</el-descriptions-item>
          <el-descriptions-item label="区块">{{ detail.blockName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(detail.status)" size="small">{{ detail.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="设计井深(m)">{{ detail.designDepth ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="经度">{{ detail.longitude ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="纬度">{{ detail.latitude ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detail.createTime }}</el-descriptions-item>
        </el-descriptions>

        <div class="back-hint">
          <el-icon><InfoFilled /></el-icon>
          返回列表后将恢复之前的井号、井型、区块、状态条件、分页与滚动位置。
        </div>
      </template>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, InfoFilled } from '@element-plus/icons-vue'
import { useWellStore } from '@/store/modules/well'
import { STATUS_TAG_TYPE } from '@/constants/well'
import type { Well } from '@/types/well'

const route = useRoute()
const router = useRouter()
const wellStore = useWellStore()

const LIST_QUERY_STORAGE = 'well-list-query'

const detail = ref<Well | null>(null)
const loading = ref(false)
const errorMessage = ref('')

const getStatusType = (status: string) => STATUS_TAG_TYPE[status] || 'info'

const loadDetail = async () => {
  const id = Number(route.params.id)
  if (!id) {
    errorMessage.value = '缺少井位编号'
    return
  }
  loading.value = true
  errorMessage.value = ''
  try {
    detail.value = await wellStore.loadDetail(id)
  } catch (err) {
    // 失败后不展示任何旧详情
    detail.value = null
    errorMessage.value = err instanceof Error ? err.message : '请求失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

/** 返回井位列表：恢复上次的组合条件与分页 */
const goBack = () => {
  let query: Record<string, string> = {}
  try {
    query = JSON.parse(sessionStorage.getItem(LIST_QUERY_STORAGE) || '{}')
  } catch {
    query = {}
  }
  router.push({ path: '/well', query })
}

onMounted(loadDetail)
</script>

<style scoped lang="scss">
.well-detail-container {
  width: 100%;
}

.card-header {
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .title {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
  }
}

.back-hint {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #64748b;
}
</style>
