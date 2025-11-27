/**
 * 消息状态管理器
 * 负责管理消息的已读状态、接收状态等
 */

import { MESSAGE_STATUS, RECEIVE_STATUS } from '@/types/messageTypes'
import { createReadConfirmMessage } from './websocketUtils'

/**
 * 消息状态管理器类
 */
export class MessageStatusManager {
  constructor(options = {}) {
    this.wsManager = options.wsManager || null
    this.apiClient = options.apiClient || null
    
    // 消息状态缓存
    this.messageStatusCache = new Map()
    
    // 批量操作队列
    this.readStatusQueue = new Set()
    this.batchUpdateTimer = null
    this.batchUpdateDelay = options.batchUpdateDelay || 1000
    
    // 配置选项
    this.options = {
      enableBatchUpdate: true,
      enableLocalCache: true,
      enableWebSocketSync: true,
      enableApiSync: true,
      ...options
    }
    
    console.log('📖 消息状态管理器初始化完成')
  }

  /**
   * 设置WebSocket管理器
   * @param {WebSocketManager} wsManager WebSocket管理器
   */
  setWebSocketManager(wsManager) {
    this.wsManager = wsManager
  }

  /**
   * 设置API客户端
   * @param {Object} apiClient API客户端
   */
  setApiClient(apiClient) {
    this.apiClient = apiClient
  }

  /**
   * 标记单条消息为已读
   * @param {Object} params 参数
   * @returns {Promise<boolean>} 操作是否成功
   */
  async markMessageAsRead(params) {
    const { messageId, conversationId, senderId, receiverId, userId } = params
    
    try {
      console.log('📖 标记消息为已读:', { messageId, conversationId, userId })
      
      // 更新本地缓存
      if (this.options.enableLocalCache) {
        this.updateLocalMessageStatus(messageId, {
          readStatus: MESSAGE_STATUS.READ,
          readTime: Date.now()
        })
      }
      
      // 通过WebSocket发送已读确认
      if (this.options.enableWebSocketSync && this.wsManager && this.wsManager.isConnected()) {
        const readMessage = createReadConfirmMessage({
          conversationId,
          senderId: receiverId || userId, // 接收者作为已读确认的发送者
          receiverId: senderId
        })
        
        const success = this.wsManager.sendMessage(readMessage)
        if (success) {
          console.log('✅ WebSocket已读确认发送成功')
        }
      }
      
      // 通过API同步已读状态
      if (this.options.enableApiSync && this.apiClient) {
        try {
          await this.apiClient.markMessageAsRead(messageId, userId)
          console.log('✅ API已读状态同步成功')
        } catch (apiError) {
          console.warn('⚠️ API已读状态同步失败，但WebSocket已发送:', apiError)
        }
      }
      
      return true
    } catch (error) {
      console.error('❌ 标记消息已读失败:', error)
      return false
    }
  }

  /**
   * 批量标记消息为已读
   * @param {Array} messageIds 消息ID列表
   * @param {number} userId 用户ID
   * @returns {Promise<boolean>} 操作是否成功
   */
  async markMessagesAsReadBatch(messageIds, userId) {
    if (!messageIds || messageIds.length === 0) {
      return true
    }
    
    try {
      console.log('📖 批量标记消息为已读:', { messageIds, userId })
      
      // 更新本地缓存
      if (this.options.enableLocalCache) {
        messageIds.forEach(messageId => {
          this.updateLocalMessageStatus(messageId, {
            readStatus: MESSAGE_STATUS.READ,
            readTime: Date.now()
          })
        })
      }
      
      // 通过API批量更新
      if (this.options.enableApiSync && this.apiClient) {
        await this.apiClient.markMessagesAsReadBatch(messageIds, userId)
        console.log('✅ 批量已读状态更新成功')
      }
      
      return true
    } catch (error) {
      console.error('❌ 批量标记消息已读失败:', error)
      return false
    }
  }

  /**
   * 自动标记对话中的未读消息为已读
   * @param {Object} params 参数
   * @returns {Promise<boolean>} 操作是否成功
   */
  async autoMarkConversationAsRead(params) {
    const { conversationId, currentUserId, otherUserId, messages = [] } = params
    
    try {
      console.log('📖 自动标记对话消息为已读:', { conversationId, currentUserId })
      
      // 找出未读的消息
      const unreadMessages = messages.filter(msg => 
        !msg.isSender && // 不是当前用户发送的
        msg.readStatus === MESSAGE_STATUS.UNREAD // 未读状态
      )
      
      if (unreadMessages.length === 0) {
        console.log('📖 没有未读消息需要标记')
        return true
      }
      
      // 通过WebSocket发送已读确认
      if (this.options.enableWebSocketSync && this.wsManager && this.wsManager.isConnected()) {
        const readMessage = createReadConfirmMessage({
          conversationId,
          senderId: currentUserId,
          receiverId: otherUserId
        })
        
        this.wsManager.sendMessage(readMessage)
        console.log('✅ 已发送对话已读确认')
      }
      
      // 批量标记消息为已读
      const messageIds = unreadMessages.map(msg => msg.messageId).filter(id => id)
      if (messageIds.length > 0) {
        await this.markMessagesAsReadBatch(messageIds, currentUserId)
      }
      
      return true
    } catch (error) {
      console.error('❌ 自动标记对话已读失败:', error)
      return false
    }
  }

  /**
   * 添加消息到已读队列（用于批量处理）
   * @param {number} messageId 消息ID
   */
  queueMessageForRead(messageId) {
    if (!this.options.enableBatchUpdate) {
      return
    }
    
    this.readStatusQueue.add(messageId)
    
    // 设置批量更新定时器
    if (this.batchUpdateTimer) {
      clearTimeout(this.batchUpdateTimer)
    }
    
    this.batchUpdateTimer = setTimeout(() => {
      this.processBatchReadUpdate()
    }, this.batchUpdateDelay)
  }

  /**
   * 处理批量已读更新
   */
  async processBatchReadUpdate() {
    if (this.readStatusQueue.size === 0) {
      return
    }
    
    const messageIds = Array.from(this.readStatusQueue)
    this.readStatusQueue.clear()
    
    console.log('📖 处理批量已读更新:', messageIds)
    
    try {
      // 这里需要用户ID，实际使用时需要从上下文获取
      // await this.markMessagesAsReadBatch(messageIds, userId)
      console.log('📖 批量已读更新完成')
    } catch (error) {
      console.error('❌ 批量已读更新失败:', error)
    }
  }

  /**
   * 更新本地消息状态缓存
   * @param {number} messageId 消息ID
   * @param {Object} statusUpdate 状态更新
   */
  updateLocalMessageStatus(messageId, statusUpdate) {
    if (!this.options.enableLocalCache) {
      return
    }
    
    const currentStatus = this.messageStatusCache.get(messageId) || {}
    const updatedStatus = {
      ...currentStatus,
      ...statusUpdate,
      updateTime: Date.now()
    }
    
    this.messageStatusCache.set(messageId, updatedStatus)
    console.log('📖 本地消息状态已更新:', { messageId, status: updatedStatus })
  }

  /**
   * 获取本地消息状态
   * @param {number} messageId 消息ID
   * @returns {Object|null} 消息状态
   */
  getLocalMessageStatus(messageId) {
    return this.messageStatusCache.get(messageId) || null
  }

  /**
   * 检查消息是否已读
   * @param {number} messageId 消息ID
   * @returns {boolean} 是否已读
   */
  isMessageRead(messageId) {
    const status = this.getLocalMessageStatus(messageId)
    return status ? status.readStatus === MESSAGE_STATUS.READ : false
  }

  /**
   * 检查消息是否已接收
   * @param {number} messageId 消息ID
   * @returns {boolean} 是否已接收
   */
  isMessageReceived(messageId) {
    const status = this.getLocalMessageStatus(messageId)
    return status ? status.receiveStatus === RECEIVE_STATUS.RECEIVED : false
  }

  /**
   * 处理接收到的已读确认
   * @param {Object} readConfirmData 已读确认数据
   */
  handleReadConfirmation(readConfirmData) {
    const { conversationId, senderId, receiverId } = readConfirmData
    
    console.log('📖 收到已读确认:', { conversationId, senderId, receiverId })
    
    // 更新相关消息的已读状态
    // 这里可以根据对话ID和发送者ID找到相关消息并更新状态
    
    // 触发已读状态变更事件
    this.emit('readConfirmationReceived', {
      conversationId,
      senderId,
      receiverId,
      timestamp: Date.now()
    })
  }

  /**
   * 获取对话的未读消息数量
   * @param {number} conversationId 对话ID
   * @param {number} userId 用户ID
   * @returns {number} 未读消息数量
   */
  getUnreadMessageCount(conversationId, userId) {
    let count = 0
    
    for (const [messageId, status] of this.messageStatusCache) {
      if (status.conversationId === conversationId && 
          status.userId === userId && 
          status.readStatus === MESSAGE_STATUS.UNREAD) {
        count++
      }
    }
    
    return count
  }

  /**
   * 清除对话的未读状态
   * @param {number} conversationId 对话ID
   * @param {number} userId 用户ID
   */
  clearConversationUnreadStatus(conversationId, userId) {
    for (const [messageId, status] of this.messageStatusCache) {
      if (status.conversationId === conversationId && status.userId === userId) {
        this.updateLocalMessageStatus(messageId, {
          readStatus: MESSAGE_STATUS.READ,
          readTime: Date.now()
        })
      }
    }
    
    console.log('📖 已清除对话未读状态:', { conversationId, userId })
  }

  /**
   * 同步服务器消息状态
   * @param {Array} messageStatuses 服务器消息状态列表
   */
  syncServerMessageStatuses(messageStatuses) {
    if (!this.options.enableLocalCache) {
      return
    }
    
    messageStatuses.forEach(status => {
      this.updateLocalMessageStatus(status.messageId, {
        readStatus: status.readStatus,
        receiveStatus: status.receiveStatus,
        userId: status.userId,
        conversationId: status.conversationId
      })
    })
    
    console.log('📖 服务器消息状态同步完成:', messageStatuses.length)
  }

  /**
   * 清空本地缓存
   */
  clearLocalCache() {
    this.messageStatusCache.clear()
    console.log('📖 本地消息状态缓存已清空')
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 缓存统计
   */
  getCacheStats() {
    const totalMessages = this.messageStatusCache.size
    let readCount = 0
    let unreadCount = 0
    
    for (const status of this.messageStatusCache.values()) {
      if (status.readStatus === MESSAGE_STATUS.READ) {
        readCount++
      } else {
        unreadCount++
      }
    }
    
    return {
      totalMessages,
      readCount,
      unreadCount,
      queuedForRead: this.readStatusQueue.size
    }
  }

  /**
   * 销毁管理器
   */
  destroy() {
    if (this.batchUpdateTimer) {
      clearTimeout(this.batchUpdateTimer)
    }
    
    this.clearLocalCache()
    this.readStatusQueue.clear()
    
    console.log('📖 消息状态管理器已销毁')
  }

  /**
   * 事件发射器（简单实现）
   */
  emit(event, data) {
    // 这里可以实现事件发射逻辑
    console.log(`📖 事件触发 [${event}]:`, data)
  }
}

/**
 * 创建消息状态管理器实例
 * @param {Object} options 配置选项
 * @returns {MessageStatusManager}
 */
export function createMessageStatusManager(options = {}) {
  return new MessageStatusManager(options)
}

/**
 * 全局消息状态管理器实例
 */
let globalStatusManager = null

/**
 * 获取全局消息状态管理器实例
 * @param {Object} options 配置选项（仅在首次创建时使用）
 * @returns {MessageStatusManager}
 */
export function getGlobalMessageStatusManager(options = {}) {
  if (!globalStatusManager) {
    globalStatusManager = new MessageStatusManager(options)
  }
  return globalStatusManager
}

/**
 * 销毁全局消息状态管理器实例
 */
export function destroyGlobalMessageStatusManager() {
  if (globalStatusManager) {
    globalStatusManager.destroy()
    globalStatusManager = null
  }
}