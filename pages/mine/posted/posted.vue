<template>
  <view class="container">
    <!-- 顶部切换按钮 -->
    <view class="tab-switcher">
      <view 
        class="tab-btn" 
        :class="{ active: currentTab === 'posts' }"
        @tap="switchTab('posts')"
      >
        <text class="tab-text">帖子</text>
        <view class="tab-indicator"></view>
      </view>
      <view 
        class="tab-btn" 
        :class="{ active: currentTab === 'orders' }"
        @tap="switchTab('orders')"
      >
        <text class="tab-text">订单</text>
        <view class="tab-indicator"></view>
      </view>
    </view>
    
    <!-- 状态导航 - 只在帖子标签时显示 -->
    <scroll-view v-if="currentTab === 'posts'" class="status-nav" scroll-x="true" :show-scrollbar="false">
      <view class="nav-container">
        <view 
          v-for="nav in navList" 
          :key="nav.value"
          class="nav-btn" 
          :class="{ active: currentNav === nav.value }"
          @tap="switchNav(nav.value)"
        >
          <text class="nav-text">{{ nav.label }}</text>
        </view>
      </view>
    </scroll-view>
    
    <!-- 内容区域 -->
    <view class="content-area">
      <!-- 帖子列表 -->
      <scroll-view class="post-list" scroll-y="true" :show-scrollbar="false">
        <!-- 订单视图 -->
        <view v-if="currentTab === 'orders'">
          <view 
            v-for="order in orderList" 
            :key="order.projectId || order.id"
            class="order-item"
            @tap="viewOrderDetail(order)"
          >
          <view class="order-header">
            <view class="order-info">
              <text class="order-title">{{ order.title || '项目' + (order.projectId || order.id) }}</text>
              <view class="order-meta">
                <text class="order-type" :class="orderTypeClasses[order.requiredRoles] || ''">
                  {{ getOrderTypeText(order.requiredRoles) }}
                </text>
                <text class="order-status" :class="orderStatusClasses[order.status] || ''">
                  {{ getOrderStatusText(order.status) }}
                </text>
              </view>
            </view>
          </view>
          
          <view class="order-content">
            <view class="order-detail-item" v-if="order.address">
              <text class="detail-label">地址：</text>
              <text class="detail-value">{{ order.address }}</text>
            </view>
            <view class="order-detail-item" v-if="order.budget">
              <text class="detail-label">预算：</text>
              <text class="detail-value">￥{{ formatPrice(order.budget) }}</text>
            </view>
            <view class="order-detail-item" v-if="order.area">
              <text class="detail-label">面积：</text>
              <text class="detail-value">{{ order.area }}㎡</text>
            </view>
            <view class="order-detail-item" v-if="order.deadline">
              <text class="detail-label">截止：</text>
              <text class="detail-value">{{ formatTime(order.deadline) }}</text>
            </view>
          </view>
          
          <view class="order-footer">
            <text class="order-time">{{ formatTime(order.createTime) }}</text>
          </view>
          </view>
          
          <!-- 空状态 -->
          <view v-if="!orderLoading && orderList.length === 0" class="empty-state">
          <view class="empty-icon">📦</view>
            <text class="empty-title">暂无订单</text>
            <text class="empty-desc">您还没有发布任何订单</text>
          </view>
          
          <!-- 加载状态 -->
          <view v-if="orderLoading" class="loading-state">
            <text class="loading-text">加载中...</text>
          </view>
        </view>
        
        <!-- 帖子视图 -->
        <view v-else>
          <view 
            v-for="post in filteredPosts" 
            :key="post.id"
            class="post-item"
          >
            <view class="post-header">
              <view class="post-info" @tap="togglePost(post.id)">
                <text class="post-title">{{ post.title }}</text>
                <view class="post-meta">
                  <!-- 修复：使用映射对象替代函数调用 -->
                  <text class="post-type" :class="postTypeClasses[post.threadType]">
                    {{ getTypeLabel(post.threadType) }}
                  </text>
                  <text class="post-stats">
                    · {{ post.viewCount || 0 }}浏览 · {{ post.likeCount || 0 }}点赞 · {{ post.commentCount || 0 }}评论
                  </text>
                </view>
              </view>
              <view class="dropdown-btn" @tap="togglePostWithDetail(post.id)">
                <text class="icon" :class="{ rotated: post.expanded }">▼</text>
              </view>
            </view>
            
            <!-- 帖子内容 - 展开时显示 -->
            <view class="post-content" v-if="post.expanded">
              <!-- 媒体展示 - 图片和视频一起显示 -->
              <view class="media-container" v-if="post.mediaUrls && post.mediaUrls.length > 0">
                <!-- 修复：使用映射对象替代函数调用 -->
                <view class="media-grid" :class="mediaGridClasses[Math.min(post.mediaUrls.length, 4)]">
                  <view 
                    v-for="(media, index) in post.mediaUrls" 
                    :key="index"
                    class="media-item"
                    @tap="handleMediaClick(media, index, post.mediaUrls)"
                  >
                    <!-- 图片显示 -->
                    <image 
                      v-if="isImage(media.fileUrl || media)"
                      :src="media.fileUrl || media" 
                      mode="aspectFill"
                      class="media-content"
                    />
                    <!-- 视频显示 - 只显示封面，不嵌入video组件 -->
                    <view 
                      v-else-if="isVideo(media.fileUrl || media)"
                      class="video-preview-container"
                    >
                      <image 
                        :src="getVideoCover(media.fileUrl || media)" 
                        mode="aspectFill"
                        class="video-cover"
                      />
                      <view class="video-play-icon">
                        <text class="play-icon">▶</text>
                      </view>
                    </view>
                    <!-- 文件类型标识 -->
                    <!-- 修复：使用映射对象替代函数调用 -->
                    <view class="media-type-tag" :class="mediaTypeClasses[getMediaType(media.fileUrl || media)]">
                      {{ getMediaTypeText(media.fileUrl || media) }}
                    </view>
                  </view>
                </view>
              </view>
              
              <!-- 富文本内容展示 -->
              <view class="rich-content-container" v-if="post.richContent">
                <rich-text 
                  :nodes="post.parsedRichContent" 
                  class="rich-text-content"
                />
              </view>
              
              <!-- 普通文本内容 -->
              <view class="content-text" v-else-if="post.content">
                <text class="excerpt">{{ post.excerpt || post.content }}</text>
              </view>
              
              <!-- 帖子信息 - 只保留发布时间 -->
              <view class="post-footer">
                <text class="post-time">{{ formatTime(post.createTime) }}</text>
              </view>
            </view>
          </view>
          
          <!-- 空状态 -->
          <view v-if="filteredPosts.length === 0" class="empty-state">
            <view class="empty-icon">📝</view>
            <text class="empty-title">暂无{{ getTypeLabel(currentNav) }}内容</text>
            <text class="empty-desc">当前没有{{ getTypeLabel(currentNav) }}相关的帖子</text>
          </view>
        </view>
      </scroll-view>
    </view>
    
    <!-- 图片预览模态框 -->
    <view class="modal" v-if="showModal && currentMediaType === 'image'">
      <view class="modal-mask" @tap="closeModal"></view>
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">图片预览</text>
          <view class="modal-close" @tap="closeModal">
            <text class="close-icon">×</text>
          </view>
        </view>
        
        <view class="modal-body">
          <image 
            :src="currentMedia" 
            mode="aspectFit"
            class="modal-image"
          />
        </view>
        
        <view class="modal-footer">
          <text class="media-source">来源: {{ currentMedia }}</text>
        </view>
      </view>
    </view>
    
    <!-- 视频播放模态框 -->
    <view class="modal" v-if="showModal && currentMediaType === 'video'">
      <view class="modal-mask" @tap="closeModal"></view>
      <view class="modal-content video-modal">
        <view class="modal-header">
          <text class="modal-title">视频播放</text>
          <view class="modal-close" @tap="closeModal">
            <text class="close-icon">×</text>
          </view>
        </view>
        
        <view class="modal-body video-body">
          <!-- 尝试直接播放 -->
          <video 
            v-if="!videoError && !showDownloadOption"
            :src="currentMedia" 
            class="modal-video"
            :controls="true"
            :autoplay="false"
            :show-fullscreen-btn="true"
            :show-play-btn="true"
            :show-center-play-btn="true"
            :enable-play-gesture="true"
            objectFit="contain"
            :poster="getVideoCover(currentMedia)"
            :show-loading="true"
            :enable-progress-gesture="true"
            @error="onVideoError"
            @play="onVideoPlay"
            @loadedmetadata="onVideoLoaded"
            @loadstart="onVideoLoadStart"
            @waiting="onVideoWaiting"
            @canplay="onVideoCanPlay"
            @progress="onVideoProgress"
            @ended="onVideoEnded"
          />
          
          <!-- 视频加载状态 -->
          <view v-if="videoLoading" class="video-loading">
            <view class="loading-spinner"></view>
            <text class="loading-text">视频加载中...</text>
            <text class="loading-tip" v-if="isOSSUrl(currentMedia)">检测到OSS视频，可能需要CORS配置</text>
          </view>
          
          <!-- 视频错误提示 -->
          <view v-if="videoError || showDownloadOption" class="video-error">
            <text class="error-icon">🎬</text>
            <text class="error-text">{{ errorTitle }}</text>
            <text class="error-desc">{{ errorDescription }}</text>
            
            <!-- CORS配置提示 -->
            <view v-if="showCorsHelp" class="cors-help">
              <text class="cors-title">CORS配置解决方案：</text>
              <view class="cors-steps">
                <text class="cors-step">1. 登录阿里云OSS控制台</text>
                <text class="cors-step">2. 选择对应Bucket → 权限管理 → 跨域设置</text>
                <text class="cors-step">3. 添加CORS规则（允许来源、GET方法）</text>
                <text class="cors-step">4. 保存配置并刷新页面</text>
              </view>
            </view>
            
            <text class="error-solution">临时解决方案：</text>
            <view class="solution-options">
              <view class="solution-item" @tap="downloadVideo">
                <text class="solution-icon">📥</text>
                <text class="solution-text">下载视频到本地播放</text>
              </view>
              <view class="solution-item" @tap="copyVideoLink">
                <text class="solution-icon">🔗</text>
                <text class="solution-text">复制视频链接</text>
              </view>
              <view class="solution-item" @tap="openVideoInBrowser">
                <text class="solution-icon">🌐</text>
                <text class="solution-text">在浏览器中打开</text>
              </view>
              <view class="solution-item" @tap="retryVideoPlay">
                <text class="solution-icon">🔄</text>
                <text class="solution-text">重新尝试播放</text>
              </view>
            </view>
          </view>
        </view>
        
        <view class="modal-footer">
          <text class="media-source">视频地址: {{ currentMedia }}</text>
          <text class="cors-status" v-if="isOSSUrl(currentMedia)">
            {{ hasCorsSupport ? 'CORS: 已配置' : 'CORS: 未配置' }}
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getPostList, getPostDetail } from '@/api/community'
import { getUserProfile } from '@/api/users.js'
import { projectService } from '@/api/project.js'

export default {
  name: 'PostedPage',
  data() {
    return {
      currentTab: 'posts',
      currentNav: 3,
      currentMedia: '',
      currentMediaType: 'image',
      showModal: false,
      userId: '',
      videoError: false,
      videoLoading: false,
      showDownloadOption: false,
      videoTimeout: null,
      hasCorsSupport: false,
      errorTitle: '视频无法直接播放',
      errorDescription: '由于跨域限制，视频无法在浏览器中直接播放',
      showCorsHelp: false,
      navList: [
        { value: 1, label: '作品集' },
        { value: 2, label: '案例集' },
        { value: 3, label: '普通帖' },
        { value: 4, label: '材料展示' }
      ],
      posts: [],
      orderList: [],
      orderLoading: false,
      userRole: null,
      // 修复：预定义所有样式类映射
      postTypeClasses: {
        '1': 'type-1',
        '2': 'type-2',
        '3': 'type-3',
        '4': 'type-4'
      },
      mediaGridClasses: {
        1: 'grid-1',
        2: 'grid-2',
        3: 'grid-3',
        4: 'grid-4'
      },
      mediaTypeClasses: {
        'image': 'image-tag',
        'video': 'video-tag',
        'other': 'other-tag'
      },
      // 订单类型样式映射
      orderTypeClasses: {
        1: 'order-type-design',
        2: 'order-type-supervision',
        3: 'order-type-both'
      },
      // 订单状态样式映射
      orderStatusClasses: {
        0: 'status-draft',
        1: 'status-bidding',
        2: 'status-processing',
        3: 'status-processing',
        4: 'status-completed',
        5: 'status-cancelled'
      }
    }
  },
  
  computed: {
    filteredPosts() {
      if (this.currentTab === 'orders') return []
      if (this.currentNav === 'all') return this.posts
      return this.posts.filter(post => parseInt(post.threadType) === this.currentNav)
    }
  },
  
  onLoad() {
    this.initData()
  },
  
  onUnload() {
    this.clearVideoTimeout()
  },
  
  methods: {
    // 修复：获取媒体类型
    getMediaType(url) {
      if (this.isImage(url)) return 'image'
      if (this.isVideo(url)) return 'video'
      return 'other'
    },

    async initData() {
      try {
        uni.showLoading({
          title: '加载中...',
          mask: true
        })
        
        await this.getUserInfo()
        await this.loadPosts()
        
      } catch (error) {
        console.error('初始化数据失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },
    
    async loadOrders() {
      if (this.orderLoading || !this.userId) return
      
      try {
        this.orderLoading = true
        
        const queryParams = {
          userId: this.userId, // 根据用户ID查询项目
          pageNum: 1,
          pageSize: 100 // 获取所有项目
        }
        
        console.log('📋 加载用户项目列表 - 用户ID:', this.userId)
        
        const result = await projectService.getProjectList(queryParams)
        console.log('✅ 项目列表响应:', result)
        
        let list = []
        if (Array.isArray(result)) {
          list = result
        } else if (result && result.records) {
          list = result.records
        } else if (result && result.list) {
          list = result.list
        } else if (result && result.data) {
          list = result.data.records || result.data.list || result.data || []
        }
        
        this.orderList = list || []
        
      } catch (error) {
        console.error('❌ 加载项目列表失败:', error)
        uni.showToast({
          title: error.msg || error.message || '加载项目失败',
          icon: 'none'
        })
        this.orderList = []
      } finally {
        this.orderLoading = false
      }
    },
    
    getOrderTypeText(requiredRoles) {
      const typeMap = {
        1: '设计项目',
        2: '监理项目',
        3: '设计+监理项目'
      }
      return typeMap[requiredRoles] || '项目'
    },
    
    getOrderTypeClass(requiredRoles) {
      const classMap = {
        1: 'order-type-design',
        2: 'order-type-supervision',
        3: 'order-type-both'
      }
      return classMap[requiredRoles] || ''
    },
    
    getOrderStatusText(status) {
      const statusMap = {
        0: '草稿',
        1: '发布中',
        2: '设计师已接单',
        3: '监理已接单',
        4: '已完成',
        5: '已取消'
      }
      return statusMap[status] || '未知状态'
    },
    
    getOrderStatusClass(status) {
      const classMap = {
        0: 'status-draft',
        1: 'status-bidding',
        2: 'status-processing',
        3: 'status-processing',
        4: 'status-completed',
        5: 'status-cancelled'
      }
      return classMap[status] || ''
    },
    
    formatPrice(price) {
      if (!price && price !== 0) return '0.00'
      const num = Number(price)
      if (Number.isNaN(num)) return '0.00'
      return num.toFixed(2)
    },
    
    viewOrderDetail(order) {
      const projectId = order.projectId || order.id
      if (!projectId) {
        uni.showToast({
          title: '项目ID不存在',
          icon: 'none'
        })
        return
      }
      
      // 跳转到项目详情页（订单大厅的详情页）
      uni.navigateTo({
        url: `/pages/order-hall/order-detail?projectId=${projectId}`
      })
    },
    
    async getUserInfo() {
      try {
        const res = await getUserProfile()
        if (res.code === 200) {
          this.userId = res.data.userId
          this.userRole = res.data.currentRoleType || res.data.role_type || res.data.roleType
          uni.setStorageSync('userId', this.userId)
        } else {
          throw new Error(res.msg || '获取用户信息失败')
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        throw error
      }
    },
    
    async loadPosts() {
      try {
        if (!this.userId) {
          await this.getUserInfo()
        }
        
        const params = { userId: this.userId }
        const res = await getPostList(params)
        
        if (res.code === 200) {
          this.posts = res.data.rows.map(post => ({
            ...post,
            expanded: false,
            mediaUrls: post.mediaUrls || [],
            content: post.content || '',
            richContent: post.richContent || '',
            excerpt: this.stripHtmlTags(post.excerpt || post.content || ''),
            parsedRichContent: this.parseRichContent(post.richContent || post.content || '')
          }))
        } else {
          uni.showToast({
            title: res.msg || '加载失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('加载帖子列表失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      }
    },
    
    // ========== CORS优化处理方法 ==========
    
    /**
     * 检查是否为OSS URL
     */
    isOSSUrl(url) {
      return url && url.includes('aliyuncs.com')
    },
    
    /**
     * 处理媒体点击事件
     */
    handleMediaClick(media, index, mediaList) {
      const mediaUrl = media.fileUrl || media
      
      console.log('点击媒体:', {
        originalUrl: mediaUrl,
        type: this.isImage(mediaUrl) ? 'image' : 'video',
        isOSS: this.isOSSUrl(mediaUrl)
      })
      
      if (this.isImage(mediaUrl)) {
        this.currentMedia = mediaUrl
        this.currentMediaType = 'image'
        this.showModal = true
      } else if (this.isVideo(mediaUrl)) {
        this.prepareVideoPlayback(mediaUrl)
      }
    },
    
    /**
     * 准备视频播放
     */
    async prepareVideoPlayback(videoUrl) {
      // 重置状态
      this.videoError = false
      this.videoLoading = true
      this.showDownloadOption = false
      this.showModal = true
      this.currentMediaType = 'video'
      this.showCorsHelp = false
      
      // 直接使用原始视频URL
      this.currentMedia = videoUrl
      
      console.log('视频播放准备:', {
        videoUrl: this.currentMedia,
        isOSS: this.isOSSUrl(videoUrl),
        platform: uni.getSystemInfoSync().platform
      })
      
      // 如果是OSS视频，测试CORS支持
      if (this.isOSSUrl(videoUrl)) {
        this.hasCorsSupport = await this.testCorsSupport(videoUrl)
        console.log('CORS支持状态:', this.hasCorsSupport)
      }
      
      // 设置加载超时
      this.startVideoTimeout()
    },
    
    /**
     * 测试CORS支持
     */
    async testCorsSupport(url) {
      return new Promise((resolve) => {
        // 在小程序环境中，我们通过尝试加载视频来判断
        const testVideo = document.createElement('video')
        testVideo.src = url
        testVideo.oncanplay = () => {
          resolve(true)
        }
        testVideo.onerror = () => {
          resolve(false)
        }
        // 设置超时
        setTimeout(() => resolve(false), 2000)
      })
    },
    
    /**
     * 开始视频加载超时检测
     */
    startVideoTimeout() {
      this.clearVideoTimeout()
      this.videoTimeout = setTimeout(() => {
        if (this.videoLoading && this.showModal) {
          console.log('视频加载超时')
          this.videoLoading = false
          this.showDownloadOption = true
          this.videoError = true
          
          // 根据是否OSS视频显示不同的错误信息
          if (this.isOSSUrl(this.currentMedia)) {
            this.errorTitle = '视频加载超时（CORS限制）'
            this.errorDescription = 'OSS视频由于跨域限制无法直接播放'
            this.showCorsHelp = true
          } else {
            this.errorTitle = '视频加载超时'
            this.errorDescription = '视频加载时间过长，请检查网络或尝试下载'
          }
        }
      }, 8000)
    },
    
    /**
     * 清理视频超时定时器
     */
    clearVideoTimeout() {
      if (this.videoTimeout) {
        clearTimeout(this.videoTimeout)
        this.videoTimeout = null
      }
    },
    
    // ========== 视频事件处理 ==========
    
    /**
     * 视频错误处理
     */
    onVideoError(e) {
      console.error('视频播放错误详情:', {
        error: e,
        detail: e.detail,
        videoUrl: this.currentMedia
      })
      
      this.clearVideoTimeout()
      this.videoError = true
      this.videoLoading = false
      this.showDownloadOption = true
      
      const errorInfo = this.getVideoErrorInfo(e)
      this.errorTitle = errorInfo.title
      this.errorDescription = errorInfo.description
      this.showCorsHelp = errorInfo.showCorsHelp
      
      uni.showToast({
        title: errorInfo.toast,
        icon: 'none',
        duration: 3000
      })
    },
    
    /**
     * 获取视频错误信息
     */
    getVideoErrorInfo(e) {
      const errMsg = e.detail?.errMsg || ''
      const isOSS = this.isOSSUrl(this.currentMedia)
      
      console.log('视频错误信息:', errMsg)
      
      // CORS相关错误
      if (isOSS && (
        errMsg.includes('Failed to load') || 
        errMsg.includes('Network Error') ||
        errMsg.includes('跨域') ||
        errMsg.includes('MEDIA_ERR_NETWORK') ||
        !errMsg.includes('404') && !errMsg.includes('403')
      )) {
        return {
          title: '视频跨域限制',
          description: 'OSS视频由于CORS策略无法直接播放',
          toast: '视频跨域限制，请配置OSS CORS',
          showCorsHelp: true
        }
      }
      
      // 其他错误类型
      if (errMsg.includes('404')) {
        return {
          title: '视频文件不存在',
          description: '请求的视频文件在服务器上不存在',
          toast: '视频文件不存在',
          showCorsHelp: false
        }
      } else if (errMsg.includes('403')) {
        return {
          title: '无权限访问',
          description: '您没有权限访问该视频文件',
          toast: '无权限访问视频',
          showCorsHelp: false
        }
      } else if (errMsg.includes('MEDIA_ERR_DECODE')) {
        return {
          title: '视频格式不支持',
          description: '当前视频格式在此设备上不支持播放',
          toast: '视频格式不支持',
          showCorsHelp: false
        }
      } else {
        return {
          title: '视频播放失败',
          description: '视频无法正常播放，请尝试其他方式',
          toast: '视频播放失败',
          showCorsHelp: isOSS
        }
      }
    },
    
    /**
     * 重新尝试播放
     */
    retryVideoPlay() {
      this.prepareVideoPlayback(this.currentMedia)
    },
    
    onVideoLoadStart() {
      console.log('视频开始加载')
      this.videoLoading = true
      this.videoError = false
      this.showDownloadOption = false
    },
    
    onVideoWaiting() {
      console.log('视频等待加载')
      this.videoLoading = true
    },
    
    onVideoCanPlay() {
      console.log('视频可以播放')
      this.clearVideoTimeout()
      this.videoLoading = false
      this.videoError = false
      this.showDownloadOption = false
      this.hasCorsSupport = true
      
      uni.showToast({
        title: '视频加载完成',
        icon: 'success',
        duration: 1500
      })
    },
    
    onVideoLoaded() {
      console.log('视频元数据加载完成')
      this.videoLoading = false
    },
    
    onVideoPlay() {
      console.log('视频开始播放')
      this.clearVideoTimeout()
      this.videoLoading = false
      this.videoError = false
      this.showDownloadOption = false
    },
    
    onVideoProgress(e) {
      // 可以在这里添加进度显示
      const { buffered, currentTime, duration } = e.detail
      console.log('视频进度:', { buffered, currentTime, duration })
    },
    
    onVideoEnded() {
      console.log('视频播放结束')
      uni.showToast({
        title: '播放完成',
        icon: 'success',
        duration: 2000
      })
    },
    
    // ========== 下载相关方法 ==========
    
    downloadVideo() {
      uni.showLoading({
        title: '准备下载...',
        mask: true
      })
      
      uni.downloadFile({
        url: this.currentMedia,
        success: (res) => {
          uni.hideLoading()
          if (res.statusCode === 200) {
            uni.saveVideoToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                uni.showToast({
                  title: '视频已保存到相册',
                  icon: 'success'
                })
              },
              fail: (err) => {
                console.error('保存视频失败:', err)
                uni.showToast({
                  title: '保存失败，请重试',
                  icon: 'none'
                })
              }
            })
          } else {
            uni.showToast({
              title: `下载失败，状态码: ${res.statusCode}`,
              icon: 'none'
            })
          }
        },
        fail: (err) => {
          uni.hideLoading()
          console.error('下载视频失败:', err)
          uni.showToast({
            title: '下载失败，请检查网络',
            icon: 'none'
          })
        }
      })
    },
    
    copyVideoLink() {
      uni.setClipboardData({
        data: this.currentMedia,
        success: () => {
          uni.showToast({
            title: '链接已复制',
            icon: 'success'
          })
        },
        fail: () => {
          uni.showToast({
            title: '复制失败',
            icon: 'none'
          })
        }
      })
    },
    
    openVideoInBrowser() {
      if (uni.canIUse('openUrl')) {
        uni.openUrl({
          url: this.currentMedia
        })
      } else {
        window.open(this.currentMedia, '_blank')
      }
      uni.showToast({
        title: '请在浏览器中查看',
        icon: 'none'
      })
    },
    
    // ========== 基础工具方法 ==========
    
    isImage(url) {
      if (!url) return false
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
      return imageExtensions.some(ext => url.toLowerCase().includes(ext))
    },
    
    isVideo(url) {
      if (!url) return false
      const videoExtensions = ['.mp4', '.mov', '.avi', '.flv', '.webm', '.3gp', '.ogg', '.wmv', '.mkv']
      return videoExtensions.some(ext => url.toLowerCase().includes(ext))
    },
    
    getVideoCover(videoUrl) {
      if (!videoUrl) return '/static/images/video-cover.png'
      
      if (videoUrl.includes('aliyuncs.com') && videoUrl.includes('.mp4')) {
        try {
          const baseUrl = videoUrl.split('?')[0]
          return baseUrl + '?x-oss-process=video/snapshot,t_1000,f_jpg,w_300,h_300,m_fast'
        } catch (error) {
          console.warn('生成视频封面失败:', error)
        }
      }
      
      return '/static/images/video-cover.png'
    },
    
    getMediaTypeText(url) {
      if (this.isImage(url)) return '图片'
      if (this.isVideo(url)) return '视频'
      return '文件'
    },
    
    switchTab(tab) {
      this.currentTab = tab
      if (tab === 'orders' && this.orderList.length === 0) {
        this.loadOrders()
      }
    },
    
    switchNav(nav) {
      this.currentNav = nav
      this.posts.forEach(post => {
        post.expanded = false
      })
    },
    
    togglePost(postId) {
      const post = this.posts.find(p => p.id === postId)
      if (post) {
        this.posts.forEach(p => {
          if (p.id !== postId) {
            p.expanded = false
          }
        })
        post.expanded = !post.expanded
      }
    },
    
    async togglePostWithDetail(postId) {
      const post = this.posts.find(p => p.id === postId)
      if (post) {
        if (post.expanded) {
          this.togglePost(postId)
          return
        }
        
        try {
          uni.showLoading({
            title: '加载中...',
            mask: true
          })
          
          const res = await getPostDetail(postId)
          
          if (res.code === 200) {
            const detailData = res.data
            Object.assign(post, {
              content: detailData.content || '',
              richContent: detailData.richContent || detailData.content || '',
              mediaUrls: detailData.mediaUrls || [],
              excerpt: this.stripHtmlTags(detailData.excerpt || detailData.content || ''),
              parsedRichContent: this.parseRichContent(detailData.richContent || detailData.content || '')
            })
            
            this.togglePost(postId)
          } else {
            uni.showToast({
              title: res.msg || '加载详情失败',
              icon: 'none'
            })
          }
        } catch (error) {
          console.error('加载帖子详情失败:', error)
          uni.showToast({
            title: '加载详情失败',
            icon: 'none'
          })
        } finally {
          uni.hideLoading()
        }
      }
    },
    
    getTypeLabel(threadType) {
      const nav = this.navList.find(n => n.value === parseInt(threadType))
      return nav ? nav.label : '未知类型'
    },
    
    closeModal() {
      this.clearVideoTimeout()
      this.showModal = false
      this.currentMedia = ''
      this.currentMediaType = 'image'
      this.videoError = false
      this.videoLoading = false
      this.showDownloadOption = false
      this.showCorsHelp = false
    },
    
    stripHtmlTags(html) {
      if (!html) return ''
      return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
    },
    
    parseRichContent(html) {
      if (!html) return ''
      let content = html
        .replace(/<img/gi, '<img style="max-width:100%;height:auto;"')
        .replace(/<table/gi, '<table style="width:100%;"')
        .replace(/<video/gi, '<video style="max-width:100%;"')
      return content
    },
    
    formatTime(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}`
    }
  }
}
</script>

<style scoped>
/* 保持原有的所有样式，只添加新的CORS相关样式 */

.loading-tip {
  display: block;
  font-size: 24rpx;
  color: #ccc;
  margin-top: 16rpx;
}

.cors-help {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12rpx;
  padding: 24rpx;
  margin: 20rpx 0;
  text-align: left;
}

.cors-title {
  display: block;
  font-size: 26rpx;
  color: #ffa940;
  margin-bottom: 16rpx;
  font-weight: 600;
}

.cors-steps {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.cors-step {
  display: block;
  font-size: 24rpx;
  color: #ddd;
  line-height: 1.4;
}

.cors-status {
  display: block;
  font-size: 22rpx;
  color: #ff4d4f;
  margin-top: 8rpx;
}

/* 其他原有样式保持不变 */
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f7fa;
}

.tab-switcher {
  display: flex;
  background: white;
  border-bottom: 1px solid #e8e8e8;
}

.tab-btn {
  flex: 1;
  padding: 32rpx 0;
  text-align: center;
  position: relative;
}

.tab-text {
  font-size: 34rpx;
  font-weight: 500;
  color: #666;
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 6rpx;
  background: #1890ff;
  border-radius: 6rpx 6rpx 0 0;
}

.tab-btn.active .tab-text {
  color: #1890ff;
  font-weight: 600;
}

.tab-btn.active .tab-indicator {
  width: 80rpx;
}

.status-nav {
  background: white;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap;
}

.nav-container {
  display: flex;
  padding: 24rpx 30rpx;
  gap: 20rpx;
}

.nav-btn {
  padding: 20rpx 36rpx;
  border-radius: 40rpx;
  background: #f8f9fa;
  border: 2rpx solid transparent;
  font-size: 28rpx;
  color: #666;
  flex-shrink: 0;
}

.nav-btn.active {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

.nav-text {
  font-weight: 500;
}

.content-area {
  flex: 1;
  padding: 0;
  overflow: hidden;
}

.post-list {
  height: 100%;
  padding: 24rpx;
}

.post-item {
  background: white;
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid #f8f9fa;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.post-info {
  flex: 1;
  margin-right: 20rpx;
}

.post-title {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
  color: #1a1a1a;
  line-height: 1.4;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex-wrap: wrap;
}

.post-type {
  display: inline-block;
  padding: 8rpx 20rpx;
  border-radius: 12rpx;
  font-size: 24rpx;
  font-weight: 500;
}

.post-stats {
  font-size: 24rpx;
  color: #999;
}

.type-1 {
  background: #e6f7ff;
  color: #1890ff;
}

.type-2 {
  background: #f6ffed;
  color: #52c41a;
}

.type-3 {
  background: #fff7e6;
  color: #fa8c16;
}

.type-4 {
  background: #f9f0ff;
  color: #722ed1;
}

.dropdown-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  color: #999;
  flex-shrink: 0;
}

.icon {
  font-size: 24rpx;
  transition: transform 0.3s ease;
}

.icon.rotated {
  transform: rotate(180deg);
  color: #1890ff;
}

.post-content {
  margin-top: 32rpx;
  padding-top: 32rpx;
  border-top: 2rpx solid #f0f0f0;
}

.media-container {
  margin-bottom: 24rpx;
}

.media-grid {
  display: grid;
  gap: 16rpx;
}

.grid-1 {
  grid-template-columns: 1fr;
}

.grid-2 {
  grid-template-columns: 1fr 1fr;
}

.grid-3 {
  grid-template-columns: 1fr 1fr;
}

.grid-4 {
  grid-template-columns: 1fr 1fr 1fr;
}

.media-item {
  position: relative;
  border-radius: 16rpx;
  overflow: hidden;
  aspect-ratio: 1;
  cursor: pointer;
}

.media-content {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-preview-container {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 16rpx;
  overflow: hidden;
}

.video-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80rpx;
  height: 80rpx;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.play-icon {
  color: white;
  font-size: 36rpx;
  margin-left: 6rpx;
}

.media-type-tag {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  font-size: 20rpx;
  color: white;
  z-index: 2;
}

.image-tag {
  background: rgba(52, 152, 219, 0.8);
}

.video-tag {
  background: rgba(231, 76, 60, 0.8);
}

.other-tag {
  background: rgba(149, 165, 166, 0.8);
}

.rich-content-container {
  margin-bottom: 24rpx;
}

.rich-text-content {
  font-size: 30rpx;
  line-height: 1.6;
  color: #333;
}

.content-text {
  line-height: 1.8;
  color: #666;
  margin-bottom: 24rpx;
}

.excerpt {
  font-size: 30rpx;
  text-align: justify;
  line-height: 1.6;
}

.post-footer {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
  font-size: 24rpx;
  color: #999;
}

.post-time {
  font-size: 24rpx;
  color: #999;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  color: #999;
  text-align: center;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 32rpx;
  opacity: 0.6;
}

.empty-title {
  font-size: 36rpx;
  margin-bottom: 20rpx;
  color: #666;
  font-weight: 500;
}

.empty-desc {
  font-size: 28rpx;
  line-height: 1.6;
  color: #999;
}

/* 订单相关样式 */
.order-item {
  background: white;
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid #f8f9fa;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20rpx;
}

.order-info {
  flex: 1;
}

.order-title {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
  color: #1a1a1a;
  line-height: 1.4;
}

.order-meta {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex-wrap: wrap;
}

.order-type {
  display: inline-block;
  padding: 8rpx 20rpx;
  border-radius: 12rpx;
  font-size: 24rpx;
  font-weight: 500;
}

.order-type-design {
  background: #e6f7ff;
  color: #1890ff;
}

.order-type-supervision {
  background: #f6ffed;
  color: #52c41a;
}

.order-type-both {
  background: #fff7e6;
  color: #fa8c16;
}

.order-status {
  display: inline-block;
  padding: 8rpx 20rpx;
  border-radius: 12rpx;
  font-size: 24rpx;
  font-weight: 500;
}

.status-draft {
  background: #f5f5f5;
  color: #999;
}

.status-bidding {
  background: #e6f7ff;
  color: #1890ff;
}

.status-pending {
  background: #fff7e6;
  color: #fa8c16;
}

.status-processing {
  background: #e6f7ff;
  color: #1890ff;
}

.status-completed {
  background: #f6ffed;
  color: #52c41a;
}

.status-cancelled {
  background: #fff1f0;
  color: #ff4d4f;
}

.status-refunded {
  background: #f9f0ff;
  color: #722ed1;
}

.order-content {
  margin: 20rpx 0;
  padding: 20rpx 0;
  border-top: 1rpx solid #f0f0f0;
  border-bottom: 1rpx solid #f0f0f0;
}

.order-detail-item {
  display: flex;
  margin-bottom: 12rpx;
  font-size: 28rpx;
}

.order-detail-item:last-child {
  margin-bottom: 0;
}

.detail-label {
  color: #999;
  margin-right: 12rpx;
  min-width: 100rpx;
}

.detail-value {
  color: #333;
  flex: 1;
}

.order-footer {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding-top: 20rpx;
  font-size: 24rpx;
  color: #999;
}

.order-time {
  font-size: 24rpx;
  color: #999;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80rpx 0;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
}

.modal-content {
  position: relative;
  width: 90%;
  max-width: 700rpx;
  background: white;
  border-radius: 24rpx;
  overflow: hidden;
  z-index: 10000;
}

.video-modal {
  max-width: 800rpx;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 2rpx solid #f0f0f0;
  background: #fafafa;
}

.modal-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.modal-close {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  cursor: pointer;
}

.close-icon {
  font-size: 36rpx;
  color: #999;
  font-weight: 300;
}

.modal-body {
  height: 600rpx;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.video-body {
  height: 450rpx;
  background: #000;
}

.modal-image {
  width: 100%;
  height: 100%;
}

.modal-video {
  width: 100%;
  height: 100%;
}

.modal-footer {
  padding: 24rpx 32rpx;
  border-top: 2rpx solid #f0f0f0;
  background: #fafafa;
}

.media-source {
  font-size: 24rpx;
  color: #666;
  word-break: break-all;
}

.video-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  padding: 40rpx;
  border-radius: 20rpx;
  color: white;
  text-align: center;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-spinner {
  width: 40rpx;
  height: 40rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  border-top: 4rpx solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
}

.video-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.9);
  padding: 40rpx;
  border-radius: 20rpx;
  color: white;
  text-align: center;
  z-index: 10;
  min-width: 400rpx;
}

.error-icon {
  display: block;
  font-size: 60rpx;
  margin-bottom: 20rpx;
}

.error-text {
  display: block;
  font-size: 32rpx;
  margin-bottom: 16rpx;
  font-weight: 600;
}

.error-desc {
  display: block;
  font-size: 26rpx;
  margin-bottom: 10rpx;
  color: #ccc;
}

.error-solution {
  display: block;
  font-size: 26rpx;
  margin: 20rpx 0 10rpx;
  color: #ccc;
  text-align: left;
}

.solution-options {
  margin-top: 30rpx;
  width: 100%;
}

.solution-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12rpx;
  margin-bottom: 16rpx;
  cursor: pointer;
  transition: background 0.3s;
}

.solution-item:active {
  background: rgba(255, 255, 255, 0.2);
}

.solution-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
}

.solution-text {
  font-size: 28rpx;
  color: white;
  flex: 1;
}

@media (max-width: 480px) {
  .nav-container {
    padding: 20rpx 24rpx;
    gap: 16rpx;
  }
  
  .nav-btn {
    padding: 16rpx 28rpx;
    font-size: 26rpx;
  }
  
  .post-list {
    padding: 20rpx;
  }
  
  .post-item {
    padding: 24rpx;
  }
  
  .post-title {
    font-size: 32rpx;
  }
}
</style>