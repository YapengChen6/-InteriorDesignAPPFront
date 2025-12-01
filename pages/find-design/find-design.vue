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
        >
          <view class="designer-header">
            <view class="avatar-wrapper">
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
          <button class="contact-btn" @tap="contactDesigner(designer.userId, designer.name)">
            联系设计师
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getDesignerList } from "@/api/designer.js"
import store from "@/store"

export default {
  data() {
    return {
      loading: true,
      error: null,
      searchQuery: '',
      allDesigners: [],
      searchTimer: null,
      defaultAvatar: '/static/default-avatar.png'
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
          (designer.nickName && designer.nickName.toLowerCase().includes(query))
      );
    }
  },
  onLoad() {
    this.loadDesigners();
  },
  onShow() {
    // 当从其他页面返回时，重新获取设计师数据
    this.loadDesigners();
  },
  methods: {
    async loadDesigners() {
      try {
        this.loading = true;
        this.error = null;

        const response = await getDesignerList();

        if (response.code === 200) {
          this.allDesigners = response.data || [];
          console.log('👥 设计师列表数据:', this.allDesigners);
        } else {
          throw new Error(response.msg || '获取设计师数据失败');
        }
      } catch (error) {
        console.error('加载设计师数据错误:', error);
        this.error = '加载失败: ' + error.message;
        // 如果API调用失败，使用模拟数据
        this.useMockData();
      } finally {
        this.loading = false;
      }
    },

    useMockData() {
    },

    onSearchInput() {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        // 搜索逻辑已通过计算属性处理
      }, 500);
    },

    contactDesigner(designerId, designerName) {
      uni.showModal({
        title: '联系设计师',
        content: `确定要联系设计师 ${designerName} 吗？`,
        success: (res) => {
          if (res.confirm) {
            // 实际应用中这里可以打开聊天窗口或拨打电话
            uni.showToast({
              title: '已发送联系请求',
              icon: 'success'
            });
          }
        }
      });
    },

    onAvatarError(e) {
      console.error('头像加载失败:', e);
      // 在实际应用中，这里可以设置默认头像
    }
  }
}
</script>

<style lang="scss">
page {
  background-color: #f5f7fa;
}

.container {
  padding: 20rpx;
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
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  padding: 40rpx;
  transition: all 0.3s ease;
}

.designer-card:active {
  transform: scale(0.98);
  background: #f8f9fa;
}

.designer-header {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
}

.avatar-wrapper {
  margin-right: 30rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid #f0f0f0;
}

.designer-info {
  flex: 1;
}

.designer-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

.designer-stats {
  display: flex;
  gap: 40rpx;
  margin-bottom: 20rpx;
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
</style>