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
          <text class="info-title">上传说明</text>
        </view>
        <view class="info-content">
          <text class="info-item">• 为每个施工阶段上传详细的施工记录</text>
          <text class="info-item">• 每个阶段可上传多张图片和文字说明</text>
          <text class="info-item">• 图片将按上传顺序显示</text>
          <text class="info-item">• 完成所有记录后点击"提交所有记录"</text>
        </view>
      </view>

      <!-- 施工阶段列表 -->
      <view class="stages-card">
        <view class="card-header">
          <text class="iconfont icon-list">📋</text>
          <text class="header-title">施工阶段记录</text>
        </view>

        <view class="card-body">
          <view class="stages-container">
            <view 
              v-for="(stage, stageIndex) in stages" 
              :key="stage.orderStageId" 
              class="stage-section"
            >
              <!-- 阶段标题 -->
              <view class="stage-header" @tap="toggleStage(stageIndex)">
                <view class="stage-title">
                  <view class="stage-number">{{ stage.sequence }}</view>
                  <text class="stage-name">{{ stage.name }}</text>
                </view>
                <view class="stage-arrow">
                  <text class="iconfont" :class="arrowClassMap[stage.expanded ? 'up' : 'down']">
                    {{ stage.expanded ? '↑' : '↓' }}
                  </text>
                </view>
              </view>

              <!-- 阶段内容 - 可折叠 -->
              <view class="stage-content" v-if="stage.expanded">
                <!-- 图片上传区域 -->
                <view class="upload-section">
                  <view class="section-title">
                    <text class="iconfont icon-image">🖼️</text>
                    <text class="title-text">施工图片</text>
                  </view>
                  
                  <view class="images-container">
                    <!-- 已上传的图片 -->
                    <view 
                      v-for="(image, imgIndex) in stage.images" 
                      :key="imgIndex"
                      class="image-item"
                    >
                      <image 
                        :src="image.url" 
                        class="uploaded-image"
                        mode="aspectFill"
                        @tap="previewImage(stageIndex, imgIndex)"
                      />
                      <view class="image-actions">
                        <view class="action-btn" @tap="removeImage(stageIndex, imgIndex)">
                          <text class="iconfont icon-delete">🗑️</text>
                        </view>
                      </view>
                    </view>
                    
                    <!-- 添加图片按钮 -->
                    <view class="add-image-btn" @tap="chooseImage(stageIndex)">
                      <view class="add-icon">
                        <text class="iconfont icon-add">+</text>
                      </view>
                      <text class="add-text">添加图片</text>
                      <text class="image-count" v-if="stage.images.length > 0">
                        {{ stage.images.length }}/9
                      </text>
                    </view>
                  </view>
                </view>

                <!-- 文字说明区域 -->
                <view class="text-section">
                  <view class="section-title">
                    <text class="iconfont icon-text">📝</text>
                    <text class="title-text">施工说明</text>
                  </view>
                  
                  <textarea 
                    v-model="stage.description"
                    class="description-textarea"
                    placeholder="请输入该阶段的施工说明、注意事项、完成情况等..."
                    placeholder-class="placeholder"
                    maxlength="1000"
                    auto-height
                  />
                  <view class="char-count">{{ stage.description.length }}/1000</view>
                </view>

                <!-- 当前阶段提交按钮 -->
                <view class="stage-actions">
                  <button 
                    class="btn-stage-submit" 
                    @tap="submitStage(stageIndex)"
                    :disabled="stage.submitting"
                  >
                    <text class="iconfont icon-check">✓</text>
                    <text class="btn-text">
                      {{ stage.submitting ? '提交中...' : '提交本阶段记录' }}
                    </text>
                  </button>
                </view>
              </view>
            </view>
          </view>

          <!-- 全局操作按钮 -->
          <view class="global-actions">
            <button 
              class="btn-submit-all" 
              @tap="submitAllStages"
              :disabled="loading || allSubmitted"
            >
              <text class="iconfont icon-upload">📤</text>
              <text class="btn-text">
                {{ loading ? '提交中...' : allSubmitted ? '全部已提交' : '提交所有记录' }}
              </text>
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
      loading: false,
      // 箭头类名映射
      arrowClassMap: {
        'up': 'icon-up',
        'down': 'icon-down'
      }
    }
  },

  onLoad(options) {
    this.orderId = options.orderId || ''
    this.userId = options.userId || ''
    console.log('阶段施工记录页面加载，订单ID:', this.orderId)
    this.loadStages()
  },

  computed: {
    allSubmitted() {
      return this.stages.every(stage => stage.submitted)
    }
  },

  methods: {
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
          name: item.name || '',
          description: '', // 清空原有描述，用于输入新的施工说明
          images: [], // 图片列表
          expanded: false, // 折叠状态
          submitting: false, // 提交状态
          submitted: false // 是否已提交
        })).sort((a, b) => a.sequence - b.sequence)

        // 默认展开第一个阶段
        if (this.stages.length > 0) {
          this.stages[0].expanded = true
        }

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

    // 切换阶段展开/折叠
    toggleStage(index) {
      this.stages[index].expanded = !this.stages[index].expanded
    },

    // 选择图片
    async chooseImage(stageIndex) {
      const stage = this.stages[stageIndex]
      if (stage.images.length >= 9) {
        uni.showToast({
          title: '最多只能上传9张图片',
          icon: 'none',
          duration: 2000
        })
        return
      }

      try {
        const res = await uni.chooseImage({
          count: 9 - stage.images.length,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera']
        })

        // 模拟上传过程
        const tempImages = res.tempFilePaths.map(url => ({
          url,
          uploading: true
        }))

        stage.images.push(...tempImages)

        // 模拟上传完成
        setTimeout(() => {
          tempImages.forEach(img => {
            img.uploading = false
          })
        }, 1000)

      } catch (error) {
        console.error('选择图片失败:', error)
      }
    },

    // 预览图片
    previewImage(stageIndex, imgIndex) {
      const stage = this.stages[stageIndex]
      const urls = stage.images.map(img => img.url)
      uni.previewImage({
        current: urls[imgIndex],
        urls: urls
      })
    },

    // 删除图片
    removeImage(stageIndex, imgIndex) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这张图片吗？',
        success: (res) => {
          if (res.confirm) {
            this.stages[stageIndex].images.splice(imgIndex, 1)
          }
        }
      })
    },

    // 提交单个阶段
    async submitStage(stageIndex) {
      const stage = this.stages[stageIndex]
      
      if (stage.images.length === 0 && !stage.description.trim()) {
        uni.showToast({
          title: '请至少上传图片或填写说明',
          icon: 'none',
          duration: 2000
        })
        return
      }

      stage.submitting = true
      try {
        // 这里调用实际的API接口
        // const { orderStageRecordService } = require('@/api/orderStageRecord.js')
        // await orderStageRecordService.save({
        //   orderStageId: stage.orderStageId,
        //   description: stage.description,
        //   images: stage.images.map(img => img.url) // 实际应该是上传后的URL
        // })

        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000))

        stage.submitted = true
        uni.showToast({
          title: '阶段记录提交成功',
          icon: 'success',
          duration: 2000
        })

      } catch (error) {
        console.error('提交阶段记录失败:', error)
        uni.showToast({
          title: error?.msg || '提交失败，请重试',
          icon: 'none',
          duration: 2000
        })
      } finally {
        stage.submitting = false
      }
    },

    // 提交所有阶段
    async submitAllStages() {
      if (this.allSubmitted) {
        uni.showToast({
          title: '所有阶段已提交',
          icon: 'none',
          duration: 2000
        })
        return
      }

      const unsubmittedStages = this.stages.filter(stage => !stage.submitted)
      let hasEmptyStage = false

      // 检查未提交的阶段
      for (const stage of unsubmittedStages) {
        if (stage.images.length === 0 && !stage.description.trim()) {
          hasEmptyStage = true
          break
        }
      }

      if (hasEmptyStage) {
        uni.showToast({
          title: '请为所有阶段填写内容',
          icon: 'none',
          duration: 2000
        })
        return
      }

      uni.showModal({
        title: '确认提交',
        content: `确定要提交所有${unsubmittedStages.length}个阶段的记录吗？`,
        success: async (res) => {
          if (res.confirm) {
            this.loading = true
            try {
              // 批量提交所有未提交的阶段
              for (const stage of unsubmittedStages) {
                await this.submitStage(this.stages.findIndex(s => s.orderStageId === stage.orderStageId))
              }

              uni.showToast({
                title: '所有记录提交成功',
                icon: 'success',
                duration: 2000
              })

              setTimeout(() => {
                uni.navigateBack()
              }, 1500)

            } catch (error) {
              console.error('批量提交失败:', error)
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
  cursor: pointer;
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
    .stage-name { 
      font-weight: 600; 
      color: #2c6aa0; 
      font-size: 32rpx;
    }
  }
  .stage-arrow .iconfont {
    color: #666;
    font-size: 28rpx;
    transition: transform 0.3s;
  }
}

.stage-content {
  padding: 0 30rpx 30rpx;
}

.upload-section, .text-section {
  margin-bottom: 40rpx;
}

.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  .iconfont { 
    color: #2c6aa0; 
    margin-right: 15rpx; 
    font-size: 32rpx;
  }
  .title-text {
    color: #34495e;
    font-size: 28rpx;
    font-weight: 600;
  }
}

.images-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.image-item {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  overflow: hidden;
  .uploaded-image {
    width: 100%;
    height: 100%;
  }
  .image-actions {
    position: absolute;
    top: 8rpx;
    right: 8rpx;
    .action-btn {
      background: rgba(0, 0, 0, 0.6);
      border-radius: 50%;
      width: 50rpx;
      height: 50rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      .iconfont {
        color: white;
        font-size: 24rpx;
      }
    }
  }
}

.add-image-btn {
  width: 200rpx;
  height: 200rpx;
  border: 2rpx dashed #ddd;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  .add-icon {
    width: 80rpx;
    height: 80rpx;
    background: #2c6aa0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 15rpx;
    .iconfont {
      color: white;
      font-size: 36rpx;
      font-weight: bold;
    }
  }
  .add-text {
    color: #666;
    font-size: 24rpx;
    margin-bottom: 8rpx;
  }
  .image-count {
    color: #999;
    font-size: 20rpx;
  }
}

.description-textarea {
  width: 100%;
  min-height: 200rpx;
  padding: 24rpx;
  border: 2rpx solid #ddd;
  border-radius: 10rpx;
  font-size: 28rpx;
  background: white;
  box-sizing: border-box;
}

.char-count {
  text-align: right;
  color: #999;
  font-size: 24rpx;
  margin-top: 10rpx;
}

.placeholder {
  color: #999;
}

.stage-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 30rpx;
  .btn-stage-submit {
    background: #27ae60;
    color: white;
    border: none;
    border-radius: 8rpx;
    padding: 20rpx 40rpx;
    display: flex;
    align-items: center;
    gap: 15rpx;
    font-size: 26rpx;
    font-weight: 600;
    &:disabled {
      background: #ccc;
      opacity: 0.6;
    }
    .iconfont { font-size: 26rpx; }
  }
}

.global-actions {
  display: flex;
  justify-content: center;
  margin-top: 60rpx;
  .btn-submit-all {
    background: #2c6aa0;
    color: white;
    border: none;
    border-radius: 12rpx;
    padding: 28rpx 60rpx;
    display: flex;
    align-items: center;
    gap: 20rpx;
    font-size: 32rpx;
    font-weight: 600;
    &:disabled {
      background: #ccc;
      opacity: 0.6;
    }
    .iconfont { font-size: 32rpx; }
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

/* 箭头图标样式 */
.icon-up,
.icon-down {
  transition: transform 0.3s;
}

.icon-up {
  transform: rotate(0deg);
}

.icon-down {
  transform: rotate(180deg);
}
</style>