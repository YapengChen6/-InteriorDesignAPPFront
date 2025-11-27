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
              <button @click="markAllAsRead" class="mark-all-read-btn" :disabled="!hasUnreadMessages || loading">
                <text class="btn-text">{{ loading ? '处理中...' : '全部已读' }}</text>
              </button>
            </view>
          </view>
        </view>
      </view>

      <!-- 搜索框 -->
      <view class="search-container">
        <view class="search-box">
          <text class="search-icon">🔍</text>
          <input
            v-model="searchKeyword"
            class="search-input"
            placeholder="搜索消息..."
            @input="onSearch"
          />
          <text v-if="searchKeyword" class="clear-icon" @click="clearSearch">×</text>
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
            <text v-if="tab.unreadCount > 0" class="badge">{{ tab.unreadCount > 99 ? '99+' : tab.unreadCount }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 消息列表 - 添加顶部内边距避免被导航栏遮挡 -->
    <scroll-view
      class="message-list"
      scroll-y="true"
      refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
      :style="{ paddingTop: navHeight + 'px' }"
    >
      <!-- 下拉刷新 -->
      <view class="refresher" v-if="refreshing">
        <view class="refresher-loading">
          <view class="loading-spinner"></view>
          <text class="refresher-text">刷新中...</text>
        </view>
      </view>

      <!-- 加载状态 -->
      <view v-if="loading && messages.length === 0" class="loading-state">
        <view class="loading-spinner large"></view>
        <text class="loading-text">加载中...</text>
      </view>

      <!-- 空状态 -->
      <view v-else-if="filteredMessages.length === 0 && !loading" class="empty-state">
        <image class="empty-image" src="/static/images/empty-message.png" mode="aspectFit"></image>
        <text class="empty-text">{{ searchKeyword ? '未找到相关消息' : '暂无消息' }}</text>
        <text class="empty-desc">{{ searchKeyword ? '尝试更换搜索关键词' : '当有新消息时，会在这里显示' }}</text>
        <button v-if="searchKeyword" class="retry-btn" @click="clearSearch">
          <text class="retry-text">清空搜索</text>
        </button>
      </view>

      <!-- 消息项 -->
      <view
        v-for="message in filteredMessages"
        :key="message.messageId"
        :class="['message-item', { unread: !message.read }]"
        @click="openMessage(message)"
      >
        <!-- 左侧图标区域 -->
        <view class="message-left">
          <view class="message-avatar" :class="message.type">
            <text class="avatar-icon">{{ getAvatarIcon(message.type) }}</text>
          </view>
        </view>

        <!-- 中间内容区域 -->
        <view class="message-content">
          <view class="message-header">
            <text class="message-title">{{ message.title }}</text>
            <text class="message-time">{{ formatTime(message.time) }}</text>
          </view>
          <view class="message-preview">
            <text class="preview-text">{{ message.content }}</text>
          </view>
        </view>

        <!-- 右侧操作区域 -->
        <view class="message-right">
          <view class="message-actions">
            <button @click.stop="deleteMessage(message)" class="action-btn delete-btn" :disabled="loading">
              <text class="btn-text">删除</text>
            </button>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="hasMore && filteredMessages.length > 0" class="load-more">
        <view class="load-more-content" @click="loadMore">
          <text class="load-more-text">{{ loadingMore ? '加载中...' : '加载更多' }}</text>
        </view>
      </view>

      <!-- 没有更多数据 -->
      <view v-if="!hasMore && filteredMessages.length > 0" class="no-more">
        <text class="no-more-text">没有更多消息了</text>
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

    <!-- 操作反馈 Toast -->
    <view v-if="toast.show" class="toast-message" :class="toast.type">
      <text class="toast-icon">{{ toast.icon }}</text>
      <text class="toast-text">{{ toast.message }}</text>
    </view>
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

export default {
  name: 'MessageCenter',
  data() {
    return {
      activeTab: 'all',
      loading: false,
      loadingMore: false,
      refreshing: false,
      hasMore: true,
      selectedMessage: null,
      searchKeyword: '',
      navHeight: 160,
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
      messages: [],
      pagination: {
        pageNum: 1,
        pageSize: 20,
        total: 0
      },
      currentUser: {
        userId: 1,
        conversationId: 1
      }
    }
  },
  computed: {
    filteredMessages() {
      let filtered = this.messages
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase()
        filtered = filtered.filter(msg =>
          (msg.title || '').toLowerCase().includes(keyword) ||
          (msg.content || '').toLowerCase().includes(keyword) ||
          (msg.sender || '').toLowerCase().includes(keyword)
        )
      }
      switch (this.activeTab) {
        case 'unread':
          return filtered.filter(msg => !msg.read)
        case 'project':
          return filtered.filter(msg => msg.type === 'project')
        case 'system':
          return filtered.filter(msg => msg.type === 'system' || msg.type === 'chat-request')
        default:
          return filtered
      }
    },
    hasUnreadMessages() {
      return this.messages.some(msg => !msg.read)
    }
  },
  methods: {
    getAvatarIcon(type) {
      const icons = { project: '🏠', system: '🔔', chat: '💬', 'chat-request': '🤝' }
      return icons[type] || '✉️'
    },
    formatTime(time) {
      if (!(time instanceof Date)) time = new Date(time)
      const now = new Date()
      const diff = now - time
      const oneDay = 24 * 60 * 60 * 1000
      if (diff < oneDay) {
        return time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      } else if (diff < 7 * oneDay) {
        const weekdays = ['日', '一', '二', '三', '四', '五', '六']
        return `周${weekdays[time.getDay()]}`
      }
      return `${time.getMonth() + 1}/${time.getDate()}`
    },
    formatFullTime(time) {
      if (!(time instanceof Date)) time = new Date(time)
      return time.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    async loadMessages(refresh = false) {
      if (this.loading) return
      this.loading = true
      if (refresh) this.refreshing = true
      try {
        // 确保使用当前登录用户的 userId，而不是依赖全局缓存里的默认值
        let userId = this.currentUser && this.currentUser.userId ? this.currentUser.userId : 0
        if (!userId) {
          try {
            const storedId = uni.getStorageSync('userId')
            if (storedId) {
              userId = parseInt(storedId)
              this.currentUser.userId = userId
            }
          } catch (e) {
            console.warn('读取本地 userId 失败:', e)
          }
        }
        console.log('📩 加载未读消息, userId =', userId)
        const res = await getUnreadMessages(userId)
        const list = (res && res.data) || []
        this.messages = list.map((item, index) => {
          const time = item.sendTime ? new Date(item.sendTime) : new Date()
          let type = 'system'
          let title = '未读消息 #' + (item.messageId || index + 1)
          let content = item.content || ''
          let sender = item.senderName || '系统消息'
          let fromUserId = null
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
            } catch (e) {
              console.warn('解析系统消息内容失败:', item.content, e)
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
            fromUserId,
            conversationId: item.conversationId,
            senderId: item.senderId
          }
        })
        this.hasMore = false
        this.pagination.pageNum = 1
        this.pagination.total = this.messages.length
        await this.updateUnreadCounts()
      } catch (e) {
        console.error('加载消息异常:', e)
        this.showToast('获取未读消息失败', '❌', 'error')
      } finally {
        this.loading = false
        this.refreshing = false
        this.loadingMore = false
      }
    },
    async updateUnreadCounts() {
      try {
        const res = await getUnreadCount(this.currentUser.userId)
        if (res.code === 200) {
          const totalUnread = res.data
          const projectUnread = this.messages.filter(m => m.type === 'project' && !m.read).length
          const systemUnread = this.messages.filter(
            m => (m.type === 'system' || m.type === 'chat-request') && !m.read
          ).length
          this.tabs[0].unreadCount = totalUnread
          this.tabs[1].unreadCount = totalUnread
          this.tabs[2].unreadCount = projectUnread
          this.tabs[3].unreadCount = systemUnread
        }
      } catch (e) {
        console.error('获取未读数量异常:', e)
      }
    },
    openMessage(message) {
      this.selectedMessage = message
      this.$refs.messagePopup.open()
      if (!message.read && message.type !== 'chat-request') {
        this.markAsRead(message)
      }
    },
    closePopup() {
      this.$refs.messagePopup.close()
      this.selectedMessage = null
    },
    async markAsRead(message) {
      if (this.loading || !message || message.read) return
      try {
        this.loading = true
        const res = await markMessageAsRead(message.messageId, this.currentUser.userId)
        if (res.code === 200) {
          message.read = true
          await this.updateUnreadCounts()
          this.showToast('标记为已读', '✓', 'success')
        } else {
          this.showToast('操作失败', '❌', 'error')
        }
      } catch (e) {
        console.error('标记已读异常:', e)
        this.showToast('网络异常', '❌', 'error')
      } finally {
        this.loading = false
      }
    },
    async acceptChat(message) {
      if (!message || message.accepting) return
      try {
        message.accepting = true
        const messageId = message.messageId || message.id
        const res = await request({
          url: `/api/message/chat-request/accept/${messageId}`,
          method: 'post'
        })
        if (!res || res.code !== 200 || !res.data || !res.data.conversationId) {
          this.showToast((res && res.msg) || '同意聊天请求失败', '!', 'info')
          return
        }
        message.read = true
        await this.updateUnreadCounts()
        this.showToast('已同意聊天请求', '✓', 'success')
        this.closePopup()
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
      if (this.loading || !this.hasUnreadMessages) return
      try {
        this.loading = true
        const ids = this.messages.filter(m => !m.read).map(m => m.messageId)
        if (!ids.length) return
        // 这里直接调用接口，data 传递纯数组 [id1, id2, ...]
        const res = await request({
          url: '/api/message/mark-read-batch',
          method: 'post',
          params: { userId: this.currentUser.userId },
          data: ids
        })
        if (res.code === 200) {
          this.messages.forEach(m => {
            m.read = true
          })
          await this.updateUnreadCounts()
          this.showToast('全部标记为已读', '✓', 'success')
        } else {
          this.showToast('操作失败', '❌', 'error')
        }
      } catch (e) {
        console.error('批量标记已读异常:', e)
        this.showToast('网络异常', '❌', 'error')
      } finally {
        this.loading = false
      }
    },
    async deleteMessage(message) {
      uni.showModal({
        title: '删除确认',
        content: '确定要删除这条消息吗？',
        confirmColor: '#FF4757',
        success: async res => {
          if (!res.confirm) return
          try {
            this.loading = true
            const resp = await deleteMessage(message.messageId, this.currentUser.userId)
            if (resp.code === 200) {
              const idx = this.messages.findIndex(m => m.messageId === message.messageId)
              if (idx !== -1) {
                this.messages.splice(idx, 1)
                await this.updateUnreadCounts()
                this.showToast('删除成功', '🗑️', 'success')
              }
            } else {
              this.showToast('删除失败', '❌', 'error')
            }
          } catch (e) {
            console.error('删除消息异常:', e)
            this.showToast('网络异常', '❌', 'error')
          } finally {
            this.loading = false
          }
        }
      })
    },
    switchTab(tabId) {
      this.activeTab = tabId
      this.searchKeyword = ''
    },
    onRefresh() {
      this.refreshing = true
      this.loadMessages(true)
    },
    async loadMore() {
      if (this.loadingMore || !this.hasMore) return
      this.loadingMore = true
      await this.loadMessages(false)
    },
    onSearch() {},
    clearSearch() {
      this.searchKeyword = ''
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
    calculateNavHeight() {
      const query = uni.createSelectorQuery().in(this)
      query
        .select('.navbar-fixed')
        .boundingClientRect(data => {
          if (data) this.navHeight = data.height
        })
        .exec()
    },
    async initUserInfo() {
      try {
        const res = await getUserProfile()
        if (res && res.code === 200 && res.data) {
          const user = res.data
          this.currentUser.userId = user.userId || user.id || 0
          try {
            uni.setStorageSync('userId', this.currentUser.userId)
            uni.setStorageSync('userInfo', user)
          } catch (e) {
            console.warn('cache userId failed', e)
          }
        }
      } catch (e) {
        console.error('initUserInfo  /api/users/profile :', e)
      }
    },
    goToChatList() {
      uni.navigateTo({ url: '/pages/chat/chatMain' })
    }
  },
  async onLoad() {
    // 先拿到用户信息里的 userId，再去拉未读消息，避免传 0
    await this.initUserInfo()
    await this.loadMessages(true)
    this.$nextTick(() => {
      setTimeout(() => {
        this.calculateNavHeight()
      }, 100)
    })
  },
  onReady() {
    this.calculateNavHeight()
  },
  onPullDownRefresh() {
    this.onRefresh()
    setTimeout(() => {
      uni.stopPullDownRefresh()
    }, 1000)
  }
}
</script>


<style scoped>
.message-center {
  min-height: 100vh;
  background-color: #f7f8fa;
}
.navbar-fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background-color: #ffffff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  padding-top: 40rpx; /* 顶部预留空间，让自定义导航整体下移一点 */
}
.navbar {
  padding: 0 24rpx 0 24rpx;
}
.navbar-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
.navbar-title {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
.title-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}
.navbar-buttons {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.chat-btn,
.mark-all-read-btn {
  margin-left: 16rpx;
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  border: none;
  background-color: #f5f5f5;
}
.chat-btn {
  background-color: #007aff;
}
.chat-btn .btn-text {
  color: #ffffff;
}
.mark-all-read-btn:disabled {
  opacity: 0.5;
}
.btn-text {
  font-size: 24rpx;
}
.search-container {
  padding: 16rpx 24rpx 8rpx 24rpx;
}
.search-box {
  display: flex;
  height: 100rpx;
  flex-direction: row;
  align-items: center;
  background-color: #f5f6fa;
  border-radius: 32rpx;
  padding: 8rpx 16rpx;
}
.search-icon {
  font-size: 24rpx;
  margin-right: 8rpx;
}
.search-input {
  flex: 1;
  font-size: 26rpx;
  padding: 6rpx 0;
}
.clear-icon {
  font-size: 28rpx;
  color: #999999;
  padding-left: 8rpx;
}
.tabs-container {
  padding: 8rpx 0 0 0;
}
.tabs-fullwidth {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  border-bottom: 1rpx solid #f0f0f0;
  background-color: #ffffff;
}
.tab {
  flex: 1;
  padding: 16rpx 0;
  text-align: center;
}
.tab-text {
  font-size: 26rpx;
  color: #666666;
}
.tab.active .tab-text {
  color: #007aff;
  font-weight: 600;
}
.badge {
  margin-left: 6rpx;
  padding: 2rpx 10rpx;
  border-radius: 16rpx;
  background-color: #ff3b30;
  color: #ffffff;
  font-size: 20rpx;
}
.message-list {
  padding: 0 24rpx 40rpx 24rpx;
  box-sizing: border-box;
}
.refresher {
  padding: 16rpx 0;
  align-items: center;
  justify-content: center;
}
.refresher-loading {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}
.loading-spinner {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  border: 4rpx solid #e5e5e5;
  border-top-color: #007aff;
  animation: spin 1s linear infinite;
}
.loading-spinner.large {
  width: 40rpx;
  height: 40rpx;
}
.refresher-text,
.loading-text {
  font-size: 24rpx;
  color: #999999;
  margin-left: 12rpx;
}
.loading-state {
  padding: 40rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.empty-state {
  padding: 80rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.empty-image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 16rpx;
}
.empty-text {
  font-size: 28rpx;
  color: #666666;
}
.empty-desc {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #999999;
}
.retry-btn {
  margin-top: 16rpx;
  padding: 8rpx 24rpx;
  border-radius: 24rpx;
  background-color: #007aff;
}
.retry-text {
  color: #ffffff;
  font-size: 24rpx;
}
.message-item {
  margin-top: 16rpx;
  padding: 20rpx 16rpx;
  border-radius: 16rpx;
  background-color: #ffffff;
  display: flex;
  flex-direction: row;
}
.message-item.unread {
  background-color: #eaf3ff;
}
.message-left {
  margin-right: 16rpx;
}
.message-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background-color: #f5f5f5;
  align-items: center;
  justify-content: center;
}
.avatar-icon {
  font-size: 32rpx;
}
.message-content {
  flex: 1;
}
.message-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
.message-title {
  font-size: 28rpx;
  color: #333333;
}
.message-time {
  font-size: 22rpx;
  color: #999999;
  margin-left: 16rpx;
}
.message-preview {
  margin-top: 8rpx;
}
.preview-text {
  font-size: 24rpx;
  color: #666666;
}
.message-right {
  margin-left: 12rpx;
  justify-content: center;
}
.message-actions .action-btn {
  padding: 4rpx 12rpx;
  border-radius: 24rpx;
  background-color: #ff3b30;
}
.message-actions .btn-text {
  color: #ffffff;
  font-size: 22rpx;
}
.load-more {
  padding: 24rpx 0 40rpx 0;
  align-items: center;
  justify-content: center;
}
.load-more-content {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.load-more-text {
  margin-left: 12rpx;
  font-size: 24rpx;
  color: #999999;
}
.no-more {
  padding: 24rpx 0 40rpx 0;
  align-items: center;
  justify-content: center;
}
.no-more-text {
  font-size: 24rpx;
  color: #cccccc;
}
.popup-content {
  padding: 24rpx 24rpx 32rpx 24rpx;
}
.popup-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}
.popup-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
}
.close-btn {
  padding: 4rpx 8rpx;
}
.close-icon {
  font-size: 28rpx;
  color: #999999;
}
.popup-body {
  margin-bottom: 24rpx;
}
.message-meta {
  font-size: 24rpx;
  color: #999999;
  margin-bottom: 12rpx;
}
.message-detail {
  font-size: 26rpx;
  color: #333333;
  line-height: 1.6;
}
.popup-footer {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
}
.popup-btn {
  padding: 10rpx 24rpx;
  border-radius: 24rpx;
  margin-left: 12rpx;
}
.cancel-btn {
  background-color: #f5f5f5;
}
.confirm-btn {
  background-color: #007aff;
}
.confirm-btn text {
  color: #ffffff;
}
.toast-message {
  position: fixed;
  bottom: 80rpx;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 32rpx;
  padding: 16rpx 24rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  max-width: 80%;
}
.toast-icon {
  font-size: 28rpx;
  color: #ffffff;
  margin-right: 8rpx;
}
.toast-text {
  font-size: 24rpx;
  color: #ffffff;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
