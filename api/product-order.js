import request from '@/utils/request'

const prefix = '/api/product-order'

/**
 * 从购物车创建订单（按商家分组）
 * @param {Array<number>} cartIds 购物车ID列表
 * @param {number} addressId 收货地址ID
 */
export function createOrdersFromCart(cartIds, addressId) {
  return request({
    url: `${prefix}/create-from-cart`,
    method: 'post',
    data: {
      cartIds,
      addressId
    }
  })
}

/**
 * 获取用户订单列表
 * @param {string} orderStatus 订单状态（可选）
 */
export function getUserOrderList(orderStatus) {
  return request({
    url: `${prefix}/list`,
    method: 'get',
    params: orderStatus ? { orderStatus } : {}
  })
}

/**
 * 获取订单详情
 * @param {number} orderId 订单ID
 */
export function getOrderDetail(orderId) {
  return request({
    url: `${prefix}/${orderId}`,
    method: 'get'
  })
}

/**
 * 获取商家端订单详情
 * @param {number} orderId 订单ID
 */
export function getShopOrderDetail(orderId) {
  return request({
    url: `${prefix}/shop/${orderId}`,
    method: 'get'
  })
}

/**
 * 获取商家订单列表
 * @param {string} orderStatus 订单状态（可选）
 */
export function getShopOrderList(orderStatus) {
  return request({
    url: `${prefix}/shop/list`,
    method: 'get',
    params: orderStatus ? { orderStatus } : {}
  })
}

/**
 * 商家发货
 * @param {number} orderId 订单ID
 * @param {string} shippingCompany 物流公司
 * @param {string} trackingNumber 物流单号
 */
export function shipOrder(orderId, shippingCompany, trackingNumber) {
  return request({
    url: `${prefix}/${orderId}/ship`,
    method: 'put',
    data: {
      shippingCompany,
      trackingNumber
    }
  })
}

/**
 * 取消订单
 * @param {number} orderId 订单ID
 */
export function cancelOrder(orderId) {
  return request({
    url: `${prefix}/${orderId}/cancel`,
    method: 'put'
  })
}

/**
 * 确认收货
 * @param {number} orderId 订单ID
 */
export function confirmReceipt(orderId) {
  return request({
    url: `${prefix}/${orderId}/confirm-receipt`,
    method: 'put'
  })
}

/**
 * 用户支付订单（确认付款）
 * @param {number} orderId 订单ID
 */
export function payOrder(orderId) {
  return request({
    url: `${prefix}/${orderId}/pay`,
    method: 'put'
  })
}

/**
 * 直接购买创建订单（不经过购物车）
 * @param {number} spuId 商品SPU ID
 * @param {number} skuId 商品SKU ID（可选）
 * @param {number} quantity 购买数量
 * @param {number} addressId 收货地址ID
 */
export function createOrderDirect(spuId, skuId, quantity, addressId) {
  return request({
    url: `${prefix}/create-direct`,
    method: 'post',
    data: {
      spuId,
      skuId,
      quantity,
      addressId
    }
  })
}

export default {
  createOrdersFromCart,
  getUserOrderList,
  getOrderDetail,
  getShopOrderList,
  getShopOrderDetail,
  shipOrder,
  cancelOrder,
  confirmReceipt,
  payOrder,
  createOrderDirect
}

