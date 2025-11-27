<template>
  <view class="chat-main-container">
    <!-- 顶部导航：统一管理列表态和详情态 -->
    <view class="chat-header" :class="{ 'detail-mode': showChatDetail }">
      
      <!-- 左侧区域 -->
      <view class="header-left">
        <!-- 返回按钮 (仅详情页显示) -->
        <view class="header-btn-icon back-btn" @click="showChatDetail = false" v-if="showChatDetail">
          <text class="icon-text">❮</text>
        </view>
        
        <!-- 标题 (列表页显示) -->
        <text class="header-title" v-if="!showChatDetail">消息</text>
        
        <!-- 用户状态 (详情页显示) -->
        <view class="user-status-wrap" v-else>
          <text class="header-title-name">{{ chatUser && chatUser.name ? chatUser.name : '聊天详情' }}</text>
          <text class="header-status-dot" :class="{ online: chatUser && chatUser.online }"></text>
        </view>
      </view>

      <!-- 右侧区域 -->
      <view class="header-right">
        <!-- 列表页按钮组 -->
        <view class="header-action-group" v-if="!showChatDetail">
          <view class="icon-btn" @click="testAddUnreadMessage" v-if="chats.length > 0">
            <text>📬</text>
          </view>
          <view class="icon-btn primary" @click="startNewChat">
            <text>+</text>
          </view>
        </view>
        
        <!-- 详情页按钮组 -->
        <view class="header-action-group" v-else>
           <view class="icon-btn info" @click="showUserInfo">
            <text>ℹ️</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 主内容区域 -->
    <view class="chat-content-wrapper">
      
      <!-- 1. 聊天列表视图 -->
      <view class="chat-list-view" :class="{ 'hidden': showChatDetail }">
        <!-- 搜索框 -->
        <view class="search-box-wrapper">
          <view class="search-box">
            <text class="search-icon">🔍</text>
            <input
              v-model="searchText"
              class="search-input"
              type="text"
              placeholder="搜索聊天..."
              @input="filterChats"
            />
          </view>
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

        <!-- 聊天列表 Scroll -->
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
            <view class="avatar-container">
              <image class="chat-avatar" :src="chat.avatar" mode="aspectFill"></image>
              <text v-if="chat && chat.unreadCount > 0" class="unread-badge">{{ chat.unreadCount > 99 ? '99+' : chat.unreadCount }}</text>
            </view>

            <view class="chat-content">
              <view class="chat-header-row">
                <text class="chat-name">{{ chat && chat.name ? chat.name : '未知聊天' }}</text>
                <text class="chat-time">{{ formatTime(chat && chat.lastMessageTime ? chat.lastMessageTime : null) }}</text>
              </view>
              <view class="chat-preview">
                <text class="preview-text">{{ chat && chat.lastMessage ? chat.lastMessage : '暂无消息' }}</text>
              </view>
            </view>

            <view class="chat-actions" @click.stop="deleteChat(chat)">
              <text class="action-icon-del">🗑️</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 2. 聊天详情视图 -->
      <view class="chat-detail-view" :class="{ 'active': showChatDetail }">
        <!-- 消息列表区 -->
        <scroll-view 
          class="message-list" 
          scroll-y="true" 
          :scroll-top="scrollTop"
          @scrolltoupper="loadMoreMessages"
          :scroll-with-animation="true"
        >
          <!-- 加载更多提示 -->
          <view v-if="loadingMore" class="loading-more">
            <text class="loading-text">加载中...</text>
          </view>

          <!-- 消息项循环 -->
          <view 
            v-for="(message, index) in messages" 
            :key="index"
            class="message-row-wrapper"
          >
            <!-- 时间分割线 (简单的逻辑：第一条或间隔大显示) -->
            <view v-if="index === 0 || (message.createTime - messages[index-1].createTime > 300000)" class="system-time-divider">
              <text>{{ formatTime(message.createTime) }}</text>
            </view>

            <view :class="['message-item', message.isSender ? 'sender' : 'receiver']">
              
              <!-- 接收方头像 -->
              <view v-if="!message.isSender" class="avatar-col">
                <image 
                  v-if="!shouldMergeMessages(index) || index === 0" 
                  class="avatar" 
                  :src="message.avatar" 
                  mode="aspectFill"
                ></image>
              </view>
              
              <!-- 消息内容区域 -->
              <view class="content-col">
                <!-- 发送者名字 (非合并消息且不是自己时显示) -->
                <text 
                  v-if="!message.isSender && (!shouldMergeMessages(index) || index === 0)" 
                  class="sender-name-text"
                >{{ message.senderName || '对方' }}</text>

                <view class="message-bubble" :class="message.isSender ? 'sender-bubble' : 'receiver-bubble'">
                  
                  <!-- 订单申请消息 -->
                  <view v-if="message.messageType === 2" class="order-message">
                    <view class="order-icon">📋</view>
                    <text class="order-title">{{ message.content }}</text>
                    <button 
                      v-if="message.actionType === 1 && !isDesigner" 
                      class="mini-action-btn"
                      @click="confirmOrder(message)"
                    >
                      {{ message.actionText || '确认订单' }}
                    </button>
                  </view>
                  
                  <!-- 普通消息 -->
                  <view v-else>
                    <!-- 图片消息 -->
                    <image v-if="message.mediaType === 'image'" :src="message.content" class="media-image" mode="widthFix" @click="previewImage(message.content)"></image>
                    <!-- 视频消息 -->
                    <video v-else-if="message.mediaType === 'video'" :src="message.content" class="media-video" controls></video>
                    <!-- 文本消息 -->
                    <text v-else class="message-text">{{ message.content }}</text>
                  </view>
                </view>
              </view>

              <!-- 发送方头像 -->
              <view v-if="message.isSender" class="avatar-col">
                <image 
                  v-if="!shouldMergeMessages(index) || index === 0" 
                  class="avatar" 
                  :src="message.avatar" 
                  mode="aspectFill"
                ></image>
              </view>

            </view>
          </view>
          
          <!-- 底部垫高，防止最后一条被输入框遮挡 -->
          <view style="height: 20rpx;"></view>
        </scroll-view>

        <!-- 底部输入区 (全新设计) -->
        <view class="input-area">
          <view class="input-toolbar">
            <!-- 左侧功能图标 -->
            <view class="tool-icons">
              <view class="tool-btn" @click="selectImage">
                <text class="tool-icon-text">🖼️</text>
              </view>
              <view class="tool-btn" @click="selectVideo">
                <text class="tool-icon-text">🎥</text>
              </view>
              <!-- 设计师/监理可见的接取订单按钮 -->
              <view 
                v-if="isDesigner || isSupervisor" 
                class="tool-btn"
                @click="sendOrderApplication"
              >
                <text class="tool-icon-text">📋</text>
              </view>
            </view>

            <!-- 输入框 -->
            <view class="input-box">
              <input
                v-model="inputText"
                class="input-field"
                type="text"
                confirm-type="send"
                placeholder="发送消息..."
                placeholder-style="color: #bbb;"
                @confirm="sendMessage"
                @input="onInputChange"
                @focus="onInputFocus"
                @blur="onInputBlur"
              />
            </view>

            <!-- 发送按钮 -->
            <view class="send-btn-wrap">
              <button 
                class="send-btn" 
                :class="{ 'active': inputText.trim().length > 0 }"
                @click="sendMessage"
              >
                发送
              </button>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 弹窗组件保持功能不变，仅做样式微调 -->

    <!-- 通过手机号添加新聊天弹窗 -->
    <uni-popup ref="addChatPopup" type="center" background-color="rgba(0,0,0,0)">
      <view class="dialog-card">
        <view class="dialog-header">添加聊天</view>
        <view class="dialog-body">
          <input
            v-model="addChatPhone"
            class="dialog-input"
            type="number"
            placeholder="请输入对方手机号"
          />
        </view>
        <view class="dialog-footer">
          <view class="dialog-btn cancel" @click="closeAddChatDialog">取消</view>
          <view class="dialog-btn confirm" @click="confirmAddChat" :class="{ disabled: addingChat }">
            {{ addingChat ? '...' : '确定' }}
          </view>
        </view>
      </view>
    </uni-popup>

    <!-- 订单确认弹窗 -->
    <uni-popup ref="orderPopup" type="center" :is-mask-click="false">
      <view class="dialog-card">
        <view class="dialog-header">
          <text>确认订单</text>
          <view class="close-x" @click="closeOrderPopup">×</view>
        </view>
        <view class="dialog-body">
          <text class="dialog-content-text">{{ selectedOrderMessage ? selectedOrderMessage.content : '' }}</text>
        </view>
        <view class="dialog-footer">
          <view class="dialog-btn cancel" @click="closeOrderPopup">取消</view>
          <view class="dialog-btn confirm" @click="confirmOrderAction">确认</view>
        </view>
      </view>
    </uni-popup>

    <!-- 消息提示 Toast -->
    <view v-if="toast.show" class="custom-toast" :class="toast.type">
      <text>{{ toast.message }}</text>
    </view>

    <!-- 消息栏通知 Banner -->
    <view v-if="messageNotification.show" class="notification-banner" @click="handleNotificationClick">
      <image class="notif-avatar" :src="messageNotification.avatar" mode="aspectFill"></image>
      <view class="notif-content">
        <text class="notif-name">{{ messageNotification.name }}</text>
        <text class="notif-text">{{ messageNotification.content }}</text>
      </view>
      <view class="notif-close" @click.stop="closeNotification">×</view>
    </view>
  </view>
</template>

<script>
import { mapState } from 'vuex'
import request from '@/utils/request'
import * as conversationApi from '@/api/conversation'
import * as messageApi from '@/api/message'
import { getRoleSwitchInfo, searchUsers } from '@/api/users'
import { getUnreadMessages } from '@/api/message_new'
// 导入新创建的工具函数
import { formatTime, parseDate, normalizeBackendTime, getValidTimestamp, isWithinTimeWindow } from '@/utils/timeUtils'
import { 
  createTextMessage, 
  createMediaMessage, 
  createOrderRequestMessage, 
  createReadConfirmMessage,
  processReceivedMessage,
  determineMessageSender,
  canSendOrderRequest,
  shouldMergeMessages as utilShouldMergeMessages,
  MESSAGE_TYPES,
  ACTION_TYPES,
  USER_ROLES
} from '@/utils/websocketUtils'
import { 
  ROLE_MAP,
  normalizeUserRole,
  convertConversationsToChats,
  convertMessagesToChatRequests,
  filterChatsByRole,
  filterChatsBySearch,
  updateCategoryCount as utilUpdateCategoryCount,
  updateChatLastMessage as utilUpdateChatLastMessage,
  updateLocalUnreadCount as utilUpdateLocalUnreadCount,
  incrementUnreadCount as utilIncrementUnreadCount
} from '@/utils/chatDataUtils'
import { 
  validateTextMessage, 
  validatePhoneNumber, 
  validateMessageParams,
  validateChatRequestParams,
  createErrorResponse,
  createSuccessResponse
} from '@/utils/messageValidation'

export default {
  name: 'ChatMain',
  data() {
    return {
      // 聊天列表相关
      searchText: '',
      activeTab: 'all', // 默认显示全部，确保聊天记录不丢失
      chats: [],
      loading: false,
      currentUserId: 0,
      categoryTabs: [
        { id: 'all', label: '全部', count: 0 },
        { id: 'designer', label: '设计师', count: 0 },
        { id: 'supervisor', label: '监理', count: 0 },
        { id: 'user', label: '普通用户', count: 0 }
      ],
      
      // 聊天详情相关
      showChatDetail: false,
      conversationId: 0,
      otherUserId: 0,
      chatUser: null,
      currentRoleType: 'user', // 使用与我的页面相同的角色类型
      userRole: 0,
      chatParticipants: null, // 聊天参与者身份信息
      messages: [],
      inputText: '',
      scrollTop: 0,
      loadingMore: false,
      selectedOrderMessage: null,
      ws: null,
      wsConnected: false,
      pageNum: 1,
      pageSize: 20,
      loadingMessages: false,
      // 从外部跳转时待打开的会话信息
      pendingConversationId: 0,
      pendingOtherUserId: 0,
      
      // 角色映射 - 使用工具类中的配置
      roleMap: ROLE_MAP,
      
      // 弹窗相关
      addChatDialogVisible: false,
      addChatPhone: '',
      addingChat: false,
      
      // 提示消息
      toast: {
        show: false,
        message: '',
        type: 'success'
      },
      
      // 消息通知
      messageNotification: {
        show: false,
        id: '',
        avatar: '',
        name: '',
        content: '',
        conversationId: 0,
        userId: 0
      }
    }
  },
  computed: {
    // 当前角色名称
    currentRoleName() {
      return this.roleMap[this.currentRoleType]?.name || '普通用户'
    },
    
    // 当前角色对应的userRole数字
    currentUserRole() {
      return this.roleMap[this.currentRoleType]?.userRole || 1
    },
    
    // 检查是否为设计师
    isDesigner() {
      return this.currentRoleType === 'designer'
    },
    
    // 检查是否为监理
    isSupervisor() {
      return this.currentRoleType === 'supervisor'
    },
    
    // 检查是否为材料商
    isMaterialSupplier() {
      return this.currentRoleType === 'material_supplier'
    },
    
    filteredChats() {
      let result = this.chats
      
      console.log('🔍 开始过滤聊天列表:', {
        totalChats: this.chats.length,
        activeTab: this.activeTab,
        searchText: this.searchText
      })

      // 1. 按分类过滤 - 添加兼容性处理
      if (this.activeTab !== 'all') {
        const beforeFilter = result.length
        result = result.filter(chat => {
          // 添加调试信息
          console.log('🔍 过滤聊天:', {
            chatName: chat.name,
            chatUserRole: chat.userRole,
            chatNormalizedUserRole: chat.normalizedUserRole,
            activeTab: this.activeTab,
            expectedDesignerRole: this.roleMap.designer.userRole,
            expectedSupervisorRole: this.roleMap.supervisor.userRole,
            expectedUserRole: this.roleMap.user.userRole
          })
          
          // 使用标准化后的userRole进行过滤
          const roleToCheck = chat.normalizedUserRole !== undefined ? chat.normalizedUserRole : chat.userRole
          
          if (this.activeTab === 'designer') return roleToCheck === this.roleMap.designer.userRole
          if (this.activeTab === 'supervisor') return roleToCheck === this.roleMap.supervisor.userRole
          if (this.activeTab === 'user') return roleToCheck === this.roleMap.user.userRole
          return true
        })
        console.log('🔍 分类过滤结果:', { before: beforeFilter, after: result.length })
      }

      // 2. 按搜索文本过滤
      if (this.searchText) {
        const beforeSearch = result.length
        result = result.filter(chat =>
          (chat && chat.name ? chat.name : '').includes(this.searchText) ||
          (chat && chat.lastMessage ? chat.lastMessage : '').includes(this.searchText)
        )
        console.log('🔍 搜索过滤结果:', { before: beforeSearch, after: result.length })
      }

      console.log('🔍 最终过滤结果:', result.length)
      return result
    }
  },  // computed 结束
  
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
    // 聊天列表相关方法
    updateCategoryCount() {
      const counts = utilUpdateCategoryCount(this.chats)
      this.categoryTabs[0].count = counts.all // 全部
      this.categoryTabs[1].count = counts.designer // 设计师
      this.categoryTabs[2].count = counts.supervisor // 监理
      this.categoryTabs[3].count = counts.user // 普通用户
    },
    
    // 使用工具类中的时间格式化方法
    formatTime,
    parseDate,
    
    openChat(chat) {
      if (!chat) {
        console.warn('⚠️ 聊天对象为空，无法打开')
        return
      }
      
      console.log('📱 打开聊天详情:', chat)
      
      // 如果是聊天请求，需要先接受聊天请求
      if (chat.type === 'chat-request') {
        this.acceptChatRequest(chat)
        return
      }
      
      this.showChatDetail = true
      this.chatUser = {
        id: chat.otherUserId,
        name: chat.name || '未知用户',
        avatar: chat.avatar || '/static/images/default-avatar.png',
        online: chat.online || false
      }
      this.conversationId = chat.conversationId
      this.otherUserId = chat.otherUserId
      this.userRole = chat.userRole
      
      // 确定聊天参与者身份
      this.determineChatParticipants()
      
      // 标记消息为已读
      this.markMessagesAsRead(chat.conversationId)
      
      // 加载历史消息
      this.pageNum = 1
      this.messages = []
      this.loadHistoryMessages()
      
      // 重新连接WebSocket
      if (this.ws) {
        this.ws.close()
      }
      this.connectWebSocket()
    },
    
    // 确定聊天参与者身份
    determineChatParticipants() {
      console.log('🔍 确定聊天参与者身份:', {
        currentUserId: this.currentUserId,
        otherUserId: this.otherUserId,
        conversationId: this.conversationId
      })
      
      // 设置聊天参与者信息
      this.chatParticipants = {
        currentUser: {
          id: this.currentUserId,
          isSender: true // 当前用户在发送时是发送方
        },
        otherUser: {
          id: this.otherUserId,
          isSender: false // 对方在接收时是发送方
        }
      }
      
      console.log('✅ 聊天参与者身份确定:', this.chatParticipants)
    },
    
    // 标记消息为已读
    async markMessagesAsRead(conversationId) {
      try {
        console.log('📖 标记消息为已读，conversationId:', conversationId)
        
        // 通过WebSocket发送已读消息
        if (this.ws && this.wsConnected) {
          const readMessage = {
            action: 'read',
            conversationId: conversationId,
            senderId: this.currentUserId,
            receiverId: this.otherUserId,
            sendTime: Date.now()
          }
          
          this.ws.send(JSON.stringify(readMessage))
          console.log('✅ 已发送已读消息:', readMessage)
        }
        
        // 同时通过API标记已读（作为备用）
        try {
          const res = await request({
            url: '/api/message/read',
            method: 'post',
            data: {
              conversationId: conversationId,
              userId: this.currentUserId
            }
          })
          
          if (res.code === 200) {
            console.log('✅ API标记已读成功')
          }
        } catch (apiError) {
          console.warn('⚠️ API标记已读失败，但WebSocket已发送:', apiError)
        }
        
        // 更新本地聊天列表中的未读数量
        this.updateLocalUnreadCount(conversationId, 0)
        
      } catch (error) {
        console.error('❌ 标记消息已读失败:', error)
      }
    },
    
    // 更新本地未读消息数量 - 使用工具类
    updateLocalUnreadCount(conversationId, unreadCount) {
      this.chats = utilUpdateLocalUnreadCount(this.chats, conversationId, unreadCount)
    },
    
    // 增加未读消息数量 - 使用工具类
    incrementUnreadCount(conversationId) {
      this.chats = utilIncrementUnreadCount(this.chats, conversationId)
    },
    
    // 测试功能：手动添加未读消息（用于调试）
    testAddUnreadMessage() {
      if (this.chats.length > 0) {
        const firstChat = this.chats[0]
        this.incrementUnreadCount(firstChat.conversationId)
        console.log('🧪 测试：为第一个聊天添加未读消息')
      }
    },
    
    // 搜索手机号聊天功能 - 改进版
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
    
    closeAddChatDialog() {
      if (this.addingChat) return
      this.addChatDialogVisible = false
      this.addChatPhone = ''
      if (this.$refs.addChatPopup && this.$refs.addChatPopup.close) {
        this.$refs.addChatPopup.close()
      }
    },
    
    async confirmAddChat() {
      const phone = (this.addChatPhone || '').trim()
      
      // 使用验证工具验证手机号
      const phoneValidation = validatePhoneNumber(phone)
      if (!phoneValidation.isValid) {
        this.showToast(phoneValidation.error, 'error')
        return
      }

      // 确保当前用户ID已获取
      if (!this.currentUserId) {
        const storedUserId = uni.getStorageSync('userId')
        if (storedUserId) {
          this.currentUserId = parseInt(storedUserId)
          console.log('🔧 从存储中获取用户ID:', this.currentUserId)
        } else {
          console.warn('⚠️ 存储中没有找到用户ID')
        }
      } else {
        console.log('🔧 当前用户ID已存在:', this.currentUserId)
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
        const targetUserName = res.data.nickName || `用户${targetUserId}`
        console.log('✅ 找到用户，userId:', targetUserId, 'userName:', targetUserName)

        // 防止添加自己
        if (targetUserId === this.currentUserId) {
          this.showToast('不能添加自己为聊天对象', 'error')
          return
        }

        // 1. 首先创建或获取对话（前端调用 createOrGetConversation 接口）
        const convRes = await conversationApi.createOrGetConversation(targetUserId)
        if (convRes.code !== 200 || !convRes.data) {
          this.showToast(convRes.msg || '获取对话失败', 'error')
          return
        }
        
        const conversationId = convRes.data.conversationId
        
        // 2. 发送聊天请求消息 - 修改为普通消息类型，确保判断逻辑一致
        const requestMessage = {
          action: 'send',
          messageType: 1, // 改为普通消息类型，与系统消息区分
          senderId: parseInt(this.currentUserId), // 确保是数字类型
          receiverId: parseInt(targetUserId), // 确保是数字类型
          conversationId: conversationId,
          content: '对方请求与您进行沟通',
          userRole: this.currentUserRole,
          sendTime: Date.now()
        }
        
        // 如果WebSocket已连接，直接发送
        if (this.wsConnected && this.ws) {
          this.ws.send(JSON.stringify(requestMessage))
        } else {
          // 否则通过API发送
          await request({
            url: '/api/message/send',
            method: 'post',
            data: requestMessage
          })
        }
        
        // 3. 关闭弹窗并提示
        this.closeAddChatDialog()
        this.showToast('聊天请求已发送，等待对方同意', 'success')
        
        // 4. 更新聊天列表
        this.loadConversationList()
        
        // 5. 直接打开与该用户的聊天
        const newChat = {
          id: conversationId,
          conversationId: conversationId,
          name: targetUserName,
          avatar: '/static/images/default-avatar.png',
          lastMessage: '对方请求与您进行沟通',
          lastMessageTime: new Date(),
          unreadCount: 0,
          online: true,
          userRole: res.data.role || 1,
          otherUserId: targetUserId
        }
        
        // 检查是否已存在该聊天
        const existingIndex = this.chats.findIndex(c => c.conversationId === conversationId)
        if (existingIndex >= 0) {
          this.chats[existingIndex] = newChat
        } else {
          this.chats.unshift(newChat)
        }
        
        // 自动打开聊天详情
        this.openChat(newChat)
        
      } catch (e) {
        console.error('❌ 通过手机号添加聊天失败:', e)
        this.showToast('添加聊天失败，请稍后重试', 'error')
      } finally {
        this.addingChat = false
      }
    },
    
    // 接受聊天请求
    async acceptChatRequest(chat) {
      if (!chat || !chat.messageId) {
        console.warn('⚠️ 聊天请求信息无效')
        this.showToast('聊天请求信息无效', 'error')
        return
      }
      
      try {
        console.log('🤝 接受聊天请求:', chat)
        
        // 调用接受聊天请求接口
        const res = await request({
          url: `/api/message/chat-request/accept/${chat.messageId}`,
          method: 'post'
        })
        
        if (res.code === 200 && res.data) {
          console.log('✅ 聊天请求接受成功:', res.data)
          this.showToast('聊天请求已接受', 'success')
          
          // 重新加载聊天列表
          await this.loadConversationList()
          
          // 打开新创建的聊天
          const newChat = this.chats.find(c => c.conversationId === res.data.conversationId)
          if (newChat) {
            this.openChat(newChat)
          }
        } else {
          console.warn('⚠️ 接受聊天请求失败:', res.msg)
          this.showToast(res.msg || '接受聊天请求失败', 'error')
        }
      } catch (error) {
        console.error('❌ 接受聊天请求异常:', error)
        this.showToast('接受聊天请求失败', 'error')
      }
    },
    
    deleteChat(chat) {
      if (!chat || !chat.name) {
        this.showToast('聊天信息无效', 'error')
        return
      }
      
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
    
    // 聊天详情相关方法
    showUserInfo() {
      if (!this.chatUser) {
        uni.showToast({
          title: '用户信息无效',
          icon: 'none'
        })
        return
      }
      
      uni.showToast({
        title: `${this.chatUser.name || '未知用户'} - ${this.chatUser.online ? '在线' : '离线'}`,
        icon: 'none'
      })
    },
    
    onInputChange(event) {
      console.log('📝 输入框内容变化:', event.detail.value)
      this.inputText = event.detail.value
    },
    
    onInputFocus(event) {
      console.log('📝 输入框获得焦点')
    },
    
    onInputBlur(event) {
      console.log('📝 输入框失去焦点')
    },
    
    // 统一的消息发送者判断函数 - 使用工具类
    determineMessageSender(messageData) {
      return determineMessageSender(messageData, this.currentUserId)
    },
    
    // 判断消息是否应该与前一条消息合并
    shouldMergeMessages(index) {
      // 第一条消息不需要合并
      if (index === 0) return false
      
      const currentMessage = this.messages[index]
      const previousMessage = this.messages[index - 1]
      
      // 使用工具函数判断是否应该合并
      return utilShouldMergeMessages(currentMessage, previousMessage)
    },
    
    // 统一的消息处理函数 - 使用工具类
    addMessageToChat(messageData) {
      const processedMessage = processReceivedMessage(messageData, {
        currentUserId: this.currentUserId,
        chatUser: this.chatUser
      })
      
      this.messages.push(processedMessage)
      this.scrollTop = 999999
      
      return processedMessage
    },
    
    sendMessage() {
      // 使用验证工具验证消息内容
      const contentValidation = validateTextMessage(this.inputText)
      if (!contentValidation.isValid) {
        this.showToast(contentValidation.error, 'error')
        return
      }

      // 验证消息参数
      const paramsValidation = validateMessageParams({
        senderId: this.currentUserId,
        receiverId: this.otherUserId,
        conversationId: this.conversationId,
        content: this.inputText,
        messageType: MESSAGE_TYPES.NORMAL
      })
      
      if (!paramsValidation.isValid) {
        this.showToast(paramsValidation.errors[0], 'error')
        return
      }

      console.log('📤 发送消息:', this.inputText)

      // 使用工具函数创建消息
      const message = createTextMessage({
        senderId: this.currentUserId,
        receiverId: this.otherUserId,
        conversationId: this.conversationId,
        content: this.inputText,
        userRole: this.currentUserRole
      })

      if (this.wsConnected && this.ws) {
        this.ws.send(JSON.stringify(message))
        this.showToast('消息已发送', 'success')
        
        // 使用统一的消息处理函数进行本地回显
        this.addMessageToChat(message)
        
        // 更新聊天列表中的最后一条消息
        this.updateChatLastMessage(this.conversationId, this.inputText, new Date())
      } else {
        this.showToast('连接已断开，请重新连接', 'error')
      }

      this.inputText = ''
    },
    
    sendOrderApplication() {
      // 使用工具函数检查权限
      if (!canSendOrderRequest(this.currentUserRole)) {
        this.showToast('只有设计师和监理可以发送订单申请', 'error')
        return
      }

      // 使用工具函数创建订单申请消息
      const message = createOrderRequestMessage({
        senderId: this.currentUserId,
        receiverId: this.chatUser.id,
        conversationId: this.conversationId,
        content: '我想接取这个订单，请确认',
        userRole: this.currentUserRole
      })

      if (this.wsConnected && this.ws) {
        this.ws.send(JSON.stringify(message))
        this.showToast('订单申请已发送', 'success')
        
        // 使用统一的消息处理函数进行本地回显
        this.addMessageToChat(message)
        
        // 更新聊天列表中的最后一条消息
        this.updateChatLastMessage(this.conversationId, '我想接取这个订单，请确认', new Date())
      } else {
        this.showToast('连接已断开', 'error')
      }
    },
    
    confirmOrder(message) {
      this.selectedOrderMessage = message
      this.$refs.orderPopup.open()
    },
    
    confirmOrderAction() {
      if (!this.selectedOrderMessage) return

      const message = {
        action: 'confirm',
        messageId: this.selectedOrderMessage.messageId,
        orderApplicationId: this.selectedOrderMessage.orderApplicationId,
        sendTime: Date.now()
      }

      if (this.wsConnected && this.ws) {
        this.ws.send(JSON.stringify(message))
        this.showToast('订单已确认', 'success')
        this.closeOrderPopup()
      }
    },
    
    closeOrderPopup() {
      this.$refs.orderPopup.close()
      this.selectedOrderMessage = null
    },
    
    selectImage() {
      uni.chooseImage({
        count: 1,
        success: (res) => {
          const imagePath = res.tempFilePaths[0]
          this.uploadAndSendMedia(imagePath, 'image')
        },
        fail: (err) => {
          this.showToast('选择图片失败', 'error')
        }
      })
    },
    
    selectVideo() {
      uni.chooseVideo({
        success: (res) => {
          const videoPath = res.tempFilePath
          this.uploadAndSendMedia(videoPath, 'video')
        },
        fail: (err) => {
          this.showToast('选择视频失败', 'error')
        }
      })
    },
    
    uploadAndSendMedia(filePath, mediaType) {
      this.showToast('正在上传文件...', 'success')

      const config = require('@/config.js')
      
      uni.uploadFile({
        url: config.baseUrl + '/api/media/upload/file',
        filePath: filePath,
        name: 'file',
        formData: {
          relatedType: 1,
          relatedId: this.conversationId,
          description: `聊天消息-${mediaType}`,
          stage: 'chat'
        },
        success: (res) => {
          try {
            console.log('📤 上传响应:', res.data)
            const result = JSON.parse(res.data)
            console.log('📤 解析后的结果:', result)

            if ((result.code === 200 || result.code === 0) && result.data && result.data.fileUrl) {
              const fileUrl = result.data.fileUrl
              console.log('✅ 上传成功，文件URL:', fileUrl)
              this.sendMediaMessage(fileUrl, mediaType)
            } else {
              console.error('❌ 上传失败，响应:', result)
              this.showToast('上传失败: ' + (result.msg || '未知错误'), 'error')
            }
          } catch (e) {
            console.error('❌ 解析上传结果失败:', e)
            this.showToast('解析上传结果失败: ' + e.message, 'error')
          }
        },
        fail: (err) => {
          console.error('❌ 上传文件失败:', err)
          this.showToast('上传文件失败: ' + (err.errMsg || '网络错误'), 'error')
        }
      })
    },
    
    sendMediaMessage(fileUrl, mediaType) {
      console.log('📤 发送媒体消息:', mediaType, fileUrl)
      console.log('📤 发送媒体前检查:', {
        currentUserId: this.currentUserId,
        currentUserIdType: typeof this.currentUserId,
        otherUserId: this.otherUserId,
        otherUserIdType: typeof this.otherUserId
      })

      const message = {
        action: 'send',
        messageType: 1,
        senderId: parseInt(this.currentUserId), // 确保是数字类型
        receiverId: parseInt(this.otherUserId), // 确保是数字类型
        conversationId: this.conversationId,
        content: fileUrl,
        mediaType: mediaType,
        userRole: this.currentUserRole,
        sendTime: Date.now()
      }

      if (this.wsConnected && this.ws) {
        this.ws.send(JSON.stringify(message))
        this.showToast(`${mediaType === 'image' ? '图片' : '视频'}已发送`, 'success')
        
        // 使用统一的消息处理函数进行本地回显
        this.addMessageToChat(message)
        
        // 更新聊天列表中的最后一条消息
        this.updateChatLastMessage(this.conversationId, `${mediaType === 'image' ? '图片' : '视频'}消息`, new Date())
      } else {
        this.showToast('连接已断开，请重新连接', 'error')
      }
    },
    
    // WebSocket和数据加载方法
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

        // 初始化聊天列表
        this.chats = []

        // 2. 获取对话列表
        try {
          const res = await conversationApi.getConversationList()
          if (res.code === 200 && res.data) {
            console.log('✅ 获取对话列表成功:', res.data)

            // 3. 转换对话数据为聊天列表格式
            const chatPromises = res.data.map(async (conv) => {
              // 确定对方用户ID
              const otherUserId = conv.userId1 === this.currentUserId ? conv.userId2 : conv.userId1
              
              // 获取对方用户真实昵称
              let otherUserName = `用户${otherUserId}`
              let otherUserAvatar = '/static/images/default-avatar.png'
              
              try {
              // 调用用户信息接口获取真实昵称
              const userInfoRes = await searchUsers({ userId: otherUserId })
              if (userInfoRes && userInfoRes.data && userInfoRes.data.length > 0) {
                const user = userInfoRes.data[0]
                otherUserName = user.userName || user.nickName || otherUserName
                otherUserAvatar = user.avatar || otherUserAvatar
                console.log('👤 获取用户信息成功:', { userId: otherUserId, userName: otherUserName })
              }
            } catch (error) {
              console.warn('⚠️ 获取用户信息失败，使用默认昵称:', error)
            }

            // 使用工具函数解析时间
            const parsedTime = normalizeBackendTime(conv.lastMessageTime)
            
            return {
                id: conv.conversationId,
                conversationId: conv.conversationId,
                name: otherUserName,
                avatar: otherUserAvatar,
                lastMessage: conv.lastMessage || '暂无消息',
                lastMessageTime: parsedTime,
                unreadCount: conv.unreadCount || 0,
                online: conv.online || false,
                userRole: conv.otherUserRole || 1,
                // 兼容性处理：确保userRole是有效的数字
                normalizedUserRole: parseInt(conv.otherUserRole) || 1,
                userId1: conv.userId1,
                userId2: conv.userId2,
                otherUserId: otherUserId,
                type: 'conversation', // 标记这是对话类型
                // 添加调试信息
                _debug: {
                  originalOtherUserRole: conv.otherUserRole,
                  mappedUserRole: conv.otherUserRole || 1,
                  roleMap: this.roleMap
                }
              }
            })

            // 等待所有用户信息获取完成
            const conversationChats = await Promise.all(chatPromises)
            this.chats = this.chats.concat(conversationChats)
          }
        } catch (error) {
          console.warn('⚠️ 获取对话列表失败:', error)
        }

        // 4. 获取消息中心的消息，将聊天请求转换为聊天项
        try {
          const messageRes = await getUnreadMessages()
          if (messageRes.code === 200 && messageRes.data) {
            console.log('✅ 获取消息中心消息成功:', messageRes.data)
            
            const messageChats = messageRes.data
              .filter(msg => msg.messageType === 3) // 只处理聊天请求消息
              .map(msg => {
                console.log('🔍 处理聊天请求消息:', {
                  messageId: msg.messageId,
                  senderId: msg.senderId,
                  receiverId: msg.receiverId,
                  senderName: msg.senderName,
                  content: msg.content,
                  readStatus: msg.readStatus
                })
                
                // 解析聊天请求内容
                let senderName = msg.senderName || `用户${msg.senderId}`
                let conversationId = msg.conversationId
                
                // 如果消息内容是JSON格式，解析获取更多信息
                try {
                  const content = JSON.parse(msg.content || '{}')
                  if (content.type === 'CHAT_REQUEST') {
                    senderName = content.fromNickName || senderName
                    console.log('🔍 解析聊天请求内容:', {
                      fromUserId: content.fromUserId,
                      fromNickName: content.fromNickName,
                      finalSenderName: senderName
                    })
                  }
                } catch (e) {
                  console.warn('🔍 解析聊天请求内容失败:', e)
                }
                
                // 对于聊天请求，显示的是请求聊天的人（发送者）
                // 但在聊天列表中，这个人是对方用户
                return {
                  id: `msg_${msg.messageId}`,
                  conversationId: conversationId || msg.messageId,
                  name: senderName, // 显示请求聊天的人的姓名
                  avatar: '/static/images/default-avatar.png',
                  lastMessage: '请求与您聊天',
                  lastMessageTime: new Date(msg.sendTime || Date.now()),
                  unreadCount: msg.readStatus === 0 ? 1 : 0,
                  online: false,
                  userRole: 1,
                  otherUserId: msg.senderId, // 对方用户ID就是发送者ID
                  type: 'chat-request', // 标记这是聊天请求类型
                  messageId: msg.messageId,
                  messageStatusId: msg.messageStatusId,
                  // 添加调试信息
                  _debug: {
                    senderId: msg.senderId,
                    receiverId: msg.receiverId,
                    senderName: msg.senderName,
                    messageType: msg.messageType
                  }
                }
              })
            
            this.chats = this.chats.concat(messageChats)
            console.log('✅ 消息中心聊天请求转换完成:', messageChats)
          }
        } catch (error) {
          console.warn('⚠️ 获取消息中心消息失败:', error)
        }

        console.log('✅ 聊天列表加载完成:', this.chats)
        console.log('📊 聊天列表详情:', JSON.stringify(this.chats, null, 2))
        
        // 调试：检查未读消息数量
        this.chats.forEach(chat => {
          console.log('🔢 聊天未读消息检查:', {
            conversationId: chat.conversationId,
            name: chat.name,
            unreadCount: chat.unreadCount,
            showBadge: chat.unreadCount > 0
          })
        })
        
        this.updateCategoryCount()
      } catch (error) {
        console.error('❌ 加载对话列表出错:', error)
        this.showToast('加载对话列表出错', 'error')
      } finally {
        this.loading = false
      }
    },
    
    async loadHistoryMessages() {
      if (!this.conversationId) {
        console.warn('⚠️ conversationId 为空，无法加载历史消息')
        return
      }

      try {
        this.loadingMessages = true
        console.log('📥 开始加载历史消息，conversationId:', this.conversationId)

        const res = await messageApi.getMessageList(this.conversationId, this.pageNum, this.pageSize)
        if (res.code === 200 && res.data) {
          console.log('✅ 获取历史消息成功:', res.data)

          // 转换消息数据
          this.messages = res.data.map(msg => {
            console.log('🔍 处理原始消息数据:', {
              messageId: msg.messageId,
              senderId: msg.senderId,
              createdBy: msg.createdBy,
              sendTime: msg.sendTime,
              content: msg.content,
              processedCreateTime: msg.sendTime ? new Date(msg.sendTime) : new Date()
            })
            
            // 使用统一的消息发送者判断函数
            const isSender = this.determineMessageSender(msg)
            
            // 获取发送者昵称
            let senderName = '未知用户'
            if (isSender) {
              senderName = '我'
            } else {
              // 接收方消息：显示对方真实昵称
              senderName = this.chatUser && this.chatUser.name ? this.chatUser.name : '对方'
            }
            
            console.log('🏷️ 历史消息发送者昵称:', {
              content: msg.content,
              senderId: msg.senderId,
              isSender: isSender,
              senderName: senderName,
              chatUserName: this.chatUser?.name
            })
            
            // 使用工具函数处理时间戳
            const validSendTime = getValidTimestamp(msg)
            
            return {
              ...msg,
              isSender: isSender,
              senderName: senderName,
              avatar: msg.senderAvatar || '/static/images/default-avatar.png',
              // 使用时间戳而不是 Date 对象，保持一致性
              createTime: validSendTime,
              sendTime: validSendTime,
              createdBy: msg.createdBy
            }
          })

          console.log('✅ 历史消息加载完成，共', this.messages.length, '条')

          // 滚动到底部
          setTimeout(() => {
            this.scrollTop = 999999
          }, 100)
        } else {
          console.warn('⚠️ 获取历史消息失败:', res.msg)
        }
      } catch (error) {
        console.error('❌ 加载历史消息出错:', error)
      } finally {
        this.loadingMessages = false
      }
    },
    
    loadMoreMessages() {
      if (this.loadingMore) return
      this.loadingMore = true
      setTimeout(() => {
        this.loadingMore = false
      }, 1000)
    },
    
    previewImage(imageUrl) {
      uni.previewImage({
        urls: [imageUrl],
        current: 0
      })
    },
    
    showToast(message, type = 'success') {
      this.toast.message = message
      this.toast.type = type
      this.toast.show = true
      setTimeout(() => {
        this.toast.show = false
      }, 2000)
    },
    
    connectWebSocket() {
      // 本地联调：直接连本机后端 8081 端口的 WebSocket
      const wsUrl = `ws://localhost:8081/ws/chat?userId=${this.currentUserId}`
      console.log('🔌 WebSocket 连接地址:', wsUrl)
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        this.wsConnected = true
        console.log('✅ WebSocket 连接成功')
        this.showToast('已连接', 'success')
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📨 收到消息:', data)
          
          // 处理新消息
          if (data.action === 'send' || data.messageType) {
            console.log('📨 WebSocket收到消息 - 身份检查:', {
              content: data.content,
              senderId: data.senderId,
              currentUserId: this.currentUserId,
              otherUserId: this.otherUserId,
              chatParticipants: this.chatParticipants
            })
            
            // 如果是自己发送的消息，跳过处理（避免重复显示）
            if (data.senderId == this.currentUserId) { // 使用松散比较
              console.log('🔄 跳过自己发送的消息:', data.content)
              return
            }
            
            // 如果当前正在聊天详情页面且是该对话的消息
            if (this.showChatDetail && data.conversationId === this.conversationId) {
              console.log('📨 WebSocket收到对方消息:', {
                content: data.content,
                senderId: data.senderId,
                currentUserId: this.currentUserId
              })
              // 使用统一的消息处理函数添加消息
              this.addMessageToChat(data)
              this.scrollTop = 999999
            } else {
              // 如果不是当前聊天的消息，显示消息通知
              this.showNotification(data)
            }
            
            // 更新聊天列表中的最后一条消息
            this.updateChatLastMessage(data.conversationId, data.content, new Date())
            
            // 如果不是当前聊天的消息，增加未读数量
            if (!this.showChatDetail || data.conversationId !== this.conversationId) {
              this.incrementUnreadCount(data.conversationId)
            }
          }
          
          // 处理已读消息确认
          if (data.action === 'read') {
            console.log('📖 收到已读消息确认:', data)
            // 如果对方标记了我们的消息为已读，可以在这里更新UI状态
            if (data.senderId === this.otherUserId) {
              console.log('✅ 对方已读我们的消息')
              // 可以在这里添加已读状态的UI更新
            }
          }
        } catch (e) {
          console.error('❌ 解析消息失败:', e)
        }
      }

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket 连接出错:', error)
        this.showToast('连接出错', 'error')
      }

      this.ws.onclose = (evt) => {
        this.wsConnected = false
        console.log('❌ WebSocket 连接已断开', { code: evt?.code, reason: evt?.reason })
        this.showToast('连接已断开，请重新连接', 'error')
      }
    },
    
    // 消息通知相关方法
    showNotification(data) {
      // 设置通知信息
      this.messageNotification = {
        show: true,
        id: data.messageId || Date.now(),
        avatar: data.senderAvatar || '/static/images/default-avatar.png',
        name: data.senderName || `用户${data.senderId}`,
        content: data.content,
        conversationId: data.conversationId,
        userId: data.senderId
      }
      
      // 5秒后自动隐藏通知
      setTimeout(() => {
        this.messageNotification.show = false
      }, 5000)
    },
    
    handleNotificationClick() {
      // 查找对应的聊天
      const chat = this.chats.find(c => c.conversationId === this.messageNotification.conversationId)
      if (chat) {
        this.openChat(chat)
      } else {
        // 如果聊天列表中没有，可能是新的聊天请求，需要重新加载列表
        this.loadConversationList().then(() => {
          const newChat = this.chats.find(c => c.conversationId === this.messageNotification.conversationId)
          if (newChat) {
            this.openChat(newChat)
          }
        })
      }
      this.messageNotification.show = false
    },
    
    closeNotification() {
      this.messageNotification.show = false
    },
    
    // 更新聊天列表中的最后一条消息 - 使用工具类
    updateChatLastMessage(conversationId, content, time) {
      this.chats = utilUpdateChatLastMessage(this.chats, conversationId, content, time, this.currentUserId, this.otherUserId)
      // 更新分类计数
      this.updateCategoryCount()
    }
  },
  
  // 初始化角色信息 - 使用与我的页面相同的方式
  initRoleInfo() {
    // 1. 从本地存储获取角色信息
    const storedRole = uni.getStorageSync('currentRoleType')
    if (storedRole) {
      this.currentRoleType = storedRole
      this.userRole = this.currentUserRole
      console.log('📱 从本地存储获取角色:', this.currentRoleType, this.userRole)
    }
    
    // 2. 监听角色变更事件
    uni.$on('roleChanged', (data) => {
      console.log('🔄 监听到角色变更:', data)
      if (data.currentRoleType) {
        this.currentRoleType = data.currentRoleType
        this.userRole = this.currentUserRole
        console.log('🎯 聊天页面角色更新为:', this.currentRoleType, this.userRole)
      }
    })
    
    // 3. 检查角色更新
    this.checkRoleUpdate()
  },
  
  // 检查角色更新 - 使用与我的页面相同的方式
  checkRoleUpdate() {
    const storedRole = uni.getStorageSync('currentRoleType')
    if (storedRole && storedRole !== this.currentRoleType) {
      console.log('🔄 检测到角色变更，从', this.currentRoleType, '变为', storedRole)
      this.currentRoleType = storedRole
      this.userRole = this.currentUserRole
      console.log('🎯 聊天页面更新角色为:', this.currentRoleType, this.userRole)
    }
  },  // checkRoleUpdate 结束
  
  // 角色标准化处理 - 确保兼容性
  normalizeUserRole(role) {
    if (!role) return 1 // 默认为普通用户
    
    // 如果已经是有效的角色数字，直接返回
    const validRoles = [1, 2, 3, 4] // user, designer, supervisor, material_supplier
    if (validRoles.includes(parseInt(role))) {
      return parseInt(role)
    }
    
    // 如果是字符串，尝试映射
    if (typeof role === 'string') {
      const roleMapping = {
        'user': 1,
        'designer': 2,
        'supervisor': 3,
        'material_supplier': 4,
        'materialSupplier': 4
      }
      return roleMapping[role.toLowerCase()] || 1
    }
    
    // 其他情况默认为普通用户
    return 1
  },  // normalizeUserRole 结束
  
  // 生命周期方法
  onLoad(options) {
    // 解析从其他页面传入的会话参数（例如消息中心的"前往聊天"）
    if (options) {
      const convId = options.conversationId ? parseInt(options.conversationId) : 0
      const otherId = options.otherUserId ? parseInt(options.otherUserId) : 0
      if (convId) {
        this.pendingConversationId = convId
      }
      if (otherId) {
        this.pendingOtherUserId = otherId
      }
    }

    // 从本地存储获取当前用户信息
    const storedUserId = uni.getStorageSync('userId')
    this.currentUserId = storedUserId ? parseInt(storedUserId) : 0
    console.log('🔧 页面加载时获取用户ID:', this.currentUserId)
    
    // 初始化角色信息
    const storedRole = uni.getStorageSync('currentRoleType')
    if (storedRole) {
      this.currentRoleType = storedRole
      this.userRole = this.currentUserRole
      console.log('📱 从本地存储获取角色:', this.currentRoleType, this.userRole)
    }

    // 页面加载时从后端获取聊天列表
    this.loadConversationList().then(() => {
      // 如果有待打开的会话，尝试自动进入具体对话
      if (this.pendingConversationId) {
        const targetChat = this.chats.find(c => c.conversationId === this.pendingConversationId)
        if (targetChat) {
          this.openChat(targetChat)
        }
      }
    })
  },  // onLoad 结束
  
  onUnload() {
    if (this.ws) {
      this.ws.close()
    }
  }  // onUnload 结束
}  // export default 结束
</script>

<style scoped>
/* =========================
   全局布局变量
   ========================= */
.chat-main-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f2f4f6;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Segoe UI, Arial, Roboto, 'PingFang SC', 'miui', 'Hiragino Sans GB', 'Microsoft Yahei', sans-serif;
}

/* =========================
   头部导航 Header
   ========================= */
.chat-header {
  /* 固定高度 + 状态栏高度 */
  height: 88rpx; 
  padding-top: var(--status-bar-height); 
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 24rpx;
  padding-right: 24rpx;
  border-bottom: 1rpx solid #eaeaea;
  z-index: 100;
  flex-shrink: 0;
  box-sizing: content-box; /* 保证height是内容高度 */
}

.header-left {
  display: flex;
  align-items: center;
  flex: 1;
  overflow: hidden;
}

.header-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* 标题样式 */
.header-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #111;
}

/* 返回按钮 */
.back-btn {
  margin-right: 16rpx;
  padding: 10rpx 10rpx 10rpx 0;
}
.icon-text {
  font-size: 36rpx;
  color: #333;
}

/* 用户状态 (详情页) */
.user-status-wrap {
  display: flex;
  align-items: center;
  overflow: hidden;
}
.header-title-name {
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 400rpx;
}
.header-status-dot {
  width: 14rpx;
  height: 14rpx;
  background: #ccc;
  border-radius: 50%;
  margin-left: 12rpx;
  flex-shrink: 0;
}
.header-status-dot.online {
  background: #34C759;
  box-shadow: 0 0 6rpx rgba(52,199,89, 0.4);
}

/* 顶部按钮组 */
.header-action-group {
  display: flex;
  gap: 24rpx;
}
.icon-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  background: #f7f7f7;
  color: #333;
  transition: opacity 0.2s;
}
.icon-btn:active {
  opacity: 0.7;
}
.icon-btn.primary {
  background: #007AFF;
  color: #fff;
}
.icon-btn.info {
  background: transparent;
  color: #007AFF;
  font-size: 40rpx;
}

/* =========================
   内容区域 Wrapper
   ========================= */
.chat-content-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
}

/* =========================
   1. 列表视图 Chat List View
   ========================= */
.chat-list-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}
.chat-list-view.hidden {
  display: none;
}

/* 搜索框 */
.search-box-wrapper {
  padding: 16rpx 24rpx;
  background: #fff;
}
.search-box {
  background: #f5f5f5;
  border-radius: 36rpx;
  padding: 0 24rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
}
.search-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
  opacity: 0.5;
}
.search-input {
  flex: 1;
  font-size: 28rpx;
  height: 100%;
}

/* Tab分类 */
.category-tabs {
  padding: 0 24rpx;
  display: flex;
  gap: 40rpx;
  border-bottom: 1rpx solid #f0f0f0;
  height: 88rpx;
  align-items: center;
}
.tab-item {
  height: 100%;
  display: flex;
  align-items: center;
  position: relative;
  color: #666;
  font-size: 28rpx;
}
.tab-item.active {
  color: #007AFF;
  font-weight: 600;
  font-size: 30rpx;
}
.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40%;
  height: 4rpx;
  background: #007AFF;
  border-radius: 2rpx;
}
.tab-badge {
  position: absolute;
  top: 20rpx;
  right: -16rpx;
  background: #FF3B30;
  color: white;
  font-size: 18rpx;
  height: 28rpx;
  min-width: 28rpx;
  padding: 0 6rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 列表容器 */
.chat-list {
  flex: 1;
  height: 0; 
}

/* 列表项 */
.chat-item {
  padding: 24rpx;
  display: flex;
  align-items: center;
  background: #fff;
  transition: background 0.2s;
}
.chat-item:active {
  background: #f9f9f9;
}
.avatar-container {
  position: relative;
  margin-right: 24rpx;
}
.chat-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 16rpx;
  background: #eee;
}
.unread-badge {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  background: #FF3B30;
  color: white;
  font-size: 20rpx;
  padding: 0 8rpx;
  min-width: 36rpx;
  height: 36rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #fff;
  font-weight: 600;
}

.chat-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100rpx;
  border-bottom: 1rpx solid #f7f7f7;
}
.chat-header-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10rpx;
}
.chat-name {
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
}
.chat-time {
  font-size: 22rpx;
  color: #999;
}
.preview-text {
  font-size: 26rpx;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.action-icon-del {
  font-size: 36rpx;
  padding: 20rpx;
  color: #ccc;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  opacity: 0.6;
}
.empty-icon { font-size: 80rpx; margin-bottom: 20rpx; }
.empty-text { font-size: 30rpx; color: #333; }
.empty-desc { font-size: 24rpx; color: #999; margin-top: 10rpx; }

/* =========================
   2. 详情视图 Chat Detail View
   ========================= */
.chat-detail-view {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #f2f4f6;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.3s ease-in-out;
  z-index: 50;
}
.chat-detail-view.active {
  transform: translateX(0);
}

/* 消息列表 */
.message-list {
  flex: 1;
  height: 0;
  padding: 0;
  box-sizing: border-box;
}

.message-row-wrapper {
  width: 100%;
  padding: 0 24rpx;
  box-sizing: border-box;
  margin-bottom: 24rpx;
}

.system-time-divider {
  text-align: center;
  margin: 40rpx 0 20rpx 0;
}
.system-time-divider text {
  background: rgba(0,0,0,0.1);
  color: #fff;
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}

/* 消息项布局 */
.message-item {
  display: flex;
  width: 100%;
  align-items: flex-start;
}
.message-item.receiver { justify-content: flex-start; }
.message-item.sender { justify-content: flex-end; }

.avatar-col {
  width: 80rpx;
  flex-shrink: 0;
}
.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 10rpx;
}

.content-col {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}
.message-item.receiver .content-col { margin-left: 20rpx; align-items: flex-start; }
.message-item.sender .content-col { margin-right: 20rpx; align-items: flex-end; }

.sender-name-text {
  font-size: 22rpx;
  color: #999;
  margin-bottom: 6rpx;
}

/* 气泡样式核心优化 */
.message-bubble {
  padding: 18rpx 24rpx;
  position: relative;
  word-break: break-all;
  font-size: 30rpx;
  line-height: 1.5;
  box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.05);
  min-height: 80rpx; /* 保证只有文字时也有高度 */
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

/* 接收方气泡：白色圆角 */
.receiver-bubble {
  background: #fff;
  color: #333;
  border-radius: 0 24rpx 24rpx 24rpx; 
}

/* 发送方气泡：蓝色圆角 */
.sender-bubble {
  background: #007AFF; /* iOS Blue */
  color: #fff;
  border-radius: 24rpx 0 24rpx 24rpx;
}

.message-text {
  display: inline-block;
}

.media-image {
  max-width: 360rpx;
  border-radius: 12rpx;
  display: block;
}
.media-video {
  max-width: 360rpx;
  height: 240rpx;
  border-radius: 12rpx;
}

/* 订单消息特殊样式 */
.order-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}
.order-icon { font-size: 40rpx; margin-bottom: 10rpx; }
.order-title { font-size: 28rpx; font-weight: 500; margin-bottom: 16rpx; text-align: center;}
.mini-action-btn {
  font-size: 24rpx;
  background: #fff;
  color: #333;
  border: none;
  border-radius: 24rpx;
  padding: 0 24rpx;
  line-height: 48rpx;
  height: 48rpx;
}

/* 加载更多 */
.loading-more { padding: 20rpx; text-align: center; }
.loading-text { font-size: 24rpx; color: #999; }

/* =========================
   底部输入栏 Input Area (WeChat Style)
   ========================= */
.input-area {
  background: #f7f7f7;
  border-top: 1rpx solid #dcdcdc;
  padding-bottom: env(safe-area-inset-bottom); 
}

.input-toolbar {
  display: flex;
  align-items: flex-end;
  padding: 16rpx 20rpx;
  gap: 16rpx;
  min-height: 100rpx; /* 保证点击区域 */
  box-sizing: border-box;
}

.tool-icons {
  display: flex;
  align-items: center;
  height: 72rpx; /* 与输入框高度对齐 */
  gap: 16rpx;
}
.tool-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tool-btn:active { opacity: 0.6; background: #e0e0e0; }
.tool-icon-text { font-size: 44rpx; }

.input-box {
  flex: 1;
  background: #fff;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  min-height: 72rpx;
  display: flex;
  align-items: center;
}
.input-field {
  width: 100%;
  font-size: 30rpx;
  color: #333;
  max-height: 160rpx;
}

.send-btn-wrap {
  height: 72rpx;
  display: flex;
  align-items: center;
}
.send-btn {
  background: #e0e0e0;
  color: #fff;
  font-size: 28rpx;
  border-radius: 10rpx;
  padding: 0 24rpx;
  height: 64rpx;
  line-height: 64rpx;
  border: none;
  transition: all 0.2s;
}
.send-btn.active {
  background: #007AFF; /* 激活时变蓝 */
}

/* =========================
   弹窗 & 辅助组件
   ========================= */
.dialog-card {
  width: 600rpx;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
}
.dialog-header {
  padding: 30rpx;
  text-align: center;
  font-size: 34rpx;
  font-weight: 600;
  border-bottom: 1rpx solid #f0f0f0;
  position: relative;
}
.close-x {
  position: absolute;
  right: 30rpx;
  top: 30rpx;
  color: #999;
  font-size: 40rpx;
  line-height: 1;
}
.dialog-body { padding: 40rpx 30rpx; }
.dialog-input {
  background: #f5f5f5;
  height: 88rpx;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
}
.dialog-content-text {
  font-size: 30rpx;
  color: #333;
  line-height: 1.6;
}
.dialog-footer {
  display: flex;
  border-top: 1rpx solid #f0f0f0;
}
.dialog-btn {
  flex: 1;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}
.dialog-btn.cancel { color: #666; border-right: 1rpx solid #f0f0f0; }
.dialog-btn.confirm { color: #007AFF; font-weight: 600; }
.dialog-btn.confirm.disabled { opacity: 0.5; }

/* Toast */
.custom-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.75);
  color: #fff;
  padding: 20rpx 40rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  z-index: 2000;
}
.custom-toast.error { background: rgba(0,0,0,0.8); }

/* Notification Banner */
.notification-banner {
  position: fixed;
  top: 20rpx;
  left: 20rpx;
  right: 20rpx;
  background: #fff;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.12);
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  z-index: 2000;
  animation: slideDown 0.3s ease-out;
}
@keyframes slideDown {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.notif-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 12rpx;
  margin-right: 20rpx;
}
.notif-content { flex: 1; overflow: hidden; }
.notif-name { font-size: 28rpx; font-weight: 600; color: #333; display: block; }
.notif-text { font-size: 24rpx; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
.notif-close { padding: 10rpx; color: #ccc; font-size: 36rpx; }

/* 平板/桌面支持 */
@media (min-width: 768px) {
  .chat-content-wrapper {
    flex-direction: row;
  }
  .chat-list-view {
    width: 360px;
    border-right: 1rpx solid #e0e0e0;
  }
  .chat-list-view.hidden {
    display: flex;
  }
  .chat-detail-view {
    position: relative;
    flex: 1;
    transform: none;
  }
  .back-btn { display: none; }
}
</style>