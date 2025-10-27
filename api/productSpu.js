import request from '@/utils/request.js';

export default {
  /**
   * 新增商品
   * @param {Object} productUpsertDTO 商品数据DTO
   * @returns {Promise}
   */
  save(productUpsertDTO) {
    return request({
      url: '/product/spu',
      method: 'POST',
      data: productUpsertDTO,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  },

  /**
   * 获取商品列表
   * @param {Object} params 查询参数
   * @returns {Promise}
   */
  getList(params) {
    return request({
      url: '/product/spu',
      method: 'GET',
      params
    });
  },

  /**
   * 获取商品详情
   * @param {String|Number} id 商品ID
   * @returns {Promise}
   */
  getDetail(id) {
    return request({
      url: `/product/spu/${id}`,
      method: 'GET'
    });
  }
}