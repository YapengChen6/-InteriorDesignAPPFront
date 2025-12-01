/**
 * WebSocket消息处理工具类
 * 基于chatMain.vue中的WebSocket处理逻辑
 */

import { getValidTimestamp } from './timeUtils.js'
import { processAvatarUrl } from './avatarUtils.js'

/**
 * WebSocket消息类型常量
 */
export const MESSAGE_TYPES = {
  NORMAL: 1,        // 普通消息
  ORDER_REQUEST: 2, // 订单申请
  CHAT_REQUEST: 3   // 聊天请求
}

/**
 * WebSocket动作类型常量
 */
export const ACTION_TYPES = {
  SEND: 'send',     // 发送消息
  READ: 'read',     // 已读确认
  CONFIRM: 'confirm' // 订单确认
}

/**
 * 用户角色常量
 */
export const USER_ROLES = {
  USER: 1,              // 普通用户
  DESIGNER: 2,          // 设计师
  SUPERVISOR: 3,        // 监理
  MATERIAL_SUPPLIER: 4  // 材料商
}

/**
 * 创建WebSocket消息对象
 * @param {Object} options - 消息选项
 * @returns {Object} - 标准化的WebSocket消息对象
 */
export function createWebSocketMessage(options) {
  const {
    action = ACTION_TYPES.SEND,
    messageType = MESSAGE_TYPES.NORMAL,
    senderId,
    receiverId,
    conversationId,
    content,
    mediaType = null,
    userRole = USER_ROLES.USER,
    actionType = 0,
    templateId = null,
    messageId = null,
    orderApplicationId = null
  } = options

  // 确保必要的ID是数字类型
  const message = {
    action,
    messageType,
    senderId: parseInt(senderId),
    receiverId: parseInt(receiverId),
    conversationId,
    content,
    userRole,
    sendTime: Date.now()
  }

  // 添加可选字段
  if (mediaType) message.mediaType = mediaType
  if (actionType !== 0) message.actionType = actionType
  if (templateId) message.templateId = templateId
  if (messageId) message.messageId = messageId
  if (orderApplicationId) message.orderApplicationId = orderApplicationId

  return message
}

/**
 * 创建文本消息
 * @param {Object} params - 消息参数
 * @returns {Object} - WebSocket消息对象
 */
export function createTextMessage({ senderId, receiverId, conversationId, content, userRole }) {
  return createWebSocketMessage({
    action: ACTION_TYPES.SEND,
    messageType: MESSAGE_TYPES.NORMAL,
    senderId,
    receiverId,
    conversationId,
    content,
    userRole
  })
}

/**
 * 创建媒体消息（图片/视频）
 * @param {Object} params - 消息参数
 * @returns {Object} - WebSocket消息对象
 */
export function createMediaMessage({ senderId, receiverId, conversationId, fileUrl, mediaType, userRole }) {
  return createWebSocketMessage({
    action: ACTION_TYPES.SEND,
    messageType: MESSAGE_TYPES.NORMAL,
    senderId,
    receiverId,
    conversationId,
    content: fileUrl,
    mediaType,
    userRole
  })
}

/**
 * 创建订单申请消息
 * @param {Object} params - 消息参数
 * @returns {Object} - WebSocket消息对象
 */
export function createOrderRequestMessage({ senderId, receiverId, conversationId, content, userRole }) {
  return createWebSocketMessage({
    action: ACTION_TYPES.SEND,
    messageType: MESSAGE_TYPES.ORDER_REQUEST,
    senderId,
    receiverId,
    conversationId,
    content,
    templateId: 1,
    actionType: 1,
    userRole
  })
}

/**
 * 创建已读确认消息
 * @param {Object} params - 消息参数
 * @returns {Object} - WebSocket消息对象
 */
export function createReadConfirmMessage({ conversationId, senderId, receiverId }) {
  return {
    action: ACTION_TYPES.READ,
    conversationId,
    senderId: parseInt(senderId),
    receiverId: parseInt(receiverId),
    sendTime: Date.now()
  }
}

/**
 * 创建订单确认消息
 * @param {Object} params - 消息参数
 * @returns {Object} - WebSocket消息对象
 */
export function createOrderConfirmMessage({ messageId, orderApplicationId }) {
  return {
    action: ACTION_TYPES.CONFIRM,
    messageId,
    orderApplicationId,
    sendTime: Date.now()
  }
}

/**
 * 处理接收到的WebSocket消息，转换为统一格式
 * @param {Object} messageData - 原始消息数据
 * @param {Object} context - 上下文信息（当前用户ID、聊天用户信息等）
 * @returns {Object} - 处理后的消息对象
 */
export function processReceivedMessage(messageData, context) {
  const { currentUserId, chatUser } = context

  // 使用统一的消息发送者判断函数
  const isSender = determineMessageSender(messageData, currentUserId)
  
  // 获取发送者昵称
  let senderName = '未知用户'
  if (isSender) {
    senderName = '我'
  } else {
    // 接收方消息：显示对方真实昵称
    senderName = chatUser && chatUser.name ? chatUser.name : '对方'
  }
  
  console.log('🏷️ 消息发送者昵称:', {
    content: messageData.content,
    senderId: messageData.senderId,
    isSender: isSender,
    senderName: senderName,
    chatUserName: chatUser?.name
  })
  
  // 安全地处理时间戳
  const validTime = getValidTimestamp(messageData)
  
  return {
    ...messageData,
    isSender: isSender,
    senderName: senderName,
    avatar: processAvatarUrl(messageData.senderAvatar, '/static/images/default-avatar.png'),
    createTime: validTime,
    sendTime: validTime
  }
}

/**
 * 统一的消息发送者判断函数
 * @param {Object} messageData - 消息数据
 * @param {number} currentUserId - 当前用户ID
 * @returns {boolean} - 是否为当前用户发送的消息
 */
export function determineMessageSender(messageData, currentUserId) {
  let isSender = false
  
  console.log('🔍 判断消息发送者:', {
    messageSenderId: messageData.senderId,
    messageCreatedBy: messageData.createdBy,
    currentUserId: currentUserId,
    content: messageData.content
  })
  
  // 优先使用senderId判断
  if (messageData.senderId != null && messageData.senderId !== 0) {
    // 正常情况：根据senderId判断
    isSender = messageData.senderId == currentUserId
    console.log('✅ 使用senderId判断结果:', {
      senderId: messageData.senderId,
      currentUserId: currentUserId,
      isSender: isSender,
      comparison: messageData.senderId + ' == ' + currentUserId + ' = ' + (messageData.senderId == currentUserId)
    })
  } else if (messageData.createdBy != null && messageData.createdBy !== 0) {
    // 备用方案：使用createdBy判断
    isSender = messageData.createdBy == currentUserId
    console.log('✅ 使用createdBy判断结果:', {
      createdBy: messageData.createdBy,
      currentUserId: currentUserId,
      isSender: isSender,
      comparison: messageData.createdBy + ' == ' + currentUserId + ' = ' + (messageData.createdBy == currentUserId)
    })
  } else {
    // 特殊处理：基于消息内容和对话参与者推断
    console.log('⚠️ 消息senderId和createdBy都为空，使用特殊推断逻辑:', {
      content: messageData.content,
      senderId: messageData.senderId,
      createdBy: messageData.createdBy,
      currentUserId: currentUserId
    })
    
    // 对于系统消息或特殊消息内容的处理
    if (messageData.content && messageData.content.includes('对方请求与您进行沟通')) {
      // 这类消息通常是当前用户发送的请求
      isSender = true
      console.log('✅ 推断为系统请求消息（当前用户发送）:', isSender)
    } else if (messageData.content && (
      messageData.content.includes('同意') || 
      messageData.content.includes('拒绝') ||
      messageData.content.includes('确认')
    )) {
      // 这类回复消息通常是对方发送的
      isSender = false
      console.log('✅ 推断为回复消息（对方发送）:', isSender)
    } else {
      // 对于普通消息，如果没有明确的发送者信息，默认显示为对方消息
      isSender = false
      console.log('✅ 默认推断为对方消息:', isSender)
    }
  }
  
  return isSender
}

/**
 * 检查用户是否有发送订单申请的权限
 * @param {number} userRole - 用户角色
 * @returns {boolean} - 是否有权限
 */
export function canSendOrderRequest(userRole) {
  return userRole === USER_ROLES.DESIGNER || userRole === USER_ROLES.SUPERVISOR
}

/**
 * 检查消息是否需要与前一条消息合并显示
 * @param {Object} currentMessage - 当前消息
 * @param {Object} previousMessage - 前一条消息
 * @param {number} timeWindowMinutes - 时间窗口（分钟）
 * @returns {boolean} - 是否应该合并
 */
export function shouldMergeMessages(currentMessage, previousMessage, timeWindowMinutes = 5) {
  // 如果前一条消息不存在，不合并
  if (!previousMessage) return false
  
  // 检查是否为同一发送者
  const sameSender = currentMessage.isSender === previousMessage.isSender
  
  // 检查时间间隔
  const currentTime = new Date(currentMessage.createTime || currentMessage.sendTime || Date.now())
  const previousTime = new Date(previousMessage.createTime || previousMessage.sendTime || Date.now())
  const timeDiffInMinutes = (currentTime - previousTime) / (1000 * 60)
  const withinTimeWindow = timeDiffInMinutes <= timeWindowMinutes
  
  // 只有同一发送者且时间间隔在指定时间内才合并
  return sameSender && withinTimeWindow
}