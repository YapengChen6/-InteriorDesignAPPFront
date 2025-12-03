/**
 * 对话检查 API 模块
 * 
 * 提供对话检查和创建相关的 REST API 调用
 * 用于检查两个用户之间是否存在对话，如果不存在则自动创建
 */

import request from '@/utils/request'

/**
 * 检查或创建对话
 * 检查两个用户之间是否存在对话，如果不存在则自动创建新的对话记录
 * 
 * @param {number} userId1 - 用户1的ID
 * @param {number} userId2 - 用户2的ID
 * @returns {Promise} 对话检查结果
 * @example
 * const res = await checkOrCreateConversation(123, 456)
 * // res.data = {
 * //   exists: false,
 * //   conversation: {
 * //     conversationId: 789,
 * //     conversationType: 1,
 * //     createTime: '2025-12-03 10:30:00',
 * //     updateTime: '2025-12-03 10:30:00'
 * //   },
 * //   message: '对话已创建'
 * // }
 */
export function checkOrCreateConversation(userId1, userId2) {
  // 构造form数据格式
  const formData = `userId1=${userId1}&userId2=${userId2}`
  
  return request({
    url: '/api/conversation/check-or-create',
    method: 'post',
    data: formData,
    header: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
}

/**
 * 快速创建与设计师的对话
 * 便捷方法，用于与设计师创建对话
 * 
 * @param {number} designerId - 设计师用户ID
 * @returns {Promise} 对话检查结果
 */
export function createConversationWithDesigner(designerId) {
  // 获取当前用户ID
  const getCurrentUserId = () => {
    try {
      const userInfo = uni.getStorageSync('userInfo')
      if (userInfo && userInfo.userId) {
        return userInfo.userId
      }
      const userId = uni.getStorageSync('userId')
      if (userId) {
        return parseInt(userId)
      }
      throw new Error('未找到当前用户ID')
    } catch (error) {
      console.error('获取当前用户ID失败:', error)
      throw error
    }
  }

  const currentUserId = getCurrentUserId()
  return checkOrCreateConversation(currentUserId, designerId)
}

/**
 * 快速创建与监理的对话
 * 便捷方法，用于与监理创建对话
 * 
 * @param {number} supervisorId - 监理用户ID
 * @returns {Promise} 对话检查结果
 */
export function createConversationWithSupervisor(supervisorId) {
  const getCurrentUserId = () => {
    try {
      const userInfo = uni.getStorageSync('userInfo')
      if (userInfo && userInfo.userId) {
        return userInfo.userId
      }
      const userId = uni.getStorageSync('userId')
      if (userId) {
        return parseInt(userId)
      }
      throw new Error('未找到当前用户ID')
    } catch (error) {
      console.error('获取当前用户ID失败:', error)
      throw error
    }
  }

  const currentUserId = getCurrentUserId()
  return checkOrCreateConversation(currentUserId, supervisorId)
}

/**
 * 验证对话参数
 * 内部工具函数，用于验证对话创建参数
 * 
 * @param {number} userId1 - 用户1的ID
 * @param {number} userId2 - 用户2的ID
 * @returns {Object} 验证结果
 */
function validateConversationParams(userId1, userId2) {
  const errors = []
  
  if (!userId1 || !userId2) {
    errors.push('用户ID不能为空')
  }
  
  if (userId1 === userId2) {
    errors.push('不能与自己创建对话')
  }
  
  if (typeof userId1 !== 'number' || typeof userId2 !== 'number') {
    errors.push('用户ID必须为数字')
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  }
}

/**
 * 安全的对话创建
 * 带参数验证的对话创建方法
 * 
 * @param {number} userId1 - 用户1的ID
 * @param {number} userId2 - 用户2的ID
 * @returns {Promise} 对话检查结果
 */
export function safeCheckOrCreateConversation(userId1, userId2) {
  return new Promise((resolve, reject) => {
    // 参数验证
    const validation = validateConversationParams(userId1, userId2)
    if (!validation.isValid) {
      reject(new Error(validation.errors.join('; ')))
      return
    }
    
    // 调用API
    checkOrCreateConversation(userId1, userId2)
      .then(resolve)
      .catch(reject)
  })
}

// ==================== 默认导出 ====================

export default {
  // 核心功能
  checkOrCreateConversation,
  safeCheckOrCreateConversation,
  
  // 便捷方法
  createConversationWithDesigner,
  createConversationWithSupervisor,
  
  // 工具方法
  validateConversationParams
}