import request from '@/utils/request'
import { getToken } from '@/utils/auth'

// ==================== 物料供应商申请相关API ====================

// 提交入驻申请
export function submitApplication(applicationDTO) {
  return request({
    url: '/api/material-supplier/application',
    method: 'post',
    data: applicationDTO
  })
}

// 查询申请状态
export function getApplicationStatus(applicationId) {
  return request({
    url: '/api/material-supplier/status/' + applicationId,
    method: 'get'
  })
}

// 获取申请详情
export function getApplicationDetail(applicationId) {
  return request({
    url: '/api/material-supplier/detail/' + applicationId,
    method: 'get'
  })
}

// 更新申请信息
export function updateApplication(applicationId, applicationDTO) {
  return request({
    url: '/api/material-supplier/application/' + applicationId,
    method: 'put',
    data: applicationDTO
  })
}

// 撤销申请
export function cancelApplication(applicationId) {
  return request({
    url: '/api/material-supplier/application/' + applicationId,
    method: 'delete'
  })
}

// 获取申请列表
export function getApplicationList(params) {
  return request({
    url: '/api/material-supplier/applications',
    method: 'get',
    params: params
  })
}

// 下载申请材料模板
export function downloadTemplate() {
  return request({
    url: '/api/material-supplier/template',
    headers: {
      isToken: false
    },
    method: 'get'
  })
}

// ==================== 媒体资源上传相关API ====================

// 图片上传接口
export function uploadImage(file, relatedType, relatedId, description, stage, sequence) {
  return new Promise((resolve, reject) => {
    console.log('🔍 DEBUG UPLOAD - Starting upload process')
    console.log('🔍 DEBUG UPLOAD - File:', file)
    
    // 构建 formData
    const formData = {
      relatedType: Number(relatedType),
      relatedId: Number(relatedId),
      sequence: Number(sequence || 0),
      description: description || '',
      stage: stage || ''
    }

    console.log('🔍 DEBUG UPLOAD - FormData:', formData)

    // 首先检查文件是否存在
    uni.getFileInfo({
      filePath: file,
      success: (fileInfo) => {
        console.log('✅ DEBUG UPLOAD - File info:', {
          size: fileInfo.size,
          exists: true
        })

        // 开始上传
        const uploadTask = uni.uploadFile({
          url: getBaseUrl() + '/api/media/upload',
          filePath: file,
          name: 'file',
          formData: formData,
          header: {
            'Authorization': 'Bearer ' + getToken(),
          },
          success: (res) => {
            console.log('📡 DEBUG UPLOAD - Upload response received')
            console.log('📡 DEBUG UPLOAD - Status code:', res.statusCode)

            if (res.statusCode === 200) {
              try {
                const data = JSON.parse(res.data)
                console.log('📡 DEBUG UPLOAD - Parsed response:', data)
                
                if (data.code === 200) {
                  console.log('✅ DEBUG UPLOAD - Upload successful')
                  // 提取图片URL信息
                  const result = {
                    ...data,
                    imageUrl: data.data?.fileUrl,
                    imageInfo: {
                      filename: data.data?.filename,
                      size: data.data?.size,
                      sequence: data.data?.sequence,
                      relatedType: data.data?.relatedType,
                      relatedId: data.data?.relatedId,
                      stage: data.data?.stage,
                      description: data.data?.description
                    }
                  }
                  resolve(result)
                } else {
                  console.error('❌ DEBUG UPLOAD - Business logic error:', data.msg)
                  reject(new Error(data.msg || '上传失败'))
                }
              } catch (e) {
                console.error('❌ DEBUG UPLOAD - JSON parse error:', e)
                reject(new Error('服务器响应格式错误'))
              }
            } else {
              console.error('❌ DEBUG UPLOAD - HTTP error, status:', res.statusCode)
              let errorMessage = `上传失败，状态码: ${res.statusCode}`
              try {
                const errorData = JSON.parse(res.data)
                errorMessage = errorData.message || errorData.error || errorMessage
              } catch (parseError) {}
              reject(new Error(errorMessage))
            }
          },
          fail: (error) => {
            console.error('❌ DEBUG UPLOAD - Upload request failed:', error)
            reject(new Error('网络请求失败: ' + (error.errMsg || '未知错误')))
          }
        })

        // 监听上传进度
        uploadTask.onProgressUpdate((res) => {
          console.log('📊 DEBUG UPLOAD - Upload progress:', res.progress + '%')
        })
      },
      fail: (fileError) => {
        console.error('❌ DEBUG UPLOAD - File check failed:', fileError)
        reject(new Error('文件不存在或无法访问: ' + fileError.errMsg))
      }
    })
  })
}

// 文档上传接口
export function uploadDocument(file, relatedType, relatedId, description, stage, sequence) {
  return new Promise((resolve, reject) => {
    console.log('🔍 DEBUG DOCUMENT UPLOAD - Starting document upload process')
    console.log('🔍 DEBUG DOCUMENT UPLOAD - File:', file)
    
    // 构建 formData
    const formData = {
      relatedType: Number(relatedType),
      relatedId: Number(relatedId),
      sequence: Number(sequence || 0),
      description: description || '',
      stage: stage || ''
    }

    console.log('🔍 DEBUG DOCUMENT UPLOAD - FormData:', formData)

    // 检查文件是否存在
    uni.getFileInfo({
      filePath: file,
      success: (fileInfo) => {
        console.log('✅ DEBUG DOCUMENT UPLOAD - File info:', {
          size: fileInfo.size,
          exists: true
        })

        // 开始上传文档
        const uploadTask = uni.uploadFile({
          url: getBaseUrl() + '/api/media/upload/document',
          filePath: file,
          name: 'file',
          formData: formData,
          header: {
            'Authorization': 'Bearer ' + getToken(),
          },
          success: (res) => {
            console.log('📡 DEBUG DOCUMENT UPLOAD - Upload response received')
            console.log('📡 DEBUG DOCUMENT UPLOAD - Status code:', res.statusCode)

            if (res.statusCode === 200) {
              try {
                const data = JSON.parse(res.data)
                console.log('📡 DEBUG DOCUMENT UPLOAD - Parsed response:', data)
                
                if (data.code === 200) {
                  console.log('✅ DEBUG DOCUMENT UPLOAD - Document upload successful')
                  // 提取文档URL信息
                  const result = {
                    ...data,
                    fileUrl: data.data?.fileUrl,
                    documentInfo: {
                      filename: data.data?.filename,
                      size: data.data?.size,
                      mediaType: data.data?.mediaType,
                      mediaTypeName: data.data?.mediaTypeName,
                      sequence: data.data?.sequence,
                      relatedType: data.data?.relatedType,
                      relatedId: data.data?.relatedId,
                      stage: data.data?.stage,
                      description: data.data?.description,
                      mediaId: data.data?.mediaId,
                      uploadTime: data.data?.uploadTime
                    }
                  }
                  resolve(result)
                } else {
                  console.error('❌ DEBUG DOCUMENT UPLOAD - Business logic error:', data.msg)
                  reject(new Error(data.msg || '文档上传失败'))
                }
              } catch (e) {
                console.error('❌ DEBUG DOCUMENT UPLOAD - JSON parse error:', e)
                reject(new Error('服务器响应格式错误'))
              }
            } else {
              console.error('❌ DEBUG DOCUMENT UPLOAD - HTTP error, status:', res.statusCode)
              let errorMessage = `文档上传失败，状态码: ${res.statusCode}`
              try {
                const errorData = JSON.parse(res.data)
                errorMessage = errorData.message || errorData.error || errorMessage
              } catch (parseError) {}
              reject(new Error(errorMessage))
            }
          },
          fail: (error) => {
            console.error('❌ DEBUG DOCUMENT UPLOAD - Upload request failed:', error)
            reject(new Error('网络请求失败: ' + (error.errMsg || '未知错误')))
          }
        })

        // 监听上传进度
        uploadTask.onProgressUpdate((res) => {
          console.log('📊 DEBUG DOCUMENT UPLOAD - Upload progress:', res.progress + '%')
        })
      },
      fail: (fileError) => {
        console.error('❌ DEBUG DOCUMENT UPLOAD - File check failed:', fileError)
        reject(new Error('文件不存在或无法访问: ' + fileError.errMsg))
      }
    })
  })
}

// 视频上传接口
export function uploadVideo(file, relatedType, relatedId, description, stage, sequence) {
  return new Promise((resolve, reject) => {
    console.log('🔍 DEBUG VIDEO UPLOAD - Starting video upload process')
    console.log('🔍 DEBUG VIDEO UPLOAD - File:', file)
    
    // 构建 formData
    const formData = {
      relatedType: Number(relatedType),
      relatedId: Number(relatedId),
      sequence: Number(sequence || 0),
      description: description || '',
      stage: stage || ''
    }

    console.log('🔍 DEBUG VIDEO UPLOAD - FormData:', formData)

    // 检查文件是否存在
    uni.getFileInfo({
      filePath: file,
      success: (fileInfo) => {
        console.log('✅ DEBUG VIDEO UPLOAD - File info:', {
          size: fileInfo.size,
          exists: true
        })

        // 开始上传视频
        const uploadTask = uni.uploadFile({
          url: getBaseUrl() + '/api/media/upload/video',
          filePath: file,
          name: 'file',
          formData: formData,
          header: {
            'Authorization': 'Bearer ' + getToken(),
          },
          success: (res) => {
            console.log('📡 DEBUG VIDEO UPLOAD - Upload response received')
            console.log('📡 DEBUG VIDEO UPLOAD - Status code:', res.statusCode)

            if (res.statusCode === 200) {
              try {
                const data = JSON.parse(res.data)
                console.log('📡 DEBUG VIDEO UPLOAD - Parsed response:', data)
                
                if (data.code === 200) {
                  console.log('✅ DEBUG VIDEO UPLOAD - Video upload successful')
                  // 提取视频URL信息
                  const result = {
                    ...data,
                    fileUrl: data.data?.fileUrl,
                    videoInfo: {
                      filename: data.data?.filename,
                      size: data.data?.size,
                      mediaType: data.data?.mediaType,
                      sequence: data.data?.sequence,
                      relatedType: data.data?.relatedType,
                      relatedId: data.data?.relatedId,
                      stage: data.data?.stage,
                      description: data.data?.description,
                      mediaId: data.data?.mediaId,
                      uploadTime: data.data?.uploadTime
                    }
                  }
                  resolve(result)
                } else {
                  console.error('❌ DEBUG VIDEO UPLOAD - Business logic error:', data.msg)
                  reject(new Error(data.msg || '视频上传失败'))
                }
              } catch (e) {
                console.error('❌ DEBUG VIDEO UPLOAD - JSON parse error:', e)
                reject(new Error('服务器响应格式错误'))
              }
            } else {
              console.error('❌ DEBUG VIDEO UPLOAD - HTTP error, status:', res.statusCode)
              let errorMessage = `视频上传失败，状态码: ${res.statusCode}`
              try {
                const errorData = JSON.parse(res.data)
                errorMessage = errorData.message || errorData.error || errorMessage
              } catch (parseError) {}
              reject(new Error(errorMessage))
            }
          },
          fail: (error) => {
            console.error('❌ DEBUG VIDEO UPLOAD - Upload request failed:', error)
            reject(new Error('网络请求失败: ' + (error.errMsg || '未知错误')))
          }
        })

        // 监听上传进度
        uploadTask.onProgressUpdate((res) => {
          console.log('📊 DEBUG VIDEO UPLOAD - Upload progress:', res.progress + '%')
        })
      },
      fail: (fileError) => {
        console.error('❌ DEBUG VIDEO UPLOAD - File check failed:', fileError)
        reject(new Error('文件不存在或无法访问: ' + fileError.errMsg))
      }
    })
  })
}

// 批量图片上传接口
export function batchUploadImages(files, relatedType, relatedId, stage) {
  console.log('🔍 DEBUG BATCH - Starting batch upload, file count:', files.length)
  
  const uploadPromises = files.map((file, index) => {
    return uploadImage(
      file,
      relatedType,
      relatedId,
      `文件${index + 1}`,
      stage,
      index
    )
  })
  
  return Promise.all(uploadPromises).then(results => {
    return {
      code: 200,
      msg: '批量上传成功',
      data: results.map(result => result.data),
      images: results.map(result => ({
        imageUrl: result.imageUrl,
        imageInfo: result.imageInfo
      }))
    }
  })
}

// 批量文档上传
export function batchUploadDocuments(files, relatedType, relatedId, stage) {
  console.log('🔍 DEBUG BATCH DOCUMENT - Starting batch document upload, file count:', files.length)
  
  const uploadPromises = files.map((file, index) => {
    return uploadDocument(
      file,
      relatedType,
      relatedId,
      `文档${index + 1}`,
      stage,
      index
    )
  })
  
  return Promise.all(uploadPromises).then(results => {
    return {
      code: 200,
      msg: '批量文档上传成功',
      data: results.map(result => result.data),
      documents: results.map(result => ({
        fileUrl: result.fileUrl,
        documentInfo: result.documentInfo
      }))
    }
  })
}

// 根据关联信息查询图片列表
export function getImagesByRelatedInfo(relatedType, relatedId) {
  return request({
    url: '/api/media/images',
    method: 'get',
    params: {
      relatedType: Number(relatedType),
      relatedId: Number(relatedId)
    }
  })
}

// 删除图片
export function deleteImage(mediaId) {
  return request({
    url: '/api/media/image/' + mediaId,
    method: 'delete'
  })
}

// 获取图片详情
export function getImageDetail(mediaId) {
  return request({
    url: '/api/media/image/' + mediaId,
    method: 'get'
  })
}

// 更新图片信息
export function updateImageInfo(mediaId, updateData) {
  return request({
    url: '/api/media/image/' + mediaId,
    method: 'put',
    data: updateData
  })
}

// ==================== 用户认证相关API ====================

// 手机号登录
export function login(loginForm) {
  return request({
    url: '/api/auth/login',
    headers: {
      isToken: false
    },
    method: 'post',
    data: loginForm
  })
}

// 发送短信验证码
export function sendCode(phoneNumber) {
  return request({
    url: '/api/auth/code',
    headers: {
      isToken: false
    },
    method: 'get',
    params: {
      phone: phoneNumber
    }
  })
}

// 获取用户信息
export function getUserInfo() {
  return request({
    url: '/api/users/profile',
    method: 'get'
  })
}

// 获取用户路由
export function getRouters() {
  return request({
    url: '/api/users/routers',
    method: 'get'
  })
}

// 退出登录
export function logout() {
  return request({
    url: '/logout',
    method: 'post'
  })
}

// 注册
export function register(registryForm) {
  return request({
    url: '/api/auth/register',
    headers: {
      isToken: false
    },
    method: 'post',
    data: registryForm
  })
}

// 获取图形验证码
export function getCodeImg() {
  return request({
    url: '/captchaImage',
    headers: {
      isToken: false
    },
    method: 'get',
    timeout: 20000
  })
}

// ==================== 工具函数和常量 ====================

// 获取基础URL
function getBaseUrl() {
  try {
    // 从配置文件获取基础URL
    const config = require('@/config')
    const baseUrl = config.baseUrl || 'http://localhost:8080'
    console.log('🔧 DEBUG - Base URL:', baseUrl)
    return baseUrl
  } catch (error) {
    console.error('❌ DEBUG - Cannot get base URL from config:', error)
    return 'https://your-api-domain.com'
  }
}

export const RELATED_TYPES = {
  MATERIAL_SUPPLIER: 1,
  MERCHANT_APPLICATION: 2,
  SHOP: 3,
  PRODUCT: 4,
  ID_CARD: 5,
  BUSINESS_LICENSE: 6,
  STORE_PHOTO: 7,
  USER_AVATAR: 8,
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

// 工具函数：获取文件描述
export function getFileDescription(fileType) {
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
}

// 工具函数：生成文件序列号
export function getFileSequence(fileType) {
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
}

// 工具函数：根据文件类型获取 relatedType
export function getRelatedTypeByFileType(fileType) {
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
}

// 工具函数：格式化文件大小
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 工具函数：获取当前时间戳
export function getCurrentTimestamp() {
  return new Date().toLocaleTimeString();
}

// ==================== 默认导出 ====================

export default {
  // 物料供应商申请
  submitApplication,
  getApplicationStatus,
  getApplicationDetail,
  updateApplication,
  cancelApplication,
  getApplicationList,
  downloadTemplate,
  
  // 媒体上传
  uploadImage,
  uploadDocument,
  batchUploadImages,
  batchUploadDocuments,
  getImagesByRelatedInfo,
  deleteImage,
  getImageDetail,
  updateImageInfo,
  
  // 用户认证
  login,
  sendCode,
  getUserInfo,
  getRouters,
  logout,
  register,
  getCodeImg,
  
  // 常量和工具函数
  RELATED_TYPES,
  MEDIA_TYPES,
  UPLOAD_STAGES,
  getFileDescription,
  getFileSequence,
  getRelatedTypeByFileType,
  formatFileSize,
  getCurrentTimestamp
}