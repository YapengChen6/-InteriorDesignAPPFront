<template>
  <view class="container">
    <!-- 顶部导航 -->
    <view class="header">
      <view class="back-btn" @click="goBack">←</view>
      <view class="header-title">找设计师</view>
      <view class="header-placeholder"></view>
    </view>
    
    <!-- 搜索筛选区域 -->
    <view class="search-filter">
      <view class="location-search">
        <text class="location-icon">📍</text>
        <input 
          type="text" 
          class="location-input" 
          placeholder="输入城市或区域" 
          v-model="locationInput"
          @input="onLocationInput"
        />
      </view>
      
      <view class="sort-options">
        <view 
          class="sort-option" 
          :class="{ active: activeSort === 'rating' }" 
          @click="changeSort('rating')"
        >
          好评优先
        </view>
        <view 
          class="sort-option" 
          :class="{ active: activeSort === 'projects' }" 
          @click="changeSort('projects')"
        >
          案例最多
        </view>
      </view>
    </view>
    
    <!-- 设计师列表 -->
    <view class="designer-list">
      <view 
        class="designer-item" 
        v-for="designer in filteredDesigners" 
        :key="designer.id"
        @click="goToDesignerDetail(designer)"
      >
        <view class="designer-avatar">{{ designer.name.charAt(0) }}</view>
        <view class="designer-info">
          <view class="designer-details">
            <view class="designer-name">{{ designer.name }}</view>
            <view class="designer-stats">
              <text class="rating">★ {{ designer.rating }}</text>
              <text class="projects">{{ designer.projects }}套案例</text>
            </view>
            <view class="designer-location">
              <text class="location-pin">📍</text>
              <text>{{ designer.location }}</text>
            </view>
            <view class="designer-phone">
              <text class="phone-icon">📞</text>
              <text>{{ designer.phone }}</text>
            </view>
          </view>
          <button class="contact-btn" @click.stop="contactDesigner(designer)">联系</button>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view class="empty-state" v-if="filteredDesigners.length === 0">
        <view class="empty-icon">👨‍🎨</view>
        <view class="empty-text">未找到匹配的设计师</view>
        <view class="empty-desc">请尝试调整搜索条件</view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      locationInput: '',
      activeSort: 'rating',
      designers: [
        {
          id: 1,
          name: '张明设计师',
          rating: 4.9,
          projects: 128,
          location: '北京朝阳区',
          phone: '138****1234',
          experience: '8年',
          followers: '1.5k',
          style: '现代简约、轻奢、工业风',
          description: '中国建筑装饰协会注册设计师，曾获多项设计大奖。擅长将现代美学与实用功能完美结合，为客户打造理想的居住空间。'
        },
        {
          id: 2,
          name: '李华设计工作室',
          rating: 4.8,
          projects: 95,
          location: '上海浦东新区',
          phone: '139****5678',
          experience: '6年',
          followers: '1.2k',
          style: '北欧、简欧、混搭',
          description: '专注于住宅空间设计，注重细节和用户体验，致力于为每个家庭创造温馨舒适的生活环境。'
        },
        {
          id: 3,
          name: '王芳设计',
          rating: 5.0,
          projects: 76,
          location: '广州天河区',
          phone: '136****9012',
          experience: '7年',
          followers: '980',
          style: '新中式、禅意、自然风',
          description: '传统文化与现代设计的融合者，擅长运用自然元素和东方美学，营造宁静和谐的居住氛围。'
        },
        {
          id: 4,
          name: '陈伟设计事务所',
          rating: 4.7,
          projects: 210,
          location: '深圳南山区',
          phone: '137****3456',
          experience: '10年',
          followers: '2.1k',
          style: '现代、极简、功能性',
          description: '资深室内设计师，拥有丰富的商业和住宅设计经验，注重空间的功能性和实用性。'
        },
        {
          id: 5,
          name: '刘洋独立设计师',
          rating: 4.9,
          projects: 63,
          location: '杭州西湖区',
          phone: '135****7890',
          experience: '5年',
          followers: '860',
          style: '法式、复古、艺术风',
          description: '艺术院校背景，擅长将艺术元素融入室内设计，为空间注入独特的艺术气息和个性魅力。'
        },
        {
          id: 6,
          name: 'Geniuslee',
          rating: 4.8,
          projects: 45,
          location: '四川宜宾',
          phone: '136****8888',
          experience: '9年',
          followers: '135',
          style: '现代简约、北欧风格、新中式',
          description: '9年室内设计经验，专注于现代简约风格设计。擅长空间规划与功能布局，注重细节处理，为客户打造舒适实用的居住环境。'
        }
      ]
    }
  },
  
  computed: {
    filteredDesigners() {
      let designers = [...this.designers];
      
      // 根据地点筛选
      if (this.locationInput.trim()) {
        designers = designers.filter(designer => 
          designer.location.includes(this.locationInput)
        );
      }
      
      // 根据排序方式排序
      switch(this.activeSort) {
        case 'rating':
          designers.sort((a, b) => b.rating - a.rating);
          break;
        case 'projects':
          designers.sort((a, b) => b.projects - a.projects);
          break;
      }
      
      return designers;
    }
  },
  
  methods: {
    goBack() {
      uni.navigateBack();
    },
    
    changeSort(sortType) {
      this.activeSort = sortType;
    },
    
    onLocationInput(e) {
      this.locationInput = e.detail.value;
    },
    
    goToDesignerDetail(designer) {
      console.log('跳转到设计师详情:', designer.id);
      uni.navigateTo({
        url: `/pages/find-design/design-detail?id=${designer.id}`
      });
    },
    
    contactDesigner(designer) {
      uni.showModal({
        title: '联系设计师',
        content: `确定要联系 ${designer.name} 吗？\n电话：${designer.phone}`,
        success: (res) => {
          if (res.confirm) {
            uni.makePhoneCall({
              phoneNumber: designer.phone.replace('****', '0000')
            });
          }
        }
      });
    }
  }
}
</script>

<style scoped>
.container {
  background-color: #fff;
  min-height: 100vh;
}

/* 顶部导航 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  font-size: 36rpx;
  color: #333;
}

.header-title {
  font-size: 36rpx;
  font-weight: 600;
}

.header-placeholder {
  width: 48rpx;
}

/* 搜索筛选区域 */
.search-filter {
  padding: 30rpx;
  background-color: #fff;
  border-bottom: 1px solid #eee;
}

.location-search {
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 40rpx;
  padding: 20rpx 30rpx;
  margin-bottom: 30rpx;
}

.location-icon {
  color: #007AFF;
  margin-right: 16rpx;
}

.location-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 28rpx;
}

.sort-options {
  display: flex;
  gap: 20rpx;
}

.sort-option {
  padding: 12rpx 30rpx;
  background-color: #f5f5f5;
  border-radius: 30rpx;
  font-size: 26rpx;
  white-space: nowrap;
  transition: all 0.3s;
}

.sort-option.active {
  background-color: #007AFF;
  color: white;
}

/* 设计师列表 */
.designer-list {
  padding: 0 30rpx;
}

.designer-item {
  display: flex;
  padding: 30rpx 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s;
}

.designer-item:active {
  background-color: #f8f8f8;
}

.designer-avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  margin-right: 30rpx;
  flex-shrink: 0;
  background: linear-gradient(135deg, #007AFF 0%, #0056CC 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 48rpx;
}

.designer-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.designer-details {
  flex: 1;
}

.designer-name {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}

.designer-stats {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.rating {
  color: #007AFF;
  margin-right: 30rpx;
}

.projects {
  color: #666;
}

.designer-location {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  color: #999;
  margin-bottom: 16rpx;
}

.location-pin {
  margin-right: 10rpx;
}

.designer-phone {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  color: #666;
}

.phone-icon {
  margin-right: 10rpx;
}

.contact-btn {
  background-color: #007AFF;
  color: white;
  border: none;
  border-radius: 30rpx;
  padding: 16rpx 40rpx;
  font-size: 28rpx;
  margin-left: 20rpx;
  flex-shrink: 0;
  margin-top: 40rpx;
  position: relative;
  z-index: 10;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 120rpx 40rpx;
  color: #999;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 32rpx;
  margin-bottom: 20rpx;
}

.empty-desc {
  font-size: 28rpx;
  color: #aaa;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .designer-item {
    padding: 24rpx 0;
  }
  
  .designer-avatar {
    width: 120rpx;
    height: 120rpx;
    font-size: 40rpx;
  }
}
</style>