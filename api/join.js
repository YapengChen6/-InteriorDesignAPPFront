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
    // 构建 formData
    const formData = {
      relatedType: Number(relatedType),
      relatedId: Number(relatedId),
      sequence: Number(sequence || 0),
      description: description || '',
      stage: stage || ''
    }

    // 检查文件是否存在
    uni.getFileInfo({
      filePath: file,
      success: (fileInfo) => {
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
            if (res.statusCode === 200) {
              try {
                const data = JSON.parse(res.data)
                
                if (data.code === 200) {
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
                  reject(new Error(data.msg || '上传失败'))
                }
              } catch (e) {
                reject(new Error('服务器响应格式错误'))
              }
            } else {
              let errorMessage = `上传失败，状态码: ${res.statusCode}`
              try {
                const errorData = JSON.parse(res.data)
                errorMessage = errorData.message || errorData.error || errorMessage
              } catch (parseError) {
                // 忽略解析错误
              }
              reject(new Error(errorMessage))
            }
          },
          fail: (error) => {
            reject(new Error('网络请求失败: ' + (error.errMsg || '未知错误')))
          }
        })

        // 监听上传进度
        uploadTask.onProgressUpdate((res) => {
          console.log('上传进度:', res.progress + '%')
        })

      },
      fail: (fileError) => {
        reject(new Error('文件不存在或无法访问: ' + fileError.errMsg))
      }
    })
  })
}

// 视频上传接口
export function uploadVideo(file, relatedType, relatedId, description, stage, sequence) {
  return new Promise((resolve, reject) => {
    // 构建 formData
    const formData = {
      relatedType: Number(relatedType),
      relatedId: Number(relatedId),
      sequence: Number(sequence || 0),
      description: description || '',
      stage: stage || ''
    }

    // 检查文件是否存在
    uni.getFileInfo({
      filePath: file,
      success: (fileInfo) => {
        // 开始上传
        const uploadTask = uni.uploadFile({
          url: getBaseUrl() + '/api/media/upload/video',
          filePath: file,
          name: 'file',
          formData: formData,
          header: {
            'Authorization': 'Bearer ' + getToken(),
          },
          success: (res) => {
            if (res.statusCode === 200) {
              try {
                const data = JSON.parse(res.data)
                
                if (data.code === 200) {
                  // 提取视频URL信息
                  const result = {
                    ...data,
                    videoUrl: data.data?.fileUrl,
                    videoInfo: {
                      filename: data.data?.filename,
                      size: data.data?.size,
                      sequence: data.data?.sequence,
                      relatedType: data.data?.relatedType,
                      relatedId: data.data?.relatedId,
                      stage: data.data?.stage,
                      description: data.data?.description,
                      mediaType: data.data?.mediaType,
                      mediaTypeName: data.data?.mediaTypeName || '视频'
                    }
                  }
                  resolve(result)
                } else {
                  reject(new Error(data.msg || '视频上传失败'))
                }
              } catch (e) {
                reject(new Error('服务器响应格式错误'))
              }
            } else {
              let errorMessage = `视频上传失败，状态码: ${res.statusCode}`
              try {
                const errorData = JSON.parse(res.data)
                errorMessage = errorData.message || errorData.error || errorMessage
              } catch (parseError) {
                // 忽略解析错误
              }
              reject(new Error(errorMessage))
            }
          },
          fail: (error) => {
            reject(new Error('网络请求失败: ' + (error.errMsg || '未知错误')))
          }
        })

        // 监听上传进度
        uploadTask.onProgressUpdate((res) => {
          console.log('视频上传进度:', res.progress + '%')
        })

      },
      fail: (fileError) => {
        reject(new Error('视频文件不存在或无法访问: ' + fileError.errMsg))
      }
    })
  })
}

// 通用文件上传接口（自动识别类型）
export function uploadFile(file, relatedType, relatedId, description, stage, sequence) {
  return new Promise((resolve, reject) => {
    // 构建 formData
    const formData = {
      relatedType: Number(relatedType || 0),
      relatedId: Number(relatedId || 0),
      sequence: Number(sequence || 0),
      description: description || '',
      stage: stage || ''
    }

    // 检查文件是否存在
    uni.getFileInfo({
      filePath: file,
      success: (fileInfo) => {
        // 开始上传
        const uploadTask = uni.uploadFile({
          url: getBaseUrl() + '/api/media/upload/file',
          filePath: file,
          name: 'file',
          formData: formData,
          header: {
            'Authorization': 'Bearer ' + getToken(),
          },
          success: (res) => {
            if (res.statusCode === 200) {
              try {
                const data = JSON.parse(res.data)
                
                if (data.code === 200) {
                  const result = {
                    ...data,
                    fileUrl: data.data?.fileUrl,
                    fileInfo: {
                      filename: data.data?.filename,
                      size: data.data?.size,
                      mediaType: data.data?.mediaType,
                      mediaTypeName: data.data?.mediaTypeName,
                      sequence: data.data?.sequence,
                      relatedType: data.data?.relatedType,
                      relatedId: data.data?.relatedId,
                      stage: data.data?.stage,
                      description: data.data?.description
                    }
                  }
                  resolve(result)
                } else {
                  reject(new Error(data.msg || '文件上传失败'))
                }
              } catch (e) {
                reject(new Error('服务器响应格式错误'))
              }
            } else {
              let errorMessage = `文件上传失败，状态码: ${res.statusCode}`
              try {
                const errorData = JSON.parse(res.data)
                errorMessage = errorData.message || errorData.error || errorMessage
              } catch (parseError) {
                // 忽略解析错误
              }
              reject(new Error(errorMessage))
            }
          },
          fail: (error) => {
            reject(new Error('网络请求失败: ' + (error.errMsg || '未知错误')))
          }
        })

        // 监听上传进度
        uploadTask.onProgressUpdate((res) => {
          console.log('文件上传进度:', res.progress + '%')
        })

      },
      fail: (fileError) => {
        reject(new Error('文件不存在或无法访问: ' + fileError.errMsg))
      }
    })
  })
}

// 批量图片上传接口
export function batchUploadImages(files, relatedType, relatedId, stage) {
  // 逐个上传文件
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

// 批量视频上传接口
export function batchUploadVideos(files, relatedType, relatedId, stage) {
  // 逐个上传视频文件
  const uploadPromises = files.map((file, index) => {
    return uploadVideo(
      file,
      relatedType,
      relatedId,
      `视频${index + 1}`,
      stage,
      index
    )
  })
  
  return Promise.all(uploadPromises).then(results => {
    return {
      code: 200,
      msg: '批量视频上传成功',
      data: results.map(result => result.data),
      videos: results.map(result => ({
        videoUrl: result.videoUrl,
        videoInfo: result.videoInfo
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

// 根据关联信息查询视频列表
export function getVideosByRelatedInfo(relatedType, relatedId) {
  return request({
    url: '/api/media/videos',
    method: 'get',
    params: {
      relatedType: Number(relatedType),
      relatedId: Number(relatedId)
    }
  })
}

// 根据媒体类型获取列表
export function getMediaByType(relatedType, relatedId, mediaType) {
  return request({
    url: '/api/media/list/type',
    method: 'get',
    params: {
      relatedType: Number(relatedType),
      relatedId: Number(relatedId),
      mediaType: Number(mediaType)
    }
  })
}

// 获取所有媒体列表
export function getAllMedia(relatedType, relatedId) {
  return request({
    url: '/api/media/list',
    method: 'get',
    params: {
      relatedType: Number(relatedType),
      relatedId: Number(relatedId)
    }
  })
}

// 删除媒体资源
export function deleteMedia(mediaId) {
  return request({
    url: '/api/media/image/' + mediaId,
    method: 'delete'
  })
}

// 批量删除媒体资源
export function batchDeleteMedia(mediaIds) {
  return request({
    url: '/api/media/batch',
    method: 'delete',
    data: mediaIds
  })
}

// 获取媒体详情
export function getMediaDetail(mediaId) {
  return request({
    url: '/api/media/detail/' + mediaId,
    method: 'get'
  })
}

// 更新媒体信息
export function updateMediaInfo(mediaId, updateData) {
  return request({
    url: '/api/media/update/' + mediaId,
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
    const config = require('@/config')
    const baseUrl = config.baseUrl || 'http://localhost:8080'
    return baseUrl
  } catch (error) {
    return 'https://your-api-domain.com'
  }
}

// 支持的视频格式
export const VIDEO_FORMATS = {
  MP4: 'mp4',
  MOV: 'mov',
  AVI: 'avi',
  FLV: 'flv',
  WEBM: 'webm',
  '3GP': '3gp',
  OGG: 'ogg',
  WMV: 'wmv',
  MKV: 'mkv'
}

// 视频最大大小限制（50MB）
export const VIDEO_MAX_SIZE = 50 * 1024 * 1024

// 视频最大时长限制（5分钟）
export const VIDEO_MAX_DURATION = 300

export const RELATED_TYPES = {
  MATERIAL_SUPPLIER: 1,      // 物料供应商
  MERCHANT_APPLICATION: 2,   // 商户申请
  SHOP: 3,                   // 店铺
  PRODUCT: 4,                // 商品
  ID_CARD: 5,                // 身份证
  BUSINESS_LICENSE: 6,       // 营业执照
  STORE_PHOTO: 7,            // 门店照片
  USER_AVATAR: 8,            // 用户头像
  VIDEO_CONTENT: 9,          // 视频内容
  TEST: 99                   // 测试
}

export const MEDIA_TYPES = {
  IMAGE: 1,      // 图片
  VIDEO: 3,      // 视频（注意：后端定义中视频是3）
  DOCUMENT: 5,   // 文档
  OTHER: 4       // 其他
}

export const UPLOAD_STAGES = {
  APPLICATION: 'APPLICATION',        // 申请阶段
  VERIFICATION: 'VERIFICATION',      // 验证阶段
  APPROVAL: 'APPROVAL',             // 审批阶段
  COMPLETED: 'COMPLETED',           // 完成阶段
  VIDEO: 'VIDEO'                    // 视频阶段
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
    video: '视频文件',
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
    video: 10,
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
    video: RELATED_TYPES.VIDEO_CONTENT,
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

// 工具函数：验证视频文件
export function validateVideoFile(file, maxSize = VIDEO_MAX_SIZE, maxDuration = VIDEO_MAX_DURATION) {
  return new Promise((resolve, reject) => {
    // 检查文件大小
    uni.getFileInfo({
      filePath: file,
      success: (fileInfo) => {
        if (fileInfo.size > maxSize) {
          reject(new Error(`视频文件大小不能超过 ${formatFileSize(maxSize)}`));
          return;
        }
        
        // 检查文件格式
        const fileExt = file.split('.').pop().toLowerCase();
        const supportedFormats = Object.values(VIDEO_FORMATS);
        if (!supportedFormats.includes(fileExt)) {
          reject(new Error(`不支持的视频格式，支持的格式: ${supportedFormats.join(', ')}`));
          return;
        }
        
        resolve({
          size: fileInfo.size,
          format: fileExt,
          isValid: true
        });
      },
      fail: (error) => {
        reject(new Error('无法获取视频文件信息: ' + error.errMsg));
      }
    });
  });
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
  uploadVideo,
  uploadFile,
  batchUploadImages,
  batchUploadVideos,
  
  // 媒体查询和管理
  getImagesByRelatedInfo,
  getVideosByRelatedInfo,
  getMediaByType,
  getAllMedia,
  deleteMedia,
  batchDeleteMedia,
  getMediaDetail,
  updateMediaInfo,
  
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
  VIDEO_FORMATS,
  VIDEO_MAX_SIZE,
  VIDEO_MAX_DURATION,
  getFileDescription,
  getFileSequence,
  getRelatedTypeByFileType,
  formatFileSize,
  validateVideoFile
}