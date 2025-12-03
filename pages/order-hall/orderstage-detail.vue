<template>
  <view class="container">
    <!-- 顶部导航 -->
    <view class="custom-navbar">
      <view class="navbar-content">
        <view class="navbar-left" @tap="handleBack">
          <text class="iconfont icon-arrow-left">←</text>
        </view>
        <view class="navbar-title">施工日志编辑</view>
        <view class="navbar-right" @tap="submitLog">
          <text class="upload-btn">上传</text>
        </view>
      </view>
    </view>

    <!-- 内容区 -->
    <scroll-view scroll-y class="content" :scroll-top="scrollTop" scroll-with-animation>
      <!-- 描述输入 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">日志描述</text>
          <text class="word-count">{{ descriptionLength }}/500</text>
        </view>
        <textarea
          class="desc-input"
          v-model="logForm.description"
          placeholder="请输入本次施工情况描述（建议包含进度、问题、处理措施等）"
          maxlength="500"
          :auto-height="true"
          :show-confirm-bar="false"
          @input="onDescriptionInput"
          @focus="onTextareaFocus"
        />
      </view>

      <!-- 图片上传 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">现场照片</text>
          <text class="section-subtitle">（最多9张）</text>
        </view>
        
        <!-- 上传进度提示 -->
        <view v-if="uploadingCount > 0" class="upload-progress">
          <text class="progress-text">正在上传 {{ uploadingCount }} 张图片...</text>
          <progress 
            :percent="uploadProgress" 
            stroke-width="4" 
            active-color="#2c6aa0"
            backgroundColor="#e0e0e0"
          />
        </view>
        
        <view class="image-upload-area">
          <!-- 已选图片预览 -->
          <view class="uploaded-images">
            <view
              v-for="(img, index) in logForm.images"
              :key="img.id || index"
              class="image-item"
            >
              <image 
                :src="img.url || img.tempPath" 
                class="preview-img" 
                mode="aspectFill" 
                @tap="previewImage(index)"
              />
              
              <!-- 上传状态指示 -->
              <view class="image-status" v-if="img.status">
                <view v-if="img.status === 'uploading'" class="status-uploading">
                  <view class="loading-spinner"></view>
                </view>
                <view v-else-if="img.status === 'success'" class="status-success">✓</view>
                <view v-else-if="img.status === 'error'" class="status-error" @tap.stop="retryUpload(index)">↻</view>
              </view>
              
              <!-- 删除按钮 -->
              <view 
                class="delete-img" 
                @tap.stop="removeImage(index)"
                v-if="img.status !== 'uploading'"
              >×</view>
              
              <!-- 图片描述（可选） -->
              <input
                v-if="img.allowDescription"
                class="image-desc-input"
                v-model="img.description"
                placeholder="图片说明"
                maxlength="50"
                @tap.stop=""
              />
            </view>
            
            <!-- 添加图片按钮 -->
            <view 
              v-if="logForm.images.length < 9"
              class="image-item add-image-btn"
              @tap="chooseImages"
              :class="{ 'disabled': isUploading }"
            >
              <view class="add-icon">+</view>
              <view class="add-text">添加照片</view>
              <view class="add-count">{{ logForm.images.length }}/9</view>
            </view>
          </view>
          
          <!-- 批量操作 -->
          <view v-if="logForm.images.length > 0" class="batch-actions">
            <text class="batch-action" @tap="clearAllImages">清空所有</text>
            <text class="batch-action" @tap="toggleAllDescriptions">
              {{ showAllDescriptions ? '隐藏描述' : '添加描述' }}
            </text>
          </view>
        </view>
      </view>

      <!-- 提示说明 -->
      <view class="tip-section">
        <text class="tip-text">📌 提示：</text>
        <text class="tip-content">请确保照片清晰、能反映当前施工状态。每张图片最大10MB，支持JPG、PNG格式。</text>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="bottom-action-bar" v-if="hasChanges">
      <text class="unsaved-tip">您有未上传的修改</text>
      <button class="upload-button" @tap="submitLog" :disabled="loading || isUploading">上传日志</button>
    </view>

    <!-- 加载遮罩 -->
    <view v-if="loading" class="loading-mask">
      <view class="loading-content">
        <view class="loading-spinner-large"></view>
        <text class="loading-text">{{ loadingText }}</text>
        <text class="loading-subtext" v-if="uploadingCount > 0">
          正在上传图片 ({{ uploadingCount }}张)
        </text>
      </view>
    </view>
  </view>
</template>

<script>
import { updateOrderTask } from '@/api/orderTask.js'
import { uploadImage } from '@/api/upload.js'

export default {
  data() {
    return {
      userId: '',
      orderStageId: '',
      orderTaskId: '',
      logForm: {
        description: '',
        images: [] // 结构：{ id, url, tempPath, status, description, allowDescription }
      },
      loading: false,
      loadingText: '上传中...',
      isUploading: false,
      uploadingCount: 0,
      uploadProgress: 0,
      originalData: null,
      hasChanges: false,
      showAllDescriptions: false,
      scrollTop: 0,
      descriptionLength: 0,
      isDataLoaded: false
    }
  },

  onLoad(options) {
    this.initPage(options)
    
    // 监听页面返回
    uni.$on('pageBack', this.handlePageBack)
  },
  
  onUnload() {
    uni.$off('pageBack', this.handlePageBack)
  },
  
  onShow() {
    // 页面显示时检查是否有临时保存的数据
    const tempData = uni.getStorageSync('temp_log_data')
    if (tempData && !this.isDataLoaded) {
      this.showRestoreDialog(tempData)
    }
  },

  methods: {
    // 初始化页面
    initPage(options) {
      this.userId = options.userId || ''
      this.orderStageId = options.orderStageId || ''
      this.orderTaskId = options.orderTaskId || ''

      if (!this.orderTaskId) {
        uni.showToast({ 
          title: '参数错误', 
          icon: 'none',
          duration: 2000
        })
        setTimeout(() => this.goBack(), 1500)
        return
      }

      this.loadLogData()
    },
    
    // 返回上一页
    goBack() {
      uni.navigateBack()
    },
    
    // 处理返回操作
    async handleBack() {
      if (this.hasChanges) {
        const { confirm } = await uni.showModal({
          title: '提示',
          content: '您有未上传的修改，确定要离开吗？',
          confirmText: '离开',
          cancelText: '取消'
        })
        
        if (confirm) {
          // 临时保存数据
          this.saveTempData()
          this.goBack()
        }
      } else {
        this.goBack()
      }
    },
    
    // 临时保存数据
    saveTempData() {
      const tempData = {
        logForm: this.logForm,
        timestamp: Date.now(),
        orderTaskId: this.orderTaskId
      }
      uni.setStorageSync('temp_log_data', tempData)
    },
    
    // 显示恢复数据弹窗
    showRestoreDialog(tempData) {
      const now = Date.now()
      const timeDiff = now - tempData.timestamp
      const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60))
      
      // 如果数据在24小时内，提示恢复
      if (hoursDiff < 24 && tempData.orderTaskId === this.orderTaskId) {
        uni.showModal({
          title: '发现未上传的数据',
          content: `检测到${hoursDiff}小时前未上传的日志数据，是否恢复？`,
          confirmText: '恢复',
          cancelText: '丢弃',
          success: (res) => {
            if (res.confirm) {
              this.logForm = tempData.logForm
              this.descriptionLength = this.logForm.description.length
              this.checkForChanges()
            }
            uni.removeStorageSync('temp_log_data')
            this.isDataLoaded = true
          }
        })
      } else {
        uni.removeStorageSync('temp_log_data')
        this.isDataLoaded = true
      }
    },
    
    // 加载已有日志数据
    async loadLogData() {
      try {
        // 直接初始化数据，不等待模拟数据
        this.originalData = JSON.parse(JSON.stringify(this.logForm))
        this.checkForChanges()
        this.isDataLoaded = true
        
      } catch (error) {
        console.error('加载日志数据失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
        this.isDataLoaded = true
      }
    },
    
    // 输入框输入事件
    onDescriptionInput(e) {
      this.descriptionLength = e.detail.value.length
      this.checkForChanges()
    },
    
    // 输入框聚焦事件
    onTextareaFocus() {
      setTimeout(() => {
        this.scrollTop = this.scrollTop + 100
      }, 300)
    },
    
    // 选择图片 - 保持原有逻辑
    async chooseImages() {
      if (this.isUploading) {
        uni.showToast({
          title: '请等待上传完成',
          icon: 'none'
        })
        return
      }
      
      const remainingSlots = 9 - this.logForm.images.length
      if (remainingSlots <= 0) {
        uni.showToast({
          title: '最多只能上传9张图片',
          icon: 'none'
        })
        return
      }
      
      try {
        const res = await new Promise((resolve, reject) => {
          uni.chooseImage({
            count: remainingSlots,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success: resolve,
            fail: reject
          })
        })
        
        // 保持原有的图片路径提取逻辑
        let tempFilePaths = []
        
        if (res.tempFilePaths) {
          // 标准返回格式
          tempFilePaths = res.tempFilePaths
        } else if (res.tempFiles && Array.isArray(res.tempFiles)) {
          // 另一种可能的返回格式
          tempFilePaths = res.tempFiles.map(file => file.path || file.tempFilePath)
        } else if (res.filePaths && Array.isArray(res.filePaths)) {
          // 备用格式
          tempFilePaths = res.filePaths
        } else {
          // 尝试从结果中提取路径
          const result = res
          for (const key in result) {
            if (Array.isArray(result[key]) && result[key].length > 0) {
              const firstItem = result[key][0]
              if (firstItem.path || firstItem.tempFilePath) {
                tempFilePaths = result[key].map(item => item.path || item.tempFilePath)
                break
              }
            }
          }
        }
        
        console.log('选择的图片路径:', tempFilePaths)
        
        if (!tempFilePaths || tempFilePaths.length === 0) {
          uni.showToast({
            title: '未选择图片或选择失败',
            icon: 'none'
          })
          return
        }
        
        // 检查文件大小
        for (const tempPath of tempFilePaths) {
          try {
            const fileInfo = await this.getFileInfo(tempPath)
            if (fileInfo && fileInfo.size > 10 * 1024 * 1024) { // 10MB限制
              uni.showToast({
                title: `图片大小不能超过10MB`,
                icon: 'none'
              })
              return
            }
          } catch (fileError) {
            console.warn('获取文件信息失败:', fileError)
            // 继续处理，不阻止上传
          }
        }
        
        // 添加图片到列表
        const newImages = tempFilePaths.map((tempPath, index) => ({
          id: `temp_${Date.now()}_${index}`,
          tempPath: tempPath,
          url: '',
          status: 'pending', // pending, uploading, success, error
          description: '',
          allowDescription: this.showAllDescriptions,
          uploadProgress: 0
        }))
        
        this.logForm.images = [...this.logForm.images, ...newImages]
        this.checkForChanges()
        
        // 开始上传新图片
        this.uploadPendingImages()
        
      } catch (error) {
        console.error('选择图片失败:', error)
        
        // 用户取消选择不提示错误
        if (error.errMsg && error.errMsg.includes('cancel')) {
          return
        }
        
        uni.showToast({
          title: '选择图片失败，请重试',
          icon: 'none'
        })
      }
    },
    
    // 获取文件信息（安全版本）
    getFileInfo(filePath) {
      return new Promise((resolve, reject) => {
        if (!filePath) {
          reject(new Error('文件路径为空'))
          return
        }
        
        uni.getFileInfo({
          filePath: filePath,
          success: (res) => {
            if (res && typeof res.size === 'number') {
              resolve(res)
            } else {
              reject(new Error('获取文件信息失败'))
            }
          },
          fail: (err) => {
            reject(err)
          }
        })
      })
    },
    
    // 上传待处理的图片
    async uploadPendingImages() {
      const pendingImages = this.logForm.images.filter(img => 
        img.status === 'pending' && img.tempPath
      )
      
      if (pendingImages.length === 0) return
      
      this.isUploading = true
      this.uploadingCount = pendingImages.length
      this.loadingText = '正在上传图片...'
      
      try {
        // 按顺序上传，避免并发过多
        for (let i = 0; i < pendingImages.length; i++) {
          const img = pendingImages[i]
          const imageIndex = this.logForm.images.findIndex(item => item.id === img.id)
          
          if (imageIndex === -1) continue
          
          // 更新状态为上传中
          this.$set(this.logForm.images[imageIndex], 'status', 'uploading')
          
          try {
            // 调用您的上传接口
            // relatedType固定为11，relatedId使用orderTaskId
            const result = await uploadImage(
              img.tempPath,           // file
              11,                     // relatedType（固定值）
              this.orderTaskId,       // relatedId = orderTaskId
              img.description || '',  // description
              '',                     // stage
              imageIndex              // sequence
            )
            
            // 上传成功
            this.$set(this.logForm.images[imageIndex], 'status', 'success')
            
            // 直接使用返回的结果，不需要特殊处理
            if (result) {
              console.log('图片上传成功:', {
                index: imageIndex,
                result: result
              })
            } else {
              throw new Error('上传返回结果为空')
            }
            
            // 更新进度
            const successCount = this.logForm.images.filter(img => img.status === 'success').length
            const totalCount = this.logForm.images.filter(img => img.status !== 'pending').length
            
            if (totalCount > 0) {
              this.uploadProgress = Math.round((successCount / totalCount) * 100)
            }
            
          } catch (error) {
            console.error('图片上传失败:', error)
            this.$set(this.logForm.images[imageIndex], 'status', 'error')
            this.$set(this.logForm.images[imageIndex], 'errorMsg', error.message || '上传失败')
            
            uni.showToast({
              title: `图片上传失败: ${error.message || '未知错误'}`,
              icon: 'none',
              duration: 3000
            })
          }
          
          // 更新上传计数
          this.uploadingCount = this.logForm.images.filter(img => 
            img.status === 'uploading' || img.status === 'pending'
          ).length
        }
        
        this.checkForChanges()
        
      } catch (error) {
        console.error('批量上传出错:', error)
        uni.showToast({
          title: '上传过程中发生错误',
          icon: 'none'
        })
      } finally {
        this.isUploading = false
        this.uploadingCount = 0
        this.uploadProgress = 0
      }
    },
    
    // 重试上传失败的图片
    async retryUpload(index) {
      if (this.isUploading) {
        uni.showToast({
          title: '请等待当前上传完成',
          icon: 'none'
        })
        return
      }
      
      const img = this.logForm.images[index]
      if (!img || !img.tempPath) {
        uni.showToast({
          title: '无法重新上传该图片',
          icon: 'none'
        })
        return
      }
      
      this.$set(this.logForm.images[index], 'status', 'pending')
      await this.uploadPendingImages()
    },
    
    // 删除图片
    removeImage(index) {
      uni.showModal({
        title: '提示',
        content: '确定要删除这张图片吗？',
        success: (res) => {
          if (res.confirm) {
            this.logForm.images.splice(index, 1)
            this.checkForChanges()
            
            // 如果删除了正在上传的图片，更新上传状态
            this.uploadingCount = this.logForm.images.filter(img => 
              img.status === 'uploading' || img.status === 'pending'
            ).length
          }
        }
      })
    },
    
    // 预览图片
    previewImage(index) {
      const images = this.logForm.images
        .filter(img => img.url || img.tempPath)
        .map(img => img.url || img.tempPath)
      
      if (images.length > 0) {
        uni.previewImage({
          current: Math.min(index, images.length - 1),
          urls: images
        })
      }
    },
    
    // 清空所有图片
    clearAllImages() {
      if (this.logForm.images.length === 0) return
      
      uni.showModal({
        title: '提示',
        content: '确定要清空所有图片吗？',
        success: (res) => {
          if (res.confirm) {
            this.logForm.images = []
            this.isUploading = false
            this.uploadingCount = 0
            this.checkForChanges()
          }
        }
      })
    },
    
    // 切换所有图片的描述输入框
    toggleAllDescriptions() {
      this.showAllDescriptions = !this.showAllDescriptions
      this.logForm.images.forEach(img => {
        img.allowDescription = this.showAllDescriptions
      })
      this.checkForChanges()
    },
    
    // 检查是否有未上传的修改
    checkForChanges() {
      if (!this.originalData) return
      
      const currentData = JSON.parse(JSON.stringify(this.logForm))
      // 简化比较，忽略状态字段
      const simpleCurrent = {
        description: currentData.description,
        images: currentData.images.map(img => ({
          url: img.url,
          description: img.description
        })).filter(img => img.url) // 只比较有URL的图片
      }
      
      const simpleOriginal = {
        description: this.originalData.description,
        images: (this.originalData.images || []).map(img => ({
          url: img.url,
          description: img.description
        })).filter(img => img.url)
      }
      
      this.hasChanges = JSON.stringify(simpleCurrent) !== JSON.stringify(simpleOriginal)
    },
    
    // 检查未上传的更改（页面离开时）
    checkUnsavedChanges() {
      if (this.hasChanges) {
        this.saveTempData()
      }
    },
    
    // 处理页面返回事件
    handlePageBack() {
      this.checkUnsavedChanges()
    },
    
    // 上传日志
    async submitLog() {
      // 检查是否有正在上传的图片
      if (this.isUploading) {
        uni.showToast({
          title: '请等待图片上传完成',
          icon: 'none'
        })
        return
      }
      
      // 检查是否有上传失败的图片
      const failedImages = this.logForm.images.filter(img => img.status === 'error')
      if (failedImages.length > 0) {
        const { confirm } = await uni.showModal({
          title: '提示',
          content: `有${failedImages.length}张图片上传失败，是否继续上传日志？（失败的图片不会被保存）`,
          confirmText: '继续上传',
          cancelText: '重新上传图片'
        })
        
        if (!confirm) {
          // 让用户先处理失败的图片
          return
        }
      }
      
      const { description } = this.logForm
      
      // 验证必填项
      if (!description.trim()) {
        uni.showToast({ 
          title: '请填写日志描述', 
          icon: 'none' 
        })
        return
      }
      
      // 准备上传的数据 - 适配 updateOrderTask 接口
      // 根据错误信息，OrderTaskDTO只接受4个字段
      const orderTaskDTO = {
        orderTaskId: this.orderTaskId,
        description: description.trim(),
        // 根据实际情况可能需要添加以下字段
        // deadline: '', // 如果有截止日期
        // stageId: this.orderStageId || '' // 阶段ID
      }
      
      // 如果有阶段ID，则添加
      if (this.orderStageId) {
        orderTaskDTO.stageId = this.orderStageId
      }
      
      this.loading = true
      this.loadingText = '正在上传日志...'
      
      try {
        // 调用更新订单任务接口
        const response = await updateOrderTask(orderTaskDTO)
        
        // 检查响应结构
        console.log('上传响应:', response)
        
        if (response && (response.success || response.code === 200 || response.code === 0)) {
          // 清除临时数据
          uni.removeStorageSync('temp_log_data')
          
          // 更新原始数据
          this.originalData = JSON.parse(JSON.stringify(this.logForm))
          this.hasChanges = false
          
          uni.showToast({ 
            title: '日志上传成功', 
            icon: 'success',
            duration: 2000
          })
          
          // 通知上级页面刷新
          uni.$emit('logUpdated', { 
            orderTaskId: this.orderTaskId,
            timestamp: Date.now()
          })
          
          // 延迟返回，让用户看到成功提示
          setTimeout(() => {
            uni.navigateBack({ delta: 1 })
          }, 1500)
          
        } else {
          // 根据不同的响应结构抛出错误
          const errorMsg = response?.msg || response?.message || '上传失败'
          throw new Error(errorMsg)
        }
        
      } catch (error) {
        console.error('上传日志失败:', error)
        
        // 显示更详细的错误信息
        let errorMessage = '上传失败，请重试'
        if (error.message) {
          errorMessage = error.message
        } else if (error.response && error.response.data) {
          errorMessage = error.response.data.message || error.response.data.msg || '服务器返回错误'
        }
        
        uni.showToast({
          title: errorMessage,
          icon: 'none',
          duration: 3000
        })
      } finally {
        this.loading = false
        this.loadingText = '上传中...'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-bottom: 120rpx;
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
      padding: 10rpx;
    }
    .navbar-title {
      font-size: 36rpx;
      font-weight: 600;
    }
    .navbar-right .upload-btn {
      color: white;
      font-size: 32rpx;
      font-weight: 600;
      padding: 10rpx 20rpx;
    }
  }
}

.content {
  height: calc(100vh - 120rpx);
  padding: 30rpx;
  box-sizing: border-box;
}

.section {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;
    .section-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #333;
    }
    .section-subtitle {
      font-size: 24rpx;
      color: #999;
      margin-left: 10rpx;
    }
    .word-count {
      font-size: 26rpx;
      color: #999;
    }
  }

  .desc-input {
    width: 100%;
    min-height: 200rpx;
    padding: 20rpx;
    border: 2rpx solid #eee;
    border-radius: 12rpx;
    font-size: 28rpx;
    color: #333;
    box-sizing: border-box;
    background: #fafafa;
    line-height: 1.5;
  }
}

.upload-progress {
  background: #f0f7ff;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  .progress-text {
    display: block;
    font-size: 26rpx;
    color: #2c6aa0;
    margin-bottom: 10rpx;
  }
}

.image-upload-area {
  .uploaded-images {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
    margin-bottom: 20rpx;

    .image-item {
      position: relative;
      width: 200rpx;
      height: 200rpx;
      border-radius: 12rpx;
      overflow: hidden;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
      background: #f8f9fa;

      .preview-img {
        width: 100%;
        height: 100%;
      }

      .image-status {
        position: absolute;
        top: 10rpx;
        right: 10rpx;
        width: 40rpx;
        height: 40rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24rpx;
        z-index: 2;
        
        .status-uploading {
          .loading-spinner {
            width: 24rpx;
            height: 24rpx;
            border: 3rpx solid rgba(255, 255, 255, 0.3);
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
        }
        
        .status-success {
          background: rgba(46, 204, 113, 0.9);
          color: white;
        }
        
        .status-error {
          background: rgba(255, 77, 79, 0.9);
          color: white;
          cursor: pointer;
        }
      }

      .delete-img {
        position: absolute;
        top: -10rpx;
        right: -10rpx;
        width: 40rpx;
        height: 40rpx;
        background: rgba(255, 77, 79, 0.9);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28rpx;
        z-index: 3;
        font-weight: bold;
      }
      
      .image-desc-input {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 10rpx;
        font-size: 22rpx;
        border: none;
        outline: none;
        &::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }
      }
    }
    
    .add-image-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f0f5ff;
      border: 2rpx dashed #2c6aa0;
      cursor: pointer;
      
      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .add-icon {
        font-size: 48rpx;
        color: #2c6aa0;
        margin-bottom: 10rpx;
      }
      
      .add-text {
        font-size: 24rpx;
        color: #2c6aa0;
      }
      
      .add-count {
        font-size: 20rpx;
        color: #999;
        margin-top: 5rpx;
      }
    }
  }
  
  .batch-actions {
    display: flex;
    justify-content: center;
    gap: 40rpx;
    margin-top: 20rpx;
    
    .batch-action {
      color: #2c6aa0;
      font-size: 26rpx;
      padding: 10rpx 20rpx;
      border-radius: 20rpx;
      background: #f0f5ff;
      cursor: pointer;
      
      &:active {
        opacity: 0.7;
      }
    }
  }
}

.tip-section {
  background: #fff8e1;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-top: 20rpx;
  
  .tip-text {
    color: #ff9800;
    font-size: 26rpx;
    font-weight: 600;
  }
  
  .tip-content {
    color: #ff9800;
    font-size: 24rpx;
    margin-left: 10rpx;
  }
}

.bottom-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 20rpx 30rpx;
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .unsaved-tip {
    color: #ff6b6b;
    font-size: 26rpx;
  }
  
  .upload-button {
    background: linear-gradient(135deg, #2c6aa0, #1a4a7a);
    color: white;
    border: none;
    border-radius: 30rpx;
    font-size: 28rpx;
    padding: 16rpx 40rpx;
    
    &[disabled] {
      opacity: 0.5;
    }
  }
}

.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  
  .loading-content {
    background: white;
    border-radius: 16rpx;
    padding: 50rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 300rpx;
    
    .loading-spinner-large {
      width: 60rpx;
      height: 60rpx;
      border: 6rpx solid #f0f0f0;
      border-top-color: #2c6aa0;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 30rpx;
    }
    
    .loading-text {
      font-size: 32rpx;
      color: #333;
      margin-bottom: 10rpx;
      font-weight: 600;
    }
    
    .loading-subtext {
      font-size: 24rpx;
      color: #666;
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>