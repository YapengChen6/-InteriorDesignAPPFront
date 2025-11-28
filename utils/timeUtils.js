/**
 * 时间处理工具类
 * 基于chatMain.vue中的时间处理方法
 */

/**
 * 解析日期输入为Date对象
 * @param {*} dateInput - 日期输入（字符串、数字、Date对象等）
 * @returns {Date|null} - 解析后的Date对象或null
 */
export function parseDate(dateInput) {
  if (!dateInput) return null
  
  try {
    // 如果已经是 Date 对象，直接返回
    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? null : dateInput
    }
    
    // 如果是数字（时间戳），直接创建 Date 对象
    if (typeof dateInput === 'number') {
      const date = new Date(dateInput)
      return isNaN(date.getTime()) ? null : date
    }
    
    // 如果是字符串，尝试解析
    if (typeof dateInput === 'string') {
      // 替换 - 为 / 以兼容 iOS
      const date = new Date(dateInput.replace(/-/g, '/'))
      return isNaN(date.getTime()) ? null : date
    }
    
    // 其他类型，尝试直接转换
    const date = new Date(dateInput)
    return isNaN(date.getTime()) ? null : date
  } catch (e) {
    console.warn('⚠️ 日期解析失败:', dateInput, e)
    return null
  }
}

/**
 * 格式化时间显示
 * @param {*} date - 日期输入
 * @returns {string} - 格式化后的时间字符串
 */
export function formatTime(date) {
  if (!date) {
    console.log('🕐 formatTime 接收到空值:', date);
    return '暂无时间';
  }
  
  console.log('🕐 格式化时间:', { 
    date, 
    type: typeof date,
    isDate: date instanceof Date,
    dateValue: date instanceof Date ? date.toISOString() : 'not a date'
  })
  
  // 字符串先按日期字符串解析
  if (typeof date === 'string') {
    date = parseDate(date)
  }
  // 数字（时间戳）或其它类型，统一尝试用 Date 包一层
  if (!(date instanceof Date)) {
    try {
      date = new Date(date)
    } catch (e) {
      console.error('❌ 时间解析失败:', e)
      return '时间解析错误'
    }
  }
  
  // 检查日期是否有效
  if (!date || isNaN(date.getTime())) {
    console.error('❌ 无效的日期:', date)
    return '时间无效'
  }
  
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  console.log('🕐 时间计算:', { 
    now: now.toISOString(), 
    date: date.toISOString(), 
    diff, 
    days,
    hours: date.getHours(),
    minutes: date.getMinutes()
  })
  
  // 格式化时间和日期
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  if (days === 0) {
    // 今天：显示"今天 HH:MM"
    return `今天 ${hours}:${minutes}`
  } else if (days === 1) {
    // 昨天：显示"昨天 HH:MM"
    return `昨天 ${hours}:${minutes}`
  } else if (days < 7) {
    // 一周内：显示"X天前 HH:MM"
    return `${days}天前 ${hours}:${minutes}`
  } else if (year === now.getFullYear()) {
    // 今年：显示"MM-DD HH:MM"
    return `${month}-${day} ${hours}:${minutes}`
  } else {
    // 更早：显示"YYYY-MM-DD HH:MM"
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }
}

/**
 * 安全地处理时间戳，确保是有效的数字
 * @param {*} messageData - 消息数据对象
 * @returns {number} - 有效的时间戳
 */
export function getValidTimestamp(messageData) {
  let validTime = Date.now() // 默认使用当前时间
  
  if (messageData.sendTime && typeof messageData.sendTime === 'number' && messageData.sendTime > 0) {
    validTime = messageData.sendTime
  } else if (messageData.createTime && typeof messageData.createTime === 'number' && messageData.createTime > 0) {
    validTime = messageData.createTime
  } else if (messageData.sendTime) {
    // 如果是字符串，转换为数字
    const timestamp = typeof messageData.sendTime === 'string' ? parseInt(messageData.sendTime, 10) : messageData.sendTime
    console.log('⏰ 时间戳转换:', {
      original: messageData.sendTime,
      originalType: typeof messageData.sendTime,
      converted: timestamp,
      convertedType: typeof timestamp,
      isValid: !isNaN(timestamp) && timestamp > 0
    })
    // 验证是否为有效的时间戳
    if (typeof timestamp === 'number' && !isNaN(timestamp) && timestamp > 0) {
      validTime = timestamp
    }
  }
  
  console.log('✅ 最终使用的时间戳:', validTime, '对应日期:', new Date(validTime))
  return validTime
}

/**
 * 检查两个消息的时间间隔是否在指定范围内
 * @param {*} currentMessage - 当前消息
 * @param {*} previousMessage - 前一条消息
 * @param {number} minutesThreshold - 时间阈值（分钟）
 * @returns {boolean} - 是否在时间窗口内
 */
export function isWithinTimeWindow(currentMessage, previousMessage, minutesThreshold = 5) {
  if (!previousMessage) return false
  
  const currentTime = new Date(currentMessage.createTime || currentMessage.sendTime || Date.now())
  const previousTime = new Date(previousMessage.createTime || previousMessage.sendTime || Date.now())
  const timeDiffInMinutes = (currentTime - previousTime) / (1000 * 60)
  
  return timeDiffInMinutes <= minutesThreshold
}

/**
 * 将后端返回的时间数据标准化为前端可用的格式
 * @param {*} backendTimeData - 后端时间数据
 * @returns {Date|null} - 标准化的Date对象，解析失败时返回null
 */
export function normalizeBackendTime(backendTimeData) {
  // 解析时间，如果解析失败则返回null，不使用当前时间
  let parsedTime = parseDate(backendTimeData)
  
  console.log('🕐 后端时间标准化:', {
    originalTime: backendTimeData,
    originalType: typeof backendTimeData,
    parsedTime: parsedTime,
    parsedTimeISO: parsedTime ? parsedTime.toISOString() : null,
    parseSuccess: !!parsedTime
  })
  
  if (!parsedTime) {
    console.warn('⚠️ 时间解析失败，返回null:', backendTimeData)
  }
  
  return parsedTime
}