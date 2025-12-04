import request from '@/utils/request'

const prefix = '/api/cart'

/**
 * 获取当前登录用户的购物车列表（含商品与SKU详情）
 */
export function getCartList() {
  return request({
    url: `${prefix}/list`,
    method: 'get'
  })
}

/**
 * 获取购物车已选中的条目
 */
export function getSelectedItems() {
  return request({
    url: `${prefix}/selected`,
    method: 'get'
  })
}

/**
 * 获取购物车商品总数
 */
export function getCartCount() {
  return request({
    url: `${prefix}/count`,
    method: 'get'
  })
}

/**
 * 向购物车新增一条记录
 * @param {Object} data { spuId, skuId, quantity }
 */
export function addCartItem(data) {
  return request({
    url: `${prefix}/add`,
    method: 'post',
    data
  })
}

/**
 * 更新购物车某一条记录
 * @param {number} cartId 
 * @param {Object} data 
 */
export function updateCartItem(cartId, data) {
  return request({
    url: `${prefix}/item/${cartId}`,
    method: 'put',
    data
  })
}

/**
 * 更新购物车数量
 * @param {number} cartId 
 * @param {number} quantity 
 */
export function updateCartQuantity(cartId, quantity) {
  return request({
    url: `${prefix}/item/${cartId}/quantity`,
    method: 'put',
    data: { quantity }
  })
}

/**
 * 批量更新选中状态
 * @param {Array<number>} cartIds 
 * @param {boolean} selected 
 */
export function updateCartSelectedStatus(cartIds = [], selected = true) {
  return request({
    url: `${prefix}/batch-selected`,
    method: 'post',
    data: {
      cartIds,
      selected
    }
  })
}

/**
 * 批量删除购物车记录
 * @param {Array<number>} cartIds 
 */
export function deleteCartItems(cartIds = []) {
  return request({
    url: `${prefix}/batch-delete`,
    method: 'post',
    data: { cartIds }
  })
}

/**
 * 清空当前用户的购物车
 */
export function clearCart() {
  return request({
    url: `${prefix}/clear`,
    method: 'delete'
  })
}

export default {
  getCartList,
  getSelectedItems,
  getCartCount,
  addCartItem,
  updateCartItem,
  updateCartQuantity,
  updateCartSelectedStatus,
  deleteCartItems,
  clearCart
}





















