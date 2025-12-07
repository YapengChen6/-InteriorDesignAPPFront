<template>
	<view class="container">
		<!-- 顶部标题栏 -->
		<view class="header-section">
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
			
			<!-- 订单项 - 修改：在根元素添加点击事件 -->
			<view class="order-item" 
				v-for="order in filteredOrderList" 
				:key="order.orderId"
				@click="goToFinishedDetail(order)">
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
				
				<!-- 修改：添加 stop 阻止事件冒泡 -->
				<view class="order-content" @click.stop>
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
					<view class="order-actions" @click.stop>
						<!-- 状态0：待确认 -->
						<template v-if="order.status === 0">
							<button class="btn secondary" @click.stop="cancelOrder(order.orderId)">
								取消订单
							</button>
							<!-- 修改：查看详情按钮跳转到已完成订单详情 -->
							<button class="btn secondary" @click.stop="goToFinishedDetail(order)">
								查看详情
							</button>
						</template>
						
						<!-- 状态1：进行中 -->
						<template v-else-if="order.status === 1">
							<!-- 合同状态0：待上传 -->
							<template v-if="order.contractStatus === 0">
								<button class="btn secondary" @click.stop="cancelOrder(order.orderId)">
									取消订单
								</button>
								<button class="btn primary" @click.stop="uploadContract(order.orderId)">
									上传合同
								</button>
								<!-- 修改：查看详情按钮跳转到已完成订单详情 -->
								<button class="btn secondary" @click.stop="goToFinishedDetail(order)">
									查看详情
								</button>
							</template>
							
							<!-- 合同状态1：合同待确认 -->
							<template v-else-if="order.contractStatus === 1">
								<button class="btn secondary" @click.stop="viewContract(order)">
									查看合同
								</button>
								<button class="btn secondary" @click.stop="cancelOrder(order.orderId)">
									取消订单
								</button>
								<button class="btn primary" @click.stop="uploadContract(order.orderId, true)">
									修改合同
								</button>
								<!-- 修改：查看详情按钮跳转到已完成订单详情 -->
								<button class="btn secondary" @click.stop="goToFinishedDetail(order)">
									查看详情
								</button>
							</template>
							
							<!-- 合同状态2：合同已确认 -->
							<template v-else-if="order.contractStatus === 2">
								<!-- 效果图状态：0/null/undefined 为待上传 -->
								<template v-if="order.effectDrawingStatus === '0' || order.effectDrawingStatus === null || order.effectDrawingStatus === undefined">
									<button class="btn primary" @click.stop="uploadEffectDrawing(order)" 
											:loading="order.loadingEffect">
										上传效果图
									</button>
								</template>
								<!-- 效果图状态：1 为待确认（设计师已完成上传，等待客户确认） -->
								<template v-else-if="order.effectDrawingStatus === '1'">
									<text class="status-text">效果图待客户确认</text>
								</template>
								<!-- 效果图状态：2 为已确认，检查施工设计图 -->
								<template v-else-if="order.effectDrawingStatus === '2'">
									<!-- 施工设计图状态：0/null/undefined 为待上传 -->
									<template v-if="order.constructionDrawingStatus === '0' || order.constructionDrawingStatus === null || order.constructionDrawingStatus === undefined">
										<button class="btn primary" @click.stop="uploadConstructionDrawing(order)" 
												:loading="order.loadingConstruction">
											上传施工设计图
										</button>
									</template>
									<!-- 施工设计图状态：1 为待确认（设计师已完成上传，等待客户确认） -->
									<template v-else-if="order.constructionDrawingStatus === '1'">
										<text class="status-text">施工设计图待客户确认</text>
									</template>
									<!-- 施工设计图状态：2 为已确认，显示已完成状态 -->
									<template v-else-if="order.constructionDrawingStatus === '2'">
										<text class="status-text">设计方案已完成，等待客户付款</text>
									</template>
								</template>
								
								<!-- 修改：所有情况都显示查看详情按钮 -->
								<button class="btn secondary" @click.stop="goToFinishedDetail(order)">
									查看详情
								</button>
							</template>
						</template>
						
						<!-- 状态2：已完成 -->
						<template v-else-if="order.status === 2">
							<!-- 修改：查看详情按钮跳转到已完成订单详情 -->
							<button class="btn primary" @click.stop="goToFinishedDetail(order)">
								查看详情
							</button>
						</template>
						
						<!-- 状态3：已取消 -->
						<template v-else-if="order.status === 3">
							<!-- 修改：查看详情按钮跳转到已完成订单详情 -->
							<button class="btn secondary" @click.stop="goToFinishedDetail(order)">
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
import { uploadDocument } from '@/api/join.js' // 导入文档上传接口

// 方案类型常量
const SCHEME_TYPE = {
	EFFECT_DRAWING: "1",
	CONSTRUCTION_DRAWING: "2"
}

// 方案状态常量
const SCHEME_STATUS = {
	PENDING: "1",    // 待确认
	CONFIRMED: "2",  // 已确认
	COMPLETED: "3"   // 已完成
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
			// 先过滤只显示设计师订单 (type === 1)
			const designerOrders = this.orderList.filter(order => order.type === 1);
			
			console.log('🔍 设计师订单筛选结果:', {
				totalOrders: this.orderList.length,
				designerOrdersCount: designerOrders.length,
				currentUserId: this.userInfo.userId,
				filteredOrders: designerOrders.map(o => ({
					orderId: o.orderId,
					contractorId: o.contractorId,
					type: o.type
				}))
			});
			
			// 然后根据状态筛选
			if (this.activeStatus === '4') {
				// 筛选待付款订单
				return designerOrders.filter(order => this.isWaitingPayment(order));
			}
			
			if (this.activeStatus !== '') {
				return designerOrders.filter(order => order.status.toString() === this.activeStatus);
			}
			
			return designerOrders;
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
		// 新增方法：点击订单卡片跳转到已完成订单详情
		goToFinishedDetail(order) {
			if (!order || !order.orderId) {
				uni.showToast({
					title: '订单信息无效',
					icon: 'none'
				});
				return;
			}
			
			console.log('📋 设计师点击订单卡片，跳转到已完成订单详情，订单ID:', order.orderId, '订单类型:', order.type);
			
			// 无论订单当前状态如何，都跳转到已完成订单详情页面
			uni.navigateTo({
				url: `/pages/finishedorder-detail/finishedorder-detail?orderId=${order.orderId}&userId=${order.userId}&orderType=${order.type}`
			});
		},
		
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
				
				// 使用 getOrderListByContractorId 方法，将当前用户ID作为contractorId
				const result = await orderService.getOrderListByContractorId(
					this.userInfo.userId,  // contractorId 参数
					queryParams            // 其他查询参数
				)
				
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
				
				// 保存状态到订单对象（用于模板判断）
				order.effectDrawingStatus = effectDrawingStatus;
				order.constructionDrawingStatus = constructionDrawingStatus;
				
				// 设置按钮状态（与用户订单页面一致）
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
					showConstructionButton: order.showConstructionButton,
					effectDrawingStatus: order.effectDrawingStatus,
					constructionDrawingStatus: order.constructionDrawingStatus
				});
				
			} catch (error) {
				console.error(`❌ 检查设计方案按钮状态失败:`, error);
				order.effectButtonText = '上传效果图';
				order.showConstructionButton = false;
				order.effectDrawingStatus = null;
				order.constructionDrawingStatus = null;
			}
		},
		
		// 上传效果图（修改：移除状态检查，允许重复上传）
		async uploadEffectDrawing(order) {
			try {
				console.log('🎨 开始上传效果图，订单ID:', order.orderId);
				
				order.loadingEffect = true;
				
				// 移除状态检查，允许重复上传
				// 直接跳转到上传页面
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
		
		// 上传施工设计图（修改：移除状态检查，允许重复上传）
		async uploadConstructionDrawing(order) {
			try {
				console.log('🏗️ 开始上传施工设计图，订单ID:', order.orderId);
				
				order.loadingConstruction = true;
				
				// 移除状态检查，允许重复上传
				// 直接跳转到上传页面
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
		
		// 检查设计方案状态 - 修改为按最新创建时间排序
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
				
				// 过滤出指定类型的方案
				const filteredSchemes = list.filter(scheme => {
					const type = scheme.schemeType || scheme.type;
					const schemeTypeStr = String(schemeType);
					const typeStr = String(type);
					
					console.log(`🔍 方案类型比较: ${schemeTypeStr} === ${typeStr}`, schemeTypeStr === typeStr);
					
					return schemeTypeStr === typeStr;
				});
				
				console.log(`✅ 过滤后的 ${schemeType === '1' ? '效果图' : '施工设计图'} 方案:`, filteredSchemes);
				
				if (filteredSchemes.length === 0) {
					console.log(`❌ 未找到类型为 ${schemeType} 的方案`);
					return null;
				}
				
				// 按 createTime 倒序排序（最新的在前面）
				filteredSchemes.sort((a, b) => {
					const timeA = new Date(a.createTime || a.uploadTime || 0).getTime();
					const timeB = new Date(b.createTime || b.uploadTime || 0).getTime();
					
					// 降序排列，最新的在前
					return timeB - timeA;
				});
				
				console.log('📊 排序后的方案列表:', filteredSchemes);
				
				// 取第一个（最新的）方案的状态
				const latestScheme = filteredSchemes[0];
				console.log(`✅ 使用最新方案判断状态:`, {
					schemeId: latestScheme.designSchemeId,
					createTime: latestScheme.createTime,
					status: latestScheme.status
				});
				
				return String(latestScheme.status); 
				
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

		// 查看合同 - 修改为预览PDF
		async viewContract(order) {
			try {
				console.log('📄 查看合同，订单ID:', order.orderId);
				console.log('📄 合同URL:', order.contractUrl);
				
				if (order.contractUrl) {
					// 显示加载提示
					uni.showLoading({
						title: '加载合同中...',
						mask: true
					});
					
					try {
						// 下载PDF文件
						uni.downloadFile({
							url: order.contractUrl,
							header: {
								'Content-Type': 'application/octet-stream'
							},
							success: (res) => {
								uni.hideLoading();
								console.log('✅ 合同文件下载成功:', res);
								
								if (res.statusCode === 200) {
									// 打开PDF文档预览
									uni.openDocument({
										filePath: res.tempFilePath,
										fileType: 'pdf',
										showMenu: true, // 显示菜单，用户可以保存
										success: () => {
											console.log('✅ PDF合同预览成功');
										},
										fail: (error) => {
											console.error('❌ PDF合同打开失败:', error);
											
											// 如果打开失败，尝试使用图片预览（兼容旧格式）
											uni.previewImage({
												urls: [order.contractUrl],
												current: order.contractUrl,
												fail: (imgError) => {
													this.handleApiError(imgError, '合同预览失败');
												}
											});
										}
									});
								} else {
									throw new Error(`下载失败，状态码: ${res.statusCode}`);
								}
							},
							fail: (error) => {
								uni.hideLoading();
								console.error('❌ 合同文件下载失败:', error);
								
								// 如果下载失败，尝试直接预览（可能是图片格式）
								uni.previewImage({
									urls: [order.contractUrl],
									current: order.contractUrl,
									fail: (previewError) => {
										this.handleApiError(previewError, '合同预览失败');
									}
								});
							}
						});
					} catch (downloadError) {
						uni.hideLoading();
						console.error('❌ 合同预览异常:', downloadError);
						this.handleApiError(downloadError, '合同预览失败');
					}
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

		// 设计师上传/修改合同 - 修改为上传PDF文件
		async uploadContract(orderId, isModify = false) {
			try {
				console.log(`📄 开始${isModify ? '修改' : '上传'}合同文件，订单ID:`, orderId);
				
				// 调用选择文件方法
				const fileInfo = await this.chooseContractFile();
				if (!fileInfo) {
					console.log('❌ 用户取消选择文件');
					return;
				}

				console.log('📄 选择的文件信息:', fileInfo);

				// 验证文件类型为PDF
				if (fileInfo.fileExt.toLowerCase() !== 'pdf') {
					uni.showToast({
						title: '合同文件必须为PDF格式',
						icon: 'none'
					});
					return;
				}

				// 验证文件大小（限制20MB）
				const maxSize = 20 * 1024 * 1024;
				if (fileInfo.size > maxSize) {
					uni.showToast({
						title: '文件大小不能超过20MB',
						icon: 'none'
					});
					return;
				}

				uni.showLoading({ 
					title: `${isModify ? '修改' : '上传'}合同中...`,
					mask: true
				});

				// 1. 上传合同文件到文档服务（使用专用接口）
				const uploadResult = await this.uploadContractFileDirect(
					orderId, 
					fileInfo.path, 
					fileInfo.name
				);
				
				if (uploadResult && uploadResult.code === 200) {
					console.log(`✅ 合同文件${isModify ? '修改' : '上传'}成功:`, uploadResult);
						
					// 2. 获取上传成功的文件URL
					const contractUrl = uploadResult.data?.url || uploadResult.data?.fileUrl || uploadResult.url;
					console.log('📄 合同文件URL:', contractUrl);
						
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
						throw new Error('未获取到合同文件URL');
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

		// 选择合同文件（使用微信小程序的 chooseMessageFile）
		chooseContractFile() {
			return new Promise((resolve, reject) => {
				uni.chooseMessageFile({
					count: 1,
					type: 'file',
					extension: ['pdf'], // 只允许选择PDF文件
					success: (res) => {
						console.log('📄 选择的合同文件:', res);
						const tempFile = res.tempFiles[0];
						
						// 获取文件扩展名
						const fileExt = this.getFileExtension(tempFile.name || tempFile.path);
						
						// 验证文件类型
						if (fileExt.toLowerCase() !== 'pdf') {
							uni.showToast({
								title: '请选择PDF格式的合同文件',
								icon: 'none'
							});
							reject(new Error('文件格式不支持'));
							return;
						}
						
						resolve({
							path: tempFile.path,
							name: tempFile.name || `合同文件.${fileExt}`,
							size: tempFile.size,
							fileExt: fileExt
						});
					},
					fail: (error) => {
						console.error('❌ 选择文件失败:', error);
						reject(new Error('选择文件失败: ' + error.errMsg));
					}
				});
			});
		},

		// 获取文件扩展名
		getFileExtension(filePath) {
			const parts = filePath.split('.');
			return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
		},

		// 上传合同文件到文档服务（使用专用接口）- 修改为正确的参数调用
		async uploadContractFileDirect(orderId, filePath, fileName) {
			try {
				console.log('📤 使用文档上传接口上传合同文件:', { 
					orderId, 
					filePath, 
					fileName
				});

				// 显示上传进度
				uni.showLoading({
					title: '上传中...',
					mask: true
				});

				// 使用正确的参数调用 uploadDocument
				// 根据 uploadDocument 函数的签名：
				// uploadDocument(file, relatedType, relatedId, description, stage, sequence)
				const result = await uploadDocument(
					filePath,           // file
					9,                  // relatedType: 合同类型 (9)
					orderId,            // relatedId: 订单ID
					`订单${orderId}的合同文件 - ${fileName}`,  // description
					'CONTRACT',         // stage: 合同阶段
					0                   // sequence: 顺序号
				);

				console.log('✅ 合同文件上传结果:', result);

				// 检查上传结果
				if (result && result.code === 200) {
					uni.hideLoading();
					return result;
				} else {
					throw new Error(result?.msg || '上传失败');
				}

			} catch (error) {
				uni.hideLoading();
				console.error('❌ 合同文件上传失败:', error);
				
				// 返回详细的错误信息
				let errorMessage = '上传失败';
				if (error && error.message) {
					errorMessage = error.message;
				} else if (error && error.errMsg) {
					errorMessage = error.errMsg;
				}
				
				throw new Error(errorMessage);
			}
		},

		// 测试上传功能
		async testUploadFunctionality() {
			try {
				console.log('🧪 测试PDF上传功能...');
				
				const fileInfo = await this.chooseContractFile();
				if (!fileInfo) {
					console.log('❌ 测试：用户取消选择文件');
					return;
				}
				
				console.log('📄 测试文件信息:', fileInfo);
				
				let testOrderId = 1;
				if (this.orderList.length > 0) {
					testOrderId = this.orderList[0].orderId;
				}
				
				console.log('🚀 开始测试上传，订单ID:', testOrderId);
				uni.showLoading({ title: '测试上传中...' });
				
				const result = await this.uploadContractFileDirect(testOrderId, fileInfo.path, fileInfo.name);
				console.log('✅ 测试上传成功:', result);
				
				uni.hideLoading();
				uni.showToast({
					title: 'PDF上传测试成功',
					icon: 'success'
				});
				
			} catch (error) {
				uni.hideLoading();
				console.error('❌ 测试上传失败:', error);
				this.handleApiError(error, 'PDF上传测试失败');
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
		
		// 更新状态统计（只统计设计师类型的订单）
		updateStatusCount() {
			// 重置统计
			this.statusCount = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0 }
			
			// 只统计设计师订单 (type === 1)
			const designerOrders = this.orderList.filter(order => order.type === 1);
			
			designerOrders.forEach(order => {
				const status = order.status.toString()
				if (this.statusCount[status] !== undefined) {
					this.statusCount[status]++
				}
				
				// 统计待付款订单数量
				if (this.isWaitingPayment(order)) {
					this.statusCount['4']++
				}
			})
			
			console.log('📊 设计师订单状态统计:', this.statusCount)
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
		
		// 取消订单 - 修改：添加项目状态更新功能
		async cancelOrder(orderId) {
			try {
				uni.showModal({
					title: '确认取消',
					content: '确定要取消这个订单吗？',
					success: async (res) => {
						if (res.confirm) {
							uni.showLoading({ title: '取消中...' })
							
							try {
								// 1. 查找订单详情以获取项目ID
								const order = this.orderList.find(item => item.orderId === orderId);
								let projectId = null;
								
								// 从不同位置获取项目ID
								if (order) {
									if (order.projectId) {
										projectId = order.projectId;
									} else if (order.projectInfo && order.projectInfo.projectId) {
										projectId = order.projectInfo.projectId;
									}
								}
								
								console.log('🔍 准备取消订单，订单ID:', orderId, '项目ID:', projectId);
								
								// 2. 调用取消订单的API
								await orderService.cancelOrder(orderId);
								console.log('✅ 订单取消成功');
								
								// 3. 如果有关联项目，更新项目状态为5（已取消）
								if (projectId) {
									try {
										console.log('🔄 开始更新项目状态，项目ID:', projectId, '状态: 5（已取消）');
										
										// 使用现有的 projectService 更新项目状态
										const projectResult = await projectService.updateProjectStatus(projectId, 5);
										
										console.log('✅ 项目状态更新成功:', projectResult);
										
										uni.showToast({
											title: '订单已取消，项目状态已更新',
											icon: 'success'
										});
										
									} catch (projectError) {
										console.error('❌ 项目状态更新失败:', projectError);
										// 即使项目状态更新失败，订单仍然成功取消
										uni.showToast({
											title: '订单已取消，但项目状态更新失败',
											icon: 'none'
										});
									}
								} else {
									// 没有关联项目，只显示订单取消成功
									uni.showToast({
										title: '订单已取消',
										icon: 'success'
									});
								}
								
								// 4. 刷新订单列表
								this.pagination.pageNum = 1;
								this.loadOrderList();
								
							} catch (orderError) {
								console.error('❌ 取消订单失败:', orderError);
								this.handleApiError(orderError, '取消订单失败');
							} finally {
								uni.hideLoading();
							}
						}
					}
				})
			} catch (error) {
				uni.hideLoading();
				this.handleApiError(error, '取消订单失败');
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
	.container {
		padding: 0;
		background-color: #f5f5f5;
		min-height: 100vh;
	}
	
	.header-section {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		padding: 30rpx;
		background: white;
		border-bottom: 1rpx solid #eee;
	}
	
	.header-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
		flex: 1;
		text-align: center;
		margin-right: 120rpx;
	}
	
	.back-btn {
		display: flex;
		align-items: center;
		padding: 10rpx 20rpx;
		margin-right: 20rpx;
		background-color: #f5f5f5;
		border-radius: 20rpx;
	}
	
	.back-icon {
		font-size: 32rpx;
		margin-right: 10rpx;
	}
	
	.back-text {
		font-size: 28rpx;
		color: #333;
	}
	
	.header-actions {
		display: flex;
		align-items: center;
	}
	
	.action-item {
		padding: 10rpx;
	}
	
	.action-icon {
		font-size: 40rpx;
	}
	
	.status-filter {
		background: white;
		padding: 20rpx 0;
	}
	
	.filter-scroll {
		white-space: nowrap;
	}
	
	.filter-list {
		display: inline-flex;
		padding: 0 30rpx;
	}
	
	.filter-item {
		position: relative;
		padding: 20rpx 30rpx;
		margin-right: 40rpx;
		font-size: 28rpx;
		color: #666;
	}
	
	.filter-item.active {
		color: #007AFF;
		font-weight: bold;
	}
	
	.filter-item.active::after {
		content: '';
		position: absolute;
		bottom: 10rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 40rpx;
		height: 4rpx;
		background: #007AFF;
		border-radius: 2rpx;
	}
	
	.count-badge {
		position: absolute;
		top: 10rpx;
		right: 10rpx;
		background: #FF3B30;
		color: white;
		font-size: 20rpx;
		padding: 4rpx 8rpx;
		border-radius: 20rpx;
		min-width: 24rpx;
		text-align: center;
	}
	
	.order-list {
		height: calc(100vh - 200rpx);
		padding: 20rpx;
	}
	
	.refresh-container {
		text-align: center;
		padding: 20rpx;
	}
	
	.refresh-text {
		font-size: 28rpx;
		color: #999;
	}
	
	.empty-state, .loading-state {
		text-align: center;
		padding: 100rpx 0;
	}
	
	.empty-icon {
		font-size: 120rpx;
		margin-bottom: 30rpx;
	}
	
	.empty-text {
		font-size: 32rpx;
		color: #999;
		margin-bottom: 20rpx;
	}
	
	.empty-desc {
		font-size: 28rpx;
		color: #ccc;
	}
	
	.loading-text {
		font-size: 28rpx;
		color: #999;
	}
	
	/* 修改：添加订单卡片点击效果 */
	.order-item {
		background: white;
		border-radius: 16rpx;
		margin-bottom: 20rpx;
		padding: 30rpx;
		box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
		cursor: pointer;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}
	
	.order-item:active {
		transform: scale(0.99);
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
	}
	
	.order-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 20rpx;
		padding-bottom: 20rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}
	
	.order-info {
		flex: 1;
	}
	
	.order-number {
		display: block;
		font-size: 26rpx;
		color: #666;
		margin-bottom: 10rpx;
	}
	
	.order-time {
		font-size: 24rpx;
		color: #999;
		display: block;
		margin-bottom: 10rpx;
	}
	
	.order-status {
		font-size: 26rpx;
		font-weight: bold;
		padding: 8rpx 16rpx;
		border-radius: 20rpx;
	}
	
	.status-pending {
		background: #FFF6E6;
		color: #FF9500;
	}
	
	.status-progress {
		background: #E6F7FF;
		color: #007AFF;
	}
	
	.status-waiting-payment {
		background: #FFEBEE;
		color: #FF5252;
	}
	
	.status-completed {
		background: #E6FFED;
		color: #52C41A;
	}
	
	.status-canceled {
		background: #FFF2F0;
		color: #FF4D4F;
	}
	
	.order-content {
		margin-bottom: 20rpx;
	}
	
	.project-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 10rpx;
	}
	
	.project-desc {
		font-size: 28rpx;
		color: #666;
		margin-bottom: 15rpx;
		line-height: 1.4;
	}
	
	.project-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 10rpx;
	}
	
	.tag {
		font-size: 24rpx;
		color: #999;
		background: #f5f5f5;
		padding: 6rpx 12rpx;
		border-radius: 12rpx;
	}
	
	.designer-info {
		display: flex;
		align-items: center;
		margin-top: 20rpx;
		padding: 20rpx;
		background: #f9f9f9;
		border-radius: 12rpx;
	}
	
	.designer-avatar {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		overflow: hidden;
		margin-right: 20rpx;
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
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 5rpx;
	}
	
	.designer-role {
		display: inline-block;
		font-size: 24rpx;
		color: #007AFF;
		background: rgba(0, 122, 255, 0.1);
		padding: 4rpx 12rpx;
		border-radius: 12rpx;
		margin-bottom: 8rpx;
	}
	
	.designer-phone {
		font-size: 24rpx;
		color: #666;
	}
	
	.contact-btn {
		font-size: 26rpx;
		color: #007AFF;
		padding: 10rpx 20rpx;
		border: 1rpx solid #007AFF;
		border-radius: 20rpx;
	}
	
	.no-designer {
		text-align: center;
		padding: 20rpx;
		background: #f9f9f9;
		border-radius: 12rpx;
		margin-top: 20rpx;
	}
	
	.no-designer-text {
		font-size: 26rpx;
		color: #999;
	}
	
	.order-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 20rpx;
		border-top: 1rpx solid #f0f0f0;
	}
	
	.order-amount {
		font-size: 28rpx;
	}
	
	.amount-label {
		color: #666;
	}
	
	.amount-value {
		color: #FF6B35;
		font-weight: bold;
	}
	
	.order-actions {
		display: flex;
		gap: 15rpx;
	}
	
	.btn {
		padding: 12rpx 24rpx;
		font-size: 26rpx;
		border-radius: 20rpx;
		border: none;
	}
	
	.btn.primary {
		background: #007AFF;
		color: white;
	}
	
	.btn.secondary {
		background: #f5f5f5;
		color: #666;
		border: 1rpx solid #ddd;
	}
	
	.status-text {
		font-size: 26rpx;
		color: #666;
		padding: 12rpx 0;
	}
	
	.load-more {
		text-align: center;
		padding: 30rpx;
	}
	
	.load-more-text {
		font-size: 26rpx;
		color: #999;
	}
</style>