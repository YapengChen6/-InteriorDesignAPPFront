<template>
  <view class="container">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="title">设计师入驻</text>
      <text class="subtitle">入驻装修设计平台，提供专业设计服务</text>
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
    <view class="example">
      <uni-forms ref="form" :model="formData" labelWidth="180rpx">
        <!-- 设计师信息 -->
        <uni-forms-item label="设计师名称" name="merchantName" required>
          <uni-easyinput 
            v-model="formData.merchantName" 
            placeholder="请输入设计师名称或团队名称" 
            type="text"
            @input="filterChinese('merchantName')"
          />
        </uni-forms-item>
        
        <uni-forms-item label="所在城市" name="city" required>
          <uni-easyinput 
            v-model="formData.city" 
            placeholder="请输入所在城市" 
            type="text"
            @input="filterChinese('city')"
          />
        </uni-forms-item>
        
        <uni-forms-item label="备注" name="remark">
          <uni-easyinput 
            v-model="formData.remark" 
            placeholder="请输入备注信息" 
            type="textarea"
            maxlength="500"
          />
        </uni-forms-item>
        
        <!-- 上传文件区域 -->
        <view class="form-section">
          <text class="section-title">上传资料</text>
          
          <!-- 上传区域垂直布局 -->
          <view class="upload-vertical">
            <!-- 设计资格证书 -->
            <view class="upload-item">
              <view class="upload-item-header">
                <text class="upload-item-title">设计</text>
                <text class="upload-item-subtitle">资格证</text>
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
                
                <!-- 上传进度 -->
                <view v-if="uploadProgress.qualificationCertificate > 0 && uploadProgress.qualificationCertificate < 100" class="upload-progress">
                  <text class="progress-text">上传中 {{uploadProgress.qualificationCertificate}}%</text>
                  <view class="progress-bar">
                    <view class="progress-inner" :style="{width: uploadProgress.qualificationCertificate + '%'}"></view>
                  </view>
                </view>
              </view>
            </view>

            <!-- 手持身份证 -->
            <view class="upload-item">
              <view class="upload-item-header">
                <text class="upload-item-title">手持</text>
                <text class="upload-item-subtitle">身份证</text>
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
                
                <!-- 上传进度 -->
                <view v-if="uploadProgress.handheldIdPhoto > 0 && uploadProgress.handheldIdPhoto < 100" class="upload-progress">
                  <text class="progress-text">上传中 {{uploadProgress.handheldIdPhoto}}%</text>
                  <view class="progress-bar">
                    <view class="progress-inner" :style="{width: uploadProgress.handheldIdPhoto + '%'}"></view>
                  </view>
                </view>
              </view>
            </view>

            <!-- 身份证正反面 -->
            <view class="upload-item">
              <view class="upload-item-header">
                <text class="upload-item-title">身份证</text>
                <text class="upload-item-subtitle">正反面</text>
              </view>
              
              <view class="upload-item-content">
                <!-- 预览区域 -->
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
                    
                    <!-- 上传进度 -->
                    <view v-if="uploadProgress.idCardFrontPhoto > 0 && uploadProgress.idCardFrontPhoto < 100" class="upload-progress">
                      <text class="progress-text">上传中 {{uploadProgress.idCardFrontPhoto}}%</text>
                      <view class="progress-bar">
                        <view class="progress-inner" :style="{width: uploadProgress.idCardFrontPhoto + '%'}"></view>
                      </view>
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
                    
                    <!-- 上传进度 -->
                    <view v-if="uploadProgress.idCardBackPhoto > 0 && uploadProgress.idCardBackPhoto < 100" class="upload-progress">
                      <text class="progress-text">上传中 {{uploadProgress.idCardBackPhoto}}%</text>
                      <view class="progress-bar">
                        <view class="progress-inner" :style="{width: uploadProgress.idCardBackPhoto + '%'}"></view>
                      </view>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
          
          <text class="upload-tips">请上传清晰的图片，确保信息完整可见</text>
        </view>
      </uni-forms>
      
      <button type="primary" @click="submit" :disabled="isSubmitting">
        {{ isSubmitting ? '提交中...' : '下一步' }}
      </button>
    </view>
  </view>
</template>

<script>
import { 
  submitDesignerApplication,
  getDesignerApplicationStatus,
  getDesignerApplicationDetail,
  updateDesignerApplication,
  getDesignerApplicationList,
  reviewDesignerApplication,
  getDesignerApplicationDetailForAdmin,
  uploadImage,
  deleteImage
} from '@/api/design.js';

export default {
  data() {
    return {
      currentStep: 1,
      isSubmitting: false,
      applicationId: null,
      
      // 上传进度
      uploadProgress: {
        qualificationCertificate: 0,
        handheldIdPhoto: 0,
        idCardFrontPhoto: 0,        // 改回 idCardFrontPhoto
        idCardBackPhoto: 0          // 改回 idCardBackPhoto
      },
      
      formData: {
        merchantName: '',           // 设计师名称
        city: '',                   // 所在城市
        qualificationCertificate: '', // 设计资格证书
        remark: '',                 // 备注
        handheldIdPhoto: '',        // 手持身份证
        idCardFrontPhoto: '',       // 身份证正面 - 改回 idCardFrontPhoto
        idCardBackPhoto: ''         // 身份证反面 - 改回 idCardBackPhoto
      },
      
      // 存储上传后的文件ID
      uploadedFiles: {
        qualificationCertificate: null,
        handheldIdPhoto: null,
        idCardFrontPhoto: null,     // 改回 idCardFrontPhoto
        idCardBackPhoto: null       // 改回 idCardBackPhoto
      },
      
      rules: {
        merchantName: {
          rules: [{
            required: true,
            errorMessage: '设计师名称不能为空'
          }, {
            minLength: 2,
            errorMessage: '设计师名称至少2个字符'
          }, {
            maxLength: 255,
            errorMessage: '设计师名称长度不能超过255个字符'
          }]
        },
        city: {
          rules: [{
            required: true,
            errorMessage: '所在城市不能为空'
          }, {
            maxLength: 255,
            errorMessage: '所在城市长度不能超过255个字符'
          }]
        },
        remark: {
          rules: [{
            maxLength: 500,
            errorMessage: '备注长度不能超过500个字符'
          }]
        },
        qualificationCertificate: {
          rules: [{
            required: true,
            errorMessage: '请上传设计资格证书'
          }]
        },
        handheldIdPhoto: {
          rules: [{
            required: true,
            errorMessage: '请上传手持身份证照片'
          }]
        },
        idCardFrontPhoto: {         // 改回 idCardFrontPhoto
          rules: [{
            required: true,
            errorMessage: '请上传身份证正面照片'
          }]
        },
        idCardBackPhoto: {          // 改回 idCardBackPhoto
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
    loadApplicationData() {
      const savedData = uni.getStorageSync('designer_application_data')
      if (savedData) {
        this.formData = { ...this.formData, ...savedData }
        console.log('📥 Loaded saved designer application data')
      }
    },
    
    saveApplicationData() {
      uni.setStorageSync('designer_application_data', this.formData)
      console.log('💾 Saved designer application data')
    },
    
    filterChinese(fieldName) {
      this.formData[fieldName] = this.formData[fieldName].replace(/[^\u4e00-\u9fa5]/g, '');
      this.saveApplicationData()
    },
    
    async uploadFile(type) {
      try {
        console.log('🔄 Starting upload process for:', type)
        
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
        
        if (tempFile.size > 5 * 1024 * 1024) {
          throw new Error('图片大小不能超过5MB')
        }
        
        this.uploadProgress[type] = 1
        
        const result = await this.actualUploadFile(tempFilePath, type)
        
        console.log('📤 Upload API response:', result)
        
        if (result.code === 200) {
          this.formData[type] = result.data.fileUrl
          this.uploadedFiles[type] = result.data.mediaId
          
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
        
        uni.showToast({
          title: error.message || '上传失败',
          icon: 'none',
          duration: 3000
        })
      } finally {
        this.uploadProgress[type] = 0
      }
    },
    
    getUploadTypeName(type) {
      const mapping = {
        qualificationCertificate: '设计资格证书',
        handheldIdPhoto: '手持身份证',
        idCardFrontPhoto: '身份证正面',    // 改回 idCardFrontPhoto
        idCardBackPhoto: '身份证反面'      // 改回 idCardBackPhoto
      }
      return mapping[type] || type
    },
    
    async actualUploadFile(filePath, fileType) {
      try {
        console.log('🚀 Starting actual file upload...')
        
        const relatedType = this.getRelatedTypeByFileType(fileType)
        const relatedId = this.applicationId ? Number(this.applicationId) : 0
        const description = this.getFileDescription(fileType)
        const stage = 'APPLICATION'
        const sequence = this.getFileSequence(fileType)
        
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
        
        if (response.code === 200 && response.data) {
          return {
            ...response,
            data: {
              fileUrl: response.data.fileUrl,
              mediaId: response.data.mediaId,
              fileName: response.data.fileName,
              fileSize: response.data.fileSize
            }
          }
        }
        
        return response
        
      } catch (error) {
        console.error('❌ Upload API call failed:', error)
        throw error
      }
    },
    
    // 根据文件类型获取 relatedType
    getRelatedTypeByFileType(fileType) {
      const typeMapping = {
        qualificationCertificate: 5, // ID_CARD
        handheldIdPhoto: 5,          // ID_CARD
        idCardFrontPhoto: 5,         // ID_CARD - 改回 idCardFrontPhoto
        idCardBackPhoto: 5           // ID_CARD - 改回 idCardBackPhoto
      }
      return typeMapping[fileType] || 2 // 默认 MERCHANT_APPLICATION
    },
    
    // 获取文件描述
    getFileDescription(fileType) {
      const descriptions = {
        qualificationCertificate: '设计资格证书',
        handheldIdPhoto: '手持身份证照片',
        idCardFrontPhoto: '身份证正面照片',    // 改回 idCardFrontPhoto
        idCardBackPhoto: '身份证反面照片'      // 改回 idCardBackPhoto
      }
      return descriptions[fileType] || '申请材料'
    },
    
    // 生成文件序列号
    getFileSequence(fileType) {
      const sequences = {
        qualificationCertificate: 1,
        idCardFrontPhoto: 2,           // 改回 idCardFrontPhoto
        idCardBackPhoto: 3,            // 改回 idCardBackPhoto
        handheldIdPhoto: 4
      }
      return sequences[fileType] || 0
    },
    
    previewImage(type) {
      const url = this.formData[type]
      if (url) {
        uni.previewImage({
          urls: [url],
          current: url
        })
      }
    },
    
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
              
              this.formData[type] = ''
              this.uploadedFiles[type] = null
              
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
    
    // 构建申请数据 - 更新字段名以匹配后端 DTO
    buildApplicationData() {
      const applicationData = {
        merchantName: this.formData.merchantName,
        city: this.formData.city,
        remark: this.formData.remark,
        qualificationCertificate: this.formData.qualificationCertificate,
        handheldIdPhoto: this.formData.handheldIdPhoto,
        idCardFrontPhoto: this.formData.idCardFrontPhoto,     // 改回 idCardFrontPhoto
        idCardBackPhoto: this.formData.idCardBackPhoto        // 改回 idCardBackPhoto
      }
      
      console.log('📦 Built designer application data:', applicationData)
      return applicationData
    },
    
    async submit() {
      if (this.isSubmitting) return
      
      // 先隐藏可能存在的loading
      uni.hideLoading()
      
      let isLoadingShown = false
      
      try {
        this.isSubmitting = true
        
        console.log('🔄 Starting form submission...')
        
        // 表单验证
        await this.$refs.form.validate()
        console.log('✅ Form validation passed')
        
        // 检查必填图片 - 更新字段名
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
        
        console.log('📨 Sending application data to server...')
        const response = await submitDesignerApplication(applicationData)
        console.log('📨 Server response:', response)
        
        // 先隐藏loading再处理结果
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
          
          uni.removeStorageSync('designer_application_data')
          
          await this.updateTempImagesRelatedId()
          
          setTimeout(() => {
            uni.navigateTo({
              url: `/pages/join/DesignerJoin2?applicationId=${this.applicationId}`
            })
          }, 1500)
          
        } else {
          // 处理400等错误状态
          let errorMsg = response.msg || response.message || '提交失败'
          
          // 如果是500错误，可能是数据验证失败
          if (response.code === 500) {
            errorMsg = '服务器内部错误，请稍后重试'
            console.error('❌ 500 Internal Server Error - 可能的原因:', {
              formData: applicationData,
              response: response
            })
          }
          
          throw new Error(errorMsg)
        }
        
      } catch (error) {
        // 确保隐藏loading
        if (isLoadingShown) {
          uni.hideLoading()
          isLoadingShown = false
        }
        
        console.error('❌ Form submission failed:', error)
        
        let errorMessage = '提交失败'
        if (error.message) {
          errorMessage = error.message
        } else if (error.errorMessage) {
          errorMessage = error.errorMessage
        }
        
        uni.showToast({
          title: errorMessage,
          icon: 'none',
          duration: 3000
        })
      } finally {
        this.isSubmitting = false
        // 最终确保loading被隐藏
        if (isLoadingShown) {
          uni.hideLoading()
        }
      }
    },
    
    async updateTempImagesRelatedId() {
      if (!this.applicationId) return
      
      console.log('🔄 Updating temporary images with application ID:', this.applicationId)
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
  flex-shrink: 0;
}

.step-item.active .step-icon {
  background-color: #007AFF;
}

.step-text {
  font-size: 26rpx;
  color: #999;
  text-align: center;
  line-height: 1.4;
  min-height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.step-item.active .step-text {
  color: #007AFF;
  font-weight: 500;
}

.example {
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
  align-items: center;
  min-width: 120rpx;
  text-align: center;
}

.upload-item-title {
  display: block;
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  line-height: 1.4;
}

.upload-item-subtitle {
  display: block;
  font-size: 24rpx;
  color: #666;
  line-height: 1.4;
}

.upload-item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.id-card-preview {
  display: flex;
  gap: 40rpx;
  align-items: flex-start;
}

.id-card-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15rpx;
}

.id-card-label {
  font-size: 24rpx;
  color: #666;
  text-align: center;
}

.upload-btn-container {
  margin-top: 0;
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
  gap: 8rpx;
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
  align-items: center;
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
}

.preview-action {
  font-size: 20rpx;
  color: #007AFF;
  padding: 6rpx 12rpx;
  border-radius: 4rpx;
  background-color: rgba(0, 122, 255, 0.1);
  transition: all 0.3s ease;
}

.preview-action:active {
  background-color: rgba(0, 122, 255, 0.2);
}

.preview-action.delete {
  color: #ff4d4f;
  background-color: rgba(255, 77, 79, 0.1);
}

.preview-action.delete:active {
  background-color: rgba(255, 77, 79, 0.2);
}

.upload-progress {
  margin-top: 10rpx;
  width: 100%;
  max-width: 200rpx;
}

.progress-text {
  font-size: 20rpx;
  color: #007AFF;
  text-align: center;
  display: block;
  margin-bottom: 8rpx;
}

.progress-bar {
  width: 100%;
  height: 6rpx;
  background-color: #e0e0e0;
  border-radius: 3rpx;
  overflow: hidden;
}

.progress-inner {
  height: 100%;
  background-color: #007AFF;
  border-radius: 3rpx;
  transition: width 0.3s ease;
}

button[type="primary"] {
  width: 100%;
  margin-top: 40rpx;
  background-color: #007AFF;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
  padding: 25rpx 0;
  box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.3);
}

button[type="primary"]:active {
  background-color: #0056b3;
  transform: translateY(2rpx);
}

button[type="primary"]:disabled {
  background-color: #ccc;
  box-shadow: none;
  transform: none;
}
</style>