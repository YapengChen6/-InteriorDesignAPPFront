<template>
  <div class="supervisor-container">
    <!-- 顶部标题 -->
    <div class="page-header">
      <h1 class="page-title">寻找监工</h1>
    </div>
    
    <!-- 搜索区域 -->
    <div class="search-section">
      <div class="search-box">
        <input 
          v-model="searchKeyword" 
          type="text" 
          class="search-input" 
          placeholder="输入监工姓名搜索" 
          @input="handleSearch"
        />
        <div class="search-icon">🔍</div>
      </div>
    </div>
    
    <!-- 监工列表 -->
    <div class="supervisor-list">
      <div 
        v-for="supervisor in supervisors" 
        :key="supervisor.userId" 
        class="supervisor-card"
      >
        <div class="supervisor-info">
          <div class="supervisor-name">{{ supervisor.name || '匿名监工' }}</div>
          <div class="supervisor-rating">
            <span class="stars">★★★★★</span>
            <span class="rating-text">5.0</span>
          </div>
          <div class="supervisor-details">
            <div class="detail-item">
              <span class="detail-icon">📁</span>
              <span>{{ supervisor.caseCount || 0 }}个案例</span>
            </div>
            <div class="detail-item">
              <span class="detail-icon">📍</span>
              <span>{{ supervisor.city || '未知地区' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-icon">📞</span>
              <span>{{ formatPhone(supervisor.phone) }}</span>
            </div>
          </div>
        </div>
        <div class="card-actions">
          <button class="contact-btn" @click="contactSupervisor(supervisor.userId)">
            联系监工
          </button>
        </div>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-if="!loading && supervisors.length === 0" class="empty-state">
      <div class="empty-icon">👷</div>
      <div class="empty-text">{{ emptyText }}</div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <span>正在加载监工列表...</span>
    </div>
  </div>
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
  
  mounted() {
    this.loadSupervisors()
  },
  
  methods: {
    // 加载监工列表
    async loadSupervisors() {
      this.loading = true
      
      try {
        const response = await getSupervisorList(this.searchKeyword)
        
        if (response.code === 200) {
          this.supervisors = response.data || []
        } else {
          console.error('获取监工列表失败:', response.msg)
          this.supervisors = []
        }
      } catch (error) {
        console.error('获取监工列表失败:', error)
        this.supervisors = []
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
    
    // 联系监工
    async contactSupervisor(userId) {
      try {
        const confirm = await this.$confirm('确定要联系此监工吗？', '联系监工', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info'
        })
        
        if (confirm) {
          const response = await contactSupervisor(userId)
          
          if (response.code === 200) {
            this.$message.success('联系请求已发送，监工会尽快回复您')
          } else {
            this.$message.error(response.msg || '联系监工失败')
          }
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('联系监工失败:', error)
          this.$message.error('网络错误，请稍后重试')
        }
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
  max-width: 100%;
  margin: 0 auto;
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

/* 搜索区域 */
.search-section {
  background: white;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  height: 40px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  padding: 0 40px 0 15px;
  font-size: 14px;
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
  right: 15px;
  color: #8b5cf6;
  font-size: 16px;
}

/* 监工列表 */
.supervisor-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.supervisor-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.supervisor-info {
  flex: 1;
}

.supervisor-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.supervisor-rating {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.stars {
  color: #ffc107;
  margin-right: 8px;
  font-size: 14px;
}

.rating-text {
  color: #666;
  font-size: 14px;
}

.supervisor-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #666;
}

.detail-icon {
  margin-right: 6px;
  font-size: 12px;
}

.card-actions {
  margin-left: 15px;
}

.contact-btn {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  color: white;
  border: none;
  border-radius: 16px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.contact-btn:hover {
  background: linear-gradient(135deg, #7c3aed, #8b5cf6);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.contact-btn:active {
  transform: translateY(0);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 10px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
}

/* 加载状态 */
.loading {
  text-align: center;
  padding: 30px;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #8b5cf6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式调整 */
@media (max-width: 480px) {
  .supervisor-container {
    padding: 15px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .supervisor-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
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