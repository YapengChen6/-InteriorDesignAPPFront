<template>
  <view class="chat-container">
    <!-- 顶部聊天对象信息 -->
    <view class="chat-header">
      <view class="header-left">
        <button class="back-btn" @click="goBack">
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

    <!-- 消息状态提示 -->
    <view v-if="toast.show" class="toast" :class="toast.type">
      <text class="toast-text">{{ toast.message }}</text>
    </view>
  </view>
</template>

<script>
import { mapState } from 'vuex'
import * as conversationApi from '@/api/conversation'
import * as messageApi from '@/api/message'

export default {
  name: 'ChatDetail',
  data() {
    return {
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
      toast: {
        show: false,
        message: '',
        type: 'success'
      },
      conversationId: 0,
      currentUserId: 0,
      otherUserId: 0,
      userRole: 1, // 1=普通用户, 2=设计师, 3=监理, 4=商家
      ws: null,
      wsConnected: false,
      pageNum: 1,
      pageSize: 20,
      loadingMessages: false
    }
  },
  computed: {
    isDesigner() {
      return this.userRole === 2
    },
    isSupervisor() {
      return this.userRole === 3
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },

    showUserInfo() {
      uni.showToast({
        title: `${this.chatUser.name} - ${this.chatUser.online ? '在线' : '离线'}`,
        icon: 'none'
      })
    },

    formatTime(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${hours}:${minutes}`
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
        // 本地回显，避免对方未回推时自己看不到
        this.messages.push({
          ...message,
          isSender: true,
          avatar: '/static/images/default-avatar.png',
          createTime: Date.now()
        })
        this.scrollTop = 999999
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

            // 后端返回的状态码是 200（HttpStatus.SUCCESS），不是 0
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
      } else {
        this.showToast('连接已断开，请重新连接', 'error')
      }
    },

    /**
     * 加载历史消息
     * 从后端 API 获取对话的历史消息
     */
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
      const wsUrl = `ws://192.168.101.153:8081/ws/chat?userId=${this.currentUserId}`
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
          if (data.action === 'send' || data.messageType) {
            this.messages.push({
              ...data,
              isSender: data.senderId === this.currentUserId,
              avatar: data.senderAvatar || '/static/images/default-avatar.png',
              createTime: data.createTime || data.sendTime || Date.now()
            })
            this.scrollTop = 999999

            // 如果是来自设计师或监理的消息，自动跳转到对应的聊天列表
            if (data.senderId !== this.currentUserId && (data.userRole === 2 || data.userRole === 3)) {
              console.log('📋 收到来自', data.userRole === 2 ? '设计师' : '监理', '的消息，准备跳转到聊天列表')
              setTimeout(() => {
                uni.navigateTo({
                  url: '/pages/chat/chatList'
                })
              }, 500)
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
    }
  },

  onLoad(options) {
    console.log('📱 聊天详情页面加载，参数:', options)

    // 1. 从路由参数获取信息
    this.conversationId = parseInt(options.conversationId) || 0
    this.otherUserId = parseInt(options.otherUserId) || 0
    this.chatUser.id = this.otherUserId
    this.chatUser.name = options.userName || '聊天对象'
    this.userRole = parseInt(options.userRole) || 1

    // 2. 从本地存储获取当前用户信息
    this.currentUserId = uni.getStorageSync('userId') || 1

    console.log('✅ 页面参数设置完成:')
    console.log('   - conversationId:', this.conversationId)
    console.log('   - otherUserId:', this.otherUserId)
    console.log('   - currentUserId:', this.currentUserId)
    console.log('   - userRole:', this.userRole)

    // 3. 加载历史消息
    this.loadHistoryMessages()

    // 4. 连接 WebSocket
    this.connectWebSocket()
  },

  onUnload() {
    if (this.ws) {
      this.ws.close()
    }
  }
}
</script>

<style scoped>
.chat-container {
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

.header-right {
  display: flex;
  gap: 16rpx;
}

.header-btn {
  background: none;
  border: none;
  font-size: 28rpx;
  padding: 0;
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
  /* 确保输入框可以接收输入 */
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

.loading-more {
  text-align: center;
  padding: 20rpx;
}

.loading-text {
  font-size: 24rpx;
  color: #999;
}
</style>

