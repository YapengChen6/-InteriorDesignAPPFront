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
    
    <!-- 状态导航 -->
    <scroll-view class="status-nav" scroll-x="true" :show-scrollbar="false">
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
        <view v-if="currentTab === 'orders'" class="empty-state">
          <view class="empty-icon">📦</view>
          <text class="empty-title">订单列表</text>
          <text class="empty-desc">切换到订单视图，这里将显示订单相关内容</text>
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
                  <!-- 修复：使用计算属性 -->
                  <text class="post-type" :class="postTypeClasses[post.threadType]">
                    {{ typeLabels[post.threadType] }}
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
                <!-- 修复：使用计算属性 -->
                <view class="media-grid" :class="mediaGridClasses[Math.min(post.mediaUrls.length, 4)]">
                  <view 
                    v-for="(media, index) in post.mediaUrls" 
                    :key="index"
                    class="media-item"
                    @tap="handleMediaClick(media, index, post.mediaUrls)"
                  >
                    <!-- 图片显示 -->
                    <image 
                      v-if="mediaTypes[media.fileUrl || media] === 'image'"
                      :src="media.fileUrl || media" 
                      mode="aspectFill"
                      class="media-content"
                    />
                    <!-- 视频显示 - 只显示封面，不嵌入video组件 -->
                    <view 
                      v-else-if="mediaTypes[media.fileUrl || media] === 'video'"
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
                    <!-- 修复：使用计算属性 -->
                    <view class="media-type-tag" :class="mediaTagClasses[mediaTypes[media.fileUrl || media]]">
                      {{ mediaTypeTexts[mediaTypes[media.fileUrl || media]] }}
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
            <text class="empty-title">{{ currentNavLabel }}内容</text>
            <text class="empty-desc">当前没有{{ currentNavLabel }}相关的帖子</text>
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
export default {
  data() {
    return {
      currentTab: 'posts',
      currentNav: 'all',
      navList: [
        { label: '全部', value: 'all' },
        { label: '问答', value: 'question' },
        { label: '分享', value: 'share' },
        { label: '讨论', value: 'discuss' },
        { label: '动态', value: 'moment' }
      ],
      posts: [],
      showModal: false,
      currentMedia: '',
      currentMediaType: '',
      videoLoading: false,
      videoError: false,
      showDownloadOption: false,
      showCorsHelp: false,
      hasCorsSupport: false,
      errorTitle: '',
      errorDescription: '',
      
      // 静态映射表
      postTypeClasses: {
        1: 'type-1',
        2: 'type-2',
        3: 'type-3',
        4: 'type-4'
      },
      typeLabels: {
        1: '问答',
        2: '分享',
        3: '讨论',
        4: '动态'
      },
      mediaGridClasses: {
        1: 'grid-1',
        2: 'grid-2',
        3: 'grid-3',
        4: 'grid-4'
      },
      mediaTagClasses: {
        'image': 'media-type-image',
        'video': 'media-type-video',
        'other': 'media-type-other'
      },
      mediaTypeTexts: {
        'image': '图片',
        'video': '视频',
        'other': '文件'
      }
    }
  },
  
  computed: {
    filteredPosts() {
      if (this.currentNav === 'all') {
        return this.posts
      }
      const typeMap = {
        'question': 1,
        'share': 2,
        'discuss': 3,
        'moment': 4
      }
      const targetType = typeMap[this.currentNav]
      return this.posts.filter(post => post.threadType === targetType)
    },
    
    currentNavLabel() {
      const labelMap = {
        'all': '全部',
        'question': '问答',
        'share': '分享',
        'discuss': '讨论',
        'moment': '动态'
      }
      return labelMap[this.currentNav] || ''
    },
    
    // 媒体类型映射
    mediaTypes() {
      const types = {}
      
      // 处理所有帖子中的媒体URL
      this.posts.forEach(post => {
        if (post.mediaUrls) {
          post.mediaUrls.forEach(media => {
            const url = media.fileUrl || media
            if (this.isImageUrl(url)) {
              types[url] = 'image'
            } else if (this.isVideoUrl(url)) {
              types[url] = 'video'
            } else {
              types[url] = 'other'
            }
          })
        }
      })
      
      // 处理当前媒体
      if (this.currentMedia) {
        if (this.isImageUrl(this.currentMedia)) {
          types[this.currentMedia] = 'image'
        } else if (this.isVideoUrl(this.currentMedia)) {
          types[this.currentMedia] = 'video'
        } else {
          types[this.currentMedia] = 'other'
        }
      }
      
      return types
    }
  },
  
  onLoad() {
    this.loadPosts()
  },
  
  methods: {
    // 切换标签页
    switchTab(tab) {
      this.currentTab = tab
    },
    
    // 切换导航
    switchNav(nav) {
      this.currentNav = nav
    },
    
    // 检查是否为图片
    isImageUrl(url) {
      if (!url) return false
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
      return imageExtensions.some(ext => url.toLowerCase().includes(ext))
    },
    
    // 检查是否为视频
    isVideoUrl(url) {
      if (!url) return false
      const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm']
      return videoExtensions.some(ext => url.toLowerCase().includes(ext))
    },
    
    // 获取视频封面
    getVideoCover(videoUrl) {
      return '/static/video-cover.jpg'
    },
    
    // 切换帖子展开状态
    togglePost(postId) {
      const post = this.posts.find(p => p.id === postId)
      if (post) {
        post.expanded = !post.expanded
      }
    },
    
    // 切换帖子展开状态（带详情）
    togglePostWithDetail(postId) {
      this.togglePost(postId)
    },
    
    // 处理媒体点击
    handleMediaClick(media, index, mediaList) {
      const mediaUrl = media.fileUrl || media
      
      if (this.isImageUrl(mediaUrl)) {
        this.currentMedia = mediaUrl
        this.currentMediaType = 'image'
        this.showModal = true
      } else if (this.isVideoUrl(mediaUrl)) {
        this.currentMedia = mediaUrl
        this.currentMediaType = 'video'
        this.showModal = true
        this.videoLoading = true
        this.videoError = false
        this.showDownloadOption = false
      }
    },
    
    // 关闭模态框
    closeModal() {
      this.showModal = false
      this.currentMedia = ''
      this.currentMediaType = ''
      this.videoLoading = false
      this.videoError = false
      this.showDownloadOption = false
      this.showCorsHelp = false
    },
    
    // 视频错误处理
    onVideoError(e) {
      console.error('视频播放错误:', e)
      this.videoLoading = false
      this.videoError = true
      this.showDownloadOption = true
      this.errorTitle = '视频播放失败'
      this.errorDescription = '无法加载视频内容，可能是网络问题或视频格式不支持'
      
      if (this.isOSSUrl(this.currentMedia)) {
        this.showCorsHelp = true
        this.hasCorsSupport = false
      }
    },
    
    // 检查是否为OSS URL
    isOSSUrl(url) {
      return url && (url.includes('aliyuncs.com') || url.includes('oss-'))
    },
    
    // 视频播放事件
    onVideoPlay() {
      this.videoLoading = false
      this.videoError = false
    },
    
    // 视频加载元数据
    onVideoLoaded() {
      this.videoLoading = false
      if (this.isOSSUrl(this.currentMedia)) {
        this.hasCorsSupport = true
      }
    },
    
    // 视频开始加载
    onVideoLoadStart() {
      this.videoLoading = true
    },
    
    // 视频等待
    onVideoWaiting() {
      this.videoLoading = true
    },
    
    // 视频可以播放
    onVideoCanPlay() {
      this.videoLoading = false
    },
    
    // 视频加载进度
    onVideoProgress() {
      // 可以在这里处理加载进度
    },
    
    // 视频播放结束
    onVideoEnded() {
      // 视频播放结束处理
    },
    
    // 下载视频
    downloadVideo() {
      uni.showToast({
        title: '开始下载视频',
        icon: 'none'
      })
    },
    
    // 复制视频链接
    copyVideoLink() {
      uni.setClipboardData({
        data: this.currentMedia,
        success: () => {
          uni.showToast({
            title: '链接已复制',
            icon: 'success'
          })
        }
      })
    },
    
    // 在浏览器中打开
    openVideoInBrowser() {
      uni.showToast({
        title: '请在浏览器中打开链接',
        icon: 'none'
      })
    },
    
    // 重新尝试播放
    retryVideoPlay() {
      this.videoLoading = true
      this.videoError = false
      this.showDownloadOption = false
      this.showCorsHelp = false
    },
    
    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return ''
      
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      
      if (diff < 60 * 60 * 1000) {
        const minutes = Math.floor(diff / (60 * 1000))
        return minutes <= 0 ? '刚刚' : minutes + '分钟前'
      } else if (diff < 24 * 60 * 60 * 1000) {
        return Math.floor(diff / (60 * 60 * 1000)) + '小时前'
      } else if (date.getFullYear() === now.getFullYear()) {
        return (date.getMonth() + 1) + '月' + date.getDate() + '日'
      } else {
        return date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日'
      }
    },
    
    // 加载帖子数据
    async loadPosts() {
      try {
        this.posts = [
          {
            id: 1,
            title: '这是一个示例帖子标题',
            threadType: 1,
            viewCount: 100,
            likeCount: 20,
            commentCount: 5,
            content: '这是帖子的内容，当展开时会显示更多详细信息...',
            mediaUrls: [
              { fileUrl: 'https://example.com/image1.jpg' },
              { fileUrl: 'https://example.com/image2.jpg' }
            ],
            createTime: new Date().toISOString(),
            expanded: false
          },
          {
            id: 2,
            title: '另一个帖子示例',
            threadType: 2,
            viewCount: 50,
            likeCount: 10,
            commentCount: 3,
            content: '这是另一个帖子的内容描述...',
            mediaUrls: [
              { fileUrl: 'https://example.com/video.mp4' }
            ],
            createTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            expanded: false
          }
        ]
      } catch (error) {
        console.error('加载帖子失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      }
    }
  }
}
</script>