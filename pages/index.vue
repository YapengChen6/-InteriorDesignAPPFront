<template>
	<view class="container">
		<!-- 顶部搜索区域 - 修改后的合并样式 -->
		<view class="search-section">
			<view class="combined-search-container">
				<!-- 合并的搜索框：左侧定位 + 分隔线 + 右侧搜索 -->
				<view class="combined-search-box">
					<!-- 定位区域 -->
					<view class="location-part" @click="goToLocationPage">
						<view class="location-content">
							<!-- 修改后的位置图标 -->
							<view class="location-icon">
								<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" class="location-svg">
									<path d="M512 64C306.4 64 140 230.4 140 436c0 101.6 40.8 194.4 107.2 261.6L512 960l264-263.2c66.4-67.2 107.2-159.2 107.2-261.6C884 230.4 717.6 64 512 64z m128 331.2c-4.8 62.4-54.4 112-116.8 116.8-75.2 6.4-138.4-53.6-138.4-127.2 0-70.4 57.6-128 128-128 73.6 0 133.6 63.2 127.2 138.4z" fill="currentColor"></path>
								</svg>
							</view>
							<text class="location-text">{{ locationText }}</text>
							<text class="location-arrow">▼</text>
						</view>
					</view>
					
					<!-- 分隔线 -->
					<view class="divider"></view>
					
					<!-- 搜索区域 -->
					<view class="search-part">
						<view class="search-content">
							<input 
								type="text" 
								placeholder="搜索装修相关内容" 
								v-model="searchKeyword" 
								@confirm="onSearch"
								class="search-input"
							>
							<text 
								v-if="searchKeyword" 
								class="clear-icon" 
								@click="clearSearch"
							>×</text>
							<!-- 修改后的搜索图标，放在右侧 -->
							<view class="search-icon" @click="onSearch">
								<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" class="search-svg">
									<path d="M446.112323 177.545051c137.567677 0.219798 252.612525 104.59798 266.162424 241.493333 13.562828 136.895354-78.778182 261.818182-213.617777 289.008485-134.852525 27.203232-268.386263-52.156768-308.945455-183.608889s25.018182-272.252121 151.738182-325.779394A267.235556 267.235556 0 0 1 446.112323 177.545051m0-62.060607c-182.794343 0-330.989899 148.195556-330.989899 330.989899s148.195556 330.989899 330.989899 330.989899 330.989899-148.195556 330.989899-330.989899-148.195556-330.989899-330.989899-330.989899z m431.321212 793.341415a30.849293 30.849293 0 0 1-21.94101-9.102223l-157.220202-157.220202c-11.752727-12.179394-11.584646-31.534545 0.37495-43.50707 11.972525-11.972525 31.327677-12.140606 43.494141-0.37495l157.220202 157.220202a31.036768 31.036768 0 0 1 6.723232 33.810101 31.004444 31.004444 0 0 1-28.651313 19.174142z m0 0" fill="currentColor"></path>
								</svg>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 主菜单 -->
		<view class="main-menu">
			<view class="menu-item" :class="{ active: activeMainMenu === 0 }" @click="goToOrderHall()">
				<view class="menu-icon">
					<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" class="menu-svg">
						<path d="M371.258027 899.185778H111.446471a37.376 37.376 0 0 1-38.115555-38.286222V111.900444c0-21.788444 16.384-38.286222 38.115555-38.286222H707.698916c21.731556 0 38.115556 16.497778 38.115555 38.286222v225.28c0 20.935111 15.758222 36.750222 36.693333 36.750223a35.896889 35.896889 0 0 0 36.636445-36.807111v-225.28c0-29.980444-11.605333-58.083556-32.483556-79.189334A110.421333 110.421333 0 0 0 707.698916 0H111.50336A111.388444 111.388444 0 0 0 0.001138 111.900444v748.999112c0 30.037333 11.605333 58.140444 32.483555 79.246222 21.048889 21.162667 49.038222 32.654222 78.961778 32.654222h261.688889a35.896889 35.896889 0 0 0 36.693333-36.807111c0-20.536889-16.952889-36.807111-38.570666-36.807111z" fill="currentColor"></path>
						<path d="M400.043804 510.293333c0-20.48-16.213333-35.953778-37.831111-35.953777H191.432249c-21.617778 0-37.831111 15.473778-37.831111 35.953777 0 20.536889 16.270222 35.953778 37.831111 35.953778h170.894222c20.821333 0 37.717333-16.099556 37.717333-35.953778z m-208.611555 184.149334c-21.617778 0-37.831111 15.473778-37.831111 35.953777 0 20.536889 16.270222 36.010667 37.831111 36.010667h115.825778c21.560889 0 37.831111-15.473778 37.831111-36.010667 0-20.48-16.270222-35.953778-37.831111-35.953777H191.432249z m498.915555-402.488889c0-20.48-16.213333-35.953778-37.774222-35.953778H191.432249c-21.617778 0-37.831111 15.473778-37.831111 35.953778 0 20.536889 16.270222 35.953778 37.831111 35.953778h461.141333c19.854222 0 37.831111-17.066667 37.831111-35.953778zM657.80736 432.753778c8.931556 0 17.976889 0.455111 27.875556 1.422222 70.030222 6.712889 132.209778 37.831111 175.217777 87.722667a235.121778 235.121778 0 0 1 55.637334 180.508444c-3.356444 41.358222-19.342222 82.944-46.307556 120.149333l-1.706667 2.275556L1024.001138 965.632v0.910222L965.291804 1024h-0.910222l-157.468444-142.677333-2.332445 1.592889a258.048 258.048 0 0 1-140.288 40.448c-9.272889 0-19.171556-0.568889-30.037333-1.649778-69.973333-6.712889-132.209778-37.831111-175.104-87.722667a235.121778 235.121778 0 0 1-55.751111-180.451555 242.574222 242.574222 0 0 1 82.773333-158.72c46.535111-39.992889 107.463111-62.065778 171.633778-62.065778z m3.811556 79.530666c-88.519111 0-164.522667 65.080889-173.112889 148.195556-9.329778 90.908444 60.302222 171.975111 154.908444 180.792889 5.347556 0.568889 11.150222 0.796444 16.668445 0.796444 88.689778 0 164.807111-65.080889 173.397333-148.195555 9.102222-90.794667-60.302222-171.861333-154.908445-180.792889-5.688889-0.568889-11.377778-0.796444-16.952888-0.796445z" fill="currentColor"></path>
					</svg>
				</view>
				<text>订单大厅</text>
			</view>
			<view class="menu-item" 
			      :class="{ active: activeMainMenu === 1 }" 
			      @click="goToShopPage()">
				<view class="menu-icon">
					<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" class="menu-svg">
						<path d="M504.384 154.608l-348.8 235.808a8.192 8.192 0 0 0-3.584 6.784v214.08a28 28 0 0 1-56 0v-214.08c0-21.84 10.736-42.24 28.608-54.304L477.76 104.16a47.264 47.264 0 0 1 52.352-0.48l368.32 239.328A65.488 65.488 0 0 1 928 397.968v469.184C928 903.152 899.36 928 864 928H490.352a26.352 26.352 0 1 1 0-52.704H864c4.416 0 8-3.648 8-8.144V397.968a8.192 8.192 0 0 0-3.696-6.88L504.384 154.624z m53.216 101.44l259.168 171.872-0.688 301.888a64 64 0 0 1-64 63.856H455.024a48 48 0 0 1-36.8-17.184l-78.576-93.888a116.784 116.784 0 0 0-91.184-41.824l-23.088 0.32a32 32 0 0 1-32.448-31.984l-0.032-165.184 275.504-187.36a80 80 0 0 1 89.2-0.512z m113.008 377.6H667.2l33.952-141.84a16 16 0 0 0-13.824-19.632l-290.576-31.728-3.792-27.696c-1.008-7.2-6.816-12.512-13.328-12.592a14.032 14.032 0 0 0-2.272-0.16h-42.672c-8.048 0-14.688 5.808-14.688 12.96 0 7.104 6.592 12.96 14.688 12.96h33.456l32.448 220.928c1.04 7.52 7.296 12.992 14.192 12.592l255.856 0.032c8.096 0 14.688-5.808 14.688-12.864-0.032-7.152-6.672-12.96-14.72-12.96z m-168.32 71.744a30.56 30.56 0 0 0-30.496-30.608 30.56 30.56 0 0 0-30.512 30.608c0 16.912 13.632 30.608 30.512 30.608a30.56 30.56 0 0 0 30.496-30.608z m152.544 0a30.56 30.56 0 0 0-30.512-30.608 30.56 30.56 0 0 0-30.512 30.608c0 16.912 13.648 30.608 30.512 30.608a30.56 30.56 0 0 0 30.512-30.608z m-355.744 72.64l-51.84-54.816a26.352 26.352 0 0 1 0.112-36.32 23.84 23.84 0 0 1 34.544 0.112l97.344 102.912c3.568 3.776 4.96 8.832 4.16 13.6a16 16 0 0 1-4.08 14.048l-97.344 102.928a23.84 23.84 0 0 1-34.544 0.096 26.352 26.352 0 0 1-0.096-36.32l52.048-55.04H121.616a25.6 25.6 0 1 1 0-51.2h177.472z" fill="currentColor"></path>
					</svg>
				</view>
				<text>购买居家建材</text>
			</view>
			<view class="menu-item" 
			      :class="{ active: activeMainMenu === 2 }" 
			      @click="goToFindDesigner()">
				<view class="menu-icon">
					<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" class="menu-svg">
						<path d="M240.128 386.048c4.096 33.792 23.552 63.488 51.2 78.848 18.944 53.76 46.08 101.888 76.8 136.704 40.96 46.592 90.112 71.168 141.824 71.168 3.072 0 6.656 0 9.728-0.512 55.296-3.072 104.448-30.208 145.92-79.36 35.328-42.496 58.88-94.208 72.704-133.12 20.992-9.728 36.352-28.672 41.984-54.272 7.68-32.768-2.048-69.632-23.552-93.696 3.072-51.2 22.528-82.432 26.112-136.704 3.584-53.76-14.336-113.152-88.064-146.432-44.032-19.968-143.36-29.696-195.072-28.16C449.024 1.536 348.16 18.944 307.2 45.568c-36.352 24.064-54.784 57.856-61.44 111.616-5.12 43.008 9.728 111.104 14.336 160.256-15.36 16.896-23.04 41.472-19.968 68.608z" fill="currentColor"></path>
						<path d="M935.936 854.016c-14.848-39.424-36.864-73.728-65.536-101.376-48.64-47.104-117.76-76.8-211.456-91.648l-13.312-2.048-7.168 13.312c-18.432 33.792-32.768 70.656-46.592 105.472-5.12 13.312-10.24 26.112-15.36 38.4 0-13.312 0-29.184-0.512-47.616v-57.856h-133.12l1.024 26.112c1.536 29.696 2.56 51.2 3.072 68.096-17.92-46.592-36.864-93.184-60.928-133.632l-7.168-12.288-12.288 2.048C272.896 675.84 204.8 705.536 156.16 752.64c-28.16 27.648-50.176 61.44-65.024 100.864-15.872 41.472-24.576 90.112-25.6 144.896l-0.512 25.088h894.464v-24.576c-0.512-54.272-8.192-103.424-23.552-144.896z" fill="currentColor"></path>
					</svg>
				</view>
				<text>找设计师</text>
			</view>
			<view class="menu-item" 
			      :class="{ active: activeMainMenu === 3 }" 
			      @click="goToFindSupervisor()">
				<view class="menu-icon">
					<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" class="menu-svg">
						<path d="M724.052862 234.795444c0-137.524627-187.279041-206.281467-187.279041-206.281467-26.524092-11.944173-52.851142-9.223286-79.979741 0 0 0-187.286339 60.371592-187.286339 206.281467 0 21.81332-39.589704 17.130523-52.689373 86.131841h559.940895c-23.836045-69.478112-52.706401-64.318521-52.706401-86.131841" fill="currentColor"></path>
						<path d="M258.665545 718.423775C172.778182 761.933649 99.494233 818.668472 99.494233 874.88393v29.218221c0 60.26699 158.99738 112.098863 158.99738 112.098863l62.095105-7.77101-6.148452 0.160553c0 0.001216-51.612938-292.269783-55.772721-290.166782zM837.690359 784.676231h-119.90758a5551.132352 5551.132352 0 0 0-6.520643 35.078407h135.452033c10.847061 0 19.639772 16.658594 19.639773 37.2106 0 20.554438-8.792712 37.217898-19.639773 37.217898H697.944748c-1.573906 8.949616-3.110107 17.730164-4.585492 26.196904h45.115405c10.847061 0 19.639772 16.658594 19.639772 37.214249 0 20.550789-8.792712 37.215465-19.639772 37.215465h-57.934106c-1.357403 7.980216-2.128544 12.543815-2.128544 12.543815l-13.282115 0.356379c1.536201 0.184879 2.368157 0.289482 2.368157 0.289482l66.048116 8.39741s158.512072-51.805115 158.512071-112.292256v-29.218221c0-31.039038-21.150431-61.773999-54.367881-90.210132zM320.586718 1008.43122l16.678055-0.433006-0.225017-1.543499c-8.180907 0.942641-12.985335 1.543499-12.985336 1.543499l-3.467702 0.433006z" fill="currentColor"></path>
						<path d="M653.068957 957.593073c0-16.769279 5.855321-30.944166 13.902434-35.596556 1.297804-8.948399 2.64426-18.272639 4.012609-27.814598h-106.515996c-10.845844 0-19.638556-16.662243-19.638556-37.217898 0-20.550789 8.792712-37.2106 19.638556-37.2106h116.956809c1.655399-12.133918 3.23782-23.936999 4.692528-35.078406H475.864619c-10.845844 0-19.638556-16.662243-19.638556-37.214249 0-20.554438 8.792712-37.213033 19.638556-37.213033h189.265277v-13.110615c-20.527679-9.113818-20.120215-15.696492-40.615054-22.472561-5.777477-1.871903-42.066113-18.18993-19.374617-86.995422h-0.308943C641.988364 549.490351 678.566483 512.796684 693.053962 453.550179l17.028353-92.723031H297.049885c0 119.672831 36.603661 172.741693 90.336629 227.517039 23.201131 60.65256-18.272639 83.176206-26.947369 86.337398-23.38601 8.436333-39.027768 18.626585-62.801781 29.500406-4.291145 1.965558 36.031995 279.154303 39.402392 302.27394 30.243571-3.483514 106.787233-11.666854 158.737089-11.666854 52.022834 0 128.521493 8.182124 158.744387 11.666854 0.496255-3.309582 1.773381-11.831056 3.578387-23.996598-3.127135-6.591189-5.030662-15.306057-5.030662-24.86626z" fill="currentColor"></path>
						<path d="M907.039542 729.10785H720.188642V536.259321c0-9.646562-7.818447-8.514176-17.462576-8.514176-9.647778 0-16.607509 0.083925-16.607509 9.730487l-0.864797 191.632218H498.407725c-9.645346 0-17.463792 7.819663-17.463792 17.466225 0 9.646562 7.819663 17.466225 17.463792 17.466225h408.631817c9.647778 0 17.467441-7.820879 17.467441-17.466225 0-9.646562-7.820879-17.466225-17.467441-17.466225zM828.951165 840.007431H585.429907c-9.358296 0-16.945644 7.819663-16.945644 17.465008 0 9.647778 7.586131 17.467441 16.945644 17.467442h243.521258c9.358296 0 16.945644-7.820879 16.945643-17.467442-0.001216-9.646562-7.587348-17.465008-16.945643-17.465008zM725.159705 940.280103h-41.050494c-6.769987 0-12.259198 7.820879-12.259197 17.466225s5.489211 17.467441 12.259197 17.467441h41.050494c6.769987 0 12.259198-7.822096 12.259198-17.467441 0-9.646562-5.489211-17.466225-12.259198-17.466225z" fill="currentColor"></path>
					</svg>
				</view>
				<text>找监工</text>
			</view>
			<view class="menu-item" :class="{ active: activeMainMenu === 4 }" @click="activeMainMenu = 4">
				<view class="menu-icon">
					<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" class="menu-svg">
						<path d="M820.515051 129.292692C806.439474 114.951055 787.336394 106.896612 767.423879 106.910938H432.682002s-14.06739 0.202615-28.031427 10.856256c-13.967106 10.653641-11.062963 23.652699-11.062963 23.652699V279.099602s1.550309 13.20372-10.413164 27.322276c-11.964496 14.120602-29.78435 16.517185-29.78435 16.517185H226.190067s-21.273513-1.121544-31.236422 6.881734c-9.960863 8.003278-13.414521 28.952402-13.414521 28.952403V840.628646c0 42.228777 33.617655 76.460416 75.087139 76.460416h510.74645c41.47153 0 75.087139-34.231639 75.087139-76.460416V183.371354c0.027629-20.278859-7.867178-39.733956-21.944801-54.078662zM463.969589 402.609591h212.747405c10.368138 0 18.772552 8.55791 18.772552 19.115359s-8.404414 19.11536-18.772552 19.11536H463.969589c-10.368138 0-18.772552-8.55791-18.772553-19.11536s8.404414-19.11536 18.772553-19.115359z m212.847689 308.494073h-332.789409c-10.368138 0-18.772552-8.55791-18.772552-19.11536s8.404414-19.11536 18.772552-19.11536h332.788386c10.368138 0 18.772552 8.55791 18.772552 19.11536 0.001023 10.55745-8.403391 19.11536-18.771529 19.11536z m0-132.583645h-332.789409c-10.368138 0-18.772552-8.55791-18.772552-19.113313 0-10.55745 8.404414-19.11536 18.772552-19.11536h332.788386c10.368138 0 18.772552 8.55791 18.772552 19.11536 0.001023 10.555403-8.403391 19.113313-18.771529 19.113313zM212.874807 283.891745h104.021122s37.545104-9.583263 34.440393-46.998407l0.750083-104.343463s-0.750083-26.251897-16.367782-10.346649c-15.618723 15.903202-131.404796 137.016607-131.404796 137.016607s-24.27794 24.671912 8.560980 24.671912z" fill="currentColor"></path>
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
					<!-- 图片区域 -->
					<view class="post-image-container">
						<image 
							:src="getPostImageUrl(post)" 
							mode="aspectFill" 
							class="post-image"
							@error="handleImageError(post, $event)"
							@load="handleImageLoad(post)"
							@click.stop="previewImage(post)"
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
	getImagesByRelatedInfo,
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
			loadingImageDetails: new Set(), // 正在加载的图片详情,
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
		
		// 查看帖子详情
		async viewPostDetail(id) {
			try {
				console.log('📖 查看帖子详情，ID:', id);
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
		
		// 获取帖子图片URL - 使用 cover_url
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
					// 如果没有mediaId，尝试通过其他方式获取图片信息
					this.loadImageInfoByOtherMethods(post, imageUrl);
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
		
		// 通过其他方式获取图片信息
		async loadImageInfoByOtherMethods(post, imageUrl) {
			try {
				console.log(`🔄 通过其他方式获取图片信息:`, imageUrl);
				
				// 方法1: 通过关联信息查询
				if (post.id) {
					const relatedType = this.getRelatedTypeByPostType(post.threadType);
					const response = await getImagesByRelatedInfo(relatedType, post.id);
					
					if (response && response.code === 200) {
						let imageList = [];
						
						// 提取图片列表
						if (Array.isArray(response.data)) {
							imageList = response.data;
						} else if (response.data && Array.isArray(response.data.rows)) {
							imageList = response.data.rows;
						} else if (response.data && Array.isArray(response.data.list)) {
							imageList = response.data.list;
						}
						
						// 查找匹配的图片
						const matchedImage = imageList.find(img => 
							img.fileUrl === imageUrl || 
							this.isSameImage(img.fileUrl, imageUrl)
						);
						
						if (matchedImage) {
							const processedDetail = this.processImageDetail(matchedImage);
							this.$set(post, 'imageDetail', processedDetail);
							this.$set(post, 'imageDetailLoaded', true);
							return;
						}
					}
				}
				
				// 方法2: 创建基本的图片信息
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
				console.error(`❌ 通过其他方式获取图片信息失败:`, error);
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
		
		// 判断是否是同一张图片
		isSameImage(url1, url2) {
			// 简单的URL比较逻辑
			if (!url1 || !url2) return false;
			
			// 移除查询参数后比较
			const cleanUrl1 = url1.split('?')[0];
			const cleanUrl2 = url2.split('?')[0];
			
			return cleanUrl1 === cleanUrl2;
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
		
		// 根据帖子类型获取关联类型
		getRelatedTypeByPostType(threadType) {
			// 这里需要根据您的业务逻辑映射
			// 假设帖子类型和关联类型的对应关系
			const typeMapping = {
				1: 1, // 作品集 -> 设计作品
				2: 2, // 案例集 -> 装修案例  
				3: 3, // 普通帖 -> 社区帖子
				4: 4  // 材料展示 -> 材料展示
			};
			
			return typeMapping[threadType] || 3;
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
	.container {
		max-width: 750px;
		margin: 0 auto;
		background-color: #f8f9fa;
		min-height: 100vh;
		position: relative;
		padding-bottom: 60px; /* 为底部开关留出空间 */
	}
	
	/* 修改后的顶部搜索区域样式 */
	.search-section {
		padding: 15px;
		background-color: #fff;
		border-bottom: 1px solid #eee;
	}
	
	.combined-search-container {
		width: 100%;
	}
	
	/* 合并的搜索框 */
	.combined-search-box {
		display: flex;
		align-items: center;
		background-color: #f8f9fa;
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid #e9ecef;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
		transition: all 0.3s ease;
	}
	
	.combined-search-box:focus-within {
		background-color: #fff;
		border-color: #ff6b00;
		box-shadow: 0 4px 12px rgba(255, 107, 0, 0.15);
	}
	
	/* 定位部分 */
	.location-part {
		flex: 0 0 auto;
		padding: 0 12px;
		cursor: pointer;
		transition: background-color 0.2s;
	}
	
	.location-part:active {
		background-color: #e9ecef;
	}
	
	.location-content {
		display: flex;
		align-items: center;
		padding: 10px 0;
		min-width: 80px;
	}
	
	.location-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 6px;
	}
	
	.location-svg {
		width: 16px;
		height: 16px;
		color: #ff6b00; /* 位置图标颜色 */
	}
	
	.location-text {
		font-size: 14px;
		color: #333;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 70px;
		font-weight: 500;
	}
	
	.location-arrow {
		font-size: 10px;
		color: #999;
		margin-left: 4px;
		margin-top: 1px;
	}
	
	/* 分隔线 */
	.divider {
		width: 1px;
		height: 24px;
		background-color: #e0e0e0;
		flex: 0 0 auto;
	}
	
	/* 搜索部分 */
	.search-part {
		flex: 1;
		padding: 0 12px;
	}
	
	.search-content {
		display: flex;
		align-items: center;
		position: relative;
		padding: 10px 0;
	}
	
	.search-input {
		flex: 1;
		border: none;
		background: transparent;
		outline: none;
		font-size: 14px;
		color: #333;
		line-height: 1.4;
		padding-right: 8px;
	}
	
	.search-input::placeholder {
		color: #999;
	}
	
	.clear-icon {
		color: #999;
		font-size: 18px;
		padding: 2px;
		cursor: pointer;
		transition: color 0.3s;
		flex: 0 0 auto;
		margin-right: 8px;
	}
	
	.clear-icon:active {
		color: #666;
		background-color: #f0f0f0;
		border-radius: 50%;
	}
	
	/* 搜索图标 - 放在右侧 */
	.search-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		transition: background-color 0.2s;
	}
	
	.search-icon:active {
		background-color: #f0f0f0;
	}
	
	.search-svg {
		width: 18px;
		height: 18px;
		color: #999; /* 搜索图标颜色 */
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
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		margin-bottom: 5px;
	}
	
	.menu-svg {
		width: 100%;
		height: 100%;
		color: #333; /* 矢量图颜色保持黑色 */
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
	
	/* 小红书风格帖子列表 */
	.post-container.xhs-style {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 10px;
		padding: 15px;
		background-color: #f8f9fa;
	}
	
	.post-item {
		background-color: #fff;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
		transition: transform 0.3s, box-shadow 0.3s;
		cursor: pointer;
	}
	
	.post-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
	
	/* 图片容器 */
	.post-image-container {
		position: relative;
		width: 100%;
		height: 0;
		padding-bottom: 133.33%; /* 3:4 宽高比 */
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
	
	/* 图片角标 */
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
	
	/* 多图指示器 */
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
	
	/* 图片详情信息 */
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
	
	/* 图片加载状态 */
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
	
	/* 重试按钮样式 */
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
	
	/* 无图片状态 */
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
	
	/* 内容区域 */
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
	
	/* 用户信息和互动数据 */
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
	
	/* 图片信息显示开关 */
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
	
	/* 响应式调整 */
	@media (max-width: 480px) {
		.search-section {
			padding: 12px;
		}
		
		.location-content {
			min-width: 70px;
			padding: 8px 0;
		}
		
		.location-text {
			font-size: 13px;
			max-width: 60px;
		}
		
		.location-svg {
			width: 14px;
			height: 14px;
		}
		
		.search-content {
			padding: 8px 0;
		}
		
		.search-input {
			font-size: 13px;
		}
		
		.search-svg {
			width: 16px;
			height: 16px;
		}
		
		.clear-icon {
			font-size: 16px;
			margin-right: 6px;
		}
		
		.location-part,
		.search-part {
			padding: 0 10px;
		}
		
		.divider {
			height: 20px;
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
		
		.menu-icon {
			width: 28px;
			height: 28px;
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
			max-width: 50px;
			font-size: 12px;
		}
		
		.location-content {
			min-width: 60px;
		}
		
		.location-part,
		.search-part {
			padding: 0 8px;
		}
		
		.tab-item {
			padding: 10px 10px;
			font-size: 13px;
		}
		
		.tab-item.active::after {
			left: 10px;
			right: 10px;
		}
		
		.menu-icon {
			width: 26px;
			height: 26px;
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