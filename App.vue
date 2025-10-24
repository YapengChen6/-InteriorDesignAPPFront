<script>
  import config from './config'
  import { getToken } from '@/utils/auth'
  import { getUserInfo, getRouters } from '@/api/login.js'

  export default {
    onLaunch: function() {
      console.log('App Launch')
      this.initApp()
    },
    onShow: function() {
      console.log('App Show')
    },
    onHide: function() {
      console.log('App Hide')
    },
    methods: {
      // 初始化应用
      initApp() {
        // 初始化应用配置
        this.initConfig()
        // 检查用户登录状态
        this.checkLoginStatus()
      },
      
      initConfig() {
        this.globalData.config = config
      },
      
      // 检查登录状态
      async checkLoginStatus() {
        const token = getToken()
        console.log('检查登录状态，token:', token ? '存在' : '不存在')
        
        if (token) {
          try {
            // 验证token是否有效，通过获取用户信息来验证
            await this.getUserInfoAndRouters()
            console.log('登录状态有效')
            
            // 登录成功，确保在首页
            const currentPage = getCurrentPages()
            if (currentPage.length === 0) {
              // 如果没有页面，跳转到首页
              this.$tab.switchTab('/pages/index')
            } else {
              const route = currentPage[currentPage.length - 1].route
              if (route === 'pages/register') {
                // 如果在登录/注册页，跳转到首页
                this.$tab.switchTab('/pages/index')
              }
            }
            
          } catch (error) {
            console.error('登录状态无效:', error)
            // token无效，清除登录状态并跳转到登录页
            this.clearLoginStatus()
            this.redirectToLogin()
          }
        } else {
          // 没有token，跳转到登录页
          console.log('未登录，跳转到登录页')
          this.redirectToLogin()
        }
      },
      
      // 获取用户信息和路由
      async getUserInfoAndRouters() {
        try {
          // 获取用户信息
          const userInfoResponse = await getUserInfo()
          if (userInfoResponse.code === 200 || userInfoResponse.success) {
            const userInfo = userInfoResponse.data
            uni.setStorageSync('userInfo', userInfo)
            console.log('用户信息:', userInfo)
			
			// 可以通过getApp().globalData.userInfo调用用户信息
            
            // 获取用户路由
            const routersResponse = await getRouters()
            if (routersResponse.code === 200 || routersResponse.success) {
              const routers = routersResponse.data
              uni.setStorageSync('userRouters', routers)
              console.log('用户路由:', routers)
            }
            
            return true
          } else {
            throw new Error(userInfoResponse.msg || '获取用户信息失败')
          }
        } catch (error) {
          console.error('获取用户信息失败:', error)
          throw error
        }
      },
      
      // 清除登录状态
      clearLoginStatus() {
        uni.removeStorageSync('token')
        uni.removeStorageSync('userInfo')
        uni.removeStorageSync('userRouters')
        console.log('已清除登录状态')
      },
      
      // 跳转到登录页
      redirectToLogin() {
        // 检查当前页面是否是登录页，避免重复跳转
        const currentPage = getCurrentPages()
        if (currentPage.length > 0) {
          const route = currentPage[currentPage.length - 1].route
          if (route === 'pages/register') {
            return
          }
        }
        
        // 跳转到登录页
        uni.redirectTo({
          url: '/pages/register'
        })
      }
    },
    
    globalData: {
      config: {},
      userInfo: null
    }
  }
</script>

<style lang="scss">
  @import '@/static/scss/index.scss';
  
  /* 全局样式 */
  page {
    background-color: #f5f5f5;
    font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', SimSun, sans-serif;
  }
  
  /* 通用按钮样式 */
  .uni-btn {
    border-radius: 8rpx;
  }
  
  /* 通用输入框样式 */
  .uni-input {
    border-radius: 8rpx;
  }
</style>