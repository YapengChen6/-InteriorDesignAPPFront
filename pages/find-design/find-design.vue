<template>
  <view class="container">
    <!-- 头部标题 -->
    <view class="header">
      <view class="page-title">寻找设计师</view>
    </view>

    <!-- 搜索区域 -->
    <view class="search-section">
      <view class="search-box">
        <view class="search-icon">🔍</view>
        <input
            type="text"
            class="search-input"
            placeholder="输入设计师姓名搜索"
            v-model="searchQuery"
            @input="onSearchInput"
        />
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="content-area">
      <!-- 加载状态 -->
      <view v-if="loading" class="loading">
        <view class="loading-icon">⏳</view>
        <view class="loading-text">加载中...</view>
        <view class="loading-desc">正在获取设计师数据</view>
      </view>

      <!-- 错误状态 -->
      <view v-else-if="error" class="error">
        <view class="error-icon">⚠️</view>
        <view class="error-text">加载失败</view>
        <view class="error-desc">{{ error }}</view>
        <button class="retry-btn" @tap="loadDesigners">重新加载</button>
      </view>

      <!-- 无数据状态 -->
      <view v-else-if="filteredDesigners.length === 0" class="no-data">
        <view class="no-data-icon">👥</view>
        <view class="no-data-text">暂无设计师数据</view>
        <view class="no-data-desc">请尝试调整搜索条件</view>
        <button class="retry-btn" @tap="loadDesigners">重新加载</button>
      </view>

      <!-- 设计师列表 -->
      <view v-else class="designer-list">
        <view
            v-for="designer in filteredDesigners"
            :key="designer.userId"
            class="designer-card"
            @tap="goToDesignerDetail(designer.userId)"
        >
          <view class="designer-header">
            <view class="avatar-wrapper" @tap.stop="viewAvatar(designer)">
              <image
                  :src="designer.avatar || defaultAvatar"
                  mode="aspectFill"
                  class="avatar"
                  @error="onAvatarError"
              ></image>
            </view>
            <view class="designer-info">
              <view class="designer-name">{{ designer.name || designer.nickName || '设计师' }}</view>
              <view class="designer-stats">
                <view class="stat-item">
                  <view class="stat-icon">★</view>
                  <view class="stat-value">{{ designer.rating || 5 }}</view>
                </view>
                <view class="stat-item">
                  <view class="stat-icon">📁</view>
                  <view class="stat-value">{{ designer.caseCount || 0 }}套案例</view>
                </view>
              </view>
              <view class="designer-location">{{ designer.address || designer.city || '未知地区' }}</view>
              <view class="designer-phone">{{ designer.phone || designer.phonenumber || '电话未提供' }}</view>
            </view>
          </view>
          <button class="contact-btn" @tap.stop="contactDesigner(designer)">
            联系设计师
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getDesignerList } from "@/api/designer.js"
import { getUserProfile } from "@/api/users.js"

export default {
  data() {
    return {
      loading: true,
      error: null,
      searchQuery: '',
      allDesigners: [],
      searchTimer: null,
      defaultAvatar: '/static/default-avatar.png',
	  currentUserInfo: null, // 添加当前用户信息
	  isLoadingUser: false // 添加用户信息加载状态
    }
  },
  computed: {
    filteredDesigners() {
      if (!this.searchQuery.trim()) {
        return this.allDesigners;
      }

      const query = this.searchQuery.toLowerCase();
      return this.allDesigners.filter(designer =>
          (designer.name && designer.name.toLowerCase().includes(query)) ||
          (designer.nickName && designer.nickName.toLowerCase().includes(query)) ||
          (designer.specialty && designer.specialty.toLowerCase().includes(query))
      );
    }
  },
  onLoad() {
    this.loadDesigners();
	this.getCurrentUserInfo(); // 页面加载时获取用户信息
  },
  onShow() {
    if (this.allDesigners.length === 0) {
      this.loadDesigners();
    }
  },
  methods: {
	  // 新增：获取当前用户信息的方法
	async getCurrentUserInfo() {
	        // 防止重复请求
	    if (this.isLoadingUser) return;
	        
	    this.isLoadingUser = true;
	    try {
			const response = await getUserProfile();
	        console.log('用户信息API响应:', response);
	          
	        if (response.code === 200) {
	        this.currentUserInfo = response.data;
	        console.log('当前用户信息:', this.currentUserInfo);
	            // 存储到全局数据，方便其他地方使用
	            if (getApp().globalData) {
	              getApp().globalData.userInfo = response.data;
	            }
	            
	            // 存储到本地缓存
	            try {
	              uni.setStorageSync('userInfo', response.data);
	            } catch (storageError) {
	              console.log('存储用户信息失败:', storageError);
	            }
	          } else {
	            console.error('获取用户信息失败:', response.msg);
	            this.currentUserInfo = null;
	          }
	        } catch (error) {
	          console.error('获取用户信息异常:', error);
	          this.currentUserInfo = null;
	        } finally {
	          this.isLoadingUser = false;
	        }
	      },
	  
	  
    async loadDesigners() {
      try {
        this.loading = true;
        this.error = null;

        const response = await getDesignerList();

        if (response.code === 200) {
          this.allDesigners = this.formatDesignerData(response.data || []);
          console.log('👥 设计师列表数据:', this.allDesigners);
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

    formatDesignerData(designers) {
      return designers.map(designer => ({
        userId: designer.userId || designer.id || 0,
        name: designer.name || designer.nickName || designer.realName || '设计师',
        nickName: designer.nickName || designer.name || '',
        avatar: designer.avatar || designer.avatarUrl || '',
        rating: designer.rating || designer.score || 5,
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
    onSearchInput() {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        console.log('搜索关键词:', this.searchQuery);
      }, 500);
    },

    // 跳转到设计师详情页 - 修改路径
    goToDesignerDetail(userId) {
      if (!userId) {
        uni.showToast({
          title: '设计师ID无效',
          icon: 'error'
        });
        return;
      }
      console.log('跳转到设计师详情，ID:', userId);
      
      // 使用正确的路径：/pages/find-design/design-detail
      uni.navigateTo({
        url: `/pages/find-design/design-detail?id=${userId}`,
        success: () => {
          console.log('跳转成功');
        },
        fail: (err) => {
          console.error('跳转失败:', err);
          this.tryAlternativeNavigate(userId);
        }
      });
    },

    tryAlternativeNavigate(userId) {
      const urls = [
        // 不同参数格式
        `/pages/find-design/design-detail?userId=${userId}`,
        `/pages/find-design/design-detail?designerId=${userId}`,
        `/pages/find-design/design-detail?user_id=${userId}`,
        `/pages/find-design/design-detail?ID=${userId}`,
        `/pages/find-design/design-detail?uid=${userId}`
      ];
      
    },

    contactDesigner(designer) {
       //console.log(' 📱 当前设计师信息:', designer.userId);
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
          const tapIndex = res.tapIndex;
          switch (tapIndex) {
            case 0:
              this.goToDesignerDetail(designer.userId);
              break;
            case 1:
              this.onlineConsult(designer);
              break;
          }
        }
      });
    },

    callDesigner(designer) {
      if (!designer.phone || designer.phone === '电话未提供') {
        uni.showToast({
          title: '该设计师未提供电话',
          icon: 'none'
        });
        return;
      }
      
      if (designer.phone.includes('****')) {
        uni.showModal({
          title: '提示',
          content: '需要联系客服获取设计师真实电话',
          success: (res) => {
            if (res.confirm) {
              uni.makePhoneCall({
                phoneNumber: '400-123-4567'
              });
            }
          }
        });
      } else {
        uni.makePhoneCall({
          phoneNumber: designer.phone
        });
      }
    },

    onlineConsult(designer) {
		//获取用户ID
	  const currentUserId = this.currentUserInfo.userId;
      uni.navigateTo({
          url: `/pages/chat/chatDetail?conversationId=${currentUserId}&otherUserId=${designer.userId}`
      });
    },

    viewAvatar(designer) {
      if (!designer.avatar || designer.avatar === this.defaultAvatar) {
        return;
      }
      
      uni.previewImage({
        urls: [designer.avatar],
        current: 0
      });
    },

    onAvatarError(e) {
      console.error('头像加载失败:', e);
      const img = e.target;
      img.src = this.defaultAvatar;
    },
    
    onPullDownRefresh() {
      console.log('下拉刷新');
      this.loadDesigners().then(() => {
        uni.stopPullDownRefresh();
      });
    },
    
    onReachBottom() {
      console.log('上拉加载更多');
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
  text-align: center;
  margin-bottom: 20rpx;
}

.page-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
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
}

.search-input {
  width: 100%;
  height: 80rpx;
  padding: 0 40rpx 0 80rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 40rpx;
  font-size: 28rpx;
  background-color: #f8f8f8;
  outline: none;
  transition: all 0.3s ease;
}

.search-input:focus {
  border-color: #6a11cb;
  background: white;
  box-shadow: 0 0 0 4rpx rgba(106, 17, 203, 0.1);
}

.search-icon {
  position: absolute;
  left: 30rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 32rpx;
  color: #999;
}

/* 内容区域样式 */
.content-area {
  min-height: 60vh;
}

.loading, .error, .no-data {
  background: white;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  padding: 100rpx 40rpx;
  text-align: center;
  margin-bottom: 20rpx;
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
  background: #6a11cb;
  color: white;
  border: none;
  border-radius: 8rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
  transition: all 0.3s ease;
}

.retry-btn:active {
  background: #5a0db5;
  transform: scale(0.98);
}

/* 设计师列表样式 */
.designer-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding-bottom: 40rpx;
}

.designer-card {
  background: white;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  padding: 40rpx;
  transition: all 0.3s ease;
  position: relative;
}

.designer-card:active {
  transform: translateY(-2rpx);
  box-shadow: 0 6rpx 30rpx rgba(0, 0, 0, 0.1);
  background: #f8f9fa;
}

.designer-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 30rpx;
}

.avatar-wrapper {
  margin-right: 30rpx;
  position: relative;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid #f0f0f0;
  background-color: #f8f8f8;
}

.designer-info {
  flex: 1;
  min-width: 0;
}

.designer-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.designer-stats {
  display: flex;
  gap: 40rpx;
  margin-bottom: 20rpx;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.stat-icon {
  font-size: 28rpx;
  color: #ffa500;
}

.stat-value {
  font-size: 28rpx;
  color: #666;
}

.designer-location, .designer-phone {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 10rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.designer-location:before {
  content: '📍';
  font-size: 24rpx;
}

.designer-phone:before {
  content: '📱';
  font-size: 24rpx;
}

.contact-btn {
  width: 100%;
  background: #6a11cb;
  color: white;
  border: none;
  border-radius: 8rpx;
  padding: 24rpx;
  font-size: 30rpx;
  font-weight: 500;
  transition: all 0.3s ease;
}

.contact-btn:active {
  background: #5a0db5;
  transform: scale(0.98);
}

/* 在线状态指示器 */
.online-indicator {
  position: absolute;
  bottom: 10rpx;
  right: 10rpx;
  width: 20rpx;
  height: 20rpx;
  background-color: #4CAF50;
  border: 2rpx solid white;
  border-radius: 50%;
}

/* 认证徽章 */
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

/* 加载动画 */
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

/* 响应式调整 */
@media (max-width: 375px) {
  .designer-card {
    padding: 30rpx;
  }
  
  .avatar {
    width: 100rpx;
    height: 100rpx;
  }
  
  .designer-name {
    font-size: 30rpx;
  }
  
  .contact-btn {
    font-size: 28rpx;
    padding: 20rpx;
  }
}
</style>