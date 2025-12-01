<template>
  <view class="container">
    <view class="header">
      <text class="title">{{ isEditMode ? '修改需求' : '填写您的需求' }}</text>
      <text class="subtitle">{{ isEditMode ? '修改您的需求信息' : '填写您的需求，我们将为您匹配最合适的设计师或者监理' }}</text>
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
          {{ isSubmitting ? (isEditMode ? '更新中...' : '提交中...') : (isEditMode ? '更新需求' : '提交需求') }}
        </button>
        <button class="uni-btn reset-btn" form-type="reset">重置表单</button>
      </view>
    </form>
  </view>
</template>

<script>
import { projectApi, projectService } from '@/api/project.js'

export default {
  data() {
    return {
      isEditMode: false, // 是否为编辑模式
      projectId: '',     // 项目ID（编辑时使用）
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
        console.log('编辑器准备完成，当前需求内容:', this.formData.requirement)
        
        // 如果是编辑模式且已有内容，设置编辑器内容
        if (this.isEditMode && this.formData.requirement) {
          console.log('设置编辑器内容:', this.formData.requirement)
          this.editorCtx.setContents({
            html: this.formData.requirement
          })
        }
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
      
      // 构建基础数据
      const submitData = {
        title: this.formData.projectName.trim(),
        description: this.getPlainText(this.formData.requirement) || '暂无详细描述',
        requiredRoles: roleMap[this.formData.serviceType] || 1,
        budget: parseFloat(this.formData.budget)
      }
      
      // 如果是编辑模式，需要包含项目ID - 只使用 projectId，不要包含 id
      if (this.isEditMode) {
        submitData.projectId = this.projectId
        // 注意：后端 ProjectDTO 不包含 id 字段，只包含 projectId 字段
        // 所以不要添加 id 字段
      }
      
      // 可选字段处理
      if (this.formData.area) {
        submitData.area = parseFloat(this.formData.area)
      } else {
        submitData.area = null // 明确设置为null，避免undefined
      }
      
      if (this.formData.address && this.formData.address.trim()) {
        submitData.address = this.formData.address.trim()
      } else {
        submitData.address = null
      }
      
      if (this.formData.deadline) {
        submitData.deadline = this.formData.deadline
      } else {
        submitData.deadline = null
      }
      
      console.log('构建的提交数据:', submitData)
      return submitData
    },
    
    // 清理数据，确保所有字段都有值
    cleanData(data) {
      const cleaned = { ...data }
      
      // 确保数字字段是数字类型
      if (cleaned.budget) cleaned.budget = Number(cleaned.budget)
      if (cleaned.area) cleaned.area = Number(cleaned.area)
      
      // 确保字符串字段不为undefined
      if (!cleaned.title) cleaned.title = ''
      if (!cleaned.description) cleaned.description = '暂无详细描述'
      if (!cleaned.address) cleaned.address = ''
      if (!cleaned.deadline) cleaned.deadline = ''
      
      // 确保必填字段有默认值
      if (!cleaned.requiredRoles) cleaned.requiredRoles = 1
      
      return cleaned
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
          title: this.isEditMode ? '更新中...' : '提交中...',
          mask: true
        })
        
        // 构建提交数据
        const submitData = this.buildSubmitData()
        console.log('最终提交数据:', JSON.stringify(submitData, null, 2))
        
        let result
        if (this.isEditMode) {
          // 编辑模式：直接调用更新接口
          console.log('调用更新接口，项目ID:', this.projectId)
          console.log('更新数据:', submitData)
          
          // 直接调用 projectApi.update 方法
          result = await projectApi.update(submitData)
        } else {
          // 创建模式：调用创建接口
          console.log('调用创建接口')
          result = await projectService.createProject(submitData)
        }
        
        console.log('接口返回结果:', result)
        
        // 检查操作结果
        if (result.code === 200 || result.success) {
          // 操作成功
          uni.hideLoading()
          this.isSubmitting = false
          
          const successMessage = this.isEditMode ? 
            '需求更新成功！' : 
            this.getSuccessMessage(submitData.requiredRoles)
          
          uni.showModal({
            title: '操作成功',
            content: successMessage,
            showCancel: false,
            confirmText: '确定',
            success: (res) => {
              if (res.confirm) {
                this.resetFormData()
                // 跳转到已发布需求页面
                uni.navigateTo({
                  url: '/pages/mine/posted/order-posted'
                })
              }
            }
          })
        } else {
          // 接口返回错误
          throw new Error(result.msg || result.message || (this.isEditMode ? '更新失败' : '创建失败'))
        }
        
      } catch (error) {
        console.error('操作失败:', error)
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
          title: '操作失败',
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
    },
    
    // 加载项目数据
    async loadProjectData(projectId) {
      try {
        uni.showLoading({
          title: '加载中...',
          mask: true
        })
        
        console.log('正在加载项目数据，项目ID:', projectId)
        
        // 调用项目列表接口，通过项目ID筛选
        const params = {
          projectId: projectId
        }
        
        console.log('请求参数:', params)
        const res = await projectApi.getList(params)
        console.log('项目列表接口完整返回:', res)
        
        // 详细检查数据结构
        if (res) {
          console.log('res.code:', res.code)
          console.log('res.data:', res.data)
          console.log('res.msg:', res.msg)
          
          if (res.data) {
            console.log('res.data 类型:', typeof res.data)
            console.log('res.data 的所有键:', Object.keys(res.data))
            
            // 检查第一个项目数据的详细结构
            if (Array.isArray(res.data) && res.data.length > 0) {
              const firstItem = res.data[0]
              console.log('第一个项目的完整结构:', firstItem)
              console.log('第一个项目的所有字段:', Object.keys(firstItem))
              
              // 特别检查我们需要的字段
              const neededFields = ['title', 'area', 'address', 'budget', 'deadline', 'requiredRoles', 'description']
              neededFields.forEach(field => {
                console.log(`字段 ${field}:`, firstItem[field], '类型:', typeof firstItem[field])
              })
            }
          }
        }
        
        if (res.code === 200) {
          let projectData = null
          
          // 处理不同的数据结构
          if (res.data && Array.isArray(res.data) && res.data.length > 0) {
            // 结构: { data: [项目数据] }
            projectData = res.data[0]
            console.log('使用数组第一个元素作为项目数据')
          } else if (res.data && res.data.rows && Array.isArray(res.data.rows) && res.data.rows.length > 0) {
            // 结构: { data: { rows: [项目数据] } }
            projectData = res.data.rows[0]
            console.log('使用 data.rows 第一个元素作为项目数据')
          } else if (Array.isArray(res.records) && res.records.length > 0) {
            // 结构: { records: [项目数据] }
            projectData = res.records[0]
            console.log('使用 records 第一个元素作为项目数据')
          } else if (Array.isArray(res.list) && res.list.length > 0) {
            // 结构: { list: [项目数据] }
            projectData = res.list[0]
            console.log('使用 list 第一个元素作为项目数据')
          } else if (res.data && typeof res.data === 'object') {
            // 结构: { data: 项目数据 }
            projectData = res.data
            console.log('直接使用 data 作为项目数据')
          }
          
          if (projectData) {
            console.log('找到项目数据:', projectData)
            this.fillFormData(projectData)
            uni.hideLoading()
          } else {
            throw new Error('未找到对应的项目数据')
          }
        } else {
          throw new Error(res.msg || '加载项目数据失败')
        }
        
      } catch (error) {
        console.error('加载项目数据失败:', error)
        uni.hideLoading()
        uni.showToast({
          title: '加载项目数据失败: ' + (error.message || '未知错误'),
          icon: 'none',
          duration: 3000
        })
        // 加载失败时返回上一页
        setTimeout(() => {
          uni.navigateBack()
        }, 2000)
      }
    },
    
    // 填充表单数据
    fillFormData(projectData) {
      console.log('填充表单数据，原始数据:', projectData)
      
      try {
        // 直接重新赋值整个 formData 对象，确保响应性
        this.formData = {
          projectName: projectData.title || '', // 项目名称对应 title 字段
          serviceType: '',
          area: projectData.area ? projectData.area.toString() : '',
          address: projectData.address || '',
          budget: projectData.budget ? projectData.budget.toString() : '',
          deadline: projectData.deadline || '',
          requirement: projectData.description || ''
        }
        
        console.log('填充后的表单数据:', this.formData)
        
        // 映射服务类型
        const roleMap = {
          1: 'designer',    // 设计师
          2: 'supervisor',  // 监理
          3: 'both'         // 设计师和监理
        }
        
        // 确保 requiredRoles 是数字
        const requiredRoles = Number(projectData.requiredRoles)
        this.formData.serviceType = roleMap[requiredRoles] || ''
        console.log('服务类型映射:', requiredRoles, '->', this.formData.serviceType)
        
        // 设置需求描述
        const description = projectData.description || ''
        console.log('需求描述内容:', description)
        
        if (description && description !== '暂无详细描述') {
          this.formData.requirement = description
          console.log('设置需求描述到表单')
          
          // 延迟设置编辑器内容，确保编辑器已初始化
          setTimeout(() => {
            if (this.editorCtx) {
              this.editorCtx.setContents({
                html: description
              })
              console.log('编辑器内容已设置')
            } else {
              console.warn('编辑器上下文未就绪，将在编辑器ready时设置')
            }
          }, 1000)
        } else {
          console.log('没有需求描述或描述为默认值')
        }
        
      } catch (error) {
        console.error('填充表单数据时出错:', error)
        throw new Error('数据处理失败: ' + error.message)
      }
    }
  },
  
  onLoad(options) {
    console.log('装修需求表单页面加载，参数:', options)
    
    // 接收项目ID，判断是编辑模式还是创建模式
    if (options.projectId) {
      this.isEditMode = true
      this.projectId = options.projectId
      console.log('编辑模式，项目ID:', this.projectId)
      // 加载项目数据
      this.loadProjectData(this.projectId)
    } else {
      this.isEditMode = false
      console.log('创建模式')
    }
    
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

/* 自定义 uni-easyinput 样式 - 使用全局样式替代 :deep() */
.uni-easyinput-content {
  border-radius: 10rpx !important;
  border: 2rpx solid #ddd !important;
}

.uni-easyinput-content-is-input-border {
  border: 2rpx solid #ddd !important;
}

.uni-easyinput-content-input {
  font-size: 32rpx !important;
}

.uni-easyinput-placeholder {
  color: #999 !important;
  font-size: 32rpx !important;
}

/* 焦点状态下的边框颜色 */
.uni-easyinput-content-is-input-border-focus {
  border-color: #4a6fa5 !important;
  box-shadow: 0 0 0 2rpx rgba(74, 111, 165, 0.2) !important;
}

/* 富文本编辑器样式 */
.ql-container {
  font-size: 32rpx !important;
  border: none !important;
}

.ql-editor {
  padding: 0 !important;
  min-height: 360rpx !important;
}

.ql-editor-ql-blank-before {
  color: #999 !important;
  font-style: normal !important;
  font-size: 32rpx !important;
}
</style>