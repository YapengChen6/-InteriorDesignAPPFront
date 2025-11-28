/**
 * 消息服务
 * 负责消息的发送、接收和处理逻辑
 */

import { 
  MessageModel, 
  WebSocketMessageDTO, 
  MESSAGE_TYPES, 
  ACTION_TYPES 
} from '@/types/messageTypes'
import { 
  createTextMessage, 
  createMediaMessage, 
  createOrderRequestMessage 
} from '@/utils/websocketUtils'
import { 
  validateTextMessage, 
  validateMessageParams,
  createErrorResponse,
  createSuccessResponse
} from '@/utils/messageValidation'
import { getValidTimestamp } from '@/utils/timeUtils'

/**
 * 消息发送结果枚举
 */
export const MESSAGE_SEND_RESULT = {
  SUCCESS: 'success',
  VALIDATION_ERROR: 'validation_error',
  NETWORK_ERROR: 'network_error',
  PERMISSION_ERROR: 'permission_error',
  UNKNOWN_ERROR: 'unknown_error'
}

/**
 * 消息服务类
 */
export class MessageService {
  constructor(options = {}) {
    this.wsManager = options.wsManager || null
    this.apiClient = options.apiClient || null
    this.statusManager = options.statusManager || null
    
    // 消息发送队列
    this.sendQueue = []
    this.isProcessingQueue = false
    
    // 配置选项
    this.options = {
      enableQueue: true,
      enableRetry: true,
      maxRetryAttempts: 3,
      retryDelay: 1000,
      enableLocalEcho: true,
      ...options
    }
    
    console.log('📤 消息服务初始化完成')
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
   * 设置状态管理器
   * @param {MessageStatusManager} statusManager 状态管理器
   */
  setStatusManager(statusManager) {
    this.statusManager = statusManager
  }

  /**
   * 发送文本消息
   * @param {Object} params 消息参数
   * @returns {Promise<Object>} 发送结果
   */
  async sendTextMessage(params) {
    const { senderId, receiverId, conversationId, content, userRole } = params
    
    try {
      console.log('📤 发送文本消息:', { senderId, receiverId, conversationId, content })
      
      // 验证消息内容
      const contentValidation = validateTextMessage(content)
      if (!contentValidation.isValid) {
        return createErrorResponse(contentValidation.error)
      }
      
      // 验证消息参数
      const paramsValidation = validateMessageParams({
        senderId,
        receiverId,
        conversationId,
        content,
        messageType: MESSAGE_TYPES.NORMAL
      })
      
      if (!paramsValidation.isValid) {
        return createErrorResponse(paramsValidation.errors)
      }
      
      // 创建消息对象
      const message = createTextMessage({
        senderId,
        receiverId,
        conversationId,
        content,
        userRole: userRole || 1
      })
      
      // 发送消息
      const result = await this.sendMessage(message)
      
      if (result.success) {
        console.log('✅ 文本消息发送成功')
        return createSuccessResponse(result.data, '消息发送成功')
      } else {
        console.error('❌ 文本消息发送失败:', result.error)
        return createErrorResponse(result.error)
      }
      
    } catch (error) {
      console.error('❌ 发送文本消息异常:', error)
      return createErrorResponse('发送消息失败: ' + error.message)
    }
  }

  /**
   * 发送媒体消息
   * @param {Object} params 消息参数
   * @returns {Promise<Object>} 发送结果
   */
  async sendMediaMessage(params) {
    const { senderId, receiverId, conversationId, fileUrl, mediaType, userRole } = params
    
    try {
      console.log('📤 发送媒体消息:', { senderId, receiverId, conversationId, fileUrl, mediaType })
      
      // 验证参数
      if (!fileUrl || !mediaType) {
        return createErrorResponse('文件URL和媒体类型不能为空')
      }
      
      const paramsValidation = validateMessageParams({
        senderId,
        receiverId,
        conversationId,
        content: fileUrl,
        messageType: MESSAGE_TYPES.NORMAL
      })
      
      if (!paramsValidation.isValid) {
        return createErrorResponse(paramsValidation.errors)
      }
      
      // 创建媒体消息
      const message = createMediaMessage({
        senderId,
        receiverId,
        conversationId,
        fileUrl,
        mediaType,
        userRole: userRole || 1
      })
      
      // 发送消息
      const result = await this.sendMessage(message)
      
      if (result.success) {
        console.log('✅ 媒体消息发送成功')
        return createSuccessResponse(result.data, '媒体消息发送成功')
      } else {
        console.error('❌ 媒体消息发送失败:', result.error)
        return createErrorResponse(result.error)
      }
      
    } catch (error) {
      console.error('❌ 发送媒体消息异常:', error)
      return createErrorResponse('发送媒体消息失败: ' + error.message)
    }
  }

  /**
   * 发送订单申请消息
   * @param {Object} params 消息参数
   * @returns {Promise<Object>} 发送结果
   */
  async sendOrderRequestMessage(params) {
    const { senderId, receiverId, conversationId, content, userRole } = params
    
    try {
      console.log('📤 发送订单申请消息:', { senderId, receiverId, conversationId, content })
      
      // 检查权限（只有设计师和监理可以发送订单申请）
      if (userRole !== 2 && userRole !== 3) { // 2=设计师, 3=监理
        return createErrorResponse('只有设计师和监理可以发送订单申请')
      }
      
      // 验证参数
      const paramsValidation = validateMessageParams({
        senderId,
        receiverId,
        conversationId,
        content: content || '我想接取这个订单，请确认',
        messageType: MESSAGE_TYPES.ORDER_REQUEST
      })
      
      if (!paramsValidation.isValid) {
        return createErrorResponse(paramsValidation.errors)
      }
      
      // 创建订单申请消息
      const message = createOrderRequestMessage({
        senderId,
        receiverId,
        conversationId,
        content: content || '我想接取这个订单，请确认',
        userRole
      })
      
      // 发送消息
      const result = await this.sendMessage(message)
      
      if (result.success) {
        console.log('✅ 订单申请消息发送成功')
        return createSuccessResponse(result.data, '订单申请发送成功')
      } else {
        console.error('❌ 订单申请消息发送失败:', result.error)
        return createErrorResponse(result.error)
      }
      
    } catch (error) {
      console.error('❌ 发送订单申请消息异常:', error)
      return createErrorResponse('发送订单申请失败: ' + error.message)
    }
  }

  /**
   * 通用消息发送方法
   * @param {Object|WebSocketMessageDTO} message 消息对象
   * @returns {Promise<Object>} 发送结果
   */
  async sendMessage(message) {
    try {
      // 确保消息是WebSocketMessageDTO实例
      const messageDTO = message instanceof WebSocketMessageDTO 
        ? message 
        : new WebSocketMessageDTO(message)
      
      // 验证消息
      const validation = messageDTO.validate()
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join('; '),
          resultType: MESSAGE_SEND_RESULT.VALIDATION_ERROR
        }
      }
      
      // 如果WebSocket连接正常，直接发送
      if (this.wsManager && this.wsManager.isConnected()) {
        const success = this.wsManager.sendMessage(messageDTO)
        
        if (success) {
          return {
            success: true,
            data: messageDTO,
            resultType: MESSAGE_SEND_RESULT.SUCCESS
          }
        } else {
          // WebSocket发送失败，尝试通过API发送
          return await this.sendMessageViaAPI(messageDTO)
        }
      }
      
      // WebSocket未连接，尝试通过API发送
      if (this.apiClient) {
        return await this.sendMessageViaAPI(messageDTO)
      }
      
      // 如果启用了队列，将消息加入队列
      if (this.options.enableQueue) {
        this.addToQueue(messageDTO)
        return {
          success: true,
          data: messageDTO,
          resultType: MESSAGE_SEND_RESULT.SUCCESS,
          queued: true
        }
      }
      
      return {
        success: false,
        error: '无可用的发送方式',
        resultType: MESSAGE_SEND_RESULT.NETWORK_ERROR
      }
      
    } catch (error) {
      console.error('❌ 发送消息异常:', error)
      return {
        success: false,
        error: error.message,
        resultType: MESSAGE_SEND_RESULT.UNKNOWN_ERROR
      }
    }
  }

  /**
   * 通过API发送消息
   * @param {WebSocketMessageDTO} messageDTO 消息DTO
   * @returns {Promise<Object>} 发送结果
   */
  async sendMessageViaAPI(messageDTO) {
    try {
      if (!this.apiClient) {
        throw new Error('API客户端未配置')
      }
      
      console.log('📤 通过API发送消息:', messageDTO)
      
      const response = await this.apiClient.sendMessage({
        senderId: messageDTO.senderId,
        receiverId: messageDTO.receiverId,
        conversationId: messageDTO.conversationId,
        content: messageDTO.content,
        messageType: messageDTO.messageType,
        mediaType: messageDTO.mediaType,
        actionType: messageDTO.actionType
      })
      
      if (response.code === 200) {
        console.log('✅ API消息发送成功')
        return {
          success: true,
          data: messageDTO,
          resultType: MESSAGE_SEND_RESULT.SUCCESS,
          apiResponse: response
        }
      } else {
        console.error('❌ API消息发送失败:', response.msg)
        return {
          success: false,
          error: response.msg || 'API发送失败',
          resultType: MESSAGE_SEND_RESULT.NETWORK_ERROR
        }
      }
      
    } catch (error) {
      console.error('❌ API发送消息异常:', error)
      return {
        success: false,
        error: error.message,
        resultType: MESSAGE_SEND_RESULT.NETWORK_ERROR
      }
    }
  }

  /**
   * 添加消息到发送队列
   * @param {WebSocketMessageDTO} messageDTO 消息DTO
   */
  addToQueue(messageDTO) {
    this.sendQueue.push({
      message: messageDTO,
      timestamp: Date.now(),
      retryCount: 0
    })
    
    console.log('📦 消息已加入发送队列，队列长度:', this.sendQueue.length)
    
    // 尝试处理队列
    this.processQueue()
  }

  /**
   * 处理发送队列
   */
  async processQueue() {
    if (this.isProcessingQueue || this.sendQueue.length === 0) {
      return
    }
    
    this.isProcessingQueue = true
    console.log('📦 开始处理发送队列，队列长度:', this.sendQueue.length)
    
    try {
      while (this.sendQueue.length > 0) {
        const queueItem = this.sendQueue.shift()
        const { message, retryCount } = queueItem
        
        const result = await this.sendMessage(message)
        
        if (!result.success && this.options.enableRetry && retryCount < this.options.maxRetryAttempts) {
          // 重试
          queueItem.retryCount++
          this.sendQueue.unshift(queueItem)
          
          console.log(`📦 消息发送失败，将重试 (${queueItem.retryCount}/${this.options.maxRetryAttempts})`)
          
          // 等待重试延迟
          await new Promise(resolve => setTimeout(resolve, this.options.retryDelay))
        } else if (!result.success) {
          console.error('❌ 消息发送最终失败，放弃重试:', message.content)
        } else {
          console.log('✅ 队列消息发送成功:', message.content)
        }
      }
    } catch (error) {
      console.error('❌ 处理发送队列异常:', error)
    } finally {
      this.isProcessingQueue = false
    }
  }

  /**
   * 处理接收到的消息
   * @param {Object} messageData 消息数据
   * @returns {MessageModel} 处理后的消息模型
   */
  processReceivedMessage(messageData) {
    try {
      console.log('📨 处理接收到的消息:', messageData)
      
      // 创建消息模型
      const message = MessageModel.fromBackendData(messageData)
      
      // 验证消息
      const validation = message.validate()
      if (!validation.isValid) {
        console.warn('⚠️ 接收到无效消息:', validation.errors)
        return null
      }
      
      // 处理时间戳
      const validTime = getValidTimestamp(messageData)
      message.sendTime = validTime
      message.createTime = validTime
      
      console.log('✅ 消息处理完成:', message)
      return message
      
    } catch (error) {
      console.error('❌ 处理接收消息异常:', error)
      return null
    }
  }

  /**
   * 重发失败的消息
   * @param {WebSocketMessageDTO} messageDTO 消息DTO
   * @returns {Promise<Object>} 发送结果
   */
  async resendMessage(messageDTO) {
    console.log('🔄 重发消息:', messageDTO)
    return await this.sendMessage(messageDTO)
  }

  /**
   * 获取发送队列状态
   * @returns {Object} 队列状态
   */
  getQueueStatus() {
    return {
      queueLength: this.sendQueue.length,
      isProcessing: this.isProcessingQueue,
      messages: this.sendQueue.map(item => ({
        content: item.message.content,
        timestamp: item.timestamp,
        retryCount: item.retryCount
      }))
    }
  }

  /**
   * 清空发送队列
   */
  clearQueue() {
    this.sendQueue = []
    console.log('📦 发送队列已清空')
  }

  /**
   * 销毁服务
   */
  destroy() {
    this.clearQueue()
    this.isProcessingQueue = false
    console.log('📤 消息服务已销毁')
  }
}

/**
 * 创建消息服务实例
 * @param {Object} options 配置选项
 * @returns {MessageService}
 */
export function createMessageService(options = {}) {
  return new MessageService(options)
}

/**
 * 全局消息服务实例
 */
let globalMessageService = null

/**
 * 获取全局消息服务实例
 * @param {Object} options 配置选项（仅在首次创建时使用）
 * @returns {MessageService}
 */
export function getGlobalMessageService(options = {}) {
  if (!globalMessageService) {
    globalMessageService = new MessageService(options)
  }
  return globalMessageService
}

/**
 * 销毁全局消息服务实例
 */
export function destroyGlobalMessageService() {
  if (globalMessageService) {
    globalMessageService.destroy()
    globalMessageService = null
  }
}