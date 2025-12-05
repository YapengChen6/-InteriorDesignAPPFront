/**
 * 消息 API 模块
 *
 * 提供消息相关的 REST API 调用
 */

import request from '@/utils/request'


// 获取当前用户ID
function getCurrentUserId() {
  let userId = 0
  try {
    const userInfo = uni.getStorageSync('userInfo')
    if (userInfo && userInfo.userId) {
      userId = userInfo.userId
    } else {
      const storedId = uni.getStorageSync('userId')
      if (storedId) {
        userId = storedId
      }
    }
  } catch (e) {
    console.error('获取用户ID失败', e)
  }
  if (!userId) {
    console.warn('未找到有效的用户ID，使用默认值 0')
    userId = 0
  }
  return userId
}

/**
 * 获取消息列表
 * @param {number} conversationId - 对话 ID
 * @param {number} pageNum - 页码
 * @param {number} pageSize - 每页数量
 */
export function getMessageList(conversationId, pageNum = 1, pageSize = 20) { 
  return request({
    url: `/api/message/list/${conversationId}`,
    method: 'get',
    params: {
      pageNum,
      pageSize
    }
  })
}

/**
 * 获取未读消息数量
 * 后端不再接收userId参数，使用当前登录用户
 */
export function getUnreadCount() {
  return request({
    url: '/api/message/unread-count',
    method: 'get'
  })
}

/**
 * 获取未读消息列表
 * 后端不再接收userId参数，使用当前登录用户
 * @param {number} limit - 限制数量
 */
export function getUnreadMessages(limit = 10) {
  return request({
    url: '/api/message/unread-messages',
    method: 'get',
    params: { limit }
  })
}

/**
 * 标记单条消息为已读
 * @param {number} messageId - 消息 ID        
 * @param {number} userId - 用户 ID
 */
export function markMessageAsRead(messageId, userId) {
  const uid = userId != null ? userId : getCurrentUserId()
  return request({
    url: `/api/message/mark-read/${messageId}`,
    method: 'post',
    params: { userId: uid }
  })
}

/**
 * 批量标记消息为已读
 * @param {array} messageIds - 消息 ID 数组 
 * @param {number} userId - 用户 ID
 */
export function markMessagesAsReadBatch(messageIds, userId) {
  const uid = userId != null ? userId : getCurrentUserId()
  return request({
    url: '/api/message/mark-read-batch',
    method: 'post',
    params: { userId: uid },
    data: {
      messageIds
    }
  })
}

/**
 * 标记对话中所有未读消息为已读
 * @param {number} conversationId - 对话 ID
 */
export function markConversationAsRead(conversationId) {
  return request({
    url: `/api/message/mark-conversation-read/${conversationId}`,
    method: 'post'
  })
}

/**
 * 删除消息
 * @param {number} messageId - 消息 ID
 * @param {number} userId - 用户 ID
 */
export function deleteMessage(messageId, userId) {
  const uid = userId != null ? userId : getCurrentUserId()
  return request({
    url: `/api/message/${messageId}`,
    method: 'delete',
    params: { userId: uid }
  })
}

/**
 * 发送消息（REST API）
 * @param {object} messageData - 消息数据    
 */
export function sendMessage(messageData) {
  return request({
    url: '/api/message/send',
    method: 'post',
    data: messageData
  })
}

/**
 * 获取对话列表
 * @param {number} pageNum - 页码
 * @param {number} pageSize - 每页数量
 */
export function getConversationList(pageNum = 1, pageSize = 20) {
  return request({
    url: '/api/conversation/list',
    method: 'get',
    params: {
      pageNum,
      pageSize
    }
  })
}

/**
 * 创建对话
 * @param {number} userId - 用户 ID
 */
export function createConversation(userId) {
  return request({
    url: '/api/conversation/create',
    method: 'post',
    data: { userId }
  })
}

/**
 * 获取消息模板
 * @param {number} templateType - 模板类型
 */
export function getMessageTemplate(templateType) {
  return request({
    url: `/api/message-template/${templateType}`,
    method: 'get'
  })
}

/**
 * 获取所有消息模板
 */
export function getAllMessageTemplates() {
  return request({
    url: '/api/message-template/list',
    method: 'get'
  })
}

/**
 * 检查用户在线状态
 * @param {number} userId - 用户ID
 */
export function getUserOnlineStatus(userId) {
  return request({
    url: `/api/user/online-status/${userId}`,
    method: 'get'
  })
}

/**
 * 批量检查用户在线状态
 * @param {array} userIds - 用户ID数组
 */
export function getBatchUserOnlineStatus(userIds) {
  return request({
    url: '/api/message/batch-user-online-status',
    method: 'post',
    data: userIds
  })
}

export default {
  getMessageList,
  getUnreadCount,
  getUnreadMessages,
  markMessageAsRead,
  markMessagesAsReadBatch,
  markConversationAsRead,
  deleteMessage,
  sendMessage,
  getConversationList,
  createConversation,
  getMessageTemplate,
  getAllMessageTemplates,
  getUserOnlineStatus,
  getBatchUserOnlineStatus
}
