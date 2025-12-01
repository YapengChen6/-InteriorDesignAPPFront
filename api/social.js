import request from '@/utils/request'

/**
 * 社交功能相关接口
 * 对应后端：UserSocialController
 */

/**
 * 收藏帖子
 * @param {Object} data - 收藏数据
 * @param {number} data.postId - 帖子ID（必填）
 * @param {number} data.folderId - 收藏夹ID（可选）
 */
export function addFavorite(data) {
  return request({
    url: '/api/social/favorites',
    method: 'post',
    data: data
  })
}

/**
 * 取消收藏帖子
 * @param {number} postId - 帖子ID
 */
export function removeFavorite(postId) {
  return request({
    url: `/api/social/favorites/${postId}`,
    method: 'delete'
  })
}

/**
 * 查询当前用户的收藏列表
 * @param {Object} params - 查询参数
 * @param {number} params.folderId - 收藏夹ID（可选）
 * @param {number} params.postId - 帖子ID（可选）
 */
export function getFavorites(params) {
  return request({
    url: '/api/social/favorites',
    method: 'get',
    params: params
  })
}

/**
 * 创建收藏夹
 * @param {Object} data - 收藏夹数据
 * @param {string} data.folderName - 收藏夹名称（必填）
 * @param {string} data.remark - 备注（可选）
 */
export function createFavoriteFolder(data) {
  return request({
    url: '/api/social/favorite-folders',
    method: 'post',
    data: data
  })
}

/**
 * 获取当前用户的收藏夹列表
 */
export function getFavoriteFolders() {
  return request({
    url: '/api/social/favorite-folders',
    method: 'get'
  })
}

/**
 * 获取指定收藏夹下的收藏
 * @param {number} folderId - 收藏夹ID
 */
export function getFavoritesByFolder(folderId) {
  return request({
    url: `/api/social/favorite-folders/${folderId}/favorites`,
    method: 'get'
  })
}

/**
 * 删除收藏夹
 * @param {number} folderId - 收藏夹ID
 */
export function deleteFavoriteFolder(folderId) {
  return request({
    url: `/api/social/favorite-folders/${folderId}`,
    method: 'delete'
  })
}

/**
 * 关注用户
 * @param {Object} data - 关注数据
 * @param {number} data.targetUserId - 目标用户ID（必填）
 */
export function followUser(data) {
  return request({
    url: '/api/social/follows',
    method: 'post',
    data: data
  })
}

/**
 * 取消关注用户
 * @param {number} targetUserId - 目标用户ID
 */
export function unfollowUser(targetUserId) {
  return request({
    url: `/api/social/follows/${targetUserId}`,
    method: 'delete'
  })
}

/**
 * 查询当前用户关注的人
 * @param {Object} params - 查询参数（分页）
 */
export function getFollowings(params) {
  return request({
    url: '/api/social/follows',
    method: 'get',
    params: params
  })
}

/**
 * 查询当前用户的粉丝
 * @param {Object} params - 查询参数（分页）
 */
export function getFans(params) {
  return request({
    url: '/api/social/follows/fans',
    method: 'get',
    params: params
  })
}

/**
 * 检查是否已关注某用户
 * @param {number} targetUserId - 目标用户ID
 */
export function checkFollow(targetUserId) {
  return request({
    url: '/api/social/follows/check',
    method: 'get',
    params: { targetUserId }
  })
}

/**
 * 获取用户点赞的帖子列表
 * 注意：如果后端在社交模块实现此接口，使用此函数
 * @param {Object} params - 查询参数
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页大小
 */
export function getUserLikedPosts(params) {
  return request({
    url: '/api/social/posts/liked',
    method: 'get',
    params: params
  })
}

export default {
  addFavorite,
  removeFavorite,
  getFavorites,
  createFavoriteFolder,
  getFavoriteFolders,
  getFavoritesByFolder,
  deleteFavoriteFolder,
  followUser,
  unfollowUser,
  getFollowings,
  getFans,
  checkFollow,
  getUserLikedPosts
}

