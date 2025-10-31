<template>
  <view class="publish-container" :style="{height: `${windowHeight}px`}">
    
    <!-- 页面标题 -->
    <view class="page-title">发布内容</view>
    
    <!-- 功能提示 -->
    <view class="function-hint">请选择您要发布的内容类型</view>
    
    <!-- 功能选择列表 -->
    <view class="menu-list">
      <view 
        class="list-cell" 
        @click="navigateToOrderPublish"
      >
        <view class="menu-item-box">
          <view class="menu-icon">📋</view>
          <view class="menu-content">
            <view class="menu-text">发布订单</view>
            <view class="menu-desc">创建服务需求，寻找合适的服务商</view>
          </view>
          <view class="arrow">›</view>
        </view>
      </view>
      
      <view 
        class="list-cell" 
        @click="navigateToPostPublish"
      >
        <view class="menu-item-box">
          <view class="menu-icon">📝</view>
          <view class="menu-content">
            <view class="menu-text">发布帖子</view>
            <view class="menu-desc">分享经验观点，与社区互动交流</view>
          </view>
          <view class="arrow">›</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
  export default {
    data() {
      return {
        windowHeight: uni.getSystemInfoSync().windowHeight
      }
    },
    methods: {
      // 跳转到订单发布页面
      navigateToOrderPublish() {
        uni.navigateTo({
          url: '/pages/post/order'
        });
      },
      
      // 跳转到帖子发布页面
      navigateToPostPublish() {
        uni.navigateTo({
          url: '/pages/post/post'
        });
      }
    }
  }
</script>

<style lang="scss" scoped>
  .publish-container {
    background-color: #f8f8f8;
    padding: 40rpx 30rpx;
    display: flex;
    flex-direction: column;
  }

  .page-title {
    font-size: 36rpx;
    font-weight: bold;
    text-align: center;
    margin-bottom: 30rpx;
    color: #333;
  }

  .function-hint {
    font-size: 28rpx;
    color: #666;
    text-align: center;
    margin-bottom: 60rpx;
  }

  .menu-list {
    background-color: #FFFFFF;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  }

  .list-cell {
    padding: 40rpx 30rpx;
    border-bottom: 1rpx solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:active {
      background-color: #f5f5f5;
    }
  }

  .menu-item-box {
    display: flex;
    align-items: center;
  }

  .menu-icon {
    font-size: 48rpx;
    margin-right: 30rpx;
    width: 80rpx;
    height: 80rpx;
    border-radius: 16rpx;
    background: linear-gradient(135deg, #4a6cf7 0%, #6c5ce7 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .menu-content {
    flex: 1;
  }

  .menu-text {
    font-size: 32rpx;
    color: #333;
    font-weight: 500;
    margin-bottom: 8rpx;
  }

  .menu-desc {
    font-size: 24rpx;
    color: #999;
    line-height: 1.4;
  }

  .arrow {
    font-size: 40rpx;
    color: #ccc;
    margin-left: 20rpx;
  }
</style>