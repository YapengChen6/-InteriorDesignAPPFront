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

// 图片上传接口 - 调试版本
export function uploadImage(file, relatedType, relatedId, description, stage, sequence) {
  return new Promise((resolve, reject) => {
    console.log('🔍 DEBUG UPLOAD - Starting upload process')
    console.log('🔍 DEBUG UPLOAD - File:', file)
    console.log('🔍 DEBUG UPLOAD - File type:', typeof file)
    
    // 构建 formData
    const formData = {
      relatedType: Number(relatedType),
      relatedId: Number(relatedId),
      sequence: Number(sequence || 0),
      description: description || '',
      stage: stage || ''
    }

    console.log('🔍 DEBUG UPLOAD - FormData:', formData)
    console.log('🔍 DEBUG UPLOAD - Base URL:', getBaseUrl())
    console.log('🔍 DEBUG UPLOAD - Full URL:', getBaseUrl() + '/api/media/uploadImage')
    console.log('🔍 DEBUG UPLOAD - Token exists:', !!getToken())

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
          name: 'file', // 必须和后端 @RequestParam("file") 一致
          formData: formData,
          header: {
            'Authorization': 'Bearer ' + getToken(),
            // 不要手动设置 Content-Type，uni.uploadFile 会自动设置
          },
          success: (res) => {
            console.log('📡 DEBUG UPLOAD - Upload response received')
            console.log('📡 DEBUG UPLOAD - Status code:', res.statusCode)
            console.log('📡 DEBUG UPLOAD - Response data:', res.data)
            console.log('📡 DEBUG UPLOAD - Error message:', res.errMsg)

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
                console.error('❌ DEBUG UPLOAD - Raw response that failed to parse:', res.data)
                reject(new Error('服务器响应格式错误'))
              }
            } else {
              console.error('❌ DEBUG UPLOAD - HTTP error, status:', res.statusCode)
              // 尝试解析错误信息
              let errorMessage = `上传失败，状态码: ${res.statusCode}`
              try {
                const errorData = JSON.parse(res.data)
                errorMessage = errorData.message || errorData.error || errorMessage
                console.error('❌ DEBUG UPLOAD - Error details:', errorData)
              } catch (parseError) {
                console.error('❌ DEBUG UPLOAD - Cannot parse error response')
              }
              reject(new Error(errorMessage))
            }
          },
          fail: (error) => {
            console.error('❌ DEBUG UPLOAD - Upload request failed:', error)
            reject(new Error('网络请求失败: ' + (error.errMsg || '未知错误')))
          },
          complete: (completeRes) => {
            console.log('📡 DEBUG UPLOAD - Upload completed:', completeRes)
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

// 简单上传测试方法
export function testUpload() {
  return new Promise((resolve, reject) => {
    // 先选择一张图片
    uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (chooseRes) => {
        const tempFilePath = chooseRes.tempFilePaths[0]
        console.log('🧪 TEST UPLOAD - Selected test file:', tempFilePath)
        
        // 使用最简单的参数测试
        uploadImage(
          tempFilePath,
          1, // relatedType
          0, // relatedId
          '测试图片',
          'TEST',
          0
        ).then(resolve).catch(reject)
      },
      fail: (error) => {
        reject(new Error('选择测试图片失败: ' + error.errMsg))
      }
    })
  })
}

// 批量图片上传接口 - 简化版本
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

// 获取用户路由
export function getRouters() {
  return request({
    url: '/api/users/routers',
    method: 'get'
  })
}

// 退出登录 - 修改后的版本
export function logout() {
  return request({
    url: '/logout',  // 修正路径
    method: 'post'
    // 移除 token 参数，让拦截器自动添加 Authorization header
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

// ==================== 图片上传测试页面相关API ====================

/**
 * 测试服务连接状态
 * @param {string} type - 接口类型: 'media' | 'test'
 */
export function testConnection(type) {
  let url, name;

  switch(type) {
    case 'media':
      url = '/api/media/health';
      name = '媒体接口';
      break;
    case 'test':
      url = '/test/health';
      name = '测试接口';
      break;
    default:
      return Promise.reject(new Error('未知的接口类型'));
  }

  return request({
    url: url,
    method: 'get',
    headers: {
      isToken: false
    }
  }).then(response => {
    return {
      success: true,
      name: name,
      status: 200,
      data: response
    };
  }).catch(error => {
    return {
      success: false,
      name: name,
      error: error
    };
  });
}

/**
 * 测试所有服务连接
 */
export function testAllConnections() {
  return Promise.allSettled([
    testConnection('media'),
    testConnection('test')
  ]);
}

/**
 * 上传文件测试 - 修复版本
 * @param {Object} uploadConfig - 上传配置
 * @param {File} uploadConfig.file - 文件对象
 * @param {string} uploadConfig.apiUrl - 接口地址
 * @param {number} uploadConfig.relatedType - 关联类型
 * @param {number} uploadConfig.relatedId - 关联ID
 * @param {string} uploadConfig.description - 描述
 */
export function uploadFileTest(uploadConfig) {
  const { file, apiUrl, relatedType, relatedId, description } = uploadConfig;
  
  return new Promise((resolve, reject) => {
    // 构建 formData
    const formData = {
      relatedType: Number(relatedType),
      relatedId: Number(relatedId),
      description: description || '',
      sequence: 0,
      stage: 'TEST'
    };

    console.log('🔍 UPLOAD TEST - Starting upload with config:', {
      apiUrl,
      relatedType,
      relatedId,
      description,
      file: file.name || file.path
    });

    // 使用 uni.uploadFile 进行上传
    const uploadTask = uni.uploadFile({
      url: getBaseUrl() + apiUrl,
      filePath: file.path || file,
      name: 'file',
      formData: formData,
      header: {
        'Authorization': 'Bearer ' + getToken(),
      },
      success: (res) => {
        console.log('📡 UPLOAD TEST - Upload response received');
        console.log('📡 UPLOAD TEST - Status code:', res.statusCode);
        console.log('📡 UPLOAD TEST - Response data:', res.data);

        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data);
            console.log('✅ UPLOAD TEST - Upload successful:', data);
            
            // 提取图片URL和其他信息
            const result = {
              success: true,
              code: data.code,
              message: data.msg,
              imageUrl: data.data?.fileUrl, // 提取图片URL
              imageInfo: {
                filename: data.data?.filename,
                size: data.data?.size,
                sequence: data.data?.sequence,
                relatedType: data.data?.relatedType,
                relatedId: data.data?.relatedId,
                stage: data.data?.stage,
                description: data.data?.description
              },
              originalData: data // 保留原始数据
            };
            
            resolve(result);
          } catch (e) {
            console.error('❌ UPLOAD TEST - JSON parse error:', e);
            reject(new Error('服务器响应格式错误'));
          }
        } else {
          console.error('❌ UPLOAD TEST - HTTP error, status:', res.statusCode);
          let errorMessage = `上传失败，状态码: ${res.statusCode}`;
          try {
            const errorData = JSON.parse(res.data);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (parseError) {
            // 忽略解析错误
          }
          reject(new Error(errorMessage));
        }
      },
      fail: (error) => {
        console.error('❌ UPLOAD TEST - Upload request failed:', error);
        reject(new Error('网络请求失败: ' + (error.errMsg || '未知错误')));
      }
    });

    // 监听上传进度（可选）
    uploadTask.onProgressUpdate((res) => {
      console.log('📊 UPLOAD TEST - Upload progress:', res.progress + '%');
    });
  });
}

/**
 * 简化的上传测试方法
 */
export function simpleUploadTest(file) {
  return uploadFileTest({
    file: file,
    apiUrl: '/api/media/upload',
    relatedType: 1,
    relatedId: 123,
    description: '测试上传'
  });
}

/**
 * 获取上传测试日志
 */
export function getUploadTestLogs() {
  // 这里可以返回存储在本地或全局的日志信息
  return Promise.resolve([]);
}

/**
 * 清空测试日志
 */
export function clearTestLogs() {
  // 这里可以清空本地或全局的日志信息
  return Promise.resolve();
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
    // 默认URL，根据你的实际情况修改
    return 'https://your-api-domain.com'
  }
}

export const RELATED_TYPES = {
  MATERIAL_SUPPLIER: 1,      // 物料供应商
  MERCHANT_APPLICATION: 2,   // 商户申请
  SHOP: 3,                   // 店铺
  PRODUCT: 4,                // 商品
  ID_CARD: 5,                // 身份证
  BUSINESS_LICENSE: 6,       // 营业执照
  STORE_PHOTO: 7,            // 门店照片
  USER_AVATAR: 8,            // 用户头像 - 确保这个存在
  TEST: 99                   // 测试
}

export const MEDIA_TYPES = {
  IMAGE: 1,      // 图片
  VIDEO: 2,      // 视频
  DOCUMENT: 3,   // 文档
  OTHER: 4       // 其他
}

export const UPLOAD_STAGES = {
  APPLICATION: 'APPLICATION',        // 申请阶段
  VERIFICATION: 'VERIFICATION',      // 验证阶段
  APPROVAL: 'APPROVAL',             // 审批阶段
  COMPLETED: 'COMPLETED',           // 完成阶段
  TEST: 'TEST'                      // 测试阶段
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
  testUpload,
  batchUploadImages,
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
  
  // 图片上传测试
  testConnection,
  testAllConnections,
  uploadFileTest,
  simpleUploadTest,
  getUploadTestLogs,
  clearTestLogs,
  
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