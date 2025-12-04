import request from '@/utils/request'
import { toast } from '@/utils/common'

// 在线状态API配置
const ONLINE_STATUS_CONFIG = {
  timeout: 5000, // 5秒超时
  maxRetries: 2,  // 最大重试次数
  retryDelay: 1000 // 重试延迟时间(毫秒)
}

/**
 * 延迟函数
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 带重试机制的请求函数
 * @param {Function} requestFn - 请求函数
 * @param {number} retries - 剩余重试次数
 * @returns {Promise}
 */
async function requestWithRetry(requestFn, retries = ONLINE_STATUS_CONFIG.maxRetries) {
  try {
    return await requestFn()
  } catch (error) {
    // 如果是网络错误且还有重试次数，则重试
    if (retries > 0 && isRetryableError(error)) {
      console.log(`在线状态查询失败，${ONLINE_STATUS_CONFIG.retryDelay}ms后重试，剩余重试次数: ${retries}`)
      await delay(ONLINE_STATUS_CONFIG.retryDelay)
      return requestWithRetry(requestFn, retries - 1)
    }
    
    // 重试次数用完或不可重试的错误，返回降级结果
    console.error('在线状态查询最终失败:', error)
    return getFallbackResult(error)
  }
}

/**
 * 判断是否为可重试的错误
 * @param {Error} error - 错误对象
 * @returns {boolean}
 */
function isRetryableError(error) {
  if (!error || !error.message) return false
  
  const retryableErrors = [
    '网络请求失败',
    '后端接口连接异常',
    '系统接口请求超时',
    'timeout',
    'Network Error'
  ]
  
  return retryableErrors.some(retryableError => 
    error.message.includes(retryableError)
  )
}

/**
 * 获取降级结果
 * @param {Error} error - 错误对象
 * @returns {Object} 降级结果
 */
function getFallbackResult(error) {
  // 对于单用户查询，返回离线状态
  if (error.context === 'single') {
    return {
      code: 200,
      data: {
        userId: error.userId,
        isOnline: false,
        lastActiveTime: null
      }
    }
  }
  
  // 对于批量查询，返回所有用户都离线
  if (error.context === 'batch' && error.userIds) {
    const fallbackData = {}
    error.userIds.forEach(userId => {
      fallbackData[userId] = {
        isOnline: false,
        lastActiveTime: null
      }
    })
    return {
      code: 200,
      data: fallbackData
    }
  }
  
  // 默认返回空结果
  return {
    code: 500,
    message: '在线状态查询失败',
    data: null
  }
}

/**
 * 获取单个用户的在线状态
 * @param {number} userId - 用户ID
 * @returns {Promise} 返回用户在线状态信息
 */
export function getUserOnlineStatus(userId) {
  if (!userId) {
    return Promise.resolve({
      code: 400,
      message: '用户ID不能为空',
      data: null
    })
  }
  
  const requestFn = () => request({
    url: `/api/user/online-status/${userId}`,
    method: 'get',
    timeout: ONLINE_STATUS_CONFIG.timeout
  })
  
  return requestWithRetry(requestFn).catch(error => {
    // 添加上下文信息用于降级处理
    error.context = 'single'
    error.userId = userId
    return getFallbackResult(error)
  })
}

/**
 * 批量获取多个用户的在线状态
 * @param {Array<number>} userIds - 用户ID数组
 * @returns {Promise} 返回批量用户在线状态信息
 */
export function batchGetUserOnlineStatus(userIds) {
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return Promise.resolve({
      code: 400,
      message: '用户ID数组不能为空',
      data: {}
    })
  }
  
  // 限制批量查询的用户数量，避免请求过大
  const MAX_BATCH_SIZE = 50
  if (userIds.length > MAX_BATCH_SIZE) {
    console.warn(`批量查询用户数量过多(${userIds.length})，已限制为${MAX_BATCH_SIZE}个`)
    userIds = userIds.slice(0, MAX_BATCH_SIZE)
  }
  
  const requestFn = () => request({
    url: '/api/user/batch-online-status',
    method: 'post',
    data: { userIds },
    timeout: ONLINE_STATUS_CONFIG.timeout
  })
  
  return requestWithRetry(requestFn).catch(error => {
    // 添加上下文信息用于降级处理
    error.context = 'batch'
    error.userIds = userIds
    return getFallbackResult(error)
  })
}

/**
 * 获取在线状态配置
 * @returns {Object} 配置对象
 */
export function getOnlineStatusConfig() {
  return { ...ONLINE_STATUS_CONFIG }
}

/**
 * 更新在线状态配置
 * @param {Object} newConfig - 新的配置
 */
export function updateOnlineStatusConfig(newConfig) {
  Object.assign(ONLINE_STATUS_CONFIG, newConfig)
}

export default {
  getUserOnlineStatus,
  batchGetUserOnlineStatus,
  getOnlineStatusConfig,
  updateOnlineStatusConfig
}