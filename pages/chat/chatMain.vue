<template>
  <view class="chat-main-container">
    <!-- 顶部导航 -->
    <view class="chat-header">
      <text class="header-title">{{ showChatDetail ? '聊天详情' : '聊天' }}</text>
      <button class="header-btn" @click="startNewChat" v-if="!showChatDetail">
        <text class="btn-icon">+</text>
      </button>
      <button class="header-btn" @click="showChatDetail = false" v-else>
        <text class="btn-icon">←</text>
      </button>
    </view>

    <!-- 主内容区域 -->
    <view class="chat-content-wrapper">
      <!-- 聊天列表视图 -->
      <view class="chat-list-view" :class="{ 'hidden': showChatDetail }">
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
      </view>

      <!-- 聊天详情视图 -->
      <view class="chat-detail-view" :class="{ 'active': showChatDetail }">
        <!-- 聊天对象信息 -->
        <view class="chat-detail-header">
          <view class="header-left">
            <button class="back-btn" @click="showChatDetail = false">
              <text class="back-icon">←</text>
            </button>
            <view class="user-info">
              <text class="user-name">{{ chatUser.name }}</text>
              <text class="user-status">{{ chatUser.online ? '在线' : '离线' }}</text>
            </view>
          </view>
          <view class="header-right">
            <button class="header-btn" @click="showUserInfo">
              <text class="header-icon">ℹ️</text>
            </button>
          </view>
        </view>

        <!-- 消息列表区 -->
        <scroll-view 
          class="message-list" 
          scroll-y="true" 
          :scroll-top="scrollTop"
          @scrolltoupper="loadMoreMessages"
        >
          <!-- 加载更多提示 -->
          <view v-if="loadingMore" class="loading-more">
            <text class="loading-text">加载中...</text>
          </view>

          <!-- 消息项 -->
          <view 
            v-for="(message, index) in messages" 
            :key="index"
            :class="['message-item', message.isSender ? 'sender' : 'receiver']"
          >
            <!-- 接收方消息 -->
            <view v-if="!message.isSender" class="message-bubble-wrapper">
              <image class="avatar" :src="message.avatar" mode="aspectFill"></image>
              <view class="message-bubble receiver-bubble">
                <!-- 订单申请消息 -->
                <view v-if="message.messageType === 2" class="order-message">
                  <text class="order-title">{{ message.content }}</text>
                  <button 
                    v-if="message.actionType === 1 && !isDesigner" 
                    class="action-btn confirm-btn"
                    @click="confirmOrder(message)"
                  >
                    <text class="btn-text">{{ message.actionText || '确认订单' }}</text>
                  </button>
                </view>
                <!-- 普通消息 -->
                <view v-else>
                  <!-- 图片消息 -->
                  <image v-if="message.mediaType === 'image'" :src="message.content" class="media-image" mode="aspectFill" @click="previewImage(message.content)"></image>
                  <!-- 视频消息 -->
                  <video v-else-if="message.mediaType === 'video'" :src="message.content" class="media-video" controls></video>
                  <!-- 文本消息 -->
                  <text v-else class="message-text">{{ message.content }}</text>
                </view>
                <text class="message-time">{{ formatTime(message.createTime) }}</text>
              </view>
            </view>

            <!-- 发送方消息 -->
            <view v-else class="message-bubble-wrapper sender-wrapper">
              <view class="message-bubble sender-bubble">
                <!-- 订单申请消息 -->
                <view v-if="message.messageType === 2" class="order-message">
                  <text class="order-title">{{ message.content }}</text>
                </view>
                <!-- 普通消息 -->
                <view v-else>
                  <!-- 图片消息 -->
                  <image v-if="message.mediaType === 'image'" :src="message.content" class="media-image" mode="aspectFill" @click="previewImage(message.content)"></image>
                  <!-- 视频消息 -->
                  <video v-else-if="message.mediaType === 'video'" :src="message.content" class="media-video" controls></video>
                  <!-- 文本消息 -->
                  <text v-else class="message-text">{{ message.content }}</text>
                </view>
                <text class="message-time">{{ formatTime(message.createTime) }}</text>
              </view>
              <image class="avatar" :src="message.avatar" mode="aspectFill"></image>
            </view>
          </view>
        </scroll-view>

        <!-- 底部输入区 -->
        <view class="input-area">
          <!-- 功能按钮区 -->
          <view class="function-buttons">
            <button class="func-btn" @click="selectImage">
              <text class="func-icon">🖼️</text>
            </button>
            <button class="func-btn" @click="selectVideo">
              <text class="func-icon">🎥</text>
            </button>
            <!-- 设计师/监理可见的接取订单按钮 -->
            <button 
              v-if="isDesigner || isSupervisor" 
              class="func-btn order-btn"
              @click="sendOrderApplication"
            >
              <text class="func-icon">📋</text>
            </button>
          </view>

          <!-- 文本输入框 -->
          <view class="input-wrapper">
            <input
              v-model="inputText"
              class="input-field"
              type="text"
              placeholder="输入消息..."
              placeholder-style="color: #999;"
              @confirm="sendMessage"
              @input="onInputChange"
              @focus="onInputFocus"
              @blur="onInputBlur"
            />
            <button class="send-btn" @click="sendMessage">
              <text class="send-icon">发送</text>
            </button>
          </view>
        </view>
      </view>
    </view>

    <!-- 通过手机号添加新聊天弹窗 -->
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

    <!-- 订单确认弹窗 -->
    <uni-popup ref="orderPopup" type="center" background-color="#fff" :is-mask-click="false">
      <view class="popup-content" v-if="selectedOrderMessage">
        <view class="popup-header">
          <text class="popup-title">确认订单</text>
          <button class="close-btn" @click="closeOrderPopup">×</button>
        </view>
        <view class="popup-body">
          <text class="popup-text">{{ selectedOrderMessage.content }}</text>
        </view>
        <view class="popup-footer">
          <button class="popup-btn cancel-btn" @click="closeOrderPopup">取消</button>
          <button class="popup-btn confirm-btn" @click="confirmOrderAction">确认</button>
        </view>
      </view>
    </uni-popup>

    <!-- 消息提示 -->
    <view v-if="toast.show" class="toast" :class="toast.type">
      <text class="toast-text">{{ toast.message }}</text>
    </view>

    <!-- 消息栏弹出组件 -->
    <view v-if="messageNotification.show" class="message-notification" @click="handleNotificationClick">
      <image class="notification-avatar" :src="messageNotification.avatar" mode="aspectFill"></image>
      <view class="notification-content">
        <text class="notification-name">{{ messageNotification.name }}</text>
        <text class="notification-text">{{ messageNotification.content }}</text>
      </view>
      <view class="notification-close" @click.stop="closeNotification">✕</view>
    </view>
  </view>
</template>

<script>
import { mapState } from 'vuex'
import request from '@/utils/request'
import * as conversationApi from '@/api/conversation'
import * as messageApi from '@/api/message'
import { getRoleSwitchInfo, searchUserByPhone } from '@/api/users'

export default {
  name: 'ChatMain',
  data() {
    return {
      // 聊天列表相关
      searchText: '',
      activeTab: 'all',
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
      chatUser: {
        id: 0,
        name: '聊天对象',
        avatar: '',
        online: true
      },
      messages: [],
      inputText: '',
      scrollTop: 0,
      loadingMore: false,
      selectedOrderMessage: null,
      conversationId: 0,
      otherUserId: 0,
      userRole: 1,
      ws: null,
      wsConnected: false,
      pageNum: 1,
      pageSize: 20,
      loadingMessages: false,
      // 从外部跳转时待打开的会话信息
      pendingConversationId: 0,
      pendingOtherUserId: 0,
      
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
    },
    
    isDesigner() {
      return this.userRole === 2
    },
    
    isSupervisor() {
      return this.userRole === 3
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
    // 聊天列表相关方法
    updateCategoryCount() {
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
      // 字符串先按日期字符串解析
      if (typeof date === 'string') {
        date = this.parseDate(date)
      }
      // 数字（时间戳）或其它类型，统一尝试用 Date 包一层
      if (!(date instanceof Date)) {
        try {
          date = new Date(date)
        } catch (e) {
          return ''
        }
      }
      const now = new Date()
      const diff = now - date
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      
      if (days === 0) {
        const hours = String(date.getHours()).padStart(2, '0')
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
    
    parseDate(dateStr) {
      if (!dateStr) return new Date()
      try {
        return new Date(dateStr.replace(/-/g, '/'))
      } catch (e) {
        console.warn('日期解析失败:', dateStr)
        return new Date()
      }
    },
    
    openChat(chat) {
      console.log('📱 打开聊天详情:', chat)
      this.showChatDetail = true
      this.chatUser = {
        id: chat.otherUserId,
        name: chat.name,
        avatar: chat.avatar,
        online: chat.online
      }
      this.conversationId = chat.conversationId
      this.otherUserId = chat.otherUserId
      this.userRole = chat.userRole
      
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
        
        // 2. 发送聊天请求消息 - 关键改进点：确保对方收到"对方请求与您进行沟通"的提示
        const requestMessage = {
          action: 'send',
          messageType: 3, // 使用系统通知类型
          senderId: this.currentUserId,
          receiverId: targetUserId,
          conversationId: conversationId,
          content: '对方请求与您进行沟通',
          userRole: this.userRole,
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
    
    // 聊天详情相关方法
    showUserInfo() {
      uni.showToast({
        title: `${this.chatUser.name} - ${this.chatUser.online ? '在线' : '离线'}`,
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
    
    sendMessage() {
      if (!this.inputText.trim()) {
        this.showToast('消息不能为空', 'error')
        return
      }

      if (!this.conversationId) {
        this.showToast('对话ID无效', 'error')
        return
      }

      console.log('📤 发送消息:', this.inputText)

      const message = {
        action: 'send',
        messageType: 1,
        senderId: this.currentUserId,
        receiverId: this.otherUserId,
        conversationId: this.conversationId,
        content: this.inputText,
        userRole: this.userRole,
        sendTime: Date.now()
      }

      if (this.wsConnected && this.ws) {
        this.ws.send(JSON.stringify(message))
        this.showToast('消息已发送', 'success')
        // 本地回显
        this.messages.push({
          ...message,
          isSender: true,
          avatar: '/static/images/default-avatar.png',
          createTime: Date.now()
        })
        this.scrollTop = 999999
        
        // 更新聊天列表中的最后一条消息
        this.updateChatLastMessage(this.conversationId, this.inputText, new Date())
      } else {
        this.showToast('连接已断开，请重新连接', 'error')
      }

      this.inputText = ''
    },
    
    sendOrderApplication() {
      if (!this.isDesigner && !this.isSupervisor) {
        this.showToast('只有设计师和监理可以发送订单申请', 'error')
        return
      }

      const message = {
        action: 'send',
        messageType: 2,
        senderId: this.currentUserId,
        receiverId: this.chatUser.id,
        conversationId: this.conversationId,
        content: '我想接取这个订单，请确认',
        templateId: 1,
        actionType: 1,
        userRole: this.userRole,
        sendTime: Date.now()
      }

      if (this.wsConnected && this.ws) {
        this.ws.send(JSON.stringify(message))
        this.showToast('订单申请已发送', 'success')
        // 本地回显订单申请消息
        this.messages.push({
          ...message,
          isSender: true,
          avatar: '/static/images/default-avatar.png',
          createTime: Date.now()
        })
        this.scrollTop = 999999
        
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

      uni.uploadFile({
        url: 'http://192.168.101.153:8081/api/media/upload/file',
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
      const message = {
        action: 'send',
        messageType: 1,
        senderId: this.currentUserId,
        receiverId: this.otherUserId,
        conversationId: this.conversationId,
        content: fileUrl,
        mediaType: mediaType,
        userRole: this.userRole,
        sendTime: Date.now()
      }

      if (this.wsConnected && this.ws) {
        this.ws.send(JSON.stringify(message))
        this.showToast(`${mediaType === 'image' ? '图片' : '视频'}已发送`, 'success')
        // 本地回显媒体消息
        this.messages.push({
          ...message,
          isSender: true,
          avatar: '/static/images/default-avatar.png',
          createTime: Date.now()
        })
        this.scrollTop = 999999
        
        // 更新聊天列表中的最后一条消息
        this.updateChatLastMessage(this.conversationId, `${mediaType === 'image' ? '[图片]' : '[视频]'}`, new Date())
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
          this.messages = res.data.map(msg => ({
            ...msg,
            isSender: msg.senderId === this.currentUserId,
            avatar: msg.senderAvatar || '/static/images/default-avatar.png',
            createTime: this.parseDate(msg.createTime)
          }))

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
            // 如果当前正在聊天详情页面且是该对话的消息
            if (this.showChatDetail && data.conversationId === this.conversationId) {
              this.messages.push({
                ...data,
                isSender: data.senderId === this.currentUserId,
                avatar: data.senderAvatar || '/static/images/default-avatar.png',
                createTime: data.createTime || data.sendTime || Date.now()
              })
              this.scrollTop = 999999
            } else {
              // 如果不是当前聊天的消息，显示消息通知
              this.showNotification(data)
            }
            
            // 更新聊天列表中的最后一条消息
            this.updateChatLastMessage(data.conversationId, data.content, new Date())
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
    
    // 更新聊天列表中的最后一条消息
    updateChatLastMessage(conversationId, content, time) {
      const chatIndex = this.chats.findIndex(c => c.conversationId === conversationId)
      if (chatIndex >= 0) {
        this.chats[chatIndex].lastMessage = content
        this.chats[chatIndex].lastMessageTime = time
        
        // 如果不是当前用户发送的消息，增加未读数
        if (this.currentUserId !== this.otherUserId) {
          this.chats[chatIndex].unreadCount += 1
        }
        
        // 将更新的聊天项移到列表顶部
        const updatedChat = this.chats.splice(chatIndex, 1)[0]
        this.chats.unshift(updatedChat)
        
        // 更新分类计数
        this.updateCategoryCount()
      }
    }
  },
  
  onLoad(options) {
    // 解析从其他页面传入的会话参数（例如消息中心的“前往聊天”）
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
    this.currentUserId = uni.getStorageSync('userId') || 0

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
  },
  
  onUnload() {
    if (this.ws) {
      this.ws.close()
    }
  }
}
</script>

<style scoped>
.chat-main-container {
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
  z-index: 10;
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

.chat-content-wrapper {
  flex: 1;
  display: flex;
  position: relative;
}

/* 聊天列表视图 */
.chat-list-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.chat-list-view.hidden {
  display: none;
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

/* 聊天详情视图 */
.chat-detail-view {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  z-index: 5;
}

.chat-detail-view.active {
  transform: translateX(0);
}

.chat-detail-header {
  background: #fff;
  padding: 20rpx 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid #eee;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.back-btn {
  background: none;
  border: none;
  font-size: 32rpx;
  padding: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.user-status {
  font-size: 20rpx;
  color: #999;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20rpx;
}

.message-item {
  display: flex;
  margin-bottom: 20rpx;
  align-items: flex-end;
}

.message-item.sender {
  justify-content: flex-end;
}

.message-bubble-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 12rpx;
  max-width: 80%;
}

.sender-wrapper {
  justify-content: flex-end;
}

.avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
}

.message-bubble {
  padding: 16rpx 20rpx;
  border-radius: 16rpx;
  max-width: 100%;
  word-wrap: break-word;
}

.receiver-bubble {
  background: #fff;
  border: 1rpx solid #eee;
}

.sender-bubble {
  background: #007AFF;
  color: #fff;
}

.message-text {
  font-size: 28rpx;
  line-height: 1.4;
}

.media-image {
  max-width: 300rpx;
  max-height: 300rpx;
  border-radius: 8rpx;
  margin-bottom: 8rpx;
}

.media-video {
  max-width: 300rpx;
  max-height: 300rpx;
  border-radius: 8rpx;
  margin-bottom: 8rpx;
}

.message-time {
  font-size: 20rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}

.order-message {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.order-title {
  font-size: 28rpx;
  font-weight: 500;
}

.action-btn {
  background: #34C759;
  color: #fff;
  border: none;
  padding: 12rpx 20rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  align-self: flex-start;
}

.input-area {
  background: #fff;
  padding: 20rpx;
  border-top: 1rpx solid #eee;
}

.function-buttons {
  display: flex;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.func-btn {
  background: #f5f5f5;
  border: 1rpx solid #ddd;
  padding: 12rpx 16rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.order-btn {
  background: #FF9500;
  border: none;
  color: #fff;
}

.input-wrapper {
  display: flex;
  gap: 12rpx;
}

.input-field {
  flex: 1;
  background: #fff;
  border: 1rpx solid #ddd;
  padding: 16rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
  line-height: 1.5;
  min-height: 60rpx;
  box-sizing: border-box;
  pointer-events: auto;
  -webkit-appearance: none;
  appearance: none;
}

.send-btn {
  background: #007AFF;
  color: #fff;
  border: none;
  padding: 16rpx 24rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
}

/* 弹窗样式 */
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

.popup-content {
  background: #fff;
  border-radius: 16rpx;
  margin: 100rpx 40rpx;
  overflow: hidden;
}

.popup-header {
  padding: 30rpx;
  border-bottom: 1rpx solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.popup-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 40rpx;
  color: #999;
}

.popup-body {
  padding: 30rpx;
}

.popup-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

.popup-footer {
  padding: 30rpx;
  display: flex;
  gap: 16rpx;
}

.popup-btn {
  flex: 1;
  padding: 16rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
  border: none;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.confirm-btn {
  background: #007AFF;
  color: #fff;
}

.loading-more {
  text-align: center;
  padding: 20rpx;
}

.loading-text {
  font-size: 24rpx;
  color: #999;
}

/* 消息通知样式 */
.message-notification {
  position: fixed;
  bottom: 200rpx;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 16rpx;
  z-index: 999;
  min-width: 500rpx;
  max-width: 80%;
  animation: slide-up 0.3s ease;
}

@keyframes slide-up {
  from {
    transform: translateX(-50%) translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

.notification-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  display: block;
  margin-bottom: 4rpx;
}

.notification-text {
  font-size: 24rpx;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.notification-close {
  font-size: 28rpx;
  color: #999;
  padding: 8rpx;
  flex-shrink: 0;
}

/* 平板/桌面设备的双栏布局支持 */
@media (min-width: 768px) {
  .chat-content-wrapper {
    flex-direction: row;
  }
  
  .chat-list-view {
    width: 350rpx;
    border-right: 1rpx solid #eee;
  }
  
  .chat-list-view.hidden {
    display: flex;
  }
  
  .chat-detail-view {
    position: relative;
    flex: 1;
    transform: translateX(0);
  }
  
  .chat-detail-view.active {
    /* 双栏布局时不需要动画 */
  }
}
</style>