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
      <!-- 说明区域 -->
      <view class="upload-info">
        <view class="info-header">
          <text class="iconfont icon-info"></text>
          <text class="info-title">阶段说明</text>
        </view>
        <view class="info-content">
          <text class="info-item">• 以下是该订单的所有施工阶段</text>
          <text class="info-item">• 阶段按顺序排列，不可编辑</text>
          <text class="info-item">• 点击"确认所有阶段"将所有待确认阶段设为已确认</text>
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
              :key="stage.orderStageId" 
              class="stage-item"
            >
              <view class="stage-header">
                <view class="stage-number">{{ stage.sequence }}</view>
                <text class="stage-text">阶段 {{ stage.sequence }}</text>
              </view>

              <!-- 阶段名称 -->
              <view class="form-group">
                <text class="form-label">阶段名称</text>
                <view class="form-input readonly">{{ stage.name || '—' }}</view>
              </view>

              <!-- 阶段描述 -->
              <view class="form-group">
                <text class="form-label">阶段描述</text>
                <view class="form-textarea readonly">{{ stage.description || '—' }}</view>
              </view>

              <!-- 计划时间 -->
              <view class="form-row">
                <view class="form-group">
                  <text class="form-label">计划开始时间</text>
                  <view class="date-picker readonly">{{ stage.planStartTime || '—' }}</view>
                </view>
                <view class="form-group">
                  <text class="form-label">计划结束时间</text>
                  <view class="date-picker readonly">{{ stage.planEndTime || '—' }}</view>
                </view>
              </view>

              <!-- 阶段状态 -->
              <view class="form-group">
                <text class="form-label">阶段状态</text>
                <view class="status-badge" :class="stage.statusClass">
                  {{ stage.statusText }}
                </view>
              </view>

              <!-- 时间冲突提示 -->
              <view class="time-conflict-tip" v-if="stage.hasTimeConflict">
                <text class="iconfont icon-warning"></text>
                <text class="conflict-text">该阶段时间与相邻阶段可能存在冲突</text>
              </view>
            </view>
          </view>

          <!-- 操作区：仅确认按钮 -->
          <view class="actions">
            <button 
              v-if="hasUnconfirmedStages"
              class="btn-confirm" 
              @tap="confirmAllStages"
              :disabled="loading"
            >
              <text class="iconfont icon-check"></text>
              <text class="btn-text">{{ loading ? '确认中...' : '确认所有阶段' }}</text>
            </button>
            <view v-else class="all-confirmed-tip">
              <text class="iconfont icon-success"></text>
              <text class="tip-text">所有阶段已确认</text>
            </view>
          </view>
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
      userId: '',
      stages: [],
      loading: false,
      // 状态映射配置
      statusClassMap: {
        0: 'status-pending',
        1: 'status-confirmed',
        2: 'status-progress',
        3: 'status-waiting',
        4: 'status-completed',
        5: 'status-cancelled'
      },
      statusTextMap: {
        0: '待确认',
        1: '已确认', 
        2: '进行中', 
        3: '待验收', 
        4: '已完成', 
        5: '已取消'
      }
    }
  },

  onLoad(options) {
    this.orderId = options.orderId || ''
    this.userId = options.userId || ''
    console.log('施工阶段列表页面加载，订单ID:', this.orderId)
    this.loadStages()
  },

  computed: {
    hasUnconfirmedStages() {
      return this.stages.some(stage => stage.status === 0)
    }
  },

  methods: {
    async loadStages() {
      this.loading = true
      try {
        const { orderStageService } = require('@/api/orderStage.js')
        const response = await orderStageService.list({ orderId: this.orderId })

        const rawData = response.data || []

        // 处理阶段数据，添加状态类名和文本
        this.stages = rawData.map((item, index, array) => {
          const status = Number(item.status) || 0
          return {
            ...item,
            sequence: Number(item.sequence) || 0,
            status: status,
            planStartTime: item.planStartTime || '',
            planEndTime: item.planEndTime || '',
            name: item.name || '',
            description: item.description || '',
            // 直接计算状态类名和文本
            statusClass: this.statusClassMap[status] || 'status-unknown',
            statusText: this.statusTextMap[status] || '未知',
            // 计算时间冲突
            hasTimeConflict: this.calculateTimeConflict(item, index, array)
          }
        }).sort((a, b) => a.sequence - b.sequence)

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

    calculateTimeConflict(current, index, stages) {
      if (!current?.planStartTime || !current?.planEndTime) return false

      const parse = str => {
        if (!str) return null
        const d = new Date(str.replace(/-/g, '/'))
        return isNaN(d.getTime()) ? null : d
      }

      const currStart = parse(current.planStartTime)
      const currEnd = parse(current.planEndTime)
      if (!currStart || !currEnd) return false

      // 检查与前一个阶段的时间冲突
      if (index > 0) {
        const prev = stages[index - 1]
        const prevEnd = parse(prev.planEndTime)
        if (prevEnd && currStart <= prevEnd) return true
      }

      // 检查与后一个阶段的时间冲突
      if (index < stages.length - 1) {
        const next = stages[index + 1]
        const nextStart = parse(next.planStartTime)
        if (nextStart && currEnd >= nextStart) return true
      }

      return false
    },

    // ✅ 修改：使用 confirmOrderStage 接口确认每个阶段
    async confirmAllStages() {
      uni.showModal({
        title: '确认操作',
        content: '确定要将所有待确认阶段设为"已确认"？此操作不可撤销。',
        success: async (res) => {
          if (res.confirm) {
            this.loading = true
            try {
              // 👇 仅导入 confirmOrderStage 方法
              const { confirmOrderStage } = require('@/api/orderStage.js')

              const unconfirmedStages = this.stages.filter(s => s.status === 0 && s.orderStageId)

              if (unconfirmedStages.length === 0) {
                uni.showToast({ title: '没有待确认的阶段', icon: 'none' })
                return
              }

              // 并发调用 /orderStage/confirm 接口
              await Promise.all(
                unconfirmedStages.map(stage => confirmOrderStage(stage.orderStageId))
              )

              // 更新本地状态
              this.stages.forEach(s => {
                if (s.status === 0 && s.orderStageId) {
                  s.status = 1
                  s.statusClass = this.statusClassMap[1]
                  s.statusText = this.statusTextMap[1]
                }
              })

              uni.showToast({
                title: `成功确认 ${unconfirmedStages.length} 个阶段`,
                icon: 'success',
                duration: 2000
              })

              setTimeout(() => {
                uni.navigateBack()
              }, 1500)

            } catch (error) {
              console.error('确认失败:', error)
              uni.showToast({
                title: error?.msg || error.message || '确认失败',
                icon: 'none',
                duration: 2000
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
    .navbar-left .iconfont { 
      font-size: 36rpx; 
    }
    .navbar-title { 
      font-size: 36rpx; 
      font-weight: 600; 
    }
    .navbar-right { 
      width: 36rpx; 
    }
  }
}

.content { 
  padding: 30rpx; 
}

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
    .iconfont { 
      color: #2c6aa0; 
      margin-right: 15rpx; 
      font-size: 32rpx; 
    }
    .info-title { 
      color: #2c6aa0; 
      font-size: 32rpx; 
      font-weight: 600; 
    }
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
    .iconfont { 
      color: #2c6aa0; 
      margin-right: 15rpx; 
      font-size: 32rpx; 
    }
    .header-title { 
      color: #34495e; 
      font-size: 32rpx; 
      font-weight: 600; 
    }
  }
  .card-body { 
    padding: 30rpx; 
  }
}

.stage-item {
  background: #f8f9fa;
  border: 2rpx solid #e1e4e8;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  .stage-header {
    display: flex;
    align-items: center;
    margin-bottom: 30rpx;
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
    .stage-text { 
      font-weight: 600; 
      color: #2c6aa0; 
      font-size: 32rpx; 
    }
  }
}

.form-group {
  margin-bottom: 40rpx;
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
    color: #333;
    box-sizing: border-box;
  }
  .form-textarea { 
    min-height: 200rpx; 
  }
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
  &.status-pending { 
    background: #f39c12; 
    color: white; 
  }
  &.status-confirmed { 
    background: #27ae60; 
    color: white; 
  }
  &.status-progress { 
    background: #3498db; 
    color: white; 
  }
  &.status-waiting { 
    background: #f1c40f; 
    color: #333; 
  }
  &.status-completed { 
    background: #2ecc71; 
    color: white; 
  }
  &.status-cancelled { 
    background: #e74c3c; 
    color: white; 
  }
  &.status-unknown { 
    background: #95a5a6; 
    color: white; 
  }
}

.form-row {
  display: flex;
  gap: 30rpx;
  .form-group { 
    flex: 1; 
    margin-bottom: 0; 
  }
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
  .iconfont { 
    color: #f39c12; 
    font-size: 28rpx; 
  }
  .conflict-text { 
    color: #856404; 
    font-size: 24rpx; 
  }
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 60rpx;
  .btn-confirm {
    background: #27ae60;
    color: white;
    border: none;
    border-radius: 10rpx;
    padding: 24rpx 48rpx;
    display: flex;
    align-items: center;
    gap: 15rpx;
    font-size: 28rpx;
    font-weight: 600;
    &:disabled {
      background: #ccc;
      opacity: 0.6;
    }
    .iconfont { 
      font-size: 28rpx; 
    }
  }
  .all-confirmed-tip {
    display: flex;
    align-items: center;
    gap: 15rpx;
    color: #27ae60;
    font-weight: 600;
    font-size: 28rpx;
    .iconfont { 
      font-size: 32rpx; 
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