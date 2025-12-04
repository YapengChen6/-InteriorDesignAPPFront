import request from '@/utils/request'

const prefix = '/api/after-sale'

/**
 * 创建售后服务申请
 * @param {Object} data 申请数据
 * @param {number} data.orderId 订单ID
 * @param {string} data.type 申请类型 (refund/return/exchange)
 * @param {string} data.reason 申请原因
 * @param {string} data.remark 补充说明
 * @param {Array<string>} data.images 图片URL列表
 */
export function createAfterSaleApplication(data) {
  return request({
    url: `${prefix}/apply`,
    method: 'post',
    data: data
  })
}

/**
 * 获取订单的售后记录列表
 * @param {number} orderId 订单ID
 */
export function getAfterSaleList(orderId) {
  return request({
    url: `${prefix}/list`,
    method: 'get',
    params: { orderId }
  })
}

/**
 * 获取售后申请详情
 * @param {number} id 售后申请ID
 */
export function getAfterSaleDetail(id) {
  return request({
    url: `${prefix}/${id}`,
    method: 'get'
  })
}

/**
 * 取消售后申请
 * @param {number} id 售后申请ID
 */
export function cancelAfterSale(id) {
  return request({
    url: `${prefix}/${id}/cancel`,
    method: 'put'
  })
}

export default {
  createAfterSaleApplication,
  getAfterSaleList,
  getAfterSaleDetail,
  cancelAfterSale
}
