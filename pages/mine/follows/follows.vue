<template>
  <view class="container">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">
        <text class="iconfont icon-arrow-left">←</text>
      </view>
      <text class="nav-title">我的关注</text>
      <view class="nav-right"></view>
    </view>
    
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
          <view class="empty-icon">👥</view>
          <text class="empty-title">暂无关注</text>
          <text class="empty-desc">快去关注你感兴趣的用户吧~</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
import { getFollowings } from '@/api/social.js'
import { getPostList } from '@/api/community.js'
import { getUserProfile } from '@/api/users.js'

export default {
  name: 'FollowsPage',
  data() {
    return {
      postList: [],
      followingUsers: [],
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
    this.loadFollowedPosts()
  },
  
  onShow() {
    // 如果从详情页返回，刷新列表
    const needRefresh = uni.getStorageSync('followsNeedRefresh')
    if (needRefresh) {
      uni.removeStorageSync('followsNeedRefresh')
      this.pageParams.pageNum = 1
      this.postList = []
      this.loadFollowedPosts()
    }
  },
  
  methods: {
    // 返回上一页
    goBack() {
      uni.navigateBack()
    },
    
    // 加载关注用户的帖子
    async loadFollowedPosts() {
      if (this.loading) return
      
      try {
        this.loading = true
        
        // 首先获取关注的用户列表
        const followingsRes = await getFollowings({
          pageNum: 1,
          pageSize: 100 // 获取所有关注的用户
        })
        
        console.log('👥 关注用户列表响应:', followingsRes)
        
        if (followingsRes && followingsRes.code === 200) {
          let followings = []
          
          // 处理响应数据
          if (followingsRes.data) {
            if (followingsRes.data.rows && Array.isArray(followingsRes.data.rows)) {
              followings = followingsRes.data.rows
            } else if (followingsRes.data.list && Array.isArray(followingsRes.data.list)) {
              followings = followingsRes.data.list
            } else if (Array.isArray(followingsRes.data)) {
              followings = followingsRes.data
            }
          }
          
          this.followingUsers = followings
          
          if (followings.length === 0) {
            this.postList = []
            this.hasMore = false
            return
          }
          
          // 获取所有关注用户的ID
          const followedUserIds = followings.map(f => f.followedId || f.followed_id).filter(id => id)
          
          if (followedUserIds.length === 0) {
            this.postList = []
            this.hasMore = false
            return
          }
          
          // 获取这些用户发布的帖子
          // 由于API可能不支持批量查询多个用户的帖子，我们先获取所有关注用户的帖子
          // 这里可以优化为并行请求每个用户的帖子
          const allPosts = []
          
          // 尝试批量获取：通过多次请求合并结果
          for (const userId of followedUserIds) {
            try {
              const postsRes = await getPostList({
                userId: userId,
                pageNum: 1,
                pageSize: 10
              })
              
              if (postsRes && postsRes.code === 200) {
                let posts = []
                if (postsRes.data) {
                  if (postsRes.data.rows && Array.isArray(postsRes.data.rows)) {
                    posts = postsRes.data.rows
                  } else if (postsRes.data.list && Array.isArray(postsRes.data.list)) {
                    posts = postsRes.data.list
                  } else if (Array.isArray(postsRes.data)) {
                    posts = postsRes.data
                  }
                }
                allPosts.push(...posts)
              }
            } catch (error) {
              console.error(`获取用户 ${userId} 的帖子失败:`, error)
            }
          }
          
          // 按时间排序，最新的在前
          allPosts.sort((a, b) => {
            const timeA = new Date(a.createTime || a.create_time || 0).getTime()
            const timeB = new Date(b.createTime || b.create_time || 0).getTime()
            return timeB - timeA
          })
          
          // 处理分页
          const start = (this.pageParams.pageNum - 1) * this.pageParams.pageSize
          const end = start + this.pageParams.pageSize
          const pagedPosts = allPosts.slice(start, end)
          
          const processedPosts = this.processPostData(pagedPosts)
          
          if (this.pageParams.pageNum === 1) {
            this.postList = processedPosts
          } else {
            this.postList = [...this.postList, ...processedPosts]
          }
          
          this.total = allPosts.length
          this.hasMore = end < allPosts.length
          
        } else {
          throw new Error(followingsRes ? followingsRes.msg || followingsRes.message : '获取关注列表失败')
        }
        
      } catch (error) {
        console.error('❌ 加载关注帖子失败:', error)
        uni.showToast({
          title: error.msg || error.message || '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    // 处理帖子数据
    processPostData(posts) {
      if (!posts || !Array.isArray(posts)) {
        return []
      }
      
      return posts.map(post => ({
        id: post.id || post.thread_id,
        title: post.title || '无标题',
        content: post.content || '',
        author: this.getAuthorName(post),
        authorAvatar: post.avatar || post.authorAvatar,
        userId: post.userId || post.user_id,
        likeCount: post.likeCount || post.like_count || 0,
        commentCount: post.commentCount || post.comment_count || 0,
        viewCount: post.viewCount || post.view_count || 0,
        threadType: post.threadType || post.thread_type || 3,
        coverUrl: post.coverUrl || post.cover_url,
        mediaUrls: post.mediaUrls || post.media_urls || [],
        createTime: post.createTime || post.create_time
      }))
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
    
    // 加载更多
    loadMore() {
      if (this.loading || !this.hasMore) return
      this.pageParams.pageNum++
      this.loadFollowedPosts()
    },
    
    // 查看帖子详情
    viewPostDetail(postId) {
      uni.setStorageSync('followsNeedRefresh', true)
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

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-back {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: #333;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

.nav-right {
  width: 60rpx;
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

