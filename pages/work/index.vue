<template>
	<view class="container">
		<!-- 顶部标题栏 -->
		<view class="header-section">
			<!-- 添加返回按钮 -->
			<view class="back-btn" @click="goBack">
				<text class="back-icon">←</text>
				<text class="back-text">返回</text>
			</view>
			<view class="header-title">我的订单</view>
			<view class="header-actions">
				<view class="action-item" @click="goToMessage">
					<text class="action-icon">💬</text>
				</view>
				<!-- 调试按钮 -->
				<view class="action-item" @click="testUploadFunctionality" style="margin-left: 20rpx;">
					<text class="action-icon">🧪</text>
				</view>
			</view>
		</view>
		
		<!-- 订单状态筛选 -->
		<view class="status-filter">
			<scroll-view class="filter-scroll" scroll-x="true">
				<view class="filter-list">
					<view class="filter-item" 
						:class="{ active: activeStatus === '' }" 
						@click="changeStatus('')">
						<text>全部</text>
					</view>
					<view class="filter-item" 
						:class="{ active: activeStatus === '0' }" 
						@click="changeStatus('0')">
						<text>待确认</text>
						<text v-if="statusCount['0'] > 0" class="count-badge">{{ statusCount['0'] }}</text>
					</view>
					<view class="filter-item" 
						:class="{ active: activeStatus === '1' }" 
						@click="changeStatus('1')">
						<text>进行中</text>
						<text v-if="statusCount['1'] > 0" class="count-badge">{{ statusCount['1'] }}</text>
					</view>
					<!-- 设计师专属：待付款状态 -->
					<view class="filter-item" 
						:class="{ active: activeStatus === '4' }" 
						@click="changeStatus('4')">
						<text>待付款</text>
						<text v-if="statusCount['4'] > 0" class="count-badge">{{ statusCount['4'] }}</text>
					</view>
					<view class="filter-item" 
						:class="{ active: activeStatus === '2' }" 
						@click="changeStatus('2')">
						<text>已完成</text>
					</view>
					<view class="filter-item" 
						:class="{ active: activeStatus === '3' }" 
						@click="changeStatus('3')">
						<text>已取消</text>
					</view>
				</view>
			</scroll-view>
		</view>
		
		<!-- 订单列表 -->
		<scroll-view class="order-list" scroll-y="true" @scrolltolower="loadMore" refresher-enabled @refresherrefresh="onRefresh">
			<!-- 下拉刷新 -->
			<view class="refresh-container" v-if="refreshing">
				<text class="refresh-text">刷新中...</text>
			</view>
			
			<!-- 空状态 -->
			<view v-if="!loading && filteredOrderList.length === 0" class="empty-state">
				<view class="empty-icon">🎨</view>
				<view class="empty-text">暂无订单</view>
				<view class="empty-desc">您还没有接到的订单</view>
			</view>
			
			<!-- 加载状态 -->
			<view v-if="loading && filteredOrderList.length === 0" class="loading-state">
				<text class="loading-text">加载中...</text>
			</view>
			
			<!-- 订单项 -->
			<view class="order-item" v-for="order in filteredOrderList" :key="order.orderId">
				<view class="order-header">
					<view class="order-info">
						<text class="order-number">订单号：DD{{ order.orderId }}</text>
						<text class="order-time">{{ formatTime(order.createTime) }}</text>
					</view>
					<!-- 修复：使用内联对象语法 -->
					<view class="order-status" 
						:class="{
							'status-waiting-payment': isWaitingPayment(order),
							'status-pending': order.status === 0 && !isWaitingPayment(order),
							'status-progress': order.status === 1 && !isWaitingPayment(order),
							'status-completed': order.status === 2,
							'status-canceled': order.status === 3
						}">
						{{ getDesignerStatusText(order) }}
					</view>
				</view>
				
				<view class="order-content" @click="viewOrderDetail(order.orderId)">
					<view class="project-info">
						<view class="project-title">{{ order.projectInfo ? order.projectInfo.title : '设计项目' }}</view>
						<view class="project-desc">{{ order.projectInfo ? order.projectInfo.description : (order.remark || '暂无描述') }}</view>
						<view class="project-tags">
							<text class="tag" v-if="order.projectInfo && order.projectInfo.budget">预算 {{ order.projectInfo.budget }}元</text>
							<text class="tag" v-if="order.expectedEndTime">预计 {{ formatDate(order.expectedEndTime) }}完成</text>
							<text class="tag">{{ getOrderTypeText(order.type) }}</text>
							<text class="tag" v-if="order.projectInfo && order.projectInfo.area">{{ order.projectInfo.area }}㎡</text>
							<text class="tag" v-if="order.projectInfo && order.projectInfo.address">{{ order.projectInfo.address }}</text>
						</view>
					</view>
					
					<!-- 显示发布人（客户）信息 -->
					<view class="designer-info" v-if="order.userId && order.publisherInfo && order.publisherInfo.name">
						<view class="designer-avatar">
							<image :src="order.publisherInfo.avatar" mode="aspectFill" />
						</view>
						<view class="designer-details">
							<text class="designer-name">{{ order.publisherInfo.name }}</text>
							<text class="designer-role">客户</text>
							<text class="designer-phone">电话: {{ order.publisherInfo.phone }}</text>
						</view>
						<!-- 替换为 onlineConsult 方法 -->
						<view class="contact-btn" @click.stop="onlineConsult(order)">
							在线联系
						</view>
					</view>
					
					<!-- 未获取客户信息 -->
					<view class="no-designer" v-else-if="order.userId && order.publisherInfo">
						<text class="no-designer-text">{{ order.publisherInfo.name || '' }}</text>
					</view>
					
					<!-- 完全未获取客户信息 -->
					<view class="no-designer" v-else>
						<text class="no-designer-text">暂未获取客户信息</text>
					</view>
				</view>
				
				<view class="order-footer">
					<view class="order-amount">
						<text class="amount-label">订单金额：</text>
						<text class="amount-value">¥{{ order.totalAmount || 0 }}</text>
					</view>
					<view class="order-actions">
						<!-- 状态0：待确认 -->
						<template v-if="order.status === 0">
							<button class="btn secondary" @click="cancelOrder(order.orderId)">
								取消订单
							</button>
						</template>
						
						<!-- 状态1：进行中 -->
						<template v-else-if="order.status === 1">
							<!-- 合同状态0：待上传 -->
							<template v-if="order.contractStatus === 0">
								<button class="btn secondary" @click="cancelOrder(order.orderId)">
									取消订单
								</button>
								<button class="btn primary" @click="uploadContract(order.orderId)">
									上传合同
								</button>
							</template>
							
							<!-- 合同状态1：合同待确认 -->
							<template v-else-if="order.contractStatus === 1">
								<button class="btn secondary" @click="viewContract(order)">
									查看合同
								</button>
								<button class="btn secondary" @click="cancelOrder(order.orderId)">
									取消订单
								</button>
								<button class="btn primary" @click="uploadContract(order.orderId, true)">
									修改合同
								</button>
							</template>
							
							<!-- 合同状态2：合同已确认 -->
							<template v-else-if="order.contractStatus === 2">
								<button v-if="order.effectButtonText && order.effectButtonText !== '设计方案已完成'" 
										class="btn primary" 
										@click="uploadEffectDrawing(order)" 
										:loading="order.loadingEffect">
									{{ order.effectButtonText }}
								</button>
								<button v-if="order.showConstructionButton" 
										class="btn primary" 
										@click="uploadConstructionDrawing(order)" 
										:loading="order.loadingConstruction">
									上传施工设计图
								</button>
							</template>
						</template>
						
						<!-- 状态2：已完成 -->
						<template v-else-if="order.status === 2">
							<button class="btn secondary" @click="viewOrderDetail(order.orderId)">
								查看详情
							</button>
						</template>
					</view>
				</view>
			</view>
			
			<!-- 加载更多 -->
			<view v-if="loading && filteredOrderList.length > 0" class="load-more">
				<text class="load-more-text">加载中...</text>
			</view>
			<view v-if="hasMore && filteredOrderList.length > 0" class="load-more">
				<text class="load-more-text">上拉加载更多</text>
			</view>
			<view v-if="!hasMore && filteredOrderList.length > 0" class="load-more">
				<text class="load-more-text">没有更多数据了</text>
			</view>
		</scroll-view>
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
			
			// 加载订单列表
			async loadOrderList() {
				if (this.loading || !this.userInfo.userId) return
				
				try {
					this.loading = true
					
					const queryParams = {
						pageNum: this.pagination.pageNum,
						pageSize: this.pagination.pageSize
					}
					
					if (this.activeStatus !== '' && this.activeStatus !== '4') {
						queryParams.status = this.activeStatus
					}
					
					console.log('📋 加载设计师订单列表 - 设计师ID:', this.userInfo.userId, '查询参数:', queryParams)
					
					const result = await orderService.getOrderListByUserId(this.userInfo.userId, queryParams)
					console.log('✅ 设计师订单列表响应:', result)
					
					let list = []
					let total = 0
					
					if (Array.isArray(result)) {
						list = result
						total = result.length
					} else if (result && result.records) {
						list = result.records
						total = result.total
					} else if (result && result.list) {
						list = result.list
						total = result.total
					} else if (result && result.data) {
						list = result.data.records || result.data.list || []
						total = result.data.total || 0
					}
					
					console.log('🔄 开始获取订单对应的详细信息...')
					const ordersWithDetails = []
					for (const order of list) {
						let projectInfo = {}
						let publisherInfo = {}
						
						if (order.projectId) {
							try {
								projectInfo = await this.getProjectDetail(order.projectId) || {}
							} catch (error) {
								console.error(`获取订单 ${order.orderId} 的项目详情失败:`, error)
							}
						}
						
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
						
						if (order.contractStatus === 2) {
							await this.checkAndSetDesignSchemeButtons(orderWithDetails);
						}
						
						ordersWithDetails.push(orderWithDetails)
					}
					console.log('✅ 设计师订单数据整合完成:', ordersWithDetails)
					
					if (this.pagination.pageNum === 1) {
						this.orderList = ordersWithDetails
					} else {
						this.orderList = [...this.orderList, ...ordersWithDetails]
					}
					
					this.pagination.total = total
					this.hasMore = this.orderList.length < total
					
					this.updateStatusCount()
					
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
						// 9. 创建对话并跳转
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
			
			// 加载订单列表
			async loadOrderList() {
				if (this.loading || !this.userInfo.userId) return
				
				try {
					this.loading = true
					
					const queryParams = {
						pageNum: this.pagination.pageNum,
						pageSize: this.pagination.pageSize
					}
					
					if (this.activeStatus !== '' && this.activeStatus !== '4') {
						queryParams.status = this.activeStatus
					}
					
					console.log('📋 加载设计师订单列表 - 设计师ID:', this.userInfo.userId, '查询参数:', queryParams)
					
					const result = await orderService.getOrderListByUserId(this.userInfo.userId, queryParams)
					console.log('✅ 设计师订单列表响应:', result)
					
					let list = []
					let total = 0
					
					if (Array.isArray(result)) {
						list = result
						total = result.length
					} else if (result && result.records) {
						list = result.records
						total = result.total
					} else if (result && result.list) {
						list = result.list
						total = result.total
					} else if (result && result.data) {
						list = result.data.records || result.data.list || []
						total = result.data.total || 0
					}
					
					console.log('🔄 开始获取订单对应的详细信息...')
					const ordersWithDetails = []
					for (const order of list) {
						let projectInfo = {}
						let publisherInfo = {}
						
						if (order.projectId) {
							try {
								projectInfo = await this.getProjectDetail(order.projectId) || {}
							} catch (error) {
								console.error(`获取订单 ${order.orderId} 的项目详情失败:`, error)
							}
						}
						
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
						
						if (order.contractStatus === 2) {
							await this.checkAndSetDesignSchemeButtons(orderWithDetails);
						}
						
						ordersWithDetails.push(orderWithDetails)
					}
					console.log('✅ 设计师订单数据整合完成:', ordersWithDetails)
					
					if (this.pagination.pageNum === 1) {
						this.orderList = ordersWithDetails
					} else {
						this.orderList = [...this.orderList, ...ordersWithDetails]
					}
					
					this.pagination.total = total
					this.hasMore = this.orderList.length < total
					
					this.updateStatusCount()
					
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
				this.loadOrderList()
			},
			
			// 完善的在线咨询方法
			async onlineConsult(order) {
				console.log('💬 开始在线咨询，订单:', order);
				
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
				
				// 3. 检查是否是联系自己
				if (order.userId === this.userInfo.userId) {
					uni.showToast({
						title: '不能联系自己',
						icon: 'none',
						duration: 2000
					});
					return;
				}
				
				// 4. 检查是否有客户信息
				if (!order.publisherInfo) {
					uni.showToast({
						title: '客户信息不存在',
						icon: 'none',
						duration: 2000
					});
					return;
				}
				
				// 5. 获取必要的客户信息
				const targetUserId = order.userId;
				const targetUserName = order.publisherInfo.name || '客户';
				const targetAvatar = order.publisherInfo.avatar || '';
				
				console.log('📱 准备联系客户:', {
					targetUserId,
					targetUserName,
					currentUserId: this.userInfo.userId
				});
				
				// 6. 显示加载状态
				uni.showLoading({
					title: '创建对话中...',
					mask: true
				});
				
				try {
					// 7. 使用工具函数创建对话并跳转
					await createConversationAndNavigate(
						targetUserId,
						targetUserName,
						targetAvatar
					);
					
					console.log('✅ 对话创建成功');
					
				} catch (error) {
					console.error('❌ 创建对话失败:', error);
					
					// 错误处理
					let errorMessage = '创建对话失败';
					if (error.message) {
						errorMessage = error.message;
					}
					
					uni.showToast({
						title: errorMessage,
						icon: 'error',
						duration: 3000
					});
					
					// 如果是因为对话不存在，尝试直接跳转到聊天页面
					if (error.message && error.message.includes('对话不存在')) {
						console.log('⚠️ 尝试直接跳转到聊天页面');
						setTimeout(() => {
							uni.navigateTo({
								url: `/pages/chat/chat?otherUserId=${targetUserId}&otherUserName=${encodeURIComponent(targetUserName)}`
							});
						}, 1000);
					}
				} finally {
					// 8. 隐藏加载状态
					uni.hideLoading();
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
<style scoped>
	/* 返回按钮样式 */
	.back-btn {
		display: flex;
		align-items: center;
		padding: 12rpx 24rpx;
		margin-right: 20rpx;
		background-color: #f8f9fa;
		border-radius: 24rpx;
		border: 1rpx solid #e9ecef;
		transition: all 0.3s ease;
	}
	
	.back-btn:active {
		background-color: #e9ecef;
		transform: scale(0.98);
	}
	
	.back-icon {
		font-size: 32rpx;
		margin-right: 10rpx;
		color: #6c757d;
	}
	
	.back-text {
		font-size: 28rpx;
		color: #495057;
		font-weight: 500;
	}
	
	.header-section {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx 32rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
		position: relative;
		z-index: 10;
	}
	
	.header-title {
		font-size: 36rpx;
		font-weight: 700;
		color: white;
		text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
		flex: 1;
		text-align: center;
	}
	
	.header-actions {
		display: flex;
		align-items: center;
	}
	
	.action-item {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		margin-left: 20rpx;
		transition: all 0.3s ease;
	}
	
	.action-item:active {
		background: rgba(255, 255, 255, 0.3);
		transform: scale(0.95);
	}
	
	.action-icon {
		font-size: 34rpx;
		color: white;
	}
	
	/* 订单状态筛选 */
	.status-filter {
		background: white;
		padding: 24rpx 0;
		position: sticky;
		top: 0;
		z-index: 5;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
	}
	
	.filter-scroll {
		white-space: nowrap;
	}
	
	.filter-list {
		display: inline-flex;
		padding: 0 32rpx;
	}
	
	.filter-item {
		position: relative;
		padding: 16rpx 32rpx;
		margin-right: 20rpx;
		font-size: 28rpx;
		color: #6c757d;
		background: #f8f9fa;
		border-radius: 25rpx;
		transition: all 0.3s ease;
		border: 1rpx solid transparent;
	}
	
	.filter-item:last-child {
		margin-right: 0;
	}
	
	.filter-item.active {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		font-weight: 600;
		border-color: #5a67d8;
		box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.2);
	}
	
	.filter-item:not(.active):active {
		background: #e9ecef;
		transform: translateY(-2rpx);
	}
	
	.count-badge {
		position: absolute;
		top: -8rpx;
		right: -8rpx;
		background: #ff6b6b;
		color: white;
		font-size: 20rpx;
		padding: 4rpx 10rpx;
		border-radius: 20rpx;
		min-width: 28rpx;
		text-align: center;
		font-weight: 600;
		box-shadow: 0 2rpx 6rpx rgba(255, 107, 107, 0.3);
	}
	
	/* 订单列表容器 */
	.container {
		padding: 0;
		background-color: #f5f7fa;
		min-height: 100vh;
	}
	
	.order-list {
		height: calc(100vh - 240rpx);
		padding: 24rpx;
	}
	
	.refresh-container {
		text-align: center;
		padding: 30rpx;
		background: white;
		border-radius: 16rpx;
		margin-bottom: 20rpx;
	}
	
	.refresh-text {
		font-size: 28rpx;
		color: #6c757d;
		font-weight: 500;
	}
	
	/* 空状态和加载状态 */
	.empty-state, .loading-state {
		text-align: center;
		padding: 120rpx 40rpx;
		background: white;
		border-radius: 20rpx;
		margin-top: 40rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
	}
	
	.empty-icon {
		font-size: 100rpx;
		margin-bottom: 30rpx;
		color: #adb5bd;
		opacity: 0.7;
	}
	
	.empty-text {
		font-size: 34rpx;
		color: #495057;
		margin-bottom: 20rpx;
		font-weight: 600;
	}
	
	.empty-desc {
		font-size: 28rpx;
		color: #adb5bd;
		line-height: 1.5;
	}
	
	.loading-text {
		font-size: 28rpx;
		color: #6c757d;
		font-weight: 500;
	}
	
	/* 订单项样式 */
	.order-item {
		background: white;
		border-radius: 20rpx;
		margin-bottom: 24rpx;
		padding: 32rpx;
		box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.06);
		transition: all 0.3s ease;
		border: 1rpx solid #e9ecef;
	}
	
	.order-item:active {
		transform: translateY(-2rpx);
		box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
	}
	
	.order-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24rpx;
		padding-bottom: 24rpx;
		border-bottom: 1rpx solid #f1f3f5;
	}
	
	.order-info {
		flex: 1;
	}
	
	.order-number {
		display: block;
		font-size: 26rpx;
		color: #495057;
		font-weight: 500;
		margin-bottom: 8rpx;
	}
	
	.order-time {
		font-size: 24rpx;
		color: #adb5bd;
	}
	
	/* 订单状态样式 */
	.order-status {
		font-size: 26rpx;
		font-weight: 600;
		padding: 8rpx 20rpx;
		border-radius: 20rpx;
		text-align: center;
		min-width: 120rpx;
	}
	
	.status-pending {
		background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
		color: #ff8f00;
		border: 1rpx solid #ffd54f;
	}
	
	.status-progress {
		background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
		color: #1976d2;
		border: 1rpx solid #64b5f6;
	}
	
	.status-waiting-payment {
		background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
		color: #d32f2f;
		border: 1rpx solid #ef9a9a;
	}
	
	.status-completed {
		background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
		color: #388e3c;
		border: 1rpx solid #81c784;
	}
	
	.status-canceled {
		background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
		color: #757575;
		border: 1rpx solid #bdbdbd;
	}
	
	/* 订单内容 */
	.order-content {
		margin-bottom: 24rpx;
	}
	
	.project-title {
		font-size: 32rpx;
		font-weight: 700;
		color: #212529;
		margin-bottom: 12rpx;
		line-height: 1.4;
	}
	
	.project-desc {
		font-size: 28rpx;
		color: #495057;
		margin-bottom: 20rpx;
		line-height: 1.5;
	}
	
	.project-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx;
	}
	
	.tag {
		font-size: 24rpx;
		color: #6c757d;
		background: #f8f9fa;
		padding: 8rpx 16rpx;
		border-radius: 16rpx;
		border: 1rpx solid #e9ecef;
		font-weight: 500;
	}
	
	.tag:nth-child(odd) {
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
	}
	
	.tag:nth-child(even) {
		background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
		color: #1976d2;
		border-color: #bbdefb;
	}
	
	/* 设计师（客户）信息 */
	.designer-info {
		display: flex;
		align-items: center;
		margin-top: 28rpx;
		padding: 24rpx;
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		border-radius: 16rpx;
		border: 1rpx solid #dee2e6;
		transition: all 0.3s ease;
	}
	
	.designer-info:active {
		background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
	}
	
	.designer-avatar {
		width: 88rpx;
		height: 88rpx;
		border-radius: 50%;
		overflow: hidden;
		margin-right: 24rpx;
		border: 3rpx solid white;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
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
		font-size: 30rpx;
		font-weight: 600;
		color: #212529;
		margin-bottom: 6rpx;
	}
	
	.designer-role {
		display: inline-block;
		font-size: 24rpx;
		color: #1976d2;
		background: rgba(25, 118, 210, 0.1);
		padding: 4rpx 12rpx;
		border-radius: 12rpx;
		margin-bottom: 8rpx;
		font-weight: 500;
	}
	
	.designer-phone {
		display: block;
		font-size: 24rpx;
		color: #6c757d;
	}
	
	/* 联系按钮样式 */
	.contact-btn {
		font-size: 26rpx;
		color: white;
		padding: 14rpx 28rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 20rpx;
		font-weight: 600;
		border: none;
		box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.2);
		transition: all 0.3s ease;
		white-space: nowrap;
	}
	
	.contact-btn:active {
		transform: scale(0.98);
		box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.3);
	}
	
	.no-designer {
		text-align: center;
		padding: 30rpx;
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		border-radius: 16rpx;
		margin-top: 28rpx;
		border: 1rpx dashed #adb5bd;
	}
	
	.no-designer-text {
		font-size: 26rpx;
		color: #adb5bd;
		font-weight: 500;
	}
	
	/* 订单底部 */
	.order-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 24rpx;
		border-top: 1rpx solid #f1f3f5;
	}
	
	.order-amount {
		font-size: 30rpx;
	}
	
	.amount-label {
		color: #495057;
		font-weight: 500;
	}
	
	.amount-value {
		color: #ff6b35;
		font-weight: 700;
		text-shadow: 0 2rpx 4rpx rgba(255, 107, 53, 0.1);
	}
	
	.order-actions {
		display: flex;
		gap: 16rpx;
	}
	
	.btn {
		padding: 14rpx 28rpx;
		font-size: 26rpx;
		border-radius: 20rpx;
		border: none;
		font-weight: 600;
		transition: all 0.3s ease;
	}
	
	.btn:active {
		transform: scale(0.98);
	}
	
	.btn.primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.2);
	}
	
	.btn.primary:active {
		box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.3);
	}
	
	.btn.secondary {
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		color: #495057;
		border: 1rpx solid #dee2e6;
	}
	
	.btn.secondary:active {
		background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
	}
	
	/* 加载更多 */
	.load-more {
		text-align: center;
		padding: 40rpx 20rpx;
	}
	
	.load-more-text {
		font-size: 26rpx;
		color: #adb5bd;
		font-weight: 500;
	}
	
	/* 响应式调整 */
	@media (max-width: 375px) {
		.header-title {
			font-size: 32rpx;
		}
		
		.order-item {
			padding: 24rpx;
		}
		
		.project-title {
			font-size: 30rpx;
		}
		
		.designer-info {
			padding: 20rpx;
		}
		
		.designer-avatar {
			width: 80rpx;
			height: 80rpx;
		}
		
		.btn {
			padding: 12rpx 24rpx;
			font-size: 24rpx;
		}
	}
</style>