<template>
  <view class="container">
    <!-- 顶部导航 -->
    <view class="custom-navbar">
      <view class="navbar-content">
        <view class="navbar-left" @tap="goBack">
          <text class="iconfont icon-arrow-left"></text>
        </view>
        <view class="navbar-title">施工阶段列表</view>
        <view class="navbar-right"></view>
      </view>
    </view>

    <!-- 页面内容 -->
    <view class="content">
      <!-- 上传说明 -->
      <view class="upload-info">
        <view class="info-header">
          <text class="iconfont icon-info"></text>
          <text class="info-title">阶段说明</text>
        </view>
        <view class="info-content">
          <text class="info-item">• 以下是该订单的所有施工阶段</text>
          <text class="info-item">• 阶段按顺序排列，不可编辑</text>
          <text class="info-item">• 点击"确认所有阶段"按钮将所有阶段状态设为已确认</text>
        </view>
      </view>

      <!-- 施工阶段列表 -->
      <view class="stages-card">
        <view class="card-header">
          <text class="iconfont icon-list"></text>
          <text class="header-title">施工阶段列表</text>
        </view>
        
        <view class="card-body">
          <view class="stages-container">
            <view 
              v-for="(stage, index) in stages" 
              :key="stage.orderStageId || 'stage_' + index" 
              class="stage-item"
            >
              <view class="stage-header">
                <view class="stage-title">
                  <view class="stage-number">{{ stage.sequence }}</view>
                  <text class="stage-text">阶段 {{ stage.sequence }}</text>
                </view>
                <!-- 只有在 status=0 时才显示删除按钮 -->
                <view 
                  class="remove-stage" 
                  @tap="removeStage(index, stage.orderStageId)"
                  v-if="stage.status === 0"
                >
                  <text class="remove-icon">×</text>
                </view>
              </view>

              <!-- 阶段名称 -->
              <view class="form-group">
                <text class="form-label">阶段名称</text>
                <view class="form-input readonly">{{ stage.name || '-' }}</view>
              </view>

              <!-- 阶段描述 -->
              <view class="form-group">
                <text class="form-label">阶段描述</text>
                <view class="form-textarea readonly">{{ stage.description || '-' }}</view>
              </view>

              <!-- 计划时间 -->
              <view class="form-row">
                <view class="form-group">
                  <text class="form-label">计划开始时间</text>
                  <view class="date-picker readonly">{{ stage.planStartTime || '-' }}</view>
                </view>
                
                <view class="form-group">
                  <text class="form-label">计划结束时间</text>
                  <view class="date-picker readonly">{{ stage.planEndTime || '-' }}</view>
                </view>
              </view>

              <!-- 阶段状态 -->
              <view class="form-group">
                <text class="form-label">阶段状态</text>
                <view 
                  class="status-badge" 
                  :class="statusClassMap[stage.status] || 'status-unknown'"
                >
                  {{ getStatusText(stage.status) }}
                </view>
              </view>

              <!-- 时间冲突提示 -->
              <view class="time-conflict-tip" v-if="hasTimeConflict(index)">
                <text class="iconfont icon-warning"></text>
                <text class="conflict-text">该阶段时间与前后阶段可能存在冲突</text>
              </view>
            </view>
          </view>

          <!-- 添加阶段按钮（仅在未确认时显示） -->
          <view class="add-stage-btn" @tap="addStage" v-if="allStagesUnconfirmed">
            <text class="iconfont icon-plus"></text>
            <text class="btn-text">添加阶段</text>
          </view>

          <!-- 操作按钮 -->
          <view class="actions">
            <!-- 确认按钮（仅在有未确认阶段时显示） -->
            <button 
              class="btn btn-confirm" 
              @tap="confirmAllStages" 
              :disabled="loading || !hasUnconfirmedStages"
              v-if="hasUnconfirmedStages"
            >
              <text class="iconfont icon-check"></text>
              <text class="btn-text">{{ loading ? '确认中...' : '确认所有阶段' }}</text>
            </button>
            
            <!-- 已确认提示 -->
            <view class="all-confirmed-tip" v-else>
              <text class="iconfont icon-success"></text>
              <text class="tip-text">所有阶段已确认</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 加载提示 -->
    <view class="loading" v-if="loading">
      <text class="loading-text">加载中...</text>
    </view>
  </view>
</template>
<script>
export default {
  data() {
    return {
      orderId: '',
      userId: '',
      stages: [],
      loading: false,
      // 状态样式映射
      statusClassMap: {
        0: 'status-pending',
        1: 'status-confirmed',
        2: 'status-progress',
        3: 'status-waiting',
        4: 'status-completed',
        5: 'status-cancelled'
      }
    }
  },

  onLoad(options) {
    this.orderId = options.orderId || ''
    this.userId = options.userId || ''
    console.log('施工阶段列表页面加载，订单ID:', this.orderId, '用户ID:', this.userId)
    this.loadStages()
  },

  computed: {
    // 是否所有阶段都未确认（status === 0）
    allStagesUnconfirmed() {
      return this.stages.every(stage => stage.status === 0)
    },
    
    // 是否存在未确认的阶段
    hasUnconfirmedStages() {
      return this.stages.some(stage => stage.status === 0)
    }
  },

  methods: {
    // 加载阶段列表
    async loadStages() {
      this.loading = true
      try {
        const { orderStageService } = require('@/api/orderStage.js')
        const stages = await orderStageService.list({ orderId: this.orderId })
        this.stages = stages.sort((a, b) => a.sequence - b.sequence) // 按顺序排序
      } catch (error) {
        console.error('加载阶段失败:', error)
        uni.showToast({
          title: error?.msg || '加载阶段失败',
          icon: 'none',
          duration: 2000
        })
      } finally {
        this.loading = false
      }
    },

    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        0: '待确认',
        1: '已确认',
        2: '进行中',
        3: '待验收',
        4: '已完成',
        5: '已取消'
      }
      return statusMap[status] || '未知'
    },

    // 检查时间冲突（只读展示）
    hasTimeConflict(index) {
      const current = this.stages[index]
      if (!current?.planStartTime || !current?.planEndTime) return false

      const currStart = new Date(current.planStartTime)
      const currEnd = new Date(current.planEndTime)

      // 与前一阶段冲突
      if (index > 0) {
        const prevEnd = this.stages[index - 1]?.planEndTime
        if (prevEnd && currStart <= new Date(prevEnd)) return true
      }

      // 与后一阶段冲突
      if (index < this.stages.length - 1) {
        const nextStart = this.stages[index + 1]?.planStartTime
        if (nextStart && currEnd >= new Date(nextStart)) return true
      }

      return false
    },

    // 删除阶段
    async removeStage(index, orderStageId) {
      if (!orderStageId) {
        // 如果是未保存的阶段，直接从本地数组移除
        this.stages.splice(index, 1)
        return
      }

      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个阶段吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const { orderStageService } = require('@/api/orderStage.js')
              await orderStageService.delete(orderStageId)
              this.stages.splice(index, 1)
              uni.showToast({
                title: '删除成功',
                icon: 'success',
                duration: 1500
              })
            } catch (error) {
              console.error('删除失败:', error)
              uni.showToast({
                title: error?.msg || '删除失败',
                icon: 'none',
                duration: 2000
              })
            }
          }
        }
      })
    },

    // 添加阶段
    addStage() {
      const lastStage = this.stages[this.stages.length - 1]
      let newStartTime = ''
      let newEndTime = ''
      
      if (lastStage && lastStage.planEndTime) {
        const lastEnd = new Date(lastStage.planEndTime)
        const newStart = new Date(lastEnd)
        newStart.setDate(newStart.getDate() + 1)
        const newEnd = new Date(newStart)
        newEnd.setDate(newEnd.getDate() + 7)
        
        newStartTime = this.formatDate(newStart)
        newEndTime = this.formatDate(newEnd)
      }

      this.stages.push({
        name: '',
        description: '',
        planStartTime: newStartTime,
        planEndTime: newEndTime,
        status: 0,
        sequence: this.stages.length + 1
      })
    },

    formatDate(date) {
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      return `${year}-${month}-${day}`
    },

    // 确认所有阶段（status = 1）
    async confirmAllStages() {
      if (!this.hasUnconfirmedStages) {
        return
      }

      uni.showModal({
        title: '确认操作',
        content: '确定要将所有阶段设置为已确认状态吗？此操作不可撤销。',
        success: async (res) => {
          if (res.confirm) {
            this.loading = true
            try {
              const { orderStageService } = require('@/api/orderStage.js')
              
              // 批量更新所有未确认的阶段
              const unconfirmedStages = this.stages.filter(stage => stage.status === 0)
              
              for (const stage of unconfirmedStages) {
                const updatedStage = { ...stage, status: 1 }
                await orderStageService.update(updatedStage)
              }

              // 更新本地状态
              this.stages.forEach(stage => {
                if (stage.status === 0) {
                  stage.status = 1
                }
              })

              uni.showToast({
                title: `成功确认 ${unconfirmedStages.length} 个阶段`,
                icon: 'success',
                duration: 2000
              })

            } catch (error) {
              console.error('确认阶段失败:', error)
              uni.showToast({
                title: error?.msg || '确认失败，请重试',
                icon: 'none',
                duration: 3000
              })
            } finally {
              this.loading = false
            }
          }
        }
      })
    },

    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style lang="scss" scoped>
/* 样式保持不变 */
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

.stage-item {
  background: #f8f9fa;
  border: 2rpx solid #e1e4e8;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  .stage-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;
    .stage-title {
      display: flex;
      align-items: center;
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
      .stage-text { font-weight: 600; color: #2c6aa0; font-size: 32rpx; }
    }
    .remove-stage {
      background: #e74c3c;
      color: white;
      border-radius: 50%;
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40rpx;
      font-weight: bold;
      box-shadow: 0 4rpx 12rpx rgba(231,76,60,0.3);
      .remove-icon { line-height: 1; margin-bottom: 4rpx; }
    }
  }
}

.form-group {
  margin-bottom: 40rpx;
  position: relative;
  .form-label {
    display: block;
    margin-bottom: 20rpx;
    font-weight: 600;
    color: #34495e;
    font-size: 28rpx;
  }
  .form-input,
  .form-textarea,
  .date-picker {
    width: 100%;
    padding: 24rpx;
    border: 2rpx solid #ddd;
    border-radius: 10rpx;
    font-size: 28rpx;
    background: #f5f7fa;
    box-sizing: border-box;
    color: #333;
  }
  .form-textarea { min-height: 200rpx; }
  .date-picker { color: #333; }
  .readonly {
    background: #f8f9fa;
    border: 2rpx solid #e1e4e8;
    cursor: not-allowed;
    user-select: none;
  }
}

.status-badge {
  display: inline-block;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 600;
  &.status-pending { background: #f39c12; color: white; }
  &.status-confirmed { background: #27ae60; color: white; }
  &.status-progress { background: #3498db; color: white; }
  &.status-waiting { background: #f1c40f; color: #333; }
  &.status-completed { background: #2ecc71; color: white; }
  &.status-cancelled { background: #e74c3c; color: white; }
  &.status-unknown { background: #95a5a6; color: white; }
}

.form-row {
  display: flex;
  gap: 30rpx;
  .form-group { flex: 1; margin-bottom: 0; }
}

.placeholder { color: #999; }

.error-tip {
  color: #e74c3c;
  font-size: 24rpx;
  margin-top: 10rpx;
}

.char-count {
  text-align: right;
  color: #999;
  font-size: 24rpx;
  margin-top: 10rpx;
}

.time-conflict-tip {
  background: #fff3cd;
  border: 1rpx solid #ffeaa7;
  border-radius: 8rpx;
  padding: 20rpx;
  display: flex;
  align-items: center;
  gap: 15rpx;
  margin-top: 20rpx;
  .iconfont { color: #f39c12; font-size: 28rpx; }
  .conflict-text { color: #856404; font-size: 24rpx; }
}

.add-stage-btn {
  background: #27ae60;
  color: white;
  border-radius: 10rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15rpx;
  margin-top: 20rpx;
  .iconfont { font-size: 28rpx; }
  .btn-text { font-size: 28rpx; font-weight: 600; }
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 60rpx;
  .btn {
    background: #2c6aa0;
    color: white;
    border: none;
    border-radius: 10rpx;
    padding: 24rpx 48rpx;
    display: flex;
    align-items: center;
    gap: 15rpx;
    &:disabled { background: #ccc; opacity: 0.6; }
    .iconfont { font-size: 28rpx; }
    .btn-text { font-size: 28rpx; font-weight: 600; }
  }
  .btn-confirm {
    background: #27ae60;
  }
  .all-confirmed-tip {
    display: flex;
    align-items: center;
    gap: 15rpx;
    color: #27ae60;
    font-weight: 600;
    font-size: 28rpx;
    .iconfont { font-size: 32rpx; }
  }
}

.loading {
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
  .loading-text { color: white; font-size: 32rpx; }
}
</style>