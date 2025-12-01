/**
 * 头像处理工具函数
 * 用于统一处理用户头像URL,确保在小程序中能够正确显示
 */

/**
 * 处理头像URL,确保返回可访问的完整路径
 * @param {string} avatarUrl - 原始头像URL
 * @param {string} defaultAvatar - 默认头像路径
 * @param {boolean} useProxy - 是否使用后端代理（H5环境推荐使用）
 * @returns {string} 处理后的头像URL
 */
export function processAvatarUrl(avatarUrl, defaultAvatar = '/static/images/default-avatar.png', useProxy = true) {
  console.log('🖼️ processAvatarUrl 开始处理:', { 
    avatarUrl, 
    defaultAvatar, 
    useProxy,
    avatarType: typeof avatarUrl,
    avatarLength: avatarUrl ? avatarUrl.length : 0
  })
  
  // 如果头像URL为空或未定义,返回默认头像
  if (!avatarUrl || avatarUrl.trim() === '') {
    console.log('🖼️ 头像URL为空,使用默认头像:', defaultAvatar)
    return defaultAvatar
  }

  const trimmedUrl = avatarUrl.trim()
  console.log('🖼️ 去除空格后的URL:', trimmedUrl)

  // 如果是相对路径(以/开头),直接返回
  if (trimmedUrl.startsWith('/')) {
    console.log('🖼️ 头像URL是相对路径，直接返回:', trimmedUrl)
    return trimmedUrl
  }

  // 如果是完整的HTTP/HTTPS URL
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    console.log('🖼️ 头像URL是完整的HTTP/HTTPS路径')
    
    // OSS图片直接返回，不使用代理
    // OSS已经配置了CORS，可以直接访问
    console.log('🖼️ 直接返回OSS链接:', trimmedUrl)
    return trimmedUrl
  }

  // 其他情况,尝试直接使用
  console.log('🖼️ 头像URL格式特殊,直接使用:', trimmedUrl)
  return trimmedUrl
}

/**
 * 批量处理头像URL
 * @param {Array} items - 包含avatar字段的对象数组
 * @param {string} avatarField - 头像字段名,默认为'avatar'
 * @param {string} defaultAvatar - 默认头像路径
 * @returns {Array} 处理后的对象数组
 */
export function processAvatarUrls(items, avatarField = 'avatar', defaultAvatar = '/static/images/default-avatar.png') {
  if (!Array.isArray(items)) {
    console.warn('⚠️ processAvatarUrls: items不是数组')
    return items
  }

  return items.map(item => {
    if (item && item[avatarField]) {
      return {
        ...item,
        [avatarField]: processAvatarUrl(item[avatarField], defaultAvatar)
      }
    }
    return item
  })
}

/**
 * 验证图片URL是否可访问
 * @param {string} imageUrl - 图片URL
 * @returns {Promise<boolean>} 是否可访问
 */
export function validateImageUrl(imageUrl) {
  return new Promise((resolve) => {
    if (!imageUrl) {
      resolve(false)
      return
    }

    // 在uni-app中使用uni.getImageInfo来验证图片
    uni.getImageInfo({
      src: imageUrl,
      success: () => {
        console.log('✅ 图片URL可访问:', imageUrl)
        resolve(true)
      },
      fail: (err) => {
        console.warn('❌ 图片URL不可访问:', imageUrl, err)
        resolve(false)
      }
    })
  })
}

/**
 * 获取用户头像,如果获取失败则返回默认头像
 * @param {string} avatarUrl - 原始头像URL
 * @param {string} defaultAvatar - 默认头像路径
 * @returns {Promise<string>} 最终使用的头像URL
 */
export async function getValidAvatarUrl(avatarUrl, defaultAvatar = '/static/images/default-avatar.png') {
  const processedUrl = processAvatarUrl(avatarUrl, defaultAvatar)
  
  // 如果是默认头像,直接返回
  if (processedUrl === defaultAvatar) {
    return processedUrl
  }

  // 验证图片是否可访问
  const isValid = await validateImageUrl(processedUrl)
  return isValid ? processedUrl : defaultAvatar
}

/**
 * 预加载头像图片
 * @param {string} avatarUrl - 头像URL
 * @returns {Promise<void>}
 */
export function preloadAvatar(avatarUrl) {
  return new Promise((resolve, reject) => {
    if (!avatarUrl) {
      reject(new Error('头像URL为空'))
      return
    }

    uni.getImageInfo({
      src: avatarUrl,
      success: () => {
        console.log('✅ 头像预加载成功:', avatarUrl)
        resolve()
      },
      fail: (err) => {
        console.warn('❌ 头像预加载失败:', avatarUrl, err)
        reject(err)
      }
    })
  })
}

export default {
  processAvatarUrl,
  processAvatarUrls,
  validateImageUrl,
  getValidAvatarUrl,
  preloadAvatar
}
