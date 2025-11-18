/**
 * WebSocket 连接管理工具
 * 
 * 功能:
 * - 建立和管理 WebSocket 连接
 * - 处理消息发送和接收
 * - 实现自动重连机制
 * - 心跳检测
 */

class WebSocketManager {
  constructor(config = {}) {
    this.url = config.url || 'ws://localhost:8080/ws/chat'
    this.userId = config.userId || 0
    this.ws = null
    this.connected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = config.maxReconnectAttempts || 5
    this.reconnectDelay = config.reconnectDelay || 3000
    this.heartbeatInterval = null
    this.heartbeatDelay = config.heartbeatDelay || 30000
    this.messageHandlers = []
    this.connectionHandlers = []
    this.errorHandlers = []
  }

  /**
   * 连接到 WebSocket 服务器
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${this.url}?userId=${this.userId}`
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          this.connected = true
          this.reconnectAttempts = 0
          console.log('[WebSocket] 连接成功')
          this.startHeartbeat()
          this.notifyConnectionHandlers(true)
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('[WebSocket] 收到消息:', data)
            this.notifyMessageHandlers(data)
          } catch (e) {
            console.error('[WebSocket] 消息解析失败:', e)
          }
        }

        this.ws.onerror = (error) => {
          console.error('[WebSocket] 连接错误:', error)
          this.notifyErrorHandlers(error)
          reject(error)
        }

        this.ws.onclose = () => {
          this.connected = false
          console.log('[WebSocket] 连接已关闭')
          this.stopHeartbeat()
          this.notifyConnectionHandlers(false)
          this.attemptReconnect()
        }
      } catch (e) {
        console.error('[WebSocket] 连接失败:', e)
        reject(e)
      }
    })
  }

  /**
   * 发送消息
   */
  send(message) {
    if (!this.connected || !this.ws) {
      console.warn('[WebSocket] 未连接，无法发送消息')
      return false
    }

    try {
      const data = typeof message === 'string' ? message : JSON.stringify(message)
      this.ws.send(data)
      console.log('[WebSocket] 消息已发送:', message)
      return true
    } catch (e) {
      console.error('[WebSocket] 发送消息失败:', e)
      return false
    }
  }

  /**
   * 发送文本消息
   */
  sendTextMessage(receiverId, conversationId, content) {
    const message = {
      action: 'send',
      messageType: 1,
      senderId: this.userId,
      receiverId: receiverId,
      conversationId: conversationId,
      content: content,
      sendTime: Date.now()
    }
    return this.send(message)
  }

  /**
   * 发送订单申请消息
   */
  sendOrderMessage(receiverId, conversationId, templateId = 1) {
    const message = {
      action: 'send',
      messageType: 2,
      senderId: this.userId,
      receiverId: receiverId,
      conversationId: conversationId,
      content: '我想接取这个订单，请确认',
      templateId: templateId,
      actionType: 1,
      sendTime: Date.now()
    }
    return this.send(message)
  }

  /**
   * 标记消息为已读
   */
  markAsRead(messageId) {
    const message = {
      action: 'read',
      messageId: messageId,
      sendTime: Date.now()
    }
    return this.send(message)
  }

  /**
   * 确认订单
   */
  confirmOrder(messageId, orderApplicationId) {
    const message = {
      action: 'confirm',
      messageId: messageId,
      orderApplicationId: orderApplicationId,
      sendTime: Date.now()
    }
    return this.send(message)
  }

  /**
   * 心跳检测
   */
  startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatInterval = setInterval(() => {
      if (this.connected) {
        this.send({
          action: 'ping',
          sendTime: Date.now()
        })
      }
    }, this.heartbeatDelay)
  }

  /**
   * 停止心跳检测
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * 尝试重新连接
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] 重连次数已达上限')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * this.reconnectAttempts
    console.log(`[WebSocket] ${delay}ms 后进行第 ${this.reconnectAttempts} 次重连`)

    setTimeout(() => {
      this.connect().catch(e => {
        console.error('[WebSocket] 重连失败:', e)
      })
    }, delay)
  }

  /**
   * 注册消息处理器
   */
  onMessage(handler) {
    this.messageHandlers.push(handler)
  }

  /**
   * 注册连接状态处理器
   */
  onConnectionChange(handler) {
    this.connectionHandlers.push(handler)
  }

  /**
   * 注册错误处理器
   */
  onError(handler) {
    this.errorHandlers.push(handler)
  }

  /**
   * 通知消息处理器
   */
  notifyMessageHandlers(data) {
    this.messageHandlers.forEach(handler => {
      try {
        handler(data)
      } catch (e) {
        console.error('[WebSocket] 消息处理器执行失败:', e)
      }
    })
  }

  /**
   * 通知连接状态处理器
   */
  notifyConnectionHandlers(connected) {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected)
      } catch (e) {
        console.error('[WebSocket] 连接处理器执行失败:', e)
      }
    })
  }

  /**
   * 通知错误处理器
   */
  notifyErrorHandlers(error) {
    this.errorHandlers.forEach(handler => {
      try {
        handler(error)
      } catch (e) {
        console.error('[WebSocket] 错误处理器执行失败:', e)
      }
    })
  }

  /**
   * 断开连接
   */
  disconnect() {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.connected = false
  }

  /**
   * 获取连接状态
   */
  isConnected() {
    return this.connected
  }
}

export default WebSocketManager

