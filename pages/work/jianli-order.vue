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
				<view class="empty-icon">🎨</view>
				<view class="empty-text">暂无订单</view>
				<view class="empty-desc">您还没有接到的订单</view>
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
					</view>
					<!-- 修复：使用映射表而不是函数调用 -->
					<view class="order-status" :class="statusClassMap[order.status]">
						{{ getStatusText(order.status) }}
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
					<view class="designer-info" v-if="order.userId">
						<view class="designer-avatar">
							<image :src="order.publisherInfo.avatar" mode="aspectFill" />
						</view>
						<view class="designer-details">
							<text class="designer-name">{{ order.publisherInfo.name }}</text>
							<text class="designer-role">客户</text>
							<text class="designer-phone">电话: {{ order.publisherInfo.phone }}</text>
						</view>
						<view class="contact-btn" @click.stop="contactCustomer(order.userId)">
							联系
						</view>
					</view>
					
					<!-- 未获取客户信息 -->
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
							
							<!-- 合同状态2：合同已确认 - 显示施工进程按钮 -->
							<template v-else-if="order.contractStatus === 2">
								<!-- 设计师订单：显示施工阶段按钮 -->
								<template v-if="String(order.type) === '1'">
									<button class="btn primary" @click="goToConstructionStage(order.orderId)">
										施工阶段
									</button>
								</template>
								
								<!-- 监理订单：显示施工阶段按钮 -->
								<template v-else-if="String(order.type) === '2'">
									<button class="btn primary" @click="goToConstructionStage(order.orderId)">
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
				
				// 修复：添加状态类映射表
				statusClassMap: {
					0: 'status-pending',
					1: 'status-progress',
					2: 'status-completed',
					3: 'status-canceled'
				}
			}
		},
		onLoad() {
			console.log('🚀 设计师订单页面加载');
			this.loadUserInfo();
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

			// 跳转到施工阶段页面
			goToConstructionStage(orderId) {
				console.log('🏗️ 跳转到施工阶段页面，订单ID:', orderId, '用户ID:', this.userInfo.userId);
				uni.navigateTo({
					url: `/pages/order-hall/design-update?orderId=${orderId}&userId=${this.userInfo.userId}`
				});
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

			// 加载用户信息
			async loadUserInfo() {
				try {
					console.log('👤 开始获取设计师信息...')
					const res = await getUserProfile();
					if (res.code === 200) {
						this.userInfo = res.data;
						console.log('👤 设计师信息加载完成:', this.userInfo);
						this.loadOrderList();
					} else {
						console.error('获取设计师信息失败:', res.msg)
						this.handleApiError(res.msg, '获取设计师信息失败');
					}
				} catch (error) {
					console.error('❌ 获取设计师信息失败:', error);
					this.handleApiError(error, '获取设计师信息失败');
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
								publisherInfo = await this.getPublisherInfo(order.userId) || {}
							} catch (error) {
								console.error(`获取订单 ${order.orderId} 的发布人信息失败:`, error)
							}
						}
						
						const orderWithDetails = {
							...order,
							projectInfo,
							publisherInfo
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

			// 上传合同图片
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
			
			// 根据用户ID获取发布人信息
			async getPublisherInfo(userId) {
				if (!userId) {
					return null
				}
				
				try {
					console.log('👤 获取发布人信息，用户ID:', userId)
					const publisherInfo = await getUserProfile(userId)
					console.log('✅ 发布人信息获取成功:', publisherInfo)
					
					let publisherData = publisherInfo
					if (publisherInfo && publisherInfo.data) {
						publisherData = publisherInfo.data
					}
					
					return {
						name: publisherData.name || publisherData.nickname || '未知用户',
						phone: publisherData.phone || publisherData.mobile || '暂无联系方式',
						avatar: publisherData.avatar || '/static/images/default-avatar.png',
						role: '客户'
					}
				} catch (error) {
					console.error('❌ 获取发布人信息失败:', error)
					return {
						name: '客户',
						phone: '暂无联系方式',
						avatar: '/static/images/default-avatar.png',
						role: '客户'
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
			
			// 更新状态统计
			updateStatusCount() {
				this.statusCount = { '0': 0, '1': 0, '2': 0, '3': 0 }
				
				this.orderList.forEach(order => {
					const status = order.status.toString()
					if (this.statusCount[status] !== undefined) {
						this.statusCount[status]++
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
			
			// 联系客户
			async contactCustomer(customerId) {
				if (!customerId) {
					uni.showToast({
						title: '暂无客户信息',
						icon: 'none'
					})
					return
				}
				uni.navigateTo({
					url: `/pages/chat/customer?id=${customerId}`
				})
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
		margin-right: 120rpx; /* 为右侧按钮留出空间 */
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
		align-items: center;
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