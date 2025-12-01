<template>
  <view class="container">
    <!-- 顶部导航 -->
    <view class="custom-navbar">
      <view class="navbar-content">
        <view class="navbar-left" @tap="goBack">
          <text class="iconfont icon-arrow-left"></text>
        </view>
        <view class="navbar-title">施工阶段上传</view>
        <view class="navbar-right"></view>
      </view>
    </view>

    <!-- 页面内容 -->
    <view class="content">
      <!-- 上传说明 -->
      <view class="upload-info">
        <view class="info-header">
          <text class="iconfont icon-info"></text>
          <text class="info-title">上传说明</text>
        </view>
        <view class="info-content">
          <text class="info-item">• 在此页面一次性添加所有施工阶段</text>
          <text class="info-item">• 每个阶段需要填写阶段名称、计划时间和描述</text>
          <text class="info-item">• 顺序号自动生成，无需手动输入</text>
          <text class="info-item">• 点击"添加阶段"按钮可以增加更多施工阶段</text>
          <text class="info-item">• 完成所有阶段填写后，点击"上传所有阶段"按钮提交</text>
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
              :key="index" 
              class="stage-item"
            >
              <view class="stage-header">
                <view class="stage-title">
                  <view class="stage-number">{{ index + 1 }}</view>
                  <text class="stage-text">阶段 {{ index + 1 }}</text>
                </view>
                <view 
                  class="remove-stage" 
                  @tap="removeStage(index)"
                  v-if="stages.length > 1"
                >
                  <text class="remove-icon">×</text>
                </view>
              </view>

              <!-- 阶段名称 -->
              <view class="form-group">
                <text class="form-label">阶段名称 *</text>
                <textarea 
                  v-model="stage.name"
                  class="form-input short-textarea" 
                  placeholder="例如：水电验收"
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
                    :start="minStartDates[index]"
                    :end="maxEndDate"
                    @change="onStartDateChange"
                    :data-index="index.toString()"
                  >
                    <view class="date-picker" :class="{ 'date-placeholder': !stage.planStartTime }">
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
                    :start="minEndDates[index]"
                    :end="maxEndDate"
                    @change="onEndDateChange"
                    :data-index="index.toString()"
                  >
                    <view class="date-picker" :class="{ 'date-placeholder': !stage.planEndTime }">
                      {{ stage.planEndTime || '选择结束时间' }}
                    </view>
                  </picker>
                  <view class="error-tip" v-if="stageErrors[index] && stageErrors[index].planEndTime">
                    {{ stageErrors[index].planEndTime }}
                  </view>
                </view>
              </view>

              <!-- 时间冲突提示 -->
              <view class="time-conflict-tip" v-if="timeConflicts[index]">
                <text class="iconfont icon-warning"></text>
                <text class="conflict-text">该阶段时间与前后阶段可能存在冲突</text>
              </view>
            </view>
          </view>

          <!-- 添加阶段按钮 -->
          <view class="add-stage-btn" @tap="addStage">
            <text class="iconfont icon-plus"></text>
            <text class="btn-text">添加阶段</text>
          </view>

          <!-- 提交按钮 -->
          <view class="actions">
            <button class="btn btn-primary" @tap="uploadStages" :disabled="loading">
              <text class="iconfont icon-upload"></text>
              <text class="btn-text">{{ loading ? '上传中...' : '上传所有阶段' }}</text>
            </button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      orderId: '',
      userId: '',
      stages: [
        { name: '', description: '', planStartTime: '', planEndTime: '' }
      ],
      stageErrors: [{}],
      timeConflicts: [false],
      minStartDates: [],
      minEndDates: [],
      maxEndDate: '',
      loading: false
    }
  },

  onLoad(options) {
    this.orderId = options.orderId || ''
    this.userId = options.userId || ''
    console.log('施工阶段页面加载，订单ID:', this.orderId, '用户ID:', this.userId)
    this.setDefaultDates()
    this.calculateDateLimits()
  },

  watch: {
    stages: {
      handler() {
        this.calculateDateLimits()
        this.checkTimeConflicts()
      },
      deep: true
    }
  },

  methods: {
    setDefaultDates() {
      const today = new Date()
      const nextWeek = new Date(today)
      nextWeek.setDate(today.getDate() + 7)
      
      this.stages[0].planStartTime = this.formatDate(today)
      this.stages[0].planEndTime = this.formatDate(nextWeek)
      
      // 设置最大结束日期（2年后）
      const maxDate = new Date()
      maxDate.setFullYear(maxDate.getFullYear() + 2)
      this.maxEndDate = this.formatDate(maxDate)
    },

    formatDate(date) {
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      return `${year}-${month}-${day}`
    },

    calculateDateLimits() {
      this.minStartDates = this.stages.map((stage, index) => {
        if (index === 0) return this.formatDate(new Date())
        
        const prevEnd = this.stages[index - 1]?.planEndTime
        if (prevEnd) {
          const nextDay = new Date(prevEnd)
          nextDay.setDate(nextDay.getDate() + 1)
          return this.formatDate(nextDay)
        }
        return this.formatDate(new Date())
      })

      this.minEndDates = this.stages.map((stage, index) => {
        const start = stage?.planStartTime
        if (start) {
          const nextDay = new Date(start)
          nextDay.setDate(nextDay.getDate() + 1)
          return this.formatDate(nextDay)
        }
        return this.formatDate(new Date())
      })
    },

    checkTimeConflicts() {
      this.timeConflicts = this.stages.map((stage, index) => {
        return this.hasTimeConflict(index)
      })
    },

    onStartDateChange(e) {
      const index = parseInt(e.currentTarget.dataset.index)
      this.stages[index].planStartTime = e.detail.value
      this.clearFieldError(index, 'planStartTime')
      this.validateStageDates(index)
      this.calculateDateLimits()
      this.checkTimeConflicts()
    },

    onEndDateChange(e) {
      const index = parseInt(e.currentTarget.dataset.index)
      this.stages[index].planEndTime = e.detail.value
      this.clearFieldError(index, 'planEndTime')
      this.validateStageDates(index)
      this.calculateDateLimits()
      this.checkTimeConflicts()
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

    hasTimeConflict(index) {
      const current = this.stages[index]
      if (!current.planStartTime || !current.planEndTime) return false

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

    addStage() {
      const last = this.stages[this.stages.length - 1]
      let start = '', end = ''
      if (last?.planEndTime) {
        const s = new Date(last.planEndTime)
        s.setDate(s.getDate() + 1)
        const e = new Date(s)
        e.setDate(e.getDate() + 7)
        start = this.formatDate(s)
        end = this.formatDate(e)
      }
      this.stages.push({ name: '', description: '', planStartTime: start, planEndTime: end })
      this.stageErrors.push({})
      this.timeConflicts.push(false)
    },

    removeStage(index) {
      if (this.stages.length > 1) {
        this.stages.splice(index, 1)
        this.stageErrors.splice(index, 1)
        this.timeConflicts.splice(index, 1)
      }
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
        if (this.timeConflicts[i]) {
          hasConflict = true
          isValid = false
        }
      }

      if (hasConflict) {
        uni.showToast({ title: '存在阶段时间冲突，请检查', icon: 'none', duration: 2000 })
      }
      return isValid
    },

    async uploadStages() {
      if (!this.validateAllStages()) {
        uni.showToast({ title: '请完善阶段信息', icon: 'none', duration: 2000 })
        return
      }

      const total = this.stages.length
      this.loading = true

      try {
        const { orderStageService } = require('@/api/orderStage.js')

        for (let i = 0; i < total; i++) {
          uni.showLoading({
            title: `正在上传第 ${i + 1}/${total} 个阶段...`,
            mask: true
          })

          const stage = this.stages[i]
          const dto = {
            orderId: parseInt(this.orderId),
            name: stage.name.trim(),
            description: stage.description.trim() || '',
            sequence: i + 1,
            status: 0,
            planStartTime: stage.planStartTime,
            planEndTime: stage.planEndTime
          }

          await orderStageService.save(dto)
          uni.hideLoading()
        }

        uni.showToast({
          title: `✅ 成功上传 ${total} 个施工阶段`,
          icon: 'success',
          duration: 2000
        })

        setTimeout(() => uni.navigateBack(), 1500)

      } catch (error) {
        console.error('上传失败:', error)
        uni.hideLoading()
        const msg = error?.msg || error?.message || '上传失败，请重试'
        uni.showToast({ title: msg, icon: 'none', duration: 3000 })
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
    background: white;
    box-sizing: border-box;
  }
  .form-textarea { min-height: 200rpx; }
  .date-picker { color: #333; }
  .date-placeholder { color: #999; }
}

.short-textarea {
  min-height: 60rpx !important;
  height: 60rpx !important;
  padding: 12rpx 24rpx !important;
  line-height: 1.3;
  overflow: hidden;
  resize: none;
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
}
</style>