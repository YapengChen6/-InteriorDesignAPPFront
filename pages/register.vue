<template>	
	<view class="login-container">
		<view class="login-card">
			<view class="login-title">欢迎登录入住</view>
			
			<view class="login-form">
				<!-- 手机号输入 -->
				<view class="form-group">
					<text class="form-label">手机号</text>
					<view class="input-wrapper" :class="{ 'focused': phoneFocused, 'error': phoneError }">
						<uni-easyinput
							ref="phoneInput"
							v-model="form.phoneNumber"
							type="number"
							placeholder="请输入11位手机号"
							maxlength="11"
							:inputBorder="false"
							:styles="inputStyles"
							@focus="handlePhoneFocus"
							@blur="handlePhoneBlur"
							@input="clearPhoneError"
						/>
					</view>
					<view v-if="phoneError" class="error-message">{{ phoneError }}</view>
				</view>

				<!-- 验证码输入 -->
				<view class="form-group">
					<text class="form-label">验证码</text>
					<view class="code-input-group">
						<view class="input-wrapper" :class="{ 'focused': codeFocused, 'error': codeError }">
							<uni-easyinput
								ref="codeInput"
								v-model="form.verificationCode"
								type="number"
								placeholder="请输入6位验证码"
								maxlength="6"
								:inputBorder="false"
								:styles="inputStyles"
								@focus="handleCodeFocus"
								@blur="handleCodeBlur"
								@input="clearCodeError"
								class="code-input"
							/>
						</view>
						<button
							@click="getVerificationCode"
							class="code-btn"
							:class="{ 'disabled': isGettingCode || countdown > 0 }"
						>
							<text v-if="isGettingCode && countdown === 0">发送中...</text>
							<text v-else-if="countdown > 0">{{ countdown }}秒后重新获取</text>
							<text v-else>获取验证码</text>
						</button>
					</view>
					<view v-if="codeError" class="error-message">{{ codeError }}</view>
					<!-- 添加验证码失效提示 -->
					<view v-if="countdown > 0 && countdown <= 30" class="code-expire-warning">
						<text class="warning-icon">⚠️</text>
						<text class="warning-text">验证码即将在{{ countdown }}秒后失效</text>
					</view>
				</view>

				<!-- 用户协议和隐私政策 -->
				<view class="agreement-container">
					<view class="agreement-checkbox" @click="toggleAgreement">
						<view class="checkbox-icon" :class="{ 'checked': isAgreementChecked }">
							<text v-if="isAgreementChecked" class="checkmark">✓</text>
						</view>
						<text class="agreement-text">我已阅读并同意</text>
						<text class="agreement-link" @click.stop="showUserAgreement">《用户协议》</text>
						<text class="agreement-text">和</text>
						<text class="agreement-link" @click.stop="showPrivacyPolicy">《隐私政策》</text>
					</view>
					<view v-if="agreementError" class="error-message agreement-error">
						{{ agreementError }}
					</view>
				</view>

				<!-- 登录按钮 -->
				<button
					@click="handleLogin"
					class="login-btn"
					:class="{ 'disabled': isLogging || !isAgreementChecked }"
				>
					<text v-if="isLogging">登录中...</text>
					<text v-else>登录</text>
				</button>
			</view>
		</view>
	</view>
</template>

<script>
import { login, sendCode, getUserInfo, getRouters } from '@/api/login.js'

export default {
  data() {
    return {
      form: {
        phoneNumber: '',
        verificationCode: ''
      },
      countdown: 0,
      phoneError: '',
      codeError: '',
      agreementError: '',
      isGettingCode: false,
      isLogging: false,
      isAgreementChecked: false,
      timer: null,
      codeExpireTime: 120,
      codeSentTime: null,
      phoneFocused: false,
      codeFocused: false,
      inputStyles: {
        color: '#333',
        borderColor: 'transparent', // 设置为透明，由外层容器控制边框
        borderWidth: '0',
        borderStyle: 'solid',
        borderRadius: '16rpx',
        backgroundColor: 'transparent', // 设置为透明
        padding: '24rpx 32rpx'
      }
    }
  },

  computed: {
    isPhoneValid() {
      const phoneRegex = /^1[3-9]\d{9}$/
      return phoneRegex.test(this.form.phoneNumber)
    },

    isCodeExpired() {
      if (!this.codeSentTime) return false
      const currentTime = Date.now()
      const elapsedTime = Math.floor((currentTime - this.codeSentTime) / 1000)
      return elapsedTime >= this.codeExpireTime
    }
  },

  methods: {
    // 手机号输入框焦点事件
    handlePhoneFocus() {
      this.phoneFocused = true
    },

    handlePhoneBlur() {
      this.phoneFocused = false
      this.validatePhone()
    },

    // 验证码输入框焦点事件
    handleCodeFocus() {
      this.codeFocused = true
    },

    handleCodeBlur() {
      this.codeFocused = false
      this.validateCode()
    },

    validatePhone() {
      if (!this.form.phoneNumber.trim()) {
        this.phoneError = '请输入手机号'
        return false
      } else if (!this.isPhoneValid) {
        this.phoneError = '手机号格式不正确'
        return false
      } else {
        this.phoneError = ''
        return true
      }
    },

    validateCode() {
      if (!this.form.verificationCode.trim()) {
        this.codeError = '请输入验证码'
        return false
      } else if (this.form.verificationCode.length !== 6) {
        this.codeError = '验证码必须是6位数字'
        return false
      } else {
        this.codeError = ''
        return true
      }
    },

    clearPhoneError() {
      if (this.phoneError) {
        this.phoneError = ''
      }
    },

    clearCodeError() {
      if (this.codeError) {
        this.codeError = ''
      }
    },

    // 切换协议勾选状态
    toggleAgreement() {
      this.isAgreementChecked = !this.isAgreementChecked
      if (this.isAgreementChecked && this.agreementError) {
        this.agreementError = ''
      }
    },

    // 验证协议是否勾选
    validateAgreement() {
      if (!this.isAgreementChecked) {
        this.agreementError = '请先阅读并同意用户协议和隐私政策'
        return false
      }
      this.agreementError = ''
      return true
    },

    // 显示用户协议
    showUserAgreement() {
      uni.showModal({
        title: '用户协议',
        content: '请仔细阅读用户协议内容，了解您的权利和义务。',
        showCancel: false,
        confirmText: '我知道了',
        confirmColor: '#007aff'
      })
    },

    // 显示隐私政策
    showPrivacyPolicy() {
      uni.showModal({
        title: '隐私政策',
        content: '请仔细阅读隐私政策，了解我们如何收集、使用和保护您的个人信息。',
        showCancel: false,
        confirmText: '我知道了',
        confirmColor: '#007aff'
      })
    },

    async getVerificationCode() {
      if (!this.validateAgreement()) {
        return
      }

      if (!this.validatePhone()) {
        this.phoneError = '请输入正确的手机号'
        this.$nextTick(() => {
          const phoneInput = this.$refs.phoneInput
          if (phoneInput && phoneInput.focus) {
            phoneInput.focus()
          }
        })
        return
      }

      if (this.isGettingCode || this.countdown > 0) {
        return
      }

      try {
        this.isGettingCode = true
        
        const response = await sendCode(this.form.phoneNumber)
        
        if (response.code === 200) {
          this.codeSentTime = Date.now()
          this.startCountdown()
          
          uni.showToast({
            title: '验证码发送成功，有效期2分钟',
            icon: 'success',
            duration: 2000
          })
          
          if (process.env.NODE_ENV === 'development') {
            console.log('验证码接口调用成功，手机号:', this.form.phoneNumber)
            console.log('验证码发送时间:', new Date(this.codeSentTime).toLocaleString())
          }
        } else {
          throw new Error(response.msg || response.message || '发送失败')
        }

      } catch (error) {
        console.error('获取验证码失败:', error)
        let errorMessage = '获取失败，请重试'
        
        if (error && error.message) {
          if (error.message.includes('网络') || error.message.includes('请求失败')) {
            errorMessage = '网络异常，请检查网络连接'
          } else {
            errorMessage = error.message
          }
        } else if (typeof error === 'string') {
          errorMessage = error
        }
        
        uni.showToast({
          title: errorMessage,
          icon: 'none'
        })
      } finally {
        this.isGettingCode = false
      }
    },

    startCountdown() {
      this.countdown = this.codeExpireTime
      if (this.timer) {
        clearInterval(this.timer)
      }
      this.timer = setInterval(() => {
        this.countdown--
        
        if (this.countdown <= 0) {
          clearInterval(this.timer)
          this.timer = null
          if (this.form.verificationCode) {
            uni.showToast({
              title: '验证码已过期，请重新获取',
              icon: 'none',
              duration: 2000
            })
          }
        }
      }, 1000)
    },

    // 检查验证码是否过期
    checkCodeExpiry() {
      if (this.isCodeExpired && this.form.verificationCode) {
        this.codeError = '验证码已过期，请重新获取'
        return false
      }
      return true
    },

    // 获取用户信息
    async fetchUserInfo() {
      try {
        const response = await getUserInfo()
        if (response.code === 200) {
          const userInfo = response.data
          uni.setStorageSync('userInfo', userInfo)
          console.log('用户信息获取成功:', userInfo)
          return userInfo
        } else {
          throw new Error(response.msg || '获取用户信息失败')
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        throw error
      }
    },

    // 获取用户路由
    async fetchUserRouters() {
      try {
        const response = await getRouters()
        if (response.code === 200) {
          const routers = response.data
          uni.setStorageSync('userRouters', routers)
          console.log('路由信息获取成功:', routers)
          return routers
        } else {
          throw new Error(response.msg || '获取路由信息失败')
        }
      } catch (error) {
        console.error('获取路由信息失败:', error)
        throw error
      }
    },

    async handleLogin() {
      if (this.isLogging) {
        return
      }

      if (!this.validateAgreement()) {
        return
      }

      if (!this.form.phoneNumber.trim()) {
        this.phoneError = '请输入手机号'
        this.$nextTick(() => {
          const phoneInput = this.$refs.phoneInput
          if (phoneInput && phoneInput.focus) {
            phoneInput.focus()
          }
        })
        return
      }

      if (!this.form.verificationCode.trim()) {
        this.codeError = '请输入验证码'
        this.$nextTick(() => {
          const codeInput = this.$refs.codeInput
          if (codeInput && codeInput.focus) {
            codeInput.focus()
          }
        })
        return
      }

      if (!this.validatePhone()) return
      
      if (!this.validateCode()) {
        return
      }

      if (!this.checkCodeExpiry()) {
        return
      }

      try {
        this.isLogging = true
        
        const loginForm = {
          phone: this.form.phoneNumber.toString(),
          code: this.form.verificationCode.toString()
        }
        
        console.log('开始登录，参数:', loginForm)
        
        const loginResponse = await login(loginForm)
        
        console.log('登录接口响应:', loginResponse)
        
        if (loginResponse.code === 200) {
          const token = loginResponse.data
          if (!token) {
            throw new Error('登录失败：未获取到token')
          }
          
          uni.setStorageSync('token', token)
          console.log('token存储成功:', token)
          
          try {
            await this.fetchUserInfo()
          } catch (userInfoError) {
            console.warn('获取用户信息失败，但继续流程:', userInfoError)
          }
          
          try {
            await this.fetchUserRouters()
          } catch (routerError) {
            console.warn('获取路由信息失败，但继续流程:', routerError)
          }
          
          uni.showToast({
            title: '登录成功',
            icon: 'success',
            duration: 2000
          })
          
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/index'
            })
          }, 1500)
          
        } else {
          let errorMsg = loginResponse.msg || loginResponse.message || `登录失败，错误码: ${loginResponse.code}`
          
          if (loginResponse.code === 404 || errorMsg.includes('不存在') || errorMsg.includes('未注册') || errorMsg.includes('未找到')) {
            errorMsg = '手机号不存在'
            this.phoneError = errorMsg
            this.$nextTick(() => {
              const phoneInput = this.$refs.phoneInput
              if (phoneInput && phoneInput.focus) {
                phoneInput.focus()
              }
            })
          } else if (loginResponse.code === 401) {
            errorMsg = '验证码错误或已过期'
            this.codeError = errorMsg
          } else if (loginResponse.code === 400) {
            errorMsg = '参数错误，请检查手机号和验证码格式'
            this.codeError = '手机号或验证码格式错误'
          } else if (loginResponse.code === 500) {
            errorMsg = '服务器错误，请稍后重试'
          }
          
          console.error('登录接口返回错误:', loginResponse)
          throw new Error(errorMsg)
        }

      } catch (error) {
        console.error('登录失败:', error)
        let errorMessage = '登录失败，请重试'
        
        if (error && error.message) {
          if (error.message.includes('手机号不存在')) {
            errorMessage = '手机号不存在'
            this.phoneError = errorMessage
            this.$nextTick(() => {
              const phoneInput = this.$refs.phoneInput
              if (phoneInput && phoneInput.focus) {
                phoneInput.focus()
              }
            })
          } else if (error.message.includes('会话') || error.message.includes('过期') || error.message.includes('验证码已过期')) {
            errorMessage = '验证码已过期，请重新获取验证码'
            this.codeError = errorMessage
            this.form.verificationCode = ''
            this.countdown = 0
            if (this.timer) {
              clearInterval(this.timer)
              this.timer = null
            }
          } else if (error.message.includes('验证码') || error.message.includes('密码') || error.message.includes('参数')) {
            this.codeError = error.message
            errorMessage = error.message
          } else if (error.message.includes('网络') || error.message.includes('请求失败')) {
            errorMessage = '网络异常，请检查网络连接'
          } else if (error.message.includes('400')) {
            errorMessage = '手机号或验证码格式错误，请检查后重试'
            this.codeError = '格式错误'
          } else {
            errorMessage = error.message
          }
        } else if (typeof error === 'string') {
          errorMessage = error
        }
        
        uni.showToast({
          title: errorMessage,
          icon: 'none',
          duration: 3000
        })
      } finally {
        this.isLogging = false
      }
    }
  },

  onUnload() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },

  onShow() {
    if (this.codeSentTime && this.isCodeExpired && this.countdown > 0) {
      this.countdown = 0
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
      if (this.form.verificationCode) {
        this.codeError = '验证码已过期，请重新获取'
      }
    }
  }
}
</script>

<style scoped>
.login-container {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #f5f5f5;
	padding: 40rpx;
}

.login-card {
	background: white;
	padding: 80rpx;
	border-radius: 24rpx;
	box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.2);
	width: 100%;
	max-width: 600rpx;
}

.login-title {
	text-align: center;
	margin-bottom: 60rpx;
	color: #333;
	font-size: 48rpx;
	font-weight: 600;
}

.form-group {
	margin-bottom: 48rpx;
}

.form-label {
	display: block;
	margin-bottom: 16rpx;
	color: #333;
	font-weight: 500;
	font-size: 28rpx;
}

/* 输入框外层容器 */
.input-wrapper {
	border: 2rpx solid #e1e5e9;
	border-radius: 16rpx;
	background-color: #f8f9fa;
	transition: all 0.3s ease;
	overflow: hidden;
}

.input-wrapper.focused {
	border-color: #007aff;
}

.input-wrapper.error {
	border-color: #ff3b30;
}

/* uni-easyinput 样式调整 */
.uni-easyinput__content {
	border: none !important;
	background-color: transparent !important;
}

.uni-easyinput__content-input {
	padding: 24rpx 32rpx !important;
	font-size: 32rpx !important;
	background-color: transparent !important;
}

.code-input-group {
	display: flex;
	align-items: center;
	gap: 24rpx;
}

.code-input {
	flex: 1;
}

.code-btn {
	padding: 24rpx 32rpx;
	background: #ffffff;
	color: #007aff;
	border: 2rpx solid #e1e5e9;
	border-radius: 16rpx;
	white-space: nowrap;
	font-size: 28rpx;
	font-weight: 500;
	transition: all 0.3s ease;
	min-width: 240rpx;
	height: 96rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.code-btn:active {
	background: #007aff;
	color: #ffffff;
	transform: translateY(-2rpx);
	border-color: #007aff;
}

.code-btn.disabled {
	background: #f8f9fa;
	color: #c0c0c0;
	border-color: #e1e5e9;
	transform: none;
}

.login-btn {
	width: 100%;
	padding: 28rpx;
	background: #007aff;
	color: white;
	border: none;
	border-radius: 16rpx;
	font-size: 32rpx;
	font-weight: 600;
	transition: all 0.3s ease;
	margin-top: 20rpx;
	margin-bottom: 40rpx;
}

.login-btn:active {
	background: #0056b3;
	transform: translateY(-2rpx);
}

.login-btn.disabled {
	background: #ccc;
	transform: none;
}

.error-message {
	color: #ff3b30;
	font-size: 24rpx;
	margin-top: 12rpx;
	display: flex;
	align-items: center;
}

.error-message::before {
	content: "!";
	display: inline-block;
	width: 32rpx;
	height: 32rpx;
	background: #ff3b30;
	color: white;
	border-radius: 50%;
	text-align: center;
	line-height: 32rpx;
	font-size: 24rpx;
	margin-right: 8rpx;
}

/* 验证码失效警告样式 */
.code-expire-warning {
	display: flex;
	align-items: center;
	margin-top: 12rpx;
	padding: 16rpx 20rpx;
	background: #fff8e6;
	border: 1rpx solid #ffd666;
	border-radius: 12rpx;
	color: #d48806;
	font-size: 24rpx;
}

.warning-icon {
	margin-right: 12rpx;
	font-size: 28rpx;
}

.warning-text {
	flex: 1;
}

/* 用户协议样式 */
.agreement-container {
	margin: 40rpx 0;
	padding: 0;
}

.agreement-checkbox {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	padding: 20rpx 0;
	cursor: pointer;
}

.checkbox-icon {
	width: 36rpx;
	height: 36rpx;
	border: 2rpx solid #ccc;
	border-radius: 6rpx;
	margin-right: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s ease;
}

.checkbox-icon.checked {
	background: #007aff;
	border-color: #007aff;
}

.checkmark {
	color: white;
	font-size: 24rpx;
	font-weight: bold;
}

.agreement-text {
	color: #666;
	font-size: 26rpx;
	margin-right: 8rpx;
}

.agreement-link {
	color: #007aff;
	font-size: 26rpx;
}

.agreement-link:active {
	color: #0056b3;
}

.agreement-error {
	margin-top: 16rpx;
}

/* 响应式设计 */
@media (max-width: 480px) {
	.login-card {
		padding: 60rpx 40rpx;
		margin: 20rpx;
	}
	
	.code-input-group {
		flex-direction: row;
	}
	
	.code-btn {
		width: auto;
		min-width: 240rpx;
	}
	
	.agreement-checkbox {
		flex-direction: row;
		align-items: flex-start;
	}
	
	.checkbox-icon {
		margin-top: 4rpx;
	}
}

/* 确保输入框内部没有边框 */
::v-deep .uni-easyinput__content {
	border: none !important;
}

::v-deep .uni-easyinput__content-input {
	border: none !important;
	background: transparent !important;
}
</style>