<template>
	<view class="container">
		<!-- 个人中心页面 -->
		<view v-if="currentPage === 'profile'">
			<!-- 顶部个人信息卡片 -->
			<view class="profile-card">
				<!-- 切换角色按钮 - 修改为跳转页面 -->
				<button class="switch-role-btn" @tap="goToRoleSwitch">
					<text class="iconfont icon-user-cog"></text> 切换角色
				</button>
				
				<!-- 角色入住按钮 -->
				<button class="role-checkin-btn" @tap="handleRoleCheckin">
					<text class="iconfont icon-home"></text> 角色入住
				</button>
				
				<view class="profile-header" @tap="goToPersonalCenter">
					<view class="avatar-container">
						<image class="avatar" :src="userInfo.avatar || defaultAvatar" mode="aspectFill"></image>
					</view>
					<view class="user-info">
						<text class="user-name">{{ userInfo.nickName || userInfo.userName || '用户' }}</text>
						<text class="user-phone">{{ userInfo.phone || '未绑定手机号' }}</text>
						<view class="badge-container" v-if="userInfo.warrantyDays">
							<text class="badge">入质保</text>
							<text class="warranty-text">质保还剩{{ userInfo.warrantyDays }}天</text>
						</view>
						<view class="current-role">
							<text class="iconfont icon-user"></text> {{ userInfo.role || '个人用户' }}
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
				<view class="stat-card" @tap="handleStatClick('发布')">
					<text class="stat-number">{{ userStats.publish }}</text>
					<text class="stat-label">发布</text>
				</view>
			</view>
			
			<!-- 功能菜单 -->
			<view class="menu-container">
				<text class="menu-title">我的功能</text>
				
				<view class="menu-list">
					<view class="menu-item" @tap="handleMenuClick('查看订单')">
						<view class="menu-item-left">
							<view class="menu-icon orange">
								<text class="iconfont icon-shopping-cart"></text>
							</view>
							<view class="menu-text">
								<text class="menu-name">查看订单</text>
								<text class="menu-desc">查看购买记录和订单详情</text>
							</view>
						</view>
						<text class="iconfont icon-chevron-right"></text>
					</view>
					
					<view class="menu-item" @tap="handleMenuClick('举报投诉')">
						<view class="menu-item-left">
							<view class="menu-icon red">
								<text class="iconfont icon-flag"></text>
							</view>
							<view class="menu-text">
								<text class="menu-name">举报投诉</text>
								<text class="menu-desc">问题反馈和投诉建议</text>
							</view>
						</view>
						<text class="iconfont icon-chevron-right"></text>
					</view>
					
					<view class="menu-item" @tap="handleMenuClick('收货地址')">
						<view class="menu-item-left">
							<view class="menu-icon blue">
								<text class="iconfont icon-map-marker"></text>
							</view>
							<view class="menu-text">
								<text class="menu-name">收货地址</text>
								<text class="menu-desc">管理我的收货地址</text>
							</view>
						</view>
						<text class="iconfont icon-chevron-right"></text>
					</view>
				</view>
				
				<text class="menu-title">系统设置</text>
				
				<view class="menu-list">
					<view class="menu-item" @tap="goToPersonalCenter">
						<view class="menu-item-left">
							<view class="menu-icon purple">
								<text class="iconfont icon-cog"></text>
							</view>
							<view class="menu-text">
								<text class="menu-name">个人中心</text>
								<text class="menu-desc">修改个人信息</text>
							</view>
						</view>
						<text class="iconfont icon-chevron-right"></text>
					</view>
					
					<view class="menu-item" @tap="handleMenuClick('隐私与安全')">
						<view class="menu-item-left">
							<view class="menu-icon red">
								<text class="iconfont icon-shield-alt"></text>
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
								<text class="iconfont icon-info-circle"></text>
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
			
			<!-- 浮动操作按钮 -->
			<view class="floating-action" @tap="handleFloatingAction">
				<text class="iconfont icon-plus"></text>
			</view>
		</view>
		
		<!-- 编辑资料页面 -->
		<view v-if="currentPage === 'edit'">
			<!-- 顶部导航 -->
			<view class="edit-header">
				<button class="back-button" @tap="goBack">
					<text class="iconfont icon-arrow-left"></text>
				</button>
				<text class="edit-title">编辑个人信息</text>
				<view class="placeholder"></view>
			</view>
			
			<view class="edit-form">
				<view class="avatar-upload">
					<view class="avatar-preview">
						<image class="avatar" :src="editForm.avatar || defaultAvatar" mode="aspectFill"></image>
					</view>
					<button class="change-avatar-btn" @tap="changeAvatar">
						<text class="iconfont icon-camera"></text> 更换头像
					</button>
				</view>
				
				<view class="form-group">
					<text class="form-label">姓名</text>
					<input class="form-input" type="text" v-model="editForm.nickName" placeholder="请输入姓名" />
				</view>
				
				<view class="form-group">
					<text class="form-label">手机号</text>
					<input class="form-input" type="tel" v-model="editForm.phonenumber" placeholder="请输入手机号" />
				</view>
				
				<view class="form-group">
					<text class="form-label">所在城市</text>
					<input class="form-input" type="text" v-model="editForm.city" placeholder="请输入所在城市" />
				</view>
				
				<button class="save-button" @tap="saveProfile" :disabled="saving">
					<text v-if="saving">保存中...</text>
					<text v-else>保存修改</text>
				</button>
			</view>
		</view>
	</view>
</template>

<script>
	import { getUserInfo, updateUserInfo } from '@/api/login.js'
	
	export default {
		data() {
			return {
				currentPage: 'profile',
				saving: false,
				defaultAvatar: 'https://design.gemcoder.com/staticResource/echoAiSystemImages/378da9ddd57051faab2f02fd247494da.png',
				userInfo: {
					// 初始为空，从接口获取
				},
				userStats: {
					follow: 6,
					like: 13,
					publish: 2
				},
				editForm: {
					nickName: '',
					phonenumber: '',
					city: '',
					avatar: ''
				}
			}
		},
		onLoad() {
			this.loadUserInfo();
		},
		onShow() {
			// 当从其他页面返回时重新加载用户信息
			this.loadUserInfo();
		},
		methods: {
			// 加载用户信息
			async loadUserInfo() {
				try {
					const res = await getUserInfo();
					if (res.code === 200) {
						this.userInfo = res.data;
						// 初始化编辑表单
						this.editForm = {
							nickName: res.data.nickName || '',
							phonenumber: res.data.phonenumber || '',
							city: res.data.city || '',
							avatar: res.data.avatar || this.defaultAvatar
						};
					} else {
						uni.showToast({
							title: '获取用户信息失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('获取用户信息失败:', error);
					uni.showToast({
						title: '获取用户信息失败',
						icon: 'none'
					});
				}
			},
			
			// 跳转到个人中心页面
			goToPersonalCenter() {
				uni.navigateTo({
					url: '/pages/mine/personal/index'
				});
			},
			
			// 跳转到角色切换页面
			goToRoleSwitch() {
				uni.navigateTo({
					url: '/pages/mine/switch/index'
				});
			},
			
			// 跳转到编辑页面
			goToEditPage() {
				this.currentPage = 'edit';
			},
			
			// 返回个人中心页面
			goBack() {
				this.currentPage = 'profile';
			},
			
			// 保存个人资料
			async saveProfile() {
				// 表单验证
				if (!this.editForm.nickName) {
					uni.showToast({
						title: '请输入姓名',
						icon: 'none'
					});
					return;
				}
				
				if (!this.editForm.phonenumber) {
					uni.showToast({
						title: '请输入手机号',
						icon: 'none'
					});
					return;
				}
				
				this.saving = true;
				try {
					const res = await updateUserInfo(this.editForm);
					if (res.code === 200) {
						// 更新本地用户信息
						this.userInfo = { ...this.userInfo, ...this.editForm };
						
						// 显示保存成功提示
						uni.showToast({
							title: '个人信息已更新',
							icon: 'success'
						});
						
						// 跳转到个人中心页面
						setTimeout(() => {
							this.goToPersonalCenter();
						}, 1500);
					} else {
						uni.showToast({
							title: res.msg || '更新失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('更新用户信息失败:', error);
					uni.showToast({
						title: '更新失败，请重试',
						icon: 'none'
					});
				} finally {
					this.saving = false;
				}
			},
			
			// 更换头像
			changeAvatar() {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: (res) => {
						// 在实际应用中，这里应该上传图片到服务器
						// 这里我们直接使用选择的图片
						this.editForm.avatar = res.tempFilePaths[0];
						this.userInfo.avatar = res.tempFilePaths[0];
						
						// 可以在这里调用上传头像的API
						// this.uploadAvatar(res.tempFilePaths[0]);
					}
				});
			},
			
			// 处理角色入住按钮点击
			handleRoleCheckin() {
			    // 跳转到角色设置页面
			    uni.navigateTo({
			        url: '/pages/mine/setting/index'
			    });
			},
			
			// 处理统计项点击
			handleStatClick(statName) {
				console.log(`点击了统计: ${statName}`);
				// 在实际应用中，这里可以添加页面跳转逻辑
			},
			
			// 处理菜单项点击
			handleMenuClick(menuName) {
			    console.log(`点击了功能: ${menuName}`);
			    // 在实际应用中，这里可以添加页面跳转逻辑
			    switch(menuName) {
			        case '查看订单':
			            // 跳转到订单页面
			            uni.navigateTo({
			                url: '/pages/order/list'
			            });
			            break;
			        case '举报投诉':
			            // 跳转到举报投诉页面
			            uni.navigateTo({
			                url: '/pages/mine/help/index'
			            });
			            break;
			        case '收货地址':
			            // 跳转到收货地址页面 - 修改为 mine/address
			            uni.navigateTo({
			                url: '/pages/mine/address'
			            });
			            break;
			        default:
			            break;
			    }
			},
			
			// 处理浮动操作按钮点击
			handleFloatingAction() {
				uni.showModal({
					title: '创建新内容',
					content: '选择要创建的内容类型',
					showCancel: true,
					confirmText: '确定'
				});
			}
		}
	}
</script>

<style>
	/* 样式保持不变，与之前相同 */
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
		display: block;
		font-size: 42rpx;
		font-weight: bold;
		margin-bottom: 8rpx;
	}
	
	.user-phone {
		display: block;
		font-size: 28rpx;
		opacity: 0.8;
		margin-bottom: 16rpx;
	}
	
	.badge-container {
		display: flex;
		align-items: center;
		margin-bottom: 16rpx;
	}
	
	.badge {
		background: rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(20rpx);
		font-size: 24rpx;
		padding: 8rpx 16rpx;
		border-radius: 40rpx;
	}
	
	.warranty-text {
		font-size: 24rpx;
		opacity: 0.8;
		margin-left: 16rpx;
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
		top: 150rpx; /* 放在切换角色按钮下方 */
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
		background: white;
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
	
	/* 浮动操作按钮样式 */
	.floating-action {
		position: fixed;
		bottom: 60rpx;
		right: 60rpx;
		width: 120rpx;
		height: 120rpx;
		background: linear-gradient(135deg, #FF7D00 0%, #FFA940 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 10rpx 40rpx rgba(255, 125, 0, 0.4);
		z-index: 10;
	}
	
	/* 编辑页面样式 */
	.edit-header {
		background: linear-gradient(135deg, #4A90E2 0%, #5B6EF7 100%);
		color: white;
		padding: 40rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	
	.back-button {
		background: none;
		border: none;
		color: white;
		font-size: 36rpx;
	}
	
	.edit-title {
		font-size: 36rpx;
		font-weight: bold;
	}
	
	.placeholder {
		width: 48rpx;
	}
	
	.edit-form {
		padding: 40rpx;
	}
	
	.avatar-upload {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 60rpx;
	}
	
	.avatar-preview {
		width: 240rpx;
		height: 240rpx;
		border-radius: 50%;
		overflow: hidden;
		border: 8rpx solid #E2E8F0;
		margin-bottom: 30rpx;
	}
	
	.change-avatar-btn {
		background: #4A90E2;
		color: white;
		border: none;
		padding: 16rpx 32rpx;
		border-radius: 40rpx;
		font-size: 28rpx;
	}
	
	.form-group {
		margin-bottom: 40rpx;
	}
	
	.form-label {
		display: block;
		margin-bottom: 16rpx;
		font-weight: 500;
		color: #4A5568;
		font-size: 28rpx;
	}
	
	.form-input {
		width: 100%;
		padding: 24rpx 32rpx;
		border: 2rpx solid #E2E8F0;
		border-radius: 16rpx;
		font-size: 32rpx;
	}
	
	.save-button {
		background: linear-gradient(135deg, #4A90E2 0%, #5B6EF7 100%);
		color: white;
		border: none;
		padding: 28rpx;
		border-radius: 16rpx;
		font-size: 32rpx;
		font-weight: 600;
		width: 100%;
		margin-top: 40rpx;
	}
	
	.save-button:disabled {
		background: #A0AEC0;
		opacity: 0.6;
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
	.icon-shopping-cart:before { content: "\e604"; }
	.icon-cog:before { content: "\e605"; }
	.icon-shield-alt:before { content: "\e606"; }
	.icon-question-circle:before { content: "\e607"; }
	.icon-info-circle:before { content: "\e608"; }
	.icon-chevron-right:before { content: "\e609"; }
	.icon-arrow-left:before { content: "\e60a"; }
	.icon-camera:before { content: "\e60b"; }
	.icon-plus:before { content: "\e60c"; }
	.icon-flag:before { content: "\e60f"; }
	.icon-map-marker:before { content: "\e610"; }
	.icon-home:before { content: "\e611"; }
</style>