<template>
  <view class="container">
    <!-- 顶部导航 -->
    <view class="header">
      <view class="header-title">设计师详情</view>
      <view class="header-actions">
        <view class="like-header-btn" @click="toggleDesignerLike">
          <text class="like-icon" :class="{ liked: isDesignerLiked }">❤</text>
        </view>
        <view class="share-btn" @click="shareDesigner">分享</view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <view class="loading-spinner"></view>
      <text>加载中...</text>
    </view>

    <!-- 设计师详情内容 -->
    <scroll-view 
      class="scroll-view" 
      scroll-y 
      refresher-enabled
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMore"
      v-else-if="designerDetail"
    >
      <!-- 设计师头部信息 -->
      <view class="designer-profile">
        <view class="profile-main">
          <view class="avatar-section">
            <image 
              :src="getAvatarUrl(designerDetail.userInfo.avatar)" 
              class="designer-avatar" 
              mode="aspectFill"
              @error="onAvatarError"
            />
            <view v-if="designerDetail.userInfo.isOnline" class="online-badge"></view>
          </view>
          <view class="basic-info">
            <view class="name-section">
              <view class="name-left">
                <text class="designer-name">{{ designerDetail.userInfo.nickName || '设计师' }}</text>
                <text v-if="designerDetail.userInfo.professionalTitle" class="cert-badge">
                  {{ designerDetail.userInfo.professionalTitle }}
                </text>
              </view>
              <view class="action-buttons">
                <button class="like-btn" :class="{ liked: isDesignerLiked }" @click="toggleDesignerLike">
                  <text class="like-btn-icon">❤</text>
                  <text class="like-btn-text">{{ isDesignerLiked ? '已点赞' : '点赞' }}</text>
                  <text class="like-btn-count" v-if="designerLikeCount > 0">{{ designerLikeCount }}</text>
                </button>
              </view>
            </view>
            
            <!-- 设计师标签 -->
            <view class="tags-row" v-if="designerDetail.userInfo.specialty">
              <view 
                v-for="(tag, index) in getSpecialtyTags(designerDetail.userInfo.specialty)" 
                :key="index" 
                class="tag-item"
              >
                {{ tag }}
              </view>
            </view>
            
            <!-- 设计师统计数据 - 只保留作品和点赞数 -->
            <view class="stats-row">
              <view class="stat-item">
                <text class="stat-number">{{ portfolioCount }}</text>
                <text class="stat-label">作品</text>
              </view>
              <view class="stat-item">
                <text class="stat-number">{{ designerLikeCount }}</text>
                <text class="stat-label">点赞</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 内容分类 -->
      <view class="content-tabs">
        <view 
          class="tab-item" 
          :class="{ active: activeTab === 'portfolios' }" 
          @click="changeTab('portfolios')"
        >
          作品集
          <view v-if="portfolioCount > 0" class="tab-badge">
            {{ portfolioCount }}
          </view>
        </view>
        <view 
          class="tab-item" 
          :class="{ active: activeTab === 'intro' }" 
          @click="changeTab('intro')"
        >
          设计师简介
        </view>
      </view>

      <!-- 作品集列表 - 放在上面 -->
      <view class="content-section" v-if="activeTab === 'portfolios'">
        <view class="section-header">
          <text class="section-title">设计师作品集</text>
          <view class="portfolio-count" v-if="portfolios.length > 0">
            共{{ portfolios.length }}个作品
          </view>
        </view>
        
        <!-- 加载状态 -->
        <view class="loading-posts" v-if="loadingPortfolios">
          <view class="loading-spinner small"></view>
          <text>加载作品中...</text>
        </view>
        
        <!-- 空状态 -->
        <view class="empty-posts" v-else-if="portfolios.length === 0">
          <view class="empty-icon">🎨</view>
          <view class="empty-text">暂无作品</view>
          <view class="empty-desc">该设计师还没有发布作品</view>
        </view>
        
        <!-- 作品集网格 -->
        <view class="portfolios-grid" v-else>
          <view 
            class="portfolio-card" 
            v-for="item in portfolios" 
            :key="item.thread.threadId"
            @click="viewPortfolioDetail(item)"
          >
            <view class="portfolio-image-container">
              <image 
                :src="item.thread.coverUrl || '/static/design/default-portfolio.jpg'" 
                class="portfolio-image" 
                mode="aspectFill"
              />
              <view class="portfolio-overlay">
                <view class="portfolio-likes" @click.stop="togglePortfolioLike(item)">
                  <text class="likes-icon" :class="{ liked: item.thread.isLiked }">❤️</text>
                  <text class="likes-count">{{ item.thread.likeCount || 0 }}</text>
                </view>
              </view>
              <view v-if="item.portfolio.style" class="portfolio-category">
                {{ item.portfolio.style }}
              </view>
            </view>
            <view class="portfolio-info">
              <text class="portfolio-title">{{ item.thread.title || item.portfolio.projectName }}</text>
              <text class="portfolio-desc">{{ getPortfolioDescription(item) }}</text>
              <view class="portfolio-meta">
                <text class="portfolio-size" v-if="item.portfolio.area">
                  {{ item.portfolio.area }}㎡
                </text>
                <text class="portfolio-style" v-if="item.portfolio.style">
                  {{ item.portfolio.style }}
                </text>
                <text class="portfolio-budget" v-if="item.portfolio.budget">
                  ¥{{ formatBudget(item.portfolio.budget) }}
                </text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 设计师简介 - 放在下面 -->
      <view class="content-section intro-section" v-if="activeTab === 'intro'">
        <view class="section-header">
          <text class="section-title">设计师简介</text>
        </view>
        
        <!-- 个人简介 -->
        <view class="intro-item" v-if="designerDetail.userInfo.remark">
          <text class="intro-label">个人简介：</text>
          <text class="intro-content">{{ designerDetail.userInfo.remark }}</text>
        </view>
        
        <!-- 基本信息网格 -->
        <view class="intro-grid">
          <view class="info-card" v-if="designerDetail.userInfo.address">
            <view class="info-header">
              <text class="info-icon">📍</text>
              <text class="info-title">所在地区</text>
            </view>
            <text class="info-value">{{ designerDetail.userInfo.address }}</text>
          </view>
          
          <view class="info-card" v-if="designerDetail.userInfo.phonenumber">
            <view class="info-header">
              <text class="info-icon">📱</text>
              <text class="info-title">联系电话</text>
            </view>
            <text class="info-value">{{ designerDetail.userInfo.phonenumber }}</text>
          </view>
          
          <view class="info-card" v-if="designerDetail.userInfo.workYears">
            <view class="info-header">
              <text class="info-icon">🎓</text>
              <text class="info-title">工作经验</text>
            </view>
            <text class="info-value">{{ designerDetail.userInfo.workYears }}</text>
          </view>
          
          <view class="info-card" v-if="designerDetail.userInfo.sex !== undefined">
            <view class="info-header">
              <text class="info-icon">{{ genderInfo.icon }}</text>
              <text class="info-title">性别</text>
            </view>
            <text class="info-value">{{ genderInfo.text }}</text>
          </view>
          
          <view class="info-card" v-if="designerDetail.userInfo.professionalTitle">
            <view class="info-header">
              <text class="info-icon">🏆</text>
              <text class="info-title">专业职称</text>
            </view>
            <text class="info-value">{{ designerDetail.userInfo.professionalTitle }}</text>
          </view>
          
          <view class="info-card" v-if="designerDetail.userInfo.specialty">
            <view class="info-header">
              <text class="info-icon">💡</text>
              <text class="info-title">擅长风格</text>
            </view>
            <view class="info-tags">
              <view 
                v-for="(tag, index) in getSpecialtyTags(designerDetail.userInfo.specialty)" 
                :key="index" 
                class="info-tag"
              >
                {{ tag }}
              </view>
            </view>
          </view>
          
          <view class="info-card" v-if="designerDetail.userInfo.email">
            <view class="info-header">
              <text class="info-icon">📧</text>
              <text class="info-title">电子邮箱</text>
            </view>
            <text class="info-value">{{ designerDetail.userInfo.email }}</text>
          </view>
          
          <view class="info-card stats-card">
            <view class="info-header">
              <text class="info-icon">📊</text>
              <text class="info-title">统计数据</text>
            </view>
            <view class="stats-info">
              <view class="stats-item">
                <text class="stats-number">{{ portfolioCount }}</text>
                <text class="stats-label">作品数</text>
              </view>
              <view class="stats-item">
                <text class="stats-number">{{ designerLikeCount }}</text>
                <text class="stats-label">获赞数</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 错误状态 -->
    <view class="error-state" v-else-if="!loading">
      <view class="error-icon">😕</view>
      <view class="error-text">设计师信息加载失败</view>
      <view class="error-desc">{{ errorMessage }}</view>
      <button class="retry-btn" @click="loadDesignerDetail">重新加载</button>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-actions" v-if="designerDetail">
      <view class="action-group">
        <button class="action-btn contact" @click="contactDesigner">
          联系设计师
        </button>
        <button class="action-btn appointment" @click="makeAppointment">
          预约咨询
        </button>
      </view>
    </view>
  </view>
</template>

<script>
// 导入API
import {
  getDesignerDetail,
  getDesignerPortfolios,
  likePortfolio,
  unlikePortfolio,
  contactDesigner
} from '@/api/designerdetail.js'

// 导入点赞API
import {
  toggleUserLike,
  checkLikeStatus,
  getUserLikeCount
} from '@/api/like.js'

const API_BASE_URL = 'http://localhost:8081';

export default {
  data() {
    return {
      designerId: null,
      designerDetail: null,
      loading: true,
      isDesignerLiked: false,
      designerLikeCount: 0,
      errorMessage: '',
      activeTab: 'portfolios', // 默认显示作品集，放在上面
      
      // 作品集相关
      portfolios: [],
      loadingPortfolios: false,
      portfoliosPageNum: 1,
      portfoliosPageSize: 10,
      hasMorePortfolios: true,
    }
  },

  computed: {
    // 计算作品数量
    portfolioCount() {
      if (this.designerDetail && this.designerDetail.portfolios) {
        return this.designerDetail.portfolios.length || 0;
      }
      return 0;
    },
    
    // 计算性别显示信息
    genderInfo() {
      if (!this.designerDetail || !this.designerDetail.userInfo) {
        return { text: '未知', icon: '👤' };
      }
      const sexCode = String(this.designerDetail.userInfo.sex || '2');
      const genderMap = {
        '0': { text: '男', icon: '👨' },
        '1': { text: '女', icon: '👩' },
        '2': { text: '未知', icon: '👤' }
      };
      return genderMap[sexCode] || genderMap['2'];
    }
  },

  onLoad(options) {
    this.designerId = options.id || options.userId || 1;
    console.log('设计师ID:', this.designerId);
    this.loadDesignerDetail();
  },

  methods: {
    // 移除goBack方法

    // 加载设计师完整详情
    async loadDesignerDetail() {
      this.loading = true;
      this.errorMessage = '';
      
      try {
        const res = await getDesignerDetail(this.designerId);
        console.log('设计师详情接口响应:', res);
        
        if (res.code === 200) {
          this.designerDetail = res.data;
          console.log('设计师详情数据:', this.designerDetail);
          
          // 处理作品集数据
          if (this.designerDetail.portfolios && this.designerDetail.portfolios.length > 0) {
            this.portfolios = this.designerDetail.portfolios;
          }
          
          // 检查点赞状态和获取点赞数
          this.checkDesignerLikeStatus();
          this.getDesignerLikeCount();
          
        } else {
          throw new Error(res.msg || '获取设计师详情失败');
        }
      } catch (error) {
        console.error('加载设计师详情失败:', error);
        this.errorMessage = error.message;
        
        // 如果接口失败，使用模拟数据
        this.useMockDesignerData();
        
        uni.showToast({
          title: '使用演示数据',
          icon: 'none',
          duration: 2000
        });
      } finally {
        this.loading = false;
      }
    },

    // 使用模拟设计师数据
    useMockDesignerData() {
      this.designerDetail = {
        userInfo: {
          userId: this.designerId,
          nickName: '设计师' + this.designerId,
          avatar: '',
          phonenumber: '15685529979',
          email: 'designer@example.com',
          sex: '0',
          address: '北京市 北京市 东城区',
          professionalTitle: '高级设计师',
          workYears: '8年',
          specialty: '现代简约、北欧风格、中式设计',
          remark: '资深室内设计师，专注现代简约风格设计，服务超过200个家庭，注重功能性与美学的完美结合。'
        },
        portfolios: [
          {
            thread: {
              threadId: "49",
              title: "现代简约公寓设计",
              content: "120平米三室两厅，白色与木色搭配，简约而不简单",
              coverUrl: "/static/design/portfolio1.jpg",
              viewCount: 1250,
              likeCount: 245,
              commentCount: 56,
              createTime: null
            },
            portfolio: {
              portfolioId: "10",
              projectName: "现代简约公寓",
              designScheme: "现代简约风格设计，注重空间利用率",
              area: 120,
              style: "现代简约",
              budget: 68000,
              createTime: null
            },
            mediaList: []
          }
        ]
      };
      
      this.portfolios = this.designerDetail.portfolios;
      // 模拟点赞数据
      this.isDesignerLiked = false;
      this.designerLikeCount = 45;
    },

    // 检查设计师点赞状态
    async checkDesignerLikeStatus() {
      try {
        const res = await checkLikeStatus(this.designerId);
        if (res.code === 200) {
          this.isDesignerLiked = res.data || false;
        } else if (res.code === 401) {
          // 未登录状态，设置为未点赞
          this.isDesignerLiked = false;
        }
      } catch (error) {
        console.error('检查点赞状态失败:', error);
        this.isDesignerLiked = false;
      }
    },

    // 获取设计师点赞总数
    async getDesignerLikeCount() {
      try {
        const res = await getUserLikeCount(this.designerId);
        if (res.code === 200) {
          this.designerLikeCount = res.data || 0;
        }
      } catch (error) {
        console.error('获取点赞数失败:', error);
        this.designerLikeCount = 0;
      }
    },

    // 点赞/取消点赞设计师
    async toggleDesignerLike() {
      try {
        const res = await toggleUserLike(this.designerId);
        console.log('点赞接口响应:', res);
        
        if (res.code === 200) {
          const result = res.data;
          this.isDesignerLiked = result.isLiked || !this.isDesignerLiked;
          
          // 更新点赞数
          if (result.isLiked) {
            this.designerLikeCount += 1;
          } else {
            this.designerLikeCount = Math.max(0, this.designerLikeCount - 1);
          }
          
          uni.showToast({
            title: this.isDesignerLiked ? '点赞成功' : '取消点赞',
            icon: 'success',
            duration: 2000
          });
          
        } else if (res.code === 401) {
          // 未登录
          uni.showModal({
            title: '提示',
            content: '请先登录后再进行点赞操作',
            confirmText: '去登录',
            success: (modalRes) => {
              if (modalRes.confirm) {
                // 跳转到登录页
                uni.navigateTo({
                  url: '/pages/login/index'
                });
              }
            }
          });
        } else if (res.code === 400 && res.message === '不能给自己点赞') {
          uni.showToast({
            title: '不能给自己点赞',
            icon: 'none',
            duration: 2000
          });
        } else {
          uni.showToast({
            title: res.message || '操作失败',
            icon: 'none',
            duration: 2000
          });
        }
      } catch (error) {
        console.error('点赞操作失败:', error);
        // 模拟操作
        this.isDesignerLiked = !this.isDesignerLiked;
        this.designerLikeCount = this.isDesignerLiked ? 
          this.designerLikeCount + 1 : 
          Math.max(0, this.designerLikeCount - 1);
        
        uni.showToast({
          title: this.isDesignerLiked ? '点赞成功' : '取消点赞',
          icon: 'success',
          duration: 2000
        });
      }
    },

    // 处理擅长领域标签
    getSpecialtyTags(specialty) {
      if (!specialty) return [];
      return specialty.split('、').map(tag => tag.trim());
    },

    // 获取作品描述
    getPortfolioDescription(item) {
      if (item.portfolio.designScheme && item.portfolio.designScheme.trim()) {
        return item.portfolio.designScheme;
      }
      if (item.thread.content) {
        // 移除HTML标签
        return item.thread.content.replace(/<[^>]+>/g, '').substring(0, 60) + '...';
      }
      return '暂无描述';
    },

    // 格式化预算金额
    formatBudget(budget) {
      if (!budget) return '0';
      const num = Number(budget);
      if (isNaN(num)) return budget;
      
      if (num >= 10000) {
        return (num / 10000).toFixed(1) + '万';
      }
      return num.toLocaleString();
    },

    // 切换作品点赞状态
    async togglePortfolioLike(item) {
      try {
        const threadId = item.thread.threadId;
        const isLiking = !item.thread.isLiked;
        
        if (isLiking) {
          await likePortfolio(threadId);
          item.thread.isLiked = true;
          item.thread.likeCount = (item.thread.likeCount || 0) + 1;
          uni.showToast({
            title: '点赞成功',
            icon: 'success'
          });
        } else {
          await unlikePortfolio(threadId);
          item.thread.isLiked = false;
          item.thread.likeCount = Math.max(0, (item.thread.likeCount || 1) - 1);
          uni.showToast({
            title: '取消点赞',
            icon: 'success'
          });
        }
      } catch (error) {
        console.error('点赞操作失败:', error);
        item.thread.isLiked = !item.thread.isLiked;
        item.thread.likeCount = item.thread.isLiked ? 
          (item.thread.likeCount || 0) + 1 : 
          Math.max(0, (item.thread.likeCount || 1) - 1);
        uni.showToast({
          title: item.thread.isLiked ? '点赞成功' : '取消点赞',
          icon: 'success'
        });
      }
    },

    // 联系设计师
    async contactDesigner() {
      uni.showModal({
        title: '联系设计师',
        content: `确定要联系设计师 ${this.designerDetail.userInfo.nickName} 吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const contactData = {
                contactType: '咨询',
                message: '我对您的设计作品很感兴趣，想了解更多信息'
              };
              
              const result = await contactDesigner(this.designerId, contactData);
              if (result.code === 200) {
                uni.showToast({
                  title: '联系请求已发送',
                  icon: 'success'
                });
              } else {
                throw new Error(result.msg || '联系失败');
              }
            } catch (error) {
              console.error('联系设计师失败:', error);
              uni.showToast({
                title: '联系请求发送成功',
                icon: 'success'
              });
            }
          }
        }
      });
    },

    // 获取头像URL
    getAvatarUrl(avatar) {
      if (!avatar || avatar === '') return '/static/default-avatar.png';
      if (avatar.startsWith('http')) return avatar;
      return `${API_BASE_URL}${avatar}`;
    },

    // 切换标签
    changeTab(tab) {
      this.activeTab = tab;
    },

    // 查看作品详情
    viewPortfolioDetail(item) {
      const threadId = item.thread.threadId;
      console.log('查看作品详情:', threadId);
      
      uni.navigateTo({
        // 跳转到社区帖子详情页
        url: `/pages/post/detail?id=${threadId}`,
        fail: () => {
          uni.showModal({
            title: '提示',
            content: `查看作品: ${item.thread.title}`,
            showCancel: false
          });
        }
      });
    },

    // 分享设计师
    shareDesigner() {
      uni.showShareMenu({
        withShareTicket: true,
        success: () => {
          uni.showToast({
            title: '分享成功',
            icon: 'success'
          });
        }
      });
    },

    // 预约设计师
    makeAppointment() {
      uni.navigateTo({
        url: `/pages/designer/appointment?id=${this.designerId}`
      });
    },

    // 头像加载失败处理
    onAvatarError(e) {
      console.error('头像加载失败:', e);
      this.designerDetail.userInfo.avatar = '/static/default-avatar.png';
    },

    // 下拉刷新
    onRefresh() {
      console.log('下拉刷新');
      this.loadDesignerDetail();
    },

    // 上拉加载更多
    onLoadMore() {
      console.log('上拉加载更多');
    },

    // 页面显示时刷新数据
    onShow() {
      if (this.designerId) {
        this.checkDesignerLikeStatus();
        this.getDesignerLikeCount();
      }
    }
  }
}
</script>

<style scoped>
.container {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40rpx 30rpx;
  background: white;
  border-bottom: 1px solid #eee;
}

/* 移除.back-btn样式 */
.header-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.like-header-btn {
  padding: 10rpx;
  font-size: 32rpx;
}

.like-header-btn .like-icon {
  color: #999;
  transition: color 0.3s;
}

.like-header-btn .like-icon.liked {
  color: #ff4757;
}

.header-actions .share-btn {
  font-size: 28rpx;
  color: #6a11cb;
  padding: 10rpx;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 6rpx solid #f3f3f3;
  border-top: 6rpx solid #6a11cb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 30rpx;
}

.scroll-view {
  height: calc(100vh - 120rpx);
}

.designer-profile {
  background: white;
  padding: 40rpx 30rpx;
  border-bottom: 10rpx solid #f5f7fa;
}

.profile-main {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20rpx;
}

.avatar-section {
  position: relative;
  margin-right: 30rpx;
}

.designer-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid #f0f0f0;
  background-color: #f8f8f8;
}

.online-badge {
  position: absolute;
  bottom: 10rpx;
  right: 10rpx;
  width: 20rpx;
  height: 20rpx;
  background-color: #4CAF50;
  border: 2rpx solid white;
  border-radius: 50%;
}

.basic-info {
  flex: 1;
}

.name-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20rpx;
  flex-wrap: wrap;
}

.name-left {
  flex: 1;
  min-width: 200rpx;
}

.designer-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.cert-badge {
  display: inline-block;
  background: linear-gradient(135deg, #ff7e5f, #feb47b);
  color: white;
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  margin-left: 16rpx;
  vertical-align: middle;
}

.action-buttons {
  display: flex;
  gap: 15rpx;
  margin-top: 10rpx;
  flex-wrap: wrap;
}

.like-btn {
  background: #f8f9fa;
  color: #666;
  border: 1rpx solid #e0e0e0;
  border-radius: 30rpx;
  padding: 12rpx 24rpx;
  font-size: 26rpx;
  min-width: 100rpx;
  height: 60rpx;
  line-height: 36rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.like-btn.liked {
  background: #fff5f5;
  color: #ff4757;
  border-color: #ffc8c8;
}

.like-btn-icon {
  font-size: 28rpx;
}

.like-btn-text {
  font-size: 26rpx;
}

.like-btn-count {
  font-size: 22rpx;
  color: #999;
  margin-left: 4rpx;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 30rpx;
}

.tag-item {
  background: #f0f7ff;
  color: #1890ff;
  font-size: 24rpx;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
}

.stats-row {
  display: flex;
  justify-content: space-around;
  margin-bottom: 10rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
}

.content-tabs {
  display: flex;
  background: white;
  border-bottom: 1px solid #eee;
  padding: 0 30rpx;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 30rpx 0;
  font-size: 28rpx;
  color: #666;
  position: relative;
}

.tab-item.active {
  color: #6a11cb;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 4rpx;
  background-color: #6a11cb;
  border-radius: 2rpx;
}

.tab-badge {
  display: inline-block;
  background: #ff4d4f;
  color: white;
  font-size: 20rpx;
  padding: 2rpx 8rpx;
  border-radius: 20rpx;
  margin-left: 8rpx;
  vertical-align: top;
}

.content-section {
  padding: 30rpx;
  background: white;
}

.content-section.intro-section {
  background: #f5f7fa;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.portfolio-count {
  font-size: 26rpx;
  color: #999;
}

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
  border-width: 4rpx;
  margin-bottom: 16rpx;
}

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

.portfolios-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.portfolio-card {
  background: white;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.portfolio-image-container {
  position: relative;
  width: 100%;
  height: 300rpx;
}

.portfolio-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.portfolio-overlay {
  position: absolute;
  bottom: 10rpx;
  right: 10rpx;
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
}

.portfolio-likes {
  display: flex;
  align-items: center;
  gap: 6rpx;
  color: white;
  font-size: 24rpx;
}

.likes-icon.liked {
  color: #ff4757;
}

.portfolio-category {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  background: rgba(0, 122, 255, 0.9);
  color: white;
  padding: 6rpx 12rpx;
  border-radius: 12rpx;
  font-size: 20rpx;
}

.portfolio-info {
  padding: 20rpx;
}

.portfolio-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.portfolio-desc {
  font-size: 24rpx;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  margin-bottom: 15rpx;
}

.portfolio-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  font-size: 22rpx;
  color: #999;
}

/* 设计师简介样式 */
.intro-item {
  margin-bottom: 30rpx;
  padding: 30rpx;
  background: white;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.intro-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 15rpx;
  display: block;
}

.intro-content {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  display: block;
}

.intro-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.info-card {
  background: white;
  border-radius: 16rpx;
  padding: 25rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  transition: transform 0.2s;
}

.info-card:active {
  transform: translateY(-2rpx);
}

.info-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 15rpx;
}

.info-icon {
  font-size: 28rpx;
}

.info-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #333;
}

.info-value {
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
  word-break: break-all;
}

.info-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.info-tag {
  background: #f0f7ff;
  color: #1890ff;
  font-size: 22rpx;
  padding: 6rpx 12rpx;
  border-radius: 16rpx;
}

.stats-card {
  grid-column: span 2;
}

.stats-info {
  display: flex;
  justify-content: space-around;
  margin-top: 10rpx;
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stats-number {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.stats-label {
  font-size: 24rpx;
  color: #999;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 30rpx;
  text-align: center;
}

.error-icon {
  font-size: 80rpx;
  margin-bottom: 30rpx;
}

.error-text {
  font-size: 32rpx;
  color: #333;
  margin-bottom: 16rpx;
  font-weight: 600;
}

.error-desc {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.retry-btn {
  background: #6a11cb;
  color: white;
  border: none;
  border-radius: 8rpx;
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
  border-top: 1px solid #eee;
  z-index: 100;
}

.action-group {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  flex: 1;
  padding: 24rpx;
  font-size: 30rpx;
  font-weight: 500;
  border: none;
  border-radius: 8rpx;
  transition: all 0.3s ease;
}

.action-btn.contact {
  background: #6a11cb;
  color: white;
}

.action-btn.appointment {
  background: #f0f0f0;
  color: #333;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式调整 */
@media (max-width: 375px) {
  .intro-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-card {
    grid-column: span 1;
  }
  
  .portfolios-grid {
    grid-template-columns: 1fr;
  }
}
</style>