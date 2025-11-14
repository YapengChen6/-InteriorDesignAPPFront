<template>
  <view class="chat-list-container">
    <!-- 顶部导航 -->
    <view class="chat-header">
      <text class="header-title">聊天</text>
      <button class="header-btn" @click="startNewChat">
        <text class="btn-icon">+</text>
      </button>
    </view>

    <!-- 搜索框 -->
    <view class="search-box">
      <input
        v-model="searchText"
        class="search-input"
        type="text"
        placeholder="搜索聊天..."
        @input="filterChats"
      />
      <text class="search-icon">🔍</text>
    </view>

    <!-- 分类标签页 -->
    <view class="category-tabs">
      <view
        v-for="tab in categoryTabs"
        :key="tab.id"
        :class="['tab-item', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        <text class="tab-text">{{ tab.label }}</text>
        <text v-if="tab.count > 0" class="tab-badge">{{ tab.count }}</text>
      </view>
    </view>

    <!-- 聊天列表 -->
    <scroll-view class="chat-list" scroll-y="true">
      <!-- 空状态 -->
      <view v-if="filteredChats.length === 0" class="empty-state">
        <text class="empty-icon">💬</text>
        <text class="empty-text">暂无聊天</text>
        <text class="empty-desc">开始与设计师或监理沟通</text>
      </view>

      <!-- 聊天项 -->
      <view
        v-for="chat in filteredChats"
        :key="chat.id"
        :class="['chat-item', { unread: chat.unreadCount > 0 }]"
        @click="openChat(chat)"
      >
        <image class="chat-avatar" :src="chat.avatar" mode="aspectFill"></image>

        <view class="chat-content">
          <view class="chat-header-row">
            <text class="chat-name">{{ chat.name }}</text>
            <text class="chat-time">{{ formatTime(chat.lastMessageTime) }}</text>
          </view>
          <view class="chat-preview">
            <text class="preview-text">{{ chat.lastMessage }}</text>
            <text v-if="chat.unreadCount > 0" class="unread-badge">{{ chat.unreadCount }}</text>
          </view>
        </view>

        <view class="chat-actions">
          <button class="action-btn" @click.stop="deleteChat(chat)">
            <text class="action-icon">🗑️</text>
          </button>
        </view>
      </view>
    </scroll-view>

    <!-- 通过手机号添加新聊天弹窗（使用 uni-popup，兼容小程序输入框聚焦） -->
    <uni-popup ref="addChatPopup" type="center" background-color="#fff">
      <view class="add-chat-dialog">
        <view class="add-chat-title">通过手机号添加聊天</view>
        <input
          v-model="addChatPhone"
          class="add-chat-input"
          type="text"
          placeholder="请输入对方手机号"
        />
        <view class="add-chat-actions">
          <button class="add-chat-btn cancel" @click="closeAddChatDialog">取消</button>
          <button class="add-chat-btn confirm" @click="confirmAddChat" :disabled="addingChat">
            {{ addingChat ? '处理中...' : '开始聊天' }}
          </button>
        </view>
      </view>
    </uni-popup>

    <!-- 消息提示 -->
    <view v-if="toast.show" class="toast" :class="toast.type">
      <text class="toast-text">{{ toast.message }}</text>
    </view>
  </view>
</template>

<script>
import request from '@/utils/request'
import * as conversationApi from '@/api/conversation'
import { getRoleSwitchInfo } from '@/api/users'

export default {
  name: 'ChatList',
  data() {
    return {
      searchText: '',
      activeTab: 'all', // 当前选中的分类标签
      chats: [],
      loading: false,
      currentUserId: 0,
      addChatDialogVisible: false,
      addChatPhone: '',
      addingChat: false,
      categoryTabs: [
        { id: 'all', label: '全部', count: 0 },
        { id: 'designer', label: '设计师', count: 0 },
        { id: 'supervisor', label: '监理', count: 0 },
        { id: 'user', label: '普通用户', count: 0 }
      ],
      toast: {
        show: false,
        message: '',
        type: 'success'
      }
    }
  },
  computed: {
    filteredChats() {
      let result = this.chats

      // 1. 按分类过滤
      if (this.activeTab !== 'all') {
        result = result.filter(chat => {
          if (this.activeTab === 'designer') return chat.userRole === 2
          if (this.activeTab === 'supervisor') return chat.userRole === 3
          if (this.activeTab === 'user') return chat.userRole === 1
          return true
        })
      }

      // 2. 按搜索文本过滤
      if (this.searchText) {
        result = result.filter(chat =>
          chat.name.includes(this.searchText) ||
          chat.lastMessage.includes(this.searchText)
        )
      }

      return result
    }
  },
  watch: {
    chats: {
      handler() {
        // 更新分类标签的计数
        this.updateCategoryCount()
      },
      deep: true
    }
  },
  methods: {
    updateCategoryCount() {
      // 计算各分类的聊天数量
      const designerCount = this.chats.filter(c => c.userRole === 2).length
      const supervisorCount = this.chats.filter(c => c.userRole === 3).length
      const userCount = this.chats.filter(c => c.userRole === 1).length

      this.categoryTabs[0].count = this.chats.length // 全部
      this.categoryTabs[1].count = designerCount // 设计师
      this.categoryTabs[2].count = supervisorCount // 监理
      this.categoryTabs[3].count = userCount // 普通用户
    },
    formatTime(date) {
      if (!date) return ''
      const now = new Date()
      const diff = now - date
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      
      if (days === 0) {
        const hours = date.getHours()
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${hours}:${minutes}`
      } else if (days === 1) {
        return '昨天'
      } else if (days < 7) {
        return `${days}天前`
      } else {
        return `${date.getMonth() + 1}/${date.getDate()}`
      }
    },

    /**
     * 打开聊天详情页面
     * @param {object} chat - 聊天对象
     */
    openChat(chat) {
      console.log('📱 打开聊天详情:', chat)
      uni.navigateTo({
        url: `/pages/chat/chatDetail?conversationId=${chat.conversationId}&otherUserId=${chat.otherUserId}&userName=${chat.name}&userRole=${chat.userRole}`
      })
    },

    /**
     * 开始新聊天
     * 通过手机号搜索用户并发起聊天
     */
    startNewChat() {
      console.log('➕ 开始新聊天')
      this.addChatPhone = ''
      this.addChatDialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.addChatPopup && this.$refs.addChatPopup.open) {
          this.$refs.addChatPopup.open()
        }
      })
    },

    /**
     * 关闭添加聊天弹窗
     */
    closeAddChatDialog() {
      if (this.addingChat) return
      this.addChatDialogVisible = false
      this.addChatPhone = ''
      if (this.$refs.addChatPopup && this.$refs.addChatPopup.close) {
        this.$refs.addChatPopup.close()
      }
    },

    /**
     * 根据手机号搜索用户并发送聊天请求
     */
    async confirmAddChat() {
      const phone = (this.addChatPhone || '').trim()
      if (!phone) {
        this.showToast('请输入对方手机号', 'error')
        return
      }

      // 确保当前用户ID已获取
      if (!this.currentUserId) {
        const storedUserId = uni.getStorageSync('userId')
        if (storedUserId) {
          this.currentUserId = parseInt(storedUserId)
        }
      }

      try {
        this.addingChat = true
        console.log('🔍 通过手机号搜索用户:', phone)
        const res = await getRoleSwitchInfo(phone)
        if (res.code !== 200 || !res.data || !res.data.userId) {
          this.showToast(res.msg || '未找到该手机号对应的用户', 'error')
          return
        }

        const targetUserId = res.data.userId
        console.log('✅ 找到用户，userId:', targetUserId)

        // 防止添加自己
        if (targetUserId === this.currentUserId) {
          this.showToast('不能添加自己为聊天对象', 'error')
          return
        }

        // 发送聊天请求
        const reqRes = await request({
          url: '/api/message/chat-request',
          method: 'post',
          params: {
            targetUserId
          }
        })
        if (reqRes.code !== 200) {
          this.showToast(reqRes.msg || '发送聊天请求失败', 'error')
          return
        }

        // 关闭弹窗并提示
        this.closeAddChatDialog()
        this.showToast('聊天请求已发送，等待对方同意', 'success')

        this.addChatDialogVisible = false
        this.addChatPhone = ''
        this.showToast('聊天请求已发送，等待对方同意', 'success')
      } catch (e) {
        console.error('❌ 通过手机号添加聊天失败:', e)
        this.showToast('添加聊天失败，请稍后重试', 'error')
      } finally {
        this.addingChat = false
      }
    },

    deleteChat(chat) {
      uni.showModal({
        title: '删除确认',
        content: `确定要删除与 ${chat.name} 的聊天记录吗？`,
        confirmColor: '#FF3B30',
        success: (res) => {
          if (res.confirm) {
            const index = this.chats.findIndex(c => c.id === chat.id)
            if (index !== -1) {
              this.chats.splice(index, 1)
              this.showToast('已删除', 'success')
            }
          }
        }
      })
    },

    filterChats() {
      // 计算属性会自动处理过滤
    },

    showToast(message, type = 'success') {
      this.toast.message = message
      this.toast.type = type
      this.toast.show = true
      setTimeout(() => {
        this.toast.show = false
      }, 2000)
    },

    /**
     * 加载对话列表
     * 从后端 API 获取当前用户的所有对话
     */
    async loadConversationList() {
      try {
        this.loading = true
        console.log('📥 开始加载对话列表...')

        // 1. 获取当前用户信息
        const userRes = await conversationApi.getCurrentUserInfo()
        if (userRes.code === 200) {
          this.currentUserId = userRes.data.userId
          console.log('✅ 当前用户ID:', this.currentUserId)
        }

        // 2. 获取对话列表
        const res = await conversationApi.getConversationList()
        if (res.code === 200 && res.data) {
          console.log('✅ 获取对话列表成功:', res.data)

          // 3. 转换对话数据为聊天列表格式
          this.chats = res.data.map(conv => {
            // 确定对方用户ID
            const otherUserId = conv.userId1 === this.currentUserId ? conv.userId2 : conv.userId1

            return {
              id: conv.conversationId,
              conversationId: conv.conversationId,
              name: conv.otherUserName || `用户${otherUserId}`,
              avatar: conv.otherUserAvatar || '/static/images/default-avatar.png',
              lastMessage: conv.lastMessage || '暂无消息',
              lastMessageTime: this.parseDate(conv.lastMessageTime),
              unreadCount: conv.unreadCount || 0,
              online: true,
              userRole: conv.otherUserRole || 1,
              userId1: conv.userId1,
              userId2: conv.userId2,
              otherUserId: otherUserId
            }
          })

          console.log('✅ 对话列表转换完成:', this.chats)
          this.updateCategoryCount()
        } else {
          console.warn('⚠️ 获取对话列表失败:', res.msg)
          this.showToast('获取对话列表失败', 'error')
        }
      } catch (error) {
        console.error('❌ 加载对话列表出错:', error)
        this.showToast('加载对话列表出错', 'error')
      } finally {
        this.loading = false
      }
    },

    /**
     * 解析日期字符串
     * @param {string} dateStr - 日期字符串 (格式: 'yyyy-MM-dd HH:mm:ss')
     * @returns {Date} Date 对象
     */
    parseDate(dateStr) {
      if (!dateStr) return new Date()
      try {
        // 处理格式: '2025-11-12 10:20:00'
        return new Date(dateStr.replace(/-/g, '/'))
      } catch (e) {
        console.warn('日期解析失败:', dateStr)
        return new Date()
      }
    }
  },

  onLoad() {
    // 页面加载时从后端获取聊天列表
    this.loadConversationList()
  }
}
</script>

<style scoped>
.chat-list-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.chat-header {
  background: #fff;
  padding: 20rpx 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid #eee;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.header-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

.header-btn {
  background: #007AFF;
  color: #fff;
  border: none;
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.search-box {
  background: #fff;
  padding: 16rpx 30rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  border-bottom: 1rpx solid #eee;
}

.search-input {
  flex: 1;
  background: #f5f5f5;
  border: 1rpx solid #ddd;
  padding: 12rpx 16rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
}

.search-icon {
  font-size: 24rpx;
  color: #999;
}

.category-tabs {
  background: #fff;
  padding: 0 30rpx;
  display: flex;
  gap: 20rpx;
  border-bottom: 1rpx solid #eee;
  overflow-x: auto;
  white-space: nowrap;
}

.tab-item {
  padding: 16rpx 0;
  position: relative;
  display: flex;
  align-items: center;
  gap: 8rpx;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-item.active {
  color: #007AFF;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4rpx;
  background: #007AFF;
  border-radius: 2rpx;
}

.tab-text {
  font-size: 26rpx;
  color: #666;
}

.tab-item.active .tab-text {
  color: #007AFF;
}

.tab-badge {
  background: #FF3B30;
  color: #fff;
  border-radius: 50%;
  width: 32rpx;
  height: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18rpx;
  font-weight: 600;
  flex-shrink: 0;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16rpx;
}

.empty-icon {
  font-size: 80rpx;
  opacity: 0.3;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.empty-desc {
  font-size: 24rpx;
  color: #ccc;
}

.chat-item {
  background: #fff;
  padding: 20rpx 30rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
  position: relative;
}

.chat-item.unread {
  background: #f9f9f9;
}

.chat-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.chat-content {
  flex: 1;
  min-width: 0;
}

.chat-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.chat-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.chat-time {
  font-size: 24rpx;
  color: #999;
  flex-shrink: 0;
}

.chat-preview {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.preview-text {
  font-size: 24rpx;
  color: #999;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unread-badge {
  background: #FF3B30;
  color: #fff;
  border-radius: 50%;
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  font-weight: 600;
  flex-shrink: 0;
}

.chat-actions {
  display: flex;
  gap: 12rpx;
}

.action-btn {
  background: none;
  border: none;
  font-size: 24rpx;
  padding: 0;
}

.toast {
  position: fixed;
  bottom: 100rpx;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 16rpx 32rpx;
  border-radius: 8rpx;
  z-index: 1000;
}

.toast.success {
  background: rgba(52, 199, 89, 0.9);
}

.toast.error {
  background: rgba(255, 59, 48, 0.9);
}

.add-chat-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000; /* 确保弹窗层级最高，可点击输入框 */
}

.add-chat-dialog {
  position: relative;
  z-index: 2001;
  width: 80%;
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx 24rpx;
}

.add-chat-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 20rpx;
  text-align: center;
}

.add-chat-input {
  width: 100%;
  border: 1rpx solid #ddd;
  border-radius: 12rpx;
  /* 提高输入框高度，方便完整显示 11 位手机号 */
  padding: 20rpx 24rpx;
  font-size: 30rpx;
  height: 80rpx;
  box-sizing: border-box;
  margin-bottom: 24rpx;
}

.add-chat-actions {
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
}

.add-chat-btn {
  padding: 10rpx 24rpx;
  border-radius: 12rpx;
  font-size: 26rpx;
}

.add-chat-btn.cancel {
  background: #f5f5f5;
  color: #666;
}

.add-chat-btn.confirm {
  background: #007AFF;
  color: #fff;
}
</style>

