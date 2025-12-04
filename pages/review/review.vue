<template>
	<view class="container">
		<!-- 顶部标题栏 -->
		<view class="header-section">
			<view class="header-back" @click="goBack">
				<text class="back-icon">←</text>
				<text class="back-text">返回</text>
			</view>
			<view class="header-title">评价订单</view>
			<view class="header-placeholder"></view>
		</view>

		<!-- 订单信息区域 -->
		<view class="order-info-card" v-if="orderInfo.contractorInfo && orderInfo.contractorInfo.name">
			<view class="card-title">设计师信息</view>
			<view class="designer-info">
				<view class="designer-avatar">
					<image 
						:src="orderInfo.contractorInfo.avatar || '/static/images/default-avatar.png'" 
						mode="aspectFill" 
					/>
				</view>
				<view class="designer-details">
					<text class="designer-name">{{ orderInfo.contractorInfo.name }}</text>
					<text class="designer-role">{{ orderInfo.contractorInfo.role || '设计师' }}</text>
				</view>
			</view>
		</view>

		<!-- 评价内容区域 -->
		<scroll-view class="review-content" scroll-y="true">
			<!-- 评分区域 -->
			<view class="rating-card">
				<view class="card-title">总体评分</view>
				<view class="rating-section">
					<view class="stars-container">
						<text 
							v-for="star in 5" 
							:key="star"
							class="star"
							:class="star <= rating ? 'star-active' : 'star-inactive'"
							@click="setRating(star)"
						>
							⭐
						</text>
					</view>
					<text class="rating-text">{{ ratingText }}</text>
				</view>
			</view>

			<!-- 评价内容 -->
			<view class="content-card">
				<view class="card-title">评价内容</view>
				<textarea 
					class="review-textarea"
					v-model="reviewContent"
					placeholder="请写下您对这次服务的评价，您的评价对其他用户很有帮助..."
					maxlength="500"
					:show-confirm-bar="false"
					@input="onContentInput"
				></textarea>
				<view class="word-count">{{ reviewContent.length }}/500</view>
			</view>

			<!-- 提交按钮 -->
			<view class="submit-section">
				<button 
					class="submit-btn" 
					:class="[!canSubmit ? 'btn-disabled' : '']"
					:disabled="!canSubmit || submitting"
					@click="submitReview"
					:loading="submitting"
				>
					{{ submitting ? '提交中...' : '提交评价' }}
				</button>
			</view>
		</scroll-view>
	</view>
</template>

<script>
import { orderService } from '@/api/order.js'
import { getUserProfile, getUserById } from '@/api/users.js'
import { orderReviewApi } from '@/api/orderReview.js'

export default {
  data() {
    return {
      orderId: null,
      userId: null,
      orderInfo: {
        orderId: null,
        createTime: null,
        totalAmount: 0,
        contractorInfo: {}
      },
      rating: 0,
      reviewContent: '',
      submitting: false,
      hasSubmitted: false // 防止重复提交
    }
  },
  
  computed: {
    ratingText() {
      const texts = ['请评分', '很不满意', '不满意', '一般', '满意', '非常满意']
      return texts[this.rating]
    },
    
    canSubmit() {
      return this.rating > 0 && this.reviewContent.trim().length >= 5 && !this.submitting
    }
  },
  
  onLoad(options) {
    console.log('📝 评价页面参数:', options)
    this.orderId = options.orderId
    this.userId = options.userId
    
    if (!this.orderId) {
      uni.showToast({
        title: '订单ID不能为空',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
      return
    }
    
    // 加载当前用户信息
    this.loadCurrentUser()
  },
  
  onShow() {
    // 页面显示时加载订单信息
    if (this.orderId) {
      this.loadOrderInfo()
    }
  },
  
  methods: {
    // 加载当前用户信息
    async loadCurrentUser() {
      try {
        console.log('👤 开始获取当前用户信息')
        
        // 使用 getUserProfile() 获取当前用户信息
        const result = await getUserProfile()
        
        if (result && result.code === 200) {
          const userData = result.data
          
          // 如果传入的userId为空，使用当前用户的ID
          if (!this.userId) {
            this.userId = userData.userId || userData.id
            console.log('✅ 使用当前用户ID:', this.userId)
          }
          
          // 存储当前用户信息到缓存
          uni.setStorageSync('userInfo', userData)
          
          console.log('👤 当前用户信息:', {
            userId: this.userId,
            userName: userData.userName || userData.name,
            phone: userData.phone
          })
        } else {
          console.warn('⚠️ 获取当前用户信息失败，使用参数中的userId:', this.userId)
        }
      } catch (error) {
        console.error('❌ 获取当前用户信息失败:', error)
        // 使用参数中的userId或从缓存中获取
        if (!this.userId) {
          const cachedUser = uni.getStorageSync('userInfo')
          if (cachedUser && cachedUser.userId) {
            this.userId = cachedUser.userId
            console.log('🔄 从缓存获取用户ID:', this.userId)
          }
        }
      }
    },
    
    async loadOrderInfo() {
      try {
        uni.showLoading({ title: '加载订单信息...' })
        
        console.log('📋 加载订单信息，订单ID:', this.orderId)
        
        // 先获取当前用户的订单列表
        if (!this.userId) {
          throw new Error('用户ID为空，无法查询订单')
        }
        
        // 获取当前用户的订单列表
        const result = await orderService.getOrderListByUserId(this.userId, {
          pageNum: 1,
          pageSize: 100
        })
        
        console.log('✅ 用户订单列表响应:', result)
        
        let orderList = []
        if (Array.isArray(result)) {
          orderList = result
        } else if (result && result.records) {
          orderList = result.records
        } else if (result && result.list) {
          orderList = result.list
        } else if (result && result.data) {
          orderList = result.data.records || result.data.list || []
        }
        
        console.log('📋 解析后的订单列表:', orderList)
        
        // 查找当前订单
        const currentOrder = orderList.find(order => order.orderId == this.orderId)
        
        if (currentOrder) {
          console.log('✅ 找到目标订单:', currentOrder)
          
          this.orderInfo = {
            orderId: currentOrder.orderId,
            createTime: currentOrder.createTime,
            totalAmount: currentOrder.totalAmount || 0,
            contractorId: currentOrder.contractorId
          }
          
          console.log('📝 订单基本信息:', this.orderInfo)
          
          // 获取设计师信息（contractorId）
          if (currentOrder.contractorId) {
            console.log('👨‍🎨 加载设计师信息，ID:', currentOrder.contractorId)
            await this.loadDesignerInfo(currentOrder.contractorId)
          } else {
            console.log('⚠️ 订单没有contractorId')
          }
          
          console.log('✅ 订单信息加载完成')
        } else {
          throw new Error('未找到订单信息')
        }
        
        uni.hideLoading()
        
      } catch (error) {
        uni.hideLoading()
        console.error('❌ 加载订单信息失败:', error)
        this.handleApiError(error, '加载订单信息失败')
      }
    },
    
    async loadDesignerInfo(designerId) {
      try {
        console.log('👨‍🎨 加载设计师信息，ID:', designerId)
        
        // 只能使用 getUserById 方法获取其他用户信息
        const result = await getUserById(designerId)
        console.log('✅ getUserById 原始结果:', result)
        
        if (result && result.code === 200) {
          const userData = result.data
          
          // 根据示例数据结构解析字段
          const designerInfo = {
            name: userData.nickName || userData.name || userData.userName || '',
            avatar: userData.avatar || '/static/images/default-avatar.png',
            phone: userData.phone || userData.userName || '',
            role: '设计师',
            userId: userData.userId
          }
          
          console.log('✅ 解析后的设计师信息:', designerInfo)
          
          // 只有当有姓名时才显示，避免显示"未知用户"
          if (designerInfo.name) {
            this.orderInfo.contractorInfo = designerInfo
          } else {
            console.log('⚠️ 设计师信息不完整，不显示')
            this.orderInfo.contractorInfo = {}
          }
        } else {
          console.warn('⚠️ 获取设计师信息失败，返回结果:', result)
          this.orderInfo.contractorInfo = {}
        }
      } catch (error) {
        console.error('❌ 加载设计师信息失败:', error)
        // 不设置默认值，避免显示"未知用户"
        this.orderInfo.contractorInfo = {}
      }
    },
    
    setRating(score) {
      this.rating = score
      console.log('⭐ 设置评分:', score)
    },
    
    onContentInput(e) {
      // 内容输入时实时验证
      const value = e.detail.value || ''
      if (value.length >= 500) {
        uni.showToast({
          title: '已达到最大字数限制',
          icon: 'none',
          duration: 1500
        })
      }
    },
    
    async submitReview() {
      // 防止重复提交
      if (this.hasSubmitted || this.submitting) {
        return
      }
      
      // 添加更严格的验证
      if (!this.canSubmit) {
        if (this.rating === 0) {
          uni.showToast({
            title: '请先选择评分',
            icon: 'none',
            duration: 2000
          })
        } else if (this.reviewContent.trim().length < 5) {
          uni.showToast({
            title: '评价内容至少5个字',
            icon: 'none',
            duration: 2000
          })
        }
        return
      }
      
      try {
        this.submitting = true
        this.hasSubmitted = true
        
        // 检查必要的参数
        if (!this.userId) {
          throw new Error('用户ID不能为空')
        }
        
        if (!this.orderId) {
          throw new Error('订单ID不能为空')
        }
        
        // 显示加载动画
        uni.showLoading({
          title: '提交中...',
          mask: true
        })
        
        // 只传递后端需要的字段
        const reviewData = {
          orderId: this.orderId,
          reviewerId: this.userId,
          rating: this.rating,
          content: this.reviewContent.trim()
        }
        
        console.log('📤 评价提交数据:', reviewData)
        
        const result = await orderReviewApi.save(reviewData)
        
        console.log('✅ 评价提交响应:', result)
        
        uni.hideLoading()
        
        if (result && result.code === 200) {
          uni.showToast({
            title: '评价成功',
            icon: 'success',
            duration: 2000
          })
          
          setTimeout(() => {
            // 发送全局事件通知评价完成
            uni.$emit('orderReviewSubmitted', this.orderId)
            uni.navigateBack({
              delta: 1,
              success: () => {
                // 通知上一个页面刷新
                const pages = getCurrentPages()
                if (pages.length > 1) {
                  const prevPage = pages[pages.length - 2]
                  if (prevPage.$vm && prevPage.$vm.onReviewSubmitted) {
                    prevPage.$vm.onReviewSubmitted(this.orderId)
                  }
                }
              }
            })
          }, 1500)
        } else {
          throw new Error(result?.msg || result?.message || '评价提交失败')
        }
        
      } catch (error) {
        uni.hideLoading()
        console.error('❌ 提交评价失败:', error)
        this.handleApiError(error, '提交评价失败')
        // 提交失败后重置提交状态
        this.hasSubmitted = false
      } finally {
        this.submitting = false
      }
    },
    
    handleApiError(error, defaultMessage = '操作失败') {
      console.error('API Error:', error)
      
      let message = defaultMessage
      if (error && error.errMsg) {
        message = error.errMsg
      } else if (error && error.message) {
        message = error.message
      } else if (typeof error === 'string') {
        message = error
      }
      
      if (message.includes('Network Error') || message.includes('request:fail')) {
        message = '网络连接失败，请检查网络设置'
      } else if (message.includes('status code')) {
        message = '服务器繁忙，请稍后重试'
      } else if (message.includes('JSON parse error')) {
        message = '数据格式错误，请稍后重试'
      }
      
      uni.showToast({
        title: message,
        icon: 'none',
        duration: 3000
      })
      
      return message
    },
    
    formatTime(timeStr) {
      if (!timeStr) return ''
      try {
        if (typeof timeStr === 'number') {
          const date = new Date(timeStr)
          return date.toLocaleDateString()
        }
        return timeStr.split(' ')[0]
      } catch (error) {
        return timeStr
      }
    },
    
    goBack() {
      if (this.submitting) {
        uni.showModal({
          title: '提示',
          content: '评价正在提交中，确定要离开吗？',
          success: (res) => {
            if (res.confirm) {
              uni.navigateBack()
            }
          }
        })
      } else {
        uni.navigateBack()
      }
    }
  }
}
</script>

<style scoped>
	.container {
		min-height: 100vh;
		background-color: #f5f5f5;
	}
	
	/* 头部样式 */
	.header-section {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20rpx 30rpx;
		background: white;
		border-bottom: 1rpx solid #eee;
		position: sticky;
		top: 0;
		z-index: 10;
	}
	
	.header-back {
		display: flex;
		align-items: center;
		font-size: 28rpx;
		color: #333;
	}
	
	.back-icon {
		margin-right: 10rpx;
		font-size: 32rpx;
	}
	
	.header-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}
	
	.header-placeholder {
		width: 120rpx;
	}
	
	/* 订单信息卡片 */
	.order-info-card {
		background: white;
		border-radius: 16rpx;
		padding: 30rpx;
		margin: 30rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
	}
	
	.designer-info {
		display: flex;
		align-items: center;
	}
	
	.designer-avatar {
		width: 100rpx;
		height: 100rpx;
		border-radius: 50%;
		overflow: hidden;
		margin-right: 20rpx;
		border: 3rpx solid #f0f0f0;
	}
	
	.designer-avatar image {
		width: 100%;
		height: 100%;
	}
	
	.designer-details {
		flex: 1;
	}
	
	.designer-name {
		display: block;
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 8rpx;
	}
	
	.designer-role {
		font-size: 26rpx;
		color: #666;
		background: #f0f0f0;
		padding: 4rpx 16rpx;
		border-radius: 12rpx;
	}
	
	/* 内容区域 */
	.review-content {
		height: calc(100vh - 300rpx);
		padding: 0 30rpx 30rpx 30rpx;
	}
	
	/* 卡片样式 */
	.rating-card,
	.content-card {
		background: white;
		border-radius: 16rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
	}
	
	.card-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 20rpx;
	}
	
	/* 评分区域 */
	.rating-section {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	
	.stars-container {
		display: flex;
		gap: 20rpx;
		margin-bottom: 20rpx;
	}
	
	.star {
		font-size: 60rpx;
		transition: all 0.3s;
	}
	
	.star-active {
		color: #f39c12;
		transform: scale(1.1);
		animation: starBounce 0.3s ease;
	}
	
	.star-inactive {
		color: #ddd;
	}
	
	.star:active {
		transform: scale(0.95);
	}
	
	.rating-text {
		font-size: 28rpx;
		color: #666;
	}
	
	/* 评价内容 */
	.review-textarea {
		width: 100%;
		height: 300rpx;
		padding: 20rpx;
		border: 2rpx solid #eee;
		border-radius: 12rpx;
		font-size: 28rpx;
		line-height: 1.5;
		background: #fafafa;
		transition: border-color 0.3s;
	}
	
	.review-textarea:focus {
		border-color: #3498db;
		background: white;
	}
	
	.word-count {
		text-align: right;
		font-size: 24rpx;
		color: #999;
		margin-top: 10rpx;
	}
	
	/* 提交按钮 */
	.submit-section {
		padding: 40rpx 0;
	}
	
	.submit-btn {
		width: 100%;
		height: 88rpx;
		background: linear-gradient(135deg, #3498db, #2980b9);
		color: white;
		border: none;
		border-radius: 44rpx;
		font-size: 32rpx;
		font-weight: bold;
		transition: all 0.3s;
	}
	
	.submit-btn::after {
		border: none;
	}
	
	.btn-disabled {
		background: #cccccc !important;
		color: #999999 !important;
		opacity: 0.7;
	}
	
	.btn-disabled:active {
		transform: none !important;
	}
	
	.submit-btn:not(.btn-disabled):active {
		transform: scale(0.98);
		opacity: 0.9;
	}
	
	/* 动画效果 */
	@keyframes starBounce {
		0% { transform: scale(1); }
		50% { transform: scale(1.2); }
		100% { transform: scale(1.1); }
	}
</style>