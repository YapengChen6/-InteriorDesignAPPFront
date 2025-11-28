// supervisorpublic.js - 监工公开API接口
import request from '@/utils/request'

/**
 * 获取监工列表（公开接口）
 * @param {string} search 搜索关键词（姓名、地区等）
 * @returns {Promise} 监工列表
 */
export function getSupervisorList(search = '') {
  return request({
    url: '/api/supervisor/public/list',
    method: 'get',
    params: { search }
  })
}

/**
 * 根据用户ID获取监工详情
 * @param {number} userId 用户ID
 * @returns {Promise} 监工详情
 */
export function getSupervisorDetail(userId) {
  return request({
    url: `/api/supervisor/public/detail/${userId}`,
    method: 'get'
  })
}

/**
 * 联系监工
 * @param {number} userId 监工用户ID
 * @returns {Promise} 联系结果
 */
export function contactSupervisor(userId) {
  return request({
    url: `/api/supervisor/public/contact/${userId}`,
    method: 'post'
  })
}