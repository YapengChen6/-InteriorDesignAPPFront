/**
 * 消息相关数据类型定义
 * 对应后端的Message、MessageStatus、WebSocketMessageDTO等实体
 */

/**
 * 消息类型枚举
 */
export const MESSAGE_TYPES = {
  TEXT: 1,          // 文本消息
  IMAGE: 2,         // 图片消息
  CHAT_REQUEST: 3,  // 聊天请求
  FILE: 4           // 文件消息
}

/**
 * 动作类型枚举
 */
export const ACTION_TYPES = {
  SEND: 'send',     // 发送消息
  READ: 'read',     // 已读确认
  CONFIRM: 'confirm' // 订单确认
}

/**
 * 用户角色枚举
 */
export const USER_ROLES = {
  USER: 1,              // 普通用户
  DESIGNER: 2,          // 设计师
  SUPERVISOR: 3,        // 监理
  MATERIAL_SUPPLIER: 4  // 材料商
}

/**
 * 消息状态枚举
 */
export const MESSAGE_STATUS = {
  UNREAD: 0,    // 未读
  READ: 1       // 已读
}

/**
 * 接收状态枚举
 */
export const RECEIVE_STATUS = {
  NOT_RECEIVED: 0, // 未接收
  RECEIVED: 1      // 已接收
}

/**
 * 媒体类型枚举
 */
export const MEDIA_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  FILE: 'file'
}

/**
 * 消息实体类型定义
 * 对应后端Message实体
 */
export class MessageModel {
  constructor(data = {}) {
    this.messageId = data.messageId || null
    this.conversationId = data.conversationId || null
    this.senderId = data.senderId || null
    this.messageType = data.messageType || MESSAGE_TYPES.NORMAL
    this.content = data.content || ''
    this.actionType = data.actionType || 0
    this.createTime = data.createTime || null
    this.updateTime = data.updateTime || null
    this.createdBy = data.createdBy || null
    this.updatedBy = data.updatedBy || null
    this.delFlag = data.delFlag || '0'
    
    // 前端扩展字段
    this.mediaType = data.mediaType || MEDIA_TYPES.TEXT
    this.isSender = data.isSender || false
    this.senderName = data.senderName || ''
    this.avatar = data.avatar || '/static/images/default-avatar.png'
    this.sendTime = data.sendTime || Date.now()
  }

  /**
   * 验证消息数据的完整性
   * @returns {Object} 验证结果
   */
  validate() {
    const errors = []
    
    if (!this.senderId) {
      errors.push('发送者ID不能为空')
    }
    
    if (!this.conversationId) {
      errors.push('对话ID不能为空')
    }
    
    if (!this.content || this.content.trim().length === 0) {
      errors.push('消息内容不能为空')
    }
    
    if (!Object.values(MESSAGE_TYPES).includes(this.messageType)) {
      errors.push('消息类型无效')
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    }
  }

  /**
   * 转换为WebSocket传输格式
   * @returns {Object} WebSocket消息对象
   */
  toWebSocketFormat() {
    return {
      action: ACTION_TYPES.SEND,
      messageId: this.messageId,
      messageType: this.messageType,
      senderId: parseInt(this.senderId),
      conversationId: this.conversationId,
      content: this.content,
      mediaType: this.mediaType !== MEDIA_TYPES.TEXT ? this.mediaType : undefined,
      actionType: this.actionType,
      sendTime: this.sendTime || Date.now()
    }
  }

  /**
   * 从后端数据创建消息实例
   * @param {Object} backendData 后端消息数据
   * @returns {MessageModel} 消息实例
   */
  static fromBackendData(backendData) {
    return new MessageModel({
      messageId: backendData.messageId,
      conversationId: backendData.conversationId,
      senderId: backendData.senderId,
      messageType: backendData.messageType,
      content: backendData.content,
      actionType: backendData.actionType,
      createTime: backendData.createTime,
      createdBy: backendData.createdBy,
      sendTime: backendData.sendTime
    })
  }
}

/**
 * 消息状态实体类型定义
 * 对应后端MessageStatus实体
 */
export class MessageStatusModel {
  constructor(data = {}) {
    this.messageStatusId = data.messageStatusId || null
    this.messageId = data.messageId || null
    this.userId = data.userId || null
    this.readStatus = data.readStatus || MESSAGE_STATUS.UNREAD
    this.receiveStatus = data.receiveStatus || RECEIVE_STATUS.NOT_RECEIVED
    this.createTime = data.createTime || null
    this.updateTime = data.updateTime || null
    this.createdBy = data.createdBy || null
    this.updatedBy = data.updatedBy || null
    this.delFlag = data.delFlag || '0'
  }

  /**
   * 标记为已读
   */
  markAsRead() {
    this.readStatus = MESSAGE_STATUS.READ
    this.updateTime = new Date()
  }

  /**
   * 标记为已接收
   */
  markAsReceived() {
    this.receiveStatus = RECEIVE_STATUS.RECEIVED
    this.updateTime = new Date()
  }

  /**
   * 检查是否已读
   * @returns {boolean}
   */
  isRead() {
    return this.readStatus === MESSAGE_STATUS.READ
  }

  /**
   * 检查是否已接收
   * @returns {boolean}
   */
  isReceived() {
    return this.receiveStatus === RECEIVE_STATUS.RECEIVED
  }
}

/**
 * WebSocket消息DTO类型定义
 * 对应后端WebSocketMessageDTO
 */
export class WebSocketMessageDTO {
  constructor(data = {}) {
    this.messageId = data.messageId || null
    this.action = data.action || ACTION_TYPES.SEND
    this.messageType = data.messageType || MESSAGE_TYPES.NORMAL
    this.senderId = data.senderId || null
    this.receiverId = data.receiverId || null
    this.conversationId = data.conversationId || null
    this.content = data.content || ''
    this.mediaType = data.mediaType || null
    this.userRole = data.userRole || USER_ROLES.USER
    this.actionType = data.actionType || 0
    this.templateId = data.templateId || null
    this.sendTime = data.sendTime || Date.now()
    this.readStatus = data.readStatus || MESSAGE_STATUS.UNREAD
    this.receiveStatus = data.receiveStatus || RECEIVE_STATUS.NOT_RECEIVED
    this.createdBy = data.createdBy || null
    
    // 前端扩展字段
    this.senderName = data.senderName || ''
    this.senderAvatar = data.senderAvatar || '/static/images/default-avatar.png'
    this.isSender = data.isSender || false
  }

  /**
   * 验证WebSocket消息的完整性
   * @returns {Object} 验证结果
   */
  validate() {
    const errors = []
    
    if (!this.senderId) {
      errors.push('发送者ID不能为空')
    }
    
    if (this.action === ACTION_TYPES.SEND && !this.receiverId) {
      errors.push('接收者ID不能为空')
    }
    
    if (this.action === ACTION_TYPES.SEND && !this.conversationId) {
      errors.push('对话ID不能为空')
    }
    
    if (this.action === ACTION_TYPES.SEND && (!this.content || this.content.trim().length === 0)) {
      errors.push('消息内容不能为空')
    }
    
    if (!Object.values(ACTION_TYPES).includes(this.action)) {
      errors.push('动作类型无效')
    }
    
    if (!Object.values(MESSAGE_TYPES).includes(this.messageType)) {
      errors.push('消息类型无效')
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    }
  }

  /**
   * 转换为JSON字符串用于WebSocket传输
   * @returns {string} JSON字符串
   */
  toJSON() {
    const data = {
      action: this.action,
      messageType: this.messageType,
      senderId: parseInt(this.senderId),
      conversationId: this.conversationId,
      content: this.content,
      userRole: this.userRole,
      sendTime: this.sendTime
    }
    
    // 添加可选字段
    if (this.messageId) data.messageId = this.messageId
    if (this.receiverId) data.receiverId = parseInt(this.receiverId)
    if (this.mediaType) data.mediaType = this.mediaType
    if (this.actionType !== 0) data.actionType = this.actionType
    if (this.templateId) data.templateId = this.templateId
    
    return JSON.stringify(data)
  }

  /**
   * 从WebSocket接收的数据创建实例
   * @param {Object} wsData WebSocket数据
   * @returns {WebSocketMessageDTO} DTO实例
   */
  static fromWebSocketData(wsData) {
    return new WebSocketMessageDTO({
      messageId: wsData.messageId,
      action: wsData.action,
      messageType: wsData.messageType,
      senderId: wsData.senderId,
      receiverId: wsData.receiverId,
      conversationId: wsData.conversationId,
      content: wsData.content,
      mediaType: wsData.mediaType,
      userRole: wsData.userRole,
      actionType: wsData.actionType,
      templateId: wsData.templateId,
      sendTime: wsData.sendTime,
      senderName: wsData.senderName,
      senderAvatar: wsData.senderAvatar
    })
  }
}

/**
 * 聊天请求内容类型定义
 */
export class ChatRequestContent {
  constructor(data = {}) {
    this.type = data.type || 'CHAT_REQUEST'
    this.fromUserId = data.fromUserId || null
    this.fromNickName = data.fromNickName || ''
    this.requestTime = data.requestTime || Date.now()
  }

  /**
   * 转换为JSON字符串
   * @returns {string} JSON字符串
   */
  toJSON() {
    return JSON.stringify({
      type: this.type,
      fromUserId: this.fromUserId,
      fromNickName: this.fromNickName,
      requestTime: this.requestTime
    })
  }

  /**
   * 从JSON字符串解析
   * @param {string} jsonString JSON字符串
   * @returns {ChatRequestContent} 聊天请求内容实例
   */
  static fromJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString)
      return new ChatRequestContent(data)
    } catch (e) {
      console.warn('解析聊天请求内容失败:', e)
      return null
    }
  }
}