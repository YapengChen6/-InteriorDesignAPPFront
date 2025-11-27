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
              <button @click="toggleBatchMode" class="batch-btn" :class="{ active: batchMode }">
                <text class="btn-text">{{ batchMode ? '取消' : '管理' }}</text>
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
        :class="['message-item', { unread: !message.read, 'batch-selected': selectedMessages.includes(message.messageId) }]"
        @click="onMessageClick(message)"
      >
        <!-- 左侧勾选框（批量模式下显示） -->
        <view v-if="batchMode" class="message-checkbox">
          <view 
            class="checkbox" 
            :class="{ checked: selectedMessages.includes(message.messageId) }"
            @click.stop="toggleMessageSelection(message.messageId)"
          >
            <text v-if="selectedMessages.includes(message.messageId)" class="check-icon">✓</text>
          </view>
        </view>

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
          <!-- 未读气泡 -->
          <view v-if="!message.read" class="unread-badge">
            <text class="unread-count">{{ getUnreadCount(message) > 99 ? '99+' : getUnreadCount(message) }}</text>
          </view>
          <!-- 已读按钮（仅在未读时显示） -->
          <view v-if="!message.read" class="message-actions">
            <button @click.stop="markAsRead(message)" class="action-btn read-btn" :disabled="loading">
              <text class="btn-text">已读</text>
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
        <!-- 右上角关闭按钮 -->
        <view class="close-btn" @click="closePopup">
          <text class="close-icon">×</text>
        </view>
        
        <view class="popup-header">
          <text class="popup-title">{{ selectedMessage.title }}</text>
        </view>
        <view class="popup-body">
          <view class="message-meta">
            <text class="sender">对方用户昵称：{{ selectedMessage.sender }}</text>
            <text class="time">发送时间：{{ formatFullTime(selectedMessage.time) }}</text>
          </view>
          <view class="message-detail">
            <text>{{ selectedMessage.content }}</text>
          </view>
        </view>
        <view class="popup-footer">
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

    <!-- 批量操作栏 -->
    <view v-if="batchMode && selectedMessages.length > 0" class="batch-actions-bar">
      <view class="batch-info">
        <text class="batch-count">已选择 {{ selectedMessages.length }} 条消息</text>
      </view>
      <view class="batch-buttons">
        <button @click="batchMarkAsRead" class="batch-action-btn mark-read-btn" :disabled="loading">
          <text class="btn-text">标记已读</text>
        </button>
        <button @click="showDeleteConfirm" class="batch-action-btn delete-btn" :disabled="loading">
          <text class="btn-text">删除</text>
        </button>
      </view>
    </view>

    <!-- 删除确认弹窗 -->
    <uni-popup ref="deleteConfirmPopup" type="center" background-color="#fff" :is-mask-click="false">
      <view class="confirm-popup">
        <view class="confirm-header">
          <text class="confirm-title">确认删除</text>
        </view>
        <view class="confirm-body">
          <text class="confirm-text">确定要删除选中的 {{ selectedMessages.length }} 条消息吗？删除后无法恢复。</text>
        </view>
        <view class="confirm-footer">
          <button class="confirm-btn cancel-btn" @click="closeDeleteConfirm">取消</button>
          <button class="confirm-btn delete-btn" @click="confirmDelete" :disabled="loading">
            <text class="btn-text">{{ loading ? '删除中...' : '确认删除' }}</text>
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
} from '@/api/message_new'
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
      },
      // 批量操作相关
      batchMode: false,
      selectedMessages: []
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
    getUnreadCount(message) {
      // 返回消息的未读数量，最多显示99+
      if (!message || message.read) return 0
      return message.unreadCount || 1
    },
    formatTime(time) {
      if (!time) return '暂无时间'
      
      // 确保 time 是 Date 对象
      if (!(time instanceof Date)) {
        try {
          // 如果是字符串，替换 - 为 / 以兼容 iOS
          if (typeof time === 'string') {
            time = new Date(time.replace(/-/g, '/'))
          } else {
            time = new Date(time)
          }
        } catch (e) {
          console.error('时间解析失败:', time, e)
          return '时间错误'
        }
      }
      
      // 检查日期是否有效
      if (isNaN(time.getTime())) {
        console.error('无效的日期:', time)
        return '无效时间'
      }
      
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
      if (!time) return '暂无时间'
      
      // 确保 time 是 Date 对象
      if (!(time instanceof Date)) {
        try {
          // 如果是字符串，替换 - 为 / 以兼容 iOS
          if (typeof time === 'string') {
            time = new Date(time.replace(/-/g, '/'))
          } else {
            time = new Date(time)
          }
        } catch (e) {
          console.error('时间解析失败:', time, e)
          return '时间错误'
        }
      }
      
      // 检查日期是否有效
      if (isNaN(time.getTime())) {
        console.error('无效的日期:', time)
        return '无效时间'
      }
      
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
        console.log('📩 加载未读消息')
        const res = await getUnreadMessages()
        const list = (res && res.data) || []
        
        // 调试：查看第一条消息的原始数据
        if (list.length > 0) {
          console.log('🔍 第一条消息原始数据:', JSON.stringify(list[0], null, 2))
        }
        
        this.messages = list.map((item, index) => {
          // 解析时间，支持多种格式
          let time = null
          if (item.sendTime) {
            try {
              // 判断是否为时间戳（数字或纯数字字符串）
              const timestamp = typeof item.sendTime === 'number' 
                ? item.sendTime 
                : (typeof item.sendTime === 'string' && /^\d+$/.test(item.sendTime))
                  ? parseInt(item.sendTime)
                  : null
              
              if (timestamp) {
                // 时间戳格式
                time = new Date(timestamp)
              } else if (typeof item.sendTime === 'string') {
                // 日期字符串格式，替换 - 为 / 兼容 iOS
                const timeStr = item.sendTime.replace(/-/g, '/')
                time = new Date(timeStr)
              }
              
              // 检查日期是否有效
              if (!time || isNaN(time.getTime())) {
                console.warn('⚠️ 时间解析失败，原始值:', item.sendTime)
                time = null
              }
            } catch (e) {
              console.error('❌ 时间解析异常:', item.sendTime, e)
              time = null
            }
          }
          
          // 如果时间解析失败，使用当前时间作为最后的默认值
          if (!time) {
            console.warn('⚠️ 消息没有有效时间，使用当前时间')
            time = new Date()
          }
          let type = 'system'
          let title = '未读消息 #' + (item.messageId || index + 1)
          let content = item.content || ''
          // 将系统消息转换为实际发送消息的人
          let sender = item.senderName || (item.senderId ? `用户${item.senderId}` : '系统消息')
          let fromUserId = null
          
          // 处理聊天请求消息
          if (item.messageType === 3 && item.content) {
            try {
              const parsed = JSON.parse(item.content)
              if (parsed && parsed.type === 'CHAT_REQUEST') {
                type = 'chat-request'
                fromUserId = parsed.fromUserId || item.senderId || null
                const fromName = parsed.fromNickName || sender || '对方用户'
                title = `${fromName} 请求和你聊天`
                // 列表与详情中统一展示为固定文案
                content = '对方用户申请与您进行沟通'
                sender = fromName
              }
            } catch (e) {
              console.warn('解析系统消息内容失败:', item.content, e)
            }
          }
          
          // 对于普通消息，如果有发送者信息，使用发送者作为消息来源
          if (item.senderId && !sender.includes('系统')) {
            type = item.messageType === 1 ? 'chat' : 'system'
            title = sender
            content = item.content || content
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
            senderId: item.senderId,
            unreadCount: item.readStatus === 1 ? 0 : 1 // 未读消息数量
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
        const res = await getUnreadCount()
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
      // 点击查看消息后自动标记为已读
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
    },
    // 批量操作相关方法
    toggleBatchMode() {
      this.batchMode = !this.batchMode
      if (!this.batchMode) {
        this.selectedMessages = []
      }
    },
    onMessageClick(message) {
      if (this.batchMode) {
        this.toggleMessageSelection(message.messageId)
      } else {
        this.openMessage(message)
      }
    },
    toggleMessageSelection(messageId) {
      const index = this.selectedMessages.indexOf(messageId)
      if (index > -1) {
        this.selectedMessages.splice(index, 1)
      } else {
        this.selectedMessages.push(messageId)
      }
    },
    async batchMarkAsRead() {
      if (this.loading || this.selectedMessages.length === 0) return
      try {
        this.loading = true
        const promises = this.selectedMessages.map(messageId => {
          const message = this.messages.find(m => m.messageId === messageId)
          return message ? markMessageAsRead(messageId, this.currentUser.userId) : Promise.resolve()
        })
        await Promise.all(promises)
        
        // 更新本地消息状态
        this.messages.forEach(message => {
          if (this.selectedMessages.includes(message.messageId)) {
            message.read = true
          }
        })
        
        await this.updateUnreadCounts()
        this.selectedMessages = []
        this.batchMode = false
        this.showToast(`已标记 ${promises.length} 条消息为已读`, '✓', 'success')
      } catch (e) {
        console.error('批量标记已读异常:', e)
        this.showToast('操作失败', '❌', 'error')
      } finally {
        this.loading = false
      }
    },
    showDeleteConfirm() {
      this.$refs.deleteConfirmPopup.open()
    },
    closeDeleteConfirm() {
      this.$refs.deleteConfirmPopup.close()
    },
    async confirmDelete() {
      if (this.loading || this.selectedMessages.length === 0) return
      try {
        this.loading = true
        const promises = this.selectedMessages.map(messageId => {
          return deleteMessage(messageId, this.currentUser.userId)
        })
        await Promise.all(promises)
        
        // 从本地列表中移除
        this.messages = this.messages.filter(message => !this.selectedMessages.includes(message.messageId))
        
        await this.updateUnreadCounts()
        this.selectedMessages = []
        this.batchMode = false
        this.closeDeleteConfirm()
        this.showToast(`已删除 ${promises.length} 条消息`, '✓', 'success')
      } catch (e) {
        console.error('批量删除异常:', e)
        this.showToast('删除失败', '❌', 'error')
      } finally {
        this.loading = false
      }
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
.mark-all-read-btn,
.batch-btn {
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
.batch-btn {
  background-color: #f5f5f5;
}
.batch-btn.active {
  background-color: #007aff;
}
.batch-btn.active .btn-text {
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
  position: relative;
}
.message-item.unread {
  background-color: #eaf3ff;
}
.message-item.batch-selected {
  background-color: #f0f8ff;
  border: 2rpx solid #007aff;
}
.message-checkbox {
  margin-right: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.checkbox {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 2rpx solid #cccccc;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.checkbox.checked {
  background-color: #007aff;
  border-color: #007aff;
}
.check-icon {
  color: #ffffff;
  font-size: 20rpx;
  font-weight: bold;
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
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.unread-badge {
  background-color: #ff3b30;
  border-radius: 18rpx;
  padding: 2rpx 10rpx;
  min-width: 36rpx;
  height: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.unread-count {
  color: #ffffff;
  font-size: 20rpx;
  font-weight: bold;
  line-height: 1;
}
.message-actions .action-btn {
  padding: 4rpx 12rpx;
  border-radius: 24rpx;
  background-color: #007aff;
}
.message-actions .action-btn.read-btn {
  background-color: #34c759;
}
.message-actions .action-btn:disabled {
  background-color: #cccccc;
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

/* 批量操作栏样式 */
.batch-actions-bar {
  position: fixed;
  bottom: 80rpx; /* 上移80rpx，避免被底部导航栏遮挡 */
  left: 0;
  right: 0;
  background-color: #ffffff;
  border-top: 1rpx solid #f0f0f0;
  padding: 20rpx 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
  box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.1); /* 添加阴影效果 */
}
.batch-info {
  flex: 1;
}
.batch-count {
  font-size: 26rpx;
  color: #333333;
  font-weight: 500;
}
.batch-buttons {
  display: flex;
  gap: 16rpx;
}
.batch-action-btn {
  padding: 12rpx 24rpx;
  border-radius: 24rpx;
  border: none;
  font-size: 24rpx;
}
.batch-action-btn.mark-read-btn {
  background-color: #34c759;
}
.batch-action-btn.delete-btn {
  background-color: #ff3b30;
}
.batch-action-btn .btn-text {
  color: #ffffff;
}

/* 确认弹窗样式 */
.confirm-popup {
  width: 560rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  overflow: hidden;
}
.confirm-header {
  padding: 32rpx 24rpx 16rpx 24rpx;
  text-align: center;
}
.confirm-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}
.confirm-body {
  padding: 16rpx 24rpx 32rpx 24rpx;
  text-align: center;
}
.confirm-text {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.5;
}
.confirm-footer {
  display: flex;
  border-top: 1rpx solid #f0f0f0;
}
.confirm-btn {
  flex: 1;
  padding: 24rpx 0;
  border: none;
  background-color: transparent;
  font-size: 28rpx;
}
.confirm-btn.cancel-btn {
  color: #666666;
  border-right: 1rpx solid #f0f0f0;
}
.confirm-btn.delete-btn {
  color: #ff3b30;
  font-weight: 500;
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
  position: relative;
}
.popup-header {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-bottom: 16rpx;
  padding-right: 40rpx; /* 为右上角关闭按钮预留空间 */
}
.popup-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
}
.close-btn {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #f5f5f5;
}
.close-icon {
  font-size: 20rpx; /* 约为字体的1/3大小 */
  color: #666666;
  line-height: 1;
}
.popup-body {
  margin-bottom: 24rpx;
}
.message-meta {
  font-size: 24rpx;
  color: #999999;
  margin-bottom: 12rpx;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.sender {
  color: #666666;
}
.time {
  color: #999999;
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
