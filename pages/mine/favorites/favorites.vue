<template>
  <view class="container">
    <!-- 内容区域 -->
    <view class="content-area">
      <scroll-view class="post-list" scroll-y="true" @scrolltolower="loadMore">
        <!-- 帖子列表 -->
        <view 
          v-for="post in postList" 
          :key="post.id"
          class="post-item"
          @tap="viewPostDetail(post.id)"
        >
          <!-- 帖子图片 -->
          <view class="post-image-container" v-if="post.coverUrl || (post.mediaUrls && post.mediaUrls.length > 0)">
            <image 
              :src="getPostImageUrl(post)" 
              mode="aspectFill" 
              class="post-image"
            ></image>
            <view 
              class="image-badge" 
              :class="postTypeClassMap[post.threadType] || 'normal-tag'"
            >
              {{ postTypeNameMap[post.threadType] || '帖子' }}
            </view>
            <view class="multi-image-indicator" v-if="post.mediaUrls && post.mediaUrls.length > 1">
              📷 {{ post.mediaUrls.length }}P
            </view>
          </view>
          
          <!-- 帖子内容 -->
          <view class="post-content">
            <text class="post-title">{{ post.title || '无标题' }}</text>
            
            <!-- 用户信息和互动数据 -->
            <view class="post-meta">
              <view class="user-info">
                <image 
                  :src="post.authorAvatar || '/static/images/default-avatar.png'" 
                  class="user-avatar"
                  mode="aspectFill"
                ></image>
                <text class="user-name">{{ post.author || '匿名用户' }}</text>
              </view>
              
              <view class="interaction-stats">
                <view class="stat-item">
                  <text class="stat-icon">❤️</text>
                  <text class="stat-count">{{ post.likeCount || 0 }}</text>
                </view>
                <view class="stat-item">
                  <text class="stat-icon">💬</text>
                  <text class="stat-count">{{ post.commentCount || 0 }}</text>
                </view>
              </view>
            </view>
            
            <!-- 收藏时间 -->
            <view class="favorite-time">
              <text class="time-text">收藏于 {{ formatTime(post.favoriteTime) }}</text>
            </view>
          </view>
        </view>
        
        <!-- 加载更多 -->
        <view class="load-more" v-if="hasMore && !loading" @tap="loadMore">
          <text>加载更多</text>
        </view>
        
        <!-- 加载中 -->
        <view class="load-more loading" v-if="loading">
          <text>加载中...</text>
        </view>
        
        <!-- 没有更多数据 -->
        <view class="no-more" v-if="!hasMore && postList.length > 0">
          <text>没有更多内容了</text>
        </view>
        
        <!-- 空状态 -->
        <view class="empty-state" v-if="!loading && postList.length === 0">
          <view class="empty-icon">⭐</view>
          <text class="empty-title">暂无收藏</text>
          <text class="empty-desc">快去收藏你喜欢的帖子吧~</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
import { getFavorites } from '@/api/social.js'
import { getPostDetail } from '@/api/community.js'

export default {
  name: 'FavoritesPage',
  data() {
    return {
      postList: [],
      loading: false,
      hasMore: true,
      pageParams: {
        pageNum: 1,
        pageSize: 10
      },
      total: 0,
      postTypeClassMap: {
        1: 'portfolio-tag',
        2: 'case-tag',
        3: 'normal-tag',
        4: 'material-tag'
      },
      postTypeNameMap: {
        1: '作品集',
        2: '案例集',
        3: '普通帖',
        4: '材料展示'
      }
    }
  },
  
  onLoad() {
    this.loadFavorites()
  },
  
  onShow() {
    // 如果从详情页返回，刷新列表
    const needRefresh = uni.getStorageSync('favoritesNeedRefresh')
    if (needRefresh) {
      uni.removeStorageSync('favoritesNeedRefresh')
      this.pageParams.pageNum = 1
      this.postList = []
      this.loadFavorites()
    }
  },
  
  methods: {
    // 加载收藏列表
    async loadFavorites() {
      if (this.loading) return
      
      try {
        this.loading = true
        
        const response = await getFavorites({
          pageNum: this.pageParams.pageNum,
          pageSize: this.pageParams.pageSize
        })
        
        console.log('📚 收藏列表响应:', response)
        
        if (response && response.code === 200) {
          let favorites = []
          let total = 0
          
          // 处理响应数据
          if (response.data) {
            if (response.data.rows && Array.isArray(response.data.rows)) {
              favorites = response.data.rows
              total = response.data.total || 0
            } else if (response.data.list && Array.isArray(response.data.list)) {
              favorites = response.data.list
              total = response.data.total || 0
            } else if (Array.isArray(response.data)) {
              favorites = response.data
              total = favorites.length
            }
          }
          
          // 获取每个收藏对应的帖子详情
          if (favorites.length > 0) {
            const postDetails = await Promise.allSettled(
              favorites.map(favorite => this.getPostDetailById(favorite.postId, favorite))
            )
            
            const posts = postDetails
              .filter(result => result.status === 'fulfilled' && result.value)
              .map(result => result.value)
            
            if (this.pageParams.pageNum === 1) {
              this.postList = posts
            } else {
              this.postList = [...this.postList, ...posts]
            }
          }
          
          this.total = total
          this.hasMore = this.postList.length < total && favorites.length === this.pageParams.pageSize
          
        } else {
          throw new Error(response ? response.msg || response.message : '获取收藏列表失败')
        }
        
      } catch (error) {
        console.error('❌ 加载收藏列表失败:', error)
        uni.showToast({
          title: error.msg || error.message || '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    // 根据帖子ID获取帖子详情
    async getPostDetailById(postId, favorite) {
      try {
        const response = await getPostDetail(postId)
        
        if (response && response.code === 200 && response.data) {
          const post = this.processPostData(response.data)
          // 添加收藏时间
          post.favoriteTime = favorite.createTime || favorite.create_time
          return post
        }
        
        return null
      } catch (error) {
        console.error(`获取帖子 ${postId} 详情失败:`, error)
        return null
      }
    },
    
    // 处理帖子数据
    processPostData(data) {
      if (!data) return null
      
      return {
        id: data.id || data.thread_id,
        title: data.title || '无标题',
        content: data.content || '',
        author: this.getAuthorName(data),
        authorAvatar: data.avatar || data.authorAvatar,
        userId: data.userId || data.user_id,
        likeCount: data.likeCount || data.like_count || 0,
        commentCount: data.commentCount || data.comment_count || 0,
        viewCount: data.viewCount || data.view_count || 0,
        threadType: data.threadType || data.thread_type || 3,
        coverUrl: data.coverUrl || data.cover_url,
        mediaUrls: data.mediaUrls || data.media_urls || [],
        createTime: data.createTime || data.create_time
      }
    },
    
    // 获取作者名称
    getAuthorName(data) {
      if (data.nickname || data.userName || data.author) {
        return data.nickname || data.userName || data.author
      }
      
      const roleType = data.roleType || data.role_type
      const roleNames = {
        1: '普通用户',
        2: '设计师',
        3: '监理',
        4: '材料商'
      }
      
      return roleNames[roleType] || '匿名用户'
    },
    
    // 获取帖子图片URL
    getPostImageUrl(post) {
      return post.coverUrl || (post.mediaUrls && post.mediaUrls[0]) || ''
    },
    
    // 获取帖子类型类名
    getPostTypeClass(threadType) {
      const typeMap = {
        1: 'portfolio-tag',
        2: 'case-tag',
        3: 'normal-tag',
        4: 'material-tag'
      }
      return typeMap[threadType] || 'normal-tag'
    },
    
    // 获取帖子类型名称
    getPostTypeName(threadType) {
      const typeMap = {
        1: '作品集',
        2: '案例集',
        3: '普通帖',
        4: '材料展示'
      }
      return typeMap[threadType] || '帖子'
    },
    
    // 格式化时间
    formatTime(dateString) {
      if (!dateString) return '未知时间'
      
      const date = new Date(dateString)
      const now = new Date()
      const diff = now - date
      
      if (diff < 60000) return '刚刚'
      if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
      if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
      
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },
    
    // 加载更多
    loadMore() {
      if (this.loading || !this.hasMore) return
      this.pageParams.pageNum++
      this.loadFavorites()
    },
    
    // 查看帖子详情
    viewPostDetail(postId) {
      uni.setStorageSync('favoritesNeedRefresh', true)
      uni.navigateTo({
        url: `/pages/post/detail?id=${postId}`
      })
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.content-area {
  flex: 1;
}

.post-list {
  height: calc(100vh - 120rpx);
  padding: 20rpx;
}

.post-item {
  background: #fff;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.post-image-container {
  position: relative;
  width: 100%;
  height: 400rpx;
  overflow: hidden;
}

.post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-badge {
  position: absolute;
  top: 16rpx;
  left: 16rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  color: white;
  background: rgba(0, 0, 0, 0.5);
}

.portfolio-tag {
  background: rgba(102, 126, 234, 0.8);
}

.case-tag {
  background: rgba(245, 87, 108, 0.8);
}

.material-tag {
  background: rgba(79, 172, 254, 0.8);
}

.normal-tag {
  background: rgba(67, 233, 123, 0.8);
}

.multi-image-indicator {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  color: white;
  background: rgba(0, 0, 0, 0.5);
}

.post-content {
  padding: 24rpx;
}

.post-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.post-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  margin-right: 12rpx;
}

.user-name {
  font-size: 26rpx;
  color: #666;
}

.interaction-stats {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.stat-icon {
  font-size: 28rpx;
}

.stat-count {
  font-size: 24rpx;
  color: #999;
}

.favorite-time {
  margin-top: 12rpx;
  padding-top: 12rpx;
  border-top: 1px solid #f0f0f0;
}

.time-text {
  font-size: 24rpx;
  color: #999;
}

.load-more {
  text-align: center;
  padding: 40rpx 0;
  color: #666;
  font-size: 28rpx;
}

.load-more.loading {
  color: #999;
}

.no-more {
  text-align: center;
  padding: 40rpx 0;
  color: #999;
  font-size: 24rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  text-align: center;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
  opacity: 0.5;
}

.empty-title {
  display: block;
  font-size: 32rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.empty-desc {
  display: block;
  font-size: 26rpx;
  color: #999;
}
</style>

