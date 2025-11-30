<template>
  <view class="container">
    <!-- 顶部导航 -->
    <view class="header">
      <view class="back-btn" @click="goBack">←</view>
      <view class="header-title">用户主页</view>
      <view class="header-actions">
        <view class="share-btn" @click="shareUser">分享</view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <view class="loading-spinner"></view>
      <text>加载中...</text>
    </view>

    <!-- 用户头部信息 -->
    <view class="user-profile" v-else-if="user">
      <view class="profile-main">
        <view class="avatar-section">
          <view class="user-avatar">{{ user.name.charAt(0) }}</view>
          <view class="online-badge"></view>
        </view>
        <view class="basic-info">
          <view class="name-section">
            <view class="name-left">
              <text class="user-name">{{ user.name }}</text>
              <text class="cert-badge">官方认证</text>
            </view>
            <button class="follow-btn" :class="{ followed: isFollowed }" @click="toggleFollow">
              {{ isFollowed ? '已关注' : '+ 关注' }}
            </button>
          </view>
          <view class="stats-row">
            <view class="stat-item">
              <text class="stat-number">{{ getFollowCount(user.followers) }}</text>
              <text class="stat-label">关注</text>
            </view>
            <view class="stat-item">
              <text class="stat-number">{{ user.projects }}</text>
              <text class="stat-label">案例</text>
            </view>
            <view class="stat-item">
              <text class="stat-number">{{ user.rating }}</text>
              <text class="stat-label">评分</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 用户简介 -->
      <view class="user-description">
        <text class="description-text">{{ user.description }}</text>
      </view>
    </view>

    <!-- 内容分类 -->
    <view class="content-tabs" v-if="user">
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'design' }" 
        @click="changeTab('design')"
      >
        设计师案例
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'supervision' }" 
        @click="changeTab('supervision')"
      >
        监工案例
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'shop' }" 
        @click="changeTab('shop')"
      >
        店铺
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'posts' }" 
        @click="changeTab('posts')"
      >
        用户帖子
      </view>
    </view>

    <!-- 设计师案例 -->
    <view class="content-section" v-if="user && activeTab === 'design'">
      <view class="section-header">
        <text class="section-title">设计师案例</text>
      </view>
      <view class="posts-grid">
        <view 
          class="post-card" 
          v-for="post in designCases" 
          :key="post.id"
          @click="viewPostDetail(post)"
        >
          <view class="post-image-placeholder">
            <text class="image-text">{{ post.title }}</text>
          </view>
          <view class="post-info">
            <text class="post-title">{{ post.title }}</text>
            <text class="post-specs">{{ post.specs }}</text>
            <view class="post-actions">
              <view class="like-btn" @click.stop="toggleLike(post)">
                <text class="like-icon" :class="{ liked: post.isLiked }">❤</text>
                <text class="like-count">{{ post.likes }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 监工案例 -->
    <view class="content-section" v-if="user && activeTab === 'supervision'">
      <view class="section-header">
        <text class="section-title">监工案例</text>
      </view>
      <view class="posts-grid">
        <view 
          class="post-card" 
          v-for="post in supervisionCases" 
          :key="post.id"
          @click="viewPostDetail(post)"
        >
          <view class="post-image-placeholder">
            <text class="image-text">{{ post.title }}</text>
          </view>
          <view class="post-info">
            <text class="post-title">{{ post.title }}</text>
            <text class="post-specs">{{ post.specs }}</text>
            <view class="post-actions">
              <view class="like-btn" @click.stop="toggleLike(post)">
                <text class="like-icon" :class="{ liked: post.isLiked }">❤</text>
                <text class="like-count">{{ post.likes }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 店铺 -->
    <view class="content-section" v-if="user && activeTab === 'shop'">
      <view class="section-header">
        <text class="section-title">店铺</text>
      </view>
      <view class="posts-grid">
        <view 
          class="post-card" 
          v-for="post in shopItems" 
          :key="post.id"
          @click="viewPostDetail(post)"
        >
          <view class="post-image-placeholder">
            <text class="image-text">{{ post.title }}</text>
          </view>
          <view class="post-info">
            <text class="post-title">{{ post.title }}</text>
            <text class="post-price">￥{{ post.price }}</text>
            <view class="post-actions">
              <view class="like-btn" @click.stop="toggleLike(post)">
                <text class="like-icon" :class="{ liked: post.isLiked }">❤</text>
                <text class="like-count">{{ post.likes }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 用户帖子 - 调用真实接口 -->
    <view class="content-section" v-if="user && activeTab === 'posts'">
      <view class="section-header">
        <text class="section-title">用户帖子</text>
        <view class="posts-count" v-if="userPosts.length > 0">
          共{{ userPosts.length }}篇
        </view>
      </view>
      
      <!-- 加载状态 -->
      <view class="loading-posts" v-if="loadingPosts">
        <view class="loading-spinner small"></view>
        <text>加载帖子中...</text>
      </view>
      
      <!-- 空状态 -->
      <view class="empty-posts" v-else-if="userPosts.length === 0">
        <view class="empty-icon">📝</view>
        <view class="empty-text">暂无帖子</view>
        <view class="empty-desc">该用户还没有发布任何帖子</view>
      </view>
      
      <!-- 帖子列表 -->
      <view class="posts-grid" v-else>
        <view 
          class="post-card" 
          v-for="post in userPosts" 
          :key="post.id"
          @click="viewPostDetail(post)"
        >
          <view class="post-image-placeholder">
            <text class="image-text">{{ post.title }}</text>
            <view class="post-category" v-if="post.category">
              {{ post.category }}
            </view>
          </view>
          <view class="post-info">
            <text class="post-title">{{ post.title }}</text>
            <text class="post-content">{{ post.content }}</text>
            <view class="post-meta">
              <text class="post-time" v-if="post.createTime">
                {{ formatTime(post.createTime) }}
              </text>
              <view class="post-actions">
                <view class="like-btn" @click.stop="toggleLike(post)">
                  <text class="like-icon" :class="{ liked: post.isLiked }">❤</text>
                  <text class="like-count">{{ post.likeCount || post.likes || 0 }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 加载更多 -->
      <view class="load-more" v-if="hasMorePosts && !loadingPosts">
        <button class="load-more-btn" @click="loadMorePosts">加载更多</button>
      </view>
    </view>

    <!-- 错误状态 -->
    <view class="error-state" v-else-if="!loading">
      <view class="error-icon">😕</view>
      <view class="error-text">用户信息加载失败</view>
      <button class="retry-btn" @click="loadUserDetail">重新加载</button>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-actions" v-if="user">
      <button class="contact-btn" @click="contactUser">联系用户</button>
    </view>
  </view>
</template>

<script>
// 模拟的用户数据
const mockUsers = {
  108: {
    id: 108,
    name: '设计达人',
    rating: 4.8,
    projects: 67,
    location: '北京',
    phone: '138****5678',
    experience: '6年',
    followers: '2.3k',
    style: '现代简约、北欧风格',
    description: '资深室内设计师，6年设计经验。专注于现代简约和北欧风格，擅长小户型空间优化和功能性设计。曾为多个知名楼盘提供设计服务，获得业主一致好评。'
  }
};

// API基础URL - 根据实际情况修改
const API_BASE_URL = 'http://localhost:8080';

export default {
  data() {
    return {
      userId: null,
      user: null,
      loading: true,
      isFollowed: false,
      activeTab: 'posts', // 默认显示用户帖子
      
      // 用户帖子相关
      userPosts: [],
      loadingPosts: false,
      postsPageNum: 1,
      postsPageSize: 10,
      hasMorePosts: true,
      
      // 模拟数据
      designCases: [
        {
          id: 1,
          title: '保利阅江台',
          specs: '160m²/现代简约/复式',
          likes: 240,
          isLiked: false
        },
        {
          id: 2,
          title: '龙湖天街',
          specs: '120m²/北欧风格/平层',
          likes: 189,
          isLiked: false
        }
      ],
      supervisionCases: [
        {
          id: 1,
          title: '施工现场记录',
          specs: '水电改造阶段',
          likes: 89,
          isLiked: false
        }
      ],
      shopItems: [
        {
          id: 1,
          title: '现代简约沙发',
          price: '2,800',
          likes: 156,
          isLiked: false
        }
      ]
    }
  },

  onLoad(options) {
    this.userId = options.id || 108; // 测试用户ID 108
    console.log('用户ID:', this.userId);
    this.loadUserDetail();
  },

  methods: {
    goBack() {
      uni.navigateBack();
    },

    async loadUserDetail() {
      this.loading = true;
      try {
        // 模拟API加载延迟
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // 使用模拟数据，实际项目中应该调用API
        this.user = mockUsers[this.userId];
        
        if (!this.user) {
          throw new Error('用户不存在');
        }
        
        console.log('加载的用户数据:', this.user);
        
        // 加载用户帖子
        this.loadUserPosts();
        
      } catch (error) {
        console.error('加载用户详情失败:', error);
        uni.showToast({
          title: '加载失败',
          icon: 'error'
        });
      } finally {
        this.loading = false;
      }
    },

    // 加载用户帖子列表 - 调用真实接口
    async loadUserPosts() {
      if (this.loadingPosts) return;
      
      this.loadingPosts = true;
      try {
        // 调用后端API获取用户帖子列表
        const res = await uni.request({
          url: `${API_BASE_URL}/api/community/posts/user/${this.userId}`,
          method: 'GET',
          data: {
            pageNum: this.postsPageNum,
            pageSize: this.postsPageSize
          },
          header: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('用户帖子API响应:', res);
        
        if (res.statusCode === 200 && res.data.success) {
          const data = res.data.data;
          const newPosts = data.records || data.list || [];
          
          // 映射数据到前端格式
          const mappedPosts = newPosts.map(post => ({
            id: post.id || post.threadId,
            title: post.title || '无标题',
            content: post.content || '暂无内容',
            likeCount: post.likeCount || 0,
            isLiked: post.hasLiked || false,
            createTime: post.createTime,
            category: post.category
          }));
          
          if (this.postsPageNum === 1) {
            this.userPosts = mappedPosts;
          } else {
            this.userPosts = [...this.userPosts, ...mappedPosts];
          }
          
          // 判断是否还有更多数据
          this.hasMorePosts = mappedPosts.length === this.postsPageSize;
          
        } else {
          console.warn('API返回异常:', res.data);
          // 使用模拟数据作为fallback
          this.useMockPosts();
        }
        
      } catch (error) {
        console.error('加载用户帖子失败:', error);
        // 网络错误时使用模拟数据
        this.useMockPosts();
        uni.showToast({
          title: '网络错误，使用演示数据',
          icon: 'none'
        });
      } finally {
        this.loadingPosts = false;
      }
    },

    // 使用模拟帖子数据
    useMockPosts() {
      const mockPosts = [
        {
          id: 1,
          title: '现代简约风格设计心得',
          content: '分享现代简约风格的设计理念和实践经验...',
          likeCount: 45,
          isLiked: false,
          createTime: '2024-01-15 10:30:00',
          category: '设计分享'
        },
        {
          id: 2,
          title: '小户型空间优化技巧',
          content: '如何在小户型中实现功能与美观的平衡...',
          likeCount: 78,
          isLiked: true,
          createTime: '2024-01-10 14:20:00',
          category: '经验分享'
        },
        {
          id: 3,
          title: '装修材料选购指南',
          content: '从环保性、耐用性、价格等多维度分析...',
          likeCount: 112,
          isLiked: false,
          createTime: '2024-01-05 09:15:00',
          category: '材料知识'
        }
      ];
      
      if (this.postsPageNum === 1) {
        this.userPosts = mockPosts;
      } else {
        this.userPosts = [...this.userPosts, ...mockPosts];
      }
      this.hasMorePosts = false;
    },

    // 加载更多帖子
    async loadMorePosts() {
      if (this.loadingPosts || !this.hasMorePosts) return;
      
      this.postsPageNum++;
      await this.loadUserPosts();
    },

    // 切换标签
    changeTab(tab) {
      this.activeTab = tab;
      if (tab === 'posts' && this.userPosts.length === 0) {
        this.postsPageNum = 1;
        this.loadUserPosts();
      }
    },

    getFollowCount(followers) {
      if (typeof followers === 'string' && followers.includes('k')) {
        return followers;
      }
      return parseInt(followers) || 0;
    },

    // 格式化时间
    formatTime(timeStr) {
      if (!timeStr) return '';
      // 简单格式化，实际项目中可以使用dayjs等库
      return timeStr.split(' ')[0];
    },

    toggleFollow() {
      this.isFollowed = !this.isFollowed;
      uni.showToast({
        title: this.isFollowed ? '关注成功' : '已取消关注',
        icon: 'success'
      });
    },

    shareUser() {
      uni.showShareMenu({
        withShareTicket: true
      });
    },

    // 点赞/取消点赞 - 调用真实接口
    async toggleLike(post) {
      try {
        const isLiking = !post.isLiked;
        const url = `${API_BASE_URL}/api/community/posts/${post.id}/like`;
        const method = isLiking ? 'POST' : 'DELETE';
        
        const res = await uni.request({
          url,
          method,
          header: {
            'Content-Type': 'application/json',
            // 实际项目中需要添加认证token
            // 'Authorization': 'Bearer ' + this.getToken()
          }
        });
        
        if (res.statusCode === 200 && res.data.success) {
          post.isLiked = isLiking;
          post.likeCount = isLiking ? (post.likeCount + 1) : Math.max(0, post.likeCount - 1);
          
          uni.showToast({
            title: isLiking ? '点赞成功' : '取消点赞',
            icon: 'success'
          });
        } else {
          uni.showToast({
            title: res.data.message || '操作失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('点赞操作失败:', error);
        // 模拟成功
        post.isLiked = !post.isLiked;
        post.likeCount = post.isLiked ? (post.likeCount + 1) : Math.max(0, post.likeCount - 1);
        uni.showToast({
          title: post.isLiked ? '点赞成功' : '取消点赞',
          icon: 'success'
        });
      }
    },

    viewPostDetail(post) {
      uni.showToast({
        title: `查看帖子: ${post.title}`,
        icon: 'none'
      });
      // 实际项目中可以跳转到帖子详情页
      // uni.navigateTo({
      //   url: `/pages/post/detail?id=${post.id}`
      // });
    },

    contactUser() {
      uni.showModal({
        title: '联系用户',
        content: `确定要联系 ${this.user.name} 吗？\n电话：${this.user.phone}`,
        success: (res) => {
          if (res.confirm) {
            uni.makePhoneCall({
              phoneNumber: this.user.phone.replace('****', '0000')
            });
          }
        }
      });
    }
  }
}
</script>

<style scoped>
/* 之前的样式保持不变，添加新样式 */

/* 帖子数量 */
.posts-count {
  font-size: 26rpx;
  color: #999;
}

/* 帖子加载状态 */
.loading-posts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
  color: #999;
}

.loading-spinner.small {
  width: 40rpx;
  height: 40rpx;
  margin-bottom: 16rpx;
}

/* 空状态 */
.empty-posts {
  text-align: center;
  padding: 80rpx 40rpx;
  color: #999;
}

.empty-posts .empty-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.empty-posts .empty-text {
  font-size: 28rpx;
  margin-bottom: 16rpx;
}

.empty-posts .empty-desc {
  font-size: 24rpx;
  color: #aaa;
}

/* 帖子元信息 */
.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16rpx;
}

.post-time {
  font-size: 22rpx;
  color: #999;
}

/* 帖子分类标签 */
.post-category {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  background: rgba(0, 122, 255, 0.9);
  color: white;
  padding: 6rpx 12rpx;
  border-radius: 12rpx;
  font-size: 20rpx;
}

/* 加载更多 */
.load-more {
  display: flex;
  justify-content: center;
  margin-top: 40rpx;
}

.load-more-btn {
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 30rpx;
  padding: 20rpx 60rpx;
  font-size: 26rpx;
}

/* 其他样式保持不变... */
</style>