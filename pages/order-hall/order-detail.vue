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
			<view class="project-status" :class="getStatusClass(projectDetail.status)">
				{{ getStatusText(projectDetail.status) }}
			</view>
			
			<view class="project-title">{{ projectDetail.title || '加载中...' }}</view>
			
			<view class="project-meta">
				<view class="meta-item">
					<text class="meta-icon">📍</text>
					<text class="meta-text">{{ projectDetail.address || '未指定地区' }}</text>
				</view>
				<view class="meta-item">
					<text class="meta-icon">⏰</text>
					<text class="meta-text">{{ formatDate(projectDetail.deadline) }}</text>
				</view>
				<view class="meta-item">
					<text class="meta-icon">💰</text>
					<text class="meta-text budget">{{ formatBudget(projectDetail.budget) }}</text>
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
					<text class="requirement-value">{{ getRoleText(projectDetail.requiredRoles) }}</text>
				</view>
				<view class="requirement-item">
					<text class="requirement-label">项目面积：</text>
					<text class="requirement-value">{{ projectDetail.area || '未指定' }}㎡</text>
				</view>
				<view class="requirement-item">
					<text class="requirement-label">项目类型：</text>
					<text class="requirement-value">{{ getProjectTypeText(projectDetail.projectType) }}</text>
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
							:src="getPublisherAvatar()" 
							class="avatar-image" 
							mode="aspectFill"
						/>
					</view>
					<view class="publisher-details">
						<text class="publisher-name">{{ getPublisherName() }}</text>
						<text class="publisher-meta">发布于 {{ formatTime(projectDetail.createTime) }}</text>
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
				<button class="btn contact-btn" @click="contactPublisher">联系用户</button>
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
					<text class="dialog-message">确定要接取这个订单吗？接单后您将负责此项目的{{ getRoleText(projectDetail.requiredRoles) }}工作。</text>
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
import { getUserProfile } from '@/api/users.js'
import { getCurrentRole } from '@/api/users.js'

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
			currentUser: null,
			
			// 加载状态
			loading: false,
			error: false,
			errorMessage: '',
			
			// 状态映射
			statusMap: {
				0: { text: '草稿', class: 'pending' },
				1: { text: '发布中', class: 'bidding' },
				2: { text: '设计师接单', class: 'in-progress' },
				3: { text: '监理接单', class: 'in-progress' },
				4: { text: '全部接单', class: 'completed' },
				5: { text: '已取消', class: 'cancelled' }
			},
			
			// 角色映射 - 添加字符串映射
			roleMap: {
				1: '设计师',
				2: '监理',
				3: '设计师和监理',
				'designer': '设计师',
				'supervisor': '监理'
			},
			
			projectTypeMap: {
				1: '住宅装修',
				2: '商业空间',
				3: '办公室装修',
				4: '其他'
			}
		}
	},
	
	onLoad(options) {
		if (options.id) {
			this.projectId = options.id
			this.loadProjectDetail()
			this.getCurrentUserInfo()
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
		// 获取当前用户信息
		async getCurrentUserInfo() {
			try {
				const token = uni.getStorageSync('token')
				if (!token) {
					console.log('用户未登录')
					return
				}
				
				// 先从本地存储获取用户信息
				const userInfo = uni.getStorageSync('userInfo')
				if (userInfo) {
					this.currentUser = userInfo
					console.log('从本地存储获取用户信息:', this.currentUser)
				}
				
				// 调用接口获取当前角色信息
				try {
					const roleRes = await getCurrentRole()
					console.log('获取当前角色响应:', roleRes)
					
					if (roleRes.code === 200 || roleRes.success) {
						const roleData = roleRes.data || roleRes.result
						
						// 更新当前用户信息
						if (!this.currentUser) {
							this.currentUser = {}
						}
						
						// 设置角色类型 - 处理字符串角色
						if (roleData.roleType !== undefined) {
							this.currentUser.currentRoleType = roleData.roleType
						} else if (roleData.role) {
							// 如果返回的是role字段
							this.currentUser.currentRoleType = roleData.role
						}
						
						// 设置用户ID
						if (roleData.userId) {
							this.currentUser.userId = roleData.userId
						}
						
						console.log('更新后的当前用户信息:', this.currentUser)
					} else {
						console.warn('获取角色信息失败:', roleRes.msg || roleRes.message)
					}
				} catch (roleError) {
					console.error('调用角色接口失败:', roleError)
					// 如果接口调用失败，尝试从本地存储中获取角色信息
					if (userInfo && userInfo.currentRoleType) {
						this.currentUser.currentRoleType = userInfo.currentRoleType
					}
				}
				
			} catch (error) {
				console.error('获取当前用户信息失败:', error)
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
					// 格式化项目数据，确保字段正确映射
					this.projectDetail = this.formatProjectData(result)
					console.log('格式化后的项目详情:', this.projectDetail)
					
					// 加载发布者详细信息 - 使用 createBy 或 userId
					const publisherId = result.createBy || result.userId
					await this.loadPublisherInfo(publisherId)
					
					// 加载发布者统计信息
					await this.loadPublisherStats(publisherId)
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
		
		// 格式化项目数据 - 修正状态字段类型
		formatProjectData(projectData) {
			return {
				// 基本信息
				projectId: projectData.projectId,
				title: projectData.title,
				description: projectData.description,
				requiredRoles: projectData.requiredRoles,
				budget: projectData.budget,
				area: projectData.area,
				address: projectData.address,
				status: Number(projectData.status), // 确保状态是数字类型
				deadline: projectData.deadline,
				
				// 用户信息
				userId: projectData.userId,
				createBy: projectData.createBy,
				createdBy: projectData.createdBy,
				
				// 时间信息
				createTime: projectData.createTime,
				updateTime: projectData.updateTime,
				
				// 其他字段
				remark: projectData.remark,
				updateBy: projectData.updateBy,
				updatedBy: projectData.updatedBy,
				delFlag: projectData.delFlag,
				
				// 扩展字段（如果有）
				style: projectData.style,
				projectType: projectData.projectType,
				specialRequirements: projectData.specialRequirements,
				images: projectData.images || [],
				contactPhone: projectData.contactPhone
			}
		},
		
		// 加载发布者详细信息
		async loadPublisherInfo(userId) {
			if (!userId) {
				console.log('没有用户ID，使用默认发布者信息')
				this.publisherInfo = this.getDefaultPublisherInfo()
				return
			}
			
			try {
				console.log('正在获取发布者信息，用户ID:', userId)
				const userInfo = await getUserProfile(userId)
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
				name: this.projectDetail.createBy || this.projectDetail.createdBy || '匿名用户',
				phone: '',
				avatar: '/static/images/default-avatar.png',
				userId: '',
				currentRoleType: 'user'
			}
		},
		
		// 获取发布者显示名称
		getPublisherName() {
			if (this.publisherInfo && this.publisherInfo.name) {
				return this.publisherInfo.name
			}
			return this.projectDetail.createBy || this.projectDetail.createdBy || '匿名用户'
		},
		
		// 获取发布者头像
		getPublisherAvatar() {
			if (this.publisherInfo && this.publisherInfo.avatar) {
				return this.publisherInfo.avatar
			}
			return '/static/images/default-avatar.png'
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
		
		// 联系发布者
		contactPublisher() {
			const phone = this.getPublisherPhone()
			if (phone) {
				uni.makePhoneCall({
					phoneNumber: phone
				})
			} else {
				uni.showToast({
					title: '暂无联系电话',
					icon: 'none'
				})
			}
		},
		
		// 接取订单 - 修正状态检查逻辑
		async acceptOrder() {
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
			
			// 如果没有用户信息，重新获取
			if (!this.currentUser) {
				await this.getCurrentUserInfo()
			}
			
			// 调试信息：打印当前用户信息和项目信息
			console.log('🔍 调试信息 - 当前用户:', this.currentUser)
			console.log('🔍 调试信息 - 项目详情:', this.projectDetail)
			console.log('🔍 调试信息 - 项目状态:', this.projectDetail.status, '类型:', typeof this.projectDetail.status, '(1=发布中才可接单)')
			console.log('🔍 调试信息 - 所需角色:', this.projectDetail.requiredRoles, this.getRoleText(this.projectDetail.requiredRoles))
			console.log('🔍 调试信息 - 用户角色:', this.currentUser?.currentRoleType, this.getRoleText(this.currentUser?.currentRoleType))
			
			// 检查当前用户角色
			if (!this.currentUser || !this.currentUser.currentRoleType) {
				console.log('❌ 接单失败: 用户角色信息不完整')
				uni.showModal({
					title: '提示',
					content: '请先完善您的角色信息',
					confirmText: '去完善',
					success: (res) => {
						if (res.confirm) {
							uni.navigateTo({
								url: '/pages/profile/profile'
							})
						}
					}
				})
				return
			}
			
			// 检查项目状态是否允许接单 - 使用宽松比较
			const projectStatus = Number(this.projectDetail.status) // 确保是数字
			console.log('🔍 状态检查:', '项目状态:', projectStatus, '类型:', typeof projectStatus)
			
			if (projectStatus !== 1) {
				console.log('❌ 接单失败: 项目状态不允许接单，当前状态:', projectStatus)
				uni.showToast({
					title: '当前项目状态不允许接单',
					icon: 'none'
				})
				return
			}
			
			console.log('✅ 项目状态检查通过')
			
			// 检查用户角色是否符合项目要求
			const userRole = this.currentUser.currentRoleType
			const requiredRoles = this.projectDetail.requiredRoles
			
			console.log('🔍 角色匹配检查:')
			console.log('  - 用户角色:', userRole, this.getRoleText(userRole))
			console.log('  - 项目需求:', requiredRoles, this.getRoleText(requiredRoles))
			console.log('  - 是否匹配:', this.isRoleMatch(userRole, requiredRoles))
			
			if (!this.isRoleMatch(userRole, requiredRoles)) {
				console.log('❌ 接单失败: 角色不匹配')
				uni.showToast({
					title: '您的角色不符合项目要求',
					icon: 'none'
				})
				return
			}
			
			console.log('✅ 所有检查通过，显示接单确认对话框')
			// 显示确认接单对话框
			this.$refs.acceptPopup.open()
		},
		
		// 检查用户角色是否符合项目要求 - 修正字符串角色处理
		isRoleMatch(userRole, requiredRoles) {
			// userRole: 当前用户角色 (1/designer-设计师, 2/supervisor-监理)
			// requiredRoles: 项目所需角色 (1-设计师, 2-监理, 3-设计师和监理)
			
			console.log('🔍 角色匹配逻辑:')
			console.log('  - 用户角色类型:', typeof userRole, '值:', userRole)
			console.log('  - 需求角色类型:', typeof requiredRoles, '值:', requiredRoles)
			
			// 将用户角色转换为数字格式以便比较
			let userRoleNum = userRole
			if (typeof userRole === 'string') {
				if (userRole === 'designer') {
					userRoleNum = 1
				} else if (userRole === 'supervisor') {
					userRoleNum = 2
				}
			}
			
			console.log('  - 转换后的用户角色:', userRoleNum)
			
			if (requiredRoles === 3) {
				// 需要设计师和监理，任何角色都可以接单
				const result = userRoleNum === 1 || userRoleNum === 2
				console.log('  - 需求为设计师和监理(3)，任何角色都可接单，结果:', result)
				return result
			} else {
				// 需要特定角色
				const result = userRoleNum == requiredRoles // 使用 == 避免类型问题
				console.log('  - 需求为特定角色，需要精确匹配，结果:', result)
				return result
			}
		},
		
		// 计算接单后的新状态 - 修正字符串角色处理
		calculateNewStatus() {
			const currentStatus = Number(this.projectDetail.status) // 确保是数字
			const requiredRoles = this.projectDetail.requiredRoles
			let userRole = this.currentUser.currentRoleType
			
			console.log('🔍 计算新状态:')
			console.log('  - 当前状态:', currentStatus, '类型:', typeof currentStatus)
			console.log('  - 需求角色:', requiredRoles)
			console.log('  - 用户角色:', userRole)
			
			// 如果当前状态不是发布中(1)，不允许接单
			if (currentStatus !== 1) {
				console.log('  - 状态不是发布中，返回原状态:', currentStatus)
				return currentStatus
			}
			
			// 将用户角色转换为数字格式
			if (typeof userRole === 'string') {
				if (userRole === 'designer') {
					userRole = 1
				} else if (userRole === 'supervisor') {
					userRole = 2
				}
			}
			
			let newStatus = currentStatus
			
			// 根据项目需求和当前用户角色确定新状态
			if (requiredRoles === 1 || requiredRoles === 2) {
				// 需求状态为1（设计师）或2（监理），把状态改为4（全部接单）
				newStatus = 4
				console.log('  - 需求为单一角色，接单后状态改为4(全部接单)')
			} else if (requiredRoles === 3) {
				// 需求状态是3（设计师和监理），根据当前用户角色判断
				if (userRole === 1) {
					// 设计师接单，状态改为2（设计师接单）
					newStatus = 2
					console.log('  - 设计师接单，状态改为2(设计师接单)')
				} else if (userRole === 2) {
					// 监理接单，状态改为3（监理接单）
					newStatus = 3
					console.log('  - 监理接单，状态改为3(监理接单)')
				}
			}
			
			console.log('  - 最终新状态:', newStatus)
			return newStatus
		},
		
		// 确认接单 - 简化参数，只传递必要的参数
		async confirmAcceptOrder() {
			try {
				this.loading = true
				
				// 计算新的项目状态
				const newStatus = this.calculateNewStatus()
				console.log('🎯 确认接单 - 新状态:', newStatus, '用户角色:', this.currentUser.currentRoleType)
				
				// 直接调用更新状态接口，只传递必要的参数
				const result = await projectService.updateProjectStatus(this.projectId, newStatus)
				
				console.log('✅ 接单成功:', result)
				
				uni.showToast({
					title: '接单成功',
					icon: 'success',
					duration: 2000
				})
				
				// 关闭对话框
				this.closeAcceptDialog()
				
				// 更新项目状态
				this.projectDetail.status = newStatus
				
				// 延迟返回上一页
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
				
			} catch (error) {
				console.error('❌ 接单失败:', error)
				
				// 显示更详细的错误信息
				let errorMessage = '接单失败，请重试'
				if (error.message && error.message.includes('接单失败')) {
					errorMessage = '接单失败，可能已被其他用户接单'
				} else if (error.message) {
					errorMessage = error.message
				}
				
				uni.showToast({
					title: errorMessage,
					icon: 'none',
					duration: 3000
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
		},
		
		// 获取状态样式类
		getStatusClass(status) {
			return this.statusMap[status]?.class || 'pending'
		},
		
		// 获取状态文本
		getStatusText(status) {
			return this.statusMap[status]?.text || '未知状态'
		},
		
		// 获取角色文本 - 支持字符串角色
		getRoleText(role) {
			if (typeof role === 'string') {
				return this.roleMap[role] || '未知角色'
			}
			return this.roleMap[role] || '未知角色'
		},
		
		// 获取项目类型文本
		getProjectTypeText(type) {
			return this.projectTypeMap[type] || '其他'
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
		
		// 格式化时间
		formatTime(time) {
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
		}
	}
}
</script>
import { projectService } from '@/api/project.js'
import { getUserProfile } from '@/api/users.js'
import { getCurrentRole } from '@/api/users.js'

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
			currentUser: null,
			
			// 加载状态
			loading: false,
			error: false,
			errorMessage: '',
			
			// 状态映射
			statusMap: {
				0: { text: '草稿', class: 'pending' },
				1: { text: '发布中', class: 'bidding' },
				2: { text: '设计师接单', class: 'in-progress' },
				3: { text: '监理接单', class: 'in-progress' },
				4: { text: '全部接单', class: 'completed' },
				5: { text: '已取消', class: 'cancelled' }
			},
			
			// 角色映射 - 添加字符串映射
			roleMap: {
				1: '设计师',
				2: '监理',
				3: '设计师和监理',
				'designer': '设计师',
				'supervisor': '监理'
			},
			
			projectTypeMap: {
				1: '住宅装修',
				2: '商业空间',
				3: '办公室装修',
				4: '其他'
			}
		}
	},
	
	onLoad(options) {
		if (options.id) {
			this.projectId = options.id
			this.loadProjectDetail()
			this.getCurrentUserInfo()
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
		// 获取当前用户信息
		async getCurrentUserInfo() {
			try {
				const token = uni.getStorageSync('token')
				if (!token) {
					console.log('用户未登录')
					return
				}
				
				// 先从本地存储获取用户信息
				const userInfo = uni.getStorageSync('userInfo')
				if (userInfo) {
					this.currentUser = userInfo
					console.log('从本地存储获取用户信息:', this.currentUser)
				}
				
				// 调用接口获取当前角色信息
				try {
					const roleRes = await getCurrentRole()
					console.log('获取当前角色响应:', roleRes)
					
					if (roleRes.code === 200 || roleRes.success) {
						const roleData = roleRes.data || roleRes.result
						
						// 更新当前用户信息
						if (!this.currentUser) {
							this.currentUser = {}
						}
						
						// 设置角色类型 - 处理字符串角色
						if (roleData.roleType !== undefined) {
							this.currentUser.currentRoleType = roleData.roleType
						} else if (roleData.role) {
							// 如果返回的是role字段
							this.currentUser.currentRoleType = roleData.role
						}
						
						// 设置用户ID
						if (roleData.userId) {
							this.currentUser.userId = roleData.userId
						}
						
						console.log('更新后的当前用户信息:', this.currentUser)
					} else {
						console.warn('获取角色信息失败:', roleRes.msg || roleRes.message)
					}
				} catch (roleError) {
					console.error('调用角色接口失败:', roleError)
					// 如果接口调用失败，尝试从本地存储中获取角色信息
					if (userInfo && userInfo.currentRoleType) {
						this.currentUser.currentRoleType = userInfo.currentRoleType
					}
				}
				
			} catch (error) {
				console.error('获取当前用户信息失败:', error)
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
					// 格式化项目数据，确保字段正确映射
					this.projectDetail = this.formatProjectData(result)
					console.log('格式化后的项目详情:', this.projectDetail)
					
					// 加载发布者详细信息 - 使用 createBy 或 userId
					const publisherId = result.createBy || result.userId
					await this.loadPublisherInfo(publisherId)
					
					// 加载发布者统计信息
					await this.loadPublisherStats(publisherId)
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
		
		// 格式化项目数据 - 修正状态字段类型
		formatProjectData(projectData) {
			return {
				// 基本信息
				projectId: projectData.projectId,
				title: projectData.title,
				description: projectData.description,
				requiredRoles: projectData.requiredRoles,
				budget: projectData.budget,
				area: projectData.area,
				address: projectData.address,
				status: Number(projectData.status), // 确保状态是数字类型
				deadline: projectData.deadline,
				
				// 用户信息
				userId: projectData.userId,
				createBy: projectData.createBy,
				createdBy: projectData.createdBy,
				
				// 时间信息
				createTime: projectData.createTime,
				updateTime: projectData.updateTime,
				
				// 其他字段
				remark: projectData.remark,
				updateBy: projectData.updateBy,
				updatedBy: projectData.updatedBy,
				delFlag: projectData.delFlag,
				
				// 扩展字段（如果有）
				style: projectData.style,
				projectType: projectData.projectType,
				specialRequirements: projectData.specialRequirements,
				images: projectData.images || [],
				contactPhone: projectData.contactPhone
			}
		},
		
		// 加载发布者详细信息
		async loadPublisherInfo(userId) {
			if (!userId) {
				console.log('没有用户ID，使用默认发布者信息')
				this.publisherInfo = this.getDefaultPublisherInfo()
				return
			}
			
			try {
				console.log('正在获取发布者信息，用户ID:', userId)
				const userInfo = await getUserProfile(userId)
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
				name: this.projectDetail.createBy || this.projectDetail.createdBy || '匿名用户',
				phone: '',
				avatar: '/static/images/default-avatar.png',
				userId: '',
				currentRoleType: 'user'
			}
		},
		
		// 获取发布者显示名称
		getPublisherName() {
			if (this.publisherInfo && this.publisherInfo.name) {
				return this.publisherInfo.name
			}
			return this.projectDetail.createBy || this.projectDetail.createdBy || '匿名用户'
		},
		
		// 获取发布者头像
		getPublisherAvatar() {
			if (this.publisherInfo && this.publisherInfo.avatar) {
				return this.publisherInfo.avatar
			}
			return '/static/images/default-avatar.png'
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
		
		// 联系发布者
		contactPublisher() {
			const phone = this.getPublisherPhone()
			if (phone) {
				uni.makePhoneCall({
					phoneNumber: phone
				})
			} else {
				uni.showToast({
					title: '暂无联系电话',
					icon: 'none'
				})
			}
		},
		
		// 接取订单 - 修正状态检查逻辑
		async acceptOrder() {
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
			
			// 如果没有用户信息，重新获取
			if (!this.currentUser) {
				await this.getCurrentUserInfo()
			}
			
			// 调试信息：打印当前用户信息和项目信息
			console.log('🔍 调试信息 - 当前用户:', this.currentUser)
			console.log('🔍 调试信息 - 项目详情:', this.projectDetail)
			console.log('🔍 调试信息 - 项目状态:', this.projectDetail.status, '类型:', typeof this.projectDetail.status, '(1=发布中才可接单)')
			console.log('🔍 调试信息 - 所需角色:', this.projectDetail.requiredRoles, this.getRoleText(this.projectDetail.requiredRoles))
			console.log('🔍 调试信息 - 用户角色:', this.currentUser?.currentRoleType, this.getRoleText(this.currentUser?.currentRoleType))
			
			// 检查当前用户角色
			if (!this.currentUser || !this.currentUser.currentRoleType) {
				console.log('❌ 接单失败: 用户角色信息不完整')
				uni.showModal({
					title: '提示',
					content: '请先完善您的角色信息',
					confirmText: '去完善',
					success: (res) => {
						if (res.confirm) {
							uni.navigateTo({
								url: '/pages/profile/profile'
							})
						}
					}
				})
				return
			}
			
			// 检查项目状态是否允许接单 - 使用宽松比较
			const projectStatus = Number(this.projectDetail.status) // 确保是数字
			console.log('🔍 状态检查:', '项目状态:', projectStatus, '类型:', typeof projectStatus)
			
			if (projectStatus !== 1) {
				console.log('❌ 接单失败: 项目状态不允许接单，当前状态:', projectStatus)
				uni.showToast({
					title: '当前项目状态不允许接单',
					icon: 'none'
				})
				return
			}
			
			console.log('✅ 项目状态检查通过')
			
			// 检查用户角色是否符合项目要求
			const userRole = this.currentUser.currentRoleType
			const requiredRoles = this.projectDetail.requiredRoles
			
			console.log('🔍 角色匹配检查:')
			console.log('  - 用户角色:', userRole, this.getRoleText(userRole))
			console.log('  - 项目需求:', requiredRoles, this.getRoleText(requiredRoles))
			console.log('  - 是否匹配:', this.isRoleMatch(userRole, requiredRoles))
			
			if (!this.isRoleMatch(userRole, requiredRoles)) {
				console.log('❌ 接单失败: 角色不匹配')
				uni.showToast({
					title: '您的角色不符合项目要求',
					icon: 'none'
				})
				return
			}
			
			console.log('✅ 所有检查通过，显示接单确认对话框')
			// 显示确认接单对话框
			this.$refs.acceptPopup.open()
		},
		
		// 检查用户角色是否符合项目要求 - 修正字符串角色处理
		isRoleMatch(userRole, requiredRoles) {
			// userRole: 当前用户角色 (1/designer-设计师, 2/supervisor-监理)
			// requiredRoles: 项目所需角色 (1-设计师, 2-监理, 3-设计师和监理)
			
			console.log('🔍 角色匹配逻辑:')
			console.log('  - 用户角色类型:', typeof userRole, '值:', userRole)
			console.log('  - 需求角色类型:', typeof requiredRoles, '值:', requiredRoles)
			
			// 将用户角色转换为数字格式以便比较
			let userRoleNum = userRole
			if (typeof userRole === 'string') {
				if (userRole === 'designer') {
					userRoleNum = 1
				} else if (userRole === 'supervisor') {
					userRoleNum = 2
				}
			}
			
			console.log('  - 转换后的用户角色:', userRoleNum)
			
			if (requiredRoles === 3) {
				// 需要设计师和监理，任何角色都可以接单
				const result = userRoleNum === 1 || userRoleNum === 2
				console.log('  - 需求为设计师和监理(3)，任何角色都可接单，结果:', result)
				return result
			} else {
				// 需要特定角色
				const result = userRoleNum == requiredRoles // 使用 == 避免类型问题
				console.log('  - 需求为特定角色，需要精确匹配，结果:', result)
				return result
			}
		},
		
		// 计算接单后的新状态 - 修正字符串角色处理
		calculateNewStatus() {
			const currentStatus = Number(this.projectDetail.status) // 确保是数字
			const requiredRoles = this.projectDetail.requiredRoles
			let userRole = this.currentUser.currentRoleType
			
			console.log('🔍 计算新状态:')
			console.log('  - 当前状态:', currentStatus, '类型:', typeof currentStatus)
			console.log('  - 需求角色:', requiredRoles)
			console.log('  - 用户角色:', userRole)
			
			// 如果当前状态不是发布中(1)，不允许接单
			if (currentStatus !== 1) {
				console.log('  - 状态不是发布中，返回原状态:', currentStatus)
				return currentStatus
			}
			
			// 将用户角色转换为数字格式
			if (typeof userRole === 'string') {
				if (userRole === 'designer') {
					userRole = 1
				} else if (userRole === 'supervisor') {
					userRole = 2
				}
			}
			
			let newStatus = currentStatus
			
			// 根据项目需求和当前用户角色确定新状态
			if (requiredRoles === 1 || requiredRoles === 2) {
				// 需求状态为1（设计师）或2（监理），把状态改为4（全部接单）
				newStatus = 4
				console.log('  - 需求为单一角色，接单后状态改为4(全部接单)')
			} else if (requiredRoles === 3) {
				// 需求状态是3（设计师和监理），根据当前用户角色判断
				if (userRole === 1) {
					// 设计师接单，状态改为2（设计师接单）
					newStatus = 2
					console.log('  - 设计师接单，状态改为2(设计师接单)')
				} else if (userRole === 2) {
					// 监理接单，状态改为3（监理接单）
					newStatus = 3
					console.log('  - 监理接单，状态改为3(监理接单)')
				}
			}
			
			console.log('  - 最终新状态:', newStatus)
			return newStatus
		},
		
		// 确认接单
		async confirmAcceptOrder() {
			try {
				this.loading = true
				
				// 计算新的项目状态
				const newStatus = this.calculateNewStatus()
				console.log('🎯 确认接单 - 新状态:', newStatus, '用户角色:', this.currentUser.currentRoleType)
				
				// 调用接单接口
				const result = await projectService.acceptProject({
					projectId: this.projectId,
					status: newStatus,
					acceptedBy: this.currentUser.userId || this.currentUser.id,
					acceptedRole: this.currentUser.currentRoleType
				})
				
				console.log('✅ 接单成功:', result)
				
				uni.showToast({
					title: '接单成功',
					icon: 'success',
					duration: 2000
				})
				
				// 关闭对话框
				this.closeAcceptDialog()
				
				// 更新项目状态
				this.projectDetail.status = newStatus
				
				// 延迟返回上一页
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
				
			} catch (error) {
				console.error('❌ 接单失败:', error)
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
		},
		
		// 获取状态样式类
		getStatusClass(status) {
			return this.statusMap[status]?.class || 'pending'
		},
		
		// 获取状态文本
		getStatusText(status) {
			return this.statusMap[status]?.text || '未知状态'
		},
		
		// 获取角色文本 - 支持字符串角色
		getRoleText(role) {
			if (typeof role === 'string') {
				return this.roleMap[role] || '未知角色'
			}
			return this.roleMap[role] || '未知角色'
		},
		
		// 获取项目类型文本
		getProjectTypeText(type) {
			return this.projectTypeMap[type] || '其他'
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
		
		// 格式化时间
		formatTime(time) {
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
		}
	}
}
</script>
import { projectService } from '@/api/project.js'
import { getUserProfile } from '@/api/users.js'
import { getCurrentRole } from '@/api/users.js'

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
			currentUser: null,
			
			// 加载状态
			loading: false,
			error: false,
			errorMessage: '',
			
			// 状态映射
			statusMap: {
				0: { text: '草稿', class: 'pending' },
				1: { text: '发布中', class: 'bidding' },
				2: { text: '设计师接单', class: 'in-progress' },
				3: { text: '监理接单', class: 'in-progress' },
				4: { text: '全部接单', class: 'completed' },
				5: { text: '已取消', class: 'cancelled' }
			},
			
			// 角色映射 - 添加字符串映射
			roleMap: {
				1: '设计师',
				2: '监理',
				3: '设计师和监理',
				'designer': '设计师',
				'supervisor': '监理'
			},
			
			projectTypeMap: {
				1: '住宅装修',
				2: '商业空间',
				3: '办公室装修',
				4: '其他'
			}
		}
	},
	
	onLoad(options) {
		if (options.id) {
			this.projectId = options.id
			this.loadProjectDetail()
			this.getCurrentUserInfo()
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
		// 获取当前用户信息
		async getCurrentUserInfo() {
			try {
				const token = uni.getStorageSync('token')
				if (!token) {
					console.log('用户未登录')
					return
				}
				
				// 先从本地存储获取用户信息
				const userInfo = uni.getStorageSync('userInfo')
				if (userInfo) {
					this.currentUser = userInfo
					console.log('从本地存储获取用户信息:', this.currentUser)
				}
				
				// 调用接口获取当前角色信息
				try {
					const roleRes = await getCurrentRole()
					console.log('获取当前角色响应:', roleRes)
					
					if (roleRes.code === 200 || roleRes.success) {
						const roleData = roleRes.data || roleRes.result
						
						// 更新当前用户信息
						if (!this.currentUser) {
							this.currentUser = {}
						}
						
						// 设置角色类型 - 处理字符串角色
						if (roleData.roleType !== undefined) {
							this.currentUser.currentRoleType = roleData.roleType
						} else if (roleData.role) {
							// 如果返回的是role字段
							this.currentUser.currentRoleType = roleData.role
						}
						
						// 设置用户ID
						if (roleData.userId) {
							this.currentUser.userId = roleData.userId
						}
						
						console.log('更新后的当前用户信息:', this.currentUser)
					} else {
						console.warn('获取角色信息失败:', roleRes.msg || roleRes.message)
					}
				} catch (roleError) {
					console.error('调用角色接口失败:', roleError)
					// 如果接口调用失败，尝试从本地存储中获取角色信息
					if (userInfo && userInfo.currentRoleType) {
						this.currentUser.currentRoleType = userInfo.currentRoleType
					}
				}
				
			} catch (error) {
				console.error('获取当前用户信息失败:', error)
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
					// 格式化项目数据，确保字段正确映射
					this.projectDetail = this.formatProjectData(result)
					console.log('格式化后的项目详情:', this.projectDetail)
					
					// 加载发布者详细信息 - 使用 createBy 或 userId
					const publisherId = result.createBy || result.userId
					await this.loadPublisherInfo(publisherId)
					
					// 加载发布者统计信息
					await this.loadPublisherStats(publisherId)
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
		
		// 格式化项目数据
		formatProjectData(projectData) {
			return {
				// 基本信息
				projectId: projectData.projectId,
				title: projectData.title,
				description: projectData.description,
				requiredRoles: projectData.requiredRoles,
				budget: projectData.budget,
				area: projectData.area,
				address: projectData.address,
				status: projectData.status,
				deadline: projectData.deadline,
				
				// 用户信息
				userId: projectData.userId,
				createBy: projectData.createBy,
				createdBy: projectData.createdBy,
				
				// 时间信息
				createTime: projectData.createTime,
				updateTime: projectData.updateTime,
				
				// 其他字段
				remark: projectData.remark,
				updateBy: projectData.updateBy,
				updatedBy: projectData.updatedBy,
				delFlag: projectData.delFlag,
				
				// 扩展字段（如果有）
				style: projectData.style,
				projectType: projectData.projectType,
				specialRequirements: projectData.specialRequirements,
				images: projectData.images || [],
				contactPhone: projectData.contactPhone
			}
		},
		
		// 加载发布者详细信息
		async loadPublisherInfo(userId) {
			if (!userId) {
				console.log('没有用户ID，使用默认发布者信息')
				this.publisherInfo = this.getDefaultPublisherInfo()
				return
			}
			
			try {
				console.log('正在获取发布者信息，用户ID:', userId)
				const userInfo = await getUserProfile(userId)
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
				name: this.projectDetail.createBy || this.projectDetail.createdBy || '匿名用户',
				phone: '',
				avatar: '/static/images/default-avatar.png',
				userId: '',
				currentRoleType: 'user'
			}
		},
		
		// 获取发布者显示名称
		getPublisherName() {
			if (this.publisherInfo && this.publisherInfo.name) {
				return this.publisherInfo.name
			}
			return this.projectDetail.createBy || this.projectDetail.createdBy || '匿名用户'
		},
		
		// 获取发布者头像
		getPublisherAvatar() {
			if (this.publisherInfo && this.publisherInfo.avatar) {
				return this.publisherInfo.avatar
			}
			return '/static/images/default-avatar.png'
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
		
		// 联系发布者
		contactPublisher() {
			const phone = this.getPublisherPhone()
			if (phone) {
				uni.makePhoneCall({
					phoneNumber: phone
				})
			} else {
				uni.showToast({
					title: '暂无联系电话',
					icon: 'none'
				})
			}
		},
		
		// 接取订单 - 修正角色匹配逻辑
		async acceptOrder() {
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
			
			// 如果没有用户信息，重新获取
			if (!this.currentUser) {
				await this.getCurrentUserInfo()
			}
			
			// 调试信息：打印当前用户信息和项目信息
			console.log('🔍 调试信息 - 当前用户:', this.currentUser)
			console.log('🔍 调试信息 - 项目详情:', this.projectDetail)
			console.log('🔍 调试信息 - 项目状态:', this.projectDetail.status, '(1=发布中才可接单)')
			console.log('🔍 调试信息 - 所需角色:', this.projectDetail.requiredRoles, this.getRoleText(this.projectDetail.requiredRoles))
			console.log('🔍 调试信息 - 用户角色:', this.currentUser?.currentRoleType, this.getRoleText(this.currentUser?.currentRoleType))
			
			// 检查当前用户角色
			if (!this.currentUser || !this.currentUser.currentRoleType) {
				console.log('❌ 接单失败: 用户角色信息不完整')
				uni.showModal({
					title: '提示',
					content: '请先完善您的角色信息',
					confirmText: '去完善',
					success: (res) => {
						if (res.confirm) {
							uni.navigateTo({
								url: '/pages/profile/profile'
							})
						}
					}
				})
				return
			}
			
			// 检查项目状态是否允许接单
			if (this.projectDetail.status !== 1) {
				console.log('❌ 接单失败: 项目状态不允许接单，当前状态:', this.projectDetail.status)
				uni.showToast({
					title: '当前项目状态不允许接单',
					icon: 'none'
				})
				return
			}
			
			// 检查用户角色是否符合项目要求
			const userRole = this.currentUser.currentRoleType
			const requiredRoles = this.projectDetail.requiredRoles
			
			console.log('🔍 角色匹配检查:')
			console.log('  - 用户角色:', userRole, this.getRoleText(userRole))
			console.log('  - 项目需求:', requiredRoles, this.getRoleText(requiredRoles))
			console.log('  - 是否匹配:', this.isRoleMatch(userRole, requiredRoles))
			
			if (!this.isRoleMatch(userRole, requiredRoles)) {
				console.log('❌ 接单失败: 角色不匹配')
				uni.showToast({
					title: '您的角色不符合项目要求',
					icon: 'none'
				})
				return
			}
			
			console.log('✅ 所有检查通过，显示接单确认对话框')
			// 显示确认接单对话框
			this.$refs.acceptPopup.open()
		},
		
		// 检查用户角色是否符合项目要求 - 修正字符串角色处理
		isRoleMatch(userRole, requiredRoles) {
			// userRole: 当前用户角色 (1/designer-设计师, 2/supervisor-监理)
			// requiredRoles: 项目所需角色 (1-设计师, 2-监理, 3-设计师和监理)
			
			console.log('🔍 角色匹配逻辑:')
			console.log('  - 用户角色类型:', typeof userRole, '值:', userRole)
			console.log('  - 需求角色类型:', typeof requiredRoles, '值:', requiredRoles)
			
			// 将用户角色转换为数字格式以便比较
			let userRoleNum = userRole
			if (typeof userRole === 'string') {
				if (userRole === 'designer') {
					userRoleNum = 1
				} else if (userRole === 'supervisor') {
					userRoleNum = 2
				}
			}
			
			console.log('  - 转换后的用户角色:', userRoleNum)
			
			if (requiredRoles === 3) {
				// 需要设计师和监理，任何角色都可以接单
				const result = userRoleNum === 1 || userRoleNum === 2
				console.log('  - 需求为设计师和监理(3)，任何角色都可接单，结果:', result)
				return result
			} else {
				// 需要特定角色
				const result = userRoleNum == requiredRoles // 使用 == 避免类型问题
				console.log('  - 需求为特定角色，需要精确匹配，结果:', result)
				return result
			}
		},
		
		// 计算接单后的新状态 - 修正字符串角色处理
		calculateNewStatus() {
			const currentStatus = this.projectDetail.status
			const requiredRoles = this.projectDetail.requiredRoles
			let userRole = this.currentUser.currentRoleType
			
			console.log('🔍 计算新状态:')
			console.log('  - 当前状态:', currentStatus)
			console.log('  - 需求角色:', requiredRoles)
			console.log('  - 用户角色:', userRole)
			
			// 如果当前状态不是发布中(1)，不允许接单
			if (currentStatus !== 1) {
				console.log('  - 状态不是发布中，返回原状态:', currentStatus)
				return currentStatus
			}
			
			// 将用户角色转换为数字格式
			if (typeof userRole === 'string') {
				if (userRole === 'designer') {
					userRole = 1
				} else if (userRole === 'supervisor') {
					userRole = 2
				}
			}
			
			let newStatus = currentStatus
			
			// 根据项目需求和当前用户角色确定新状态
			if (requiredRoles === 1 || requiredRoles === 2) {
				// 需求状态为1（设计师）或2（监理），把状态改为4（全部接单）
				newStatus = 4
				console.log('  - 需求为单一角色，接单后状态改为4(全部接单)')
			} else if (requiredRoles === 3) {
				// 需求状态是3（设计师和监理），根据当前用户角色判断
				if (userRole === 1) {
					// 设计师接单，状态改为2（设计师接单）
					newStatus = 2
					console.log('  - 设计师接单，状态改为2(设计师接单)')
				} else if (userRole === 2) {
					// 监理接单，状态改为3（监理接单）
					newStatus = 3
					console.log('  - 监理接单，状态改为3(监理接单)')
				}
			}
			
			console.log('  - 最终新状态:', newStatus)
			return newStatus
		},
		
		// 确认接单
		async confirmAcceptOrder() {
			try {
				this.loading = true
				
				// 计算新的项目状态
				const newStatus = this.calculateNewStatus()
				console.log('🎯 确认接单 - 新状态:', newStatus, '用户角色:', this.currentUser.currentRoleType)
				
				// 调用接单接口
				const result = await projectService.acceptProject({
					projectId: this.projectId,
					status: newStatus,
					acceptedBy: this.currentUser.userId || this.currentUser.id,
					acceptedRole: this.currentUser.currentRoleType
				})
				
				console.log('✅ 接单成功:', result)
				
				uni.showToast({
					title: '接单成功',
					icon: 'success',
					duration: 2000
				})
				
				// 关闭对话框
				this.closeAcceptDialog()
				
				// 更新项目状态
				this.projectDetail.status = newStatus
				
				// 延迟返回上一页
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
				
			} catch (error) {
				console.error('❌ 接单失败:', error)
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
		},
		
		// 获取状态样式类
		getStatusClass(status) {
			return this.statusMap[status]?.class || 'pending'
		},
		
		// 获取状态文本
		getStatusText(status) {
			return this.statusMap[status]?.text || '未知状态'
		},
		
		// 获取角色文本 - 支持字符串角色
		getRoleText(role) {
			if (typeof role === 'string') {
				return this.roleMap[role] || '未知角色'
			}
			return this.roleMap[role] || '未知角色'
		},
		
		// 获取项目类型文本
		getProjectTypeText(type) {
			return this.projectTypeMap[type] || '其他'
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
		
		// 格式化时间
		formatTime(time) {
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
		}
	}
}
</script>
import { projectService } from '@/api/project.js'
import { getUserProfile } from '@/api/users.js'
import { getCurrentRole } from '@/api/users.js'

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
			currentUser: null,
			
			// 加载状态
			loading: false,
			error: false,
			errorMessage: '',
			
			// 状态映射 - 根据数据库结构修正
			statusMap: {
				0: { text: '草稿', class: 'pending' },
				1: { text: '发布中', class: 'bidding' },
				2: { text: '设计师接单', class: 'in-progress' },
				3: { text: '监理接单', class: 'in-progress' },
				4: { text: '全部接单', class: 'completed' },
				5: { text: '已取消', class: 'cancelled' }
			},
			
			// 角色映射
			roleMap: {
				1: '设计师',
				2: '监理',
				3: '设计师和监理'
			},
			
			projectTypeMap: {
				1: '住宅装修',
				2: '商业空间',
				3: '办公室装修',
				4: '其他'
			}
		}
	},
	
	onLoad(options) {
		if (options.id) {
			this.projectId = options.id
			this.loadProjectDetail()
			this.getCurrentUserInfo()
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
		// 获取当前用户信息
		async getCurrentUserInfo() {
			try {
				const token = uni.getStorageSync('token')
				if (!token) {
					console.log('用户未登录')
					return
				}
				
				// 先从本地存储获取用户信息
				const userInfo = uni.getStorageSync('userInfo')
				if (userInfo) {
					this.currentUser = userInfo
					console.log('从本地存储获取用户信息:', this.currentUser)
				}
				
				// 调用接口获取当前角色信息
				try {
					const roleRes = await getCurrentRole()
					console.log('获取当前角色响应:', roleRes)
					
					if (roleRes.code === 200 || roleRes.success) {
						const roleData = roleRes.data || roleRes.result
						
						// 更新当前用户信息
						if (!this.currentUser) {
							this.currentUser = {}
						}
						
						// 设置角色类型
						if (roleData.roleType !== undefined) {
							this.currentUser.currentRoleType = roleData.roleType
						}
						
						// 设置用户ID
						if (roleData.userId) {
							this.currentUser.userId = roleData.userId
						}
						
						console.log('更新后的当前用户信息:', this.currentUser)
					} else {
						console.warn('获取角色信息失败:', roleRes.msg || roleRes.message)
					}
				} catch (roleError) {
					console.error('调用角色接口失败:', roleError)
					// 如果接口调用失败，尝试从本地存储中获取角色信息
					if (userInfo && userInfo.currentRoleType) {
						this.currentUser.currentRoleType = userInfo.currentRoleType
					}
				}
				
			} catch (error) {
				console.error('获取当前用户信息失败:', error)
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
					// 格式化项目数据，确保字段正确映射
					this.projectDetail = this.formatProjectData(result)
					console.log('格式化后的项目详情:', this.projectDetail)
					
					// 加载发布者详细信息 - 使用 createBy 或 userId
					const publisherId = result.createBy || result.userId
					await this.loadPublisherInfo(publisherId)
					
					// 加载发布者统计信息
					await this.loadPublisherStats(publisherId)
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
		
		// 格式化项目数据
		formatProjectData(projectData) {
			return {
				// 基本信息
				projectId: projectData.projectId,
				title: projectData.title,
				description: projectData.description,
				requiredRoles: projectData.requiredRoles,
				budget: projectData.budget,
				area: projectData.area,
				address: projectData.address,
				status: projectData.status,
				deadline: projectData.deadline,
				
				// 用户信息
				userId: projectData.userId,
				createBy: projectData.createBy,
				createdBy: projectData.createdBy,
				
				// 时间信息
				createTime: projectData.createTime,
				updateTime: projectData.updateTime,
				
				// 其他字段
				remark: projectData.remark,
				updateBy: projectData.updateBy,
				updatedBy: projectData.updatedBy,
				delFlag: projectData.delFlag,
				
				// 扩展字段（如果有）
				style: projectData.style,
				projectType: projectData.projectType,
				specialRequirements: projectData.specialRequirements,
				images: projectData.images || [],
				contactPhone: projectData.contactPhone
			}
		},
		
		// 加载发布者详细信息
		async loadPublisherInfo(userId) {
			if (!userId) {
				console.log('没有用户ID，使用默认发布者信息')
				this.publisherInfo = this.getDefaultPublisherInfo()
				return
			}
			
			try {
				console.log('正在获取发布者信息，用户ID:', userId)
				const userInfo = await getUserProfile(userId)
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
				name: this.projectDetail.createBy || this.projectDetail.createdBy || '匿名用户',
				phone: '',
				avatar: '/static/images/default-avatar.png',
				userId: '',
				currentRoleType: 'user'
			}
		},
		
		// 获取发布者显示名称
		getPublisherName() {
			if (this.publisherInfo && this.publisherInfo.name) {
				return this.publisherInfo.name
			}
			return this.projectDetail.createBy || this.projectDetail.createdBy || '匿名用户'
		},
		
		// 获取发布者头像
		getPublisherAvatar() {
			if (this.publisherInfo && this.publisherInfo.avatar) {
				return this.publisherInfo.avatar
			}
			return '/static/images/default-avatar.png'
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
		
		// 联系发布者
		contactPublisher() {
			const phone = this.getPublisherPhone()
			if (phone) {
				uni.makePhoneCall({
					phoneNumber: phone
				})
			} else {
				uni.showToast({
					title: '暂无联系电话',
					icon: 'none'
				})
			}
		},
		
		// 接取订单 - 添加详细调试信息
		async acceptOrder() {
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
			
			// 如果没有用户信息，重新获取
			if (!this.currentUser) {
				await this.getCurrentUserInfo()
			}
			
			// 调试信息：打印当前用户信息和项目信息
			console.log('🔍 调试信息 - 当前用户:', this.currentUser)
			console.log('🔍 调试信息 - 项目详情:', this.projectDetail)
			console.log('🔍 调试信息 - 项目状态:', this.projectDetail.status, '(1=发布中才可接单)')
			console.log('🔍 调试信息 - 所需角色:', this.projectDetail.requiredRoles, this.getRoleText(this.projectDetail.requiredRoles))
			console.log('🔍 调试信息 - 用户角色:', this.currentUser?.currentRoleType, this.getRoleText(this.currentUser?.currentRoleType))
			
			// 检查当前用户角色
			if (!this.currentUser || !this.currentUser.currentRoleType) {
				console.log('❌ 接单失败: 用户角色信息不完整')
				uni.showModal({
					title: '提示',
					content: '请先完善您的角色信息',
					confirmText: '去完善',
					success: (res) => {
						if (res.confirm) {
							uni.navigateTo({
								url: '/pages/profile/profile'
							})
						}
					}
				})
				return
			}
			
			// 检查项目状态是否允许接单
			if (this.projectDetail.status !== 1) {
				console.log('❌ 接单失败: 项目状态不允许接单，当前状态:', this.projectDetail.status)
				uni.showToast({
					title: '当前项目状态不允许接单',
					icon: 'none'
				})
				return
			}
			
			// 检查用户角色是否符合项目要求
			const userRole = this.currentUser.currentRoleType
			const requiredRoles = this.projectDetail.requiredRoles
			
			console.log('🔍 角色匹配检查:')
			console.log('  - 用户角色:', userRole, this.getRoleText(userRole))
			console.log('  - 项目需求:', requiredRoles, this.getRoleText(requiredRoles))
			console.log('  - 是否匹配:', this.isRoleMatch(userRole, requiredRoles))
			
			if (!this.isRoleMatch(userRole, requiredRoles)) {
				console.log('❌ 接单失败: 角色不匹配')
				uni.showToast({
					title: '您的角色不符合项目要求',
					icon: 'none'
				})
				return
			}
			
			console.log('✅ 所有检查通过，显示接单确认对话框')
			// 显示确认接单对话框
			this.$refs.acceptPopup.open()
		},
		
		// 检查用户角色是否符合项目要求
		isRoleMatch(userRole, requiredRoles) {
			// userRole: 当前用户角色 (1-设计师, 2-监理)
			// requiredRoles: 项目所需角色 (1-设计师, 2-监理, 3-设计师和监理)
			
			console.log('🔍 角色匹配逻辑:')
			console.log('  - 用户角色类型:', typeof userRole, '值:', userRole)
			console.log('  - 需求角色类型:', typeof requiredRoles, '值:', requiredRoles)
			
			if (requiredRoles === 3) {
				// 需要设计师和监理，任何角色都可以接单
				const result = userRole === 1 || userRole === 2
				console.log('  - 需求为设计师和监理(3)，任何角色都可接单，结果:', result)
				return result
			} else {
				// 需要特定角色
				const result = userRole == requiredRoles // 使用 == 避免类型问题
				console.log('  - 需求为特定角色，需要精确匹配，结果:', result)
				return result
			}
		},
		
		// 计算接单后的新状态 - 根据数据库结构修正
		calculateNewStatus() {
			const currentStatus = this.projectDetail.status
			const requiredRoles = this.projectDetail.requiredRoles
			const userRole = this.currentUser.currentRoleType
			
			console.log('🔍 计算新状态:')
			console.log('  - 当前状态:', currentStatus)
			console.log('  - 需求角色:', requiredRoles)
			console.log('  - 用户角色:', userRole)
			
			// 如果当前状态不是发布中(1)，不允许接单
			if (currentStatus !== 1) {
				console.log('  - 状态不是发布中，返回原状态:', currentStatus)
				return currentStatus
			}
			
			let newStatus = currentStatus
			
			// 根据项目需求和当前用户角色确定新状态
			if (requiredRoles === 1 || requiredRoles === 2) {
				// 需求状态为1（设计师）或2（监理），把状态改为4（全部接单）
				newStatus = 4
				console.log('  - 需求为单一角色，接单后状态改为4(全部接单)')
			} else if (requiredRoles === 3) {
				// 需求状态是3（设计师和监理），根据当前用户角色判断
				if (userRole === 1) {
					// 设计师接单，状态改为2（设计师接单）
					newStatus = 2
					console.log('  - 设计师接单，状态改为2(设计师接单)')
				} else if (userRole === 2) {
					// 监理接单，状态改为3（监理接单）
					newStatus = 3
					console.log('  - 监理接单，状态改为3(监理接单)')
				}
			}
			
			console.log('  - 最终新状态:', newStatus)
			return newStatus
		},
		
		// 确认接单
		async confirmAcceptOrder() {
			try {
				this.loading = true
				
				// 计算新的项目状态
				const newStatus = this.calculateNewStatus()
				console.log('🎯 确认接单 - 新状态:', newStatus, '用户角色:', this.currentUser.currentRoleType)
				
				// 调用接单接口
				const result = await projectService.acceptProject({
					projectId: this.projectId,
					status: newStatus,
					acceptedBy: this.currentUser.userId || this.currentUser.id,
					acceptedRole: this.currentUser.currentRoleType
				})
				
				console.log('✅ 接单成功:', result)
				
				uni.showToast({
					title: '接单成功',
					icon: 'success',
					duration: 2000
				})
				
				// 关闭对话框
				this.closeAcceptDialog()
				
				// 更新项目状态
				this.projectDetail.status = newStatus
				
				// 延迟返回上一页
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
				
			} catch (error) {
				console.error('❌ 接单失败:', error)
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
		},
		
		// 获取状态样式类
		getStatusClass(status) {
			return this.statusMap[status]?.class || 'pending'
		},
		
		// 获取状态文本
		getStatusText(status) {
			return this.statusMap[status]?.text || '未知状态'
		},
		
		// 获取角色文本
		getRoleText(role) {
			return this.roleMap[role] || '未知角色'
		},
		
		// 获取项目类型文本
		getProjectTypeText(type) {
			return this.projectTypeMap[type] || '其他'
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
		
		// 格式化时间
		formatTime(time) {
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
		}
	}
}
</script>
import { projectService } from '@/api/project.js'
import { getUserProfile } from '@/api/users.js'
import { getCurrentRole } from '@/api/users.js'

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
			currentUser: null,
			
			// 加载状态
			loading: false,
			error: false,
			errorMessage: '',
			
			// 状态映射 - 根据数据库结构修正
			statusMap: {
				0: { text: '草稿', class: 'pending' },
				1: { text: '发布中', class: 'bidding' },
				2: { text: '设计师接单', class: 'in-progress' },
				3: { text: '监理接单', class: 'in-progress' },
				4: { text: '全部接单', class: 'completed' },
				5: { text: '已取消', class: 'cancelled' }
			},
			
			// 角色映射
			roleMap: {
				1: '设计师',
				2: '监理',
				3: '设计师和监理'
			},
			
			projectTypeMap: {
				1: '住宅装修',
				2: '商业空间',
				3: '办公室装修',
				4: '其他'
			}
		}
	},
	
	onLoad(options) {
		if (options.id) {
			this.projectId = options.id
			this.loadProjectDetail()
			this.getCurrentUserInfo()
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
		// 获取当前用户信息
		async getCurrentUserInfo() {
			try {
				const token = uni.getStorageSync('token')
				if (!token) {
					console.log('用户未登录')
					return
				}
				
				// 先从本地存储获取用户信息
				const userInfo = uni.getStorageSync('userInfo')
				if (userInfo) {
					this.currentUser = userInfo
					console.log('从本地存储获取用户信息:', this.currentUser)
				}
				
				// 调用接口获取当前角色信息
				try {
					const roleRes = await getCurrentRole()
					console.log('获取当前角色响应:', roleRes)
					
					if (roleRes.code === 200 || roleRes.success) {
						const roleData = roleRes.data || roleRes.result
						
						// 更新当前用户信息
						if (!this.currentUser) {
							this.currentUser = {}
						}
						
						// 设置角色类型
						if (roleData.roleType !== undefined) {
							this.currentUser.currentRoleType = roleData.roleType
						}
						
						// 设置用户ID
						if (roleData.userId) {
							this.currentUser.userId = roleData.userId
						}
						
						console.log('更新后的当前用户信息:', this.currentUser)
					} else {
						console.warn('获取角色信息失败:', roleRes.msg || roleRes.message)
					}
				} catch (roleError) {
					console.error('调用角色接口失败:', roleError)
					// 如果接口调用失败，尝试从本地存储中获取角色信息
					if (userInfo && userInfo.currentRoleType) {
						this.currentUser.currentRoleType = userInfo.currentRoleType
					}
				}
				
			} catch (error) {
				console.error('获取当前用户信息失败:', error)
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
					// 格式化项目数据，确保字段正确映射
					this.projectDetail = this.formatProjectData(result)
					console.log('格式化后的项目详情:', this.projectDetail)
					
					// 加载发布者详细信息 - 使用 createBy 或 userId
					const publisherId = result.createBy || result.userId
					await this.loadPublisherInfo(publisherId)
					
					// 加载发布者统计信息
					await this.loadPublisherStats(publisherId)
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
		
		// 格式化项目数据
		formatProjectData(projectData) {
			return {
				// 基本信息
				projectId: projectData.projectId,
				title: projectData.title,
				description: projectData.description,
				requiredRoles: projectData.requiredRoles,
				budget: projectData.budget,
				area: projectData.area,
				address: projectData.address,
				status: projectData.status,
				deadline: projectData.deadline,
				
				// 用户信息
				userId: projectData.userId,
				createBy: projectData.createBy,
				createdBy: projectData.createdBy,
				
				// 时间信息
				createTime: projectData.createTime,
				updateTime: projectData.updateTime,
				
				// 其他字段
				remark: projectData.remark,
				updateBy: projectData.updateBy,
				updatedBy: projectData.updatedBy,
				delFlag: projectData.delFlag,
				
				// 扩展字段（如果有）
				style: projectData.style,
				projectType: projectData.projectType,
				specialRequirements: projectData.specialRequirements,
				images: projectData.images || [],
				contactPhone: projectData.contactPhone
			}
		},
		
		// 接取订单 - 添加详细调试信息
		async acceptOrder() {
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
			
			// 如果没有用户信息，重新获取
			if (!this.currentUser) {
				await this.getCurrentUserInfo()
			}
			
			// 调试信息：打印当前用户信息和项目信息
			console.log('🔍 调试信息 - 当前用户:', this.currentUser)
			console.log('🔍 调试信息 - 项目详情:', this.projectDetail)
			console.log('🔍 调试信息 - 项目状态:', this.projectDetail.status, '(1=发布中才可接单)')
			console.log('🔍 调试信息 - 所需角色:', this.projectDetail.requiredRoles, this.getRoleText(this.projectDetail.requiredRoles))
			console.log('🔍 调试信息 - 用户角色:', this.currentUser?.currentRoleType, this.getRoleText(this.currentUser?.currentRoleType))
			
			// 检查当前用户角色
			if (!this.currentUser || !this.currentUser.currentRoleType) {
				console.log('❌ 接单失败: 用户角色信息不完整')
				uni.showModal({
					title: '提示',
					content: '请先完善您的角色信息',
					confirmText: '去完善',
					success: (res) => {
						if (res.confirm) {
							uni.navigateTo({
								url: '/pages/profile/profile'
							})
						}
					}
				})
				return
			}
			
			// 检查项目状态是否允许接单
			if (this.projectDetail.status !== 1) {
				console.log('❌ 接单失败: 项目状态不允许接单，当前状态:', this.projectDetail.status)
				uni.showToast({
					title: '当前项目状态不允许接单',
					icon: 'none'
				})
				return
			}
			
			// 检查用户角色是否符合项目要求
			const userRole = this.currentUser.currentRoleType
			const requiredRoles = this.projectDetail.requiredRoles
			
			console.log('🔍 角色匹配检查:')
			console.log('  - 用户角色:', userRole, this.getRoleText(userRole))
			console.log('  - 项目需求:', requiredRoles, this.getRoleText(requiredRoles))
			console.log('  - 是否匹配:', this.isRoleMatch(userRole, requiredRoles))
			
			if (!this.isRoleMatch(userRole, requiredRoles)) {
				console.log('❌ 接单失败: 角色不匹配')
				uni.showToast({
					title: '您的角色不符合项目要求',
					icon: 'none'
				})
				return
			}
			
			console.log('✅ 所有检查通过，显示接单确认对话框')
			// 显示确认接单对话框
			this.$refs.acceptPopup.open()
		},
		
		// 检查用户角色是否符合项目要求
		isRoleMatch(userRole, requiredRoles) {
			// userRole: 当前用户角色 (1-设计师, 2-监理)
			// requiredRoles: 项目所需角色 (1-设计师, 2-监理, 3-设计师和监理)
			
			console.log('🔍 角色匹配逻辑:')
			console.log('  - 用户角色类型:', typeof userRole, '值:', userRole)
			console.log('  - 需求角色类型:', typeof requiredRoles, '值:', requiredRoles)
			
			if (requiredRoles === 3) {
				// 需要设计师和监理，任何角色都可以接单
				const result = userRole === 1 || userRole === 2
				console.log('  - 需求为设计师和监理(3)，任何角色都可接单，结果:', result)
				return result
			} else {
				// 需要特定角色
				const result = userRole == requiredRoles // 使用 == 避免类型问题
				console.log('  - 需求为特定角色，需要精确匹配，结果:', result)
				return result
			}
		},
		
		// 计算接单后的新状态 - 根据数据库结构修正
		calculateNewStatus() {
			const currentStatus = this.projectDetail.status
			const requiredRoles = this.projectDetail.requiredRoles
			const userRole = this.currentUser.currentRoleType
			
			console.log('🔍 计算新状态:')
			console.log('  - 当前状态:', currentStatus)
			console.log('  - 需求角色:', requiredRoles)
			console.log('  - 用户角色:', userRole)
			
			// 如果当前状态不是发布中(1)，不允许接单
			if (currentStatus !== 1) {
				console.log('  - 状态不是发布中，返回原状态:', currentStatus)
				return currentStatus
			}
			
			let newStatus = currentStatus
			
			// 根据项目需求和当前用户角色确定新状态
			if (requiredRoles === 1 || requiredRoles === 2) {
				// 需求状态为1（设计师）或2（监理），把状态改为4（全部接单）
				newStatus = 4
				console.log('  - 需求为单一角色，接单后状态改为4(全部接单)')
			} else if (requiredRoles === 3) {
				// 需求状态是3（设计师和监理），根据当前用户角色判断
				if (userRole === 1) {
					// 设计师接单，状态改为2（设计师接单）
					newStatus = 2
					console.log('  - 设计师接单，状态改为2(设计师接单)')
				} else if (userRole === 2) {
					// 监理接单，状态改为3（监理接单）
					newStatus = 3
					console.log('  - 监理接单，状态改为3(监理接单)')
				}
			}
			
			console.log('  - 最终新状态:', newStatus)
			return newStatus
		},
		
		// 确认接单
		async confirmAcceptOrder() {
			try {
				this.loading = true
				
				// 计算新的项目状态
				const newStatus = this.calculateNewStatus()
				console.log('🎯 确认接单 - 新状态:', newStatus, '用户角色:', this.currentUser.currentRoleType)
				
				// 调用接单接口
				const result = await projectService.acceptProject({
					projectId: this.projectId,
					status: newStatus,
					acceptedBy: this.currentUser.userId || this.currentUser.id,
					acceptedRole: this.currentUser.currentRoleType
				})
				
				console.log('✅ 接单成功:', result)
				
				uni.showToast({
					title: '接单成功',
					icon: 'success',
					duration: 2000
				})
				
				// 关闭对话框
				this.closeAcceptDialog()
				
				// 更新项目状态
				this.projectDetail.status = newStatus
				
				// 延迟返回上一页
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
				
			} catch (error) {
				console.error('❌ 接单失败:', error)
				uni.showToast({
					title: error.message || '接单失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},
		
		// ... 其他方法保持不变
	}
}
</script>
import { projectService } from '@/api/project.js'
import { getUserProfile } from '@/api/users.js'
import { getCurrentRole } from '@/api/users.js'

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
			currentUser: null,
			
			// 加载状态
			loading: false,
			error: false,
			errorMessage: '',
			
			// 状态映射
			statusMap: {
				0: { text: '草稿', class: 'pending' },
				1: { text: '发布中', class: 'bidding' },
				2: { text: '监理接单', class: 'in-progress' },
				3: { text: '设计师接单', class: 'in-progress' },
				4: { text: '全部接单', class: 'completed' },
				5: { text: '已取消', class: 'cancelled' }
			},
			
			// 角色映射
			roleMap: {
				1: '设计师',
				2: '监理',
				3: '设计师和监理'
			},
			
			projectTypeMap: {
				1: '住宅装修',
				2: '商业空间',
				3: '办公室装修',
				4: '其他'
			}
		}
	},
	
	onLoad(options) {
		if (options.id) {
			this.projectId = options.id
			this.loadProjectDetail()
			this.getCurrentUserInfo()
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
		// 获取当前用户信息
		async getCurrentUserInfo() {
			try {
				const token = uni.getStorageSync('token')
				if (!token) {
					console.log('用户未登录')
					return
				}
				
				// 先从本地存储获取用户信息
				const userInfo = uni.getStorageSync('userInfo')
				if (userInfo) {
					this.currentUser = userInfo
					console.log('从本地存储获取用户信息:', this.currentUser)
				}
				
				// 调用接口获取当前角色信息
				try {
					const roleRes = await getCurrentRole()
					console.log('获取当前角色响应:', roleRes)
					
					if (roleRes.code === 200 || roleRes.success) {
						const roleData = roleRes.data || roleRes.result
						
						// 更新当前用户信息
						if (!this.currentUser) {
							this.currentUser = {}
						}
						
						// 设置角色类型
						if (roleData.roleType !== undefined) {
							this.currentUser.currentRoleType = roleData.roleType
						}
						
						// 设置用户ID
						if (roleData.userId) {
							this.currentUser.userId = roleData.userId
						}
						
						console.log('更新后的当前用户信息:', this.currentUser)
					} else {
						console.warn('获取角色信息失败:', roleRes.msg || roleRes.message)
					}
				} catch (roleError) {
					console.error('调用角色接口失败:', roleError)
					// 如果接口调用失败，尝试从本地存储中获取角色信息
					if (userInfo && userInfo.currentRoleType) {
						this.currentUser.currentRoleType = userInfo.currentRoleType
					}
				}
				
			} catch (error) {
				console.error('获取当前用户信息失败:', error)
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
					// 格式化项目数据，确保字段正确映射
					this.projectDetail = this.formatProjectData(result)
					console.log('格式化后的项目详情:', this.projectDetail)
					
					// 加载发布者详细信息 - 使用 createBy 或 userId
					const publisherId = result.createBy || result.userId
					await this.loadPublisherInfo(publisherId)
					
					// 加载发布者统计信息
					await this.loadPublisherStats(publisherId)
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
		
		// 格式化项目数据
		formatProjectData(projectData) {
			return {
				// 基本信息
				projectId: projectData.projectId,
				title: projectData.title,
				description: projectData.description,
				requiredRoles: projectData.requiredRoles,
				budget: projectData.budget,
				area: projectData.area,
				address: projectData.address,
				status: projectData.status,
				deadline: projectData.deadline,
				
				// 用户信息
				userId: projectData.userId,
				createBy: projectData.createBy,
				createdBy: projectData.createdBy,
				
				// 时间信息
				createTime: projectData.createTime,
				updateTime: projectData.updateTime,
				
				// 其他字段
				remark: projectData.remark,
				updateBy: projectData.updateBy,
				updatedBy: projectData.updatedBy,
				delFlag: projectData.delFlag,
				
				// 扩展字段（如果有）
				style: projectData.style,
				projectType: projectData.projectType,
				specialRequirements: projectData.specialRequirements,
				images: projectData.images || [],
				contactPhone: projectData.contactPhone
			}
		},
		
		// 加载发布者详细信息
		async loadPublisherInfo(userId) {
			if (!userId) {
				console.log('没有用户ID，使用默认发布者信息')
				this.publisherInfo = this.getDefaultPublisherInfo()
				return
			}
			
			try {
				console.log('正在获取发布者信息，用户ID:', userId)
				const userInfo = await getUserProfile(userId)
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
				name: this.projectDetail.createBy || this.projectDetail.createdBy || '匿名用户',
				phone: '',
				avatar: '/static/images/default-avatar.png',
				userId: '',
				currentRoleType: 'user'
			}
		},
		
		// 获取发布者显示名称
		getPublisherName() {
			if (this.publisherInfo && this.publisherInfo.name) {
				return this.publisherInfo.name
			}
			return this.projectDetail.createBy || this.projectDetail.createdBy || '匿名用户'
		},
		
		// 获取发布者头像
		getPublisherAvatar() {
			if (this.publisherInfo && this.publisherInfo.avatar) {
				return this.publisherInfo.avatar
			}
			return '/static/images/default-avatar.png'
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
		
		// 联系发布者
		contactPublisher() {
			const phone = this.getPublisherPhone()
			if (phone) {
				uni.makePhoneCall({
					phoneNumber: phone
				})
			} else {
				uni.showToast({
					title: '暂无联系电话',
					icon: 'none'
				})
			}
		},
		
		// 接取订单
		async acceptOrder() {
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
			
			// 如果没有用户信息，重新获取
			if (!this.currentUser) {
				await this.getCurrentUserInfo()
			}
			
			// 检查当前用户角色
			if (!this.currentUser || !this.currentUser.currentRoleType) {
				uni.showModal({
					title: '提示',
					content: '请先完善您的角色信息',
					confirmText: '去完善',
					success: (res) => {
						if (res.confirm) {
							uni.navigateTo({
								url: '/pages/profile/profile'
							})
						}
					}
				})
				return
			}
			
			// 检查项目状态是否允许接单
			if (this.projectDetail.status !== 1) {
				uni.showToast({
					title: '当前项目状态不允许接单',
					icon: 'none'
				})
				return
			}
			
			// 检查用户角色是否符合项目要求
			const userRole = this.currentUser.currentRoleType
			const requiredRoles = this.projectDetail.requiredRoles
			
			if (!this.isRoleMatch(userRole, requiredRoles)) {
				uni.showToast({
					title: '您的角色不符合项目要求',
					icon: 'none'
				})
				return
			}
			
			// 显示确认接单对话框
			this.$refs.acceptPopup.open()
		},
		
		// 检查用户角色是否符合项目要求
		isRoleMatch(userRole, requiredRoles) {
			// userRole: 当前用户角色 (1-设计师, 2-监理)
			// requiredRoles: 项目所需角色 (1-设计师, 2-监理, 3-设计师和监理)
			
			if (requiredRoles === 3) {
				// 需要设计师和监理，任何角色都可以接单
				return userRole === 1 || userRole === 2
			} else {
				// 需要特定角色
				return userRole === requiredRoles
			}
		},
		
		// 计算接单后的新状态
		calculateNewStatus() {
			const currentStatus = this.projectDetail.status
			const requiredRoles = this.projectDetail.requiredRoles
			const userRole = this.currentUser.currentRoleType
			
			// 如果当前状态不是发布中(1)，不允许接单
			if (currentStatus !== 1) {
				return currentStatus
			}
			
			// 根据项目需求和当前用户角色确定新状态
			if (requiredRoles === 1 || requiredRoles === 2) {
				// 需求状态为1（设计师）或2（监理），把状态改为4（全部接单）
				return 4
			} else if (requiredRoles === 3) {
				// 需求状态是3（设计师和监理），根据当前用户角色判断
				if (userRole === 1) {
					// 设计师接单，状态改为3
					return 3
				} else if (userRole === 2) {
					// 监理接单，状态改为2
					return 2
				}
			}
			
			// 默认返回原状态
			return currentStatus
		},
		
		// 确认接单
		async confirmAcceptOrder() {
			try {
				this.loading = true
				
				// 计算新的项目状态
				const newStatus = this.calculateNewStatus()
				console.log('计算出的新状态:', newStatus, '用户角色:', this.currentUser.currentRoleType)
				
				// 调用接单接口
				const result = await projectService.acceptProject({
					projectId: this.projectId,
					status: newStatus,
					acceptedBy: this.currentUser.userId || this.currentUser.id,
					acceptedRole: this.currentUser.currentRoleType
				})
				
				console.log('接单成功:', result)
				
				uni.showToast({
					title: '接单成功',
					icon: 'success',
					duration: 2000
				})
				
				// 关闭对话框
				this.closeAcceptDialog()
				
				// 更新项目状态
				this.projectDetail.status = newStatus
				
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
		},
		
		// 获取状态样式类
		getStatusClass(status) {
			return this.statusMap[status]?.class || 'pending'
		},
		
		// 获取状态文本
		getStatusText(status) {
			return this.statusMap[status]?.text || '未知状态'
		},
		
		// 获取角色文本
		getRoleText(role) {
			return this.roleMap[role] || '未知角色'
		},
		
		// 获取项目类型文本
		getProjectTypeText(type) {
			return this.projectTypeMap[type] || '其他'
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
		
		// 格式化时间
		formatTime(time) {
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
		}
	}
}
</script>
import { projectService } from '@/api/project.js'
import { getUserProfile } from '@/api/users.js'
import { getCurrentRole } from '@/api/users.js' // 导入获取当前角色的接口

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
			currentUser: null,
			
			// 加载状态
			loading: false,
			error: false,
			errorMessage: '',
			
			// 状态映射 - 根据新需求更新
			statusMap: {
				0: { text: '草稿', class: 'pending' },
				1: { text: '发布中', class: 'bidding' },
				2: { text: '监理接单', class: 'in-progress' },
				3: { text: '设计师接单', class: 'in-progress' },
				4: { text: '全部接单', class: 'completed' },
				5: { text: '已取消', class: 'cancelled' }
			},
			
			// 角色映射 - 根据新需求更新
			roleMap: {
				1: '设计师',
				2: '监理',
				3: '设计师和监理'
			},
			
			projectTypeMap: {
				1: '住宅装修',
				2: '商业空间',
				3: '办公室装修',
				4: '其他'
			}
		}
	},
	
	onLoad(options) {
		if (options.id) {
			this.projectId = options.id
			this.loadProjectDetail()
			this.getCurrentUserInfo()
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
		// 获取当前用户信息
		async getCurrentUserInfo() {
			try {
				const token = uni.getStorageSync('token')
				if (!token) {
					console.log('用户未登录')
					return
				}
				
				// 先从本地存储获取用户信息
				const userInfo = uni.getStorageSync('userInfo')
				if (userInfo) {
					this.currentUser = userInfo
					console.log('从本地存储获取用户信息:', this.currentUser)
				}
				
				// 调用接口获取当前角色信息
				try {
					const roleRes = await getCurrentRole()
					console.log('获取当前角色响应:', roleRes)
					
					if (roleRes.code === 200 || roleRes.success) {
						const roleData = roleRes.data || roleRes.result
						
						// 更新当前用户信息
						if (!this.currentUser) {
							this.currentUser = {}
						}
						
						// 设置角色类型
						if (roleData.roleType !== undefined) {
							this.currentUser.currentRoleType = roleData.roleType
						}
						
						// 设置用户ID
						if (roleData.userId) {
							this.currentUser.userId = roleData.userId
						}
						
						console.log('更新后的当前用户信息:', this.currentUser)
					} else {
						console.warn('获取角色信息失败:', roleRes.msg || roleRes.message)
					}
				} catch (roleError) {
					console.error('调用角色接口失败:', roleError)
					// 如果接口调用失败，尝试从本地存储中获取角色信息
					if (userInfo && userInfo.currentRoleType) {
						this.currentUser.currentRoleType = userInfo.currentRoleType
					}
				}
				
			} catch (error) {
				console.error('获取当前用户信息失败:', error)
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
		
		// 加载发布者详细信息
		async loadPublisherInfo(userId) {
			if (!userId) {
				console.log('没有用户ID，使用默认发布者信息')
				this.publisherInfo = this.getDefaultPublisherInfo()
				return
			}
			
			try {
				console.log('正在获取发布者信息，用户ID:', userId)
				const userInfo = await getUserProfile(userId)
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
		
		// 获取发布者显示名称
		getPublisherName() {
			if (this.publisherInfo && this.publisherInfo.name) {
				return this.publisherInfo.name
			}
			return this.projectDetail.createBy || '匿名用户'
		},
		
		// 获取发布者头像
		getPublisherAvatar() {
			if (this.publisherInfo && this.publisherInfo.avatar) {
				return this.publisherInfo.avatar
			}
			return '/static/images/default-avatar.png'
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
		
		// 联系发布者
		contactPublisher() {
			const phone = this.getPublisherPhone()
			if (phone) {
				uni.makePhoneCall({
					phoneNumber: phone
				})
			} else {
				uni.showToast({
					title: '暂无联系电话',
					icon: 'none'
				})
			}
		},
		
		// 接取订单
		async acceptOrder() {
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
			
			// 如果没有用户信息，重新获取
			if (!this.currentUser) {
				await this.getCurrentUserInfo()
			}
			
			// 检查当前用户角色
			if (!this.currentUser || !this.currentUser.currentRoleType) {
				uni.showModal({
					title: '提示',
					content: '请先完善您的角色信息',
					confirmText: '去完善',
					success: (res) => {
						if (res.confirm) {
							uni.navigateTo({
								url: '/pages/profile/profile'
							})
						}
					}
				})
				return
			}
			
			// 检查项目状态是否允许接单
			if (this.projectDetail.status !== 1) {
				uni.showToast({
					title: '当前项目状态不允许接单',
					icon: 'none'
				})
				return
			}
			
			// 检查用户角色是否符合项目要求
			const userRole = this.currentUser.currentRoleType
			const requiredRoles = this.projectDetail.requiredRoles
			
			if (!this.isRoleMatch(userRole, requiredRoles)) {
				uni.showToast({
					title: '您的角色不符合项目要求',
					icon: 'none'
				})
				return
			}
			
			// 显示确认接单对话框
			this.$refs.acceptPopup.open()
		},
		
		// 检查用户角色是否符合项目要求
		isRoleMatch(userRole, requiredRoles) {
			// userRole: 当前用户角色 (1-设计师, 2-监理)
			// requiredRoles: 项目所需角色 (1-设计师, 2-监理, 3-设计师和监理)
			
			if (requiredRoles === 3) {
				// 需要设计师和监理，任何角色都可以接单
				return userRole === 1 || userRole === 2
			} else {
				// 需要特定角色
				return userRole === requiredRoles
			}
		},
		
		// 计算接单后的新状态
		calculateNewStatus() {
			const currentStatus = this.projectDetail.status
			const requiredRoles = this.projectDetail.requiredRoles
			const userRole = this.currentUser.currentRoleType
			
			// 如果当前状态不是发布中(1)，不允许接单
			if (currentStatus !== 1) {
				return currentStatus
			}
			
			// 根据项目需求和当前用户角色确定新状态
			if (requiredRoles === 1 || requiredRoles === 2) {
				// 需求状态为1（设计师）或2（监理），把状态改为4（全部接单）
				return 4
			} else if (requiredRoles === 3) {
				// 需求状态是3（设计师和监理），根据当前用户角色判断
				if (userRole === 1) {
					// 设计师接单，状态改为3
					return 3
				} else if (userRole === 2) {
					// 监理接单，状态改为2
					return 2
				}
			}
			
			// 默认返回原状态
			return currentStatus
		},
		
		// 确认接单
		async confirmAcceptOrder() {
			try {
				this.loading = true
				
				// 计算新的项目状态
				const newStatus = this.calculateNewStatus()
				console.log('计算出的新状态:', newStatus, '用户角色:', this.currentUser.currentRoleType)
				
				// 调用接单接口
				const result = await projectService.acceptProject({
					projectId: this.projectId,
					status: newStatus,
					acceptedBy: this.currentUser.userId || this.currentUser.id,
					acceptedRole: this.currentUser.currentRoleType
				})
				
				console.log('接单成功:', result)
				
				uni.showToast({
					title: '接单成功',
					icon: 'success',
					duration: 2000
				})
				
				// 关闭对话框
				this.closeAcceptDialog()
				
				// 更新项目状态
				this.projectDetail.status = newStatus
				
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
		},
		
		// 获取状态样式类
		getStatusClass(status) {
			return this.statusMap[status]?.class || 'pending'
		},
		
		// 获取状态文本
		getStatusText(status) {
			return this.statusMap[status]?.text || '未知状态'
		},
		
		// 获取角色文本
		getRoleText(role) {
			return this.roleMap[role] || '未知角色'
		},
		
		// 获取项目类型文本
		getProjectTypeText(type) {
			return this.projectTypeMap[type] || '其他'
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
		
		// 格式化时间
		formatTime(time) {
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
</style>