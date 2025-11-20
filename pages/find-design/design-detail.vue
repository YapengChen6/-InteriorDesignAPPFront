<template>
  <view class="container">
    <!-- 顶部导航 -->
    <view class="header">
      <view class="back-btn" @click="goBack">←</view>
      <view class="header-title">设计师详情</view>
      <view class="header-placeholder"></view>
    </view>
    
    <!-- 设计师基本信息 -->
    <view class="designer-header" v-if="designer">
      <view class="designer-avatar">{{ designer.name.charAt(0) }}</view>
      <view class="designer-basic-info">
        <view class="designer-name">{{ designer.name }}</view>
        <view class="designer-tags">
          <view class="tag">资深设计师</view>
          <view class="tag">{{ designer.experience }}经验</view>
        </view>
        <view class="designer-stats">
          <view class="stat-item">
            <text class="stat-value">{{ designer.rating }}</text>
            <text class="stat-label">评分</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-value">{{ designer.projects }}</text>
            <text class="stat-label">案例</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-value">{{ designer.followers }}</text>
            <text class="stat-label">关注</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 设计师详细信息 -->
    <view class="designer-details" v-if="designer">
      <view class="detail-section">
        <view class="section-title">基本信息</view>
        <view class="info-list">
          <view class="info-item">
            <text class="info-label">📍 所在地</text>
            <text class="info-value">{{ designer.location }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">📞 联系电话</text>
            <text class="info-value">{{ designer.phone }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">⭐ 擅长风格</text>
            <text class="info-value">{{ designer.style }}</text>
          </view>
        </view>
      </view>
      
      <view class="detail-section">
        <view class="section-title">个人简介</view>
        <view class="designer-description">
          {{ designer.description }}
        </view>
      </view>
      
      <view class="detail-section">
        <view class="section-title">服务范围</view>
        <view class="service-scope">
          <view class="service-item" v-for="service in services" :key="service">
            {{ service }}
          </view>
        </view>
      </view>
      
      <view class="detail-section">
        <view class="section-title">代表作品</view>
        <view class="project-gallery">
          <view 
            class="project-item" 
            v-for="project in projects" 
            :key="project.id"
            @click="previewImage(project.image)"
          >
            <image :src="project.image" mode="aspectFill" class="project-image" />
            <view class="project-info">
              <text class="project-title">{{ project.title }}</text>
              <text class="project-area">{{ project.area }}㎡ · {{ project.style }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 底部操作栏 -->
    <view class="bottom-actions">
      <button class="favorite-btn" @click="toggleFavorite">
        <text class="favorite-icon">{{ isFavorite ? '❤️' : '🤍' }}</text>
        收藏
      </button>
      <button class="contact-btn" @click="contactDesigner">立即联系</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      designerId: null,
      designer: null,
      isFavorite: false,
      services: [
        '住宅设计', '商业空间', '办公空间', '软装设计', 
        '全案设计', '装修监理', '预算规划'
      ],
      projects: [
        {
          id: 1,
          title: '现代简约风格住宅',
          area: 120,
          style: '现代简约',
          image: '/static/project1.jpg'
        },
        {
          id: 2,
          title: '北欧风格公寓',
          area: 89,
          style: '北欧',
          image: '/static/project2.jpg'
        },
        {
          id: 3,
          title: '日式禅意空间',
          area: 150,
          style: '日式',
          image: '/static/project3.jpg'
        }
      ]
    }
  },
  
  onLoad(options) {
    this.designerId = options.designerId;
    this.loadDesignerDetail();
  },
  
  methods: {
    goBack() {
      uni.navigateBack();
    },
    
    loadDesignerDetail() {
      // 模拟设计师数据，实际项目中应该从API获取
      const designers = {
        '1': {
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
        '2': {
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
        '3': {
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
        '4': {
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
        '5': {
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
        }
      };
      
      this.designer = designers[this.designerId] || null;
      
      if (!this.designer) {
        uni.showToast({
          title: '设计师不存在',
          icon: 'error'
        });
        setTimeout(() => {
          uni.navigateBack();
        }, 1500);
      }
    },
    
    toggleFavorite() {
      this.isFavorite = !this.isFavorite;
      uni.showToast({
        title: this.isFavorite ? '已收藏' : '已取消收藏',
        icon: 'success'
      });
    },
    
    contactDesigner() {
      uni.showModal({
        title: '联系设计师',
        content: `确定要联系 ${this.designer.name} 吗？\n电话：${this.designer.phone}`,
        success: (res) => {
          if (res.confirm) {
            uni.makePhoneCall({
              phoneNumber: this.designer.phone.replace('****', '0000')
            });
          }
        }
      });
    },
    
    previewImage(imageUrl) {
      const imageList = this.projects.map(project => project.image);
      uni.previewImage({
        urls: imageList,
        current: imageUrl
      });
    }
  }
}
</script>

<style scoped>
.container {
  background-color: #f8f8f8;
  min-height: 100vh;
  padding-bottom: 120rpx;
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

/* 设计师头部信息 */
.designer-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 30rpx;
  color: white;
  display: flex;
  align-items: center;
}

.designer-avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60rpx;
  font-weight: bold;
  margin-right: 40rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
}

.designer-basic-info {
  flex: 1;
}

.designer-name {
  font-size: 44rpx;
  font-weight: 600;
  margin-bottom: 20rpx;
}

.designer-tags {
  display: flex;
  gap: 20rpx;
  margin-bottom: 40rpx;
}

.tag {
  background: rgba(255, 255, 255, 0.2);
  padding: 8rpx 24rpx;
  border-radius: 30rpx;
  font-size: 24rpx;
  backdrop-filter: blur(10px);
}

.designer-stats {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20rpx;
  padding: 30rpx;
  backdrop-filter: blur(10px);
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  opacity: 0.8;
}

.stat-divider {
  width: 1px;
  height: 40rpx;
  background: rgba(255, 255, 255, 0.3);
}

/* 详细信息区域 */
.designer-details {
  padding: 30rpx;
}

.detail-section {
  background: white;
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 30rpx;
  color: #333;
  border-left: 8rpx solid #007AFF;
  padding-left: 20rpx;
}

/* 基本信息列表 */
.info-list {
  space-y: 24rpx;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #666;
  font-size: 28rpx;
}

.info-value {
  color: #333;
  font-size: 28rpx;
  font-weight: 500;
  text-align: right;
  flex: 1;
  margin-left: 20rpx;
}

/* 个人简介 */
.designer-description {
  line-height: 1.8;
  color: #666;
  font-size: 28rpx;
}

/* 服务范围 */
.service-scope {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.service-item {
  background: #f5f5f5;
  padding: 16rpx 32rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
  color: #666;
}

/* 作品展示 */
.project-gallery {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.project-item {
  background: white;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.project-image {
  width: 100%;
  height: 200rpx;
  background: #f0f0f0;
}

.project-info {
  padding: 24rpx;
}

.project-title {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  margin-bottom: 8rpx;
  color: #333;
}

.project-area {
  font-size: 24rpx;
  color: #999;
}

/* 底部操作栏 */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 20rpx 30rpx;
  display: flex;
  gap: 20rpx;
  border-top: 1px solid #eee;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.favorite-btn {
  flex: 1;
  background: #f8f8f8;
  color: #666;
  border: none;
  border-radius: 50rpx;
  padding: 24rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
}

.contact-btn {
  flex: 2;
  background: linear-gradient(135deg, #007AFF 0%, #0056CC 100%);
  color: white;
  border: none;
  border-radius: 50rpx;
  padding: 24rpx;
  font-size: 28rpx;
  font-weight: 500;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .designer-header {
    padding: 40rpx 24rpx;
  }
  
  .designer-avatar {
    width: 120rpx;
    height: 120rpx;
    font-size: 48rpx;
  }
  
  .project-gallery {
    grid-template-columns: 1fr;
  }
}
</style>