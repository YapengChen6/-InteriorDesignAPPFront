<template>
  <view class="container">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="title">设计师入驻</text>
      <text class="subtitle">入驻装修设计app，展示您的设计才华</text>
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
    
    <!-- 费用明细 -->
    <view class="payment-container">
      <view class="payment-card">
        <view class="payment-header">
          <text class="payment-title">费用明细</text>
        </view>
        
        <view class="payment-list">
          <view class="payment-item">
            <text class="payment-label">设计师保证金</text>
            <text class="payment-amount">¥800.00</text>
          </view>
          
          <view class="payment-item">
            <text class="payment-label">平台服务费</text>
            <text class="payment-amount">¥200.00</text>
          </view>
          
          <view class="payment-divider"></view>
          
          <view class="payment-item total">
            <text class="payment-label total-label">合计</text>
            <text class="payment-amount total-amount">¥1000.00</text>
          </view>
        </view>
        
        <view class="payment-tips">
          <text class="tips-text">• 保证金将在您退出平台时退还</text>
          <text class="tips-text">• 平台服务费为年度费用，用于技术支持和维护</text>
          <text class="tips-text">• 首年入驻享受优惠价格</text>
        </view>
      </view>
      
      <!-- 支付方式选择 -->
      <view class="payment-methods">
        <text class="section-title">选择支付方式</text>
        
        <view class="methods-list">
          <view 
            class="method-item" 
            :class="{active: selectedMethod === 'alipay'}"
            @click="selectMethod('alipay')"
          >
            <view class="method-icon">
              <image src="/static/images/alipay.png" class="method-image" mode="aspectFit"></image>
            </view>
            <text class="method-name">支付宝</text>
            <view class="method-check" :class="{active: selectedMethod === 'alipay'}">
              <text class="check-icon">✓</text>
            </view>
          </view>
          
          <view 
            class="method-item" 
            :class="{active: selectedMethod === 'wechat'}"
            @click="selectMethod('wechat')"
          >
            <view class="method-icon">
              <image src="/static/images/wechat.png" class="method-image" mode="aspectFit"></image>
            </view>
            <text class="method-name">微信支付</text>
            <view class="method-check" :class="{active: selectedMethod === 'wechat'}">
              <text class="check-icon">✓</text>
            </view>
          </view>
          
          <view 
            class="method-item" 
            :class="{active: selectedMethod === 'bank'}"
            @click="selectMethod('bank')"
          >
            <view class="method-icon">
              <image src="/static/images/bank.png" class="method-image" mode="aspectFit"></image>
            </view>
            <text class="method-name">银行卡支付</text>
            <view class="method-check" :class="{active: selectedMethod === 'bank'}">
              <text class="check-icon">✓</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 支付按钮 -->
      <button 
        type="primary" 
        class="pay-button" 
        @click="handlePayment"
        :disabled="isPaying || !selectedMethod"
      >
        {{ isPaying ? '支付中...' : `立即支付 ¥${totalAmount}` }}
      </button>
      
      <!-- 协议 -->
      <view class="agreement">
        <view 
          class="agreement-checkbox" 
          :class="{active: agreed}"
          @click="toggleAgreement"
        >
          <text class="checkbox-icon" v-if="agreed">✓</text>
        </view>
        <text class="agreement-text">
          我已阅读并同意
          <text class="agreement-link" @click="previewAgreement">《设计师入驻协议》</text>
        </text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      currentStep: 2,
      isPaying: false,
      selectedMethod: 'alipay',
      agreed: true,
      totalAmount: '1000.00'
    }
  },
  
  onLoad(options) {
    // 从上一页获取申请ID
    if (options.applicationId) {
      this.applicationId = options.applicationId;
      console.log('📝 Received application ID:', this.applicationId);
    }
  },
  
  methods: {
    // 选择支付方式
    selectMethod(method) {
      this.selectedMethod = method;
    },
    
    // 切换协议同意状态
    toggleAgreement() {
      this.agreed = !this.agreed;
    },
    
    // 预览协议
    previewAgreement() {
      uni.showModal({
        title: '设计师入驻协议',
        content: '本协议是设计师与装修设计APP平台之间就设计师入驻平台服务相关事宜所订立的协议。设计师在平台展示作品、接单服务等需遵守平台规则。',
        showCancel: false,
        confirmText: '我知道了'
      });
    },
    
    // 模拟支付过程
    mockPayment() {
      return new Promise((resolve) => {
        setTimeout(() => {
          // 模拟支付成功
          const success = Math.random() > 0.2; // 80%成功率
          
          if (success) {
            resolve({
              success: true,
              data: {
                paymentId: `designer_pay_${Date.now()}`,
                amount: this.totalAmount,
                nextStep: 3
              },
              message: '支付成功'
            });
          } else {
            resolve({
              success: false,
              message: '支付失败，请重试'
            });
          }
        }, 2000);
      });
    },
    
    // 处理支付
    async handlePayment() {
      if (this.isPaying) return;
      
      if (!this.agreed) {
        uni.showToast({
          title: '请先同意设计师入驻协议',
          icon: 'none'
        });
        return;
      }
      
      try {
        this.isPaying = true;
        
        uni.showLoading({
          title: '支付中...',
          mask: true
        });
        
        // 模拟支付请求
        const result = await this.mockPayment();
        
        if (result.success) {
          uni.showToast({
            title: result.message,
            icon: 'success'
          });
          
          console.log('设计师支付成功:', result.data);
          
          // 支付成功，跳转到下一步
          setTimeout(() => {
            uni.redirectTo({
              url: `/pages/join/DesignerJoin3?applicationId=${this.applicationId || ''}`
            });
          }, 1500);
          
        } else {
          throw new Error(result.message);
        }
        
      } catch (error) {
        console.error('支付失败:', error);
        uni.showToast({
          title: error.message || '支付失败，请重试',
          icon: 'none'
        });
      } finally {
        this.isPaying = false;
        uni.hideLoading();
      }
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

/* 支付容器 */
.payment-container {
  padding: 0 30rpx;
}

.payment-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.payment-header {
  margin-bottom: 30rpx;
}

.payment-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.payment-list {
  margin-bottom: 30rpx;
}

.payment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
}

.payment-label {
  font-size: 28rpx;
  color: #666;
}

.payment-amount {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.payment-item.total {
  padding-top: 30rpx;
  border-top: 1rpx solid #f0f0f0;
}

.total-label {
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
}

.total-amount {
  font-size: 36rpx;
  color: #ff4d4f;
  font-weight: bold;
}

.payment-divider {
  height: 1rpx;
  background-color: #f0f0f0;
  margin: 10rpx 0;
}

.payment-tips {
  background-color: #f8f8f8;
  padding: 20rpx;
  border-radius: 8rpx;
}

.tips-text {
  display: block;
  font-size: 24rpx;
  color: #999;
  line-height: 1.6;
}

/* 支付方式 */
.payment-methods {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  display: block;
}

.methods-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.method-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border: 2rpx solid #f0f0f0;
  border-radius: 12rpx;
  transition: all 0.3s ease;
}

.method-item.active {
  border-color: #007AFF;
  background-color: rgba(0, 122, 255, 0.05);
}

.method-icon {
  width: 60rpx;
  height: 60rpx;
  margin-right: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.method-image {
  width: 100%;
  height: 100%;
}

.method-name {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.method-check {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 2rpx solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.method-check.active {
  background-color: #007AFF;
  border-color: #007AFF;
}

.check-icon {
  font-size: 24rpx;
  color: #fff;
  font-weight: bold;
}

/* 支付按钮 */
.pay-button {
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

.pay-button:active {
  background-color: #0056b3;
  transform: translateY(2rpx);
}

.pay-button:disabled {
  background-color: #ccc;
  box-shadow: none;
  transform: none;
}

/* 协议 */
.agreement {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 30rpx;
  padding: 0 20rpx;
}

.agreement-checkbox {
  width: 36rpx;
  height: 36rpx;
  border: 2rpx solid #ddd;
  border-radius: 6rpx;
  margin-right: 15rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.agreement-checkbox.active {
  background-color: #007AFF;
  border-color: #007AFF;
}

.checkbox-icon {
  font-size: 24rpx;
  color: #fff;
  font-weight: bold;
}

.agreement-text {
  font-size: 24rpx;
  color: #666;
}

.agreement-link {
  color: #007AFF;
}
</style>