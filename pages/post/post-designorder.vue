<template>
	<view class="design-order-container">
		<!-- 页面头部 -->
		<view class="page-header">
			<view class="header-left" @click="goBack">
				<text class="back-icon">‹</text>
				<text class="back-text">返回</text>
			</view>
			<view class="header-title">{{ pageTitle }}</view>
			<view class="header-right"></view>
		</view>

		<scroll-view class="scroll-content" scroll-y="true">
			<!-- 身份提示 -->
			<view class="role-notice" v-if="showRoleNotice">
				<text class="notice-icon">👷</text>
				<text class="notice-text">当前身份：{{ currentRoleName }}</text>
				<text class="notice-desc">{{ roleDescription }}</text>
			</view>

			<!-- 发布人信息 -->
			<view class="info-card">
				<view class="card-header">
					<text class="card-title">发布人信息</text>
				</view>
				<view class="card-content">
					<view class="user-info">
						<view class="user-avatar">
							<image 
								:src="publisherInfo.avatar || '/static/images/default-avatar.png'" 
								class="avatar-image" 
								mode="aspectFill"
							/>
						</view>
						<view class="user-details">
							<text class="user-name">{{ publisherInfo.name || '未设置姓名' }}</text>
							<text class="user-phone" v-if="publisherInfo.phone">电话：{{ publisherInfo.phone }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 项目基本信息 -->
			<view class="info-card">
				<view class="card-header">
					<text class="card-title">项目信息</text>
				</view>
				<view class="card-content">
					<view class="info-item">
						<text class="info-label">项目名称：</text>
						<text class="info-value">{{ projectDetail.title || '加载中...' }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">项目描述：</text>
						<text class="info-value">{{ projectDetail.description || '暂无描述' }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">项目地址：</text>
						<text class="info-value">{{ projectDetail.address || '未指定地区' }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">所需角色：</text>
						<text class="info-value">{{ getRoleText(projectDetail.requiredRoles) }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">项目预算：</text>
						<text class="info-value">{{ formatBudget(projectDetail.budget) }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">项目面积：</text>
						<text class="info-value">{{ projectDetail.area || '未指定' }}㎡</text>
					</view>
					<view class="info-item">
						<text class="info-label">截止时间：</text>
						<text class="info-value">{{ formatDate(projectDetail.deadline) }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">项目状态：</text>
						<text class="info-value">{{ getStatusText(projectDetail.status) }}</text>
					</view>
					<view class="info-item" v-if="projectDetail.remark">
						<text class="info-label">备注：</text>
						<text class="info-value">{{ projectDetail.remark }}</text>
					</view>
				</view>
			</view>

			<!-- 订单详情表单 -->
			<view class="info-card">
				<view class="card-header">
					<text class="card-title">订单详情</text>
				</view>
				<view class="card-content">
					<!-- 预计完成时间 -->
					<view class="form-item">
						<text class="form-label">预计完成时间</text>
						<picker 
							mode="date" 
							:value="orderForm.expectedEndTime" 
							@change="onDateChange"
							:start="minDate"
							:end="maxDate"
						>
							<view class="picker-input">
								<text class="picker-text" :class="{'placeholder': !orderForm.expectedEndTime}">
									{{ orderForm.expectedEndTime || '请选择预计完成时间' }}
								</text>
								<text class="picker-arrow">▼</text>
							</view>
						</picker>
					</view>

					<!-- 订单金额 -->
					<view class="form-item">
						<text class="form-label">订单金额</text>
						<view class="amount-input-wrapper">
							<text class="amount-symbol">¥</text>
							<input 
								class="form-input amount-input" 
								v-model="orderForm.totalAmount" 
								placeholder="0.00"
								placeholder-class="placeholder"
								type="digit"
								@input="onAmountInput"
							/>
						</view>
						<view class="form-tip" v-if="projectDetail.budget">
							项目预算参考：{{ formatBudget(projectDetail.budget) }}
						</view>
					</view>

					<!-- 备注信息 -->
					<view class="form-item">
						<text class="form-label">备注信息</text>
						<textarea 
							class="form-textarea" 
							v-model="orderForm.remark" 
							placeholder="请输入备注信息（可选）"
							placeholder-class="placeholder"
							maxlength="200"
						/>
						<view class="textarea-counter">{{ getRemarkLength }}/200</view>
					</view>
				</view>
			</view>

			<!-- 底部安全区域 -->
			<view class="safe-area"></view>
		</scroll-view>

		<!-- 底部提交按钮 -->
		<view class="bottom-actions">
			<button class="submit-btn" :class="{'disabled': !canSubmit}" @click="submitOrder">
				<text class="submit-text">{{ submitButtonText }}</text>
			</button>
		</view>

		<!-- 加载状态 -->
		<view class="loading-state" v-if="loading">
			<text class="loading-text">加载中...</text>
		</view>

		<!-- 错误状态 -->
		<view class="error-state" v-if="error">
			<text class="error-icon">😕</text>
			<text class="error-text">加载失败</text>
			<text class="error-desc">{{ errorMessage }}</text>
			<button class="retry-btn" @click="loadProjectDetail">重新加载</button>
		</view>
	</view>
</template>

<script>
import { projectService } from '@/api/project.js'
import { getUserProfile } from '@/api/users.js'
import { orderService } from '@/api/order.js'
import { getCurrentRole } from '@/api/users.js'

export default {
  data() {
    return {
      // 项目ID
      projectId: '',
      
      // 项目详情
      projectDetail: {},
      
      // 发布人信息
      publisherInfo: {
        name: '加载中...',
        avatar: '',
        phone: ''
      },
      
      // 当前用户信息
      currentUser: null,
      
      // 用户角色信息
      userRoleInfo: {
        roleType: null,
        roleTypeName: '',
        isMerchant: false,
        canCreateDesignOrder: false
      },
      
      // 订单表单 - 只包含必要的字段
      orderForm: {
        expectedEndTime: '',
        totalAmount: '',
        remark: ''
      },
      
      // 日期选择范围
      minDate: this.getCurrentDate(),
      maxDate: this.getMaxDate(),
      
      // 加载状态
      loading: false,
      error: false,
      errorMessage: '',
      
      // 状态映射 - 根据数据库字段更新
      statusMap: {
        '0': '草稿',
        '1': '发布中',
        '2': '设计师接单',
        '3': '监理接单',
        '4': '全部接单',
        '5': '已取消'
      },
      
      // 角色映射 - 根据数据库字段更新
      roleMap: {
        1: '设计师',
        2: '监理',
        3: '设计师和监理'
      },
      
      // 用户角色权限映射
      userRolePermissionMap: {
        'designer': { 
          name: '设计师', 
          canDesign: true, 
          description: '您可以接取设计相关项目' 
        },
        'supervisor': { 
          name: '监理', 
          canDesign: true,
          description: '您可以接取监理相关项目' 
        },
        'material_supplier': { 
          name: '材料商', 
          canDesign: false, 
          description: '材料商无法接取项目订单' 
        },
        'user': { 
          name: '普通用户', 
          canDesign: false, 
          description: '普通用户无法接取项目订单' 
        }
      }
    }
  },
  
  computed: {
    // 检查是否可以提交
    canSubmit() {
      return (
        this.orderForm.expectedEndTime &&
        this.orderForm.totalAmount &&
        this.currentUser &&
        this.userRoleInfo.canCreateDesignOrder
      )
    },
    
    // 安全获取备注长度
    getRemarkLength() {
      return this.orderForm.remark ? this.orderForm.remark.length : 0
    },
    
    // 当前角色名称
    currentRoleName() {
      return this.userRoleInfo.roleTypeName || this.userRoleInfo.roleType || '未知身份'
    },
    
    // 页面标题
    pageTitle() {
      if (this.userRoleInfo.roleType === 'supervisor') {
        return '监理订单'
      } else if (this.userRoleInfo.roleType === 'designer') {
        return '设计订单'
      }
      return '创建订单'
    },
    
    // 角色描述
    roleDescription() {
      const roleType = this.userRoleInfo.roleType
      if (roleType === 'supervisor') {
        return '您可以接取监理相关项目'
      } else if (roleType === 'designer') {
        return '您可以接取设计相关项目'
      }
      return this.userRolePermissionMap[roleType]?.description || '身份信息加载中...'
    },
    
    // 是否显示角色提示
    showRoleNotice() {
      return this.userRoleInfo.roleType !== null
    },
    
    // 提交按钮文本
    submitButtonText() {
      if (!this.userRoleInfo.canCreateDesignOrder) {
        return '无权限创建订单'
      }
      return '提交订单'
    }
  },
  
  onLoad(options) {
    if (options.projectId) {
      this.projectId = options.projectId
      this.loadCurrentUserAndRole().then(() => {
        if (this.userRoleInfo.canCreateDesignOrder) {
          this.loadProjectDetail()
        } else {
          this.showRolePermissionError()
        }
      })
    } else {
      this.error = true
      this.errorMessage = '项目ID不存在'
    }
  },
  
  methods: {
    // 加载当前用户信息和角色
    async loadCurrentUserAndRole() {
      try {
        // 1. 从本地存储获取基础用户信息
        const userInfo = uni.getStorageSync('userInfo')
        if (userInfo && userInfo.userId) {
          this.currentUser = userInfo
          console.log('当前用户信息:', this.currentUser)
        } else {
          this.handleNotLogin()
          return
        }
        
        // 2. 获取当前角色信息
        await this.loadCurrentRole()
        
      } catch (error) {
        console.error('加载用户信息失败:', error)
        this.handleNotLogin()
      }
    },
    
    // 加载当前角色
    async loadCurrentRole() {
      try {
        console.log('开始获取用户角色信息...')
        const roleResult = await getCurrentRole()
        console.log('角色信息接口返回:', roleResult)
        
        if (roleResult && roleResult.code === 200 && roleResult.data) {
          const roleData = roleResult.data
          
          console.log('用户角色数据:', roleData)
          
          // 设置角色信息 - 适配新的数据结构
          this.userRoleInfo.roleType = roleData.roleType // supervisor, designer, material_supplier, user
          this.userRoleInfo.roleTypeName = roleData.roleTypeName // 监理, 设计师, 材料商, 用户
          this.userRoleInfo.isMerchant = roleData.isMerchant || false
          
          // 根据角色类型判断权限
          const permissionInfo = this.userRolePermissionMap[roleData.roleType]
          if (permissionInfo) {
            this.userRoleInfo.canCreateDesignOrder = permissionInfo.canDesign
          } else {
            // 未知角色默认无权限
            this.userRoleInfo.canCreateDesignOrder = false
          }
          
          console.log('用户角色信息设置完成:', this.userRoleInfo)
          
          // 检查权限
          if (!this.userRoleInfo.canCreateDesignOrder) {
            this.showRolePermissionError()
          }
          
        } else {
          console.warn('获取角色信息失败:', roleResult?.message)
          this.setDefaultRole()
        }
      } catch (error) {
        console.error('调用角色接口失败:', error)
        this.setDefaultRole()
      }
    },
    
    // 设置默认角色（无权限）
    setDefaultRole() {
      this.userRoleInfo.roleType = 'user'
      this.userRoleInfo.roleTypeName = '普通用户'
      this.userRoleInfo.isMerchant = false
      this.userRoleInfo.canCreateDesignOrder = false
      this.showRolePermissionError()
    },
    
    // 显示角色权限错误
    showRolePermissionError() {
      uni.showModal({
        title: '权限不足',
        content: `您的身份【${this.userRoleInfo.roleTypeName}】无法创建设计订单`,
        showCancel: false,
        confirmText: '确定',
        success: (res) => {
          if (res.confirm) {
            uni.navigateBack()
          }
        }
      })
    },
    
    // 未登录处理
    handleNotLogin() {
      uni.showModal({
        title: '提示',
        content: '请先登录',
        success: (res) => {
          if (res.confirm) {
            uni.navigateTo({
              url: '/pages/login/login'
            })
          } else {
            uni.navigateBack()
          }
        }
      })
    },
    
    // 加载项目详情
    async loadProjectDetail() {
      // 先检查权限
      if (!this.userRoleInfo.canCreateDesignOrder) {
        this.showRolePermissionError()
        return
      }
      
      this.loading = true
      this.error = false
      
      try {
        console.log('开始加载项目详情，项目ID:', this.projectId)
        
        const result = await projectService.getProjectDetail(this.projectId)
        console.log('项目详情接口返回:', result)
        
        if (result && result.projectId) {
          this.projectDetail = result
          console.log('解析后的项目详情:', this.projectDetail)
          
          if (this.projectDetail.userId) {
            console.log('从项目获取发布人ID:', this.projectDetail.userId)
            await this.loadPublisherInfo(this.projectDetail.userId)
          } else {
            console.warn('项目数据中没有找到userId')
            this.publisherInfo.name = '匿名用户'
          }
          
        } else {
          throw new Error('项目不存在或已被删除')
        }
        
      } catch (error) {
        console.error('加载项目详情失败:', error)
        this.error = true
        this.errorMessage = error.message || '加载失败，请重试'
        uni.showToast({
          title: this.errorMessage,
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    // 加载发布人信息
    async loadPublisherInfo(userId) {
      try {
        if (userId) {
          console.log('开始加载发布人信息，用户ID:', userId)
          const result = await getUserProfile(userId)
          console.log('发布人信息接口返回:', result)
          
          if (result) {
            if (result.data) {
              this.publisherInfo = {
                name: result.data.name || result.data.nickname || '匿名用户',
                avatar: result.data.avatar || '',
                phone: result.data.phone || result.data.mobile || ''
              }
            } else if (result.name || result.nickname) {
              this.publisherInfo = {
                name: result.name || result.nickname || '匿名用户',
                avatar: result.avatar || '',
                phone: result.phone || result.mobile || ''
              }
            } else {
              console.warn('发布人信息接口返回数据格式不正确:', result)
              this.publisherInfo.name = '匿名用户'
            }
            console.log('设置发布人信息:', this.publisherInfo)
          } else {
            console.warn('发布人信息接口返回空数据')
            this.publisherInfo.name = '匿名用户'
          }
        } else {
          console.warn('未找到发布人ID')
          this.publisherInfo.name = '匿名用户'
        }
      } catch (error) {
        console.error('加载发布人信息失败:', error)
        this.publisherInfo.name = '匿名用户'
      }
    },
    
    // 日期选择变化
    onDateChange(e) {
      this.orderForm.expectedEndTime = e.detail.value
    },
    
    // 金额输入处理
    onAmountInput(e) {
      let value = e.detail.value
      value = value.replace(/[^\d.]/g, '')
      if (value.includes('.')) {
        const parts = value.split('.')
        if (parts[1].length > 2) {
          value = parts[0] + '.' + parts[1].substring(0, 2)
        }
      }
      this.orderForm.totalAmount = value
    },
    
    // 计算新的项目状态 - 根据当前状态和用户角色动态计算
    calculateNewProjectStatus() {
      const currentStatus = parseInt(this.projectDetail.status) // 确保是数字类型
      const requiredRoles = parseInt(this.projectDetail.requiredRoles) // 确保是数字类型
      const currentUserRole = this.userRoleInfo.roleType
      
      console.log('🔄 计算新状态 - 详细参数:', {
        currentStatus,
        requiredRoles,
        currentUserRole,
        projectDetail: this.projectDetail
      })
      
      // 规则1: 如果 required_roles 是 1 或者 2，status 应该变为 4
      if (requiredRoles === 1 || requiredRoles === 2) {
        console.log('✅ 规则1: 单一角色项目，状态变为4')
        return 4
      }
      
      // 规则2: 如果 required_roles 是 3
      if (requiredRoles === 3) {
        console.log('🔍 规则2: required_roles = 3，检查当前状态:', currentStatus)
        
        // 状态1（发布中）：设计师或监理都可以接单
        if (currentStatus === 1) {
          if (currentUserRole === 'designer') {
            console.log('✅ 规则2-状态1-设计师: 状态1 → 2')
            return 2 // 发布中 → 设计师接单
          } else if (currentUserRole === 'supervisor') {
            console.log('✅ 规则2-状态1-监理: 状态1 → 3')
            return 3 // 发布中 → 监理接单
          } else {
            console.log('❌ 规则2-状态1: 未知用户角色', currentUserRole)
            throw new Error('未知用户角色，无法接单')
          }
        }
        
        // 状态2（设计师接单）：只能监理接单
        if (currentStatus === 2) {
          if (currentUserRole === 'supervisor') {
            console.log('✅ 规则2-状态2-监理: 状态2 → 4')
            return 4 // 设计师接单 → 全部接单
          } else {
            console.log('❌ 规则2-状态2-设计师: 不允许重复接单，当前角色:', currentUserRole)
            throw new Error('该项目已有设计师接单，您无法再次接单')
          }
        }
        
        // 状态3（监理接单）：只能设计师接单
        if (currentStatus === 3) {
          if (currentUserRole === 'designer') {
            console.log('✅ 规则2-状态3-设计师: 状态3 → 4')
            return 4 // 监理接单 → 全部接单
          } else {
            console.log('❌ 规则2-状态3-监理: 不允许重复接单，当前角色:', currentUserRole)
            throw new Error('该项目已有监理接单，您无法再次接单')
          }
        }
        
        // 状态4（全部接单）：不允许再接单
        if (currentStatus === 4) {
          console.log('❌ 规则2-状态4: 项目已完成接单')
          throw new Error('该项目已完成接单，无法再次接单')
        }
        
        // 状态5（已取消）：不允许接单
        if (currentStatus === 5) {
          console.log('❌ 规则2-状态5: 项目已取消')
          throw new Error('该项目已取消，无法接单')
        }
        
        // 状态0（草稿）：不允许接单
        if (currentStatus === 0) {
          console.log('❌ 规则2-状态0: 项目为草稿状态')
          throw new Error('该项目为草稿状态，无法接单')
        }
      }
      
      // 如果走到这里，说明有未知情况
      console.error('❌ 未知情况，无法计算新状态:', {
        currentStatus,
        requiredRoles,
        currentUserRole
      })
      throw new Error('无法计算项目状态，请联系技术支持')
    },
    
    // 提交订单 - 增强权限检查
    async submitOrder() {
      // 权限检查
      if (!this.userRoleInfo.canCreateDesignOrder) {
        uni.showToast({
          title: '您的身份无法创建订单',
          icon: 'none'
        })
        return
      }
      
      if (!this.canSubmit) {
        uni.showToast({
          title: '请填写完整信息',
          icon: 'none'
        })
        return
      }

      // 数据验证
      const amount = parseFloat(this.orderForm.totalAmount)
      if (isNaN(amount) || amount <= 0) {
        uni.showToast({
          title: '请输入有效的订单金额',
          icon: 'none'
        })
        return
      }

      if (!this.orderForm.expectedEndTime) {
        uni.showToast({
          title: '请选择预计完成时间',
          icon: 'none'
        })
        return
      }

      const selectedDate = new Date(this.orderForm.expectedEndTime)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate <= today) {
        uni.showToast({
          title: '预计完成时间必须大于今天',
          icon: 'none'
        })
        return
      }

      try {
        this.loading = true
        
        // 先检查所有可能的数据源
        this.checkDataSources()
        
        const expectedEndTime = this.orderForm.expectedEndTime 
          ? `${this.orderForm.expectedEndTime}T23:59:59.000Z`
          : ''
        
        // 计算新的项目状态 - 这里可能会抛出错误
        console.log('📋 计算新状态前的项目详情:', this.projectDetail)
        const newStatus = this.calculateNewProjectStatus()
        console.log('📊 计算出的新状态:', {
          oldStatus: this.projectDetail.status,
          newStatus: newStatus,
          willUpdate: newStatus !== this.projectDetail.status
        })
        
        // 使用严格的数据构建方法
        const orderData = this.buildStrictOrderData(expectedEndTime, amount)
        
        console.log('=== 最终提交数据检查 ===')
        console.log('数据内容:', JSON.stringify(orderData, null, 2))
        
        // 最终验证 - 确保没有 contractorId
        if (orderData.contractorId !== undefined) {
          console.error('❌ 最终数据中仍然存在 contractorId，强制删除')
          delete orderData.contractorId
        }
        
        // 使用 JSON 序列化深度清理
        const finalData = JSON.parse(JSON.stringify(orderData))
        delete finalData.contractorId
        
        console.log('✅ 最终发送数据:', JSON.stringify(finalData, null, 2))
        
        // 第一步：创建订单
        const result = await orderService.createDesignOrder(finalData)
        console.log('创建订单成功:', result)
        
        // 第二步：更新项目状态
        if (newStatus !== this.projectDetail.status) {
          console.log('🔄 开始更新项目状态:', {
            projectId: this.projectId,
            oldStatus: this.projectDetail.status,
            newStatus: newStatus
          })
          
          await projectService.updateProjectStatus(this.projectId, newStatus)
          console.log('✅ 项目状态更新成功')
        } else {
          console.log('ℹ️ 项目状态无需更新，原因:', {
            currentStatus: this.projectDetail.status,
            calculatedStatus: newStatus,
            requiredRoles: this.projectDetail.requiredRoles,
            userRole: this.userRoleInfo.roleType
          })
        }
        
        uni.showToast({
          title: '订单创建成功',
          icon: 'success',
          duration: 2000
        })
        
        setTimeout(() => {
          uni.navigateBack({
            delta: 2
          })
        }, 1500)
        
      } catch (error) {
        console.error('创建订单失败:', error)
        uni.showToast({
          title: error.message || '创建订单失败，请重试',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    // 严格构建订单数据
    buildStrictOrderData(expectedEndTime, amount) {
      console.log('🔧 严格构建订单数据...')
      
      // 根据用户角色确定订单类型
      let orderType = 1 // 默认为设计订单
      if (this.userRoleInfo.roleType === 'supervisor') {
        orderType = 2 // 监理订单
      } else if (this.userRoleInfo.roleType === 'designer') {
        orderType = 1 // 设计订单
      }
      
      console.log('用户角色:', this.userRoleInfo.roleType, '订单类型:', orderType)
      
      // 使用 Object.create(null) 创建无原型的对象
      const orderData = Object.create(null)
      
      // 明确设置每个字段
      orderData.projectId = String(this.projectId)
      orderData.userId = String(this.projectDetail.userId)
      orderData.type = orderType // 动态设置订单类型
      orderData.expectedEndTime = expectedEndTime
      orderData.totalAmount = amount
      
      if (this.orderForm.remark && this.orderForm.remark.trim()) {
        orderData.remark = this.orderForm.remark.trim()
      }
      
      console.log('严格构建的数据字段:', Object.keys(orderData))
      return orderData
    },
    
    // 检查数据源
    checkDataSources() {
      console.log('=== 数据源检查开始 ===')
      
      // 检查 projectDetail
      if (this.projectDetail) {
        console.log('projectDetail 字段:', Object.keys(this.projectDetail))
        if (this.projectDetail.contractorId) {
          console.warn('⚠️ projectDetail 包含 contractorId:', this.projectDetail.contractorId)
        }
      }
      
      // 检查 currentUser
      if (this.currentUser) {
        console.log('currentUser 字段:', Object.keys(this.currentUser))
        if (this.currentUser.contractorId) {
          console.warn('⚠️ currentUser 包含 contractorId:', this.currentUser.contractorId)
        }
      }
      
      // 检查 orderForm
      console.log('orderForm 字段:', Object.keys(this.orderForm))
      
      console.log('=== 数据源检查结束 ===')
    },
    
    // 返回上一页
    goBack() {
      uni.navigateBack()
    },
    
    // 获取角色文本
    getRoleText(role) {
      return this.roleMap[role] || '未知角色'
    },
    
    // 获取状态文本
    getStatusText(status) {
      return this.statusMap[status] || '未知状态'
    },
    
    // 格式化日期
    formatDate(date) {
      if (!date) return '未设置'
      if (date.includes(' ')) {
        return date.split(' ')[0]
      }
      return date
    },
    
    // 格式化预算
    formatBudget(budget) {
      if (!budget) return '面议'
      if (typeof budget === 'number') {
        if (budget >= 10000) {
          return `¥${(budget / 10000).toFixed(1)}万`
        }
        return `¥${budget}元`
      }
      return `¥${budget}`
    },
    
    // 获取当前日期（YYYY-MM-DD格式）
    getCurrentDate() {
      const now = new Date()
      return now.toISOString().split('T')[0]
    },
    
    // 获取最大日期（当前日期+1年）
    getMaxDate() {
      const now = new Date()
      now.setFullYear(now.getFullYear() + 1)
      return now.toISOString().split('T')[0]
    }
  }
}
</script>
import { projectService } from '@/api/project.js'
import { getUserProfile } from '@/api/users.js'
import { orderService } from '@/api/order.js'
import { getCurrentRole } from '@/api/users.js'

export default {
  data() {
    return {
      // 项目ID
      projectId: '',
      
      // 项目详情
      projectDetail: {},
      
      // 发布人信息
      publisherInfo: {
        name: '加载中...',
        avatar: '',
        phone: ''
      },
      
      // 当前用户信息
      currentUser: null,
      
      // 用户角色信息
      userRoleInfo: {
        roleType: null,
        roleTypeName: '',
        isMerchant: false,
        canCreateDesignOrder: false
      },
      
      // 订单表单 - 只包含必要的字段
      orderForm: {
        expectedEndTime: '',
        totalAmount: '',
        remark: ''
      },
      
      // 日期选择范围
      minDate: this.getCurrentDate(),
      maxDate: this.getMaxDate(),
      
      // 加载状态
      loading: false,
      error: false,
      errorMessage: '',
      
      // 状态映射 - 根据数据库字段更新
      statusMap: {
        '0': '草稿',
        '1': '发布中',
        '2': '设计师接单',
        '3': '监理接单',
        '4': '全部接单',
        '5': '已取消'
      },
      
      // 角色映射 - 根据数据库字段更新
      roleMap: {
        1: '设计师',
        2: '监理',
        3: '设计师和监理'
      },
      
      // 用户角色权限映射
      userRolePermissionMap: {
        'designer': { 
          name: '设计师', 
          canDesign: true, 
          description: '您可以接取设计相关项目' 
        },
        'supervisor': { 
          name: '监理', 
          canDesign: true,
          description: '您可以接取监理相关项目' 
        },
        'material_supplier': { 
          name: '材料商', 
          canDesign: false, 
          description: '材料商无法接取项目订单' 
        },
        'user': { 
          name: '普通用户', 
          canDesign: false, 
          description: '普通用户无法接取项目订单' 
        }
      }
    }
  },
  
  computed: {
    // 检查是否可以提交
    canSubmit() {
      return (
        this.orderForm.expectedEndTime &&
        this.orderForm.totalAmount &&
        this.currentUser &&
        this.userRoleInfo.canCreateDesignOrder
      )
    },
    
    // 安全获取备注长度
    getRemarkLength() {
      return this.orderForm.remark ? this.orderForm.remark.length : 0
    },
    
    // 当前角色名称
    currentRoleName() {
      return this.userRoleInfo.roleTypeName || this.userRoleInfo.roleType || '未知身份'
    },
    
    // 页面标题
    pageTitle() {
      if (this.userRoleInfo.roleType === 'supervisor') {
        return '监理订单'
      } else if (this.userRoleInfo.roleType === 'designer') {
        return '设计订单'
      }
      return '创建订单'
    },
    
    // 角色描述
    roleDescription() {
      const roleType = this.userRoleInfo.roleType
      if (roleType === 'supervisor') {
        return '您可以接取监理相关项目'
      } else if (roleType === 'designer') {
        return '您可以接取设计相关项目'
      }
      return this.userRolePermissionMap[roleType]?.description || '身份信息加载中...'
    },
    
    // 是否显示角色提示
    showRoleNotice() {
      return this.userRoleInfo.roleType !== null
    },
    
    // 提交按钮文本
    submitButtonText() {
      if (!this.userRoleInfo.canCreateDesignOrder) {
        return '无权限创建订单'
      }
      return '提交订单'
    }
  },
  
  onLoad(options) {
    if (options.projectId) {
      this.projectId = options.projectId
      this.loadCurrentUserAndRole().then(() => {
        if (this.userRoleInfo.canCreateDesignOrder) {
          this.loadProjectDetail()
        } else {
          this.showRolePermissionError()
        }
      })
    } else {
      this.error = true
      this.errorMessage = '项目ID不存在'
    }
  },
  
  methods: {
    // 加载当前用户信息和角色
    async loadCurrentUserAndRole() {
      try {
        // 1. 从本地存储获取基础用户信息
        const userInfo = uni.getStorageSync('userInfo')
        if (userInfo && userInfo.userId) {
          this.currentUser = userInfo
          console.log('当前用户信息:', this.currentUser)
        } else {
          this.handleNotLogin()
          return
        }
        
        // 2. 获取当前角色信息
        await this.loadCurrentRole()
        
      } catch (error) {
        console.error('加载用户信息失败:', error)
        this.handleNotLogin()
      }
    },
    
    // 加载当前角色
    async loadCurrentRole() {
      try {
        console.log('开始获取用户角色信息...')
        const roleResult = await getCurrentRole()
        console.log('角色信息接口返回:', roleResult)
        
        if (roleResult && roleResult.code === 200 && roleResult.data) {
          const roleData = roleResult.data
          
          console.log('用户角色数据:', roleData)
          
          // 设置角色信息 - 适配新的数据结构
          this.userRoleInfo.roleType = roleData.roleType // supervisor, designer, material_supplier, user
          this.userRoleInfo.roleTypeName = roleData.roleTypeName // 监理, 设计师, 材料商, 用户
          this.userRoleInfo.isMerchant = roleData.isMerchant || false
          
          // 根据角色类型判断权限
          const permissionInfo = this.userRolePermissionMap[roleData.roleType]
          if (permissionInfo) {
            this.userRoleInfo.canCreateDesignOrder = permissionInfo.canDesign
          } else {
            // 未知角色默认无权限
            this.userRoleInfo.canCreateDesignOrder = false
          }
          
          console.log('用户角色信息设置完成:', this.userRoleInfo)
          
          // 检查权限
          if (!this.userRoleInfo.canCreateDesignOrder) {
            this.showRolePermissionError()
          }
          
        } else {
          console.warn('获取角色信息失败:', roleResult?.message)
          this.setDefaultRole()
        }
      } catch (error) {
        console.error('调用角色接口失败:', error)
        this.setDefaultRole()
      }
    },
    
    // 设置默认角色（无权限）
    setDefaultRole() {
      this.userRoleInfo.roleType = 'user'
      this.userRoleInfo.roleTypeName = '普通用户'
      this.userRoleInfo.isMerchant = false
      this.userRoleInfo.canCreateDesignOrder = false
      this.showRolePermissionError()
    },
    
    // 显示角色权限错误
    showRolePermissionError() {
      uni.showModal({
        title: '权限不足',
        content: `您的身份【${this.userRoleInfo.roleTypeName}】无法创建设计订单`,
        showCancel: false,
        confirmText: '确定',
        success: (res) => {
          if (res.confirm) {
            uni.navigateBack()
          }
        }
      })
    },
    
    // 未登录处理
    handleNotLogin() {
      uni.showModal({
        title: '提示',
        content: '请先登录',
        success: (res) => {
          if (res.confirm) {
            uni.navigateTo({
              url: '/pages/login/login'
            })
          } else {
            uni.navigateBack()
          }
        }
      })
    },
    
    // 加载项目详情
    async loadProjectDetail() {
      // 先检查权限
      if (!this.userRoleInfo.canCreateDesignOrder) {
        this.showRolePermissionError()
        return
      }
      
      this.loading = true
      this.error = false
      
      try {
        console.log('开始加载项目详情，项目ID:', this.projectId)
        
        const result = await projectService.getProjectDetail(this.projectId)
        console.log('项目详情接口返回:', result)
        
        if (result && result.projectId) {
          this.projectDetail = result
          console.log('解析后的项目详情:', this.projectDetail)
          
          if (this.projectDetail.userId) {
            console.log('从项目获取发布人ID:', this.projectDetail.userId)
            await this.loadPublisherInfo(this.projectDetail.userId)
          } else {
            console.warn('项目数据中没有找到userId')
            this.publisherInfo.name = '匿名用户'
          }
          
        } else {
          throw new Error('项目不存在或已被删除')
        }
        
      } catch (error) {
        console.error('加载项目详情失败:', error)
        this.error = true
        this.errorMessage = error.message || '加载失败，请重试'
        uni.showToast({
          title: this.errorMessage,
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    // 加载发布人信息
    async loadPublisherInfo(userId) {
      try {
        if (userId) {
          console.log('开始加载发布人信息，用户ID:', userId)
          const result = await getUserProfile(userId)
          console.log('发布人信息接口返回:', result)
          
          if (result) {
            if (result.data) {
              this.publisherInfo = {
                name: result.data.name || result.data.nickname || '匿名用户',
                avatar: result.data.avatar || '',
                phone: result.data.phone || result.data.mobile || ''
              }
            } else if (result.name || result.nickname) {
              this.publisherInfo = {
                name: result.name || result.nickname || '匿名用户',
                avatar: result.avatar || '',
                phone: result.phone || result.mobile || ''
              }
            } else {
              console.warn('发布人信息接口返回数据格式不正确:', result)
              this.publisherInfo.name = '匿名用户'
            }
            console.log('设置发布人信息:', this.publisherInfo)
          } else {
            console.warn('发布人信息接口返回空数据')
            this.publisherInfo.name = '匿名用户'
          }
        } else {
          console.warn('未找到发布人ID')
          this.publisherInfo.name = '匿名用户'
        }
      } catch (error) {
        console.error('加载发布人信息失败:', error)
        this.publisherInfo.name = '匿名用户'
      }
    },
    
    // 日期选择变化
    onDateChange(e) {
      this.orderForm.expectedEndTime = e.detail.value
    },
    
    // 金额输入处理
    onAmountInput(e) {
      let value = e.detail.value
      value = value.replace(/[^\d.]/g, '')
      if (value.includes('.')) {
        const parts = value.split('.')
        if (parts[1].length > 2) {
          value = parts[0] + '.' + parts[1].substring(0, 2)
        }
      }
      this.orderForm.totalAmount = value
    },
    
    // 计算新的项目状态 - 根据当前状态和用户角色动态计算
    calculateNewProjectStatus() {
      const currentStatus = this.projectDetail.status
      const requiredRoles = this.projectDetail.requiredRoles
      const currentUserRole = this.userRoleInfo.roleType
      
      console.log('🔄 计算新状态 - 详细参数:', {
        currentStatus,
        requiredRoles,
        currentUserRole,
        projectDetail: this.projectDetail
      })
      
      // 规则1: 如果 required_roles 是 1 或者 2，status 应该变为 4
      if (requiredRoles === 1 || requiredRoles === 2) {
        console.log('✅ 规则1: 单一角色项目，状态变为4')
        return 4
      }
      
      // 规则2: 如果 required_roles 是 3
      if (requiredRoles === 3) {
        console.log('🔍 规则2: required_roles = 3，检查当前状态:', currentStatus)
        
        // 状态1（发布中）：设计师或监理都可以接单
        if (currentStatus === 1) {
          if (currentUserRole === 'designer') {
            console.log('✅ 规则2-状态1-设计师: 状态1 → 2')
            return 2 // 发布中 → 设计师接单
          } else if (currentUserRole === 'supervisor') {
            console.log('✅ 规则2-状态1-监理: 状态1 → 3')
            return 3 // 发布中 → 监理接单
          } else {
            console.log('❌ 规则2-状态1: 未知用户角色', currentUserRole)
          }
        }
        
        // 状态2（设计师接单）：只能监理接单
        if (currentStatus === 2) {
          if (currentUserRole === 'supervisor') {
            console.log('✅ 规则2-状态2-监理: 状态2 → 4')
            return 4 // 设计师接单 → 全部接单
          } else {
            console.log('❌ 规则2-状态2-设计师: 不允许重复接单，当前角色:', currentUserRole)
            throw new Error('该项目已有设计师接单，您无法再次接单')
          }
        }
        
        // 状态3（监理接单）：只能设计师接单
        if (currentStatus === 3) {
          if (currentUserRole === 'designer') {
            console.log('✅ 规则2-状态3-设计师: 状态3 → 4')
            return 4 // 监理接单 → 全部接单
          } else {
            console.log('❌ 规则2-状态3-监理: 不允许重复接单，当前角色:', currentUserRole)
            throw new Error('该项目已有监理接单，您无法再次接单')
          }
        }
        
        // 状态4（全部接单）：不允许再接单
        if (currentStatus === 4) {
          console.log('❌ 规则2-状态4: 项目已完成接单')
          throw new Error('该项目已完成接单，无法再次接单')
        }
        
        // 状态5（已取消）：不允许接单
        if (currentStatus === 5) {
          console.log('❌ 规则2-状态5: 项目已取消')
          throw new Error('该项目已取消，无法接单')
        }
        
        // 状态0（草稿）：不允许接单
        if (currentStatus === 0) {
          console.log('❌ 规则2-状态0: 项目为草稿状态')
          throw new Error('该项目为草稿状态，无法接单')
        }
      }
      
      // 默认情况，返回当前状态
      console.log('⚠️ 默认情况: 保持当前状态', currentStatus)
      return currentStatus
    },
    
    // 提交订单 - 增强权限检查
    async submitOrder() {
      // 权限检查
      if (!this.userRoleInfo.canCreateDesignOrder) {
        uni.showToast({
          title: '您的身份无法创建订单',
          icon: 'none'
        })
        return
      }
      
      if (!this.canSubmit) {
        uni.showToast({
          title: '请填写完整信息',
          icon: 'none'
        })
        return
      }

      // 数据验证
      const amount = parseFloat(this.orderForm.totalAmount)
      if (isNaN(amount) || amount <= 0) {
        uni.showToast({
          title: '请输入有效的订单金额',
          icon: 'none'
        })
        return
      }

      if (!this.orderForm.expectedEndTime) {
        uni.showToast({
          title: '请选择预计完成时间',
          icon: 'none'
        })
        return
      }

      const selectedDate = new Date(this.orderForm.expectedEndTime)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate <= today) {
        uni.showToast({
          title: '预计完成时间必须大于今天',
          icon: 'none'
        })
        return
      }

      try {
        this.loading = true
        
        // 先检查所有可能的数据源
        this.checkDataSources()
        
        const expectedEndTime = this.orderForm.expectedEndTime 
          ? `${this.orderForm.expectedEndTime}T23:59:59.000Z`
          : ''
        
        // 计算新的项目状态 - 这里可能会抛出错误
        console.log('📋 计算新状态前的项目详情:', this.projectDetail)
        const newStatus = this.calculateNewProjectStatus()
        console.log('📊 计算出的新状态:', {
          oldStatus: this.projectDetail.status,
          newStatus: newStatus,
          willUpdate: newStatus !== this.projectDetail.status
        })
        
        // 使用严格的数据构建方法
        const orderData = this.buildStrictOrderData(expectedEndTime, amount)
        
        console.log('=== 最终提交数据检查 ===')
        console.log('数据内容:', JSON.stringify(orderData, null, 2))
        
        // 最终验证 - 确保没有 contractorId
        if (orderData.contractorId !== undefined) {
          console.error('❌ 最终数据中仍然存在 contractorId，强制删除')
          delete orderData.contractorId
        }
        
        // 使用 JSON 序列化深度清理
        const finalData = JSON.parse(JSON.stringify(orderData))
        delete finalData.contractorId
        
        console.log('✅ 最终发送数据:', JSON.stringify(finalData, null, 2))
        
        // 第一步：创建订单
        const result = await orderService.createDesignOrder(finalData)
        console.log('创建订单成功:', result)
        
        // 第二步：更新项目状态
        if (newStatus !== this.projectDetail.status) {
          console.log('🔄 开始更新项目状态:', {
            projectId: this.projectId,
            oldStatus: this.projectDetail.status,
            newStatus: newStatus
          })
          
          await projectService.updateProjectStatus(this.projectId, newStatus)
          console.log('✅ 项目状态更新成功')
        } else {
          console.log('ℹ️ 项目状态无需更新，原因:', {
            currentStatus: this.projectDetail.status,
            calculatedStatus: newStatus,
            requiredRoles: this.projectDetail.requiredRoles,
            userRole: this.userRoleInfo.roleType
          })
        }
        
        uni.showToast({
          title: '订单创建成功',
          icon: 'success',
          duration: 2000
        })
        
        setTimeout(() => {
          uni.navigateBack({
            delta: 2
          })
        }, 1500)
        
      } catch (error) {
        console.error('创建订单失败:', error)
        uni.showToast({
          title: error.message || '创建订单失败，请重试',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    // 严格构建订单数据
    buildStrictOrderData(expectedEndTime, amount) {
      console.log('🔧 严格构建订单数据...')
      
      // 根据用户角色确定订单类型
      let orderType = 1 // 默认为设计订单
      if (this.userRoleInfo.roleType === 'supervisor') {
        orderType = 2 // 监理订单
      } else if (this.userRoleInfo.roleType === 'designer') {
        orderType = 1 // 设计订单
      }
      
      console.log('用户角色:', this.userRoleInfo.roleType, '订单类型:', orderType)
      
      // 使用 Object.create(null) 创建无原型的对象
      const orderData = Object.create(null)
      
      // 明确设置每个字段
      orderData.projectId = String(this.projectId)
      orderData.userId = String(this.projectDetail.userId)
      orderData.type = orderType // 动态设置订单类型
      orderData.expectedEndTime = expectedEndTime
      orderData.totalAmount = amount
      
      if (this.orderForm.remark && this.orderForm.remark.trim()) {
        orderData.remark = this.orderForm.remark.trim()
      }
      
      console.log('严格构建的数据字段:', Object.keys(orderData))
      return orderData
    },
    
    // 检查数据源
    checkDataSources() {
      console.log('=== 数据源检查开始 ===')
      
      // 检查 projectDetail
      if (this.projectDetail) {
        console.log('projectDetail 字段:', Object.keys(this.projectDetail))
        if (this.projectDetail.contractorId) {
          console.warn('⚠️ projectDetail 包含 contractorId:', this.projectDetail.contractorId)
        }
      }
      
      // 检查 currentUser
      if (this.currentUser) {
        console.log('currentUser 字段:', Object.keys(this.currentUser))
        if (this.currentUser.contractorId) {
          console.warn('⚠️ currentUser 包含 contractorId:', this.currentUser.contractorId)
        }
      }
      
      // 检查 orderForm
      console.log('orderForm 字段:', Object.keys(this.orderForm))
      
      console.log('=== 数据源检查结束 ===')
    },
    
    // 返回上一页
    goBack() {
      uni.navigateBack()
    },
    
    // 获取角色文本
    getRoleText(role) {
      return this.roleMap[role] || '未知角色'
    },
    
    // 获取状态文本
    getStatusText(status) {
      return this.statusMap[status] || '未知状态'
    },
    
    // 格式化日期
    formatDate(date) {
      if (!date) return '未设置'
      if (date.includes(' ')) {
        return date.split(' ')[0]
      }
      return date
    },
    
    // 格式化预算
    formatBudget(budget) {
      if (!budget) return '面议'
      if (typeof budget === 'number') {
        if (budget >= 10000) {
          return `¥${(budget / 10000).toFixed(1)}万`
        }
        return `¥${budget}元`
      }
      return `¥${budget}`
    },
    
    // 获取当前日期（YYYY-MM-DD格式）
    getCurrentDate() {
      const now = new Date()
      return now.toISOString().split('T')[0]
    },
    
    // 获取最大日期（当前日期+1年）
    getMaxDate() {
      const now = new Date()
      now.setFullYear(now.getFullYear() + 1)
      return now.toISOString().split('T')[0]
    }
  }
}
</script>
<style scoped>
.design-order-container {
	min-height: 100vh;
	background-color: #f5f5f5;
}

/* 角色提示 */
.role-notice {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	margin: 20rpx 30rpx;
	padding: 24rpx;
	border-radius: 16rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.3);
}

.notice-icon {
	font-size: 48rpx;
	margin-bottom: 16rpx;
}

.notice-text {
	font-size: 28rpx;
	color: white;
	font-weight: 600;
	margin-bottom: 8rpx;
	text-align: center;
}

.notice-desc {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.9);
	text-align: center;
	line-height: 1.4;
}

.page-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 30rpx;
	background-color: #fff;
	border-bottom: 1rpx solid #f0f0f0;
	position: sticky;
	top: 0;
	z-index: 100;
}

.header-left {
	display: flex;
	align-items: center;
	flex: 1;
}

.back-icon {
	font-size: 48rpx;
	color: #333;
	margin-right: 10rpx;
}

.back-text {
	font-size: 32rpx;
	color: #333;
}

.header-title {
	flex: 2;
	text-align: center;
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
}

.header-right {
	flex: 1;
}

.scroll-content {
	height: calc(100vh - 200rpx);
	padding-bottom: 140rpx;
}

.info-card {
	background-color: #fff;
	margin: 20rpx 30rpx;
	border-radius: 24rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
	overflow: hidden;
}

.card-header {
	padding: 30rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.card-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.card-content {
	padding: 30rpx;
}

.user-info {
	display: flex;
	align-items: center;
}

.user-avatar {
	width: 120rpx;
	height: 120rpx;
	border-radius: 60rpx;
	overflow: hidden;
	margin-right: 24rpx;
	flex-shrink: 0;
}

.avatar-image {
	width: 100%;
	height: 100%;
}

.user-details {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.user-name {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 8rpx;
}

.user-phone {
	font-size: 24rpx;
	color: #666;
}

.info-item {
	display: flex;
	align-items: flex-start;
	margin-bottom: 24rpx;
	font-size: 28rpx;
}

.info-item:last-child {
	margin-bottom: 0;
}

.info-label {
	color: #666;
	min-width: 160rpx;
	flex-shrink: 0;
}

.info-value {
	color: #333;
	flex: 1;
	line-height: 1.5;
}

.form-item {
	margin-bottom: 40rpx;
}

.form-item:last-child {
	margin-bottom: 0;
}

.form-label {
	display: block;
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
	margin-bottom: 16rpx;
}

.form-input {
	width: 100%;
	height: 80rpx;
	padding: 0 24rpx;
	border: 2rpx solid #e0e0e0;
	border-radius: 12rpx;
	font-size: 28rpx;
	color: #333;
	background-color: #fff;
	box-sizing: border-box;
}

.form-input:focus {
	border-color: #ff6b00;
}

.placeholder {
	color: #999;
}

.amount-input-wrapper {
	position: relative;
	display: flex;
	align-items: center;
}

.amount-symbol {
	position: absolute;
	left: 24rpx;
	font-size: 28rpx;
	color: #333;
	z-index: 1;
}

.amount-input {
	padding-left: 60rpx;
}

.form-tip {
	font-size: 24rpx;
	color: #999;
	margin-top: 8rpx;
}

.picker-input {
	width: 100%;
	height: 80rpx;
	padding: 0 24rpx;
	border: 2rpx solid #e0e0e0;
	border-radius: 12rpx;
	font-size: 28rpx;
	color: #333;
	background-color: #fff;
	display: flex;
	align-items: center;
	justify-content: space-between;
	box-sizing: border-box;
}

.picker-text {
	flex: 1;
}

.picker-arrow {
	color: #999;
	font-size: 24rpx;
}

.form-textarea {
	width: 100%;
	height: 200rpx;
	padding: 24rpx;
	border: 2rpx solid #e0e0e0;
	border-radius: 12rpx;
	font-size: 28rpx;
	color: #333;
	background-color: #fff;
	box-sizing: border-box;
	line-height: 1.5;
}

.textarea-counter {
	text-align: right;
	font-size: 24rpx;
	color: #999;
	margin-top: 8rpx;
}

.bottom-actions {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background-color: #ffffff;
	padding: 20rpx 30rpx;
	border-top: 2rpx solid #e0e0e0;
	box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.1);
	z-index: 999;
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

.submit-btn {
	width: 100%;
	height: 88rpx;
	background-color: #ff6b00;
	color: white;
	border: none;
	border-radius: 12rpx;
	font-size: 32rpx;
	font-weight: 600;
}

.submit-btn.disabled {
	background-color: #ccc;
	color: #999;
}

.submit-text {
	font-size: 32rpx;
	font-weight: 600;
}

.safe-area {
	height: 40rpx;
}

.loading-state {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 120rpx 40rpx;
}

.loading-text {
	font-size: 28rpx;
	color: #999;
}

.error-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 160rpx 40rpx;
	text-align: center;
}

.error-icon {
	font-size: 128rpx;
	margin-bottom: 40rpx;
}

.error-text {
	font-size: 32rpx;
	color: #666;
	margin-bottom: 16rpx;
}

.error-desc {
	font-size: 28rpx;
	color: #999;
	margin-bottom: 40rpx;
}

.retry-btn {
	background-color: #ff6b00;
	color: white;
	border: none;
	border-radius: 16rpx;
	padding: 20rpx 40rpx;
	font-size: 28rpx;
}
</style>