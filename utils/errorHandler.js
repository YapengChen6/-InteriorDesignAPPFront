/**
 * 错误处理管理器
 * 统一处理聊天系统中的各种错误情况
 */

/**
 * 错误类型枚举
 */
export const ERROR_TYPES = {
  NETWORK_ERROR: 'network_error',
  VALIDATION_ERROR: 'validation_error',
  PERMISSION_ERROR: 'permission_error',
  WEBSOCKET_ERROR: 'websocket_error',
  FILE_UPLOAD_ERROR: 'file_upload_error',
  MESSAGE_SEND_ERROR: 'message_send_error',
  USER_AUTH_ERROR: 'user_auth_error',
  DATA_PARSE_ERROR: 'data_parse_error',
  UNKNOWN_ERROR: 'unknown_error'
}

/**
 * 错误严重程度枚举
 */
export const ERROR_SEVERITY = {
  LOW: 'low',       // 轻微错误，不影响主要功能
  MEDIUM: 'medium', // 中等错误，影响部分功能
  HIGH: 'high',     // 严重错误，影响核心功能
  CRITICAL: 'critical' // 致命错误，系统无法正常工作
}

/**
 * 错误处理策略枚举
 */
export const ERROR_STRATEGIES = {
  SHOW_TOAST: 'show_toast',           // 显示Toast提示
  SHOW_MODAL: 'show_modal',           // 显示模态框
  RETRY: 'retry',                     // 自动重试
  FALLBACK: 'fallback',               // 使用备用方案
  IGNORE: 'ignore',                   // 忽略错误
  LOG_ONLY: 'log_only'                // 仅记录日志
}

/**
 * 错误信息类
 */
export class ErrorInfo {
  constructor(options = {}) {
    this.id = Date.now() + Math.random().toString(36).substr(2, 9)
    this.type = options.type || ERROR_TYPES.UNKNOWN_ERROR
    this.severity = options.severity || ERROR_SEVERITY.MEDIUM
    this.message = options.message || '未知错误'
    this.originalError = options.originalError || null
    this.context = options.context || {}
    this.timestamp = Date.now()
    this.handled = false
    this.retryCount = 0
    this.maxRetries = options.maxRetries || 0
  }

  /**
   * 获取用户友好的错误消息
   * @returns {string} 用户友好的错误消息
   */
  getUserFriendlyMessage() {
    const messageMap = {
      [ERROR_TYPES.NETWORK_ERROR]: '网络连接异常，请检查网络设置',
      [ERROR_TYPES.VALIDATION_ERROR]: '输入信息有误，请检查后重试',
      [ERROR_TYPES.PERMISSION_ERROR]: '权限不足，无法执行此操作',
      [ERROR_TYPES.WEBSOCKET_ERROR]: '连接已断开，正在尝试重新连接',
      [ERROR_TYPES.FILE_UPLOAD_ERROR]: '文件上传失败，请重试',
      [ERROR_TYPES.MESSAGE_SEND_ERROR]: '消息发送失败，请重试',
      [ERROR_TYPES.USER_AUTH_ERROR]: '用户认证失败，请重新登录',
      [ERROR_TYPES.DATA_PARSE_ERROR]: '数据解析失败，请刷新页面',
      [ERROR_TYPES.UNKNOWN_ERROR]: '操作失败，请稍后重试'
    }
    
    return messageMap[this.type] || this.message
  }

  /**
   * 检查是否可以重试
   * @returns {boolean} 是否可以重试
   */
  canRetry() {
    return this.retryCount < this.maxRetries
  }

  /**
   * 增加重试次数
   */
  incrementRetry() {
    this.retryCount++
  }

  /**
   * 标记为已处理
   */
  markAsHandled() {
    this.handled = true
  }

  /**
   * 获取错误详情
   * @returns {Object} 错误详情
   */
  getDetails() {
    return {
      id: this.id,
      type: this.type,
      severity: this.severity,
      message: this.message,
      userMessage: this.getUserFriendlyMessage(),
      context: this.context,
      timestamp: this.timestamp,
      handled: this.handled,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      canRetry: this.canRetry()
    }
  }
}

/**
 * 错误处理管理器类
 */
export class ErrorHandler {
  constructor(options = {}) {
    this.errors = new Map()
    this.errorListeners = new Map()
    
    // 配置选项
    this.options = {
      enableLogging: true,
      enableUserNotification: true,
      enableAutoRetry: true,
      maxErrorHistory: 100,
      ...options
    }
    
    // 错误处理策略配置
    this.strategies = new Map([
      [ERROR_TYPES.NETWORK_ERROR, ERROR_STRATEGIES.RETRY],
      [ERROR_TYPES.VALIDATION_ERROR, ERROR_STRATEGIES.SHOW_TOAST],
      [ERROR_TYPES.PERMISSION_ERROR, ERROR_STRATEGIES.SHOW_MODAL],
      [ERROR_TYPES.WEBSOCKET_ERROR, ERROR_STRATEGIES.RETRY],
      [ERROR_TYPES.FILE_UPLOAD_ERROR, ERROR_STRATEGIES.SHOW_TOAST],
      [ERROR_TYPES.MESSAGE_SEND_ERROR, ERROR_STRATEGIES.RETRY],
      [ERROR_TYPES.USER_AUTH_ERROR, ERROR_STRATEGIES.SHOW_MODAL],
      [ERROR_TYPES.DATA_PARSE_ERROR, ERROR_STRATEGIES.SHOW_TOAST],
      [ERROR_TYPES.UNKNOWN_ERROR, ERROR_STRATEGIES.SHOW_TOAST]
    ])
    
    console.log('🚨 错误处理管理器初始化完成')
  }

  /**
   * 处理错误
   * @param {Error|string|Object} error 错误对象
   * @param {Object} options 处理选项
   * @returns {ErrorInfo} 错误信息对象
   */
  handleError(error, options = {}) {
    try {
      // 创建错误信息对象
      const errorInfo = this.createErrorInfo(error, options)
      
      // 记录错误
      this.recordError(errorInfo)
      
      // 执行错误处理策略
      this.executeStrategy(errorInfo)
      
      // 触发错误事件
      this.emitError(errorInfo)
      
      return errorInfo
      
    } catch (handlingError) {
      console.error('❌ 错误处理器本身发生错误:', handlingError)
      return null
    }
  }

  /**
   * 创建错误信息对象
   * @param {*} error 原始错误
   * @param {Object} options 选项
   * @returns {ErrorInfo} 错误信息对象
   */
  createErrorInfo(error, options) {
    let errorType = ERROR_TYPES.UNKNOWN_ERROR
    let message = '未知错误'
    let severity = ERROR_SEVERITY.MEDIUM
    
    // 根据错误类型和内容推断错误信息
    if (typeof error === 'string') {
      message = error
      errorType = this.inferErrorType(error)
    } else if (error instanceof Error) {
      message = error.message
      errorType = this.inferErrorType(error.message)
      
      // 网络错误检测
      if (error.name === 'NetworkError' || message.includes('网络') || message.includes('连接')) {
        errorType = ERROR_TYPES.NETWORK_ERROR
      }
    } else if (typeof error === 'object' && error !== null) {
      message = error.message || error.msg || error.errMsg || '操作失败'
      errorType = error.type || this.inferErrorType(message)
      severity = error.severity || severity
    }
    
    return new ErrorInfo({
      type: errorType,
      severity: severity,
      message: message,
      originalError: error,
      context: options.context || {},
      maxRetries: options.maxRetries || this.getDefaultMaxRetries(errorType)
    })
  }

  /**
   * 推断错误类型
   * @param {string} message 错误消息
   * @returns {string} 错误类型
   */
  inferErrorType(message) {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('网络') || lowerMessage.includes('network') || 
        lowerMessage.includes('连接') || lowerMessage.includes('timeout')) {
      return ERROR_TYPES.NETWORK_ERROR
    }
    
    if (lowerMessage.includes('验证') || lowerMessage.includes('validation') ||
        lowerMessage.includes('格式') || lowerMessage.includes('invalid')) {
      return ERROR_TYPES.VALIDATION_ERROR
    }
    
    if (lowerMessage.includes('权限') || lowerMessage.includes('permission') ||
        lowerMessage.includes('unauthorized') || lowerMessage.includes('forbidden')) {
      return ERROR_TYPES.PERMISSION_ERROR
    }
    
    if (lowerMessage.includes('websocket') || lowerMessage.includes('ws')) {
      return ERROR_TYPES.WEBSOCKET_ERROR
    }
    
    if (lowerMessage.includes('上传') || lowerMessage.includes('upload') ||
        lowerMessage.includes('文件') || lowerMessage.includes('file')) {
      return ERROR_TYPES.FILE_UPLOAD_ERROR
    }
    
    if (lowerMessage.includes('发送') || lowerMessage.includes('send') ||
        lowerMessage.includes('消息') || lowerMessage.includes('message')) {
      return ERROR_TYPES.MESSAGE_SEND_ERROR
    }
    
    if (lowerMessage.includes('登录') || lowerMessage.includes('auth') ||
        lowerMessage.includes('token') || lowerMessage.includes('session')) {
      return ERROR_TYPES.USER_AUTH_ERROR
    }
    
    if (lowerMessage.includes('解析') || lowerMessage.includes('parse') ||
        lowerMessage.includes('json') || lowerMessage.includes('format')) {
      return ERROR_TYPES.DATA_PARSE_ERROR
    }
    
    return ERROR_TYPES.UNKNOWN_ERROR
  }

  /**
   * 获取默认最大重试次数
   * @param {string} errorType 错误类型
   * @returns {number} 最大重试次数
   */
  getDefaultMaxRetries(errorType) {
    const retryMap = {
      [ERROR_TYPES.NETWORK_ERROR]: 3,
      [ERROR_TYPES.WEBSOCKET_ERROR]: 5,
      [ERROR_TYPES.MESSAGE_SEND_ERROR]: 2,
      [ERROR_TYPES.FILE_UPLOAD_ERROR]: 2
    }
    
    return retryMap[errorType] || 0
  }

  /**
   * 记录错误
   * @param {ErrorInfo} errorInfo 错误信息
   */
  recordError(errorInfo) {
    // 添加到错误历史
    this.errors.set(errorInfo.id, errorInfo)
    
    // 限制错误历史数量
    if (this.errors.size > this.options.maxErrorHistory) {
      const oldestId = this.errors.keys().next().value
      this.errors.delete(oldestId)
    }
    
    // 记录日志
    if (this.options.enableLogging) {
      this.logError(errorInfo)
    }
  }

  /**
   * 记录错误日志
   * @param {ErrorInfo} errorInfo 错误信息
   */
  logError(errorInfo) {
    const logLevel = this.getLogLevel(errorInfo.severity)
    const logMessage = `[${errorInfo.type}] ${errorInfo.message}`
    
    switch (logLevel) {
      case 'error':
        console.error('🚨', logMessage, errorInfo.context)
        break
      case 'warn':
        console.warn('⚠️', logMessage, errorInfo.context)
        break
      case 'info':
        console.info('ℹ️', logMessage, errorInfo.context)
        break
      default:
        console.log('📝', logMessage, errorInfo.context)
    }
  }

  /**
   * 获取日志级别
   * @param {string} severity 错误严重程度
   * @returns {string} 日志级别
   */
  getLogLevel(severity) {
    const levelMap = {
      [ERROR_SEVERITY.CRITICAL]: 'error',
      [ERROR_SEVERITY.HIGH]: 'error',
      [ERROR_SEVERITY.MEDIUM]: 'warn',
      [ERROR_SEVERITY.LOW]: 'info'
    }
    
    return levelMap[severity] || 'log'
  }

  /**
   * 执行错误处理策略
   * @param {ErrorInfo} errorInfo 错误信息
   */
  executeStrategy(errorInfo) {
    const strategy = this.strategies.get(errorInfo.type) || ERROR_STRATEGIES.SHOW_TOAST
    
    switch (strategy) {
      case ERROR_STRATEGIES.SHOW_TOAST:
        this.showToast(errorInfo)
        break
      case ERROR_STRATEGIES.SHOW_MODAL:
        this.showModal(errorInfo)
        break
      case ERROR_STRATEGIES.RETRY:
        this.scheduleRetry(errorInfo)
        break
      case ERROR_STRATEGIES.FALLBACK:
        this.executeFallback(errorInfo)
        break
      case ERROR_STRATEGIES.IGNORE:
        // 忽略错误，仅记录
        break
      case ERROR_STRATEGIES.LOG_ONLY:
        // 仅记录日志，不通知用户
        break
    }
    
    errorInfo.markAsHandled()
  }

  /**
   * 显示Toast提示
   * @param {ErrorInfo} errorInfo 错误信息
   */
  showToast(errorInfo) {
    if (!this.options.enableUserNotification) return
    
    // 这里需要根据实际的Toast组件实现
    console.log('🍞 显示Toast:', errorInfo.getUserFriendlyMessage())
    
    // 触发Toast显示事件
    this.emit('showToast', {
      message: errorInfo.getUserFriendlyMessage(),
      type: 'error',
      duration: 3000
    })
  }

  /**
   * 显示模态框
   * @param {ErrorInfo} errorInfo 错误信息
   */
  showModal(errorInfo) {
    if (!this.options.enableUserNotification) return
    
    console.log('📋 显示模态框:', errorInfo.getUserFriendlyMessage())
    
    // 触发模态框显示事件
    this.emit('showModal', {
      title: '错误提示',
      message: errorInfo.getUserFriendlyMessage(),
      type: 'error'
    })
  }

  /**
   * 安排重试
   * @param {ErrorInfo} errorInfo 错误信息
   */
  scheduleRetry(errorInfo) {
    if (!this.options.enableAutoRetry || !errorInfo.canRetry()) {
      this.showToast(errorInfo)
      return
    }
    
    errorInfo.incrementRetry()
    
    const retryDelay = this.calculateRetryDelay(errorInfo.retryCount)
    console.log(`🔄 安排重试 (${errorInfo.retryCount}/${errorInfo.maxRetries})，延迟 ${retryDelay}ms`)
    
    setTimeout(() => {
      this.emit('retry', errorInfo)
    }, retryDelay)
  }

  /**
   * 计算重试延迟
   * @param {number} retryCount 重试次数
   * @returns {number} 延迟时间（毫秒）
   */
  calculateRetryDelay(retryCount) {
    // 指数退避算法
    return Math.min(1000 * Math.pow(2, retryCount - 1), 10000)
  }

  /**
   * 执行备用方案
   * @param {ErrorInfo} errorInfo 错误信息
   */
  executeFallback(errorInfo) {
    console.log('🔄 执行备用方案:', errorInfo.type)
    this.emit('fallback', errorInfo)
  }

  /**
   * 触发错误事件
   * @param {ErrorInfo} errorInfo 错误信息
   */
  emitError(errorInfo) {
    this.emit('error', errorInfo)
  }

  /**
   * 添加错误监听器
   * @param {string} event 事件名称
   * @param {Function} listener 监听器函数
   */
  on(event, listener) {
    if (!this.errorListeners.has(event)) {
      this.errorListeners.set(event, [])
    }
    this.errorListeners.get(event).push(listener)
  }

  /**
   * 移除错误监听器
   * @param {string} event 事件名称
   * @param {Function} listener 监听器函数
   */
  off(event, listener) {
    if (this.errorListeners.has(event)) {
      const listeners = this.errorListeners.get(event)
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
    if (this.errorListeners.has(event)) {
      this.errorListeners.get(event).forEach(listener => {
        try {
          listener(data)
        } catch (error) {
          console.error(`❌ 错误监听器执行失败 [${event}]:`, error)
        }
      })
    }
  }

  /**
   * 获取错误统计信息
   * @returns {Object} 统计信息
   */
  getErrorStats() {
    const errors = Array.from(this.errors.values())
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000
    
    return {
      total: errors.length,
      recent: errors.filter(e => e.timestamp > oneHourAgo).length,
      byType: this.groupErrorsByType(errors),
      bySeverity: this.groupErrorsBySeverity(errors)
    }
  }

  /**
   * 按类型分组错误
   * @param {Array} errors 错误列表
   * @returns {Object} 分组结果
   */
  groupErrorsByType(errors) {
    const groups = {}
    errors.forEach(error => {
      groups[error.type] = (groups[error.type] || 0) + 1
    })
    return groups
  }

  /**
   * 按严重程度分组错误
   * @param {Array} errors 错误列表
   * @returns {Object} 分组结果
   */
  groupErrorsBySeverity(errors) {
    const groups = {}
    errors.forEach(error => {
      groups[error.severity] = (groups[error.severity] || 0) + 1
    })
    return groups
  }

  /**
   * 清除错误历史
   */
  clearErrorHistory() {
    this.errors.clear()
    console.log('🧹 错误历史已清除')
  }

  /**
   * 销毁错误处理器
   */
  destroy() {
    this.clearErrorHistory()
    this.errorListeners.clear()
    console.log('🚨 错误处理管理器已销毁')
  }
}

/**
 * 创建错误处理器实例
 * @param {Object} options 配置选项
 * @returns {ErrorHandler}
 */
export function createErrorHandler(options = {}) {
  return new ErrorHandler(options)
}

/**
 * 全局错误处理器实例
 */
let globalErrorHandler = null

/**
 * 获取全局错误处理器实例
 * @param {Object} options 配置选项（仅在首次创建时使用）
 * @returns {ErrorHandler}
 */
export function getGlobalErrorHandler(options = {}) {
  if (!globalErrorHandler) {
    globalErrorHandler = new ErrorHandler(options)
  }
  return globalErrorHandler
}

/**
 * 销毁全局错误处理器实例
 */
export function destroyGlobalErrorHandler() {
  if (globalErrorHandler) {
    globalErrorHandler.destroy()
    globalErrorHandler = null
  }
}

/**
 * 便捷的错误处理函数
 * @param {*} error 错误对象
 * @param {Object} options 处理选项
 * @returns {ErrorInfo} 错误信息对象
 */
export function handleError(error, options = {}) {
  const handler = getGlobalErrorHandler()
  return handler.handleError(error, options)
}