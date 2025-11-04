<template>
  <view class="container">
    <view class="card">
      <view class="header">
        <view class="title">账户注销</view>
        <view class="subtitle">请按照以下步骤完成账户注销</view>
      </view>
      
      <view class="step-indicator">
        <view class="step" :class="{ 'active': currentStep === 1, 'completed': currentStep > 1 }">
          <view class="step-number">1</view>
          <view class="step-text">身份验证</view>
        </view>
        <view class="step" :class="{ 'active': currentStep === 2, 'completed': currentStep > 2 }">
          <view class="step-number">2</view>
          <view class="step-text">确认注销</view>
        </view>
        <view class="step" :class="{ 'active': currentStep === 3, 'completed': currentStep > 3 }">
          <view class="step-number">3</view>
          <view class="step-text">完成</view>
        </view>
      </view>
      
      <!-- 身份验证步骤 -->
      <view v-if="currentStep === 1" class="step-content">
        <view class="warning-box">
          <view class="warning-title">重要提示</view>
          <view class="warning-content">
            账户注销后，您的所有数据将被永久删除且无法恢复，包括个人信息、订单记录、收藏内容等。请谨慎操作。
          </view>
        </view>
        
        <view class="login-form">
          <!-- 手机号输入 -->
          <view class="form-group">
            <text class="form-label">手机号</text>
            <uni-easyinput
              ref="phoneInput"
              v-model="form.phoneNumber"
              type="number"
              placeholder="请输入11位手机号"
              maxlength="11"
              :inputBorder="false"
              :styles="inputStyles"
              :class="{ 'error': phoneError }"
              @blur="validatePhone"
              @input="clearPhoneError"
            />
            <view v-if="phoneError" class="error-message">{{ phoneError }}</view>
          </view>

          <!-- 验证码输入 -->
          <view class="form-group">
            <text class="form-label">验证码</text>
            <view class="code-input-group">
              <uni-easyinput
                ref="codeInput"
                v-model="form.verificationCode"
                type="number"
                placeholder="请输入6位验证码"
                maxlength="6"
                :inputBorder="false"
                :styles="inputStyles"
                :class="{ 'error': codeError }"
                @input="clearCodeError"
                class="code-input"
              />
              <button
                @click="getVerificationCode"
                class="code-btn"
                :class="{ 'disabled': isGettingCode || countdown > 0 }"
                :disabled="isGettingCode || countdown > 0"
              >
                <text v-if="isGettingCode && countdown === 0">发送中...</text>
                <text v-else-if="countdown > 0">{{ countdown }}秒后重新获取</text>
                <text v-else>获取验证码</text>
              </button>
            </view>
            <view v-if="codeError" class="error-message">{{ codeError }}</view>
          </view>
        </view>
        
        <button 
          :disabled="!canVerify" 
          @click="verifyIdentity" 
          class="verify-btn"
          :class="{ 'disabled': !canVerify }"
        >
          验证身份
        </button>
      </view>
      
      <!-- 确认注销步骤 -->
      <view v-if="currentStep === 2" class="step-content">
        <view class="warning-box">
          <view class="warning-title">确认注销</view>
          <view class="warning-content">
            您确定要注销账户吗？此操作不可逆，所有数据将被永久删除。
          </view>
        </view>
        
        <view class="user-info" v-if="userProfile">
          <view class="info-item">
            <text class="info-label">当前账号：</text>
            <text class="info-value">{{ userProfile.phone || userProfile.username }}</text>
          </view>
          <view class="info-item" v-if="userProfile.nickName">
            <text class="info-label">昵称：</text>
            <text class="info-value">{{ userProfile.nickName }}</text>
          </view>
        </view>
        
        <view class="form-group">
          <view class="label">注销原因（选填）</view>
          <picker 
            @change="onReasonChange" 
            :value="reasonIndex" 
            :range="reasonOptions"
            class="picker"
          >
            <view class="picker-text">
              {{ deleteReason ? reasonOptions[reasonIndex] : '请选择注销原因' }}
            </view>
          </picker>
        </view>
        
        <view class="form-group">
          <view class="label">意见反馈（选填）</view>
          <textarea 
            v-model="feedback" 
            placeholder="请告诉我们您注销账户的原因，以帮助我们改进服务"
            class="textarea"
          />
        </view>
        
        <view class="actions">
          <button @click="cancelDelete" class="cancel-btn">取消</button>
          <button @click="confirmDelete" class="confirm-btn">确认注销</button>
        </view>
      </view>
      
      <!-- 完成步骤 -->
      <view v-if="currentStep === 3" class="step-content">
        <view class="success-message">
          <view class="success-icon">✓</view>
          <view class="success-title">账户注销成功</view>
          <view class="success-desc">您的账户已成功注销，感谢您曾经使用我们的服务。</view>
          <button @click="handleComplete" class="complete-btn">返回首页</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { sendCode, getUserProfile, logout } from '@/api/users.js'

export default {
  name: 'AccountDeletion',
  data() {
    return {
      currentStep: 1,
      form: {
        phoneNumber: '',
        verificationCode: ''
      },
      phoneError: '',
      codeError: '',
      countdown: 0,
      isGettingCode: false,
      deleteReason: '',
      feedback: '',
      reasonIndex: 0,
      userProfile: null,
      reasonOptions: ['隐私担忧', '不再需要此服务', '使用体验不佳', '其他原因'],
      timer: null,
      inputStyles: {
        color: '#333',
        borderColor: '#e8e8e8',
        backgroundColor: '#fff'
      }
    }
  },
  computed: {
    canVerify() {
      return this.validatePhone(this.form.phoneNumber) && this.form.verificationCode.length === 6
    }
  },
  
  async onLoad() {
    await this.loadUserProfile()
  },
  
  methods: {
    validatePhone(phone) {
      const phoneRegex = /^1[3-9]\d{9}$/
      return phoneRegex.test(phone)
    },
    
    // 验证手机号格式
    validatePhoneField() {
      const phone = this.form.phoneNumber.trim()
      if (!phone) {
        this.phoneError = '请输入手机号'
        return false
      }
      if (!this.validatePhone(phone)) {
        this.phoneError = '请输入正确的手机号'
        return false
      }
      this.phoneError = ''
      return true
    },
    
    clearPhoneError() {
      this.phoneError = ''
    },
    
    clearCodeError() {
      this.codeError = ''
    },
    
    // 加载用户信息
    async loadUserProfile() {
      try {
        const res = await getUserProfile()
        if (res.code === 200) {
          this.userProfile = res.data
          this.form.phoneNumber = res.data.phone || ''
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        uni.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        })
      }
    },
    
    // 获取验证码
    async getVerificationCode() {
      if (!this.validatePhoneField()) {
        return
      }
      
      this.isGettingCode = true
      
      try {
        const res = await sendCode(this.form.phoneNumber)
        
        if (res.code === 200) {
          uni.showToast({
            title: '验证码已发送',
            icon: 'success'
          })
          
          // 开始倒计时
          this.countdown = 60
          this.timer = setInterval(() => {
            this.countdown--
            if (this.countdown <= 0) {
              clearInterval(this.timer)
              this.isGettingCode = false
            }
          }, 1000)
        } else {
          uni.showToast({
            title: res.msg || '发送失败',
            icon: 'none'
          })
          this.isGettingCode = false
        }
      } catch (error) {
        console.error('发送验证码失败:', error)
        uni.showToast({
          title: '发送验证码失败',
          icon: 'none'
        })
        this.isGettingCode = false
      }
    },
    
    // 验证身份
    async verifyIdentity() {
      if (!this.validatePhoneField()) {
        return
      }
      
      if (this.form.verificationCode.length !== 6) {
        this.codeError = '请输入6位验证码'
        return
      }
      
      try {
        uni.showLoading({
          title: '验证中...'
        })
        
        // 这里需要根据实际API实现验证码验证
        // 假设有一个验证验证码的API
        // const res = await verifyCode({ phone: this.form.phoneNumber, code: this.form.verificationCode })
        
        // 模拟验证成功
        setTimeout(() => {
          uni.hideLoading()
          this.currentStep = 2
        }, 1000)
        
      } catch (error) {
        uni.hideLoading()
        uni.showToast({
          title: '验证失败',
          icon: 'none'
        })
      }
    },
    
    onReasonChange(e) {
      this.reasonIndex = e.detail.value
      this.deleteReason = this.reasonOptions[this.reasonIndex]
    },
    
    // 确认注销
    async confirmDelete() {
      try {
        uni.showModal({
          title: '确认注销',
          content: '此操作不可逆，确定要注销账户吗？',
          confirmColor: '#ff4d4f',
          success: async (res) => {
            if (res.confirm) {
              await this.executeAccountDeletion()
            }
          }
        })
      } catch (error) {
        console.error('注销确认错误:', error)
      }
    },
    
    // 执行账户注销
    async executeAccountDeletion() {
      try {
        uni.showLoading({
          title: '注销中...',
          mask: true
        })
        
        // 这里调用实际的注销API
        // 假设注销API为 /api/users/delete-account
        // const res = await deleteAccount({
        //   phone: this.form.phoneNumber,
        //   code: this.form.verificationCode,
        //   reason: this.deleteReason,
        //   feedback: this.feedback
        // })
        
        // 模拟注销成功
        setTimeout(async () => {
          // 注销成功后登出
          try {
            await logout()
          } catch (error) {
            console.error('登出失败:', error)
          }
          
          uni.hideLoading()
          this.currentStep = 3
          
          // 清除本地存储的token等用户信息
          uni.removeStorageSync('token')
          uni.removeStorageSync('userInfo')
        }, 2000)
        
      } catch (error) {
        uni.hideLoading()
        console.error('注销失败:', error)
        uni.showToast({
          title: '注销失败，请重试',
          icon: 'none'
        })
      }
    },
    
    cancelDelete() {
      uni.showModal({
        title: '提示',
        content: '确定要取消注销吗？',
        success: (res) => {
          if (res.confirm) {
            this.currentStep = 1
          }
        }
      })
    },
    
    // 处理完成操作
    handleComplete() {
      // 跳转到首页或登录页
      uni.reLaunch({
        url: '/pages/index/index'
      })
    }
  },
  
  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  }
}
</script>

<style scoped>
.container {
  padding: 30rpx;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.card {
  background-color: white;
  border-radius: 20rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
  padding: 40rpx;
  margin-top: 40rpx;
}

.header {
  text-align: center;
  margin-bottom: 60rpx;
}

.title {
  color: #333;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.subtitle {
  color: #666;
  font-size: 28rpx;
}

.step-indicator {
  display: flex;
  justify-content: space-between;
  margin-bottom: 60rpx;
  position: relative;
}

.step-indicator::before {
  content: '';
  position: absolute;
  top: 30rpx;
  left: 0;
  right: 0;
  height: 4rpx;
  background-color: #e8e8e8;
  z-index: 1;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
}

.step-number {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background-color: #e8e8e8;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  margin-bottom: 16rpx;
}

.step.active .step-number {
  background-color: #1890ff;
  color: white;
}

.step.completed .step-number {
  background-color: #52c41a;
  color: white;
}

.step-text {
  font-size: 24rpx;
  color: #999;
}

.step.active .step-text {
  color: #1890ff;
}

.step.completed .step-text {
  color: #52c41a;
}

/* 登录表单样式 */
.login-form {
  margin-bottom: 40rpx;
}

.form-group {
  margin-bottom: 40rpx;
  position: relative;
}

.form-label {
  display: block;
  margin-bottom: 16rpx;
  color: #333;
  font-size: 28rpx;
  font-weight: 500;
}

.code-input-group {
  display: flex;
  gap: 20rpx;
  align-items: flex-start;
}

.code-input {
  flex: 1;
}

.code-btn {
  padding: 24rpx 32rpx;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
  white-space: nowrap;
  min-width: 240rpx;
}

.code-btn.disabled {
  background-color: #bae7ff;
  color: #999;
}

.error-message {
  color: #ff4d4f;
  font-size: 24rpx;
  margin-top: 8rpx;
}

/* 其他样式保持不变 */
.verify-btn {
  width: 100%;
  padding: 24rpx;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
  margin-top: 20rpx;
}

.verify-btn.disabled {
  background-color: #bae7ff;
  color: white;
}

.warning-box {
  background-color: #fff2e8;
  border: 2rpx solid #ffbb96;
  border-radius: 12rpx;
  padding: 32rpx;
  margin-bottom: 40rpx;
}

.warning-title {
  color: #d46b08;
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.warning-content {
  color: #d46b08;
  font-size: 26rpx;
  line-height: 1.6;
}

.user-info {
  background-color: #f9f9f9;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 40rpx;
}

.info-item {
  display: flex;
  margin-bottom: 16rpx;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #666;
  font-size: 28rpx;
  width: 160rpx;
}

.info-value {
  color: #333;
  font-size: 28rpx;
  font-weight: 500;
}

.picker {
  width: 100%;
  padding: 24rpx 32rpx;
  border: 2rpx solid #e8e8e8;
  border-radius: 12rpx;
  background-color: #fff;
}

.picker-text {
  color: #333;
  font-size: 28rpx;
}

.textarea {
  width: 100%;
  padding: 24rpx 32rpx;
  border: 2rpx solid #e8e8e8;
  border-radius: 12rpx;
  font-size: 28rpx;
  background-color: #fff;
  min-height: 200rpx;
}

.actions {
  display: flex;
  gap: 24rpx;
  margin-top: 60rpx;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  padding: 24rpx;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666;
}

.confirm-btn {
  background-color: #ff4d4f;
  color: white;
}

.success-message {
  text-align: center;
  padding: 80rpx 0;
}

.success-icon {
  font-size: 96rpx;
  color: #52c41a;
  margin-bottom: 32rpx;
}

.success-title {
  color: #333;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.success-desc {
  color: #666;
  font-size: 28rpx;
  margin-bottom: 60rpx;
}

.complete-btn {
  width: 100%;
  padding: 24rpx;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
}
</style>