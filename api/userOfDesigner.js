import request from '@/utils/request'

/**
 * 搜索设计师
 */
export function searchDesigners(keyword) {
  return request({
    url: '/api/userOfDesigner/search',
    method: 'get',
    params: { 
      keyword: keyword
    }
  })
}

/**
 * 获取设计师列表
 */
export function getDesignerList(search) {
  return request({
    url: '/api/userOfDesigner/list',
    method: 'get',
    params: { 
      search: search || ''
    }
  })
}

/**
 * 获取设计师详情
 */
export function getDesignerDetail(userId) {
  return request({
    url: `/api/userOfDesigner/detail/${userId}`,
    method: 'get'
  })
}

/**
 * 批量获取设计师评分信息
 */
export function getDesignersRatingInfo(userIds) {
  return request({
    url: '/api/userOfDesigner/ratings',
    method: 'post',
    data: userIds
  })
}

/**
 * 批量获取设计师在线状态
 */
export function getDesignersOnlineStatus(userIds) {
  return request({
    url: '/api/userOfDesigner/onlineStatus',
    method: 'post',
    data: userIds
  })
}