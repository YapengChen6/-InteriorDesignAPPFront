<template>
	<view class="message-container">
		<!-- 顶部固定区域 -->
		<view class="fixed-header">
			<!-- 标题栏 -->
			<view class="nav-bar">
				<text class="page-title">消息中心</text>
				<view class="nav-actions">
					<view class="action-btn chat-btn" @click="goToChatList">
						<text class="icon">💬</text>
						<text>聊天</text>
					</view>
					<view class="action-btn read-btn" @click="markAllAsRead" :class="{ disabled: !hasUnreadMessages || loading }">
						<text class="icon">✓</text>
						<text>{{ loading ? '...' : '全部已读' }}</text>
					</view>
				</view>
			</view>

			<!-- 搜索框 -->
			<view class="search-wrapper">
				<view class="search-box">
					<text class="search-icon">🔍</text>
					<input 
						type="text" 
						v-model="searchKeyword" 
						placeholder="搜索消息通知..." 
						placeholder-class="placeholder-style"
					/>
					<text v-if="searchKeyword" class="clear-icon" @click="searchKeyword = ''">×</text>
				</view>
			</view>

			<!-- 分类标签 -->
			<view class="tabs-wrapper">
				<view 
					class="tab-item" 
					v-for="tab in tabs" 
					:key="tab.id"
					:class="{ active: activeTab === tab.id }"
					@click="switchTab(tab.id)"
				>
					<text>{{ tab.name }}</text>
					<view v-if="tab.unreadCount > 0" class="tab-badge">{{ tab.unreadCount > 99 ? '99+' : tab.unreadCount }}</view>
					<view class="active-line" v-if="activeTab === tab.id"></view>
				</view>
			</view>
		</view>

		<!-- 占位符，防止内容被顶部遮挡 -->
		<view class="header-placeholder"></view>

		<!-- 消息列表 -->
		<scroll-view
		  class="message-list"
		  scroll-y="true"
		  refresher-enabled="true"
		  :refresher-triggered="refreshing"
		  @refresherrefresh="onRefresh"
		  @scrolltolower="loadMore"
		>
			<view 
				class="msg-card" 
				v-for="item in filteredMessages" 
				:key="item.messageId"
				@click="openMessage(item)"
			>
				<!-- 左侧图标 -->
				<view class="icon-box" :class="getTypeClass(item.type)">
					<text class="msg-icon">{{ getAvatarIcon(item.type) }}</text>
					<view v-if="!item.read" class="unread-dot"></view>
				</view>

				<!-- 中间内容 -->
				<view class="msg-content">
					<view class="msg-header">
						<text class="msg-title">{{ item.title }}</text>
						<text class="msg-time">{{ formatTime(item.time) }}</text>
					</view>
					<text class="msg-desc">{{ item.content }}</text>
				</view>

				<!-- 右侧操作 -->
				<view class="msg-action" @click.stop="deleteMessage(item)">
					<view class="delete-btn">
						<text class="del-icon">🗑️</text>
					</view>
				</view>
			</view>

			<!-- 加载状态 -->
			<view v-if="loading && messages.length === 0" class="loading-state">
				<text class="loading-text">加载中...</text>
			</view>

			<!-- 空状态 -->
			<view v-else-if="filteredMessages.length === 0 && !loading" class="empty-state">
				<text class="empty-emoji">📭</text>
				<text class="empty-text">{{ searchKeyword ? '未找到相关消息' : '暂无相关消息' }}</text>
			</view>
			
			<!-- 加载更多 -->
			<view v-if="hasMore && filteredMessages.length > 0" class="load-more">
				<text class="load-more-text">{{ loadingMore ? '加载中...' : '上拉加载更多' }}</text>
			</view>
			
			<!-- 底部安全距离 -->
			<view style="height: 40rpx;"></view>
		</scroll-view>

		<!-- 消息详情弹窗 -->
		<uni-popup ref="messagePopup" type="center" background-color="#fff" :is-mask-click="false">
		  <view class="popup-content" v-if="selectedMessage">
			<view class="popup-header">
			  <text class="popup-title">{{ selectedMessage.title }}</text>
			  <view class="close-btn" @click="closePopup">×</view>
			</view>
			<view class="popup-body">
			  <view class="message-meta">
				<text class="sender">发件人：{{ selectedMessage.sender }}</text>
				<text class="time">{{ formatFullTime(selectedMessage.time) }}</text>
			  </view>
			  <view class="message-detail">
				<text>{{ selectedMessage.content }}</text>
			  </view>
			</view>
			<view class="popup-footer">
			  <button class="popup-btn cancel-btn" @click="closePopup">关闭</button>
			  <button
				v-if="selectedMessage.type === 'chat-request' && !selectedMessage.read"
				class="popup-btn confirm-btn"
				@click="acceptChat(selectedMessage)"
			  >
				同意聊天
			  </button>
			  <button
				v-if="(selectedMessage.messageType === 1 || selectedMessage.messageType === 2) && selectedMessage.conversationId"
				class="popup-btn confirm-btn"
				@click="goToChatFromMessage(selectedMessage)"
			  >
				前往聊天
			  </button>
			</view>
		  </view>
		</uni-popup>
	</view>
</template>

<script>
import {
  getUnreadCount,
  getUnreadMessages,
  markMessageAsRead,
  deleteMessage
} from '@/api/message'
import request from '@/utils/request'
import { getUserProfile } from '@/api/users'
// 导入时间工具函数，与 chatMain.vue 保持一致
import { formatTime, parseDate, normalizeBackendTime } from '@/utils/timeUtils'

export default {
	name: 'MessageCenter',
	data() {
		return {
			searchKeyword: '',
			activeTab: 'all',
			tabs: [
				{ id: 'all', name: '全部', unreadCount: 0 },
				{ id: 'unread', name: '未读', unreadCount: 0 },
				{ id: 'project', name: '项目', unreadCount: 0 },
				{ id: 'system', name: '系统', unreadCount: 0 }
			],
			messages: [],
			loading: false,
			loadingMore: false,
			refreshing: false,
			hasMore: true,
			selectedMessage: null,
			currentUser: {
				userId: 0
			},
			pagination: {
				pageNum: 1,
				pageSize: 20,
				total: 0
			}
		};
	},
	computed: {
		filteredMessages() {
			let list = this.messages;
			
			// 1. 标签过滤
			if (this.activeTab === 'unread') {
				list = list.filter(item => !item.read);
			} else if (this.activeTab === 'project') {
				list = list.filter(item => item.type === 'project');
			} else if (this.activeTab === 'system') {
				list = list.filter(item => item.type === 'system' || item.type === 'chat-request');
			}

			// 2. 搜索过滤
			if (this.searchKeyword) {
				const keyword = this.searchKeyword.toLowerCase();
				list = list.filter(item => 
					(item.title || '').toLowerCase().includes(keyword) || 
					(item.content || '').toLowerCase().includes(keyword) ||
					(item.sender || '').toLowerCase().includes(keyword)
				);
			}

			return list;
		},
		hasUnreadMessages() {
			return this.messages.some(msg => !msg.read);
		}
	},
	methods: {
		getAvatarIcon(type) {
			const icons = { project: '🏠', system: '🔔', chat: '💬', 'chat-request': '🤝' };
			return icons[type] || '✉️';
		},
		getTypeClass(type) {
			const map = {
				'system': 'bg-blue',
				'project': 'bg-orange',
				'chat-request': 'bg-purple',
				'chat': 'bg-green'
			};
			return map[type] || 'bg-blue';
		},
		// 使用与 chatMain.vue 相同的时间格式化方法
		formatTime,
		formatFullTime(time) {
			// 使用 parseDate 来标准化时间处理
			const parsedTime = parseDate(time);
			if (!parsedTime) return '时间未知';
			
			return parsedTime.toLocaleString('zh-CN', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit'
			});
		},
		goToChatList() {
			uni.navigateTo({ url: '/pages/chat/chatMain' });
		},
		goToChatFromMessage(message) {
			this.closePopup();
			uni.navigateTo({
				url: `/pages/chat/chatDetail?conversationId=${message.conversationId}&otherUserId=${message.senderId}`
			});
		},
		
		// Data Loading Methods
		async initUserInfo() {
			try {
				const res = await getUserProfile();
				if (res && res.code === 200 && res.data) {
					const user = res.data;
					this.currentUser.userId = user.userId || user.id || 0;
					try {
						uni.setStorageSync('userId', this.currentUser.userId);
						uni.setStorageSync('userInfo', user);
					} catch (e) { console.warn('cache userId failed', e); }
				}
			} catch (e) { console.error('initUserInfo error:', e); }
		},
		
		async loadMessages(refresh = false) {
			if (this.loading) return;
			this.loading = true;
			if (refresh) this.refreshing = true;
			
			try {
				let userId = this.currentUser.userId;
				if (!userId) {
					const storedId = uni.getStorageSync('userId');
					if (storedId) userId = parseInt(storedId);
					this.currentUser.userId = userId;
				}
				
				console.log('📩 加载未读消息, userId =', userId);
				const res = await getUnreadMessages(userId);
				console.log('📩 后端返回的原始数据:', res);
				const list = (res && res.data) || [];
				console.log('📩 解析后的消息列表:', list);
				
				this.messages = list.map((item, index) => {
					// 详细记录后端返回的时间数据
					console.log('📩 处理消息时间 - 原始数据:', {
						messageId: item.messageId,
						sendTime: item.sendTime,
						sendTimeType: typeof item.sendTime,
						sendTimeValue: item.sendTime,
						isNumber: typeof item.sendTime === 'number',
						isValidTimestamp: typeof item.sendTime === 'number' && item.sendTime > 0
					});
					
					let time;
					if (item.sendTime !== null && item.sendTime !== undefined) {
						// 后端返回的可能是字符串格式的时间戳或数字时间戳
						let timestamp = item.sendTime;
						
						// 如果是字符串，尝试转换为数字
						if (typeof timestamp === 'string') {
							timestamp = parseInt(timestamp, 10);
							console.log('📩 字符串时间戳转换:', {
								original: item.sendTime,
								converted: timestamp,
								isValidNumber: !isNaN(timestamp)
							});
						}
						
						// 验证时间戳是否有效（大于0且为合理的时间戳）
						if (typeof timestamp === 'number' && !isNaN(timestamp) && timestamp > 0) {
							time = new Date(timestamp);
							console.log('✅ 时间戳转换成功:', {
								timestamp: timestamp,
								dateObject: time,
								dateString: time.toISOString(),
								isValid: !isNaN(time.getTime()),
								messageId: item.messageId
							});
						} else {
							console.error('❌ 无效的时间戳:', {
								original: item.sendTime,
								converted: timestamp,
								type: typeof item.sendTime,
								messageId: item.messageId
							});
							time = null;
						}
					} else {
						console.warn('⚠️ sendTime 为空:', item.messageId);
						time = null;
					}
					
					let type = 'system';
					let title = '未读消息 #' + (item.messageId || index + 1);
					let content = item.content || '';
					let sender = item.senderName || '系统消息';
					let fromUserId = null;
					
					if (item.messageType === 3 && item.content) {
						try {
							const parsed = JSON.parse(item.content);
							if (parsed && parsed.type === 'CHAT_REQUEST') {
								type = 'chat-request';
								fromUserId = parsed.fromUserId || null;
								const fromName = parsed.fromNickName || (parsed.fromUserId ? `用户${parsed.fromUserId}` : '对方');
								title = `${fromName} 请求和你聊天`;
								content = '对方向你发起了聊天请求，点击“同意聊天”开始会话。';
								sender = fromName;
							}
						} catch (e) { console.warn('解析系统消息失败:', e); }
					}
					
					return {
						id: item.messageId || index + 1,
						messageId: item.messageId,
						messageStatusId: item.messageStatusId,
						type,
						title,
						content,
						time,
						read: item.readStatus === 1,
						sender,
						messageType: item.messageType,
						rawContent: item.content,
						fromUserId,
						conversationId: item.conversationId,
						senderId: item.senderId
					};
				});
				
				this.hasMore = false; // 暂时假设一次拉取完
				this.pagination.pageNum = 1;
				this.pagination.total = this.messages.length;
				await this.updateUnreadCounts();
				
			} catch (e) {
				console.error('加载消息异常:', e);
				uni.showToast({ title: '获取消息失败', icon: 'none' });
			} finally {
				this.loading = false;
				this.refreshing = false;
				this.loadingMore = false;
			}
		},
		
		async updateUnreadCounts() {
			try {
				const res = await getUnreadCount(this.currentUser.userId);
				if (res.code === 200) {
					const totalUnread = res.data;
					const projectUnread = this.messages.filter(m => m.type === 'project' && !m.read).length;
					const systemUnread = this.messages.filter(
						m => (m.type === 'system' || m.type === 'chat-request') && !m.read
					).length;
					
					this.tabs[0].unreadCount = totalUnread;
					this.tabs[1].unreadCount = totalUnread;
					this.tabs[2].unreadCount = projectUnread;
					this.tabs[3].unreadCount = systemUnread;
				}
			} catch (e) { console.error('获取未读数量异常:', e); }
		},
		
		// User Actions
		switchTab(tabId) {
			this.activeTab = tabId;
			this.searchKeyword = '';
		},
		onRefresh() {
			this.refreshing = true;
			this.loadMessages(true);
		},
		async loadMore() {
			if (this.loadingMore || !this.hasMore) return;
			this.loadingMore = true;
			await this.loadMessages(false);
		},
		openMessage(message) {
			this.selectedMessage = message;
			this.$refs.messagePopup.open();
			if (!message.read && message.type !== 'chat-request') {
				this.markAsRead(message);
			}
		},
		closePopup() {
			this.$refs.messagePopup.close();
			this.selectedMessage = null;
		},
		
		async markAsRead(message) {
			if (!message || message.read) return;
			try {
				const res = await markMessageAsRead(message.messageId, this.currentUser.userId);
				if (res.code === 200) {
					message.read = true;
					await this.updateUnreadCounts();
				}
			} catch (e) { console.error('标记已读异常:', e); }
		},
		
		async markAllAsRead() {
			if (this.loading || !this.hasUnreadMessages) return;
			try {
				this.loading = true;
				const ids = this.messages.filter(m => !m.read).map(m => m.messageId);
				if (!ids.length) return;
				
				const res = await request({
					url: '/api/message/mark-read-batch',
					method: 'post',
					params: { userId: this.currentUser.userId },
					data: ids
				});
				
				if (res.code === 200) {
					this.messages.forEach(m => m.read = true);
					await this.updateUnreadCounts();
					uni.showToast({ title: '全部已读', icon: 'none' });
				}
			} catch (e) {
				console.error('批量标记异常:', e);
			} finally {
				this.loading = false;
			}
		},
		
		async deleteMessage(message) {
			uni.showModal({
				title: '提示',
				content: '确定要删除这条消息吗？',
				success: async (res) => {
					if (res.confirm) {
						try {
							const resp = await deleteMessage(message.messageId, this.currentUser.userId);
							if (resp.code === 200) {
								const idx = this.messages.findIndex(m => m.messageId === message.messageId);
								if (idx !== -1) {
									this.messages.splice(idx, 1);
									await this.updateUnreadCounts();
									uni.showToast({ title: '删除成功', icon: 'none' });
								}
							}
						} catch (e) {
							console.error('删除异常:', e);
							uni.showToast({ title: '删除失败', icon: 'none' });
						}
					}
				}
			});
		},
		
		async acceptChat(message) {
			if (!message || message.accepting) return;
			try {
				message.accepting = true;
				const messageId = message.messageId || message.id;
				const res = await request({
					url: `/api/message/chat-request/accept/${messageId}`,
					method: 'post'
				});
				
				if (res && res.code === 200 && res.data && res.data.conversationId) {
					message.read = true;
					await this.updateUnreadCounts();
					this.closePopup();
					uni.navigateTo({
						url: `/pages/chat/chatDetail?conversationId=${res.data.conversationId}&otherUserId=${message.fromUserId}`
					});
				} else {
					uni.showToast({ title: '操作失败', icon: 'none' });
				}
			} catch (e) {
				console.error('同意聊天异常:', e);
				uni.showToast({ title: '网络异常', icon: 'none' });
			} finally {
				message.accepting = false;
			}
		}
	},
	async onLoad() {
		console.log('🚀🚀🚀 [强制重新加载] 页面开始加载 - 时间:', new Date().toISOString());
		await this.initUserInfo();
		await this.loadMessages(true);
	},
	onPullDownRefresh() {
		this.onRefresh();
		setTimeout(() => {
			uni.stopPullDownRefresh();
		}, 1000);
	}
};
</script>

<style scoped>
	.message-container {
		min-height: 100vh;
		background-color: #F7F8FA;
		display: flex;
		flex-direction: column;
	}

	/* --- 顶部固定区域样式 --- */
	.fixed-header {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		background-color: #FFFFFF;
		z-index: 999;
		padding-bottom: 10rpx;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.02);
	}

	.nav-bar {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		padding: 88rpx 30rpx 20rpx; /* 适配状态栏高度 */
	}

	.page-title {
		font-size: 40rpx;
		font-weight: bold;
		color: #111;
	}

	.nav-actions {
		display: flex;
		gap: 20rpx;
	}

	.action-btn {
		display: flex;
		align-items: center;
		background: #F0F2F5;
		padding: 10rpx 20rpx;
		border-radius: 30rpx;
		font-size: 24rpx;
		color: #333;
		transition: all 0.2s;
	}
	
	.action-btn:active {
		background: #E1E4E8;
	}
	
	.action-btn.disabled {
		opacity: 0.5;
	}

	.chat-btn {
		background-color: #EBF5FF;
		color: #007AFF;
	}
	
	.action-btn .icon {
		margin-right: 6rpx;
		font-size: 24rpx;
	}

	.search-wrapper {
		padding: 10rpx 30rpx;
	}

	.search-box {
		background-color: #F5F6F7;
		border-radius: 16rpx;
		height: 72rpx;
		display: flex;
		align-items: center;
		padding: 0 24rpx;
	}

	.search-icon {
		font-size: 28rpx;
		color: #999;
		margin-right: 12rpx;
	}

	.search-box input {
		flex: 1;
		font-size: 28rpx;
		color: #333;
	}

	.placeholder-style {
		color: #BBBBBB;
	}

	.clear-icon {
		font-size: 32rpx;
		color: #999;
		padding: 10rpx;
	}

	.tabs-wrapper {
		display: flex;
		padding: 20rpx 30rpx 0;
		border-bottom: 1rpx solid #F0F0F0;
	}

	.tab-item {
		position: relative;
		margin-right: 50rpx;
		padding-bottom: 20rpx;
		font-size: 28rpx;
		color: #666;
		transition: all 0.3s;
	}

	.tab-item.active {
		color: #111;
		font-weight: bold;
		font-size: 30rpx;
	}

	.tab-badge {
		position: absolute;
		top: -6rpx;
		right: -16rpx;
		background-color: #FF4D4F;
		color: white;
		font-size: 18rpx;
		height: 28rpx;
		min-width: 28rpx;
		border-radius: 14rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 6rpx;
		border: 2rpx solid #FFF;
	}

	.active-line {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 40rpx;
		height: 6rpx;
		background: #007AFF;
		border-radius: 4rpx;
	}

	/* --- 列表区域样式 --- */
	.header-placeholder {
		height: 340rpx; /* 估算顶部固定高度 */
	}

	.message-list {
		padding: 24rpx 30rpx;
		height: calc(100vh - 340rpx); /* 视口高度减去顶部高度 */
	}

	.msg-card {
		background: #FFFFFF;
		border-radius: 24rpx;
		padding: 24rpx;
		margin-bottom: 20rpx;
		display: flex;
		align-items: center;
		box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.03);
		transition: transform 0.1s;
	}

	.msg-card:active {
		transform: scale(0.98);
	}

	.icon-box {
		width: 88rpx;
		height: 88rpx;
		border-radius: 20rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 24rpx;
		position: relative;
		flex-shrink: 0;
	}

	.bg-blue { background-color: #E6F7FF; }
	.bg-orange { background-color: #FFF7E6; }
	.bg-purple { background-color: #F9F0FF; }
	.bg-green { background-color: #F6FFED; }

	.msg-icon {
		font-size: 40rpx;
	}

	.unread-dot {
		position: absolute;
		top: -4rpx;
		right: -4rpx;
		width: 16rpx;
		height: 16rpx;
		background-color: #FF4D4F;
		border-radius: 50%;
		border: 2rpx solid #FFF;
	}

	.msg-content {
		flex: 1;
		overflow: hidden;
	}

	.msg-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8rpx;
	}

	.msg-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #333;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 350rpx;
	}

	.msg-time {
		font-size: 22rpx;
		color: #999;
	}

	.msg-desc {
		font-size: 26rpx;
		color: #888;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		display: block;
	}

	.msg-action {
		padding-left: 20rpx;
		border-left: 1rpx solid #F0F0F0;
		margin-left: 20rpx;
	}

	.delete-btn {
		width: 60rpx;
		height: 60rpx;
		background-color: #FFF0F0;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.del-icon {
		font-size: 28rpx;
	}

	/* 状态提示 */
	.loading-state, .load-more, .no-more {
		padding: 30rpx 0;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	.loading-text, .load-more-text, .no-more-text {
		font-size: 24rpx;
		color: #999;
	}

	/* 空状态 */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding-top: 100rpx;
	}

	.empty-emoji {
		font-size: 80rpx;
		margin-bottom: 20rpx;
		opacity: 0.5;
	}

	.empty-text {
		font-size: 28rpx;
		color: #999;
	}
	
	/* 弹窗样式 */
	.popup-content {
	  padding: 30rpx;
	  width: 560rpx;
	  background-color: #fff;
	  border-radius: 24rpx;
	}
	.popup-header {
	  display: flex;
	  justify-content: space-between;
	  align-items: center;
	  margin-bottom: 24rpx;
	  padding-bottom: 16rpx;
	  border-bottom: 1rpx solid #eee;
	}
	.popup-title {
	  font-size: 32rpx;
	  font-weight: bold;
	  color: #333;
	  flex: 1;
	  overflow: hidden;
	  text-overflow: ellipsis;
	  white-space: nowrap;
	}
	.close-btn {
	  font-size: 40rpx;
	  color: #999;
	  line-height: 1;
	  padding: 0 10rpx;
	}
	.popup-body {
	  margin-bottom: 32rpx;
	  max-height: 60vh;
	  overflow-y: auto;
	}
	.message-meta {
	  font-size: 24rpx;
	  color: #999;
	  margin-bottom: 16rpx;
	  display: flex;
	  flex-direction: column;
	  gap: 8rpx;
	}
	.message-detail {
	  font-size: 28rpx;
	  color: #333;
	  line-height: 1.6;
	}
	.popup-footer {
	  display: flex;
	  justify-content: flex-end;
	  gap: 20rpx;
	}
	.popup-btn {
	  margin: 0;
	  font-size: 26rpx;
	  padding: 12rpx 30rpx;
	  border-radius: 30rpx;
	  line-height: 1.5;
	}
	.cancel-btn {
	  background-color: #f5f5f5;
	  color: #666;
	}
	.confirm-btn {
	  background-color: #007aff;
	  color: #fff;
	}
	.popup-btn::after {
		border: none;
	}
</style>