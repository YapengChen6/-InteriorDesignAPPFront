<template>
  <view class="container">
    <!-- 顶部导航 -->
    <view class="header">
      <view class="back-btn" @click="goBack">←</view>
      <view class="header-title">监理详情</view>
      <view class="header-placeholder"></view>
    </view>
    
    <!-- 监理基本信息 -->
    <view class="supervisor-header" v-if="supervisor">
      <view class="supervisor-avatar">{{ supervisor.name.charAt(0) }}</view>
      <view class="supervisor-basic-info">
        <view class="supervisor-name">{{ supervisor.name }}</view>
        <view class="supervisor-tags">
          <view class="tag">资深监理</view>
          <view class="tag">{{ supervisor.experience }}经验</view>
        </view>
        <view class="supervisor-stats">
          <view class="stat-item">
            <text class="stat-value">{{ supervisor.rating }}</text>
            <text class="stat-label">评分</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-value">{{ supervisor.projects }}</text>
            <text class="stat-label">项目</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-value">{{ supervisor.certificates.length }}</text>
            <text class="stat-label">证书</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 监理详细信息 -->
    <view class="supervisor-details" v-if="supervisor">
      <view class="detail-section">
        <view class="section-title">基本信息</view>
        <view class="info-list">
          <view class="info-item">
            <text class="info-label">📍 所在地</text>
            <text class="info-value">{{ supervisor.location }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">📞 联系电话</text>
            <text class="info-value">{{ supervisor.phone }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">⭐ 擅长领域</text>
            <text class="info-value">{{ supervisor.specialty }}</text>
          </view>
        </view>
      </view>
      
      <view class="detail-section">
        <view class="section-title">个人简介</view>
        <view class="supervisor-description">
          {{ supervisor.description }}
        </view>
      </view>
      
      <view class="detail-section">
        <view class="section-title">专业证书</view>
        <view class="certificate-list">
          <view 
            class="certificate-item" 
            v-for="certificate in supervisor.certificates" 
            :key="certificate"
          >
            <text class="certificate-icon">🏆</text>
            <text class="certificate-name">{{ certificate }}</text>
          </view>
        </view>
      </view>
      
      <view class="detail-section">
        <view class="section-title">服务内容</view>
        <view class="service-list">
          <view class="service-item" v-for="service in services" :key="service">
            <text class="service-icon">✅</text>
            <text class="service-text">{{ service }}</text>
          </view>
        </view>
      </view>
      
      <view class="detail-section">
        <view class="section-title">监理流程</view>
        <view class="process-steps">
          <view class="process-step" v-for="(step, index) in processSteps" :key="index">
            <view class="step-number">{{ index + 1 }}</view>
            <view class="step-content">
              <text class="step-title">{{ step.title }}</text>
              <text class="step-desc">{{ step.description }}</text>
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
      <button class="contact-btn" @click="contactSupervisor">立即联系</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      supervisorId: null,
      supervisor: null,
      isFavorite: false,
      services: [
        '施工质量检查',
        '材料验收',
        '工艺监督',
        '进度控制',
        '安全监督',
        '验收指导',
        '问题整改跟踪',
        '竣工验收'
      ],
      processSteps: [
        {
          title: '前期交底',
          description: '参与施工前技术交底，了解工程要求'
        },
        {
          title: '材料验收',
          description: '对进场材料进行质量检查和验收'
        },
        {
          title: '过程监督',
          description: '定期巡查施工现场，监督施工质量'
        },
        {
          title: '问题整改',
          description: '发现质量问题，督促施工单位整改'
        },
        {
          title: '竣工验收',
          description: '参与工程竣工验收，出具监理报告'
        }
      ]
    }
  },
  
  onLoad(options) {
    this.supervisorId = options.supervisorId;
    this.loadSupervisorDetail();
  },
  
  methods: {
    goBack() {
      uni.navigateBack();
    },
    
    loadSupervisorDetail() {
      // 模拟监理数据，实际项目中应该从API获取
      const supervisors = {
        '1': {
          id: 1,
          name: '张明监理',
          rating: 4.9,
          projects: 156,
          location: '北京朝阳区',
          phone: '138****1234',
          experience: '8年',
          certificates: ['国家注册监理工程师', '一级建造师', '安全工程师'],
          specialty: '住宅工程、装修监理',
          description: '资深监理工程师，拥有丰富的施工现场管理经验，擅长发现和解决施工过程中的质量问题。曾参与多个大型住宅项目和商业空间监理工作，对装修工艺和材料有深入的了解。'
        },
        '2': {
          id: 2,
          name: '李华监理工作室',
          rating: 4.8,
          projects: 243,
          location: '上海浦东新区',
          phone: '139****5678',
          experience: '10年',
          certificates: ['高级监理工程师', '安全工程师', '造价工程师'],
          specialty: '商业空间、办公室装修',
          description: '专业监理团队，提供全方位的工程监理服务，确保工程质量和使用安全。团队成员均持有相关专业证书，具备丰富的实战经验。'
        },
        '3': {
          id: 3,
          name: '王芳监理',
          rating: 5.0,
          projects: 98,
          location: '广州天河区',
          phone: '136****9012',
          experience: '6年',
          certificates: ['注册监理工程师', '质量工程师', '装饰监理师'],
          specialty: '精装修、别墅监理',
          description: '女性监理师，注重细节和工艺品质，擅长处理精装修工程中的各种技术问题。特别关注环保材料和施工安全。'
        },
        '4': {
          id: 4,
          name: '陈伟监理事务所',
          rating: 4.7,
          projects: 320,
          location: '深圳南山区',
          phone: '137****3456',
          experience: '12年',
          certificates: ['国家级监理工程师', '造价工程师', '项目管理师'],
          specialty: '大型工程、全过程监理',
          description: '拥有大型工程项目监理经验，能够提供从设计到竣工的全过程监理服务。熟悉各类建筑规范和验收标准。'
        },
        '5': {
          id: 5,
          name: '刘洋独立监理',
          rating: 4.9,
          projects: 187,
          location: '杭州西湖区',
          phone: '135****7890',
          experience: '7年',
          certificates: ['注册监理师', '建筑工程师', '室内监理师'],
          specialty: '二手房改造、局部装修',
          description: '专注于家庭装修监理，特别擅长二手房改造和局部装修的质量控制。了解杭州本地装修市场和施工队伍。'
        }
      };
      
      this.supervisor = supervisors[this.supervisorId] || null;
      
      if (!this.supervisor) {
        uni.showToast({
          title: '监理不存在',
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
    
    contactSupervisor() {
      uni.showModal({
        title: '联系监理',
        content: `确定要联系 ${this.supervisor.name} 吗？\n电话：${this.supervisor.phone}`,
        success: (res) => {
          if (res.confirm) {
            uni.makePhoneCall({
              phoneNumber: this.supervisor.phone.replace('****', '0000')
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

/* 监理头部信息 */
.supervisor-header {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  padding: 60rpx 30rpx;
  color: white;
  display: flex;
  align-items: center;
}

.supervisor-avatar {
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

.supervisor-basic-info {
  flex: 1;
}

.supervisor-name {
  font-size: 44rpx;
  font-weight: 600;
  margin-bottom: 20rpx;
}

.supervisor-tags {
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

.supervisor-stats {
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
.supervisor-details {
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
  border-left: 8rpx solid #4CAF50;
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
.supervisor-description {
  line-height: 1.8;
  color: #666;
  font-size: 28rpx;
}

/* 证书列表 */
.certificate-list {
  space-y: 20rpx;
}

.certificate-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  border-left: 6rpx solid #4CAF50;
}

.certificate-icon {
  margin-right: 20rpx;
  font-size: 32rpx;
}

.certificate-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

/* 服务列表 */
.service-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.service-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
}

.service-icon {
  margin-right: 16rpx;
  font-size: 28rpx;
}

.service-text {
  font-size: 26rpx;
  color: #333;
}

/* 监理流程 */
.process-steps {
  space-y: 30rpx;
}

.process-step {
  display: flex;
  align-items: flex-start;
}

.step-number {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: #4CAF50;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 600;
  margin-right: 24rpx;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
  padding-top: 8rpx;
}

.step-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.step-desc {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
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
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  border: none;
  border-radius: 50rpx;
  padding: 24rpx;
  font-size: 28rpx;
  font-weight: 500;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .supervisor-header {
    padding: 40rpx 24rpx;
  }
  
  .supervisor-avatar {
    width: 120rpx;
    height: 120rpx;
    font-size: 48rpx;
  }
  
  .service-list {
    grid-template-columns: 1fr;
  }
}
</style>