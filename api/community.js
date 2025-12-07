import request from '@/utils/request'

/**
 * 社区帖子相关接口
 * 对应后端：CommunityPostController
 */

/**
 * 获取社区帖子列表（分页/筛选）
 * @param {Object} queryParams - 查询参数
 * @param {string} queryParams.keyword - 搜索关键词
 * @param {number} queryParams.userId - 用户ID
 * @param {number} queryParams.threadType - 帖子类型
 * @param {number} queryParams.categoryId - 分类ID
 * @param {number} queryParams.pageNum - 页码
 * @param {number} queryParams.pageSize - 每页大小
 */
export function getPostList(queryParams) {
  return request({
    url: '/api/community/posts',
    method: 'get',
    params: queryParams
  })
}

/**
 * 获取帖子详情（含评论与媒体URL）
 * @param {number} id - 帖子ID
 */
export function getPostDetail(id) {
  return request({
    url: `/api/community/posts/${id}`,
    method: 'get'
  })
}

/**
 * 发布帖子
 * @param {Object} postData - 帖子数据
 * @param {string} postData.title - 标题（必填）
 * @param {string} postData.content - 内容（必填）
 * @param {number} postData.roleType - 角色类型
 * @param {number} postData.threadType - 帖子类型
 * @param {number} postData.categoryId - 分类ID
 * @param {Object} postData.normalPost - 普通帖子模板字段
 * @param {Object} postData.portfolio - 作品集模板字段
 * @param {Object} postData.caseStudy - 案例研究模板字段
 * @param {Object} postData.materialShow - 材料展示模板字段
 */
export function createPost(postData) {
  return request({
    url: '/api/community/posts',
    method: 'post',
    data: postData
  })
}

/**
 * 修改帖子（作者）
 * @param {number} id - 帖子ID
 * @param {Object} updateData - 更新数据
 * @param {string} updateData.title - 标题（必填）
 * @param {string} updateData.content - 内容（必填）
 * @param {number} updateData.threadType - 帖子类型
 * @param {number} updateData.categoryId - 分类ID
 * @param {Object} updateData.normalPost - 普通帖子模板字段
 * @param {Object} updateData.portfolio - 作品集模板字段
 * @param {Object} updateData.caseStudy - 案例研究模板字段
 * @param {Object} updateData.materialShow - 材料展示模板字段
 */
export function updatePost(id, updateData) {
  return request({
    url: `/api/community/posts/${id}`,
    method: 'put',
    data: updateData
  })
}

/**
 * 删除帖子（作者/管理员），级联逻辑删除媒体
 * @param {number} id - 帖子ID
 */
export function deletePost(id) {
  return request({
    url: `/api/community/posts/${id}`,
    method: 'delete'
  })
}

/**
 * 获取帖子分类列表
 */
export function getCategories() {
  return request({
    url: '/api/community/categories',
    method: 'get'
  })
}

/**
 * 获取帖子类型列表
 */
export function getThreadTypes() {
  return request({
    url: '/api/community/thread-types',
    method: 'get'
  })
}
/* 预览帖子 */
export function getImagesPreview(fileUrl) {
  return request({
    url: '/api/media/preview',
    method: 'get',
    params: { fileUrl } // 或者可能是 query 参数，使用 params
  })
}

/**
 * 点赞帖子
 * @param {number} postId - 帖子ID
 */
export function likePost(postId) {
  return request({
    url: `/api/community/posts/${postId}/like`,
    method: 'post'
  })
}

/**
 * 取消点赞
 * @param {number} postId - 帖子ID
 */
export function unlikePost(postId) {
  return request({
    url: `/api/community/posts/${postId}/like`,
    method: 'delete'
  })
}

/**
 * 获取当前用户点赞的帖子列表（分页）
 * 对应后端：GET /api/community/posts/liked/me
 * @param {Object} params - 查询参数
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页大小
 */
export function getUserLikedPosts(params) {
  return request({
    url: '/api/community/posts/liked/me',
    method: 'get',
    params: params
  })
}

/**
 * 获取帖子评论列表（分页）
 * @param {number} postId - 帖子ID
 * @param {Object} params - 查询参数
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页大小
 */
export function getPostComments(postId, params = {}) {
  // 构建请求参数，包含分页参数和可能的其他参数（如时间戳）
  const requestParams = {
    pageNum: params.pageNum || 1,
    pageSize: params.pageSize || 20
  }
  
  // 如果传入了其他参数（如 _t 时间戳），也一并传递
  Object.keys(params).forEach(key => {
    if (key !== 'pageNum' && key !== 'pageSize') {
      requestParams[key] = params[key]
    }
  })
  
  return request({
    url: `/api/community/posts/${postId}/comments`,
    method: 'get',
    params: requestParams
  })
}

/**
 * 提交评论
 * @param {number} postId - 帖子ID
 * @param {Object} commentData - 评论数据
 * @param {string} commentData.content - 评论内容（必填）
 * @param {number} commentData.parentId - 父评论ID（可选，用于回复）
 */
export function submitComment(postId, commentData) {
  return request({
    url: `/api/community/posts/${postId}/comments`,
    method: 'post',
    data: commentData
  })
}

/**
 * 删除评论
 * @param {number} postId - 帖子ID
 * @param {number} commentId - 评论ID
 */
export function deleteComment(postId, commentId) {
  return request({
    url: `/api/community/posts/${postId}/comments/${commentId}`,
    method: 'delete'
  })
}

/**
 * 点赞评论
 * @param {number} postId - 帖子ID
 * @param {number} commentId - 评论ID
 */
export function likeComment(postId, commentId) {
  return request({
    url: `/api/community/posts/${postId}/comments/${commentId}/like`,
    method: 'post'
  })
}

/**
 * 取消点赞评论
 * @param {number} postId - 帖子ID
 * @param {number} commentId - 评论ID
 */
export function unlikeComment(postId, commentId) {
  return request({
    url: `/api/community/posts/${postId}/comments/${commentId}/like`,
    method: 'delete'
  })
}

export default {
  getPostList,
  getPostDetail,
  createPost,
  updatePost,
  deletePost,
  getCategories,
  getThreadTypes,
  getImagesPreview,
  likePost,
  unlikePost,
  getUserLikedPosts,
  getPostComments,
  submitComment,
  deleteComment,
  likeComment,
  unlikeComment
}