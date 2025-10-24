/* import store from '@/store'
import config from '@/config'
import { getToken } from '@/utils/auth'
import errorCode from '@/utils/errorCode'
import { toast, showConfirm, tansParams } from '@/utils/common'

let timeout = 10000
const baseUrl = config.baseUrl

const request = config => {
  // 是否需要设置 token
  const isToken = (config.headers || {}).isToken === false
  config.header = config.header || {}
  
  // 添加调试信息
  const token = getToken()
  console.log('🔧 Request Interceptor - URL:', config.url)
  console.log('🔧 Request Interceptor - Token exists:', !!token)
  console.log('🔧 Request Interceptor - isToken flag:', isToken)
  console.log('🔧 Request Interceptor - Current token:', token)
  
  if (token && !isToken) {
    config.header['Authorization'] = 'Bearer ' + token
    console.log('✅ Added Authorization header:', config.header['Authorization'])
  } else {
    console.log('❌ No token added to header')
  }
  
  // get请求映射params参数
  if (config.params) {
    let url = config.url + '?' + tansParams(config.params)
    url = url.slice(0, -1)
    config.url = url
  }
  
  console.log('🔧 Final request headers:', config.header)
  
  return new Promise((resolve, reject) => {
    uni.request({
        method: config.method || 'get',
        timeout: config.timeout ||  timeout,
        url: config.baseUrl || baseUrl + config.url,
        data: config.data,
        header: config.header,
        dataType: 'json'
      }).then(response => {
        let [error, res] = response
        if (error) {
          toast('后端接口连接异常')
          reject('后端接口连接异常')
          return
        }
        
        // 添加响应调试
        console.log('📡 Response - URL:', config.url, 'Status:', res.statusCode, 'Data:', res.data)
        
        const code = res.data.code || 200
        const msg = errorCode[code] || res.data.msg || errorCode['default']
        
        if (code === 401) {
          console.log('🔴 401 Unauthorized - Token might be invalid')
          showConfirm('登录状态已过期，您可以继续留在该页面，或者重新登录?').then(res => {
            if (res.confirm) {
              store.dispatch('LogOut').then(res => {
                uni.reLaunch({ url: '/pages/login' })
              })
            }
          })
          reject('无效的会话，或者会话已过期，请重新登录。')
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
        let { message } = error
        if (message === 'Network Error') {
          message = '后端接口连接异常'
        } else if (message.includes('timeout')) {
          message = '系统接口请求超时'
        } else if (message.includes('Request failed with status code')) {
          message = '系统接口' + message.substr(message.length - 3) + '异常'
        }
        toast(message)
        reject(error)
      })
  })
}

export default request */


import store from '@/store'
import config from '@/config'
import { getToken } from '@/utils/auth'
import errorCode from '@/utils/errorCode'
import { toast, showConfirm, tansParams } from '@/utils/common'

let timeout = 10000
const baseUrl = config.baseUrl

const request = config => {
  // 统一处理header，如果传了headers，则合并到header中（注意：headers和header可能同时存在，我们以header为准，同时将headers的内容合并过来）
  // 但通常我们只使用config.header，所以这里建议不要使用config.headers，而是使用config.header
  // 为了兼容，我们可以将config.headers合并到config.header中
  if (config.headers) {
    // 如果config.headers存在，将其合并到config.header中
    config.header = {
      ...config.headers,
      ...config.header
    }
    // 删除config.headers，避免后续使用混淆
    delete config.headers
  }

  // 是否需要设置 token
  // 现在从config中直接读取isToken，注意：如果isToken设置为false，则不添加token
  const isToken = config.isToken === false   // 如果设置isToken为false，则表示不需要token
  config.header = config.header || {}
  
  // 添加调试信息
  const token = getToken()
  console.log('🔧 Request Interceptor - URL:', config.url)
  console.log('🔧 Request Interceptor - Token exists:', !!token)
  console.log('🔧 Request Interceptor - isToken flag:', isToken)
  console.log('🔧 Request Interceptor - Current token:', token)
  
  if (token && !isToken) {
    config.header['Authorization'] = 'Bearer ' + token
    console.log('✅ Added Authorization header:', config.header['Authorization'])
  } else {
    console.log('❌ No token added to header')
  }
  
  // get请求映射params参数
  if (config.params) {
    let url = config.url + '?' + tansParams(config.params)
    url = url.slice(0, -1)
    config.url = url
  }
  
  console.log('🔧 Final request headers:', config.header)
  
  return new Promise((resolve, reject) => {
    uni.request({
        method: config.method || 'get',
        timeout: config.timeout ||  timeout,
        url: config.baseUrl || baseUrl + config.url,
        data: config.data,
        header: config.header,
        dataType: 'json'
      }).then(response => {
        let [error, res] = response
        if (error) {
          toast('后端接口连接异常')
          reject('后端接口连接异常')
          return
        }
        
        // 添加响应调试
        console.log('📡 Response - URL:', config.url, 'Status:', res.statusCode, 'Data:', res.data)
        
        const code = res.data.code || 200
        const msg = errorCode[code] || res.data.msg || errorCode['default']
        
        if (code === 401) {
          console.log('🔴 401 Unauthorized - Token might be invalid')
          showConfirm('登录状态已过期，您可以继续留在该页面，或者重新登录?').then(res => {
            if (res.confirm) {
              store.dispatch('LogOut').then(res => {
                uni.reLaunch({ url: '/pages/login' })
              })
            }
          })
          reject('无效的会话，或者会话已过期，请重新登录。')
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
        let { message } = error
        if (message === 'Network Error') {
          message = '后端接口连接异常'
        } else if (message.includes('timeout')) {
          message = '系统接口请求超时'
        } else if (message.includes('Request failed with status code')) {
          message = '系统接口' + message.substr(message.length - 3) + '异常'
        }
        toast(message)
        reject(error)
      })
  })
}

export default request