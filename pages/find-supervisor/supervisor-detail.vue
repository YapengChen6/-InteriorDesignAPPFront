<template>
  <view class="container">
    <!-- 顶部导航 -->
    <view class="header">
      <view class="header-title">监理详情</view>
      <view class="header-placeholder"></view>
    </view>
    
    <!-- 加载状态 -->
    <view v-if="loading" class="loading">
      <view class="spinner"></view>
      <text>正在加载监工信息...</text>
    </view>
    
    <!-- 监理基本信息 -->
    <view class="supervisor-header" v-else-if="supervisorInfo">
      <view class="supervisor-avatar">
        <image 
          v-if="userInfo.avatar" 
          :src="userInfo.avatar" 
          class="avatar-image"
          mode="aspectFill"
          @error="handleAvatarError"
        />
        <text v-else class="avatar-text">{{ userInfo.nickName ? userInfo.nickName.charAt(0) : '监' }}</text>
      </view>
      <view class="supervisor-basic-info">
        <view class="supervisor-name">{{ userInfo.nickName || '匿名监工' }}</view>
        <view class="supervisor-tags">
          <view class="tag">专业监理</view>
          <view class="tag" v-if="supervisorInfo.city">{{ supervisorInfo.city }}</view>
          <!-- 修改这里：使用计算属性 -->
          <view class="tag status-tag" :class="statusClass">
            {{ getStatusText(supervisorInfo.certificationStatus) }}
          </view>
        </view>
        <view class="supervisor-stats">
          <view class="stat-item">
            <text class="stat-value">{{ totalCases || 0 }}</text>
            <text class="stat-label">案例</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-value">{{ totalViews || 0 }}</text>
            <text class="stat-label">浏览</text>
          </view>
          <view class="stat-item like-btn" @click="toggleLike" :class="{ 'liked': isLiked, 'liking': isLiking }">
            <text class="stat-icon">{{ isLiked ? '❤️' : '🤍' }}</text>
            <text class="stat-value">{{ totalLikes || 0 }}</text>
            <text class="stat-label">点赞</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 选项卡 -->
    <view class="tabs">
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'info' }"
        @click="activeTab = 'info'"
      >
        基本信息
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'cases' }"
        @click="activeTab = 'cases'"
      >
        案例作品 ({{ caseList.length }})
      </view>
    </view>
    
    <!-- 基本信息标签页 -->
    <scroll-view 
      v-if="activeTab === 'info' && supervisorInfo" 
      class="tab-content info-tab"
      scroll-y="true"
      :scroll-with-animation="true"
    >
      <view class="detail-section">
        <view class="section-title">基本信息</view>
        <view class="info-list">
          <view class="info-item">
            <text class="info-label">📍 所在地</text>
            <text class="info-value">{{ supervisorInfo.city || '未设置' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">📞 联系电话</text>
            <text class="info-value">{{ userInfo.phonenumber || '电话未提供' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">📧 邮箱</text>
            <text class="info-value">{{ userInfo.email || '未设置' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">👤 真实姓名</text>
            <text class="info-value">{{ supervisorInfo.name || '未实名' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">⭐ 认证状态</text>
            <!-- 修改这里：使用计算属性 -->
            <text class="info-value" :class="statusClass">
              {{ getStatusText(supervisorInfo.certificationStatus) }}
            </text>
          </view>
          <view class="info-item" v-if="supervisorInfo.margin">
            <text class="info-label">💰 保证金</text>
            <text class="info-value">{{ supervisorInfo.margin }}元</text>
          </view>
          <view class="info-item" v-if="supervisorInfo.marginStatus">
            <text class="info-label">🔒 保证金状态</text>
            <text class="info-value">{{ getMarginStatusText(supervisorInfo.marginStatus) }}</text>
          </view>
        </view>
      </view>
      
      <!-- 只保留资质证书部分，移除身份认证和手持身份证部分 -->
      <view class="detail-section" v-if="supervisorInfo.qualificationCertificate">
        <view class="section-title">资质证书</view>
        <view class="section-desc">查看该监工的专业资质证书</view>
        <view class="certificate-images">
          <image 
            :src="getImageUrl(supervisorInfo.qualificationCertificate)" 
            class="certificate-image"
            mode="aspectFit"
            @click="previewImage(supervisorInfo.qualificationCertificate)"
          />
        </view>
      </view>

      <!-- 移除的身份认证部分 -->
      <!-- 移除的手持身份证部分 -->

      <view class="detail-section" v-if="supervisorInfo.rejectionReason">
        <view class="section-title">审核信息</view>
        <view class="section-desc">认证审核相关记录</view>
        <view class="info-list">
          <view class="info-item" v-if="supervisorInfo.rejectionReason">
            <text class="info-label">❌ 拒绝原因</text>
            <text class="info-value">{{ supervisorInfo.rejectionReason }}</text>
          </view>
          <view class="info-item" v-if="supervisorInfo.reviewTime">
            <text class="info-label">⏰ 审核时间</text>
            <text class="info-value">{{ formatTime(supervisorInfo.reviewTime) }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
    
    <!-- 案例作品标签页 -->
    <scroll-view 
      v-if="activeTab === 'cases'" 
      class="tab-content case-tab"
      scroll-y="true"
      :scroll-with-animation="true"
    >
      <!-- 案例列表 -->
      <view class="case-list">
        <view 
          v-for="caseItem in caseList" 
          :key="caseItem.threadId"
          class="case-card"
          @click="viewCaseDetail(caseItem.threadId)"
        >
          <view class="case-cover">
            <image 
              :src="getImageUrl(caseItem.coverImage || caseItem.coverUrl) || '/static/images/default-case.jpg'" 
              class="cover-image"
              mode="aspectFill"
              @error="handleImageError"
            />
            <view class="case-stats">
              <view class="stat" @click.stop="viewCaseDetail(caseItem.threadId)">
                <text class="stat-icon">👁️</text>
                <text class="stat-number">{{ caseItem.viewCount || 0 }}</text>
              </view>
              <view class="stat">
                <text class="stat-icon">❤️</text>
                <text class="stat-number">{{ caseItem.likeCount || 0 }}</text>
              </view>
              <view class="stat">
                <text class="stat-icon">💬</text>
                <text class="stat-number">{{ caseItem.commentCount || 0 }}</text>
              </view>
            </view>
          </view>
          <view class="case-info">
            <view class="case-title">{{ caseItem.title || '无标题' }}</view>
            <view class="case-content" v-if="caseItem.content">
              {{ caseItem.content.length > 60 ? caseItem.content.substring(0, 60) + '...' : caseItem.content }}
            </view>
            <view class="case-meta">
              <view class="case-time">{{ formatTime(caseItem.createTime) }}</view>
              <view class="case-images" v-if="caseItem.imageCount">
                📸 {{ caseItem.imageCount }}张图片
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view v-if="caseList.length === 0 && !loading" class="empty-case">
        <view class="empty-icon">📁</view>
        <view class="empty-text">暂无案例作品</view>
        <view class="empty-desc">该监工还没有发布任何案例</view>
      </view>
    </scroll-view>
    
    <!-- 错误状态 -->
    <view v-if="!loading && !supervisorInfo" class="error-state">
      <view class="error-icon">😔</view>
      <view class="error-text">加载失败</view>
      <view class="error-desc">无法获取监工信息，请稍后重试</view>
      <button class="retry-btn" @click="loadSupervisorDetail">重新加载</button>
    </view>
    
    <!-- 底部操作栏 -->
    <view class="bottom-actions" v-if="supervisorInfo">
      <button class="favorite-btn" @click="toggleFavorite">
        <text class="favorite-icon">{{ isFavorite ? '❤️' : '🤍' }}</text>
        <text class="btn-text">{{ isFavorite ? '已收藏' : '收藏' }}</text>
      </button>
      <button class="contact-btn" @click="contactSupervisor">
        <text class="contact-icon">📞</text>
        <text class="btn-text">立即联系</text>
      </button>
    </view>
  </view>
</template>

<script>
// 导入监工信息获取
import { getSupervisorDetail } from '@/api/supervisor2.js'
// 导入点赞相关API
import { toggleUserLike, checkLikeStatus, getUserLikeCount } from '@/api/like.js'
// 导入对话辅助工具函数
import { 
  createConversationAndNavigate, 
  isUserLoggedIn, 
  handleNotLoggedIn 
} from '@/utils/conversationHelper.js'

export default {
  data() {
    return {
      supervisorId: null,
      supervisorInfo: null,
      userInfo: null,
      caseList: [],
      totalCases: 0,
      totalViews: 0,
      totalLikes: 0,
      loading: false,
      isFavorite: false,
      activeTab: 'info',
      
      // 点赞相关状态
      isLiked: false,      // 当前用户是否点赞了该监工
      isLiking: false,     // 防止重复点击
      likeCheckLoading: false  // 检查点赞状态加载
    }
  },
  
  computed: {
    // 计算认证状态的CSS类
    statusClass() {
      if (!this.supervisorInfo || !this.supervisorInfo.certificationStatus) {
        return 'status-pending'
      }
      return this.getStatusClass(this.supervisorInfo.certificationStatus)
    }
  },
  
  onLoad(options) {
    console.log('详情页面接收到的参数:', options)
    this.supervisorId = options.supervisorId || options.id || options.userId
    if (!this.supervisorId) {
      console.error('未接收到监工ID')
      uni.showToast({
        title: '参数错误',
        icon: 'error'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
      return
    }
    this.loadSupervisorDetail()
  },
  
  onShow() {
    // 页面显示时检查点赞状态
    if (this.supervisorId) {
      this.checkLikeStatus()
      this.getLikeCount()
    }
  },
  
  onPullDownRefresh() {
    this.loadSupervisorDetail().finally(() => {
      uni.stopPullDownRefresh()
    })
  },
  
  methods: {
    goBack() {
      uni.navigateBack()
    },
    
    async loadSupervisorDetail() {
      this.loading = true
      
      try {
        console.log('开始加载监工详情，ID:', this.supervisorId)
        
        // 真实的API调用
        const response = await getSupervisorDetail(this.supervisorId)
        
        console.log('监工详情接口响应:', response)
        
        if (response.code === 200 && response.data) {
          this.handleSuccessResponse(response.data)
          
          // 加载完成后检查点赞状态
          this.checkLikeStatus()
          this.getLikeCount()
        } else if (response.code === 401) {
          this.handleTokenExpired()
        } else {
          this.handleErrorResponse(response.msg || response.message || '获取监工信息失败')
        }
      } catch (error) {
        console.error('加载监工详情失败:', error)
        this.handleNetworkError(error)
      } finally {
        this.loading = false
      }
    },
    
    // 处理成功响应
    handleSuccessResponse(data) {
      this.supervisorInfo = data.supervisorInfo
      this.userInfo = data.userInfo
      this.caseList = data.caseList || []
      this.totalCases = data.totalCases || 0
      this.totalViews = data.totalViews || 0
      this.totalLikes = data.totalLikes || 0
      
      // 检查是否已经收藏过
      this.checkFavoriteStatus()
      
      // 默认显示案例标签页如果有案例
      if (this.caseList.length > 0) {
        this.activeTab = 'cases'
      }
      
      console.log('监工数据加载成功')
    },
    
    // 处理token过期
    handleTokenExpired() {
      uni.showModal({
        title: '提示',
        content: '登录已过期，请重新登录',
        showCancel: false,
        success: () => {
          uni.navigateTo({
            url: '/pages/login/login'
          })
        }
      })
    },
    
    // 处理错误响应
    handleErrorResponse(message) {
      console.error('获取监工详情失败:', message)
      uni.showToast({
        title: message || '获取监工信息失败',
        icon: 'none',
        duration: 3000
      })
    },
    
    // 处理网络错误
    handleNetworkError(error) {
      let errorMessage = '网络错误，请检查网络连接'
      if (error.message && error.message.includes('timeout')) {
        errorMessage = '请求超时，请稍后重试'
      } else if (error.message && error.message.includes('Network Error')) {
        errorMessage = '网络连接失败，请检查网络'
      }
      
      uni.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 3000
      })
    },
    
    // ====================== 点赞相关方法 ======================
    
    // 检查当前用户是否点赞了该监工
    async checkLikeStatus() {
      if (!this.supervisorId || this.likeCheckLoading) return
      
      this.likeCheckLoading = true
      try {
        const response = await checkLikeStatus(this.supervisorId)
        
        if (response.code === 200) {
          this.isLiked = response.data
          console.log('点赞状态检查结果:', this.isLiked)
        } else if (response.code === 401) {
          // 未登录，默认未点赞
          this.isLiked = false
        }
      } catch (error) {
        console.error('检查点赞状态失败:', error)
        this.isLiked = false
      } finally {
        this.likeCheckLoading = false
      }
    },
    
    // 获取监工的点赞总数
    async getLikeCount() {
      if (!this.supervisorId) return
      
      try {
        const response = await getUserLikeCount(this.supervisorId)
        
        if (response.code === 200) {
          this.totalLikes = response.data
          console.log('点赞总数:', this.totalLikes)
        }
      } catch (error) {
        console.error('获取点赞数失败:', error)
      }
    },
    
    // 点赞/取消点赞
    async toggleLike() {
      if (!this.supervisorId || this.isLiking) return
      
      // 检查登录状态
      const token = uni.getStorageSync('token')
      if (!token) {
        uni.showModal({
          title: '提示',
          content: '请先登录后才能点赞',
          confirmText: '去登录',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({
                url: '/pages/login/login'
              })
            }
          }
        })
        return
      }
      
      this.isLiking = true
      
      try {
        // 先更新本地状态，提升用户体验
        const oldIsLiked = this.isLiked
        const oldTotalLikes = this.totalLikes
        
        this.isLiked = !oldIsLiked
        this.totalLikes = oldIsLiked ? Math.max(0, oldTotalLikes - 1) : oldTotalLikes + 1
        
        const response = await toggleUserLike(this.supervisorId)
        
        if (response.code === 200) {
          const result = response.data
          this.isLiked = result.isLiked
          this.totalLikes = result.likeCount
          
          uni.showToast({
            title: result.isLiked ? '点赞成功' : '已取消点赞',
            icon: 'success',
            duration: 1500
          })
          
          // 触发点赞事件通知其他组件
          uni.$emit('userLikeChanged', {
            userId: this.supervisorId,
            isLiked: this.isLiked,
            likeCount: this.totalLikes
          })
          
        } else if (response.code === 400) {
          // 特殊处理：不能给自己点赞
          if (response.message && response.message.includes('不能给自己点赞')) {
            uni.showToast({
              title: '不能给自己点赞哦~',
              icon: 'none',
              duration: 2000
            })
          } else {
            uni.showToast({
              title: response.message || '操作失败',
              icon: 'none'
            })
          }
          
          // 恢复之前的状态
          this.isLiked = oldIsLiked
          this.totalLikes = oldTotalLikes
          
        } else if (response.code === 401) {
          uni.showModal({
            title: '提示',
            content: '登录已过期，请重新登录',
            confirmText: '去登录',
            success: (res) => {
              if (res.confirm) {
                uni.navigateTo({
                  url: '/pages/login/login'
                })
              }
            }
          })
          
          // 恢复之前的状态
          this.isLiked = oldIsLiked
          this.totalLikes = oldTotalLikes
          
        } else {
          // 其他错误
          uni.showToast({
            title: response.message || '操作失败',
            icon: 'none'
          })
          
          // 恢复之前的状态
          this.isLiked = oldIsLiked
          this.totalLikes = oldTotalLikes
        }
      } catch (error) {
        console.error('点赞操作失败:', error)
        uni.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        })
        
        // 恢复之前的状态
        const oldIsLiked = this.isLiked
        const oldTotalLikes = this.totalLikes
        this.isLiked = !oldIsLiked
        this.totalLikes = oldTotalLikes
      } finally {
        this.isLiking = false
      }
    },
    
    // 检查收藏状态（需要根据你的实际业务实现）
    async checkFavoriteStatus() {
      try {
        // 这里需要根据你的业务实现收藏状态的检查
        // 例如：调用API检查当前用户是否收藏了该监工
        // const response = await checkFavoriteStatus(this.supervisorId)
        // this.isFavorite = response.data.isFavorite || false
        
        // 临时使用本地存储
        const favorites = uni.getStorageSync('supervisor_favorites') || []
        this.isFavorite = favorites.includes(this.supervisorId)
      } catch (error) {
        console.error('检查收藏状态失败:', error)
      }
    },
    
    // 查看案例详情
    viewCaseDetail(threadId) {
      uni.navigateTo({
        url: `/pages/find-supervisor/case-detail?threadId=${threadId}`
      })
    },
    
    // 图片预览
    previewImage(url) {
      if (!url) {
        uni.showToast({
          title: '图片暂不可用',
          icon: 'none'
        })
        return
      }
      
      const fullUrl = this.getImageUrl(url)
      uni.previewImage({
        urls: [fullUrl],
        current: fullUrl
      })
    },
    
    // 处理头像加载失败
    handleAvatarError(e) {
      console.log('头像加载失败:', e)
      // 设置默认头像
      this.$set(this.userInfo, 'avatar', '')
    },
    
    // 处理图片加载失败
    handleImageError(e) {
      console.log('图片加载失败:', e)
    },
    
    // 获取完整的图片URL（处理相对路径）
    getImageUrl(url) {
      if (!url) return ''
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url
      }
      // 如果是相对路径，添加基础URL
      const baseUrl = 'http://your-domain.com' // 请替换为你的实际域名
      return baseUrl + (url.startsWith('/') ? url : '/' + url)
    },
    
    // 获取认证状态文本
    getStatusText(status) {
      const statusMap = {
        '0': '未认证',
        '1': '认证中', 
        '2': '已认证',
        '3': '认证失败'
      }
      return statusMap[status] || '未知状态'
    },
    
    // 获取认证状态样式类
    getStatusClass(status) {
      const classMap = {
        '0': 'status-pending',
        '1': 'status-processing',
        '2': 'status-approved',
        '3': 'status-rejected'
      }
      return classMap[status] || 'status-pending'
    },

    // 获取保证金状态文本
    getMarginStatusText(status) {
      const statusMap = {
        '1': '待支付',
        '2': '已支付', 
        '3': '已退回'
      }
      return statusMap[status] || '未知状态'
    },
    
    // 格式化时间
    formatTime(timeString) {
      if (!timeString) return ''
      
      try {
        const date = new Date(timeString)
        const now = new Date()
        
        // 如果是今天
        if (date.toDateString() === now.toDateString()) {
          return date.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        }
        
        // 如果是今年
        if (date.getFullYear() === now.getFullYear()) {
          return date.toLocaleDateString('zh-CN', { 
            month: '2-digit', 
            day: '2-digit' 
          })
        }
        
        return date.toLocaleDateString('zh-CN', { 
          year: 'numeric',
          month: '2-digit', 
          day: '2-digit' 
        })
      } catch (error) {
        console.error('时间格式化错误:', error)
        return timeString
      }
    },
    
    // 切换收藏状态
    async toggleFavorite() {
      try {
        // 这里需要根据你的业务实现收藏API调用
        // const response = await toggleFavorite(this.supervisorId)
        // this.isFavorite = response.data.isFavorite
        
        // 临时使用本地存储
        const favorites = uni.getStorageSync('supervisor_favorites') || []
        const index = favorites.indexOf(this.supervisorId)
        
        if (index > -1) {
          // 已收藏，取消收藏
          favorites.splice(index, 1)
          this.isFavorite = false
          uni.showToast({
            title: '已取消收藏',
            icon: 'success'
          })
        } else {
          // 未收藏，添加收藏
          favorites.push(this.supervisorId)
          this.isFavorite = true
          uni.showToast({
            title: '收藏成功',
            icon: 'success'
          })
        }
        
        uni.setStorageSync('supervisor_favorites', favorites)
      } catch (error) {
        console.error('收藏操作失败:', error)
        uni.showToast({
          title: '操作失败，请重试',
          icon: 'none'
        })
      }
    },
    
    // 联系监工 - 使用与寻找监理界面相同的逻辑
    async contactSupervisor() {
      console.log('💬 开始联系监理:', this.supervisorInfo, this.userInfo);
      
      // 检查登录状态
      if (!this.isUserLoggedIn()) {
        this.handleNotLoggedIn();
        return;
      }
      
      if (!this.supervisorInfo || !this.supervisorId) {
        uni.showToast({
          title: '监理信息无效',
          icon: 'error'
        });
        return;
      }
      
      // 使用辅助工具函数创建对话并跳转
      await this.createConversationAndNavigate(
        this.supervisorId,
        this.userInfo?.nickName || this.supervisorInfo?.name || '监理',
        this.userInfo?.avatar || ''
      );
    },

    // 辅助方法 - 创建对话并跳转
    async createConversationAndNavigate(targetUserId, targetUserName, targetUserAvatar) {
      return await createConversationAndNavigate(targetUserId, targetUserName, targetUserAvatar);
    },

    // 辅助方法 - 检查用户登录状态
    isUserLoggedIn() {
      return isUserLoggedIn();
    },

    // 辅助方法 - 处理未登录状态
    handleNotLoggedIn() {
      return handleNotLoggedIn();
    }
  }
}
</script>

<style scoped>
/* 样式保持不变但添加了修复 */
.container {
  background-color: #f5f7fa;
  min-height: 100vh;
  padding-bottom: 160rpx; /* 增加底部内边距，防止按钮遮挡内容 */
}

.header {
  display: flex;
  align-items: center;
  justify-content: center; /* 改为居中 */
  padding: 30rpx;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 100;
}

/* 移除.back-btn样式 */
.back-btn {
  display: none;
}

.header-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.header-placeholder {
  width: 60rpx;
}

.loading {
  text-align: center;
  padding: 100rpx 0;
  color: #999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #f3f3f3;
  border-top: 4rpx solid #8b5cf6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.supervisor-header {
  background: white;
  padding: 40rpx 30rpx;
  display: flex;
  align-items: center;
  gap: 30rpx;
  border-bottom: 1px solid #f0f0f0;
}

.supervisor-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.avatar-text {
  color: white;
  font-size: 48rpx;
  font-weight: bold;
}

.supervisor-basic-info {
  flex: 1;
}

.supervisor-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

.supervisor-tags {
  display: flex;
  gap: 16rpx;
  margin-bottom: 30rpx;
  flex-wrap: wrap;
}

.tag {
  background: #f8f8f8;
  color: #666;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.status-tag.status-approved {
  background: #d4f8e8;
  color: #059669;
}

.status-tag.status-pending {
  background: #fff3cd;
  color: #856404;
}

.status-tag.status-processing {
  background: #cce7ff;
  color: #0066cc;
}

.status-tag.status-rejected {
  background: #f8d7da;
  color: #721c24;
}

.supervisor-stats {
  display: flex;
  align-items: center;
  background: #f8f8f8;
  border-radius: 16rpx;
  padding: 20rpx;
}

.stat-item {
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  transition: all 0.3s ease;
  cursor: pointer;
}

.stat-item.like-btn {
  position: relative;
}

.stat-item.liking {
  pointer-events: none;
  opacity: 0.7;
}

.stat-item.liked .stat-icon {
  color: #ff4757;
  animation: heartBeat 0.6s ease;
}

.stat-icon {
  font-size: 32rpx;
  transition: all 0.3s ease;
}

.stat-value {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  transition: all 0.3s ease;
}

.stat-item.liked .stat-value {
  color: #ff4757;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
  transition: all 0.3s ease;
}

.stat-item.liked .stat-label {
  color: #ff4757;
}

.stat-divider {
  width: 1px;
  height: 40rpx;
  background: #e0e0e0;
}

/* 心跳动画 */
@keyframes heartBeat {
  0% { transform: scale(1); }
  15% { transform: scale(1.2); }
  30% { transform: scale(0.95); }
  45% { transform: scale(1.1); }
  60% { transform: scale(0.98); }
  75% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.tabs {
  display: flex;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 88rpx; /* header高度 + 内边距 */
  z-index: 90;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 30rpx;
  font-size: 28rpx;
  color: #666;
  position: relative;
}

.tab-item.active {
  color: #8b5cf6;
  font-weight: 500;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80rpx;
  height: 4rpx;
  background: #8b5cf6;
  border-radius: 2rpx;
}

.tab-content {
  padding: 30rpx;
  box-sizing: border-box;
}

.info-tab, .case-tab {
  height: calc(100vh - 400rpx); /* 根据实际情况调整高度 */
}

.detail-section {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.section-desc {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 24rpx;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1px solid #f5f5f5;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 28rpx;
  color: #666;
}

.info-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  text-align: right;
  max-width: 60%;
}

.info-value.status-approved {
  color: #059669;
}

.info-value.status-pending {
  color: #856404;
}

.info-value.status-processing {
  color: #0066cc;
}

.info-value.status-rejected {
  color: #721c24;
}

.certificate-images {
  display: flex;
  gap: 20rpx;
  flex-wrap: wrap;
}

.certificate-image {
  width: 300rpx;
  height: 200rpx;
  border-radius: 12rpx;
  border: 1px solid #f0f0f0;
  background: #f8f8f8;
}

/* 移除.id-card-images相关样式 */
.case-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.case-card {
  background: white;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.case-card:active {
  transform: translateY(-2px);
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
}

.case-cover {
  position: relative;
  height: 400rpx;
  background: #f8f8f8;
}

.cover-image {
  width: 100%;
  height: 100%;
}

.case-stats {
  position: absolute;
  bottom: 20rpx;
  right: 20rpx;
  display: flex;
  gap: 20rpx;
  background: rgba(0, 0, 0, 0.6);
  padding: 12rpx 20rpx;
  border-radius: 20rpx;
}

.stat {
  display: flex;
  align-items: center;
  gap: 8rpx;
  color: white;
  font-size: 24rpx;
}

.stat-icon {
  font-size: 24rpx;
}

.stat-number {
  font-size: 24rpx;
}

.case-info {
  padding: 30rpx;
}

.case-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
  line-height: 1.4;
}

.case-content {
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
  margin-bottom: 20rpx;
}

.case-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 24rpx;
  color: #999;
}

.case-time {
  font-size: 24rpx;
  color: #999;
}

.empty-case, .error-state {
  text-align: center;
  padding: 100rpx 40rpx;
  background: white;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.empty-icon, .error-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
  opacity: 0.5;
}

.empty-text, .error-text {
  font-size: 32rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.empty-desc, .error-desc {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.retry-btn {
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 32rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 20rpx 30rpx;
  display: flex;
  gap: 20rpx;
  border-top: 1px solid #f0f0f0;
  box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.favorite-btn, .contact-btn {
  flex: 1;
  border: none;
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  transition: all 0.3s ease;
}

.favorite-btn {
  background: #f8f8f8;
  color: #666;
}

.favorite-btn:active {
  background: #e8e8e8;
}

.contact-btn {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  color: white;
}

.contact-btn:active {
  background: linear-gradient(135deg, #7c3aed, #8b5cf6);
  transform: translateY(-1px);
}

.btn-text {
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .container {
    padding: 20rpx;
  }
  
  .supervisor-header {
    flex-direction: column;
    text-align: center;
    gap: 20rpx;
  }
  
  .supervisor-tags {
    justify-content: center;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8rpx;
  }
  
  .info-value {
    text-align: left;
    max-width: 100%;
  }
  
  .bottom-actions {
    padding: 20rpx;
  }
}
</style>