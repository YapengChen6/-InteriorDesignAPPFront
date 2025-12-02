// api/orderTask.js
import request from '@/utils/request'

/**
 * 订单任务管理API
 */

/**
 * 插入一个只含id的空订单日志
 */
export function saveNull() {
  return request({
    url: '/orderTask/saveNull',
    method: 'post'
  })
}

/**
 * 删除订单日志
 * @param {number} orderTaskId 订单任务ID
 */
export function deleteOrderTask(orderTaskId) {
  return request({
    url: '/orderTask',
    method: 'delete',
    data: {
      orderTaskId: orderTaskId
    }
  })
}

/**
 * 修改订单日志
 * @param {Object} orderTaskDTO 订单任务数据传输对象
 */
export function updateOrderTask(orderTaskDTO) {
  return request({
    url: '/orderTask',
    method: 'put',
    data: orderTaskDTO
  })
}

/**
 * 查询订单日志及相应图片
 * @param {Object} orderTask 查询条件对象
 */
export function getOrderTaskList(orderTask) {
  return request({
    url: '/orderTask/list',
    method: 'get',
    data: orderTask
  })
}

export default {
  saveNull,
  deleteOrderTask,
  updateOrderTask,
  getOrderTaskList
}