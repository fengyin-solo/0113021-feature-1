import request from '@/utils/request'

export interface LoginData {
  username: string
  password: string
}

export function login(data: LoginData) {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

export function getUserInfo() {
  return request({
    url: '/auth/userInfo',
    method: 'get'
  })
}

export function logout() {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}

export function getUserList(params: any) {
  return request({
    url: '/system/user/list',
    method: 'get',
    params
  })
}

export function createUser(data: any) {
  return request({
    url: '/system/user',
    method: 'post',
    data
  })
}

export function updateUser(data: any) {
  return request({
    url: '/system/user',
    method: 'put',
    data
  })
}

export function deleteUser(id: number) {
  return request({
    url: `/system/user/${id}`,
    method: 'delete'
  })
}
