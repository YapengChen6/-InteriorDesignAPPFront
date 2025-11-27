/**
 * 对话相关数据类型定义
 * 对应后端的Conversation、ConversationVO等实体
 */

import { normalizeBackendTime } from '@/utils/timeUtils'
import { normalizeUserRole, ROLE_MAP } from '@/utils/chatDataUtils'

/**
 * 对话类型枚举
 */
export const CONVERSATION_TYPES = {
  PRIVATE: 'private',     // 私聊
  GROUP: 'group',         // 群聊
  SYSTEM: 'system'        // 系统消息
}

/**
 * 聊天项类型枚举
 */
export const CHAT_ITEM_TYPES = {
  CONVERSATION: 'conversation',   // 正常对话
  CHAT_REQUEST: 'chat-request',   // 聊天请求
  SYSTEM_MESSAGE: 'system'        // 系统消息
}

/**
 * 对话实体类型定义
 * 对应后端Conversation实体
 */
export class ConversationModel {
  constructor(data = {}) {
    this.conversationId = data.conversationId || null
    this.userId1 = data.userId1 || null
    this.userId2 = data.userId2 || null
    this.conversationType = data.conversationType || CONVERSATION_TYPES.PRIVATE
    this.lastMessage = data.lastMessage || ''
    this.lastMessageTime = data.lastMessageTime || null
    this.createTime = data.createTime || null
    this.updateTime = data.updateTime || null
    this.createdBy = data.createdBy || null
    this.updatedBy = data.updatedBy || null
    this.delFlag = data.delFlag || '0'
    
    // 扩展字段
    this.unreadCount = data.unreadCount || 0
    this.online = data.online || false
    this.otherUserRole = data.otherUserRole || 1
  }

  /**
   * 获取对方用户ID
   * @param {number} currentUserId 当前用户ID
   * @returns {number} 对方用户ID
   */
  getOtherUserId(currentUserId) {
    return this.userId1 === currentUserId ? this.userId2 : this.userId1
  }

  /**
   * 检查是否为有效对话
   * @returns {boolean}
   */
  isValid() {
    return this.conversationId && this.userId1 && this.userId2 && this.userId1 !== this.userId2
  }

  /**
   * 更新最后消息
   * @param {string} message 消息内容
   * @param {Date|number|string} time 消息时间
   */
  updateLastMessage(message, time) {
    this.lastMessage = message
    this.lastMessageTime = time
    this.updateTime = new Date()
  }

  /**
   * 转换为前端聊天项格式
   * @param {number} currentUserId 当前用户ID
   * @param {Object} otherUserInfo 对方用户信息
   * @returns {ChatItemModel} 聊天项实例
   */
  toChatItem(currentUserId, otherUserInfo = {}) {
    const otherUserId = this.getOtherUserId(currentUserId)
    
    return new ChatItemModel({
      id: this.conversationId,
      conversationId: this.conversationId,
      name: otherUserInfo.userName || otherUserInfo.nickName || `用户${otherUserId}`,
      avatar: otherUserInfo.avatar || '/static/images/default-avatar.png',
      lastMessage: this.lastMessage || '暂无消息',
      lastMessageTime: normalizeBackendTime(this.lastMessageTime),
      unreadCount: this.unreadCount,
      online: this.online,
      userRole: this.otherUserRole,
      normalizedUserRole: normalizeUserRole(this.otherUserRole),
      userId1: this.userId1,
      userId2: this.userId2,
      otherUserId: otherUserId,
      type: CHAT_ITEM_TYPES.CONVERSATION
    })
  }
}

/**
 * 聊天项模型
 * 用于前端聊天列表显示
 */
export class ChatItemModel {
  constructor(data = {}) {
    this.id = data.id || null
    this.conversationId = data.conversationId || null
    this.name = data.name || '未知用户'
    this.avatar = data.avatar || '/static/images/default-avatar.png'
    this.lastMessage = data.lastMessage || '暂无消息'
    this.lastMessageTime = data.lastMessageTime || new Date()
    this.unreadCount = data.unreadCount || 0
    this.online = data.online || false
    this.userRole = data.userRole || 1
    this.normalizedUserRole = data.normalizedUserRole || 1
    this.otherUserId = data.otherUserId || null
    this.type = data.type || CHAT_ITEM_TYPES.CONVERSATION
    
    // 聊天请求特有字段
    this.messageId = data.messageId || null
    this.messageStatusId = data.messageStatusId || null
    
    // 调试信息
    this._debug = data._debug || {}
  }

  /**
   * 检查是否有未读消息
   * @returns {boolean}
   */
  hasUnreadMessages() {
    return this.unreadCount > 0
  }

  /**
   * 获取角色显示名称
   * @returns {string}
   */
  getRoleDisplayName() {
    const roleKey = Object.keys(ROLE_MAP).find(key => 
      ROLE_MAP[key].userRole === this.normalizedUserRole
    )
    return roleKey ? ROLE_MAP[roleKey].name : '普通用户'
  }

  /**
   * 检查是否为聊天请求
   * @returns {boolean}
   */
  isChatRequest() {
    return this.type === CHAT_ITEM_TYPES.CHAT_REQUEST
  }

  /**
   * 检查是否为正常对话
   * @returns {boolean}
   */
  isConversation() {
    return this.type === CHAT_ITEM_TYPES.CONVERSATION
  }

  /**
   * 更新未读消息数量
   * @param {number} count 未读数量
   */
  updateUnreadCount(count) {
    this.unreadCount = Math.max(0, count)
    this.unread = this.unreadCount > 0
  }

  /**
   * 增加未读消息数量
   * @param {number} increment 增加数量，默认为1
   */
  incrementUnreadCount(increment = 1) {
    this.unreadCount += increment
    this.unread = this.unreadCount > 0
  }

  /**
   * 清除未读消息
   */
  clearUnreadMessages() {
    this.unreadCount = 0
    this.unread = false
  }

  /**
   * 更新最后消息
   * @param {string} message 消息内容
   * @param {Date} time 消息时间
   */
  updateLastMessage(message, time) {
    this.lastMessage = message
    this.lastMessageTime = time
  }

  /**
   * 检查是否匹配搜索条件
   * @param {string} searchText 搜索文本
   * @returns {boolean}
   */
  matchesSearch(searchText) {
    if (!searchText) return true
    
    const lowerSearchText = searchText.toLowerCase()
    return this.name.toLowerCase().includes(lowerSearchText) ||
           this.lastMessage.toLowerCase().includes(lowerSearchText)
  }

  /**
   * 检查是否匹配角色过滤
   * @param {string} roleFilter 角色过滤器
   * @returns {boolean}
   */
  matchesRoleFilter(roleFilter) {
    if (roleFilter === 'all') return true
    
    const expectedRole = ROLE_MAP[roleFilter]?.userRole
    return expectedRole ? this.normalizedUserRole === expectedRole : false
  }

  /**
   * 转换为简单对象用于存储或传输
   * @returns {Object}
   */
  toPlainObject() {
    return {
      id: this.id,
      conversationId: this.conversationId,
      name: this.name,
      avatar: this.avatar,
      lastMessage: this.lastMessage,
      lastMessageTime: this.lastMessageTime,
      unreadCount: this.unreadCount,
      online: this.online,
      userRole: this.userRole,
      normalizedUserRole: this.normalizedUserRole,
      otherUserId: this.otherUserId,
      type: this.type,
      messageId: this.messageId,
      messageStatusId: this.messageStatusId
    }
  }

  /**
   * 从简单对象创建实例
   * @param {Object} data 数据对象
   * @returns {ChatItemModel}
   */
  static fromPlainObject(data) {
    return new ChatItemModel(data)
  }

  /**
   * 从聊天请求消息创建聊天项
   * @param {Object} messageData 消息数据
   * @returns {ChatItemModel}
   */
  static fromChatRequestMessage(messageData) {
    // 解析聊天请求内容
    let senderName = messageData.senderName || `用户${messageData.senderId}`
    
    try {
      const content = JSON.parse(messageData.content || '{}')
      if (content.type === 'CHAT_REQUEST') {
        senderName = content.fromNickName || senderName
      }
    } catch (e) {
      console.warn('解析聊天请求内容失败:', e)
    }
    
    return new ChatItemModel({
      id: `msg_${messageData.messageId}`,
      conversationId: messageData.conversationId || messageData.messageId,
      name: senderName,
      avatar: '/static/images/default-avatar.png',
      lastMessage: '请求与您聊天',
      lastMessageTime: new Date(messageData.sendTime || Date.now()),
      unreadCount: messageData.readStatus === 0 ? 1 : 0,
      online: false,
      userRole: 1,
      normalizedUserRole: 1,
      otherUserId: messageData.senderId,
      type: CHAT_ITEM_TYPES.CHAT_REQUEST,
      messageId: messageData.messageId,
      messageStatusId: messageData.messageStatusId,
      _debug: {
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        senderName: messageData.senderName,
        messageType: messageData.messageType
      }
    })
  }
}

/**
 * 聊天列表管理器
 * 用于管理聊天列表的各种操作
 */
export class ChatListManager {
  constructor() {
    this.chats = []
    this.categoryTabs = [
      { id: 'all', label: '全部', count: 0 },
      { id: 'designer', label: '设计师', count: 0 },
      { id: 'supervisor', label: '监理', count: 0 },
      { id: 'user', label: '普通用户', count: 0 }
    ]
  }

  /**
   * 设置聊天列表
   * @param {Array<ChatItemModel>} chats 聊天列表
   */
  setChats(chats) {
    this.chats = chats.map(chat => 
      chat instanceof ChatItemModel ? chat : new ChatItemModel(chat)
    )
    this.updateCategoryCount()
  }

  /**
   * 添加聊天项
   * @param {ChatItemModel|Object} chat 聊天项
   */
  addChat(chat) {
    const chatItem = chat instanceof ChatItemModel ? chat : new ChatItemModel(chat)
    
    // 检查是否已存在
    const existingIndex = this.chats.findIndex(c => c.conversationId === chatItem.conversationId)
    if (existingIndex >= 0) {
      this.chats[existingIndex] = chatItem
    } else {
      this.chats.unshift(chatItem)
    }
    
    this.updateCategoryCount()
  }

  /**
   * 移除聊天项
   * @param {number} conversationId 对话ID
   */
  removeChat(conversationId) {
    const index = this.chats.findIndex(c => c.conversationId === conversationId)
    if (index >= 0) {
      this.chats.splice(index, 1)
      this.updateCategoryCount()
    }
  }

  /**
   * 更新聊天项的最后消息
   * @param {number} conversationId 对话ID
   * @param {string} message 消息内容
   * @param {Date} time 消息时间
   */
  updateLastMessage(conversationId, message, time) {
    const chat = this.chats.find(c => c.conversationId === conversationId)
    if (chat) {
      chat.updateLastMessage(message, time)
      
      // 移动到列表顶部
      const index = this.chats.indexOf(chat)
      if (index > 0) {
        this.chats.splice(index, 1)
        this.chats.unshift(chat)
      }
    }
  }

  /**
   * 更新未读消息数量
   * @param {number} conversationId 对话ID
   * @param {number} count 未读数量
   */
  updateUnreadCount(conversationId, count) {
    const chat = this.chats.find(c => c.conversationId === conversationId)
    if (chat) {
      chat.updateUnreadCount(count)
    }
  }

  /**
   * 增加未读消息数量
   * @param {number} conversationId 对话ID
   * @param {number} increment 增加数量
   */
  incrementUnreadCount(conversationId, increment = 1) {
    const chat = this.chats.find(c => c.conversationId === conversationId)
    if (chat) {
      chat.incrementUnreadCount(increment)
    }
  }

  /**
   * 过滤聊天列表
   * @param {Object} filters 过滤条件
   * @returns {Array<ChatItemModel>} 过滤后的聊天列表
   */
  filterChats(filters = {}) {
    const { searchText, roleFilter } = filters
    
    return this.chats.filter(chat => {
      if (searchText && !chat.matchesSearch(searchText)) {
        return false
      }
      
      if (roleFilter && !chat.matchesRoleFilter(roleFilter)) {
        return false
      }
      
      return true
    })
  }

  /**
   * 更新分类计数
   */
  updateCategoryCount() {
    const counts = {
      all: this.chats.length,
      designer: this.chats.filter(c => c.normalizedUserRole === ROLE_MAP.designer.userRole).length,
      supervisor: this.chats.filter(c => c.normalizedUserRole === ROLE_MAP.supervisor.userRole).length,
      user: this.chats.filter(c => c.normalizedUserRole === ROLE_MAP.user.userRole).length
    }
    
    this.categoryTabs[0].count = counts.all
    this.categoryTabs[1].count = counts.designer
    this.categoryTabs[2].count = counts.supervisor
    this.categoryTabs[3].count = counts.user
    
    return counts
  }

  /**
   * 获取所有聊天项
   * @returns {Array<ChatItemModel>}
   */
  getAllChats() {
    return [...this.chats]
  }

  /**
   * 获取分类标签
   * @returns {Array}
   */
  getCategoryTabs() {
    return [...this.categoryTabs]
  }

  /**
   * 清空聊天列表
   */
  clear() {
    this.chats = []
    this.updateCategoryCount()
  }
}