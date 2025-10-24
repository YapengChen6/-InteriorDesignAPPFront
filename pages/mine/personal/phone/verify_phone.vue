<template>
  <view class="container">
    <!-- 顶部进度指示 -->
    <view class="progress-bar">
      <view class="progress-step">1</view>
      <view class="progress-line"></view>
      <view class="progress-step active">2</view>
    </view>
    
    <view class="title">修改手机号 (2/2)</view>
    <view class="subtitle">请输入新的手机号</view>
    
    <!-- 手机号输入 -->
    <view class="input-section">
      <view class="input-item">
        <view class="input-label">请输入手机号</view>
        <input 
          v-model="newPhone" 
          class="phone-input" 
          type="number" 
          placeholder="请输入新手机号"
          maxlength="11"
          placeholder-style="color: #ccc;"
          @input="onPhoneInput"
        />
      </view>
      
      <view class="input-item">
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
            :class="{ disabled: countdown > 0 || !isPhoneValid || isSending }"
            @tap="handleGetCode"
          >
            {{ isSending ? '发送中...' : (countdown > 0 ? `${countdown}s后重新获取` : '获取验证码') }}
          </view>
        </view>
      </view>
    </view>
    
    <!-- 提交按钮 -->
    <view 
      class="submit-btn" 
      :class="{ active: isFormValid && !isSubmitting }"
      @tap="handleUpdatePhone"
    >
      {{ isSubmitting ? '提交中...' : '提交' }}
    </view>
  </view>
</template>

<script>
import { sendCode, updateUserProfile } from "@/api/users.js"

export default {
  data() {
    return {
      newPhone: '',
      verificationCode: '',
      countdown: 0,
      timer: null,
      isPhoneValid: false,
      isSending: false,
      isSubmitting: false,
      loadingInstance: null
    }
  },
  computed: {
    isFormValid() {
      return this.isPhoneValid && this.verificationCode.length === 6
    }
  },
  onUnload() {
    this.clearTimer()
    this.hideLoading()
  },
  methods: {
    onPhoneInput() {
      this.isPhoneValid = /^1[3-9]\d{9}$/.test(this.newPhone)
    },
    
    // 统一的 loading 管理
    showLoading(title = '加载中...') {
      this.hideLoading() // 先隐藏之前的
      this.loadingInstance = uni.showLoading({
        title,
        mask: true
      })
    },
    
    hideLoading() {
      if (this.loadingInstance) {
        uni.hideLoading()
        this.loadingInstance = null
      }
    },
    
    clearTimer() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },
    
    async handleGetCode() {
      // 防止重复点击
      if (this.countdown > 0 || !this.isPhoneValid || this.isSending) {
        return
      }
      
      this.isSending = true
      this.showLoading('发送中...')
      
      try {
        // 根据你的API调整参数格式
        const params = {
          phone: this.newPhone // 或者 'update_phone'，根据后端要求
        }
        
        const result = await sendCode(this.newPhone)
        console.log('验证码发送结果:', result)
        
        this.hideLoading()
        
        // 根据实际API响应结构调整
        if (result.code === 200 || result.success) {
          uni.showToast({
            title: '验证码已发送',
            icon: 'success',
            duration: 2000
          })
          this.startCountdown()
        } else {
          throw new Error(result.message || '发送验证码失败')
        }
        
      } catch (error) {
        console.error('发送验证码失败:', error)
        this.hideLoading()
        
        let errorMessage = '发送验证码失败'
        if (error.code === 400) {
          errorMessage = '手机号格式错误'
        } else if (error.code === 500) {
          errorMessage = '服务器繁忙，请稍后重试'
        } else if (error.message) {
          errorMessage = error.message
        }
        
        uni.showToast({
          title: errorMessage,
          icon: 'none',
          duration: 3000
        })
      } finally {
        this.isSending = false
      }
    },
    
    startCountdown() {
      this.countdown = 60
      this.clearTimer()
      this.timer = setInterval(() => {
        this.countdown--
        if (this.countdown <= 0) {
          this.clearTimer()
        }
      }, 1000)
    },
    
    async handleUpdatePhone() {
      if (!this.isFormValid || this.isSubmitting) {
        uni.showToast({
          title: '请填写完整信息',
          icon: 'none'
        })
        return
      }
      
      this.isSubmitting = true
      this.showLoading('修改中...')
      
      try {
        // 更新用户信息，根据你的API调整参数
        const updateData = {
          phonenumber: this.newPhone
          // 可能需要其他参数如 token, userId 等
        }
        
        const result = await updateUserProfile(updateData)
        console.log('更新手机号结果:', result)
        
        this.hideLoading()
        
        // 根据实际API响应结构调整
        if (result.code === 200 || result.success) {
          uni.showToast({
            title: '手机号修改成功',
            icon: 'success',
            duration: 2000
          })
          
          // 延迟返回，让用户看到成功提示
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        } else {
          throw new Error(result.message || '修改失败')
        }
        
      } catch (error) {
        console.error('修改手机号失败:', error)
        this.hideLoading()
        
        let errorMessage = '修改失败，请重试'
        if (error.code === 400) {
          errorMessage = '验证码错误或已过期'
        } else if (error.code === 409) {
          errorMessage = '该手机号已被其他账号使用'
        } else if (error.code === 500) {
          errorMessage = '服务器繁忙，请稍后重试'
        } else if (error.message) {
          errorMessage = error.message
        }
        
        uni.showToast({
          title: errorMessage,
          icon: 'none',
          duration: 3000
        })
      } finally {
        this.isSubmitting = false
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

.input-section {
  background: white;
  border-radius: 16rpx;
  padding: 40rpx;
  margin-bottom: 60rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.input-item {
  margin-bottom: 40rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.input-label {
  font-size: 30rpx;
  color: #666;
  margin-bottom: 30rpx;
}

.phone-input {
  height: 80rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 0 30rpx;
  font-size: 32rpx;
  
  &:focus {
    border-color: #6a11cb;
  }
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