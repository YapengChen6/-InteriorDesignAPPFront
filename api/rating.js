import request from '@/utils/request'

/**
 * 用户评分相关API
 * @file /api/rating.js
 */

/**
 * 获取用户评分详情
 * @param {number} userId - 用户ID
 * @returns {Promise} 用户评分数据
 */
export function getUserRating(userId) {
  return request({
    url: `/api/rating/${userId}`,
    method: 'get'
  })
}

/**
 * 获取用户简单评分值
 * @param {number} userId - 用户ID
 * @returns {Promise} 评分值
 */
export function getUserSimpleRating(userId) {
  return request({
    url: `/api/rating/${userId}/simple`,
    method: 'get'
  })
}

/**
 * 批量获取用户评分信息
 * @param {Array<number>} userIds - 用户ID数组
 * @returns {Promise} 用户评分数据
 */
export function batchGetUserRatings(userIds) {
  return request({
    url: '/api/rating/batch',
    method: 'post',
    data: {
      userIds: userIds
    }
  })
}

/**
 * 批量获取用户评分信息（带参数）
 * @param {Object} data - 请求数据
 * @param {Array<number>} data.userIds - 用户ID数组
 * @param {boolean} data.onlyCompleted - 是否只计算已完成订单
 * @returns {Promise} 用户评分数据
 */
export function batchGetUserRatingsWithParam(data) {
  return request({
    url: '/api/rating/batch/param',
    method: 'post',
    data: data
  })
}

/**
 * 获取承接者评分排行
 * @param {Object} params - 查询参数
 * @param {number} params.limit - 返回数量，默认10
 * @param {string} params.userType - 用户类型
 * @returns {Promise} 评分排行列表
 */
export function getContractorRank(params = {}) {
  return request({
    url: '/api/rating/rank/contractor',
    method: 'get',
    params: {
      limit: params.limit || 10,
      userType: params.userType
    }
  })
}

/**
 * 查询用户评分详情（带查询参数）
 * @param {Object} data - 查询参数
 * @param {number} data.userId - 用户ID
 * @param {boolean} data.onlyCompleted - 是否只计算已完成订单
 * @param {string} data.startTime - 开始时间
 * @param {string} data.endTime - 结束时间
 * @param {number} data.orderType - 订单类型
 * @returns {Promise} 用户评分数据
 */
export function getUserRatingDetail(data) {
  return request({
    url: '/api/rating/detail',
    method: 'post',
    data: data
  })
}

/**
 * 获取用户评分统计
 * @param {number} userId - 用户ID
 * @returns {Promise} 评分统计信息
 */
export function getUserRatingStats(userId) {
  return request({
    url: `/api/rating/stats/${userId}`,
    method: 'get'
  })
}

/**
 * 简单查询用户评分
 * @param {Object} params - 查询参数
 * @param {number} params.userId - 用户ID
 * @param {boolean} params.onlyCompleted - 是否只计算已完成订单
 * @returns {Promise} 用户评分数据
 */
export function queryUserRating(params) {
  return request({
    url: '/api/rating/query/simple',
    method: 'get',
    params: params
  })
}

/**
 * 健康检查
 * @returns {Promise} 健康状态
 */
export function healthCheck() {
  return request({
    url: '/api/rating/health',
    method: 'get'
  })
}

/**
 * 心跳检测
 * @returns {Promise} 服务状态
 */
export function ping() {
  return request({
    url: '/api/rating/ping',
    method: 'get'
  })
}

/**
 * 测试接口
 * @param {number} userId - 用户ID
 * @returns {Promise} 测试数据
 */
export function testRating(userId) {
  return request({
    url: `/api/rating/test/${userId}`,
    method: 'get'
  })
}

// 默认导出
export default {
  getUserRating,
  getUserSimpleRating,
  batchGetUserRatings,
  batchGetUserRatingsWithParam,
  getContractorRank,
  getUserRatingDetail,
  getUserRatingStats,
  queryUserRating,
  healthCheck,
  ping,
  testRating
}