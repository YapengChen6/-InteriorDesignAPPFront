<template>
  <view class="container">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">已发布需求</text>
      <text class="page-subtitle">点击项目查看详情</text>
    </view>

    <!-- 需求列表 -->
    <view class="demand-list">
      <!-- 空状态 -->
      <view v-if="demandList.length === 0 && !isLoading" class="empty-state">
        <view class="empty-icon">📋</view>
        <text class="empty-title">暂无发布的需求</text>
        <text class="empty-desc">您还没有发布任何装修需求</text>
        <button class="create-btn" @click="goToCreate">发布第一个需求</button>
      </view>

      <!-- 加载状态 -->
      <view v-if="isLoading" class="loading-state">
        <view class="loading-icon">⏳</view>
        <text class="loading-text">加载中...</text>
      </view>

      <!-- 需求卡片列表 - 下拉式设计 -->
      <view v-else-if="demandList.length > 0" class="demand-cards">
        <view 
          v-for="(item, index) in demandList" 
          :key="item.id || index"
          class="demand-card"
          :class="{ 'expanded': expandedItems[index] }"
        >
          <!-- 卡片头部 - 始终显示 -->
          <view class="card-header" @click="toggleExpand(index)">
            <view class="header-main">
              <text class="demand-title">{{ item.title || '未命名项目' }}</text>
              <view class="header-details">
                <text class="address" v-if="item.address">{{ item.address }}</text>
                <view class="status-badge" :class="getStatusClass(item.status)">
                  {{ getStatusText(item.status) }}
                </view>
              </view>
            </view>
            <view class="expand-icon" :class="{ 'expanded': expandedItems[index] }">
              ▼
            </view>
          </view>

          <!-- 可展开的内容 -->
          <view class="expandable-content" v-if="expandedItems[index]">
            <!-- 需求基本信息 -->
            <view class="demand-info">
              <view class="info-row">
                <text class="info-label">服务类型：</text>
                <text class="info-value">{{ getServiceTypeText(item.requiredRoles) }}</text>
              </view>
              <view class="info-row">
                <text class="info-label">预算金额：</text>
                <text class="info-value budget">¥{{ formatMoney(item.budget) }}</text>
              </view>
              <view v-if="item.area" class="info-row">
                <text class="info-label">房屋面积：</text>
                <text class="info-value">{{ item.area }}㎡</text>
              </view>
              <view v-if="item.deadline" class="info-row">
                <text class="info-label">期望完成：</text>
                <text class="info-value">{{ formatDate(item.deadline) }}</text>
              </view>
            </view>

            <!-- 需求描述 -->
            <view v-if="item.description" class="demand-desc">
              <text class="desc-label">需求描述：</text>
              <text class="desc-content">{{ item.description }}</text>
            </view>

            <!-- 卡片底部操作 -->
            <view class="card-actions">
              <text class="create-time">发布于 {{ formatTime(item.createTime) }}</text>
              <view class="action-buttons">
                <!-- 只有状态为进行中（status="1"）时才显示更改需求按钮 -->
                <button 
                  v-if="item.status === '1'" 
                  class="action-btn edit-btn" 
                  @click.stop="editDemand(item)"
                >
                  更改需求
                </button>
                <button class="action-btn delete-btn" @click.stop="deleteDemand(item.id, index)">删除</button>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view v-if="demandList.length > 0" class="bottom-actions">
      <button class="bottom-btn create-new-btn" @click="goToCreate">发布新需求</button>
    </view>
  </view>
</template>

<script>
import { projectApi } from '@/api/project.js'
import { getUserProfile } from '@/api/users.js'

export default {
  data() {
    return {
      demandList: [],
      isLoading: false,
      userId: '',
      expandedItems: [] // 用于跟踪哪些项目是展开状态
    }
  },
  async onLoad() {
    // 页面加载时获取用户数据并加载需求列表
    await this.loadUserAndDemands()
  },
  onShow() {
    // 页面显示时刷新数据
    if (this.userId) {
      this.loadDemandList()
    }
  },
  onPullDownRefresh() {
    // 下拉刷新
    this.loadUserAndDemands().finally(() => {
      uni.stopPullDownRefresh()
    })
  },
  methods: {
    // 编辑需求
    editDemand(item) {
      if (!item.id) {
        uni.showToast({
          title: '项目ID不存在',
          icon: 'none'
        })
        return
      }

      // 跳转到编辑需求页面，传递项目ID
      uni.navigateTo({
        url: `/pages/post/order-change?projectId=${item.id}`
      })
    },

    // 切换项目展开/收起状态
    toggleExpand(index) {
      // 使用Vue.set确保响应式更新
      this.$set(this.expandedItems, index, !this.expandedItems[index])
    },

    // 加载用户信息和需求列表
    async loadUserAndDemands() {
      await this.getUserInfo()
      if (this.userId) {
        await this.loadDemandList()
      }
    },

    // 获取当前用户信息
    async getUserInfo() {
      try {
        uni.showLoading({
          title: '获取用户信息...',
          mask: true
        })
        
        const res = await getUserProfile()
        console.log('用户信息接口返回:', res)
        
        // 根据参考代码的处理方式
        if (res.code === 200) {
          this.userId = res.data.userId
          // 存储到本地存储，与参考代码保持一致
          uni.setStorageSync('userId', this.userId)
          console.log('获取到的用户ID:', this.userId)
        } else {
          throw new Error(res.msg || '获取用户信息失败')
        }
        
        uni.hideLoading()
        return true
        
      } catch (error) {
        console.error('获取用户信息失败:', error)
        uni.hideLoading()
        uni.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        })
        return false
      }
    },

    // 加载需求列表
    async loadDemandList() {
      if (!this.userId) {
        console.log('未获取到用户ID，无法加载需求列表')
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        })
        return
      }

      this.isLoading = true
      try {
        const queryParams = {
          userId: this.userId
        }
        
        console.log('查询参数:', queryParams)
        
        const result = await projectApi.getList(queryParams)
        console.log('获取到的需求列表原始数据:', result)
        
        // 详细检查数据结构
        if (result) {
          console.log('result 类型:', typeof result)
          console.log('result 键名:', Object.keys(result))
          
          if (result.data) {
            console.log('result.data 类型:', typeof result.data)
            console.log('result.data 键名:', Object.keys(result.data))
            
            if (result.data.rows && Array.isArray(result.data.rows)) {
              console.log('第一个项目的完整结构:', result.data.rows[0])
              if (result.data.rows[0]) {
                console.log('第一个项目的所有键名:', Object.keys(result.data.rows[0]))
              }
            }
          }
        }
        
        // 处理返回数据
        let rawList = []
        if (Array.isArray(result)) {
          rawList = result
        } else if (result && Array.isArray(result.records)) {
          rawList = result.records
        } else if (result && Array.isArray(result.list)) {
          rawList = result.list
        } else if (result && result.data && Array.isArray(result.data.rows)) {
          rawList = result.data.rows
        } else if (result && Array.isArray(result.data)) {
          rawList = result.data
        } else {
          rawList = []
          console.warn('未识别的数据结构:', result)
        }
        
        console.log('提取的原始列表:', rawList)
        
        // 确保每个项目都有正确的id字段
        this.demandList = rawList.map((item, index) => {
          // 尝试不同的ID字段名
          const id = item.id || item.projectId || item.projectID || item.ID || item.Id
          console.log(`项目${index} ID解析:`, { 
            id, 
            item,
            availableFields: Object.keys(item) 
          })
          
          // 返回处理后的项目，确保有id字段
          return {
            ...item,
            id: id || `temp-${index}` // 如果没有id，使用临时id
          }
        })
        
        // 初始化所有项目为收起状态
        this.expandedItems = new Array(this.demandList.length).fill(false)
        
        console.log('最终处理后的需求列表:', this.demandList)
        
        if (this.demandList.length === 0) {
          uni.showToast({
            title: '暂无发布的需求',
            icon: 'none'
          })
        }
        
      } catch (error) {
        console.error('加载需求列表失败:', error)
        
        // 根据错误类型显示不同的提示
        let errorMessage = '加载失败，请重试'
        if (error.message && error.message.includes('网络')) {
          errorMessage = '网络连接失败，请检查网络设置'
        } else if (error.message && error.message.includes('未登录')) {
          errorMessage = '请先登录'
        } else if (error.message) {
          errorMessage = error.message
        }
        
        uni.showToast({
          title: errorMessage,
          icon: 'none'
        })
        
        this.demandList = []
      } finally {
        this.isLoading = false
      }
    },

    // 删除需求 - 修复后的方法
    async deleteDemand(projectId, index) {
      console.log('删除方法被调用:', { projectId, index, type: typeof projectId })
      console.log('当前需求列表:', this.demandList)
      
      if (!projectId) {
        console.error('项目ID为空，当前项目数据:', this.demandList[index])
        uni.showToast({
          title: '项目ID不存在',
          icon: 'none'
        })
        return
      }

      // 如果projectId是临时ID，说明没有找到真实ID
      if (projectId.toString().startsWith('temp-')) {
        console.error('项目ID是临时ID，无法删除:', projectId)
        uni.showToast({
          title: '项目数据不完整，无法删除',
          icon: 'none'
        })
        return
      }

      // 确认项目存在
      const project = this.demandList[index]
      if (!project) {
        console.error('未找到对应的项目，索引:', index)
        uni.showToast({
          title: '项目不存在',
          icon: 'none'
        })
        return
      }

      console.log('要删除的项目详情:', project)

      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个需求吗？删除后不可恢复。',
        confirmColor: '#ff4757',
        success: async (res) => {
          if (res.confirm) {
            try {
              uni.showLoading({
                title: '删除中...',
                mask: true
              })
              
              console.log('正在删除项目ID:', projectId)
              
              // 使用修复后的 projectApi.delete 方法
              // 现在会发送: DELETE /project?projectId=xxx
              const result = await projectApi.delete(projectId)
              console.log('删除接口返回:', result)
              
              if (result.code === 200 || result.success) {
                uni.hideLoading()
                uni.showToast({
                  title: '删除成功',
                  icon: 'success',
                  duration: 2000
                })
                
                // 从列表中移除
                this.demandList.splice(index, 1)
                this.expandedItems.splice(index, 1)
                
                // 如果列表为空，显示空状态
                if (this.demandList.length === 0) {
                  setTimeout(() => {
                    this.loadDemandList()
                  }, 500)
                }
              } else {
                uni.hideLoading()
                const errorMsg = result.msg || result.message || '删除失败'
                uni.showToast({
                  title: errorMsg,
                  icon: 'none',
                  duration: 3000
                })
              }
              
            } catch (error) {
              console.error('删除失败:', error)
              uni.hideLoading()
              
              let errorMessage = '删除失败，请重试'
              if (error.message) {
                if (error.message.includes('网络')) {
                  errorMessage = '网络连接失败，请检查网络设置'
                } else if (error.message.includes('未登录')) {
                  errorMessage = '请先登录'
                } else if (error.message.includes('404')) {
                  errorMessage = '项目不存在'
                } else if (error.message.includes('403')) {
                  errorMessage = '无权限删除此项目'
                } else {
                  errorMessage = error.message
                }
              }
              
              uni.showToast({
                title: errorMessage,
                icon: 'none',
                duration: 3000
              })
            }
          }
        }
      })
    },

    // 获取状态样式类
    getStatusClass(status) {
      // 确保状态值转换为字符串进行比较
      const statusStr = String(status)
      const statusMap = {
        '0': 'status-pending',    // 待接单
        '1': 'status-processing', // 进行中
        '2': 'status-completed',  // 已完成
        '3': 'status-cancelled',  // 已取消
        '4': 'status-draft'       // 草稿
      }
      return statusMap[statusStr] || 'status-pending'
    },

    // 获取状态文本
    getStatusText(status) {
      // 确保状态值转换为字符串进行比较
      const statusStr = String(status)
      const statusMap = {
        '0': '待接单',
        '1': '进行中',
        '2': '已完成',
        '3': '已取消',
        '4': '草稿'
      }
      return statusMap[statusStr] || '待接单'
    },

    // 获取服务类型文本
    getServiceTypeText(requiredRoles) {
      const typeMap = {
        1: '设计师',
        2: '监理',
        3: '设计师+监理'
      }
      return typeMap[requiredRoles] || '设计师'
    },

    // 格式化金额
    formatMoney(amount) {
      if (!amount) return '0'
      return parseFloat(amount).toLocaleString('zh-CN')
    },

    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return ''
      return dateString.replace(/-/g, '/')
    },

    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return ''
      
      // 如果是字符串格式的日期，先转换为时间戳
      let date
      if (typeof timestamp === 'string') {
        date = new Date(timestamp.replace(/-/g, '/'))
      } else {
        date = new Date(timestamp)
      }
      
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        return '未知时间'
      }
      
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      
      // 如果是今天内
      if (diff < 24 * 60 * 60 * 1000) {
        if (diff < 60 * 60 * 1000) {
          const minutes = Math.floor(diff / (60 * 1000))
          return minutes <= 0 ? '刚刚' : minutes + '分钟前'
        }
        return Math.floor(diff / (60 * 60 * 1000)) + '小时前'
      }
      
      // 如果是今年内
      if (date.getFullYear() === now.getFullYear()) {
        return (date.getMonth() + 1) + '月' + date.getDate() + '日'
      }
      
      return date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日'
    },

    // 查看详情
    viewDetail(item) {
      uni.showModal({
        title: item.title || '项目详情',
        content: this.getDetailContent(item),
        showCancel: false,
        confirmText: '知道了',
        confirmColor: '#1890ff'
      })
    },

    // 获取详情内容
    getDetailContent(item) {
      let content = `服务类型：${this.getServiceTypeText(item.requiredRoles)}\n`
      content += `预算金额：¥${this.formatMoney(item.budget)}\n`
      content += `当前状态：${this.getStatusText(item.status)}\n`
      
      if (item.area) content += `房屋面积：${item.area}㎡\n`
      if (item.address) content += `装修地址：${item.address}\n`
      if (item.deadline) content += `期望完成：${this.formatDate(item.deadline)}\n`
      if (item.description && item.description !== '暂无详细描述') {
        content += `\n需求描述：${item.description}`
      }
      
      return content
    },

    // 跳转到创建需求页面
    goToCreate() {
      uni.navigateTo({
        url: '/pages/post/order'
      })
    }
  }
}
</script>

<style scoped>
.container {
  background-color: #f8f9fa;
  min-height: 100vh;
  padding: 20rpx;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 60rpx 40rpx;
  text-align: center;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(102, 126, 234, 0.3);
}

.page-title {
  font-size: 44rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 16rpx;
}

.page-subtitle {
  font-size: 28rpx;
  opacity: 0.9;
  display: block;
}

.demand-list {
  flex: 1;
}

.empty-state {
  text-align: center;
  padding: 120rpx 40rpx;
  background: white;
  border-radius: 20rpx;
  margin-top: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 120rpx;
  display: block;
  margin-bottom: 40rpx;
  opacity: 0.7;
}

.empty-title {
  font-size: 36rpx;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
  font-weight: 600;
}

.empty-desc {
  font-size: 28rpx;
  color: #666;
  display: block;
  margin-bottom: 60rpx;
  line-height: 1.6;
}

.create-btn {
  background: linear-gradient(135deg, #ff7e5f, #feb47b);
  color: white;
  border: none;
  border-radius: 50rpx;
  padding: 24rpx 60rpx;
  font-size: 32rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 16rpx rgba(255, 126, 95, 0.3);
}

.create-btn:after {
  border: none;
}

.loading-state {
  text-align: center;
  padding: 120rpx 40rpx;
  background: white;
  border-radius: 20rpx;
  margin-top: 20rpx;
}

.loading-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 30rpx;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 32rpx;
  color: #666;
  display: block;
}

.demand-cards {
  padding-bottom: 140rpx;
}

.demand-card {
  background: white;
  border-radius: 20rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  border: 1rpx solid #f0f0f0;
  transition: all 0.3s ease;
  overflow: hidden;
}

.demand-card:active {
  transform: translateY(2rpx);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.12);
}

/* 卡片头部 - 始终显示 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.card-header:active {
  background-color: #f8f9fa;
}

.header-main {
  flex: 1;
  margin-right: 20rpx;
}

.demand-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #1a1a1a;
  display: block;
  margin-bottom: 16rpx;
  line-height: 1.4;
}

.header-details {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.address {
  font-size: 28rpx;
  color: #666;
  flex: 1;
  margin-right: 20rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.expand-icon {
  font-size: 24rpx;
  color: #999;
  transition: transform 0.3s ease;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

/* 可展开的内容 */
.expandable-content {
  padding: 0 30rpx 30rpx;
  border-top: 1rpx solid #f0f0f0;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 1000px;
  }
}

.demand-info {
  margin: 30rpx 0;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
  font-size: 28rpx;
  line-height: 1.5;
}

.info-label {
  color: #666;
  min-width: 160rpx;
  font-weight: 500;
}

.info-value {
  color: #333;
  flex: 1;
}

.budget {
  color: #ff6b6b;
  font-weight: 600;
  font-size: 32rpx;
}

.demand-desc {
  border-top: 1rpx solid #f0f0f0;
  padding-top: 30rpx;
  margin-bottom: 30rpx;
}

.desc-label {
  color: #666;
  font-size: 28rpx;
  display: block;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.desc-content {
  color: #333;
  font-size: 28rpx;
  line-height: 1.6;
  display: block;
  word-break: break-all;
}

.card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1rpx solid #f0f0f0;
  padding-top: 30rpx;
}

.create-time {
  color: #999;
  font-size: 24rpx;
}

.action-buttons {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  border: none;
  border-radius: 12rpx;
  padding: 16rpx 32rpx;
  font-size: 26rpx;
  font-weight: 600;
  transition: all 0.3s ease;
}

.action-btn:after {
  border: none;
}

.edit-btn {
  background: #52c41a;
  color: white;
}

.edit-btn:active {
  background: #389e0d;
  transform: scale(0.98);
}

.detail-btn {
  background: #4a6fa5;
  color: white;
}

.detail-btn:active {
  background: #3a5a85;
  transform: scale(0.98);
}

.delete-btn {
  background: #f8f9fa;
  color: #ff4757;
  border: 1rpx solid #ff4757;
}

.delete-btn:active {
  background: #ffeaea;
  transform: scale(0.98);
}

.status-badge {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.status-pending {
  background: #fff7e6;
  color: #fa8c16;
  border: 1rpx solid #ffd591;
}

.status-processing {
  background: #e6f7ff;
  color: #1890ff;
  border: 1rpx solid #91d5ff;
}

.status-completed {
  background: #f6ffed;
  color: #52c41a;
  border: 1rpx solid #b7eb8f;
}

.status-cancelled {
  background: #fff2f0;
  color: #ff4d4f;
  border: 1rpx solid #ffccc7;
}

.status-draft {
  background: #fafafa;
  color: #8c8c8c;
  border: 1rpx solid #d9d9d9;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 30rpx 40rpx;
  border-top: 1rpx solid #f0f0f0;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.bottom-btn {
  border: none;
  border-radius: 16rpx;
  padding: 28rpx;
  font-size: 32rpx;
  font-weight: 600;
  width: 100%;
  transition: all 0.3s ease;
}

.bottom-btn:after {
  border: none;
}

.create-new-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.3);
}

.create-new-btn:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.4);
}

/* 响应式设计 */
@media (max-width: 750px) {
  .container {
    padding: 16rpx;
  }
  
  .page-header {
    padding: 40rpx 30rpx;
    border-radius: 16rpx;
  }
  
  .page-title {
    font-size: 38rpx;
  }
  
  .page-subtitle {
    font-size: 26rpx;
  }
  
  .card-header {
    padding: 24rpx;
  }
  
  .header-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 12rpx;
  }
  
  .address {
    margin-right: 0;
    margin-bottom: 8rpx;
  }
  
  .card-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 20rpx;
  }
  
  .action-buttons {
    width: 100%;
    justify-content: flex-end;
  }
  
  .demand-card {
    border-radius: 16rpx;
  }
  
  .expandable-content {
    padding: 0 24rpx 24rpx;
  }
  
  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8rpx;
  }
  
  .info-label {
    min-width: auto;
  }
}
</style>