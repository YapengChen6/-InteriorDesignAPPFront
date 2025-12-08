<template>
	<view class="container">
		<!-- 顶部标题栏 -->
		<view class="header-section">
			<view class="header-back" @click="goBack">
				<text class="back-icon">←</text>
				<text class="back-text">返回</text>
			</view>
			<view class="header-title">订单详情</view>
			<view class="header-placeholder"></view>
		</view>

		<!-- 内容区域 -->
		<scroll-view class="content" scroll-y="true" refresher-enabled @refresherrefresh="onRefresh">
			<!-- 下拉刷新 -->
			<view class="refresh-container" v-if="refreshing">
				<text class="refresh-text">刷新中...</text>
			</view>
			<!-- 订单基本信息 -->
			<view class="info-card">
				<view class="card-title">订单信息</view>
				<view class="info-list">
					<view class="info-item">
						<text class="info-label">订单编号</text>
						<text class="info-value">DD{{ orderInfo.orderId }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">下单时间</text>
						<text class="info-value">{{ formatTime(orderInfo.createTime) }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">完成时间</text>
						<text class="info-value">{{ formatTime(orderInfo.actualEndTime) || '--' }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">订单金额</text>
						<text class="info-value amount">¥{{ orderInfo.totalAmount || 0 }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">订单类型</text>
						<text class="info-value">{{ getOrderTypeText(orderInfo.type) }}</text>
					</view>
					<view class="info-item">
					<text class="info-label">订单状态</text>
					<!-- 根据状态显示不同的样式 -->
					<text class="info-value" :class="orderStatusClass">
						{{ getStatusText(orderInfo.status) }}
					</text>
					</view>
				</view>
			</view>

			<!-- 项目信息（仅非监理订单显示） -->
			<view class="info-card" v-if="orderInfo.projectInfo && !isSupervisionOrder">
				<view class="card-title">项目信息</view>
				<view class="project-content">
					<text class="project-title">{{ orderInfo.projectInfo.title || '设计项目' }}</text>
					<text class="project-desc">{{ orderInfo.projectInfo.description || orderInfo.remark || '暂无描述' }}</text>
					<view class="project-tags">
						<text class="tag" v-if="orderInfo.projectInfo.budget">预算 {{ orderInfo.projectInfo.budget }}元</text>
						<text class="tag" v-if="orderInfo.projectInfo.area">{{ orderInfo.projectInfo.area }}㎡</text>
						<text class="tag" v-if="orderInfo.projectInfo.address">{{ orderInfo.projectInfo.address }}</text>
						<text class="tag" v-if="orderInfo.expectedEndTime">预计 {{ formatDate(orderInfo.expectedEndTime) }}完成</text>
					</view>
				</view>
			</view>

			<!-- 动态显示对方信息：普通用户显示设计师/监理，设计师/监理显示用户 -->
			<view class="info-card" v-if="showOppositeInfo">
				<view class="card-title">
					{{ oppositeCardTitle }}
				</view>
				<view class="designer-content">
					<view class="designer-avatar">
						<image :src="currentOppositeInfo.avatar || '/static/images/default-avatar.png'" 
							   mode="aspectFill" class="avatar-img" />
					</view>
					<view class="designer-info">
						<text class="designer-name">{{ currentOppositeInfo.name }}</text>
						<text class="designer-role">{{ currentOppositeInfo.role }}</text>
						<text class="designer-phone" v-if="currentOppositeInfo.phone">
							电话: {{ currentOppositeInfo.phone }}
						</text>
						<text class="no-phone-tip" v-else>暂无联系方式</text>
					</view>
					<!-- 在线咨询按钮 -->
					<button class="contact-btn" @click="contactOpposite">
						{{ oppositeButtonText }}
					</button>
				</view>
			</view>

			<!-- 评价信息 -->
			<view class="info-card" v-if="hasReviewed && orderReview">
				<view class="card-title">订单评价</view>
				<view class="review-content">
					<!-- 评分 -->
					<view class="rating-section">
						<text class="rating-label">综合评分</text>
						<view class="rating-stars">
							<text v-for="i in 5" :key="i" class="star" 
								  :class="i <= orderReview.rating ? 'star-active' : 'star-inactive'">
								{{ i <= orderReview.rating ? '★' : '☆' }}
							</text>
						</view>
						<text class="rating-value">{{ orderReview.rating }}分</text>
					</view>
					
					<!-- 评价内容 -->
					<view class="review-text-section" v-if="orderReview.content">
						<text class="review-label">评价内容</text>
						<text class="review-text">{{ orderReview.content }}</text>
					</view>
					
					<!-- 回复 -->
					<view class="reply-section" v-if="orderReview.replyContent">
						<text class="reply-label">{{ isSupervisionOrder ? '监理回复' : '设计师回复' }}</text>
						<text class="reply-text">{{ orderReview.replyContent }}</text>
						<text class="reply-time" v-if="orderReview.replyTime">
							回复时间：{{ formatTime(orderReview.replyTime) }}
						</text>
					</view>
					
					<!-- 评价时间 -->
					<view class="review-time">
						<text class="review-time-text">评价时间：{{ formatTime(orderReview.createTime) }}</text>
					</view>
				</view>
			</view>

			<!-- 合同文件 -->
			<view class="info-card" v-if="orderInfo.contractUrl">
				<view class="card-title">合同文件</view>
				<view class="file-section">
					<view class="file-item" @click="previewFile(orderInfo.contractUrl, '合同文件')">
						<view class="file-icon">📄</view>
						<view class="file-info">
							<text class="file-name">{{ isSupervisionOrder ? '监理服务合同' : '设计服务合同' }}</text>
							<text class="file-desc">点击查看合同详情</text>
						</view>
						<view class="file-action">查看</view>
					</view>
				</view>
			</view>

			<!-- 设计方案文件 (仅设计订单显示) -->
			<view v-if="!isSupervisionOrder">
				<!-- 效果图方案 -->
				<view class="info-card" v-if="sortedEffectSchemes.length > 0">
					<view class="card-title">
						<view class="scheme-title-wrapper">
							<text class="scheme-icon">🎨</text>
							<text class="scheme-title">效果图设计方案</text>
						</view>
						<view class="scheme-count-wrapper">
							<text class="scheme-count">共{{ sortedEffectSchemes.length }}个方案</text>
							<text class="file-count-hint" v-if="hasMultipleFiles">含多个PDF文件</text>
						</view>
					</view>
					
					<!-- 修改：直接显示每个方案的所有文件 -->
					<view class="multi-file-section" v-for="scheme in sortedEffectSchemes" :key="scheme.designSchemeId">
						<!-- 方案标题 -->
						<view class="scheme-header">
							<text class="scheme-name">{{ scheme.schemeName || '效果图方案' }}</text>
							<view class="scheme-status-wrapper">
								<text class="scheme-status" :class="scheme.status === 2 ? 'scheme-status-confirmed' : scheme.status === 0 ? 'scheme-status-rejected' : 'scheme-status-pending'">
									{{ getSchemeStatusText(scheme.status) }}
								</text>
								<text class="scheme-time"> · {{ formatTime(scheme.createTime) }}</text>
							</view>
						</view>
						
						<!-- 文件列表 -->
						<view class="file-list">
							<view class="file-item" v-for="(file, index) in getFileList(scheme)" :key="index" 
									@click="previewFile(file.url, file.name)">
								<view class="file-icon">📄</view>
								<view class="file-info">
									<text class="file-name">{{ file.name }}</text>
									<text class="file-desc">
										<text class="file-index">文件{{ index + 1 }}</text>
										<text class="file-size" v-if="file.size"> · {{ file.size }}</text>
										<text class="file-pdf-tag"> · PDF</text>
									</text>
								</view>
								<view class="file-action">预览</view>
							</view>
						</view>
						
						<!-- 方案描述 -->
						<view class="scheme-description" v-if="scheme.description">
							<text class="description-text">{{ scheme.description }}</text>
						</view>
					</view>
				</view>

				<!-- 施工设计图方案 -->
				<view class="info-card" v-if="sortedConstructionSchemes.length > 0">
					<view class="card-title">
						<view class="scheme-title-wrapper">
							<text class="scheme-icon">🏗️</text>
							<text class="scheme-title">施工设计图方案</text>
						</view>
						<view class="scheme-count-wrapper">
							<text class="scheme-count">共{{ sortedConstructionSchemes.length }}个方案</text>
							<text class="file-count-hint" v-if="hasMultipleFiles">含多个PDF文件</text>
						</view>
					</view>
					
					<!-- 修改：直接显示每个方案的所有文件 -->
					<view class="multi-file-section" v-for="scheme in sortedConstructionSchemes" :key="scheme.designSchemeId">
						<!-- 方案标题 -->
						<view class="scheme-header">
							<text class="scheme-name">{{ scheme.schemeName || '施工图方案' }}</text>
							<view class="scheme-status-wrapper">
								<text class="scheme-status" :class="scheme.status === 2 ? 'scheme-status-confirmed' : scheme.status === 0 ? 'scheme-status-rejected' : 'scheme-status-pending'">
									{{ getSchemeStatusText(scheme.status) }}
								</text>
								<text class="scheme-time"> · {{ formatTime(scheme.createTime) }}</text>
							</view>
						</view>
						
						<!-- 文件列表 -->
						<view class="file-list">
							<view class="file-item" v-for="(file, index) in getFileList(scheme)" :key="index" 
									@click="previewFile(file.url, file.name)">
								<view class="file-icon">📄</view>
								<view class="file-info">
									<text class="file-name">{{ file.name }}</text>
									<text class="file-desc">
										<text class="file-index">文件{{ index + 1 }}</text>
										<text class="file-size" v-if="file.size"> · {{ file.size }}</text>
										<text class="file-pdf-tag"> · PDF</text>
									</text>
								</view>
								<view class="file-action">预览</view>
							</view>
						</view>
						
						<!-- 方案描述 -->
						<view class="scheme-description" v-if="scheme.description">
							<text class="description-text">{{ scheme.description }}</text>
						</view>
					</view>
				</view>

				<!-- 暂无设计方案提示 -->
				<view class="info-card" v-if="designSchemes.length === 0 && !loading">
					<view class="card-title">设计方案</view>
					<view class="no-scheme-tip">
						<text class="no-scheme-icon">📋</text>
						<text class="no-scheme-text">暂无设计方案</text>
					</view>
				</view>
			</view>

			<!-- 关联的材料订单信息（仅设计订单显示，显示在设计方案下方） -->
			<view v-if="!isSupervisionOrder">
				<view class="info-card" v-if="materialOrders.length > 0">
					<view class="card-title">
						<view class="scheme-title-wrapper">
							<text class="scheme-icon">📦</text>
							<text class="scheme-title">购买的材料</text>
						</view>
					</view>
					<view class="material-orders-list">
						<view
							v-for="materialOrder in materialOrders"
							:key="materialOrder.orderId"
							class="material-order-item"
							@click="viewMaterialOrderDetail(materialOrder.orderId)"
						>
							<view class="material-order-header">
								<text class="material-order-id">材料订单号：{{ materialOrder.orderNo || materialOrder.orderNumber || materialOrder.orderId }}</text>
								<text class="material-order-status" :style="{ color: getMaterialOrderStatusColor(materialOrder.orderStatus || materialOrder.status) }">
									{{ getMaterialOrderStatusText(materialOrder.orderStatus || materialOrder.status) }}
								</text>
							</view>
							<view class="material-order-items">
								<view
									v-for="(item, index) in materialOrder.orderItems"
									:key="index"
									class="material-item-row"
								>
									<image
										class="material-item-image"
										:src="getMaterialItemImage(item)"
										mode="aspectFill"
									/>
									<view class="material-item-info">
										<text class="material-item-name">{{ item.productName || '商品' }}</text>
										<text class="material-item-sku" v-if="item.skuDetail">{{ formatSkuDetail(item.skuDetail) }}</text>
										<view class="material-item-bottom">
											<text class="material-item-price">￥{{ formatPrice(getMaterialItemPrice(item)) }}</text>
											<text class="material-item-qty">x{{ item.quantity }}</text>
										</view>
									</view>
								</view>
							</view>
							<view class="material-order-footer">
								<text class="material-order-total">共 {{ (materialOrder.orderItems && materialOrder.orderItems.length) || 0 }} 件商品，合计：￥{{ formatPrice(materialOrder.totalAmount || materialOrder.totalPrice || 0) }}</text>
							</view>
						</view>
					</view>
				</view>
				
				<!-- 暂无材料订单提示 -->
				<view class="info-card" v-if="materialOrders.length === 0 && !loading">
					<view class="card-title">
						<view class="scheme-title-wrapper">
							<text class="scheme-icon">📦</text>
							<text class="scheme-title">购买的材料</text>
						</view>
					</view>
					<view class="no-scheme-tip">
						<text class="no-scheme-icon">📦</text>
						<text class="no-scheme-text">暂无关联的材料订单</text>
					</view>
				</view>
			</view>

			<!-- 操作按钮区域 -->
			<view class="action-section" v-if="showActionButtons">
				<!-- 设计订单：评价按钮 -->
				<button class="action-btn primary" 
					v-if="showReviewButton" 
					@click="goToReview">
					<text class="btn-icon">⭐</text>
					<text class="btn-text">评价订单</text>
				</button>
				
				<!-- 监理订单：查看施工阶段按钮 -->
				<button class="action-btn supervision" 
					v-if="showStageButton" 
					@click="goToStagePage">
					<text class="btn-icon">🏗️</text>
					<text class="btn-text">查看施工阶段</text>
				</button>
			</view>

			<!-- 加载状态 -->
			<view v-if="loading" class="loading-state">
				<text class="loading-text">加载中...</text>
			</view>

			<!-- 空状态 -->
			<view v-if="!loading && !orderInfo.orderId" class="empty-state">
				<view class="empty-icon">📋</view>
				<view class="empty-text">订单信息不存在</view>
				<view class="empty-desc">请检查订单编号是否正确</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
import { orderService, OrderStatus, OrderType } from '@/api/order.js'
import { getDesignSchemeList } from '@/api/designScheme.js'
import { getCurrentRole, getUserById } from '@/api/users.js'
import { orderReviewApi } from '@/api/orderReview.js'
import * as productOrderApi from '@/api/product-order.js'
// 导入在线咨询相关工具函数
import { isUserLoggedIn, handleNotLoggedIn, createConversationAndNavigate } from "@/utils/conversationHelper.js"

export default {
	data() {
		return {
			// 页面参数
			orderId: null,
			
			// 用户身份信息
			userRole: 'user', // 默认设为用户
			userInfo: {}, // 当前用户信息
			
			// 加载状态
			loading: false,
			refreshing: false,
			
			// 订单信息
			orderInfo: {
				orderId: null,
				projectId: null,
				userId: null,
				contractorId: null,
				type: OrderType.DESIGN,
				status: 0, // 默认待确认
				totalAmount: 0,
				createTime: null,
				updateTime: null,
				contractUrl: null,
				remark: '',
				expectedEndTime: null,
				actualEndTime: null,
				contractStatus: null,
				projectInfo: {},
				contractorInfo: {}
			},
			
			// 对方信息缓存（根据角色不同）
			oppositeInfoCache: {}, // 当用户是设计师/监理时，缓存用户信息
			
			// 设计方案列表
			designSchemes: [],
			
			// 评价状态
			hasReviewed: false,
			orderReview: null, // 评价详情
			
			// 关联的材料订单列表
			materialOrders: []
		}
	},
	
	computed: {
		// 订单状态样式类
		orderStatusClass() {
			return this.getStatusClass(this.orderInfo?.status);
		},
		// 按createTime排序的效果图方案（最新的排在最前面）
		sortedEffectSchemes() {
			return this.designSchemes
				.filter(scheme => {
					const type = scheme.schemeType || scheme.type;
					return String(type) === "1"; // 效果图类型
				})
				.sort((a, b) => {
					// 按createTime降序排列（最新的在最前面）
					const timeA = new Date(a.createTime).getTime();
					const timeB = new Date(b.createTime).getTime();
					return timeB - timeA;
				});
		},
		
		// 按createTime排序的施工设计图方案（最新的排在最前面）
		sortedConstructionSchemes() {
			return this.designSchemes
				.filter(scheme => {
					const type = scheme.schemeType || scheme.type;
					return String(type) === "2"; // 施工设计图类型
				})
				.sort((a, b) => {
					// 按createTime降序排列（最新的在最前面）
					const timeA = new Date(a.createTime).getTime();
					const timeB = new Date(b.createTime).getTime();
					return timeB - timeA;
				});
		},
		
		// 是否为监理订单
		isSupervisionOrder() {
			return this.orderInfo.type === OrderType.SUPERVISION;
		},
		
		// 根据用户角色获取要显示的对方信息
		currentOppositeInfo() {
			if (this.userRole === 'user') {
				// 普通用户查看设计师/监理信息
				return {
					id: this.orderInfo.contractorId,
					name: this.orderInfo.contractorInfo?.name || 
						  (this.isSupervisionOrder ? '监理' : '设计师'),
					phone: this.orderInfo.contractorInfo?.phone || '暂无联系方式',
					avatar: this.orderInfo.contractorInfo?.avatar || '/static/images/default-avatar.png',
					role: this.isSupervisionOrder ? '监理' : '设计师'
				};
			} else {
				// 设计师/监理查看用户信息
				return {
					id: this.orderInfo.userId,
					name: this.oppositeInfoCache?.nickName || this.oppositeInfoCache?.name || '客户',
					phone: this.oppositeInfoCache?.phone || this.oppositeInfoCache?.userName || '暂无联系方式',
					avatar: this.oppositeInfoCache?.avatar || '/static/images/default-avatar.png',
					role: '客户'
				};
			}
		},
		
		// 是否显示对方信息卡片
		showOppositeInfo() {
			// 只有当有对方信息时才显示
			if (this.userRole === 'user') {
				return this.orderInfo.contractorInfo && this.orderInfo.contractorInfo.name;
			} else {
				return this.oppositeInfoCache && (this.oppositeInfoCache.nickName || this.oppositeInfoCache.name);
			}
		},
		
		// 卡片标题
		oppositeCardTitle() {
			if (this.userRole === 'user') {
				return this.isSupervisionOrder ? '监理信息' : '设计师信息';
			} else {
				return '客户信息';
			}
		},
		
		// 按钮文本
		oppositeButtonText() {
			if (this.userRole === 'user') {
				return '咨询' + (this.isSupervisionOrder ? '监理' : '设计师');
			} else {
				return '联系客户';
			}
		},
		
		// 设计订单：是否显示评价按钮
		showReviewButton() {
			// 1. 必须是设计订单
			if (this.isSupervisionOrder) {
				return false;
			}
			
			// 2. 必须是用户身份
			if (this.userRole !== 'user') {
				return false;
			}
			
			// 3. 订单状态必须是已完成（状态值为2）
			if (this.orderInfo.status !== 2) {
				return false;
			}
			
			// 4. 必须未评价
			if (this.hasReviewed) {
				return false;
			}
			
			return true;
		},
		
		// 监理订单：是否显示查看施工阶段按钮
		showStageButton() {
			// 1. 必须是监理订单
			if (!this.isSupervisionOrder) {
				return false;
			}
			
			// 2. 订单状态必须是已完成（状态值为2）
			if (this.orderInfo.status !== 2) {
				return false;
			}
			
			return true;
		},
		
		// 是否显示操作按钮区域
		showActionButtons() {
			return this.showReviewButton || this.showStageButton;
		},
		
		// 检查是否有多个文件的设计方案
		hasMultipleFiles() {
			return this.designSchemes.some(scheme => this.getFileCount(scheme) > 1);
		}
	},
	
	onLoad(options) {
		console.log('📋 订单详情页面参数:', options);
		this.orderId = options.orderId;
		
		if (!this.orderId) {
			uni.showToast({
				title: '订单ID不能为空',
				icon: 'none'
			});
			setTimeout(() => {
				this.goBack();
			}, 1500);
			return;
		}
		
		// 获取用户身份并加载订单详情
		this.getUserRoleAndLoadData();
	},
	
	methods: {
		// 获取文件列表（处理多个文件）
		getFileList(scheme) {
			if (!scheme || !scheme.fileUrl) return [];
			
			const files = [];
			
			// 处理多个文件的逻辑
			if (scheme.fileUrl.includes(',')) {
				const urls = scheme.fileUrl.split(',').filter(url => url && url.trim());
				
				urls.forEach((url, index) => {
					const cleanUrl = url.trim();
					if (cleanUrl) {
						files.push({
							url: cleanUrl,
							name: this.getFileNameFromUrl(cleanUrl) || `${this.getSchemeTypeText(scheme)}_${index + 1}`,
							size: null,
							index: index + 1
						});
					}
				});
			} else {
				// 单个文件
				files.push({
					url: scheme.fileUrl.trim(),
					name: this.getFileNameFromUrl(scheme.fileUrl) || scheme.schemeName || this.getSchemeTypeText(scheme),
					size: null,
					index: 1
				});
			}
			
			return files;
		},
		
		// 从URL中提取文件名
		getFileNameFromUrl(url) {
			if (!url) return '';
			try {
				// 先去掉查询参数
				const cleanUrl = url.split('?')[0];
				// 获取路径的最后一部分
				const pathParts = cleanUrl.split('/');
				let fileName = pathParts[pathParts.length - 1];
				
				// 解码URL编码的文件名
				try {
					fileName = decodeURIComponent(fileName);
				} catch (e) {
					console.warn('解码文件名失败:', e);
				}
				
				return fileName;
			} catch (error) {
				console.error('提取文件名失败:', error);
				return '';
			}
		},
		
		// 获取方案类型文本
		getSchemeTypeText(scheme) {
			const type = scheme.schemeType || scheme.type;
			return String(type) === "1" ? '效果图' : '施工图';
		},
		
		// 获取文件数量
		getFileCount(scheme) {
			if (!scheme || !scheme.fileUrl) return 0;
			
			// 如果是逗号分隔的多个URL
			if (scheme.fileUrl.includes(',')) {
				const urls = scheme.fileUrl.split(',').filter(url => url && url.trim());
				return urls.length;
			}
			
			// 单个文件
			return 1;
		},
		
		// 获取用户身份并加载数据
		async getUserRoleAndLoadData() {
			try {
				// 获取用户角色
				const roleRes = await getCurrentRole();
				if (roleRes.code === 200 && roleRes.data) {
					this.userRole = roleRes.data.roleType;
					// 保存当前用户信息
					this.userInfo = {
						userId: roleRes.data.userId,
						...roleRes.data
					};
				}
				console.log('✅ 用户身份:', this.userRole, '用户信息:', this.userInfo);
			} catch (error) {
				console.error('❌ 获取用户角色失败，使用默认用户身份:', error);
				this.userRole = 'user'; // 默认设为用户
			}
			
			// 加载订单详情
			this.loadOrderDetail();
		},
		
		// 加载订单详情
		async loadOrderDetail() {
			try {
				this.loading = true;
				
				console.log('📋 开始加载订单详情，订单ID:', this.orderId, '用户身份:', this.userRole);
				
				// 1. 加载订单基本信息
				await this.loadOrderInfo();
				
				// 2. 根据用户角色加载对方信息
				await this.loadOppositeInfo();
				
				// 3. 加载设计方案（仅设计订单需要）
				if (!this.isSupervisionOrder) {
					await this.loadDesignSchemes();
				}
				
				// 4. 加载关联的材料订单（对于设计订单，查询关联的材料订单）
				if (!this.isSupervisionOrder) { // 设计订单（type=1）才显示关联材料
					await this.loadMaterialOrders();
				}
				
				// 5. 检查评价状态
				await this.checkReviewStatus();
				
				console.log('✅ 订单详情加载完成:', this.orderInfo);
				console.log('📋 显示评价按钮:', this.showReviewButton);
				console.log('🏗️ 显示施工阶段按钮:', this.showStageButton);
				
			} catch (error) {
				console.error('❌ 加载订单详情失败:', error);
				this.handleApiError(error, '加载订单详情失败');
			} finally {
				this.loading = false;
				this.refreshing = false;
			}
		},
		
		// 加载订单基本信息
		async loadOrderInfo() {
			try {
				console.log('📋 通过列表接口获取订单信息，订单ID:', this.orderId);
				
				// 使用订单列表接口，通过订单ID筛选
				const queryParams = {
					pageNum: 1,
					pageSize: 100,
					orderId: this.orderId
				};
				
				const result = await orderService.getOrderList(queryParams);
				console.log('✅ 订单列表查询响应:', result);
				
				let orderList = [];
				if (Array.isArray(result)) {
					orderList = result;
				} else if (result && result.records) {
					orderList = result.records;
				} else if (result && result.list) {
					orderList = result.list;
				} else if (result && result.data) {
					orderList = result.data.records || result.data.list || [];
				}
				
				// 查找当前订单
				const currentOrder = orderList.find(order => order.orderId == this.orderId);
				
				if (currentOrder) {
					this.orderInfo = {
						...this.orderInfo,
						...currentOrder
					};
					
					console.log('✅ 订单信息加载成功:', this.orderInfo);
				} else {
					throw new Error('未找到订单信息');
				}
				
			} catch (error) {
				console.error('❌ 加载订单基本信息失败:', error);
				throw error;
			}
		},
		
		// 根据用户角色加载对方信息
		async loadOppositeInfo() {
			if (this.userRole === 'user') {
				// 普通用户：加载设计师/监理信息
				if (this.orderInfo.contractorId) {
					await this.loadContractorInfo(this.orderInfo.contractorId);
				}
			} else {
				// 设计师/监理：加载用户信息
				if (this.orderInfo.userId) {
					await this.loadUserInfo(this.orderInfo.userId);
				}
			}
		},
		
		// 加载设计师/监理信息
		async loadContractorInfo(contractorId) {
			try {
				console.log('👨‍🎨 加载设计师/监理信息，ID:', contractorId);
				
				if (!contractorId) {
					console.warn('设计师/监理ID为空');
					this.orderInfo.contractorInfo = {
						name: this.isSupervisionOrder ? '监理' : '设计师',
						avatar: '/static/images/default-avatar.png',
						phone: '暂无联系方式'
					};
					return;
				}
				
				// 使用统一的 getUserById 接口
				const userResponse = await getUserById(contractorId);
				
				console.log('👨‍🎨 getUserById 原始响应:', userResponse);
				
				// 解析API响应
				let userData = null;
				
				// 处理不同的响应格式
				if (userResponse && typeof userResponse === 'object') {
					// 标准格式：{code: 200, data: {...}}
					if (userResponse.code === 200) {
						userData = userResponse.data || {};
					}
					// 非标准格式：直接是用户数据
					else if (!userResponse.code && (userResponse.name || userResponse.phone || userResponse.avatar)) {
						userData = userResponse;
					}
					// 其他格式：尝试从可能的位置获取数据
					else if (userResponse.data) {
						userData = userResponse.data;
					}
				}
				
				if (!userData) {
					console.warn('⚠️ 无法从响应中解析用户数据，使用默认值');
					throw new Error('未获取到用户信息');
				}
				
				console.log('✅ 解析后的用户数据:', userData);
				
				// 根据示例数据结构调整字段映射
				this.orderInfo.contractorInfo = {
					name: userData.nickName || userData.name || userData.nickname || userData.username || 
						  (this.isSupervisionOrder ? '监理' : '设计师'),
					phone: userData.phone || userData.userName || userData.mobile || userData.telephone || '暂无联系方式',
					avatar: userData.avatar || userData.profilePicture || '/static/images/default-avatar.png'
				};
				
				console.log('✅ 加载设计师/监理信息成功:', this.orderInfo.contractorInfo);
				
			} catch (error) {
				console.error('❌ 加载设计师/监理信息失败:', error);
				// 不影响主要功能，使用默认信息
				this.orderInfo.contractorInfo = {
					name: this.isSupervisionOrder ? '监理' : '设计师',
					avatar: '/static/images/default-avatar.png',
					phone: '暂无联系方式'
				};
			}
		},
		
		// 加载用户信息（当当前用户是设计师/监理时）
		async loadUserInfo(userId) {
			try {
				console.log('👤 加载用户信息，ID:', userId);
				
				if (!userId) {
					console.warn('用户ID为空');
					this.oppositeInfoCache = {
						nickName: '客户',
						phone: '暂无联系方式',
						avatar: '/static/images/default-avatar.png'
					};
					return;
				}
				
				const userResponse = await getUserById(userId);
				
				console.log('👤 getUserById 原始响应:', userResponse);
				
				// 解析API响应
				let userData = null;
				
				// 处理不同的响应格式
				if (userResponse && typeof userResponse === 'object') {
					// 标准格式：{code: 200, data: {...}}
					if (userResponse.code === 200) {
						userData = userResponse.data || {};
					}
					// 非标准格式：直接是用户数据
					else if (!userResponse.code && (userResponse.name || userResponse.phone || userResponse.avatar)) {
						userData = userResponse;
					}
					// 其他格式：尝试从可能的位置获取数据
					else if (userResponse.data) {
						userData = userResponse.data;
					}
				}
				
				if (!userData) {
					console.warn('⚠️ 无法从响应中解析用户数据，使用默认值');
					throw new Error('未获取到用户信息');
				}
				
				console.log('✅ 解析后的用户数据:', userData);
				
				this.oppositeInfoCache = {
					nickName: userData.nickName || userData.name || userData.nickname || userData.username || '客户',
					phone: userData.phone || userData.userName || userData.mobile || userData.telephone || '暂无联系方式',
					avatar: userData.avatar || userData.profilePicture || '/static/images/default-avatar.png'
				};
				
				console.log('✅ 加载用户信息成功:', this.oppositeInfoCache);
				
			} catch (error) {
				console.error('❌ 加载用户信息失败:', error);
				this.oppositeInfoCache = {
					nickName: '客户',
					phone: '暂无联系方式',
					avatar: '/static/images/default-avatar.png'
				};
			}
		},
		
		// 在线咨询方法 - 动态联系对方
		async contactOpposite() {
			console.log('💬 开始在线咨询，当前身份:', this.userRole);
			
			// 1. 检查登录状态
			if (!isUserLoggedIn()) {
				handleNotLoggedIn();
				return;
			}
			
			// 2. 获取对方信息
			const otherUserId = this.currentOppositeInfo.id;
			const otherUserName = this.currentOppositeInfo.name;
			const otherUserAvatar = this.currentOppositeInfo.avatar;
			const roleName = this.userRole === 'user' 
				? (this.isSupervisionOrder ? '监理' : '设计师') 
				: '客户';
			
			if (!otherUserId) {
				uni.showToast({
					title: `${roleName}信息不存在`,
					icon: 'none'
				});
				return;
			}
			
			// 3. 显示加载中
			uni.showLoading({
				title: '创建对话中...',
				mask: true
			});
			
			try {
				console.log('💬 准备创建对话:', {
					当前身份: this.userRole === 'user' ? '用户' : this.userRole,
					对方身份: roleName,
					对方ID: otherUserId,
					对方姓名: otherUserName,
					订单ID: this.orderId
				});
				
				// 4. 使用工具函数创建对话并跳转
				await createConversationAndNavigate(
					otherUserId,
					otherUserName,
					otherUserAvatar
				);
				
				console.log('✅ 对话创建成功');
				
			} catch (error) {
				console.error('❌ 创建对话失败:', error);
				
				// 错误处理
				let errorMessage = '联系' + roleName + '失败';
				if (error.message) {
					if (error.message.includes('请先登录')) {
						errorMessage = '请先登录';
					} else if (error.message.includes('不能与自己')) {
						errorMessage = '不能联系自己';
					} else if (error.message.includes('权限')) {
						errorMessage = '没有权限联系该' + roleName;
					} else if (error.message.includes('对方不存在')) {
						errorMessage = roleName + '信息不存在';
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
							url: `/pages/chat/chat?otherUserId=${otherUserId}&otherUserName=${encodeURIComponent(otherUserName)}&orderId=${this.orderId}&otherUserAvatar=${otherUserAvatar}`
						});
					}, 1000);
				}
			} finally {
				// 5. 隐藏加载状态
				uni.hideLoading();
			}
		},
		
		// 跳转到施工阶段页面
		goToStagePage() {
			console.log('🏗️ 跳转到施工阶段页面:', this.orderId, this.userInfo.userId);
			
			if (!this.orderId) {
				uni.showToast({
					title: '订单信息不完整',
					icon: 'none'
				});
				return;
			}
			
			// 检查用户ID，如果没有就尝试获取当前用户
			let userId = this.userInfo.userId;
			if (!userId) {
				// 尝试从订单信息中获取当前用户ID
				userId = this.orderInfo.userId;
				if (!userId) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					return;
				}
			}
			
			uni.navigateTo({
				url: `/pages/order-hall/orderstage-qr?orderId=${this.orderId}&userId=${userId}`
			});
		},
		
		// 加载设计方案（仅设计订单调用）
		async loadDesignSchemes() {
			try {
				console.log('🎨 加载设计方案，订单ID:', this.orderId);
				
				const queryParams = {
					pageNum: 1,
					pageSize: 100,
					orderId: this.orderId
				};
				
				const result = await getDesignSchemeList(queryParams);
				console.log('✅ 设计方案响应:', result);
				
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
				
				// 按createTime排序（最新的排在最前面）
				list.sort((a, b) => {
					const timeA = new Date(a.createTime).getTime();
					const timeB = new Date(b.createTime).getTime();
					return timeB - timeA; // 降序排列
				});
				
				this.designSchemes = list.map(scheme => ({
					designSchemeId: scheme.designSchemeId,
					schemeName: scheme.schemeName,
					schemeType: scheme.schemeType || scheme.type,
					status: scheme.status,
					createTime: scheme.createTime,
					description: scheme.description,
					imageList: scheme.imageList || [],
					fileUrl: scheme.fileUrl || scheme.coverImage,
					fileCount: this.getFileCount(scheme) // 计算文件数量
				}));
				
				console.log('✅ 解析后的设计方案（已按时间排序）:', this.designSchemes);
				
			} catch (error) {
				console.error('❌ 加载设计方案失败:', error);
				this.designSchemes = [];
			}
		},
		
		// 检查评价状态
		async checkReviewStatus() {
			try {
				console.log('🔍 检查订单评价状态，订单ID:', this.orderId);
				
				const result = await orderReviewApi.getList({ 
					orderId: this.orderId 
				});
				
				console.log('📋 评价查询结果:', result);
				
				if (result && result.code === 200) {
					let reviewList = [];
					
					// 根据API响应结构解析数据
					if (Array.isArray(result.data)) {
						reviewList = result.data;
					} else if (result.data && Array.isArray(result.data.records)) {
						reviewList = result.data.records;
					} else if (result.data && Array.isArray(result.data.list)) {
						reviewList = result.data.list;
					} else if (Array.isArray(result.data.data)) {
						reviewList = result.data.data;
					} else if (Array.isArray(result.records)) {
						reviewList = result.records;
					} else if (Array.isArray(result.list)) {
						reviewList = result.list;
					}
					
					console.log('📝 订单评价列表:', reviewList);
					
					if (reviewList && reviewList.length > 0) {
						// 获取第一个评价
						const review = reviewList[0];
						
						this.orderReview = {
							orderReviewId: review.orderReviewId,
							orderId: review.orderId,
							reviewerId: review.reviewerId,
							rating: review.rating,
							content: review.content,
							createTime: review.createTime,
							updateTime: review.updateTime,
							replyContent: review.replyContent,
							replyTime: review.replyTime,
							remark: review.remark
						};
						
						this.hasReviewed = true;
						console.log('✅ 订单已评价:', this.orderReview);
					} else {
						this.hasReviewed = false;
						this.orderReview = null;
						console.log('📝 订单未评价');
					}
				} else {
					this.hasReviewed = false;
					this.orderReview = null;
					console.log('📝 评价查询失败或未评价');
				}
			} catch (error) {
				console.error('❌ 检查评价状态失败:', error);
				this.hasReviewed = false;
				this.orderReview = null;
			}
		},
		
		// 预览文件（支持PDF和图片）
		previewFile(fileUrl, fileName) {
			if (!fileUrl) {
				uni.showToast({
					title: '文件不存在',
					icon: 'none'
				});
				return;
			}
			
			console.log('📄 预览文件:', fileUrl, fileName);
			
			// 判断文件类型
			const fileExt = this.getFileExtension(fileUrl);
			
			// 如果是PDF文件，使用专门的PDF预览方法
			if (fileExt.toLowerCase() === 'pdf') {
				this.previewPDF(fileUrl);
			} 
			// 如果是图片文件
			else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExt.toLowerCase())) {
				uni.previewImage({
					urls: [fileUrl],
					current: fileUrl,
					success: () => {
						console.log('✅ 图片预览成功');
					},
					fail: (error) => {
						console.error('❌ 图片预览失败:', error);
						this.handleApiError(error, '预览失败');
					}
				});
			} else {
				// 其他文件类型，尝试通用方法
				uni.showToast({
					title: '暂不支持预览此文件类型',
					icon: 'none'
				});
			}
		},
		
		// 预览PDF文件
		previewPDF(pdfUrl) {
			try {
				console.log('📄 预览PDF文件:', pdfUrl);
				
				// 显示加载提示
				uni.showLoading({
					title: '加载文件中...',
					mask: true
				});
				
				// 下载PDF文件
				uni.downloadFile({
					url: pdfUrl,
					header: {
						'Content-Type': 'application/octet-stream'
					},
					success: (res) => {
						uni.hideLoading();
						console.log('✅ PDF文件下载成功:', res);
						
						if (res.statusCode === 200) {
							// 打开PDF文档预览
							uni.openDocument({
								filePath: res.tempFilePath,
								fileType: 'pdf',
								showMenu: true,
								success: () => {
									console.log('✅ PDF文件预览成功');
								},
								fail: (error) => {
									console.error('❌ PDF文件打开失败:', error);
									
									// 如果打开失败，尝试使用图片预览（兼容旧格式）
									uni.previewImage({
										urls: [pdfUrl],
										current: pdfUrl,
										fail: (imgError) => {
											this.handleApiError(imgError, '文件预览失败');
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
						console.error('❌ PDF文件下载失败:', error);
						
						// 如果下载失败，尝试直接预览（可能是图片格式）
						uni.previewImage({
							urls: [pdfUrl],
							current: pdfUrl,
							fail: (previewError) => {
								this.handleApiError(previewError, '文件预览失败');
							}
						});
					}
				});
			} catch (downloadError) {
				uni.hideLoading();
				console.error('❌ PDF预览异常:', downloadError);
				this.handleApiError(downloadError, '文件预览失败');
			}
		},
		
		// 获取文件扩展名
		getFileExtension(filePath) {
			if (!filePath) return '';
			const parts = filePath.split('.');
			return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
		},
		
		// 获取订单状态文本
		getStatusText(status) {
			if (status === undefined || status === null) {
				return '未知状态';
			}
			
			switch (Number(status)) {
				case 0: return '待确认';
				case 1: return '进行中';
				case 2: return '已完成';
				case 3: return '已取消';
				default: return '未知状态';
			}
		},
		
		// 获取订单状态样式类
		getStatusClass(status) {
			if (status === undefined || status === null) {
				return 'status-unknown';
			}
			
			switch (Number(status)) {
				case 0: return 'status-pending';      // 待确认
				case 1: return 'status-progress';     // 进行中
				case 2: return 'status-completed';    // 已完成
				case 3: return 'status-cancelled';    // 已取消
				default: return 'status-unknown';     // 未知状态
			}
		},
		
		// 去评价（只有用户身份可以调用）
		goToReview() {
			if (this.userRole !== 'user') {
				uni.showToast({
					title: '只有用户才能评价订单',
					icon: 'none'
				});
				return;
			}
			
			console.log('📝 去评价，订单ID:', this.orderId);
			uni.navigateTo({
				url: `/pages/review/review?orderId=${this.orderId}`
			});
		},
		
		// 下拉刷新
		onRefresh() {
			if (this.refreshing) return;
			this.refreshing = true;
			this.loadOrderDetail();
		},
		
		// 返回上一页
		goBack() {
			uni.navigateBack();
		},
		
		// 获取方案状态文本
		getSchemeStatusText(status) {
			const statusStr = String(status);
			const statusMap = {
				'2': '已确认',
				'0': '已拒绝',
				'1': '待确认'
			};
			return statusMap[statusStr] || '待确认';
		},
		
		// 获取订单类型文本
		getOrderTypeText(type) {
			return orderService.getOrderTypeText(type);
		},
		
		// 格式化时间
		formatTime(timeStr) {
			if (!timeStr) return '--';
			if (typeof timeStr === 'number') {
				const date = new Date(timeStr);
				return date.toLocaleDateString();
			}
			return timeStr.split(' ')[0];
		},
		
		// 格式化日期
		formatDate(dateStr) {
			if (!dateStr) return '--';
			if (dateStr.includes('T')) {
				return dateStr.split('T')[0];
			}
			return dateStr.split(' ')[0];
		},
		
		// 加载关联的材料订单
		async loadMaterialOrders() {
			try {
				// 使用当前设计师订单的orderId查询关联的材料订单
				const designerOrderId = this.orderInfo.orderId || this.orderId;
				console.log('📦 加载关联的材料订单，设计师订单ID:', designerOrderId);
				
				if (!designerOrderId) {
					console.warn('⚠️ 设计师订单ID为空，无法查询材料订单');
					this.materialOrders = [];
					return;
				}
				
				// 使用新的API查询关联的材料订单（通过关联表 purchase_order_id）
				const res = await productOrderApi.getMaterialOrdersByDesignerOrderId(designerOrderId);
				if (res && res.code === 200) {
					let orders = [];
					if (Array.isArray(res.data)) {
						orders = res.data;
					} else if (res.data && Array.isArray(res.data.rows)) {
						orders = res.data.rows;
					} else if (res.data && Array.isArray(res.data.list)) {
						orders = res.data.list;
					} else if (res.data && Array.isArray(res.data.records)) {
						orders = res.data.records;
					}
					
					this.materialOrders = orders;
					console.log('✅ 找到关联的材料订单:', this.materialOrders.length, '个', this.materialOrders);
				} else {
					console.warn('⚠️ 获取材料订单列表失败:', res);
					this.materialOrders = [];
				}
			} catch (error) {
				console.error('❌ 加载材料订单失败:', error);
				this.materialOrders = [];
			}
		},
		
		// 获取材料订单项图片
		getMaterialItemImage(item) {
			// 优先使用订单项直接包含的图片
			if (item.imageUrl) return item.imageUrl;
			if (item.productImage) return item.productImage;
			if (item.coverImage) return item.coverImage;
			
			// 使用商品SPU的图片
			if (item.productSpu) {
				// 优先使用主图
				if (item.productSpu.mainImageUrl) return item.productSpu.mainImageUrl;
				// 使用封面图
				if (item.productSpu.coverImage) return item.productSpu.coverImage;
				// 使用图片列表的第一张
				if (item.productSpu.imageUrls && item.productSpu.imageUrls.length > 0) {
					return item.productSpu.imageUrls[0];
				}
			}
			
			// 使用商品SKU的图片
			if (item.productSku && item.productSku.imageUrl) return item.productSku.imageUrl;
			
			// 默认图片
			return '/static/images/default-product.jpg';
		},
		
		// 格式化SKU详情
		formatSkuDetail(skuDetail) {
			if (!skuDetail) return null;
			try {
				const parsed = typeof skuDetail === 'string' ? JSON.parse(skuDetail) : skuDetail;
				if (parsed?.combination?.length) {
					return parsed.combination
						.map(item => `${item.name || item.attrName || ''}${item.value ? ':' : ''}${item.value || item.attrValue || ''}`.trim())
						.filter(Boolean)
						.join(' / ');
				}
				if (parsed?.description) return parsed.description;
				return skuDetail;
			} catch (error) {
				return skuDetail;
			}
		},
		
		// 格式化价格
		formatPrice(value) {
			const num = Number(value);
			if (Number.isNaN(num)) return '0.00';
			return num.toFixed(2);
		},
		
		// 获取材料订单项价格（优先使用订单项的价格，否则从商品信息中获取）
		getMaterialItemPrice(item) {
			// 优先使用订单项的价格字段
			if (item.unitPrice && Number(item.unitPrice) > 0) {
				return item.unitPrice;
			}
			if (item.salePrice && Number(item.salePrice) > 0) {
				return item.salePrice;
			}
			if (item.price && Number(item.price) > 0) {
				return item.price;
			}
			
			// 如果订单项没有价格，尝试从商品SKU获取
			if (item.productSku) {
				if (item.productSku.salePrice && Number(item.productSku.salePrice) > 0) {
					return item.productSku.salePrice;
				}
				if (item.productSku.price && Number(item.productSku.price) > 0) {
					return item.productSku.price;
				}
			}
			
			// 如果SKU也没有价格，尝试从商品SPU获取
			if (item.productSpu) {
				if (item.productSpu.salePrice && Number(item.productSpu.salePrice) > 0) {
					return item.productSpu.salePrice;
				}
				if (item.productSpu.price && Number(item.productSpu.price) > 0) {
					return item.productSpu.price;
				}
			}
			
			// 默认返回0
			return 0;
		},
		
		// 获取材料订单状态文本
		getMaterialOrderStatusText(status) {
			const statusMap = {
				'PENDING': '待支付',
				'PAID': '已支付',
				'SHIPPED': '已发货',
				'DELIVERED': '已送达',
				'COMPLETED': '已完成',
				'CANCELLED': '已取消',
				0: '待支付',
				1: '已支付',
				2: '已发货',
				3: '已送达',
				4: '已完成',
				5: '已取消'
			};
			return statusMap[status] || '未知状态';
		},
		
		// 获取材料订单状态颜色
		getMaterialOrderStatusColor(status) {
			const colorMap = {
				'PENDING': '#fa541c',
				'PAID': '#1890ff',
				'SHIPPED': '#52c41a',
				'DELIVERED': '#722ed1',
				'COMPLETED': '#13c2c2',
				'CANCELLED': '#999',
				0: '#fa541c',
				1: '#1890ff',
				2: '#52c41a',
				3: '#722ed1',
				4: '#13c2c2',
				5: '#999'
			};
			return colorMap[status] || '#666';
		},
		
		// 查看材料订单详情（只有用户身份可以跳转）
		viewMaterialOrderDetail(orderId) {
			if (!orderId) {
				uni.showToast({
					title: '订单ID不能为空',
					icon: 'none'
				});
				return;
			}
			
			// 只有用户身份可以跳转到材料订单详情页
			if (this.userRole !== 'user') {
				uni.showToast({
					title: '只有用户身份可以查看材料订单详情',
					icon: 'none',
					duration: 2000
				});
				return;
			}
			
			// 跳转到订单详情页
			uni.navigateTo({
				url: `/pages/shop/order-detail?orderId=${orderId}`
			});
		},
		
		// 统一的错误处理
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
		}
	},
	
	onPullDownRefresh() {
		this.onRefresh();
		uni.stopPullDownRefresh();
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
	.content {
		height: calc(100vh - 120rpx);
		padding: 30rpx;
	}
	
	/* 状态卡片 */
	.status-card {
		background: linear-gradient(135deg, #67C23A, #85CE61);
		border-radius: 16rpx;
		padding: 40rpx 30rpx;
		display: flex;
		align-items: center;
		margin-bottom: 30rpx;
		color: white;
	}
	
	.status-icon {
		font-size: 60rpx;
		margin-right: 20rpx;
	}
	
	.status-info {
		display: flex;
		flex-direction: column;
	}
	
	.status-text {
		font-size: 36rpx;
		font-weight: bold;
		margin-bottom: 8rpx;
	}
	
	.status-desc {
		font-size: 26rpx;
		opacity: 0.9;
	}
	
	/* 信息卡片 */
	.info-card {
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
		border-left: 6rpx solid #3498db;
		padding-left: 20rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	/* 方案标题样式 */
	.scheme-title-wrapper {
		display: flex;
		align-items: center;
	}
	
	.scheme-icon {
		margin-right: 15rpx;
		font-size: 36rpx;
	}
	
	.scheme-title {
		font-size: 32rpx;
		font-weight: bold;
	}
	
	.scheme-count-wrapper {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}
	
	.scheme-count {
		font-size: 24rpx;
		color: #999;
		font-weight: normal;
	}
	
	.file-count-hint {
		font-size: 20rpx;
		color: #1890ff;
		background: rgba(24, 144, 255, 0.1);
		padding: 2rpx 6rpx;
		border-radius: 4rpx;
		margin-top: 4rpx;
	}
	
	/* 多文件方案区域 */
	.multi-file-section {
		margin-bottom: 25rpx;
		border-bottom: 1rpx solid #f0f0f0;
		padding-bottom: 25rpx;
	}
	
	.multi-file-section:last-child {
		margin-bottom: 0;
		border-bottom: none;
		padding-bottom: 0;
	}
	
	.scheme-header {
		margin-bottom: 15rpx;
	}
	
	.scheme-name {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 8rpx;
	}
	
	.scheme-status-wrapper {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
	}
	
	/* 方案描述 */
	.scheme-description {
		margin-top: 15rpx;
		padding: 15rpx;
		background: #f8f9fa;
		border-radius: 8rpx;
		border-left: 3rpx solid #3498db;
	}
	
	.description-text {
		font-size: 26rpx;
		color: #666;
		line-height: 1.5;
	}
	
	/* 文件列表 */
	.file-list {
		display: flex;
		flex-direction: column;
		gap: 15rpx;
	}
	
	.file-item {
		display: flex;
		align-items: center;
		padding: 20rpx;
		background: #f8f9fa;
		border-radius: 10rpx;
		border: 1rpx solid #e9ecef;
	}
	
	.file-icon {
		font-size: 40rpx;
		margin-right: 15rpx;
		color: #e74c3c;
	}
	
	.file-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	
	.file-name {
		font-size: 26rpx;
		font-weight: 500;
		color: #333;
		margin-bottom: 6rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.file-desc {
		font-size: 22rpx;
		color: #999;
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8rpx;
	}
	
	/* 信息列表 */
	.info-list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}
	
	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.info-label {
		font-size: 28rpx;
		color: #666;
	}
	
	.info-value {
		font-size: 28rpx;
		color: #333;
		font-weight: 500;
	}
	
	/* 订单状态样式 */
	.info-value.status-pending {
		color: #ff9800;      /* 待确认 - 橙色 */
		font-weight: bold;
	}
	
	.info-value.status-progress {
		color: #2196f3;      /* 进行中 - 蓝色 */
		font-weight: bold;
	}
	
	.info-value.status-completed {
		color: #67C23A;      /* 已完成 - 绿色 */
		font-weight: bold;
	}
	
	.info-value.status-cancelled {
		color: #f44336;      /* 已取消 - 红色 */
		font-weight: bold;
	}
	
	.info-value.status-unknown {
		color: #999;         /* 未知状态 - 灰色 */
		font-weight: bold;
	}
	
	.info-value.amount {
		color: #e74c3c;
		font-weight: bold;
		font-size: 32rpx;
	}
	
	/* 项目内容 */
	.project-content {
		display: flex;
		flex-direction: column;
		gap: 15rpx;
	}
	
	.project-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}
	
	.project-desc {
		font-size: 28rpx;
		color: #666;
		line-height: 1.5;
	}
	
	.project-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 15rpx;
	}
	
	.tag {
		font-size: 24rpx;
		color: #666;
		background: #f8f9fa;
		padding: 8rpx 16rpx;
		border-radius: 20rpx;
	}
	
	/* 设计师内容 */
	.designer-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	
	.designer-avatar {
		width: 100rpx;
		height: 100rpx;
		border-radius: 50%;
		overflow: hidden;
		margin-right: 20rpx;
		flex-shrink: 0;
	}
	
	.avatar-img {
		width: 100%;
		height: 100%;
	}
	
	.designer-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
		margin-right: 20rpx;
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
		margin-bottom: 5rpx;
	}
	
	.designer-phone {
		font-size: 26rpx;
		color: #666;
		display: block;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.no-phone-tip {
		font-size: 24rpx;
		color: #999;
		display: block;
	}
	
	/* 在线咨询按钮样式 */
	.contact-btn {
		padding: 10rpx 20rpx;
		background: linear-gradient(135deg, #3498db, #2980b9);
		color: white;
		border: none;
		border-radius: 25rpx;
		font-size: 24rpx;
		font-weight: 500;
		white-space: nowrap;
		height: auto;
		line-height: 1.4;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4rpx 12rpx rgba(52, 152, 219, 0.2);
		transition: all 0.3s ease;
		flex-shrink: 0;
	}
	
	.contact-btn:active {
		transform: scale(0.95);
		box-shadow: 0 2rpx 6rpx rgba(52, 152, 219, 0.2);
	}
	
	/* 评价内容 */
	.review-content {
		display: flex;
		flex-direction: column;
		gap: 25rpx;
	}
	
	.rating-section {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	
	.rating-label {
		font-size: 28rpx;
		color: #666;
	}
	
	.rating-stars {
		display: flex;
		align-items: center;
	}
	
	.star {
		font-size: 36rpx;
		margin-right: 8rpx;
	}
	
	.star-active {
		color: #ffc107;
	}
	
	.star-inactive {
		color: #e0e0e0;
	}
	
	.rating-value {
		font-size: 28rpx;
		color: #ff6b35;
		font-weight: bold;
	}
	
	.review-text-section {
		display: flex;
		flex-direction: column;
		gap: 15rpx;
	}
	
	.review-label {
		font-size: 28rpx;
		color: #666;
	}
	
	.review-text {
		font-size: 28rpx;
		color: #333;
		line-height: 1.6;
		background: #f8f9fa;
		padding: 20rpx;
		border-radius: 12rpx;
		border-left: 4rpx solid #3498db;
	}
	
	/* 设计师回复样式 */
	.reply-section {
		display: flex;
		flex-direction: column;
		gap: 15rpx;
		padding: 20rpx;
		background: #f0f8ff;
		border-radius: 12rpx;
		border-left: 4rpx solid #3498db;
	}
	
	.reply-label {
		font-size: 28rpx;
		color: #3498db;
		font-weight: bold;
	}
	
	.reply-text {
		font-size: 28rpx;
		color: #333;
		line-height: 1.6;
	}
	
	.reply-time {
		font-size: 24rpx;
		color: #999;
		text-align: right;
	}
	
	.review-time {
		text-align: right;
	}
	
	.review-time-text {
		font-size: 24rpx;
		color: #999;
	}
	
	/* 方案状态样式 */
	.scheme-status {
		font-size: 24rpx;
		font-weight: bold;
		padding: 2rpx 8rpx;
		border-radius: 4rpx;
		margin-right: 8rpx;
	}
	
	.scheme-status-confirmed {
		background-color: #e7f7ef;
		color: #07c160;
	}
	
	.scheme-status-rejected {
		background-color: #fee;
		color: #ff6b35;
	}
	
	.scheme-status-pending {
		background-color: #f8f9fa;
		color: #666;
	}
	
	.scheme-time {
		color: #999;
		margin-right: 8rpx;
	}
	
	/* 文件索引和标签 */
	.file-index {
		color: #666;
		font-size: 22rpx;
	}
	
	.file-size {
		color: #999;
		font-size: 22rpx;
	}
	
	.file-pdf-tag {
		color: #e74c3c;
		font-weight: 500;
		font-size: 22rpx;
	}
	
	.file-action {
		color: #3498db;
		font-size: 24rpx;
		font-weight: 500;
		white-space: nowrap;
	}
	
	/* 暂无设计方案提示 */
	.no-scheme-tip {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 40rpx 0;
		color: #999;
	}
	
	.no-scheme-icon {
		font-size: 60rpx;
		margin-bottom: 20rpx;
		opacity: 0.5;
	}
	
	.no-scheme-text {
		font-size: 28rpx;
		color: #999;
	}
	
	/* 操作区域 */
	.action-section {
		display: flex;
		gap: 20rpx;
		padding: 40rpx 0;
	}
	
	.action-btn {
		flex: 1;
		height: 80rpx;
		border: none;
		border-radius: 40rpx;
		font-size: 28rpx;
		font-weight: bold;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10rpx;
	}
	
	.action-btn.primary {
		background: linear-gradient(135deg, #3498db, #2980b9);
		color: white;
	}
	
	.action-btn.supervision {
		background: linear-gradient(135deg, #4CAF50, #2E7D32);
		color: white;
	}
	
	.btn-icon {
		font-size: 32rpx;
	}
	
	.btn-text {
		font-size: 28rpx;
		font-weight: 500;
	}
	
	/* 加载状态 */
	.loading-state {
		text-align: center;
		padding: 60rpx;
	}
	
	.loading-text {
		font-size: 28rpx;
		color: #999;
	}
	
	/* 空状态 */
	.empty-state {
		text-align: center;
		padding: 100rpx 30rpx;
	}
	
	.empty-icon {
		font-size: 120rpx;
		margin-bottom: 30rpx;
	}
	
	.empty-text {
		font-size: 32rpx;
		color: #333;
		margin-bottom: 15rpx;
	}
	
	.empty-desc {
		font-size: 28rpx;
		color: #999;
	}
	
	/* 刷新容器 */
	.refresh-container {
		text-align: center;
		padding: 20rpx;
	}
	
	.refresh-text {
		font-size: 28rpx;
		color: #999;
	}
	
	/* 材料订单样式 */
	.material-orders-list {
		display: flex;
		flex-direction: column;
		gap: 24rpx;
	}
	
	.material-order-item {
		background: #f8f9fa;
		border-radius: 16rpx;
		padding: 24rpx;
		border: 1px solid #e5e5e5;
	}
	
	.material-order-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16rpx;
		padding-bottom: 16rpx;
		border-bottom: 1px solid #e5e5e5;
	}
	
	.material-order-id {
		font-size: 26rpx;
		color: #606266;
	}
	
	.material-order-status {
		font-size: 24rpx;
		font-weight: 500;
	}
	
	.material-order-items {
		margin-bottom: 16rpx;
	}
	
	.material-item-row {
		display: flex;
		margin-bottom: 16rpx;
	}
	
	.material-item-row:last-child {
		margin-bottom: 0;
	}
	
	.material-item-image {
		width: 120rpx;
		height: 120rpx;
		border-radius: 12rpx;
		background: #f2f3f5;
		margin-right: 16rpx;
	}
	
	.material-item-info {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	
	.material-item-name {
		font-size: 28rpx;
		color: #303133;
		margin-bottom: 8rpx;
	}
	
	.material-item-sku {
		font-size: 24rpx;
		color: #909399;
		margin-bottom: 8rpx;
	}
	
	.material-item-bottom {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: auto;
	}
	
	.material-item-price {
		font-size: 28rpx;
		color: #fa541c;
		font-weight: 600;
	}
	
	.material-item-qty {
		font-size: 24rpx;
		color: #606266;
	}
	
	.material-order-footer {
		padding-top: 16rpx;
		border-top: 1px solid #e5e5e5;
	}
	
	.material-order-total {
		font-size: 28rpx;
		color: #303133;
		font-weight: 500;
		text-align: right;
	}
</style>