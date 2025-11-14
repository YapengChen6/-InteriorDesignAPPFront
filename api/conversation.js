/**
 * 对话 API 模块
 * 
 * 提供对话相关的 REST API 调用
 * 用于获取对话列表、创建对话、获取对话详情等
 */

import request from '@/utils/request'

/**
 * 获取对话列表
 * 获取当前用户的所有对话
 * 
 * @returns {Promise} 对话列表
 * @example
 * const res = await getConversationList()
 * // res.data = [
 * //   {
 * //     conversationId: 1,
 * //     conversationType: 1,
 * //     userId1: 1,
 * //     userId2: 2,
 * //     otherUserId: 2,
 * //     otherUserName: '张设计师',
 * //     otherUserAvatar: 'http://...',
 * //     otherUserRole: 2,
 * //     lastMessage: '你好',
 * //     lastMessageTime: '2025-11-12 10:20:00',
 * //     unreadCount: 0,
 * //     createTime: '2025-11-12 10:00:00'
 * //   }
 * // ]
 */
export function getConversationList() {
  return request({
    url: '/api/conversation/list',
    method: 'get'
  })
}

/**
 * 创建或获取对话
 * 如果对话已存在则返回现有对话，否则创建新对话
 * 
 * @param {number} userId2 - 对方用户 ID
 * @returns {Promise} 对话信息
 * @example
 * const res = await createOrGetConversation(2)
 * // res.data = {
 * //   conversationId: 1,
 * //   conversationType: 1,
 * //   userId1: 1,
 * //   userId2: 2,
 * //   createTime: '2025-11-12 10:00:00',
 * //   updateTime: '2025-11-12 10:00:00'
 * // }
 */
export function createOrGetConversation(userId2) {
  return request({
    url: '/api/conversation/create',
    method: 'post',
    params: {
      userId2: userId2
    }
  })
}

/**
 * 获取对话详情
 * 获取指定对话的详细信息
 * 
 * @param {number} conversationId - 对话 ID
 * @returns {Promise} 对话详情
 * @example
 * const res = await getConversationDetail(1)
 * // res.data = {
 * //   conversationId: 1,
 * //   conversationType: 1,
 * //   userId1: 1,
 * //   userId2: 2,
 * //   lastMessageId: 100,
 * //   lastMessageTime: '2025-11-12 10:20:00',
 * //   createTime: '2025-11-12 10:00:00',
 * //   updateTime: '2025-11-12 10:20:00'
 * // }
 */
export function getConversationDetail(conversationId) {
  return request({
    url: `/api/conversation/${conversationId}`,
    method: 'get'
  })
}

/**
 * 获取用户信息
 * 根据用户 ID 获取用户的基本信息（用于显示对话中的用户信息）
 * 
 * @param {number} userId - 用户 ID
 * @returns {Promise} 用户信息
 * @example
 * const res = await getUserInfo(2)
 * // res.data = {
 * //   userId: 2,
 * //   nickName: '张设计师',
 * //   avatar: 'http://...',
 * //   phonenumber: '13800138000',
 * //   userRole: 2
 * // }
 */
export function getUserInfo(userId) {
  return request({
    url: `/api/users/${userId}`,
    method: 'get'
  })
}

/**
 * 获取多个用户信息
 * 批量获取用户信息
 * 
 * @param {array} userIds - 用户 ID 数组
 * @returns {Promise} 用户信息数组
 * @example
 * const res = await getUserInfoBatch([1, 2, 3])
 * // res.data = [
 * //   { userId: 1, nickName: '用户1', avatar: '...', userRole: 1 },
 * //   { userId: 2, nickName: '张设计师', avatar: '...', userRole: 2 },
 * //   { userId: 3, nickName: '李监理', avatar: '...', userRole: 3 }
 * // ]
 */
export function getUserInfoBatch(userIds) {
  return request({
    url: '/api/users/batch',
    method: 'post',
    data: {
      userIds: userIds
    }
  })
}

/**
 * 获取当前用户信息
 * 获取已登录用户的信息
 * 
 * @returns {Promise} 当前用户信息
 * @example
 * const res = await getCurrentUserInfo()
 * // res.data = {
 * //   userId: 1,
 * //   nickName: '当前用户',
 * //   avatar: 'http://...',
 * //   phonenumber: '13800138001',
 * //   userRole: 1
 * // }
 */
export function getCurrentUserInfo() {
  return request({
    url: '/api/users/profile',
    method: 'get'
  })
}

/**
 * 搜索用户
 * 根据昵称或手机号搜索用户
 * 
 * @param {string} keyword - 搜索关键词
 * @returns {Promise} 搜索结果
 * @example
 * const res = await searchUsers('张')
 * // res.data = [
 * //   { userId: 2, nickName: '张设计师', avatar: '...', userRole: 2 },
 * //   { userId: 3, nickName: '张监理', avatar: '...', userRole: 3 }
 * // ]
 */
export function searchUsers(keyword) {
  return request({
    url: '/api/users/search',
    method: 'get',
    params: {
      keyword: keyword
    }
  })
}

/**
 * 获取设计师列表
 * 获取所有设计师用户
 * 
 * @param {number} pageNum - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise} 设计师列表
 */
export function getDesignerList(pageNum = 1, pageSize = 10) {
  return request({
    url: '/api/designer/list',
    method: 'get',
    params: {
      pageNum,
      pageSize
    }
  })
}

/**
 * 获取监理列表
 * 获取所有监理用户
 * 
 * @param {number} pageNum - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise} 监理列表
 */
export function getSupervisorList(pageNum = 1, pageSize = 10) {
  return request({
    url: '/api/supervisor/list',
    method: 'get',
    params: {
      pageNum,
      pageSize
    }
  })
}

// ==================== 默认导出 ====================

export default {
  // 对话相关
  getConversationList,
  createOrGetConversation,
  getConversationDetail,
  
  // 用户相关
  getUserInfo,
  getUserInfoBatch,
  getCurrentUserInfo,
  searchUsers,
  
  // 特殊用户列表
  getDesignerList,
  getSupervisorList
}

