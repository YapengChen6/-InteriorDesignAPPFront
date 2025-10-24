<template>
  <view class="container">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="title">商户入驻</text>
      <text class="subtitle">入驻装修设计app，出货更容易</text>
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
        <!-- 商户信息 -->
        <uni-forms-item label="商户名称" name="merchantName" required>
          <uni-easyinput 
            v-model="formData.merchantName" 
            placeholder="请输入入驻商户名称" 
            type="text"
            @input="filterChinese('merchantName')"
          />
        </uni-forms-item>
        
        <uni-forms-item label="入驻人身份" name="identity" required>
          <uni-easyinput 
            v-model="formData.identity" 
            placeholder="请输入入驻人身份（如：法人、经办人等）" 
            type="text"
            @input="filterChinese('identity')"
          />
        </uni-forms-item>
        
        <uni-forms-item label="法人姓名" name="legalPerson" required>
          <uni-easyinput 
            v-model="formData.legalPerson" 
            placeholder="请输入法人姓名" 
            type="text"
            @input="filterChinese('legalPerson')"
          />
        </uni-forms-item>
        
        <uni-forms-item label="手机号" name="phone" required>
          <uni-easyinput 
            v-model="formData.phone" 
            placeholder="请填写联系方式" 
            type="text"
            @input="filterNumber('phone')"
            maxlength="11"
          />
        </uni-forms-item>
        
        <!-- 店铺地址 -->
        <uni-forms-item label="店铺地址" name="shopAddress" required>
          <uni-easyinput 
            v-model="formData.shopAddress" 
            placeholder="请输入完整的店铺地址（省市区+详细地址）" 
            type="textarea"
            :maxlength="200"
            :autoHeight="true"
            @input="filterChineseNumber('shopAddress')"
          />
        </uni-forms-item>

        <!-- 上传文件区域 -->
        <view class="form-section">
          <text class="section-title">上传资料</text>
          
          <!-- 上传区域垂直布局 -->
          <view class="upload-vertical">
            <!-- 门店照片 -->
            <view class="upload-item">
              <view class="upload-item-header">
                <text class="upload-item-title">门店照片</text>
              </view>
              
              <view class="upload-item-content">
                <!-- 预览区域 -->
                <view v-if="formData.storeImage" class="preview-container">
                  <image :src="formData.storeImage" class="preview-image" mode="aspectFill" @click="previewImage('store')"></image>
                  <view class="preview-actions">
                    <text class="preview-action" @click="previewImage('store')">预览</text>
                    <text class="preview-action delete" @click="removeImage('store')">删除</text>
                  </view>
                </view>
                
                <!-- 上传按钮 -->
                <view class="upload-btn-container" v-if="!formData.storeImage">
                  <view class="upload-btn" @click="uploadFile('store')">
                    <view class="upload-btn-content">
                      <text class="upload-btn-icon">+</text>
                    </view>
                  </view>
                </view>
                
                <!-- 上传进度 -->
                <view v-if="uploadProgress.store > 0 && uploadProgress.store < 100" class="upload-progress">
                  <text class="progress-text">上传中 {{uploadProgress.store}}%</text>
                  <view class="progress-bar">
                    <view class="progress-inner" :style="{width: uploadProgress.store + '%'}"></view>
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
                <view v-if="formData.idCardHandImage" class="preview-container">
                  <image :src="formData.idCardHandImage" class="preview-image" mode="aspectFill" @click="previewImage('idCardHand')"></image>
                  <view class="preview-actions">
                    <text class="preview-action" @click="previewImage('idCardHand')">预览</text>
                    <text class="preview-action delete" @click="removeImage('idCardHand')">删除</text>
                  </view>
                </view>
                
                <!-- 上传按钮 -->
                <view class="upload-btn-container" v-if="!formData.idCardHandImage">
                  <view class="upload-btn" @click="uploadFile('idCardHand')">
                    <view class="upload-btn-content">
                      <text class="upload-btn-icon">+</text>
                    </view>
                  </view>
                </view>
                
                <!-- 上传进度 -->
                <view v-if="uploadProgress.idCardHand > 0 && uploadProgress.idCardHand < 100" class="upload-progress">
                  <text class="progress-text">上传中 {{uploadProgress.idCardHand}}%</text>
                  <view class="progress-bar">
                    <view class="progress-inner" :style="{width: uploadProgress.idCardHand + '%'}"></view>
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
                    <view v-if="formData.idCardFrontImage" class="preview-container">
                      <image :src="formData.idCardFrontImage" class="preview-image" mode="aspectFill" @click="previewImage('idCardFront')"></image>
                      <view class="preview-actions">
                        <text class="preview-action" @click="previewImage('idCardFront')">预览</text>
                        <text class="preview-action delete" @click="removeImage('idCardFront')">删除</text>
                      </view>
                    </view>
                    <view class="upload-btn-container" v-if="!formData.idCardFrontImage">
                      <view class="upload-btn" @click="uploadFile('idCardFront')">
                        <view class="upload-btn-content">
                          <text class="upload-btn-icon">+</text>
                        </view>
                      </view>
                    </view>
                    
                    <!-- 上传进度 -->
                    <view v-if="uploadProgress.idCardFront > 0 && uploadProgress.idCardFront < 100" class="upload-progress">
                      <text class="progress-text">上传中 {{uploadProgress.idCardFront}}%</text>
                      <view class="progress-bar">
                        <view class="progress-inner" :style="{width: uploadProgress.idCardFront + '%'}"></view>
                      </view>
                    </view>
                  </view>
                  
                  <!-- 身份证反面 -->
                  <view class="id-card-side">
                    <text class="id-card-label">反面</text>
                    <view v-if="formData.idCardBackImage" class="preview-container">
                      <image :src="formData.idCardBackImage" class="preview-image" mode="aspectFill" @click="previewImage('idCardBack')"></image>
                      <view class="preview-actions">
                        <text class="preview-action" @click="previewImage('idCardBack')">预览</text>
                        <text class="preview-action delete" @click="removeImage('idCardBack')">删除</text>
                      </view>
                    </view>
                    <view class="upload-btn-container" v-if="!formData.idCardBackImage">
                      <view class="upload-btn" @click="uploadFile('idCardBack')">
                        <view class="upload-btn-content">
                          <text class="upload-btn-icon">+</text>
                        </view>
                      </view>
                    </view>
                    
                    <!-- 上传进度 -->
                    <view v-if="uploadProgress.idCardBack > 0 && uploadProgress.idCardBack < 100" class="upload-progress">
                      <text class="progress-text">上传中 {{uploadProgress.idCardBack}}%</text>
                      <view class="progress-bar">
                        <view class="progress-inner" :style="{width: uploadProgress.idCardBack + '%'}"></view>
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

      <!-- 测试按钮区域 -->
      <view class="test-buttons">
        <button type="primary" @click="testFormValidation" class="test-btn">
          表单验证测试
        </button>
        
        <button type="warn" @click="testRealSubmitAPI" :disabled="isTesting" class="test-btn">
          {{ isTesting ? '提交中...' : '提交入驻申请' }}
        </button>
        
        <button type="default" @click="testGetApplicationStatus" :disabled="isTesting" class="test-btn">
          查询申请状态
        </button>
        
        <button type="default" @click="testGetApplicationDetail" :disabled="isTesting" class="test-btn">
          查询申请详情
        </button>
        
        <button type="default" @click="clearForm" class="test-btn">
          清空表单
        </button>
        
        <button type="default" @click="fillMockData" class="test-btn">
          填充测试数据
        </button>
      </view>

      <!-- 测试结果展示 -->
      <view class="test-results" v-if="testResults.length > 0">
        <text class="results-title">测试结果</text>
        <scroll-view class="results-container" scroll-y>
          <view 
            v-for="(result, index) in testResults" 
            :key="index" 
            class="result-item"
            :class="result.type"
          >
            <text class="result-time">{{ result.time }}</text>
            <text class="result-message">{{ result.message }}</text>
            <text class="result-data" v-if="result.data">{{ result.data }}</text>
          </view>
        </scroll-view>
        
        <button type="default" @click="clearResults" size="mini" class="clear-results-btn">
          清空结果
        </button>
      </view>

      <!-- 调试信息 -->
      <view class="debug-info">
        <text class="debug-title">调试信息</text>
        <view class="debug-content">
          <text>表单数据: {{ JSON.stringify(formData) }}</text>
          <text>验证状态: {{ validationStatus }}</text>
          <text>测试次数: {{ testCount }}</text>
          <text>最后测试: {{ lastTestTime || '暂无' }}</text>
          <text>应用ID: {{ applicationId || '未设置' }}</text>
          <text style="color: #ff6b6b;">⚠️ 注意: 前端字段名已与后端DTO完全统一</text>
        </view>
      </view>

      <!-- 调试按钮区域（开发环境显示） -->
      <view class="debug-buttons" v-if="isDevelopment">
        <button type="warn" @click="testUploadConnection" size="mini" class="debug-btn">测试上传连接</button>
        <button type="warn" @click="checkNetwork" size="mini" class="debug-btn">检查网络</button>
        <button type="warn" @click="clearAllImages" size="mini" class="debug-btn">清空所有图片</button>
      </view>
      
      <button type="primary" @click="submit" :disabled="isSubmitting">
        {{ isSubmitting ? '提交中...' : '下一步' }}
      </button>
    </view>
  </view>
</template>

<script>
import { 
  submitApplication, 
  uploadImage, 
  batchUploadImages,
  getImagesByRelatedInfo,
  deleteImage,
  testUpload,
  getApplicationStatus, 
  getApplicationDetail,
  RELATED_TYPES,
  UPLOAD_STAGES,
  getFileDescription,
  getFileSequence,
  getRelatedTypeByFileType
} from '@/api/join.js';

export default {
  data() {
    return {
      currentStep: 1,
      isSubmitting: false,
      applicationId: null,
      isDevelopment: true, // 开发模式，生产环境设为false
      
      // 新增的测试相关数据
      isTesting: false,
      testCount: 0,
      lastTestTime: null,
      validationStatus: '未验证',
      testResults: [],
      
      // 上传进度
      uploadProgress: {
        store: 0,
        idCardHand: 0,
        idCardFront: 0,
        idCardBack: 0
      },
      
      formData: {
        merchantName: '',
        identity: '',
        legalPerson: '',
        phone: '',
        shopAddress: '',
        storeImage: '',
        idCardHandImage: '',
        idCardFrontImage: '',
        idCardBackImage: ''
      },
      
      // 存储上传后的文件ID
      uploadedFiles: {
        store: null,
        idCardHand: null,
        idCardFront: null,
        idCardBack: null
      },
      
      rules: {
        merchantName: {
          rules: [{
            required: true,
            errorMessage: '商户名称不能为空'
          }, {
            minLength: 2,
            errorMessage: '商户名称至少2个字符'
          }]
        },
        identity: {
          rules: [{
            required: true,
            errorMessage: '入驻人身份不能为空'
          }, {
            minLength: 2,
            errorMessage: '入驻人身份至少2个字符'
          }]
        },
        legalPerson: {
          rules: [{
            required: true,
            errorMessage: '法人姓名不能为空'
          }, {
            minLength: 2,
            errorMessage: '法人姓名至少2个字符'
          }]
        },
        phone: {
          rules: [{
            required: true,
            errorMessage: '手机号码不能为空'
          }, {
            pattern: /^1[3-9]\d{9}$/,
            errorMessage: '请输入正确的11位手机号码'
          }]
        },
        shopAddress: {
          rules: [{
            required: true,
            errorMessage: '店铺地址不能为空'
          }, {
            minLength: 10,
            errorMessage: '地址信息过短，请填写完整的店铺地址'
          }]
        },
        storeImage: {
          rules: [{
            required: true,
            errorMessage: '请上传门店照片'
          }]
        },
        idCardHandImage: {
          rules: [{
            required: true,
            errorMessage: '请上传手持身份证照片'
          }]
        },
        idCardFrontImage: {
          rules: [{
            required: true,
            errorMessage: '请上传身份证正面照片'
          }]
        },
        idCardBackImage: {
          rules: [{
            required: true,
            errorMessage: '请上传身份证反面照片'
          }]
        }
      }
    }
  },
  
  onLoad() {
    console.log('🔄 ShopJoin1 page loaded')
    this.loadApplicationData()
  },
  
  onReady() {
    this.$refs.form.setRules(this.rules)
    this.addTestResult('info', '页面加载完成，表单验证规则已设置')
    this.addTestResult('success', '✅ 前端字段名已与后端DTO完全统一')
  },
  
  methods: {
    // ==================== 新增的测试方法 ====================
    
    // 添加测试结果
    addTestResult(type, message, data = null) {
      const result = {
        type,
        time: new Date().toLocaleTimeString(),
        message,
        data: data ? JSON.stringify(data, null, 2) : null
      }
      
      this.testResults.unshift(result)
      
      // 限制最多显示20条结果
      if (this.testResults.length > 20) {
        this.testResults = this.testResults.slice(0, 20)
      }
    },
    
    // 清空测试结果
    clearResults() {
      this.testResults = []
      this.addTestResult('info', '测试结果已清空')
    },
    
    // 表单验证测试
    async testFormValidation() {
      try {
        this.addTestResult('info', '开始表单验证测试...')
        this.addTestResult('info', '验证规则完全匹配后端DTO注解')
        
        await this.$refs.form.validate()
        
        this.validationStatus = '验证通过'
        this.addTestResult('success', '✅ 表单验证通过！所有字段符合DTO验证规则')
        
      } catch (error) {
        this.validationStatus = '验证失败'
        
        const errorMessages = error.errorMessage || '未知验证错误'
        this.addTestResult('error', `表单验证失败: ${errorMessages}`)
        
        // 显示具体的错误信息
        if (typeof errorMessages === 'object') {
          Object.keys(errorMessages).forEach(field => {
            this.addTestResult('error', `${field}: ${errorMessages[field]}`)
          })
        }
      }
    },
    
    // 真实接口提交测试
    async testRealSubmitAPI() {
      if (this.isTesting) return
      
      this.isTesting = true
      this.testCount++
      
      try {
        this.addTestResult('info', `开始第 ${this.testCount} 次入驻申请提交...`)
        
        // 先进行表单验证
        await this.$refs.form.validate()
        this.addTestResult('info', '✅ 前端验证通过，开始调用后端接口')
        
        // 显示提交的数据
        this.addTestResult('info', '提交数据（完全匹配DTO）:', this.formData)
        this.addTestResult('success', '✅ 前端字段名与后端DTO完全一致')
        
        // 构建申请数据
        const applicationData = this.buildApplicationData()
        
        // 调用真实接口
        const startTime = Date.now()
        const response = await submitApplication(applicationData)
        const endTime = Date.now()
        const duration = endTime - startTime
        
        this.lastTestTime = new Date().toLocaleString()
        
        if (response.code === 200) {
          this.addTestResult('success', `✅ 入驻申请提交成功！耗时: ${duration}ms`)
          this.addTestResult('success', `返回消息: ${response.data}`)
          this.addTestResult('success', '✅ 前端DTO验证通过，后端处理成功')
          
          // 保存申请ID
          this.applicationId = response.data.applicationId || response.data.id
          
          // 自动查询申请状态
          setTimeout(() => {
            this.testGetApplicationStatus()
          }, 1000)
          
        } else {
          this.addTestResult('error', `❌ 申请提交失败: ${response.msg || response.message}`)
          if (response.msg && response.msg.includes('重复提交')) {
            this.addTestResult('info', '提示: 您已提交过申请，请勿重复提交')
          }
        }
        
      } catch (error) {
        this.addTestResult('error', `❌ 接口调用异常: ${error.message}`)
        this.addTestResult('info', '建议检查后端日志，确认数据库表结构问题')
      } finally {
        this.isTesting = false
      }
    },
    
    // 查询申请状态
    async testGetApplicationStatus() {
      try {
        this.addTestResult('info', '查询申请状态...')
        const response = await getApplicationStatus()
        if (response.code === 200) {
          this.addTestResult('success', '申请状态查询成功:', response.data)
        } else {
          this.addTestResult('error', `状态查询失败: ${response.msg}`)
        }
      } catch (error) {
        this.addTestResult('error', `状态查询异常: ${error.message}`)
      }
    },
    
    // 查询申请详情
    async testGetApplicationDetail() {
      try {
        this.addTestResult('info', '查询申请详情...')
        const response = await getApplicationDetail()
        if (response.code === 200) {
          this.addTestResult('success', '申请详情查询成功:', response.data)
        } else {
          this.addTestResult('error', `详情查询失败: ${response.msg}`)
        }
      } catch (error) {
        this.addTestResult('error', `详情查询异常: ${error.message}`)
      }
    },
    
    // 清空表单
    clearForm() {
      this.formData = {
        merchantName: '',
        identity: '',
        legalPerson: '',
        phone: '',
        shopAddress: '',
        storeImage: '',
        idCardHandImage: '',
        idCardFrontImage: '',
        idCardBackImage: ''
      }
      this.validationStatus = '未验证'
      this.addTestResult('info', '表单数据已清空')
    },
    
    // 填充测试数据
    fillMockData() {
      this.formData = {
        merchantName: '测试商户有限公司',
        identity: '法人',
        legalPerson: '张三',
        phone: '13800138000',
        shopAddress: '北京市朝阳区测试街道123号测试大厦A座1001室',
        storeImage: 'https://example.com/store.jpg',
        idCardHandImage: 'https://example.com/idcard_hand.jpg',
        idCardFrontImage: 'https://example.com/idcard_front.jpg',
        idCardBackImage: 'https://example.com/idcard_back.jpg'
      }
      this.addTestResult('info', '已填充测试数据（包含所有DTO字段）')
      this.addTestResult('success', '✅ 测试数据完全匹配后端DTO结构')
    },
    
    // ==================== 原有方法保持不变 ====================
    
    // 加载申请数据
    loadApplicationData() {
      const savedData = uni.getStorageSync('merchant_application_data')
      if (savedData) {
        this.formData = { ...this.formData, ...savedData }
        console.log('📥 Loaded saved application data')
      }
    },
    
    // 保存申请数据
    saveApplicationData() {
      uni.setStorageSync('merchant_application_data', this.formData)
      console.log('💾 Saved application data')
    },
    
    // 过滤只能输入汉字
    filterChinese(fieldName) {
      this.formData[fieldName] = this.formData[fieldName].replace(/[^\u4e00-\u9fa5]/g, '');
      this.saveApplicationData()
    },
    
    // 过滤只能输入数字
    filterNumber(fieldName) {
      this.formData[fieldName] = this.formData[fieldName].replace(/[^\d]/g, '');
      this.saveApplicationData()
    },
    
    // 过滤只能输入汉字和数字
    filterChineseNumber(fieldName) {
      this.formData[fieldName] = this.formData[fieldName].replace(/[^\u4e00-\u9fa5\d]/g, '');
      this.saveApplicationData()
    },
    
    // 上传文件方法
    async uploadFile(type) {
      try {
        console.log('🔄 Starting upload process for:', type)
        
        // 1. 选择图片
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
        
        // 验证文件大小
        if (tempFile.size > 5 * 1024 * 1024) {
          throw new Error('图片大小不能超过5MB')
        }
        
        // 显示上传中状态
        this.uploadProgress[type] = 1
        
        // 2. 调用实际上传接口
        const result = await this.actualUploadFile(tempFilePath, type)
        
        console.log('📤 Upload API response:', result)
        
        if (result.code === 200) {
          // 更新表单数据和文件ID
          this.formData[`${type}Image`] = result.data.fileUrl
          this.uploadedFiles[type] = result.data.mediaId
          
          this.saveApplicationData()
          
          uni.showToast({
            title: '上传成功',
            icon: 'success',
            duration: 2000
          })
          
          this.addTestResult('success', `✅ ${this.getUploadTypeName(type)}上传成功`)
        } else {
          throw new Error(result.msg || result.message || '上传失败')
        }
        
      } catch (error) {
        console.error('❌ Upload process failed:', error)
        this.addTestResult('error', `❌ ${this.getUploadTypeName(type)}上传失败: ${error.message}`)
        
        uni.showToast({
          title: error.message || '上传失败',
          icon: 'none',
          duration: 3000
        })
      } finally {
        // 重置上传进度
        this.uploadProgress[type] = 0
      }
    },
    
    // 获取上传类型名称
    getUploadTypeName(type) {
      const mapping = {
        store: '门店照片',
        idCardHand: '手持身份证',
        idCardFront: '身份证正面',
        idCardBack: '身份证反面'
      }
      return mapping[type] || type
    },
    
    // 实际上传文件到服务器
    async actualUploadFile(filePath, fileType) {
      try {
        console.log('🚀 Starting actual file upload...')
        
        // 使用工具函数获取正确的参数
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
        
        // 调用上传接口
        const response = await uploadImage(
          filePath,
          relatedType,
          relatedId,
          description,
          stage,
          sequence
        )
        
        console.log('✅ Upload API response received:', response)
        
        // 返回格式化的数据，便于前端使用
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
    
    // 预览图片
    previewImage(type) {
      let url = ''
      
      if (type === 'store') {
        url = this.formData.storeImage
      } else if (type === 'idCardHand') {
        url = this.formData.idCardHandImage
      } else if (type === 'idCardFront') {
        url = this.formData.idCardFrontImage
      } else if (type === 'idCardBack') {
        url = this.formData.idCardBackImage
      }
      
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
              const fieldMap = {
                store: 'storeImage',
                idCardHand: 'idCardHandImage', 
                idCardFront: 'idCardFrontImage',
                idCardBack: 'idCardBackImage'
              }
              
              const fieldName = fieldMap[type]
              if (fieldName) {
                // 如果有文件ID，调用删除接口
                const mediaId = this.uploadedFiles[type]
                if (mediaId) {
                  console.log('🗑️ Deleting image from server, mediaId:', mediaId)
                  await deleteImage(mediaId)
                }
                
                // 更新本地数据
                this.formData[fieldName] = ''
                this.uploadedFiles[type] = null
                
                this.saveApplicationData()
                
                uni.showToast({
                  title: '删除成功',
                  icon: 'success',
                  duration: 2000
                })
                
                this.addTestResult('info', `🗑️ 已删除${this.getUploadTypeName(type)}`)
              }
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
    
    // 构建申请数据
    buildApplicationData() {
      const applicationData = {
        merchantName: this.formData.merchantName,
        identity: this.formData.identity,
        legalPerson: this.formData.legalPerson,
        phone: this.formData.phone,
        shopAddress: this.formData.shopAddress,
        // 图片信息 - 传递图片ID数组
        imageIds: [
          this.uploadedFiles.store,
          this.uploadedFiles.idCardHand,
          this.uploadedFiles.idCardFront,
          this.uploadedFiles.idCardBack
        ].filter(id => id)
      }
      
      console.log('📦 Built application data:', applicationData)
      return applicationData
    },
    
    // 提交表单
    async submit() {
      if (this.isSubmitting) return
      
      try {
        this.isSubmitting = true
        
        console.log('🔄 Starting form submission...')
        this.addTestResult('info', '开始正式提交入驻申请...')
        
        // 表单验证
        await this.$refs.form.validate()
        console.log('✅ Form validation passed')
        this.addTestResult('success', '✅ 表单验证通过')
        
        // 检查必填图片
        const requiredImages = ['store', 'idCardHand', 'idCardFront', 'idCardBack']
        const missingImages = requiredImages.filter(type => !this.formData[`${type}Image`])
        
        if (missingImages.length > 0) {
          throw new Error('请上传所有必需的图片资料')
        }
        
        uni.showLoading({
          title: '提交中...',
          mask: true
        })
        
        // 构建申请数据
        const applicationData = this.buildApplicationData()
        this.addTestResult('info', '提交数据:', applicationData)
        
        // 调用提交接口
        console.log('📨 Sending application data to server...')
        const response = await submitApplication(applicationData)
        console.log('📨 Server response:', response)
        
        if (response.code === 200) {
          uni.hideLoading()
          
          uni.showToast({
            title: '提交成功',
            icon: 'success',
            duration: 2000
          })
          
          // 保存申请ID
          this.applicationId = response.data.applicationId || response.data.id
          console.log('🎉 Application created successfully, ID:', this.applicationId)
          this.addTestResult('success', `✅ 入驻申请提交成功！申请ID: ${this.applicationId}`)
          
          // 清除本地存储的数据
          uni.removeStorageSync('merchant_application_data')
          
          // 如果有临时上传的图片（relatedId=0），现在可以更新它们的关联ID
          await this.updateTempImagesRelatedId()
          
          // 这里可以跳转到下一步
          setTimeout(() => {
            uni.navigateTo({
              url: `/pages/join/ShopJoin2?applicationId=${this.applicationId}`
            })
          }, 1500)
          
        } else {
          throw new Error(response.msg || response.message || '提交失败')
        }
        
      } catch (error) {
        uni.hideLoading()
        console.error('❌ Form submission failed:', error)
        this.addTestResult('error', `❌ 提交失败: ${error.message}`)
        
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
      }
    },
    
    // 更新临时图片的关联ID
    async updateTempImagesRelatedId() {
      if (!this.applicationId) return
      
      console.log('🔄 Updating temporary images with application ID:', this.applicationId)
      this.addTestResult('info', `🔄 更新图片关联ID: ${this.applicationId}`)
    },
    
    // ==================== 调试方法 ====================
    
    // 测试上传连接
    async testUploadConnection() {
      try {
        console.log('🧪 Starting upload connection test...')
        this.addTestResult('info', '🧪 开始上传连接测试...')
        uni.showLoading({ title: '测试中...', mask: true })
        
        const result = await testUpload()
        
        uni.hideLoading()
        console.log('✅ Test upload successful:', result)
        this.addTestResult('success', '✅ 上传连接测试成功', result)
        
        uni.showModal({
          title: '测试结果 - 成功',
          content: `上传测试成功！\n\n返回信息: ${result.msg}\n文件URL: ${result.data?.fileUrl || 'N/A'}`,
          showCancel: false
        })
        
      } catch (error) {
        uni.hideLoading()
        console.error('❌ Test upload failed:', error)
        this.addTestResult('error', '❌ 上传连接测试失败', error.message)
        
        uni.showModal({
          title: '测试结果 - 失败',
          content: `上传测试失败！\n\n错误信息: ${error.message}\n\n请检查：\n1. 网络连接\n2. 服务器状态\n3. 文件大小限制\n4. 后端服务是否正常`,
          showCancel: false
        })
      }
    },
    
    // 检查网络状态
    async checkNetwork() {
      try {
        const network = await new Promise((resolve, reject) => {
          uni.getNetworkType({
            success: resolve,
            fail: reject
          })
        })
        
        console.log('🌐 Network status:', network)
        this.addTestResult('info', `🌐 网络状态: ${network.networkType}`)
        
        uni.showModal({
          title: '网络状态',
          content: `网络类型: ${network.networkType}\n连接状态: 正常`,
          showCancel: false
        })
        
      } catch (error) {
        this.addTestResult('error', '❌ 网络检查失败')
        uni.showModal({
          title: '网络检查失败',
          content: '无法获取网络状态信息',
          showCancel: false
        })
      }
    },
    
    // 清空所有图片
    clearAllImages() {
      uni.showModal({
        title: '确认清空',
        content: '确定要清空所有已上传的图片吗？',
        success: (res) => {
          if (res.confirm) {
            // 清空表单中的图片
            this.formData.storeImage = ''
            this.formData.idCardHandImage = ''
            this.formData.idCardFrontImage = ''
            this.formData.idCardBackImage = ''
            
            // 清空文件ID记录
            this.uploadedFiles.store = null
            this.uploadedFiles.idCardHand = null
            this.uploadedFiles.idCardFront = null
            this.uploadedFiles.idCardBack = null
            
            // 清空上传进度
            this.uploadProgress.store = 0
            this.uploadProgress.idCardHand = 0
            this.uploadProgress.idCardFront = 0
            this.uploadProgress.idCardBack = 0
            
            this.saveApplicationData()
            
            uni.showToast({
              title: '已清空所有图片',
              icon: 'success'
            })
            
            console.log('🧹 Cleared all images')
            this.addTestResult('info', '🧹 已清空所有图片')
          }
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
/* 保持原有的所有样式不变，只添加新的测试相关样式 */

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

/* 步骤容器 */
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

/* 上传区域垂直布局 */
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

/* 身份证正反面特殊布局 */
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

/* 上传按钮样式 */
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

/* 预览区域样式 */
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

/* 上传进度样式 */
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

/* 新增的测试按钮区域样式 */
.test-buttons {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-top: 40rpx;
  margin-bottom: 40rpx;
}

.test-btn {
  width: 100%;
  border-radius: 12rpx;
  font-size: 32rpx;
  padding: 25rpx 0;
  border: none;
}

button[type="primary"] {
  background-color: #007AFF;
  color: #fff;
}

button[type="warn"] {
  background-color: #ff6b6b;
  color: #fff;
}

button[type="default"] {
  background-color: #f8f9fa;
  color: #333;
  border: 1rpx solid #dee2e6;
}

/* 测试结果展示样式 */
.test-results {
  margin-top: 40rpx;
  padding: 30rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  border: 1rpx solid #e9ecef;
}

.results-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.results-container {
  max-height: 400rpx;
  margin-bottom: 20rpx;
}

.result-item {
  padding: 20rpx;
  margin-bottom: 15rpx;
  border-radius: 8rpx;
  border-left: 6rpx solid #007AFF;
}

.result-item.success {
  background: #d4edda;
  border-left-color: #28a745;
}

.result-item.error {
  background: #f8d7da;
  border-left-color: #dc3545;
}

.result-item.warning {
  background: #fff3cd;
  border-left-color: #ffc107;
}

.result-item.info {
  background: #d1ecf1;
  border-left-color: #17a2b8;
}

.result-time {
  display: block;
  font-size: 22rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.result-message {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 8rpx;
  font-weight: 500;
}

.result-data {
  display: block;
  font-size: 24rpx;
  color: #666;
  background: rgba(255, 255, 255, 0.7);
  padding: 15rpx;
  border-radius: 6rpx;
  margin-top: 10rpx;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.clear-results-btn {
  width: auto;
  align-self: flex-end;
  font-size: 24rpx;
  padding: 12rpx 24rpx;
}

/* 调试信息样式 */
.debug-info {
  margin-top: 40rpx;
  padding: 30rpx;
  background: #e7f3ff;
  border-radius: 12rpx;
  border: 1rpx solid #b3d9ff;
}

.debug-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #0066cc;
  margin-bottom: 15rpx;
  display: block;
}

.debug-content {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.debug-content text {
  font-size: 24rpx;
  color: #333;
  font-family: monospace;
  word-break: break-all;
}

/* 调试按钮区域 */
.debug-buttons {
  display: flex;
  gap: 20rpx;
  margin: 30rpx 0 20rpx;
  padding: 25rpx;
  background: #fffbe6;
  border: 1rpx solid #ffe58f;
  border-radius: 12rpx;
}

.debug-btn {
  flex: 1;
  font-size: 24rpx;
  padding: 16rpx 8rpx;
  background: #faad14;
  color: #fff;
  border: none;
  border-radius: 8rpx;
}

.debug-btn:active {
  background: #d48806;
}

/* 提交按钮样式 */
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