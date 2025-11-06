// api/productSpu.js
import request from '@/utils/request'

/**
 * 商品SPU相关接口
 * 对应后端：ProductSpuController
 */

/**
 * 新增商品SPU
 * @param {Object} productUpsertDTO - 商品SPU数据
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
 * 获取商品SPU列表
 * @param {Object} queryParams - 查询参数
 * @param {string} queryParams.keyword - 搜索关键词
 * @param {number} queryParams.categoryId - 分类ID
 * @param {number} queryParams.status - 商品状态
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
 * 获取商品SPU列表（附带媒体信息）
 * @param {Object} queryParams - 查询参数
 * @param {string} queryParams.keyword - 搜索关键词
 * @param {number} queryParams.categoryId - 分类ID
 * @param {number} queryParams.status - 商品状态
 * @param {number} queryParams.pageNum - 页码
 * @param {number} queryParams.pageSize - 每页大小
 */
export function getProductListWithMedia(queryParams) {
  return request({
    url: '/product/spu/listWithMedia',
    method: 'get',
    params: queryParams
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
 * 修改商品SPU
 * @param {Object} productUpsertDTO - 商品SPU数据
 * @param {string|number} productUpsertDTO.id - 商品ID（必填）
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
 * 删除商品SPU
 * @param {Array|number} productSpuIds - 商品SPU ID数组或单个ID
 */
export function deleteProduct(productSpuIds) {
  const ids = Array.isArray(productSpuIds) ? productSpuIds : [productSpuIds]
  
  return request({
    url: '/product/spu',
    method: 'delete',
    params: {
      productSpuIds: ids
    },
    paramsSerializer: {
      indexes: null
    }
  })
}

/**
 * 更新商品状态
 * @param {number} productSpuId - 商品SPU ID
 * @param {string} status - 状态值
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

/**
 * 新增商品（新API路径）
 * @param {Object} productUpsertDTO - 商品SPU数据
 */
export function createProduct(productUpsertDTO) {
  return request({
    url: '/api/products',
    method: 'post',
    data: productUpsertDTO,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

/**
 * 获取商品详情（新API路径）
 * @param {string|number} id - 商品SPU ID
 */
export function getProductDetailNew(id) {
  return request({
    url: `/api/products/${id}`,
    method: 'get'
  })
}

/**
 * 获取商品SKU列表
 * @param {string|number} productSpuId - 商品SPU ID
 */
export function getProductSkus(productSpuId) {
  return request({
    url: `/api/products/${productSpuId}/skus`,
    method: 'get'
  })
}

/**
 * 获取商品属性列表
 * @param {string|number} productSpuId - 商品SPU ID
 */
export function getProductAttributes(productSpuId) {
  return request({
    url: `/api/products/${productSpuId}/attributes`,
    method: 'get'
  })
}

export default {
  saveProduct,
  getProductList,
  getProductListWithMedia,
  getProductDetail,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  createProduct,
  getProductDetailNew,
  getProductSkus,
  getProductAttributes
}