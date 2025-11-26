import request from '@/utils/request'
import { getToken } from '@/utils/auth'

// ==================== 配置常量 ====================
const CONFIG = {
  UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    TIMEOUT: 30000
  },
  API_PATHS: {
    MATERIAL_SUPPLIER: '/api/material-supplier',
    MEDIA: '/api/media',
    AUTH: '/api/auth',
    USERS: '/api/users'
  }
}

// ==================== 错误处理类 ====================
class UploadError extends Error {
  constructor(message, code, details = {}) {
    super(message)
    this.name = 'UploadError'
    this.code = code
    this.details = details
  }
}

// ==================== 物料供应商申请相关API ====================

export const materialSupplierApi = {
  // 提交入驻申请
  submitApplication: (applicationDTO) => {
    return request({
      url: `${CONFIG.API_PATHS.MATERIAL_SUPPLIER}/application`,
      method: 'post',
      data: applicationDTO
    })
  },

  // 查询申请状态
  getApplicationStatus: (applicationId) => {
    return request({
      url: `${CONFIG.API_PATHS.MATERIAL_SUPPLIER}/status/${applicationId}`,
      method: 'get'
    })
  },

  // 获取申请详情
  getApplicationDetail: (applicationId) => {
    return request({
      url: `${CONFIG.API_PATHS.MATERIAL_SUPPLIER}/detail/${applicationId}`,
      method: 'get'
    })
  },

  // 更新申请信息
  updateApplication: (applicationId, applicationDTO) => {
    return request({
      url: `${CONFIG.API_PATHS.MATERIAL_SUPPLIER}/application/${applicationId}`,
      method: 'put',
      data: applicationDTO
    })
  },

  // 撤销申请
  cancelApplication: (applicationId) => {
    return request({
      url: `${CONFIG.API_PATHS.MATERIAL_SUPPLIER}/application/${applicationId}`,
      method: 'delete'
    })
  },

  // 获取申请列表
  getApplicationList: (params) => {
    return request({
      url: `${CONFIG.API_PATHS.MATERIAL_SUPPLIER}/applications`,
      method: 'get',
      params: params
    })
  },

  // 下载申请材料模板
  downloadTemplate: () => {
    return request({
      url: `${CONFIG.API_PATHS.MATERIAL_SUPPLIER}/template`,
      headers: { isToken: false },
      method: 'get'
    })
  }
}

// ==================== 媒体资源上传相关API ====================

/**
 * 验证文件信息
 */
async function validateFile(file) {
  return new Promise((resolve, reject) => {
    uni.getFileInfo({
      filePath: file,
      success: (fileInfo) => {
        // 检查文件大小
        if (fileInfo.size > CONFIG.UPLOAD.MAX_FILE_SIZE) {
          reject(new UploadError(
            `文件大小不能超过 ${CONFIG.UPLOAD.MAX_FILE_SIZE / 1024 / 1024}MB`,
            'FILE_TOO_LARGE',
            { size: fileInfo.size, maxSize: CONFIG.UPLOAD.MAX_FILE_SIZE }
          ))
          return
        }
        resolve(fileInfo)
      },
      fail: (error) => {
        reject(new UploadError(
          '文件不存在或无法访问',
          'FILE_NOT_FOUND',
          { originalError: error }
        ))
      }
    })
  })
}

/**
 * 构建上传表单数据
 */
function buildFormData(relatedType, relatedId, description, stage, sequence) {
  return {
    relatedType: Number(relatedType),
    relatedId: Number(relatedId),
    sequence: Number(sequence || 0),
    description: description || '',
    stage: stage || ''
  }
}

/**
 * 处理上传响应
 */
function handleUploadResponse(res) {
  const { statusCode, data } = res
  
  if (statusCode !== 200) {
    let errorMessage = `上传失败，状态码: ${statusCode}`
    try {
      const errorData = JSON.parse(data)
      errorMessage = errorData.message || errorData.error || errorMessage
    } catch {
      // 忽略解析错误
    }
    throw new UploadError(errorMessage, 'HTTP_ERROR', { statusCode, response: data })
  }

  try {
    const parsedData = JSON.parse(data)
    
    if (parsedData.code === 200) {
      return {
        ...parsedData,
        imageUrl: parsedData.data?.fileUrl,
        imageInfo: {
          filename: parsedData.data?.filename,
          size: parsedData.data?.size,
          sequence: parsedData.data?.sequence,
          relatedType: parsedData.data?.relatedType,
          relatedId: parsedData.data?.relatedId,
          stage: parsedData.data?.stage,
          description: parsedData.data?.description
        }
      }
    } else {
      throw new UploadError(
        parsedData.msg || '上传失败',
        'BUSINESS_ERROR',
        { businessCode: parsedData.code, data: parsedData }
      )
    }
  } catch (e) {
    throw new UploadError(
      '服务器响应格式错误',
      'PARSE_ERROR',
      { originalError: e, rawResponse: data }
    )
  }
}

/**
 * 图片上传接口 - 生产版本
 */
export async function uploadImage(file, relatedType, relatedId, description = '', stage = '', sequence = 0) {
  try {
    // 验证文件
    await validateFile(file)
    
    // 构建表单数据
    const formData = buildFormData(relatedType, relatedId, description, stage, sequence)
    
    // 执行上传
    return new Promise((resolve, reject) => {
      const uploadTask = uni.uploadFile({
        url: getBaseUrl() + `${CONFIG.API_PATHS.MEDIA}/upload`,
        filePath: file,
        name: 'file',
        formData: formData,
        header: {
          'Authorization': 'Bearer ' + getToken(),
        },
        timeout: CONFIG.UPLOAD.TIMEOUT,
        success: (res) => {
          try {
            const result = handleUploadResponse(res)
            resolve(result)
          } catch (error) {
            reject(error)
          }
        },
        fail: (error) => {
          reject(new UploadError(
            '网络请求失败',
            'NETWORK_ERROR',
            { originalError: error }
          ))
        }
      })

      // 监听上传进度
      uploadTask.onProgressUpdate((res) => {
        // 可以在这里触发进度事件
        console.log('📊 Upload progress:', res.progress + '%')
      })
    })
  } catch (error) {
    throw error
  }
}

/**
 * 调试版本的图片上传接口
 */
export function uploadImageDebug(file, relatedType, relatedId, description, stage, sequence) {
  console.group('🔍 DEBUG UPLOAD')
  console.log('Starting upload process')
  console.log('File:', file)
  console.log('File type:', typeof file)
  
  const formData = buildFormData(relatedType, relatedId, description, stage, sequence)
  console.log('FormData:', formData)
  console.log('Base URL:', getBaseUrl())
  console.log('Full URL:', getBaseUrl() + `${CONFIG.API_PATHS.MEDIA}/upload`)
  console.log('Token exists:', !!getToken())
  console.groupEnd()

  return uploadImage(file, relatedType, relatedId, description, stage, sequence)
}

/**
 * 简单上传测试方法
 */
export function testUpload() {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (chooseRes) => {
        const tempFilePath = chooseRes.tempFilePaths[0]
        console.log('🧪 TEST UPLOAD - Selected test file:', tempFilePath)
        
        uploadImage(
          tempFilePath,
          RELATED_TYPES.TEST,
          0,
          '测试图片',
          UPLOAD_STAGES.TEST,
          0
        ).then(resolve).catch(reject)
      },
      fail: (error) => {
        reject(new UploadError(
          '选择测试图片失败',
          'CHOOSE_IMAGE_FAILED',
          { originalError: error }
        ))
      }
    })
  })
}

/**
 * 批量图片上传接口
 */
export async function batchUploadImages(files, relatedType, relatedId, stage) {
  console.log('🔍 BATCH UPLOAD - Starting batch upload, file count:', files.length)
  
  try {
    const uploadPromises = files.map((file, index) => 
      uploadImage(
        file,
        relatedType,
        relatedId,
        `文件${index + 1}`,
        stage,
        index
      )
    )
    
    const results = await Promise.all(uploadPromises)
    
    return {
      code: 200,
      msg: '批量上传成功',
      data: results.map(result => result.data),
      images: results.map(result => ({
        imageUrl: result.imageUrl,
        imageInfo: result.imageInfo
      }))
    }
  } catch (error) {
    throw new UploadError(
      '批量上传失败',
      'BATCH_UPLOAD_FAILED',
      { originalError: error }
    )
  }
}

// 媒体资源管理API
export const mediaApi = {
  // 根据关联信息查询图片列表
  getImagesByRelatedInfo: (relatedType, relatedId) => {
    return request({
      url: `${CONFIG.API_PATHS.MEDIA}/images`,
      method: 'get',
      params: {
        relatedType: Number(relatedType),
        relatedId: Number(relatedId)
      }
    })
  },

  // 删除图片
  deleteImage: (mediaId) => {
    return request({
      url: `${CONFIG.API_PATHS.MEDIA}/image/${mediaId}`,
      method: 'delete'
    })
  },

  // 获取图片详情
  getImageDetail: (mediaId) => {
    return request({
      url: `${CONFIG.API_PATHS.MEDIA}/image/${mediaId}`,
      method: 'get'
    })
  },

  // 更新图片信息
  updateImageInfo: (mediaId, updateData) => {
    return request({
      url: `${CONFIG.API_PATHS.MEDIA}/image/${mediaId}`,
      method: 'put',
      data: updateData
    })
  },

  // 检查服务健康状态
  healthCheck: () => {
    return request({
      url: `${CONFIG.API_PATHS.MEDIA}/health`,
      method: 'get',
      headers: { isToken: false }
    })
  }
}

// ==================== 用户认证相关API ====================

export const authApi = {
  // 手机号登录
  login: (loginForm) => {
    return request({
      url: `${CONFIG.API_PATHS.AUTH}/login`,
      headers: { isToken: false },
      method: 'post',
      data: loginForm
    })
  },

  // 发送短信验证码
  sendCode: (phoneNumber) => {
    return request({
      url: `${CONFIG.API_PATHS.AUTH}/code`,
      headers: { isToken: false },
      method: 'get',
      params: { phone: phoneNumber }
    })
  },

  // 注册
  register: (registryForm) => {
    return request({
      url: `${CONFIG.API_PATHS.AUTH}/register`,
      headers: { isToken: false },
      method: 'post',
      data: registryForm
    })
  },

  // 获取图形验证码
  getCodeImg: () => {
    return request({
      url: '/captchaImage',
      headers: { isToken: false },
      method: 'get',
      timeout: 20000
    })
  }
}

export const userApi = {
  // 获取用户信息
  getUserInfo: () => {
    return request({
      url: `${CONFIG.API_PATHS.USERS}/profile`,
      method: 'get'
    })
  },

  // 获取用户路由
  getRouters: () => {
    return request({
      url: `${CONFIG.API_PATHS.USERS}/routers`,
      method: 'get'
    })
  },

  // 退出登录
  logout: () => {
    return request({
      url: '/logout',
      method: 'post'
    })
  }
}

// ==================== 图片上传测试页面相关API ====================

/**
 * 测试服务连接状态
 */
export async function testConnection(type) {
  const testConfig = {
    media: { 
      url: `${CONFIG.API_PATHS.MEDIA}/health`, 
      name: '媒体接口' 
    },
    test: { 
      url: '/test/health', 
      name: '测试接口' 
    }
  }

  const config = testConfig[type]
  if (!config) {
    throw new UploadError('未知的接口类型', 'UNKNOWN_API_TYPE')
  }

  try {
    const response = await request({
      url: config.url,
      method: 'get',
      headers: { isToken: false }
    })

    return {
      success: true,
      name: config.name,
      status: 200,
      data: response
    }
  } catch (error) {
    return {
      success: false,
      name: config.name,
      error: error
    }
  }
}

/**
 * 测试所有服务连接
 */
export function testAllConnections() {
  return Promise.allSettled([
    testConnection('media'),
    testConnection('test')
  ])
}

/**
 * 上传文件测试
 */
export function uploadFileTest(uploadConfig) {
  const { file, apiUrl = `${CONFIG.API_PATHS.MEDIA}/upload`, relatedType, relatedId, description } = uploadConfig
  
  console.log('🔍 UPLOAD TEST - Starting upload with config:', {
    apiUrl,
    relatedType,
    relatedId,
    description,
    file: file.name || file.path
  })

  return uploadImage(file, relatedType, relatedId, description, 'TEST', 0)
}

/**
 * 简化的上传测试方法
 */
export function simpleUploadTest(file) {
  return uploadFileTest({
    file: file,
    relatedType: RELATED_TYPES.TEST,
    relatedId: 123,
    description: '测试上传'
  })
}

// 测试日志管理
class TestLogger {
  constructor() {
    this.logs = []
  }

  addLog(log) {
    this.logs.unshift({
      ...log,
      timestamp: new Date().toISOString(),
      id: Date.now() + Math.random()
    })
    
    // 限制日志数量
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(0, 100)
    }
  }

  getLogs() {
    return this.logs
  }

  clearLogs() {
    this.logs = []
  }
}

// 创建全局日志实例
const testLogger = new TestLogger()

export function getUploadTestLogs() {
  return Promise.resolve(testLogger.getLogs())
}

export function clearTestLogs() {
  testLogger.clearLogs()
  return Promise.resolve()
}

// 添加日志记录函数
export function addTestLog(log) {
  testLogger.addLog(log)
}

// ==================== 工具函数和常量 ====================

// 获取基础URL
function getBaseUrl() {
  try {
    const config = require('@/config')
    const baseUrl = config.baseUrl || 'http://localhost:8080'
    return baseUrl
  } catch (error) {
    console.error('Cannot get base URL from config:', error)
    return 'https://your-api-domain.com'
  }
}

// 定义相关的枚举常量
export const RELATED_TYPES = {
  MATERIAL_SUPPLIER: 1,
  MERCHANT_APPLICATION: 2,
  SHOP: 3,
  PRODUCT: 4,
  ID_CARD: 5,
  BUSINESS_LICENSE: 6,
  STORE_PHOTO: 7,
  TEST: 99
}

export const MEDIA_TYPES = {
  IMAGE: 1,
  VIDEO: 2,
  DOCUMENT: 3,
  OTHER: 4
}

export const UPLOAD_STAGES = {
  APPLICATION: 'APPLICATION',
  VERIFICATION: 'VERIFICATION',
  APPROVAL: 'APPROVAL',
  COMPLETED: 'COMPLETED',
  TEST: 'TEST'
}

// 工具函数集合
export const utils = {
  // 获取文件描述
  getFileDescription: (fileType) => {
    const descriptions = {
      store: '门店照片',
      idCardHand: '手持身份证照片',
      idCardFront: '身份证正面照片',
      idCardBack: '身份证反面照片',
      businessLicense: '营业执照',
      legalPersonIdCard: '法人身份证',
      bankAccount: '银行账户证明',
      other: '其他申请材料'
    }
    return descriptions[fileType] || '申请材料'
  },

  // 生成文件序列号
  getFileSequence: (fileType) => {
    const sequences = {
      store: 1,
      idCardFront: 2,
      idCardBack: 3,
      idCardHand: 4,
      businessLicense: 5,
      legalPersonIdCard: 6,
      bankAccount: 7,
      other: 99
    }
    return sequences[fileType] || 0
  },

  // 根据文件类型获取 relatedType
  getRelatedTypeByFileType: (fileType) => {
    const typeMapping = {
      store: RELATED_TYPES.STORE_PHOTO,
      idCardHand: RELATED_TYPES.ID_CARD,
      idCardFront: RELATED_TYPES.ID_CARD,
      idCardBack: RELATED_TYPES.ID_CARD,
      businessLicense: RELATED_TYPES.BUSINESS_LICENSE,
      legalPersonIdCard: RELATED_TYPES.ID_CARD,
      bankAccount: RELATED_TYPES.MERCHANT_APPLICATION,
      other: RELATED_TYPES.MERCHANT_APPLICATION
    }
    return typeMapping[fileType] || RELATED_TYPES.MERCHANT_APPLICATION
  },

  // 格式化文件大小
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  // 获取当前时间戳
  getCurrentTimestamp: () => {
    return new Date().toLocaleTimeString()
  }
}

export function getImagesPreview(fileUrl) {
  return request({
    url: '/api/media/preview',
    method: 'get',
    params: { fileUrl } // 或者可能是 query 参数，使用 params
  })
}

// ==================== 默认导出 ====================

export default {
  // 物料供应商申请
  ...materialSupplierApi,
  
  // 媒体上传
  uploadImage,
  uploadImageDebug,
  testUpload,
  batchUploadImages,
  ...mediaApi,
  
  // 用户认证
  ...authApi,
  ...userApi,
  
  // 图片上传测试
  testConnection,
  testAllConnections,
  uploadFileTest,
  simpleUploadTest,
  getUploadTestLogs,
  clearTestLogs,
  addTestLog,
  
  // 常量和工具函数
  RELATED_TYPES,
  MEDIA_TYPES,
  UPLOAD_STAGES,
  ...utils,
  
  // 配置
  CONFIG
}