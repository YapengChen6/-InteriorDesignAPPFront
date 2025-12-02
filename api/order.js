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
  PENDING_UPLOAD: 0,   // 待上传合同
  PENDING_CONFIRM: 1,  // 合同待确认
  CONFIRMED: 2         // 合同已确认
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
      params: { orderId },
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
      params: {
        orderId: orderId,
        status: status
      },
      loading: true
    })
  },

  /**
   * 改变订单状态为结束
   * @param {Number} orderId 订单ID
   * @returns {Promise}
   */
  endOrder(orderId) {
    console.log('🔧 调用end接口 - orderId:', orderId)
    return request({
      url: `${baseURL}/end`,
      method: 'put',
      params: { orderId: orderId },
      loading: true
    })
  },

  /**
   * 更改合同状态
   * @param {Number} orderId 订单ID
   * @param {Number} contractStatus 合同状态
   * @returns {Promise}
   */
  updateContractStatus(orderId, contractStatus) {
    return request({
      url: `${baseURL}/updateContractStatus`,
      method: 'put',
      params: {
        orderId: orderId,
        contractStatus: contractStatus
      },
      loading: true
    })
  },

  /**
   * 更新合同URL和状态
   * @param {Number} orderId 订单ID
   * @param {String} contractUrl 合同URL
   * @param {Number} contractStatus 合同状态
   * @returns {Promise}
   */
  updateContractUrlAndContractStatus(orderId, contractUrl, contractStatus) {
    return request({
      url: `${baseURL}/updateContractUrlAndContractStatus`,
      method: 'put',
      params: {
        orderId: orderId,
        contractUrl: contractUrl,
        contractStatus: contractStatus
      },
      loading: true
    })
  },

  /**
   * 获取订单详情
   * @param {Number} orderId 订单ID
   * @returns {Promise}
   */
  getDetail(orderId) {
    return request({
      url: `${baseURL}/detail`,
      method: 'get',
      params: { orderId },
      loading: true
    })
  }
}

/**
 * 响应处理工具
 */
const handleResponse = (res, operation = '操作') => {
  if (res.code === 200 || res.success) {
    return res.data || res.result || true
  } else {
    const errorMsg = res.msg || res.message || `${operation}失败`
    console.error(`❌ ${operation}失败:`, errorMsg)
    throw new Error(errorMsg)
  }
}

/**
 * 订单服务
 */
export const orderService = {
  /**
   * 更新合同URL和状态
   * @param {Number} orderId 订单ID
   * @param {String} contractUrl 合同URL
   * @param {Number} contractStatus 合同状态
   * @returns {Promise}
   */
  async updateContractUrlAndContractStatus(orderId, contractUrl, contractStatus) {
    try {
      console.log('📝 更新订单合同URL和状态:', { orderId, contractUrl, contractStatus })
      
      const res = await orderApi.updateContractUrlAndContractStatus(orderId, contractUrl, contractStatus)
      console.log('✅ 更新合同URL和状态响应:', res)
      
      return handleResponse(res, '更新合同URL和状态')
    } catch (error) {
      console.error('❌ 更新合同URL和状态异常:', error)
      throw error
    }
  },

  /**
   * 创建设计订单
   * @param {Object} orderData 订单数据
   * @returns {Promise}
   */
  async createDesignOrder(orderData) {
    try {
      console.log('🎯 开始创建设计订单，输入数据:', orderData)
      
      const validation = this.validateOrderData(orderData)
      if (!validation.isValid) {
        throw new Error(validation.errors.join('; '))
      }
      
      const orderDTO = {
        projectId: orderData.projectId,
        userId: orderData.userId,
        type: orderData.type || OrderType.DESIGN,  // ✅ 修改：使用传入的类型，默认设计订单
        expectedEndTime: orderData.expectedEndTime,
        totalAmount: orderData.totalAmount,
        remark: orderData.remark || '',
        contractorId: orderData.contractorId // 设计师ID
      }
      
      console.log('✅ 构建的订单DTO:', JSON.stringify(orderDTO, null, 2))
      
      const res = await orderApi.save(orderDTO)
      return handleResponse(res, '创建订单')
    } catch (error) {
      console.error('❌ 创建订单异常:', error)
      if (error.errMsg && error.errMsg.includes('request:fail')) {
        throw new Error('网络连接失败，请检查网络设置')
      }
      throw error
    }
  },

  /**
   * 创建监理订单
   * @param {Object} orderData 订单数据
   * @returns {Promise}
   */
  async createSupervisionOrder(orderData) {
    try {
      console.log('🎯 开始创建监理订单，输入数据:', orderData)
      
      const validation = this.validateOrderData(orderData)
      if (!validation.isValid) {
        throw new Error(validation.errors.join('; '))
      }
      
      const orderDTO = {
        projectId: orderData.projectId,
        userId: orderData.userId,
        type: OrderType.SUPERVISION,
        expectedEndTime: orderData.expectedEndTime,
        totalAmount: orderData.totalAmount,
        remark: orderData.remark || '',
        contractorId: orderData.contractorId // 监理ID
      }
      
      console.log('✅ 构建的监理订单DTO:', JSON.stringify(orderDTO, null, 2))
      
      const res = await orderApi.save(orderDTO)
      return handleResponse(res, '创建监理订单')
    } catch (error) {
      console.error('❌ 创建监理订单异常:', error)
      throw error
    }
  },

  /**
   * 统一创建订单方法（推荐使用）
   * @param {Object} orderData 订单数据
   * @returns {Promise}
   */
  async createOrder(orderData) {
    try {
      console.log('🎯 开始创建订单，输入数据:', orderData)
      
      const validation = this.validateOrderData(orderData)
      if (!validation.isValid) {
        throw new Error(validation.errors.join('; '))
      }
      
      // 直接使用传入的订单数据
      const orderDTO = {
        projectId: orderData.projectId,
        userId: orderData.userId,
        type: orderData.type,  // 使用传入的类型
        expectedEndTime: orderData.expectedEndTime,
        totalAmount: orderData.totalAmount,
        remark: orderData.remark || '',
        contractorId: orderData.contractorId
      }
      
      console.log('✅ 构建的订单DTO:', JSON.stringify(orderDTO, null, 2))
      
      const res = await orderApi.save(orderDTO)
      return handleResponse(res, '创建订单')
    } catch (error) {
      console.error('❌ 创建订单异常:', error)
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
      const params = {
        orderId: queryParams.orderId,
        projectId: queryParams.projectId,
        userId: queryParams.userId,
        contractorId: queryParams.contractorId,
        status: queryParams.status,
        type: queryParams.type,
        contractStatus: queryParams.contractStatus,
        expectedEndTime: queryParams.expectedEndTime,
        actualEndTime: queryParams.actualEndTime,
        createTime: queryParams.createTime,
        totalAmount: queryParams.totalAmount,
        remark: queryParams.remark,
        pageNum: queryParams.pageNum || 1,
        pageSize: queryParams.pageSize || 10
      }
      
      // 清理空参数
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] == null || params[key] === undefined) {
          delete params[key]
        }
      })
      
      console.log('🎯 订单查询参数:', params)
      
      const res = await orderApi.getList(params)
      return handleResponse(res, '获取订单列表')
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
   * 根据设计师/监理ID获取订单列表
   * @param {Number} contractorId 承包商ID
   * @param {Object} queryParams 其他查询参数
   * @returns {Promise}
   */
  async getOrderListByContractorId(contractorId, queryParams = {}) {
    try {
      if (!contractorId) {
        throw new Error('承包商ID不能为空')
      }
      
      const params = {
        contractorId: contractorId,
        ...queryParams
      }
      
      return await this.getOrderList(params)
    } catch (error) {
      console.error('❌ 获取承包商订单列表异常:', error)
      throw error
    }
  },

  /**
   * 获取订单详情
   * @param {Number} orderId 订单ID
   * @returns {Promise}
   */
  async getOrderDetail(orderId) {
    try {
      if (!orderId) {
        throw new Error('订单ID不能为空')
      }
      
      console.log('🎯 获取订单详情，订单ID:', orderId)
      
      const res = await orderApi.getDetail(orderId)
      const data = handleResponse(res, '获取订单详情')
      
      // 处理订单数据，确保字段完整性
      return this.processSingleOrderData(data)
    } catch (error) {
      console.error('❌ 获取订单详情异常:', error)
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
                const data = handleResponse(result, '删除订单')
                resolve(data)
              } catch (error) {
                reject(error)
              }
            } else {
              reject(new Error('用户取消删除'))
            }
          }
        })
      })
    } catch (error) {
      console.error('❌ 删除订单异常:', error)
      throw error
    }
  },

  /**
   * 更新订单信息
   * @param {Object} orderData 订单数据
   * @returns {Promise}
   */
  async updateOrder(orderData) {
    try {
      if (!orderData.orderId) {
        throw new Error('订单ID不能为空')
      }
      
      console.log('🎯 更新订单信息:', orderData)
      
      const res = await orderApi.update(orderData)
      return handleResponse(res, '更新订单')
    } catch (error) {
      console.error('❌ 更新订单异常:', error)
      throw error
    }
  },

  /**
   * 更新订单合同状态
   * @param {Number} orderId 订单ID
   * @param {String} contractUrl 合同文件URL
   * @param {Number} contractStatus 合同状态
   * @returns {Promise}
   */
  async updateOrderContract(orderId, contractUrl, contractStatus = ContractStatus.PENDING_CONFIRM) {
    try {
      console.log('📝 更新订单合同状态:', { orderId, contractUrl, contractStatus })
      
      const res = await orderApi.updateContractUrlAndContractStatus(orderId, contractUrl, contractStatus)
      console.log('✅ 更新合同状态响应:', res)
      
      return handleResponse(res, '更新合同状态')
    } catch (error) {
      console.error('❌ 更新合同状态异常:', error)
      throw error
    }
  },

  /**
   * 上传合同文件
   * @param {Number} orderId 订单ID
   * @param {String} contractUrl 合同文件URL
   * @returns {Promise}
   */
  async uploadContract(orderId, contractUrl) {
    return this.updateOrderContract(orderId, contractUrl, ContractStatus.PENDING_CONFIRM)
  },

  /**
   * 确认合同（用户确认合同）
   * @param {Number} orderId 订单ID
   * @returns {Promise}
   */
  async confirmContract(orderId) {
    try {
      console.log('✅ 用户确认合同，订单ID:', orderId)
      
      const res = await orderApi.updateContractStatus(orderId, ContractStatus.CONFIRMED)
      console.log('确认合同响应:', res)
      
      return handleResponse(res, '确认合同')
    } catch (error) {
      console.error('❌ 确认合同异常:', error)
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
      
      return handleResponse(res, '确认订单')
    } catch (error) {
      console.error('❌ 确认订单异常:', error)
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
      
      return handleResponse(res, '取消订单')
    } catch (error) {
      console.error('❌ 取消订单异常:', error)
      throw error
    }
  },

  /**
   * 完成订单 - 使用结束订单接口
   * @param {Number} orderId 订单ID
   * @returns {Promise}
   */
  async completeOrder(orderId) {
    try {
      console.log('完成订单，订单ID:', orderId)
      
      // 使用结束订单接口
      const res = await orderApi.endOrder(orderId)
      console.log('结束订单响应:', res)
      
      return handleResponse(res, '完成订单')
    } catch (error) {
      console.error('❌ 完成订单异常:', error)
      throw error
    }
  },

  /**
   * 退款订单 - 使用状态更新接口
   * @param {Number} orderId 订单ID
   * @returns {Promise}
   */
  async refundOrder(orderId) {
    try {
      console.log('退款订单，订单ID:', orderId)
      
      const res = await orderApi.updateStatus(orderId, OrderStatus.REFUNDED)
      console.log('退款订单响应:', res)
      
      return handleResponse(res, '退款订单')
    } catch (error) {
      console.error('❌ 退款订单异常:', error)
      throw error
    }
  },

  /**
   * 获取订单状态映射
   * @returns {Object}
   */
  getOrderStatusMap() {
    return {
      [OrderStatus.PENDING]: { text: '待确认', color: 'warning' },
      [OrderStatus.PROCESSING]: { text: '进行中', color: 'primary' },
      [OrderStatus.COMPLETED]: { text: '已完成', color: 'success' },
      [OrderStatus.CANCELLED]: { text: '已取消', color: 'error' },
      [OrderStatus.REFUNDED]: { text: '已退款', color: 'info' }
    }
  },

  /**
   * 获取订单类型映射
   * @returns {Object}
   */
  getOrderTypeMap() {
    return {
      [OrderType.DESIGN]: { text: '设计订单', color: 'primary' },
      [OrderType.SUPERVISION]: { text: '监理订单', color: 'success' }
    }
  },

  /**
   * 获取合同状态映射
   * @returns {Object}
   */
  getContractStatusMap() {
    return {
      [ContractStatus.PENDING_UPLOAD]: { text: '待上传', color: 'warning' },
      [ContractStatus.PENDING_CONFIRM]: { text: '待确认', color: 'primary' },
      [ContractStatus.CONFIRMED]: { text: '已确认', color: 'success' }
    }
  },

  /**
   * 获取订单状态文本
   * @param {Number} status 状态码
   * @returns {String}
   */
  getOrderStatusText(status) {
    const statusMap = this.getOrderStatusMap()
    return statusMap[status]?.text || '未知状态'
  },

  /**
   * 获取订单状态颜色
   * @param {Number} status 状态码
   * @returns {String}
   */
  getOrderStatusColor(status) {
    const statusMap = this.getOrderStatusMap()
    return statusMap[status]?.color || 'default'
  },

  /**
   * 获取订单类型文本
   * @param {Number} type 类型码
   * @returns {String}
   */
  getOrderTypeText(type) {
    const typeMap = this.getOrderTypeMap()
    return typeMap[type]?.text || '未知类型'
  },

  /**
   * 获取订单类型颜色
   * @param {Number} type 类型码
   * @returns {String}
   */
  getOrderTypeColor(type) {
    const typeMap = this.getOrderTypeMap()
    return typeMap[type]?.color || 'default'
  },

  /**
   * 获取合同状态文本
   * @param {Number} status 合同状态码
   * @returns {String}
   */
  getContractStatusText(status) {
    const statusMap = this.getContractStatusMap()
    return statusMap[status]?.text || '未知状态'
  },

  /**
   * 获取合同状态颜色
   * @param {Number} status 合同状态码
   * @returns {String}
   */
  getContractStatusColor(status) {
    const statusMap = this.getContractStatusMap()
    return statusMap[status]?.color || 'default'
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
    
    return orders.map(order => this.processSingleOrderData(order))
  },

  /**
   * 处理单个订单数据
   * @param {Object} order 订单数据
   * @returns {Object}
   */
  processSingleOrderData(order) {
    if (!order) return null
    
    return {
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
      contractStatus: order.contractStatus || ContractStatus.PENDING_UPLOAD,
      createTime: order.createTime || '',
      updateTime: order.updateTime || '',
      
      // 扩展字段
      orderNumber: order.orderNumber || `DD${order.orderId || ''}`,
      projectTitle: order.projectTitle || '设计项目',
      userName: order.userName || '',
      contractorName: order.contractorName || '',
      hasRated: order.hasRated || false,
      
      // 状态文本和颜色
      statusText: this.getOrderStatusText(order.status),
      statusColor: this.getOrderStatusColor(order.status),
      typeText: this.getOrderTypeText(order.type),
      typeColor: this.getOrderTypeColor(order.type),
      contractStatusText: this.getContractStatusText(order.contractStatus),
      contractStatusColor: this.getContractStatusColor(order.contractStatus)
    }
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
    
    if (!orderData.expectedEndTime) {
      errors.push('预计完成时间不能为空')
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    }
  },

  /**
   * 检查订单是否可操作
   * @param {Object} order 订单对象
   * @returns {Object} 可操作状态
   */
  checkOrderOperable(order) {
    const status = order.status
    const contractStatus = order.contractStatus
    
    return {
      canConfirm: status === OrderStatus.PENDING,
      canCancel: status === OrderStatus.PENDING || status === OrderStatus.PROCESSING,
      canComplete: status === OrderStatus.PROCESSING,
      canRefund: status === OrderStatus.PROCESSING || status === OrderStatus.COMPLETED,
      canUploadContract: contractStatus === ContractStatus.PENDING_UPLOAD,
      canConfirmContract: contractStatus === ContractStatus.PENDING_CONFIRM,
      canDelete: status === OrderStatus.PENDING || status === OrderStatus.CANCELLED
    }
  }
}

// 默认导出
export default orderService