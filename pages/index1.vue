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
			
			<!-- 帖子列表 -->
			<view class="post-container">
				<!-- 热门帖子（大图） -->
				<view class="post-item post-large" 
				      v-for="post in featuredPosts" 
				      :key="post.id" 
				      @click="viewPostDetail(post.id)">
					<view class="post-image" :class="getPostImageClass(post.threadType)">
						<text class="image-label">{{ getPostTypeLabel(post.threadType) }}</text>
					</view>
					<view class="post-content">
						<view class="post-badge" v-if="post.isHot">热门</view>
						<view class="post-type-tag" :class="getPostTypeClass(post.threadType)">
							{{ getThreadTypeName(post.threadType) }}
						</view>
						<view class="post-title">{{ post.title }}</view>
						<view class="post-author">{{ post.author }}</view>
						<view class="post-stats">
							<text>🔥 {{ post.views }} 浏览</text>
							<text>💬 {{ post.commentCount || 0 }} 评论</text>
						</view>
					</view>
				</view>
				
				<!-- 普通帖子（小图） -->
				<view class="post-item post-small" 
				      v-for="post in normalPosts" 
				      :key="post.id" 
				      @click="viewPostDetail(post.id)">
					<view class="post-image" :class="getPostImageClass(post.threadType)">
						<text class="image-label">{{ getPostTypeLabel(post.threadType) }}</text>
					</view>
					<view class="post-content">
						<view class="post-type-tag small" :class="getPostTypeClass(post.threadType)">
							{{ getThreadTypeName(post.threadType) }}
						</view>
						<view class="post-title">{{ post.title }}</view>
						<view class="post-author">{{ post.author }}</view>
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
	</view>
</template>

<script>
import { getPostList, getCategories, getThreadTypes } from '@/api/community.js'

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
				pageSize: 8,
				keyword: '',
				categoryId: null,
				threadType: null
			},
			total: 0
		}
	},
	
	computed: {
		// 精选帖子（大图展示）- 根据浏览量判断
		featuredPosts() {
			return this.postList.filter(post => post.viewCount > 1000).slice(0, 2)
		},
		
		// 普通帖子（小图展示）
		normalPosts() {
			return this.postList.filter(post => !this.featuredPosts.includes(post))
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
		
		// 查看帖子详情
		async viewPostDetail(id) {
			try {
				uni.navigateTo({
					url: `/pages/post/detail?id=${id}`
				});
			} catch (error) {
				console.error('跳转失败:', error);
				uni.showToast({
					title: '跳转失败',
					icon: 'none'
				});
			}
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
				// 根据数据库字段映射到前端显示字段
				const processedPost = {
					// 帖子ID
					id: post.thread_id || post.id || Math.random().toString(36).substr(2, 9),
					// 标题
					title: post.title || '无标题',
					// 作者信息 - 可能需要另外查询用户表获取用户名
					author: this.getAuthorName(post),
					// 浏览量
					views: this.formatViewCount(post.view_count || post.viewCount || 0),
					viewCount: post.view_count || post.viewCount || 0,
					// 点赞数
					likeCount: post.like_count || post.likeCount || 0,
					// 评论数
					commentCount: post.comment_count || post.commentCount || 0,
					// 帖子类型 - 根据数据库thread_type
					threadType: post.thread_type || post.threadType || 3,
					// 创建时间
					createTime: post.create_time || post.createTime,
					// 分类信息
					categoryId: post.category_id || post.categoryId,
					// 角色类型
					roleType: post.role_type || post.roleType,
					// 状态
					status: post.status,
					// 封面图 - 可能需要从关联表中获取
					coverImage: post.cover_image || post.coverImage
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
			
			// 根据角色类型返回默认名称
			const roleType = post.role_type || post.roleType;
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
		
		// 模拟帖子数据 - 根据数据库类型
		getMockPosts() {
			const baseMockPosts = [
				// 作品集 (thread_type: 1)
				{
					id: 1,
					title: '现代简约风格家居设计作品',
					author: '设计师张工',
					views: '2.3万',
					viewCount: 23000,
					threadType: 1,
					roleType: 2
				},
				{
					id: 2,
					title: '欧式古典风格别墅设计',
					author: '设计工作室',
					views: '1.8万',
					viewCount: 18000,
					threadType: 1,
					roleType: 2
				},
				// 案例集 (thread_type: 2)
				{
					id: 3,
					title: '小户型改造：30平变60平的魔法',
					author: '改造专家',
					views: '3.2万',
					viewCount: 32000,
					threadType: 2,
					roleType: 1
				},
				{
					id: 4,
					title: '老房翻新案例分享',
					author: '装修达人',
					views: '1.5万',
					viewCount: 15000,
					threadType: 2,
					roleType: 1
				},
				// 普通帖 (thread_type: 3)
				{
					id: 5,
					title: '装修避坑经验分享',
					author: '装修小白',
					views: '2.1万',
					viewCount: 21000,
					threadType: 3,
					roleType: 1
				},
				{
					id: 6,
					title: '装修预算如何控制？',
					author: '理财达人',
					views: '0.8万',
					viewCount: 8000,
					threadType: 3,
					roleType: 1
				},
				// 材料展示 (thread_type: 4)
				{
					id: 7,
					title: '进口大理石材料展示',
					author: '建材商城',
					views: '0.9万',
					viewCount: 9000,
					threadType: 4,
					roleType: 4
				},
				{
					id: 8,
					title: '环保涂料选购指南',
					author: '材料专家',
					views: '1.1万',
					viewCount: 11000,
					threadType: 4,
					roleType: 4
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
		
		// 获取帖子图片标签
		getPostTypeLabel(typeId) {
			const labelMap = {
				1: '作品图片',
				2: '案例图片',
				3: '普通图片', 
				4: '材料图片'
			};
			return labelMap[typeId] || '图片';
		},
		
		// 获取帖子图片样式类
		getPostImageClass(typeId) {
			const classMap = {
				1: 'portfolio-image',    // 作品集
				2: 'case-image',         // 案例集
				3: 'normal-image',       // 普通帖
				4: 'material-image'      // 材料展示
			};
			return classMap[typeId] || 'normal-image';
		},
		
		// 获取帖子类型标签样式类
		getPostTypeClass(typeId) {
			const classMap = {
				1: 'portfolio-tag',    // 作品集
				2: 'case-tag',         // 案例集
				3: 'normal-tag',       // 普通帖
				4: 'material-tag'      // 材料展示
			};
			return classMap[typeId] || 'normal-tag';
		},
		
		// 加载更多
		async loadMore() {
			if (this.loading || !this.hasMore) return;
			
			this.pageParams.pageNum++;
			await this.loadPosts();
		},
		
		// 下拉刷新
		async onPullDownRefresh() {
			this.pageParams.pageNum = 1;
			await this.loadPosts();
			uni.stopPullDownRefresh();
		},
		
		// 上拉加载更多
		async onReachBottom() {
			await this.loadMore();
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
	
	onPullDownRefresh() {
		this.onPullDownRefresh();
	},
	
	onReachBottom() {
		this.onReachBottom();
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
	
	/* 帖子图片样式 - 根据不同分类 */
	.post-image {
		width: 100%;
		height: 60%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 16px;
		font-weight: bold;
		position: relative;
	}
	
	.portfolio-image {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}
	
	.case-image {
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
	}
	
	.material-image {
		background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
	}
	
	.normal-image {
		background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
	}
	
	.image-label {
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}
	
	.post-small .post-image {
		height: 60%;
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
		z-index: 1;
	}
	
	/* 帖子类型标签样式 */
	.post-type-tag {
		position: absolute;
		top: -8px;
		right: 12px;
		color: white;
		padding: 2px 8px;
		border-radius: 10px;
		font-size: 10px;
		z-index: 1;
	}
	
	.post-type-tag.small {
		font-size: 9px;
		padding: 1px 6px;
	}
	
	.portfolio-tag {
		background: #667eea;
	}
	
	.case-tag {
		background: #f5576c;
	}
	
	.material-tag {
		background: #4facfe;
	}
	
	.normal-tag {
		background: #43e97b;
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
		display: flex;
		gap: 8px;
	}
	
	/* 加载更多 */
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
	
	/* 空状态 */
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
	}
	
	@media (max-width: 375px) {
		.location-text {
			max-width: 45px;
		}
		
		.location-btn {
			min-width: 65px;
		}
		
		.tab-item {
			padding: 8px 8px;
			font-size: 13px;
		}
	}
</style>