<template>
  <view class="container">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="title">监工入驻</text>
      <text class="subtitle">入驻装修设计app，出货更容易</text>
    </view>
    
    <!-- 入驻流程步骤 -->
    <view class="steps-container">
      <view class="step-item" :class="{active: currentStep >= 1}">
        <view class="step-icon">1</view>
        <text class="step-text">上传资料</text>
      </view>
      <view class="step-item" :class="{active: currentStep >= 2}">
        <view class="step-icon">2</view>
        <text class="step-text">缴纳保证金</text>
      </view>
      <view class="step-item" :class="{active: currentStep >= 3}">
        <view class="step-icon">3</view>
        <text class="step-text">提交审核</text>
      </view>
    </view>
    
    <!-- 审核状态 -->
    <view class="audit-container">
      <view class="audit-card">
        <view class="audit-status">
          <view class="status-icon">
            <text class="icon-text">⏳</text>
          </view>
          <text class="status-title">等待审核中...</text>
          <text class="status-desc">我们正在认真审核您的入驻资料</text>
        </view>
        
        <view class="audit-tips">
          <text class="tips-title">审核说明：</text>
          <text class="tips-item">• 审核通常需要1-3个工作日</text>
          <text class="tips-item">• 审核期间请保持手机畅通</text>
          <text class="tips-item">• 审核结果将通过短信通知</text>
          <text class="tips-item">• 如有疑问请联系客服</text>
        </view>
      </view>
      
      <!-- 操作按钮 -->
      <view class="action-buttons">
        <button 
          type="primary" 
          class="confirm-button" 
          @click="handleConfirm"
        >
          确定
        </button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      currentStep: 3
    }
  },
  
  methods: {
    // 处理确定按钮点击
    handleConfirm() {
      uni.showModal({
        title: '提示',
        content: '审核完成后我们会通过短信通知您，请耐心等待',
        confirmText: '我知道了',
        cancelText: '联系客服',
        success: (res) => {
          if (res.confirm) {
            // 返回首页或商户中心
            uni.switchTab({
              url: '/pages/index'
            });
          } else if (res.cancel) {
            this.contactService();
          }
        }
      });
    },
    
    // 联系客服
    contactService() {
      uni.makePhoneCall({
        phoneNumber: '400-123-4567'
      });
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 100rpx;
}

.page-header {
  padding: 40rpx 30rpx 20rpx;
  text-align: center;
}

.title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #666;
}

/* 步骤容器 */
.steps-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40rpx 30rpx;
  background: #fff;
  margin: 0 30rpx 30rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.step-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #fff;
  margin-bottom: 16rpx;
  font-weight: bold;
  flex-shrink: 0;
}

.step-item.active .step-icon {
  background-color: #007AFF;
}

.step-text {
  font-size: 26rpx;
  color: #999;
  text-align: center;
  line-height: 1.4;
  min-height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.step-item.active .step-text {
  color: #007AFF;
  font-weight: 500;
}

/* 审核容器 */
.audit-container {
  padding: 0 30rpx;
}

.audit-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 60rpx 30rpx 40rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  text-align: center;
}

.audit-status {
  margin-bottom: 50rpx;
}

.status-icon {
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #ffe58f, #ffc53d);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30rpx;
}

.icon-text {
  font-size: 50rpx;
}

.status-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.status-desc {
  display: block;
  font-size: 28rpx;
  color: #666;
}

/* 审核提示 */
.audit-tips {
  text-align: left;
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 30rpx;
}

.tips-title {
  display: block;
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 20rpx;
}

.tips-item {
  display: block;
  font-size: 24rpx;
  color: #666;
  line-height: 1.8;
  margin-bottom: 8rpx;
}

/* 操作按钮 - 与步骤2支付按钮完全一致 */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.confirm-button {
  width: 100%;
  margin-top: 40rpx;
  background-color: #007AFF;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
  padding: 25rpx 0;
  box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.3);
}

.confirm-button:active {
  background-color: #0056b3;
  transform: translateY(2rpx);
}

.confirm-button:disabled {
  background-color: #ccc;
  box-shadow: none;
  transform: none;
}
</style>