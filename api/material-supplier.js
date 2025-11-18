import request from '@/utils/request'

/**
 * @template T
 * @typedef {Object} ApiResult
 * @property {number} code
 * @property {string} msg
 * @property {T} data
 */

/**
 * @typedef {Object} SupplierStatus
 * @property {boolean} hasApplication 是否已提交过申请
 * @property {string} [status] 认证状态：1=认证中,2=已通过,3=已拒绝
 * @property {string} [statusText] 认证状态文案
 * @property {string} [createTime] 创建时间
 * @property {string} [updateTime] 更新时间
 */

/**
 * @typedef {Object} PageResultSupplierVO
 * @property {Array<Object>} rows MaterialSupplierVO[]
 * @property {number} total
 * @property {number} pageNum
 * @property {number} pageSize
 */

/**
 * 提交材料商入驻申请
 * @param {Object} applicationDTO 入驻申请表单
 * @returns {Promise<ApiResult<string>>}
 */
export function submitMaterialSupplierApplication(applicationDTO) {
  return request({
    url: '/api/material-supplier/application',
    method: 'post',
    data: applicationDTO
  })
}

/**
 * 查询申请状态
 * @returns {Promise<ApiResult<SupplierStatus>>}
 */
export function getMaterialSupplierApplicationStatus() {
  return request({
    url: '/api/material-supplier/status',
    method: 'get'
  })
}

/**
 * 获取当前用户的申请详情
 * @returns {Promise<ApiResult<Object>>} data 为 MaterialSupplier 实体
 */
export function getMaterialSupplierApplicationDetail() {
  return request({
    url: '/api/material-supplier/detail',
    method: 'get'
  })
}

/**
 * 更新申请信息
 * @param {Object} applicationDTO 入驻申请表单
 * @returns {Promise<ApiResult<string>>}
 */
export function updateMaterialSupplierApplication(applicationDTO) {
  return request({
    url: '/api/material-supplier/application',
    method: 'put',
    data: applicationDTO
  })
}

/**
 * 管理员查询申请列表（分页）
 * @param {Object} queryDTO 分页与筛选参数
 * @param {number} [queryDTO.pageNum]
 * @param {number} [queryDTO.pageSize]
 * @returns {Promise<ApiResult<PageResultSupplierVO>>}
 */
export function listMaterialSupplierApplications(queryDTO) {
  return request({
    url: '/api/material-supplier/admin/list',
    method: 'get',
    params: queryDTO
  })
}

/**
 * 管理员审核申请
 * @param {Object} reviewDTO 审核参数
 * @returns {Promise<ApiResult<string>>}
 */
export function reviewMaterialSupplierApplication(reviewDTO) {
  return request({
    url: '/api/material-supplier/admin/review',
    method: 'post',
    data: reviewDTO
  })
}

/**
 * 管理员获取申请详情
 * @param {number} materialSuppliersId 申请ID
 * @returns {Promise<ApiResult<Object>>} data 为 MaterialSupplierVO
 */
export function getMaterialSupplierApplicationDetailForAdmin(materialSuppliersId) {
  return request({
    url: `/api/material-supplier/admin/detail/${materialSuppliersId}`,
    method: 'get'
  })
}

