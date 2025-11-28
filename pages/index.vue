<template>
	<view class="container">
		<!-- 顶部搜索区域 - 已修改 -->
		<view class="search-section">
			<view class="search-container">
				<!-- 搜索框 -->
				<view class="search-box">
					<input type="text" placeholder="搜索装修相关内容" v-model="searchKeyword" @confirm="onSearch">
					<view class="search-icon" @click="onSearch">
						<!-- 搜索图标 SVG -->
						<svg class="search-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
							<path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2"/>
						</svg>
					</view>
					<text v-if="searchKeyword" class="clear-icon" @click="clearSearch">×</text>
				</view>
			</view>
		</view>
		
		<!-- 主菜单 - 图标已替换 -->
		<view class="main-menu">
			<view class="menu-item" :class="{ active: activeMainMenu === 0 }" @click="goToOrderHall()">
				<view class="menu-icon">
					<!-- 订单大厅 SVG 图标 -->
					<svg class="icon-svg" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
						<path d="M897.024 1012.224H126.976c-28.16 0-51.2-23.04-51.2-51.2V190.976c0-28.16 23.04-51.2 51.2-51.2h102.4v76.8c0 15.36 10.24 25.6 25.6 25.6H768c15.36 0 25.6-10.24 25.6-25.6v-76.8h102.4c28.16 0 51.2 23.04 51.2 51.2v770.048c1.024 28.16-22.016 51.2-50.176 51.2zM742.912 345.088H281.088c-15.36 0-25.6 10.24-25.6 25.6s10.24 25.6 25.6 25.6h461.824c15.36 0 25.6-10.24 25.6-25.6s-10.24-25.6-25.6-25.6z m0 205.312H281.088c-15.36 0-25.6 10.24-25.6 25.6s10.24 25.6 25.6 25.6h461.824c15.36 0 25.6-10.24 25.6-25.6s-10.24-25.6-25.6-25.6z m0 205.312H281.088c-15.36 0-25.6 10.24-25.6 25.6s10.24 25.6 25.6 25.6h461.824c15.36 0 25.6-10.24 25.6-25.6s-10.24-25.6-25.6-25.6z m-25.6-564.736H306.688c-15.36 0-25.6-10.24-25.6-25.6s10.24-25.6 25.6-25.6h76.8c0-71.68 56.32-128.512 128.512-128.512s128.512 56.32 128.512 128.512h76.8c15.36 0 25.6 10.24 25.6 25.6s-10.24 25.6-25.6 25.6z m-205.312-128c-43.52 0-76.8 33.28-76.8 76.8h153.6c0-43.52-33.28-76.8-76.8-76.8z" fill="currentColor"></path>
					</svg>
				</view>
				<text>订单大厅</text>
			</view>
			<view class="menu-item" 
			      :class="{ active: activeMainMenu === 1 }" 
			      @click="goToShopPage()">
				<view class="menu-icon">
					<!-- 购买居家建材 SVG 图标 -->
					<svg class="icon-svg" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
						<path d="M504.384 154.608l-348.8 235.808a8.192 8.192 0 0 0-3.584 6.784v214.08a28 28 0 0 1-56 0v-214.08c0-21.84 10.736-42.24 28.608-54.304L477.76 104.16a47.264 47.264 0 0 1 52.352-0.48l368.32 239.328A65.488 65.488 0 0 1 928 397.968v469.184C928 903.152 899.36 928 864 928H490.352a26.352 26.352 0 1 1 0-52.704H864c4.416 0 8-3.648 8-8.144V397.968a8.192 8.192 0 0 0-3.696-6.88L504.384 154.624z m53.216 101.44l259.168 171.872-0.688 301.888a64 64 0 0 1-64 63.856H455.024a48 48 0 0 1-36.8-17.184l-78.576-93.888a116.784 116.784 0 0 0-91.184-41.824l-23.088 0.32a32 32 0 0 1-32.448-31.984l-0.032-165.184 275.504-187.36a80 80 0 0 1 89.2-0.512z m113.008 377.6H667.2l33.952-141.84a16 16 0 0 0-13.824-19.632l-290.576-31.728-3.792-27.696c-1.008-7.2-6.816-12.512-13.328-12.592a14.032 14.032 0 0 0-2.272-0.16h-42.672c-8.048 0-14.688 5.808-14.688 12.96 0 7.104 6.592 12.96 14.688 12.96h33.456l32.448 220.928c1.04 7.52 7.296 12.992 14.192 12.592l255.856 0.032c8.096 0 14.688-5.808 14.688-12.864-0.032-7.152-6.672-12.96-14.72-12.96z m-168.32 71.744a30.56 30.56 0 0 0-30.496-30.608 30.56 30.56 0 0 0-30.512 30.608c0 16.912 13.632 30.608 30.512 30.608a30.56 30.56 0 0 0 30.496-30.608z m152.544 0a30.56 30.56 0 0 0-30.512-30.608 30.56 30.56 0 0 0-30.512 30.608c0 16.912 13.648 30.608 30.512 30.608a30.56 30.56 0 0 0 30.512-30.608z m-355.744 72.64l-51.84-54.816a26.352 26.352 0 0 1 0.112-36.32 23.84 23.84 0 0 1 34.544 0.112l97.344 102.912c3.568 3.776 4.96 8.832 4.16 13.6a16 16 0 0 1-4.08 14.048l-97.344 102.928a23.84 23.84 0 0 1-34.544 0.096 26.352 26.352 0 0 1-0.096-36.32l52.048-55.04H121.616a25.6 25.6 0 1 1 0-51.2h177.472z" fill="currentColor"></path>
					</svg>
				</view>
				<text>购买居家建材</text>
			</view>
			<view class="menu-item" 
			      :class="{ active: activeMainMenu === 2 }" 
			      @click="goToFindDesigner()">
				<view class="menu-icon">
					<!-- 找设计师 SVG 图标 -->
					<svg class="icon-svg" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
						<path d="M935.936 854.016c-14.848-39.424-36.864-73.728-65.536-101.376-48.64-47.104-117.76-76.8-211.456-91.648l-13.312-2.048-7.168 13.312c-18.432 33.792-32.768 70.656-46.592 105.472-5.12 13.312-10.24 26.112-15.36 38.4 0-13.312 0-29.184-0.512-47.616v-57.856h-133.12l1.024 26.112c1.536 29.696 2.56 51.2 3.072 68.096-17.92-46.592-36.864-93.184-60.928-133.632l-7.168-12.288-12.288 2.048C272.896 675.84 204.8 705.536 156.16 752.64c-28.16 27.648-50.176 61.44-65.024 100.864-15.872 41.472-24.576 90.112-25.6 144.896l-0.512 25.088h894.464v-24.576c-0.512-54.272-8.192-103.424-23.552-144.896z" fill="currentColor"></path>
						<path d="M240.128 386.048c4.096 33.792 23.552 63.488 51.2 78.848 18.944 53.76 46.08 101.888 76.8 136.704 40.96 46.592 90.112 71.168 141.824 71.168 3.072 0 6.656 0 9.728-0.512 55.296-3.072 104.448-30.208 145.92-79.36 35.328-42.496 58.88-94.208 72.704-133.12 20.992-9.728 36.352-28.672 41.984-54.272 7.68-32.768-2.048-69.632-23.552-93.696 3.072-51.2 22.528-82.432 26.112-136.704 3.584-53.76-14.336-113.152-88.064-146.432-44.032-19.968-143.36-29.696-195.072-28.16C449.024 1.536 348.16 18.944 307.2 45.568c-36.352 24.064-54.784 57.856-61.44 111.616-5.12 43.008 9.728 111.104 14.336 160.256-15.36 16.896-23.04 41.472-19.968 68.608z" fill="currentColor"></path>
					</svg>
				</view>
				<text>找设计师</text>
			</view>
			<view class="menu-item" 
			      :class="{ active: activeMainMenu === 3 }" 
			      @click="goToFindSupervisor()">
				<view class="menu-icon">
					<!-- 找监工 SVG 图标 -->
					<svg class="icon-svg" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
						<path d="M3.968992 3.968992l1016.062016 0 0 1016.062016-1016.062016 0 0-1016.062016Z" fill="#FFFFFF"></path>
						<path d="M196.893767 690.922171l167.618481-43.341395 32.545736 25.115783 69.949519 187.622202 23.401178-108.337612-27.179659-21.30555 16.892031-50.676093 24.353736 0 22.639132 0 24.353736 0 16.860279 50.676093-27.147907 21.30555 24.321984 112.497116 63.56738-191.749953 32.228217-25.242791 173.873612 43.341395 8.763535 2.159132 5.556589 7.20769c5.778853 7.429953 11.049674 15.082171 15.875969 22.893147 34.038078 75.379101 56.740713 159.267721 33.75231 277.416682l-22.76614 0L150.218419 1000.503566 128.404837 1000.503566l-3.810233-21.559566c-11.748217-66.456806-11.906977-121.990946-1.905116-167.904248 10.47814-48.16769 32.069457-85.761984 63.218109-114.211721l4.667535-4.286512L196.893767 690.922171 196.893767 690.922171zM253.507473 371.211907l26.417612 0 8.382512 56.581953c9.716093 52.581209 31.62493 99.859845 61.821023 137.041364 42.801612 52.771721 102.272992 85.539721 168.063008 85.539721l0 0c65.790016 0 125.293147-32.768 168.09476-85.539721 29.402295-36.260713 50.898357-82.07876 61.027225-133.008868l10.509891-60.61445 17.622326 0 21.337302 0 34.89538 0L831.678512 304.945612l-41.817302-12.097488C793.703194 228.423442 758.649054 126.531473 698.542636 87.952868c-10.763907 49.818791-31.656682 89.508713-62.773581 119.006264-3.905488 0-7.779225 0-11.684713 0 27.560682-62.487814 40.832992-108.845643 42.801612-142.53445C625.830698 38.451597 576.837457 23.496434 522.509891 23.496434c-56.962977 0-110.083969 16.415752-154.917705 44.706729 2.698915 33.371287 15.971225 78.586047 42.515845 138.724217-3.873736 0-7.779225 0-11.652961 0-30.48186-28.894264-51.12062-67.568124-62.106791-115.958078C275.606822 128.11907 239.346109 228.328186 240.203411 291.80031L196.131721 304.945612l0 66.298047L253.507473 371.243659 253.507473 371.211907zM334.792434 371.211907l123.959566 0 241.50524 0 1.333581 0c-1.111318 62.900589-22.162853 119.736558-55.597643 160.88707-33.117271 40.864744-78.395535 66.234543-127.80155 66.234543l0 0c-49.406016 0-94.684279-25.369798-127.80155-66.234543C356.955287 490.948465 335.872 434.144248 334.792434 371.211907z" fill="currentColor"></path>
					</svg>
				</view>
				<text>找监工</text>
			</view>
			<view class="menu-item" :class="{ active: activeMainMenu === 4 }" @click="goToViewCases()">
				<view class="menu-icon">
					<!-- 查看案例 SVG 图标 -->
					<svg class="icon-svg" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
						<path d="M820.515051 129.292692C806.439474 114.951055 787.336394 106.896612 767.423879 106.910938H432.682002s-14.06739 0.202615-28.031427 10.856256c-13.967106 10.653641-11.062963 23.652699-11.062963 23.652699V279.099602s1.550309 13.20372-10.413164 27.322276c-11.964496 14.120602-29.78435 16.517185-29.78435 16.517185H226.190067s-21.273513-1.121544-31.236422 6.881734c-9.960863 8.003278-13.414521 28.952402-13.414521 28.952403V840.628646c0 42.228777 33.617655 76.460416 75.087139 76.460416h510.74645c41.47153 0 75.087139-34.231639 75.087139-76.460416V183.371354c0.027629-20.278859-7.867178-39.733956-21.944801-54.078662zM463.969589 402.609591h212.747405c10.368138 0 18.772552 8.55791 18.772552 19.115359s-8.404414 19.11536-18.772552 19.11536H463.969589c-10.368138 0-18.772552-8.55791-18.772553-19.11536s8.404414-19.11536 18.772553-19.115359z m212.847689 308.494073h-332.789409c-10.368138 0-18.772552-8.55791-18.772552-19.11536s8.404414-19.11536 18.772552-19.11536h332.788386c10.368138 0 18.772552 8.55791 18.772552 19.11536 0.001023 10.55745-8.403391 19.11536-18.771529 19.11536z m0-132.583645h-332.789409c-10.368138 0-18.772552-8.55791-18.772552-19.113313 0-10.55745 8.404414-19.11536 18.772552-19.11536h332.788386c10.368138 0 18.772552 8.55791 18.772552 19.11536 0.001023 10.555403-8.403391 19.113313-18.771529 19.113313zM212.874807 283.891745h104.021122s37.545104-9.583263 34.440393-46.998407l0.750083-104.343463s-0.750083-26.251897-16.367782-10.346649c-15.618723 15.903202-131.404796 137.016607-131.404796 137.016607s-24.27794 24.671912 8.56098 24.671912z" fill="currentColor"></path>
					</svg>
				</view>
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
						
						<!-- 图片角标 -->
						<view class="image-badge" :class="getPostTypeClass(post.threadType)">
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
	/* 容器样式保持不变 */
	.container {
		max-width: 750px;
		margin: 0 auto;
		background-color: #f8f9fa;
		min-height: 100vh;
		position: relative;
		padding-bottom: 60px;
	}
	
	/* 搜索框样式 - 已修复 */
	.search-box {
	    display: flex;
	    align-items: center;
	    background-color: #f5f5f5;
	    border-radius: 25px;
	    padding: 8px 15px; /* 调整上下内边距 */
	    flex: 1;
	    position: relative;
	    border: 1px solid #e0e0e0;
	    min-height: 44px; /* 确保最小高度，方便点击 */
	}
	
	.search-box input {
	    flex: 1;
	    border: none;
	    background: transparent;
	    outline: none;
	    font-size: 16px; /* 适当增大字体大小 */
	    padding: 8px 0; /* 增加上下内边距 */
	    padding-right: 30px; /* 为搜索图标留出空间 */
	    line-height: 1.4; /* 设置合适的行高 */
	    height: auto; /* 高度自适应 */
	    min-height: 28px; /* 最小高度 */
	}
	
	/* 搜索图标样式 */
	.search-icon {
	    position: absolute;
	    right: 15px;
	    top: 50%;
	    transform: translateY(-50%);
	    width: 20px;
	    height: 20px;
	    cursor: pointer;
	    color: #666;
	    transition: color 0.3s;
	    display: flex;
	    align-items: center;
	    justify-content: center;
	}
	
	.search-icon-svg {
	    width: 100%;
	    height: 100%;
	}
	
	.search-icon:active {
		color: #4a90e2;
		transform: translateY(-50%) scale(0.95);
	}
	
	.clear-icon {
	    position: absolute;
	    right: 45px; /* 在搜索图标左侧 */
	    top: 50%;
	    transform: translateY(-50%);
	    color: #999;
	    font-size: 20px; /* 稍微增大清空图标 */
	    width: 20px;
	    height: 20px;
	    display: flex;
	    align-items: center;
	    justify-content: center;
	    cursor: pointer;
	    transition: color 0.3s;
	    z-index: 2;
	    line-height: 1;
	}
	
	.clear-icon:active {
		color: #666;
	}
	
	/* 主菜单样式 - 图标样式已修改 */
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
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 5px;
		background: #f8f9fa;
		border-radius: 12px;
		transition: all 0.3s;
	}
	
	.menu-item.active .menu-icon {
		background: #fff2e8;
		color: #ff6b00;
	}
	
	.menu-item:active .menu-icon {
		transform: scale(0.95);
	}
	
	.icon-svg {
		width: 24px;
		height: 24px;
		color: currentColor;
	}
	
	/* 其他样式保持不变 */
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
	    gap: 0;
	    padding: 0;
	    background-color: #f8f9fa;
	}
	
	.post-item {
	    background-color: #fff;
	    border-radius: 0;
	    overflow: hidden;
	    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	    transition: transform 0.3s, box-shadow 0.3s;
	    cursor: pointer;
	    margin: 0;
	    border: 1px solid #f0f0f0;
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
	
	/* 响应式设计 */
	@media (max-width: 480px) {
		.search-section {
			padding: 12px;
		}
		
		.search-box {
			padding: 8px 12px;
		}
		
		.search-box input {
			font-size: 13px;
		}
		
		.search-icon {
			right: 12px;
			width: 18px;
			height: 18px;
		}
		
		.clear-icon {
			right: 35px;
			font-size: 16px;
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
		
		.menu-icon {
			width: 36px;
			height: 36px;
		}
		
		.icon-svg {
			width: 20px;
			height: 20px;
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