import request from '@/utils/request'

const baseURL = 'http://localhost:8081' // 根据您的后端地址调整

// ==================== 分类管理 ====================

/**
 * 新增分类
 */
export function addCategory(data) {
  return request({
    url: '/api/product-shelf/category/add',
    method: 'post',
    data: data,
    baseURL
  })
}

/**
 * 更新分类
 */
export function updateCategory(data) {
  return request({
    url: '/api/product-shelf/category/update',
    method: 'put',
    data: data,
    baseURL
  })
}

/**
 * 删除分类
 */
export function deleteCategory(categoryId) {
  return request({
    url: `/api/product-shelf/category/delete/${categoryId}`,
    method: 'delete',
    baseURL
  })
}

/**
 * 查询所有有效分类
 */
export function getAllCategories() {
  return request({
    url: '/api/product-shelf/category/list',
    method: 'get',
    baseURL
  })
}

/**
 * 查询三级分类
 */
export function getLevel3Categories() {
  return request({
    url: '/api/product-shelf/category/level3',
    method: 'get',
    baseURL
  })
}

/**
 * 获取一级分类列表
 */
export function getLevel1Categories() {
  return request({
    url: '/api/product-shelf/category/level1',
    method: 'get',
    baseURL
  })
}

/**
 * 根据一级分类ID获取二级分类列表
 */
export function getLevel2CategoriesByLevel1(level1CategoryId) {
  return request({
    url: `/api/product-shelf/category/level2/${level1CategoryId}`,
    method: 'get',
    baseURL
  })
}

/**
 * 根据二级分类ID获取三级分类列表
 */
export function getLevel3CategoriesByLevel2(level2CategoryId) {
  return request({
    url: `/api/product-shelf/category/level3/${level2CategoryId}`,
    method: 'get',
    baseURL
  })
}

/**
 * 验证三级分类与一、二级分类的父子关系一致性
 */
export function validateCategoryHierarchy(data) {
  return request({
    url: '/api/product-shelf/category/validate-hierarchy',
    method: 'post',
    data: data,
    baseURL
  })
}

/**
 * 获取分类的完整路径字符串
 */
export function getCategoryPathString(categoryId) {
  return request({
    url: `/api/product-shelf/category/path/${categoryId}`,
    method: 'get',
    baseURL
  })
}

/**
 * 为现有商品数据设置分类路径信息
 */
export function updateExistingProductCategoryPaths() {
  return request({
    url: '/api/product-shelf/spu/update-category-paths',
    method: 'post',
    baseURL
  })
}

// ==================== SPU 管理 ====================

/**
 * 新增商品SPU
 */
export function addProductSpu(data) {
  return request({
    url: '/api/product-shelf/spu/add',
    method: 'post',
    data: data,
    baseURL
  })
}

/**
 * 更新商品SPU
 */
export function updateProductSpu(data) {
  return request({
    url: '/api/product-shelf/spu/update',
    method: 'put',
    data: data,
    baseURL
  })
}

/**
 * 删除商品SPU
 */
export function deleteProductSpu(spuId) {
  return request({
    url: `/api/product-shelf/spu/delete/${spuId}`,
    method: 'delete',
    baseURL
  })
}

/**
 * 批量删除商品SPU
 */
export function batchDeleteProductSpus(spuIds) {
  return request({
    url: '/api/product-shelf/spu/batch-delete',
    method: 'post',
    data: spuIds,
    baseURL
  })
}

/**
 * 上架商品SPU
 */
export function publishProductSpu(spuId) {
  return request({
    url: `/api/product-shelf/spu/publish/${spuId}`,
    method: 'post',
    baseURL
  })
}

/**
 * 下架商品SPU
 */
export function unpublishProductSpu(spuId) {
  return request({
    url: `/api/product-shelf/spu/unpublish/${spuId}`,
    method: 'post',
    baseURL
  })
}

/**
 * 批量上架商品SPU
 */
export function batchPublishProductSpu(spuIds) {
  return request({
    url: '/api/product-shelf/spu/batch-publish',
    method: 'post',
    data: spuIds,
    baseURL
  })
}

/**
 * 批量下架商品SPU
 */
export function batchUnpublishProductSpu(spuIds) {
  return request({
    url: '/api/product-shelf/spu/batch-unpublish',
    method: 'post',
    data: spuIds,
    baseURL
  })
}

/**
 * 查询所有有效SPU
 */
export function getAllProductSpus() {
  return request({
    url: '/api/product-shelf/spu/list',
    method: 'get',
    baseURL
  })
}

/**
 * 根据分类查询SPU
 */
export function getProductSpusByCategory(categoryId) {
  return request({
    url: `/api/product-shelf/spu/list-by-category/${categoryId}`,
    method: 'get',
    baseURL
  })
}

/**
 * 查询已上架的SPU
 */
export function getOnShelfProductSpus() {
  return request({
    url: '/api/product-shelf/spu/on-shelf',
    method: 'get',
    baseURL
  })
}

/**
 * 查询已下架的SPU
 */
export function getOffShelfProductSpus() {
  return request({
    url: '/api/product-shelf/spu/off-shelf',
    method: 'get',
    baseURL
  })
}

/**
 * 获取SPU详情
 */
export function getProductSpuDetail(spuId) {
  return request({
    url: `/api/product-shelf/spu/detail/${spuId}`,
    method: 'get',
    baseURL
  })
}

// ==================== SKU 管理 ====================

/**
 * 新增SKU
 */
export function addProductSku(data) {
  return request({
    url: '/api/product-shelf/sku/add',
    method: 'post',
    data: data,
    baseURL
  })
}

/**
 * 更新SKU
 */
export function updateProductSku(data) {
  return request({
    url: '/api/product-shelf/sku/update',
    method: 'put',
    data: data,
    baseURL
  })
}

/**
 * 删除SKU
 */
export function deleteProductSku(skuId) {
  return request({
    url: `/api/product-shelf/sku/delete/${skuId}`,
    method: 'delete',
    baseURL
  })
}

/**
 * 批量删除SKU
 */
export function batchDeleteProductSkus(skuIds) {
  return request({
    url: '/api/product-shelf/sku/batch-delete',
    method: 'post',
    data: skuIds,
    baseURL
  })
}

/**
 * 上架SKU
 */
export function publishProductSku(skuId) {
  return request({
    url: `/api/product-shelf/sku/publish/${skuId}`,
    method: 'post',
    baseURL
  })
}

/**
 * 下架SKU
 */
export function unpublishProductSku(skuId) {
  return request({
    url: `/api/product-shelf/sku/unpublish/${skuId}`,
    method: 'post',
    baseURL
  })
}

/**
 * 批量上架SKU
 */
export function batchPublishProductSkus(skuIds) {
  return request({
    url: '/api/product-shelf/sku/batch-publish',
    method: 'post',
    data: skuIds,
    baseURL
  })
}

/**
 * 批量下架SKU
 */
export function batchUnpublishProductSkus(skuIds) {
  return request({
    url: '/api/product-shelf/sku/batch-unpublish',
    method: 'post',
    data: skuIds,
    baseURL
  })
}

/**
 * 根据SPU ID查询SKU列表
 */
export function getProductSkusBySpuId(spuId) {
  return request({
    url: `/api/product-shelf/sku/list-by-spu/${spuId}`,
    method: 'get',
    baseURL
  })
}

/**
 * 查询所有有效SKU
 */
export function getAllProductSkus() {
  return request({
    url: '/api/product-shelf/sku/list',
    method: 'get',
    baseURL
  })
}

/**
 * 查询已上架的SKU
 */
export function getOnShelfProductSkus() {
  return request({
    url: '/api/product-shelf/sku/on-shelf',
    method: 'get',
    baseURL
  })
}

/**
 * 查询已下架的SKU
 */
export function getOffShelfProductSkus() {
  return request({
    url: '/api/product-shelf/sku/off-shelf',
    method: 'get',
    baseURL
  })
}

// ==================== 媒体上传 ====================

/**
 * 上传图片
 */
export function uploadProductImage(formData) {
  return request({
    url: '/api/media/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    baseURL
  })
}

/**
 * 批量上传图片
 */
export function batchUploadProductImages(formDataList) {
  const uploadPromises = formDataList.map(formData => 
    uploadProductImage(formData)
  )
  return Promise.all(uploadPromises)
}

export default {
  // 分类管理
  addCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
  getLevel3Categories,
  getLevel1Categories,
  getLevel2CategoriesByLevel1,
  getLevel3CategoriesByLevel2,
  validateCategoryHierarchy,
  getCategoryPathString,
  updateExistingProductCategoryPaths,
  
  // SPU管理
  addProductSpu,
  updateProductSpu,
  deleteProductSpu,
  batchDeleteProductSpus,
  publishProductSpu,
  unpublishProductSpu,
  batchPublishProductSpu,
  batchUnpublishProductSpu,
  getAllProductSpus,
  getProductSpusByCategory,
  getOnShelfProductSpus,
  getOffShelfProductSpus,
  getProductSpuDetail,
  
  // SKU管理
  addProductSku,
  updateProductSku,
  deleteProductSku,
  batchDeleteProductSkus,
  publishProductSku,
  unpublishProductSku,
  batchPublishProductSkus,
  batchUnpublishProductSkus,
  getProductSkusBySpuId,
  getAllProductSkus,
  getOnShelfProductSkus,
  getOffShelfProductSkus,
  
  // 媒体上传
  uploadProductImage,
  batchUploadProductImages
}