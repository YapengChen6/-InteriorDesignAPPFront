/**
 * WebSocket连接管理器
 * 负责WebSocket连接的建立、维护、重连和消息处理
 */

import { WebSocketMessageDTO } from '@/types/messageTypes'
import { processReceivedMessage, determineMessageSender } from './websocketUtils'

/**
 * WebSocket连接状态枚举
 */
export const WS_CONNECTION_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error'
}

/**
 * WebSocket事件类型
 */
export const WS_EVENTS = {
  CONNECTION_CHANGE: 'connectionChange',
  MESSAGE_RECEIVED: 'messageReceived',
  MESSAGE_SENT: 'messageSent',
  ERROR: 'error',
  RECONNECT_ATTEMPT: 'reconnectAttempt'
}

/**
 * WebSocket管理器类
 */
export class WebSocketManager {
  constructor(options = {}) {
    this.ws = null
    this.status = WS_CONNECTION_STATUS.DISCONNECTED
    this.userId = null
    // 生产环境必须使用WSS协议
    this.baseUrl = options.baseUrl || 'wss://your-domain.com'
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5
    this.reconnectInterval = options.reconnectInterval || 3000
    this.heartbeatInterval = options.heartbeatInterval || 30000
    this.heartbeatTimer = null
    this.reconnectTimer = null
    
    // 事件监听器
    this.eventListeners = new Map()
    
    // 消息队列（连接断开时暂存消息）
    this.messageQueue = []
    
    // 配置选项
    this.options = {
      autoReconnect: true,
      enableHeartbeat: true,
      enableMessageQueue: true,
      ...options
    }
    
    console.log('🔌 WebSocket管理器初始化完成')
  }

  /**
   * 连接WebSocket
   * @param {number} userId 用户ID
   * @returns {Promise<boolean>} 连接是否成功
   */
  async connect(userId) {
    if (!userId) {
      console.error('❌ 用户ID不能为空')
      return false
    }

    this.userId = userId
    const wsUrl = `${this.baseUrl}/ws/chat?userId=${userId}`
    
    console.log('🔌 开始连接WebSocket:', wsUrl)
    this.setStatus(WS_CONNECTION_STATUS.CONNECTING)

    try {
      this.ws = new WebSocket(wsUrl)
      this.setupEventHandlers()
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.error('❌ WebSocket连接超时')
          this.setStatus(WS_CONNECTION_STATUS.ERROR)
          resolve(false)
        }, 10000)

        this.ws.onopen = () => {
          clearTimeout(timeout)
          this.onConnectionOpen()
          resolve(true)
        }

        this.ws.onerror = () => {
          clearTimeout(timeout)
          resolve(false)
        }
      })
    } catch (error) {
      console.error('❌ WebSocket连接失败:', error)
      this.setStatus(WS_CONNECTION_STATUS.ERROR)
      return false
    }
  }

  /**
   * 设置WebSocket事件处理器
   */
  setupEventHandlers() {
    if (!this.ws) return

    this.ws.onopen = () => {
      this.onConnectionOpen()
    }

    this.ws.onmessage = (event) => {
      this.onMessageReceived(event)
    }

    this.ws.onerror = (error) => {
      this.onConnectionError(error)
    }

    this.ws.onclose = (event) => {
      this.onConnectionClose(event)
    }
  }

  /**
   * 连接打开处理
   */
  onConnectionOpen() {
    console.log('✅ WebSocket连接成功')
    this.setStatus(WS_CONNECTION_STATUS.CONNECTED)
    this.reconnectAttempts = 0
    
    // 启动心跳
    if (this.options.enableHeartbeat) {
      this.startHeartbeat()
    }
    
    // 发送队列中的消息
    if (this.options.enableMessageQueue) {
      this.sendQueuedMessages()
    }
    
    this.emit(WS_EVENTS.CONNECTION_CHANGE, {
      status: this.status,
      connected: true
    })
  }

  /**
   * 消息接收处理
   * @param {MessageEvent} event 消息事件
   */
  onMessageReceived(event) {
    try {
      const data = JSON.parse(event.data)
      console.log('📨 收到WebSocket消息:', data)
      
      // 处理心跳响应
      if (data.type === 'heartbeat') {
        console.log('💓 收到心跳响应')
        return
      }
      
      // 创建WebSocket消息DTO
      const messageDTO = WebSocketMessageDTO.fromWebSocketData(data)
      
      // 验证消息
      const validation = messageDTO.validate()
      if (!validation.isValid) {
        console.warn('⚠️ 收到无效消息:', validation.errors)
        return
      }
      
      this.emit(WS_EVENTS.MESSAGE_RECEIVED, {
        message: messageDTO,
        rawData: data
      })
      
    } catch (error) {
      console.error('❌ 解析WebSocket消息失败:', error)
      this.emit(WS_EVENTS.ERROR, {
        type: 'message_parse_error',
        error: error,
        rawData: event.data
      })
    }
  }

  /**
   * 连接错误处理
   * @param {Event} error 错误事件
   */
  onConnectionError(error) {
    console.error('❌ WebSocket连接错误:', error)
    this.setStatus(WS_CONNECTION_STATUS.ERROR)
    
    this.emit(WS_EVENTS.ERROR, {
      type: 'connection_error',
      error: error
    })
  }

  /**
   * 连接关闭处理
   * @param {CloseEvent} event 关闭事件
   */
  onConnectionClose(event) {
    console.log('❌ WebSocket连接已断开', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    })
    
    this.setStatus(WS_CONNECTION_STATUS.DISCONNECTED)
    this.stopHeartbeat()
    
    this.emit(WS_EVENTS.CONNECTION_CHANGE, {
      status: this.status,
      connected: false,
      code: event.code,
      reason: event.reason
    })
    
    // 自动重连
    if (this.options.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect()
    }
  }

  /**
   * 发送消息
   * @param {Object|WebSocketMessageDTO} message 消息对象
   * @returns {boolean} 发送是否成功
   */
  sendMessage(message) {
    // 确保消息是WebSocketMessageDTO实例
    const messageDTO = message instanceof WebSocketMessageDTO 
      ? message 
      : new WebSocketMessageDTO(message)
    
    // 验证消息
    const validation = messageDTO.validate()
    if (!validation.isValid) {
      console.error('❌ 消息验证失败:', validation.errors)
      return false
    }
    
    // 如果连接正常，直接发送
    if (this.isConnected()) {
      try {
        const jsonMessage = messageDTO.toJSON()
        this.ws.send(jsonMessage)
        
        console.log('📤 消息发送成功:', messageDTO)
        this.emit(WS_EVENTS.MESSAGE_SENT, { message: messageDTO })
        return true
      } catch (error) {
        console.error('❌ 消息发送失败:', error)
        this.emit(WS_EVENTS.ERROR, {
          type: 'message_send_error',
          error: error,
          message: messageDTO
        })
        return false
      }
    }
    
    // 如果连接断开且启用了消息队列，将消息加入队列
    if (this.options.enableMessageQueue) {
      this.messageQueue.push(messageDTO)
      console.log('📦 消息已加入队列，等待连接恢复')
      return true
    }
    
    console.error('❌ WebSocket未连接，消息发送失败')
    return false
  }

  /**
   * 发送队列中的消息
   */
  sendQueuedMessages() {
    if (this.messageQueue.length === 0) return
    
    console.log(`📦 发送队列中的${this.messageQueue.length}条消息`)
    
    const messages = [...this.messageQueue]
    this.messageQueue = []
    
    messages.forEach(message => {
      this.sendMessage(message)
    })
  }

  /**
   * 启动心跳
   */
  startHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
    }
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        try {
          this.ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }))
          console.log('💓 发送心跳')
        } catch (error) {
          console.error('❌ 心跳发送失败:', error)
        }
      }
    }, this.heartbeatInterval)
  }

  /**
   * 停止心跳
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * 安排重连
   */
  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    
    this.reconnectAttempts++
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1) // 指数退避
    
    console.log(`🔄 ${delay}ms后进行第${this.reconnectAttempts}次重连尝试`)
    this.setStatus(WS_CONNECTION_STATUS.RECONNECTING)
    
    this.emit(WS_EVENTS.RECONNECT_ATTEMPT, {
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      delay: delay
    })
    
    this.reconnectTimer = setTimeout(() => {
      this.connect(this.userId)
    }, delay)
  }

  /**
   * 手动重连
   */
  reconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    
    this.reconnectAttempts = 0
    return this.connect(this.userId)
  }

  /**
   * 断开连接
   */
  disconnect() {
    console.log('🔌 主动断开WebSocket连接')
    
    this.options.autoReconnect = false // 禁用自动重连
    this.stopHeartbeat()
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    
    if (this.ws) {
      this.ws.close(1000, '主动断开')
      this.ws = null
    }
    
    this.setStatus(WS_CONNECTION_STATUS.DISCONNECTED)
  }

  /**
   * 检查是否已连接
   * @returns {boolean}
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN
  }

  /**
   * 获取连接状态
   * @returns {string}
   */
  getStatus() {
    return this.status
  }

  /**
   * 设置连接状态
   * @param {string} status 状态
   */
  setStatus(status) {
    if (this.status !== status) {
      const oldStatus = this.status
      this.status = status
      console.log(`🔄 WebSocket状态变更: ${oldStatus} -> ${status}`)
    }
  }

  /**
   * 添加事件监听器
   * @param {string} event 事件名称
   * @param {Function} listener 监听器函数
   */
  on(event, listener) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event).push(listener)
  }

  /**
   * 移除事件监听器
   * @param {string} event 事件名称
   * @param {Function} listener 监听器函数
   */
  off(event, listener) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event)
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * 触发事件
   * @param {string} event 事件名称
   * @param {*} data 事件数据
   */
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(listener => {
        try {
          listener(data)
        } catch (error) {
          console.error(`❌ 事件监听器执行失败 [${event}]:`, error)
        }
      })
    }
  }

  /**
   * 清空消息队列
   */
  clearMessageQueue() {
    this.messageQueue = []
  }

  /**
   * 获取队列中的消息数量
   * @returns {number}
   */
  getQueuedMessageCount() {
    return this.messageQueue.length
  }

  /**
   * 获取连接信息
   * @returns {Object}
   */
  getConnectionInfo() {
    return {
      status: this.status,
      connected: this.isConnected(),
      userId: this.userId,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      url: this.ws ? this.ws.url : null
    }
  }
}

/**
 * 创建WebSocket管理器实例
 * @param {Object} options 配置选项
 * @returns {WebSocketManager}
 */
export function createWebSocketManager(options = {}) {
  return new WebSocketManager(options)
}

/**
 * 全局WebSocket管理器实例
 */
let globalWSManager = null

/**
 * 获取全局WebSocket管理器实例
 * @param {Object} options 配置选项（仅在首次创建时使用）
 * @returns {WebSocketManager}
 */
export function getGlobalWebSocketManager(options = {}) {
  if (!globalWSManager) {
    globalWSManager = new WebSocketManager(options)
  }
  return globalWSManager
}

/**
 * 销毁全局WebSocket管理器实例
 */
export function destroyGlobalWebSocketManager() {
  if (globalWSManager) {
    globalWSManager.disconnect()
    globalWSManager = null
  }
}