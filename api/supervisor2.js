import request from '@/utils/request'

/**
 * 获取监工详情
 * @param {number} userId - 用户ID
 * @returns 
 */
export function getSupervisorDetail(userId) {
  return request({
    url: `/api/v2/supervisor/detail/${userId}`,
    method: 'get'
  })
}

/**
 * 获取案例详情
 * @param {number} threadId - 帖子ID
 * @returns 
 */
export function getCaseDetail(threadId) {
  return request({
    url: `/api/v2/supervisor/case/detail/${threadId}`,
    method: 'get'
  })
}

/**
 * 获取监工信息
 * @param {number} userId - 用户ID
 * @returns 
 */
export function getSupervisorInfo(userId) {
  return request({
    url: `/api/v2/supervisor/info/${userId}`,
    method: 'get'
  })
}

/**
 * 获取监工列表
 * @param {string} keyword - 搜索关键词
 * @returns 
 */
export function getSupervisorList(keyword = '') {
  return request({
    url: '/api/v2/supervisor/list',
    method: 'get',
    params: {
      keyword
    }
  })
}

/**
 * 联系监工
 * @param {number} userId - 用户ID
 * @returns 
 */
export function contactSupervisor(userId) {
  return request({
    url: `/api/v2/supervisor/contact/${userId}`,
    method: 'post'
  })
}

// 默认导出
export default {
  getSupervisorDetail,
  getCaseDetail,
  getSupervisorInfo,
  getSupervisorList,
  contactSupervisor
}