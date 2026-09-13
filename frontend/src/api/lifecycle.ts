import request from '@/utils/request'

export function getWellLifecycle(wellId: number) {
  return request({
    url: `/lifecycle/${wellId}`,
    method: 'get'
  })
}

export function getStageDetail(wellId: number, stageId: string) {
  return request({
    url: `/lifecycle/${wellId}/stage/${stageId}`,
    method: 'get'
  })
}

export function getStageMetrics(wellId: number, stageId: string) {
  return request({
    url: `/lifecycle/${wellId}/stage/${stageId}/metrics`,
    method: 'get'
  })
}

export function getStageEvents(wellId: number, stageId: string) {
  return request({
    url: `/lifecycle/${wellId}/stage/${stageId}/events`,
    method: 'get'
  })
}

export function getStageDocuments(wellId: number, stageId: string) {
  return request({
    url: `/lifecycle/${wellId}/stage/${stageId}/documents`,
    method: 'get'
  })
}

export function getLifecycleComparison(wellId: number) {
  return request({
    url: `/lifecycle/${wellId}/comparison`,
    method: 'get'
  })
}
