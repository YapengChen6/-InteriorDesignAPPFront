<template>
  <view class="supervisor-container">
    <!-- 顶部标题 -->
    <view class="page-header">
      <h1 class="page-title">寻找监工</h1>
    </view>
    
    <!-- 搜索区域 -->
    <view class="search-section">
      <view class="search-box">
        <input 
          v-model="searchKeyword" 
          type="text" 
          class="search-input" 
          placeholder="输入监工姓名搜索" 
          @input="handleSearch"
        />
        <view class="search-icon">🔍</view>
      </view>
    </view>
    
    <!-- 监工列表 -->
    <view class="supervisor-list">
      <view 
        v-for="supervisor in supervisors" 
        :key="supervisor.userId" 
        class="supervisor-card"
        @click="goToSupervisorDetail(supervisor)"
      >
        <view class="supervisor-info">
          <view class="supervisor-name">{{ supervisor.name || '匿名监工' }}</view>
          <view class="supervisor-rating">
            <view class="stars">★★★★★</view>
            <view class="rating-text">{{ supervisor.rating || 5.0 }}</view>
          </view>
          <view class="supervisor-details">
            <view class="detail-item">
              <view class="detail-icon">📁</view>
              <view>{{ supervisor.caseCount || 0 }}个案例</view>
            </view>
            <view class="detail-item">
              <view class="detail-icon">📍</view>
              <view>{{ supervisor.city || '未知地区' }}</view>
            </view>
            <view class="detail-item">
              <view class="detail-icon">📞</view>
              <view>{{ formatPhone(supervisor.phone) }}</view>
            </view>
          </view>
        </view>
        <view class="card-actions">
          <button class="contact-btn" @click.stop="contactSupervisor(supervisor.userId)">
            联系监工
          </button>
        </view>
      </view>
    </view>
    
    <!-- 空状态 -->
    <view v-if="!loading && supervisors.length === 0" class="empty-state">
      <view class="empty-icon">👷</view>
      <view class="empty-text">{{ emptyText }}</view>
    </view>
    
    <!-- 加载状态 -->
    <view v-if="loading" class="loading">
      <view class="spinner"></view>
      <text>正在加载监工列表...</text>
    </view>
  </view>
</template>

<script>
import { getSupervisorList, contactSupervisor } from '@/api/supervisorpublic'

export default {
  name: 'SupervisorList',
  data() {
    return {
      searchKeyword: '',
      supervisors: [],
      loading: false,
      searchTimer: null
    }
  },
  
  computed: {
    emptyText() {
      return this.searchKeyword ? '未找到相关监工' : '暂无监工信息'
    }
  },
  
  onLoad() {
    this.loadSupervisors()
  },
  
  methods: {
    // 加载监工列表
    async loadSupervisors() {
      this.loading = true
      
      try {
        const response = await getSupervisorList(this.searchKeyword)
        
        if (response.code === 200) {
          // 使用真实的后端数据，确保监工数据有必要的字段
          this.supervisors = (response.data || []).map(supervisor => ({
            userId: supervisor.userId,
            id: supervisor.userId, // 确保有id字段用于详情页
            name: supervisor.name || '匿名监工',
            rating: supervisor.rating || 5.0,
            caseCount: supervisor.caseCount || 0,
            city: supervisor.city || '未知地区',
            phone: supervisor.phone,
            // 添加详情页需要的其他字段，如果后端没有返回，使用默认值
            experience: supervisor.experience || '5年',
            location: supervisor.location || supervisor.city || '未知地区',
            certificates: supervisor.certificates || ['监理资格证书'],
            specialty: supervisor.specialty || '住宅工程监理',
            description: supervisor.description || '资深监理工程师，拥有丰富的施工现场管理经验。',
            projects: supervisor.projects || supervisor.caseCount || 0
          }))
        } else {
          console.error('获取监工列表失败:', response.msg)
          this.supervisors = []
          uni.showToast({
            title: response.msg || '获取监工列表失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('获取监工列表失败:', error)
        this.supervisors = []
        uni.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    // 处理搜索
    handleSearch() {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer)
      }
      
      this.searchTimer = setTimeout(() => {
        this.loadSupervisors()
      }, 500)
    },
    
    // 跳转到监工详情页
    goToSupervisorDetail(supervisor) {
	  console.log('跳转到监工详情，监工ID:', supervisor.userId, '监工数据:', supervisor)
      uni.navigateTo({
        url: `/pages/find-supervisor/supervisor-detail?supervisorId=${supervisor.userId || supervisor.id}`
      })
    },
    
    // 联系监工
    async contactSupervisor(userId) {
      try {
        uni.showModal({
          title: '联系监工',
          content: '确定要联系此监工吗？',
          success: async (res) => {
            if (res.confirm) {
              const response = await contactSupervisor(userId)
              
              if (response.code === 200) {
                uni.showToast({
                  title: '联系请求已发送，监工会尽快回复您',
                  icon: 'success'
                })
              } else {
                uni.showToast({
                  title: response.msg || '联系监工失败',
                  icon: 'none'
                })
              }
            }
          }
        })
      } catch (error) {
        console.error('联系监工失败:', error)
        uni.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        })
      }
    },
    
    // 格式化手机号
    formatPhone(phone) {
      if (!phone) return '电话未提供'
      
      if (phone.length === 11) {
        return phone.substring(0, 3) + '****' + phone.substring(7)
      }
      
      return phone
    }
  }
}
</script>

<style scoped>
.supervisor-container {
  padding: 30rpx;
  background-color: #f5f7fa;
  min-height: 100vh;
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: 30rpx;
}

.page-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

/* 搜索区域 */
.search-section {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  height: 80rpx;
  border: 1px solid #e0e0e0;
  border-radius: 40rpx;
  padding: 0 80rpx 0 30rpx;
  font-size: 28rpx;
  background: #f8f8f8;
  outline: none;
  transition: all 0.3s;
}

.search-input:focus {
  border-color: #8b5cf6;
  background: white;
}

.search-icon {
  position: absolute;
  right: 30rpx;
  color: #8b5cf6;
  font-size: 32rpx;
}

/* 监工列表 */
.supervisor-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.supervisor-card {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.supervisor-card:active {
  transform: translateY(-2px);
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
}

.supervisor-info {
  flex: 1;
}

.supervisor-name {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
  color: #333;
}

.supervisor-rating {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.stars {
  color: #ffc107;
  margin-right: 16rpx;
  font-size: 28rpx;
}

.rating-text {
  color: #666;
  font-size: 28rpx;
}

.supervisor-details {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.detail-item {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  color: #666;
}

.detail-icon {
  margin-right: 12rpx;
  font-size: 24rpx;
}

.card-actions {
  margin-left: 30rpx;
}

.contact-btn {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  color: white;
  border: none;
  border-radius: 32rpx;
  padding: 16rpx 32rpx;
  font-size: 26rpx;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.contact-btn:active {
  background: linear-gradient(135deg, #7c3aed, #8b5cf6);
  transform: translateY(-1px);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80rpx 40rpx;
  color: #999;
}

.empty-icon {
  font-size: 96rpx;
  margin-bottom: 20rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 28rpx;
}

/* 加载状态 */
.loading {
  text-align: center;
  padding: 60rpx;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  display: inline-block;
  width: 32rpx;
  height: 32rpx;
  border: 4rpx solid #f3f3f3;
  border-top: 4rpx solid #8b5cf6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 16rpx;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式调整 */
@media (max-width: 480px) {
  .supervisor-container {
    padding: 30rpx;
  }
  
  .page-title {
    font-size: 40rpx;
  }
  
  .supervisor-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 24rpx;
  }
  
  .card-actions {
    margin-left: 0;
    width: 100%;
  }
  
  .contact-btn {
    width: 100%;
  }
}
</style>