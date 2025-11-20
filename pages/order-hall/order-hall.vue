<template>
	<view class="order-hall-container">
		<!-- 搜索筛选区域 -->
		<view class="filter-section">
			<!-- 地区选择 - 输入框 -->
			<view class="filter-item">
				<text class="filter-label">地区</text>
				<view class="input-container">
					<input 
						type="text" 
						:value="selectedLocation" 
						@input="onLocationInput"
						placeholder="请输入地区"
						class="location-input"
						placeholder-class="input-placeholder"
					/>
					<text class="clear-icon" v-if="selectedLocation" @click="clearLocation">×</text>
				</view>
			</view>
			
			<!-- 截止时间 -->
			<view class="filter-item">
				<text class="filter-label">截止时间</text>
				<picker 
					mode="date" 
					:value="selectedDate" 
					@change="onDateChange"
					class="date-picker"
				>
					<view class="filter-value">
						{{ selectedDate || '请选择时间' }}
						<text class="filter-arrow">▼</text>
					</view>
				</picker>
			</view>
			
			<!-- 预算金额 -->
			<view class="filter-item" @click="showBudgetPicker = true">
				<text class="filter-label">预算金额</text>
				<text class="filter-value">{{ selectedBudget || '请选择预算' }}</text>
				<text class="filter-arrow">▼</text>
			</view>
		</view>

		<!-- 搜索按钮 -->
		<view class="search-btn-container">
			<button class="search-btn" @click="searchOrders">搜索订单</button>
			<button class="reset-btn" @click="resetFilters">重置</button>
		</view>

		<!-- 订单列表 -->
		<view class="order-list">
			<view 
				class="order-item" 
				:class="{ 'disabled-item': isViewOnly }"
				v-for="project in filteredProjectList" 
				:key="project.projectId" 
				@click="handleItemClick(project)"
			>
				<view class="order-header">
					<text class="order-title">{{ project.title || '未命名项目' }}</text>
					<view class="order-status" :class="getStatusClass(project.status)">
						{{ getStatusText(project.status) }}
					</view>
				</view>
				
				<view class="order-info">
					<view class="info-item">
						<text class="info-label">地区：</text>
						<text class="info-value">{{ project.address || '未指定' }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">截止：</text>
						<text class="info-value">{{ formatDate(project.deadline) }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">预算：</text>
						<text class="info-value budget">{{ formatBudget(project.budget) }}</text>
					</view>
				</view>
				
				<view class="order-tags">
					<text class="tag" v-if="project.area">{{ project.area }}㎡</text>
					<text class="tag">{{ getRoleText(project.requiredRoles) }}</text>
					<!-- 显示角色匹配标签 -->
					<text class="tag match-tag" v-if="isRoleMatch(project.requiredRoles)">匹配身份</text>
					<!-- 查看权限提示 -->
					<text class="tag view-only-tag" v-if="isViewOnly">仅可查看</text>
				</view>
				
				<view class="order-footer">
					<view class="publisher">
						<!-- 添加用户头像 -->
						<view class="publisher-avatar" v-if="project.userInfo && project.userInfo.avatar">
							<image :src="project.userInfo.avatar" class="avatar-img" mode="aspectFill"></image>
						</view>
						<view class="publisher-info">
							<text class="publisher-name">
								{{ getPublisherName(project.userInfo) }}
							</text>
							<text class="publisher-phone" v-if="project.userInfo && project.userInfo.phone">
								{{ formatPhone(project.userInfo.phone) }}
							</text>
							<text class="publish-time">{{ formatTime(project.createTime) }}</text>
						</view>
					</view>
					<view class="detail-btn-container">
						<button 
							class="detail-btn" 
							:class="{ 'disabled-btn': isViewOnly }"
							@click.stop="handleDetailClick(project)"
						>
							{{ isViewOnly ? '仅查看' : '详情' }}
						</button>
					</view>
				</view>
			</view>
		</view>

		<!-- 预算选择器 -->
		<uni-popup ref="budgetPopup" type="bottom" background-color="#fff">
			<view class="picker-popup">
				<view class="picker-header">
					<text class="picker-title">选择预算范围</text>
					<text class="picker-close" @click="showBudgetPicker = false">完成</text>
				</view>
				<view class="budget-options">
					<view class="budget-option" 
					      v-for="budget in budgetOptions" 
					      :key="budget.value"
					      :class="{ active: selectedBudget === budget.label }"
					      @click="selectBudget(budget)">
						<text class="budget-label">{{ budget.label }}</text>
						<text class="budget-range">{{ budget.range }}</text>
					</view>
				</view>
			</view>
		</uni-popup>

		<!-- 加载状态 -->
		<view class="loading-state" v-if="loading">
			<text class="loading-text">加载中...</text>
		</view>

		<!-- 空状态 -->
		<view class="empty-state" v-if="!loading && filteredProjectList.length === 0">
			<text class="empty-icon">📋</text>
			<text class="empty-text" v-if="currentRole === 'material_supplier'">材料商无法接单</text>
			<text class="empty-text" v-else-if="currentRole && currentRole !== 'user'">暂无匹配项目</text>
			<text class="empty-text" v-else>暂无项目</text>
			<text class="empty-desc" v-if="currentRole === 'material_supplier'">材料商角色无法接取项目订单</text>
			<text class="empty-desc" v-else-if="currentRole && currentRole !== 'user'">当前没有适合您身份的项目</text>
			<text class="empty-desc" v-else>还没有可接单的项目</text>
		</view>

		<!-- 加载更多 -->
		<view class="load-more" v-if="hasMore && !loading && filteredProjectList.length > 0">
			<text class="load-more-text" @click="loadMore">加载更多</text>
		</view>
	</view>
</template>

<script>
import { projectService } from '@/api/project.js'
import { getUserProfile } from '@/api/users.js'

// 角色与项目类型的映射
const ROLE_PROJECT_MAPPING = {
  'designer': [1, 3],     // 设计师可以接：设计师项目(1) 和 设计师+监理项目(3)
  'supervisor': [2, 3],   // 监理可以接：监理项目(2) 和 设计师+监理项目(3)
  'material_supplier': [], // 材料商不能接任何项目
  'user': [1, 2, 3]       // 普通用户可以查看所有项目
}

export default {
  data() {
    return {
      // 当前用户角色
      currentRole: null,
      isUserRole: false,
      isViewOnly: false, // 是否为仅查看模式
      
      // 筛选条件
      selectedLocation: '',
      selectedDate: '',
      selectedBudget: '',
      budgetMin: '',
      budgetMax: '',
      
      // 选择器显示状态
      showBudgetPicker: false,
      
      // 分页参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      total: 0,
      hasMore: false,
      loading: false,
      
      // 项目列表
      projectList: [],
      
      // 用户信息缓存
      userInfoCache: new Map(),
      
      // 预算选项
      budgetOptions: [
        { label: '1万以下', value: '0-1', range: '1万元以下', min: 0, max: 10000 },
        { label: '1-3万', value: '1-3', range: '1万-3万元', min: 10000, max: 30000 },
        { label: '3-5万', value: '3-5', range: '3万-5万元', min: 30000, max: 50000 },
        { label: '5-10万', value: '5-10', range: '5万-10万元', min: 50000, max: 100000 },
        { label: '10-20万', value: '10-20', range: '10万-20万元', min: 100000, max: 200000 },
        { label: '20万以上', value: '20-100', range: '20万元以上', min: 200000, max: null }
      ]
    }
  },
  computed: {
    // 根据角色和状态过滤项目列表
    filteredProjectList() {
      // 首先过滤状态：只显示状态为1（发布中）或2（部分接单）的项目
      const availableProjects = this.projectList.filter(project => {
        const status = parseInt(project.status)
        return status === 1 || status === 2
      })
      
      // 如果是材料商，直接返回空数组（不能接项目）
      if (this.currentRole === 'material_supplier') {
        return []
      }
      
      if (this.isViewOnly) {
        // 仅查看模式（用户和材料商）：显示所有可用项目
        return availableProjects
      }
      
      // 设计师和监理：根据角色映射过滤项目
      const allowedTypes = ROLE_PROJECT_MAPPING[this.currentRole] || []
      return availableProjects.filter(project => {
        const requiredRole = parseInt(project.requiredRoles)
        return requiredRole && allowedTypes.includes(requiredRole)
      })
    }
  },
  async onLoad() {
    console.log('🚀 页面加载，开始获取用户角色和项目列表...')
    
    await this.getUserRole()
    this.loadProjectList()
  },
  onPullDownRefresh() {
    this.queryParams.pageNum = 1
    this.userInfoCache.clear()
    this.loadProjectList().finally(() => {
      uni.stopPullDownRefresh()
    })
  },
  onReachBottom() {
    if (this.hasMore && !this.loading) {
      this.loadMore()
    }
  },
  watch: {
    showBudgetPicker(val) {
      if (val) {
        this.$refs.budgetPopup.open();
      } else {
        this.$refs.budgetPopup.close();
      }
    }
  },
  methods: {
    // 获取用户角色并设置权限
    async getUserRole() {
      try {
        // 从全局获取用户信息
        const app = getApp()
        let userInfo = null
        
        if (app && app.globalData && app.globalData.userInfo) {
          userInfo = app.globalData.userInfo
        } else {
          userInfo = uni.getStorageSync('userInfo')
        }
        
        if (userInfo) {
          // 优先使用 currentRoleType
          if (userInfo.currentRoleType) {
            this.currentRole = userInfo.currentRoleType
          }
          // 其次检查 roles 数组
          else if (userInfo.roles && Array.isArray(userInfo.roles) && userInfo.roles.length > 0) {
            this.currentRole = this.getHighestPriorityRole(userInfo.roles)
          }
        }
        
        // 如果没有找到角色，使用普通用户
        if (!this.currentRole) {
          this.currentRole = 'user'
        }
        
        this.isUserRole = this.currentRole === 'user'
        
        // 设置查看权限：用户和材料商只能查看，不能点击详情
        this.isViewOnly = this.currentRole === 'user' || this.currentRole === 'material_supplier'
        
        console.log('🎭 当前用户角色:', this.currentRole)
        console.log('👀 查看权限模式:', this.isViewOnly)
        
      } catch (error) {
        console.error('获取用户角色失败:', error)
        this.currentRole = 'user'
        this.isUserRole = true
        this.isViewOnly = true
      }
    },
    
    // 处理项目项点击
    handleItemClick(project) {
      if (this.isViewOnly) {
        // 仅查看模式：显示提示信息
        this.showViewOnlyTip()
      } else {
        // 可操作模式：跳转到详情页
        this.viewProjectDetail(project.projectId)
      }
    },
    
    // 处理详情按钮点击
    handleDetailClick(project) {
      if (this.isViewOnly) {
        // 仅查看模式：显示提示信息
        this.showViewOnlyTip()
      } else {
        // 可操作模式：跳转到详情页
        this.viewProjectDetail(project.projectId)
      }
    },
    
    // 显示仅查看提示
    showViewOnlyTip() {
      uni.showToast({
        title: '当前身份仅可查看项目信息',
        icon: 'none',
        duration: 2000
      })
    },
    
    // 从角色数组中获取最高优先级的角色
    getHighestPriorityRole(roles) {
      const rolePriority = {
        'designer': 1,
        'supervisor': 2,
        'material_supplier': 3,
        'user': 4
      }
      
      let highestPriorityRole = 'user'
      let highestPriority = rolePriority.user
      
      roles.forEach(role => {
        const roleKey = this.normalizeRoleKey(role)
        if (rolePriority[roleKey] && rolePriority[roleKey] < highestPriority) {
          highestPriority = rolePriority[roleKey]
          highestPriorityRole = roleKey
        }
      })
      
      return highestPriorityRole
    },
    
    // 标准化角色键
    normalizeRoleKey(role) {
      if (typeof role === 'string') {
        const roleLower = role.toLowerCase()
        if (roleLower.includes('design')) return 'designer'
        if (roleLower.includes('supervisor') || roleLower.includes('监理')) return 'supervisor'
        if (roleLower.includes('material') || roleLower.includes('supplier') || roleLower.includes('材料')) return 'material_supplier'
        if (roleLower.includes('user')) return 'user'
      }
      return 'user'
    },
    
    // 检查角色是否匹配项目需求
    isRoleMatch(requiredRole) {
      if (!this.currentRole || this.isViewOnly || this.currentRole === 'material_supplier') return false
      
      const allowedTypes = ROLE_PROJECT_MAPPING[this.currentRole] || []
      const requiredRoleNum = parseInt(requiredRole)
      return requiredRoleNum && allowedTypes.includes(requiredRoleNum)
    },

    // 地区输入
    onLocationInput(e) {
      this.selectedLocation = e.detail.value;
    },
    
    // 清空地区输入
    clearLocation() {
      this.selectedLocation = '';
    },
    
    // 日期选择变化
    onDateChange(e) {
      this.selectedDate = e.detail.value;
    },
    
    // 加载项目列表
    async loadProjectList() {
      this.loading = true
      try {
        // 构建查询参数
        const params = {
          pageNum: this.queryParams.pageNum,
          pageSize: this.queryParams.pageSize
        }
        
        // 添加筛选条件
        if (this.selectedLocation && this.selectedLocation.trim()) {
          params.address = this.selectedLocation.trim()
        }
        if (this.selectedDate) {
          params.deadline = this.selectedDate
        }
        if (this.budgetMin !== '' && this.budgetMin != null) {
          params.budgetMin = parseInt(this.budgetMin)
        }
        if (this.budgetMax !== '' && this.budgetMax != null) {
          params.budgetMax = parseInt(this.budgetMax)
        }
        
        console.log('📡 请求项目列表参数:', params)
        const result = await projectService.getProjectList(params)
        console.log('📡 项目列表响应:', result)
        
        // 处理响应数据
        let dataList = this.extractDataList(result)
        console.log('📊 提取的项目列表:', dataList)
        
        // 在前端过滤状态为1和2的项目
        dataList = dataList.filter(project => {
          const status = parseInt(project.status)
          return status === 1 || status === 2
        })
        
        console.log('✅ 过滤后的项目列表:', dataList)
        
        // 更新项目列表
        if (this.queryParams.pageNum === 1) {
          this.projectList = dataList
        } else {
          this.projectList = [...this.projectList, ...dataList]
        }
        
        // 为每个项目加载用户信息
        await this.loadUserInfoForProjects(dataList)
        
        // 分页处理
        this.hasMore = dataList.length >= this.queryParams.pageSize
        
      } catch (error) {
        console.error('❌ 加载项目列表失败:', error)
        uni.showToast({
          title: error.message || '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    // 提取数据列表
    extractDataList(result) {
      if (result && Array.isArray(result)) {
        return result
      } else if (result && result.records) {
        return result.records
      } else if (result && result.list) {
        return result.list
      } else if (result && result.data) {
        return result.data
      } else {
        return result || []
      }
    },
    
    // 为项目列表加载用户信息
    async loadUserInfoForProjects(projects) {
      if (!projects || !projects.length) return
      
      console.log('👥 开始加载用户信息，项目数量:', projects.length)
      
      const promises = projects.map(async (project) => {
        console.log(`🔄 处理项目 ${project.projectId}, userId: ${project.userId}`)
        
        if (!project.userId) {
          console.log(`❌ 项目 ${project.projectId} 没有userId，使用默认信息`)
          this.$set(project, 'userInfo', this.getDefaultUserInfo())
          return
        }
        
        try {
          let userInfo = this.userInfoCache.get(project.userId)
          
          if (!userInfo) {
            console.log(`🔍 正在获取用户 ${project.userId} 的信息...`)
            userInfo = await getUserProfile(project.userId)
            console.log(`✅ 用户 ${project.userId} 的信息获取成功:`, userInfo)
            
            // 缓存用户信息
            this.userInfoCache.set(project.userId, userInfo)
          }
          
          // 格式化并设置用户信息
          const formattedUserInfo = this.formatUserInfo(userInfo)
          console.log(`🔄 格式化后的用户信息:`, formattedUserInfo)
          
          this.$set(project, 'userInfo', formattedUserInfo)
          console.log(`✅ 项目 ${project.projectId} 的用户信息设置完成`)
          
        } catch (error) {
          console.error(`❌ 获取用户 ${project.userId} 信息失败:`, error)
          // 出错时设置默认信息
          this.$set(project, 'userInfo', this.getDefaultUserInfo())
        }
      })
      
      await Promise.all(promises)
      console.log('🎉 所有用户信息加载完成')
    },
    
    // 格式化用户信息
    formatUserInfo(userInfo) {
      if (!userInfo) {
        return this.getDefaultUserInfo()
      }
      
      // 处理接口返回的数据结构
      let userData = userInfo
      
      // 如果接口返回的是 {code: 200, data: {...}} 结构
      if (userInfo.code === 200 && userInfo.data) {
        userData = userInfo.data
      }
      
      // 检查name字段是否存在
      const name = userData.name
      
      const formattedInfo = {
        // 姓名字段
        name: name,
        // 其他字段
        phone: userData.phone,
        avatar: userData.avatar,
        userId: userData.userId,
        currentRoleType: userData.currentRoleType
      }
      
      return formattedInfo
    },
    
    // 获取默认用户信息
    getDefaultUserInfo() {
      return {
        name: '匿名用户',
        phone: '',
        avatar: '',
        userId: ''
      }
    },
    
    // 获取发布者姓名
    getPublisherName(userInfo) {
      if (!userInfo) {
        return '加载中...'
      }
      
      const name = userInfo.name
      
      if (name) {
        return name
      } else {
        return '匿名用户'
      }
    },
    
    // 加载更多
    loadMore() {
      if (this.hasMore && !this.loading) {
        this.queryParams.pageNum++
        this.loadProjectList()
      }
    },
    
    // 选择预算
    selectBudget(budget) {
      this.selectedBudget = budget.label;
      this.budgetMin = budget.min;
      this.budgetMax = budget.max;
      this.showBudgetPicker = false;
    },
    
    // 搜索项目
    searchOrders() {
      if (!this.validateFilters()) return
      this.queryParams.pageNum = 1
      this.userInfoCache.clear()
      this.loadProjectList()
    },
    
    // 验证筛选条件
    validateFilters() {
      if (this.budgetMin && this.budgetMax && this.budgetMin > this.budgetMax) {
        uni.showToast({ title: '最小预算不能大于最大预算', icon: 'none' })
        return false
      }
      
      if (this.selectedDate) {
        const selected = new Date(this.selectedDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (selected < today) {
          uni.showToast({ title: '截止时间不能早于今天', icon: 'none' })
          return false
        }
      }
      
      return true
    },
    
    // 重置筛选条件
    resetFilters() {
      this.selectedLocation = '';
      this.selectedDate = '';
      this.selectedBudget = '';
      this.budgetMin = '';
      this.budgetMax = '';
      this.queryParams.pageNum = 1
      this.userInfoCache.clear()
      this.loadProjectList();
    },
    
    // 查看项目详情
    viewProjectDetail(projectId) {
      uni.navigateTo({
        url: `/pages/order-hall/order-detail?id=${projectId}`
      });
    },
    
    // 获取状态样式类
    getStatusClass(status) {
      const statusNum = parseInt(status)
      const statusMap = {
        0: 'draft',
        1: 'bidding',
        2: 'partial',
        3: 'completed',
        4: 'cancelled'
      }
      return statusMap[statusNum] || 'draft'
    },
    
    // 获取状态文本
    getStatusText(status) {
      const statusNum = parseInt(status)
      const statusTextMap = {
        0: '草稿',
        1: '发布中',
        2: '部分接单',
        3: '全部接单',
        4: '已取消'
      }
      return statusTextMap[statusNum] || '未知状态'
    },
    
    // 获取角色文本
    getRoleText(role) {
      const roleNum = parseInt(role)
      const roleMap = {
        1: '设计师',
        2: '监理',
        3: '设计+监理'
      }
      return roleMap[roleNum] || '未知角色'
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
    
    // 格式化手机号
    formatPhone(phone) {
      if (!phone) return ''
      return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    },
    
    // 格式化时间
    formatTime(time) {
      if (!time) return ''
      try {
        const now = new Date()
        const createTime = new Date(time)
        if (isNaN(createTime.getTime())) return '时间未知'
        
        const diff = now - createTime
        const minutes = Math.floor(diff / (1000 * 60))
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        
        if (minutes < 1) return '刚刚'
        if (minutes < 60) return `${minutes}分钟前`
        if (hours < 24) return `${hours}小时前`
        if (days < 7) return `${days}天前`
        
        return `${createTime.getMonth() + 1}-${createTime.getDate()}`
      } catch (error) {
        return '时间未知'
      }
    }
  }
}
</script>

<style>
	.order-hall-container {
		min-height: 100vh;
		background-color: #f5f5f5;
		padding: 15px;
	}
	
	/* 筛选区域 */
	.filter-section {
		display: flex;
		background-color: #fff;
		border-radius: 12px;
		padding: 15px;
		margin-bottom: 15px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
	
	.filter-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0 10px;
	}
	
	.filter-label {
		font-size: 12px;
		color: #999;
		margin-bottom: 5px;
	}
	
	.filter-value {
		font-size: 14px;
		color: #333;
		font-weight: 500;
		margin-bottom: 3px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.filter-arrow {
		font-size: 10px;
		color: #ccc;
		margin-left: 4px;
	}
	
	/* 输入框容器 */
	.input-container {
		position: relative;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.location-input {
		width: 100%;
		font-size: 14px;
		color: #333;
		font-weight: 500;
		text-align: center;
		border: none;
		outline: none;
		background: transparent;
	}
	
	.input-placeholder {
		color: #ccc;
		font-weight: normal;
	}
	
	.clear-icon {
		position: absolute;
		right: 0;
		font-size: 18px;
		color: #ccc;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background-color: #f5f5f5;
	}
	
	.clear-icon:active {
		background-color: #e0e0e0;
	}
	
	/* 日期选择器样式 */
	.date-picker {
		width: 100%;
		text-align: center;
	}
	
	/* 搜索按钮区域 */
	.search-btn-container {
		display: flex;
		gap: 10px;
		margin-bottom: 15px;
	}
	
	.search-btn {
		flex: 3;
		background-color: #ff6b00;
		color: white;
		border: none;
		border-radius: 8px;
		padding: 12px;
		font-size: 16px;
		font-weight: 500;
	}
	
	.reset-btn {
		flex: 1;
		background-color: #f8f9fa;
		color: #666;
		border: 1px solid #e9ecef;
		border-radius: 8px;
		padding: 12px;
		font-size: 14px;
	}
	
	/* 订单列表 */
	.order-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	
	.order-item {
		background-color: #fff;
		border-radius: 12px;
		padding: 15px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		transition: transform 0.2s, box-shadow 0.2s;
	}
	
	.order-item:active {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
	}
	
	/* 禁用状态的项目项 */
	.order-item.disabled-item {
		opacity: 0.7;
		background-color: #f9f9f9;
	}
	
	.order-item.disabled-item:active {
		transform: none;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}
	
	.order-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 12px;
	}
	
	.order-title {
		font-size: 16px;
		font-weight: bold;
		color: #333;
		flex: 1;
		margin-right: 10px;
		line-height: 1.4;
	}
	
	.order-status {
		padding: 4px 8px;
		border-radius: 12px;
		font-size: 12px;
		font-weight: 500;
		white-space: nowrap;
	}
	
	.order-status.draft {
		background-color: #f5f5f5;
		color: #999;
	}
	
	.order-status.bidding {
		background-color: #e8f5e8;
		color: #52c41a;
	}
	
	.order-status.partial {
		background-color: #fff7e6;
		color: #fa8c16;
	}
	
	.order-status.completed {
		background-color: #e6f7ff;
		color: #1890ff;
	}
	
	.order-status.cancelled {
		background-color: #fff2f0;
		color: #ff4d4f;
	}
	
	.order-info {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-bottom: 12px;
	}
	
	.info-item {
		display: flex;
		align-items: center;
		font-size: 14px;
	}
	
	.info-label {
		color: #666;
		min-width: 50px;
	}
	
	.info-value {
		color: #333;
		flex: 1;
	}
	
	.info-value.budget {
		color: #ff6b00;
		font-weight: bold;
	}
	
	.order-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-bottom: 12px;
	}
	
	.tag {
		padding: 2px 8px;
		background-color: #f0f7ff;
		color: #1890ff;
		border-radius: 10px;
		font-size: 11px;
	}
	
	.tag.match-tag {
		background-color: #e8f5e8;
		color: #52c41a;
		font-weight: bold;
	}
	
	.tag.view-only-tag {
		background-color: #f5f5f5;
		color: #999;
		font-weight: bold;
	}
	
	.order-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 10px;
		border-top: 1px solid #f0f0f0;
	}
	
	.publisher {
		display: flex;
		align-items: center;
		flex: 1;
	}
	
	.publisher-avatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		overflow: hidden;
		margin-right: 10px;
		background-color: #f0f0f0;
	}
	
	.avatar-img {
		width: 100%;
		height: 100%;
	}
	
	.publisher-info {
		display: flex;
		flex-direction: column;
		flex: 1;
	}
	
	.publisher-name {
		font-size: 13px;
		color: #333;
		font-weight: 500;
		margin-bottom: 2px;
	}
	
	.publisher-phone {
		font-size: 11px;
		color: #666;
		margin-bottom: 2px;
	}
	
	.publish-time {
		font-size: 11px;
		color: #999;
	}
	
	/* 详情按钮样式 */
	.detail-btn-container {
		display: flex;
		align-items: center;
	}
	
	.detail-btn {
		background-color: #ff6b00;
		color: white;
		border: none;
		border-radius: 6px;
		padding: 6px 12px;
		font-size: 12px;
		font-weight: 500;
		line-height: 1;
	}
	
	.detail-btn.disabled-btn {
		background-color: #ccc;
		color: #999;
	}
	
	/* 选择器弹窗 */
	.picker-popup {
		background-color: #fff;
		border-radius: 16px 16px 0 0;
		padding-bottom: env(safe-area-inset-bottom);
	}
	
	.picker-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 15px 20px;
		border-bottom: 1px solid #f0f0f0;
	}
	
	.picker-title {
		font-size: 16px;
		font-weight: 500;
		color: #333;
	}
	
	.picker-close {
		font-size: 14px;
		color: #ff6b00;
		font-weight: 500;
	}
	
	/* 预算选项 */
	.budget-options {
		padding: 20px;
	}
	
	.budget-option {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 15px 0;
		border-bottom: 1px solid #f0f0f0;
		cursor: pointer;
	}
	
	.budget-option:last-child {
		border-bottom: none;
	}
	
	.budget-option.active {
		background-color: #f0f7ff;
	}
	
	.budget-label {
		font-size: 16px;
		color: #333;
		font-weight: 500;
	}
	
	.budget-range {
		font-size: 14px;
		color: #999;
	}
	
	/* 加载状态 */
	.loading-state {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 20px;
	}
	
	.loading-text {
		font-size: 14px;
		color: #999;
	}
	
	/* 空状态 */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
		text-align: center;
	}
	
	.empty-icon {
		font-size: 64px;
		margin-bottom: 20px;
	}
	
	.empty-text {
		font-size: 16px;
		color: #666;
		margin-bottom: 8px;
	}
	
	.empty-desc {
		font-size: 14px;
		color: #999;
	}
	
	/* 加载更多 */
	.load-more {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 20px;
	}
	
	.load-more-text {
		font-size: 14px;
		color: #ff6b00;
		padding: 8px 16px;
		border: 1px solid #ff6b00;
		border-radius: 16px;
	}
	
	/* 响应式调整 */
	@media (max-width: 480px) {
		.order-hall-container {
			padding: 12px;
		}
		
		.filter-section {
			padding: 12px;
		}
		
		.filter-item {
			padding: 0 8px;
		}
		
		.filter-value {
			font-size: 13px;
		}
		
		.location-input {
			font-size: 13px;
		}
		
		.order-item {
			padding: 12px;
		}
		
		.order-title {
			font-size: 15px;
		}
		
		.info-item {
			font-size: 13px;
		}
		
		.publisher-avatar {
			width: 32px;
			height: 32px;
			margin-right: 8px;
		}
		
		.publisher-name {
			font-size: 12px;
		}
		
		.publisher-phone {
			font-size: 10px;
		}
		
		.publish-time {
			font-size: 10px;
		}
		
		.detail-btn {
			padding: 5px 10px;
			font-size: 11px;
		}
	}
</style>