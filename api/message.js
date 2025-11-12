/**
 * 消息 API 模块
 * 
 * 提供消息相关的 REST API 调用
 */

import request from '@/utils/request'

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
 * 获取未读消息数
 */
export function getUnreadCount() {
  return request({
    url: '/api/message/unread-count',
    method: 'get'
  })
}

/**
 * 获取未读消息列表
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
 */
export function markMessageAsRead(messageId) {
  return request({
    url: `/api/message/mark-read/${messageId}`,
    method: 'post'
  })
}

/**
 * 批量标记消息为已读
 * @param {array} messageIds - 消息 ID 数组
 */
export function markMessagesAsReadBatch(messageIds) {
  return request({
    url: '/api/message/mark-read-batch',
    method: 'post',
    data: {
      messageIds
    }
  })
}

/**
 * 删除消息
 * @param {number} messageId - 消息 ID
 */
export function deleteMessage(messageId) {
  return request({
    url: `/api/message/${messageId}`,
    method: 'delete'
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

export default {
  getMessageList,
  getUnreadCount,
  getUnreadMessages,
  markMessageAsRead,
  markMessagesAsReadBatch,
  deleteMessage,
  sendMessage,
  getConversationList,
  createConversation,
  getMessageTemplate,
  getAllMessageTemplates
}

