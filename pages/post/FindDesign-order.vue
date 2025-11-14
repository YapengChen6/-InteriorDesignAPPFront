<template>
  <view class="container">
    <view class="header">
      <text class="title">寻找专业设计师</text>
      <text class="subtitle">填写您的需求，我们将为您匹配最合适的设计师</text>
    </view>

    <form @submit="submitForm" @reset="resetForm">
      <!-- 第一部分：个人信息 -->
      <view class="form-section">
        <text class="section-title">个人信息</text>
        
        <view class="form-group">
          <text class="label required">姓名</text>
          <uni-easyinput 
            type="text" 
            v-model="formData.name" 
            placeholder="请输入您的姓名"
            :styles="inputStyles"
            :inputBorder="true"
            required
          />
          <text v-if="errors.name" class="error-message">{{ errors.name }}</text>
        </view>
        
        <view class="form-group">
          <text class="label required">电话号码</text>
          <uni-easyinput 
            type="number" 
            v-model="formData.phone" 
            placeholder="请输入您的手机号码"
            :styles="inputStyles"
            :inputBorder="true"
            required
          />
          <text v-if="errors.phone" class="error-message">{{ errors.phone }}</text>
        </view>
      </view>
      
      <!-- 第二部分：房屋信息 -->
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
      
      <!-- 第三部分：订单要求 -->
      <view class="form-section">
        <text class="section-title">订单要求</text>
        
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
          <text class="label">项目截至时间 <text class="optional">(可选)</text></text>
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
        
        <view class="form-group">
          <text class="label required">装修风格</text>
          <view class="picker-container">
            <picker 
              mode="selector" 
              :range="styleOptions" 
              :value="styleIndex" 
              @change="onStyleChange"
            >
              <view class="picker-display">
                <text class="picker-text" :class="{'placeholder-text': !formData.style}">
                  {{ formData.style || '请选择装修风格' }}
                </text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
          <text v-if="errors.style" class="error-message">{{ errors.style }}</text>
        </view>
      </view>
      
      <!-- 第四部分：需求部分 -->
      <view class="form-section">
        <text class="section-title">具体需求</text>
        
        <view class="form-group">
          <text class="label">添加需求：</text>
          <view class="requirement-input">
            <uni-easyinput 
              type="text" 
              v-model="newRequirement" 
              placeholder="请输入您的需求，例如：需3D效果图"
              :styles="requirementInputStyles"
              :inputBorder="true"
              @confirm="addRequirement"
              confirmType="done"
            />
            <button class="uni-btn add-btn" @click="addRequirement" type="button">添加</button>
          </view>
          
          <scroll-view class="requirements-list" scroll-y>
            <view 
              v-for="(req, key) in requirements" 
              :key="key" 
              class="requirement-item"
            >
              <text class="requirement-text">{{ key }}: {{ req }}</text>
              <button class="uni-btn delete-btn" @click="removeRequirement(key)" type="button">删除</button>
            </view>
            <view v-if="Object.keys(requirements).length === 0" class="empty-tips">
              暂无需求，请添加您的具体需求
            </view>
          </scroll-view>
        </view>
        
        <view class="form-group">
          <text class="label">需求JSON预览：</text>
          <scroll-view class="json-preview" scroll-y>
            <text class="json-text">{{ JSON.stringify(requirements, null, 2) }}</text>
          </scroll-view>
        </view>
      </view>
      
      <!-- 提交按钮 -->
      <view class="form-actions">
        <button class="uni-btn submit-btn" form-type="submit">提交需求</button>
        <button class="uni-btn reset-btn" form-type="reset">重置表单</button>
      </view>
    </form>
  </view>
</template>

<script>
export default {
  data() {
    return {
      formData: {
        name: '',
        phone: '',
        area: '',
        address: '',
        budget: '',
        deadline: '',
        style: ''
      },
      errors: {
        name: '',
        phone: '',
        budget: '',
        style: ''
      },
      newRequirement: '',
      requirements: {},
      requirementCounter: 1,
      styleOptions: ['现代简约', '北欧风格', '工业风', '传统中式', '欧式古典', '日式风格', '其他'],
      styleIndex: -1,
      // uni-easyinput 样式配置
      inputStyles: {
        color: '#333',
        backgroundColor: '#fff',
        borderColor: '#ddd',
        borderWidth: '2rpx',
        borderRadius: '10rpx'
      },
      requirementInputStyles: {
        color: '#333',
        backgroundColor: '#fff',
        borderColor: '#ddd',
        borderWidth: '2rpx',
        borderRadius: '10rpx',
        flex: 1
      }
    }
  },
  methods: {
    // 添加需求
    addRequirement() {
      if (!this.newRequirement.trim()) {
        uni.showToast({
          title: '请输入需求内容',
          icon: 'none'
        })
        return
      }
      
      this.requirements[this.requirementCounter] = this.newRequirement.trim()
      this.newRequirement = ''
      this.requirementCounter++
      
      // 强制更新视图
      this.$forceUpdate()
    },
    
    // 删除需求
    removeRequirement(key) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这条需求吗？',
        success: (res) => {
          if (res.confirm) {
            delete this.requirements[key]
            // 重新创建对象以触发响应式更新
            this.requirements = {...this.requirements}
          }
        }
      })
    },
    
    // 日期选择变化
    onDateChange(e) {
      this.formData.deadline = e.detail.value
    },
    
    // 装修风格选择变化
    onStyleChange(e) {
      const index = parseInt(e.detail.value)
      this.styleIndex = index
      this.formData.style = this.styleOptions[index]
    },
    
    // 表单验证
    validateForm() {
      let isValid = true
      this.errors = {
        name: '',
        phone: '',
        budget: '',
        style: ''
      }
      
      // 验证姓名
      if (!this.formData.name.trim()) {
        this.errors.name = '请输入有效的姓名'
        isValid = false
      }
      
      // 验证电话号码
      const phoneRegex = /^1[3-9]\d{9}$/
      if (!phoneRegex.test(this.formData.phone)) {
        this.errors.phone = '请输入有效的手机号码'
        isValid = false
      }
      
      // 验证预算
      if (!this.formData.budget || this.formData.budget <= 0) {
        this.errors.budget = '请输入有效的预算金额'
        isValid = false
      }
      
      // 验证装修风格
      if (!this.formData.style) {
        this.errors.style = '请选择装修风格'
        isValid = false
      }
      
      return isValid
    },
    
    // 提交表单
    submitForm() {
      if (this.validateForm()) {
        const formData = {
          ...this.formData,
          requirements: this.requirements
        }
        
        uni.showModal({
          title: '提交成功',
          content: '您的需求已提交成功！我们将尽快为您匹配设计师。\n\n需求JSON:\n' + JSON.stringify(this.requirements, null, 2),
          showCancel: false,
          success: () => {
            // 在实际应用中，这里应该发送数据到服务器
            console.log('表单数据:', formData)
          }
        })
      } else {
        uni.showToast({
          title: '请完善表单信息',
          icon: 'none'
        })
      }
    },
    
    // 重置表单
    resetForm() {
      this.formData = {
        name: '',
        phone: '',
        area: '',
        address: '',
        budget: '',
        deadline: '',
        style: ''
      }
      this.requirements = {}
      this.requirementCounter = 1
      this.styleIndex = -1
      this.errors = {
        name: '',
        phone: '',
        budget: '',
        style: ''
      }
      this.newRequirement = ''
    }
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

.requirement-input {
  display: flex;
  gap: 20rpx;
  margin-bottom: 30rpx;
  align-items: center;
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

.add-btn {
  background-color: #4a6fa5;
  color: white;
  white-space: nowrap;
  height: 88rpx;
}

.requirements-list {
  margin-top: 30rpx;
  max-height: 400rpx;
  border: 2rpx solid #ddd;
  border-radius: 10rpx;
  padding: 0 20rpx;
}

.requirement-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 10rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.requirement-item:last-child {
  border-bottom: none;
}

.requirement-text {
  flex: 1;
  font-size: 30rpx;
  padding-right: 20rpx;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
  padding: 16rpx 30rpx;
  font-size: 28rpx;
}

.empty-tips {
  text-align: center;
  color: #999;
  padding: 40rpx;
  font-size: 28rpx;
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

.json-preview {
  background-color: #f5f7fa;
  padding: 30rpx;
  border-radius: 10rpx;
  margin-top: 20rpx;
  border: 2rpx solid #ddd;
  min-height: 200rpx;
  max-height: 400rpx;
}

.json-text {
  font-family: monospace;
  white-space: pre-wrap;
  font-size: 28rpx;
  color: #333;
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
  
  .requirement-input {
    flex-direction: column;
  }
  
  .add-btn {
    width: 100%;
  }
  
  .uni-btn {
    width: 100%;
  }
}

/* 自定义 uni-easyinput 样式 - 增强边框效果 */
:deep(.uni-easyinput__content) {
  border-radius: 10rpx !important;
  border: 2rpx solid #ddd !important;
}

:deep(.uni-easyinput__content.is-input-border) {
  border: 2rpx solid #ddd !important;
}

:deep(.uni-easyinput__content-input) {
  font-size: 32rpx !important;
}

:deep(.uni-easyinput__placeholder) {
  color: #999 !important;
  font-size: 32rpx !important;
}

/* 焦点状态下的边框颜色 */
:deep(.uni-easyinput__content.is-input-border:focus-within) {
  border-color: #4a6fa5 !important;
  box-shadow: 0 0 0 2rpx rgba(74, 111, 165, 0.2) !important;
}
</style>