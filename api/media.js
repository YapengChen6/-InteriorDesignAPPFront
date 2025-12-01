import request from '@/utils/request'

// 关联类型常量
export const RELATED_TYPE_PRODUCT_SPU = 5 // 商品SPU图片

/**
 * 根据关联信息查询图片列表
 * @param {number} relatedType - 关联类型 (5=商品SPU)
 * @param {number} relatedId - 关联ID (商品SPU ID)
 */
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

/**
 * 获取所有媒体列表
 * @param {number} relatedType - 关联类型
 * @param {number} relatedId - 关联ID
 */
export function getAllMediaByRelated(relatedType, relatedId) {
  return request({
    url: '/api/media/list',
    method: 'get',
    params: {
      relatedType: Number(relatedType),
      relatedId: Number(relatedId)
    }
  })
}

/**
 * 根据媒体类型获取列表
 * @param {number} relatedType - 关联类型
 * @param {number} relatedId - 关联ID
 * @param {number} mediaType - 媒体类型 (1=图片)
 */
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

/**
 * 获取商品SPU的图片列表
 * @param {number} spuId - 商品SPU ID
 */
export function getProductSpuImages(spuId) {
  return getImagesByRelatedInfo(RELATED_TYPE_PRODUCT_SPU, spuId)
}

/**
 * 删除图片
 * @param {number} mediaId - 媒体ID
 */
export function deleteImage(mediaId) {
  return request({
    url: `/api/media/image/${mediaId}`,
    method: 'delete'
  })
}

/**
 * 获取媒体详情
 * @param {number} mediaId - 媒体ID
 */
export function getMediaDetail(mediaId) {
  return request({
    url: `/api/media/detail/${mediaId}`,
    method: 'get'
  })
}

export default {
  getImagesByRelatedInfo,
  getAllMediaByRelated,
  getMediaByType,
  getProductSpuImages,
  deleteImage,
  getMediaDetail,
  RELATED_TYPE_PRODUCT_SPU
}

