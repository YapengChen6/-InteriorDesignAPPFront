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
    <scroll-view class="content" scroll-y>
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
          <!-- 阶段列表 -->
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
                <input 
                  :value="stage.name"
                  @input="onNameInput"
                  :data-index="index"
                  class="form-input" 
                  placeholder="例如：水电验收"
                  placeholder-class="placeholder"
                  type="text"
                />
                <view class="error-tip" v-if="stageErrors[index] && stageErrors[index].name">
                  {{ stageErrors[index].name }}
                </view>
              </view>

              <!-- 阶段描述 -->
              <view class="form-group">
                <text class="form-label">阶段描述</text>
                <textarea 
                  :value="stage.description"
                  @input="onDescriptionInput"
                  :data-index="index"
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
                    @change="onStartDateChange"
                    :data-index="index"
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
                    :start="getMinEndDate(index)"
                    :end="getMaxEndDate()"
                    @change="onEndDateChange"
                    :data-index="index"
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
              <view class="time-conflict-tip" v-if="hasTimeConflict(index)">
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

          <!-- 操作按钮 -->
          <view class="actions">
            <button class="btn btn-primary" @tap="uploadStages" :disabled="loading">
              <text class="iconfont icon-upload"></text>
              <text class="btn-text">{{ loading ? '上传中...' : '上传所有阶段' }}</text>
            </button>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 加载提示 -->
    <view class="loading" v-if="loading">
      <text class="loading-text">上传中...</text>
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
        {
          name: '',
          description: '',
          planStartTime: '',
          planEndTime: ''
        }
      ],
      stageErrors: [],
      loading: false
    }
  },
  
  onLoad(options) {
    this.orderId = options.orderId || ''
    this.userId = options.userId || ''
    console.log('施工阶段页面加载，订单ID:', this.orderId, '用户ID:', this.userId)
    this.setDefaultDates()
  },
  
  methods: {
    setDefaultDates() {
      const today = new Date()
      const nextWeek = new Date(today)
      nextWeek.setDate(today.getDate() + 7)
      
      this.$set(this.stages[0], 'planStartTime', this.formatDate(today))
      this.$set(this.stages[0], 'planEndTime', this.formatDate(nextWeek))
    },
    
    formatDate(date) {
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    
    // 阶段名称输入处理
    onNameInput(e) {
      const index = e.currentTarget.dataset.index
      const value = e.detail.value
      this.$set(this.stages[index], 'name', value)
      this.clearFieldError(index, 'name')
      this.validateStageName(index)
    },
    
    // 阶段描述输入处理
    onDescriptionInput(e) {
      const index = e.currentTarget.dataset.index
      const value = e.detail.value
      this.$set(this.stages[index], 'description', value)
    },
    
    // 开始日期选择
    onStartDateChange(e) {
      const index = e.currentTarget.dataset.index
      const value = e.detail.value
      this.$set(this.stages[index], 'planStartTime', value)
      this.clearFieldError(index, 'planStartTime')
      this.validateStageDates(index)
    },
    
    // 结束日期选择
    onEndDateChange(e) {
      const index = e.currentTarget.dataset.index
      const value = e.detail.value
      this.$set(this.stages[index], 'planEndTime', value)
      this.clearFieldError(index, 'planEndTime')
      this.validateStageDates(index)
    },
    
    clearFieldError(index, field) {
      if (this.stageErrors[index] && this.stageErrors[index][field]) {
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
      if (index === 0) {
        return this.formatDate(new Date())
      }
      const prevStage = this.stages[index - 1]
      if (prevStage && prevStage.planEndTime) {
        const nextDay = new Date(prevStage.planEndTime)
        nextDay.setDate(nextDay.getDate() + 1)
        return this.formatDate(nextDay)
      }
      return this.formatDate(new Date())
    },
    
    getMinEndDate(index) {
      const currentStage = this.stages[index]
      if (currentStage && currentStage.planStartTime) {
        const nextDay = new Date(currentStage.planStartTime)
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
    
    hasTimeConflict(index) {
      const currentStage = this.stages[index]
      if (!currentStage.planStartTime || !currentStage.planEndTime) {
        return false
      }
      
      const currentStart = new Date(currentStage.planStartTime)
      const currentEnd = new Date(currentStage.planEndTime)
      
      if (index > 0) {
        const prevStage = this.stages[index - 1]
        if (prevStage.planEndTime) {
          const prevEnd = new Date(prevStage.planEndTime)
          if (currentStart <= prevEnd) {
            return true
          }
        }
      }
      
      if (index < this.stages.length - 1) {
        const nextStage = this.stages[index + 1]
        if (nextStage.planStartTime) {
          const nextStart = new Date(nextStage.planStartTime)
          if (currentEnd >= nextStart) {
            return true
          }
        }
      }
      
      return false
    },
    
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
        planEndTime: newEndTime
      })
      
      this.stageErrors.push({})
    },
    
    removeStage(index) {
      if (this.stages.length > 1) {
        this.stages.splice(index, 1)
        this.stageErrors.splice(index, 1)
      }
    },
    
    validateStageDates(index) {
      const stage = this.stages[index]
      let hasError = false
      
      if (!stage.planStartTime) {
        this.setFieldError(index, 'planStartTime', '请选择开始时间')
        hasError = true
      }
      
      if (!stage.planEndTime) {
        this.setFieldError(index, 'planEndTime', '请选择结束时间')
        hasError = true
      }
      
      if (stage.planStartTime && stage.planEndTime) {
        const startTime = new Date(stage.planStartTime)
        const endTime = new Date(stage.planEndTime)
        
        if (endTime < startTime) {
          this.setFieldError(index, 'planEndTime', '结束时间不能早于开始时间')
          hasError = true
        }
        
        const timeDiff = endTime.getTime() - startTime.getTime()
        const dayDiff = timeDiff / (1000 * 3600 * 24)
        if (dayDiff < 1) {
          this.setFieldError(index, 'planEndTime', '阶段持续时间至少1天')
          hasError = true
        }
      }
      
      return !hasError
    },
    
    async uploadStages() {
      if (!this.validateAllStages()) {
        uni.showToast({
          title: '请完善阶段信息',
          icon: 'none',
          duration: 2000
        })
        return
      }
      
      this.loading = true
      
      try {
        const submitData = {
          orderId: this.orderId,
          userId: this.userId,
          stages: this.stages.map((stage, index) => ({
            orderId: parseInt(this.orderId),
            name: stage.name.trim(),
            description: stage.description.trim(),
            sequence: index + 1,
            planStartTime: stage.planStartTime + ' 00:00:00',
            planEndTime: stage.planEndTime + ' 00:00:00',
            status: 0,
            createdBy: parseInt(this.userId),
            updatedBy: parseInt(this.userId)
          }))
        }
        
        console.log('提交数据:', submitData)
        
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        uni.showToast({
          title: `成功上传 ${this.stages.length} 个施工阶段`,
          icon: 'success',
          duration: 2000
        })
        
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
        
      } catch (error) {
        console.error('上传失败:', error)
        uni.showToast({
          title: error.message || '上传失败，请重试',
          icon: 'none',
          duration: 2000
        })
      } finally {
        this.loading = false
      }
    },
    
    validateAllStages() {
      let isValid = true
      
      this.stageErrors = this.stages.map(() => ({}))
      
      for (let i = 0; i < this.stages.length; i++) {
        const stage = this.stages[i]
        
        if (!this.validateStageName(i)) {
          isValid = false
        }
        
        if (!this.validateStageDates(i)) {
          isValid = false
        }
        
        if (this.hasTimeConflict(i)) {
          uni.showToast({
            title: `阶段 ${i + 1} 与其他阶段时间冲突`,
            icon: 'none',
            duration: 2000
          })
          isValid = false
        }
      }
      
      return isValid
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
    
    .navbar-left {
      .iconfont {
        font-size: 36rpx;
      }
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
  height: calc(100vh - 120rpx);
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
  
  .info-content {
    display: flex;
    flex-direction: column;
    
    .info-item {
      color: #666;
      font-size: 28rpx;
      line-height: 1.8;
      margin-bottom: 10rpx;
    }
  }
}

.stages-card {
  background: white;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.05);
  
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
  position: relative;
  
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
      
      .stage-text {
        font-weight: 600;
        color: #2c6aa0;
        font-size: 32rpx;
      }
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
      box-shadow: 0 4rpx 12rpx rgba(231, 76, 60, 0.3);
      
      .remove-icon {
        line-height: 1;
        margin-bottom: 4rpx;
      }
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
  
  .form-input:focus,
  .form-textarea:focus {
    border-color: #2c6aa0;
  }
  
  .form-textarea {
    min-height: 200rpx;
  }
  
  .date-picker {
    color: #333;
    border: 2rpx solid #ddd;
  }
  
  .date-placeholder {
    color: #999;
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
  
  .iconfont {
    font-size: 28rpx;
  }
  
  .btn-text {
    font-size: 28rpx;
    font-weight: 600;
  }
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
    
    &:disabled {
      background: #ccc;
      opacity: 0.6;
    }
    
    .iconfont {
      font-size: 28rpx;
    }
    
    .btn-text {
      font-size: 28rpx;
      font-weight: 600;
    }
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
  
  .loading-text {
    color: white;
    font-size: 32rpx;
  }
}
</style>