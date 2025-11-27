import request from '@/utils/request'

/**
 * @template T
 * @typedef {Object} ApiResult
 * @property {number} code
 * @property {string} msg
 * @property {T} data
 */

/**
 * @typedef {Object} DesignerStatus
 * @property {boolean} hasApplication 是否已提交过申请
 * @property {string} [status] 认证状态：1=认证中,2=已通过,3=已拒绝
 * @property {string} [statusText] 认证状态文案
 * @property {string} [createTime] 创建时间
 * @property {string} [updateTime] 更新时间
 */

/**
 * @typedef {Object} PageResultDesignerVO
 * @property {Array<Object>} rows DesignerVO 列表
 * @property {number} total 总条数
 * @property {number} pageNum 当前页码
 * @property {number} pageSize 每页大小
 */

/**
 * 提交设计师入驻申请
 * @param {Object} applicationDTO 入驻申请表单
 * @returns {Promise<ApiResult<string>>}
 */
export function submitDesignerApplication(applicationDTO) {
  return request({
    url: '/api/designer/application',
    method: 'post',
    data: applicationDTO
  })
}

/**
 * 查询申请状态
 * @returns {Promise<ApiResult<DesignerStatus>>}
 */
export function getDesignerApplicationStatus() {
  return request({
    url: '/api/designer/status',
    method: 'get'
  })
}

/**
 * 获取当前用户的申请详情
 * @returns {Promise<ApiResult<Object>>} data 为 Designer 实体
 */
export function getDesignerApplicationDetail() {
  return request({
    url: '/api/designer/detail',
    method: 'get'
  })
}

/**
 * 更新申请信息
 * @param {Object} applicationDTO 入驻申请表单
 * @returns {Promise<ApiResult<string>>}
 */
export function updateDesignerApplication(applicationDTO) {
  return request({
    url: '/api/designer/application',
    method: 'put',
    data: applicationDTO
  })
}

/**
 * 管理员查询申请列表（分页）
 * @param {Object} queryDTO 分页与筛选参数
 * @param {number} [queryDTO.pageNum]
 * @param {number} [queryDTO.pageSize]
 * @returns {Promise<ApiResult<PageResultDesignerVO>>}
 */
export function listDesignerApplications(queryDTO) {
  return request({
    url: '/api/designer/admin/list',
    method: 'get',
    params: queryDTO
  })
}

/**
 * 管理员审核申请
 * @param {Object} reviewDTO 审核参数
 * @returns {Promise<ApiResult<string>>}
 */
export function reviewDesignerApplication(reviewDTO) {
  return request({
    url: '/api/designer/admin/review',
    method: 'post',
    data: reviewDTO
  })
}

/**
 * 管理员获取申请详情
 * @param {number} designersId 申请ID
 * @returns {Promise<ApiResult<Object>>} data 为 DesignerVO
 */
export function getDesignerApplicationDetailForAdmin(designersId) {
  return request({
    url: `/api/designer/admin/detail/${designersId}`,
    method: 'get'
  })
}

// 获取设计师列表
export function getDesignerList(params) {
  return request({
    url: '/api/designer/list',
    method: 'get',
    params
  })
}
// 根据ID获取设计师详情
export function getDesignerDetail(designerId) {
  return request({
    url: `/api/designer/${designerId}`,
    method: 'get'
  })
}

// 搜索设计师
export function searchDesigners(keyword) {
  return request({
    url: '/api/designer/search',
    method: 'get',
    params: { keyword }
  })
}
// 联系设计师
export function contactDesigner(designerId, message) {
  return request({
    url: `/api/designer/${designerId}/contact`,
    method: 'post',
    data: { message }
  })
}