<template>
  <view class="container">
    <!-- 头像展示区域 -->
    <view class="avatar-section" @tap="navigateTo('/pages/mine/avatar/index')">
      <view class="avatar-wrapper">
        <image :src="user.avatar || '/static/default-avatar.png'" mode="aspectFill" class="avatar"></image>
        <view class="avatar-edit">编辑</view>
      </view>
      <view class="user-name">{{ user.nickName }}</view>
    </view>

    <view class="user-card">
      <view class="info-list">
        <view class="info-item" @tap="navigateTo('/pages/mine/personal/nickname/index')">
          <view class="info-icon">👤</view>
          <view class="info-content">
            <view class="info-title">昵称</view>
            <view class="info-value">{{ user.name }}</view>
          </view>
          <view class="info-arrow">›</view>
        </view>
        
        <view class="info-item" @tap="navigateTo('/pages/mine/personal/phone/index')">
          <view class="info-icon">📱</view>
          <view class="info-content">
            <view class="info-title">手机号码</view>
            <view class="info-value">{{ user.phone || '未绑定' }}</view>
          </view>
          <view class="info-arrow">›</view>
        </view>
        
        <view class="info-item" @tap="navigateTo('/pages/mine/personal/address/index')">
          <view class="info-icon">🏙️</view>
          <view class="info-content">
            <view class="info-title">所在城市</view>
            <view class="info-value">{{ user.address || '未设置' }}</view>
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
  import { getUserProfile } from "@/api/users.js"

  export default {
    data() {
      return {
        user: {
          name: '',
          phonenumber: '',
          email: '',
          avatar: '',
          city: ''
        }
      }
    },
    onLoad() {
      this.getUser()
    },
    onShow() {
      // 当从编辑页面返回时，重新获取用户信息
      this.getUser()
    },
    methods: {
      getUser() {
        getUserProfile().then(response => {
          this.user = response.data
        }).catch(error => {
          console.error('获取用户信息失败:', error)
          uni.showToast({
            title: '获取用户信息失败',
            icon: 'none'
          })
        })
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
  }
  
  .avatar-edit {
    position: absolute;
    bottom: 0;
    right: 0;
    background: #6a11cb;
    color: white;
    padding: 8rpx 20rpx;
    border-radius: 20rpx;
    font-size: 24rpx;
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