<template>
  <view class="message-center">
    <!-- 页面头部 -->
    <view class="header">
      <view class="header-content">
        <view class="header-title">
          <text class="header-icon">💬</text>
          <text class="header-text">消息中心</text>
        </view>
        <button @click="markAllAsRead" class="mark-all-read-btn">
          <text class="btn-text">全部标记为已读</text>
        </button>
      </view>
    </view>

    <!-- 消息标签页 -->
    <view class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        <text class="tab-text">{{ tab.name }}</text>
        <text v-if="tab.unreadCount > 0" class="badge">{{ tab.unreadCount }}</text>
      </button>
    </view>

    <!-- 消息列表 -->
    <view class="message-list">
      <view v-if="filteredMessages.length === 0" class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无消息</text>
      </view>

      <view 
        v-for="message in filteredMessages" 
        :key="message.id"
        :class="['message-item', { unread: !message.read }]"
        @click="markAsRead(message)"
      >
        <view class="message-avatar" :class="message.type">
          <text class="avatar-icon">{{ getAvatarIcon(message.type) }}</text>
        </view>
        <view class="message-content">
          <view class="message-header">
            <text class="message-title">{{ message.title }}</text>
            <text class="message-time">{{ formatTime(message.time) }}</text>
          </view>
          <text class="message-preview">{{ message.content }}</text>
          <view class="message-footer">
            <text class="message-sender">{{ message.sender }}</text>
            <view class="message-actions">
              <button @click.stop="deleteMessage(message)" class="btn-icon">
                <text class="delete-icon">🗑️</text>
              </button>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'MessageCenter',
  data() {
    return {
      activeTab: 'all',
      tabs: [
        { id: 'all', name: '全部消息', unreadCount: 0 },
        { id: 'unread', name: '未读消息', unreadCount: 0 },
        { id: 'project', name: '项目消息', unreadCount: 0 },
        { id: 'system', name: '系统通知', unreadCount: 0 }
      ],
      messages: [
        {
          id: 1,
          type: 'project',
          title: '您的装修项目有新进展',
          content: '您的中式风格客厅设计方案已完成初稿，请及时查看并提供反馈意见。',
          time: new Date('2023-10-15 14:30'),
          read: false,
          sender: '设计师张工'
        },
        {
          id: 2,
          type: 'system',
          title: '系统维护通知',
          content: '平台将于本周六凌晨2:00-4:00进行系统维护，期间部分功能可能无法使用。',
          time: new Date('2023-10-14 09:15'),
          read: true,
          sender: '系统管理员'
        },
        {
          id: 3,
          type: 'project',
          title: '材料采购提醒',
          content: '您选择的瓷砖品牌库存紧张，建议尽快确认或选择替代方案。',
          time: new Date('2023-10-13 16:45'),
          read: false,
          sender: '材料管家'
        },
        {
          id: 4,
          type: 'system',
          title: '安全提醒',
          content: '检测到您的账户有异常登录，如非本人操作请立即修改密码。',
          time: new Date('2023-10-12 11:20'),
          read: true,
          sender: '安全中心'
        },
        {
          id: 5,
          type: 'project',
          title: '施工进度更新',
          content: '水电改造工程已完成验收，下一步将进行泥瓦工施工。',
          time: new Date('2023-10-11 17:30'),
          read: true,
          sender: '工程监理'
        },
        {
          id: 6,
          type: 'system',
          title: '新功能上线',
          content: '3D效果图预览功能已上线，现在可以更直观地查看设计方案。',
          time: new Date('2023-10-10 10:05'),
          read: false,
          sender: '产品团队'
        }
      ]
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
          return this.messages.filter(msg => msg.type === 'system')
        default:
          return this.messages
      }
    }
  },
  methods: {
    getAvatarIcon(type) {
      const icons = {
        project: '🏠',
        system: '🔔'
      }
      return icons[type] || '✉️'
    },
    formatTime(time) {
      const now = new Date()
      const diff = now - time
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      
      if (days === 0) {
        return time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      } else if (days === 1) {
        return '昨天'
      } else if (days < 7) {
        return `${days}天前`
      } else {
        return time.toLocaleDateString('zh-CN')
      }
    },
    markAsRead(message) {
      if (!message.read) {
        message.read = true
        this.updateUnreadCounts()
      }
    },
    markAllAsRead() {
      this.messages.forEach(msg => {
        msg.read = true
      })
      this.updateUnreadCounts()
    },
    deleteMessage(message) {
      this.messages = this.messages.filter(msg => msg.id !== message.id)
      this.updateUnreadCounts()
    },
    updateUnreadCounts() {
      this.tabs.forEach(tab => {
        if (tab.id === 'all') {
          tab.unreadCount = this.messages.filter(msg => !msg.read).length
        } else if (tab.id === 'unread') {
          tab.unreadCount = this.messages.filter(msg => !msg.read).length
        } else {
          tab.unreadCount = this.messages.filter(msg => msg.type === tab.id && !msg.read).length
        }
      })
    }
  },
  mounted() {
    this.updateUnreadCounts()
  }
}
</script>

<style scoped>
.message-center {
  background: white;
  min-height: 100vh;
}

/* 头部样式 - 高度降低 */
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20rpx 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 32rpx;
}

.header-title {
  display: flex;
  align-items: center;
}

.header-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
}

.header-text {
  font-size: 32rpx;
  font-weight: 600;
}

.mark-all-read-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  padding: 12rpx 20rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
}

/* 标签页样式 */
.tabs {
  display: flex;
  background: #f9fafb;
  border-bottom: 2rpx solid #eee;
}

.tab {
  flex: 1;
  padding: 24rpx 0;
  text-align: center;
  background: none;
  border: none;
  font-size: 28rpx;
  font-weight: 500;
  color: #666;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab.active {
  color: #667eea;
  font-weight: 600;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  width: 60%;
  height: 6rpx;
  background: #667eea;
  border-radius: 6rpx 6rpx 0 0;
}

.badge {
  background: #ff4757;
  color: white;
  border-radius: 20rpx;
  padding: 4rpx 12rpx;
  font-size: 24rpx;
  margin-left: 8rpx;
  min-width: 32rpx;
  text-align: center;
}

/* 消息列表样式 */
.message-list {
  padding-bottom: 40rpx;
}

.message-item {
  padding: 36rpx 48rpx;
  border-bottom: 2rpx solid #f0f0f0;
  display: flex;
  align-items: flex-start;
}

.message-item.unread {
  background: #f0f7ff;
  border-left: 8rpx solid #667eea;
}

.message-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  margin-right: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 36rpx;
  flex-shrink: 0;
}

.message-avatar.project {
  background: #10c582;
}

.message-avatar.system {
  background: #4a6cf7;
}

.avatar-icon {
  font-size: 40rpx;
}

.message-content {
  flex: 1;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.message-title {
  font-weight: 600;
  font-size: 32rpx;
  color: #1a1a1a;
  flex: 1;
}

.message-item.unread .message-title {
  color: #667eea;
}

.message-time {
  color: #999;
  font-size: 24rpx;
  white-space: nowrap;
  margin-left: 16rpx;
}

.message-preview {
  color: #666;
  font-size: 28rpx;
  line-height: 1.5;
  margin-bottom: 16rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.message-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.message-sender {
  color: #999;
  font-size: 26rpx;
}

.btn-icon {
  background: none;
  border: none;
  color: #999;
  padding: 8rpx;
  border-radius: 8rpx;
}

.delete-icon {
  font-size: 32rpx;
}

.empty-state {
  padding: 120rpx 40rpx;
  text-align: center;
  color: #999;
}

.empty-icon {
  font-size: 96rpx;
  margin-bottom: 32rpx;
  display: block;
}

.empty-text {
  font-size: 32rpx;
}

/* 响应式设计 */
@media (max-width: 750px) {
  .header-content {
    padding: 0 24rpx;
  }
  
  .tabs {
    flex-wrap: wrap;
  }
  
  .tab {
    flex: 1 0 50%;
    padding: 20rpx 0;
    font-size: 26rpx;
  }
  
  .message-item {
    padding: 24rpx 32rpx;
  }
  
  .message-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8rpx;
  }
  
  .message-time {
    align-self: flex-end;
  }
}
</style>