<template>
  <view class="container">
    <!-- 头部标题 -->
    <view class="header">
      <view class="page-title">寻找设计师</view>
      <view class="page-subtitle">专业设计师，评分真实可靠</view>
    </view>

    <!-- 搜索区域 -->
    <view class="search-section">
      <view class="search-box">
        <input
            type="text"
            class="search-input"
            placeholder="输入设计师姓名搜索"
            v-model="searchQuery"
            @input="onSearchInput"
        />
        <view class="search-icon-wrapper">
          <image 
            :src="'/static/images/搜索.svg'" 
            mode="aspectFit" 
            class="search-icon"
          ></image>
        </view>
        <view v-if="searchQuery" class="clear-icon" @tap="clearSearch">×</view>
      </view>
    </view>

    <!-- 排序按钮 -->
    <view class="sort-bar">
      <text class="sort-label">排序：</text>
      <view 
        class="sort-btn" 
        :class="{ active: sortBy === 'rating' }"
        @tap="sortByRating"
      >
        评分最高
        <text v-if="sortBy === 'rating'" class="sort-arrow">
          {{ sortOrder === 'desc' ? '↓' : '↑' }}
        </text>
      </view>
      <view 
        class="sort-btn" 
        :class="{ active: sortBy === 'cases' }"
        @tap="sortByCases"
      >
        案例最多
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="content-area">
      <!-- 加载状态 -->
      <view v-if="loading" class="loading">
        <view class="loading-spinner"></view>
        <view class="loading-text">加载中...</view>
        <view class="loading-desc">正在获取设计师数据和评分</view>
      </view>

      <!-- 错误状态 -->
      <view v-else-if="error" class="error">
        <view class="error-icon">⚠️</view>
        <view class="error-text">加载失败</view>
        <view class="error-desc">{{ error }}</view>
        <button class="retry-btn" @tap="loadDesigners">重新加载</button>
      </view>

      <!-- 无数据状态 -->
      <view v-else-if="displayDesigners.length === 0" class="no-data">
        <view class="no-data-icon">👥</view>
        <view class="no-data-text" v-if="searchQuery">未找到相关设计师</view>
        <view class="no-data-text" v-else>暂无设计师数据</view>
        <view class="no-data-desc">请尝试调整搜索条件</view>
        <button class="retry-btn" @tap="loadDesigners">重新加载</button>
      </view>

      <!-- 设计师列表 -->
      <view v-else class="designer-list">
        <view
            v-for="designer in displayDesigners"
            :key="designer.userId"
            class="designer-card"
            @tap="goToDesignerDetail(designer.userId)"
        >
          <view class="designer-header">
            <!-- 头像区域 -->
            <view class="avatar-wrapper" @tap.stop="viewAvatar(designer)">
              <image
                  :src="designer.avatar || defaultAvatar"
                  mode="aspectFill"
                  class="avatar"
                  @error="onAvatarError"
              ></image>
              <!-- 在线状态指示器 -->
              <OnlineStatusIndicator 
                :isOnline="designer.isOnline || false"
                :showText="false"
                size="small"
                class="online-status-overlay"
              />
              <!-- 评分徽章 -->
              <view v-if="designer.ratingLevel && designer.avgRating > 4" class="rating-badge">
                {{ designer.ratingLevel }}
              </view>
            </view>
            
            <!-- 设计师信息 -->
            <view class="designer-info">
              <!-- 姓名和评分 -->
              <view class="name-rating-row">
                <view class="designer-name">{{ designer.nickName || designer.userName || '设计师' }}</view>
                <view class="rating-display">
                  <view class="rating-score">
                    <text class="score">{{ designer.avgRating !== undefined ? designer.avgRating.toFixed(1) : '5.0' }}</text>
                    <text class="score-label">分</text>
                  </view>
                  <view class="rating-stars">
                    <view 
                      v-for="star in 5" 
                      :key="star"
                      :class="['star', { active: star <= Math.floor(designer.avgRating || 0) }]"
                    >
                      ★
                    </view>
                  </view>
                </view>
              </view>
              
              <!-- 评分详情 -->
              <view class="rating-details">
                <view class="rating-item">
                  <text class="rating-label">订单数：</text>
                  <text class="rating-value">{{ designer.totalOrders || 0 }}</text>
                </view>
                <view class="rating-item">
                  <text class="rating-label">已完成：</text>
                  <text class="rating-value">{{ designer.completedOrders || 0 }}</text>
                </view>
                <view class="rating-item">
                  <text class="rating-label">评价数：</text>
                  <text class="rating-value">{{ designer.totalRatingCount || 0 }}</text>
                </view>
              </view>
              
              <!-- 其他信息 -->
              <view class="designer-stats">
                <view class="stat-item">
                  <image :src="'/static/images/案例-2.svg'" mode="aspectFit" class="stat-icon-image"></image>
                  <view class="stat-value">{{ designer.caseCount || 0 }}套案例</view>
                </view>
                <view class="stat-item">
                  <image :src="'/static/images/地址.svg'" mode="aspectFit" class="stat-icon-image"></image>
                  <view class="stat-value">{{ designer.address || '全国' }}</view>
                </view>
              </view>
              
              <view class="designer-phone">
                <image :src="'/static/images/电话.svg'" mode="aspectFit" class="phone-icon"></image>
                <text class="phone-text">{{ designer.phone || '电话未提供' }}</text>
              </view>
            </view>
          </view>
          
          <!-- 操作按钮 -->
          <view class="action-buttons">
            <button class="contact-btn" @tap.stop="contactDesigner(designer)">
              在线咨询
            </button>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 提示框 -->
    <view v-if="showRatingTip" class="rating-tip">
      <text>💡 所有评分均来自真实订单评价</text>
    </view>
  </view>
</template>

<script>
import { getDesignerList } from "@/api/designer.js"
import { getUserProfile } from "@/api/users.js"
import { batchGetUserRatings } from "@/api/rating.js"
import { batchGetUserOnlineStatus } from "@/api/onlineStatus.js"
import { createConversationAndNavigate, isUserLoggedIn, handleNotLoggedIn } from "@/utils/conversationHelper.js"

export default {
  components: {
    OnlineStatusIndicator: () => import('@/components/OnlineStatusIndicator.vue')
  },
  data() {
    return {
      loading: true,
      error: null,
      searchQuery: '',
      allDesigners: [], // 原始设计师数据
      displayDesigners: [], // 处理后显示的设计师数据（包含评分）
      searchTimer: null,
      defaultAvatar: '/static/default-avatar.png',
      currentUserInfo: null,
      isLoadingUser: false,
      sortBy: 'rating', // 排序方式：rating-评分, cases-案例数
      sortOrder: 'desc', // 排序顺序：desc-降序, asc-升序
      showRatingTip: true,
      onlineStatusCache: {}, // 在线状态缓存
      onlineStatusCacheTime: null, // 缓存时间
      CACHE_DURATION: 30000, // 缓存持续时间30秒
      
      // 模拟数据（当API不可用时使用）
      mockRatings: {
        1: { avgRating: 4.8, ratingLevel: '金牌', totalOrders: 25, completedOrders: 22, totalRatingCount: 18 },
        2: { avgRating: 4.5, ratingLevel: '优秀', totalOrders: 18, completedOrders: 16, totalRatingCount: 12 },
        3: { avgRating: 4.2, ratingLevel: '良好', totalOrders: 12, completedOrders: 10, totalRatingCount: 8 },
        4: { avgRating: 4.7, ratingLevel: '优秀', totalOrders: 30, completedOrders: 28, totalRatingCount: 24 },
        5: { avgRating: 4.0, ratingLevel: '一般', totalOrders: 8, completedOrders: 6, totalRatingCount: 5 },
        6: { avgRating: 4.9, ratingLevel: '金牌', totalOrders: 35, completedOrders: 33, totalRatingCount: 30 }
      }
    }
  },
  computed: {
    // 过滤后的设计师列表
    filteredDesigners() {
      if (!this.searchQuery.trim()) {
        return this.displayDesigners;
      }

      const query = this.searchQuery.toLowerCase();
      return this.displayDesigners.filter(designer =>
          (designer.userName && designer.userName.toLowerCase().includes(query)) ||
          (designer.nickName && designer.nickName.toLowerCase().includes(query)) ||
          (designer.specialty && designer.specialty.toLowerCase().includes(query))
      );
    }
  },
  async onLoad() {
    // 先获取用户信息，再加载设计师列表
    await this.getCurrentUserInfo();
    this.loadDesigners();
    
    // 5秒后隐藏评分提示
    setTimeout(() => {
      this.showRatingTip = false;
    }, 5000);
  },
  onShow() {
    if (this.displayDesigners.length === 0) {
      this.loadDesigners();
    } else {
      // 如果缓存过期，刷新在线状态
      if (!this.isOnlineStatusCacheValid()) {
        this.loadDesignerOnlineStatus();
      }
    }
  },
  methods: {
    // 获取当前用户信息
    async getCurrentUserInfo() {
      if (this.isLoadingUser) return;
      
      this.isLoadingUser = true;
      try {
        const cachedUserInfo = uni.getStorageSync('userInfo');
        if (cachedUserInfo && cachedUserInfo.userId) {
          this.currentUserInfo = cachedUserInfo;
          console.log('✅ 从缓存获取用户信息');
        } else {
          const response = await getUserProfile();
          if (response.code === 200 && response.data) {
            this.currentUserInfo = response.data;
            uni.setStorageSync('userInfo', response.data);
          }
        }
      } catch (error) {
        console.error('❌ 获取用户信息异常:', error);
      } finally {
        this.isLoadingUser = false;
      }
    },
    
    // 加载设计师数据
    async loadDesigners() {
      try {
        this.loading = true;
        this.error = null;

        // 1. 获取设计师列表
        const response = await getDesignerList();
        console.log('👥 获取设计师列表响应:', response);

        if (response.code === 200) {
          const designers = response.data || [];
          this.allDesigners = this.formatDesignerData(designers);
          console.log('📋 格式化后的设计师数据:', this.allDesigners);
          
          // 2. 批量获取评分信息
          await this.loadDesignerRatings(designers);
          
          // 3. 批量获取在线状态
          await this.loadDesignerOnlineStatus();
        } else {
          throw new Error(response.msg || '获取设计师数据失败');
        }
      } catch (error) {
        console.error('加载设计师数据错误:', error);
        this.error = '加载失败: ' + error.message;
        this.useMockData();
      } finally {
        this.loading = false;
      }
    },
    
    // 加载设计师评分
    async loadDesignerRatings(designers) {
      try {
        // 提取设计师ID
        const designerIds = designers
          .filter(designer => designer.userId || designer.id)
          .map(designer => designer.userId || designer.id);
        
        console.log('🎯 需要获取评分的用户ID:', designerIds);
        
        if (designerIds.length === 0) {
          console.warn('⚠️ 没有找到有效的用户ID');
          return;
        }
        
        // 批量获取评分
        const ratingResponse = await batchGetUserRatings(designerIds);
        console.log('📊 评分API响应:', ratingResponse);
        
        if (ratingResponse.code === 200) {
          const ratingsMap = ratingResponse.data || {};
          console.log('📈 评分数据映射:', ratingsMap);
          
          // 将评分数据合并到设计师数据中
          this.displayDesigners = this.allDesigners.map(designer => {
            const userId = designer.userId;
            const ratingInfo = ratingsMap[userId] || this.mockRatings[userId] || {};
            
            return {
              ...designer,
              avgRating: ratingInfo.avgRating || 5.0,
              ratingLevel: ratingInfo.ratingLevel || '暂无评分',
              totalOrders: ratingInfo.totalOrders || 0,
              completedOrders: ratingInfo.completedOrders || 0,
              totalRatingCount: ratingInfo.totalRatingCount || 0
            };
          });
          
          // 默认按评分排序
          this.sortByRating();
          
        } else {
          console.warn('⚠️ 获取评分失败，使用模拟数据');
          this.useMockRatings();
        }
        
      } catch (error) {
        console.error('❌ 获取评分数据错误:', error);
        this.useMockRatings();
      }
    },
    
    // 使用模拟评分数据
    useMockRatings() {
      this.displayDesigners = this.allDesigners.map(designer => {
        const userId = designer.userId;
        const ratingInfo = this.mockRatings[userId] || {
          avgRating: 4.0 + Math.random() * 1.0,
          ratingLevel: ['优秀', '良好', '一般'][Math.floor(Math.random() * 3)],
          totalOrders: Math.floor(Math.random() * 20) + 5,
          completedOrders: Math.floor(Math.random() * 15) + 3,
          totalRatingCount: Math.floor(Math.random() * 10) + 2
        };
        
        return {
          ...designer,
          avgRating: ratingInfo.avgRating,
          ratingLevel: ratingInfo.ratingLevel,
          totalOrders: ratingInfo.totalOrders,
          completedOrders: ratingInfo.completedOrders,
          totalRatingCount: ratingInfo.totalRatingCount
        };
      });
      
      this.sortByRating();
    },
    
    // 使用模拟数据（备用方案）
    useMockData() {
      console.log('📦 使用模拟设计师数据');
      const mockDesigners = [
        { userId: 1, userName: '设计师张三', nickName: '张三', avatar: '', caseCount: 15, address: '北京' },
        { userId: 2, userName: '设计师李四', nickName: '李四', avatar: '', caseCount: 8, address: '上海' },
        { userId: 3, userName: '设计师王五', nickName: '王五', avatar: '', caseCount: 12, address: '广州' },
        { userId: 4, userName: '设计师赵六', nickName: '赵六', avatar: '', caseCount: 25, address: '深圳' },
        { userId: 5, userName: '设计师孙七', nickName: '孙七', avatar: '', caseCount: 5, address: '杭州' },
        { userId: 6, userName: '设计师周八', nickName: '周八', avatar: '', caseCount: 18, address: '成都' }
      ];
      
      this.allDesigners = this.formatDesignerData(mockDesigners);
      this.useMockRatings();
    },
    
    // 格式化设计师数据
    formatDesignerData(designers) {
      return designers.map(designer => ({
        userId: designer.userId || designer.id || 0,
        userName: designer.userName || '',
        nickName: designer.nickName || designer.userName || '设计师',
        avatar: designer.avatar || designer.avatarUrl || '',
        caseCount: designer.caseCount || designer.projectCount || designer.portfolioCount || 0,
        address: designer.address || designer.city || designer.location || '',
        city: designer.city || designer.location || '',
        phone: designer.phone || designer.phonenumber || designer.tel || '',
        specialty: designer.specialty || designer.style || designer.skills || '',
        experience: designer.experience || 0,
        isCertified: designer.isCertified || false,
        isOnline: designer.isOnline || false
      }));
    },
    
    // 搜索输入
    onSearchInput() {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        console.log('🔍 搜索关键词:', this.searchQuery);
      }, 300);
    },
    
    // 清除搜索
    clearSearch() {
      this.searchQuery = '';
    },
    
    // 按评分排序
    sortByRating() {
      this.sortBy = 'rating';
      this.sortOrder = 'desc';
      
      this.displayDesigners.sort((a, b) => {
        const ratingA = a.avgRating || 0;
        const ratingB = b.avgRating || 0;
        return this.sortOrder === 'desc' ? ratingB - ratingA : ratingA - ratingB;
      });
      
      uni.showToast({
        title: '已按评分排序',
        icon: 'success',
        duration: 1000
      });
    },
    
    // 按案例数排序
    sortByCases() {
      this.sortBy = 'cases';
      this.sortOrder = 'desc';
      
      this.displayDesigners.sort((a, b) => {
        const casesA = a.caseCount || 0;
        const casesB = b.caseCount || 0;
        return this.sortOrder === 'desc' ? casesB - casesA : casesA - casesB;
      });
      
      uni.showToast({
        title: '已按案例数排序',
        icon: 'success',
        duration: 1000
      });
    },
    
    // 跳转到设计师详情页
    goToDesignerDetail(userId) {
      if (!userId) {
        uni.showToast({
          title: '设计师ID无效',
          icon: 'error'
        });
        return;
      }
      
      uni.navigateTo({
        url: `/pages/find-design/design-detail?id=${userId}`,
        fail: (err) => {
          console.error('跳转失败:', err);
          uni.showToast({
            title: '跳转失败',
            icon: 'error'
          });
        }
      });
    },
    
    // 联系设计师
    contactDesigner(designer) {
      if (!designer || !designer.userId) {
        uni.showToast({
          title: '设计师信息无效',
          icon: 'error'
        });
        return;
      }
      
      uni.showActionSheet({
        itemList: ['查看详情', '在线咨询'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.goToDesignerDetail(designer.userId);
          } else if (res.tapIndex === 1) {
            this.onlineConsult(designer);
          }
        }
      });
    },
    
    // 在线咨询
    async onlineConsult(designer) {
      console.log('💬 开始在线咨询设计师:', designer);
      
      if (!isUserLoggedIn()) {
        handleNotLoggedIn();
        return;
      }
      
      if (!designer || !designer.userId) {
        uni.showToast({
          title: '设计师信息无效',
          icon: 'error'
        });
        return;
      }
      
      // 使用辅助工具函数创建对话并跳转
      await createConversationAndNavigate(
        designer.userId,
        designer.nickName || designer.userName || '设计师',
        designer.avatar || ''
      );
    },
    
    // 查看头像大图
    viewAvatar(designer) {
      if (!designer.avatar || designer.avatar === this.defaultAvatar) {
        return;
      }
      
      uni.previewImage({
        urls: [designer.avatar],
        current: 0
      });
    },
    
    // 头像加载失败
    onAvatarError(e) {
      console.error('头像加载失败:', e);
      const img = e.target;
      if (img) {
        img.src = this.defaultAvatar;
      }
    },
    
    // 加载设计师在线状态
    async loadDesignerOnlineStatus() {
      try {
        // 检查缓存是否有效
        if (this.isOnlineStatusCacheValid()) {
          console.log('🔄 使用缓存的在线状态数据');
          this.applyOnlineStatusFromCache();
          return;
        }
        
        // 提取设计师ID
        const designerIds = this.displayDesigners
          .filter(designer => designer.userId)
          .map(designer => designer.userId);
        
        console.log('🌐 需要获取在线状态的设计师ID:', designerIds);
        
        if (designerIds.length === 0) {
          console.warn('⚠️ 没有找到有效的设计师ID');
          return;
        }
        
        // 批量获取在线状态
        const onlineStatusResponse = await batchGetUserOnlineStatus(designerIds);
        console.log('🌐 在线状态API响应:', onlineStatusResponse);
        
        if (onlineStatusResponse.code === 200) {
          const onlineStatusMap = onlineStatusResponse.data || {};
          console.log('📊 在线状态数据映射:', onlineStatusMap);
          
          // 更新缓存
          this.onlineStatusCache = onlineStatusMap;
          this.onlineStatusCacheTime = Date.now();
          
          // 将在线状态数据合并到设计师数据中
          this.displayDesigners = this.displayDesigners.map(designer => {
            const userId = designer.userId;
            const onlineInfo = onlineStatusMap[userId] || {};
            
            return {
              ...designer,
              isOnline: onlineInfo.isOnline || false,
              lastActiveTime: onlineInfo.lastActiveTime || null
            };
          });
          
          console.log('✅ 在线状态数据已合并到设计师列表');
          
        } else {
          console.warn('⚠️ 获取在线状态失败，使用默认离线状态');
          this.setAllDesignersOffline();
        }
        
      } catch (error) {
        console.error('❌ 获取在线状态数据错误:', error);
        this.setAllDesignersOffline();
      }
    },
    
    // 检查在线状态缓存是否有效
    isOnlineStatusCacheValid() {
      if (!this.onlineStatusCacheTime || Object.keys(this.onlineStatusCache).length === 0) {
        return false;
      }
      
      const now = Date.now();
      const cacheAge = now - this.onlineStatusCacheTime;
      return cacheAge < this.CACHE_DURATION;
    },
    
    // 从缓存应用在线状态
    applyOnlineStatusFromCache() {
      this.displayDesigners = this.displayDesigners.map(designer => {
        const userId = designer.userId;
        const onlineInfo = this.onlineStatusCache[userId] || {};
        
        return {
          ...designer,
          isOnline: onlineInfo.isOnline || false,
          lastActiveTime: onlineInfo.lastActiveTime || null
        };
      });
    },
    
    // 设置所有设计师为离线状态
    setAllDesignersOffline() {
      this.displayDesigners = this.displayDesigners.map(designer => ({
        ...designer,
        isOnline: false,
        lastActiveTime: null
      }));
    },
    
    // 刷新在线状态
    async refreshOnlineStatus() {
      console.log('🔄 刷新在线状态');
      // 清除缓存，强制重新获取
      this.onlineStatusCache = {};
      this.onlineStatusCacheTime = null;
      
      await this.loadDesignerOnlineStatus();
      
      uni.showToast({
        title: '状态已更新',
        icon: 'success',
        duration: 1500
      });
    },

    // 下拉刷新
    onPullDownRefresh() {
      console.log('🔄 下拉刷新');
      // 清除在线状态缓存，确保获取最新状态
      this.onlineStatusCache = {};
      this.onlineStatusCacheTime = null;
      
      this.loadDesigners().then(() => {
        uni.stopPullDownRefresh();
        uni.showToast({
          title: '刷新成功',
          icon: 'success'
        });
      });
    },
    
    // 上拉加载更多
    onReachBottom() {
      console.log('⬇️ 上拉加载更多');
    }
  }
}
</script>

<style lang="scss">
page {
  background-color: #f5f7fa;
  height: 100%;
}

.container {
  padding: 20rpx;
  min-height: 100%;
}

/* 头部样式 */
.header {
  background: white;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  padding: 30rpx 40rpx;
  margin-bottom: 20rpx;
}

.page-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 10rpx;
}

.page-subtitle {
  font-size: 26rpx;
  color: #666;
}

/* 搜索区域样式 */
.search-section {
  background: white;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  padding: 30rpx 40rpx;
  margin-bottom: 20rpx;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  flex: 1;
  height: 80rpx;
  padding: 0 40rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 40rpx;
  font-size: 28rpx;
  background-color: #f8f8f8;
  outline: none;
  transition: all 0.3s ease;
  padding-right: 80rpx; /* 为右侧图标留出空间 */
}

.search-input:focus {
  border-color: #6a11cb;
  background: white;
  box-shadow: 0 0 0 4rpx rgba(106, 17, 203, 0.1);
}

.search-icon-wrapper {
  position: absolute;
  right: 30rpx;
  width: 32rpx;
  height: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-icon {
  width: 100%;
  height: 100%;
}

.clear-icon {
  position: absolute;
  right: 70rpx; /* 调整位置，避免与搜索图标重叠 */
  font-size: 40rpx;
  color: #999;
  width: 40rpx;
  height: 40rpx;
  line-height: 36rpx;
  text-align: center;
  background: #f0f0f0;
  border-radius: 50%;
}

/* 排序栏 */
.sort-bar {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 16rpx;
  padding: 20rpx 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.04);
}

.sort-label {
  font-size: 28rpx;
  color: #666;
  margin-right: 20rpx;
}

.sort-btn {
  padding: 12rpx 24rpx;
  margin-right: 20rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
  color: #666;
  background: #f5f5f5;
  transition: all 0.3s ease;
  
  &.active {
    background: linear-gradient(135deg, #6a11cb, #2575fc);
    color: white;
    font-weight: 500;
  }
}

.sort-arrow {
  margin-left: 8rpx;
  font-weight: bold;
}

/* 内容区域样式 */
.content-area {
  min-height: 60vh;
  padding-bottom: 40rpx;
}

.loading, .error, .no-data {
  background: white;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  padding: 100rpx 40rpx;
  text-align: center;
  margin-bottom: 20rpx;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 6rpx solid #f3f3f3;
  border-top: 6rpx solid #6a11cb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 30rpx;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-icon, .error-icon, .no-data-icon {
  font-size: 80rpx;
  margin-bottom: 30rpx;
  color: #ccc;
}

.loading-text, .error-text, .no-data-text {
  font-size: 32rpx;
  color: #666;
  margin-bottom: 20rpx;
  font-weight: 600;
}

.loading-desc, .error-desc, .no-data-desc {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.retry-btn {
  background: linear-gradient(135deg, #6a11cb, #2575fc);
  color: white;
  border: none;
  border-radius: 8rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.98);
    opacity: 0.9;
  }
}

/* 设计师列表样式 */
.designer-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.designer-card {
  background: white;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  padding: 30rpx;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:active {
    transform: translateY(-2rpx);
    box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.12);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 8rpx;
    height: 100%;
    background: linear-gradient(to bottom, #6a11cb, #2575fc);
    border-radius: 8rpx 0 0 8rpx;
  }
}

.designer-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 25rpx;
}

.avatar-wrapper {
  position: relative;
  margin-right: 25rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid #f0f0f0;
  background: linear-gradient(135deg, #f5f7fa, #e4e7eb);
}

.online-status-overlay {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  z-index: 2;
}

.rating-badge {
  position: absolute;
  bottom: -8rpx;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #ffd700, #ffa500);
  color: white;
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 2rpx 8rpx rgba(255, 165, 0, 0.3);
}

.designer-info {
  flex: 1;
  min-width: 0;
}

.name-rating-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15rpx;
}

.designer-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rating-display {
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.rating-score {
  display: flex;
  align-items: baseline;
  background: linear-gradient(135deg, #6a11cb, #2575fc);
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
  color: white;
  font-weight: 600;
  
  .score {
    font-size: 32rpx;
    font-weight: 700;
  }
  
  .score-label {
    font-size: 24rpx;
    opacity: 0.9;
    margin-left: 4rpx;
  }
}

.rating-stars {
  display: flex;
  gap: 4rpx;
  
  .star {
    font-size: 28rpx;
    color: #ddd;
    
    &.active {
      color: #ffa500;
    }
  }
}

.rating-details {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
  margin-bottom: 15rpx;
  background: #f8f9fa;
  padding: 15rpx;
  border-radius: 8rpx;
}

.rating-item {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  
  .rating-label {
    color: #666;
  }
  
  .rating-value {
    color: #333;
    font-weight: 500;
  }
}

.designer-stats {
  display: flex;
  gap: 30rpx;
  margin-bottom: 15rpx;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.stat-icon-image {
  width: 24rpx;
  height: 24rpx;
}

.stat-value {
  font-size: 26rpx;
  color: #666;
}

.designer-phone {
  font-size: 26rpx;
  color: #999;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.phone-icon {
  width: 24rpx;
  height: 24rpx;
}

.phone-text {
  flex: 1;
}

.action-buttons {
  display: flex;
  gap: 20rpx;
  
  .contact-btn {
    flex: 1;
    background: linear-gradient(135deg, #6a11cb, #2575fc);
    color: white;
    border: none;
    border-radius: 8rpx;
    padding: 20rpx;
    font-size: 28rpx;
    font-weight: 500;
    transition: all 0.3s ease;
    
    &:active {
      transform: scale(0.98);
      opacity: 0.9;
    }
  }
}

/* 评分提示 */
.rating-tip {
  position: fixed;
  bottom: 40rpx;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15rpx 30rpx;
  border-radius: 25rpx;
  font-size: 26rpx;
  animation: fadeInUp 0.5s ease;
  z-index: 100;
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(20rpx);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
}

/* 响应式调整 */
@media (max-width: 375px) {
  .designer-card {
    padding: 25rpx;
  }
  
  .avatar {
    width: 100rpx;
    height: 100rpx;
  }
  
  .designer-name {
    font-size: 30rpx;
  }
  
  .rating-score {
    padding: 6rpx 12rpx;
    
    .score {
      font-size: 28rpx;
    }
  }
  
  .rating-stars .star {
    font-size: 24rpx;
  }
}
</style>