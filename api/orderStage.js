// api/orderStage.js

import request from '@/utils/request' // 👈 默认导入

const BASE_URL = '/orderStage'

/**
 * 新增监理订单阶段
 * @param {Object} data - OrderStageDTO 对象
 * @returns {Promise}
 */
export function saveOrderStage(data) {
  return request({
    url: BASE_URL,
    method: 'POST',
    data
  })
}

/**
 * 删除监理订单阶段
 * @param {Number} orderStageId - 阶段ID
 * @returns {Promise}
 */
export function deleteOrderStage(orderStageId) {
  return request({
    url: BASE_URL,
    method: 'DELETE',
    params: { orderStageId }
  })
}

/**
 * 修改监理订单阶段
 * @param {Object} data - OrderStageDTO 对象
 * @returns {Promise}
 */
export function updateOrderStage(data) {
  return request({
    url: BASE_URL,
    method: 'PUT',
    data
  })
}

/**
 * 查询订单阶段列表
 * @param {Object} params - 查询条件
 * @returns {Promise}
 */
export function listOrderStages(params = {}) {
  return request({
    url: `${BASE_URL}/list`,
    method: 'GET',
    params
  })
}

// 导出服务对象，与你的其他 service 保持一致
export const orderStageService = {
  save: saveOrderStage,
  delete: deleteOrderStage,
  update: updateOrderStage,
  list: listOrderStages
}