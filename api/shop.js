import request from '@/utils/request'
import { getToken } from '@/utils/auth'

const baseURL = 'http://localhost:8081' // 根据您的后端地址调整

/**
 * 获取当前用户的店铺信息
 */
export function getMyShop() {
  return request({
    url: '/api/shop/my',
    method: 'get',
    baseURL
  })
}

/**
 * 根据店铺ID获取店铺信息
 */
export function getShopById(shopId) {
  return request({
    url: `/api/shop/${shopId}`,
    method: 'get',
    baseURL
  })
}

/**
 * 获取所有有效店铺列表
 */
export function getShopList() {
  return request({
    url: '/api/shop/list',
    method: 'get',
    baseURL
  })
}

/**
 * 创建店铺
 */
export function createShop(data) {
  return request({
    url: '/api/shop/create',
    method: 'post',
    data: data,
    baseURL
  })
}

/**
 * 更新店铺信息
 */
export function updateShop(data) {
  return request({
    url: '/api/shop/update',
    method: 'put',
    data: data,
    baseURL
  })
}

/**
 * 删除店铺
 */
export function deleteShop(shopId) {
  return request({
    url: `/api/shop/${shopId}`,
    method: 'delete',
    baseURL
  })
}



















