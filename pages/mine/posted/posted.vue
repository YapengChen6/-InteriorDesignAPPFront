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
                  <text class="post-type" :class="`type-${post.threadType}`">
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
              <!-- 图片展示 -->
              <view class="media-container" v-if="post.mediaUrls && post.mediaUrls.length > 0">
                <view class="media-grid" :class="`grid-${Math.min(post.mediaUrls.length, 4)}`">
                  <view 
                    v-for="(mediaUrl, index) in post.mediaUrls" 
                    :key="index"
                    class="media-item"
                    @tap="previewImage(mediaUrl)"
                  >
                    <image 
                      :src="mediaUrl" 
                      mode="aspectFill"
                      class="media-image"
                    />
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
              
              <!-- 帖子信息 -->
              <view class="post-footer">
                <text class="post-time">{{ formatTime(post.createTime) }}</text>
                <text class="post-author">用户ID: {{ post.userId }}</text>
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
    <view class="modal" v-if="showModal">
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
            :src="currentImage" 
            mode="aspectFit"
            class="modal-image"
          />
        </view>
        
        <view class="modal-footer">
          <text class="image-source">来源: {{ currentImage }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getPostList, getPostDetail } from '@/api/community'

export default {
  data() {
    return {
      currentTab: 'posts',
      currentNav: 3, // 默认选中普通帖
      currentImage: '',
      showModal: false,
      navList: [
        { value: 1, label: '作品集' },
        { value: 2, label: '案例集' },
        { value: 3, label: '普通帖' },
        { value: 4, label: '材料展示' }
      ],
      posts: []
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
    this.loadPosts()
  },
  
  methods: {
    // 加载帖子列表
    async loadPosts() {
      try {
        const res = await getPostList()
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
    
    // 点击箭头时调用详情接口
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
    
    switchTab(tab) {
      this.currentTab = tab
    },
    
    switchNav(nav) {
      this.currentNav = nav
      // 收起所有展开的帖子
      this.posts.forEach(post => {
        post.expanded = false
      })
    },
    
    togglePost(postId) {
      const post = this.posts.find(p => p.id === postId)
      if (post) {
        // 收起其他帖子
        this.posts.forEach(p => {
          if (p.id !== postId) {
            p.expanded = false
          }
        })
        post.expanded = !post.expanded
      }
    },
    
    getTypeLabel(threadType) {
      const nav = this.navList.find(n => n.value === parseInt(threadType))
      return nav ? nav.label : '未知类型'
    },
    
    previewImage(imageUrl) {
      this.currentImage = imageUrl
      this.showModal = true
    },
    
    closeModal() {
      this.showModal = false
    },
    
    // 去除HTML标签（用于摘要显示）
    stripHtmlTags(html) {
      if (!html) return ''
      return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
    },
    
    // 解析富文本内容（适配uni-app的rich-text组件）
    parseRichContent(html) {
      if (!html) return ''
      
      // 基础HTML清理和适配
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
}

.media-image {
  width: 100%;
  height: 100%;
}

/* 富文本内容样式 */
.rich-content-container {
  margin-bottom: 24rpx;
}

.rich-text-content {
  font-size: 30rpx;
  line-height: 1.6;
  color: #333;
}

.rich-text-content >>> img {
  border-radius: 12rpx;
  margin: 16rpx 0;
}

.rich-text-content >>> p {
  margin: 16rpx 0;
  text-align: justify;
}

.rich-text-content >>> video {
  border-radius: 12rpx;
  margin: 16rpx 0;
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
  justify-content: space-between;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
  font-size: 24rpx;
  color: #999;
}

.post-time, .post-author {
  font-size: 24rpx;
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
}

.modal-image {
  width: 100%;
  height: 100%;
}

.modal-footer {
  padding: 24rpx 32rpx;
  border-top: 2rpx solid #f0f0f0;
  background: #fafafa;
}

.image-source {
  font-size: 24rpx;
  color: #666;
  word-break: break-all;
}
</style>