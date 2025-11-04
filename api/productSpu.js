// api/productSpu.js
import request from '@/utils/request.js';

export default {
  /**
   * 新增商品SPU
   * @param {Object} productUpsertDTO 商品SPU数据
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
   * 获取商品SPU列表
   * @param {Object} params 查询参数
   * @returns {Promise}
   */
  getList(params) {
    return request({
      url: '/product/spu/list',
      method: 'get',
      params: params
    });
  },

  /**
   * 获取商品SPU列表（附带媒体信息）
   * @param {Object} params 查询参数
   * @returns {Promise}
   */
  getListWithMedia(params) {
    return request({
      url: '/product/spu/listWithMedia',
      method: 'get',
      params: params
    });
  },

  /**
   * 获取商品SPU详情
   * @param {String|Number} productSpuId 商品SPU ID
   * @returns {Promise}
   */
  getDetail(productSpuId) {
    return request({
      url: `/product/spu/${productSpuId}`,
      method: 'get'
    });
  },

  /**
   * 修改商品SPU
   * @param {Object} productUpsertDTO 商品SPU数据
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
   * 删除商品SPU
   * @param {Array|Number} productSpuIds 商品SPU ID数组或单个ID
   * @returns {Promise}
   */
  delete(productSpuIds) {
    // 如果传入的是单个ID，转换为数组
    const ids = Array.isArray(productSpuIds) ? productSpuIds : [productSpuIds];
    return request({
      url: '/product/spu',
      method: 'delete',
      params: {
        productSpuIds: ids
      }
    });
  },

  /**
   * 更新商品状态
   * @param {Number} productSpuId 商品SPU ID
   * @param {String} status 状态值
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
  }

  // 注意：移除了原来的export方法，因为后端控制器中没有对应的导出接口
  // 如果需要导出功能，需要在后端添加相应的接口
}