// 设计师入驻相关API
import request from '@/utils/request'
import { getToken } from '@/utils/auth'

// ==================== 常量定义 ====================

// 相关类型常量
const RELATED_TYPES = {
  DESIGNER: 1,        // 设计师
  SHOP: 2,            // 商家
  SUPERVISOR: 3,      // 监工
  PROJECT: 4,         // 项目
  ORDER: 5            // 订单
}

// 媒体类型常量
const MEDIA_TYPES = {
  IMAGE: 1,
  VIDEO: 2,
  DOCUMENT: 3,
  AUDIO: 4
}

// 上传阶段常量
const UPLOAD_STAGES = {
  APPLICATION: 'application',     // 申请阶段
  VERIFICATION: 'verification',   // 验证阶段
  COMPLETION: 'completion',       // 完成阶段
  WORK: 'work',                   // 作品阶段
  AVATAR: 'avatar'                // 头像阶段
}

// 根据文件类型获取描述
function getFileDescription(fileType) {
  const descriptions = {
    qualificationCertificate: '设计师资格证书',
    handheldIdPhoto: '手持身份证照片',
    idCardFrontPhoto: '身份证正面照片',
    idCardBackPhoto: '身份证反面照片',
    avatar: '头像',
    portfolio: '作品集',
    designDraft: '设计稿',
    contract: '合同文件'
  }
  return descriptions[fileType] || '设计师资料'
}

// 根据文件类型获取序列号
function getFileSequence(fileType) {
  const sequences = {
    qualificationCertificate: 1,
    handheldIdPhoto: 2,
    idCardFrontPhoto: 3,
    idCardBackPhoto: 4,
    avatar: 1,
    portfolio: 5
  }
  return sequences[fileType] || 0
}

// 根据文件类型获取相关类型
function getRelatedTypeByFileType(fileType) {
  // 设计师相关的文件都使用设计师类型
  return RELATED_TYPES.DESIGNER
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 获取基础URL
function getBaseUrl() {
  // 根据你的环境配置返回对应的基础URL
  // 开发环境
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8080'
  }
  // 生产环境
  return 'https://your-production-domain.com'
}

// ==================== 设计师入驻相关API ====================

// 提交设计师入驻申请
export function submitDesignerApplication(applicationDTO) {
  return request({
    url: '/api/designer/application',
    method: 'post',
    data: applicationDTO
  })
}

// 查询设计师申请状态
export function getDesignerApplicationStatus() {
  return request({
    url: '/api/designer/status',
    method: 'get'
  })
}

// 获取设计师申请详情
export function getDesignerApplicationDetail() {
  return request({
    url: '/api/designer/detail',
    method: 'get'
  })
}

// 更新设计师申请信息
export function updateDesignerApplication(applicationDTO) {
  return request({
    url: '/api/designer/application',
    method: 'put',
    data: applicationDTO
  })
}

// 管理员查询设计师申请列表
export function getDesignerApplicationList(params) {
  return request({
    url: '/api/designer/admin/list',
    method: 'get',
    params: params
  })
}

// 管理员审核申请
export function reviewDesignerApplication(reviewDTO) {
  return request({
    url: '/api/designer/admin/review',
    method: 'post',
    data: reviewDTO
  })
}

// 管理员获取申请详情
export function getDesignerApplicationDetailForAdmin(designersId) {
  return request({
    url: `/api/designer/admin/detail/${designersId}`,
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
              } catch (parseError) {
                // 忽略解析错误
              }
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

// 批量图片上传接口
export function batchUploadImages(files, relatedType, relatedId, stage) {
  console.log('🔍 DEBUG BATCH - Starting batch upload, file count:', files.length)
  
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

// ==================== 导出所有内容 ====================

// 只使用默认导出，避免重复导出问题
export default {
  // 常量
  RELATED_TYPES,
  MEDIA_TYPES,
  UPLOAD_STAGES,
  
  // 工具函数
  getFileDescription,
  getFileSequence,
  getRelatedTypeByFileType,
  formatFileSize,
  
  // 设计师API
  submitDesignerApplication,
  getDesignerApplicationStatus,
  getDesignerApplicationDetail,
  updateDesignerApplication,
  getDesignerApplicationList,
  reviewDesignerApplication,
  getDesignerApplicationDetailForAdmin,
  
  // 媒体上传API
  uploadImage,
  batchUploadImages,
  getImagesByRelatedInfo,
  deleteImage,
  getImageDetail,
  updateImageInfo,
  
  // 用户认证API
  login,
  sendCode,
  getUserInfo,
  logout,
  register
}