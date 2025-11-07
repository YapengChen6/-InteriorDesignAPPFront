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
					<input type="text" placeholder="搜索装修相关内容" v-model="searchKeyword">
					<text v-if="searchKeyword" class="clear-icon" @click="clearSearch">×</text>
				</view>
			</view>
		</view>
		
		<!-- 主菜单 -->
		<view class="main-menu">
			<view class="menu-item" :class="{ active: activeMainMenu === 0 }" @click="activeMainMenu = 0">
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
			<view class="menu-item" :class="{ active: activeMainMenu === 3 }" @click="activeMainMenu = 3">
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
				<view class="tab-item" :class="{ active: activeTab === 0 }" @click="activeTab = 0">推荐</view>
				<view class="tab-item" :class="{ active: activeTab === 1 }" @click="activeTab = 1">装修案例</view>
				<view class="tab-item" :class="{ active: activeTab === 2 }" @click="activeTab = 2">户型改造</view>
				<view class="tab-item" :class="{ active: activeTab === 3 }" @click="activeTab = 3">装修避坑</view>
			</view>
			
			<!-- 瀑布流布局 -->
			<view class="post-container">
				<view class="post-item post-large" v-for="post in largePosts" :key="post.id" @click="viewPost(post.id)">
					<view class="post-image">
						<text>热门图片</text>
					</view>
					<view class="post-content">
						<view class="post-badge">热门</view>
						<view class="post-title">{{ post.title }}</view>
						<view class="post-author">{{ post.author }}</view>
						<view class="post-stats">
							<text>🔥 {{ post.views }} 浏览</text>
						</view>
					</view>
				</view>
				
				<view class="post-item post-small" v-for="post in smallPosts" :key="post.id" @click="viewPost(post.id)">
					<view class="post-image">
						<text>普通图片</text>
					</view>
					<view class="post-content">
						<view class="post-title">{{ post.title }}</view>
						<view class="post-author">{{ post.author }}</view>
					</view>
				</view>
				
				<view class="post-item post-large ad-post" v-for="post in adPosts" :key="post.id" @click="viewPost(post.id)">
					<view class="post-image">
						<text>广告图片</text>
					</view>
					<view class="post-content">
						<view class="post-badge ad-badge">广告</view>
						<view class="post-title">{{ post.title }}</view>
						<view class="post-author">{{ post.author }}</view>
						<view class="post-ad-tag">赞助内容</view>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 发布菜单弹窗 -->
		<view v-if="showPublishMenu" class="publish-menu-overlay" @tap="closePublishMenu">
			<view class="publish-menu" @tap.stop>
				<view class="publish-menu-item" @tap="goToPublishPost">
					<view class="menu-icon">📝</view>
					<text class="menu-text">发布帖子</text>
				</view>
				<view class="publish-menu-item" @tap="goToPublishOrder">
					<view class="menu-icon">📋</view>
					<text class="menu-text">发布订单</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				// 定位相关数据
				locationText: '选择位置',
				searchKeyword: '',
				unreadCount: 3, // 未读消息数量
				pendingOrderCount: 2, // 待处理订单数量
				showPublishMenu: false, // 控制发布菜单显示
				
				// 原有数据
				activeMainMenu: 0,
				activeTab: 0,
				activeNav: 0,
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
				largePosts: [
					{
						id: 1,
						title: '查漏报告：好消息，卫生间不存在水平渗漏！',
						author: '智通-美女',
						views: '2.3万'
					},
					{
						id: 4,
						title: '极致装修：现代简约风格案例分享',
						author: '住小帮 原创',
						views: '1.8万'
					}
				],
				smallPosts: [
					{
						id: 2,
						title: '好好吃饭 好好生活~',
						author: '皮皮成长日记'
					},
					{
						id: 3,
						title: '小户型改造技巧',
						author: '装修达人'
					},
					{
						id: 5,
						title: '装修材料选购指南',
						author: '建材专家'
					},
					{
						id: 6,
						title: '色彩搭配心得',
						author: '设计师李工'
					}
				],
				adPosts: [
					{
						id: 7,
						title: '限时优惠！品牌建材特价促销',
						author: '建材商城官方'
					}
				]
			}
		},
		methods: {
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
			
			// 清空搜索
			clearSearch() {
				this.searchKeyword = '';
			},
			
			// 查看帖子
			viewPost(id) {
				console.log('查看帖子:', id);
				// 实际项目中这里可以跳转到帖子详情页
				uni.navigateTo({
					url: `/pages/post/detail?id=${id}`
				});
			},
			
			// 跳转到找设计师页面
			goToFindDesigner() {
				uni.navigateTo({
					url: '/pages/find-design/find-design'
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
				console.log('跳转到:', link);
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
			
			// 发布菜单相关方法
			togglePublishMenu() {
				this.showPublishMenu = !this.showPublishMenu
			},

			closePublishMenu() {
				this.showPublishMenu = false
			},

			goToPublishPost() {
				this.closePublishMenu()
				uni.showToast({
					title: '跳转到发布帖子页面',
					icon: 'success'
				})
				// 实际跳转代码
				// uni.navigateTo({
				//   url: '/pages/publish/post'
				// })
			},

			goToPublishOrder() {
				this.closePublishMenu()
				uni.showToast({
					title: '跳转到发布订单页面',
					icon: 'success'
				})
				// 实际跳转代码
				// uni.navigateTo({
				//   url: '/pages/publish/order'
				// })
			}
		},
		
		onLoad() {
			// 页面加载时尝试获取缓存的定位信息
			this.getCachedLocation();
		},
		
		onShow() {
			// 页面显示时检查是否有新的定位信息
			this.getCachedLocation();
			// 恢复轮播图自动播放
			this.resetBannerTimer();
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
	.container {
		max-width: 750px;
		margin: 0 auto;
		background-color: #fff;
		min-height: 100vh;
		position: relative;
	}
	
	/* 顶部搜索区域 */
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
	
	/* 定位按钮样式 */
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
	
	/* 搜索框样式 */
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
	
	/* 主菜单 */
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
	
	/* 轮播图区域 */
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
	
	/* 轮播图指示器 */
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
	
	/* 内容区域 */
	.content {
		padding: 15px;
	}
	
	.tab-nav {
		display: flex;
		margin-bottom: 15px;
		border-bottom: 1px solid #eee;
		overflow-x: auto;
	}
	
	.tab-item {
		padding: 8px 15px;
		font-size: 16px;
		white-space: nowrap;
		cursor: pointer;
		transition: color 0.3s;
	}
	
	.tab-item.active {
		color: #ff6b00;
		border-bottom: 2px solid #ff6b00;
	}
	
	/* 瀑布流布局 */
	.post-container {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 15px;
	}
	
	.post-item {
		background-color: #fff;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
		transition: transform 0.3s, box-shadow 0.3s;
		cursor: pointer;
	}
	
	.post-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
	}
	
	.post-large {
		grid-column: span 2;
		height: 250px;
	}
	
	.post-small {
		height: 180px;
	}
	
	.post-image {
		width: 100%;
		height: 60%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 16px;
		font-weight: bold;
	}
	
	.post-small .post-image {
		height: 60%;
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
	}
	
	.ad-post .post-image {
		background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
	}
	
	.post-content {
		padding: 12px;
		position: relative;
	}
	
	.post-badge {
		position: absolute;
		top: -10px;
		left: 12px;
		background: #ff6b00;
		color: white;
		padding: 2px 8px;
		border-radius: 10px;
		font-size: 12px;
		font-weight: bold;
	}
	
	.ad-badge {
		background: #ff4757;
	}
	
	.post-title {
		font-size: 15px;
		font-weight: bold;
		margin-bottom: 6px;
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	
	.post-small .post-title {
		font-size: 14px;
		-webkit-line-clamp: 2;
	}
	
	.post-author {
		font-size: 12px;
		color: #666;
		margin-bottom: 5px;
	}
	
	.post-stats {
		font-size: 11px;
		color: #999;
	}
	
	.post-ad-tag {
		font-size: 11px;
		color: #ff6b00;
		font-weight: bold;
		margin-top: 5px;
	}
	
	/* 发布菜单样式 */
	.publish-menu-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		z-index: 2000;
	}

	.publish-menu {
		background: white;
		border-radius: 24rpx 24rpx 0 0;
		padding: 40rpx;
		width: 100%;
		max-width: 750rpx;
		box-shadow: 0 -8rpx 32rpx rgba(0, 0, 0, 0.1);
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	.publish-menu-item {
		display: flex;
		align-items: center;
		padding: 30rpx 0;
		border-bottom: 2rpx solid #f0f0f0;
		cursor: pointer;
	}

	.publish-menu-item:last-child {
		border-bottom: none;
	}

	.publish-menu-item .menu-icon {
		font-size: 48rpx;
		margin-right: 30rpx;
		width: 80rpx;
		text-align: center;
	}

	.publish-menu-item .menu-text {
		font-size: 32rpx;
		color: #333;
		font-weight: 500;
	}

	.publish-menu-item:active {
		background-color: #f5f5f5;
	}

	/* 响应式调整 */
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
			padding: 8px 10px;
			font-size: 14px;
		}
		
		.post-container {
			gap: 12px;
		}
		
		.post-large {
			height: 220px;
		}
		
		.post-small {
			height: 160px;
		}
		
		.post-title {
			font-size: 14px;
		}
		
		.post-small .post-title {
			font-size: 13px;
		}
		
		.menu-item {
			min-width: 70px;
			font-size: 13px;
		}
		
		.main-menu {
			padding: 12px;
		}
		
		.content {
			padding: 12px;
		}
		
		.publish-menu {
			padding: 30rpx;
		}
		
		.publish-menu-item {
			padding: 24rpx 0;
		}
		
		.publish-menu-item .menu-icon {
			font-size: 40rpx;
			margin-right: 24rpx;
			width: 60rpx;
		}
		
		.publish-menu-item .menu-text {
			font-size: 28rpx;
		}
	}
	
	@media (max-width: 375px) {
		.location-text {
			max-width: 45px;
		}
		
		.location-btn {
			min-width: 65px;
		}
	}
</style>