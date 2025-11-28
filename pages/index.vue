<template>
	<view class="container">
		<!-- 顶部搜索区域 -->
		<view class="search-section">
			<view class="search-container">
				<!-- 定位按钮 -->
				<view class="location-btn" @click="goToLocationPage">
					<text class="location-icon">📍</text>
					<text class="location-text">{{ locationText }}</text>
					<text class="location-arrow">▼</text>
				</view>
				<!-- 搜索框 -->
				<view class="search-box">
					<text class="search-icon">🔍</text>
					<input type="text" placeholder="搜索装修相关内容" v-model="searchKeyword" @confirm="onSearch">
					<text v-if="searchKeyword" class="clear-icon" @click="clearSearch">×</text>
				</view>
			</view>
		</view>
		
		<!-- 主菜单 -->
		<view class="main-menu">
			<view class="menu-item" :class="{ active: activeMainMenu === 0 }" @click="goToOrderHall()">
				<view class="menu-icon">📋</view>
				<text>订单大厅</text>
			</view>
			<view class="menu-item" 
			      :class="{ active: activeMainMenu === 1 }" 
			      @click="goToShopPage()">
				<view class="menu-icon">🏠</view>
				<text>购买居家建材</text>
			</view>
			<view class="menu-item" 
			      :class="{ active: activeMainMenu === 2 }" 
			      @click="goToFindDesigner()">
				<view class="menu-icon">👨‍🎨</view>
				<text>找设计师</text>
			</view>
			<view class="menu-item" 
			      :class="{ active: activeMainMenu === 3 }" 
			      @click="goToFindSupervisor()">
				<view class="menu-icon">👷</view>
				<text>找监工</text>
			</view>
			<view class="menu-item" :class="{ active: activeMainMenu === 4 }" @click="activeMainMenu = 4">
				<view class="menu-icon">📖</view>
				<text>查看案例</text>
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
import { 
	getPostList, 
	getCategories, 
	getThreadTypes,
	getImageDetail,
	formatFileSize
} from '@/api/community.js'

export default {
	data() {
		return {
			// 定位相关数据
			locationText: '选择位置',
			searchKeyword: '',
			
			// 原有数据
			activeMainMenu: 0,
			activeTab: 0,
			currentBanner: 0,
			bannerTimer: null,
			banners: [
				{
					title: '限时特惠！全屋定制8折起',
					color: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
					link: '/pages/promotion'
				},
				{
					title: '新用户专享 ¥1000装修礼包',
					color: 'linear-gradient(135deg, #4834d4 0%, #686de0 100%)',
					link: '/pages/newuser'
				},
				{
					title: '设计师精品案例合集',
					color: 'linear-gradient(135deg, #00d2d3 0%, #54a0ff 100%)',
					link: '/pages/designer'
				},
				{
					title: '春季装修节 建材买一送一',
					color: 'linear-gradient(135deg, #f368e0 0%, #ff9ff3 100%)',
					link: '/pages/spring'
				}
			],
			
			// 帖子相关数据
			postList: [], // 帖子列表
			categories: [], // 分类列表
			threadTypes: [], // 帖子类型列表
			loading: false,
			hasMore: true,
			pageParams: {
				pageNum: 1,
				pageSize: 12,
				keyword: '',
				categoryId: null,
				threadType: null
			},
			total: 0,
			
			// 图片详情相关数据
			showImageInfo: false, // 是否显示图片信息
			imageDetailsCache: new Map(), // 图片详情缓存
			loadingImageDetails: new Set(), // 正在加载的图片详情
			
			// 帖子类型样式类映射 - 修复 :class 绑定问题
			postTypeClasses: {
				1: 'portfolio-tag',    // 作品集
				2: 'case-tag',         // 案例集
				3: 'normal-tag',       // 普通帖
				4: 'material-tag'      // 材料展示
			},
			
			// 防止重复点击
			isNavigating: false
		}
	},
	
	methods: {
		// 跳转到订单大厅页面
		goToOrderHall() {
			uni.navigateTo({
				url: '/pages/order-hall/order-hall'
			});
		},
		
		// 跳转到定位页面
		goToLocationPage() {
			uni.navigateTo({
				url: '/pages/location/location'
			});
		},
		
		// 跳转到商城页面
		goToShopPage() {
			uni.navigateTo({
				url: '/pages/shop/shop'
			});
		},
		
		// 跳转到找监工页面
		goToFindSupervisor() {
			uni.navigateTo({
				url: '/pages/find-supervisor/find-supervisor'
			});
		},
		
		// 跳转到找设计师页面
		goToFindDesigner() {
			uni.navigateTo({
				url: '/pages/find-design/find-design'
			});
		},
		
		// 清空搜索
		clearSearch() {
			this.searchKeyword = '';
			this.pageParams.keyword = '';
			this.pageParams.pageNum = 1;
			this.loadPosts();
		},
		
		// 搜索帖子
		async onSearch() {
			this.pageParams.keyword = this.searchKeyword;
			this.pageParams.pageNum = 1;
			await this.loadPosts();
		},
		
		// 查看帖子详情 - 优化后的跳转逻辑
		async viewPostDetail(id) {
			// 防止重复点击
			if (this.isNavigating) {
				return;
			}
			
			try {
				this.isNavigating = true;
				console.log('📖 查看帖子详情，ID:', id);
				
				// 添加点击反馈
				uni.vibrateShort({
					success: () => {
						console.log('振动反馈');
					}
				});
				
				// 显示加载提示
				uni.showLoading({
					title: '加载中...',
					mask: true
				});
				
				// 跳转到详情页
				uni.navigateTo({
					url: `/pages/post/detail?id=${id}`,
					success: () => {
						console.log('跳转成功');
						uni.hideLoading();
					},
					fail: (error) => {
						console.error('跳转失败:', error);
						uni.hideLoading();
						uni.showToast({
							title: '跳转失败，请重试',
							icon: 'none',
							duration: 2000
						});
					},
					complete: () => {
						// 重置导航状态
						setTimeout(() => {
							this.isNavigating = false;
						}, 500);
					}
				});
			} catch (error) {
				console.error('跳转异常:', error);
				uni.hideLoading();
				uni.showToast({
					title: '跳转失败',
					icon: 'none'
				});
				this.isNavigating = false;
			}
		},
		
		// 获取帖子图片URL - 直接使用 cover_url
		getPostImageUrl(post) {
			// 优先使用 cover_url（后端提供的预览图）
			if (post.coverUrl) {
				return post.coverUrl;
			}
			
			// 如果没有 cover_url，使用 mediaUrls 中的第一张图片作为降级方案
			if (post.mediaUrls && post.mediaUrls.length > 0) {
				return post.mediaUrls[0];
			}
			
			// 如果都没有图片，返回空字符串，显示无图片状态
			return '';
		},
		
		// 加载图片详情信息
		async loadImageDetail(post) {
			try {
				// 如果已经在加载中，跳过
				if (this.loadingImageDetails.has(post.id)) {
					return;
				}
				
				// 标记为正在加载详情
				this.loadingImageDetails.add(post.id);
				
				console.log(`🔄 开始加载帖子 ${post.id} 的图片详情`);
				
				// 从图片URL中提取mediaId（假设URL中包含mediaId）
				const imageUrl = post.coverUrl || (post.mediaUrls && post.mediaUrls[0]);
				const mediaId = this.extractMediaIdFromUrl(imageUrl);
				
				if (mediaId) {
					// 调用图片详情接口
					const response = await getImageDetail(mediaId);
					console.log(`📊 获取到图片详情:`, response);
					
					if (response && response.code === 200) {
						const imageDetail = response.data;
						
						// 处理图片详情数据
						const processedDetail = this.processImageDetail(imageDetail);
						
						// 更新帖子数据
						this.$set(post, 'imageDetail', processedDetail);
						this.$set(post, 'imageDetailLoaded', true);
						
						// 缓存图片详情
						this.imageDetailsCache.set(post.id, processedDetail);
						
						console.log(`✅ 成功加载图片详情:`, processedDetail);
					}
				} else {
					console.log(`⚠️ 无法从URL提取mediaId:`, imageUrl);
					// 如果没有mediaId，创建基本的图片信息
					this.createBasicImageInfo(post, imageUrl);
				}
				
			} catch (error) {
				console.error(`❌ 加载图片详情失败:`, error);
				// 标记为详情加载失败，避免重复尝试
				this.$set(post, 'imageDetailLoaded', true);
			} finally {
				this.loadingImageDetails.delete(post.id);
			}
		},
		
		// 从图片URL中提取mediaId
		extractMediaIdFromUrl(imageUrl) {
			if (!imageUrl) return null;
			
			// 假设URL格式为：https://domain.com/path/{mediaId}.jpg
			// 或者：https://domain.com/path/{mediaId}
			const urlParts = imageUrl.split('/');
			const lastPart = urlParts[urlParts.length - 1];
			
			// 移除文件扩展名
			const withoutExtension = lastPart.split('.')[0];
			
			// 检查是否是有效的ID格式（数字或特定格式）
			if (/^\d+$/.test(withoutExtension)) {
				return withoutExtension;
			}
			
			// 如果是其他格式的ID，可以在这里添加更多解析逻辑
			return null;
		},
		
		// 处理图片详情数据
		processImageDetail(imageDetail) {
			if (!imageDetail) return null;
			
			return {
				// 基本信息
				id: imageDetail.id || imageDetail.mediaId,
				filename: imageDetail.filename || imageDetail.fileName,
				fileUrl: imageDetail.fileUrl || imageDetail.url,
				
				// 文件信息
				fileSize: imageDetail.fileSize ? formatFileSize(imageDetail.fileSize) : '未知大小',
				fileType: imageDetail.fileType || imageDetail.mimeType || 'image',
				width: imageDetail.width,
				height: imageDetail.height,
				
				// 关联信息
				relatedType: imageDetail.relatedType,
				relatedId: imageDetail.relatedId,
				sequence: imageDetail.sequence,
				stage: imageDetail.stage,
				description: imageDetail.description,
				
				// 时间信息
				createTime: imageDetail.createTime || imageDetail.create_time,
				updateTime: imageDetail.updateTime || imageDetail.update_time,
				
				// 状态信息
				status: imageDetail.status,
				isDeleted: imageDetail.isDeleted || imageDetail.deleted
			};
		},
		
		// 创建基本的图片信息
		createBasicImageInfo(post, imageUrl) {
			try {
				console.log(`🔄 创建基本图片信息:`, imageUrl);
				
				// 创建基本的图片信息
				const basicInfo = {
					fileUrl: imageUrl,
					filename: this.extractFilenameFromUrl(imageUrl),
					fileSize: '未知大小',
					fileType: this.extractFileTypeFromUrl(imageUrl),
					createTime: post.createTime || '未知时间'
				};
				
				this.$set(post, 'imageDetail', basicInfo);
				this.$set(post, 'imageDetailLoaded', true);
				
			} catch (error) {
				console.error(`❌ 创建基本图片信息失败:`, error);
				this.$set(post, 'imageDetailLoaded', true);
			}
		},
		
		// 从URL中提取文件名
		extractFilenameFromUrl(url) {
			if (!url) return '未知文件';
			const parts = url.split('/');
			return parts[parts.length - 1] || '未知文件';
		},
		
		// 从URL中提取文件类型
		extractFileTypeFromUrl(url) {
			if (!url) return 'image';
			const parts = url.split('.');
			const extension = parts[parts.length - 1]?.toLowerCase();
			
			const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
			if (imageTypes.includes(extension)) {
				return 'image';
			}
			
			return extension || 'file';
		},
		
		// 图片预览
		previewImage(post) {
			// 预览时使用原始图片URL（mediaUrls），而不是封面图
			if (!post.mediaUrls || post.mediaUrls.length === 0) {
				return;
			}
			
			// 使用uni.previewImage进行图片预览
			uni.previewImage({
				urls: post.mediaUrls,
				current: post.mediaUrls[0],
				indicator: 'number',
				loop: true,
				success: () => {
					console.log('图片预览成功');
				},
				fail: (error) => {
					console.error('图片预览失败:', error);
					uni.showToast({
						title: '预览失败',
						icon: 'none'
					});
				}
			});
		},
		
		// 图片加载失败处理
		handleImageError(post, event) {
			console.log('❌ 图片加载失败:', event);
			post.imageError = true;
			post.imageLoading = false;
			
			// 标记图片详情加载完成
			this.$set(post, 'imageDetailLoaded', true);
		},
		
		// 图片加载成功处理
		handleImageLoad(post) {
			console.log('✅ 图片加载成功');
			post.imageError = false;
			post.imageLoading = false;
			
			// 图片加载成功后，加载图片详情
			if (!post.imageDetailLoaded) {
				this.loadImageDetail(post);
			}
		},
		
		// 重试加载图片
		retryLoadImage(post) {
			post.imageError = false;
			post.imageLoading = true;
			post.imageDetailLoaded = false;
			
			this.$forceUpdate();
		},
		
		// 切换显示图片信息
		toggleImageInfo() {
			this.showImageInfo = !this.showImageInfo;
			uni.showToast({
				title: this.showImageInfo ? '已显示图片信息' : '已隐藏图片信息',
				icon: 'none',
				duration: 1500
			});
		},
		
		// 批量预加载图片详情
		preloadImageDetails() {
			// 预加载前几个帖子的图片详情
			const postsToPreload = this.postList.slice(0, 4);
			
			postsToPreload.forEach(post => {
				if ((post.coverUrl || (post.mediaUrls && post.mediaUrls.length > 0)) && !post.imageDetailLoaded) {
					this.loadImageDetail(post);
				}
			});
		},
		
		// 切换轮播图
		switchBanner(index) {
			this.currentBanner = index;
			this.resetBannerTimer();
		},
		
		// 自动轮播
		autoPlayBanner() {
			this.bannerTimer = setInterval(() => {
				this.currentBanner = (this.currentBanner + 1) % this.banners.length;
			}, 3000);
		},
		
		// 重置轮播定时器
		resetBannerTimer() {
			if (this.bannerTimer) {
				clearInterval(this.bannerTimer);
			}
			this.autoPlayBanner();
		},
		
		// 跳转到轮播图链接
		goToBannerLink(link) {
			uni.navigateTo({
				url: link
			});
		},
		
		// 获取缓存的定位信息
		getCachedLocation() {
			try {
				const cachedLocation = uni.getStorageSync('userLocation');
				if (cachedLocation) {
					this.locationText = cachedLocation.city || cachedLocation.address || '定位成功';
				}
			} catch (e) {
				console.log('获取缓存定位失败:', e);
			}
		},
		
		// 切换标签 - 根据数据库thread_type字段调整
		async switchTab(tabIndex) {
			this.activeTab = tabIndex;
			
			const tabFilters = {
				0: { threadType: null }, // 推荐 - 全部
				1: { threadType: 1 },    // 作品集
				2: { threadType: 2 },    // 案例集
				3: { threadType: 4 },    // 材料展示 (数据库中是4)
				4: { threadType: 3 }     // 普通帖 (数据库中是3)
			};
			
			this.pageParams = {
				...this.pageParams,
				...tabFilters[tabIndex],
				pageNum: 1
			};
			
			await this.loadPosts();
		},
		
		// 加载帖子列表
		async loadPosts() {
			try {
				this.loading = true;
				
				// 构建查询参数
				const queryParams = {
					pageNum: this.pageParams.pageNum,
					pageSize: this.pageParams.pageSize
				};
				
				// 添加可选参数
				if (this.pageParams.keyword) {
					queryParams.keyword = this.pageParams.keyword;
				}
				if (this.pageParams.threadType) {
					queryParams.threadType = this.pageParams.threadType;
				}
				if (this.pageParams.categoryId) {
					queryParams.categoryId = this.pageParams.categoryId;
				}
				
				console.log('🔍 发送请求参数:', queryParams);
				
				// 调用API获取帖子列表
				const response = await getPostList(queryParams);
				console.log('📨 API响应数据:', response);
				
				// 根据数据库结构处理响应
				let posts = [];
				let total = 0;
				
				// 处理响应数据
				if (response && response.code === 200) {
					// 如果响应有data字段
					if (response.data) {
						// 分页结构：data中有rows和total
						if (response.data.rows && Array.isArray(response.data.rows)) {
							posts = response.data.rows;
							total = response.data.total || 0;
						}
						// 分页结构：data中有list和total
						else if (response.data.list && Array.isArray(response.data.list)) {
							posts = response.data.list;
							total = response.data.total || 0;
						}
						// data本身就是数组
						else if (Array.isArray(response.data)) {
							posts = response.data;
							total = posts.length;
						}
						// 其他结构
						else {
							posts = this.extractPostsFromResponse(response.data);
							total = response.total || posts.length;
						}
					}
					// 响应直接是数组
					else if (Array.isArray(response)) {
						posts = response;
						total = response.length;
					}
				} else if (Array.isArray(response)) {
					// 直接返回数组的情况
					posts = response;
					total = response.length;
				} else {
					console.warn('⚠️ 无法识别的响应结构:', response);
					posts = [];
					total = 0;
				}
				
				console.log('📊 解析后的帖子数据:', posts);
				
				if (this.pageParams.pageNum === 1) {
					this.postList = [];
				}
				
				// 处理API返回的数据 - 根据数据库字段映射
				const processedPosts = this.processPostData(posts);
				this.postList = [...this.postList, ...processedPosts];
				
				// 更新分页信息
				this.total = total;
				this.hasMore = this.postList.length < total && posts.length === this.pageParams.pageSize;
				
				console.log('✅ 加载完成，当前帖子数:', this.postList.length, '是否有更多:', this.hasMore);
				
			} catch (error) {
				console.error('❌ 加载帖子失败:', error);
				// 出错时使用模拟数据作为降级方案
				this.useMockDataAsFallback();
				uni.showToast({
					title: '加载失败，使用演示数据',
					icon: 'none'
				});
			} finally {
				this.loading = false;
			}
		},
		
		// 从响应对象中提取帖子数据
		extractPostsFromResponse(response) {
			const possibleKeys = ['rows', 'list', 'records', 'posts', 'data', 'items', 'content'];
			
			for (let key of possibleKeys) {
				if (Array.isArray(response[key])) {
					return response[key];
				}
			}
			
			return [];
		},
		
		// 处理API返回的帖子数据 - 根据数据库字段映射
		processPostData(posts) {
			if (!posts || !Array.isArray(posts)) {
				return [];
			}
			
			return posts.map(post => {
				// 根据API返回的数据结构处理
				const processedPost = {
					// 帖子ID
					id: post.id || post.thread_id || Math.random().toString(36).substr(2, 9),
					// 标题
					title: post.title || '无标题',
					// 作者信息
					author: this.getAuthorName(post),
					// 作者头像
					authorAvatar: post.avatar || post.authorAvatar,
					// 浏览量
					views: this.formatViewCount(post.viewCount || post.view_count || 0),
					viewCount: post.viewCount || post.view_count || 0,
					// 点赞数
					likeCount: post.likeCount || post.like_count || 0,
					// 评论数
					commentCount: post.commentCount || post.comment_count || 0,
					// 帖子类型 - 根据数据库thread_type
					threadType: post.threadType || post.thread_type || 3,
					// 创建时间
					createTime: post.createTime || post.create_time,
					// 分类信息
					categoryId: post.categoryId || post.category_id,
					// 角色类型
					roleType: post.roleType || post.role_type,
					// 状态
					status: post.status,
					// 封面图URL - 后端提供的预览图
					coverUrl: post.coverUrl || post.cover_url,
					// 媒体URL数组 - 原始图片
					mediaUrls: post.mediaUrls || post.media_urls || [],
					// 图片加载状态
					imageLoading: true,
					imageError: false,
					// 图片详情相关
					imageDetail: null,
					imageDetailLoaded: false,
					// 模板数据
					normalPost: post.normalPost,
					portfolio: post.portfolio,
					caseStudy: post.caseStudy,
					materialShow: post.materialShow
				};
				
				return processedPost;
			});
		},
		
		// 获取作者名称
		getAuthorName(post) {
			// 如果有直接的用户名字段
			if (post.nickname || post.userName || post.author) {
				return post.nickname || post.userName || post.author;
			}
			
			// 根据用户ID或其他信息生成默认名称
			if (post.userId) {
				return `用户${post.userId}`;
			}
			
			// 根据角色类型返回默认名称
			const roleType = post.roleType || post.role_type;
			const roleNames = {
				1: '普通用户',
				2: '设计师',
				3: '监理',
				4: '材料商'
			};
			
			return roleNames[roleType] || '匿名用户';
		},
		
		// 格式化浏览量显示
		formatViewCount(count) {
			if (count >= 10000) {
				return (count / 10000).toFixed(1) + '万';
			} else if (count >= 1000) {
				return (count / 1000).toFixed(1) + '千';
			}
			return count.toString();
		},
		
		// 降级方案：使用模拟数据
		useMockDataAsFallback() {
			const mockPosts = this.getMockPosts();
			
			if (this.pageParams.pageNum === 1) {
				this.postList = [];
			}
			
			this.postList = [...this.postList, ...mockPosts];
			this.hasMore = false;
		},
		
		// 模拟帖子数据 - 根据API返回的数据结构
		getMockPosts() {
			const baseMockPosts = [
				// 普通帖 (thread_type: 3) - 使用您提供的真实数据
				{
					id: 11,
					title: '氨基酸更加灵活',
					author: '用户102',
					viewCount: 0,
					likeCount: 0,
					commentCount: 0,
					threadType: 3,
					coverUrl: 'https://cypphoto.oss-cn-chengdu.aliyuncs.com/photo//2025/10/30/c0609e506f304cb48d0fd526255e51e7.jpg',
					mediaUrls: [
						'https://cypphoto.oss-cn-chengdu.aliyuncs.com/photo//2025/10/30/c0609e506f304cb48d0fd526255e51e7.jpg',
						'https://cypphoto.oss-cn-chengdu.aliyuncs.com/photo//2025/10/30/5c92c50d76b047308767329292ccddf7.jpg'
					],
					normalPost: {
						normalPostId: "7",
						postId: "11"
					}
				},
				// 作品集 (thread_type: 1)
				{
					id: 1,
					title: '现代简约风格家居设计作品，打造舒适生活空间',
					author: '设计师张工',
					viewCount: 23000,
					likeCount: 1250,
					commentCount: 89,
					threadType: 1,
					coverUrl: 'https://cypphoto.oss-cn-chengdu.aliyuncs.com/photo//2025/10/30/design-1-preview.jpg',
					mediaUrls: [
						'https://cypphoto.oss-cn-chengdu.aliyuncs.com/photo//2025/10/30/design-1.jpg'
					]
				},
				{
					id: 2,
					title: '欧式古典风格别墅设计，奢华与艺术的完美结合',
					author: '设计工作室',
					viewCount: 18000,
					likeCount: 980,
					commentCount: 67,
					threadType: 1,
					coverUrl: 'https://cypphoto.oss-cn-chengdu.aliyuncs.com/photo//2025/10/30/design-2-preview.jpg',
					mediaUrls: [
						'https://cypphoto.oss-cn-chengdu.aliyuncs.com/photo//2025/10/30/design-2.jpg'
					]
				},
				// 案例集 (thread_type: 2)
				{
					id: 3,
					title: '小户型改造：30平变60平的魔法，空间利用极致',
					author: '改造专家',
					viewCount: 32000,
					likeCount: 2100,
					commentCount: 156,
					threadType: 2,
					coverUrl: 'https://cypphoto.oss-cn-chengdu.aliyuncs.com/photo//2025/10/30/case-1-preview.jpg',
					mediaUrls: [
						'https://cypphoto.oss-cn-chengdu.aliyuncs.com/photo//2025/10/30/case-1.jpg'
					]
				},
				{
					id: 4,
					title: '老房翻新案例分享，旧貌换新颜的装修历程',
					author: '装修达人',
					viewCount: 15000,
					likeCount: 870,
					commentCount: 45,
					threadType: 2,
					coverUrl: 'https://cypphoto.oss-cn-chengdu.aliyuncs.com/photo//2025/10/30/case-2-preview.jpg',
					mediaUrls: [
						'https://cypphoto.oss-cn-chengdu.aliyuncs.com/photo//2025/10/30/case-2.jpg'
					]
				},
				// 普通帖 (thread_type: 3)
				{
					id: 5,
					title: '装修避坑经验分享，这些细节一定要注意',
					author: '装修小白',
					viewCount: 21000,
					likeCount: 1560,
					commentCount: 234,
					threadType: 3,
					coverUrl: '',
					mediaUrls: [] // 无图片的帖子
				},
				{
					id: 6,
					title: '装修预算如何控制？我的省钱经验分享',
					author: '理财达人',
					viewCount: 8000,
					likeCount: 540,
					commentCount: 78,
					threadType: 3,
					coverUrl: '',
					mediaUrls: [] // 无图片的帖子
				},
				// 材料展示 (thread_type: 4)
				{
					id: 7,
					title: '进口大理石材料展示，天然纹理美不胜收',
					author: '建材商城',
					viewCount: 9000,
					likeCount: 620,
					commentCount: 34,
					threadType: 4,
					coverUrl: 'https://cypphoto.oss-cn-chengdu.aliyuncs.com/photo//2025/10/30/material-1-preview.jpg',
					mediaUrls: [
						'https://cypphoto.oss-cn-chengdu.aliyuncs.com/photo//2025/10/30/material-1.jpg'
					]
				},
				{
					id: 8,
					title: '环保涂料选购指南，健康家居从墙面开始',
					author: '材料专家',
					viewCount: 11000,
					likeCount: 780,
					commentCount: 56,
					threadType: 4,
					coverUrl: 'https://cypphoto.oss-cn-chengdu.aliyuncs.com/photo//2025/10/30/material-2-preview.jpg',
					mediaUrls: [
						'https://cypphoto.oss-cn-chengdu.aliyuncs.com/photo//2025/10/30/material-2.jpg'
					]
				}
			];
			
			// 根据当前标签筛选
			let filteredPosts = [...baseMockPosts];
			const tabMapping = {
				0: null, // 推荐 - 全部
				1: 1,    // 作品集
				2: 2,    // 案例集
				3: 4,    // 材料展示
				4: 3     // 普通帖
			};
			
			const currentThreadType = tabMapping[this.activeTab];
			if (currentThreadType !== null) {
				filteredPosts = baseMockPosts.filter(post => post.threadType === currentThreadType);
			}
			
			// 模拟分页：如果是第一页返回完整数据，否则返回空数组
			if (this.pageParams.pageNum === 1) {
				return filteredPosts;
			} else {
				return [];
			}
		},
		
		// 加载分类和类型
		async loadCategoriesAndTypes() {
			try {
				console.log('🔄 加载分类和类型...');
				
				// 尝试调用API获取分类和类型
				const [categoriesRes, typesRes] = await Promise.all([
					getCategories(),
					getThreadTypes()
				]);
				
				console.log('📋 分类响应:', categoriesRes);
				console.log('📋 类型响应:', typesRes);
				
				// 处理分类响应
				this.categories = this.processApiResponse(categoriesRes, [
					{ id: 1, name: '设计作品' },
					{ id: 2, name: '装修案例' },
					{ id: 3, name: '经验分享' },
					{ id: 4, name: '材料知识' }
				]);
				
				// 处理类型响应 - 根据数据库thread_type
				this.threadTypes = this.processApiResponse(typesRes, [
					{ id: 1, name: '作品集' },
					{ id: 2, name: '案例集' },
					{ id: 3, name: '普通帖' },
					{ id: 4, name: '材料展示' }
				]);
				
				console.log('✅ 最终分类数据:', this.categories);
				console.log('✅ 最终类型数据:', this.threadTypes);
				
			} catch (error) {
				console.error('❌ 加载分类和类型失败:', error);
				// 使用默认数据
				this.categories = [
					{ id: 1, name: '设计作品' },
					{ id: 2, name: '装修案例' },
					{ id: 3, name: '经验分享' },
					{ id: 4, name: '材料知识' }
				];
				this.threadTypes = [
					{ id: 1, name: '作品集' },
					{ id: 2, name: '案例集' },
					{ id: 3, name: '普通帖' },
					{ id: 4, name: '材料展示' }
				];
			}
		},
		
		// 处理API响应数据
		processApiResponse(response, defaultData) {
			if (Array.isArray(response)) {
				return response;
			} else if (response && response.code === 200 && response.data) {
				if (Array.isArray(response.data)) {
					return response.data;
				} else if (response.data.rows) {
					return response.data.rows;
				} else if (response.data.list) {
					return response.data.list;
				}
			}
			return defaultData;
		},
		
		// 获取帖子类型名称 - 根据数据库thread_type
		getThreadTypeName(typeId) {
			const type = this.threadTypes.find(item => item.id === typeId);
			if (type) {
				return type.name;
			}
			
			// 默认映射
			const typeMap = {
				1: '作品',
				2: '案例', 
				3: '普通',
				4: '材料'
			};
			return typeMap[typeId] || '帖子';
		},
		
		// 加载更多
		async loadMore() {
			if (this.loading || !this.hasMore) return;
			
			this.pageParams.pageNum++;
			await this.loadPosts();
		}
	},
	
	onLoad() {
		// 页面加载时尝试获取缓存的定位信息
		this.getCachedLocation();
		// 加载分类和帖子
		this.loadCategoriesAndTypes();
		this.loadPosts();
	},
	
	onShow() {
		// 页面显示时检查是否有新的定位信息
		this.getCachedLocation();
		// 恢复轮播图自动播放
		this.resetBannerTimer();
	},
	
	onHide() {
		// 页面隐藏时停止轮播图自动播放
		if (this.bannerTimer) {
			clearInterval(this.bannerTimer);
		}
	},
	
	onPullDownRefresh() {
		this.pageParams.pageNum = 1;
		this.loadPosts().then(() => {
			uni.stopPullDownRefresh();
		});
	},
	
	onReachBottom() {
		this.loadMore();
	},
	
	// 监听帖子列表变化，预加载图片详情
	watch: {
		postList: {
			handler(newList) {
				if (newList.length > 0) {
					// 延迟预加载，避免阻塞主线程
					setTimeout(() => {
						this.preloadImageDetails();
					}, 1000);
				}
			},
			immediate: false,
			deep: true
		}
	},
	
	mounted() {
		this.autoPlayBanner();
	},
	
	beforeUnmount() {
		if (this.bannerTimer) {
			clearInterval(this.bannerTimer);
		}
	}
}
</script>

<style>
	/* 样式部分保持不变 */
	.container {
		max-width: 750px;
		margin: 0 auto;
		background-color: #f8f9fa;
		min-height: 100vh;
		position: relative;
		padding-bottom: 60px;
	}
	
	.search-section {
		padding: 15px;
		background-color: #fff;
		border-bottom: 1px solid #eee;
	}
	
	.search-container {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	
	.location-btn {
		display: flex;
		align-items: center;
		background-color: #f8f9fa;
		border-radius: 20px;
		padding: 8px 12px;
		min-width: 80px;
		cursor: pointer;
		transition: all 0.3s;
		border: 1px solid #eee;
		flex-shrink: 0;
	}
	
	.location-btn:active {
		background-color: #e9ecef;
		transform: scale(0.98);
	}
	
	.location-icon {
		font-size: 14px;
		margin-right: 4px;
	}
	
	.location-text {
		font-size: 13px;
		color: #333;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 60px;
	}
	
	.location-arrow {
		font-size: 10px;
		color: #999;
		margin-left: 4px;
	}
	
	.search-box {
		display: flex;
		align-items: center;
		background-color: #f5f5f5;
		border-radius: 20px;
		padding: 8px 15px;
		flex: 1;
		position: relative;
	}
	
	.search-box input {
		flex: 1;
		border: none;
		background: transparent;
		outline: none;
		font-size: 14px;
		padding: 5px;
	}
	
	.search-icon {
		color: #999;
		font-size: 16px;
		margin-right: 8px;
	}
	
	.clear-icon {
		color: #999;
		font-size: 18px;
		padding: 2px;
		cursor: pointer;
		transition: color 0.3s;
	}
	
	.clear-icon:active {
		color: #666;
	}
	
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
		font-size: 20px;
		margin-bottom: 5px;
	}
	
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
	    gap: 0; /* 行和列间隙都设为0 */
	    padding: 0; /* 移除容器内边距 */
	    background-color: #f8f9fa;
	}
	
	.post-item {
	    background-color: #fff;
	    border-radius: 0; /* 移除圆角，避免重叠 */
	    overflow: hidden;
	    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	    transition: transform 0.3s, box-shadow 0.3s;
	    cursor: pointer;
	    margin: 0;
	    border: 1px solid #f0f0f0; /* 添加边框来分隔帖子 */
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
	
	@media (max-width: 480px) {
		.search-section {
			padding: 12px;
		}
		
		.search-container {
			gap: 8px;
		}
		
		.location-btn {
			padding: 6px 10px;
			min-width: 70px;
		}
		
		.location-text {
			font-size: 12px;
			max-width: 50px;
		}
		
		.search-box {
			padding: 6px 12px;
		}
		
		.search-box input {
			font-size: 13px;
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
		.location-text {
			max-width: 45px;
		}
		
		.location-btn {
			min-width: 65px;
		}
		
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