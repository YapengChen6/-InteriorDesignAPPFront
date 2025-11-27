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
			<!-- 订单信息 -->
			<view class="order-info-card">
				<view class="card-title">订单信息</view>
				<view class="order-details">
					<text class="order-number">订单号：DD{{ orderInfo.orderId }}</text>
					<text class="order-time">下单时间：{{ formatTime(orderInfo.createTime) }}</text>
					<text class="order-amount">订单金额：¥{{ orderInfo.totalAmount || 0 }}</text>
				</view>
			</view>

			<!-- 设计师信息 -->
			<view class="designer-info-card" v-if="orderInfo.contractorInfo">
				<view class="card-title">设计师信息</view>
				<view class="designer-details">
					<view class="designer-avatar">
						<image :src="orderInfo.contractorInfo.avatar || '/static/images/default-avatar.png'" mode="aspectFill" class="avatar-img" />
					</view>
					<view class="designer-info">
						<text class="designer-name">{{ orderInfo.contractorInfo.name || '设计师' }}</text>
						<text class="designer-role">{{ orderInfo.contractorInfo.role || '设计师' }}</text>
					</view>
				</view>
			</view>

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

	export default {
		data() {
			return {
				// 页面参数
				orderId: null,
				userId: null,
				
				// 订单信息
				orderInfo: {
					orderId: null,
					createTime: null,
					totalAmount: 0,
					contractorInfo: {}
				},
				
				// 评价数据
				rating: 0,
				reviewContent: '',
				submitting: false
			}
		},
		
		computed: {
			// 评分文本
			ratingText() {
				const texts = ['请评分', '很不满意', '不满意', '一般', '满意', '非常满意']
				return texts[this.rating]
			},
			
			// 是否可以提交
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
			
			this.loadOrderInfo()
		},
		
		methods: {
			// 加载订单信息
			async loadOrderInfo() {
				try {
					uni.showLoading({ title: '加载中...' })
					
					console.log('📋 加载订单信息，订单ID:', this.orderId)
					
					// 使用现有的订单服务获取订单详情
					const result = await orderService.getOrderListByUserId(this.userId, {
						pageNum: 1,
						pageSize: 100
					})
					
					console.log('✅ 订单列表响应:', result)
					
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
					
					// 查找当前订单
					const currentOrder = orderList.find(order => order.orderId == this.orderId)
					
					if (currentOrder) {
						this.orderInfo = {
							orderId: currentOrder.orderId,
							createTime: currentOrder.createTime,
							totalAmount: currentOrder.totalAmount || 0,
							contractorInfo: currentOrder.contractorInfo || {}
						}
						
						// 如果设计师信息不完整，尝试获取
						if (currentOrder.contractorId && (!currentOrder.contractorInfo || !currentOrder.contractorInfo.name)) {
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
			
			// 加载设计师信息
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
					// 不影响主要功能，使用默认信息
					this.orderInfo.contractorInfo = {
						name: '设计师',
						avatar: '/static/images/default-avatar.png',
						role: '设计师'
					}
				}
			},
			
			// 设置评分
			setRating(score) {
				this.rating = score
				console.log('⭐ 设置评分:', score)
			},
			
			// 提交评价
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
					
					console.log('📤 提交评价数据:', {
						orderId: this.orderId,
						rating: this.rating,
						content: this.reviewContent.trim()
					})
					
					// 使用现有的订单服务提交评价
					// 这里假设 orderService 有 submitReview 方法
					// 如果没有，可以使用通用的请求方法
					const reviewData = {
						orderId: this.orderId,
						reviewerId: this.userId,
						rating: this.rating,
						content: this.reviewContent.trim(),
						createTime: new Date().toISOString()
					}
					
					console.log('📤 评价提交数据:', reviewData)
					
					// 使用 uni.request 直接调用接口
					const result = await this.submitReviewRequest(reviewData)
					
					console.log('✅ 评价提交成功:', result)
					
					uni.showToast({
						title: '评价成功',
						icon: 'success',
						duration: 2000
					})
					
					// 评价成功后返回上一页
					setTimeout(() => {
						uni.navigateBack({
							delta: 1
						})
					}, 1500)
					
				} catch (error) {
					console.error('❌ 提交评价失败:', error)
					this.handleApiError(error, '提交评价失败')
				} finally {
					this.submitting = false
				}
			},
			
			// 提交评价请求
			submitReviewRequest(reviewData) {
				return new Promise((resolve, reject) => {
					uni.request({
						url: 'http://localhost:8081/api/order/review/submit',
						method: 'POST',
						data: reviewData,
						header: {
							'Content-Type': 'application/json',
							'Authorization': 'Bearer ' + uni.getStorageSync('token')
						},
						success: (res) => {
							console.log('📡 评价提交响应:', res)
							
							if (res.statusCode === 200) {
								if (res.data && (res.data.code === 200 || res.data.success)) {
									resolve(res.data)
								} else {
									reject(new Error(res.data?.msg || '评价提交失败'))
								}
							} else {
								reject(new Error(`请求失败，状态码: ${res.statusCode}`))
							}
						},
						fail: (error) => {
							console.error('❌ 评价提交请求失败:', error)
							reject(error)
						}
					})
				})
			},
			
			// 统一的错误处理
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
				
				uni.showToast({
					title: message,
					icon: 'none',
					duration: 3000
				})
				
				return message
			},
			
			// 格式化时间
			formatTime(timeStr) {
				if (!timeStr) return ''
				if (typeof timeStr === 'number') {
					const date = new Date(timeStr)
					return date.toLocaleDateString()
				}
				return timeStr.split(' ')[0]
			},
			
			// 返回上一页
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
	.order-info-card,
	.designer-info-card,
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
	
	/* 订单信息 */
	.order-details {
		display: flex;
		flex-direction: column;
		gap: 15rpx;
	}
	
	.order-number,
	.order-time,
	.order-amount {
		font-size: 28rpx;
		color: #666;
	}
	
	.order-amount {
		color: #e74c3c;
		font-weight: bold;
	}
	
	/* 设计师信息 */
	.designer-details {
		display: flex;
		align-items: center;
	}
	
	.designer-avatar {
		width: 100rpx;
		height: 100rpx;
		border-radius: 50%;
		overflow: hidden;
		margin-right: 20rpx;
	}
	
	.avatar-img {
		width: 100%;
		height: 100%;
	}
	
	.designer-info {
		display: flex;
		flex-direction: column;
	}
	
	.designer-name {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 8rpx;
	}
	
	.designer-role {
		font-size: 26rpx;
		color: #999;
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