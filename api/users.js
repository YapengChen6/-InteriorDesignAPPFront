import request from '@/utils/request'
import upload from '@/utils/upload'

// 查询用户个人信息
export function getUserProfile() {
  return request({
    url: '/api/users/profile',
    method: 'get'
  })
}

// 修改用户个人信息
export function updateUserProfile(data) {
  return request({
    url: '/api/users/profile',
    method: 'put',
    data: data
  })
}

// 获取用户路由
export function getRouters() {
  return request({
    url: '/api/users/routers',
    method: 'get'
  })
}

// 用户头像上传
export function uploadAvatar(data) {
  return upload({
    url: '/api/users/profile/avatar',
    name: data.name,
    filePath: data.filePath
  })
}

// 登出
export function logout(token) {
  return request({
    url: '/api/users/logout',
    method: 'post',
    params: { token }
  })
}

// 发送短信验证码
export function sendCode(phoneNumber) {
  return request({
    url: '/api/auth/code',
    headers: {
      isToken: false
    },
    method: 'get',
    params: {
      phone: phoneNumber
    }
  })
}

// 获取图形验证码
export function getCodeImg() {
  return request({
    url: '/captchaImage',
    headers: {
      isToken: false
    },
    method: 'get',
    timeout: 20000
  })
}

// 多条件查询用户信息
export function searchUsers(query) {
  return request({
    url: '/api/users/search',
    method: 'post',
    data: query
  })
}

// 获取指定用户信息
export function getUserById(userId) {
  return request({
    url: `/api/users/${userId}`,
    method: 'get'
  })
}

// 身份切换相关API

// 切换用户身份
export function switchRole(data) {
  return request({
    url: '/api/users/role/switch',
    method: 'post',
    data: data
  })
}

// 获取身份信息（支持可选手机号查询）
export function getRoleSwitchInfo(phone) {
  const params = phone ? { phone } : {}
  return request({
    url: '/api/users/role/info',
    method: 'get',
    params: params
  })
}

// 获取当前角色类型
export function getCurrentRole() {
  return request({
    url: '/api/users/role/current',
    method: 'get'
  })
}

// 获取可切换角色列表
export function getAvailableRoles() {
  return request({
    url: '/api/users/role/available',
    method: 'get'
  })
}

// 重置为普通用户身份
export function resetToUser() {
  return request({
    url: '/api/users/role/reset',
    method: 'post'
  })
}

// 获取身份切换历史记录 - 注意：后端已弃用，返回空数组
export function getRoleSwitchHistory() {
  return request({
    url: '/api/users/role/history',
    method: 'get'
  })
}

// 检查是否有某个角色的权限
export function checkRolePermission(roleType) {
  return request({
    url: `/api/users/role/check/${roleType}`,
    method: 'get'
  })
}

// 快速切换到设计师身份
export function switchToDesigner() {
  return request({
    url: '/api/users/role/switch/designer',
    method: 'post'
  })
}

// 快速切换到监理身份
export function switchToSupervisor() {
  return request({
    url: '/api/users/role/switch/supervisor',
    method: 'post'
  })
}

// 快速切换到材料商身份
export function switchToMaterialSupplier() {
  return request({
    url: '/api/users/role/switch/material-supplier',
    method: 'post'
  })
}

// 快速切换到普通用户身份
export function switchToUser() {
  return request({
    url: '/api/users/role/switch/user',
    method: 'post'
  })
}

// 获取当前身份剩余有效时间
export function getRemainingTime() {
  return request({
    url: '/api/users/role/remaining-time',
    method: 'get'
  })
}

export default {
  // 用户基本信息
  getUserProfile,
  updateUserProfile,
  getRouters,
  uploadAvatar,
  logout,
  searchUsers,
  getUserById,
  
  // 认证相关
  sendCode,
  getCodeImg,
  
  // 角色切换核心功能
  switchRole,
  getRoleSwitchInfo,
  getCurrentRole,
  getAvailableRoles,
  resetToUser,
  getRoleSwitchHistory,
  checkRolePermission,
  
  // 快速角色切换
  switchToDesigner,
  switchToSupervisor,
  switchToMaterialSupplier,
  switchToUser,
  
  // 身份时间管理
  getRemainingTime
}