<template>
	<view class="order-detail-container">
		<!-- 页面头部 -->
		<view class="page-header">
			<view class="header-left" @click="goBack">
				<text class="back-icon">‹</text>
				<text class="back-text">返回</text>
			</view>
			<view class="header-title">项目详情</view>
			<view class="header-right">
				<text class="share-icon" @click="shareProject">分享</text>
			</view>
		</view>

		<!-- 项目基本信息 -->
		<view class="basic-info-section">
			<!-- 修复：使用计算属性 -->
			<view class="project-status" :class="statusClass">
				{{ statusText }}
			</view>
			
			<view class="project-title">{{ projectDetail.title || '加载中...' }}</view>
			
			<view class="project-meta">
				<view class="meta-item">
					<text class="meta-icon">📍</text>
					<text class="meta-text">{{ projectDetail.address || '未指定地区' }}</text>
				</view>
				<view class="meta-item">
					<text class="meta-icon">⏰</text>
					<text class="meta-text">{{ formattedDeadline }}</text>
				</view>
				<view class="meta-item">
					<text class="meta-icon">💰</text>
					<text class="meta-text budget">{{ formattedBudget }}</text>
				</view>
			</view>
		</view>

		<!-- 项目详情卡片 -->
		<view class="detail-card">
			<view class="card-header">
				<text class="card-title">项目详情</text>
			</view>
			<view class="card-content">
				<text class="project-description">
					{{ projectDetail.description || '暂无项目描述' }}
				</text>
				
				<!-- 项目图片 -->
				<view class="project-images" v-if="projectDetail.images && projectDetail.images.length > 0">
					<view class="images-title">相关图片</view>
					<scroll-view class="images-scroll" scroll-x="true">
						<view class="image-list">
							<view 
								class="image-item" 
								v-for="(image, index) in projectDetail.images" 
								:key="index"
								@click="previewImage(image, index)"
							>
								<image :src="image" mode="aspectFill" class="project-image" />
							</view>
						</view>
					</scroll-view>
				</view>
			</view>
		</view>

		<!-- 项目要求 -->
		<view class="detail-card">
			<view class="card-header">
				<text class="card-title">项目要求</text>
			</view>
			<view class="card-content">
				<view class="requirement-item">
					<text class="requirement-label">所需角色：</text>
					<text class="requirement-value">{{ roleText }}</text>
				</view>
				<view class="requirement-item">
					<text class="requirement-label">项目面积：</text>
					<text class="requirement-value">{{ projectDetail.area || '未指定' }}㎡</text>
				</view>
				<view class="requirement-item">
					<text class="requirement-label">项目类型：</text>
					<text class="requirement-value">{{ projectTypeText }}</text>
				</view>
				<view class="requirement-item">
					<text class="requirement-label">风格偏好：</text>
					<text class="requirement-value">{{ projectDetail.style || '不限' }}</text>
				</view>
				<view class="requirement-item" v-if="projectDetail.specialRequirements">
					<text class="requirement-label">特殊要求：</text>
					<text class="requirement-value">{{ projectDetail.specialRequirements }}</text>
				</view>
			</view>
		</view>

		<!-- 发布者信息 -->
		<view class="detail-card">
			<view class="card-header">
				<text class="card-title">发布者信息</text>
			</view>
			<view class="card-content">
				<view class="publisher-info">
					<view class="publisher-avatar">
						<image 
							:src="publisherAvatar" 
							class="avatar-image" 
							mode="aspectFill"
						/>
					</view>
					<view class="publisher-details">
						<text class="publisher-name">{{ publisherName }}</text>
						<text class="publisher-meta">发布于 {{ formattedCreateTime }}</text>
					</view>
				</view>
				
				<!-- 发布者其他信息 -->
				<view class="publisher-stats" v-if="publisherStats">
					<view class="stat-item">
						<text class="stat-number">{{ publisherStats.projectCount || 0 }}</text>
						<text class="stat-label">发布项目</text>
					</view>
					<view class="stat-item">
						<text class="stat-number">{{ publisherStats.completionRate || '0%' }}</text>
						<text class="stat-label">完成率</text>
					</view>
					<view class="stat-item">
						<text class="stat-number">{{ publisherStats.rating || '0' }}</text>
						<text class="stat-label">评分</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 底部操作栏 - 简化版本 -->
		<view class="bottom-actions">
			<view class="action-buttons">
				<!-- 修改：使用 onlineConsult 方法 -->
				<button class="btn contact-btn" @click="onlineConsult">联系用户</button>
				<button class="btn accept-btn" @click="acceptOrder">接取订单</button>
			</view>
		</view>

		<!-- 接单确认对话框 -->
		<uni-popup ref="acceptPopup" type="dialog">
			<view class="accept-dialog">
				<view class="dialog-header">
					<text class="dialog-title">确认接单</text>
				</view>
				<view class="dialog-content">
					<text class="dialog-message">确定要接取这个订单吗？接单后您将负责此项目的{{ roleText }}工作。</text>
				</view>
				<view class="dialog-actions">
					<button class="dialog-btn cancel" @click="closeAcceptDialog">取消</button>
					<button class="dialog-btn confirm" @click="confirmAcceptOrder">确认接单</button>
				</view>
			</view>
		</uni-popup>

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
import { getUserProfile, getUserById } from '@/api/users.js'
import { isUserLoggedIn, handleNotLoggedIn, createConversationAndNavigate } from "@/utils/conversationHelper.js"

export default {
	data() {
		return {
			// 项目ID
			projectId: '',
			
			// 项目详情
			projectDetail: {},
			
			// 发布者详细信息
			publisherInfo: null,
			
			// 发布者统计信息
			publisherStats: null,
			
			// 当前用户信息
			currentUserInfo: {
				userId: null,
				name: '',
				avatar: ''
			},
			
			// 加载状态
			loading: false,
			error: false,
			errorMessage: '',
			
			// 状态映射
			statusMap: {
				0: { text: '待审核', class: 'pending' },
				1: { text: '招标中', class: 'bidding' },
				2: { text: '进行中', class: 'in-progress' },
				3: { text: '已完成', class: 'completed' },
				4: { text: '已取消', class: 'cancelled' }
			},
			
			roleMap: {
				1: '设计师',
				2: '施工队',
				3: '设计+施工'
			},
			
			projectTypeMap: {
				1: '住宅装修',
				2: '商业空间',
				3: '办公室装修',
				4: '其他'
			}
		}
	},
	
	computed: {
		// 状态类名
		statusClass() {
			const status = this.projectDetail.status
			return this.statusMap[status]?.class || 'pending'
		},
		
		// 状态文本
		statusText() {
			const status = this.projectDetail.status
			return this.statusMap[status]?.text || '未知状态'
		},
		
		// 角色文本
		roleText() {
			const role = this.projectDetail.requiredRoles
			return this.roleMap[role] || '未知角色'
		},
		
		// 项目类型文本
		projectTypeText() {
			const type = this.projectDetail.projectType
			return this.projectTypeMap[type] || '其他'
		},
		
		// 格式化截止日期
		formattedDeadline() {
			const date = this.projectDetail.deadline
			if (!date) return '未设置'
			if (date.includes(' ')) {
				return date.split(' ')[0]
			}
			return date
		},
		
		// 格式化预算
		formattedBudget() {
			const budget = this.projectDetail.budget
			if (!budget) return '面议'
			if (typeof budget === 'number') {
				if (budget >= 10000) {
					return `¥${(budget / 10000).toFixed(1)}万`
				}
				return `¥${budget}元`
			}
			return `¥${budget}`
		},
		
		// 格式化创建时间
		formattedCreateTime() {
			const time = this.projectDetail.createTime
			if (!time) return ''
			
			try {
				const now = new Date()
				const createTime = new Date(time)
				
				if (isNaN(createTime.getTime())) {
					return '时间未知'
				}
				
				const diff = now - createTime
				const minutes = Math.floor(diff / (1000 * 60))
				const hours = Math.floor(diff / (1000 * 60 * 60))
				const days = Math.floor(diff / (1000 * 60 * 60 * 24))
				
				if (minutes < 1) return '刚刚'
				if (minutes < 60) return `${minutes}分钟前`
				if (hours < 24) return `${hours}小时前`
				if (days < 7) return `${days}天前`
				
				return `${createTime.getFullYear()}-${createTime.getMonth() + 1}-${createTime.getDate()}`
			} catch (error) {
				console.error('格式化时间错误:', error)
				return '时间未知'
			}
		},
		
		// 发布者名称
		publisherName() {
			if (this.publisherInfo && this.publisherInfo.name) {
				return this.publisherInfo.name
			}
			return this.projectDetail.createBy || '匿名用户'
		},
		
		// 发布者头像
		publisherAvatar() {
			if (this.publisherInfo && this.publisherInfo.avatar) {
				return this.publisherInfo.avatar
			}
			return '/static/images/default-avatar.png'
		}
	},
	
	async onLoad(options) {
		if (options.id) {
			this.projectId = options.id
			// 先获取当前用户信息
			await this.loadCurrentUserInfo()
			// 再加载项目详情
			this.loadProjectDetail()
		} else {
			this.error = true
			this.errorMessage = '项目ID不存在'
		}
	},
	
	onPullDownRefresh() {
		this.loadProjectDetail().finally(() => {
			uni.stopPullDownRefresh()
		})
	},
	
	methods: {
		// 在线咨询方法 - 设计师或监理联系客户
		async onlineConsult() {
			console.log('🔥 开始在线咨询，项目ID:', this.projectId);
			
			// 检查登录状态
			if (!isUserLoggedIn()) {
				handleNotLoggedIn();
				return;
			}
			
			// 检查项目信息
			if (!this.projectDetail || !this.projectDetail.userId) {
				console.error('❌ 项目信息不完整:', this.projectDetail);
				uni.showToast({
					title: '项目信息无效',
					icon: 'error'
				});
				return;
			}
			
			// 获取对方用户ID（项目发布者，即客户）
			const otherUserId = this.projectDetail.userId || 
							  this.projectDetail.createBy || 
							  (this.publisherInfo && this.publisherInfo.userId);
			
			if (!otherUserId) {
				uni.showToast({
					title: '用户信息不存在',
					icon: 'none'
				});
				return;
			}
			
			// 检查是否是联系自己
			if (otherUserId === this.currentUserInfo.userId) {
				uni.showToast({
					title: '不能联系自己',
					icon: 'none'
				});
				return;
			}
			
			// 获取当前用户角色
			const currentRole = this.currentUserInfo.role || '';
			
			// 显示加载中
			uni.showLoading({
				title: '创建对话中...',
				mask: true
			});
			
			try {
				// 获取发布者详细信息
				const publisherName = this.publisherName;
				const publisherAvatar = this.publisherAvatar;
				
				console.log('💬 准备创建对话:', {
					currentUserId: this.currentUserInfo.userId,
					otherUserId,
					publisherName,
					currentRole: currentRole,
					projectId: this.projectId
				});
				
				// 使用工具函数创建对话并跳转
				await createConversationAndNavigate(
					otherUserId,
					publisherName,
					publisherAvatar
				);
				
			} catch (error) {
				console.error('❌ 创建对话失败:', error);
				
				// 错误处理
				let errorMessage = '创建对话失败';
				if (error.message) {
					if (error.message.includes('请先登录')) {
						errorMessage = '请先登录';
					} else if (error.message.includes('不能与自己')) {
						errorMessage = '不能联系自己';
					} else if (error.message.includes('权限')) {
						errorMessage = '没有权限联系该用户';
					} else if (error.message.includes('对方不存在')) {
						errorMessage = '对方用户不存在';
					} else {
						errorMessage = error.message;
					}
				}
				
				uni.showToast({
					title: errorMessage,
					icon: 'none',
					duration: 3000
				});
				
				// 如果是因为对话不存在，尝试直接跳转到聊天页面
				if (error.message && error.message.includes('对话不存在')) {
					console.log('⚠️ 尝试直接跳转到聊天页面');
					setTimeout(() => {
						uni.navigateTo({
							url: `/pages/chat/chat?otherUserId=${otherUserId}&otherUserName=${encodeURIComponent(publisherName)}&projectId=${this.projectId}&otherUserAvatar=${publisherAvatar}`
						});
					}, 1000);
				}
			} finally {
				uni.hideLoading();
			}
		},
		
		// 加载当前用户信息 - 保留使用原来的方法
		async loadCurrentUserInfo() {
			try {
				// 检查是否有token
				const token = uni.getStorageSync('token')
				if (!token) {
					console.log('用户未登录')
					return
				}
				
				console.log('👤 开始获取当前用户信息...')
				
				// 调用原来的API获取当前登录用户信息 - 不需要参数
				const userRes = await getUserProfile()
				
				if (userRes.code === 200) {
					this.currentUserInfo = {
						userId: userRes.data.userId,
						name: userRes.data.name || userRes.data.nickName || '用户',
						avatar: userRes.data.avatar || '/static/images/default-avatar.png',
						role: userRes.data.currentRoleType || 'user'
					}
					
					console.log('✅ 当前用户信息加载完成:', this.currentUserInfo)
				} else {
					console.error('获取用户信息失败:', userRes.msg)
				}
				
			} catch (error) {
				console.error('❌ 获取当前用户信息失败:', error)
			}
		},
		
		// 加载项目详情
		async loadProjectDetail() {
			this.loading = true
			this.error = false
			
			try {
				console.log('开始加载项目详情，项目ID:', this.projectId)
				
				const result = await projectService.getProjectDetail(this.projectId)
				console.log('项目详情数据:', result)
				
				if (result && result.projectId) {
					this.projectDetail = result
					
					// 加载发布者详细信息
					await this.loadPublisherInfo(result.userId || result.createBy)
					
					// 加载发布者统计信息
					await this.loadPublisherStats(result.createBy)
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
		
		// 加载发布者详细信息 - 使用新的getUserById方法
		async loadPublisherInfo(userId) {
			if (!userId) {
				console.log('没有用户ID，使用默认发布者信息')
				this.publisherInfo = this.getDefaultPublisherInfo()
				return
			}
			
			try {
				console.log('正在获取发布者信息，用户ID:', userId)
				const userInfo = await getUserById(userId) // 使用新的方法
				console.log('发布者信息:', userInfo)
				
				// 格式化用户信息
				this.publisherInfo = this.formatUserInfo(userInfo)
				
			} catch (error) {
				console.error('获取发布者信息失败:', error)
				// 出错时使用默认信息
				this.publisherInfo = this.getDefaultPublisherInfo()
			}
		},
		
		// 格式化用户信息
		formatUserInfo(userInfo) {
			if (!userInfo) {
				return this.getDefaultPublisherInfo()
			}
			
			// 处理接口返回的数据结构
			let userData = userInfo
			
			// 如果接口返回的是 {code: 200, data: {...}} 结构
			if (userInfo.code === 200 && userInfo.data) {
				userData = userInfo.data
			}
			
			const formattedInfo = {
				// 姓名字段 - 优先使用 name，如果没有则使用 nickName 或 userName
				name: userData.name || userData.nickName || userData.userName || '匿名用户',
				// 手机号
				phone: userData.phone || '',
				// 头像
				avatar: userData.avatar || '/static/images/default-avatar.png',
				// 用户ID
				userId: userData.userId || '',
				// 角色类型
				currentRoleType: userData.currentRoleType || 'user'
			}
			
			return formattedInfo
		},
		
		// 获取默认发布者信息
		getDefaultPublisherInfo() {
			return {
				name: this.projectDetail.createBy || '匿名用户',
				phone: '',
				avatar: '/static/images/default-avatar.png',
				userId: '',
				currentRoleType: 'user'
			}
		},
		
		// 获取发布者手机号（用于联系）
		getPublisherPhone() {
			if (this.publisherInfo && this.publisherInfo.phone) {
				return this.publisherInfo.phone
			}
			return this.projectDetail.contactPhone || ''
		},
		
		// 加载发布者统计信息
		async loadPublisherStats(userId) {
			if (!userId) return
			
			try {
				// 模拟数据 - 可以根据实际情况调用用户统计接口
				this.publisherStats = {
					projectCount: Math.floor(Math.random() * 20) + 1,
					completionRate: `${Math.floor(Math.random() * 30) + 70}%`,
					rating: (Math.random() * 2 + 3).toFixed(1)
				}
			} catch (error) {
				console.error('加载发布者统计信息失败:', error)
			}
		},
		
		// 接取订单
		acceptOrder() {
			// 检查用户是否登录
			const token = uni.getStorageSync('token')
			if (!token) {
				uni.showModal({
					title: '提示',
					content: '请先登录后再接单',
					confirmText: '去登录',
					success: (res) => {
						if (res.confirm) {
							uni.navigateTo({
								url: '/pages/login/login'
							})
						}
					}
				})
				return
			}
			
			// 直接跳转到设计订单页面
			uni.navigateTo({
				url: `/pages/post/post-designorder?projectId=${this.projectId}`
			})
		},
		
		// 确认接单（保留原有逻辑，但不再使用）
		async confirmAcceptOrder() {
			try {
				this.loading = true
				
				// 调用接单接口
				const result = await projectService.acceptProject(this.projectId)
				
				console.log('接单成功:', result)
				
				uni.showToast({
					title: '接单成功',
					icon: 'success',
					duration: 2000
				})
				
				// 关闭对话框
				this.closeAcceptDialog()
				
				// 更新项目状态
				this.projectDetail.status = 2 // 进行中
				
				// 延迟返回上一页
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
				
			} catch (error) {
				console.error('接单失败:', error)
				uni.showToast({
					title: error.message || '接单失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},
		
		// 关闭接单对话框
		closeAcceptDialog() {
			this.$refs.acceptPopup.close()
		},
		
		// 分享项目
		shareProject() {
			uni.share({
				provider: 'weixin',
				scene: 'WXSceneSession',
				type: 0,
				title: this.projectDetail.title,
				summary: this.projectDetail.description ? this.projectDetail.description.substring(0, 50) + '...' : '这是一个装修项目',
				href: window.location.href,
				success: function(res) {
					console.log('分享成功:', res)
					uni.showToast({
						title: '分享成功',
						icon: 'success'
					})
				},
				fail: function(err) {
					console.log('分享失败:', err)
					uni.showToast({
						title: '分享失败',
						icon: 'none'
					})
				}
			})
		},
		
		// 预览图片
		previewImage(image, index) {
			const images = this.projectDetail.images || []
			uni.previewImage({
				urls: images,
				current: image
			})
		},
		
		// 返回上一页
		goBack() {
			uni.navigateBack()
		}
	}
}
</script>
import { projectService } from '@/api/project.js'
import { getUserProfile, getUserById } from '@/api/users.js'  // 修改这里：同时导入两个方法
import { isUserLoggedIn, handleNotLoggedIn } from "@/utils/conversationHelper.js"

export default {
	data() {
		return {
			// 项目ID
			projectId: '',
			
			// 项目详情
			projectDetail: {},
			
			// 发布者详细信息
			publisherInfo: null,
			
			// 发布者统计信息
			publisherStats: null,
			
			// 当前用户信息
			currentUserInfo: {
				userId: null,
				name: '',
				avatar: ''
			},
			
			// 加载状态
			loading: false,
			error: false,
			errorMessage: '',
			
			// 状态映射
			statusMap: {
				0: { text: '待审核', class: 'pending' },
				1: { text: '招标中', class: 'bidding' },
				2: { text: '进行中', class: 'in-progress' },
				3: { text: '已完成', class: 'completed' },
				4: { text: '已取消', class: 'cancelled' }
			},
			
			roleMap: {
				1: '设计师',
				2: '施工队',
				3: '设计+施工'
			},
			
			projectTypeMap: {
				1: '住宅装修',
				2: '商业空间',
				3: '办公室装修',
				4: '其他'
			}
		}
	},
	
	computed: {
		// 状态类名
		statusClass() {
			const status = this.projectDetail.status
			return this.statusMap[status]?.class || 'pending'
		},
		
		// 状态文本
		statusText() {
			const status = this.projectDetail.status
			return this.statusMap[status]?.text || '未知状态'
		},
		
		// 角色文本
		roleText() {
			const role = this.projectDetail.requiredRoles
			return this.roleMap[role] || '未知角色'
		},
		
		// 项目类型文本
		projectTypeText() {
			const type = this.projectDetail.projectType
			return this.projectTypeMap[type] || '其他'
		},
		
		// 格式化截止日期
		formattedDeadline() {
			const date = this.projectDetail.deadline
			if (!date) return '未设置'
			if (date.includes(' ')) {
				return date.split(' ')[0]
			}
			return date
		},
		
		// 格式化预算
		formattedBudget() {
			const budget = this.projectDetail.budget
			if (!budget) return '面议'
			if (typeof budget === 'number') {
				if (budget >= 10000) {
					return `¥${(budget / 10000).toFixed(1)}万`
				}
				return `¥${budget}元`
			}
			return `¥${budget}`
		},
		
		// 格式化创建时间
		formattedCreateTime() {
			const time = this.projectDetail.createTime
			if (!time) return ''
			
			try {
				const now = new Date()
				const createTime = new Date(time)
				
				if (isNaN(createTime.getTime())) {
					return '时间未知'
				}
				
				const diff = now - createTime
				const minutes = Math.floor(diff / (1000 * 60))
				const hours = Math.floor(diff / (1000 * 60 * 60))
				const days = Math.floor(diff / (1000 * 60 * 60 * 24))
				
				if (minutes < 1) return '刚刚'
				if (minutes < 60) return `${minutes}分钟前`
				if (hours < 24) return `${hours}小时前`
				if (days < 7) return `${days}天前`
				
				return `${createTime.getFullYear()}-${createTime.getMonth() + 1}-${createTime.getDate()}`
			} catch (error) {
				console.error('格式化时间错误:', error)
				return '时间未知'
			}
		},
		
		// 发布者名称
		publisherName() {
			if (this.publisherInfo && this.publisherInfo.name) {
				return this.publisherInfo.name
			}
			return this.projectDetail.createBy || '匿名用户'
		},
		
		// 发布者头像
		publisherAvatar() {
			if (this.publisherInfo && this.publisherInfo.avatar) {
				return this.publisherInfo.avatar
			}
			return '/static/images/default-avatar.png'
		}
	},
	
	async onLoad(options) {
		if (options.id) {
			this.projectId = options.id
			// 先获取当前用户信息
			await this.loadCurrentUserInfo()
			// 再加载项目详情
			this.loadProjectDetail()
		} else {
			this.error = true
			this.errorMessage = '项目ID不存在'
		}
	},
	
	onPullDownRefresh() {
		this.loadProjectDetail().finally(() => {
			uni.stopPullDownRefresh()
		})
	},
	
	methods: {
		// 在线咨询方法（替换原有的contactPublisher）
		async onlineConsult() {
			console.log('🔥 开始在线咨询，项目ID:', this.projectId);
			
			// 检查登录状态
			if (!isUserLoggedIn()) {
				handleNotLoggedIn();
				return;
			}
			
			// 检查项目信息
			if (!this.projectDetail || !this.projectDetail.userId) {
				console.error('❌ 项目信息不完整:', this.projectDetail);
				uni.showToast({
					title: '项目信息无效',
					icon: 'error'
				});
				return;
			}
			
			// 获取对方用户ID（项目发布者）
			const otherUserId = this.projectDetail.userId || 
							  this.projectDetail.createBy || 
							  (this.publisherInfo && this.publisherInfo.userId);
			
			if (!otherUserId) {
				uni.showToast({
					title: '用户信息不存在',
					icon: 'none'
				});
				return;
			}
			
			// 检查是否是联系自己
			if (otherUserId === this.currentUserInfo.userId) {
				uni.showToast({
					title: '不能联系自己',
					icon: 'none'
				});
				return;
			}
			
			// 显示加载中
			uni.showLoading({
				title: '创建对话中...',
				mask: true
			});
			
			try {
				// 获取发布者详细信息
				const publisherName = this.publisherName;
				const publisherAvatar = this.publisherAvatar;
				
				console.log('💬 准备创建对话:', {
					currentUserId: this.currentUserInfo.userId,
					otherUserId,
					publisherName,
					projectId: this.projectId
				});
				
				// 跳转到聊天详情页面
				uni.navigateTo({
					url: `/pages/chat/chatDetail?conversationId=${this.currentUserInfo.userId}&otherUserId=${otherUserId}&projectId=${this.projectId}&otherUserName=${publisherName}&otherUserAvatar=${publisherAvatar}`
				});
				
			} catch (error) {
				console.error('❌ 创建对话失败:', error);
				uni.showToast({
					title: '创建对话失败，请重试',
					icon: 'error'
				});
			} finally {
				uni.hideLoading();
			}
		},
		
		// 加载当前用户信息 - 保留使用原来的方法
		async loadCurrentUserInfo() {
			try {
				// 检查是否有token
				const token = uni.getStorageSync('token')
				if (!token) {
					console.log('用户未登录')
					return
				}
				
				console.log('👤 开始获取当前用户信息...')
				
				// 调用原来的API获取当前登录用户信息 - 不需要参数
				const userRes = await getUserProfile()
				
				if (userRes.code === 200) {
					this.currentUserInfo = {
						userId: userRes.data.userId,
						name: userRes.data.name || userRes.data.nickName || '用户',
						avatar: userRes.data.avatar || '/static/images/default-avatar.png',
						role: userRes.data.currentRoleType || 'user'
					}
					
					console.log('✅ 当前用户信息加载完成:', this.currentUserInfo)
				} else {
					console.error('获取用户信息失败:', userRes.msg)
				}
				
			} catch (error) {
				console.error('❌ 获取当前用户信息失败:', error)
			}
		},
		
		// 加载项目详情
		async loadProjectDetail() {
			this.loading = true
			this.error = false
			
			try {
				console.log('开始加载项目详情，项目ID:', this.projectId)
				
				const result = await projectService.getProjectDetail(this.projectId)
				console.log('项目详情数据:', result)
				
				if (result && result.projectId) {
					this.projectDetail = result
					
					// 加载发布者详细信息
					await this.loadPublisherInfo(result.userId || result.createBy)
					
					// 加载发布者统计信息
					await this.loadPublisherStats(result.createBy)
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
		
		// 加载发布者详细信息 - 使用新的getUserById方法
		async loadPublisherInfo(userId) {
			if (!userId) {
				console.log('没有用户ID，使用默认发布者信息')
				this.publisherInfo = this.getDefaultPublisherInfo()
				return
			}
			
			try {
				console.log('正在获取发布者信息，用户ID:', userId)
				const userInfo = await getUserById(userId) // 使用新的方法
				console.log('发布者信息:', userInfo)
				
				// 格式化用户信息
				this.publisherInfo = this.formatUserInfo(userInfo)
				
			} catch (error) {
				console.error('获取发布者信息失败:', error)
				// 出错时使用默认信息
				this.publisherInfo = this.getDefaultPublisherInfo()
			}
		},
		
		// 格式化用户信息
		formatUserInfo(userInfo) {
			if (!userInfo) {
				return this.getDefaultPublisherInfo()
			}
			
			// 处理接口返回的数据结构
			let userData = userInfo
			
			// 如果接口返回的是 {code: 200, data: {...}} 结构
			if (userInfo.code === 200 && userInfo.data) {
				userData = userInfo.data
			}
			
			const formattedInfo = {
				// 姓名字段 - 优先使用 name，如果没有则使用 nickName 或 userName
				name: userData.name || userData.nickName || userData.userName || '匿名用户',
				// 手机号
				phone: userData.phone || '',
				// 头像
				avatar: userData.avatar || '/static/images/default-avatar.png',
				// 用户ID
				userId: userData.userId || '',
				// 角色类型
				currentRoleType: userData.currentRoleType || 'user'
			}
			
			return formattedInfo
		},
		
		// 获取默认发布者信息
		getDefaultPublisherInfo() {
			return {
				name: this.projectDetail.createBy || '匿名用户',
				phone: '',
				avatar: '/static/images/default-avatar.png',
				userId: '',
				currentRoleType: 'user'
			}
		},
		
		// 获取发布者手机号（用于联系）
		getPublisherPhone() {
			if (this.publisherInfo && this.publisherInfo.phone) {
				return this.publisherInfo.phone
			}
			return this.projectDetail.contactPhone || ''
		},
		
		// 加载发布者统计信息
		async loadPublisherStats(userId) {
			if (!userId) return
			
			try {
				// 模拟数据 - 可以根据实际情况调用用户统计接口
				this.publisherStats = {
					projectCount: Math.floor(Math.random() * 20) + 1,
					completionRate: `${Math.floor(Math.random() * 30) + 70}%`,
					rating: (Math.random() * 2 + 3).toFixed(1)
				}
			} catch (error) {
				console.error('加载发布者统计信息失败:', error)
			}
		},
		
		// 接取订单
		acceptOrder() {
			// 检查用户是否登录
			const token = uni.getStorageSync('token')
			if (!token) {
				uni.showModal({
					title: '提示',
					content: '请先登录后再接单',
					confirmText: '去登录',
					success: (res) => {
						if (res.confirm) {
							uni.navigateTo({
								url: '/pages/login/login'
							})
						}
					}
				})
				return
			}
			
			// 直接跳转到设计订单页面
			uni.navigateTo({
				url: `/pages/post/post-designorder?projectId=${this.projectId}`
			})
		},
		
		// 确认接单（保留原有逻辑，但不再使用）
		async confirmAcceptOrder() {
			try {
				this.loading = true
				
				// 调用接单接口
				const result = await projectService.acceptProject(this.projectId)
				
				console.log('接单成功:', result)
				
				uni.showToast({
					title: '接单成功',
					icon: 'success',
					duration: 2000
				})
				
				// 关闭对话框
				this.closeAcceptDialog()
				
				// 更新项目状态
				this.projectDetail.status = 2 // 进行中
				
				// 延迟返回上一页
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
				
			} catch (error) {
				console.error('接单失败:', error)
				uni.showToast({
					title: error.message || '接单失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},
		
		// 关闭接单对话框
		closeAcceptDialog() {
			this.$refs.acceptPopup.close()
		},
		
		// 分享项目
		shareProject() {
			uni.share({
				provider: 'weixin',
				scene: 'WXSceneSession',
				type: 0,
				title: this.projectDetail.title,
				summary: this.projectDetail.description ? this.projectDetail.description.substring(0, 50) + '...' : '这是一个装修项目',
				href: window.location.href,
				success: function(res) {
					console.log('分享成功:', res)
					uni.showToast({
						title: '分享成功',
						icon: 'success'
					})
				},
				fail: function(err) {
					console.log('分享失败:', err)
					uni.showToast({
						title: '分享失败',
						icon: 'none'
					})
				}
			})
		},
		
		// 预览图片
		previewImage(image, index) {
			const images = this.projectDetail.images || []
			uni.previewImage({
				urls: images,
				current: image
			})
		},
		
		// 返回上一页
		goBack() {
			uni.navigateBack()
		}
	}
}
</script>
<style scoped>
.order-detail-container {
	min-height: 100vh;
	background-color: #f5f5f5;
	/* 重要：为底部按钮留出足够空间 */
	padding-bottom: 120rpx;
}

/* 页面头部 */
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
	text-align: right;
}

.share-icon {
	font-size: 32rpx;
	color: #ff6b00;
}

/* 基本信息区域 */
.basic-info-section {
	background: linear-gradient(135deg, #ff6b00, #ff8c00);
	padding: 40rpx 30rpx;
	color: white;
}

.project-status {
	display: inline-block;
	padding: 8rpx 24rpx;
	background: rgba(255, 255, 255, 0.2);
	border-radius: 24rpx;
	font-size: 24rpx;
	margin-bottom: 20rpx;
}

.project-title {
	font-size: 40rpx;
	font-weight: bold;
	margin-bottom: 30rpx;
	line-height: 1.4;
}

.project-meta {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.meta-item {
	display: flex;
	align-items: center;
	font-size: 28rpx;
}

.meta-icon {
	margin-right: 16rpx;
	font-size: 32rpx;
}

.meta-text.budget {
	font-weight: bold;
	font-size: 32rpx;
}

/* 详情卡片 */
.detail-card {
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

/* 项目描述 */
.project-description {
	font-size: 28rpx;
	line-height: 1.6;
	color: #666;
}

/* 项目图片 */
.project-images {
	margin-top: 30rpx;
}

.images-title {
	font-size: 28rpx;
	font-weight: 500;
	color: #333;
	margin-bottom: 20rpx;
}

.images-scroll {
	white-space: nowrap;
}

.image-list {
	display: flex;
	gap: 20rpx;
}

.image-item {
	width: 240rpx;
	height: 180rpx;
	border-radius: 16rpx;
	overflow: hidden;
	flex-shrink: 0;
}

.project-image {
	width: 100%;
	height: 100%;
}

/* 项目要求 */
.requirement-item {
	display: flex;
	align-items: flex-start;
	margin-bottom: 24rpx;
	font-size: 28rpx;
}

.requirement-item:last-child {
	margin-bottom: 0;
}

.requirement-label {
	color: #666;
	min-width: 160rpx;
	flex-shrink: 0;
}

.requirement-value {
	color: #333;
	flex: 1;
	line-height: 1.5;
}

/* 发布者信息 */
.publisher-info {
	display: flex;
	align-items: center;
	margin-bottom: 30rpx;
}

.publisher-avatar {
	width: 100rpx;
	height: 100rpx;
	border-radius: 50rpx;
	overflow: hidden;
	margin-right: 24rpx;
	flex-shrink: 0;
}

.avatar-image {
	width: 100%;
	height: 100%;
}

.publisher-details {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.publisher-name {
	font-size: 32rpx;
	font-weight: 500;
	color: #333;
	margin-bottom: 8rpx;
}

.publisher-meta {
	font-size: 24rpx;
	color: #999;
}

/* 发布者统计 */
.publisher-stats {
	display: flex;
	justify-content: space-around;
	padding: 30rpx 0;
	border-top: 1rpx solid #f0f0f0;
}

.stat-item {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.stat-number {
	font-size: 36rpx;
	font-weight: bold;
	color: #ff6b00;
	margin-bottom: 8rpx;
}

.stat-label {
	font-size: 24rpx;
	color: #999;
}

/* 底部操作栏 - 简化版本 */
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
	/* 适配安全区域 */
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

.action-buttons {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
	width: 100%;
}

.btn {
	flex: 1;
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	height: 80rpx;
	border: none;
	border-radius: 12rpx;
	font-size: 32rpx;
	font-weight: 600;
	transition: all 0.2s;
}

.contact-btn {
	background-color: #f8f9fa;
	color: #666;
	border: 1rpx solid #e9ecef;
}

.accept-btn {
	background-color: #ff6b00;
	color: white;
	border: none;
}

.btn:active {
	opacity: 0.8;
	transform: scale(0.98);
}

/* 接单确认对话框 */
.accept-dialog {
	background-color: #fff;
	border-radius: 24rpx;
	padding: 40rpx;
	margin: 0 40rpx;
	max-width: 600rpx;
}

.dialog-header {
	text-align: center;
	margin-bottom: 30rpx;
}

.dialog-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
}

.dialog-content {
	margin-bottom: 40rpx;
}

.dialog-message {
	font-size: 28rpx;
	line-height: 1.5;
	color: #666;
	text-align: center;
}

.dialog-actions {
	display: flex;
	gap: 20rpx;
}

.dialog-btn {
	flex: 1;
	padding: 20rpx;
	border-radius: 12rpx;
	font-size: 28rpx;
	font-weight: 500;
}

.dialog-btn.cancel {
	background-color: #f8f9fa;
	color: #666;
	border: 1rpx solid #e9ecef;
}

.dialog-btn.confirm {
	background-color: #ff6b00;
	color: white;
	border: none;
}

/* 加载状态 */
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

/* 错误状态 */
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

/* 状态样式类 */
.project-status.pending {
	background: rgba(255, 255, 255, 0.2);
}

.project-status.bidding {
	background: rgba(255, 255, 255, 0.3);
}

.project-status.in-progress {
	background: rgba(255, 255, 255, 0.4);
}

.project-status.completed {
	background: rgba(255, 255, 255, 0.5);
}

.project-status.cancelled {
	background: rgba(255, 255, 255, 0.1);
}
</style>