// api/like.js
import request from '@/utils/request'

// 点赞/取消点赞用户
export function toggleUserLike(userId) {
  return request({
    url: `/api/v2/like/user`,
    method: 'POST',
    params: { userId }
  })
}

// 检查是否已点赞
export function checkLikeStatus(userId) {
  return request({
    url: `/api/v2/like/user/status`,
    method: 'GET',
    params: { userId }
  })
}

// 获取用户点赞总数
export function getUserLikeCount(userId) {
  return request({
    url: `/api/v2/like/user/count`,
    method: 'GET',
    params: { userId }
  })
}