<template>
  <view class="message-center">
    <!-- 固定顶部导航栏 -->
    <view class="navbar-fixed">
      <view class="navbar">
        <view class="navbar-content">
          <view class="navbar-title">
            <text class="title-text">消息中心</text>
            <view class="navbar-buttons">
              <button @click="goToChatList" class="chat-btn">
                <text class="btn-text">💬 聊天</text>
              </button>
              <button @click="markAllAsRead" class="mark-all-read-btn" :disabled="!hasUnreadMessages">
                <text class="btn-text">全部已读</text>
              </button>
            </view>
          </view>
        </view>
      </view>

      <!-- 标签页 - 占满页面宽度 -->
      <view class="tabs-container">
        <view class="tabs-fullwidth">
          <view
            v-for="tab in tabs"
            :key="tab.id"
            :class="['tab', { active: activeTab === tab.id }]"
            @click="switchTab(tab.id)"
          >
            <text class="tab-text">{{ tab.name }}</text>
            <text v-if="tab.unreadCount > 0" class="badge">{{ tab.unreadCount }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 消息列表 - 添加顶部内边距避免被导航栏遮挡 -->
    <scroll-view class="message-list" scroll-y="true" refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh" :style="{ paddingTop: navHeight + 'px' }">
      <!-- 下拉刷新 -->
      <view class="refresher" v-if="refreshing">
        <view class="refresher-loading">
          <view class="loading-spinner"></view>
          <text class="refresher-text">刷新中...</text>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="filteredMessages.length === 0 && !loading" class="empty-state">
        <image class="empty-image" src="/static/images/empty-message.png" mode="aspectFit"></image>
        <text class="empty-text">暂无消息</text>
        <text class="empty-desc">当有新消息时，会在这里显示</text>
      </view>

      <!-- 消息项 - 去掉内容预览区域 -->
      <view
        v-for="message in filteredMessages"
        :key="message.id"
        :class="['message-item', { unread: !message.read }]"
        @click="openMessage(message)"
      >
        <!-- 左侧图标区域 -->
        <view class="message-left">
          <view class="message-avatar" :class="message.type">
            <text class="avatar-icon">{{ getAvatarIcon(message.type) }}</text>
          </view>
        </view>

        <!-- 中间内容区域 - 只显示标题和时间 -->
        <view class="message-content">
          <view class="message-header">
            <text class="message-title">{{ message.title }}</text>
            <text class="message-time">{{ formatTime(message.time) }}</text>
          </view>
        </view>

        <!-- 右侧操作区域 -->
        <view class="message-right">
          <view class="message-actions">
            <button @click.stop="deleteMessage(message)" class="action-btn delete-btn">
              <text class="btn-text">删除</text>
            </button>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="hasMore && filteredMessages.length > 0" class="load-more">
        <view class="load-more-content" @click="loadMore">
          <text class="load-more-text">加载更多</text>
        </view>
      </view>
    </scroll-view>

    <!-- 消息详情弹窗 -->
    <uni-popup ref="messagePopup" type="center" background-color="#fff" :is-mask-click="false">
      <view class="popup-content" v-if="selectedMessage">
        <view class="popup-header">
          <text class="popup-title">{{ selectedMessage.title }}</text>
          <button class="close-btn" @click="closePopup">
            <text class="close-icon">×</text>
          </button>
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
            v-if="!selectedMessage.read"
            class="popup-btn confirm-btn"
            @click="markAsRead(selectedMessage)"
          >
            标记已读
          </button>
        </view>
      </view>
    </uni-popup>

    <!-- 操作反馈 Toast -->
    <view v-if="toast.show" class="toast-message" :class="toast.type">
      <text class="toast-icon">{{ toast.icon }}</text>
      <text class="toast-text">{{ toast.message }}</text>
    </view>
  </view>
</template>

<script>
import { getUnreadMessages, markMessageAsRead, markMessagesAsReadBatch, deleteMessage as deleteMessageApi } from '@/api/message'
import request from '@/utils/request'

export default {
  name: 'MessageCenter',
  data() {
    return {
      activeTab: 'all',
      loading: false,
      refreshing: false,
      hasMore: true,
      selectedMessage: null,
      navHeight: 120, // 默认导航栏高度
      toast: {
        show: false,
        message: '',
        icon: '',
        type: 'success'
      },
      tabs: [
        { id: 'all', name: '全部', unreadCount: 0 },
        { id: 'unread', name: '未读', unreadCount: 0 },
        { id: 'project', name: '项目', unreadCount: 0 },
        { id: 'system', name: '系统', unreadCount: 0 }
      ],
      messages: []
    }
  },
  computed: {
    filteredMessages() {
      switch (this.activeTab) {
        case 'unread':
          return this.messages.filter(msg => !msg.read)
        case 'project':
          return this.messages.filter(msg => msg.type === 'project')
        case 'system':
          // 系统消息包含普通系统消息和聊天请求
          return this.messages.filter(msg => msg.type === 'system' || msg.type === 'chat-request')
        default:
          return this.messages
      }
    },
    hasUnreadMessages() {
      return this.messages.some(msg => !msg.read)
    }
  },
  methods: {
    getAvatarIcon(type) {
      const icons = {
        project: '🏠',
        system: '🔔',
        'chat-request': '🤝'
      }
      return icons[type] || '✉️'
    },

    formatTime(time) {
      // 根据截图显示格式，只显示月/日
      return `${time.getMonth() + 1}/${time.getDate()}`
    },

    formatFullTime(time) {
      return time.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    async fetchMessages() {
      this.loading = true
      try {
        const res = await getUnreadMessages()
        console.log('📩 未读消息列表返回:', res)
        const list = (res && res.data) || []
        this.messages = list.map((item, index) => {
          const time = item.sendTime ? new Date(item.sendTime) : new Date()

          let type = 'system'
          let title = '未读消息 #' + (item.messageId || index + 1)
          let content = item.content || ''
          let sender = item.senderName || '系统消息'
          let fromUserId = null

          // 解析系统消息内容，识别聊天请求
          if (item.messageType === 3 && item.content) {
            try {
              const parsed = JSON.parse(item.content)
              if (parsed && parsed.type === 'CHAT_REQUEST') {
                type = 'chat-request'
                fromUserId = parsed.fromUserId || null
                const fromName = parsed.fromNickName || (parsed.fromUserId ? `用户${parsed.fromUserId}` : '对方')
                title = `${fromName} 请求和你聊天`
                content = '对方向你发起了聊天请求，点击“同意聊天”开始会话。'
                sender = fromName
              }
            } catch (err) {
              console.warn('解析系统消息内容失败:', item.content, err)
            }
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
            fromUserId
          }
        })
        this.updateUnreadCounts()
      } catch (e) {
        console.error('获取未读消息失败:', e)
        this.showToast('获取未读消息失败', '!', 'info')
      } finally {
        this.loading = false
        this.refreshing = false
      }
    },

    openMessage(message) {
      this.selectedMessage = message
      this.$refs.messagePopup.open()
      // 0 8 5 2 1 6 3 2 7 7 2 0 7 5 2 1 7 5 9 7 1 2 f e
      if (!message.read && message.type !== 'chat-request') {
        this.markAsRead(message)
      }
    },

    closePopup() {
      this.$refs.messagePopup.close()
      this.selectedMessage = null
    },

    async markAsRead(message) {
      if (!message || message.read) {
        return
      }
      try {
        const messageId = message.messageId || message.id
        await markMessageAsRead(messageId)
        message.read = true
        this.updateUnreadCounts()
        this.showToast('标记为已读', '✓', 'success')
      } catch (e) {
        console.error('标记消息已读失败:', e)
        this.showToast('标记已读失败', '!', 'info')
      }
    },

    async acceptChat(message) {
      if (!message || message.accepting) {
        return
      }
      try {
        message.accepting = true
        const messageId = message.messageId || message.id
        const res = await request({
          url: `/api/message/chat-request/accept/${messageId}`,
          method: 'post'
        })
        console.log('✅ 同意聊天请求返回:', res)
        if (!res || res.code !== 200 || !res.data || !res.data.conversationId) {
          this.showToast((res && res.msg) || '同意聊天请求失败', '!', 'info')
          return
        }

        // 标记为已读并更新角标
        message.read = true
        this.updateUnreadCounts()
        this.showToast('已同意聊天请求', '✓', 'success')

        // 关闭弹窗
        this.closePopup()

        // 跳转到聊天详情
        const conversationId = res.data.conversationId
        const otherUserId = message.fromUserId
        if (conversationId && otherUserId) {
          uni.navigateTo({
            url: `/pages/chat/chatDetail?conversationId=${conversationId}&otherUserId=${otherUserId}`
          })
        }
      } catch (e) {
        console.error('同意聊天请求失败:', e)
        this.showToast('同意聊天请求失败', '!', 'info')
      } finally {
        message.accepting = false
      }
    },


    async markAllAsRead() {
      if (!this.hasUnreadMessages) {
        this.showToast('没有未读消息', 'ℹ️', 'info')
        return
      }

      const ids = this.messages
        .filter(msg => !msg.read)
        .map(msg => msg.messageId || msg.id)

      if (ids.length === 0) {
        return
      }

      try {
        await markMessagesAsReadBatch(ids)
        this.messages.forEach(msg => {
          msg.read = true
        })
        this.updateUnreadCounts()
        this.showToast('全部标记为已读', '✓', 'success')
      } catch (e) {
        console.error('批量标记已读失败:', e)
        this.showToast('批量标记已读失败', '!', 'info')
      }
    },

    goToChatList() {
      uni.navigateTo({
        url: '/pages/chat/chatList'
      })
    },

    deleteMessage(message) {
      uni.showModal({
        title: '删除确认',
        content: '确定要删除这条消息吗？',
        confirmColor: '#FF4757',
        success: async (res) => {
          if (res.confirm) {
            try {
              const messageId = message.messageId || message.id
              await deleteMessageApi(messageId)
              const index = this.messages.findIndex(msg => msg.id === message.id)
              if (index !== -1) {
                this.messages.splice(index, 1)
                this.updateUnreadCounts()
              }
              this.showToast('删除成功', '🗑️', 'success')
            } catch (e) {
              console.error('删除消息失败:', e)
              this.showToast('删除失败', '!', 'info')
            }
          }
        }
      })
    },

    switchTab(tabId) {
      this.activeTab = tabId
    },

    async onRefresh() {
      this.refreshing = true
      await this.fetchMessages()
      uni.showToast({
        title: '刷新成功',
        icon: 'success'
      })
    },

    loadMore() {
      this.loading = true
      // 模拟加载更多
      setTimeout(() => {
        this.loading = false
        this.hasMore = false
      }, 800)
    },

    updateUnreadCounts() {
      const unreadCount = this.messages.filter(msg => !msg.read).length
      const projectUnread = this.messages.filter(msg => msg.type === 'project' && !msg.read).length
      const systemUnread = this.messages.filter(msg => (msg.type === 'system' || msg.type === 'chat-request') && !msg.read).length

      this.tabs[0].unreadCount = unreadCount
      this.tabs[1].unreadCount = unreadCount
      this.tabs[2].unreadCount = projectUnread
      this.tabs[3].unreadCount = systemUnread
    },

    showToast(message, icon, type = 'success') {
      this.toast.message = message
      this.toast.icon = icon
      this.toast.type = type
      this.toast.show = true

      setTimeout(() => {
        this.toast.show = false
      }, 2000)
    },

    // 计算导航栏高度
    calculateNavHeight() {
      const query = uni.createSelectorQuery().in(this);
      query.select('.navbar-fixed').boundingClientRect(data => {
        if (data) {
          this.navHeight = data.height;
        }
      }).exec();
    }
  },

  onLoad() {
    this.loading = true
    this.fetchMessages().finally(() => {
      // 计算导航栏高度
      this.$nextTick(() => {
        setTimeout(() => {
          this.calculateNavHeight();
        }, 100);
      });
    })
  },

  onReady() {
    // 页面渲染完成后计算导航栏高度
    this.calculateNavHeight();
  }
}
</script>

<style scoped>
.message-center {
  background: #f5f5f5;
  min-height: 100vh;
  position: relative;
}

/* 固定导航栏容器 */
.navbar-fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: #fff;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

/* 导航栏 */
.navbar {
  background: #fff;
  padding-top: var(--status-bar-height);
}

.navbar-content {
  padding: 20rpx 30rpx;
}

.navbar-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.title-text {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  flex: 1;
}

/* 按钮容器 */
.navbar-buttons {
  display: flex;
  gap: 12rpx;
  align-items: center;
  flex-shrink: 0;
}

/* 聊天按钮 */
.chat-btn {
  background: #34C759;
  color: white;
  border: none;
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.chat-btn:active {
  background: #2BA84A;
  transform: scale(0.95);
}

/* 全部已读按钮 */
.mark-all-read-btn {
  background: #007AFF;
  color: white;
  border: none;
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.mark-all-read-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.mark-all-read-btn:active:not(:disabled) {
  background: #0051D5;
  transform: scale(0.95);
}

.btn-text {
  font-size: 24rpx;
}

/* 标签页 - 占满页面宽度 */
.tabs-container {
  background: #fff;
  border-bottom: 1rpx solid #eee;
}

.tabs-fullwidth {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  padding: 0;
}

.tab {
  flex: 1;
  padding: 24rpx 0;
  text-align: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  white-space: nowrap;
  font-size: 28rpx;
  color: #666;
  transition: all 0.2s ease;
}

.tab.active {
  color: #007AFF;
  font-weight: 500;
}

.badge {
  background: #FF3B30;
  color: white;
  border-radius: 20rpx;
  padding: 4rpx 12rpx;
  font-size: 20rpx;
  margin-left: 8rpx;
  min-width: 10rpx;
  text-align: center;
  line-height: 1;
}

/* 消息列表 */
.message-list {
  height: 100vh;
  background: #f5f5f5;
}

.refresher {
  background: #f5f5f5;
  padding: 20rpx 0;
}

.refresher-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
}

.refresher-text {
  font-size: 26rpx;
  color: #999;
}

/* 消息项 - 去掉内容预览区域 */
.message-item {
  background: #fff;
  margin: 20rpx 30rpx;
  padding: 30rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  position: relative;
  min-height: 100rpx;
}

/* 移除未读消息的特殊背景色，只保留左侧标识 */
.message-item.unread {
  background: #fff;
  border-left: 6rpx solid #007AFF;
  padding-left: 24rpx;
}

/* 左侧图标区域 */
.message-left {
  margin-right: 24rpx;
  flex-shrink: 0;
}

.message-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
}

.message-avatar.project {
  background: linear-gradient(135deg, #34C759, #30A14E);
}

.message-avatar.system {
  background: linear-gradient(135deg, #007AFF, #0056CC);
}

/* 中间内容区域 - 只显示标题和时间 */
.message-content {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.message-title {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  flex: 1;
  margin-right: 20rpx;
}

.message-item.unread .message-title {
  color: #007AFF;
  font-weight: 600;
}

.message-time {
  font-size: 24rpx;
  color: #999;
  flex-shrink: 0;
  white-space: nowrap;
}

/* 右侧操作区域 */
.message-right {
  margin-left: 24rpx;
  flex-shrink: 0;
}

.message-actions {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  background: none;
  border: 1rpx solid #ddd;
  padding: 8rpx 20rpx;
  border-radius: 16rpx;
  font-size: 24rpx;
  color: #666;
  cursor: pointer;
  white-space: nowrap;
}

.delete-btn {
  border-color: #FF3B30;
  color: #FF3B30;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 120rpx 60rpx;
  background: #f5f5f5;
}

.empty-image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 32rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 32rpx;
  color: #999;
  display: block;
  margin-bottom: 16rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #ccc;
}

/* 加载更多 */
.load-more {
  padding: 40rpx;
  text-align: center;
  background: #f5f5f5;
}

.load-more-content {
  padding: 20rpx;
  background: #fff;
  border-radius: 16rpx;
  cursor: pointer;
}

.load-more-text {
  font-size: 26rpx;
  color: #007AFF;
}

/* 弹窗 */
.popup-content {
  background: #fff;
  border-radius: 24rpx;
  margin: 100rpx 40rpx;
  max-height: 80vh;
  overflow: hidden;
}

.popup-header {
  padding: 40rpx 40rpx 20rpx;
  border-bottom: 1rpx solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.popup-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  flex: 1;
  margin-right: 20rpx;
}

.close-btn {
  background: none;
  border: none;
  font-size: 40rpx;
  color: #999;
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.popup-body {
  padding: 30rpx 40rpx;
  max-height: 50vh;
  overflow-y: auto;
}

.message-meta {
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.sender, .time {
  display: block;
  font-size: 26rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.message-detail {
  font-size: 28rpx;
  line-height: 1.6;
  color: #333;
}

.popup-footer {
  padding: 30rpx 40rpx;
  border-top: 1rpx solid #eee;
  display: flex;
  gap: 20rpx;
}

.popup-btn {
  flex: 1;
  padding: 24rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  cursor: pointer;
  border: none;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.confirm-btn {
  background: #007AFF;
  color: white;
}

/* Toast */
.toast-message {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 24rpx 40rpx;
  border-radius: 16rpx;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 16rpx;
  font-size: 28rpx;
}

.toast-message.success {
  background: rgba(52, 199, 89, 0.9);
}

.toast-message.info {
  background: rgba(0, 122, 255, 0.9);
}

/* 加载动画 */
.loading-spinner {
  width: 32rpx;
  height: 32rpx;
  border: 3rpx solid #f3f3f3;
  border-top: 3rpx solid #007AFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 750px) {
  .navbar-content {
    padding: 20rpx 24rpx;
  }

  .tab {
    padding: 20rpx 0;
    font-size: 26rpx;
  }

  .message-item {
    margin: 16rpx 24rpx;
    padding: 24rpx;
  }

  .message-item.unread {
    padding-left: 18rpx;
  }

  .popup-content {
    margin: 60rpx 24rpx;
  }

  .mark-all-read-btn {
    padding: 10rpx 20rpx;
    font-size: 22rpx;
  }
}
</style>