<template>
  <view class="chat-list-container">
    <!-- 顶部固定区域 (导航 + 搜索 + Tab) -->
    <view class="fixed-header">
      <!-- 1. 顶部导航栏 -->
      <view class="header">
        <view class="header-content">
          <text class="title">消息中心</text>
          <view class="header-actions">
            <view class="action-btn refresh" hover-class="btn-hover" @click="refreshChatList" style="margin-right: 15rpx;">
              <text class="refresh-icon">🔄</text>
            </view>
            <view class="action-btn" hover-class="btn-hover" @click="startNewChat">
              <text class="plus-icon">+</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 2. 搜索框 -->
      <view class="search-wrapper">
        <view class="search-box">
          <text class="search-icon">🔍</text>
          <input 
            class="search-input" 
            placeholder="搜索设计师/聊天记录" 
            placeholder-style="color: #999;"
            v-model="searchText"
            @input="onSearchInput"
          />
        </view>
      </view>

      <!-- 3. 分类标签 (支持横向滚动) -->
      <view class="category-tabs">
        <scroll-view scroll-x class="tabs-scroll" :show-scrollbar="false">
          <view class="tabs-flex">
            <view 
              v-for="(tab, index) in categoryTabs" 
              :key="index"
              class="tab-item"
              :class="{ active: activeTab === tab.key }"
              @click="switchTab(tab.key)"
            >
              <text class="tab-text">{{ tab.name }}</text>
              <text v-if="tab.count > 0" class="tab-count">{{ tab.count > 99 ? '99+' : tab.count }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 占位符，防止列表内容被吸顶头部遮挡 -->
    <view class="header-placeholder"></view>

    <!-- 聊天列表区域 -->
    <scroll-view class="chat-list" scroll-y="true" @scrolltolower="loadMore">
      
      <!-- 空状态 -->
      <view v-if="filteredChats.length === 0 && !loading" class="empty-state">
        <!-- 如果你有空状态图，可以取消下面注释并替换路径 -->
        <!-- <image class="empty-img" src="/static/images/empty-box.png" mode="widthFix"></image> -->
        <text class="empty-text">暂无相关消息</text>
        <view class="empty-btn" @click="startNewChat">发起新咨询</view>
      </view>
      
      <!-- 列表项 -->
      <view 
        v-for="chat in filteredChats" 
        :key="chat.id"
        class="chat-item"
        hover-class="chat-hover"
        @click="openChat(chat)"
      >
        <view class="avatar-container">
          <!-- 头像 -->
          <image 
            class="chat-avatar" 
            :src="chat.avatar || '/static/images/default-avatar.png'" 
            mode="aspectFill" 
            @error="handleImageError"
          ></image>
          <!-- 在线状态指示器 -->
          <OnlineStatusIndicator
            :isOnline="getOnlineStatus(chat.otherUserId)"
            :showStatus="true"
            :showText="false"
            size="small"
            class="online-status-overlay"
          />
          <!-- 未读角标 -->
          <view v-if="chat && chat.unreadCount > 0" class="unread-badge">
            {{ chat.unreadCount > 99 ? '99+' : chat.unreadCount }}
          </view>
        </view>
        
        <view class="chat-content">
          <view class="chat-header">
            <view class="name-row">
              <text class="chat-name">{{ chat.name }}</text>
              <!-- 角色标签: 根据 userRole 显示不同颜色 -->
              <view v-if="chat.userRole === 2" class="role-tag designer">设计师</view>
              <view v-if="chat.userRole === 3" class="role-tag supervisor">监理</view>
            </view>
            <text class="chat-time">{{ formatTime(chat.lastMessageTime) }}</text>
          </view>
          <view class="chat-footer">
            <text class="message-text">{{ chat.lastMessage }}</text>
          </view>
        </view>
      </view>
      
      <!-- 底部安全区适配 -->
      <view class="safe-area-bottom"></view>
    </scroll-view>

    <!-- 添加新聊天弹窗 -->
    <uni-popup ref="addChatPopup" type="center" :mask-click="true">
      <view class="dialog-card">
        <view class="dialog-header">
          <text class="dialog-title">发起新会话</text>
          <text class="dialog-subtitle">请输入对方手机号查找</text>
        </view>
        <view class="dialog-body">
          <view class="input-wrapper">
            <input
              v-model="addChatPhone"
              class="dialog-input"
              type="number"
              maxlength="11"
              placeholder="请输入11位手机号"
              placeholder-style="color:#ccc"
            />
          </view>
        </view>
        <view class="dialog-footer">
          <view class="dialog-btn cancel" hover-class="btn-hover-gray" @click="closeAddChatDialog">取消</view>
          <view class="dialog-btn confirm" hover-class="btn-hover-blue" @click="confirmAddChat">
            {{ addingChat ? '查找中...' : '确定' }}
          </view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
import { processAvatarUrl } from '@/utils/avatarUtils.js'
import { formatTime } from '@/utils/timeUtils.js'
import { updateCategoryCount, filterChatsByCategory } from '@/utils/chatDataUtils.js'
import { searchUsers, getRoleSwitchInfo } from '@/api/users.js'
import { getConversationList, createOrGetConversation } from '@/api/conversation.js'
import { getUnreadCount } from '@/api/message_new.js'
import { batchGetUserOnlineStatus } from '@/api/onlineStatus.js'
import OnlineStatusIndicator from '@/components/OnlineStatusIndicator.vue'

export default {
  name: 'ChatList',
  components: {
    OnlineStatusIndicator
  },
  data() {
    return {
      // --- 核心数据 ---
      chats: [],
      filteredChats: [],
      
      // --- 状态管理 ---
      activeTab: 'all',
      searchText: '',
      categoryCount: {
        all: 0,
        designer: 0,
        supervisor: 0,
        user: 0
      },
      
      // --- 用户信息 ---
      currentUserId: 0,
      currentRoleType: '',
      
      // --- UI 状态 ---
      loading: false,
      hasMore: true,
      addChatPhone: '',
      addingChat: false,
      
      // --- 在线状态 ---
      onlineStatusMap: {} // 存储用户在线状态 {userId: {isOnline: boolean, lastActiveTime: string}}
    }
  },
  
  computed: {
    // 分类 Tab 数据
    categoryTabs() {
      return [
        { key: 'all', name: '全部消息', count: this.categoryCount.all },
        { key: 'designer', name: '设计师', count: this.categoryCount.designer },
        { key: 'supervisor', name: '监理', count: this.categoryCount.supervisor },
        { key: 'user', name: '用户', count: this.categoryCount.user }
      ]
    }
  },
  
  // 使用 onShow 保证页面返回时刷新数据
  onShow() {
    // 如果已经有数据，只刷新未读数；否则完整加载
    if (this.chats.length > 0) {
      console.log('📱 页面显示，刷新未读数')
      this.loadUnreadCounts()
    } else {
      this.initUserAndLoad()
    }
  },

  onLoad() {
    // 监听来自聊天详情页面的刷新事件
    uni.$on('refreshUnreadCount', () => {
      console.log('📬 收到刷新未读数事件')
      this.loadUnreadCounts()
    })
  },

  onUnload() {
    // 页面卸载时移除事件监听
    uni.$off('refreshUnreadCount')
  },
  
  methods: {
    // 初始化用户并加载数据
    initUserAndLoad() {
      // 尝试多种方式获取用户ID
      let userId = uni.getStorageSync('userId')
      if (!userId) {
        const userInfo = uni.getStorageSync('userInfo')
        if (userInfo && userInfo.userId) {
          userId = userInfo.userId
          // 同步存储userId
          uni.setStorageSync('userId', userId.toString())
        }
      }
      
      this.currentUserId = userId ? parseInt(userId) : 0
      
      const storedRole = uni.getStorageSync('currentRoleType')
      if (storedRole) {
        this.currentRoleType = storedRole
      }
      
      console.log('📱 初始化用户信息，用户ID:', this.currentUserId)
      
      if (!this.currentUserId) {
        console.warn('⚠️ 用户ID为空，可能需要重新登录')
        uni.showModal({
          title: '提示',
          content: '用户信息异常，请重新登录',
          showCancel: false,
          success: () => {
            uni.reLaunch({ url: '/pages/register' })
          }
        })
        return
      }
      
      this.loadConversationList()
    },
    
    // 手动刷新聊天列表
    async refreshChatList() {
      console.log('🔄 手动刷新聊天列表')
      uni.showLoading({ title: '刷新中...', mask: true })
      
      try {
        // 重新加载对话列表（包含在线状态）
        await this.loadConversationList()
        
        uni.hideLoading()
        uni.showToast({
          title: '刷新成功',
          icon: 'success'
        })
      } catch (error) {
        uni.hideLoading()
        console.error('❌ 刷新失败:', error)
        uni.showToast({
          title: '刷新失败',
          icon: 'none'
        })
      }
    },

    // --- 核心：加载会话列表 ---
    async loadConversationList() {
      this.loading = true
      console.log('📋 开始加载聊天列表...')
      console.log('📋 当前用户ID:', this.currentUserId)
      
      try {
        // 1. 获取会话列表
        const conversationRes = await getConversationList()
        
        if (conversationRes.code === 200 && conversationRes.data) {
          const conversations = conversationRes.data.rows || conversationRes.data || []
          console.log('📊 获取到', conversations.length, '个对话')
          
          if (conversations.length === 0) {
            this.chats = []
            this.filteredChats = []
            this.updateCategoryCount()
            return
          }
          
          // 2. 并行处理每个会话的用户信息 (提高加载速度)
          const processPromises = conversations.map(conv => this.processConversation(conv))
          const processedChats = (await Promise.all(processPromises)).filter(item => item !== null)
          
          // 3. 按时间倒序排列（新消息在前）
          processedChats.sort((a, b) => {
            const timeA = new Date(a.lastMessageTime || 0).getTime()
            const timeB = new Date(b.lastMessageTime || 0).getTime()
            return timeB - timeA
          })
          
          this.chats = processedChats
          console.log('📋 聊天列表加载完成，共', this.chats.length, '个对话')
          
          // 4. 加载未读消息数
          await this.loadUnreadCounts()
          
          // 5. 加载在线状态
          await this.loadOnlineStatuses()
          
          // 6. 更新 UI 统计和过滤
          this.updateCategoryCount()
          this.filterChats()
        } else {
          console.error('❌ 对话列表API返回错误:', conversationRes)
          throw new Error(conversationRes.msg || '获取对话列表失败')
        }
      } catch (error) {
        console.error('❌ 加载聊天列表失败:', error)
        // 仅在没有任何数据时提示错误
        if(this.chats.length === 0) {
            uni.showToast({ title: '加载失败: ' + error.message, icon: 'none' })
        }
      } finally {
        this.loading = false
      }
    },
    
    // 加载未读消息数 - 重新加载会话列表以获取最新的未读数
    async loadUnreadCounts() {
      try {
        console.log('📊 刷新未读消息数...')
        console.log('📊 当前 chats 数量:', this.chats.length)
        
        // 重新获取会话列表（包含最新的未读数）
        const conversationRes = await getConversationList()
        
        if (conversationRes.code === 200 && conversationRes.data) {
          const conversations = conversationRes.data.rows || conversationRes.data || []
          
          // 创建一个 conversationId -> conversation 的映射
          const conversationMap = {}
          conversations.forEach(conv => {
            conversationMap[conv.conversationId] = conv
          })
          
          // 更新每个对话的未读数（使用 Vue.set 确保响应式）
          this.chats.forEach((chat, index) => {
            const conv = conversationMap[chat.conversationId]
            if (conv) {
              // 确保 unreadCount 是数字类型
              const unreadCount = parseInt(conv.unreadCount) || 0
              this.$set(this.chats[index], 'unreadCount', unreadCount)
            } 
          })
          
          // 同时刷新在线状态
          await this.loadOnlineStatuses()
          
          // 更新分类计数和过滤
          this.updateCategoryCount()
          this.filterChats()
          
          console.log('✅ 未读数和在线状态更新完成')
        }
      } catch (error) {
        console.error('❌ 加载未读消息数失败:', error)
      }
    },
    
    // --- 核心：处理单条会话 (直接使用后端返回的对方用户信息) ---
    async processConversation(conv) {
      try {
        
        // 确定对方用户ID
        let otherUserId = conv.otherUserId
        if (!otherUserId) {
          // 如果后端没有直接返回otherUserId，需要根据当前用户ID计算
          if (conv.userId1 === this.currentUserId) {
            otherUserId = conv.userId2
          } else if (conv.userId2 === this.currentUserId) {
            otherUserId = conv.userId1
          } else {
            console.warn('⚠️ 无法确定对方用户ID:', conv)
            return null
          }
        }
        
        // 检查是否是与自己的对话
        if (otherUserId === this.currentUserId) {
          console.warn('⚠️ 跳过与自己的对话:', conv.conversationId)
          return null
        }
        
        const otherUserName = conv.otherUserName || conv.name || `用户${otherUserId}`
        const otherUserAvatar = conv.otherUserAvatar ? 
          processAvatarUrl(conv.otherUserAvatar, '/static/images/default-avatar.png') : 
          '/static/images/default-avatar.png'
        const otherUserRole = conv.otherUserRole || 1
        
        const processedConv = {
          id: conv.conversationId,
          conversationId: conv.conversationId,
          name: otherUserName,
          avatar: otherUserAvatar,
          lastMessage: conv.lastMessage || '暂无消息',
          lastMessageTime: conv.lastMessageTime || conv.createTime,
          unreadCount: conv.unreadCount ? parseInt(conv.unreadCount) : 0, 
          userRole: otherUserRole,
          userId1: conv.userId1,
          userId2: conv.userId2,
          otherUserId: otherUserId,
        }
        

        
        return processedConv
      } catch (error) {
        console.error('❌ 处理单条会话出错:', error, conv)
        return null
      }
    },
    
    // --- 交互逻辑 ---
    switchTab(tabKey) {
      this.activeTab = tabKey
      this.filterChats()
    },
    
    onSearchInput() {
      this.filterChats()
    },
    
    filterChats() {
      this.filteredChats = filterChatsByCategory(
        this.chats,
        this.activeTab,
        this.searchText
      )
    },
    
    updateCategoryCount() {
      this.categoryCount = updateCategoryCount(this.chats)
    },
    
    openChat(chat) {
      const url = `/pages/chat/chatDetail?conversationId=${chat.conversationId}&otherUserId=${chat.otherUserId}&name=${encodeURIComponent(chat.name)}&avatar=${encodeURIComponent(chat.avatar)}`
      uni.navigateTo({ url })
    },
    
    formatTime(time) {
      return formatTime(time)
    },
    
    handleImageError(e) {
      // 图片加载失败，Image组件会显示默认图或空白，此处可扩展
    },
    
    // --- 在线状态相关方法 ---
    getOnlineStatus(userId) {
      if (!userId || !this.onlineStatusMap[userId]) {
        return false
      }
      return this.onlineStatusMap[userId].isOnline || false
    },
    
    // 批量加载对话对方的在线状态
    async loadOnlineStatuses() {
      if (this.chats.length === 0) {
        return
      }
      
      try {
        // 提取所有对方用户ID
        const otherUserIds = this.chats
          .map(chat => chat.otherUserId)
          .filter(userId => userId && userId !== this.currentUserId)
        
        if (otherUserIds.length === 0) {
          return
        }
        
        console.log('📊 批量查询在线状态，用户数量:', otherUserIds.length)
        
        // 批量查询在线状态
        const response = await batchGetUserOnlineStatus(otherUserIds)
        
        if (response.code === 200 && response.data) {
          // 更新在线状态映射
          this.onlineStatusMap = { ...this.onlineStatusMap, ...response.data }
          console.log('✅ 在线状态加载完成')
        } else {
          console.warn('⚠️ 在线状态查询返回异常:', response)
        }
      } catch (error) {
        console.error('❌ 加载在线状态失败:', error)
        // 失败时不影响聊天列表的正常显示
      }
    },

    loadMore() {
        console.log('触底加载更多')
    },
    
    // --- 弹窗与新建聊天 ---
    startNewChat() {
      this.addChatPhone = ''
      this.$refs.addChatPopup.open()
    },
    
    closeAddChatDialog() {
      this.$refs.addChatPopup.close()
    },
    
    async confirmAddChat() {
      const phone = (this.addChatPhone || '').trim()
      
      if (!phone) {
        uni.showToast({ title: '请输入手机号', icon: 'none' })
        return
      }
      if (phone.length !== 11) {
        uni.showToast({ title: '手机号格式不正确', icon: 'none' })
        return
      }
      
      try {
        this.addingChat = true
        
        // 1. 搜索用户
        const res = await getRoleSwitchInfo(phone)
        if (res.code !== 200 || !res.data || !res.data.userId) {
          uni.showToast({ title: '未找到该用户', icon: 'none' })
          return
        }
        
        const targetUserId = res.data.userId
        const targetUserName = res.data.nickName || `用户${targetUserId}`
        
        if (targetUserId === this.currentUserId) {
          uni.showToast({ title: '不能添加自己', icon: 'none' })
          return
        }
        
        // 2. 创建会话
        const convRes = await createOrGetConversation(targetUserId)
        if (convRes.code !== 200 || !convRes.data) {
          uni.showToast({ title: '创建会话失败', icon: 'none' })
          return
        }
        
        const conversationId = convRes.data.conversationId
        
        // 3. 关闭弹窗并跳转
        this.closeAddChatDialog()
        this.loadConversationList() // 刷新列表
        
        uni.navigateTo({
          url: `/pages/chat/chatDetail?conversationId=${conversationId}&otherUserId=${targetUserId}&name=${encodeURIComponent(targetUserName)}`
        })
        
      } catch (error) {
        console.error('添加聊天失败:', error)
        uni.showToast({ title: '网络错误', icon: 'none' })
      } finally {
        this.addingChat = false
      }
    }
  }
}
</script>

<style scoped>
/* 定义全局变量 */
page {
  --theme-blue: #1966FF; 
  --theme-blue-light: #EBF2FF;
  --text-main: #333333;
  --text-sub: #999999;
  --bg-color: #F7F8FA;
  background-color: var(--bg-color);
}

.chat-list-container {
  height: 100vh;
  background-color: var(--bg-color);
  display: flex;
  flex-direction: column;
}

/* --- 顶部固定区域 --- */
.fixed-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: #fff;
  z-index: 100;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.02);
}

/* 占位符，高度根据 fixed-header 的实际内容调整 */
.header-placeholder {
  height: 290rpx; 
}

.header {
  padding: 0 32rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: var(--text-main);
}

.action-btn {
  width: 64rpx;
  height: 64rpx;
  background-color: var(--theme-blue);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 12rpx rgba(25, 102, 255, 0.3);
  transition: transform 0.2s;
}

.plus-icon {
  color: #fff;
  font-size: 40rpx;
  font-weight: 300;
  margin-top: -4rpx;
}

.refresh-icon {
  color: #fff;
  font-size: 32rpx;
}

.action-btn.refresh {
  background-color: #28a745;
  width: 56rpx;
  height: 56rpx;
}

/* 搜索框优化 */
.search-wrapper {
  padding: 12rpx 32rpx 24rpx;
  background-color: #fff;
}

.search-box {
  background-color: #F5F7FA;
  border-radius: 36rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
}

.search-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
  opacity: 0.5;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: var(--text-main);
  height: 100%;
}

/* 分类 Tabs 优化 */
.category-tabs {
  background-color: #fff;
  padding-bottom: 24rpx;
}

.tabs-scroll {
  width: 100%;
  white-space: nowrap;
}

.tabs-flex {
  display: flex;
  padding: 0 32rpx;
}

.tab-item {
  display: inline-flex;
  align-items: center;
  padding: 14rpx 28rpx;
  margin-right: 20rpx;
  border-radius: 32rpx;
  background-color: #F5F5F5;
  transition: all 0.3s;
  border: 1rpx solid transparent;
}

.tab-item.active {
  background-color: var(--theme-blue-light);
  border-color: rgba(25, 102, 255, 0.1);
}

.tab-text {
  font-size: 28rpx; /* 增大字体 */
  color: #666;
  font-weight: 500;
}

.tab-item.active .tab-text {
  color: var(--theme-blue);
  font-weight: bold;
}

.tab-count {
  margin-left: 10rpx;
  background-color: #FF4D4F;
  color: #fff;
  font-size: 22rpx;
  padding: 0 10rpx;
  border-radius: 20rpx;
  height: 32rpx;
  line-height: 32rpx;
  min-width: 32rpx;
  text-align: center;
}

/* --- 列表区域优化 --- */
.chat-list {
  flex: 1;
  box-sizing: border-box;
  padding-top: 20rpx; 
}

.chat-item {
  display: flex;
  align-items: center;
  padding: 32rpx 24rpx; /* 增加内边距 */
  background-color: #fff;
  margin-bottom: 2rpx;
}

.chat-hover {
  background-color: #F9FAFC;
}

/* 头像优化 */
.avatar-container {
  position: relative;
  margin-right: 32rpx; /* 增加间距 */
}

/* 在线状态指示器覆盖层 */
.online-status-overlay {
  position: absolute;
  bottom: 2rpx;
  right: 2rpx;
  z-index: 3;
  background-color: #fff;
  border-radius: 50%;
  padding: 2rpx;
  box-shadow: 0 0 4rpx rgba(0,0,0,0.1);
}

.chat-avatar {
  width: 96rpx; /* 稍微缩小一点更精致，或者保持100看需求，推荐96 */
  height: 96rpx;
  border-radius: 50%;
  border: 2rpx solid #f5f5f5;
  background-color: #eee;
  flex-shrink: 0;
}

.unread-badge {
  position: absolute;
  top: -6rpx;
  right: -6rpx;
  background-color: #FF4D4F;
  color: #fff;
  font-size: 22rpx;
  padding: 0 10rpx;
  border-radius: 20rpx;
  height: 36rpx;
  line-height: 36rpx;
  min-width: 36rpx;
  text-align: center;
  border: 2rpx solid #fff;
  box-sizing: border-box;
  z-index: 2;
}

/* 内容布局 */
.chat-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx; /* 间距 */
}

.name-row {
  display: flex;
  align-items: center;
  flex: 1;
  overflow: hidden;
}

.chat-name {
  font-size: 32rpx;
  color: #222; /* 字体颜色加深 */
  font-weight: 600;
  margin-right: 16rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 角色标签 */
.role-tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  margin-right: 10rpx;
  flex-shrink: 0;
}

.role-tag.designer {
  background-color: rgba(25, 102, 255, 0.1);
  color: var(--theme-blue);
}

.role-tag.supervisor {
  background-color: rgba(255, 149, 0, 0.1);
  color: #FF9500;
}

.chat-time {
  font-size: 24rpx; /* 增大时间字体 */
  color: #999;
  flex-shrink: 0;
}

.chat-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.message-text {
  font-size: 28rpx; /* 增大消息字体 */
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 95%;
  line-height: 1.4;
}

/* 空状态 */
.empty-state {
  padding-top: 160rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.empty-btn {
  border: 2rpx solid var(--theme-blue);
  color: var(--theme-blue);
  font-size: 28rpx;
  padding: 16rpx 48rpx;
  border-radius: 40rpx;
  font-weight: 500;
}

/* --- 弹窗样式优化 --- */
.dialog-card {
  width: 600rpx;
  background-color: #fff;
  border-radius: 24rpx;
  overflow: hidden;
}

.dialog-header {
  padding: 50rpx 0 30rpx;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dialog-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
}

.dialog-subtitle {
  font-size: 26rpx;
  color: #999;
}

.dialog-body {
  padding: 0 40rpx 50rpx;
}

.input-wrapper {
  background-color: #F5F7FA;
  border-radius: 16rpx;
  padding: 4rpx 24rpx;
}

/* 修复：增大输入框高度，方便点击 */
.dialog-input {
  height: 80rpx; 
  font-size: 32rpx;
  color: #333;
  width: 100%;
}

.dialog-footer {
  display: flex;
  border-top: 1rpx solid #eee;
}

.dialog-btn {
  flex: 1;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 500;
}

.dialog-btn.cancel {
  color: #666;
  border-right: 1rpx solid #eee;
}

.dialog-btn.confirm {
  color: var(--theme-blue);
  font-weight: bold;
}

.btn-hover {
  transform: scale(0.95);
  opacity: 0.9;
}
.btn-hover-gray {
  background-color: #f9f9f9;
}
.btn-hover-blue {
  background-color: rgba(25, 102, 255, 0.05);
}
.safe-area-bottom {
  height: env(safe-area-inset-bottom);
}
</style>