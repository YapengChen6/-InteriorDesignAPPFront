// @/api/order.js
import request from '@/utils/request'

const baseURL = '/order'

/**
 * 订单状态枚举
 */
export const OrderStatus = {
  PENDING: 0,      // 待确认
  PROCESSING: 1,   // 进行中
  COMPLETED: 2,    // 已完成
  CANCELLED: 3,    // 已取消
  REFUNDED: 4      // 已退款
}

/**
 * 订单类型枚举
 */
export const OrderType = {
  DESIGN: 1,       // 设计订单
  SUPERVISION: 2   // 监理订单
}

/**
 * 合同状态枚举
 */
export const ContractStatus = {
  PENDING_SIGN: 0, // 待签署
  SIGNED: 1        // 已签署
}

/**
 * 订单API - 直接对应后端接口
 */
export const orderApi = {
  /**
   * 新增订单
   * @param {Object} orderDTO 订单数据
   * @returns {Promise}
   */
  save(orderDTO) {
    return request({
      url: baseURL,
      method: 'post',
      data: orderDTO,
      loading: true
    })
  },

  /**
   * 查询订单列表
   * @param {Object} params 查询参数
   * @returns {Promise}
   */
  getList(params) {
    return request({
      url: `${baseURL}/list`,
      method: 'get',
      params: params,
      loading: true
    })
  },

  /**
   * 删除订单
   * @param {Number} orderId 订单ID
   * @returns {Promise}
   */
  delete(orderId) {
    return request({
      url: baseURL,
      method: 'delete',
      data: { orderId },
      loading: true
    })
  },

  /**
   * 修改订单
   * @param {Object} orderDTO 订单数据
   * @returns {Promise}
   */
  update(orderDTO) {
    return request({
      url: baseURL,
      method: 'put',
      data: orderDTO,
      loading: true
    })
  },

  /**
   * 更改订单状态
   * @param {Number} orderId 订单ID
   * @param {Number} status 状态
   * @returns {Promise}
   */
  updateStatus(orderId, status) {
    console.log('🔧 调用updateStatus接口 - orderId:', orderId, 'status:', status)
    return request({
      url: `${baseURL}/updateStatus`,
      method: 'put',
      params: {  // 使用params作为查询参数
        orderId: orderId,
        status: status
      },
      loading: true
    })
  }
}

/**
 * 订单服务
 */
export const orderService = {
  /**
   * 创建设计订单
   * @param {Object} orderData 订单数据
   * @returns {Promise}
   */
  async createDesignOrder(orderData) {
    try {
      // 构建符合后端OrderDTO字段的订单数据
      const orderDTO = {
        projectId: orderData.projectId,
        userId: orderData.userId, // 客户用户ID
        type: OrderType.DESIGN, // 设计订单
        expectedEndTime: orderData.expectedEndTime,
        totalAmount: orderData.totalAmount,
        remark: orderData.remark,
        // 其他可能需要的字段
        contractorId: orderData.contractorId || null,
        contractUrl: orderData.contractUrl || '',
        contractStatus: orderData.contractStatus || ContractStatus.PENDING_SIGN
      }
      
      console.log('创建设计订单数据:', orderDTO)
      
      const res = await orderApi.save(orderDTO)
      if (res.code === 200 || res.success) {
        return Promise.resolve(res.data || res.result)
      } else {
        const errorMsg = res.msg || res.message || '创建订单失败'
        return Promise.reject(new Error(errorMsg))
      }
    } catch (error) {
      console.error('创建订单异常:', error)
      if (error.errMsg && error.errMsg.includes('request:fail')) {
        throw new Error('网络连接失败，请检查网络设置')
      }
      throw error
    }
  },

  /**
   * 获取订单分页列表
   * @param {Object} queryParams 查询参数
   * @returns {Promise}
   */
  async getOrderList(queryParams = {}) {
    try {
      // 订单查询参数映射 - 对应后端的Order实体类字段
      const params = {
        // 订单基础信息
        orderId: queryParams.orderId,
        projectId: queryParams.projectId,
        userId: queryParams.userId,
        contractorId: queryParams.contractorId,
        
        // 状态筛选
        status: queryParams.status,
        type: queryParams.type,
        contractStatus: queryParams.contractStatus,
        
        // 时间范围查询
        expectedEndTime: queryParams.expectedEndTime,
        actualEndTime: queryParams.actualEndTime,
        createTime: queryParams.createTime,
        
        // 金额相关
        totalAmount: queryParams.totalAmount,
        
        // 备注搜索
        remark: queryParams.remark,
        
        // 分页参数（后端使用startPage()，这里传递分页参数）
        pageNum: queryParams.pageNum || 1,
        pageSize: queryParams.pageSize || 10
      }
      
      // 过滤空值参数
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] == null || params[key] === undefined) {
          delete params[key]
        }
      })
      
      console.log('🎯 订单查询参数:', params)
      
      const res = await orderApi.getList(params)
      
      // 根据后端返回格式调整
      if (res.code === 200 || res.success) {
        const data = res.data || res.result
        console.log('✅ 订单列表数据:', data)
        return Promise.resolve(data)
      } else {
        const errorMsg = res.msg || res.message || '获取订单列表失败'
        return Promise.reject(new Error(errorMsg))
      }
    } catch (error) {
      console.error('❌ 获取订单列表异常:', error)
      throw error
    }
  },

  /**
   * 根据用户ID获取订单列表
   * @param {Number} userId 用户ID
   * @param {Object} queryParams 其他查询参数
   * @returns {Promise}
   */
  async getOrderListByUserId(userId, queryParams = {}) {
    try {
      if (!userId) {
        throw new Error('用户ID不能为空')
      }
      
      const params = {
        userId: userId,
        ...queryParams
      }
      
      return await this.getOrderList(params)
    } catch (error) {
      console.error('❌ 获取用户订单列表异常:', error)
      throw error
    }
  },

  /**
   * 删除订单
   * @param {Number} orderId 订单ID
   * @returns {Promise}
   */
  async deleteOrder(orderId) {
    try {
      return new Promise((resolve, reject) => {
        uni.showModal({
          title: '提示',
          content: '确定要删除该订单吗？',
          success: async (res) => {
            if (res.confirm) {
              try {
                const result = await orderApi.delete(orderId)
                if (result.code === 200 || result.success) {
                  resolve(result.data || result.result)
                } else {
                  const errorMsg = result.msg || result.message || '删除失败'
                  reject(new Error(errorMsg))
                }
              } catch (error) {
                reject(error)
              }
            } else {
              reject(new Error('用户取消'))
            }
          }
        })
      })
    } catch (error) {
      return Promise.reject(error)
    }
  },

  /**
   * 更新订单信息
   * @param {Object} orderData 订单数据
   * @returns {Promise}
   */
  async updateOrder(orderData) {
    try {
      const res = await orderApi.update(orderData)
      if (res.code === 200 || res.success) {
        return Promise.resolve(res.data || res.result)
      } else {
        const errorMsg = res.msg || res.message || '更新订单失败'
        return Promise.reject(new Error(errorMsg))
      }
    } catch (error) {
      console.error('更新订单异常:', error)
      throw error
    }
  },

  /**
   * 确认订单 - 使用状态更新接口
   * @param {Number} orderId 订单ID
   * @returns {Promise}
   */
  async confirmOrder(orderId) {
    try {
      console.log('确认订单，订单ID:', orderId)
      
      const res = await orderApi.updateStatus(orderId, OrderStatus.PROCESSING)
      console.log('确认订单响应:', res)
      
      if (res.code === 200 || res.success) {
        return Promise.resolve(res.data || res.result)
      } else {
        const errorMsg = res.msg || res.message || '确认订单失败'
        return Promise.reject(new Error(errorMsg))
      }
    } catch (error) {
      console.error('确认订单异常:', error)
      throw error
    }
  },

  /**
   * 取消订单 - 使用状态更新接口
   * @param {Number} orderId 订单ID
   * @returns {Promise}
   */
  async cancelOrder(orderId) {
    try {
      console.log('取消订单，订单ID:', orderId)
      
      const res = await orderApi.updateStatus(orderId, OrderStatus.CANCELLED)
      console.log('取消订单响应:', res)
      
      if (res.code === 200 || res.success) {
        return Promise.resolve(res.data || res.result)
      } else {
        const errorMsg = res.msg || res.message || '取消订单失败'
        return Promise.reject(new Error(errorMsg))
      }
    } catch (error) {
      console.error('取消订单异常:', error)
      throw error
    }
  },

  /**
   * 完成订单 - 使用状态更新接口
   * @param {Number} orderId 订单ID
   * @returns {Promise}
   */
  async completeOrder(orderId) {
    try {
      console.log('完成订单，订单ID:', orderId)
      
      const res = await orderApi.updateStatus(orderId, OrderStatus.COMPLETED)
      console.log('完成订单响应:', res)
      
      if (res.code === 200 || res.success) {
        return Promise.resolve(res.data || res.result)
      } else {
        const errorMsg = res.msg || res.message || '完成订单失败'
        return Promise.reject(new Error(errorMsg))
      }
    } catch (error) {
      console.error('完成订单异常:', error)
      throw error
    }
  },

  /**
   * 获取订单状态映射
   * @returns {Object}
   */
  getOrderStatusMap() {
    return {
      [OrderStatus.PENDING]: '待确认',
      [OrderStatus.PROCESSING]: '进行中',
      [OrderStatus.COMPLETED]: '已完成',
      [OrderStatus.CANCELLED]: '已取消',
      [OrderStatus.REFUNDED]: '已退款'
    }
  },

  /**
   * 获取订单类型映射
   * @returns {Object}
   */
  getOrderTypeMap() {
    return {
      [OrderType.DESIGN]: '设计订单',
      [OrderType.SUPERVISION]: '监理订单'
    }
  },

  /**
   * 获取合同状态映射
   * @returns {Object}
   */
  getContractStatusMap() {
    return {
      [ContractStatus.PENDING_SIGN]: '待签署',
      [ContractStatus.SIGNED]: '已签署'
    }
  },

  /**
   * 获取订单状态文本
   * @param {Number} status 状态码
   * @returns {String}
   */
  getOrderStatusText(status) {
    const statusMap = this.getOrderStatusMap()
    return statusMap[status] || '未知状态'
  },

  /**
   * 获取订单类型文本
   * @param {Number} type 类型码
   * @returns {String}
   */
  getOrderTypeText(type) {
    const typeMap = this.getOrderTypeMap()
    return typeMap[type] || '未知类型'
  },

  /**
   * 获取合同状态文本
   * @param {Number} status 合同状态码
   * @returns {String}
   */
  getContractStatusText(status) {
    const statusMap = this.getContractStatusMap()
    return statusMap[status] || '未知状态'
  },

  /**
   * 处理订单数据，确保字段完整性
   * @param {Array} orders 订单列表
   * @returns {Array}
   */
  processOrderData(orders) {
    if (!Array.isArray(orders)) {
      return []
    }
    
    return orders.map(order => ({
      // 后端返回的基础字段
      orderId: order.orderId || '',
      projectId: order.projectId || '',
      userId: order.userId || '',
      contractorId: order.contractorId || '',
      type: order.type || OrderType.DESIGN,
      status: order.status || OrderStatus.PENDING,
      expectedEndTime: order.expectedEndTime || '',
      actualEndTime: order.actualEndTime || '',
      totalAmount: order.totalAmount || 0,
      remark: order.remark || '',
      contractUrl: order.contractUrl || '',
      contractStatus: order.contractStatus || ContractStatus.PENDING_SIGN,
      createTime: order.createTime || '',
      updateTime: order.updateTime || '',
      
      // 前端需要的扩展字段
      orderNumber: order.orderNumber || `DD${order.orderId || ''}`,
      projectTitle: order.projectTitle || '设计项目',
      hasRated: order.hasRated || false,
      
      // 状态文本
      statusText: this.getOrderStatusText(order.status),
      typeText: this.getOrderTypeText(order.type),
      contractStatusText: this.getContractStatusText(order.contractStatus)
    }))
  },

  /**
   * 验证订单数据
   * @param {Object} orderData 订单数据
   * @returns {Object} 验证结果
   */
  validateOrderData(orderData) {
    const errors = []
    
    if (!orderData.projectId) {
      errors.push('项目ID不能为空')
    }
    
    if (!orderData.userId) {
      errors.push('用户ID不能为空')
    }
    
    if (!orderData.totalAmount || orderData.totalAmount <= 0) {
      errors.push('订单金额必须大于0')
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    }
  }
}

// 默认导出
export default orderService