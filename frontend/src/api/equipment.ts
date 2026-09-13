import request from '@/utils/request'

export interface Equipment {
  id?: number
  equipmentCode: string
  equipmentName: string
  equipmentType: string
  model: string
  installLocation: string
  wellName: string
  runningHours: number
  status: string
  lastMaintenanceDate: string
  nextMaintenanceDate: string
  remark?: string
}

export interface MaintenanceRecord {
  id?: number
  equipmentId: number
  equipmentName: string
  equipmentCode: string
  maintenanceType: string
  maintenanceDate: string
  maintenancePerson: string
  maintenanceContent: string
  maintenanceResult: string
  cost?: number
  remark?: string
  createdAt?: string
}

export interface EquipmentQuery {
  equipmentName?: string
  equipmentType?: string
  status?: string
  startDate?: string
  endDate?: string
  pageNum?: number
  pageSize?: number
}

export const getEquipmentList = (params: EquipmentQuery) => {
  return request({
    url: '/api/equipment/list',
    method: 'get',
    params
  })
}

export const getEquipmentById = (id: number) => {
  return request({
    url: `/api/equipment/${id}`,
    method: 'get'
  })
}

export const createEquipment = (data: Equipment) => {
  return request({
    url: '/api/equipment',
    method: 'post',
    data
  })
}

export const updateEquipment = (data: Equipment) => {
  return request({
    url: '/api/equipment',
    method: 'put',
    data
  })
}

export const deleteEquipment = (id: number) => {
  return request({
    url: `/api/equipment/${id}`,
    method: 'delete'
  })
}

export const getMaintenanceRecords = (equipmentId?: number) => {
  return request({
    url: '/api/maintenance/list',
    method: 'get',
    params: { equipmentId }
  })
}

export const createMaintenanceRecord = (data: MaintenanceRecord) => {
  return request({
    url: '/api/maintenance',
    method: 'post',
    data
  })
}

export const getMaintenanceStats = () => {
  return request({
    url: '/api/maintenance/stats',
    method: 'get'
  })
}

export const getOverdueMaintenance = () => {
  return request({
    url: '/api/maintenance/overdue',
    method: 'get'
  })
}

export const getEquipmentTypeOptions = () => {
  return request({
    url: '/api/equipment/types',
    method: 'get'
  })
}

export const getStatusOptions = () => {
  return request({
    url: '/api/equipment/statuses',
    method: 'get'
  })
}
