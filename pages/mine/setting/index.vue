<template>
  <view class="setting-container" :style="{height: `${windowHeight}px`}">
    
    <!-- 身份提示 -->
    <view class="identity-hint">已选择您的身份：{{selectedIdentity}}</view>
    
    <!-- 身份选择列表 -->
    <view class="menu-list">
      <view 
        class="list-cell" 
        :class="{'selected': selectedIdentity === '商家'}"
        @click="selectIdentity('商家')"
      >
        <view class="menu-item-box">
          <view class="menu-icon">🏠</view>
          <view class="menu-text">商家</view>
        </view>
      </view>
      
      <view 
        class="list-cell" 
        :class="{'selected': selectedIdentity === '设计师'}"
        @click="selectIdentity('设计师')"
      >
        <view class="menu-item-box">
          <view class="menu-icon">🎨</view>
          <view class="menu-text">设计师</view>
        </view>
      </view>
      
      <view 
        class="list-cell" 
        :class="{'selected': selectedIdentity === '监工'}"
        @click="selectIdentity('监工')"
      >
        <view class="menu-item-box">
          <view class="menu-icon">👷</view>
          <view class="menu-text">监工</view>
        </view>
      </view>
    </view>
    
    <!-- 确认按钮 -->
    <view class="confirm-btn-container">
      <view class="confirm-btn" @click="handleConfirm">
        <text class="confirm-text">我选好了</text>
      </view>
    </view>
  </view>
</template>

<script>
  export default {
    data() {
      return {
        windowHeight: uni.getSystemInfoSync().windowHeight,
        selectedIdentity: '业主' // 默认选择商家
      }
    },
    methods: {
      // 选择身份
      selectIdentity(identity) {
        this.selectedIdentity = identity;
        
        // 如果选择的是商家，直接跳转到商家加入页面
        if (identity === '商家') {
          this.navigateToShopJoin();
        }
      },
      
      // 确认选择
      handleConfirm() {
        this.$modal.showToast(`已选择身份：${this.selectedIdentity}`)
        
        // 根据选择的身份跳转到不同页面
        if (this.selectedIdentity === '商家') {
          this.navigateToShopJoin();
        } else {
          // 这里可以添加其他身份的跳转逻辑
          // this.$tab.navigateTo('/pages/home/index')
        }
      },
      
      // 跳转到商家加入页面
      navigateToShopJoin() {
        uni.navigateTo({
          url: '/pages/join/ShopJoin1'
        });
      }
    }
  }
</script>

<style lang="scss" scoped>
  .setting-container {
    background-color: #f8f8f8;
    padding: 40rpx 30rpx;
    display: flex;
    flex-direction: column;
  }

  .welcome-title {
    font-size: 36rpx;
    font-weight: bold;
    text-align: center;
    margin-bottom: 60rpx;
    color: #333;
  }

  .identity-hint {
    font-size: 28rpx;
    color: #666;
    text-align: center;
    margin-bottom: 60rpx;
  }

  .menu-list {
    background-color: #FFFFFF;
    border-radius: 16rpx;
    overflow: hidden;
    margin-bottom: 80rpx;
  }

  .list-cell {
    padding: 40rpx 30rpx;
    border-bottom: 1rpx solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
    
    &.selected {
      background-color: #e6f7ff;
      border-left: 6rpx solid #1890ff;
    }
  }

  .menu-item-box {
    display: flex;
    align-items: center;
  }

  .menu-icon {
    font-size: 48rpx;
    margin-right: 30rpx;
    width: 60rpx;
    text-align: center;
  }

  .menu-text {
    font-size: 32rpx;
    color: #333;
  }

  .confirm-btn-container {
    margin-top: auto;
    padding: 0 30rpx;
  }

  .confirm-btn {
    background-color: #1890ff;
    border-radius: 50rpx;
    padding: 28rpx;
    text-align: center;
    box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.3);
  }

  .confirm-text {
    color: #fff;
    font-size: 32rpx;
    font-weight: 500;
  }
</style>