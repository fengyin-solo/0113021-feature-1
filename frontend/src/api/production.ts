import request from '@/utils/request'

export function getProductionDaily(wellId: number, params: any) {
  return request({
    url: `/production/${wellId}/daily`,
    method: 'get',
    params
  })
}

export function getProductionTrend(wellId: number, params: any) {
  return request({
    url: `/production/${wellId}/trend`,
    method: 'get',
    params
  })
}

export function getProductionSummary(params: any) {
  return request({
    url: '/production/summary',
    method: 'get',
    params
  })
}

export function submitProductionData(data: any) {
  return request({
    url: '/production',
    method: 'post',
    data
  })
}
