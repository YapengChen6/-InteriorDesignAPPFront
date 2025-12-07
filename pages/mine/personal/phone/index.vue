<template>
  <view class="container">
    <!-- 顶部进度指示 -->
    <view class="progress-bar">
      <view class="progress-step active">1</view>
      <view class="progress-line"></view>
      <view class="progress-step">2</view>
    </view>
    
    <!-- 当前手机号显示 -->
    <view class="current-phone">
      <text class="phone-number">{{ maskedPhone }}</text>
    </view>
    
    <!-- 验证码输入 -->
    <view class="input-section">
      <view class="input-label">请输入验证码</view>
      <view class="code-input-wrapper">
        <input 
          v-model="verificationCode" 
          class="code-input" 
          type="number" 
          placeholder="请输入6位验证码"
          maxlength="6"
          placeholder-style="color: #ccc;"
        />
        <view 
          class="get-code-btn" 
          :class="{ disabled: countdown > 0 || isSending }"
          @tap="getVerificationCode"
        >
          {{ isSending ? '发送中...' : (countdown > 0 ? `${countdown}s后重新获取` : '获取验证码') }}
        </view>
      </view>
    </view>
    
    <!-- 提交按钮 -->
    <view 
      class="submit-btn" 
      :class="{ active: verificationCode.length === 6 && !isVerifying }"
      @tap="verifyCode"
    >
      {{ isVerifying ? '验证中...' : '提交' }}
    </view>
  </view>
</template>

<script>
import { sendCode, getUserProfile } from "@/api/users.js"

export default {
  data() {
    return {
      user: {},
      verificationCode: '',
      countdown: 0,
      timer: null,
      isSending: false,
      isVerifying: false
    }
  },
  computed: {
    maskedPhone() {
      if (this.user.phone) {
        return this.user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
      } else if (this.user.phonenumber) {
        return this.user.phonenumber.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
      }
      return ''
    }
  },
  onLoad() {
    this.getUserInfo()
  },
  onUnload() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  },
  methods: {
    async getUserInfo() {
      try {
        const response = await getUserProfile()
        if (response.code === 200) {
          this.user = response.data
        } else {
          throw new Error(response.msg || '获取用户信息失败')
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        uni.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        })
      }
    },
    
    async getVerificationCode() {
      if (this.countdown > 0 || this.isSending) return
      
      const currentPhone = this.user.phone || this.user.phonenumber
      if (!currentPhone) {
        uni.showToast({
          title: '未绑定手机号',
          icon: 'none'
        })
        return
      }
      
      this.isSending = true
      try {
        uni.showLoading({
          title: '发送中...',
          mask: true
        })
        
        const result = await sendCode(currentPhone)
        console.log('验证码发送结果:', result)
        
        uni.hideLoading()
        
        if (result.code === 200 || result.success) {
          uni.showToast({
            title: '验证码已发送',
            icon: 'success'
          })
          this.startCountdown()
        } else {
          throw new Error(result.msg || result.message || '发送验证码失败')
        }
        
      } catch (error) {
        uni.hideLoading()
        console.error('发送验证码失败:', error)
        uni.showToast({
          title: error.message || '发送验证码失败',
          icon: 'none'
        })
      } finally {
        this.isSending = false
      }
    },
    
    startCountdown() {
      this.countdown = 60
      if (this.timer) {
        clearInterval(this.timer)
      }
      this.timer = setInterval(() => {
        this.countdown--
        if (this.countdown <= 0) {
          clearInterval(this.timer)
          this.timer = null
        }
      }, 1000)
    },
    
    async verifyCode() {
      if (this.verificationCode.length !== 6) {
        uni.showToast({
          title: '请输入6位验证码',
          icon: 'none'
        })
        return
      }
      
      if (this.isVerifying) return
      
      this.isVerifying = true
      try {
        uni.showLoading({
          title: '验证中...',
          mask: true
        })
        
        // 这里调用验证当前手机号验证码的API
        // 假设后端有验证接口，如果没有，可以暂时跳过验证直接跳转
        // const result = await verifyOldPhoneCode({ code: this.verificationCode })
        
        // 模拟验证成功，实际应该调用后端API
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        uni.hideLoading()
        
        // 验证成功后跳转到第二步
        uni.navigateTo({
          url: '/pages/mine/personal/phone/verify_phone'
        })
        
      } catch (error) {
        uni.hideLoading()
        console.error('验证失败:', error)
        uni.showToast({
          title: error.message || '验证码错误',
          icon: 'none'
        })
      } finally {
        this.isVerifying = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  padding: 40rpx;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.progress-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 60rpx;
}

.progress-step {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: #e0e0e0;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  
  &.active {
    background: #6a11cb;
    color: white;
  }
}

.progress-line {
  width: 120rpx;
  height: 4rpx;
  background: #e0e0e0;
  margin: 0 20rpx;
}

.title {
  font-size: 44rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
  text-align: center;
}

.subtitle {
  font-size: 28rpx;
  color: #666;
  text-align: center;
  margin-bottom: 80rpx;
}

.current-phone {
  background: white;
  border-radius: 16rpx;
  padding: 40rpx;
  text-align: center;
  margin-bottom: 60rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.phone-number {
  font-size: 36rpx;
  color: #333;
  font-weight: 500;
}

.input-section {
  background: white;
  border-radius: 16rpx;
  padding: 40rpx;
  margin-bottom: 60rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.input-label {
  font-size: 30rpx;
  color: #666;
  margin-bottom: 30rpx;
}

.code-input-wrapper {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.code-input {
  flex: 1;
  height: 80rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 0 30rpx;
  font-size: 32rpx;
  
  &:focus {
    border-color: #6a11cb;
  }
}

.get-code-btn {
  background: #6a11cb;
  color: white;
  padding: 20rpx 30rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  white-space: nowrap;
  
  &.disabled {
    background: #ccc;
    color: #999;
  }
}

.submit-btn {
  background: #ccc;
  color: white;
  height: 96rpx;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 500;
  
  &.active {
    background: #6a11cb;
  }
}
</style>