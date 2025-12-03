<template>
  <view class="container">
    <!-- 顶部导航 -->
    <view class="custom-navbar">
      <view class="navbar-content">
        <view class="navbar-left" @tap="goBack">
          <text class="iconfont icon-arrow-left">←</text>
        </view>
        <view class="navbar-title">阶段施工记录</view>
        <view class="navbar-right"></view>
      </view>
    </view>

    <!-- 页面内容 -->
    <view class="content">
      <!-- 说明区域 -->
      <view class="upload-info">
        <view class="info-header">
          <text class="iconfont icon-info">ℹ️</text>
          <text class="info-title">施工阶段说明</text>
        </view>
        <view class="info-content">
          <text class="info-item">• 展示项目所有施工阶段状态</text>
          <text class="info-item">• 阶段状态会根据施工进度更新</text>
          <text class="info-item">• 当前可操作的阶段会显示操作按钮</text>
          <text class="info-item">• 点击阶段可查看详细信息</text>
          <text class="info-item">• 点击查看日志可查看历史施工记录</text>
        </view>
      </view>

      <!-- 施工阶段列表 -->
      <view class="stages-card">
        <view class="card-header">
          <text class="iconfont icon-list">📋</text>
          <text class="header-title">施工阶段列表</text>
        </view>

        <view class="card-body">
          <view class="stages-container">
            <view v-for="stage in sortedStages" :key="stage.orderStageId" class="stage-section">
              
              <!-- 阶段标题 -->
              <view class="stage-header">
                <view class="stage-title">
                  <view class="stage-number">{{ stage.sequence }}</view>
                  <view class="stage-info">
                    <text class="stage-name">{{ stage.name }}</text>
                    <!-- 修改：使用计算属性 -->
                    <view class="stage-status" :class="stage.statusClass">
                      {{ getStatusText(stage.status) }}
                    </view>
                  </view>
                </view>
                
                <!-- 操作按钮区域 - 只保留待验收阶段的确认按钮 -->
                <view class="stage-actions-right">
                  <!-- 待验收阶段的确认按钮 -->
                  <button 
                    v-if="stage.status === 3" 
                    class="btn-inspect"
                    @tap.stop="completeStage(stage)"
                  >
                    <text class="iconfont icon-check">✓</text>
                    <text class="btn-text">确认验收</text>
                  </button>
                  
                  <!-- 已完成的阶段 -->
                  <view v-else-if="stage.status === 4" class="completed-badge">
                    <text class="iconfont icon-completed">✓</text>
                    <text class="badge-text">已验收</text>
                  </view>
                  
                  <!-- 其他状态占位 -->
                  <view v-else class="status-placeholder"></view>
                </view>
              </view>

              <!-- 查看日志按钮 -->
              <view 
                v-if="stage.status >= 2" 
                class="view-log-btn"
                @tap="viewStageLogs(stage)"
              >
                <text class="iconfont icon-history">📜</text>
                <text class="btn-text">查看日志</text>
              </view>

              <!-- 阶段详情 -->
              <view class="stage-content" v-if="stage.expanded">
                <view class="stage-details">
                  <view class="detail-item">
                    <text class="detail-label">阶段描述：</text>
                    <text class="detail-value">{{ stage.description || '暂无描述' }}</text>
                  </view>
                  <view class="detail-item">
                    <text class="detail-label">创建人：</text>
                    <text class="detail-value">{{ stage.creatorInfo ? stage.creatorInfo.nickName || stage.creatorInfo.userName : '未知用户' }}</text>
                  </view>
                  <view class="detail-item">
                    <text class="detail-label">创建时间：</text>
                    <text class="detail-value">{{ formatDate(stage.createTime) }}</text>
                  </view>
                  <view class="detail-item">
                    <text class="detail-label">预计开始时间：</text>
                    <text class="detail-value">{{ formatDate(stage.planStartTime) || '未设置' }}</text>
                  </view>
                  <view class="detail-item">
                    <text class="detail-label">预计完成时间：</text>
                    <text class="detail-value">{{ formatDate(stage.planEndTime) || '未设置' }}</text>
                  </view>
                  <view v-if="stage.status >= 2" class="detail-item">
                    <text class="detail-label">实际开始时间：</text>
                    <text class="detail-value">{{ formatDate(stage.actualStartTime) || '未开始' }}</text>
                  </view>
                  <view v-if="stage.status === 4" class="detail-item">
                    <text class="detail-label">实际完成时间：</text>
                    <text class="detail-value">{{ formatDate(stage.actualFinishTime) || '未完成' }}</text>
                  </view>
                </view>
                
                <!-- 历史施工记录预览 - 始终显示前3条记录 -->
                <view v-if="stage.status >= 2" class="stage-history">
                  <view class="history-title">
                    <text class="iconfont icon-history">📜</text>
                    <text class="title-text">最近施工记录</text>
                    <text class="view-all" @tap="viewStageLogs(stage)">查看全部</text>
                  </view>
                  
                  <!-- 如果有施工记录，显示前3条 -->
                  <view v-if="stage.recentLogs && stage.recentLogs.length > 0" class="history-list">
                    <view v-for="record in stage.recentLogs.slice(0, 3)" :key="record.orderTaskId" class="history-item">
                      <view class="record-header">
                        <text class="record-time">{{ formatDate(record.createTime) }}</text>
                        <text class="record-creator">{{ record.creatorInfo ? record.creatorInfo.nickName || record.creatorInfo.userName : '未知用户' }}</text>
                      </view>
                      <text class="record-content">{{ record.description || '无描述' }}</text>
                      <view v-if="record.mediaList && record.mediaList.length > 0" class="record-images">
                        <text class="image-count">{{ record.mediaList.length }}张图片</text>
                      </view>
                    </view>
                  </view>
                  
                  <!-- 如果没有施工记录 -->
                  <view v-else class="empty-history">
                    <text class="iconfont icon-empty">📝</text>
                    <text class="empty-text">暂无施工记录</text>
                  </view>
                </view>
              </view>
              
              <!-- 折叠/展开按钮 -->
              <view class="stage-toggle" @tap="toggleStage(stage)">
                <text class="toggle-text">{{ stage.expanded ? '收起' : '展开' }}详情</text>
                <text class="iconfont">{{ stage.expanded ? '↑' : '↓' }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 日志详情模态框 -->
    <view v-if="showLogModal" class="log-modal" @tap="closeLogModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">
            <text class="iconfont icon-doc">📋</text>
            {{ currentStageName }} - 施工日志
          </text>
          <text class="iconfont icon-close" @tap="closeLogModal">×</text>
        </view>
        
        <scroll-view scroll-y class="modal-body">
          <view v-if="stageLogs.length > 0" class="logs-list">
            <view v-for="log in stageLogs" :key="log.orderTaskId" class="log-item">
              <view class="log-header">
                <view class="log-info">
                  <text class="log-time">{{ formatDate(log.createTime) }}</text>
                  <text class="log-creator">{{ log.creatorInfo ? log.creatorInfo.nickName || log.creatorInfo.userName : '未知用户' }}</text>
                </view>
                <text class="log-type">施工日志</text>
              </view>
              
              <view class="log-content">
                <text class="log-desc">{{ log.description || '无描述' }}</text>
              </view>
              
              <view v-if="log.mediaList && log.mediaList.length > 0" class="log-images">
                <view class="images-title">
                  <text class="iconfont icon-image">🖼️</text>
                  <text class="title-text">现场照片 ({{ log.mediaList.length }}张)</text>
                </view>
                <view class="images-grid">
                  <view v-for="(media, imgIndex) in log.mediaList.slice(0, 6)" :key="media.mediaId" class="image-item" @tap="previewImage(log.mediaList, imgIndex)">
                    <image :src="media.fileUrl" class="preview-image" mode="aspectFill" lazy-load />
                    <view v-if="imgIndex === 5 && log.mediaList.length > 6" class="more-images">
                      <text>+{{ log.mediaList.length - 6 }}</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
          
          <view v-else class="empty-logs">
            <text class="iconfont icon-empty">📝</text>
            <text class="empty-text">暂无施工日志记录</text>
          </view>
        </scroll-view>
        
        <view class="modal-footer">
          <button class="btn-close" @tap="closeLogModal">
            <text class="btn-text">关闭</text>
          </button>
        </view>
      </view>
    </view>

    <!-- 加载遮罩 -->
    <view v-if="loading" class="loading-mask">
      <text class="loading-text">加载中...</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      orderId: '',
      stages: [],
      loading: false,
      showLogModal: false,
      currentStage: null,
      stageLogs: [],
      statusMap: {
        0: '待确认',
        1: '已确认',
        2: '进行中',
        3: '待验收',
        4: '已完成',
        5: '已取消'
      }
    }
  },

  computed: {
    sortedStages() {
      return [...this.stages].sort((a, b) => a.sequence - b.sequence).map(stage => {
        return {
          ...stage,
          statusClass: this.getStatusClass(stage.status)
        }
      })
    },
    currentStageName() {
      return this.currentStage ? this.currentStage.name : ''
    }
  },

  onLoad(options) {
    this.orderId = options.orderId || ''
    if (!this.orderId) {
      uni.showToast({ title: '缺少订单ID', icon: 'none' })
      setTimeout(() => this.goBack(), 1500)
      return
    }
    this.loadStages()
  },

  methods: {
    async loadStages() {
      this.loading = true
      try {
        const { orderStageService } = require('@/api/orderStage.js')
        const response = await orderStageService.list({ orderId: this.orderId })

        const rawData = response.data || []
        
        // 批量获取创建者信息
        const creatorIds = rawData
          .filter(item => item.createBy)
          .map(item => item.createBy)
          .filter((value, index, self) => self.indexOf(value) === index)
        
        const creatorMap = await this.getUserInfoMap(creatorIds)
        
        this.stages = await Promise.all(
          rawData.map(async (item) => {
            const stageData = {
              ...item,
              sequence: Number(item.sequence) || 0,
              status: Number(item.status) || 0,
              name: item.name || '',
              description: item.description || '',
              expanded: false,
              recentLogs: [],
              statusClass: this.getStatusClass(Number(item.status) || 0),
              creatorInfo: creatorMap[item.createBy] || null
            }

            // 对于已开始及以上的阶段，加载任务列表
            if (stageData.status >= 2) {
              try {
                const { getOrderTaskList } = require('@/api/orderTask.js')
                const taskResponse = await getOrderTaskList({
                  stageId: stageData.orderStageId,
                  pageNum: 1,
                  pageSize: 10
                })
                
                if (taskResponse && taskResponse.data && taskResponse.data.length > 0) {
                  // 获取任务创建者信息
                  const taskCreatorIds = taskResponse.data
                    .filter(task => task.createBy)
                    .map(task => task.createBy)
                    .filter((value, index, self) => self.indexOf(value) === index)
                  
                  const taskCreatorMap = await this.getUserInfoMap(taskCreatorIds)
                  
                  stageData.recentLogs = taskResponse.data
                    .map(task => ({
                      ...task,
                      id: task.orderTaskId,
                      imageUrls: (task.mediaList || []).map(media => media.fileUrl),
                      creatorInfo: taskCreatorMap[task.createBy] || null
                    }))
                    .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
                    .slice(0, 3)
                }
              } catch (error) {
                console.error(`加载阶段${stageData.name}的任务列表失败:`, error)
              }
            }

            return stageData
          })
        )
      } catch (error) {
        console.error('加载阶段失败:', error)
        uni.showToast({
          title: error?.msg || error.message || '加载失败',
          icon: 'none',
          duration: 2000
        })
      } finally {
        this.loading = false
      }
    },

    // 获取用户信息映射表 - 使用统一的用户信息接口
    async getUserInfoMap(userIds) {
      if (!userIds || userIds.length === 0) return {}
      
      const userMap = {}
      
      // 批量获取用户信息，统一使用 getUserById 方法
      const userPromises = userIds.map(async (userId) => {
        try {
          const { getUserById } = require('@/api/users.js')
          const userResponse = await getUserById({ userId })
          
          if (userResponse && userResponse.code === 200 && userResponse.data) {
            // 根据示例数据格式处理响应
            const userData = userResponse.data
            userMap[userId] = {
              userId: userData.userId,
              userName: userData.userName,
              nickName: userData.nickName,
              phone: userData.phone,
              avatar: userData.avatar,
              sex: userData.sex,
              email: userData.email,
              status: userData.status,
              createTime: userData.createTime,
              remark: userData.remark
            }
          } else {
            console.warn(`用户ID ${userId} 信息获取失败:`, userResponse)
          }
        } catch (error) {
          console.error(`获取用户ID ${userId} 信息失败:`, error)
        }
      })
      
      await Promise.all(userPromises)
      return userMap
    },

    toggleStage(stage) {
      const index = this.stages.findIndex(s => s.orderStageId === stage.orderStageId)
      if (index !== -1) {
        this.stages[index].expanded = !this.stages[index].expanded
      }
    },

    async completeStage(stage) {
      uni.showModal({
        title: '确认验收',
        content: `确定要完成"${stage.name}"阶段的验收吗？`,
        success: async (res) => {
          if (res.confirm) {
            this.loading = true
            try {
              const { updateOrderStage } = require('@/api/orderStage.js')
              await updateOrderStage({
                orderStageId: stage.orderStageId,
                status: 4
              })
              uni.showToast({ title: '阶段验收完成', icon: 'success' })
              this.loadStages()
            } catch (error) {
              console.error('完成阶段验收失败:', error)
              uni.showToast({
                title: error?.msg || '操作失败，请重试',
                icon: 'none'
              })
            } finally {
              this.loading = false
            }
          }
        }
      })
    },

    async viewStageLogs(stage) {
      this.currentStage = stage
      this.loading = true
      
      try {
        const { getOrderTaskList } = require('@/api/orderTask.js')
        const response = await getOrderTaskList({
          stageId: stage.orderStageId,
          pageNum: 1,
          pageSize: 50
        })
        
        if (response && response.data && response.data.length > 0) {
          // 获取任务创建者信息
          const creatorIds = response.data
            .filter(task => task.createBy)
            .map(task => task.createBy)
            .filter((value, index, self) => self.indexOf(value) === index)
          
          const creatorMap = await this.getUserInfoMap(creatorIds)
          
          this.stageLogs = response.data
            .map(task => ({
              ...task,
              type: '施工日志',
              imageUrls: (task.mediaList || []).map(media => media.fileUrl),
              creatorInfo: creatorMap[task.createBy] || null
            }))
            .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
        } else {
          this.stageLogs = []
        }
        
        this.showLogModal = true
      } catch (error) {
        console.error('加载阶段日志失败:', error)
        uni.showToast({
          title: '加载日志失败，请重试',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    closeLogModal() {
      this.showLogModal = false
      this.currentStage = null
      this.stageLogs = []
    },

    previewImage(mediaList, index) {
      if (mediaList && mediaList.length > 0) {
        const imageUrls = mediaList.map(media => media.fileUrl)
        uni.previewImage({
          current: Math.min(index, imageUrls.length - 1),
          urls: imageUrls
        })
      }
    },

    getStatusText(status) {
      return this.statusMap[status] || '未知状态'
    },

    getStatusClass(status) {
      const classMap = {
        0: 'status-pending',
        1: 'status-confirmed',
        2: 'status-progress',
        3: 'status-inspect',
        4: 'status-completed',
        5: 'status-cancelled'
      }
      return classMap[status] || 'status-unknown'
    },

    formatDate(dateString) {
      if (!dateString) return ''
      try {
        const date = new Date(dateString)
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      } catch (e) {
        return dateString
      }
    },

    goBack() {
      uni.navigateBack()
    }
  }
}
</script>
<style lang="scss" scoped>
/* 注意：小程序中不使用 :deep() 选择器，如需覆盖子组件样式，请使用其他方法 */

.container {
  min-height: 100vh;
  background-color: #f0f2f5;
}

.custom-navbar {
  background: linear-gradient(135deg, #2c6aa0, #1a4a7a);
  color: white;
  padding: 20rpx 0;
  .navbar-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 30rpx;
    .navbar-left .iconfont { font-size: 36rpx; }
    .navbar-title { font-size: 36rpx; font-weight: 600; }
    .navbar-right { width: 36rpx; }
  }
}

.content { padding: 30rpx; }

.upload-info {
  background: #e8f4fd;
  border-left: 8rpx solid #2c6aa0;
  padding: 30rpx;
  margin-bottom: 30rpx;
  border-radius: 8rpx;
  .info-header {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
    .iconfont { color: #2c6aa0; margin-right: 15rpx; font-size: 32rpx; }
    .info-title { color: #2c6aa0; font-size: 32rpx; font-weight: 600; }
  }
  .info-content .info-item {
    color: #666;
    font-size: 28rpx;
    line-height: 1.8;
    margin-bottom: 10rpx;
  }
}

.stages-card {
  background: white;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.05);
  .card-header {
    background-color: #f5f7fa;
    padding: 30rpx;
    border-bottom: 2rpx solid #e1e4e8;
    display: flex;
    align-items: center;
    .iconfont { color: #2c6aa0; margin-right: 15rpx; font-size: 32rpx; }
    .header-title { color: #34495e; font-size: 32rpx; font-weight: 600; }
  }
  .card-body { padding: 30rpx; }
}

.stage-section {
  background: #f8f9fa;
  border: 2rpx solid #e1e4e8;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
  overflow: hidden;
}

.stage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  background: white;
  .stage-title {
    display: flex;
    align-items: center;
    flex: 1;
    .stage-number {
      background: #2c6aa0;
      color: white;
      width: 60rpx;
      height: 60rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28rpx;
      margin-right: 20rpx;
      font-weight: bold;
    }
    .stage-info {
      display: flex;
      flex-direction: column;
      gap: 10rpx;
      .stage-name { 
        font-weight: 600; 
        color: #2c6aa0; 
        font-size: 32rpx;
      }
      .stage-status {
        font-size: 24rpx;
        padding: 6rpx 12rpx;
        border-radius: 20rpx;
        display: inline-block;
        width: fit-content;
        
        &.status-pending { background: #ffebee; color: #f44336; }
        &.status-confirmed { background: #e8f5e9; color: #4caf50; }
        &.status-progress { background: #e3f2fd; color: #2196f3; }
        &.status-inspect { background: #fff3e0; color: #ff9800; }
        &.status-completed { background: #e8f5e9; color: #4caf50; }
        &.status-cancelled { background: #f5f5f5; color: #9e9e9e; }
        &.status-unknown { background: #f5f5f5; color: #9e9e9e; }
      }
    }
  }
  
  .stage-actions-right {
    display: flex;
    align-items: center;
    gap: 10rpx;
    
    /* 确认验收按钮样式 */
    .btn-inspect {
      min-width: 160rpx;
      height: 60rpx;
      border: none;
      border-radius: 30rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10rpx;
      font-size: 26rpx;
      font-weight: 600;
      padding: 0 24rpx;
      background: linear-gradient(135deg, #ff9800, #f57c00);
      color: white;
      
      .iconfont {
        font-size: 24rpx;
      }
    }
    
    .completed-badge {
      min-width: 120rpx;
      height: 60rpx;
      border-radius: 30rpx;
      background: #e8f5e9;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8rpx;
      padding: 0 20rpx;
      
      .iconfont {
        color: #4caf50;
        font-size: 24rpx;
      }
      
      .badge-text {
        color: #4caf50;
        font-size: 24rpx;
        font-weight: 500;
      }
    }
    
    .status-placeholder {
      width: 120rpx;
      height: 60rpx;
    }
  }
}

.view-log-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15rpx 30rpx;
  background: #f0f7ff;
  border-top: 1rpx solid #e1e4e8;
  border-bottom: 1rpx solid #e1e4e8;
  cursor: pointer;
  
  .iconfont {
    color: #2c6aa0;
    margin-right: 10rpx;
    font-size: 26rpx;
  }
  
  .btn-text {
    color: #2c6aa0;
    font-size: 26rpx;
    font-weight: 500;
  }
  
  &:active {
    opacity: 0.7;
    background: #e1ecff;
  }
}

.stage-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx;
  background: #f8f9fa;
  border-top: 2rpx solid #e1e4e8;
  cursor: pointer;
  
  .toggle-text {
    color: #666;
    font-size: 26rpx;
    margin-right: 10rpx;
  }
  
  .iconfont {
    color: #666;
    font-size: 24rpx;
  }
}

.stage-content {
  padding: 30rpx;
  background: #f8f9fa;
  
  .stage-details {
    background: white;
    border-radius: 12rpx;
    padding: 24rpx;
    margin-bottom: 30rpx;
    
    .detail-item {
      display: flex;
      margin-bottom: 16rpx;
      font-size: 28rpx;
      
      .detail-label {
        color: #666;
        min-width: 180rpx;
      }
      
      .detail-value {
        color: #333;
        flex: 1;
        word-break: break-word;
      }
    }
  }
  
  .stage-history {
    background: white;
    border-radius: 12rpx;
    padding: 24rpx;
    
    .history-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20rpx;
      
      .iconfont {
        color: #2c6aa0;
        margin-right: 15rpx;
        font-size: 28rpx;
      }
      
      .title-text {
        color: #34495e;
        font-size: 28rpx;
        font-weight: 600;
        flex: 1;
      }
      
      .view-all {
        color: #2c6aa0;
        font-size: 24rpx;
        cursor: pointer;
        
        &:active {
          opacity: 0.7;
        }
      }
    }
    
    .history-list {
      .history-item {
        padding: 20rpx 0;
        border-bottom: 1rpx solid #eee;
        &:last-child { border-bottom: none; }
        
        .record-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8rpx;
          
          .record-time { 
            color: #999; 
            font-size: 24rpx; 
          }
          
          .record-creator {
            color: #666;
            font-size: 24rpx;
            font-weight: 500;
          }
        }
        
        .record-content { 
          color: #333; 
          font-size: 26rpx; 
          line-height: 1.5; 
          margin-bottom: 8rpx;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          overflow: hidden;
        }
        
        .record-images {
          .image-count {
            color: #666;
            font-size: 22rpx;
            background: #f5f5f5;
            padding: 4rpx 12rpx;
            border-radius: 12rpx;
          }
        }
      }
    }
    
    .empty-history {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60rpx 0;
      text-align: center;
      
      .iconfont { 
        font-size: 80rpx; 
        color: #ddd; 
        margin-bottom: 20rpx; 
      }
      .empty-text { 
        color: #999; 
        font-size: 28rpx; 
        margin-bottom: 10rpx;
      }
    }
  }
}

.log-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 30rpx;
  
  .modal-content {
    background: white;
    border-radius: 20rpx;
    width: 100%;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx;
    background: #2c6aa0;
    color: white;
    
    .modal-title {
      font-size: 30rpx;
      font-weight: 600;
      display: flex;
      align-items: center;
      
      .iconfont {
        margin-right: 10rpx;
        font-size: 30rpx;
      }
    }
    
    .icon-close {
      font-size: 36rpx;
      cursor: pointer;
      padding: 10rpx;
      
      &:active {
        opacity: 0.7;
      }
    }
  }
  
  .modal-body {
    flex: 1;
    padding: 30rpx;
  }
  
  .logs-list {
    .log-item {
      background: #f8f9fa;
      border-radius: 12rpx;
      padding: 24rpx;
      margin-bottom: 20rpx;
      
      .log-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 15rpx;
        
        .log-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4rpx;
          
          .log-time {
            color: #666;
            font-size: 24rpx;
          }
          
          .log-creator {
            color: #2c6aa0;
            font-size: 26rpx;
            font-weight: 500;
          }
        }
        
        .log-type {
          background: #2c6aa0;
          color: white;
          padding: 4rpx 12rpx;
          border-radius: 12rpx;
          font-size: 22rpx;
        }
      }
      
      .log-content {
        .log-desc {
          color: #333;
          font-size: 26rpx;
          line-height: 1.6;
        }
      }
      
      .log-images {
        margin-top: 15rpx;
        
        .images-title {
          display: flex;
          align-items: center;
          margin-bottom: 15rpx;
          
          .iconfont {
            color: #2c6aa0;
            margin-right: 10rpx;
            font-size: 24rpx;
          }
          
          .title-text {
            color: #666;
            font-size: 24rpx;
          }
        }
        
        .images-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10rpx;
          
          .image-item {
            position: relative;
            width: 100%;
            padding-top: 100%;
            border-radius: 8rpx;
            overflow: hidden;
            
            .preview-image {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
            }
            
            .more-images {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 20rpx;
              font-weight: bold;
            }
          }
        }
      }
    }
  }
  
  .empty-logs {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 100rpx 30rpx;
    text-align: center;
    
    .iconfont {
      font-size: 100rpx;
      color: #ddd;
      margin-bottom: 30rpx;
    }
    
    .empty-text {
      color: #999;
      font-size: 30rpx;
    }
  }
  
  .modal-footer {
    display: flex;
    gap: 20rpx;
    padding: 30rpx;
    border-top: 1rpx solid #e1e4e8;
    
    button {
      flex: 1;
      height: 80rpx;
      border: none;
      border-radius: 12rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10rpx;
      font-size: 28rpx;
      font-weight: 500;
      
      &.btn-close {
        background: #f5f5f5;
        color: #666;
      }
    }
  }
}

.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  .loading-text {
    color: white;
    font-size: 32rpx;
  }
}
</style>