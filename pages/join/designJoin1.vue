<template>
  <view class="container">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="title">设计师入驻</text>
      <text class="subtitle">入驻装修设计app，展示您的设计才华</text>
    </view>
    
    <!-- 入驻流程步骤 -->
    <view class="steps-container">
      <view class="step-item" :class="{active: currentStep >= 1}">
        <view class="step-icon">1</view>
        <text class="step-text">上传资料</text>
      </view>
      <view class="step-item" :class="{active: currentStep >= 2}">
        <view class="step-icon">2</view>
        <text class="step-text">缴纳保证金</text>
      </view>
      <view class="step-item" :class="{active: currentStep >= 3}">
        <view class="step-icon">3</view>
        <text class="step-text">提交审核</text>
      </view>
    </view>
    
    <!-- 表单区域 -->
    <view class="form-container">
      <uni-forms ref="form" :model="formData" :rules="rules" labelWidth="180rpx">
        <!-- 设计师信息 -->
        <uni-forms-item label="设计师名称" name="merchantName" required>
          <uni-easyinput 
            v-model="formData.merchantName" 
            placeholder="请输入设计师名称或工作室名称" 
            type="text"
            @input="onInput('merchantName')"
          />
        </uni-forms-item>
        
        <uni-forms-item label="所在城市" name="city">
          <uni-easyinput 
            v-model="formData.city" 
            placeholder="请输入所在城市(必填)" 
            type="text"
            @input="onInput('city')"
          />
        </uni-forms-item>
        
        <uni-forms-item label="备注信息" name="remark">
          <uni-easyinput 
            v-model="formData.remark" 
            placeholder="可填写备注信息（选填）" 
            type="textarea"
            @input="onInput('remark')"
          />
        </uni-forms-item>
        
        <!-- 上传文件区域 -->
        <view class="form-section">
          <text class="section-title">上传资料</text>
          
          <!-- 上传区域垂直布局 -->
          <view class="upload-vertical">
            <!-- 资格证书 -->
            <view class="upload-item">
              <view class="upload-item-header">
                <text class="upload-item-title">资格证书</text>
               
              </view>
              
              <view class="upload-item-content">
                <!-- 预览区域 -->
                <view v-if="formData.qualificationCertificate" class="preview-container">
                  <image :src="formData.qualificationCertificate" class="preview-image" mode="aspectFill" @click="previewImage('qualificationCertificate')"></image>
                  <view class="preview-actions">
                    <text class="preview-action" @click="previewImage('qualificationCertificate')">预览</text>
                    <text class="preview-action delete" @click="removeImage('qualificationCertificate')">删除</text>
                  </view>
                </view>
                
                <!-- 上传按钮 -->
                <view class="upload-btn-container" v-if="!formData.qualificationCertificate">
                  <view class="upload-btn" @click="uploadFile('qualificationCertificate')">
                    <view class="upload-btn-content">
                      <text class="upload-btn-icon">+</text>
                    </view>
                  </view>
                </view>
                
                <!-- 上传状态 -->
                <view v-if="uploadStatus.qualificationCertificate" class="upload-status" :class="uploadStatus.qualificationCertificate">
                  {{ getUploadStatusText(uploadStatus.qualificationCertificate) }}
                </view>
              </view>
            </view>

            <!-- 手持身份证 -->
            <view class="upload-item">
              <view class="upload-item-header">
                <text class="upload-item-title">手持身份证</text>
                
              </view>
              
              <view class="upload-item-content">
                <!-- 预览区域 -->
                <view v-if="formData.handheldIdPhoto" class="preview-container">
                  <image :src="formData.handheldIdPhoto" class="preview-image" mode="aspectFill" @click="previewImage('handheldIdPhoto')"></image>
                  <view class="preview-actions">
                    <text class="preview-action" @click="previewImage('handheldIdPhoto')">预览</text>
                    <text class="preview-action delete" @click="removeImage('handheldIdPhoto')">删除</text>
                  </view>
                </view>
                
                <!-- 上传按钮 -->
                <view class="upload-btn-container" v-if="!formData.handheldIdPhoto">
                  <view class="upload-btn" @click="uploadFile('handheldIdPhoto')">
                    <view class="upload-btn-content">
                      <text class="upload-btn-icon">+</text>
                    </view>
                  </view>
                </view>
                
                <!-- 上传状态 -->
                <view v-if="uploadStatus.handheldIdPhoto" class="upload-status" :class="uploadStatus.handheldIdPhoto">
                  {{ getUploadStatusText(uploadStatus.handheldIdPhoto) }}
                </view>
              </view>
            </view>

            <!-- 身份证正反面 -->
            <view class="upload-item">
              <view class="upload-item-header">
                <text class="upload-item-title">身份证正反面</text>
                
              </view>
              
              <view class="upload-item-content">
                <view class="id-card-preview">
                  <!-- 身份证正面 -->
                  <view class="id-card-side">
                    <text class="id-card-label">正面</text>
                    <view v-if="formData.idCardFrontPhoto" class="preview-container">
                      <image :src="formData.idCardFrontPhoto" class="preview-image" mode="aspectFill" @click="previewImage('idCardFrontPhoto')"></image>
                      <view class="preview-actions">
                        <text class="preview-action" @click="previewImage('idCardFrontPhoto')">预览</text>
                        <text class="preview-action delete" @click="removeImage('idCardFrontPhoto')">删除</text>
                      </view>
                    </view>
                    <view class="upload-btn-container" v-if="!formData.idCardFrontPhoto">
                      <view class="upload-btn" @click="uploadFile('idCardFrontPhoto')">
                        <view class="upload-btn-content">
                          <text class="upload-btn-icon">+</text>
                        </view>
                      </view>
                    </view>
                    
                    <!-- 上传状态 -->
                    <view v-if="uploadStatus.idCardFrontPhoto" class="upload-status" :class="uploadStatus.idCardFrontPhoto">
                      {{ getUploadStatusText(uploadStatus.idCardFrontPhoto) }}
                    </view>
                  </view>
                  
                  <!-- 身份证反面 -->
                  <view class="id-card-side">
                    <text class="id-card-label">反面</text>
                    <view v-if="formData.idCardBackPhoto" class="preview-container">
                      <image :src="formData.idCardBackPhoto" class="preview-image" mode="aspectFill" @click="previewImage('idCardBackPhoto')"></image>
                      <view class="preview-actions">
                        <text class="preview-action" @click="previewImage('idCardBackPhoto')">预览</text>
                        <text class="preview-action delete" @click="removeImage('idCardBackPhoto')">删除</text>
                      </view>
                    </view>
                    <view class="upload-btn-container" v-if="!formData.idCardBackPhoto">
                      <view class="upload-btn" @click="uploadFile('idCardBackPhoto')">
                        <view class="upload-btn-content">
                          <text class="upload-btn-icon">+</text>
                        </view>
                      </view>
                    </view>
                    
                    <!-- 上传状态 -->
                    <view v-if="uploadStatus.idCardBackPhoto" class="upload-status" :class="uploadStatus.idCardBackPhoto">
                      {{ getUploadStatusText(uploadStatus.idCardBackPhoto) }}
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
          
          <text class="upload-tips">请上传清晰的图片，确保信息完整可见</text>
        </view>
      </uni-forms>
      
      <button type="primary" @click="submit" :disabled="isSubmitting" class="submit-btn">
        {{ isSubmitting ? '提交中...' : '下一步' }}
      </button>
    </view>
  </view>
</template>

<script>
import { 
  submitDesignerApplication, 
  uploadImage, 
  deleteImage,
  RELATED_TYPES,
  UPLOAD_STAGES,
  getFileDescription,
  getFileSequence,
  getRelatedTypeByFileType
} from '@/api/design.js';

export default {
  data() {
    return {
      currentStep: 1,
      isSubmitting: false,
      applicationId: null,
      
      // 上传状态
      uploadStatus: {
        qualificationCertificate: '',
        handheldIdPhoto: '',
        idCardFrontPhoto: '',
        idCardBackPhoto: ''
      },
      
      formData: {
        merchantName: '',  // 将 designerName 改为 merchantName
        city: '',          // 添加城市字段
        remark: '',        // 添加备注字段
        qualificationCertificate: '',
        handheldIdPhoto: '',
        idCardFrontPhoto: '',
        idCardBackPhoto: ''
      },
      
      // 存储上传后的文件ID
      uploadedFiles: {
        qualificationCertificate: null,
        handheldIdPhoto: null,
        idCardFrontPhoto: null,
        idCardBackPhoto: null
      },
      
      rules: {
        merchantName: {  // 将 designerName 改为 merchantName
          rules: [{
            required: true,
            errorMessage: '设计师名称不能为空'
          }, {
            minLength: 2,
            errorMessage: '设计师名称至少2个字符'
          }, {
            maxLength: 200,
            errorMessage: '设计师名称长度不能超过200个字符'
          }]
        },
        city: {
          rules: [{
            required: false,
            errorMessage: '请输入所在城市'
          }]
        },
        remark: {
          rules: [{
            required: false,
            errorMessage: '请输入备注信息'
          }]
        },
        qualificationCertificate: {
          rules: [{
            required: true,
            errorMessage: '请上传资格证书'
          }]
        },
        handheldIdPhoto: {
          rules: [{
            required: true,
            errorMessage: '请上传手持身份证照片'
          }]
        },
        idCardFrontPhoto: {
          rules: [{
            required: true,
            errorMessage: '请上传身份证正面照片'
          }]
        },
        idCardBackPhoto: {
          rules: [{
            required: true,
            errorMessage: '请上传身份证反面照片'
          }]
        }
      }
    }
  },
  
  onLoad() {
    console.log('🔄 DesignerJoin1 page loaded')
    this.loadApplicationData()
  },
  
  onReady() {
    this.$refs.form.setRules(this.rules)
  },
  
  methods: {
    // 输入处理
    onInput(fieldName) {
      this.saveApplicationData()
    },
    
    // 加载保存的数据
    loadApplicationData() {
      try {
        const savedData = uni.getStorageSync('designer_application_data')
        if (savedData) {
          // 兼容旧数据：如果存在 designerName，将其赋值给 merchantName
          if (savedData.designerName && !savedData.merchantName) {
            savedData.merchantName = savedData.designerName
            delete savedData.designerName
          }
          // 移除旧数据中的 phone 字段
          if (savedData.phone) {
            delete savedData.phone
          }
          this.formData = { ...this.formData, ...savedData }
          console.log('📥 Loaded saved designer application data')
        }
      } catch (error) {
        console.error('❌ Failed to load saved data:', error)
      }
    },
    
    // 保存数据到本地存储
    saveApplicationData() {
      try {
        uni.setStorageSync('designer_application_data', this.formData)
        console.log('💾 Saved designer application data')
      } catch (error) {
        console.error('❌ Failed to save data:', error)
      }
    },
    
    // 上传文件
    async uploadFile(type) {
      try {
        console.log('🔄 Starting upload process for:', type)
        
        // 选择图片
        const chooseResult = await new Promise((resolve, reject) => {
          uni.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success: resolve,
            fail: (error) => {
              let errMsg = '选择图片失败'
              if (error.errMsg.includes('cancel')) {
                errMsg = '用户取消了选择'
              }
              reject(new Error(errMsg))
            }
          })
        })
        
        if (!chooseResult.tempFilePaths || chooseResult.tempFilePaths.length === 0) {
          throw new Error('未选择图片')
        }
        
        const tempFilePath = chooseResult.tempFilePaths[0]
        const tempFile = chooseResult.tempFiles[0]
        
        console.log('📁 Selected file info:', {
          path: tempFilePath,
          size: tempFile.size,
          type: tempFile.type
        })
        
        // 文件大小检查
        if (tempFile.size > 5 * 1024 * 1024) {
          throw new Error('图片大小不能超过5MB')
        }
        
        // 设置上传状态
        this.uploadStatus[type] = 'uploading'
        
        // 执行上传
        const result = await this.actualUploadFile(tempFilePath, type)
        
        console.log('📤 Upload API response:', result)
        
        if (result.code === 200) {
          // 上传成功
          this.formData[type] = result.imageUrl || result.data?.fileUrl
          this.uploadedFiles[type] = result.data?.mediaId
          this.uploadStatus[type] = 'success'
          
          this.saveApplicationData()
          
          uni.showToast({
            title: '上传成功',
            icon: 'success',
            duration: 2000
          })
        } else {
          throw new Error(result.msg || result.message || '上传失败')
        }
        
      } catch (error) {
        console.error('❌ Upload process failed:', error)
        this.uploadStatus[type] = 'error'
        
        uni.showToast({
          title: error.message || '上传失败',
          icon: 'none',
          duration: 3000
        })
      }
    },
    
    // 实际执行上传
    async actualUploadFile(filePath, fileType) {
      try {
        console.log('🚀 Starting actual file upload...')
        
        const relatedType = getRelatedTypeByFileType(fileType)
        const relatedId = this.applicationId ? Number(this.applicationId) : 0
        const description = getFileDescription(fileType)
        const stage = UPLOAD_STAGES.APPLICATION
        const sequence = getFileSequence(fileType)
        
        console.log('📋 Upload parameters:', {
          filePath,
          relatedType,
          relatedId,
          description,
          stage,
          sequence
        })
        
        const response = await uploadImage(
          filePath,
          relatedType,
          relatedId,
          description,
          stage,
          sequence
        )
        
        console.log('✅ Upload API response received:', response)
        return response
        
      } catch (error) {
        console.error('❌ Upload API call failed:', error)
        throw error
      }
    },
    
    // 预览图片
    previewImage(type) {
      const url = this.formData[type]
      if (url) {
        uni.previewImage({
          urls: [url],
          current: url
        })
      }
    },
    
    // 删除图片
    async removeImage(type) {
      try {
        uni.showModal({
          title: '提示',
          content: '确定要删除这张图片吗？',
          success: async (res) => {
            if (res.confirm) {
              const mediaId = this.uploadedFiles[type]
              if (mediaId) {
                console.log('🗑️ Deleting image from server, mediaId:', mediaId)
                await deleteImage(mediaId)
              }
              
              // 清除本地数据
              this.formData[type] = ''
              this.uploadedFiles[type] = null
              this.uploadStatus[type] = ''
              
              this.saveApplicationData()
              
              uni.showToast({
                title: '删除成功',
                icon: 'success',
                duration: 2000
              })
            }
          }
        })
      } catch (error) {
        console.error('删除图片失败:', error)
        uni.showToast({
          title: '删除失败',
          icon: 'none',
          duration: 3000
        })
      }
    },
    
    // 获取上传状态文本
    getUploadStatusText(status) {
      const statusMap = {
        uploading: '上传中...',
        success: '上传成功',
        error: '上传失败'
      }
      return statusMap[status] || ''
    },
    
    // 构建申请数据
    buildApplicationData() {
      const applicationData = {
        merchantName: this.formData.merchantName,  // 改为 merchantName
        city: this.formData.city || '',           // 添加城市字段
        remark: this.formData.remark || '',       // 添加备注字段
        qualificationCertificate: this.formData.qualificationCertificate,
        handheldIdPhoto: this.formData.handheldIdPhoto,
        idCardFrontPhoto: this.formData.idCardFrontPhoto,
        idCardBackPhoto: this.formData.idCardBackPhoto
      }
      
      console.log('📦 Built designer application data:', applicationData)
      return applicationData
    },
    
    // 提交表单 - 修复版本
    async submit() {
      if (this.isSubmitting) return
      
      let isLoadingShown = false
      
      try {
        this.isSubmitting = true
        
        console.log('🔄 Starting form submission...')
        
        // 表单验证
        await this.$refs.form.validate()
        console.log('✅ Form validation passed')
        
        // 检查必填图片
        const requiredImages = ['qualificationCertificate', 'handheldIdPhoto', 'idCardFrontPhoto', 'idCardBackPhoto']
        const missingImages = requiredImages.filter(type => !this.formData[type])
        
        if (missingImages.length > 0) {
          throw new Error('请上传所有必需的图片资料')
        }
        
        // 显示loading
        uni.showLoading({
          title: '提交中...',
          mask: true
        })
        isLoadingShown = true
        
        const applicationData = this.buildApplicationData()
        
        console.log('📨 Sending application data to server...', JSON.stringify(applicationData, null, 2))
        
        const response = await submitDesignerApplication(applicationData)
        console.log('📨 Server response:', response)
        
        // 隐藏loading - 确保配对使用
        if (isLoadingShown) {
          uni.hideLoading()
          isLoadingShown = false
        }
        
        if (response.code === 200) {
          uni.showToast({
            title: '提交成功',
            icon: 'success',
            duration: 2000
          })
          
          this.applicationId = response.data.applicationId || response.data.id
          console.log('🎉 Designer application created successfully, ID:', this.applicationId)
          
          // 清除本地存储
          uni.removeStorageSync('designer_application_data')
          
          // 更新临时图片的关联ID
          await this.updateTempImagesRelatedId()
          
          // 跳转到下一步
          setTimeout(() => {
            uni.navigateTo({
              url: `/pages/join/DesignerJoin2?applicationId=${this.applicationId}`
            })
          }, 1500)
          
        } else {
          // 更详细的错误处理
          let errorMsg = response.msg || response.message || '提交失败'
          
          if (response.code === 400) {
            errorMsg = '数据格式错误，请检查填写的信息：' + (response.data || '未知错误')
            console.error('❌ 400 Bad Request Details:', {
              requestData: applicationData,
              response: response
            })
          } else if (response.code === 500) {
            errorMsg = '服务器内部错误，请稍后重试或联系客服'
          }
          
          throw new Error(errorMsg)
        }
        
      } catch (error) {
        console.error('❌ Form submission failed:', error)
        
        // 确保隐藏loading
        if (isLoadingShown) {
          uni.hideLoading()
          isLoadingShown = false
        }
        
        let errorMessage = '提交失败'
        if (error.message) {
          errorMessage = error.message
        } else if (error.errorMessage) {
          errorMessage = error.errorMessage
        }
        
        // 使用更明显的错误提示
        uni.showModal({
          title: '提交失败',
          content: errorMessage,
          showCancel: false,
          confirmText: '确定'
        })
      } finally {
        this.isSubmitting = false
      }
    },
    
    // 更新临时图片的关联ID
    async updateTempImagesRelatedId() {
      if (!this.applicationId) return
      
      console.log('🔄 Updating temporary images with application ID:', this.applicationId)
      // 这里可以实现更新图片关联ID的逻辑
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 100rpx;
}

.page-header {
  padding: 40rpx 30rpx 20rpx;
  text-align: center;
}

.title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #666;
}

.steps-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40rpx 30rpx;
  background: #fff;
  margin: 0 30rpx 30rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.step-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #fff;
  margin-bottom: 16rpx;
  font-weight: bold;
}

.step-item.active .step-icon {
  background-color: #007AFF;
}

.step-text {
  font-size: 26rpx;
  color: #999;
  text-align: center;
  line-height: 1.4;
}

.step-item.active .step-text {
  color: #007AFF;
  font-weight: 500;
}

.form-container {
  padding: 30rpx;
  background-color: #fff;
  margin: 0 20rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.form-section {
  margin-bottom: 40rpx;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #eee;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.upload-vertical {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.upload-item {
  display: flex;
  align-items: flex-start;
  gap: 30rpx;
  padding: 30rpx;
  background: #fafafa;
  border-radius: 12rpx;
  border: 2rpx solid #f0f0f0;
}

.upload-item-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 200rpx; /* 增加最小宽度确保标题区域对齐 */
  text-align: left;
  flex-shrink: 0; /* 防止标题区域被压缩 */
}

.upload-item-title {
  display: block;
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  line-height: 1.4;
  margin-bottom: 8rpx;
}



.upload-item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  min-height: 160rpx; /* 设置最小高度确保内容区域对齐 */
}

.id-card-preview {
  display: flex;
  gap: 40rpx;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
}

.id-card-side {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 15rpx;
  flex: 1; /* 使身份证正反面等宽 */
}

.id-card-label {
  font-size: 24rpx;
  color: #666;
  text-align: left;
  width: 100%;
}

.upload-btn-container {
  margin-top: 0;
  display: flex;
  justify-content: flex-start;
  width: 100%;
}

.upload-btn {
  width: 120rpx;
  height: 120rpx;
  background-color: #fff;
  border: 2rpx dashed #007AFF;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.upload-btn:active {
  background-color: #f0f7ff;
  border-style: solid;
}

.upload-btn-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-btn-icon {
  font-size: 40rpx;
  color: #007AFF;
  font-weight: bold;
  line-height: 1;
}

.upload-tips {
  display: block;
  font-size: 24rpx;
  color: #999;
  text-align: center;
  margin-top: 20rpx;
}

.preview-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
}

.preview-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 8rpx;
  border: 2rpx solid #e8e8e8;
}

.preview-actions {
  display: flex;
  gap: 15rpx;
  margin-top: 10rpx;
  justify-content: flex-start;
  width: 100%;
}

.preview-action {
  font-size: 20rpx;
  color: #007AFF;
  padding: 6rpx 12rpx;
  border-radius: 4rpx;
  background-color: rgba(0, 122, 255, 0.1);
}

.preview-action.delete {
  color: #ff4d4f;
  background-color: rgba(255, 77, 79, 0.1);
}

.upload-status {
  font-size: 20rpx;
  margin-top: 8rpx;
  text-align: left;
  width: 100%;
}

.upload-status.uploading {
  color: #007AFF;
}

.upload-status.success {
  color: #52c41a;
}

.upload-status.error {
  color: #ff4d4f;
}

.submit-btn {
  width: 100%;
  margin-top: 40rpx;
  background-color: #007AFF;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
  padding: 25rpx 0;
}

.submit-btn:disabled {
  background-color: #ccc;
}
</style>