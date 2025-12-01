<template>
  <view class="container">
    <view class="header">
      <text class="title">填写您的需求</text>
      <text class="subtitle">填写您的需求，我们将为您匹配最合适的设计师或者监理</text>
    </view>

    <form @submit="submitForm" @reset="resetForm">
      <!-- 第一部分：房屋信息 -->
      <view class="form-section">
        <text class="section-title">房屋信息</text>
        
        <view class="form-group">
          <text class="label">房屋面积 <text class="optional">(可选)</text></text>
          <uni-easyinput 
            type="digit" 
            v-model="formData.area" 
            placeholder="请输入房屋面积（平方米）"
            :styles="inputStyles"
            :inputBorder="true"
          >
            <template #right>
              <text class="suffix">㎡</text>
            </template>
          </uni-easyinput>
        </view>
        
        <view class="form-group">
          <text class="label">装修地址 <text class="optional">(可选)</text></text>
          <uni-easyinput 
            type="text" 
            v-model="formData.address" 
            placeholder="请输入装修地址"
            :styles="inputStyles"
            :inputBorder="true"
          />
        </view>
      </view>
      
      <!-- 第二部分：订单要求 -->
      <view class="form-section">
        <text class="section-title">订单要求</text>
        
        <view class="form-group">
          <text class="label required">项目名称</text>
          <uni-easyinput 
            type="text" 
            v-model="formData.projectName" 
            placeholder="请输入项目名称"
            :styles="inputStyles"
            :inputBorder="true"
            required
          />
          <text v-if="errors.projectName" class="error-message">{{ errors.projectName }}</text>
        </view>
        
        <view class="form-group">
          <text class="label required">服务类型</text>
          <view class="service-type-container">
            <view 
              class="service-option" 
              :class="{ 'selected': formData.serviceType === 'designer' }"
              @click="selectServiceType('designer')"
            >
              <text class="service-icon">🎨</text>
              <text class="service-text">需要设计师</text>
            </view>
            <view 
              class="service-option" 
              :class="{ 'selected': formData.serviceType === 'supervisor' }"
              @click="selectServiceType('supervisor')"
            >
              <text class="service-icon">📋</text>
              <text class="service-text">需要监理</text>
            </view>
            <view 
              class="service-option" 
              :class="{ 'selected': formData.serviceType === 'both' }"
              @click="selectServiceType('both')"
            >
              <text class="service-icon">🎨📋</text>
              <text class="service-text">两者都需要</text>
            </view>
          </view>
          <text v-if="errors.serviceType" class="error-message">{{ errors.serviceType }}</text>
        </view>
        
        <view class="form-group">
          <text class="label required">预算金额</text>
          <uni-easyinput 
            type="digit" 
            v-model="formData.budget" 
            placeholder="请输入您的预算金额（元）"
            :styles="inputStyles"
            :inputBorder="true"
            required
          >
            <template #right>
              <text class="suffix">元</text>
            </template>
          </uni-easyinput>
          <text v-if="errors.budget" class="error-message">{{ errors.budget }}</text>
        </view>
        
        <view class="form-group">
          <text class="label">订单截至时间 <text class="optional">(可选)</text></text>
          <view class="picker-container">
            <picker 
              mode="date" 
              :value="formData.deadline" 
              @change="onDateChange"
            >
              <view class="picker-display">
                <text class="picker-text" :class="{'placeholder-text': !formData.deadline}">
                  {{ formData.deadline || '请选择截至时间' }}
                </text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
        </view>
      </view>
      
      <!-- 第三部分：需求部分 -->
      <view class="form-section">
        <text class="section-title">具体需求</text>
        
        <view class="form-group">
          <text class="label">具体需求：</text>
          <editor
            class="rich-text-editor"
            :placeholder="editorPlaceholder"
            @ready="onEditorReady"
            @input="onEditorInput"
            show-confirm-bar="false"
          />
        </view>
      </view>
      
      <!-- 提交按钮 -->
      <view class="form-actions">
        <button class="uni-btn submit-btn" form-type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? '提交中...' : '提交需求' }}
        </button>
        <button class="uni-btn reset-btn" form-type="reset">重置表单</button>
      </view>
    </form>
  </view>
</template>

<script>
import { projectService } from '@/api/project.js'

export default {
  data() {
    return {
      formData: {
        projectName: '',
        serviceType: '',
        area: '',
        address: '',
        budget: '',
        deadline: '',
        requirement: ''
      },
      errors: {
        projectName: '',
        serviceType: '',
        budget: ''
      },
      editorCtx: null,
      // uni-easyinput 样式配置
      inputStyles: {
        color: '#333',
        backgroundColor: '#fff',
        borderColor: '#ddd',
        borderWidth: '2rpx',
        borderRadius: '10rpx'
      },
      // 提交状态
      isSubmitting: false,
      // Editor placeholder 内容
      editorPlaceholder: '请输入您的具体需求，例如：需要3D效果图、现代简约风格、需要全屋定制、预算包含主材和辅材'
    }
  },
  methods: {
    // 选择服务类型
    selectServiceType(type) {
      this.formData.serviceType = type
      // 清除错误信息
      if (this.errors.serviceType) {
        this.errors.serviceType = ''
      }
    },
    
    // 富文本编辑器准备完成
    onEditorReady() {
      uni.createSelectorQuery().select('.rich-text-editor').context((res) => {
        this.editorCtx = res.context
      }).exec()
    },
    
    // 编辑器输入
    onEditorInput(e) {
      this.formData.requirement = e.detail.html
    },
    
    // 获取纯文本内容（用于description字段）
    getPlainText(html) {
      if (!html) return ''
      // 简单的HTML标签去除
      return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
    },
    
    // 日期选择变化
    onDateChange(e) {
      this.formData.deadline = e.detail.value
    },
    
    // 表单验证
    validateForm() {
      let isValid = true
      this.errors = {
        projectName: '',
        serviceType: '',
        budget: ''
      }
      
      // 验证项目名称
      if (!this.formData.projectName.trim()) {
        this.errors.projectName = '请输入项目名称'
        isValid = false
      } else if (this.formData.projectName.trim().length < 2) {
        this.errors.projectName = '项目名称至少2个字符'
        isValid = false
      } else if (this.formData.projectName.trim().length > 100) {
        this.errors.projectName = '项目名称不能超过100个字符'
        isValid = false
      }
      
      // 验证服务类型
      if (!this.formData.serviceType) {
        this.errors.serviceType = '请选择至少一项服务类型'
        isValid = false
      }
      
      // 验证预算
      if (!this.formData.budget || this.formData.budget <= 0) {
        this.errors.budget = '请输入有效的预算金额'
        isValid = false
      } else if (this.formData.budget < 1000) {
        this.errors.budget = '预算金额不能低于1000元'
        isValid = false
      } else if (this.formData.budget > 10000000) {
        this.errors.budget = '预算金额不能超过1000万元'
        isValid = false
      }
      
      // 验证面积（如果填写了）
      if (this.formData.area && this.formData.area < 1) {
        uni.showToast({
          title: '房屋面积不能小于1平方米',
          icon: 'none'
        })
        isValid = false
      }
      
      return isValid
    },
    
    // 构建提交数据
    buildSubmitData() {
      // 根据数据库注释映射角色类型
      // 1-设计师，2-监理，3-设计师和监理
      const roleMap = {
        'designer': 1,    // 设计师
        'supervisor': 2,  // 监理
        'both': 3         // 设计师和监理
      }
      
      const submitData = {
        title: this.formData.projectName.trim(),
        description: this.getPlainText(this.formData.requirement) || '暂无详细描述',
        requiredRoles: roleMap[this.formData.serviceType] || 1,
        budget: parseFloat(this.formData.budget)
      }
      
      // 可选字段处理
      if (this.formData.area) {
        submitData.area = parseFloat(this.formData.area)
      }
      
      if (this.formData.address && this.formData.address.trim()) {
        submitData.address = this.formData.address.trim()
      }
      
      if (this.formData.deadline) {
        submitData.deadline = this.formData.deadline
      }
      
      return submitData
    },
    
    // 提交表单
    async submitForm() {
      if (this.isSubmitting) return
      
      if (!this.validateForm()) {
        uni.showToast({
          title: '请完善表单信息',
          icon: 'none'
        })
        return
      }
      
      this.isSubmitting = true
      
      try {
        // 显示加载中
        uni.showLoading({
          title: '提交中...',
          mask: true
        })
        
        // 构建提交数据
        const submitData = this.buildSubmitData()
        console.log('提交数据:', JSON.stringify(submitData, null, 2))
        
        // 调用API提交数据
        const result = await projectService.createProject(submitData)
        
        // 提交成功
        uni.hideLoading()
        this.isSubmitting = false
        
        uni.showModal({
          title: '提交成功',
          content: this.getSuccessMessage(submitData.requiredRoles),
          showCancel: false,
          confirmText: '确定',
          success: (res) => {
            if (res.confirm) {
              // 重置表单
              this.resetFormData()
              // 跳转到已发布需求页面
              uni.navigateTo({
                url: '/pages/mine/posted/order-posted'
              })
            }
          }
        })
        
      } catch (error) {
        console.error('提交失败:', error)
        uni.hideLoading()
        this.isSubmitting = false
        
        let errorMessage = '网络异常，请稍后重试'
        if (error.message) {
          if (error.message.includes('网络连接失败')) {
            errorMessage = '网络连接失败，请检查网络设置'
          } else if (error.message.includes('用户取消')) {
            return // 用户取消操作，不显示错误
          } else {
            errorMessage = error.message
          }
        }
        
        uni.showModal({
          title: '提交失败',
          content: errorMessage,
          showCancel: false,
          confirmText: '确定'
        })
      }
    },
    
    // 根据角色类型获取成功消息
    getSuccessMessage(requiredRoles) {
      const messages = {
        1: '您的设计需求已提交成功！我们将尽快为您匹配合适的设计师。',
        2: '您的监理需求已提交成功！我们将尽快为您匹配合适的监理。',
        3: '您的装修需求已提交成功！我们将尽快为您同时匹配合适的设计师和监理。'
      }
      return messages[requiredRoles] || '需求提交成功！我们将尽快为您服务。'
    },
    
    // 重置表单数据
    resetFormData() {
      this.formData = {
        projectName: '',
        serviceType: '',
        area: '',
        address: '',
        budget: '',
        deadline: '',
        requirement: ''
      }
      this.errors = {
        projectName: '',
        serviceType: '',
        budget: ''
      }
      if (this.editorCtx) {
        this.editorCtx.clear()
      }
    },
    
    // 重置表单（带确认）
    resetForm() {
      // 检查表单是否有数据
      const hasData = Object.values(this.formData).some(value => 
        value && value.toString().trim() !== ''
      )
      
      if (!hasData) {
        this.resetFormData()
        uni.showToast({
          title: '表单已重置',
          icon: 'success'
        })
        return
      }
      
      uni.showModal({
        title: '提示',
        content: '确定要重置表单吗？所有填写的内容将被清空。',
        success: (res) => {
          if (res.confirm) {
            this.resetFormData()
            uni.showToast({
              title: '表单已重置',
              icon: 'success'
            })
          }
        }
      })
    }
  },
  
  onLoad(options) {
    // 页面加载时的初始化操作
    console.log('装修需求表单页面加载')
    
    // 从URL参数获取预填数据（如果有）
    if (options.projectName) {
      this.formData.projectName = decodeURIComponent(options.projectName)
    }
  },
  
  onShow() {
    // 页面显示时的操作
  },
  
  onUnload() {
    // 页面卸载时的清理操作
    this.isSubmitting = false
  }
}
</script>

<style scoped>
.container {
  background-color: #f0f2f5;
  min-height: 100vh;
  padding: 20rpx;
}

.header {
  background-color: #4a6fa5;
  color: white;
  padding: 60rpx 40rpx;
  text-align: center;
  border-radius: 20rpx 20rpx 0 0;
}

.title {
  font-size: 44rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 20rpx;
}

.subtitle {
  font-size: 32rpx;
  opacity: 0.9;
  display: block;
}

.form-section {
  background-color: white;
  padding: 50rpx 40rpx;
  margin-top: 20rpx;
  border-radius: 10rpx;
}

.section-title {
  font-size: 36rpx;
  color: #4a6fa5;
  font-weight: bold;
  margin-bottom: 40rpx;
  display: block;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #f5f7fa;
}

.form-group {
  margin-bottom: 40rpx;
}

.label {
  display: block;
  margin-bottom: 20rpx;
  font-weight: 600;
  font-size: 32rpx;
}

.required::after {
  content: " *";
  color: #dc3545;
}

.optional {
  color: #777;
  font-weight: normal;
  font-size: 26rpx;
}

.suffix {
  color: #999;
  font-size: 28rpx;
  padding-right: 20rpx;
}

.service-type-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-top: 10rpx;
}

.service-option {
  flex: 1;
  min-width: 200rpx;
  border: 2rpx solid #ddd;
  border-radius: 10rpx;
  padding: 30rpx 20rpx;
  text-align: center;
  background-color: #fff;
  transition: all 0.3s;
}

.service-option.selected {
  border-color: #4a6fa5;
  background-color: #f0f7ff;
  box-shadow: 0 4rpx 12rpx rgba(74, 111, 165, 0.2);
}

.service-icon {
  font-size: 48rpx;
  display: block;
  margin-bottom: 15rpx;
}

.service-text {
  font-size: 28rpx;
  color: #333;
}

.rich-text-editor {
  min-height: 400rpx;
  border: 2rpx solid #ddd;
  border-radius: 10rpx;
  padding: 20rpx;
  font-size: 32rpx;
  background-color: #fff;
}

.uni-btn {
  border: none;
  border-radius: 10rpx;
  font-size: 32rpx;
  padding: 24rpx 40rpx;
  margin: 0;
  line-height: 1;
}

.uni-btn:after {
  border: none;
}

.picker-container {
  border: 2rpx solid #ddd;
  border-radius: 10rpx;
  background-color: white;
}

.picker-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 30rpx;
}

.picker-text {
  font-size: 32rpx;
  color: #333;
}

.placeholder-text {
  color: #999;
}

.picker-arrow {
  color: #999;
  font-size: 24rpx;
}

.form-actions {
  padding: 50rpx 40rpx;
  display: flex;
  justify-content: center;
  gap: 30rpx;
  background-color: white;
  margin-top: 20rpx;
  border-radius: 0 0 20rpx 20rpx;
}

.submit-btn {
  background-color: #ff7e5f;
  color: white;
  font-weight: 600;
  flex: 1;
}

.submit-btn[disabled] {
  background-color: #ccc;
  color: #999;
}

.reset-btn {
  background-color: #f5f7fa;
  color: #333;
  font-weight: 600;
  flex: 1;
}

.error-message {
  color: #dc3545;
  font-size: 26rpx;
  margin-top: 10rpx;
  display: block;
}

/* 响应式设计 */
@media (max-width: 750px) {
  .form-actions {
    flex-direction: column;
  }
  
  .service-type-container {
    flex-direction: column;
  }
  
  .uni-btn {
    width: 100%;
  }
}

/* 移除所有 :deep() 选择器，使用全局样式类替代 */
/* 注意：这些样式可能需要放在全局样式文件中，因为小程序不支持深度选择器 */
</style>