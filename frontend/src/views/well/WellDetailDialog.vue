<template>
  <el-dialog
    v-model="visible"
    title="井位详情"
    width="640px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-descriptions v-if="well" :column="2" border>
      <el-descriptions-item label="井号">{{ well.wellCode }}</el-descriptions-item>
      <el-descriptions-item label="井名">{{ well.wellName }}</el-descriptions-item>
      <el-descriptions-item label="井型">{{ well.wellType }}</el-descriptions-item>
      <el-descriptions-item label="区块">{{ well.blockName }}</el-descriptions-item>
      <el-descriptions-item label="经度">{{ well.longitude ?? '-' }}</el-descriptions-item>
      <el-descriptions-item label="纬度">{{ well.latitude ?? '-' }}</el-descriptions-item>
      <el-descriptions-item label="设计井深(m)">{{ well.designDepth ?? '-' }}</el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="getStatusType(well.status)" size="small">{{ well.status }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="创建时间" :span="2">{{ well.createTime }}</el-descriptions-item>
    </el-descriptions>
    <el-empty v-else description="井位不存在或已被删除" />
    <template #footer>
      <el-button type="primary" @click="handleClose">返回列表</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWellStore } from '@/store/modules/well'

const props = defineProps<{ modelValue: boolean; wellId: number | null }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'back'): void
}>()

const wellStore = useWellStore()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const well = computed(() =>
  props.wellId !== null ? wellStore.getWellById(props.wellId) || null : null
)

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    生产中: 'success',
    钻井中: 'primary',
    待修井: 'warning',
    关停井: 'danger'
  }
  return map[status] || 'info'
}

const handleClose = () => {
  visible.value = false
  emit('back')
}
</script>
