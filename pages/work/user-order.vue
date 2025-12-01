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
			<!-- 调试信息 -->
			<view class="debug-info" v-if="orderList.length > 0">
				<text>调试信息: 订单类型={{ orderList[0].type }}, 状态={{ orderList[0].status }}, 合同状态={{ orderList[0].contractStatus }}</text>
			</view>
			
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
			
			<!-- 订单项 -->
			<view class="order-item" v-for="order in orderList" :key="order.orderId">
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
				
				<view class="order-content" @click="viewOrderDetail(order.orderId)">
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
					
					<!-- 显示设计师信息 -->
					<view class="designer-info" v-if="order.contractorId">
						<view class="designer-avatar">
							<image :src="order.contractorInfo.avatar" mode="aspectFill" />
						</view>
						<view class="designer-details">
							<text class="designer-name">{{ order.contractorInfo.name }}</text>
							
							<text class="designer-phone">电话: {{ order.contractorInfo.phone }}</text>
						</view>
						<view class="contact-btn" @click.stop="contactDesigner(order.contractorId)">
							联系
						</view>
					</view>
					
					<!-- 未分配设计师 -->
					<view class="no-designer" v-else>
						<text class="no-designer-text">暂未分配监理师</text>
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
							<button class="btn primary" @click="confirmOrder(order.orderId)">
								确认订单
							</button>
						</template>
						
						<!-- 状态1：进行中 -->
						<template v-else-if="order.status === 1">
							<!-- 合同状态0：待上传 -->
							<template v-if="order.contractStatus === 0">
								<button class="btn secondary" @click="cancelOrder(order.orderId)">
									取消订单
								</button>
							</template>
							
							<!-- 合同状态1：合同待确认 -->
							<template v-else-if="order.contractStatus === 1">
								<button class="btn secondary" @click="viewContract(order)">
									查看合同
								</button>
								<button class="btn secondary" @click="rejectContract(order.orderId)">
									拒绝合同
								</button>
								<button class="btn primary" @click="confirmContract(order.orderId)">
									确认合同
								</button>
							</template>
							
							<!-- 合同状态2：合同已确认 -->
							<template v-else-if="order.contractStatus === 2">
								<!-- 设计师订单：保持原有逻辑 -->
								<template v-if="String(order.type) === '1'">
									<!-- 效果图未完成时显示确认效果图按钮 -->
									<button v-if="order.effectDrawingStatus !== '2'" 
											class="btn primary" 
											@click="confirmEffectDrawing(order.orderId)">
										确认效果图
									</button>
									
									<!-- 效果图已完成但施工设计图未完成时显示确认施工设计图按钮 -->
									<button v-if="order.effectDrawingStatus === '2' && order.constructionDrawingStatus !== '2'" 
											class="btn primary" 
											@click="confirmConstructionDrawing(order.orderId)">
										确认施工设计图
									</button>
									
									<!-- 效果图和施工设计图都已完成时显示付款按钮 -->
									<button v-if="order.effectDrawingStatus === '2' && order.constructionDrawingStatus === '2'" 
											class="btn primary" 
											@click="payOrder(order.orderId)">
										立即付款
									</button>
								</template>
								
								<!-- 监理订单：新增施工阶段逻辑 -->
								<template v-else-if="String(order.type) === '2'">
									<!-- 没有施工阶段或有待确认的施工阶段 -->
									<button v-if="!order.hasStages || order.hasUnconfirmedStages" 
											class="btn primary" 
											@click="confirmConstructionStages(order.orderId)">
										确认施工阶段
									</button>
									
									<!-- 有已确认的施工阶段 -->
									<button v-else-if="order.hasStages && !order.hasUnconfirmedStages" 
											class="btn primary" 
											@click="goToConstructionStage(order.orderId)">
										施工阶段
									</button>
									
									<!-- 默认按钮（备用） -->
									<button v-else class="btn primary" @click="goToConstructionStage(order.orderId)">
										施工阶段
									</button>
								</template>
							</template>
						</template>
						
						<!-- 状态2：已完成 -->
						<template v-else-if="order.status === 2">
							<button class="btn secondary" @click="viewOrderDetail(order.orderId)">
								查看详情
							</button>
							<!-- 显示评价按钮，根据是否有评价决定是否显示 -->
							<button v-if="!order.hasReview" class="btn primary" @click="goToReview(order.orderId)">
								评价订单
							</button>
							<!-- 如果已有评价，显示已评价状态 -->
							<text v-if="order.hasReview" class="status-text">
								已评价
							</text>
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
	import { getUserProfile } from '@/api/users.js'
	import { getDesignSchemeList } from '@/api/designScheme.js'
	import { orderReviewApi } from '@/api/orderReview.js'
	// 新增：导入施工阶段API
	import { orderStageService } from '@/api/orderStage.js'
	
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
					address: ''
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
			this.loadUserInfo();
		},
		onShow() {
			console.log('🔄 用户订单页面显示，刷新数据');
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
					
					// 返回施工阶段状态信息
					return {
						hasStages: stages.length > 0,
						hasUnconfirmedStages: stages.some(stage => Number(stage.status) === 0),
						totalStages: stages.length,
						unconfirmedCount: stages.filter(stage => Number(stage.status) === 0).length
					};
					
				} catch (error) {
					console.error('❌ 检查施工阶段状态失败:', error);
					return {
						hasStages: false,
						hasUnconfirmedStages: false,
						totalStages: 0,
						unconfirmedCount: 0
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

			// 用户跳转到评价页面
			goToReview(orderId) {
				console.log('📝 跳转到评价页面，订单ID:', orderId, '用户ID:', this.userInfo.userId);
				uni.navigateTo({
					url: `/pages/review/review?orderId=${orderId}&userId=${this.userInfo.userId}`
				});
			},

			// 查看订单详情（根据类型跳转不同页面）
			viewOrderDetail(orderId) {
				const order = this.orderList.find(item => item.orderId === orderId);
				if (!order) {
					uni.showToast({
						title: '订单信息不存在',
						icon: 'none'
					});
					return;
				}
				
				console.log('📋 查看订单详情，订单ID:', orderId, '订单类型:', order.type, '订单状态:', order.status);
				
				// 根据订单类型和状态跳转到不同的详情页面
				if (order.status === 2) { // 状态2：已完成
					console.log('✅ 跳转到已完成订单详情页面');
					uni.navigateTo({
						url: `/pages/finishedorder-detail/finishedorder-detail?orderId=${orderId}&userId=${this.userInfo.userId}&orderType=${order.type}`
					});
				} else {
					// 根据订单类型跳转到不同的详情页面
					if (String(order.type) === '1') {
						// 设计师订单跳转到设计订单详情
						console.log('🎨 跳转到设计师订单详情页面');
						uni.navigateTo({
							url: `/pages/order-hall/order-detail?id=${orderId}&type=design`
						});
					} else if (String(order.type) === '2') {
						// 监理订单跳转到监理订单详情
						console.log('🏗️ 跳转到监理订单详情页面');
						uni.navigateTo({
							url: `/pages/supervisor/supervisor-order-detail?id=${orderId}&type=supervisor`
						});
					}
				}
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

			// 加载用户信息
			async loadUserInfo() {
				try {
					console.log('👤 开始获取用户信息...')
					const res = await getUserProfile();
					if (res.code === 200) {
						this.userInfo = res.data;
						console.log('👤 用户信息加载完成:', this.userInfo);
						this.loadOrderList();
					} else {
						console.error('获取用户信息失败:', res.msg)
						this.handleApiError(res.msg, '获取用户信息失败');
					}
				} catch (error) {
					console.error('❌ 获取用户信息失败:', error);
					this.handleApiError(error, '获取用户信息失败');
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
								contractorInfo = await this.getDesignerInfo(order.contractorId) || {}
							} catch (error) {
								console.error(`获取订单 ${order.orderId} 的设计师信息失败:`, error)
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
							hasUnconfirmedStages: false
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
							
							console.log(`🏗️ 监理订单 ${order.orderId} 施工阶段状态:`, {
								是否有阶段: stagesStatus.hasStages,
								有待确认阶段: stagesStatus.hasUnconfirmedStages,
								总阶段数: stagesStatus.totalStages,
								待确认数: stagesStatus.unconfirmedCount
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
						const designerInfo = await this.getDesignerInfo(order.contractorId);
						designerName = designerInfo.name || '未知设计师';
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
						const designerInfo = await this.getDesignerInfo(order.contractorId);
						designerName = designerInfo.name || '未知设计师';
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

			// 立即付款
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
			
			// 根据设计师ID获取设计师信息
			async getDesignerInfo(contractorId) {
				if (!contractorId) {
					return null
				}
				
				try {
					console.log('👨‍🎨 获取设计师信息，设计师ID:', contractorId)
					const designerInfo = await getUserProfile(contractorId)
					console.log('✅ 设计师信息获取成功:', designerInfo)
					
					let designerData = designerInfo
					if (designerInfo && designerInfo.data) {
						designerData = designerInfo.data
					}
					
					return {
						name: designerData.name || designerData.nickname || '未知设计师',
						phone: designerData.phone || designerData.mobile || '暂无联系方式',
						avatar: designerData.avatar || '/static/images/default-avatar.png',
						role: designerData.role || '设计师'
					}
				} catch (error) {
					console.error('❌ 获取设计师信息失败:', error)
					return {
						name: '设计师',
							phone: '暂无联系方式',
						avatar: '/static/images/default-avatar.png',
						role: '设计师'
					}
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
			
			// 联系设计师（跳转聊天页面）
			contactDesigner(designerId) {
				if (!designerId) {
					uni.showToast({
						title: '暂无设计师信息',
						icon: 'none'
					})
					return
				}
				uni.navigateTo({
					url: `/pages/chat/designer?id=${designerId}`
				})
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
	/* 样式保持不变 */
	.debug-info {
		background: #fff3cd;
		padding: 20rpx;
		margin: 20rpx;
		border-radius: 10rpx;
		border: 1px solid #ffeaa7;
		font-size: 24rpx;
		color: #856404;
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
	
	.order-item {
		background: white;
		border-radius: 16rpx;
		margin-bottom: 20rpx;
		padding: 30rpx;
		box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
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
	
	.designer-role {
		font-size: 24rpx;
		color: #007AFF;
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