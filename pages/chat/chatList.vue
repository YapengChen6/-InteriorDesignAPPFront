<template>
  <view class="chat-list-container">
    <!-- 顶部固定区域 (导航 + 搜索 + Tab) -->
    <view class="fixed-header">
      <!-- 1. 顶部导航栏 -->
      <view class="header">
        <view class="header-content">
          <text class="title">消息中心</text>
          <view class="header-actions">
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

export default {
  name: 'ChatList',
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
      addingChat: false
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
      const storedUserId = uni.getStorageSync('userId')
      this.currentUserId = storedUserId ? parseInt(storedUserId) : 0
      
      const storedRole = uni.getStorageSync('currentRoleType')
      if (storedRole) {
        this.currentRoleType = storedRole
      }
      
      console.log('📱 刷新列表，用户ID:', this.currentUserId)
      this.loadConversationList()
    },

    // --- 核心：加载会话列表 ---
    async loadConversationList() {
      this.loading = true
      console.log('📋 开始加载聊天列表...')
      
      try {
        // 1. 获取会话列表
        const conversationRes = await getConversationList()
        
        if (conversationRes.code === 200 && conversationRes.data) {
          const conversations = conversationRes.data.rows || conversationRes.data || []
          
          // 2. 并行处理每个会话的用户信息 (提高加载速度)
          const processPromises = conversations.map(conv => this.processConversation(conv))
          const processedChats = (await Promise.all(processPromises)).filter(item => item !== null)
          
          // 3. 按时间倒序排列（新消息在前）
          processedChats.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime())
          
          this.chats = processedChats
          console.log('📋 聊天列表加载完成，共', this.chats.length, '个对话')
          
          // 4. 加载未读消息数
          await this.loadUnreadCounts()
          
          // 5. 更新 UI 统计和过滤
          this.updateCategoryCount()
          this.filterChats()
        }
      } catch (error) {
        console.error('❌ 加载聊天列表失败:', error)
        // 仅在没有任何数据时提示错误
        if(this.chats.length === 0) {
            uni.showToast({ title: '加载失败', icon: 'none' })
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
          console.log('📊 后端返回的会话数量:', conversations.length)
          console.log('📊 后端返回的会话数据:', JSON.stringify(conversations))
          
          // 创建一个 conversationId -> conversation 的映射
          const conversationMap = {}
          conversations.forEach(conv => {
            conversationMap[conv.conversationId] = conv
          })
          
          console.log('📊 会话映射:', conversationMap)
          
          // 更新每个对话的未读数（使用 Vue.set 确保响应式）
          this.chats.forEach((chat, index) => {
            const conv = conversationMap[chat.conversationId]
            if (conv) {
              // 确保 unreadCount 是数字类型
              const unreadCount = parseInt(conv.unreadCount) || 0
              this.$set(this.chats[index], 'unreadCount', unreadCount)
              console.log(`💬 更新对话 ${chat.conversationId} (${chat.name}) 未读数: ${unreadCount}, 类型: ${typeof unreadCount}`)
            } else {
              console.warn(`⚠️ 对话 ${chat.conversationId} 在后端返回中不存在`)
            }
          })
          
          // 更新分类计数和过滤
          this.updateCategoryCount()
          this.filterChats()
          
          console.log('✅ 未读数更新完成')
        }
      } catch (error) {
        console.error('❌ 加载未读消息数失败:', error)
      }
    },
    
    // --- 核心：处理单条会话 (获取对方头像昵称) ---
    async processConversation(conv) {
      try {
        const otherUserId = conv.userId1 === this.currentUserId ? conv.userId2 : conv.userId1
        
        // 默认值
        let otherUserName = `用户${otherUserId}`
        let otherUserAvatar = '/static/images/default-avatar.png'
        let otherUserRole = 1 
        
        try {
          const userInfoRes = await searchUsers({ userId: otherUserId })
          if (userInfoRes && userInfoRes.data) {
            let userData = null
            if (userInfoRes.data.rows && Array.isArray(userInfoRes.data.rows)) {
              userData = userInfoRes.data.rows[0]
            } else if (Array.isArray(userInfoRes.data)) {
              userData = userInfoRes.data[0]
            } else {
              userData = userInfoRes.data
            }
            
            if (userData) {
              // 名字处理逻辑
              if (userData.nickName && userData.nickName.trim() !== '') {
                otherUserName = userData.nickName
              } else if (userData.userName && userData.userName.trim() !== '' && !/^\d{11}$/.test(userData.userName)) {
                otherUserName = userData.userName
              }
              
              // 头像处理
              if (userData.avatar && userData.avatar.trim() !== '') {
                otherUserAvatar = processAvatarUrl(userData.avatar, '/static/images/default-avatar.png')
              }
              otherUserRole = userData.userRole || 1
            }
          }
        } catch (error) {
          console.warn('⚠️ 获取用户信息失败(ID:' + otherUserId + ')', error)
        }
        
        return {
          id: conv.conversationId,
          conversationId: conv.conversationId,
          name: otherUserName,
          avatar: otherUserAvatar,
          lastMessage: conv.lastMessage || '暂无消息',
          lastMessageTime: conv.lastMessageTime,
          unreadCount: conv.unreadCount ? parseInt(conv.unreadCount) : 0, 
          userRole: otherUserRole,
          userId1: conv.userId1,
          userId2: conv.userId2,
          otherUserId: otherUserId,
        }
      } catch (error) {
        console.error('❌ 处理单条会话出错:', error)
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
/* 定义全局变量：核心蓝 #1966FF */
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

/* 占位符，高度根据 fixed-header 的实际内容调整，约 260rpx-300rpx */
.header-placeholder {
  height: 280rpx; 
}

.header {
  padding: 0 30rpx;
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
  width: 60rpx;
  height: 60rpx;
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

/* 搜索框 */
.search-wrapper {
  padding: 10rpx 30rpx 20rpx;
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
}

/* 分类 Tabs */
.category-tabs {
  background-color: #fff;
  padding-bottom: 20rpx;
}

.tabs-scroll {
  width: 100%;
  white-space: nowrap;
}

.tabs-flex {
  display: flex;
  padding: 0 30rpx;
}

.tab-item {
  display: inline-flex;
  align-items: center;
  padding: 12rpx 24rpx;
  margin-right: 20rpx;
  border-radius: 30rpx;
  background-color: #F5F5F5;
  transition: all 0.3s;
  border: 1rpx solid transparent;
}

.tab-item.active {
  background-color: var(--theme-blue-light);
  border-color: rgba(25, 102, 255, 0.1);
}

.tab-text {
  font-size: 26rpx;
  color: #666;
  font-weight: 500;
}

.tab-item.active .tab-text {
  color: var(--theme-blue);
  font-weight: bold;
}

.tab-count {
  margin-left: 8rpx;
  background-color: #FF4D4F;
  color: #fff;
  font-size: 20rpx;
  padding: 0 8rpx;
  border-radius: 20rpx;
  line-height: 28rpx;
  min-width: 28rpx;
  text-align: center;
}

/* --- 列表区域 --- */
.chat-list {
  flex: 1;
  box-sizing: border-box;
  padding-top: 20rpx; 
}

.chat-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  background-color: #fff;
  margin-bottom: 2rpx;
}

.chat-hover {
  background-color: #F9FAFC;
}

/* 头像 */
.avatar-container {
  position: relative;
  margin-right: 24rpx;
}

.chat-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  border: 2rpx solid #f0f0f0;
  background-color: #eee;
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
}

/* 内容 */
.chat-content {
  flex: 1;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}

.name-row {
  display: flex;
  align-items: center;
  flex: 1;
  overflow: hidden;
}

.chat-name {
  font-size: 32rpx;
  color: var(--text-main);
  font-weight: 600;
  margin-right: 12rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 角色标签 */
.role-tag {
  font-size: 20rpx;
  padding: 2rpx 8rpx;
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
  font-size: 22rpx;
  color: var(--text-sub);
  flex-shrink: 0;
}

.chat-footer {
  display: flex;
  justify-content: space-between;
}

.message-text {
  font-size: 26rpx;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 90%;
}

/* 空状态 */
.empty-state {
  padding-top: 120rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 30rpx;
}

.empty-btn {
  border: 2rpx solid var(--theme-blue);
  color: var(--theme-blue);
  font-size: 26rpx;
  padding: 12rpx 40rpx;
  border-radius: 30rpx;
}

/* --- 弹窗样式 --- */
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
  margin-bottom: 10rpx;
}

.dialog-subtitle {
  font-size: 24rpx;
  color: #999;
}

.dialog-body {
  padding: 0 40rpx 40rpx;
}

.input-wrapper {
  background-color: #F5F7FA;
  border-radius: 16rpx;
  padding: 20rpx;
}

.dialog-input {
  height: 40rpx;
  font-size: 30rpx;
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