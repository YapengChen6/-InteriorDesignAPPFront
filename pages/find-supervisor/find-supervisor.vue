<template>
  <view class="container">
    <!-- 顶部导航 -->
    <view class="header">
      <view class="back-btn" @click="goBack">←</view>
      <view class="header-title">找监理</view>
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
          :class="{ active: activeSort === 'experience' }" 
          @click="changeSort('experience')"
        >
          经验丰富
        </view>
      </view>
    </view>
    
    <!-- 监理列表 -->
    <view class="supervisor-list">
      <view 
        class="supervisor-item" 
        v-for="supervisor in filteredSupervisors" 
        :key="supervisor.id"
        @click="goToSupervisorDetail(supervisor)"
      >
        <view class="supervisor-avatar">{{ supervisor.name.charAt(0) }}</view>
        <view class="supervisor-info">
          <view class="supervisor-details">
            <view class="supervisor-name">{{ supervisor.name }}</view>
            <view class="supervisor-stats">
              <text class="rating">★ {{ supervisor.rating }}</text>
              <text class="projects">{{ supervisor.projects }}个项目</text>
            </view>
            <view class="supervisor-location">
              <text class="location-pin">📍</text>
              <text>{{ supervisor.location }}</text>
            </view>
            <view class="supervisor-phone">
              <text class="phone-icon">📞</text>
              <text>{{ supervisor.phone }}</text>
            </view>
          </view>
          <button class="contact-btn" @click.stop="contactSupervisor(supervisor)">联系</button>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view class="empty-state" v-if="filteredSupervisors.length === 0">
        <view class="empty-icon">👷</view>
        <view class="empty-text">未找到匹配的监理</view>
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
      supervisors: [
        {
          id: 1,
          name: '张明监理',
          rating: 4.9,
          projects: 156,
          location: '北京朝阳区',
          phone: '138****1234',
          experience: '8年',
          certificates: ['国家注册监理工程师', '一级建造师'],
          specialty: '住宅工程、装修监理',
          description: '资深监理工程师，拥有丰富的施工现场管理经验，擅长发现和解决施工过程中的质量问题。'
        },
        {
          id: 2,
          name: '李华监理工作室',
          rating: 4.8,
          projects: 243,
          location: '上海浦东新区',
          phone: '139****5678',
          experience: '10年',
          certificates: ['高级监理工程师', '安全工程师'],
          specialty: '商业空间、办公室装修',
          description: '专业监理团队，提供全方位的工程监理服务，确保工程质量和使用安全。'
        },
        {
          id: 3,
          name: '王芳监理',
          rating: 5.0,
          projects: 98,
          location: '广州天河区',
          phone: '136****9012',
          experience: '6年',
          certificates: ['注册监理工程师', '质量工程师'],
          specialty: '精装修、别墅监理',
          description: '女性监理师，注重细节和工艺品质，擅长处理精装修工程中的各种技术问题。'
        },
        {
          id: 4,
          name: '陈伟监理事务所',
          rating: 4.7,
          projects: 320,
          location: '深圳南山区',
          phone: '137****3456',
          experience: '12年',
          certificates: ['国家级监理工程师', '造价工程师'],
          specialty: '大型工程、全过程监理',
          description: '拥有大型工程项目监理经验，能够提供从设计到竣工的全过程监理服务。'
        },
        {
          id: 5,
          name: '刘洋独立监理',
          rating: 4.9,
          projects: 187,
          location: '杭州西湖区',
          phone: '135****7890',
          experience: '7年',
          certificates: ['注册监理师', '建筑工程师'],
          specialty: '二手房改造、局部装修',
          description: '专注于家庭装修监理，特别擅长二手房改造和局部装修的质量控制。'
        }
      ]
    }
  },
  
  computed: {
    filteredSupervisors() {
      let supervisors = [...this.supervisors];
      
      // 根据地点筛选
      if (this.locationInput.trim()) {
        supervisors = supervisors.filter(supervisor => 
          supervisor.location.includes(this.locationInput)
        );
      }
      
      // 根据排序方式排序
      switch(this.activeSort) {
        case 'rating':
          supervisors.sort((a, b) => b.rating - a.rating);
          break;
        case 'experience':
          supervisors.sort((a, b) => b.projects - a.projects);
          break;
      }
      
      return supervisors;
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
    
    goToSupervisorDetail(supervisor) {
      uni.navigateTo({
        url: `/pages/find-supervisor/supervisor-detail?supervisorId=${supervisor.id}`
      });
    },
    
    contactSupervisor(supervisor) {
      uni.showModal({
        title: '联系监理',
        content: `确定要联系 ${supervisor.name} 吗？\n电话：${supervisor.phone}`,
        success: (res) => {
          if (res.confirm) {
            uni.makePhoneCall({
              phoneNumber: supervisor.phone.replace('****', '0000')
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
  overflow-x: auto;
  padding-bottom: 10rpx;
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

/* 监理列表 */
.supervisor-list {
  padding: 0 30rpx;
}

.supervisor-item {
  display: flex;
  padding: 30rpx 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s;
}

.supervisor-item:active {
  background-color: #f8f8f8;
}

.supervisor-avatar {
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

.supervisor-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.supervisor-details {
  flex: 1;
}

.supervisor-name {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}

.supervisor-stats {
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

.supervisor-location {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  color: #999;
  margin-bottom: 16rpx;
}

.location-pin {
  margin-right: 10rpx;
}

.supervisor-phone {
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
  .supervisor-item {
    padding: 24rpx 0;
  }
  
  .supervisor-avatar {
    width: 120rpx;
    height: 120rpx;
    font-size: 40rpx;
  }
}
</style>