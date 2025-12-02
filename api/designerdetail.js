import request from '@/utils/request'

/**
 * 设计师详情相关API
 * @file /api/designerdetail.js
 */

/**
 * 获取设计师完整详情（包含基本信息、统计数据和作品集）
 * @param {number} userId - 用户ID
 * @returns {Promise} 设计师详情数据
 */
export function getDesignerDetail(userId) {
  return request({
    url: `/api/designerdetail/detail/${userId}`,
    method: 'get'
  })
}

/**
 * 获取设计师基本信息
 * @param {number} userId - 用户ID
 * @returns {Promise} 设计师基本信息
 */
export function getDesignerBasicInfo(userId) {
  return request({
    url: `/api/designerdetail/basic/${userId}`,
    method: 'get'
  })
}

/**
 * 获取设计师作品集列表
 * @param {number} userId - 用户ID
 * @param {Object} params - 查询参数
 * @param {number} params.pageNum - 页码，默认1
 * @param {number} params.pageSize - 每页数量，默认10
 * @returns {Promise} 作品集列表数据
 */
export function getDesignerPortfolios(userId, params = {}) {
  return request({
    url: `/api/designerdetail/portfolios/${userId}`,
    method: 'get',
    params: {
      pageNum: params.pageNum || 1,
      pageSize: params.pageSize || 10
    }
  })
}

/**
 * 获取设计师统计数据
 * @param {number} userId - 用户ID
 * @returns {Promise} 统计数据
 */
export function getDesignerStats(userId) {
  return request({
    url: `/api/designerdetail/stats/${userId}`,
    method: 'get'
  })
}

/**
 * 测试设计师详情接口
 * @param {number} userId - 用户ID
 * @returns {Promise} 测试数据
 */
export function testDesignerDetail(userId) {
  return request({
    url: `/api/designerdetail/test/${userId}`,
    method: 'get'
  })
}

/**
 * 检查服务连通性
 * @returns {Promise} 连通性检查结果
 */
export function pingDesignerDetail() {
  return request({
    url: '/api/designerdetail/ping',
    method: 'get'
  })
}

/**
 * 关注设计师
 * @param {number} userId - 用户ID
 * @returns {Promise} 关注结果
 */
export function followDesigner(userId) {
  return request({
    url: `/api/designer/follow/${userId}`,
    method: 'post'
  })
}

/**
 * 取消关注设计师
 * @param {number} userId - 用户ID
 * @returns {Promise} 取消关注结果
 */
export function unfollowDesigner(userId) {
  return request({
    url: `/api/designer/unfollow/${userId}`,
    method: 'post'
  })
}

/**
 * 检查是否已关注设计师
 * @param {number} userId - 用户ID
 * @returns {Promise} 关注状态
 */
export function checkFollowStatus(userId) {
  return request({
    url: `/api/designer/follow/status/${userId}`,
    method: 'get'
  })
}

/**
 * 点赞作品
 * @param {number} portfolioId - 作品ID
 * @returns {Promise} 点赞结果
 */
export function likePortfolio(portfolioId) {
  return request({
    url: `/api/designer/portfolio/${portfolioId}/like`,
    method: 'post'
  })
}

/**
 * 取消点赞作品
 * @param {number} portfolioId - 作品ID
 * @returns {Promise} 取消点赞结果
 */
export function unlikePortfolio(portfolioId) {
  return request({
    url: `/api/designer/portfolio/${portfolioId}/unlike`,
    method: 'post'
  })
}

/**
 * 联系设计师
 * @param {number} userId - 用户ID
 * @param {Object} data - 联系信息
 * @param {string} data.contactType - 联系类型（电话/微信/在线咨询）
 * @param {string} data.message - 留言信息
 * @returns {Promise} 联系结果
 */
export function contactDesigner(userId, data = {}) {
  return request({
    url: `/api/designer/contact/${userId}`,
    method: 'post',
    data
  })
}

/**
 * 预约设计师
 * @param {number} userId - 用户ID
 * @param {Object} data - 预约信息
 * @param {string} data.appointmentTime - 预约时间
 * @param {string} data.serviceType - 服务类型（咨询/设计/监理）
 * @param {string} data.requirements - 需求描述
 * @returns {Promise} 预约结果
 */
export function makeAppointment(userId, data = {}) {
  return request({
    url: `/api/designer/appointment/${userId}`,
    method: 'post',
    data
  })
}

/**
 * 获取设计师服务项目
 * @param {number} userId - 用户ID
 * @returns {Promise} 服务项目列表
 */
export function getDesignerServices(userId) {
  return request({
    url: `/api/designer/services/${userId}`,
    method: 'get'
  })
}

/**
 * 获取设计师评价列表
 * @param {number} userId - 用户ID
 * @param {Object} params - 查询参数
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页数量
 * @returns {Promise} 评价列表
 */
export function getDesignerReviews(userId, params = {}) {
  return request({
    url: `/api/designer/reviews/${userId}`,
    method: 'get',
    params: {
      pageNum: params.pageNum || 1,
      pageSize: params.pageSize || 10
    }
  })
}

/**
 * 获取设计师案例分类
 * @param {number} userId - 用户ID
 * @returns {Promise} 案例分类列表
 */
export function getDesignerCaseCategories(userId) {
  return request({
    url: `/api/designer/cases/categories/${userId}`,
    method: 'get'
  })
}

// 默认导出
export default {
  getDesignerDetail,
  getDesignerBasicInfo,
  getDesignerPortfolios,
  getDesignerStats,
  testDesignerDetail,
  pingDesignerDetail,
  followDesigner,
  unfollowDesigner,
  checkFollowStatus,
  likePortfolio,
  unlikePortfolio,
  contactDesigner,
  makeAppointment,
  getDesignerServices,
  getDesignerReviews,
  getDesignerCaseCategories
}