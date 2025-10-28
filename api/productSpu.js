// api/productSpu.js
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
      method: 'post',
      data: productUpsertDTO,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  },

  /**
   * 获取商品列表
   * @param {Object} params 查询参数 {productName, category, product_status}
   * @returns {Promise}
   */
  getList(params) {
    return request({
      url: '/product/spu/list',
      method: 'get',
      params: {
        productName: params.productName || '',
        category: params.category || '',
        product_status: params.productStatus || ''
      }
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
      method: 'get'
    });
  },

  /**
   * 修改商品
   * @param {Object} productUpsertDTO 商品数据DTO
   * @returns {Promise}
   */
  update(productUpsertDTO) {
    return request({
      url: '/product/spu',
      method: 'put',
      data: productUpsertDTO,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  },

  /**
   * 删除商品 - 传递单个ID数字
   * @param {Number} productSpuId 商品ID
   * @returns {Promise}
   */
  delete(productSpuId) {
    return request({
      url: '/product/spu',
      method: 'delete',
      params: {
        productSpuIds: productSpuId // 直接传递单个ID数字
      }
    });
  },

  /**
   * 更新商品状态 - 使用查询参数
   * @param {String|Number} productSpuId 商品ID
   * @param {String} status 状态 ('0':上架, '2':下架)
   * @returns {Promise}
   */
  updateStatus(productSpuId, status) {
    return request({
      url: '/product/spu/status',
      method: 'put',
      params: {
        productSpuId: productSpuId,
        status: status
      }
    });
  },

  /**
   * 商品上架
   * @param {String|Number} productSpuId 商品ID
   * @returns {Promise}
   */
  putOnSale(productSpuId) {
    return this.updateStatus(productSpuId, '0'); // '0'表示上架
  },

  /**
   * 商品下架
   * @param {String|Number} productSpuId 商品ID
   * @returns {Promise}
   */
  putOffSale(productSpuId) {
    return this.updateStatus(productSpuId, '2'); // '2'表示下架
  }
}