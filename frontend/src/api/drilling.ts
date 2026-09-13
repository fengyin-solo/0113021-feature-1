import request from '@/utils/request'

export function getDrillingRealTime(wellId: number) {
  return request({
    url: `/drilling/${wellId}/realtime`,
    method: 'get'
  })
}

export function getDrillingProgress(wellId: number) {
  return request({
    url: `/drilling/${wellId}/progress`,
    method: 'get'
  })
}

export function getDrillingLog(wellId: number, params: any) {
  return request({
    url: `/drilling/${wellId}/log`,
    method: 'get',
    params
  })
}

export function getDrillingAlarms(wellId: number, params: any) {
  return request({
    url: `/drilling/${wellId}/alarms`,
    method: 'get',
    params
  })
}
