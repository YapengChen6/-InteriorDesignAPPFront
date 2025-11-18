// api/product.js
import request from '@/utils/request'

/**
 * 商品SPU相关接口
 * 对应后端：ProductSpuController
 */

// ==================== 商品SPU接口 ====================

/**
 * 创建商品SPU
 * @param {Object} productUpsertDTO - 商品SPU数据
 * @param {string} productUpsertDTO.productName - 商品名称（必填）
 * @param {string} productUpsertDTO.category - 分类（必填，支持多种格式）
 * @param {string} productUpsertDTO.productDetail - 商品详情
 * @param {string} productUpsertDTO.productStatus - 商品状态（0/2）
 * @param {string} productUpsertDTO.specType - 规格类型（0/2）
 * @param {number} productUpsertDTO.marketPrice - 市场价
 * @param {number} productUpsertDTO.costPrice - 成本价
 * @param {number} productUpsertDTO.stock - 库存
 * @param {Array} productUpsertDTO.spuAttributes - SPU属性
 * @param {Array} productUpsertDTO.productSkus - SKU列表
 */
export function saveProduct(productUpsertDTO) {
  return request({
    url: '/product/spu',
    method: 'post',
    data: productUpsertDTO,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

/**
 * 更新商品SPU
 * @param {Object} productUpsertDTO - 商品SPU数据
 * @param {number} productUpsertDTO.productSpuId - 商品SPU ID（必填）
 * @param {string} productUpsertDTO.productName - 商品名称
 * @param {string} productUpsertDTO.category - 分类
 */
export function updateProduct(productUpsertDTO) {
  return request({
    url: '/product/spu',
    method: 'put',
    data: productUpsertDTO,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

/**
 * 获取商品SPU详情
 * @param {string|number} id - 商品SPU ID
 */
export function getProductDetail(id) {
  return request({
    url: `/product/spu/${id}`,
    method: 'get'
  })
}

/**
 * 删除商品SPU
 * @param {Array|number} productSpuIds - 商品SPU ID数组或单个ID
 */
export function deleteProduct(productSpuIds) {
  const ids = Array.isArray(productSpuIds) ? productSpuIds : [productSpuIds]
  
  return request({
    url: '/product/spu',
    method: 'delete',
    data: ids,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

/**
 * 获取商品SPU列表
 * @param {Object} queryParams - 查询参数
 * @param {string} queryParams.productName - 商品名称关键词
 * @param {string} queryParams.category - 分类名称
 * @param {string} queryParams.productStatus - 商品状态
 * @param {number} queryParams.pageNum - 页码
 * @param {number} queryParams.pageSize - 每页大小
 */
export function getProductList(queryParams) {
  return request({
    url: '/product/spu/list',
    method: 'get',
    params: queryParams
  })
}

/**
 * 更新商品状态
 * @param {number} productSpuId - 商品SPU ID
 * @param {string} status - 状态值（0/2）
 */
export function updateProductStatus(productSpuId, status) {
  return request({
    url: '/product/spu/status',
    method: 'put',
    params: {
      productSpuId: productSpuId,
      status: status
    }
  })
}

// ==================== 商品分类接口 ====================

/**
 * 获取商品分类树
 * 对应后端：ProductCategoryController.tree
 */
export function getCategoryTree() {
  return request({
    url: '/api/categories/tree',
    method: 'get'
  })
}

/**
 * 根据分类名称搜索分类
 * @param {string} categoryName - 分类名称
 */
export function searchCategories(categoryName) {
  return request({
    url: '/api/categories/search',
    method: 'get',
    params: {
      name: categoryName
    }
  })
}

/**
 * 验证分类是否为三级分类
 * @param {string} category - 分类字符串
 */
export function validateCategory(category) {
  return request({
    url: '/api/categories/validate',
    method: 'post',
    data: {
      category: category
    },
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// ==================== 媒体上传接口 ====================

/**
 * 上传图片
 * @param {FormData} formData - 表单数据
 * @param {Function} onUploadProgress - 上传进度回调
 */
export function uploadImage(formData, onUploadProgress = null) {
  const config = {
    url: '/api/media/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }
  
  if (onUploadProgress) {
    config.onUploadProgress = onUploadProgress
  }
  
  return request(config)
}

/**
 * 简化版图片上传（仅文件）
 * @param {File} file - 文件对象
 * @param {Function} onUploadProgress - 上传进度回调
 */
export function uploadSimpleImage(file, onUploadProgress = null) {
  const formData = new FormData()
  formData.append('file', file)
  
  const config = {
    url: '/api/media/upload-simple',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }
  
  if (onUploadProgress) {
    config.onUploadProgress = onUploadProgress
  }
  
  return request(config)
}

/**
 * 批量上传商品图片
 * @param {Array} files - 文件数组
 * @param {number} relatedId - 关联的SPU ID
 * @param {string} description - 图片描述
 * @param {string} stage - 阶段标识
 */
export function batchUploadProductImages(files, relatedId, description = '', stage = '') {
  const uploadPromises = files.map((file, index) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('relatedType', '5') // PRODUCT_SPU
    formData.append('relatedId', relatedId.toString())
    formData.append('description', description)
    formData.append('stage', stage)
    formData.append('sequence', index.toString())
    
    return uploadImage(formData)
  })
  
  return Promise.all(uploadPromises)
}

/**
 * 获取媒体资源列表
 * @param {Object} queryParams - 查询参数
 * @param {number} queryParams.relatedType - 关联类型（5=商品SPU）
 * @param {number} queryParams.relatedId - 关联ID
 * @param {string} queryParams.stage - 阶段标识
 */
export function getMediaList(queryParams) {
  return request({
    url: '/api/media/list',
    method: 'get',
    params: queryParams
  })
}

/**
 * 删除媒体资源
 * @param {number} mediaId - 媒体资源ID
 */
export function deleteMedia(mediaId) {
  return request({
    url: `/api/media/${mediaId}`,
    method: 'delete'
  })
}

/**
 * 更新媒体资源信息
 * @param {number} mediaId - 媒体资源ID
 * @param {Object} mediaData - 媒体数据
 * @param {string} mediaData.description - 描述
 * @param {number} mediaData.sequence - 序号
 */
export function updateMedia(mediaId, mediaData) {
  return request({
    url: `/api/media/${mediaId}`,
    method: 'put',
    data: mediaData,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

/**
 * 媒体服务健康检查
 */
export function mediaHealthCheck() {
  return request({
    url: '/api/media/health',
    method: 'get'
  })
}

// ==================== 工具函数 ====================

/**
 * 创建商品上传表单数据
 * @param {Object} productData - 商品数据
 * @returns {Object} 符合后端要求的表单数据
 */
export function createProductFormData(productData) {
  return {
    productName: productData.productName || '',
    productDetail: productData.productDetail || '',
    category: productData.category || '',
    productStatus: productData.productStatus || '0',
    specType: productData.specType || '0',
    marketPrice: productData.marketPrice || 0,
    costPrice: productData.costPrice || 0,
    stock: productData.stock || 0,
    spuAttributes: productData.spuAttributes || [],
    productSkus: productData.productSkus || []
  }
}

/**
 * 创建图片上传表单数据
 * @param {File} file - 文件对象
 * @param {number} relatedId - 关联SPU ID
 * @param {string} description - 描述
 * @param {string} stage - 阶段标识
 * @param {number} sequence - 序号
 * @returns {FormData} 表单数据
 */
export function createImageFormData(file, relatedId, description = '', stage = '', sequence = 0) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('relatedType', '5') // PRODUCT_SPU
  formData.append('relatedId', relatedId.toString())
  formData.append('description', description)
  formData.append('stage', stage)
  formData.append('sequence', sequence.toString())
  return formData
}

export default {
  // 商品SPU接口
  saveProduct,
  updateProduct,
  getProductDetail,
  deleteProduct,
  getProductList,
  updateProductStatus,
  
  // 商品分类接口
  getCategoryTree,
  searchCategories,
  validateCategory,
  
  // 媒体上传接口
  uploadImage,
  uploadSimpleImage,
  batchUploadProductImages,
  getMediaList,
  deleteMedia,
  updateMedia,
  mediaHealthCheck,
  
  // 工具函数
  createProductFormData,
  createImageFormData
}