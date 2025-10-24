import { userInfo } from 'os'
import request from '@/utils/request'

// 手机号登录
export function login(loginForm) {
  return request({
    url: '/api/auth/login',
    headers: {
      isToken: false
    },
    method: 'post',
    data: loginForm
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

// 获取用户信息
export function getUserInfo() {
  return request({
    url: '/api/users/profile',
    method: 'get'
  })
}
// 更改用户信息
export function updateUserInfo() {
  return request({
    url: '/api/users/profile',
    method: 'put',
	  data: data
  })
}
// 获取用户路由
export function getRouters() {
  return request({
    url: '/api/users/routers',
    method: 'get'
  })
}

// 退出登录 - 修改后的版本
export function logout() {
  return request({
    url: '/api/auth/logout',  // 修正路径
    method: 'post'
    // 移除 token 参数，让拦截器自动添加 Authorization header
  })
}

// 注册
export function register(registryForm) {
  return request({
    url: '/api/auth/register',
    headers: {
      isToken: false
    },
    method: 'post',
    data: registryForm
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

