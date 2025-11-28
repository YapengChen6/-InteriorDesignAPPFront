/**
 * 文件上传服务
 * 负责处理图片、视频等媒体文件的上传
 */

import { 
  validateFileType, 
  validateFileSize,
  createErrorResponse,
  createSuccessResponse
} from '@/utils/messageValidation'

/**
 * 上传状态枚举
 */
export const UPLOAD_STATUS = {
  PENDING: 'pending',
  UPLOADING: 'uploading',
  SUCCESS: 'success',
  ERROR: 'error',
  CANCELLED: 'cancelled'
}

/**
 * 支持的文件类型
 */
export const SUPPORTED_FILE_TYPES = {
  IMAGE: {
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'],
    maxSize: 10 * 1024 * 1024, // 10MB
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
  },
  VIDEO: {
    extensions: ['mp4', 'avi', 'mov', 'wmv', 'flv', '3gp', 'mkv'],
    maxSize: 100 * 1024 * 1024, // 100MB
    mimeTypes: ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-ms-wmv']
  }
}

/**
 * 文件上传任务类
 */
export class FileUploadTask {
  constructor(file, options = {}) {
    this.id = Date.now() + Math.random().toString(36).substr(2, 9)
    this.file = file
    this.fileName = file.name || `file_${this.id}`
    this.fileSize = file.size || 0
    this.fileType = this.detectFileType()
    this.status = UPLOAD_STATUS.PENDING
    this.progress = 0
    this.uploadedUrl = null
    this.error = null
    this.startTime = null
    this.endTime = null
    
    // 配置选项
    this.options = {
      relatedType: 1,
      relatedId: null,
      description: '',
      stage: 'chat',
      ...options
    }
    
    // 上传任务引用
    this.uploadTask = null
  }

  /**
   * 检测文件类型
   * @returns {string} 文件类型
   */
  detectFileType() {
    const extension = this.fileName.toLowerCase().split('.').pop()
    
    if (SUPPORTED_FILE_TYPES.IMAGE.extensions.includes(extension)) {
      return 'image'
    } else if (SUPPORTED_FILE_TYPES.VIDEO.extensions.includes(extension)) {
      return 'video'
    }
    
    return 'unknown'
  }

  /**
   * 验证文件
   * @returns {Object} 验证结果
   */
  validate() {
    const errors = []
    
    // 验证文件类型
    const typeValidation = validateFileType(this.fileName, this.fileType)
    if (!typeValidation.isValid) {
      errors.push(typeValidation.error)
    }
    
    // 验证文件大小
    const sizeValidation = validateFileSize(this.fileSize, this.fileType)
    if (!sizeValidation.isValid) {
      errors.push(sizeValidation.error)
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    }
  }

  /**
   * 更新上传进度
   * @param {number} progress 进度百分比
   */
  updateProgress(progress) {
    this.progress = Math.min(100, Math.max(0, progress))
  }

  /**
   * 标记为开始上传
   */
  markAsStarted() {
    this.status = UPLOAD_STATUS.UPLOADING
    this.startTime = Date.now()
  }

  /**
   * 标记为上传成功
   * @param {string} url 上传后的文件URL
   */
  markAsSuccess(url) {
    this.status = UPLOAD_STATUS.SUCCESS
    this.uploadedUrl = url
    this.endTime = Date.now()
    this.progress = 100
  }

  /**
   * 标记为上传失败
   * @param {string} error 错误信息
   */
  markAsError(error) {
    this.status = UPLOAD_STATUS.ERROR
    this.error = error
    this.endTime = Date.now()
  }

  /**
   * 标记为已取消
   */
  markAsCancelled() {
    this.status = UPLOAD_STATUS.CANCELLED
    this.endTime = Date.now()
  }

  /**
   * 取消上传
   */
  cancel() {
    if (this.uploadTask && typeof this.uploadTask.abort === 'function') {
      this.uploadTask.abort()
    }
    this.markAsCancelled()
  }

  /**
   * 获取上传耗时
   * @returns {number} 耗时（毫秒）
   */
  getDuration() {
    if (this.startTime && this.endTime) {
      return this.endTime - this.startTime
    }
    return 0
  }

  /**
   * 获取任务信息
   * @returns {Object} 任务信息
   */
  getInfo() {
    return {
      id: this.id,
      fileName: this.fileName,
      fileSize: this.fileSize,
      fileType: this.fileType,
      status: this.status,
      progress: this.progress,
      uploadedUrl: this.uploadedUrl,
      error: this.error,
      duration: this.getDuration()
    }
  }
}

/**
 * 文件上传服务类
 */
export class FileUploadService {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || '/api/media/upload/file'
    this.uploadTasks = new Map()
    
    // 配置选项
    this.options = {
      maxConcurrentUploads: 3,
      enableProgress: true,
      enableRetry: true,
      maxRetryAttempts: 2,
      retryDelay: 1000,
      ...options
    }
    
    // 上传队列
    this.uploadQueue = []
    this.activeUploads = 0
    
    console.log('📁 文件上传服务初始化完成')
  }

  /**
   * 上传单个文件
   * @param {File} file 文件对象
   * @param {Object} options 上传选项
   * @returns {Promise<Object>} 上传结果
   */
  async uploadFile(file, options = {}) {
    try {
      console.log('📁 开始上传文件:', file.name || 'unknown')
      
      // 创建上传任务
      const task = new FileUploadTask(file, options)
      this.uploadTasks.set(task.id, task)
      
      // 验证文件
      const validation = task.validate()
      if (!validation.isValid) {
        task.markAsError(validation.errors.join('; '))
        return createErrorResponse(validation.errors)
      }
      
      // 执行上传
      const result = await this.executeUpload(task)
      
      if (result.success) {
        console.log('✅ 文件上传成功:', result.data.url)
        return createSuccessResponse(result.data, '文件上传成功')
      } else {
        console.error('❌ 文件上传失败:', result.error)
        return createErrorResponse(result.error)
      }
      
    } catch (error) {
      console.error('❌ 上传文件异常:', error)
      return createErrorResponse('文件上传失败: ' + error.message)
    }
  }

  /**
   * 执行文件上传
   * @param {FileUploadTask} task 上传任务
   * @returns {Promise<Object>} 上传结果
   */
  async executeUpload(task) {
    return new Promise((resolve) => {
      // 检查并发上传限制
      if (this.activeUploads >= this.options.maxConcurrentUploads) {
        this.uploadQueue.push({ task, resolve })
        console.log('📁 上传任务已加入队列，当前队列长度:', this.uploadQueue.length)
        return
      }
      
      this.performUpload(task, resolve)
    })
  }

  /**
   * 执行实际的上传操作
   * @param {FileUploadTask} task 上传任务
   * @param {Function} resolve Promise resolve函数
   */
  performUpload(task, resolve) {
    this.activeUploads++
    task.markAsStarted()
    
    console.log('📁 开始执行上传:', task.fileName)
    
    // 创建上传任务
    const uploadTask = uni.uploadFile({
      url: this.baseUrl,
      filePath: task.file.path || task.file.tempFilePath,
      name: 'file',
      formData: {
        relatedType: task.options.relatedType,
        relatedId: task.options.relatedId || task.options.conversationId || 0,
        description: task.options.description || `聊天消息-${task.fileType}`,
        stage: task.options.stage || 'chat'
      },
      success: (res) => {
        this.handleUploadSuccess(task, res, resolve)
      },
      fail: (err) => {
        this.handleUploadError(task, err, resolve)
      }
    })
    
    // 监听上传进度
    if (this.options.enableProgress && uploadTask.onProgressUpdate) {
      uploadTask.onProgressUpdate((res) => {
        const progress = Math.round((res.totalBytesSent / res.totalBytesExpectedToSend) * 100)
        task.updateProgress(progress)
        console.log('📁 上传进度:', task.fileName, progress + '%')
      })
    }
    
    task.uploadTask = uploadTask
  }

  /**
   * 处理上传成功
   * @param {FileUploadTask} task 上传任务
   * @param {Object} res 上传响应
   * @param {Function} resolve Promise resolve函数
   */
  handleUploadSuccess(task, res, resolve) {
    try {
      console.log('📁 上传响应:', res.data)
      const result = JSON.parse(res.data)
      
      if ((result.code === 200 || result.code === 0) && result.data && result.data.fileUrl) {
        const fileUrl = result.data.fileUrl
        task.markAsSuccess(fileUrl)
        
        resolve({
          success: true,
          data: {
            url: fileUrl,
            fileName: task.fileName,
            fileSize: task.fileSize,
            fileType: task.fileType,
            taskId: task.id
          }
        })
        
        console.log('✅ 文件上传成功:', fileUrl)
      } else {
        const error = result.msg || '上传失败'
        task.markAsError(error)
        resolve({
          success: false,
          error: error
        })
        
        console.error('❌ 上传失败，响应:', result)
      }
    } catch (e) {
      const error = '解析上传结果失败: ' + e.message
      task.markAsError(error)
      resolve({
        success: false,
        error: error
      })
      
      console.error('❌ 解析上传结果失败:', e)
    } finally {
      this.finishUpload()
    }
  }

  /**
   * 处理上传错误
   * @param {FileUploadTask} task 上传任务
   * @param {Object} err 错误对象
   * @param {Function} resolve Promise resolve函数
   */
  handleUploadError(task, err, resolve) {
    const error = err.errMsg || '上传文件失败'
    task.markAsError(error)
    
    resolve({
      success: false,
      error: error
    })
    
    console.error('❌ 上传文件失败:', err)
    this.finishUpload()
  }

  /**
   * 完成上传（成功或失败后的清理工作）
   */
  finishUpload() {
    this.activeUploads--
    
    // 处理队列中的下一个任务
    if (this.uploadQueue.length > 0) {
      const { task, resolve } = this.uploadQueue.shift()
      this.performUpload(task, resolve)
    }
  }

  /**
   * 批量上传文件
   * @param {Array} files 文件列表
   * @param {Object} options 上传选项
   * @returns {Promise<Array>} 上传结果列表
   */
  async uploadFiles(files, options = {}) {
    console.log('📁 开始批量上传文件:', files.length)
    
    const uploadPromises = files.map(file => this.uploadFile(file, options))
    const results = await Promise.all(uploadPromises)
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.length - successCount
    
    console.log('📁 批量上传完成:', { total: results.length, success: successCount, fail: failCount })
    
    return results
  }

  /**
   * 取消上传任务
   * @param {string} taskId 任务ID
   * @returns {boolean} 是否成功取消
   */
  cancelUpload(taskId) {
    const task = this.uploadTasks.get(taskId)
    if (task) {
      task.cancel()
      console.log('📁 上传任务已取消:', taskId)
      return true
    }
    return false
  }

  /**
   * 获取上传任务信息
   * @param {string} taskId 任务ID
   * @returns {Object|null} 任务信息
   */
  getUploadTask(taskId) {
    const task = this.uploadTasks.get(taskId)
    return task ? task.getInfo() : null
  }

  /**
   * 获取所有上传任务
   * @returns {Array} 任务列表
   */
  getAllUploadTasks() {
    return Array.from(this.uploadTasks.values()).map(task => task.getInfo())
  }

  /**
   * 清理已完成的任务
   */
  cleanupCompletedTasks() {
    for (const [taskId, task] of this.uploadTasks) {
      if (task.status === UPLOAD_STATUS.SUCCESS || 
          task.status === UPLOAD_STATUS.ERROR || 
          task.status === UPLOAD_STATUS.CANCELLED) {
        this.uploadTasks.delete(taskId)
      }
    }
    
    console.log('📁 已清理完成的上传任务')
  }

  /**
   * 获取上传统计信息
   * @returns {Object} 统计信息
   */
  getUploadStats() {
    const tasks = Array.from(this.uploadTasks.values())
    
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === UPLOAD_STATUS.PENDING).length,
      uploading: tasks.filter(t => t.status === UPLOAD_STATUS.UPLOADING).length,
      success: tasks.filter(t => t.status === UPLOAD_STATUS.SUCCESS).length,
      error: tasks.filter(t => t.status === UPLOAD_STATUS.ERROR).length,
      cancelled: tasks.filter(t => t.status === UPLOAD_STATUS.CANCELLED).length,
      activeUploads: this.activeUploads,
      queueLength: this.uploadQueue.length
    }
  }

  /**
   * 销毁服务
   */
  destroy() {
    // 取消所有进行中的上传
    for (const task of this.uploadTasks.values()) {
      if (task.status === UPLOAD_STATUS.UPLOADING) {
        task.cancel()
      }
    }
    
    this.uploadTasks.clear()
    this.uploadQueue = []
    this.activeUploads = 0
    
    console.log('📁 文件上传服务已销毁')
  }
}

/**
 * 创建文件上传服务实例
 * @param {Object} options 配置选项
 * @returns {FileUploadService}
 */
export function createFileUploadService(options = {}) {
  return new FileUploadService(options)
}

/**
 * 全局文件上传服务实例
 */
let globalUploadService = null

/**
 * 获取全局文件上传服务实例
 * @param {Object} options 配置选项（仅在首次创建时使用）
 * @returns {FileUploadService}
 */
export function getGlobalFileUploadService(options = {}) {
  if (!globalUploadService) {
    globalUploadService = new FileUploadService(options)
  }
  return globalUploadService
}

/**
 * 销毁全局文件上传服务实例
 */
export function destroyGlobalFileUploadService() {
  if (globalUploadService) {
    globalUploadService.destroy()
    globalUploadService = null
  }
}