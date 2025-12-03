import request from '@/utils/request'

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

// =============== 新增：缺失的业务操作接口 ===============

/**
 * 确认订单阶段
 * @param {Number} orderStageId - 阶段ID
 * @returns {Promise}
 */
export function confirmOrderStage(orderStageId) {
  return request({
    url: `${BASE_URL}/confirm`,
    method: 'PUT',
    params: { orderStageId }
  })
}

/**
 * 启动订单阶段
 * @param {Number} orderStageId - 阶段ID
 * @returns {Promise}
 */
export function startOrderStage(orderStageId) {
  return request({
    url: `${BASE_URL}/start`,
    method: 'PUT',
    params: { orderStageId }
  })
}

/**
 * 结束订单阶段
 * @param {Number} orderStageId - 阶段ID
 * @returns {Promise}
 */
export function endOrderStage(orderStageId) {
  return request({
    url: `${BASE_URL}/end`,
    method: 'PUT',
    params: { orderStageId }
  })
}

// 导出服务对象
export const orderStageService = {
  save: saveOrderStage,
  delete: deleteOrderStage,
  update: updateOrderStage,
  list: listOrderStages,
  confirm: confirmOrderStage,   // 新增
  start: startOrderStage,       // 新增
  end: endOrderStage            // 新增
}