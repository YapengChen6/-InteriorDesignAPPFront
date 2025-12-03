<template>
  <view class="chat-detail-container">
    <!-- 顶部导航栏 -->
    <view class="header">
      <view class="header-content">
        <view class="back-button" @click="goBack">
          <text class="back-icon">←</text>
        </view>
        <view class="chat-info">
          <text class="chat-name">{{ chatUser.name }}</text>
          <text class="online-status" :class="{ online: chatUser.online }">{{ chatUser.online ? '在线' : '离线' }}</text>
        </view>
        <view class="header-actions">
          <!-- 占位 -->
        </view>
      </view>
    </view>

    <!-- 消息列表 -->
    <scroll-view 
      class="message-list" 
      scroll-y="true" 
      :scroll-top="scrollTop"
      :scroll-with-animation="true"
      @scrolltoupper="loadMoreHistory"
    >
      <!-- 加载更多提示 -->
      <view v-if="loadingHistory" class="loading-more">
        <text class="loading-text">加载中...</text>
      </view>
      
      <!-- 消息项 -->
      <view 
        v-for="(message, index) in messages" 
        :key="message.messageId || index"
        class="message-item"
        :class="{ 'item-sender': message.isSender, 'item-receiver': !message.isSender }"
      >
        <!-- 时间分隔线 -->
        <view v-if="shouldShowTime(index)" class="time-divider">
          <text class="time-text">{{ formatMessageTime(message.createTime) }}</text>
        </view>
        
        <!-- 消息内容行 -->
        <view class="message-content-row">
          
          <!-- ============== 接收方布局 (头像在左，气泡在右) ============== -->
          <template v-if="!message.isSender">
            <!-- 头像容器 -->
            <view class="avatar-box">
              <!-- #ifdef H5 -->
              <img 
                class="avatar" 
                :src="message.avatar"
                v-if="!shouldMergeMessages(index) || index === 0"
              />
              <!-- #endif -->
              <!-- #ifndef H5 -->
              <image 
                class="avatar" 
                :src="message.avatar" 
                mode="aspectFill"
                v-if="!shouldMergeMessages(index) || index === 0"
              ></image>
              <!-- #endif -->
            </view>

            <!-- 气泡容器 -->
            <view class="bubble-wrapper">
              <!-- 昵称 (可选) -->
              <!-- <text class="sender-name">{{ message.senderName }}</text> -->
              
              <view class="message-bubble bubble-receiver">
                <view v-if="message.messageType === 1 || message.messageType === 'text'" class="text-message">
                  <text class="message-text">{{ message.content }}</text>
                </view>
                
                <view v-else-if="message.messageType === 2 || message.messageType === 'image'" class="image-message">
                  <!-- 图片加载状态 -->
                  <view class="image-loading" v-if="message.imageLoading">
                    <text class="loading-text">加载中...</text>
                  </view>
                  
                  <!-- 图片加载失败 -->
                  <view class="image-error" v-if="message.imageError">
                    <text class="error-text">图片加载失败</text>
                    <view class="retry-btn" @click.stop="retryLoadImage(message)">重试</view>
                  </view>
                  
                  <!-- 正常图片显示 -->
                  <view v-if="!message.imageLoading && !message.imageError" class="image-container">
                    <!-- #ifdef H5 -->
                    <img 
                      class="message-image" 
                      :src="getThumbnailUrl(message.content)" 
                      @click="previewImage(message)" 
                      @longpress="showImageActions(message)"
                      @load="handleImageLoad(message)"
                      @error="handleImageError(message, $event)"
                    />
                    <!-- #endif -->
                    <!-- #ifndef H5 -->
                    <image 
                      class="message-image" 
                      :src="getThumbnailUrl(message.content)" 
                      mode="aspectFill" 
                      @click="previewImage(message)"
                      @longpress="showImageActions(message)"
                      @load="handleImageLoad(message)"
                      @error="handleImageError(message, $event)"
                    ></image>
                    <!-- #endif -->
                  </view>
                </view>
                
                <view v-else-if="message.messageType === 4 || message.messageType === 'file'" class="file-message">
                  <view class="file-container" @click="downloadFile(message)">
                    <view class="file-icon">
                      <text class="file-icon-text">{{ getFileIcon(message.fileName || message.content) }}</text>
                    </view>
                    <view class="file-info">
                      <text class="file-name">{{ getFileName(message.fileName || message.content) }}</text>
                      <text class="file-size">{{ formatFileSize(message.fileSize) }}</text>
                    </view>
                    <view class="file-action">
                      <text class="download-text">下载</text>
                    </view>
                  </view>
                </view>
                
                <view v-else class="other-message">
                  <text class="message-text">[不支持的消息类型]</text>
                </view>
              </view>
            </view>
          </template>

          <!-- ============== 发送方布局 (气泡在左，头像在右) ============== -->
          <template v-else>
            <!-- 状态 (发送中/失败) -->
            <view class="status-container">
               <text v-if="message.status === 'sending'" class="status-text">...</text>
               <text v-else-if="message.status === 'failed'" class="status-text failed" @click="resendMessage(message)">!</text>
            </view>

            <!-- 气泡容器 -->
            <view class="bubble-wrapper">
              <view class="message-bubble bubble-sender">
                 <view v-if="message.messageType === 1 || message.messageType === 'text'" class="text-message">
                  <text class="message-text">{{ message.content }}</text>
                </view>
                
                <view v-else-if="message.messageType === 2 || message.messageType === 'image'" class="image-message">
                  <!-- 图片加载状态 -->
                  <view class="image-loading" v-if="message.imageLoading">
                    <text class="loading-text">加载中...</text>
                  </view>
                  
                  <!-- 图片加载失败 -->
                  <view class="image-error" v-if="message.imageError">
                    <text class="error-text">图片加载失败</text>
                    <view class="retry-btn" @click.stop="retryLoadImage(message)">重试</view>
                  </view>
                  
                  <!-- 正常图片显示 -->
                  <view v-if="!message.imageLoading && !message.imageError" class="image-container">
                    <!-- #ifdef H5 -->
                    <img 
                      class="message-image" 
                      :src="getThumbnailUrl(message.content)" 
                      @click="previewImage(message)" 
                      @longpress="showImageActions(message)"
                      @load="handleImageLoad(message)"
                      @error="handleImageError(message, $event)"
                    />
                    <!-- #endif -->
                    <!-- #ifndef H5 -->
                    <image 
                      class="message-image" 
                      :src="getThumbnailUrl(message.content)" 
                      mode="aspectFill" 
                      @click="previewImage(message)"
                      @longpress="showImageActions(message)"
                      @load="handleImageLoad(message)"
                      @error="handleImageError(message, $event)"
                    ></image>
                    <!-- #endif -->
                  </view>
                </view>
                
                <view v-else-if="message.messageType === 4 || message.messageType === 'file'" class="file-message">
                  <view class="file-container" @click="downloadFile(message)">
                    <view class="file-icon">
                      <text class="file-icon-text">{{ getFileIcon(message.fileName || message.content) }}</text>
                    </view>
                    <view class="file-info">
                      <text class="file-name">{{ getFileName(message.fileName || message.content) }}</text>
                      <text class="file-size">{{ formatFileSize(message.fileSize) }}</text>
                    </view>
                    <view class="file-action">
                      <text class="download-text">下载</text>
                    </view>
                  </view>
                </view>
                
                <view v-else class="other-message">
                  <text class="message-text">[不支持的消息类型]</text>
                </view>
              </view>
            </view>

            <!-- 头像容器 -->
            <view class="avatar-box">
              <!-- #ifdef H5 -->
              <img 
                class="avatar" 
                :src="message.avatar"
                v-if="!shouldMergeMessages(index) || index === 0"
              />
              <!-- #endif -->
              <!-- #ifndef H5 -->
              <image 
                class="avatar" 
                :src="message.avatar" 
                mode="aspectFill"
                v-if="!shouldMergeMessages(index) || index === 0"
              ></image>
              <!-- #endif -->
            </view>
          </template>

        </view>
      </view>
      
      <!-- 底部垫高 -->
      <view style="height: 20rpx;"></view>
    </scroll-view>

    <!-- 输入框 -->
    <view class="input-container">
      <view class="input-box">
        <view class="input-actions">
          <text class="action-icon" @click="chooseImage">📷</text>
          <text class="action-icon" @click="chooseFile">📎</text>
        </view>
        <input 
          class="message-input" 
          v-model="inputText" 
          placeholder="输入消息..."
          @confirm="sendMessage"
          confirm-type="send"
          :adjust-position="false"
        />
        <view class="send-button" :class="{ active: inputText.trim() }" @click="sendMessage">
          <text class="send-text">发送</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { processAvatarUrl } from '@/utils/avatarUtils.js'
import { formatTime, getValidTimestamp } from '@/utils/timeUtils.js'
import * as messageApi from '@/api/message_new.js'
import { uploadFile } from '@/services/fileUploadService.js'

export default {
  name: 'ChatDetail',
  data() {
    return {
      chatUser: {
        id: 0,
        name: '未知用户',
        avatar: '/static/images/default-avatar.png',
        online: false
      },
      conversationId: 0,
      otherUserId: 0,
      messages: [],
      inputText: '',
      scrollTop: 0,
      loadingHistory: false,
      hasMoreHistory: true,
      currentUserId: 0,
      websocket: null,
      
      // 图片相关状态
      imageActionSheetVisible: false,
      currentImageMessage: null,
      
      // 在线状态检查
      onlineStatusTimer: null,
      onlineCheckInterval: 30000 // 30秒检查一次
    }
  },
  
  onLoad(options) {
    console.log('💬 聊天详情页面加载，参数:', options)
    
    if (options.conversationId) {
      this.conversationId = parseInt(options.conversationId)
    }
    if (options.otherUserId) {
      this.otherUserId = parseInt(options.otherUserId)
    }
    if (options.name) {
      this.chatUser.name = decodeURIComponent(options.name)
      console.log('✅ 设置聊天对象名称:', this.chatUser.name)
    }
    if (options.avatar) {
      this.chatUser.avatar = decodeURIComponent(options.avatar)
      console.log('✅ 设置聊天对象头像:', this.chatUser.avatar)
    }
    
    // 优先从userId获取，如果没有则从userInfo中获取
    let storedUserId = uni.getStorageSync('userId')
    if (!storedUserId) {
      const userInfo = uni.getStorageSync('userInfo')
      if (userInfo && userInfo.userId) {
        storedUserId = userInfo.userId.toString()
        // 同时存储到userId中，方便下次使用
        uni.setStorageSync('userId', storedUserId)
      }
    }
    this.currentUserId = storedUserId ? parseInt(storedUserId) : 0
    
    console.log('💬 聊天参数:', {
      conversationId: this.conversationId,
      otherUserId: this.otherUserId,
      currentUserId: this.currentUserId,
      storedUserId: storedUserId,
      chatUserName: this.chatUser.name
    })
    
    // 先标记对话为已读，再加载历史消息
    this.markConversationAsRead()
    this.loadHistoryMessages()
    
    // 检查对方在线状态
    this.checkUserOnlineStatus()
    
    // 启动定期检查在线状态
    this.startOnlineStatusCheck()
    
    // 确保页面加载完成后滚动到底部
    this.$nextTick(() => {
      setTimeout(() => {
        this.scrollToBottom()
      }, 300)
    })
  },
  
  onUnload() {
    if (this.websocket) this.websocket.close()
    // 清理在线状态检查定时器
    this.stopOnlineStatusCheck()
  },
  
  computed: {
    // 判断是否是开发环境
    isDevelopment() {
      return process.env.NODE_ENV === 'development'
    }
  },
  
  methods: {
    goBack() {
      console.log('🔙 点击返回按钮')
      
      // 通知聊天列表页面刷新未读数
      uni.$emit('refreshUnreadCount')
      
      // 获取当前页面栈
      const pages = getCurrentPages()
      console.log('📚 当前页面栈长度:', pages.length)
      
      // 如果页面栈只有1个页面，说明无法返回，跳转到聊天列表
      if (pages.length <= 1) {
        console.log('⚠️ 无法返回，跳转到聊天列表')
        uni.switchTab({
          url: '/pages/chat/chatList'
        })
      } else {
        // 正常返回
        uni.navigateBack({
          delta: 1
        })
      }
    },
    
    async loadHistoryMessages() {
      if (this.loadingHistory || !this.hasMoreHistory) return
      this.loadingHistory = true
      
      try {
        const res = await messageApi.getMessageList(this.conversationId, 1, 50)
        
        if (res.code === 200 && res.data) {
          let historyMessages = []
          if (Array.isArray(res.data)) historyMessages = res.data
          else if (res.data.rows && Array.isArray(res.data.rows)) historyMessages = res.data.rows
          else if (res.data.list && Array.isArray(res.data.list)) historyMessages = res.data.list
          
          console.log('📬 加载历史消息完成，共', historyMessages.length, '条')
          
          const processedMessages = historyMessages.map(msg => {
            // 确保数据类型一致性
            const senderId = parseInt(msg.senderId)
            const currentUserId = parseInt(this.currentUserId)
            const isSender = senderId === currentUserId
            const validSendTime = getValidTimestamp(msg)
            
            // 调试信息
            console.log('🔍 消息身份判断:', {
              messageId: msg.messageId,
              senderId: senderId,
              currentUserId: currentUserId,
              isSender: isSender,
              content: msg.content
            })
            
            let avatarUrl = '/static/images/default-avatar.png'
            if (isSender) {
              // 获取当前用户头像
              const currentUserAvatar = uni.getStorageSync('userAvatar')
              if (currentUserAvatar && currentUserAvatar.trim() !== '') {
                avatarUrl = processAvatarUrl(currentUserAvatar, '/static/images/default-avatar.png')
              } else {
                // 尝试从 userInfo 中获取
                const userInfo = uni.getStorageSync('userInfo')
                if (userInfo && userInfo.avatar && userInfo.avatar.trim() !== '') {
                  avatarUrl = processAvatarUrl(userInfo.avatar, '/static/images/default-avatar.png')
                }
              }
              console.log('👤 当前用户头像:', avatarUrl)
            } else {
              avatarUrl = this.chatUser && this.chatUser.avatar ? this.chatUser.avatar : '/static/images/default-avatar.png'
            }
            
            let messageType = msg.messageType
            if (typeof messageType === 'string') {
              if (messageType === 'text') messageType = 1
              else if (messageType === 'image') messageType = 2
              else if (messageType === 'file') messageType = 4
            }
            
            return {
              ...msg,
              isSender: isSender,
              avatar: avatarUrl,
              createTime: validSendTime,
              messageType: messageType,
              status: 'sent',
              // 图片相关状态 - 历史消息的图片应该直接显示，不需要加载状态
              imageLoading: false,
              imageError: false
            }
          })
          
          processedMessages.sort((a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime())
          this.messages = processedMessages
          this.scrollToBottom()
          
          // 为图片消息添加加载超时检查
          this.checkImageLoadingTimeout()
        }
      } catch (error) {
        console.error('❌ 加载历史消息失败:', error)
      } finally {
        this.loadingHistory = false
      }
    },
    
    // 标记对话中所有未读消息为已读
    async markConversationAsRead() {
      if (!this.conversationId) {
        console.warn('⚠️ 对话ID为空，无法标记已读')
        return
      }
      
      try {
        console.log('✅ 标记对话为已读:', this.conversationId)
        const res = await messageApi.markConversationAsRead(this.conversationId)
        if (res.code === 200) {
          console.log('✅ 对话已标记为已读')
          // 立即通知聊天列表页面刷新未读数
          uni.$emit('refreshUnreadCount')
        }
      } catch (error) {
        console.error('❌ 标记对话已读失败:', error)
      }
    },

    // 标记消息为已读（保留原方法，用于兼容）
    async markMessagesAsRead(messageIds) {
      try {
        console.log('✅ 标记消息为已读:', messageIds)
        const res = await messageApi.markMessagesAsReadBatch(messageIds, this.currentUserId)
        if (res.code === 200) {
          console.log('✅ 消息已标记为已读')
        }
      } catch (error) {
        console.error('❌ 标记消息已读失败:', error)
      }
    },
    
    async sendMessage() {
      const content = this.inputText.trim()
      if (!content) return
      
      // 获取当前用户头像
      let currentAvatar = '/static/images/default-avatar.png'
      const userAvatar = uni.getStorageSync('userAvatar')
      if (userAvatar && userAvatar.trim() !== '') {
        currentAvatar = processAvatarUrl(userAvatar, '/static/images/default-avatar.png')
      } else {
        const userInfo = uni.getStorageSync('userInfo')
        if (userInfo && userInfo.avatar && userInfo.avatar.trim() !== '') {
          currentAvatar = processAvatarUrl(userInfo.avatar, '/static/images/default-avatar.png')
        }
      }
      
      const tempMessage = {
        messageId: 'temp_' + Date.now(),
        content: content,
        messageType: 1,
        senderId: this.currentUserId,
        receiverId: this.otherUserId,
        conversationId: this.conversationId,
        createTime: new Date().toISOString(),
        isSender: true,
        avatar: currentAvatar,
        status: 'sending'
      }
      
      console.log('📤 发送消息:', {
        senderId: this.currentUserId,
        receiverId: this.otherUserId,
        isSender: true,
        content: content,
        receiverOnline: this.chatUser.online
      })
      
      this.messages.push(tempMessage)
      this.inputText = ''
      this.scrollToBottom()
      
      try {
        const res = await messageApi.sendMessage({
          receiverId: this.otherUserId,
          content: content,
          conversationId: this.conversationId,
          messageType: 1
        })
        
        if (res.code === 200) {
          const messageIndex = this.messages.findIndex(m => m.messageId === tempMessage.messageId)
          if (messageIndex !== -1) {
            this.messages[messageIndex].status = 'sent'
            this.messages[messageIndex].messageId = res.data.messageId || tempMessage.messageId
          }
          
          console.log('✅ 消息发送成功，已保存到数据库')
          
          // 如果对方离线，显示提示
          if (!this.chatUser.online) {
            uni.showToast({
              title: '消息已发送，对方上线后可查看',
              icon: 'none',
              duration: 2000
            })
          }
        } else {
          throw new Error(res.msg || '发送失败')
        }
      } catch (error) {
        console.error('❌ 消息发送失败:', error)
        const messageIndex = this.messages.findIndex(m => m.messageId === tempMessage.messageId)
        if (messageIndex !== -1) {
          this.messages[messageIndex].status = 'failed'
        }
        
        uni.showToast({
          title: error.message || '消息发送失败',
          icon: 'none',
          duration: 2000
        })
      }
    },
    
    async resendMessage(message) {
      message.status = 'sending'
      try {
        const res = await messageApi.sendMessage({
          receiverId: this.otherUserId,
          content: message.content,
          conversationId: this.conversationId,
          messageType: 1
        })
        if (res.code === 200) {
          message.status = 'sent'
          message.messageId = res.data.messageId || message.messageId
        } else {
          throw new Error(res.msg || '重发失败')
        }
      } catch (error) {
        message.status = 'failed'
      }
    },
    
    chooseImage() {
      const actions = ['拍照', '从相册选择', '取消']
      
      uni.showActionSheet({
        itemList: actions,
        success: (res) => {
          let sourceType = []
          
          switch (res.tapIndex) {
            case 0: // 拍照
              sourceType = ['camera']
              break
            case 1: // 从相册选择
              sourceType = ['album']
              break
            default: // 取消
              return
          }
          
          uni.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: sourceType,
            success: (res) => {
              const tempFilePath = res.tempFilePaths[0]
              
              // 显示确认对话框
              if (!this.chatUser.online) {
                uni.showModal({
                  title: '发送图片',
                  content: '对方当前离线，图片将在对方上线后可见，是否继续发送？',
                  confirmText: '发送',
                  cancelText: '取消',
                  success: (modalRes) => {
                    if (modalRes.confirm) {
                      this.sendImageMessage(tempFilePath)
                    }
                  }
                })
              } else {
                this.sendImageMessage(tempFilePath)
              }
            },
            fail: (error) => {
              console.error('❌ 选择图片失败:', error)
              if (error.errMsg && error.errMsg.includes('cancel')) {
                return // 用户取消，不显示错误
              }
              
              uni.showToast({
                title: '选择图片失败',
                icon: 'none',
                duration: 2000
              })
            }
          })
        },
        fail: (error) => {
          console.log('操作菜单取消:', error)
        }
      })
    },
    
    // 选择文件
    chooseFile() {
      // 注意：uni-app的chooseFile API在不同平台有不同的支持情况
      // 这里提供一个基础实现，实际使用时可能需要根据平台调整
      
      // #ifdef H5
      // H5平台使用input file
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.doc,.docx,.pdf,.txt,.zip,.rar,.7z'
      input.onchange = (e) => {
        const file = e.target.files[0]
        if (file) {
          this.sendFileMessage(file)
        }
      }
      input.click()
      // #endif
      
      // #ifndef H5
      // 小程序平台使用chooseMessageFile
      uni.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['doc', 'docx', 'pdf', 'txt', 'zip', 'rar', '7z'],
        success: (res) => {
          const file = res.tempFiles[0]
          if (file) {
            this.sendFileMessage(file)
          }
        },
        fail: (error) => {
          console.error('❌ 选择文件失败:', error)
          if (error.errMsg && !error.errMsg.includes('cancel')) {
            uni.showToast({
              title: '选择文件失败',
              icon: 'none',
              duration: 2000
            })
          }
        }
      })
      // #endif
    },
    
    async sendImageMessage(filePath) {
      // 获取当前用户头像
      let currentAvatar = '/static/images/default-avatar.png'
      const userAvatar = uni.getStorageSync('userAvatar')
      if (userAvatar && userAvatar.trim() !== '') {
        currentAvatar = processAvatarUrl(userAvatar, '/static/images/default-avatar.png')
      } else {
        const userInfo = uni.getStorageSync('userInfo')
        if (userInfo && userInfo.avatar && userInfo.avatar.trim() !== '') {
          currentAvatar = processAvatarUrl(userInfo.avatar, '/static/images/default-avatar.png')
        }
      }
      
      const tempMessage = {
        messageId: 'temp_img_' + Date.now(),
        content: filePath,
        messageType: 2,
        senderId: this.currentUserId,
        receiverId: this.otherUserId,
        conversationId: this.conversationId,
        createTime: new Date().toISOString(),
        isSender: true,
        avatar: currentAvatar,
        status: 'sending',
        imageLoading: true,
        imageError: false
      }
      
      this.messages.push(tempMessage)
      this.scrollToBottom()
      
      try {
        console.log('📸 开始上传图片，对方在线状态:', this.chatUser.online)
        
        // 显示上传进度提示
        uni.showLoading({
          title: '发送中...',
          mask: true
        })
        
        console.log('🔍 开始上传文件:', filePath)
        const uploadRes = await uploadFile(filePath)
        console.log('🔍 上传响应:', uploadRes)
        
        if (uploadRes.code === 200) {
          const imageUrl = uploadRes.data.url || uploadRes.data.fileUrl
          console.log('✅ 图片上传成功:', imageUrl)
          console.log('🔍 上传响应数据:', uploadRes.data)
          
          // 发送图片消息，无论对方是否在线都会保存到数据库
          const res = await messageApi.sendMessage({
            receiverId: this.otherUserId,
            content: imageUrl,
            messageType: 2,
            conversationId: this.conversationId
          })
          
          uni.hideLoading()
          
          if (res.code === 200) {
            const messageIndex = this.messages.findIndex(m => m.messageId === tempMessage.messageId)
            if (messageIndex !== -1) {
              this.messages[messageIndex].content = imageUrl
              this.messages[messageIndex].status = 'sent'
              this.messages[messageIndex].messageId = res.data.messageId || tempMessage.messageId
              this.messages[messageIndex].imageLoading = false
              this.messages[messageIndex].imageError = false
            }
            
            console.log('✅ 图片消息发送成功，已保存到数据库')
            
            // 显示发送成功提示
            if (!this.chatUser.online) {
              uni.showToast({
                title: '图片已发送，对方上线后可查看',
                icon: 'success',
                duration: 2000
              })
            } else {
              uni.showToast({
                title: '图片发送成功',
                icon: 'success',
                duration: 1500
              })
            }
          } else {
            throw new Error(res.msg || '发送失败')
          }
        } else {
          throw new Error(uploadRes.msg || '上传失败')
        }
      } catch (error) {
        console.error('❌ 图片发送失败:', error)
        uni.hideLoading()
        
        const messageIndex = this.messages.findIndex(m => m.messageId === tempMessage.messageId)
        if (messageIndex !== -1) {
          this.messages[messageIndex].status = 'failed'
          this.messages[messageIndex].imageLoading = false
          this.messages[messageIndex].imageError = true
        }
        
        // 显示错误提示
        uni.showToast({
          title: error.message || '图片发送失败',
          icon: 'none',
          duration: 2000
        })
      }
    },
    
    // 发送文件消息
    async sendFileMessage(file) {
      // 获取当前用户头像
      let currentAvatar = '/static/images/default-avatar.png'
      const userAvatar = uni.getStorageSync('userAvatar')
      if (userAvatar && userAvatar.trim() !== '') {
        currentAvatar = processAvatarUrl(userAvatar, '/static/images/default-avatar.png')
      } else {
        const userInfo = uni.getStorageSync('userInfo')
        if (userInfo && userInfo.avatar && userInfo.avatar.trim() !== '') {
          currentAvatar = processAvatarUrl(userInfo.avatar, '/static/images/default-avatar.png')
        }
      }
      
      const tempMessage = {
        messageId: 'temp_file_' + Date.now(),
        content: file.path || file.tempFilePath || file.name,
        messageType: 4,
        senderId: this.currentUserId,
        receiverId: this.otherUserId,
        conversationId: this.conversationId,
        createTime: new Date().toISOString(),
        isSender: true,
        avatar: currentAvatar,
        status: 'sending',
        fileName: file.name,
        fileSize: file.size
      }
      
      this.messages.push(tempMessage)
      this.scrollToBottom()
      
      try {
        console.log('📎 开始上传文件，对方在线状态:', this.chatUser.online)
        
        // 显示上传进度提示
        uni.showLoading({
          title: '发送中...',
          mask: true
        })
        
        console.log('🔍 开始上传文件:', file.name)
        const uploadRes = await uploadFile(file.path || file.tempFilePath, {
          conversationId: this.conversationId,
          description: `聊天文件-${file.name}`,
          fileName: file.name  // 传递原始文件名，确保后端能获取正确的扩展名
        })
        console.log('🔍 上传响应:', uploadRes)
        
        if (uploadRes.code === 200) {
          const fileUrl = uploadRes.data.url || uploadRes.data.fileUrl
          console.log('✅ 文件上传成功:', fileUrl)
          
          // 发送文件消息
          const res = await messageApi.sendMessage({
            receiverId: this.otherUserId,
            content: fileUrl,
            messageType: 4,
            conversationId: this.conversationId,
            // 文件相关字段
            mediaUrl: fileUrl,
            mediaSize: file.size,
            fileName: file.name,
            fileType: this.getFileTypeFromExtension(file.name),
            fileExtension: this.getFileExtensionFromName(file.name)
          })
          
          uni.hideLoading()
          
          if (res.code === 200) {
            const messageIndex = this.messages.findIndex(m => m.messageId === tempMessage.messageId)
            if (messageIndex !== -1) {
              this.messages[messageIndex].content = fileUrl
              this.messages[messageIndex].status = 'sent'
              this.messages[messageIndex].messageId = res.data.messageId || tempMessage.messageId
            }
            
            console.log('✅ 文件消息发送成功，已保存到数据库')
            
            // 显示发送成功提示
            if (!this.chatUser.online) {
              uni.showToast({
                title: '文件已发送，对方上线后可查看',
                icon: 'success',
                duration: 2000
              })
            } else {
              uni.showToast({
                title: '文件发送成功',
                icon: 'success',
                duration: 1500
              })
            }
          } else {
            throw new Error(res.msg || '发送失败')
          }
        } else {
          throw new Error(uploadRes.msg || '上传失败')
        }
      } catch (error) {
        console.error('❌ 文件发送失败:', error)
        uni.hideLoading()
        
        const messageIndex = this.messages.findIndex(m => m.messageId === tempMessage.messageId)
        if (messageIndex !== -1) {
          this.messages[messageIndex].status = 'failed'
        }
        
        // 显示错误提示
        uni.showToast({
          title: error.message || '文件发送失败',
          icon: 'none',
          duration: 2000
        })
      }
    },

    // 增强的图片预览功能 - 支持多图预览
    previewImage(message) {
      if (!message || message.messageType !== 2) {
        return
      }
      
      // 收集当前对话中的所有图片消息
      const imageMessages = this.messages.filter(msg => 
        msg.messageType === 2 && msg.content && !msg.imageError
      )
      
      if (imageMessages.length === 0) {
        return
      }
      
      // 构建图片URL数组
      const imageUrls = imageMessages.map(msg => msg.content)
      const currentIndex = imageMessages.findIndex(msg => msg.messageId === message.messageId)
      const currentUrl = currentIndex >= 0 ? imageUrls[currentIndex] : message.content
      
      console.log('📸 预览图片:', {
        total: imageUrls.length,
        current: currentUrl,
        urls: imageUrls
      })
      
      uni.previewImage({
        urls: imageUrls,
        current: currentUrl,
        indicator: 'number',
        loop: true,
        success: () => {
          console.log('图片预览成功')
        },
        fail: (error) => {
          console.error('图片预览失败:', error)
          uni.showToast({
            title: '预览失败',
            icon: 'none'
          })
        }
      })
    },
    
    // 获取缩略图URL
    getThumbnailUrl(originalUrl) {
      if (!originalUrl) {
        console.warn('⚠️ 图片URL为空')
        return '/static/images/image-placeholder.svg' // 返回占位图
      }
      
      console.log('🖼️ 处理图片URL:', originalUrl)
      
      // 验证URL是否有效
      if (!this.isValidImageUrl(originalUrl)) {
        console.warn('⚠️ 无效的图片URL:', originalUrl)
        return '/static/images/image-placeholder.svg'
      }
      
      // 如果是OSS图片，直接使用原URL（不使用代理）
      if (originalUrl.includes('cypphoto.oss-cn-chengdu.aliyuncs.com')) {
        console.log('🔗 直接使用OSS URL:', originalUrl)
        return originalUrl
      }
      
      // 检查是否是有效的HTTP/HTTPS URL
      if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
        console.log('🌐 使用原始URL:', originalUrl)
        return originalUrl
      }
      
      // 如果是相对路径，尝试构建完整URL
      if (originalUrl.startsWith('/')) {
        const baseUrl = this.getBaseUrl()
        const fullUrl = baseUrl + originalUrl
        console.log('🔗 构建完整URL:', fullUrl)
        return fullUrl
      }
      
      // 其他情况直接返回原URL
      console.log('📎 直接使用URL:', originalUrl)
      return originalUrl
    },
    
    // 获取基础URL
    getBaseUrl() {
      // 从配置或当前页面获取基础URL
      try {
        const config = require('@/config.js')
        return config.baseUrl || config.BASE_URL || 'http://localhost:8081'
      } catch (e) {
        console.warn('⚠️ 无法获取配置中的baseUrl，使用默认值')
        return 'http://localhost:8081'
      }
    },
    
    // 验证图片URL是否有效
    isValidImageUrl(url) {
      if (!url || typeof url !== 'string') {
        return false
      }
      
      // 检查是否是有效的URL格式
      const urlPattern = /^(https?:\/\/|\/)/
      if (!urlPattern.test(url)) {
        return false
      }
      
      // 检查是否是图片文件扩展名
      const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i
      if (!imageExtensions.test(url)) {
        // 如果没有明确的图片扩展名，但包含图片相关的路径，也认为是有效的
        const imageKeywords = /(image|img|photo|pic)/i
        return imageKeywords.test(url)
      }
      
      return true
    },
    
    // 图片长按操作菜单
    showImageActions(message) {
      const actions = ['保存图片', '转发图片', '取消']
      
      uni.showActionSheet({
        itemList: actions,
        success: (res) => {
          switch (res.tapIndex) {
            case 0:
              this.saveImage(message)
              break
            case 1:
              this.forwardImage(message)
              break
            default:
              break
          }
        },
        fail: (error) => {
          console.log('操作菜单取消:', error)
        }
      })
    },
    
    // 保存图片到相册
    async saveImage(message) {
      try {
        console.log('💾 保存图片:', message.content)
        
        // 显示加载提示
        uni.showLoading({
          title: '保存中...',
          mask: true
        })
        
        // 下载并保存图片
        const result = await new Promise((resolve, reject) => {
          uni.downloadFile({
            url: message.content,
            success: (downloadResult) => {
              if (downloadResult.statusCode === 200) {
                // 保存到相册
                uni.saveImageToPhotosAlbum({
                  filePath: downloadResult.tempFilePath,
                  success: () => {
                    resolve('保存成功')
                  },
                  fail: (saveError) => {
                    console.error('保存到相册失败:', saveError)
                    if (saveError.errMsg.includes('auth')) {
                      reject('请授权访问相册')
                    } else {
                      reject('保存失败')
                    }
                  }
                })
              } else {
                reject('下载失败')
              }
            },
            fail: (downloadError) => {
              console.error('下载图片失败:', downloadError)
              reject('下载失败')
            }
          })
        })
        
        uni.hideLoading()
        uni.showToast({
          title: result,
          icon: 'success'
        })
        
      } catch (error) {
        uni.hideLoading()
        console.error('保存图片失败:', error)
        
        if (error === '请授权访问相册') {
          uni.showModal({
            title: '需要相册权限',
            content: '保存图片需要访问您的相册，请在设置中开启权限',
            confirmText: '去设置',
            success: (modalRes) => {
              if (modalRes.confirm) {
                uni.openSetting()
              }
            }
          })
        } else {
          uni.showToast({
            title: error || '保存失败',
            icon: 'none'
          })
        }
      }
    },
    
    // 转发图片
    forwardImage(message) {
      console.log('📤 转发图片:', message.content)
      
      // 这里可以实现转发逻辑，比如跳转到选择联系人页面
      uni.showModal({
        title: '转发图片',
        content: '是否要转发这张图片？',
        success: (res) => {
          if (res.confirm) {
            // 实现转发逻辑
            // 可以跳转到联系人选择页面或者其他转发界面
            uni.showToast({
              title: '转发功能开发中',
              icon: 'none'
            })
          }
        }
      })
    },
    
    // 图片加载成功处理
    handleImageLoad(message) {
      console.log('✅ 图片加载成功')
      this.$set(message, 'imageError', false)
      this.$set(message, 'imageLoading', false)
    },
    
    // 图片加载失败处理
    handleImageError(message, event) {
      console.error('❌ 图片加载失败:', {
        messageId: message.messageId,
        originalUrl: message.content,
        thumbnailUrl: this.getThumbnailUrl(message.content),
        event: event,
        errorDetail: event ? event.detail : null
      })
      
      this.$set(message, 'imageError', true)
      this.$set(message, 'imageLoading', false)
      
      // 尝试使用原始URL作为备用方案
      if (message.content && message.content.includes('cypphoto.oss-cn-chengdu.aliyuncs.com')) {
        console.log('🔄 尝试使用原始OSS URL作为备用方案')
        this.$set(message, 'fallbackUrl', message.content)
      }
    },
    
    // 重试加载图片
    retryLoadImage(message) {
      console.log('🔄 重试加载图片:', {
        messageId: message.messageId,
        originalUrl: message.content,
        hasFallbackUrl: !!message.fallbackUrl
      })
      
      // 重置状态
      this.$set(message, 'imageError', false)
      this.$set(message, 'imageLoading', true)
      
      // 如果有备用URL，尝试使用备用URL
      if (message.fallbackUrl) {
        console.log('🔄 使用备用URL重试')
        // 临时交换URL进行重试
        const originalContent = message.content
        this.$set(message, 'content', message.fallbackUrl)
        this.$set(message, 'fallbackUrl', originalContent)
      }
      
      // 强制重新渲染
      this.$forceUpdate()
      
      // 添加重试计数
      if (!message.retryCount) {
        this.$set(message, 'retryCount', 0)
      }
      this.$set(message, 'retryCount', message.retryCount + 1)
      
      // 如果重试次数过多，显示提示
      if (message.retryCount > 3) {
        uni.showToast({
          title: '图片加载失败，请检查网络连接',
          icon: 'none',
          duration: 2000
        })
      }
    },
    
    // 检查图片加载超时
    checkImageLoadingTimeout() {
      // 5秒后检查是否还有图片在加载状态
      setTimeout(() => {
        this.messages.forEach(message => {
          if (message.messageType === 2 && message.imageLoading) {
            console.warn('⚠️ 图片加载超时，自动设置为加载完成:', message.messageId)
            this.$set(message, 'imageLoading', false)
            // 不设置为错误状态，让图片自然显示
          }
        })
      }, 5000)
    },
    
    scrollToBottom() {
      this.$nextTick(() => {
        // 先增加一个小的值触发滚动
        this.scrollTop = this.scrollTop + 1
        setTimeout(() => {
          // 设置一个足够大的值确保滚动到底部
          this.scrollTop = 999999
        }, 50)
        // 额外的延迟确保在固定导航栏情况下正确滚动
        setTimeout(() => {
          this.scrollTop = 999999 + Math.random()
        }, 100)
      })
    },
    
    loadMoreHistory() {
      if (!this.hasMoreHistory || this.loadingHistory) return
    },
    
    shouldShowTime(index) {
      if (index === 0) return true
      const currentMsg = this.messages[index]
      const prevMsg = this.messages[index - 1]
      if (!currentMsg || !prevMsg) return false
      return (new Date(currentMsg.createTime).getTime() - new Date(prevMsg.createTime).getTime()) > 5 * 60 * 1000
    },
    
    shouldMergeMessages(index) {
      if (index === 0) return false
      const currentMsg = this.messages[index]
      const prevMsg = this.messages[index - 1]
      if (!currentMsg || !prevMsg) return false
      return currentMsg.senderId === prevMsg.senderId && 
             (new Date(currentMsg.createTime).getTime() - new Date(prevMsg.createTime).getTime()) < 2 * 60 * 1000
    },
    
    formatMessageTime(time) {
      return formatTime(time)
    },
    
    // 调试图片URL（开发环境使用）
    debugImageUrl(message) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 图片调试信息:', {
          messageId: message.messageId,
          originalContent: message.content,
          thumbnailUrl: this.getThumbnailUrl(message.content),
          isValidUrl: this.isValidImageUrl(message.content),
          imageLoading: message.imageLoading,
          imageError: message.imageError,
          retryCount: message.retryCount || 0
        })
        
        // 显示调试信息给用户
        uni.showModal({
          title: '图片调试信息',
          content: `原始URL: ${message.content}\n缩略图URL: ${this.getThumbnailUrl(message.content)}\n是否有效: ${this.isValidImageUrl(message.content)}`,
          showCancel: false
        })
      }
    },
    
    // 检查用户在线状态
    async checkUserOnlineStatus() {
      if (!this.otherUserId) return
      
      try {
        const res = await messageApi.getUserOnlineStatus(this.otherUserId)
        if (res.code === 200 && res.data) {
          const wasOnline = this.chatUser.online
          this.chatUser.online = res.data.online
          
          // 如果状态发生变化，记录日志
          if (wasOnline !== this.chatUser.online) {
            console.log(`👤 用户 ${this.otherUserId} 在线状态变更: ${wasOnline} -> ${this.chatUser.online}`)
          }
        }
      } catch (error) {
        console.error('❌ 检查用户在线状态失败:', error)
      }
    },
    
    // 启动在线状态检查
    startOnlineStatusCheck() {
      if (this.onlineStatusTimer) {
        clearInterval(this.onlineStatusTimer)
      }
      
      this.onlineStatusTimer = setInterval(() => {
        this.checkUserOnlineStatus()
      }, this.onlineCheckInterval)
      
      console.log('🔄 已启动在线状态检查，间隔:', this.onlineCheckInterval + 'ms')
    },
    
    // 获取文件图标
    getFileIcon(fileName) {
      if (!fileName) return '📄'
      
      const extension = fileName.toLowerCase().split('.').pop()
      const iconMap = {
        // 文档类
        'doc': '📝',
        'docx': '📝',
        'pdf': '📕',
        'txt': '📄',
        'rtf': '📄',
        // 表格类
        'xls': '📊',
        'xlsx': '📊',
        // 演示文稿
        'ppt': '📊',
        'pptx': '📊',
        // 压缩包
        'zip': '🗜️',
        'rar': '🗜️',
        '7z': '🗜️',
        'tar': '🗜️',
        'gz': '🗜️'
      }
      
      return iconMap[extension] || '📎'
    },
    
    // 获取文件名
    getFileName(filePath) {
      if (!filePath) return '未知文件'
      
      // 如果是URL，提取文件名
      if (filePath.startsWith('http')) {
        const urlParts = filePath.split('/')
        return urlParts[urlParts.length - 1] || '下载文件'
      }
      
      // 如果是本地路径，提取文件名
      const pathParts = filePath.split('/')
      return pathParts[pathParts.length - 1] || '未知文件'
    },
    
    // 格式化文件大小
    formatFileSize(size) {
      if (!size || size === 0) return '未知大小'
      
      const units = ['B', 'KB', 'MB', 'GB']
      let unitIndex = 0
      let fileSize = size
      
      while (fileSize >= 1024 && unitIndex < units.length - 1) {
        fileSize /= 1024
        unitIndex++
      }
      
      return `${fileSize.toFixed(1)} ${units[unitIndex]}`
    },
    
    // 下载文件
    downloadFile(message) {
      if (!message.content) {
        uni.showToast({
          title: '文件链接无效',
          icon: 'none'
        })
        return
      }
      
      console.log('📥 下载文件:', message.content)
      
      // 显示下载确认
      uni.showModal({
        title: '下载文件',
        content: `是否要下载文件 "${this.getFileName(message.content)}"？`,
        success: (res) => {
          if (res.confirm) {
            // 使用uni.downloadFile下载文件
            uni.showLoading({
              title: '下载中...',
              mask: true
            })
            
            uni.downloadFile({
              url: message.content,
              success: (downloadRes) => {
                uni.hideLoading()
                if (downloadRes.statusCode === 200) {
                  uni.showToast({
                    title: '下载成功',
                    icon: 'success'
                  })
                  
                  // 在H5平台可以尝试打开文件
                  // #ifdef H5
                  window.open(message.content, '_blank')
                  // #endif
                } else {
                  uni.showToast({
                    title: '下载失败',
                    icon: 'none'
                  })
                }
              },
              fail: (error) => {
                uni.hideLoading()
                console.error('❌ 下载文件失败:', error)
                uni.showToast({
                  title: '下载失败',
                  icon: 'none'
                })
              }
            })
          }
        }
      })
    },
    
    // 从文件名获取文件类型
    getFileTypeFromExtension(fileName) {
      if (!fileName) return 'unknown'
      
      const extension = fileName.toLowerCase().split('.').pop()
      
      // 文档类型
      if (['doc', 'docx', 'pdf', 'txt', 'rtf', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) {
        return 'document'
      }
      
      // 压缩包类型
      if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
        return 'archive'
      }
      
      return 'unknown'
    },
    
    // 从文件名获取扩展名
    getFileExtensionFromName(fileName) {
      if (!fileName) return ''
      
      const parts = fileName.toLowerCase().split('.')
      return parts.length > 1 ? parts.pop() : ''
    },
    
    // 停止在线状态检查
    stopOnlineStatusCheck() {
      if (this.onlineStatusTimer) {
        clearInterval(this.onlineStatusTimer)
        this.onlineStatusTimer = null
        console.log('⏹️ 已停止在线状态检查')
      }
    }
  }
}
</script>

<style scoped>
/* 基础容器 */
.chat-detail-container {
  height: 100vh;
  background-color: #f2f3f5;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  position: relative;
}

/* 顶部导航 - 固定定位 */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 20rpx 30rpx;
  padding-top: var(--status-bar-height);
  flex-shrink: 0;
  z-index: 1000;
  border-bottom: 1rpx solid #e0e0e0;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-button {
  margin-right: 20rpx;
  padding: 10rpx 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80rpx;
  min-height: 60rpx;
  flex-shrink: 0;
  /* 增加点击区域 */
  position: relative;
}

.back-button::before {
  content: '';
  position: absolute;
  top: -10rpx;
  left: -10rpx;
  right: -10rpx;
  bottom: -10rpx;
}

.back-button:active {
  opacity: 0.6;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 10rpx;
}

.back-icon {
  font-size: 40rpx;
  color: #007aff;
  font-weight: bold;
}

.chat-info {
  flex: 1;
  min-width: 0;
}

.chat-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.online-status {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
  display: block;
}

.online-status.online {
  color: #4cd964;
}

.header-actions {
  margin-left: 20rpx;
  flex-shrink: 0;
  min-width: 60rpx;
}

/* 移除重复的样式定义 */

/* 消息列表 - 适配固定导航栏 */
.message-list {
  flex: 1;
  background-color: #f2f3f5;
  /* 为固定的顶部和底部导航栏留出空间 */
  margin-top: calc(120rpx + var(--status-bar-height, 44rpx));
  margin-bottom: 140rpx;
  /* 确保滚动区域正确 */
  position: relative;
  overflow-y: auto;
}

.loading-more {
  text-align: center;
  padding: 20rpx;
}

.loading-text {
  font-size: 24rpx;
  color: #999;
}

/* 消息项容器 */
.message-item {
  width: 100%;
  padding: 16rpx 24rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.item-receiver {
  align-items: flex-start;
}

.item-sender {
  align-items: flex-end;
}

/* 时间 */
.time-divider {
  align-self: center;
  margin-bottom: 20rpx;
}

.time-text {
  font-size: 22rpx;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
}

/* 核心 Flex 布局 */
.message-content-row {
  display: flex;
  align-items: flex-start;
  max-width: 100%;
}

/* 头像样式 (还原图片2: 方形带小圆角) */
.avatar-box {
  flex-shrink: 0;
  width: 84rpx;
  height: 84rpx;
}

.avatar {
  width: 84rpx;
  height: 84rpx;
  border-radius: 10rpx; /* 较小的圆角 */
  background-color: #ddd;
  display: block;
}

/* 气泡包裹层 */
.bubble-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 480rpx;
}

.item-receiver .bubble-wrapper {
  margin-left: 20rpx; /* 头像和气泡的距离 */
}

.item-sender .bubble-wrapper {
  margin-right: 20rpx; /* 头像和气泡的距离 */
  align-items: flex-end;
}

/* 通用气泡样式 */
.message-bubble {
  padding: 18rpx 24rpx;
  border-radius: 12rpx; /* 整体圆角 */
  position: relative;
  font-size: 30rpx;
  line-height: 1.5;
  min-height: 40rpx;
  word-break: break-all;
}

/* ========================================
   关键修改：气泡颜色与三角形箭头 (Arrow)
   ======================================== */

/* 接收方 (白色气泡，箭头向左) */
.bubble-receiver {
  background-color: #ffffff;
  color: #333;
  border: 1rpx solid #ededed; /* 微弱边框 */
}

/* 接收方三角形 */
.bubble-receiver::before {
  content: '';
  position: absolute;
  top: 24rpx; /* 距离顶部位置 */
  left: -14rpx; /* 向左突出 */
  width: 0;
  height: 0;
  border-top: 12rpx solid transparent;
  border-bottom: 12rpx solid transparent;
  border-right: 16rpx solid #ffffff; /* 箭头颜色 */
}
/* 接收方三角形边框修正 (可选) */
/* .bubble-receiver::after { ...如果需要完美边框衔接，需要双层伪元素... } */


/* 发送方 (蓝色气泡，箭头向右) */
.bubble-sender {
  background-color: #007aff; /* 如需绿色改为 #95ec69 */
  color: #fff; /* 如需绿色背景，字体通常为 #000 */
}

/* 发送方三角形 */
.bubble-sender::after {
  content: '';
  position: absolute;
  top: 24rpx;
  right: -14rpx; /* 向右突出 */
  width: 0;
  height: 0;
  border-top: 12rpx solid transparent;
  border-bottom: 12rpx solid transparent;
  border-left: 16rpx solid #007aff; /* 箭头颜色与背景一致 */
}


/* 图片消息样式 */
.image-message {
  line-height: 0;
  position: relative;
}

.image-container {
  position: relative;
  display: inline-block;
}

.message-image {
  width: 280rpx;
  height: 280rpx;
  border-radius: 8rpx;
  display: block;
  transition: opacity 0.3s ease;
}

.message-image:active {
  opacity: 0.8;
}

/* 图片加载状态 */
.image-loading {
  width: 280rpx;
  height: 280rpx;
  border-radius: 8rpx;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid #e0e0e0;
}

.loading-text {
  font-size: 24rpx;
  color: #999;
}

/* 图片加载失败 */
.image-error {
  width: 280rpx;
  height: 280rpx;
  border-radius: 8rpx;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1rpx solid #e0e0e0;
}

.error-text {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 15rpx;
}

.error-actions {
  display: flex;
  gap: 10rpx;
}

.retry-btn, .debug-btn {
  padding: 8rpx 16rpx;
  border-radius: 4rpx;
  font-size: 22rpx;
  text-align: center;
  min-width: 60rpx;
}

.retry-btn {
  background-color: #007aff;
  color: white;
}

.debug-btn {
  background-color: #ff9500;
  color: white;
}

.retry-btn:active, .debug-btn:active {
  opacity: 0.8;
}

/* 文件消息样式 */
.file-message {
  max-width: 500rpx;
}

.file-container {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background-color: #f8f9fa;
  border-radius: 12rpx;
  border: 1rpx solid #e9ecef;
  cursor: pointer;
  transition: background-color 0.2s;
}

.file-container:active {
  background-color: #e9ecef;
}

.file-icon {
  flex-shrink: 0;
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #007aff;
  border-radius: 8rpx;
  margin-right: 24rpx;
}

.file-icon-text {
  font-size: 40rpx;
  color: white;
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.file-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 24rpx;
  color: #666;
}

.file-action {
  flex-shrink: 0;
  margin-left: 24rpx;
}

.download-text {
  font-size: 26rpx;
  color: #007aff;
  font-weight: 500;
}

/* 状态 (发送中/失败) */
.status-container {
  display: flex;
  align-items: center;
  margin-right: 10rpx;
  align-self: center;
}

.status-text {
  font-size: 24rpx;
  color: #999;
}

.status-text.failed {
  color: #ff3b30;
  font-weight: bold;
  background-color: rgba(255, 59, 48, 0.1);
  width: 36rpx;
  height: 36rpx;
  text-align: center;
  line-height: 36rpx;
  border-radius: 50%;
}


/* 输入框区域 - 固定定位 */
.input-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #f7f7f7;
  padding: 16rpx 20rpx;
  padding-bottom: calc(16rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #e0e0e0;
  z-index: 1000;
  box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.input-box {
  display: flex;
  align-items: flex-end;
  background-color: #fff;
  border-radius: 10rpx;
  padding: 16rpx;
}

.input-actions {
  margin-right: 16rpx;
  align-self: center;
}

.action-icon {
  font-size: 50rpx;
  color: #666;
  margin-right: 10rpx;
}

.debug-btn {
  font-size: 40rpx;
  color: #ff9500;
}

.health-btn {
  font-size: 40rpx;
  color: #34c759;
}

.message-input {
  flex: 1;
  font-size: 30rpx;
  color: #333;
  min-height: 40rpx;
  margin: 0 10rpx;
  padding-top: 4rpx;
}

.send-button {
  margin-left: 16rpx;
  padding: 10rpx 24rpx;
  background-color: #e5e5e5;
  border-radius: 8rpx;
  transition: all 0.2s;
  align-self: center;
}

.send-button.active {
  background-color: #007aff;
}

.send-text {
  font-size: 26rpx;
  color: #888;
}

.send-button.active .send-text {
  color: #fff;
}

/* 响应式适配 */
/* 小屏幕设备适配 */
@media screen and (max-height: 600px) {
  .message-list {
    margin-top: calc(100rpx + var(--status-bar-height, 44rpx));
    margin-bottom: 120rpx;
  }
  
  .header {
    padding: 15rpx 25rpx;
  }
  
  .input-container {
    padding: 12rpx 16rpx;
  }
}

/* 大屏幕设备适配 */
@media screen and (min-height: 800px) {
  .message-list {
    margin-top: calc(140rpx + var(--status-bar-height, 44rpx));
    margin-bottom: 160rpx;
  }
}

/* 横屏适配 */
@media screen and (orientation: landscape) {
  .header {
    padding: 10rpx 20rpx;
    padding-top: calc(10rpx + var(--status-bar-height, 0rpx));
  }
  
  .message-list {
    margin-top: calc(80rpx + var(--status-bar-height, 0rpx));
    margin-bottom: 100rpx;
  }
  
  .input-container {
    padding: 10rpx 16rpx;
  }
}
</style>