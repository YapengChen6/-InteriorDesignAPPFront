import request from '@/utils/request'

const prefix = '/api/address'

/**
 * 获取用户地址列表
 */
export function getAddressList() {
  return request({
    url: `${prefix}/list`,
    method: 'get'
  })
}

/**
 * 获取默认地址
 */
export function getDefaultAddress() {
  return request({
    url: `${prefix}/default`,
    method: 'get'
  })
}

/**
 * 根据ID获取地址
 * @param {number} addressId 地址ID
 */
export function getAddressById(addressId) {
  return request({
    url: `${prefix}/${addressId}`,
    method: 'get'
  })
}

/**
 * 新增地址
 * @param {Object} address 地址信息
 */
export function addAddress(address) {
  return request({
    url: prefix,
    method: 'post',
    data: address
  })
}

/**
 * 更新地址
 * @param {Object} address 地址信息
 */
export function updateAddress(address) {
  return request({
    url: prefix,
    method: 'put',
    data: address
  })
}

/**
 * 删除地址
 * @param {number} addressId 地址ID
 */
export function deleteAddress(addressId) {
  return request({
    url: `${prefix}/${addressId}`,
    method: 'delete'
  })
}

/**
 * 设置默认地址
 * @param {number} addressId 地址ID
 */
export function setDefaultAddress(addressId) {
  return request({
    url: `${prefix}/${addressId}/default`,
    method: 'put'
  })
}

export default {
  getAddressList,
  getDefaultAddress,
  getAddressById,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
}




















