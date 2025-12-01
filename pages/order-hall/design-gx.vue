<template>
  <view class="container">
    <!-- 顶部导航 -->
    <view class="custom-navbar">
      <view class="navbar-content">
        <view class="navbar-left" @tap="goBack">
          <text class="iconfont icon-arrow-left">←</text>
        </view>
        <view class="navbar-title">修改施工阶段</view>
        <view class="navbar-right"></view>
      </view>
    </view>

    <!-- 页面内容 -->
    <view class="content">
      <!-- 说明区域 -->
      <view class="upload-info">
        <view class="info-header">
          <text class="iconfont icon-info">ℹ️</text>
          <text class="info-title">修改说明</text>
        </view>
        <view class="info-content">
          <text class="info-item">• 可修改施工阶段的名称、描述和时间</text>
          <text class="info-item">• 阶段顺序号不可修改</text>
          <text class="info-item">• 时间冲突会自动检测并提示</text>
          <text class="info-item">• 修改后点击"保存修改"按钮更新阶段信息</text>
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
                <text class="form-label">阶段名称 *</text>
                <textarea
                  v-model="stage.name"
                  class="form-input short-textarea"
                  placeholder="请输入阶段名称"
                  placeholder-class="placeholder"
                  maxlength="50"
                  @blur="() => validateStageName(index)"
                />
                <view class="error-tip" v-if="stageErrors[index] && stageErrors[index].name">
                  {{ stageErrors[index].name }}
                </view>
              </view>

              <!-- 阶段描述 -->
              <view class="form-group">
                <text class="form-label">阶段描述</text>
                <textarea 
                  v-model="stage.description"
                  class="form-textarea" 
                  placeholder="请输入阶段描述..."
                  placeholder-class="placeholder"
                  maxlength="500"
                  auto-height
                />
                <view class="char-count">{{ stage.description.length }}/500</view>
              </view>

              <!-- 计划时间 -->
              <view class="form-row">
                <view class="form-group">
                  <text class="form-label">计划开始时间 *</text>
                  <picker 
                    mode="date" 
                    :value="stage.planStartTime"
                    :start="getMinStartDate(index)"
                    :end="getMaxEndDate()"
                    @change="(e) => onStartDateChange(e, index)"
                  >
                    <view class="date-picker" :class="{'date-placeholder': !stage.planStartTime}">
                      {{ stage.planStartTime || '选择开始时间' }}
                    </view>
                  </picker>
                  <view class="error-tip" v-if="stageErrors[index] && stageErrors[index].planStartTime">
                    {{ stageErrors[index].planStartTime }}
                  </view>
                </view>
                
                <view class="form-group">
                  <text class="form-label">计划结束时间 *</text>
                  <picker 
                    mode="date" 
                    :value="stage.planEndTime"
                    :start="getMinEndDate(index)"
                    :end="getMaxEndDate()"
                    @change="(e) => onEndDateChange(e, index)"
                  >
                    <view class="date-picker" :class="{'date-placeholder': !stage.planEndTime}">
                      {{ stage.planEndTime || '选择结束时间' }}
                    </view>
                  </picker>
                  <view class="error-tip" v-if="stageErrors[index] && stageErrors[index].planEndTime">
                    {{ stageErrors[index].planEndTime }}
                  </view>
                </view>
              </view>

              <!-- 阶段状态 -->
              <view class="form-group">
                <text class="form-label">阶段状态</text>
                <view :class="statusClassMap[stage.status]">
                  {{ getStatusText(stage.status) }}
                </view>
              </view>

              <!-- 时间冲突提示 -->
              <view class="time-conflict-tip" v-if="hasTimeConflict(index)">
                <text class="iconfont icon-warning">⚠️</text>
                <text class="conflict-text">该阶段时间与相邻阶段可能存在冲突</text>
              </view>
            </view>
          </view>

          <!-- 操作按钮 -->
          <view class="actions">
            <button class="btn-cancel" @tap="goBack">
              <text class="btn-text">取消</text>
            </button>
            <button class="btn-save" @tap="saveStages" :disabled="loading">
              <text class="iconfont icon-save">💾</text>
              <text class="btn-text">{{ loading ? '保存中...' : '保存修改' }}</text>
            </button>
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
      stageErrors: [],
      loading: false,
      // 状态类名映射
      statusClassMap: {
        0: 'status-badge status-pending',
        1: 'status-badge status-confirmed',
        2: 'status-badge status-progress',
        3: 'status-badge status-waiting',
        4: 'status-badge status-completed',
        5: 'status-badge status-cancelled'
      }
    }
  },

  onLoad(options) {
    this.orderId = options.orderId || ''
    this.userId = options.userId || ''
    console.log('施工阶段修改页面加载，订单ID:', this.orderId)
    this.loadStages()
  },

  methods: {
    // 加载施工阶段数据
    async loadStages() {
      this.loading = true
      try {
        const { orderStageService } = require('@/api/orderStage.js')
        const response = await orderStageService.list({ orderId: this.orderId })

        const rawData = response.data || []

        this.stages = rawData.map(item => ({
          ...item,
          sequence: Number(item.sequence) || 0,
          status: Number(item.status) || 0,
          planStartTime: item.planStartTime || '',
          planEndTime: item.planEndTime || '',
          name: item.name || '',
          description: item.description || ''
        })).sort((a, b) => a.sequence - b.sequence)

        // 初始化错误对象
        this.stageErrors = this.stages.map(() => ({}))

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

    getStatusText(status) {
      const map = { 0: '待确认', 1: '已确认', 2: '进行中', 3: '待验收', 4: '已完成', 5: '已取消' }
      return map[status] || '未知'
    },

    // 时间选择器相关方法
    onStartDateChange(e, index) {
      this.stages[index].planStartTime = e.detail.value
      this.clearFieldError(index, 'planStartTime')
      this.validateStageDates(index)
    },

    onEndDateChange(e, index) {
      this.stages[index].planEndTime = e.detail.value
      this.clearFieldError(index, 'planEndTime')
      this.validateStageDates(index)
    },

    clearFieldError(index, field) {
      if (this.stageErrors[index]?.[field]) {
        this.$set(this.stageErrors[index], field, '')
      }
    },

    validateStageName(index) {
      const name = this.stages[index].name.trim()
      if (!name) {
        this.setFieldError(index, 'name', '阶段名称不能为空')
        return false
      }
      if (name.length > 50) {
        this.setFieldError(index, 'name', '阶段名称不能超过50个字符')
        return false
      }
      return true
    },

    setFieldError(index, field, message) {
      if (!this.stageErrors[index]) {
        this.$set(this.stageErrors, index, {})
      }
      this.$set(this.stageErrors[index], field, message)
    },

    getMinStartDate(index) {
      if (index === 0) return this.formatDate(new Date())
      const prevEnd = this.stages[index - 1]?.planEndTime
      if (prevEnd) {
        const nextDay = new Date(prevEnd)
        nextDay.setDate(nextDay.getDate() + 1)
        return this.formatDate(nextDay)
      }
      return this.formatDate(new Date())
    },

    getMinEndDate(index) {
      const start = this.stages[index]?.planStartTime
      if (start) {
        const nextDay = new Date(start)
        nextDay.setDate(nextDay.getDate() + 1)
        return this.formatDate(nextDay)
      }
      return this.formatDate(new Date())
    },

    getMaxEndDate() {
      const maxDate = new Date()
      maxDate.setFullYear(maxDate.getFullYear() + 2)
      return this.formatDate(maxDate)
    },

    formatDate(date) {
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      return `${year}-${month}-${day}`
    },

    hasTimeConflict(index) {
      const current = this.stages[index]
      if (!current.planStartTime || !current.planEndTime) return false

      const parse = str => {
        if (!str) return null
        const d = new Date(str.replace(/-/g, '/'))
        return isNaN(d.getTime()) ? null : d
      }

      const currStart = parse(current.planStartTime)
      const currEnd = parse(current.planEndTime)
      if (!currStart || !currEnd) return false

      // 与前一阶段冲突
      if (index > 0) {
        const prevEnd = parse(this.stages[index - 1]?.planEndTime)
        if (prevEnd && currStart <= prevEnd) return true
      }

      // 与后一阶段冲突
      if (index < this.stages.length - 1) {
        const nextStart = parse(this.stages[index + 1]?.planStartTime)
        if (nextStart && currEnd >= nextStart) return true
      }

      return false
    },

    validateStageDates(index) {
      const s = this.stages[index]
      let valid = true

      if (!s.planStartTime) {
        this.setFieldError(index, 'planStartTime', '请选择开始时间')
        valid = false
      }
      if (!s.planEndTime) {
        this.setFieldError(index, 'planEndTime', '请选择结束时间')
        valid = false
      }

      if (s.planStartTime && s.planEndTime) {
        const start = new Date(s.planStartTime)
        const end = new Date(s.planEndTime)
        if (end < start) {
          this.setFieldError(index, 'planEndTime', '结束时间不能早于开始时间')
          valid = false
        } else if ((end - start) / (1000 * 3600 * 24) < 1) {
          this.setFieldError(index, 'planEndTime', '阶段至少持续1天')
          valid = false
        }
      }
      return valid
    },

    validateAllStages() {
      let isValid = true
      let hasConflict = false
      this.stageErrors = this.stages.map(() => ({}))

      for (let i = 0; i < this.stages.length; i++) {
        if (!this.validateStageName(i)) isValid = false
        if (!this.validateStageDates(i)) isValid = false
        if (this.hasTimeConflict(i)) {
          hasConflict = true
          isValid = false
        }
      }

      if (hasConflict) {
        uni.showToast({ title: '存在阶段时间冲突，请检查', icon: 'none', duration: 2000 })
      }
      return isValid
    },

    // 保存修改
    async saveStages() {
      if (!this.validateAllStages()) {
        uni.showToast({ title: '请完善阶段信息', icon: 'none', duration: 2000 })
        return
      }

      this.loading = true
      try {
        const { orderStageService } = require('@/api/orderStage.js')

        const updateRequests = this.stages.map(stage => ({
          orderStageId: stage.orderStageId,
          name: stage.name.trim(),
          description: stage.description.trim() || '',
          planStartTime: stage.planStartTime,
          planEndTime: stage.planEndTime
          // status 和 sequence 保持不变
        }))

        await Promise.all(
          updateRequests.map(payload => orderStageService.update(payload))
        )

        uni.showToast({
          title: '成功更新施工阶段',
          icon: 'success',
          duration: 2000
        })

        setTimeout(() => {
          uni.navigateBack()
        }, 1500)

      } catch (error) {
        console.error('保存失败:', error)
        uni.showToast({
          title: error?.msg || error?.message || '保存失败，请重试',
          icon: 'none',
          duration: 3000
        })
      } finally {
        this.loading = false
      }
    },

    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style>
/* 样式保持不变 */
.container {
  min-height: 100vh;
  background-color: #f0f2f5;
}

.custom-navbar {
  background: linear-gradient(135deg, #2c6aa0, #1a4a7a);
  color: white;
  padding: 20rpx 0;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
}

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

.content {
  padding: 30rpx;
}

.upload-info {
  background: #e8f4fd;
  border-left: 8rpx solid #2c6aa0;
  padding: 30rpx;
  margin-bottom: 30rpx;
  border-radius: 8rpx;
}

.info-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.info-header .iconfont {
  color: #2c6aa0;
  margin-right: 15rpx;
  font-size: 32rpx;
}

.info-title {
  color: #2c6aa0;
  font-size: 32rpx;
  font-weight: 600;
}

.info-content .info-item {
  color: #666;
  font-size: 28rpx;
  line-height: 1.8;
  margin-bottom: 10rpx;
  display: block;
}

.stages-card {
  background: white;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.05);
}

.card-header {
  background-color: #f5f7fa;
  padding: 30rpx;
  border-bottom: 2rpx solid #e1e4e8;
  display: flex;
  align-items: center;
}

.card-header .iconfont {
  color: #2c6aa0;
  margin-right: 15rpx;
  font-size: 32rpx;
}

.header-title {
  color: #34495e;
  font-size: 32rpx;
  font-weight: 600;
}

.card-body {
  padding: 30rpx;
}

.stage-item {
  background: #f8f9fa;
  border: 2rpx solid #e1e4e8;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.stage-header {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
}

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

.form-group {
  margin-bottom: 40rpx;
  position: relative;
}

.form-label {
  display: block;
  margin-bottom: 20rpx;
  font-weight: 600;
  color: #34495e;
  font-size: 28rpx;
}

.form-label::after {
  content: " *";
  color: #e74c3c;
}

.form-input,
.form-textarea,
.date-picker {
  width: 100%;
  padding: 24rpx;
  border: 2rpx solid #ddd;
  border-radius: 10rpx;
  font-size: 28rpx;
  background: white;
  box-sizing: border-box;
}

.short-textarea {
  min-height: 60rpx !important;
  height: 60rpx !important;
  padding: 12rpx 24rpx !important;
  line-height: 1.3;
  overflow: hidden;
  resize: none;
}

.form-textarea {
  min-height: 200rpx;
}

.date-picker {
  color: #333;
}

.date-placeholder {
  color: #999;
}

.form-row {
  display: flex;
  gap: 30rpx;
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

.placeholder {
  color: #999;
}

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

/* 状态样式 */
.status-badge {
  display: inline-block;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 600;
}

.status-pending { background: #f39c12; color: white; }
.status-confirmed { background: #27ae60; color: white; }
.status-progress { background: #3498db; color: white; }
.status-waiting { background: #f1c40f; color: #333; }
.status-completed { background: #2ecc71; color: white; }
.status-cancelled { background: #e74c3c; color: white; }

.time-conflict-tip {
  background: #fff3cd;
  border: 1rpx solid #ffeaa7;
  border-radius: 8rpx;
  padding: 20rpx;
  display: flex;
  align-items: center;
  gap: 15rpx;
  margin-top: 20rpx;
}

.time-conflict-tip .iconfont {
  color: #f39c12;
  font-size: 28rpx;
}

.conflict-text {
  color: #856404;
  font-size: 24rpx;
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 60rpx;
}

.btn-cancel,
.btn-save {
  border: none;
  border-radius: 10rpx;
  padding: 24rpx 48rpx;
  display: flex;
  align-items: center;
  gap: 15rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.btn-cancel {
  background: #95a5a6;
  color: white;
}

.btn-save {
  background: #27ae60;
  color: white;
}

.btn-save:disabled {
  background: #ccc;
  opacity: 0.6;
}

.btn-save .iconfont {
  font-size: 28rpx;
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
}

.loading-text {
  color: white;
  font-size: 32rpx;
}
</style>