<template>
	<view class="container">
		<!-- 顶部导航 -->
		<view class="top-nav">
			<view class="time">{{ currentTime }}</view>
			<view class="search-bar">搜索</view>
		</view>
		
		<!-- 主菜单 -->
		<view class="main-menu">
			<view class="menu-item">订单大厅</view>
			<view class="menu-item">购买居家建材</view>
			<view class="menu-item">找设计师</view>
			<view class="menu-item">找监工</view>
			<view class="menu-item active">查看案例</view>
		</view>
		
		<!-- 轮播图区域 -->
		<view class="banner-section">
			<view class="swiper-container">
				<view class="swiper-wrapper">
					<view class="swiper-slide active">
						<view class="banner-image" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)">
							<text class="banner-text">限时特惠！全屋定制8折起</text>
						</view>
					</view>
					<view class="swiper-slide">
						<view class="banner-image" style="background: linear-gradient(135deg, #4834d4 0%, #686de0 100%)">
							<text class="banner-text">新用户专享 ¥1000装修礼包</text>
						</view>
					</view>
					<view class="swiper-slide">
						<view class="banner-image" style="background: linear-gradient(135deg, #00d2d3 0%, #54a0ff 100%)">
							<text class="banner-text">设计师精品案例合集</text>
						</view>
					</view>
				</view>
				<!-- 轮播图指示器 -->
				<view class="swiper-indicator">
					<view class="indicator-dot active"></view>
					<view class="indicator-dot"></view>
					<view class="indicator-dot"></view>
				</view>
			</view>
		</view>
		
		<!-- 内容区域 -->
		<view class="content">
			<!-- 帖子类型标签 -->
			<view class="post-type-tabs">
				<view class="type-tab active" @click="switchType('all')">全部</view>
				<view class="type-tab" @click="switchType('portfolio')">作品集</view>
				<view class="type-tab" @click="switchType('caseStudy')">案例集</view>
				<view class="type-tab" @click="switchType('normal')">普通帖</view>
				<view class="type-tab" @click="switchType('materialShow')">材料展示</view>
			</view>
			
			<view class="post-list">
				<!-- 加载状态 -->
				<view class="loading" v-if="loading">
					<text class="loading-icon">⏳</text>
					<text>正在加载帖子...</text>
				</view>
				
				<!-- 错误状态 -->
				<view class="error" v-else-if="error">
					<text class="error-icon">❌</text>
					<text>加载失败，请稍后重试</text>
					<button class="retry-btn" @click="fetchPosts">重新加载</button>
				</view>
				
				<!-- 空状态 -->
				<view class="empty-state" v-else-if="filteredPosts.length === 0">
					<text class="empty-icon">📝</text>
					<text>暂无帖子</text>
				</view>
				
				<!-- 帖子列表 -->
				<view class="post-card" v-for="post in filteredPosts" :key="post.id" @click="viewPost(post.id)">
					<view class="post-header">
						<view class="post-title">{{ post.title }}</view>
						<view class="post-type" :class="getTypeClass(post.threadType)">{{ getTypeName(post.threadType) }}</view>
					</view>
					<view class="post-content">{{ post.content }}</view>
					<view class="post-footer">
						<view class="post-author">
							<view class="author-avatar">{{ getAuthorInitial(post.authorName) }}</view>
							<text>{{ post.authorName || '匿名用户' }}</text>
						</view>
						<view class="post-stats">
							<view class="stat-item">
								<text class="stat-icon">👁️</text>
								<text>{{ post.viewCount || 0 }}</text>
							</view>
							<view class="stat-item">
								<text class="stat-icon">❤️</text>
								<text>{{ post.likeCount || 0 }}</text>
							</view>
							<view class="stat-item">
								<text class="stat-icon">💬</text>
								<text>{{ post.commentCount || 0 }}</text>
							</view>
						</view>
					</view>
				</view>
				
				<!-- 加载更多 -->
				<view class="load-more" v-if="hasMore && !loading && filteredPosts.length > 0">
					<button class="load-more-btn" @click="loadMore" :disabled="loadingMore">
						{{ loadingMore ? '加载中...' : '加载更多' }}
					</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { getPostList } from '@/api/community.js';
	
	export default {
		data() {
			return {
				currentTime: this.getCurrentTime(),
				loading: false,
				loadingMore: false,
				error: false,
				currentType: 'all',
				posts: [], // 确保初始化为数组
				currentBanner: 0,
				bannerTimer: null,
				pageNum: 1,
				pageSize: 10,
				hasMore: true,
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
					}
				],
				// 帖子类型映射
				threadTypeMap: {
					'portfolio': { name: '作品集', class: 'portfolio-type' },
					'caseStudy': { name: '案例集', class: 'case-study-type' },
					'normal': { name: '普通帖', class: 'normal-type' },
					'materialShow': { name: '材料展示', class: 'material-show-type' }
				}
			}
		},
		computed: {
			filteredPosts() {
				// 确保 posts 是数组
				if (!Array.isArray(this.posts)) {
					console.warn('posts is not an array:', this.posts);
					return [];
				}
				
				if (this.currentType === 'all') {
					return this.posts;
				}
				return this.posts.filter(post => post && post.threadType === this.currentType);
			}
		},
		methods: {
			// 获取当前时间
			getCurrentTime() {
				const now = new Date();
				return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
			},
			
			// 获取作者首字母
			getAuthorInitial(authorName) {
				if (!authorName) return '匿';
				return authorName.charAt(0);
			},
			
			// 切换帖子类型
			switchType(type) {
				this.currentType = type;
				this.pageNum = 1;
				this.posts = []; // 重置为数组
				this.hasMore = true;
				this.fetchPosts();
				
				// 更新活跃标签
				this.updateActiveTab(type);
			},
			
			// 更新活跃标签
			updateActiveTab(activeType) {
				const tabs = document.querySelectorAll('.type-tab');
				tabs.forEach(tab => {
					tab.classList.remove('active');
				});
				// 这里简化处理，实际项目中可以使用更优雅的方式
				setTimeout(() => {
					const activeTab = Array.from(tabs).find(tab => 
						tab.textContent === this.getTabText(activeType)
					);
					if (activeTab) {
						activeTab.classList.add('active');
					}
				}, 0);
			},
			
			// 获取标签文本
			getTabText(type) {
				const textMap = {
					'all': '全部',
					'portfolio': '作品集',
					'caseStudy': '案例集',
					'normal': '普通帖',
					'materialShow': '材料展示'
				};
				return textMap[type] || '全部';
			},
			
			// 获取类型样式类
			getTypeClass(threadType) {
				return this.threadTypeMap[threadType]?.class || 'normal-type';
			},
			
			// 获取类型名称
			getTypeName(threadType) {
				return this.threadTypeMap[threadType]?.name || '普通帖';
			},
			
			// 查看帖子详情
			viewPost(id) {
				console.log('查看帖子:', id);
				uni.navigateTo({
					url: `/pages/post/detail?id=${id}`
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
					this.updateBannerDisplay();
				}, 3000);
			},
			
			// 更新轮播图显示
			updateBannerDisplay() {
				const banners = document.querySelectorAll('.swiper-slide');
				const dots = document.querySelectorAll('.indicator-dot');
				
				banners.forEach((banner, index) => {
					banner.classList.remove('active');
					if (index === this.currentBanner) {
						banner.classList.add('active');
					}
				});
				
				dots.forEach((dot, index) => {
					dot.classList.remove('active');
					if (index === this.currentBanner) {
						dot.classList.add('active');
					}
				});
			},
			
			// 重置轮播定时器
			resetBannerTimer() {
				if (this.bannerTimer) {
					clearInterval(this.bannerTimer);
				}
				this.autoPlayBanner();
			},
			
			// 获取帖子列表
			async fetchPosts() {
				try {
					this.loading = true;
					this.error = false;
					
					const queryParams = {
						pageNum: this.pageNum,
						pageSize: this.pageSize
					};
					
					// 如果当前不是全部类型，添加类型筛选
					if (this.currentType !== 'all') {
						queryParams.threadType = this.getThreadTypeValue(this.currentType);
					}
					
					const response = await getPostList(queryParams);
					console.log('API Response:', response); // 调试用
					
					// 处理不同的响应格式
					let postList = [];
					if (response && response.data) {
						// 处理不同的数据结构
						if (Array.isArray(response.data)) {
							postList = response.data;
						} else if (Array.isArray(response.data.list)) {
							postList = response.data.list;
						} else if (Array.isArray(response.data.records)) {
							postList = response.data.records;
						} else if (Array.isArray(response.data.data)) {
							postList = response.data.data;
						} else {
							console.warn('Unexpected response format:', response.data);
							postList = [];
						}
					}
					
					// 确保 postList 是数组
					if (!Array.isArray(postList)) {
						console.warn('postList is not an array:', postList);
						postList = [];
					}
					
					if (this.pageNum === 1) {
						this.posts = postList;
					} else {
						this.posts = [...this.posts, ...postList];
					}
					
					// 判断是否还有更多数据
					this.hasMore = postList.length === this.pageSize;
					
				} catch (error) {
					console.error('获取帖子失败:', error);
					this.error = true;
					this.posts = []; // 出错时重置为数组
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					});
				} finally {
					this.loading = false;
					this.loadingMore = false;
				}
			},
			
			// 加载更多帖子
			async loadMore() {
				if (this.loadingMore || !this.hasMore) return;
				
				this.loadingMore = true;
				this.pageNum++;
				await this.fetchPosts();
			},
			
			// 将类型字符串转换为对应的数值（根据后端定义）
			getThreadTypeValue(type) {
				const typeMap = {
					'portfolio': 1,      // 作品集
					'caseStudy': 2,     // 案例集
					'normal': 3,        // 普通帖
					'materialShow': 4   // 材料展示
				};
				return typeMap[type] || 3;
			},
			
			// 初始化轮播图点击事件
			initBannerEvents() {
				const dots = document.querySelectorAll('.indicator-dot');
				dots.forEach((dot, index) => {
					dot.onclick = () => {
						this.switchBanner(index);
					};
				});
			},
			
			// 刷新页面
			refresh() {
				this.pageNum = 1;
				this.posts = [];
				this.hasMore = true;
				this.fetchPosts();
			}
		},
		onLoad() {
			this.fetchPosts();
			this.autoPlayBanner();
			
			// 更新时间
			setInterval(() => {
				this.currentTime = this.getCurrentTime();
			}, 60000);
		},
		onShow() {
			this.resetBannerTimer();
		},
		onUnload() {
			if (this.bannerTimer) {
				clearInterval(this.bannerTimer);
			}
		},
		onPullDownRefresh() {
			this.refresh();
			setTimeout(() => {
				uni.stopPullDownRefresh();
			}, 1000);
		},
		onReachBottom() {
			this.loadMore();
		},
		mounted() {
			this.initBannerEvents();
		}
	}
</script>

<style>
	/* 样式保持不变，与之前相同 */
	.container {
		background-color: #f5f5f5;
		min-height: 100vh;
	}
	
	.top-nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 15px;
		background-color: #fff;
		border-bottom: 1px solid #eee;
	}
	
	.time {
		font-size: 14px;
		color: #666;
	}
	
	.search-bar {
		flex: 1;
		margin: 0 15px;
		background-color: #f5f5f5;
		border-radius: 20px;
		padding: 8px 15px;
		font-size: 14px;
		color: #999;
	}
	
	.main-menu {
		display: flex;
		background-color: #fff;
		padding: 10px 0;
		border-bottom: 1px solid #eee;
		overflow-x: auto;
		white-space: nowrap;
	}
	
	.menu-item {
		flex-shrink: 0;
		padding: 8px 15px;
		text-align: center;
		font-size: 14px;
		color: #333;
	}
	
	.menu-item.active {
		color: #ff6b6b;
		font-weight: bold;
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
	}
	
	.swiper-slide.active {
		opacity: 1;
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
		transition: all 0.3s;
	}
	
	.indicator-dot.active {
		background-color: white;
		width: 20px;
		border-radius: 4px;
	}
	
	.content {
		padding: 15px;
	}
	
	.post-type-tabs {
		display: flex;
		margin-bottom: 15px;
		border-bottom: 1px solid #eee;
		overflow-x: auto;
	}
	
	.type-tab {
		padding: 8px 15px;
		font-size: 14px;
		white-space: nowrap;
	}
	
	.type-tab.active {
		color: #ff6b6b;
		border-bottom: 2px solid #ff6b6b;
	}
	
	.post-list {
		display: flex;
		flex-direction: column;
		gap: 15px;
	}
	
	.post-card {
		background-color: #fff;
		border-radius: 8px;
		padding: 15px;
		box-shadow: 0 2px 5px rgba(0,0,0,0.05);
	}
	
	.post-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
	}
	
	.post-title {
		font-size: 16px;
		font-weight: bold;
		color: #333;
		flex: 1;
		margin-right: 10px;
	}
	
	.post-type {
		font-size: 12px;
		padding: 2px 8px;
		border-radius: 10px;
		flex-shrink: 0;
	}
	
	.portfolio-type {
		background-color: #f0f7ff;
		color: #1890ff;
	}
	
	.case-study-type {
		background-color: #f6ffed;
		color: #52c41a;
	}
	
	.normal-type {
		background-color: #fff7e6;
		color: #fa8c16;
	}
	
	.material-show-type {
		background-color: #f9f0ff;
		color: #722ed1;
	}
	
	.post-content {
		font-size: 14px;
		color: #666;
		line-height: 1.5;
		margin-bottom: 10px;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	
	.post-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 12px;
		color: #999;
	}
	
	.post-author {
		display: flex;
		align-items: center;
	}
	
	.author-avatar {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background-color: #eee;
		margin-right: 5px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 10px;
		color: #999;
	}
	
	.post-stats {
		display: flex;
		gap: 15px;
	}
	
	.stat-item {
		display: flex;
		align-items: center;
		gap: 5px;
	}
	
	.loading, .error, .empty-state {
		text-align: center;
		padding: 40px 20px;
		color: #999;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
	}
	
	.loading-icon, .error-icon, .empty-icon {
		font-size: 48px;
	}
	
	.retry-btn {
		margin-top: 10px;
		padding: 8px 16px;
		background-color: #ff6b6b;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 14px;
	}
	
	.load-more {
		display: flex;
		justify-content: center;
		padding: 20px 0;
	}
	
	.load-more-btn {
		padding: 10px 20px;
		background-color: #fff;
		color: #666;
		border: 1px solid #eee;
		border-radius: 20px;
		font-size: 14px;
	}
	
	.load-more-btn:disabled {
		opacity: 0.6;
	}
</style>