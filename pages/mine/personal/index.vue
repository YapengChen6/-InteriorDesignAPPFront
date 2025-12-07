<template>
  <view class="container">
    <!-- 头像展示区域 -->
    <view class="avatar-section">
      <view class="avatar-wrapper">
        <image 
          :src="displayAvatar" 
          mode="aspectFill" 
          class="avatar"
          @error="onAvatarError"
          @load="onAvatarLoad"
        ></image>
        <view class="avatar-loading" v-if="avatarLoading">
          <view class="loading-spinner"></view>
        </view>
      </view>
      <view class="user-name">{{ user.nickName || user.name || '用户' }}</view>
    </view>

    <!-- 其他代码保持不变 -->
    <view class="user-card">
      <view class="info-list">
        <view class="info-item" @tap="navigateTo('/pages/mine/avatar/index')">
          <view class="info-icon">🖼️</view>
          <view class="info-content">
            <view class="info-title">头像</view>
            <view class="info-value">点击编辑</view>
          </view>
          <view class="info-arrow">›</view>
        </view>
        
        <view class="info-item" @tap="navigateTo('/pages/mine/personal/nickname/index')">
          <view class="info-icon">👤</view>
          <view class="info-content">
            <view class="info-title">昵称</view>
            <view class="info-value">{{ user.name || user.nickName || '未设置' }}</view>
          </view>
          <view class="info-arrow">›</view>
        </view>
        
        <view class="info-item" @tap="navigateTo('/pages/mine/personal/phone/index')">
          <view class="info-icon">📱</view>
          <view class="info-content">
            <view class="info-title">手机号码</view>
            <view class="info-value">{{ user.phone || user.phonenumber || '未绑定' }}</view>
          </view>
          <view class="info-arrow">›</view>
        </view>
        
        <view class="info-item" @tap="navigateTo('/pages/mine/personal/address/index')">
          <view class="info-icon">🏙️</view>
          <view class="info-content">
            <view class="info-title">所在城市</view>
            <view class="info-value">{{ user.address || user.city || '未设置' }}</view>
          </view>
          <view class="info-arrow">›</view>
        </view>
        
        <!-- 账号注销 -->
        <view class="info-item delete-account" @tap="navigateTo('/pages/mine/personal/logoff/index')">
          <view class="info-icon">⚠️</view>
          <view class="info-content">
            <view class="info-title">账号注销</view>
            <view class="info-value">永久删除账号</view>
          </view>
          <view class="info-arrow">›</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
  import { getUserProfile, updateUserProfile } from "@/api/users.js"
  import { getImagesPreview } from "@/api/upload.js" // 引入图片预览接口
  import store from "@/store"

  export default {
    data() {
      return {
        user: {
          name: '',
          nickName: '',
          phonenumber: '',
          phone: '',
          email: '',
          avatar: '',
          city: '',
          address: ''
        },
        defaultAvatar: '/static/default-avatar.png',
        isUpdatingAvatar: false, // 防止重复提交
        avatarLoading: false, // 头像加载状态
        previewUrl: '', // 预览图片URL
        usePreview: false, // 是否使用预览图片
        avatarError: false // 头像是否加载错误
      }
    },
    computed: {
      // 计算属性，决定最终显示的头像
      displayAvatar() {
        if (this.avatarError) {
          return this.defaultAvatar
        }
        if (this.usePreview && this.previewUrl) {
          return this.previewUrl
        }
        return this.user.avatar || this.defaultAvatar
      }
    },
    onLoad() {
      this.getUser()
      // 监听头像更新事件
      this.listenAvatarUpdate()
    },
    onShow() {
      // 当从编辑页面返回时，重新获取用户信息
      this.getUser()
    },
    onUnload() {
      // 移除事件监听
      uni.$off('avatarUpdated')
    },
    methods: {
      async getUser() {
        try {
          const response = await getUserProfile()
          if (response.code === 200) {
            this.user = response.data
            this.avatarError = false
            
            // 如果接口返回的头像为空，尝试从store获取
            if (!this.user.avatar) {
              const storeAvatar = store.getters.avatar
              if (storeAvatar) {
                this.user.avatar = storeAvatar
              }
            }
            
            console.log('👤 个人中心用户信息:', this.user)
            console.log('🔄 当前头像URL:', this.user.avatar)
            
            // 检查头像URL是否需要预览处理
            if (this.user.avatar && this.user.avatar !== this.defaultAvatar) {
              await this.processAvatar(this.user.avatar)
            }
          } else {
            console.error('获取用户信息失败:', response.msg)
            this.getAvatarFromStore()
          }
        } catch (error) {
          console.error('获取用户信息失败:', error)
          this.getAvatarFromStore()
          uni.showToast({
            title: '获取用户信息失败',
            icon: 'none'
          })
        }
      },
      
      // 处理头像显示
      async processAvatar(avatarUrl) {
        console.log('🔄 处理头像URL:', avatarUrl)
        
        // 检查URL格式
        if (this.isValidAvatarUrl(avatarUrl)) {
          // 如果是有效的URL，直接使用
          this.usePreview = false
          this.user.avatar = avatarUrl
        } else {
          // 如果URL格式有问题，尝试修复或使用预览
          console.warn('⚠️ 头像URL格式可能有问题，尝试修复:', avatarUrl)
          const fixedUrl = this.fixAvatarUrl(avatarUrl)
          if (fixedUrl !== avatarUrl) {
            console.log('🔧 修复后的URL:', fixedUrl)
            this.user.avatar = fixedUrl
          }
          
          // 对于OSS路径，可以尝试预览接口
          if (this.isOSSUrl(avatarUrl)) {
            await this.tryAvatarPreview(avatarUrl)
          }
        }
      },
      
      // 验证头像URL是否有效
      isValidAvatarUrl(url) {
        if (!url || url === this.defaultAvatar) {
          return true // 默认头像总是有效的
        }
        
        // 检查URL格式
        const urlPattern = /^(https?:\/\/|data:image\/|\/)/i
        return urlPattern.test(url)
      },
      
      // 修复头像URL格式
      fixAvatarUrl(url) {
        if (!url) return url
        
        // 修复双斜杠问题
        if (url.includes('//')) {
          // 保留http://或https://的双斜杠，修复路径中的双斜杠
          const fixedUrl = url.replace(/([^:])\/\//g, '$1/')
          return fixedUrl
        }
        
        return url
      },
      
      // 检查是否是OSS URL
      isOSSUrl(url) {
        return url && (url.includes('oss-') || url.includes('aliyuncs.com') || url.startsWith('photo/'))
      },
      
      // 尝试头像预览
      async tryAvatarPreview(fileUrl) {
        if (!fileUrl) return
        
        try {
          this.avatarLoading = true
          console.log('🔄 尝试头像预览，fileUrl:', fileUrl)
          
          // 调用预览接口
          const response = await getImagesPreview(fileUrl)
          console.log('📥 预览接口响应:', response)
          
          if (response.code === 200 && response.data) {
            console.log('✅ 获取头像预览成功')
            this.previewUrl = response.data
            this.usePreview = true
          } else {
            console.warn('⚠️ 预览接口返回异常，使用原始头像')
            this.usePreview = false
          }
        } catch (error) {
          console.error('❌ 预览接口请求失败:', error)
          // 预览失败时使用原始头像
          this.usePreview = false
        } finally {
          this.avatarLoading = false
        }
      },
      
      // 获取头像预览（备用方法）
      async getAvatarPreview(fileUrl) {
        // 这个方法暂时保留，但主要使用 tryAvatarPreview
        return this.tryAvatarPreview(fileUrl)
      },
      
      // 从store获取头像
      getAvatarFromStore() {
        const storeAvatar = store.getters.avatar
        if (storeAvatar) {
          this.user.avatar = storeAvatar
          this.processAvatar(storeAvatar)
        }
      },
      
      // 监听头像更新事件
      listenAvatarUpdate() {
        uni.$on('avatarUpdated', async (avatarUrl) => {
          console.log('🔄 个人中心收到头像更新事件:', avatarUrl)
          
          // 重置状态
          this.avatarError = false
          this.usePreview = false
          this.previewUrl = ''
          
          // 更新本地数据
          this.user.avatar = avatarUrl
          
          // 处理新头像
          await this.processAvatar(avatarUrl)
          
          // 同时更新store中的用户信息
          const currentUserInfo = store.getters.userInfo
          if (currentUserInfo) {
            const updatedUserInfo = {
              ...currentUserInfo,
              avatar: avatarUrl
            }
            store.commit('SET_USER_INFO', updatedUserInfo)
          }
          
          // 调用API更新服务器上的用户头像
          this.updateAvatarToServer(avatarUrl)
        })
      },
      
      // 更新头像到服务器
      updateAvatarToServer(avatarUrl) {
        if (this.isUpdatingAvatar) {
          console.log('🔄 头像更新请求正在进行中，跳过重复请求')
          return
        }
        
        this.isUpdatingAvatar = true
        
        const updateData = {
          avatar: avatarUrl
        }
        
        console.log('📤 开始更新用户头像到服务器:', updateData)
        
        updateUserProfile(updateData).then(response => {
          this.isUpdatingAvatar = false
          
          if (response.code === 200) {
            console.log('✅ 用户头像更新成功')
            uni.showToast({
              title: '头像更新成功',
              icon: 'success',
              duration: 2000
            })
            
            // 更新store中的完整用户信息
            const currentUserInfo = store.getters.userInfo
            if (currentUserInfo) {
              const updatedUserInfo = {
                ...currentUserInfo,
                avatar: avatarUrl
              }
              store.commit('SET_USER_INFO', updatedUserInfo)
            }
            
            // 触发全局头像更新事件，让其他页面也更新
            uni.$emit('userAvatarUpdated', avatarUrl)
            
          } else {
            console.error('❌ 用户头像更新失败:', response.msg)
            uni.showToast({
              title: response.msg || '头像更新失败',
              icon: 'none',
              duration: 3000
            })
          }
        }).catch(error => {
          this.isUpdatingAvatar = false
          console.error('❌ 用户头像更新请求失败:', error)
          uni.showToast({
            title: '网络错误，请重试',
            icon: 'none',
            duration: 3000
          })
        })
      },
      
      // 头像加载成功处理
      onAvatarLoad(e) {
        console.log('✅ 头像加载成功')
        this.avatarLoading = false
        this.avatarError = false
      },
      
      // 头像加载失败处理
      onAvatarError(e) {
        console.error('❌ 头像加载失败:', e)
        this.avatarLoading = false
        this.avatarError = true
        
        // 如果当前使用的是预览URL，回退到原始头像
        if (this.usePreview) {
          console.log('🔄 预览头像加载失败，回退到原始头像')
          this.usePreview = false
          this.$forceUpdate()
        }
      },
      
      navigateTo(url) {
        uni.navigateTo({
          url: url
        })
      }
    }
  }
</script>

<style lang="scss">
  /* 样式保持不变 */
  page {
    background-color: #f5f7fa;
  }
  
  .container {
    padding: 20rpx;
  }
  
  /* 头像区域样式 */
  .avatar-section {
    background: white;
    border-radius: 16rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
    padding: 60rpx 40rpx;
    text-align: center;
    margin-bottom: 20rpx;
  }
  
  .avatar-wrapper {
    position: relative;
    display: inline-block;
    margin-bottom: 30rpx;
  }
  
  .avatar {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    border: 4rpx solid #f0f0f0;
    transition: all 0.3s ease;
  }
  
  /* 头像加载动画 */
  .avatar-loading {
    position: absolute;
    top: 0;
    left: 0;
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .loading-spinner {
    width: 40rpx;
    height: 40rpx;
    border: 4rpx solid #f0f0f0;
    border-top: 4rpx solid #6a11cb;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  
  .user-name {
    font-size: 36rpx;
    font-weight: 600;
    color: #333;
  }
  
  .user-card {
    background: white;
    border-radius: 16rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
    overflow: hidden;
    margin-bottom: 20rpx;
    transition: all 0.3s ease;
  }
  
  .info-list {
    padding: 0;
  }
  
  .info-item {
    display: flex;
    align-items: center;
    padding: 32rpx 40rpx;
    border-bottom: 1rpx solid #f0f0f0;
    transition: all 0.3s ease;
  }
  
  .info-item:active {
    background: #f8f9fa;
  }
  
  .info-item:last-child {
    border-bottom: none;
  }
  
  .info-item.delete-account {
    .info-title, .info-value {
      color: #ff4757;
    }
    
    .info-icon {
      color: #ff4757;
    }
  }
  
  .info-icon {
    width: 48rpx;
    height: 48rpx;
    margin-right: 30rpx;
    color: #6a11cb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32rpx;
  }
  
  .info-content {
    flex: 1;
  }
  
  .info-title {
    font-size: 30rpx;
    color: #666;
    margin-bottom: 8rpx;
  }
  
  .info-value {
    font-size: 32rpx;
    color: #333;
    font-weight: 500;
  }
  
  .info-arrow {
    color: #999;
    font-size: 28rpx;
  }
</style>