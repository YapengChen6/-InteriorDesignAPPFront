/**
 * 消息验证工具类
 * 提供消息内容验证和错误处理功能
 */

/**
 * 验证文本消息内容
 * @param {string} content - 消息内容
 * @returns {Object} - 验证结果 {isValid: boolean, error: string}
 */
export function validateTextMessage(content) {
  if (!content) {
    return { isValid: false, error: '消息不能为空' }
  }
  
  if (typeof content !== 'string') {
    return { isValid: false, error: '消息内容必须是文本' }
  }
  
  const trimmedContent = content.trim()
  if (trimmedContent.length === 0) {
    return { isValid: false, error: '消息不能为空' }
  }
  
  if (trimmedContent.length > 5000) {
    return { isValid: false, error: '消息内容过长，请控制在5000字符以内' }
  }
  
  return { isValid: true, error: null }
}

/**
 * 验证手机号格式
 * @param {string} phone - 手机号
 * @returns {Object} - 验证结果 {isValid: boolean, error: string}
 */
export function validatePhoneNumber(phone) {
  if (!phone) {
    return { isValid: false, error: '请输入手机号' }
  }
  
  const trimmedPhone = phone.trim()
  if (trimmedPhone.length === 0) {
    return { isValid: false, error: '请输入手机号' }
  }
  
  // 中国手机号正则表达式
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(trimmedPhone)) {
    return { isValid: false, error: '请输入正确的手机号格式' }
  }
  
  return { isValid: true, error: null }
}

/**
 * 验证文件类型
 * @param {string} fileName - 文件名
 * @param {string} fileType - 文件类型 ('image' | 'video')
 * @returns {Object} - 验证结果 {isValid: boolean, error: string}
 */
export function validateFileType(fileName, fileType) {
  if (!fileName) {
    return { isValid: false, error: '文件名不能为空' }
  }
  
  const extension = fileName.toLowerCase().split('.').pop()
  
  if (fileType === 'image') {
    const validImageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
    if (!validImageTypes.includes(extension)) {
      return { isValid: false, error: '不支持的图片格式，请选择 JPG、PNG、GIF、WebP 或 BMP 格式的图片' }
    }
  } else if (fileType === 'video') {
    const validVideoTypes = ['mp4', 'avi', 'mov', 'wmv', 'flv', '3gp', 'mkv']
    if (!validVideoTypes.includes(extension)) {
      return { isValid: false, error: '不支持的视频格式，请选择 MP4、AVI、MOV、WMV、FLV、3GP 或 MKV 格式的视频' }
    }
  } else {
    return { isValid: false, error: '不支持的文件类型' }
  }
  
  return { isValid: true, error: null }
}

/**
 * 验证文件大小
 * @param {number} fileSize - 文件大小（字节）
 * @param {string} fileType - 文件类型 ('image' | 'video')
 * @returns {Object} - 验证结果 {isValid: boolean, error: string}
 */
export function validateFileSize(fileSize, fileType) {
  if (!fileSize || fileSize <= 0) {
    return { isValid: false, error: '文件大小无效' }
  }
  
  const MB = 1024 * 1024
  
  if (fileType === 'image') {
    const maxImageSize = 10 * MB // 10MB
    if (fileSize > maxImageSize) {
      return { isValid: false, error: '图片文件大小不能超过10MB' }
    }
  } else if (fileType === 'video') {
    const maxVideoSize = 100 * MB // 100MB
    if (fileSize > maxVideoSize) {
      return { isValid: false, error: '视频文件大小不能超过100MB' }
    }
  }
  
  return { isValid: true, error: null }
}

/**
 * 验证用户ID
 * @param {*} userId - 用户ID
 * @returns {Object} - 验证结果 {isValid: boolean, error: string}
 */
export function validateUserId(userId) {
  if (!userId) {
    return { isValid: false, error: '用户ID不能为空' }
  }
  
  const numericUserId = parseInt(userId)
  if (isNaN(numericUserId) || numericUserId <= 0) {
    return { isValid: false, error: '用户ID必须是正整数' }
  }
  
  return { isValid: true, error: null }
}

/**
 * 验证对话ID
 * @param {*} conversationId - 对话ID
 * @returns {Object} - 验证结果 {isValid: boolean, error: string}
 */
export function validateConversationId(conversationId) {
  if (!conversationId) {
    return { isValid: false, error: '对话ID不能为空' }
  }
  
  const numericConversationId = parseInt(conversationId)
  if (isNaN(numericConversationId) || numericConversationId <= 0) {
    return { isValid: false, error: '对话ID必须是正整数' }
  }
  
  return { isValid: true, error: null }
}

/**
 * 验证消息发送参数
 * @param {Object} params - 消息参数
 * @returns {Object} - 验证结果 {isValid: boolean, errors: Array}
 */
export function validateMessageParams(params) {
  const { senderId, receiverId, conversationId, content, messageType } = params
  const errors = []
  
  // 验证发送者ID
  const senderValidation = validateUserId(senderId)
  if (!senderValidation.isValid) {
    errors.push(`发送者${senderValidation.error}`)
  }
  
  // 验证接收者ID
  const receiverValidation = validateUserId(receiverId)
  if (!receiverValidation.isValid) {
    errors.push(`接收者${receiverValidation.error}`)
  }
  
  // 验证对话ID
  const conversationValidation = validateConversationId(conversationId)
  if (!conversationValidation.isValid) {
    errors.push(conversationValidation.error)
  }
  
  // 验证消息内容
  if (messageType === 1) { // 普通文本消息
    const contentValidation = validateTextMessage(content)
    if (!contentValidation.isValid) {
      errors.push(contentValidation.error)
    }
  }
  
  // 检查发送者和接收者不能相同
  if (senderId && receiverId && parseInt(senderId) === parseInt(receiverId)) {
    errors.push('不能给自己发送消息')
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  }
}

/**
 * 验证聊天请求参数
 * @param {Object} params - 聊天请求参数
 * @returns {Object} - 验证结果 {isValid: boolean, errors: Array}
 */
export function validateChatRequestParams(params) {
  const { currentUserId, targetUserId } = params
  const errors = []
  
  // 验证当前用户ID
  const currentUserValidation = validateUserId(currentUserId)
  if (!currentUserValidation.isValid) {
    errors.push(`当前用户${currentUserValidation.error}`)
  }
  
  // 验证目标用户ID
  const targetUserValidation = validateUserId(targetUserId)
  if (!targetUserValidation.isValid) {
    errors.push(`目标用户${targetUserValidation.error}`)
  }
  
  // 检查不能添加自己
  if (currentUserId && targetUserId && parseInt(currentUserId) === parseInt(targetUserId)) {
    errors.push('不能添加自己为聊天对象')
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  }
}

/**
 * 验证搜索参数
 * @param {Object} params - 搜索参数
 * @returns {Object} - 验证结果 {isValid: boolean, errors: Array}
 */
export function validateSearchParams(params) {
  const { keyword, startTime, endTime, messageType, pageNum, pageSize } = params
  const errors = []
  
  // 验证关键词
  if (keyword && typeof keyword !== 'string') {
    errors.push('搜索关键词必须是文本')
  }
  
  if (keyword && keyword.length > 100) {
    errors.push('搜索关键词不能超过100个字符')
  }
  
  // 验证时间范围
  if (startTime && endTime) {
    const start = new Date(startTime)
    const end = new Date(endTime)
    
    if (isNaN(start.getTime())) {
      errors.push('开始时间格式无效')
    }
    
    if (isNaN(end.getTime())) {
      errors.push('结束时间格式无效')
    }
    
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start > end) {
      errors.push('开始时间不能晚于结束时间')
    }
  }
  
  // 验证消息类型
  if (messageType !== undefined && messageType !== null) {
    const validMessageTypes = [1, 2, 3] // 普通消息、订单申请、聊天请求
    if (!validMessageTypes.includes(parseInt(messageType))) {
      errors.push('消息类型无效')
    }
  }
  
  // 验证分页参数
  if (pageNum !== undefined && pageNum !== null) {
    const numericPageNum = parseInt(pageNum)
    if (isNaN(numericPageNum) || numericPageNum < 1) {
      errors.push('页码必须是大于0的整数')
    }
  }
  
  if (pageSize !== undefined && pageSize !== null) {
    const numericPageSize = parseInt(pageSize)
    if (isNaN(numericPageSize) || numericPageSize < 1 || numericPageSize > 100) {
      errors.push('每页数量必须是1-100之间的整数')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  }
}

/**
 * 创建标准化的错误响应
 * @param {string|Array} errors - 错误信息
 * @returns {Object} - 标准化的错误响应
 */
export function createErrorResponse(errors) {
  const errorArray = Array.isArray(errors) ? errors : [errors]
  return {
    success: false,
    errors: errorArray,
    message: errorArray.join('; ')
  }
}

/**
 * 创建标准化的成功响应
 * @param {*} data - 响应数据
 * @param {string} message - 成功消息
 * @returns {Object} - 标准化的成功响应
 */
export function createSuccessResponse(data = null, message = '操作成功') {
  return {
    success: true,
    data: data,
    message: message
  }
}