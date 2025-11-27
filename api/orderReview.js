import request from '@/utils/request'

/**
 * 订单评价API
 */
export const orderReviewApi = {
  /**
   * 新增订单评价
   * @param {Object} orderReviewDTO 评价数据
   * @returns {Promise}
   */
  save(orderReviewDTO) {
    return request({
      url: '/orderReview',
      method: 'post',
      data: orderReviewDTO
    })
  },

  /**
   * 删除订单评价
   * @param {Number} orderReviewId 评价ID
   * @returns {Promise}
   */
  delete(orderReviewId) {
    return request({
      url: '/orderReview',
      method: 'delete',
      params: { orderReviewId }
    })
  },

  /**
   * 查询订单评价列表
   * @param {Object} orderReview 查询参数
   * @returns {Promise}
   */
  getList(orderReview) {
    return request({
      url: '/orderReview/list',
      method: 'get',
      params: orderReview
    })
  }
}

export default orderReviewApi