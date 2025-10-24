
import request from '@/utils/request'


// 查询用户个人信息
export function getUserProfile() {
  return request({
    url: '/api/users/profile',
    method: 'get'
  })
}

// 修改用户个人信息
export function updateUserProfile(data) {
  return request({
    url: '/api/users/profile',
    method: 'put',
    data: data
  })
}

// 用户头像上传
export function uploadAvatar(data) {
  return upload({
    url: '/api/users/profile',
    name: data.name,
    filePath: data.filePath
  })
}
// 登出
export function logout() {
  return request({
    url: '/api/users/logout',  // 修正路径
    method: 'post'
    // 移除 token 参数，让拦截器自动添加 Authorization header
  })
}

// 发送短信验证码
export function sendCode(phoneNumber) {
  return request({
    url: '/api/auth/code',
    headers: {
      isToken: false
    },
    method: 'get',
    params: {
      phone: phoneNumber
    }
  })
}

// 获取图形验证码
export function getCodeImg() {
  return request({
    url: '/captchaImage',
    headers: {
      isToken: false
    },
    method: 'get',
    timeout: 20000
  })
}