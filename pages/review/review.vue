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
				></textarea>
				<view class="word-count">{{ reviewContent.length }}/500</view>
			</view>

			<!-- 提交按钮 -->
			<view class="submit-section">
				<button 
					class="submit-btn" 
					:class="{ 'btn-disabled': !canSubmit }"
					:disabled="!canSubmit"
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
import { getUserProfile } from '@/api/users.js'
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
      submitting: false
    }
  },
  
  computed: {
    ratingText() {
      const texts = ['请评分', '很不满意', '不满意', '一般', '满意', '非常满意']
      return texts[this.rating]
    },
    
    canSubmit() {
      return this.rating > 0 && this.reviewContent.trim().length >= 5
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
    
    // 如果userId为空，尝试从缓存获取
    if (!this.userId) {
      const userInfo = uni.getStorageSync('userInfo')
      if (userInfo && userInfo.id) {
        this.userId = userInfo.id
        console.log('从缓存获取userId:', this.userId)
      }
    }
    
    // 不再加载订单信息
    // this.loadOrderInfo()
  },
  
  methods: {
    async loadOrderInfo() {
      // 此方法保留，但不再在onLoad中调用
      try {
        uni.showLoading({ title: '加载中...' })
        
        console.log('📋 加载订单信息，订单ID:', this.orderId, '用户ID:', this.userId)
        
        const queryParams = {
          pageNum: 1,
          pageSize: 100,
          orderId: this.orderId
        }
        
        console.log('🔍 查询参数:', queryParams)
        
        let result
        try {
          result = await orderService.getOrderList(queryParams)
          console.log('✅ 订单列表查询响应:', result)
        } catch (error) {
          console.log('⚠️ 方式1失败，尝试方式2...')
          if (this.userId) {
            result = await orderService.getOrderListByUserId(this.userId, {
              pageNum: 1,
              pageSize: 100
            })
            console.log('✅ 用户订单列表响应:', result)
          } else {
            throw new Error('无法查询订单信息')
          }
        }
        
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
        
        const currentOrder = orderList.find(order => order.orderId == this.orderId)
        
        if (currentOrder) {
          console.log('✅ 找到目标订单:', currentOrder)
          
          this.orderInfo = {
            orderId: currentOrder.orderId,
            createTime: currentOrder.createTime,
            totalAmount: currentOrder.totalAmount || 0,
            contractorInfo: currentOrder.contractorInfo || {},
            contractorId: currentOrder.contractorId
          }
          
          console.log('📝 解析后的订单信息:', this.orderInfo)
          
          if (currentOrder.contractorId && (!currentOrder.contractorInfo || !currentOrder.contractorInfo.name)) {
            console.log('👨‍🎨 获取详细设计师信息，ID:', currentOrder.contractorId)
            await this.loadDesignerInfo(currentOrder.contractorId)
          }
          
          console.log('✅ 订单信息加载完成:', this.orderInfo)
        } else {
          throw new Error('未找到订单信息')
        }
        
        uni.hideLoading()
        
      } catch (error) {
        uni.hideLoading()
        console.error('❌ 加载订单信息失败:', error)
        this.handleApiError(error, '加载订单信息失败')
        setTimeout(() => {
          uni.navigateBack()
        }, 2000)
      }
    },
    
    async loadDesignerInfo(designerId) {
      try {
        console.log('👨‍🎨 加载设计师信息，ID:', designerId)
        const designerInfo = await getUserProfile(designerId)
        
        if (designerInfo && designerInfo.code === 200) {
          this.orderInfo.contractorInfo = {
            name: designerInfo.data.name || designerInfo.data.nickname || '设计师',
            avatar: designerInfo.data.avatar || '/static/images/default-avatar.png',
            role: '设计师'
          }
        }
      } catch (error) {
        console.error('❌ 加载设计师信息失败:', error)
        this.orderInfo.contractorInfo = {
          name: '设计师',
          avatar: '/static/images/default-avatar.png',
          role: '设计师'
        }
      }
    },
    
    setRating(score) {
      this.rating = score
      console.log('⭐ 设置评分:', score)
    },
    
    async submitReview() {
      if (!this.canSubmit) {
        uni.showToast({
          title: '请完成评分并填写至少5个字的评价',
          icon: 'none'
        })
        return
      }
      
      try {
        this.submitting = true
        
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
              delta: 1
            })
          }, 1500)
        } else {
          throw new Error(result?.msg || '评价提交失败')
        }
        
      } catch (error) {
        console.error('❌ 提交评价失败:', error)
        this.handleApiError(error, '提交评价失败')
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
      uni.navigateBack()
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
	
	/* 内容区域 */
	.review-content {
		height: calc(100vh - 120rpx);
		padding: 30rpx;
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
	}
	
	.star-inactive {
		color: #ddd;
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
	}
	
	.btn-disabled {
		background: #ccc !important;
		color: #999 !important;
	}
	
	.submit-btn:not(.btn-disabled):active {
		transform: scale(0.98);
	}
</style>