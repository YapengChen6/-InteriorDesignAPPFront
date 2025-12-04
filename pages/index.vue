<template>
	<view class="container">
		<!-- 顶部搜索区域 - 已修改 -->
		<view class="search-section">
			<view class="search-container">
				<!-- 搜索框 -->
				<view class="search-box">
					<input type="text" placeholder="搜索装修相关内容" v-model="searchKeyword" @confirm="onSearch">
					<view class="search-icon" @click="onSearch">
						<!-- 搜索图标 SVG -->
						<svg class="search-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
							<path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2"/>
						</svg>
					</view>
					<text v-if="searchKeyword" class="clear-icon" @click="clearSearch">×</text>
				</view>
			</view>
		</view>
		
		<!-- 主菜单 - 图标已替换为图片 -->
		<view class="main-menu">
			<view class="menu-item" :class="{ active: activeMainMenu === 0 }" @click="goToOrderHall()">
				<view class="menu-icon">
					<!-- 订单大厅 图片 -->
					<image src="/static/images/订单大厅-1.svg" mode="aspectFit" class="menu-image"></image>
				</view>
				<text>订单大厅</text>
			</view>
			<view class="menu-item" 
			      :class="{ active: activeMainMenu === 1 }" 
			      @click="goToShopPage()">
				<view class="menu-icon">
					<!-- 购买居家建材 图片 -->
					<image src="/static/images/购买居家建材.svg" mode="aspectFit" class="menu-image"></image>
				</view>
				<text>购买居家建材</text>
			</view>
			<view class="menu-item" 
			      :class="{ active: activeMainMenu === 2 }" 
			      @click="goToFindDesigner()">
				<view class="menu-icon">
					<!-- 找设计师 图片 -->
					<image src="/static/images/找设计师 .svg" mode="aspectFit" class="menu-image"></image>
				</view>
				<text>找设计师</text>
			</view>
			<view class="menu-item" 
			      :class="{ active: activeMainMenu === 3 }" 
			      @click="goToFindSupervisor()">
				<view class="menu-icon">
					<!-- 找监工 图片 -->
					<image src="/static/images/找监工.svg" mode="aspectFit" class="menu-image"></image>
				</view>
				<text>找监工</text>
			</view>
		</view>
		
		<!-- 轮播图区域 -->
		<view class="banner-section">
			<view class="swiper-container">
				<view class="swiper-wrapper">
					<view class="swiper-slide" v-for="(banner, index) in banners" :key="index" 
						  :class="{ active: currentBanner === index }"
						  @click="goToBannerLink(banner.link)">
						<view class="banner-image" :style="{ background: banner.color }">
							<text class="banner-text">{{ banner.title }}</text>
						</view>
					</view>
				</view>
				<!-- 轮播图指示器 -->
				<view class="swiper-indicator">
					<view class="indicator-dot" v-for="(banner, index) in banners" :key="index"
						  :class="{ active: currentBanner === index }"
						  @click="switchBanner(index)"></view>
				</view>
			</view>
		</view>
		
		<!-- 内容区域 -->
		<view class="content">
			<!-- 标签导航 -->
			<view class="tab-nav">
				<view class="tab-item" 
				      :class="{ active: activeTab === 0 }" 
				      @click="switchTab(0)">推荐</view>
				<view class="tab-item" 
				      :class="{ active: activeTab === 1 }" 
				      @click="switchTab(1)">作品集</view>
				<view class="tab-item" 
				      :class="{ active: activeTab === 2 }" 
				      @click="switchTab(2)">案例集</view>
				<view class="tab-item" 
				      :class="{ active: activeTab === 3 }" 
				      @click="switchTab(3)">材料展示</view>
				<view class="tab-item" 
				      :class="{ active: activeTab === 4 }" 
				      @click="switchTab(4)">普通贴</view>
			</view>
			
			<!-- 小红书风格帖子列表 -->
			<view class="post-container xhs-style">
				<!-- 帖子项 -->
				<view class="post-item" 
				      v-for="post in postList" 
				      :key="post.id" 
				      @click="viewPostDetail(post.id)">
					<!-- 图片区域 - 单独的点击事件用于预览 -->
					<view class="post-image-container" @click.stop="previewImage(post)">
						<image 
							:src="getPostImageUrl(post)" 
							mode="aspectFill" 
							class="post-image"
							@error="handleImageError(post, $event)"
							@load="handleImageLoad(post)"
							lazy-load
						></image>
						
						<!-- 图片角标 - 修复 :class 绑定 -->
						<view class="image-badge" :class="postTypeClasses[post.threadType] || 'normal-tag'">
							{{ getThreadTypeName(post.threadType) }}
						</view>
						
						<!-- 多图指示器 -->
						<view class="multi-image-indicator" v-if="post.mediaUrls && post.mediaUrls.length > 1">
							📷 {{ post.mediaUrls.length }}P
						</view>
						
						<!-- 图片详情信息 -->
						<view class="image-detail-info" v-if="post.imageDetail && showImageInfo">
							<text class="image-size">{{ post.imageDetail.fileSize }}</text>
							<text class="image-format">{{ post.imageDetail.fileType }}</text>
						</view>
						
						<!-- 图片加载状态 -->
						<view class="image-loading" v-if="post.imageLoading && !post.imageError">
							<text>加载中...</text>
						</view>
						
						<!-- 图片加载失败 -->
						<view class="image-error" v-if="post.imageError">
							<text>图片加载失败</text>
							<view class="retry-btn" @click.stop="retryLoadImage(post)">重试</view>
						</view>
						
						<!-- 无图片提示 -->
						<view class="no-image" v-if="!post.coverUrl && (!post.mediaUrls || post.mediaUrls.length === 0)">
							<text class="no-image-icon">🖼️</text>
							<text class="no-image-text">暂无图片</text>
						</view>
					</view>
					
					<!-- 内容区域 -->
					<view class="post-content">
						<view class="post-title">{{ post.title || '无标题' }}</view>
						
						<!-- 用户信息和互动数据 -->
						<view class="post-meta">
							<view class="user-info">
								<image 
									:src="post.authorAvatar || '/static/images/default-avatar.png'" 
									class="user-avatar"
									mode="aspectFill"
								></image>
								<text class="user-name">{{ post.author || '匿名用户' }}</text>
							</view>
							
							<view class="interaction-stats">
								<view class="stat-item">
									<text class="stat-icon">❤️</text>
									<text class="stat-count">{{ post.likeCount || 0 }}</text>
								</view>
								<view class="stat-item">
									<text class="stat-icon">💬</text>
									<text class="stat-count">{{ post.commentCount || 0 }}</text>
								</view>
							</view>
						</view>
					</view>
				</view>
				
				<!-- 加载更多 -->
				<view class="load-more" v-if="hasMore && !loading" @click="loadMore">
					<text>加载更多</text>
				</view>
				
				<!-- 加载中 -->
				<view class="load-more loading" v-if="loading">
					<text>加载中...</text>
				</view>
				
				<!-- 没有更多数据 -->
				<view class="no-more" v-if="!hasMore && postList.length > 0">
					<text>没有更多内容了</text>
				</view>
				
				<!-- 空状态 -->
				<view class="empty-state" v-if="!loading && postList.length === 0">
					<text class="empty-icon">📝</text>
					<text class="empty-text">暂无帖子内容</text>
				</view>
			</view>
		</view>
		
		<!-- 图片信息显示开关 -->
		<view class="image-info-toggle" @click="toggleImageInfo">
			<text class="toggle-icon">{{ showImageInfo ? '📊' : '📈' }}</text>
			<text class="toggle-text">{{ showImageInfo ? '隐藏图片信息' : '显示图片信息' }}</text>
		</view>
	</view>
</template>

<script>
	import { orderService } from '@/api/order.js'
	import { projectService } from '@/api/project.js'
	import { getUserProfile, getCurrentRole, getUserById } from '@/api/users.js'
	import { getDesignSchemeList, saveNullScheme } from '@/api/designScheme.js'
	import { isUserLoggedIn, handleNotLoggedIn, createConversationAndNavigate } from "@/utils/conversationHelper.js"
	
	// 方案类型常量
	const SCHEME_TYPE = {
		EFFECT_DRAWING: "1",
		CONSTRUCTION_DRAWING: "2"
	}
	
	export default {
		data() {
			return {
				// 订单状态筛选
				activeStatus: '',
				loading: false,
				refreshing: false,
				hasMore: true,
				
				// 用户信息
				userInfo: {
					userId: null,
					phone: '',
					name: '',
					avatar: '',
					address: '',
					role: '', // 用户角色：customer/designer/supervisor
					roleName: '' // 角色名称
				},
				
				// 分页参数
				pagination: {
					pageNum: 1,
					pageSize: 10,
					total: 0
				},
				
				// 订单列表数据
				orderList: [],
				
				// 订单状态数量统计
				statusCount: {
					'0': 0,
					'1': 0,
					'2': 0,
					'3': 0,
					'4': 0 // 新增：待付款状态统计
				}
			}
		},
		computed: {
			// 过滤后的订单列表（用于待付款筛选和类型过滤）
			filteredOrderList() {
				// 修改：首先过滤只显示contractorId与当前用户ID相同的订单
				const myOrders = this.orderList.filter(order => {
					// 检查contractorId是否存在且与当前用户ID相同
					const currentUserId = String(this.userInfo.userId || '');
					const contractorId = String(order.contractorId || '');
					
					// 同时确保是设计师订单 (type=1)
					return contractorId === currentUserId && order.type === 1;
				});
				
				console.log('🔍 我的订单筛选结果:', {
					totalOrders: this.orderList.length,
					myOrdersCount: myOrders.length,
					currentUserId: this.userInfo.userId,
					filteredOrders: myOrders.map(o => ({
						orderId: o.orderId,
						contractorId: o.contractorId,
						type: o.type
					}))
				});
				
				// 然后根据状态筛选
				if (this.activeStatus === '4') {
					// 筛选待付款订单
					return myOrders.filter(order => this.isWaitingPayment(order));
				}
				
				if (this.activeStatus !== '') {
					return myOrders.filter(order => order.status.toString() === this.activeStatus);
				}
				
				return myOrders;
			}
		},
		onLoad() {
			console.log('🚀 设计师订单页面加载');
			this.loadCurrentUserInfo();
		},
		onShow() {
			console.log('🔄 设计师订单页面显示，刷新数据');
			if (this.userInfo.userId) {
				this.pagination.pageNum = 1;
				this.loadOrderList();
			}
		},
		methods: {
			// 返回首页
			goBack() {
				console.log('🔙 返回首页');
				uni.switchTab({
					url: '/pages/index'
				});
			},

			// 判断是否为待付款订单
			isWaitingPayment(order) {
				return order.status === 1 &&                    // 进行中
					   order.contractStatus === 2 &&           // 合同已确认
					   order.effectDrawingStatus === '2' &&    // 效果图已完成
					   order.constructionDrawingStatus === '2'; // 施工设计图已完成
			},

			// 设计师专属状态文本
			getDesignerStatusText(order) {
				if (this.isWaitingPayment(order)) {
					return '待付款';
				}
				return this.getStatusText(order.status);
			},

			// 查看订单详情
			viewOrderDetail(orderId) {
				const order = this.orderList.find(item => item.orderId === orderId);
				if (!order) {
					uni.showToast({
						title: '订单信息不存在',
						icon: 'none'
					});
					return;
				}
				
				console.log('📋 查看订单详情，订单ID:', orderId, '订单状态:', order.status);
				
				// 设计师查看订单详情
				uni.navigateTo({
					url: `/pages/order-hall/order-detail?id=${orderId}`
				});
			},

			// 统一的错误处理方法
			handleApiError(error, defaultMessage = '操作失败') {
				console.error('API Error:', error);
				
				let message = defaultMessage;
				if (error && error.errMsg) {
					message = error.errMsg;
				} else if (error && error.message) {
					message = error.message;
				} else if (typeof error === 'string') {
					message = error;
				}
				
				uni.showToast({
					title: message,
					icon: 'none',
					duration: 3000
				});
				
				return message;
			},

			// 加载当前用户信息 - 使用原来的 getUserProfile() 方法
			async loadCurrentUserInfo() {
				try {
					console.log('👤 开始获取当前用户信息（使用 getUserProfile）...');
					
					// 同时获取用户基本信息和角色信息
					const [userRes, roleRes] = await Promise.all([
						getUserProfile(),  // 使用原来的方法获取当前用户信息
						getCurrentRole()
					]);
					
					if (userRes.code === 200) {
						this.userInfo = userRes.data;
						
						// 添加角色信息
						if (roleRes.code === 200 && roleRes.data) {
							this.userInfo.role = roleRes.data.role || roleRes.data.roleType || 'designer';
							this.userInfo.roleName = roleRes.data.roleName || '';
						} else {
							this.userInfo.role = 'designer'; // 默认角色
							this.userInfo.roleName = '设计师';
						}
						
						console.log('👤 当前用户信息加载完成:', {
							userId: this.userInfo.userId,
							name: this.userInfo.name,
							role: this.userInfo.role,
							roleName: this.userInfo.roleName
						});
						
						// 确保用户信息存储到缓存
						this.ensureUserInfoInStorage();
						
						this.loadOrderList();
					} else {
						console.error('获取当前用户信息失败:', userRes.msg);
						this.handleApiError(userRes.msg, '获取用户信息失败');
					}
				} catch (error) {
					console.error('❌ 获取当前用户信息失败:', error);
					this.handleApiError(error, '获取用户信息失败');
				}
			},
			
			// 确保用户信息存储到缓存
			ensureUserInfoInStorage() {
				try {
					// 如果用户信息存在，存储到缓存
					if (this.userInfo && this.userInfo.userId) {
						// 存储完整用户信息
						uni.setStorageSync('userInfo', this.userInfo);
						
						// 单独存储用户ID（确保是字符串）
						if (this.userInfo.userId) {
							const userIdStr = String(this.userInfo.userId);
							uni.setStorageSync('userId', userIdStr);
							console.log('✅ 存储用户ID到缓存:', userIdStr);
						}
						
						// 存储到全局数据
						if (getApp().globalData) {
							getApp().globalData.userInfo = this.userInfo;
						}
						
						console.log('✅ 用户信息已更新到缓存:', {
							userId: this.userInfo.userId,
							name: this.userInfo.name
						});
						
						return true;
					}
					
					// 检查缓存是否存在
					const cachedUserInfo = uni.getStorageSync('userInfo');
					const cachedUserId = uni.getStorageSync('userId');
					
					if (!cachedUserInfo || !cachedUserId) {
						console.warn('⚠️ 缓存中用户信息不完整');
						return false;
					}
					
					return true;
					
				} catch (storageError) {
					console.error('❌ 存储用户信息失败:', storageError);
					return false;
				}
			},
			
			// 加载订单列表 - 已修改：将当前用户ID作为contractorId传给接口
			async loadOrderList() {
				if (this.loading || !this.userInfo.userId) return
				
				try {
					this.loading = true
					
					// 构建查询参数，包含contractorId
					const queryParams = {
						pageNum: this.pagination.pageNum,
						pageSize: this.pagination.pageSize,
						contractorId: this.userInfo.userId  // 关键修改：添加contractorId参数
					}
					
					// 添加状态筛选（除了待付款状态）
					if (this.activeStatus !== '' && this.activeStatus !== '4') {
						queryParams.status = this.activeStatus
					}
					
					console.log('📋 加载设计师订单列表 - 查询参数:', {
						contractorId: queryParams.contractorId,
						status: queryParams.status,
						pageNum: queryParams.pageNum,
						pageSize: queryParams.pageSize,
						activeStatus: this.activeStatus
					})
					
					// 修改：调用订单列表接口，传入包含contractorId的参数
					const result = await orderService.getOrderList(queryParams)
					console.log('✅ 设计师订单列表响应:', result)
					
					let list = []
					let total = 0
					
					// 解析响应数据（根据你的API返回格式调整）
					if (result && result.code === 200) {
						// 情况1：data中有records和total（标准分页格式）
						if (result.data && result.data.records) {
							list = result.data.records
							total = result.data.total
						} 
						// 情况2：data中有list和total
						else if (result.data && result.data.list) {
							list = result.data.list
							total = result.data.total
						}
						// 情况3：data直接是数组
						else if (Array.isArray(result.data)) {
							list = result.data
							total = result.data.length
						}
						// 情况4：result本身就是records数组（非标准格式）
						else if (result.records) {
							list = result.records
							total = result.total || result.records.length
						}
						// 情况5：result本身就是list数组
						else if (result.list) {
							list = result.list
							total = result.total || result.list.length
						}
						// 情况6：data是对象但不是分页结构
						else if (result.data && typeof result.data === 'object') {
							// 尝试从data中提取数组
							for (let key in result.data) {
								if (Array.isArray(result.data[key])) {
									list = result.data[key]
									break
								}
							}
							total = list.length
						}
					} 
					// 如果API返回的是数组（非标准格式）
					else if (Array.isArray(result)) {
						list = result
						total = result.length
					}
					// 如果API返回的是对象但不是标准格式
					else if (result && typeof result === 'object') {
						// 尝试查找数组字段
						const arrayFields = ['records', 'list', 'data', 'items']
						for (let field of arrayFields) {
							if (Array.isArray(result[field])) {
								list = result[field]
								total = result.total || result[field].length
								break
							}
						}
					}
					
					console.log('📊 解析后的订单列表:', {
						listCount: list.length,
						total: total,
						sample: list.length > 0 ? list[0] : null
					})
					
					// 如果没有获取到数据，显示空状态
					if (list.length === 0) {
						console.log('📭 未获取到订单数据')
						if (this.pagination.pageNum === 1) {
							this.orderList = []
						}
						this.pagination.total = total
						this.hasMore = false
						this.updateStatusCount()
						return
					}
					
					console.log('🔄 开始获取订单对应的详细信息...')
					const ordersWithDetails = []
					
					// 并行获取所有订单的详细信息
					const detailPromises = list.map(async (order) => {
						let projectInfo = {}
						let publisherInfo = {}
						
						// 获取项目详情
						if (order.projectId) {
							try {
								projectInfo = await this.getProjectDetail(order.projectId) || {}
							} catch (error) {
								console.error(`获取订单 ${order.orderId} 的项目详情失败:`, error)
							}
						}
						
						// 获取客户信息
						if (order.userId) {
							try {
								// 使用 getUserById 方法获取其他用户信息
								publisherInfo = await this.getUserInfoById(order.userId) || {}
							} catch (error) {
								console.error(`获取订单 ${order.orderId} 的发布人信息失败:`, error)
							}
						}
						
						let orderWithDetails = {
							...order,
							projectInfo,
							publisherInfo,
							loadingEffect: false,
							loadingConstruction: false,
							effectButtonText: '检查中...',
							showConstructionButton: false,
							effectDrawingStatus: null,
							constructionDrawingStatus: null
						}
						
						// 如果合同已确认，检查设计方案状态
						if (order.contractStatus === 2) {
							await this.checkAndSetDesignSchemeButtons(orderWithDetails);
						}
						
						return orderWithDetails
					})
					
					// 等待所有详细信息获取完成
					const orders = await Promise.all(detailPromises)
					ordersWithDetails.push(...orders)
					
					console.log('✅ 设计师订单数据整合完成，共', ordersWithDetails.length, '条订单')
					
					// 更新订单列表
					if (this.pagination.pageNum === 1) {
						this.orderList = ordersWithDetails
					} else {
						// 去重：避免重复添加相同的订单
						const existingIds = new Set(this.orderList.map(o => o.orderId))
						const newOrders = ordersWithDetails.filter(o => !existingIds.has(o.orderId))
						this.orderList = [...this.orderList, ...newOrders]
					}
					
					// 更新分页信息
					this.pagination.total = total
					this.hasMore = this.orderList.length < total
					
					// 更新状态统计
					this.updateStatusCount()
					
					console.log('📈 订单列表更新完成:', {
						currentCount: this.orderList.length,
						total: this.pagination.total,
						hasMore: this.hasMore
					})
					
				} catch (error) {
					console.error('❌ 加载订单列表失败:', error)
					this.handleApiError(error, '加载订单列表失败')
				} finally {
					this.loading = false
					this.refreshing = false
				}
			},
			
			// 获取其他用户信息的方法 - 只能使用 getUserById(userId)
			async getUserInfoById(userId) {
				if (!userId) {
					console.warn('用户ID为空');
					return {
						name: '',
						phone: '',
						avatar: '/static/images/default-avatar.png',
						role: ''
					};
				}
				
				try {
					console.log('👤 使用 getUserById 获取用户信息，用户ID:', userId);
					
					// 只能使用 getUserById 方法获取其他用户信息
					const result = await getUserById(userId);
					console.log('✅ getUserById 原始结果:', result);
					
					// 解析API响应
					let userData = null;
					
					// 处理不同的响应格式
					if (result && typeof result === 'object') {
						// 标准格式：{code: 200, data: {...}}
						if (result.code === 200) {
							userData = result.data || {};
						}
						// 非标准格式：直接是用户数据
						else if (!result.code && (result.name || result.phone || result.avatar)) {
							userData = result;
						}
						// 其他格式：尝试从可能的位置获取数据
						else if (result.data) {
							userData = result.data;
						}
					}
					
					if (!userData) {
						console.warn('⚠️ 无法从响应中解析用户数据，使用默认值');
						userData = {};
					}
					
					console.log('✅ 解析后的用户数据:', userData);
					
					// 根据示例数据结构调整字段映射
					return {
						name: userData.nickName || userData.name || userData.nickname || userData.username || '',
						phone: userData.phone || userData.userName || userData.mobile || userData.telephone || '',
						avatar: userData.avatar || userData.profilePicture || '/static/images/default-avatar.png',
						role: userData.role || userData.userType || ''
					};
					
				} catch (error) {
					console.error('❌ 使用 getUserById 获取用户信息失败:', error);
					// 返回默认用户信息（空值，避免显示"未知用户"）
					return {
						name: '',
						phone: '',
						avatar: '/static/images/default-avatar.png',
						role: ''
					};
				}
			},
			
			// 检查并设置设计方案按钮状态
			async checkAndSetDesignSchemeButtons(order) {
				try {
					console.log(`🔍 检查订单 ${order.orderId} 的设计方案状态`);
					
					const effectDrawingStatus = await this.checkDesignSchemeStatus(order.orderId, SCHEME_TYPE.EFFECT_DRAWING);
					const constructionDrawingStatus = await this.checkDesignSchemeStatus(order.orderId, SCHEME_TYPE.CONSTRUCTION_DRAWING);
					
					console.log(`📊 订单 ${order.orderId} 方案状态:`, {
						效果图状态: effectDrawingStatus,
						施工设计图状态: constructionDrawingStatus
					});
					
					if (!effectDrawingStatus) {
						order.effectButtonText = '上传效果图';
						order.showConstructionButton = false;
					} else if (effectDrawingStatus === "1") {
						order.effectButtonText = '效果图待确认';
						order.showConstructionButton = false;
					} else if (effectDrawingStatus === "2") {
						if (!constructionDrawingStatus) {
							order.effectButtonText = '效果图已完成';
							order.showConstructionButton = true;
						} else if (constructionDrawingStatus === "1") {
							order.effectButtonText = '效果图已完成';
							order.showConstructionButton = false;
						} else if (constructionDrawingStatus === "2") {
							order.effectButtonText = '设计方案已完成';
							order.showConstructionButton = false;
						}
					}
					
					console.log(`✅ 订单 ${order.orderId} 按钮设置:`, {
						effectButtonText: order.effectButtonText,
						showConstructionButton: order.showConstructionButton
					});
					
				} catch (error) {
					console.error(`❌ 检查设计方案按钮状态失败:`, error);
					order.effectButtonText = '上传效果图';
					order.showConstructionButton = false;
				}
			},
			
			// 上传效果图
			async uploadEffectDrawing(order) {
				try {
					console.log('🎨 开始上传效果图，订单ID:', order.orderId);
					
					order.loadingEffect = true;
					
					const effectDrawingStatus = await this.checkDesignSchemeStatus(order.orderId, SCHEME_TYPE.EFFECT_DRAWING);
					
					if (effectDrawingStatus) {
						uni.showToast({
							title: '效果图已存在',
							icon: 'none'
						});
						order.loadingEffect = false;
						return;
					}
					
					uni.showModal({
						title: '上传效果图',
						content: '确定要上传效果图设计方案吗？',
						success: async (res) => {
							if (res.confirm) {
								await this.createDesignScheme(order.orderId, SCHEME_TYPE.EFFECT_DRAWING);
							}
							order.loadingEffect = false;
						},
						fail: () => {
							order.loadingEffect = false;
						}
					});
					
				} catch (error) {
					order.loadingEffect = false;
					console.error('❌ 上传效果图失败:', error);
					this.handleApiError(error, '上传效果图失败');
				}
			},
			
			// 上传施工设计图
			async uploadConstructionDrawing(order) {
				try {
					console.log('🏗️ 开始上传施工设计图，订单ID:', order.orderId);
					
					order.loadingConstruction = true;
					
					const constructionDrawingStatus = await this.checkDesignSchemeStatus(order.orderId, SCHEME_TYPE.CONSTRUCTION_DRAWING);
					
					if (constructionDrawingStatus) {
						uni.showToast({
							title: '施工设计图已存在',
							icon: 'none'
						});
						order.loadingConstruction = false;
						return;
					}
					
					uni.showModal({
						title: '上传施工设计图',
						content: '确定要上传施工设计图吗？',
						success: async (res) => {
							if (res.confirm) {
								await this.createDesignScheme(order.orderId, SCHEME_TYPE.CONSTRUCTION_DRAWING);
							}
							order.loadingConstruction = false;
						},
						fail: () => {
							order.loadingConstruction = false;
						}
					});
					
				} catch (error) {
					order.loadingConstruction = false;
					console.error('❌ 上传施工设计图失败:', error);
					this.handleApiError(error, '上传施工设计图失败');
				}
			},
			
			// 检查设计方案状态
			async checkDesignSchemeStatus(orderId, schemeType) {
				try {
					console.log(`🔍 检查设计方案状态，订单ID: ${orderId}, 方案类型: ${schemeType}`);
					
					const queryParams = {
						pageNum: 1,
						pageSize: 100,
						orderId: orderId
					};
					
					const result = await getDesignSchemeList(queryParams);
					console.log('📋 设计方案查询结果:', result);
					
					let list = [];
					if (result && result.code === 200) {
						if (result.data) {
							if (Array.isArray(result.data)) {
								list = result.data;
							} 
							else if (result.data.records) {
								list = result.data.records;
							}
							else if (result.data.list) {
								list = result.data.list;
							}
							else if (Array.isArray(result.data.data)) {
								list = result.data.data;
							}
						}
					} else if (Array.isArray(result)) {
						list = result;
					}
					
					console.log('📋 解析后的方案列表:', list);
					
					const scheme = list.find(scheme => {
						const type = scheme.schemeType || scheme.type;
						const schemeTypeStr = String(schemeType);
						const typeStr = String(type);
						
						console.log(`🔍 方案类型比较: ${schemeTypeStr} === ${typeStr}`, schemeTypeStr === typeStr);
						
						return schemeTypeStr === typeStr;
					});
					
					if (scheme) {
						console.log(`✅ 找到方案:`, {
							schemeId: scheme.designSchemeId,
							schemeType: scheme.schemeType,
							status: scheme.status
						});
						return String(scheme.status); 
					} else {
						console.log(`❌ 未找到类型为 ${schemeType} 的方案`);
						return null;
					}
					
				} catch (error) {
					console.error(`❌ 检查设计方案状态失败:`, error);
					return null;
				}
			},
			
			// 创建设计方案
			async createDesignScheme(orderId, schemeType) {
				try {
					console.log('🆕 创建设计方案:', { orderId, schemeType });
					
					uni.showLoading({ title: '创建方案中...' });
					
					const nullSchemeResult = await saveNullScheme();
					
					if (nullSchemeResult.code === 200) {
						const schemeId = nullSchemeResult.data;
						
						uni.hideLoading();
						
						console.log('✅ 空白方案创建成功，方案ID:', schemeId);
						
						this.navigateToUploadPage(orderId, schemeId, schemeType);
						
					} else {
						throw new Error(nullSchemeResult.msg || '创建空白方案失败');
					}
					
				} catch (error) {
					uni.hideLoading();
					console.error('❌ 创建设计方案失败:', error);
					this.handleApiError(error, '创建设计方案失败');
				}
			},
			
			// 跳转到上传页面
			navigateToUploadPage(orderId, schemeId, schemeType) {
				const schemeTypeText = schemeType === SCHEME_TYPE.EFFECT_DRAWING ? 'effect' : 'construction';
				const pageTitle = schemeType === SCHEME_TYPE.EFFECT_DRAWING ? '效果图上传' : '施工设计图上传';
				
				uni.navigateTo({
					url: `/pages/design/upload?orderId=${orderId}&schemeId=${schemeId}&schemeType=${schemeTypeText}&title=${pageTitle}`
				});
			},

			// 查看合同
			async viewContract(order) {
				try {
					console.log('📄 查看合同，订单ID:', order.orderId);
					console.log('📄 合同URL:', order.contractUrl);
					
					if (order.contractUrl) {
						uni.previewImage({
							urls: [order.contractUrl],
							current: order.contractUrl,
							success: () => {
								console.log('✅ 合同预览成功');
							},
							fail: (error) => {
								console.error('❌ 合同预览失败:', error);
								this.handleApiError(error, '合同预览失败');
							}
						});
					} else {
						uni.showToast({
							title: '合同文件不存在',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('❌ 查看合同失败:', error);
					this.handleApiError(error, '查看合同失败');
				}
			},

			// 设计师上传/修改合同图片
			async uploadContract(orderId, isModify = false) {
				try {
					console.log(`📄 开始${isModify ? '修改' : '上传'}合同图片，订单ID:`, orderId);
					
					const imageRes = await this.chooseContractImage();
					if (!imageRes.tempFilePaths || imageRes.tempFilePaths.length === 0) {
						console.log('❌ 用户取消选择图片');
						return;
					}

					const imagePath = imageRes.tempFilePaths[0];
					const imageFile = imageRes.tempFiles[0];

					console.log('🖼️ 选择的图片信息:', {
						path: imagePath,
						size: imageFile.size,
						type: imageFile.type,
						name: imageFile.name
					});

					const maxSize = 10 * 1024 * 1024;
					if (imageFile.size > maxSize) {
						uni.showToast({
							title: '图片大小不能超过10MB',
							icon: 'none'
						});
						return;
					}

					uni.showLoading({ 
						title: `${isModify ? '修改' : '上传'}合同中...`,
						mask: true
					});

					// 1. 上传合同图片到媒体服务
					const uploadResult = await this.uploadContractImageDirect(orderId, imagePath);
					
					if (uploadResult && uploadResult.code === 200) {
						console.log(`✅ 合同图片${isModify ? '修改' : '上传'}成功:`, uploadResult);
						
						// 2. 获取上传成功的图片URL
						const contractUrl = uploadResult.data?.url || uploadResult.data?.fileUrl;
						console.log('📸 合同图片URL:', contractUrl);
						
						if (contractUrl) {
							// 3. 使用专用接口同时更新合同URL和状态
							uni.showLoading({ title: '更新合同信息...' });
							
							try {
								// 合同状态设为1（待确认）
								const updateResult = await orderService.updateContractUrlAndContractStatus(
									orderId, 
									contractUrl, 
									1  // contractStatus = 1 (合同待确认)
									);
								
								console.log('✅ 合同URL和状态更新成功:', updateResult);
								
								uni.hideLoading();
								
								uni.showToast({
									title: `合同${isModify ? '修改' : '上传'}成功`,
									icon: 'success',
									duration: 2000
								});
								
								// 刷新列表
								this.pagination.pageNum = 1;
								this.loadOrderList();
								
							} catch (updateError) {
								uni.hideLoading();
								console.error('❌ 更新合同URL和状态失败:', updateError);
								this.handleApiError(updateError, '更新合同信息失败');
							}
						} else {
							throw new Error('未获取到合同图片URL');
						}
						
					} else {
						throw new Error(uploadResult?.msg || `${isModify ? '修改' : '上传'}失败`);
					}
					
				} catch (error) {
					uni.hideLoading();
					console.error(`❌ 合同${isModify ? '修改' : '上传'}失败:`, error);
					this.handleApiError(error, `${isModify ? '修改' : '上传'}失败`);
				}
			},

			// 选择合同图片
			chooseContractImage() {
				return new Promise((resolve, reject) => {
					uni.chooseImage({
						count: 1,
						sizeType: ['compressed', 'original'],
						sourceType: ['album', 'camera'],
						success: (res) => {
							console.log('🖼️ 选择的合同图片:', res);
							resolve(res);
						},
						fail: (error) => {
							console.error('❌ 选择图片失败:', error);
							reject(new Error('选择图片失败: ' + error.errMsg));
						}
					});
				});
			},

			// 修复后的上传方法
			async uploadContractImageDirect(orderId, filePath) {
				return new Promise((resolve, reject) => {
					const token = uni.getStorageSync('token');
					if (!token) {
						reject(new Error('用户未登录'));
						return;
					}

					const formData = {
						relatedType: 9,
						relatedId: orderId,
						description: '订单合同图片',
						stage: 'CONTRACT',
						sequence: 0
					};

					console.log('📤 上传合同图片到8081端口:', { 
						orderId, 
						filePath, 
						formData,
						baseURL: 'http://localhost:8081'
					});

					const uploadTask = uni.uploadFile({
						url: 'http://localhost:8081/api/media/upload',
						filePath: filePath,
						name: 'file',
						formData: formData,
						header: {
							'Authorization': 'Bearer ' + token,
						},
						success: (res) => {
							console.log('📡 上传响应状态码:', res.statusCode);
							console.log('📡 上传响应数据:', res.data);
							
							if (res.statusCode === 200) {
								try {
									const data = JSON.parse(res.data);
									console.log('📡 解析后的响应:', data);
									if (data.code === 200) {
										resolve(data);
									} else {
										reject(new Error(data.msg || '上传失败'));
									}
								} catch (e) {
									console.error('❌ JSON解析错误:', e, '原始响应:', res.data);
									reject(new Error('服务器响应格式错误'));
								}
							} else {
								reject(new Error(`上传失败，状态码: ${res.statusCode}`));
							}
						},
						fail: (error) => {
							console.error('❌ 上传请求失败:', error);
							reject(new Error('网络请求失败: ' + error.errMsg));
						}
					});

					uploadTask.onProgressUpdate((res) => {
						console.log('📊 上传进度:', res.progress + '%');
						if (res.progress < 100) {
							uni.showLoading({
								title: `上传中 ${res.progress}%`,
								mask: true
							});
						} else {
							uni.hideLoading();
						}
					});
				});
			},

			// 测试上传功能
			async testUploadFunctionality() {
				try {
					console.log('🧪 测试上传功能...');
					
					const imageRes = await this.chooseContractImage();
					if (!imageRes.tempFilePaths || imageRes.tempFilePaths.length === 0) {
						console.log('❌ 测试：用户取消选择图片');
						return;
					}
					
					const testImagePath = imageRes.tempFilePaths[0];
					console.log('🖼️ 测试图片路径:', testImagePath);
					
					let testOrderId = 1;
					if (this.orderList.length > 0) {
						testOrderId = this.orderList[0].orderId;
					}
					
					console.log('🚀 开始测试上传，订单ID:', testOrderId);
					uni.showLoading({ title: '测试上传中...' });
					
					const result = await this.uploadContractImageDirect(testOrderId, testImagePath);
					console.log('✅ 测试上传成功:', result);
					
					uni.hideLoading();
					uni.showToast({
						title: '上传测试成功',
						icon: 'success'
					});
					
				} catch (error) {
					uni.hideLoading();
					console.error('❌ 测试上传失败:', error);
					this.handleApiError(error, '测试上传失败');
				}
			},
			
			// 切换订单状态
			changeStatus(status) {
				this.activeStatus = status
				this.pagination.pageNum = 1
				this.hasMore = true
				this.orderList = []
				this.loadOrderList()
			},
			
			// 获取状态文本
			getStatusText(status) {
				return orderService.getOrderStatusText(status)
			},
			
			// 获取订单类型文本
			getOrderTypeText(type) {
				return orderService.getOrderTypeText(type)
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
			
			// 格式化日期
			formatDate(dateStr) {
				if (!dateStr) return ''
				if (dateStr.includes('T')) {
					return dateStr.split('T')[0]
				}
				return dateStr.split(' ')[0]
			},
			
			// 根据项目ID获取项目详情
			async getProjectDetail(projectId) {
				if (!projectId) {
					console.warn('项目ID为空')
					return null
				}
				
				try {
					console.log('📋 获取项目详情，项目ID:', projectId)
					const projectDetail = await projectService.getProjectDetail(projectId)
					console.log('✅ 项目详情获取成功:', projectDetail)
					return projectDetail
				} catch (error) {
					console.error('❌ 获取项目详情失败:', error)
					return null
				}
			},
			
			// 更新状态统计（只统计contractorId与当前用户ID相同的订单）
			updateStatusCount() {
				// 重置统计
				this.statusCount = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0 }
				
				// 只统计contractorId与当前用户ID相同的订单
				const myOrders = this.orderList.filter(order => {
					const currentUserId = String(this.userInfo.userId || '');
					const contractorId = String(order.contractorId || '');
					return contractorId === currentUserId && order.type === 1;
				});
				
				myOrders.forEach(order => {
					const status = order.status.toString()
					if (this.statusCount[status] !== undefined) {
						this.statusCount[status]++
					}
					
					// 统计待付款订单数量
					if (this.isWaitingPayment(order)) {
						this.statusCount['4']++
					}
				})
				
				console.log('📊 我的订单状态统计:', this.statusCount)
			},
			
			// 加载更多
			loadMore() {
				if (this.loading || !this.hasMore) return
				this.pagination.pageNum++
				this.loadOrderList()
			},
			
			// 下拉刷新
			onRefresh() {
				if (this.refreshing) return
				this.refreshing = true
				this.pagination.pageNum = 1
				this.hasMore = true
				this.orderList = []
				this.loadOrderList()
			},
			
			// 完善的在线咨询方法 - 设计师联系客户
			async onlineConsult(order) {
				console.log('💬 设计师开始在线咨询客户，订单:', order);
				
				try {
					// 1. 检查登录状态
					if (!isUserLoggedIn()) {
						handleNotLoggedIn();
						return;
					}
					
					// 2. 检查订单信息完整性
					if (!order || !order.userId) {
						console.error('❌ 订单信息不完整:', order);
						uni.showToast({
							title: '订单信息无效',
							icon: 'error',
							duration: 2000
						});
						return;
					}
					
					// 3. 确认当前用户身份
					const currentUserId = String(this.userInfo.userId || '');
					const contractorId = String(order.contractorId || '');
					const customerId = String(order.userId || '');
					
					console.log('👤 身份确认:', {
						当前用户ID: currentUserId,
						订单客户ID: customerId,
						承接方ID: contractorId,
						当前用户角色: this.userInfo.role,
						页面类型: '设计师订单页面'
					});
					
					// 4. 验证当前用户是否是订单承接方（设计师）
					if (currentUserId !== contractorId) {
						console.warn('⚠️ 当前用户不是订单承接方，权限验证失败');
						uni.showToast({
							title: '权限不足，只能联系自己承接的订单',
							icon: 'none',
							duration: 2000
						});
						return;
					}
					
					// 5. 确定联系对象：设计师联系客户
					let targetUserId = customerId;
					let targetUserName = '';
					let targetUserAvatar = '';
					
					// 6. 防止联系自己
					if (String(targetUserId) === String(currentUserId)) {
						console.warn('⚠️ 尝试联系自己:', {
							当前用户ID: currentUserId,
							目标用户ID: targetUserId
						});
						uni.showToast({
							title: '不能联系自己',
							icon: 'none',
							duration: 2000
						});
						return;
					}
					
					// 7. 获取客户信息
					try {
						const customerInfo = await this.getUserInfoById(targetUserId);
						targetUserName = customerInfo.name || '客户';
						targetUserAvatar = customerInfo.avatar || '';
					} catch (error) {
						console.warn('⚠️ 获取客户信息失败:', error);
						// 使用默认值
						targetUserName = '客户';
						targetUserAvatar = '';
					}
					
					console.log('📞 设计师准备联系客户:', {
						客户ID: targetUserId,
						客户姓名: targetUserName,
						设计师ID: currentUserId,
						订单ID: order.orderId
					});
					
					// 8. 显示加载状态
					uni.showLoading({
						title: '创建对话中...',
						mask: true
					});
					
					try {
						// 9. 使用工具函数创建对话并跳转
						await createConversationAndNavigate(
							targetUserId,
							targetUserName,
							targetUserAvatar || ''
						);
						
						console.log('✅ 对话创建成功，跳转聊天页面');
						
					} catch (conversationError) {
						console.error('❌ 创建对话失败:', conversationError);
						
						// 错误处理
						let errorMessage = '创建对话失败';
						if (conversationError.message) {
							if (conversationError.message.includes('请先登录')) {
								errorMessage = '请先登录';
							} else if (conversationError.message.includes('不能与自己')) {
								errorMessage = '不能联系自己';
							} else if (conversationError.message.includes('权限')) {
								errorMessage = '没有权限联系该用户';
							} else if (conversationError.message.includes('对方不存在')) {
								errorMessage = '对方用户不存在';
							} else {
								errorMessage = conversationError.message;
							}
						}
						
						uni.showToast({
							title: errorMessage,
							icon: 'none',
							duration: 3000
						});
						
						// 如果是因为对话不存在，尝试直接跳转到聊天页面
						if (conversationError.message && conversationError.message.includes('对话不存在')) {
							console.log('⚠️ 尝试直接跳转到聊天页面');
							setTimeout(() => {
								uni.navigateTo({
									url: `/pages/chat/chat?otherUserId=${targetUserId}&otherUserName=${encodeURIComponent(targetUserName)}`
								});
							}, 1000);
						}
					} finally {
						// 10. 隐藏加载状态
						uni.hideLoading();
					}
					
				} catch (error) {
					console.error('❌ 联系客户失败:', error);
					
					uni.showToast({
						title: '联系失败，请稍后重试',
						icon: 'none',
						duration: 3000
					});
				}
			},
			
			// 取消订单
			async cancelOrder(orderId) {
				try {
					uni.showModal({
						title: '确认取消',
						content: '确定要取消这个订单吗？',
						success: async (res) => {
							if (res.confirm) {
								uni.showLoading({ title: '取消中...' })
								await orderService.cancelOrder(orderId)
								uni.hideLoading()
								uni.showToast({
									title: '订单已取消',
									icon: 'success'
								})
								this.pagination.pageNum = 1
								this.loadOrderList()
							}
						}
					})
				} catch (error) {
					uni.hideLoading()
					this.handleApiError(error, '取消订单失败')
				}
			},
			
			// 跳转到消息页面
			goToMessage() {
				uni.navigateTo({
					url: '/pages/message/message'
				})
			}
		},
		
		onPullDownRefresh() {
			this.onRefresh()
			uni.stopPullDownRefresh()
		},
		
		onReachBottom() {
			this.loadMore()
		}
	}
</script>
<style>
	/* 容器样式保持不变 */
	.container {
		max-width: 750px;
		margin: 0 auto;
		background-color: #f8f9fa;
		min-height: 100vh;
		position: relative;
		padding-bottom: 60px;
	}
	
	/* 搜索框样式 - 已修复 */
	.search-box {
	    display: flex;
	    align-items: center;
	    background-color: #f5f5f5;
	    border-radius: 25px;
	    padding: 8px 15px; /* 调整上下内边距 */
	    flex: 1;
	    position: relative;
	    border: 1px solid #e0e0e0;
	    min-height: 44px; /* 确保最小高度，方便点击 */
	}
	
	.search-box input {
	    flex: 1;
	    border: none;
	    background: transparent;
	    outline: none;
	    font-size: 16px; /* 适当增大字体大小 */
	    padding: 8px 0; /* 增加上下内边距 */
	    padding-right: 30px; /* 为搜索图标留出空间 */
	    line-height: 1.4; /* 设置合适的行高 */
	    height: auto; /* 高度自适应 */
	    min-height: 28px; /* 最小高度 */
	}
	
	/* 搜索图标样式 */
	.search-icon {
	    position: absolute;
	    right: 15px;
	    top: 50%;
	    transform: translateY(-50%);
	    width: 20px;
	    height: 20px;
	    cursor: pointer;
	    color: #666;
	    transition: color 0.3s;
	    display: flex;
	    align-items: center;
	    justify-content: center;
	}
	
	.search-icon-svg {
	    width: 100%;
	    height: 100%;
	}
	
	.search-icon:active {
		color: #4a90e2;
		transform: translateY(-50%) scale(0.95);
	}
	
	.clear-icon {
	    position: absolute;
	    right: 45px; /* 在搜索图标左侧 */
	    top: 50%;
	    transform: translateY(-50%);
	    color: #999;
	    font-size: 20px; /* 稍微增大清空图标 */
	    width: 20px;
	    height: 20px;
	    display: flex;
	    align-items: center;
	    justify-content: center;
	    cursor: pointer;
	    transition: color 0.3s;
	    z-index: 2;
	    line-height: 1;
	}
	
	.clear-icon:active {
		color: #666;
	}
	
	/* 主菜单样式 - 图标样式已修改 */
	.main-menu {
		display: flex;
		justify-content: space-between;
		padding: 15px;
		background-color: #fff;
		border-bottom: 1px solid #eee;
		overflow-x: auto;
		white-space: nowrap;
	}
	
	.menu-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		font-size: 14px;
		padding: 0 10px;
		min-width: 80px;
		cursor: pointer;
		transition: color 0.3s;
	}
	
	.menu-item.active {
		color: #ff6b00;
	}
	
	.menu-icon {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 5px;
		background: #f8f9fa;
		border-radius: 12px;
		transition: all 0.3s;
	}
	
	.menu-item.active .menu-icon {
		background: #fff2e8;
		color: #ff6b00;
	}
	
	.menu-item:active .menu-icon {
		transform: scale(0.95);
	}
	
	/* 图片样式 */
	.menu-image {
		width: 24px;
		height: 24px;
	}
	
	/* 其他样式保持不变 */
	.banner-section {
		padding: 15px;
		background-color: #f8f9fa;
	}
	
	.swiper-container {
		position: relative;
		height: 160px;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
	
	.swiper-wrapper {
		position: relative;
		width: 100%;
		height: 100%;
	}
	
	.swiper-slide {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		transition: opacity 0.8s ease-in-out;
		transform: translateX(100%);
	}
	
	.swiper-slide.active {
		opacity: 1;
		transform: translateX(0);
		z-index: 1;
	}
	
	.banner-image {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 20px;
		font-weight: bold;
		text-align: center;
		cursor: pointer;
		transition: transform 0.3s;
	}
	
	.banner-image:hover {
		transform: scale(1.02);
	}
	
	.banner-text {
		padding: 0 20px;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}
	
	.swiper-indicator {
		position: absolute;
		bottom: 15px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 8px;
		z-index: 2;
	}
	
	.indicator-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		transition: all 0.3s;
	}
	
	.indicator-dot.active {
		background-color: white;
		width: 20px;
		border-radius: 4px;
	}
	
	.content {
		padding: 0;
	}
	
	.tab-nav {
		display: flex;
		background-color: #fff;
		border-bottom: 1px solid #eee;
		overflow-x: auto;
		padding: 0 15px;
	}
	
	.tab-item {
		padding: 12px 15px;
		font-size: 16px;
		white-space: nowrap;
		cursor: pointer;
		transition: color 0.3s;
		position: relative;
	}
	
	.tab-item.active {
		color: #ff2e63;
		font-weight: bold;
	}
	
	.tab-item.active::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 15px;
		right: 15px;
		height: 3px;
		background-color: #ff2e63;
		border-radius: 2px;
	}
	
	.post-container.xhs-style {
	    display: grid;
	    grid-template-columns: repeat(2, 1fr);
	    gap: 0;
	    padding: 0;
	    background-color: #f8f9fa;
	}
	
	.post-item {
	    background-color: #fff;
	    border-radius: 0;
	    overflow: hidden;
	    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	    transition: transform 0.3s, box-shadow 0.3s;
	    cursor: pointer;
	    margin: 0;
	    border: 1px solid #f0f0f0;
	}
	
	.post-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
	
	.post-image-container {
		position: relative;
		width: 100%;
		height: 0;
		padding-bottom: 133.33%;
		overflow: hidden;
	}
	
	.post-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.image-badge {
		position: absolute;
		top: 8px;
		left: 8px;
		color: white;
		padding: 2px 6px;
		border-radius: 10px;
		font-size: 10px;
		z-index: 2;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(5px);
	}
	
	.portfolio-tag {
		background: rgba(102, 126, 234, 0.8);
	}
	
	.case-tag {
		background: rgba(245, 87, 108, 0.8);
	}
	
	.material-tag {
		background: rgba(79, 172, 254, 0.8);
	}
	
	.normal-tag {
		background: rgba(67, 233, 123, 0.8);
	}
	
	.multi-image-indicator {
		position: absolute;
		top: 8px;
		right: 8px;
		color: white;
		padding: 2px 6px;
		border-radius: 10px;
		font-size: 10px;
		z-index: 2;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(5px);
	}
	
	.image-detail-info {
		position: absolute;
		bottom: 8px;
		left: 8px;
		display: flex;
		gap: 6px;
		z-index: 2;
	}
	
	.image-size,
	.image-format {
		background: rgba(0, 0, 0, 0.6);
		color: white;
		padding: 2px 6px;
		border-radius: 8px;
		font-size: 10px;
		backdrop-filter: blur(5px);
	}
	
	.image-loading, .image-error {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: #f5f5f5;
		color: #999;
		font-size: 12px;
		z-index: 1;
	}
	
	.retry-btn {
		margin-top: 8px;
		padding: 4px 8px;
		background: rgba(255, 255, 255, 0.9);
		color: #333;
		border-radius: 4px;
		font-size: 10px;
		cursor: pointer;
	}
	
	.retry-btn:active {
		background: rgba(255, 255, 255, 0.7);
	}
	
	.no-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: #f5f5f5;
		color: #999;
	}
	
	.no-image-icon {
		font-size: 24px;
		margin-bottom: 8px;
	}
	
	.no-image-text {
		font-size: 12px;
	}
	
	.post-content {
		padding: 10px;
	}
	
	.post-title {
		font-size: 14px;
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		margin-bottom: 8px;
		color: #333;
		font-weight: 500;
	}
	
	.post-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.user-info {
		display: flex;
		align-items: center;
	}
	
	.user-avatar {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		margin-right: 6px;
	}
	
	.user-name {
		font-size: 12px;
		color: #666;
	}
	
	.interaction-stats {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	
	.stat-item {
		display: flex;
		align-items: center;
		gap: 2px;
	}
	
	.stat-icon {
		font-size: 12px;
	}
	
	.stat-count {
		font-size: 11px;
		color: #999;
	}
	
	.load-more {
		grid-column: span 2;
		text-align: center;
		padding: 20px;
		color: #666;
		cursor: pointer;
		background: #f8f9fa;
		border-radius: 8px;
		margin-top: 10px;
	}
	
	.load-more.loading {
		cursor: not-allowed;
		color: #999;
	}
	
	.load-more:active:not(.loading) {
		background: #e9ecef;
	}
	
	.no-more {
		grid-column: span 2;
		text-align: center;
		padding: 20px;
		color: #999;
		font-size: 14px;
	}
	
	.empty-state {
		grid-column: span 2;
		text-align: center;
		padding: 40px 20px;
	}
	
	.empty-icon {
		font-size: 48px;
		display: block;
		margin-bottom: 16px;
	}
	
	.empty-text {
		display: block;
		color: #999;
		font-size: 16px;
	}
	
	.image-info-toggle {
		position: fixed;
		bottom: 20px;
		right: 20px;
		background: #fff;
		border-radius: 20px;
		padding: 10px 15px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		z-index: 100;
		transition: all 0.3s;
	}
	
	.image-info-toggle:active {
		transform: scale(0.95);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
	
	.toggle-icon {
		font-size: 16px;
	}
	
	.toggle-text {
		font-size: 12px;
		color: #333;
		white-space: nowrap;
	}
	
	/* 响应式设计 */
	@media (max-width: 480px) {
		.search-section {
			padding: 12px;
		}
		
		.search-box {
			padding: 8px 12px;
		}
		
		.search-box input {
			font-size: 13px;
		}
		
		.search-icon {
			right: 12px;
			width: 18px;
			height: 18px;
		}
		
		.clear-icon {
			right: 35px;
			font-size: 16px;
		}
		
		.banner-section {
			padding: 12px;
		}
		
		.swiper-container {
			height: 140px;
		}
		
		.banner-text {
			font-size: 18px;
		}
		
		.tab-item {
			padding: 10px 12px;
			font-size: 14px;
		}
		
		.tab-item.active::after {
			left: 12px;
			right: 12px;
		}
		
		.post-container.xhs-style {
			gap: 8px;
			padding: 12px;
		}
		
		.post-title {
			font-size: 13px;
		}
		
		.menu-item {
			min-width: 70px;
			font-size: 13px;
		}
		
		.menu-icon {
			width: 36px;
			height: 36px;
		}
		
		.menu-image {
			width: 20px;
			height: 20px;
		}
		
		.main-menu {
			padding: 12px;
		}
		
		.image-info-toggle {
			bottom: 15px;
			right: 15px;
			padding: 8px 12px;
		}
		
		.toggle-text {
			font-size: 11px;
		}
	}
	
	@media (max-width: 375px) {
		.tab-item {
			padding: 10px 10px;
			font-size: 13px;
		}
		
		.tab-item.active::after {
			left: 10px;
			right: 10px;
		}
		
		.image-info-toggle {
			bottom: 10px;
			right: 10px;
			padding: 6px 10px;
		}
		
		.toggle-text {
			font-size: 10px;
		}
	}
</style>