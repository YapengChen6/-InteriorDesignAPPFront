<template>
	<view class="design-order-container">
		<!-- 页面头部 -->
		<view class="page-header">
			<view class="header-left" @click="goBack">
				<text class="back-icon">‹</text>
				<text class="back-text">返回</text>
			</view>
			<view class="header-title">设计订单</view>
			<view class="header-right"></view>
		</view>

		<scroll-view class="scroll-content" scroll-y="true">
			<!-- 发布人信息 -->
			<view class="info-card">
				<view class="card-header">
					<text class="card-title">发布人信息</text>
				</view>
				<view class="card-content">
					<view class="user-info">
						<view class="user-avatar">
							<image 
								:src="publisherInfo.avatar || '/static/images/default-avatar.png'" 
								class="avatar-image" 
								mode="aspectFill"
							/>
						</view>
						<view class="user-details">
							<text class="user-name">{{ publisherInfo.name || '未设置姓名' }}</text>
							<text class="user-phone" v-if="publisherInfo.phone">电话：{{ publisherInfo.phone }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 项目基本信息 -->
			<view class="info-card">
				<view class="card-header">
					<text class="card-title">项目信息</text>
				</view>
				<view class="card-content">
					<view class="info-item">
						<text class="info-label">项目名称：</text>
						<text class="info-value">{{ projectDetail.title || '加载中...' }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">项目描述：</text>
						<text class="info-value">{{ projectDetail.description || '暂无描述' }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">项目地址：</text>
						<text class="info-value">{{ projectDetail.address || '未指定地区' }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">所需角色：</text>
						<text class="info-value">{{ getRoleText(projectDetail.requiredRoles) }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">项目预算：</text>
						<text class="info-value">{{ formatBudget(projectDetail.budget) }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">项目面积：</text>
						<text class="info-value">{{ projectDetail.area || '未指定' }}㎡</text>
					</view>
					<view class="info-item">
						<text class="info-label">截止时间：</text>
						<text class="info-value">{{ formatDate(projectDetail.deadline) }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">项目状态：</text>
						<text class="info-value">{{ getStatusText(projectDetail.status) }}</text>
					</view>
					<view class="info-item" v-if="projectDetail.remark">
						<text class="info-label">备注：</text>
						<text class="info-value">{{ projectDetail.remark }}</text>
					</view>
				</view>
			</view>

			<!-- 订单详情表单 -->
			<view class="info-card">
				<view class="card-header">
					<text class="card-title">订单详情</text>
				</view>
				<view class="card-content">
					<!-- 预计完成时间 -->
					<view class="form-item">
						<text class="form-label">预计完成时间</text>
						<picker 
							mode="date" 
							:value="orderForm.expectedEndTime" 
							@change="onDateChange"
							:start="minDate"
							:end="maxDate"
						>
							<view class="picker-input">
								<text class="picker-text" :class="{'placeholder': !orderForm.expectedEndTime}">
									{{ orderForm.expectedEndTime || '请选择预计完成时间' }}
								</text>
								<text class="picker-arrow">▼</text>
							</view>
						</picker>
					</view>

					<!-- 订单金额 -->
					<view class="form-item">
						<text class="form-label">订单金额</text>
						<view class="amount-input-wrapper">
							<text class="amount-symbol">¥</text>
							<input 
								class="form-input amount-input" 
								v-model="orderForm.totalAmount" 
								placeholder="0.00"
								placeholder-class="placeholder"
								type="digit"
								@input="onAmountInput"
							/>
						</view>
						<view class="form-tip" v-if="projectDetail.budget">
							项目预算参考：{{ formatBudget(projectDetail.budget) }}
						</view>
					</view>

					<!-- 备注信息 -->
					<view class="form-item">
						<text class="form-label">备注信息</text>
						<textarea 
							class="form-textarea" 
							v-model="orderForm.remark" 
							placeholder="请输入备注信息（可选）"
							placeholder-class="placeholder"
							maxlength="200"
						/>
						<view class="textarea-counter">{{ getRemarkLength }}/200</view>
					</view>
				</view>
			</view>

			<!-- 服务条款 -->
			<view class="info-card">
				<view class="card-header">
					<text class="card-title">服务条款</text>
				</view>
				<view class="card-content">
					<view class="terms-content">
						<text class="terms-text">
							1. 设计师需按照约定时间完成设计工作\n
							2. 设计费用包含初步设计和两次修改\n
							3. 如需额外修改，双方需另行协商\n
							4. 设计成果知识产权归客户所有\n
							5. 双方需遵守平台服务协议
						</text>
					</view>
					<view class="agree-item">
						<label class="agree-checkbox" @click="toggleAgree">
							<view class="checkbox-icon" :class="{'checked': orderForm.agreed}">
								<text v-if="orderForm.agreed" class="checkmark">✓</text>
							</view>
							<text class="agree-text">我已阅读并同意以上服务条款</text>
						</label>
					</view>
				</view>
			</view>

			<!-- 底部安全区域 -->
			<view class="safe-area"></view>
		</scroll-view>

		<!-- 底部提交按钮 -->
		<view class="bottom-actions">
			<button class="submit-btn" :class="{'disabled': !canSubmit}" @click="submitOrder">
				<text class="submit-text">提交订单</text>
			</button>
		</view>

		<!-- 加载状态 -->
		<view class="loading-state" v-if="loading">
			<text class="loading-text">加载中...</text>
		</view>

		<!-- 错误状态 -->
		<view class="error-state" v-if="error">
			<text class="error-icon">😕</text>
			<text class="error-text">加载失败</text>
			<text class="error-desc">{{ errorMessage }}</text>
			<button class="retry-btn" @click="loadProjectDetail">重新加载</button>
		</view>
	</view>
</template>

<script>
import { projectService } from '@/api/project.js'
import { getUserProfile } from '@/api/users.js'
import { orderService } from '@/api/order.js'

export default {
  data() {
    return {
      // 项目ID
      projectId: '',
      
      // 项目详情
      projectDetail: {},
      
      // 发布人信息
      publisherInfo: {
        name: '加载中...',
        avatar: '',
        phone: ''
      },
      
      // 当前用户信息
      currentUser: null,
      
      // 订单表单
      orderForm: {
        expectedEndTime: '',
        totalAmount: '',
        remark: '',
        agreed: false
      },
      
      // 日期选择范围
      minDate: this.getCurrentDate(),
      maxDate: this.getMaxDate(),
      
      // 加载状态
      loading: false,
      error: false,
      errorMessage: '',
      
      // 状态映射
      statusMap: {
        '0': '待审核',
        '1': '招标中',
        '2': '进行中',
        '3': '已完成',
        '4': '已取消'
      },
      
      // 角色映射
      roleMap: {
        1: '设计师',
        2: '施工队',
        3: '设计+施工'
      }
    }
  },
  
  computed: {
    // 检查是否可以提交
    canSubmit() {
      return (
        this.orderForm.expectedEndTime &&
        this.orderForm.totalAmount &&
        this.orderForm.agreed &&
        this.currentUser
      )
    },
    
    // 安全获取备注长度
    getRemarkLength() {
      return this.orderForm.remark ? this.orderForm.remark.length : 0
    }
  },
  
  onLoad(options) {
    if (options.projectId) {
      this.projectId = options.projectId
      this.loadCurrentUser()
      this.loadProjectDetail()
    } else {
      this.error = true
      this.errorMessage = '项目ID不存在'
    }
  },
  
  methods: {
    // 加载当前用户信息
    async loadCurrentUser() {
      try {
        // 这里需要根据你的用户管理方式获取当前用户信息
        const userInfo = uni.getStorageSync('userInfo')
        if (userInfo && userInfo.userId) {
          this.currentUser = userInfo
          console.log('当前用户信息:', this.currentUser)
        } else {
          console.warn('未获取到当前用户信息')
          // 可以跳转到登录页面
          uni.showModal({
            title: '提示',
            content: '请先登录',
            success: (res) => {
              if (res.confirm) {
                uni.navigateTo({
                  url: '/pages/login/login'
                })
              } else {
                uni.navigateBack()
              }
            }
          })
        }
      } catch (error) {
        console.error('加载用户信息失败:', error)
      }
    },
    
    // 加载项目详情
    async loadProjectDetail() {
      this.loading = true
      this.error = false
      
      try {
        console.log('开始加载项目详情，项目ID:', this.projectId)
        
        const result = await projectService.getProjectDetail(this.projectId)
        console.log('项目详情接口返回:', result)
        
        // 直接使用返回的项目对象，不需要从data数组中获取
        if (result && result.projectId) {
          this.projectDetail = result
          console.log('解析后的项目详情:', this.projectDetail)
          
          // 从项目数据中获取发布人ID并加载发布人信息
          if (this.projectDetail.userId) {
            console.log('从项目获取发布人ID:', this.projectDetail.userId)
            await this.loadPublisherInfo(this.projectDetail.userId)
          } else {
            console.warn('项目数据中没有找到userId')
            this.publisherInfo.name = '匿名用户'
          }
          
        } else {
          throw new Error('项目不存在或已被删除')
        }
        
      } catch (error) {
        console.error('加载项目详情失败:', error)
        this.error = true
        this.errorMessage = error.message || '加载失败，请重试'
        uni.showToast({
          title: this.errorMessage,
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    // 加载发布人信息
    async loadPublisherInfo(userId) {
      try {
        if (userId) {
          console.log('开始加载发布人信息，用户ID:', userId)
          const result = await getUserProfile(userId)
          console.log('发布人信息接口返回:', result)
          
          // 根据实际接口返回结构调整
          if (result) {
            // 如果返回有data字段
            if (result.data) {
              this.publisherInfo = {
                name: result.data.name || result.data.nickname || '匿名用户',
                avatar: result.data.avatar || '',
                phone: result.data.phone || result.data.mobile || ''
              }
            } 
            // 如果直接返回用户信息
            else if (result.name || result.nickname) {
              this.publisherInfo = {
                name: result.name || result.nickname || '匿名用户',
                avatar: result.avatar || '',
                phone: result.phone || result.mobile || ''
              }
            }
            // 如果返回格式不符合预期
            else {
              console.warn('发布人信息接口返回数据格式不正确:', result)
              this.publisherInfo.name = '匿名用户'
            }
            console.log('设置发布人信息:', this.publisherInfo)
          } else {
            console.warn('发布人信息接口返回空数据')
            this.publisherInfo.name = '匿名用户'
          }
        } else {
          console.warn('未找到发布人ID')
          this.publisherInfo.name = '匿名用户'
        }
      } catch (error) {
        console.error('加载发布人信息失败:', error)
        this.publisherInfo.name = '匿名用户'
      }
    },
    
    // 日期选择变化
    onDateChange(e) {
      this.orderForm.expectedEndTime = e.detail.value
    },
    
    // 金额输入处理
    onAmountInput(e) {
      let value = e.detail.value
      // 限制只能输入数字和小数点
      value = value.replace(/[^\d.]/g, '')
      // 限制小数点后两位
      if (value.includes('.')) {
        const parts = value.split('.')
        if (parts[1].length > 2) {
          value = parts[0] + '.' + parts[1].substring(0, 2)
        }
      }
      this.orderForm.totalAmount = value
    },
    
    // 切换同意条款
    toggleAgree() {
      this.orderForm.agreed = !this.orderForm.agreed
    },
    
    // 提交订单
    async submitOrder() {
      if (!this.canSubmit) {
        uni.showToast({
          title: '请填写完整信息并同意服务条款',
          icon: 'none'
        })
        return
      }

      // 添加数据验证
      const amount = parseFloat(this.orderForm.totalAmount)
      if (isNaN(amount) || amount <= 0) {
        uni.showToast({
          title: '请输入有效的订单金额',
          icon: 'none'
        })
        return
      }

      // 验证日期
      if (!this.orderForm.expectedEndTime) {
        uni.showToast({
          title: '请选择预计完成时间',
          icon: 'none'
        })
        return
      }

      const selectedDate = new Date(this.orderForm.expectedEndTime)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate <= today) {
        uni.showToast({
          title: '预计完成时间必须大于今天',
          icon: 'none'
        })
        return
      }

      try {
        this.loading = true
        
        // 修复：将日期转换为 ISO 格式（后端期望的格式）
        const expectedEndTime = this.orderForm.expectedEndTime 
          ? `${this.orderForm.expectedEndTime}T23:59:59.000Z`  // ISO 格式
          : ''
        
        // 构建订单数据 - 对应后端OrderDTO字段
        const orderData = {
          projectId: this.projectId,
          userId: this.projectDetail.userId, // 客户用户ID（发布人）
          type: 1, // 设计订单
          expectedEndTime: expectedEndTime, // 使用 ISO 格式
          totalAmount: amount,
          remark: this.orderForm.remark || ''
        }
        
        console.log('提交订单数据:', orderData)
        
        // 调用创建订单接口
        const result = await orderService.createDesignOrder(orderData)
        
        console.log('创建订单成功:', result)
        
        uni.showToast({
          title: '订单创建成功',
          icon: 'success',
          duration: 2000
        })
        
        // 延迟返回上一页
        setTimeout(() => {
          uni.navigateBack({
            delta: 2 // 返回两级页面（项目详情页和项目列表页）
          })
        }, 1500)
        
      } catch (error) {
        console.error('创建订单失败:', error)
        uni.showToast({
          title: error.message || '创建订单失败，请重试',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    // 返回上一页
    goBack() {
      uni.navigateBack()
    },
    
    // 获取角色文本
    getRoleText(role) {
      return this.roleMap[role] || '未知角色'
    },
    
    // 获取状态文本
    getStatusText(status) {
      return this.statusMap[status] || '未知状态'
    },
    
    // 格式化日期
    formatDate(date) {
      if (!date) return '未设置'
      if (date.includes(' ')) {
        return date.split(' ')[0]
      }
      return date
    },
    
    // 格式化预算
    formatBudget(budget) {
      if (!budget) return '面议'
      if (typeof budget === 'number') {
        if (budget >= 10000) {
          return `¥${(budget / 10000).toFixed(1)}万`
        }
        return `¥${budget}元`
      }
      return `¥${budget}`
    },
    
    // 获取当前日期（YYYY-MM-DD格式）
    getCurrentDate() {
      const now = new Date()
      return now.toISOString().split('T')[0]
    },
    
    // 获取最大日期（当前日期+1年）
    getMaxDate() {
      const now = new Date()
      now.setFullYear(now.getFullYear() + 1)
      return now.toISOString().split('T')[0]
    }
  }
}
</script>

<style scoped>
.design-order-container {
	min-height: 100vh;
	background-color: #f5f5f5;
}

.page-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 30rpx;
	background-color: #fff;
	border-bottom: 1rpx solid #f0f0f0;
	position: sticky;
	top: 0;
	z-index: 100;
}

.header-left {
	display: flex;
	align-items: center;
	flex: 1;
}

.back-icon {
	font-size: 48rpx;
	color: #333;
	margin-right: 10rpx;
}

.back-text {
	font-size: 32rpx;
	color: #333;
}

.header-title {
	flex: 2;
	text-align: center;
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
}

.header-right {
	flex: 1;
}

.scroll-content {
	height: calc(100vh - 200rpx);
	padding-bottom: 140rpx;
}

.info-card {
	background-color: #fff;
	margin: 20rpx 30rpx;
	border-radius: 24rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
	overflow: hidden;
}

.card-header {
	padding: 30rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.card-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.card-content {
	padding: 30rpx;
}

.user-info {
	display: flex;
	align-items: center;
}

.user-avatar {
	width: 120rpx;
	height: 120rpx;
	border-radius: 60rpx;
	overflow: hidden;
	margin-right: 24rpx;
	flex-shrink: 0;
}

.avatar-image {
	width: 100%;
	height: 100%;
}

.user-details {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.user-name {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 8rpx;
}

.user-phone {
	font-size: 24rpx;
	color: #666;
}

.info-item {
	display: flex;
	align-items: flex-start;
	margin-bottom: 24rpx;
	font-size: 28rpx;
}

.info-item:last-child {
	margin-bottom: 0;
}

.info-label {
	color: #666;
	min-width: 160rpx;
	flex-shrink: 0;
}

.info-value {
	color: #333;
	flex: 1;
	line-height: 1.5;
}

.form-item {
	margin-bottom: 40rpx;
}

.form-item:last-child {
	margin-bottom: 0;
}

.form-label {
	display: block;
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
	margin-bottom: 16rpx;
}

.form-input {
	width: 100%;
	height: 80rpx;
	padding: 0 24rpx;
	border: 2rpx solid #e0e0e0;
	border-radius: 12rpx;
	font-size: 28rpx;
	color: #333;
	background-color: #fff;
	box-sizing: border-box;
}

.form-input:focus {
	border-color: #ff6b00;
}

.placeholder {
	color: #999;
}

.amount-input-wrapper {
	position: relative;
	display: flex;
	align-items: center;
}

.amount-symbol {
	position: absolute;
	left: 24rpx;
	font-size: 28rpx;
	color: #333;
	z-index: 1;
}

.amount-input {
	padding-left: 60rpx;
}

.form-tip {
	font-size: 24rpx;
	color: #999;
	margin-top: 8rpx;
}

.picker-input {
	width: 100%;
	height: 80rpx;
	padding: 0 24rpx;
	border: 2rpx solid #e0e0e0;
	border-radius: 12rpx;
	font-size: 28rpx;
	color: #333;
	background-color: #fff;
	display: flex;
	align-items: center;
	justify-content: space-between;
	box-sizing: border-box;
}

.picker-text {
	flex: 1;
}

.picker-arrow {
	color: #999;
	font-size: 24rpx;
}

.form-textarea {
	width: 100%;
	height: 200rpx;
	padding: 24rpx;
	border: 2rpx solid #e0e0e0;
	border-radius: 12rpx;
	font-size: 28rpx;
	color: #333;
	background-color: #fff;
	box-sizing: border-box;
	line-height: 1.5;
}

.textarea-counter {
	text-align: right;
	font-size: 24rpx;
	color: #999;
	margin-top: 8rpx;
}

.terms-content {
	background-color: #f8f9fa;
	padding: 24rpx;
	border-radius: 8rpx;
	margin-bottom: 30rpx;
}

.terms-text {
	font-size: 24rpx;
	color: #666;
	line-height: 1.6;
	white-space: pre-line;
}

.agree-item {
	display: flex;
	align-items: center;
}

.agree-checkbox {
	display: flex;
	align-items: center;
}

.checkbox-icon {
	width: 36rpx;
	height: 36rpx;
	border: 2rpx solid #e0e0e0;
	border-radius: 6rpx;
	margin-right: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.checkbox-icon.checked {
	background-color: #ff6b00;
	border-color: #ff6b00;
}

.checkmark {
	color: #fff;
	font-size: 24rpx;
	font-weight: bold;
}

.agree-text {
	font-size: 26rpx;
	color: #333;
}

.bottom-actions {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background-color: #ffffff;
	padding: 20rpx 30rpx;
	border-top: 2rpx solid #e0e0e0;
	box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.1);
	z-index: 999;
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

.submit-btn {
	width: 100%;
	height: 88rpx;
	background-color: #ff6b00;
	color: white;
	border: none;
	border-radius: 12rpx;
	font-size: 32rpx;
	font-weight: 600;
}

.submit-btn.disabled {
	background-color: #ccc;
	color: #999;
}

.submit-text {
	font-size: 32rpx;
	font-weight: 600;
}

.safe-area {
	height: 40rpx;
}

.loading-state {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 120rpx 40rpx;
}

.loading-text {
	font-size: 28rpx;
	color: #999;
}

.error-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 160rpx 40rpx;
	text-align: center;
}

.error-icon {
	font-size: 128rpx;
	margin-bottom: 40rpx;
}

.error-text {
	font-size: 32rpx;
	color: #666;
	margin-bottom: 16rpx;
}

.error-desc {
	font-size: 28rpx;
	color: #999;
	margin-bottom: 40rpx;
}

.retry-btn {
	background-color: #ff6b00;
	color: white;
	border: none;
	border-radius: 16rpx;
	padding: 20rpx 40rpx;
	font-size: 28rpx;
}
</style>