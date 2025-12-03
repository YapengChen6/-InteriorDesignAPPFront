/**
 * 对话辅助工具函数
 * 提供对话相关的便捷方法和工具函数
 */

import { checkOrCreateConversation } from '@/api/conversationCheck.js'

/**
 * 获取当前用户ID
 * 从多个来源尝试获取当前用户ID
 * 
 * @returns {number|null} 用户ID，如果获取失败返回null
 */
export function getCurrentUserId() {
  try {
    // 方法1: 从userInfo获取
    const userInfo = uni.getStorageSync('userInfo')
    if (userInfo && userInfo.userId) {
      return parseInt(userInfo.userId)
    }
    
    // 方法2: 从单独存储的userId获取
    const userId = uni.getStorageSync('userId')
    if (userId) {
      return parseInt(userId)
    }
    
    // 方法3: 从全局数据获取
    const app = getApp()
    if (app && app.globalData && app.globalData.userInfo && app.globalData.userInfo.userId) {
      return parseInt(app.globalData.userInfo.userId)
    }
    
    console.warn('⚠️ 无法获取当前用户ID')
    return null
  } catch (error) {
    console.error('❌ 获取当前用户ID失败:', error)
    return null
  }
}

/**
 * 安全地创建与指定用户的对话
 * 包含完整的错误处理和用户提示
 * 
 * @param {number} targetUserId - 目标用户ID
 * @param {string} targetUserName - 目标用户名称（用于显示）
 * @param {string} targetUserAvatar - 目标用户头像（可选）
 * @returns {Promise<Object>} 对话信息
 */
export async function safeCreateConversation(targetUserId, targetUserName = '用户', targetUserAvatar = '') {
  return new Promise(async (resolve, reject) => {
    try {
      // 获取当前用户ID
      const currentUserId = getCurrentUserId()
      if (!currentUserId) {
        throw new Error('请先登录')
      }
      
      // 验证目标用户ID
      if (!targetUserId) {
        throw new Error('目标用户ID无效')
      }
      
      if (currentUserId === targetUserId) {
        throw new Error('不能与自己创建对话')
      }
      
      console.log('🔄 创建对话:', {
        currentUserId,
        targetUserId,
        targetUserName
      })
      
      // 显示加载提示
      uni.showLoading({
        title: '正在创建对话...',
        mask: true
      })
      
      // 调用API
      const response = await checkOrCreateConversation(currentUserId, targetUserId)
      
      uni.hideLoading()
      
      if (response.code === 200 && response.data) {
        const conversationData = response.data
        const conversation = conversationData.conversation
        
        if (conversation && conversation.conversationId) {
          // 成功创建或获取对话
          const result = {
            conversationId: conversation.conversationId,
            exists: conversationData.exists,
            message: conversationData.message,
            targetUserId: targetUserId,
            targetUserName: targetUserName,
            targetUserAvatar: targetUserAvatar
          }
          
          console.log('✅ 对话创建成功:', result)
          resolve(result)
        } else {
          throw new Error('对话信息不完整')
        }
      } else {
        throw new Error(response.msg || response.message || '创建对话失败')
      }
      
    } catch (error) {
      uni.hideLoading()
      console.error('❌ 创建对话失败:', error)
      
      // 处理特定错误
      let errorMessage = '创建对话失败'
      if (error.message) {
        if (error.message.includes('未登录') || error.message.includes('登录')) {
          errorMessage = '请先登录'
        } else if (error.message.includes('权限')) {
          errorMessage = '没有权限创建对话'
        } else if (error.message.includes('自己')) {
          errorMessage = '不能与自己创建对话'
        } else {
          errorMessage = error.message
        }
      }
      
      reject(new Error(errorMessage))
    }
  })
}

/**
 * 跳转到聊天详情页面
 * 便捷方法，用于跳转到聊天页面
 * 
 * @param {Object} conversationInfo - 对话信息
 * @param {number} conversationInfo.conversationId - 对话ID
 * @param {number} conversationInfo.targetUserId - 目标用户ID
 * @param {string} conversationInfo.targetUserName - 目标用户名称
 * @param {string} conversationInfo.targetUserAvatar - 目标用户头像
 */
export function navigateToChatDetail(conversationInfo) {
  const {
    conversationId,
    targetUserId,
    targetUserName = '用户',
    targetUserAvatar = ''
  } = conversationInfo
  
  if (!conversationId || !targetUserId) {
    console.error('❌ 跳转参数不完整:', conversationInfo)
    uni.showToast({
      title: '跳转参数不完整',
      icon: 'error'
    })
    return
  }
  
  const url = `/pages/chat/chatDetail?conversationId=${conversationId}&otherUserId=${targetUserId}&name=${encodeURIComponent(targetUserName)}&avatar=${encodeURIComponent(targetUserAvatar)}`
  
  console.log('🎯 跳转到聊天页面:', url)
  
  uni.navigateTo({
    url: url,
    success: () => {
      console.log('✅ 跳转成功')
    },
    fail: (error) => {
      console.error('❌ 跳转失败:', error)
      uni.showToast({
        title: '跳转失败',
        icon: 'error'
      })
    }
  })
}

/**
 * 一键创建对话并跳转
 * 组合方法，创建对话后直接跳转到聊天页面
 * 
 * @param {number} targetUserId - 目标用户ID
 * @param {string} targetUserName - 目标用户名称
 * @param {string} targetUserAvatar - 目标用户头像
 * @returns {Promise<void>}
 */
export async function createConversationAndNavigate(targetUserId, targetUserName = '用户', targetUserAvatar = '') {
  try {
    // 创建对话
    const conversationInfo = await safeCreateConversation(targetUserId, targetUserName, targetUserAvatar)
    
    // 显示成功提示
    const message = conversationInfo.exists ? '进入已有对话' : '创建新对话成功'
    uni.showToast({
      title: message,
      icon: 'success',
      duration: 1500
    })
    
    // 延迟跳转，让用户看到提示
    setTimeout(() => {
      navigateToChatDetail(conversationInfo)
    }, 1000)
    
  } catch (error) {
    console.error('❌ 创建对话并跳转失败:', error)
    
    uni.showModal({
      title: '提示',
      content: error.message || '操作失败',
      showCancel: false,
      confirmText: '确定'
    })
  }
}

/**
 * 验证用户是否已登录
 * 检查用户登录状态
 * 
 * @returns {boolean} 是否已登录
 */
export function isUserLoggedIn() {
  const userId = getCurrentUserId()
  const token = uni.getStorageSync('token')
  
  return !!(userId && token)
}

/**
 * 处理未登录状态
 * 当用户未登录时的处理逻辑
 */
export function handleNotLoggedIn() {
  uni.showModal({
    title: '提示',
    content: '请先登录后再进行此操作',
    confirmText: '去登录',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        uni.reLaunch({
          url: '/pages/register'
        })
      }
    }
  })
}

/**
 * 调试工具：打印对话相关信息
 * 用于开发调试
 */
export function debugConversationInfo() {
  const userInfo = uni.getStorageSync('userInfo')
  const userId = uni.getStorageSync('userId')
  const token = uni.getStorageSync('token')
  
  console.log('🔍 对话调试信息:', {
    userInfo: userInfo,
    userId: userId,
    hasToken: !!token,
    currentUserId: getCurrentUserId(),
    isLoggedIn: isUserLoggedIn()
  })
}

// 默认导出
export default {
  getCurrentUserId,
  safeCreateConversation,
  navigateToChatDetail,
  createConversationAndNavigate,
  isUserLoggedIn,
  handleNotLoggedIn,
  debugConversationInfo
}