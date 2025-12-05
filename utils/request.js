import store from '@/store'
import config from '@/config'
import { getToken } from '@/utils/auth'
import errorCode from '@/utils/errorCode'
import { toast, showConfirm, tansParams } from '@/utils/common'

let timeout = 10000
const baseUrl = config.baseUrl

const request = config => {
  // 是否需要设置 token - 检查 headers 或 header
  const isToken = (config.headers || config.header || {}).isToken === false
  config.header = config.header || {}
  
  // 添加调试信息
  const token = getToken()
  console.log('🔧 Request Interceptor - URL:', config.url)
  console.log('🔧 Request Interceptor - Token exists:', !!token)
  console.log('🔧 Request Interceptor - isToken flag:', isToken)
  console.log('🔧 Request Interceptor - Current token:', token ? token.substring(0, 20) + '...' : 'null')
  
  if (token && !isToken) {
    config.header['Authorization'] = 'Bearer ' + token
    console.log('✅ Added Authorization header:', 'Bearer ' + token.substring(0, 20) + '...')
  } else {
    if (!token) {
      console.log('❌ No token found in storage')
    } else {
      console.log('❌ Token skipped due to isToken flag')
    }
  }
  
  // get请求映射params参数
  if (config.params) {
    let url = config.url + '?' + tansParams(config.params)
    url = url.slice(0, -1)
    config.url = url
  }
  
  console.log('🔧 Final request headers:', config.header)
  
  return new Promise((resolve, reject) => {
    // 兼容 baseURL 和 baseUrl 两种写法，优先使用传入的自定义 baseUrl/baseURL
    const requestBaseUrl = config.baseUrl || config.baseURL || baseUrl
    // 如果传入的是完整的 baseURL（包含协议），直接拼接；否则使用默认 baseUrl 拼接
    const finalUrl = (config.baseUrl || config.baseURL) 
      ? (requestBaseUrl + config.url) 
      : (baseUrl + config.url)
    // 小程序环境特殊处理
    const requestConfig = {
        method: config.method || 'get',
        timeout: config.timeout ||  timeout,
        url: finalUrl,
        data: config.data,
        header: config.header,
        dataType: 'json'
    }
    
    // 小程序环境下的调试信息
    // #ifdef MP-WEIXIN
    console.log('🔧 小程序环境 - 请求配置:', {
      url: requestConfig.url,
      method: requestConfig.method,
      headers: requestConfig.header,
      data: requestConfig.data
    })
    // #endif
    
    uni.request(requestConfig).then(response => {
        let [error, res] = response
        if (error) {
          toast('后端接口连接异常')
          reject('后端接口连接异常')
          return
        }
        
        // 添加响应调试
        console.log('📡 Response - URL:', finalUrl, 'Status:', res.statusCode, 'Data:', res.data)
        
        const code = res.data.code || 200
        const msg = errorCode[code] || res.data.msg || errorCode['default']
        const errorMessage = res.data.message || msg
        
        // 检查是否是真正的认证错误还是其他业务错误
        const isRealAuthError = code === 401 && (
          errorMessage.includes('无效的会话') || 
          errorMessage.includes('会话已过期') || 
          errorMessage.includes('请重新登录') ||
          errorMessage.includes('Unauthorized') ||
          errorMessage.includes('认证失败') ||
          errorMessage.includes('token') && !errorMessage.includes('SQL')
        )
        
        // 检查是否是 SQL 错误或其他数据库错误
        const isDatabaseError = errorMessage && (
          errorMessage.includes('SQL') || 
          errorMessage.includes('database') || 
          errorMessage.includes('Column count') ||
          errorMessage.includes('Error updating database')
        )
        
        if (code === 401) {
          if (isDatabaseError) {
            // 这是数据库错误，不是认证错误
            console.log('🔴 Database/SQL Error (wrapped in 401):', errorMessage)
            // 提取真实的错误信息
            let realErrorMsg = errorMessage
            if (errorMessage.includes('Column count')) {
              realErrorMsg = '数据库错误：列数与值数不匹配。请联系技术支持或检查后端 SQL 配置。'
            } else if (errorMessage.includes('SQL')) {
              realErrorMsg = '数据库操作失败：' + errorMessage.split('###')[0].trim()
            }
            reject(new Error(realErrorMsg))
          } else if (isRealAuthError) {
            // 这是真正的认证错误
            console.log('🔴 401 Unauthorized - Token might be invalid')
            console.log('🔴 Response data:', JSON.stringify(res.data))
            console.log('🔴 Request URL:', finalUrl)
            console.log('🔴 Request headers:', config.header)
            showConfirm('登录状态已过期，您可以继续留在该页面，或者重新登录?').then(res => {
              if (res.confirm) {
                store.dispatch('LogOut').then(res => {
                  uni.reLaunch({ url: '/pages/login' })
                })
              }
            })
            reject(new Error('无效的会话，或者会话已过期，请重新登录。'))
          } else {
            // 其他类型的 401 错误，可能是业务逻辑错误
            console.log('🔴 401 Error (non-auth):', errorMessage)
            reject(new Error(errorMessage || '请求失败，请重试'))
          }
        } else if (code === 500) {
          toast(msg)
          reject('500')
        } else if (code !== 200) {
          toast(msg)
          reject(code)
        }
        resolve(res.data)
      })
      .catch(error => {
        console.error('🔴 Request Error:', error)
        let message = '网络请求失败'
        
        if (error && error.message) {
          if (error.message === 'Network Error') {
            message = '后端接口连接异常'
          } else if (error.message.includes('timeout')) {
            message = '系统接口请求超时'
          } else if (error.message.includes('Request failed with status code')) {
            message = '系统接口' + error.message.substr(error.message.length - 3) + '异常'
          } else {
            message = error.message
          }
        } else if (typeof error === 'string') {
          message = error
        }
        
        toast(message)
        reject(new Error(message))
      })
  })
}

export default request