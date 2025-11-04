// api/role-switch.js
import request from '@/utils/request'

/**
 * 用户角色切换管理API
 */

/**
 * 切换用户身份
 * @param {Object} data 切换参数
 * @param {string} data.roleType 角色类型
 * @param {string} [data.switchReason] 切换原因
 * @param {number} [data.expireDays] 过期天数
 */
export function switchRole(data) {
  return request({
    url: '/api/role/switch',
    method: 'post',
    data: data
  })
}

/**
 * 获取当前用户的身份信息
 */
export function getRoleSwitchInfo() {
  return request({
    url: '/api/role/info',
    method: 'get'
  })
}

/**
 * 获取当前用户的角色类型
 */
export function getCurrentRole() {
  return request({
    url: '/api/role/current',
    method: 'get'
  })
}

/**
 * 获取可切换的角色列表
 */
export function getAvailableRoles() {
  return request({
    url: '/api/role/available',
    method: 'get'
  })
}

/**
 * 重置为普通用户身份
 */
export function resetToUser() {
  return request({
    url: '/api/role/reset',
    method: 'post'
  })
}

/**
 * 获取身份切换历史记录
 */
export function getRoleSwitchHistory() {
  return request({
    url: '/api/role/history',
    method: 'get'
  })
}

/**
 * 检查是否有某个角色的权限
 * @param {string} roleType 角色类型
 */
export function checkRolePermission(roleType) {
  return request({
    url: `/api/role/check/${roleType}`,
    method: 'get'
  })
}

/**
 * 快速切换到设计师身份
 */
export function switchToDesigner() {
  return request({
    url: '/api/role/switch/designer',
    method: 'post'
  })
}

/**
 * 快速切换到监理身份
 */
export function switchToSupervisor() {
  return request({
    url: '/api/role/switch/supervisor',
    method: 'post'
  })
}

/**
 * 快速切换到材料商身份
 */
export function switchToMaterialSupplier() {
  return request({
    url: '/api/role/switch/material-supplier',
    method: 'post'
  })
}

/**
 * 快速切换到普通用户身份
 */
export function switchToUser() {
  return request({
    url: '/api/role/switch/user',
    method: 'post'
  })
}

/**
 * 获取身份剩余有效时间
 */
export function getRemainingTime() {
  return request({
    url: '/api/role/remaining-time',
    method: 'get'
  })
}

export default {
  switchRole,
  getRoleSwitchInfo,
  getCurrentRole,
  getAvailableRoles,
  resetToUser,
  getRoleSwitchHistory,
  checkRolePermission,
  switchToDesigner,
  switchToSupervisor,
  switchToMaterialSupplier,
  switchToUser,
  getRemainingTime
}