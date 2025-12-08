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
			<view v-if="!loading && orderList.length === 0" class="empty-state">
				<view class="empty-icon">👤</view>
				<view class="empty-text">暂无订单</view>
				<view class="empty-desc">您还没有任何订单</view>
			</view>
			
			<!-- 加载状态 -->
			<view v-if="loading && orderList.length === 0" class="loading-state">
				<text class="loading-text">加载中...</text>
			</view>
			
			<!-- 订单项 - 修改：在根元素添加点击事件 -->
			<view class="order-item" 
				v-for="order in orderList" 
				:key="order.orderId"
				@click="goToFinishedDetail(order)">
				<view class="order-header">
					<view class="order-info">
						<text class="order-number">订单号：DD{{ order.orderId }}</text>
						<text class="order-time">{{ formatTime(order.createTime) }}</text>
						<!-- 修复：使用对象语法 -->
						<view :class="['order-type-tag', orderTypeClass[order.type]]">
							{{ orderTypeTextMap[order.type] || '未知类型' }}
						</view>
					</view>
					<!-- 修复：使用对象语法 -->
					<view :class="['order-status', statusClass[order.status]]">
						{{ statusTextMap[order.status] || '未知状态' }}
					</view>
				</view>
				
				<!-- 修改：添加 stop 阻止事件冒泡 -->
				<view class="order-content" @click.stop>
					<view class="project-info">
						<view class="project-title">{{ order.projectInfo ? order.projectInfo.title : '监理项目' }}</view>
						<view class="project-desc">{{ order.projectInfo ? order.projectInfo.description : (order.remark || '暂无描述') }}</view>
						<view class="project-tags">
							<text class="tag" v-if="order.projectInfo && order.projectInfo.budget">预算 {{ order.projectInfo.budget }}元</text>
							<text class="tag" v-if="order.expectedEndTime">预计 {{ formatDate(order.expectedEndTime) }}完成</text>
							<text class="tag">{{ orderTypeTextMap[order.type] || '未知类型' }}</text>
							<text class="tag" v-if="order.projectInfo && order.projectInfo.area">{{ order.projectInfo.area }}㎡</text>
							<text class="tag" v-if="order.projectInfo && order.projectInfo.address">{{ order.projectInfo.address }}</text>
						</view>
					</view>
					
					<!-- 显示承接方信息 -->
					<view class="designer-info" v-if="order.contractorId && order.contractorInfo && order.contractorInfo.name">
						<view class="designer-avatar">
							<image :src="order.contractorInfo.avatar" mode="aspectFill" />
						</view>
						<view class="designer-details">
							<text class="designer-name">{{ order.contractorInfo.name }}</text>
							<text class="designer-phone">电话: {{ order.contractorInfo.phone }}</text>
						</view>
						<view class="contact-btn" @click.stop="contactOrderParty(order)">
							联系
						</view>
					</view>
					
					<!-- 未分配承接方 -->
					<view class="no-designer" v-else-if="order.contractorId && order.contractorInfo">
						<text class="no-designer-text">{{ order.contractorInfo.name || '未知承接方' }}</text>
					</view>
					
					<!-- 完全未分配 -->
					<view class="no-designer" v-else>
						<text class="no-designer-text">暂未分配承接方</text>
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
							<button class="btn primary" @click.stop="confirmOrder(order.orderId)">
								确认订单
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
								<button class="btn secondary" @click.stop="rejectContract(order.orderId)">
									拒绝合同
								</button>
								<button class="btn primary" @click.stop="confirmContract(order.orderId)">
									确认合同
								</button>
								<!-- 修改：查看详情按钮跳转到已完成订单详情 -->
								<button class="btn secondary" @click.stop="goToFinishedDetail(order)">
									查看详情
								</button>
							</template>
							
							<!-- 合同状态2：合同已确认 -->
							<template v-else-if="order.contractStatus === 2">
								<!-- 设计师订单：方案状态逻辑 -->
								<template v-if="String(order.type) === '1'">
									<!-- 效果图状态：0/null/undefined 为待上传 -->
									<template v-if="order.effectDrawingStatus === '0' || order.effectDrawingStatus === null || order.effectDrawingStatus === undefined">
										<text class="status-text">待上传效果图</text>
									</template>
									<!-- 效果图状态：1 为待确认 -->
									<template v-else-if="order.effectDrawingStatus === '1'">
										<button class="btn primary" @click.stop="confirmEffectDrawing(order.orderId)">
											确认效果图
										</button>
									</template>
									<!-- 效果图状态：2 为已确认，检查施工设计图 -->
									<template v-else-if="order.effectDrawingStatus === '2'">
										<!-- 施工设计图状态：0/null/undefined 为待上传 -->
										<template v-if="order.constructionDrawingStatus === '0' || order.constructionDrawingStatus === null || order.constructionDrawingStatus === undefined">
											<text class="status-text">待上传施工设计图</text>
										</template>
										<!-- 施工设计图状态：1 为待确认 -->
										<template v-else-if="order.constructionDrawingStatus === '1'">
											<button class="btn primary" @click.stop="confirmConstructionDrawing(order.orderId)">
												确认施工设计图
											</button>
										</template>
										<!-- 施工设计图状态：2 为已确认，显示付款按钮 -->
										<template v-else-if="order.constructionDrawingStatus === '2'">
											<button class="btn primary" @click.stop="payOrder(order.orderId)">
												立即付款
											</button>
										</template>
									</template>
									
									<!-- 修改：查看详情按钮跳转到已完成订单详情 -->
									<button class="btn secondary" @click.stop="goToFinishedDetail(order)">
										查看详情
									</button>
								</template>
								
								<!-- 监理订单：新增施工阶段逻辑 -->
								<template v-else-if="String(order.type) === '2'">
									<!-- 新增：所有阶段status=4时显示"待付款"按钮 -->
									<template v-if="order.allStagesCompleted">
										<button class="btn primary" @click.stop="paySupervisorOrder(order.orderId)">
											待付款
										</button>
									</template>
									
									<!-- 没有施工阶段 - 显示等待监理上传 -->
									<template v-else-if="!order.hasStages">
										<text class="status-text">等待监理上传</text>
									</template>
									
									<!-- 有待确认的施工阶段 -->
									<template v-else-if="order.hasUnconfirmedStages">
										<button class="btn primary" @click.stop="confirmConstructionStages(order.orderId)">
											确认施工阶段
										</button>
									</template>
									
									<!-- 有已确认的施工阶段 -->
									<template v-else-if="order.hasStages && !order.hasUnconfirmedStages">
										<button class="btn primary" @click.stop="goToConstructionStage(order.orderId)">
											查看施工阶段
										</button>
									</template>
									
									<!-- 默认按钮（备用） -->
									<template v-else>
										<button class="btn primary" @click.stop="goToConstructionStage(order.orderId)">
											施工阶段
										</button>
									</template>
									
									<!-- 修改：查看详情按钮跳转到已完成订单详情 -->
									<button class="btn secondary" @click.stop="goToFinishedDetail(order)">
										查看详情
									</button>
								</template>
							</template>
						</template>
						
						<!-- 状态2：已完成 -->
						<template v-else-if="order.status === 2">
							<!-- 修改：查看详情按钮跳转到已完成订单详情 -->
							<button class="btn secondary" @click.stop="goToFinishedDetail(order)">
								查看详情
							</button>
							<!-- 显示评价按钮，根据是否有评价决定是否显示 -->
							<button v-if="!order.hasReview" class="btn primary" @click.stop="goToReview(order.orderId)">
								评价订单
							</button>
							<!-- 如果已有评价，显示已评价状态 -->
							<text v-if="order.hasReview" class="status-text">
								已评价
							</text>
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
			<view v-if="loading && orderList.length > 0" class="load-more">
				<text class="load-more-text">加载中...</text>
			</view>
			<view v-if="hasMore && orderList.length > 0" class="load-more">
				<text class="load-more-text">上拉加载更多</text>
			</view>
			<view v-if="!hasMore && orderList.length > 0" class="load-more">
				<text class="load-more-text">没有更多数据了</text>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import { orderService } from '@/api/order.js'
	import { projectService } from '@/api/project.js'
	import { getUserProfile, getCurrentRole, getUserById } from '@/api/users.js'
	import { getDesignSchemeList } from '@/api/designScheme.js'
	import { orderReviewApi } from '@/api/orderReview.js'
	// 新增：导入施工阶段API
	import { orderStageService } from '@/api/orderStage.js'
	// 新增：导入联系功能所需的工具函数
	import { isUserLoggedIn, handleNotLoggedIn, createConversationAndNavigate } from "@/utils/conversationHelper.js"
	
	// 方案类型常量
	const SCHEME_TYPE = {
		EFFECT_DRAWING: "1",
		CONSTRUCTION_DRAWING: "2"
	}
	
	// 订单类型常量
	const ORDER_TYPE = {
		DESIGN: "1",      // 设计师订单
		SUPERVISOR: "2"   // 监理订单
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
					'3': 0
				},
				
				// 修复：使用数据映射替代函数调用
				statusClass: {
					0: 'status-pending',
					1: 'status-progress',
					2: 'status-completed',
					3: 'status-canceled'
				},
				
				// 修复：使用数据映射替代函数调用
				orderTypeClass: {
					'1': 'type-design',
					'2': 'type-supervisor'
				},
				
				// 新增：状态文本映射表
				statusTextMap: {
					0: '待确认',
					1: '进行中',
					2: '已完成',
					3: '已取消'
				},
				
				// 新增：订单类型文本映射表
				orderTypeTextMap: {
					'1': '设计师订单',
					'2': '监理订单'
				}
			}
		},
		onLoad() {
			console.log('🚀 用户订单页面加载');
			this.loadCurrentUserInfo();
		},
		onShow() {
			console.log('🔄 用户订单页面显示，刷新数据');
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
				
				console.log('📋 点击订单卡片，跳转到已完成订单详情，订单ID:', order.orderId, '订单类型:', order.type);
				
				// 无论订单当前状态如何，都跳转到已完成订单详情页面
				uni.navigateTo({
					url: `/pages/finishedorder-detail/finishedorder-detail?orderId=${order.orderId}&userId=${this.userInfo.userId}&orderType=${order.type}`
				});
			},
			
			// 返回首页
			goBack() {
				console.log('🔙 返回首页');
				uni.switchTab({
					url: '/pages/index'
				});
			},

			// 跳转到施工阶段页面（监理订单）
			goToConstructionStage(orderId) {
				console.log('🏗️ 跳转到施工阶段页面，订单ID:', orderId, '用户ID:', this.userInfo.userId);
				uni.navigateTo({
					url: `/pages/order-hall/orderstage-qr?orderId=${orderId}&userId=${this.userInfo.userId}`
				});
			},

			// 检查订单是否有评价
			async checkOrderReviewStatus(orderId) {
				try {
					console.log('🔍 检查订单评价状态，订单ID:', orderId);
					const result = await orderReviewApi.getList({ orderId: orderId });
					console.log('📋 评价查询结果:', result);
					
					if (result && result.code === 200) {
						let reviewList = [];
						
						// 解析评价列表
						if (Array.isArray(result.data)) {
							reviewList = result.data;
						} else if (result.data && Array.isArray(result.data.records)) {
							reviewList = result.data.records;
						} else if (result.data && Array.isArray(result.data.list)) {
							reviewList = result.data.list;
						}
						
						console.log('📝 订单评价列表:', reviewList);
						// 如果有评价记录，返回true，否则返回false
						return reviewList.length > 0;
					}
					
					return false;
				} catch (error) {
					console.error('❌ 检查评价状态失败:', error);
					return false;
				}
			},

			// 检查订单施工阶段状态
			async checkConstructionStagesStatus(orderId) {
				try {
					console.log('🔍 检查施工阶段状态，订单ID:', orderId);
					
					const response = await orderStageService.list({ orderId: orderId });
					console.log('📋 施工阶段查询结果:', response);
					
					let stages = [];
					
					// 解析施工阶段列表
					if (response && response.code === 200) {
						if (Array.isArray(response.data)) {
							stages = response.data;
						} else if (response.data && Array.isArray(response.data.records)) {
							stages = response.data.records;
						} else if (response.data && Array.isArray(response.data.list)) {
							stages = response.data.list;
						}
					} else if (Array.isArray(response)) {
						stages = response;
					}
					
					console.log('📝 施工阶段列表:', stages);
					
					// 检查是否有施工阶段
					const hasStages = stages.length > 0;
					
					// 检查是否有待确认的阶段（status = 0）
					const hasUnconfirmedStages = stages.some(stage => Number(stage.status) === 0);
					
					// 新增：检查是否所有阶段都已完成（status = 4）
					const allStagesCompleted = hasStages && stages.every(stage => Number(stage.status) === 4);
					
					// 返回施工阶段状态信息
					return {
						hasStages,
						hasUnconfirmedStages,
						allStagesCompleted,
						totalStages: stages.length,
						unconfirmedCount: stages.filter(stage => Number(stage.status) === 0).length,
						completedCount: stages.filter(stage => Number(stage.status) === 4).length
					};
					
				} catch (error) {
					console.error('❌ 检查施工阶段状态失败:', error);
					return {
						hasStages: false,
						hasUnconfirmedStages: false,
						allStagesCompleted: false,
						totalStages: 0,
						unconfirmedCount: 0,
						completedCount: 0
					};
				}
			},

			// 确认施工阶段（跳转到施工阶段确认页面）
			async confirmConstructionStages(orderId) {
				try {
					console.log('✅ 确认施工阶段，订单ID:', orderId, '用户ID:', this.userInfo.userId);
					
					uni.navigateTo({
						url: `/pages/order-hall/order-have?orderId=${orderId}&userId=${this.userInfo.userId}`
					});
					
				} catch (error) {
					console.error('❌ 跳转施工阶段确认页面失败:', error);
					this.handleApiError(error, '跳转失败');
				}
			},

			// 监理订单待付款按钮点击事件
			async paySupervisorOrder(orderId) {
				try {
					console.log('💰 监理订单待付款，订单ID:', orderId);
					
					uni.showModal({
						title: '确认付款',
						content: '所有施工阶段已完成，确定要支付这个订单吗？付款后订单将标记为已完成。',
						success: async (res) => {
							if (res.confirm) {
								uni.showLoading({ title: '付款中...' });
								
								try {
									console.log('📤 调用 completeOrder API，订单ID:', orderId);
									
									const result = await orderService.completeOrder(orderId);
									
									console.log('📡 completeOrder API 响应:', result);
									
									uni.hideLoading();
									
									if (result === true || (result && result.code === 200)) {
										uni.showToast({
											title: '付款成功，订单已完成',
											icon: 'success',
											duration: 2000
										});
										
										// 刷新订单列表
										setTimeout(() => {
											this.pagination.pageNum = 1;
											this.loadOrderList();
										}, 1500);
										
									} else {
										console.error('❌ completeOrder 返回错误:', result);
										throw new Error(result?.msg || '付款失败');
									}
								} catch (error) {
									uni.hideLoading();
									console.error('❌ 付款失败:', error);
									this.handleApiError(error, '付款失败');
								}
							}
						}
					});
					
				} catch (error) {
					console.error('❌ 监理订单付款操作失败:', error);
					this.handleApiError(error, '付款操作失败');
				}
			},

			// 用户跳转到评价页面
			goToReview(orderId) {
				console.log('📝 跳转到评价页面，订单ID:', orderId, '用户ID:', this.userInfo.userId);
				uni.navigateTo({
					url: `/pages/review/review?orderId=${orderId}&userId=${this.userInfo.userId}`
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
							this.userInfo.role = roleRes.data.role || roleRes.data.roleType || 'customer';
							this.userInfo.roleName = roleRes.data.roleName || '';
						} else {
							this.userInfo.role = 'customer'; // 默认角色
							this.userInfo.roleName = '客户';
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
					
					if (this.activeStatus !== '') {
						queryParams.status = this.activeStatus
					}
					
					console.log('📋 加载用户订单列表 - 用户ID:', this.userInfo.userId, '查询参数:', queryParams)
					
					const result = await orderService.getOrderListByUserId(this.userInfo.userId, queryParams)
					console.log('✅ 用户订单列表响应:', result)
					
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
						let contractorInfo = {}
						
						if (order.projectId) {
							try {
								projectInfo = await this.getProjectDetail(order.projectId) || {}
							} catch (error) {
								console.error(`获取订单 ${order.orderId} 的项目详情失败:`, error)
							}
						}
						
						if (order.contractorId) {
							try {
								// 使用 getUserById 方法获取其他用户信息
								contractorInfo = await this.getUserInfoById(order.contractorId) || {}
							} catch (error) {
								console.error(`获取订单 ${order.orderId} 的承接方信息失败:`, error)
							}
						}
						
						// 检查订单是否有评价（只在已完成状态时检查）
						let hasReview = false
						if (order.status === 2) {
							try {
								hasReview = await this.checkOrderReviewStatus(order.orderId)
								console.log(`📝 订单 ${order.orderId} 评价状态:`, hasReview ? '已评价' : '未评价')
							} catch (error) {
								console.error(`检查订单 ${order.orderId} 评价状态失败:`, error)
								hasReview = false
							}
						}
						
						let orderWithDetails = {
							...order,
							projectInfo,
							contractorInfo,
							hasReview,
							effectDrawingStatus: null,
							constructionDrawingStatus: null,
							// 新增施工阶段状态字段
							hasStages: false,
							hasUnconfirmedStages: false,
							// 新增：所有阶段是否完成字段
							allStagesCompleted: false
						}
						
						// 只有设计师订单才需要检查设计方案状态
						if (String(order.type) === '1' && order.contractStatus === 2) {
							orderWithDetails.effectDrawingStatus = await this.checkDesignSchemeStatus(order.orderId, SCHEME_TYPE.EFFECT_DRAWING);
							orderWithDetails.constructionDrawingStatus = await this.checkDesignSchemeStatus(order.orderId, SCHEME_TYPE.CONSTRUCTION_DRAWING);
							
							console.log(`🎨 设计师订单 ${order.orderId} 方案状态:`, {
								效果图: orderWithDetails.effectDrawingStatus,
								施工设计图: orderWithDetails.constructionDrawingStatus,
								合同状态: order.contractStatus,
								订单状态: order.status
							});
						}
						
						// 只有监理订单才需要检查施工阶段状态
						if (String(order.type) === '2' && order.contractStatus === 2) {
							const stagesStatus = await this.checkConstructionStagesStatus(order.orderId);
							orderWithDetails.hasStages = stagesStatus.hasStages;
							orderWithDetails.hasUnconfirmedStages = stagesStatus.hasUnconfirmedStages;
							// 新增：设置所有阶段是否完成
							orderWithDetails.allStagesCompleted = stagesStatus.allStagesCompleted;
							
							console.log(`🏗️ 监理订单 ${order.orderId} 施工阶段状态:`, {
								是否有阶段: stagesStatus.hasStages,
								有待确认阶段: stagesStatus.hasUnconfirmedStages,
								所有阶段已完成: stagesStatus.allStagesCompleted,
								总阶段数: stagesStatus.totalStages,
								待确认数: stagesStatus.unconfirmedCount,
								已完成数: stagesStatus.completedCount
							});
						}
						
						ordersWithDetails.push(orderWithDetails)
					}
					console.log('✅ 用户订单数据整合完成:', ordersWithDetails)
					
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
			
			// 检查设计方案状态（修改版：按最新创建时间判断）
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

			// 用户确认效果图
			async confirmEffectDrawing(orderId) {
				try {
					console.log('✅ 用户确认效果图，订单ID:', orderId);
					
					const order = this.orderList.find(item => item.orderId === orderId);
					if (!order) {
						throw new Error('未找到对应的订单信息');
					}
					
					let designerName = '';
					if (order.contractorInfo && order.contractorInfo.name) {
						designerName = order.contractorInfo.name;
					} else if (order.contractorId) {
						// 使用 getUserById 方法获取设计师信息
						const designerInfo = await this.getUserInfoById(order.contractorId);
						designerName = designerInfo.name || '承接方';
					}
					
					console.log('📤 跳转参数:', {
						orderId: orderId,
						schemeType: SCHEME_TYPE.EFFECT_DRAWING,
						designerName: designerName
					});
					
					uni.navigateTo({
						url: `/pages/design/xgt?orderId=${orderId}&schemeType=${SCHEME_TYPE.EFFECT_DRAWING}&designerName=${encodeURIComponent(designerName)}`
					});
					
				} catch (error) {
					console.error('❌ 跳转效果图确认页面失败:', error);
					this.handleApiError(error, '跳转失败');
				}
			},

			// 用户确认施工设计图
			async confirmConstructionDrawing(orderId) {
				try {
					console.log('✅ 用户确认施工设计图，订单ID:', orderId);
					
					const order = this.orderList.find(item => item.orderId === orderId);
					if (!order) {
						throw new Error('未找到对应的订单信息');
					}
					
					let designerName = '';
					if (order.contractorInfo && order.contractorInfo.name) {
						designerName = order.contractorInfo.name;
					} else if (order.contractorId) {
						// 使用 getUserById 方法获取设计师信息
						const designerInfo = await this.getUserInfoById(order.contractorId);
						designerName = designerInfo.name || '承接方';
					}
					
					console.log('📤 跳转施工设计图确认参数:', {
						orderId: orderId,
						schemeType: SCHEME_TYPE.CONSTRUCTION_DRAWING,
						designerName: designerName
					});
					
					uni.navigateTo({
						url: `/pages/design/xgt?orderId=${orderId}&schemeType=${SCHEME_TYPE.CONSTRUCTION_DRAWING}&designerName=${encodeURIComponent(designerName)}`
					});
					
				} catch (error) {
					console.error('❌ 跳转施工设计图确认页面失败:', error);
					this.handleApiError(error, '跳转失败');
				}
			},

			// 立即付款（设计师订单）
			async payOrder(orderId) {
				try {
					console.log('💰 立即付款，订单ID:', orderId);
					
					uni.showModal({
						title: '确认付款',
						content: '确定要支付这个订单吗？付款后订单将标记为已完成。',
						success: async (res) => {
							if (res.confirm) {
								uni.showLoading({ title: '付款中...' });
								
								try {
									console.log('📤 调用 completeOrder API，订单ID:', orderId);
									
									const result = await orderService.completeOrder(orderId);
									
									console.log('📡 completeOrder API 响应:', result);
									
									uni.hideLoading();
									
									if (result === true || (result && result.code === 200)) {
										uni.showToast({
											title: '付款成功，订单已完成',
											icon: 'success',
											duration: 2000
										});
										
										// 付款成功后跳转到评价页面
										setTimeout(() => {
											this.goToReview(orderId);
										}, 1500);
										
									} else {
										console.error('❌ completeOrder 返回错误:', result);
										throw new Error(result?.msg || '付款失败');
									}
								} catch (error) {
									uni.hideLoading();
									console.error('❌ 付款失败:', error);
									this.handleApiError(error, '付款失败');
								}
							}
						}
					});
					
				} catch (error) {
					console.error('❌ 付款操作失败:', error);
					this.handleApiError(error, '付款操作失败');
				}
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

			// 拒绝合同
			async rejectContract(orderId) {
				try {
					uni.showModal({
						title: '拒绝合同',
						content: '确定要拒绝这份合同吗？',
						success: async (res) => {
							if (res.confirm) {
								uni.showLoading({ title: '处理中...' });
								
								try {
									const result = await this.updateContractStatus(orderId, 0);
									
									uni.hideLoading();
									
									if (result && (result.code === 200 || result.success)) {
										uni.showToast({
											title: '合同已拒绝',
											icon: 'success'
										});
										
										this.pagination.pageNum = 1;
										this.loadOrderList();
									} else {
										throw new Error(result?.msg || '拒绝合同失败');
									}
								} catch (error) {
									uni.hideLoading();
									console.error('❌ 拒绝合同失败:', error);
									this.handleApiError(error, '拒绝合同失败');
								}
							}
						}
					});
				} catch (error) {
					uni.hideLoading();
					console.error('❌ 拒绝合同失败:', error);
					this.handleApiError(error, '拒绝合同失败');
				}
			},

			// 用户确认合同
			async confirmContract(orderId) {
				try {
					uni.showModal({
						title: '确认合同',
						content: '确定要确认这份合同吗？',
						success: async (res) => {
							if (res.confirm) {
								uni.showLoading({ title: '确认中...' });
								
								try {
									const result = await this.updateContractStatus(orderId, 2);
									
									uni.hideLoading();
									
									if (result && (result.code === 200 || result.success)) {
										uni.showToast({
											title: '合同已确认',
											icon: 'success'
										});
										
										this.pagination.pageNum = 1;
										this.loadOrderList();
									} else {
										throw new Error(result?.msg || '确认合同失败');
									}
								} catch (error) {
									uni.hideLoading();
									console.error('❌ 确认合同失败:', error);
									this.handleApiError(error, '确认合同失败');
								}
							}
						}
					});
				} catch (error) {
					uni.hideLoading();
					console.error('❌ 确认合同失败:', error);
					this.handleApiError(error, '确认合同失败');
				}
			},

			// 统一的合同状态更新方法
			async updateContractStatus(orderId, contractStatus) {
				try {
					console.log('🔄 更新合同状态:', {
						orderId: orderId,
						contractStatus: contractStatus
					});
					
					console.log('📤 发送合同状态更新请求 - 使用请求参数方式');
					
					const result = await new Promise((resolve, reject) => {
						uni.request({
							url: `http://localhost:8081/order/updateContractStatus?orderId=${orderId}&contractStatus=${contractStatus}`,
							method: 'PUT',
							header: {
								'Content-Type': 'application/json',
								'Authorization': 'Bearer ' + uni.getStorageSync('token')
							},
							success: (res) => {
								console.log('📡 合同状态更新响应:', res);
								
								if (res.statusCode === 200) {
									if (res.data && (res.data.code === 200 || res.data.success)) {
										resolve(res.data);
									} else {
										resolve({
											code: 200,
											data: res.data,
											msg: '操作成功'
										});
									}
								} else {
									reject(new Error(`请求失败，状态码: ${res.statusCode}`));
								}
							},
							fail: (error) => {
								console.error('❌ 合同状态更新请求失败:', error);
								reject(error);
							}
						});
					});
					
					return result;
					
				} catch (error) {
					console.error('❌ 合同状态更新失败:', error);
					throw error;
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
			
			// 切换订单状态
			changeStatus(status) {
				this.activeStatus = status
				this.pagination.pageNum = 1
				this.hasMore = true
				this.orderList = []
				this.loadOrderList()
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
			
			// 更新状态统计
			updateStatusCount() {
				this.statusCount = { '0': 0, '1': 0, '2': 0, '3': 0 }
				
				this.orderList.forEach(order => {
					const status = order.status.toString()
					if (this.statusCount[status] !== undefined) {
						this.statusCount[status]++
					}
				})
				
				console.log('📊 用户订单状态统计:', this.statusCount)
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
			
			// 联系订单相关方（客户联系承接方）- 修复版
			async contactOrderParty(order) {
				console.log('🔥 开始联系订单相关方，订单信息:', order);
				
				try {
					// 1. 检查登录状态
					if (!isUserLoggedIn()) {
						handleNotLoggedIn();
						return;
					}
					
					// 2. 检查订单信息完整性
					if (!order || (!order.contractorId && !order.userId)) {
						console.error('❌ 订单信息不完整:', order);
						uni.showToast({
							title: '订单信息无效',
							icon: 'error',
							duration: 2000
						});
						return;
					}
					
					// 3. 客户订单页面的逻辑：客户联系承接方
					const currentUserId = String(this.userInfo.userId || '');
					const customerId = String(order.userId || '');
					const contractorId = String(order.contractorId || '');
					
					console.log('👤 身份确认:', {
						当前用户ID: currentUserId,
						订单客户ID: customerId,
						承接方ID: contractorId,
						角色: this.userInfo.role,
						角色名称: this.userInfo.roleName
					});
					
					// 4. 确定联系对象：客户联系承接方
					let targetUserId = contractorId;
					let targetUserName = '';
					let targetUserAvatar = '';
					
					// 5. 检查是否分配了承接方
					if (!targetUserId || targetUserId === '0' || targetUserId === 'undefined') {
						console.error('❌ 未分配承接方或承接方ID无效');
						uni.showToast({
							title: '订单未分配承接方',
							icon: 'none',
							duration: 2000
						});
						return;
					}
					
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
					
					// 7. 获取承接者信息
					try {
						const contractorInfo = await this.getUserInfoById(targetUserId);
						targetUserName = contractorInfo.name || '';
						targetUserAvatar = contractorInfo.avatar || '';
					} catch (error) {
						console.warn('⚠️ 获取承接者信息失败:', error);
						// 使用默认值
						targetUserName = '';
						targetUserAvatar = '';
					}
					
					// 8. 根据订单类型确定称呼
					if (targetUserName) {
						if (String(order.type) === ORDER_TYPE.DESIGN) {
							targetUserName = targetUserName.includes('设计') ? targetUserName : targetUserName + '设计师';
						} else if (String(order.type) === ORDER_TYPE.SUPERVISOR) {
							targetUserName = targetUserName.includes('监理') ? targetUserName : targetUserName + '监理师';
						}
					} else {
						// 如果没获取到名字，使用默认称呼
						if (String(order.type) === ORDER_TYPE.DESIGN) {
							targetUserName = '设计师';
						} else if (String(order.type) === ORDER_TYPE.SUPERVISOR) {
							targetUserName = '监理师';
						} else {
							targetUserName = '承接方';
						}
					}
					
					console.log('📞 准备联系承接方:', {
						承接方ID: targetUserId,
						承接方姓名: targetUserName,
						订单类型: order.type,
						订单ID: order.orderId
					});
					
					// 9. 显示加载状态
					uni.showLoading({
						title: '创建对话中...',
						mask: true
					});
					
					try {
						// 10. 创建对话并跳转
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
						// 11. 隐藏加载状态
						uni.hideLoading();
					}
					
				} catch (error) {
					console.error('❌ 联系订单相关方失败:', error);
					
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
			
			// 确认订单
			async confirmOrder(orderId) {
				try {
					uni.showModal({
						title: '确认订单',
						content: '确定要确认这个订单吗？',
						success: async (res) => {
							if (res.confirm) {
								uni.showLoading({ title: '确认中...' })
								await orderService.confirmOrder(orderId)
								uni.hideLoading()
								uni.showToast({
									title: '订单已确认',
									icon: 'success'
								})
								this.pagination.pageNum = 1
								this.loadOrderList()
							}
						}
					})
				} catch (error) {
					uni.hideLoading()
					this.handleApiError(error, '确认订单失败')
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
	/* 移除调试信息样式 */
	
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
	
	.container {
		padding: 0;
		background-color: #f5f5f5;
		min-height: 100vh;
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
	
	/* 订单类型标签样式 */
	.order-type-tag {
		display: inline-block;
		padding: 6rpx 12rpx;
		font-size: 22rpx;
		border-radius: 12rpx;
		font-weight: normal;
	}
	
	.type-design {
		background: #E6F7FF;
		color: #1890FF;
		border: 1rpx solid #91D5FF;
	}
	
	.type-supervisor {
		background: #F6FFED;
		color: #52C41A;
		border: 1rpx solid #B7EB8F;
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
		font-size: 24rpx; /* 修改：按钮字体从26rpx改为24rpx */
		border-radius: 20rpx;
		border: none;
		line-height: 1.2; /* 调整行高，使文字更紧凑 */
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