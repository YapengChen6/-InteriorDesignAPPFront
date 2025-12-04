<template>
	<view class="container">
		<!-- 顶部个人信息卡片 -->
		<view class="profile-card">
			<!-- 切换角色按钮 -->
			<button class="switch-role-btn" @tap="goToSwitchRole">
				<text class="iconfont icon-user-cog"></text> 切换角色
			</button>
			
			<!-- 角色入住按钮 -->
			<button class="role-checkin-btn" @tap="handleRoleCheckin">
				<text class="iconfont icon-home"></text> 角色入住
			</button>
			
			<view class="profile-header" @tap="goToPersonalCenter">
				<view class="avatar-container">
					<image 
						class="avatar" 
						:src="userInfo.avatar || defaultAvatar" 
						mode="aspectFill"
						@error="onAvatarError"
					></image>
				</view>
				<view class="user-info">
					<view class="user-name">
						<text class="user-name-line">{{ displayUserName }}</text>
						<text class="user-phone-line" v-if="displayUserPhone">{{ displayUserPhone }}</text>
					</view>
					<view class="current-role">
						<text class="iconfont icon-user"></text> {{ currentRoleName }}
					</view>
				</view>
			</view>
		</view>
		
		<!-- 统计信息 -->
		<view class="stats-container">
			<view class="stat-card" @tap="handleStatClick('关注')">
				<text class="stat-number">{{ userStats.follow }}</text>
				<text class="stat-label">关注</text>
			</view>
			<view class="stat-card" @tap="handleStatClick('点赞')">
				<text class="stat-number">{{ userStats.like }}</text>
				<text class="stat-label">点赞</text>
			</view>
			<view class="stat-card" @tap="handleStatClick('收藏')">
				<text class="stat-number">{{ userStats.favorite }}</text>
				<text class="stat-label">收藏</text>
			</view>
			<view class="stat-card" @tap="handleStatClick('发布')">
				<text class="stat-number">{{ userStats.publish }}</text>
				<text class="stat-label">发布</text>
			</view>
		</view>
		
		<!-- 功能菜单 -->
		<view class="menu-container">
			<text class="menu-title">我的功能</text>
			
			<view class="menu-list">
				<!-- 根据当前角色显示不同的功能菜单 -->
				<template v-if="currentRoleType === 'user'">
					<view class="menu-item" @tap="handleMenuClick('查看订单')">
						<view class="menu-item-left">
							<view class="menu-icon orange">
								<image class="menu-icon-img" src="/static/icons/我的订单.svg" mode="aspectFit"></image>
							</view>
							<view class="menu-text">
								<text class="menu-name">查看订单</text>
								<text class="menu-desc">查看购买记录和订单详情</text>
							</view>
						</view>
						<text class="iconfont icon-chevron-right"></text>
					</view>
					
					<view class="menu-item" @tap="handleMenuClick('收货地址')">
						<view class="menu-item-left">
							<view class="menu-icon blue">
								<image class="menu-icon-img" src="/static/icons/收货地址.svg" mode="aspectFit"></image>
							</view>
							<view class="menu-text">
								<text class="menu-name">收货地址</text>
								<text class="menu-desc">管理我的收货地址</text>
							</view>
						</view>
						<text class="iconfont icon-chevron-right"></text>
					</view>
				</template>
				
				<template v-if="currentRoleType === 'designer'">
					<view class="menu-item" @tap="handleMenuClick('我的作品')">
						<view class="menu-item-left">
							<view class="menu-icon blue">
								<text class="iconfont icon-palette"></text>
							</view>
							<view class="menu-text">
								<text class="menu-name">我的作品</text>
								<text class="menu-desc">查看和管理我的创作</text>
							</view>
						</view>
						<text class="iconfont icon-chevron-right"></text>
					</view>
					
					<view class="menu-item" @tap="handleMenuClick('我的订单')">
						<view class="menu-item-left">
							<view class="menu-icon orange">
								<image class="menu-icon-img" src="/static/icons/我的订单.svg" mode="aspectFit"></image>
							</view>
							<view class="menu-text">
								<text class="menu-name">我的订单</text>
								<text class="menu-desc">查看购买记录和订单</text>
							</view>
						</view>
						<text class="iconfont icon-chevron-right"></text>
					</view>
				</template>
				
				<template v-if="currentRoleType === 'material_supplier'">
					<view class="menu-item" @tap="handleMenuClick('产品管理')">
						<view class="menu-item-left">
							<view class="menu-icon blue">
								<text class="iconfont icon-cube"></text>
							</view>
							<view class="menu-text">
								<text class="menu-name">产品管理</text>
								<text class="menu-desc">管理我的产品和库存</text>
							</view>
						</view>
						<text class="iconfont icon-chevron-right"></text>
					</view>
					
					<view class="menu-item" @tap="handleMenuClick('商家页面')">
						<view class="menu-item-left">
							<view class="menu-icon green">
								<image class="menu-icon-img" src="/static/icons/商家页面.svg" mode="aspectFit"></image>
							</view>
							<view class="menu-text">
								<text class="menu-name">商家页面</text>
								<text class="menu-desc">查看和管理商家主页</text>
							</view>
						</view>
						<text class="iconfont icon-chevron-right"></text>
					</view>
					
					<view class="menu-item" @tap="handleMenuClick('我的订单')">
						<view class="menu-item-left">
							<view class="menu-icon orange">
								<image class="menu-icon-img" src="/static/icons/我的订单.svg" mode="aspectFit"></image>
							</view>
							<view class="menu-text">
								<text class="menu-name">我的订单</text>
								<text class="menu-desc">查看和管理商家订单</text>
							</view>
						</view>
						<text class="iconfont icon-chevron-right"></text>
					</view>
				</template>
				
				<template v-if="currentRoleType === 'supervisor'">
					<view class="menu-item" @tap="handleMenuClick('我的订单')">
						<view class="menu-item-left">
							<view class="menu-icon orange">
								<image class="menu-icon-img" src="/static/icons/我的订单.svg" mode="aspectFit"></image>
							</view>
							<view class="menu-text">
								<text class="menu-name">我的订单</text>
								<text class="menu-desc">查看购买记录和订单</text>
							</view>
						</view>
						<text class="iconfont icon-chevron-right"></text>
					</view>
					
					<view class="menu-item" @tap="handleMenuClick('案例管理')">
						<view class="menu-item-left">
							<view class="menu-icon purple">
								<text class="iconfont icon-folder"></text>
							</view>
							<view class="menu-text">
								<text class="menu-name">案例管理</text>
								<text class="menu-desc">管理我的案例作品</text>
							</view>
						</view>
						<text class="iconfont icon-chevron-right"></text>
					</view>
				</template>
			</view>
			
			<text class="menu-title">系统设置</text>
			
			<view class="menu-list">
				<view class="menu-item" @tap="goToPersonalCenter">
					<view class="menu-item-left">
						<view class="menu-icon purple">
							<image class="menu-icon-img" src="/static/icons/个人中心.svg" mode="aspectFit"></image>
						</view>
						<view class="menu-text">
							<text class="menu-name">个人中心</text>
							<text class="menu-desc">修改个人信息</text>
						</view>
					</view>
					<text class="iconfont icon-chevron-right"></text>
				</view>
				
				<!-- 新增举报投诉菜单项 -->
				<view class="menu-item" @tap="handleMenuClick('举报投诉')">
					<view class="menu-item-left">
						<view class="menu-icon red">
							<image class="menu-icon-img" src="/static/icons/举报投诉.svg" mode="aspectFit"></image>
						</view>
						<view class="menu-text">
							<text class="menu-name">举报投诉</text>
							<text class="menu-desc">问题反馈和投诉建议</text>
						</view>
					</view>
					<text class="iconfont icon-chevron-right"></text>
				</view>
				
				<view class="menu-item" @tap="handleMenuClick('隐私与安全')">
					<view class="menu-item-left">
						<view class="menu-icon red">
							<image class="menu-icon-img" src="/static/icons/隐私安全.svg" mode="aspectFit"></image>
						</view>
						<view class="menu-text">
							<text class="menu-name">隐私与安全</text>
							<text class="menu-desc">管理账户安全和隐私设置</text>
						</view>
					</view>
					<text class="iconfont icon-chevron-right"></text>
				</view>
				
				<view class="menu-item" @tap="handleMenuClick('帮助与反馈')">
					<view class="menu-item-left">
						<view class="menu-icon yellow">
							<text class="iconfont icon-question-circle"></text>
						</view>
						<view class="menu-text">
							<text class="menu-name">帮助与反馈</text>
							<text class="menu-desc">获取帮助和提交反馈</text>
						</view>
					</view>
					<text class="iconfont icon-chevron-right"></text>
				</view>
				
				<view class="menu-item" @tap="handleMenuClick('关于我们')">
					<view class="menu-item-left">
						<view class="menu-icon gray">
							<image class="menu-icon-img" src="/static/icons/关于我们.svg" mode="aspectFit"></image>
						</view>
						<view class="menu-text">
							<text class="menu-name">关于我们</text>
							<text class="menu-desc">了解应用信息和版本</text>
						</view>
					</view>
					<text class="iconfont icon-chevron-right"></text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { getUserProfile, updateUserProfile, getCurrentRole } from '@/api/users.js'
	import { getFavorites } from '@/api/social.js'
	import store from "@/store"
	
	export default {
		data() {
			return {
				currentRoleType: 'user', // 使用后端返回的角色类型：user, designer, supervisor, material_supplier
				defaultAvatar: 'https://design.gemcoder.com/staticResource/echoAiSystemImages/378da9ddd57051faab2f02fd247494da.png',
				userInfo: {
					// 初始为空，从接口获取
				},
				userStats: {
					follow: 6,
					like: 13,
					favorite: 0,
					publish: 2
				},
				roleMap: {
					user: {
						name: '普通用户',
						icon: 'icon-user',
						desc: '浏览内容、购买商品'
					},
					designer: {
						name: '设计师',
						icon: 'icon-paint-brush',
						desc: '发布作品、管理内容'
					},
					material_supplier: {
						name: '材料商',
						icon: 'icon-store',
						desc: '管理店铺、处理订单'
					},
					supervisor: {
						name: '监理',
						icon: 'icon-user-check',
						desc: '监督工程、管理案例'
					}
				}
			}
		},
		computed: {
			currentRoleName() {
				return (this.roleMap[this.currentRoleType] && this.roleMap[this.currentRoleType].name) || '普通用户'
			},
			displayUserName() {
				const info = this.userInfo || {}
				return info.nickName || info.nickname || info.userName || info.name || '用户'
			},
			displayUserPhone() {
				const info = this.userInfo || {}
				return info.phone || info.phonenumber || info.mobile || ''
			}
		},
		onLoad() {
			this.loadUserInfo();
			this.loadUserStats();
			this.listenAvatarUpdate();
			this.listenRoleChange();
		},
		onShow() {
			console.log('🔄 我的页面显示，刷新数据');
			this.loadUserInfo();
			this.loadUserStats();
			this.checkRoleUpdate();
		},
		onUnload() {
			uni.$off('avatarUpdated');
			uni.$off('roleChanged');
			uni.$off('userInfoUpdated');
			uni.$off('roleSwitchCompleted');
		},
		methods: {
			// 跳转到切换角色页面
			goToSwitchRole() {
				uni.navigateTo({
					url: '/pages/mine/switch/index'
				});
			},
			
			// 加载用户信息
			async loadUserInfo() {
				try {
					const res = await getUserProfile();
					if (res.code === 200) {
						this.userInfo = res.data;
						
						// 从用户信息中获取当前角色类型
						if (res.data.currentRoleType) {
							this.currentRoleType = res.data.currentRoleType;
							console.log('👤 我的页面设置角色类型:', this.currentRoleType);
						} else {
							// 如果用户信息中没有角色类型，从当前角色接口获取
							await this.loadCurrentRole();
						}
						
						// 更新本地存储
						this.updateLocalStorage();
						
						console.log('👤 我的页面用户信息加载完成:', {
							用户信息: this.userInfo,
							当前角色: this.currentRoleType
						});
					} else {
						console.error('获取用户信息失败:', res.msg)
						this.getAvatarFromStore()
					}
				} catch (error) {
					console.error('获取用户信息失败:', error);
					this.getAvatarFromStore()
					uni.showToast({
						title: '获取用户信息失败',
						icon: 'none'
					});
				}
			},
			
			// 加载用户统计信息（关注、点赞、收藏、发布）
			async loadUserStats() {
				try {
					// 加载收藏数量
					const favoriteRes = await getFavorites({ pageNum: 1, pageSize: 1 });
					if (favoriteRes && favoriteRes.code === 200) {
						// 获取收藏总数
						if (favoriteRes.data && favoriteRes.data.total !== undefined) {
							this.userStats.favorite = favoriteRes.data.total || 0;
						} else if (favoriteRes.data && favoriteRes.data.rows) {
							// 如果返回的是分页数据，需要通过多次请求获取总数，或者使用总数
							this.userStats.favorite = favoriteRes.data.total || favoriteRes.data.rows.length || 0;
						}
						console.log('📊 收藏数量加载完成:', this.userStats.favorite);
					}
					
					// TODO: 可以在这里添加加载关注、点赞、发布数量的逻辑
					// 目前使用默认值
					
				} catch (error) {
					console.error('加载用户统计信息失败:', error);
					// 失败时使用默认值，不显示错误提示
				}
			},
			
			// 加载当前角色信息
			async loadCurrentRole() {
				try {
					const res = await getCurrentRole();
					if (res.code === 200 && res.data) {
						this.currentRoleType = res.data.roleType;
						console.log('👤 我的页面当前角色:', this.currentRoleType);
						
						// 同步到用户信息
						if (this.userInfo) {
							this.userInfo.currentRoleType = this.currentRoleType;
						}
						
						// 更新本地存储
						this.updateLocalStorage();
					}
				} catch (error) {
					console.error('获取当前角色失败:', error);
				}
			},
			
			// 从store获取头像
			getAvatarFromStore() {
				const storeAvatar = store.getters.avatar
				if (storeAvatar) {
					this.userInfo.avatar = storeAvatar
				} else {
					this.userInfo.avatar = this.defaultAvatar
				}
			},
			
			// 监听头像更新事件
			listenAvatarUpdate() {
				uni.$on('avatarUpdated', (avatarUrl) => {
					console.log('🔄 我的页面收到头像更新事件:', avatarUrl)
					this.userInfo.avatar = avatarUrl
					this.$forceUpdate()
					
					// 同时更新store中的用户信息
					const currentUserInfo = store.getters.userInfo
					if (currentUserInfo) {
						const updatedUserInfo = {
							...currentUserInfo,
							avatar: avatarUrl
						}
						store.commit('SET_USER_INFO', updatedUserInfo)
					}
				})
			},
			
			// 监听角色变更事件
			listenRoleChange() {
				// 监听角色变更事件
				uni.$on('roleChanged', (data) => {
					console.log('🔄 我的页面收到角色变更事件:', data);
					this.handleRoleChange(data);
				});
				
				// 监听角色切换完成事件
				uni.$on('roleSwitchCompleted', (data) => {
					console.log('✅ 我的页面收到角色切换完成事件:', data);
					this.handleRoleChange(data);
					// 额外刷新一次用户信息，确保数据最新
					this.loadUserInfo();
				});
				
				// 监听用户信息更新事件
				uni.$on('userInfoUpdated', (data) => {
					console.log('🔄 我的页面收到用户信息更新事件:', data);
					this.handleUserInfoUpdate(data);
				});
			},
			
			// 处理角色变更
			handleRoleChange(data) {
				if (data.roleType) {
					this.currentRoleType = data.roleType;
					console.log('🎯 更新当前角色类型为:', this.currentRoleType);
				}
				
				// 更新用户信息中的角色类型
				if (this.userInfo && data.roleType) {
					this.userInfo.currentRoleType = data.roleType;
				}
				
				// 如果有完整的用户信息，也更新
				if (data.userInfo) {
					this.userInfo = { ...this.userInfo, ...data.userInfo };
				}
				
				// 强制更新视图
				this.$forceUpdate();
				
				// 更新本地存储
				this.updateLocalStorage();
			},
			
			// 处理用户信息更新
			handleUserInfoUpdate(data) {
				if (data.currentRoleType) {
					this.currentRoleType = data.currentRoleType;
				}
				if (data.userInfo) {
					this.userInfo = { ...this.userInfo, ...data.userInfo };
				}
				
				this.$forceUpdate();
				this.updateLocalStorage();
			},
			
			// 更新本地存储
			updateLocalStorage() {
				try {
					// 保存用户信息到本地存储
					if (this.userInfo) {
						uni.setStorageSync('userInfo', this.userInfo);
					}
					// 保存当前角色到本地存储
					uni.setStorageSync('currentRoleType', this.currentRoleType);
				} catch (error) {
					console.error('更新本地存储失败:', error);
				}
			},
			
			// 检查角色更新
			async checkRoleUpdate() {
				try {
					// 从本地存储获取最新的角色信息
					const storedRole = uni.getStorageSync('currentRoleType');
					if (storedRole && storedRole !== this.currentRoleType) {
						console.log('🔄 检测到角色变更，从', this.currentRoleType, '变为', storedRole);
						this.currentRoleType = storedRole;
						if (this.userInfo) {
							this.userInfo.currentRoleType = storedRole;
						}
						this.$forceUpdate();
					}
				} catch (error) {
					console.error('检查角色更新失败:', error);
				}
			},
			
			// 头像加载失败处理
			onAvatarError(e) {
				console.error('头像加载失败:', e)
				this.userInfo.avatar = this.defaultAvatar
				this.$forceUpdate()
			},
			
			// 跳转到个人中心页面
			goToPersonalCenter() {
				uni.navigateTo({
					url: '/pages/mine/personal/index'
				});
			},
			
			// 处理角色入住按钮点击
			handleRoleCheckin() {
				uni.navigateTo({
					url: '/pages/mine/setting/index'
				});
			},
			
			// 处理统计项点击
			handleStatClick(statName) {
				console.log(`点击了统计: ${statName}`);
				
				// 根据统计名称进行路由跳转
				switch(statName) {
					case '关注':
						// 跳转到关注页面
						uni.navigateTo({
							url: '/pages/mine/follows/follows'
						});
						break;
					case '点赞':
						// 跳转到点赞页面
						uni.navigateTo({
							url: '/pages/mine/likes/likes'
						});
						break;
					case '收藏':
						// 跳转到收藏页面
						uni.navigateTo({
							url: '/pages/mine/favorites/favorites'
						});
						break;
					case '发布':
						// 跳转到发布页面
						uni.navigateTo({
							url: '/pages/mine/posted/posted'
						});
						break;
					default:
						break;
				}
			},
			
			// 处理菜单项点击
			handleMenuClick(menuName) {
				console.log(`点击了功能: ${menuName}`);
				
				// 根据菜单名称和当前角色进行路由跳转
				switch(menuName) {
					// 普通用户功能
					case '查看订单':
						uni.navigateTo({
							url: '/pages/mine/viewOrder/viewOrder'
						});
						break;
					case '收货地址':
						uni.navigateTo({
							url: '/pages/mine/address'
						});
						break;
						
					// 设计师功能
					case '我的作品':
						uni.navigateTo({
							url: '/pages/designer/works'
						});
						break;
						
					// 商家功能
					case '产品管理':
						uni.navigateTo({
							url: '/pages/shop/shop'
						});
						break;
					case '商家页面':
						uni.navigateTo({
							url: '/pages/shop/manage'
						});
						break;
					
					// 不同角色的"我的订单"
					case '我的订单':
						// 根据当前角色类型跳转到不同的订单页面
						if (this.currentRoleType === 'material_supplier') {
							// 材料商订单页面
						uni.navigateTo({
							url: '/pages/work/material_supplier-order'
						});
						} else {
							// 其他角色暂时统一跳转到商品订单列表
							uni.navigateTo({
								url: '/pages/mine/viewOrder/viewOrder'
							});
						}
						break;
						
					// 监工功能
					case '案例管理':
						uni.navigateTo({
							url: '/pages/case/manage'
						});
						break;
						
					// 通用功能
					case '举报投诉':
						uni.navigateTo({
							url: '/pages/mine/help/index'
						});
						break;
					case '隐私与安全':
						uni.navigateTo({
							url: '/pages/mine/privacy'
						});
						break;
					case '帮助与反馈':
						uni.navigateTo({
							url: '/pages/mine/help/index'
						});
						break;
					case '关于我们':
						uni.navigateTo({
							url: '/pages/mine/about'
						});
						break;
					default:
						break;
				}
			}
		}
	}
</script>

<style>
	.container {
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
		min-height: 100vh;
		padding: 24rpx;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
	}
	
	/* 个人信息卡片样式 */
	.profile-card {
		background: linear-gradient(135deg, #4A90E2 0%, #5B6EF7 100%);
		border-radius: 40rpx;
		box-shadow: 0 20rpx 60rpx rgba(74, 144, 226, 0.3);
		padding: 48rpx;
		margin-bottom: 48rpx;
		position: relative;
		overflow: hidden;
	}
	
	.profile-card::before {
		content: '';
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
		transform: rotate(30deg);
	}
	
	.profile-header {
		display: flex;
		align-items: center;
		position: relative;
		z-index: 2;
	}
	
	.avatar-container {
		width: 160rpx;
		height: 160rpx;
		border-radius: 50%;
		overflow: hidden;
		border: 8rpx solid rgba(255, 255, 255, 0.3);
		box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
		margin-right: 32rpx;
	}
	
	.avatar {
		width: 100%;
		height: 100%;
	}
	
	.user-info {
		flex: 1;
		color: white;
	}
	
	.user-name {
		display: flex;
		flex-direction: column;
		line-height: 1.2;
	}
	
	.user-name-line {
		font-size: 42rpx;
		font-weight: bold;
	}
	
	.user-phone-line {
		font-size: 28rpx;
		opacity: 0.85;
		margin-top: 8rpx;
	}
	
	.current-role {
		font-size: 24rpx;
		opacity: 0.8;
		display: flex;
		align-items: center;
	}
	
	/* 切换角色按钮样式 */
	.switch-role-btn {
		position: absolute;
		top: 40rpx;
		right: 40rpx;
		background: rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(20rpx);
		color: white;
		border: none;
		padding: 16rpx 24rpx;
		border-radius: 40rpx;
		font-size: 24rpx;
		display: flex;
		align-items: center;
		z-index: 5;
	}
	
	/* 角色入住按钮样式 */
	.role-checkin-btn {
		position: absolute;
		top: 150rpx;
		right: 40rpx;
		background: rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(20rpx);
		color: white;
		border: none;
		padding: 16rpx 24rpx;
		border-radius: 40rpx;
		font-size: 24rpx;
		display: flex;
		align-items: center;
		z-index: 5;
	}
	
	/* 统计卡片样式 */
	.stats-container {
		display: flex;
		justify-content: space-between;
		margin-bottom: 64rpx;
	}
	
	.stat-card {
	    background: linear-gradient(135deg, #f0fff3, #e6fff0); /* 浅绿色渐变 */
	    border-radius: 32rpx;
	    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.05);
	    padding: 32rpx;
	    text-align: center;
	    flex: 1;
	    margin: 0 16rpx;
	    transition: all 0.3s;
	}
	
	.stat-card:first-child {
		margin-left: 0;
	}
	
	.stat-card:last-child {
		margin-right: 0;
	}
	
	.stat-number {
		display: block;
		font-size: 52rpx;
		font-weight: bold;
		color: #4A90E2;
	}
	
	.stat-label {
		display: block;
		font-size: 28rpx;
		color: #86909C;
		margin-top: 8rpx;
	}
	
	/* 菜单样式 */
	.menu-container {
		margin-bottom: 120rpx;
	}
	
	.menu-title {
		display: block;
		font-size: 28rpx;
		color: #86909C;
		font-weight: 500;
		margin-bottom: 32rpx;
	}
	
	.menu-list {
		margin-bottom: 48rpx;
	}
	
	.menu-item {
		background: white;
		border-radius: 24rpx;
		padding: 32rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 24rpx;
		transition: all 0.3s;
	}
	
	.menu-item-left {
		display: flex;
		align-items: center;
		flex: 1;
	}
	
	.menu-icon {
		width: 96rpx;
		height: 96rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 32rpx;
	}
	
	.menu-icon.blue {
		background: rgba(74, 144, 226, 0.1);
		color: #4A90E2;
	}
	
	.menu-icon.orange {
		background: rgba(255, 125, 0, 0.1);
		color: #FF7D00;
	}
	
	.menu-icon.purple {
		background: rgba(128, 90, 213, 0.1);
		color: #805AD5;
	}
	
	.menu-icon.red {
		background: rgba(229, 62, 62, 0.1);
		color: #E53E3E;
	}
	
	.menu-icon.yellow {
		background: rgba(236, 201, 75, 0.1);
		color: #ECC94B;
	}
	
	.menu-icon.gray {
		background: rgba(160, 174, 192, 0.1);
		color: #A0AEC0;
	}
	
	.menu-icon.green {
		background: rgba(56, 161, 105, 0.1);
		color: #38A169;
	}
	
	.menu-text {
		flex: 1;
	}
	
	.menu-name {
		display: block;
		font-size: 32rpx;
		font-weight: 500;
		margin-bottom: 8rpx;
	}
	
	.menu-desc {
		display: block;
		font-size: 24rpx;
		color: #86909C;
	}
	
	/* 图标字体样式 */
	.iconfont {
		font-family: "iconfont" !important;
		font-size: inherit;
		font-style: normal;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}
	
	.icon-user-cog:before { content: "\e619"; }
	.icon-user:before { content: "\e602"; }
	.icon-palette:before { content: "\e603"; }
	.icon-shopping-cart:before { content: "\e604"; }
	.icon-cog:before { content: "\e605"; }
	.icon-shield-alt:before { content: "\e606"; }
	.icon-question-circle:before { content: "\e607"; }
	.icon-info-circle:before { content: "\e608"; }
	.icon-chevron-right:before { content: "\e609"; }
	.icon-arrow-left:before { content: "\e60a"; }
	.icon-camera:before { content: "\e60b"; }
	.icon-plus:before { content: "\e60c"; }
	.icon-paint-brush:before { content: "\e60d"; }
	.icon-store:before { content: "\e60e"; }
	.icon-flag:before { content: "\e60f"; }
	.icon-map-marker:before { content: "\e610"; }
	.icon-home:before { content: "\e611"; }
	.icon-cube:before { content: "\e612"; }
	.icon-folder:before { content: "\e613"; }
	.icon-user-check:before { content: "\e614"; }
	
	/* SVG图标样式 */
	.menu-icon-img {
		width: 48rpx;
		height: 48rpx;
	}
</style>