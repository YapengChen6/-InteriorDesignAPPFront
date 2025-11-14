<template>
  <view class="message-center">
    <!-- 固定顶部导航栏 -->
    <view class="navbar-fixed">
      <view class="navbar">
        <view class="navbar-content">
          <view class="navbar-title">
            <text class="title-text">消息中心</text>
            <button @click="markAllAsRead" class="mark-all-read-btn" :disabled="!hasUnreadMessages || loading">
              <text class="btn-text">{{ loading ? '处理中...' : '全部已读' }}</text>
            </button>
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
          <button v-if="!selectedMessage.read" class="popup-btn confirm-btn" @click="markAsRead(selectedMessage)">
            {{ loading ? '处理中...' : '标记已读' }}
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
  getMessageList, 
  getUnreadCount, 
  getUnreadMessages, 
  markMessageAsRead, 
  markMessagesAsReadBatch, 
  deleteMessage 
} from '@/api/message'

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
      navHeight: 160, // 增加高度适应搜索框
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
      // 当前用户信息（从全局状态获取）
      currentUser: {
        userId: 1,
        conversationId: 1
      }
    }
  },
  computed: {
    filteredMessages() {
      let filtered = this.messages;
      
      // 搜索过滤
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase();
        filtered = filtered.filter(msg => 
          msg.title.toLowerCase().includes(keyword) || 
          msg.content.toLowerCase().includes(keyword) ||
          msg.sender.toLowerCase().includes(keyword)
        );
      }
      
      // 标签过滤
      switch (this.activeTab) {
        case 'unread':
          return filtered.filter(msg => !msg.read)
        case 'project':
          return filtered.filter(msg => msg.type === 'project')
        case 'system':
          return filtered.filter(msg => msg.type === 'system')
        default:
          return filtered
      }
    },
    hasUnreadMessages() {
      return this.messages.some(msg => !msg.read)
    }
  },
  methods: {
    // 格式化消息数据
    formatMessage(apiMessage) {
      return {
        messageId: apiMessage.messageId,
        type: this.getMessageType(apiMessage.messageType),
        title: apiMessage.title || '新消息',
        content: apiMessage.content,
        time: new Date(apiMessage.sendTime),
        read: apiMessage.readStatus === 1, // 假设1为已读，0为未读
        sender: apiMessage.senderName || '系统',
        conversationId: apiMessage.conversationId
      }
    },
    
    getMessageType(messageType) {
      const typeMap = {
        'project': 'project',
        'system': 'system',
        'notification': 'system',
        'chat': 'project'
      }
      return typeMap[messageType] || 'system'
    },
    
    getAvatarIcon(type) {
      const icons = {
        project: '🏠',
        system: '🔔',
        chat: '💬'
      }
      return icons[type] || '✉️'
    },
    
    formatTime(time) {
      if (!(time instanceof Date)) {
        time = new Date(time)
      }
      const now = new Date()
      const diff = now - time
      const oneDay = 24 * 60 * 60 * 1000
      
      if (diff < oneDay) {
        // 今天内的消息显示时间
        return time.toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      } else if (diff < 7 * oneDay) {
        // 一周内的消息显示星期
        const weekdays = ['日', '一', '二', '三', '四', '五', '六']
        return `周${weekdays[time.getDay()]}`
      } else {
        // 更早的消息显示日期
        return `${time.getMonth() + 1}/${time.getDate()}`
      }
    },
    
    formatFullTime(time) {
      if (!(time instanceof Date)) {
        time = new Date(time)
      }
      return time.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    // 加载消息列表
    async loadMessages(refresh = false) {
      if (this.loading) return
      
      try {
        this.loading = true
        if (refresh) {
          this.pagination.pageNum = 1
          this.hasMore = true
        }
        
        const params = {
          conversationId: this.currentUser.conversationId,
          pageNum: this.pagination.pageNum,
          pageSize: this.pagination.pageSize
        }
        
        const response = await getMessageList(params.conversationId, params.pageNum, params.pageSize)
        
        if (response.code === 200) {
          const newMessages = response.data.map(msg => this.formatMessage(msg))
          
          if (refresh) {
            this.messages = newMessages
          } else {
            this.messages = [...this.messages, ...newMessages]
          }
          
          // 更新分页信息
          this.hasMore = newMessages.length === this.pagination.pageSize
          this.pagination.pageNum++
          
          // 更新未读数量
          await this.updateUnreadCounts()
        } else {
          this.showToast('加载消息失败', '❌', 'error')
        }
      } catch (error) {
        console.error('加载消息异常:', error)
        this.showToast('网络异常，请重试', '❌', 'error')
      } finally {
        this.loading = false
        this.refreshing = false
        this.loadingMore = false
      }
    },
    
    // 更新未读数量
    async updateUnreadCounts() {
      try {
        const response = await getUnreadCount(this.currentUser.userId)
        if (response.code === 200) {
          const totalUnread = response.data
          
          // 获取各类型未读数量（这里需要根据实际业务调整）
          const projectUnread = this.messages.filter(msg => msg.type === 'project' && !msg.read).length
          const systemUnread = this.messages.filter(msg => msg.type === 'system' && !msg.read).length
          
          this.tabs[0].unreadCount = totalUnread
          this.tabs[1].unreadCount = totalUnread
          this.tabs[2].unreadCount = projectUnread
          this.tabs[3].unreadCount = systemUnread
        }
      } catch (error) {
        console.error('获取未读数量异常:', error)
      }
    },
    
    openMessage(message) {
      this.selectedMessage = message
      this.$refs.messagePopup.open()
      if (!message.read) {
        this.markAsRead(message)
      }
    },
    
    closePopup() {
      this.$refs.messagePopup.close()
      this.selectedMessage = null
    },
    
    // 标记单条消息为已读
    async markAsRead(message) {
      if (this.loading) return
      
      try {
        this.loading = true
        const response = await markMessageAsRead(message.messageId, this.currentUser.userId)
        
        if (response.code === 200) {
          message.read = true
          await this.updateUnreadCounts()
          this.showToast('标记为已读', '✓', 'success')
        } else {
          this.showToast('操作失败', '❌', 'error')
        }
      } catch (error) {
        console.error('标记已读异常:', error)
        this.showToast('网络异常', '❌', 'error')
      } finally {
        this.loading = false
      }
    },
    
    // 标记全部为已读
    async markAllAsRead() {
      if (this.loading || !this.hasUnreadMessages) return
      
      try {
        this.loading = true
        const unreadMessages = this.messages.filter(msg => !msg.read)
        const messageIds = unreadMessages.map(msg => msg.messageId)
        
        if (messageIds.length === 0) {
          this.showToast('没有未读消息', 'ℹ️', 'info')
          return
        }
        
        const response = await markMessagesAsReadBatch(messageIds, this.currentUser.userId)
        
        if (response.code === 200) {
          this.messages.forEach(msg => {
            if (!msg.read) msg.read = true
          })
          await this.updateUnreadCounts()
          this.showToast('全部标记为已读', '✓', 'success')
        } else {
          this.showToast('操作失败', '❌', 'error')
        }
      } catch (error) {
        console.error('批量标记已读异常:', error)
        this.showToast('网络异常', '❌', 'error')
      } finally {
        this.loading = false
      }
    },
    
    // 删除消息
    async deleteMessage(message) {
      uni.showModal({
        title: '删除确认',
        content: '确定要删除这条消息吗？',
        confirmColor: '#FF4757',
        success: async (res) => {
          if (res.confirm) {
            try {
              this.loading = true
              const response = await deleteMessage(message.messageId, this.currentUser.userId)
              
              if (response.code === 200) {
                const index = this.messages.findIndex(msg => msg.messageId === message.messageId)
                if (index !== -1) {
                  this.messages.splice(index, 1)
                  await this.updateUnreadCounts()
                  this.showToast('删除成功', '🗑️', 'success')
                }
              } else {
                this.showToast('删除失败', '❌', 'error')
              }
            } catch (error) {
              console.error('删除消息异常:', error)
              this.showToast('网络异常', '❌', 'error')
            } finally {
              this.loading = false
            }
          }
        }
      })
    },
    
    switchTab(tabId) {
      this.activeTab = tabId
      // 切换标签时重置搜索
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
    
    onSearch() {
      // 防抖搜索，可以添加防抖逻辑
      // this.debouncedSearch()
    },
    
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
    
    // 计算导航栏高度
    calculateNavHeight() {
      const query = uni.createSelectorQuery().in(this)
      query.select('.navbar-fixed').boundingClientRect(data => {
        if (data) {
          this.navHeight = data.height
        }
      }).exec()
    },
    
    // 初始化用户信息（从全局状态或缓存获取）
    initUserInfo() {
      // 这里可以从 Vuex、缓存或登录信息中获取
      // const userInfo = uni.getStorageSync('userInfo')
      // if (userInfo) {
      //   this.currentUser.userId = userInfo.userId
      //   this.currentUser.conversationId = userInfo.conversationId
      // }
    }
  },
  
  onLoad() {
    this.initUserInfo()
    this.loadMessages(true)
    
    // 计算导航栏高度
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
  margin-left: auto;
}

.mark-all-read-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-text {
  font-size: 24rpx;
}

/* 搜索框 */
.search-container {
  padding: 20rpx 30rpx;
  background: #fff;
  border-bottom: 1rpx solid #eee;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 20rpx;
  padding: 16rpx 24rpx;
}

.search-icon {
  font-size: 28rpx;
  color: #999;
  margin-right: 16rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.clear-icon {
  font-size: 32rpx;
  color: #999;
  padding: 8rpx;
  cursor: pointer;
}

/* 标签页 */
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

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
  background: #f5f5f5;
}

.loading-spinner.large {
  width: 60rpx;
  height: 60rpx;
  border-width: 4rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
  margin-top: 20rpx;
}

/* 消息项 */
.message-item {
  background: #fff;
  margin: 20rpx 30rpx;
  padding: 30rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: flex-start;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  position: relative;
}

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

/* 中间内容区域 */
.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12rpx;
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

.message-preview {
  margin-top: 8rpx;
}

.preview-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  display: block;
  margin-bottom: 32rpx;
}

.retry-btn {
  background: #007AFF;
  color: white;
  border: none;
  padding: 16rpx 32rpx;
  border-radius: 20rpx;
  font-size: 28rpx;
  cursor: pointer;
}

.retry-text {
  font-size: 28rpx;
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

/* 没有更多数据 */
.no-more {
  padding: 40rpx;
  text-align: center;
  background: #f5f5f5;
}

.no-more-text {
  font-size: 26rpx;
  color: #999;
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

.popup-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.toast-message.error {
  background: rgba(255, 59, 48, 0.9);
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
  
  .search-container {
    padding: 16rpx 24rpx;
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

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .message-center {
    background: #1c1c1e;
  }
  
  .navbar-fixed {
    background: #2c2c2e;
  }
  
  .title-text {
    color: #fff;
  }
  
  .search-box {
    background: #3a3a3c;
  }
  
  .search-input {
    color: #fff;
  }
  
  .search-input::placeholder {
    color: #8e8e93;
  }
  
  .tabs-container {
    background: #2c2c2e;
  }
  
  .tab {
    color: #8e8e93;
  }
  
  .tab.active {
    color: #0a84ff;
  }
  
  .message-list {
    background: #1c1c1e;
  }
  
  .message-item {
    background: #2c2c2e;
  }
  
  .message-title {
    color: #fff;
  }
  
  .preview-text {
    color: #8e8e93;
  }
  
  .action-btn {
    background: #3a3a3c;
    border-color: #3a3a3c;
    color: #8e8e93;
  }
  
  .empty-state {
    background: #1c1c1e;
  }
  
  .empty-text {
    color: #8e8e93;
  }
  
  .empty-desc {
    color: #636366;
  }
}
</style>