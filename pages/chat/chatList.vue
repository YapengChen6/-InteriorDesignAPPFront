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

    <!-- 消息提示 -->
    <view v-if="toast.show" class="toast" :class="toast.type">
      <text class="toast-text">{{ toast.message }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'ChatList',
  data() {
    return {
      searchText: '',
      chats: [
        {
          id: 1,
          name: '张设计师',
          avatar: '/static/images/default-avatar.png',
          lastMessage: '您的设计方案已完成，请查看',
          lastMessageTime: new Date(),
          unreadCount: 2,
          online: true
        },
        {
          id: 2,
          name: '李监理',
          avatar: '/static/images/default-avatar.png',
          lastMessage: '施工进度已更新',
          lastMessageTime: new Date(Date.now() - 3600000),
          unreadCount: 0,
          online: false
        }
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
      if (!this.searchText) {
        return this.chats
      }
      return this.chats.filter(chat => 
        chat.name.includes(this.searchText) || 
        chat.lastMessage.includes(this.searchText)
      )
    }
  },
  methods: {
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

    openChat(chat) {
      uni.navigateTo({
        url: `/pages/chat/chatDetail?conversationId=${chat.id}&userId=${chat.id}&userName=${chat.name}`
      })
    },

    startNewChat() {
      uni.showToast({
        title: '功能开发中',
        icon: 'none'
      })
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
    }
  },

  onLoad() {
    // 页面加载时可以从后端获取聊天列表
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
</style>

