import request from '@/utils/request'

/**
 * 设计方案相关接口
 * 对应后端：DesignSchemeController
 */

/**
 * 保存空方案
 * @returns {Promise} 包含方案ID的结果
 */
export function saveNullScheme() {
  return request({
    url: '/designScheme/saveNull',
    method: 'post'
  })
}

/**
 * 新增设计方案
 * @param {Object} designSchemeDTO - 设计方案数据
 * @param {string} designSchemeDTO.schemeName - 方案名称
 * @param {string} designSchemeDTO.schemeCode - 方案编码
 * @param {number} designSchemeDTO.designStyle - 设计风格
 * @param {number} designSchemeDTO.houseType - 户型类型
 * @param {number} designSchemeDTO.budgetRange - 预算范围
 * @param {string} designSchemeDTO.description - 方案描述
 * @param {Array} designSchemeDTO.spaceList - 空间列表
 * @param {Array} designSchemeDTO.materialList - 材料列表
 * @param {Array} designSchemeDTO.imageList - 图片列表
 */
export function createDesignScheme(designSchemeDTO) {
  return request({
    url: '/designScheme',
    method: 'post',
    data: designSchemeDTO
  })
}

/**
 * 查询设计方案列表（分页/筛选）
 * @param {Object} queryParams - 查询参数
 * @param {string} queryParams.schemeName - 方案名称
 * @param {string} queryParams.schemeCode - 方案编码
 * @param {number} queryParams.designStyle - 设计风格
 * @param {number} queryParams.houseType - 户型类型
 * @param {number} queryParams.budgetRange - 预算范围
 * @param {number} queryParams.status - 方案状态
 * @param {number} queryParams.createBy - 创建人
 * @param {string} queryParams.beginTime - 开始时间
 * @param {string} queryParams.endTime - 结束时间
 * @param {number} queryParams.pageNum - 页码
 * @param {number} queryParams.pageSize - 每页大小
 */
export function getDesignSchemeList(queryParams) {
  return request({
    url: '/designScheme/list',
    method: 'get',
    params: queryParams
  })
}

/**
 * 删除设计方案
 * @param {number} designSchemeId - 设计方案ID
 */
export function deleteDesignScheme(designSchemeId) {
  return request({
    url: '/designScheme',
    method: 'delete',
    params: { designSchemeId }
  })
}

/**
 * 修改设计方案
 * @param {Object} designSchemeDTO - 设计方案数据
 * @param {number} designSchemeDTO.designSchemeId - 方案ID（必填）
 * @param {string} designSchemeDTO.schemeName - 方案名称
 * @param {string} designSchemeDTO.schemeCode - 方案编码
 * @param {number} designSchemeDTO.designStyle - 设计风格
 * @param {number} designSchemeDTO.houseType - 户型类型
 * @param {number} designSchemeDTO.budgetRange - 预算范围
 * @param {string} designSchemeDTO.description - 方案描述
 * @param {Array} designSchemeDTO.spaceList - 空间列表
 * @param {Array} designSchemeDTO.materialList - 材料列表
 * @param {Array} designSchemeDTO.imageList - 图片列表
 */
export function updateDesignScheme(designSchemeDTO) {
  return request({
    url: '/designScheme',
    method: 'put',
    data: designSchemeDTO
  })
}

/**
 * 改变设计方案状态
 * @param {number} designSchemeId - 设计方案ID
 * @param {number} status - 状态码
 * @param {string} description - 状态描述（可选）
 */
export function updateDesignSchemeStatus(designSchemeId, status, description) {
  return request({
    url: '/designScheme/updateStatus',
    method: 'put',
    params: {
      designSchemeId,
      status,
      description
    }
  })
}

/**
 * 获取设计方案详情
 * @param {number} id - 设计方案ID
 */
export function getDesignSchemeDetail(id) {
  return request({
    url: `/designScheme/${id}`,
    method: 'get'
  })
}

/**
 * 复制设计方案
 * @param {number} designSchemeId - 原设计方案ID
 * @param {string} newSchemeName - 新方案名称
 */
export function copyDesignScheme(designSchemeId, newSchemeName) {
  return request({
    url: '/designScheme/copy',
    method: 'post',
    data: {
      designSchemeId,
      newSchemeName
    }
  })
}

/**
 * 导出设计方案
 * @param {number} designSchemeId - 设计方案ID
 * @param {string} exportType - 导出类型（pdf/image/word）
 */
export function exportDesignScheme(designSchemeId, exportType) {
  return request({
    url: '/designScheme/export',
    method: 'post',
    params: {
      designSchemeId,
      exportType
    },
    responseType: 'blob'
  })
}

export default {
  saveNullScheme,
  createDesignScheme,
  getDesignSchemeList,
  deleteDesignScheme,
  updateDesignScheme,
  updateDesignSchemeStatus,
  getDesignSchemeDetail,
  copyDesignScheme,
  exportDesignScheme
}