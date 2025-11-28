<template>
  <view class="setting-container" :style="{height: `${windowHeight}px`}">
    
    <!-- 当前角色信息 -->
    <view class="current-role-section">
      <view class="current-role-card">
        <view class="role-avatar">
          <image class="avatar" :src="userInfo.avatar || defaultAvatar" mode="aspectFill"></image>
        </view>
        <view class="role-info">
          <text class="user-name">{{ userInfo.name || userInfo.nickName || '用户' }}</text>
          <text class="current-role-text">当前身份：{{ currentRoleName }}</text>
          <text class="role-desc">{{ currentRoleDesc }}</text>
        </view>
      </view>
    </view>
    
    <!-- 身份提示 -->
    <view class="identity-hint">请选择要切换的身份：</view>
    
    <!-- 身份选择列表 -->
    <scroll-view 
      class="menu-scroll-container"
      scroll-y
      :style="{height: `${scrollViewHeight}px`}"
      @scroll="onScroll"
    >
      <view class="menu-list">
        <view 
          class="list-cell" 
          v-for="role in availableRoles" 
          :key="role.roleType"
          :class="{
            'selected': selectedRoleType === role.roleType, 
            'current': currentRoleType === role.roleType,
            'disabled': !isRoleAvailable(role) && currentRoleType !== role.roleType
          }"
          @click="selectRole(role)"
        >
          <view class="menu-item-box">
            <view class="menu-icon">{{ getRoleIcon(role.roleType) }}</view>
            <view class="menu-text">
              <text class="role-title">{{ role.roleTypeName }}</text>
              <text class="role-subtitle">{{ getRoleDesc(role.roleType) }}</text>
              <!-- 显示认证状态 -->
              <text class="role-status-text" :class="{
                'status-approved': role.certificationStatus === CERTIFICATION_STATUS.APPROVED,
                'status-pending': role.certificationStatus === CERTIFICATION_STATUS.PENDING || role.certificationStatus === CERTIFICATION_STATUS.REVIEWING,
                'status-rejected': role.certificationStatus === CERTIFICATION_STATUS.REJECTED,
                'status-not-applied': role.certificationStatus === CERTIFICATION_STATUS.NOT_APPLIED,
                'status-unknown': !role.certificationStatus
              }">
                {{ role.certificationStatusText }}
              </text>
            </view>
          </view>
          <view class="role-status" v-if="currentRoleType === role.roleType">
            <text class="status-text">当前身份</text>
          </view>
          <view class="role-check" v-else-if="selectedRoleType === role.roleType && isRoleAvailable(role)">
            <text class="check-icon">✓</text>
          </view>
          <!-- 不可用状态的提示 -->
          <view class="role-unavailable" v-if="!isRoleAvailable(role) && currentRoleType !== role.roleType">
            <text class="unavailable-icon">🔒</text>
          </view>
        </view>
        
        <!-- 滚动提示 -->
        <view class="scroll-hint" v-if="showScrollHint">
          <text class="scroll-hint-text">继续下滑查看全部身份</text>
          <view class="scroll-arrow">↓</view>
        </view>
      </view>
    </scroll-view>
    
    <!-- 确认按钮 -->
    <view class="confirm-btn-container">
      <view class="confirm-btn" @click="handleConfirm" :class="{
        'disabled': selectedRoleType === currentRoleType || !isSelectedRoleAvailable
      }">
        <text class="confirm-text">{{ confirmButtonText }}</text>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-mask">
      <view class="loading-content">
        <view class="loading-spinner"></view>
        <text class="loading-text">切换中...</text>
      </view>
    </view>
  </view>
</template>

<script>
import { getUserProfile, getCurrentRole, getAvailableRoles, switchRole, switchToUser } from '@/api/users.js'

// 角色类型配置
const ROLE_CONFIG = {
  'user': {
    name: '普通用户',
    desc: '浏览内容、发布作品、参与互动',
    icon: '👤',
    alwaysAvailable: true
  },
  'designer': {
    name: '设计师',
    desc: '发布作品、管理内容、数据分析',
    icon: '🎨'
  },
  'supervisor': {
    name: '监理',
    desc: '工程监督、质量检查、进度管理',
    icon: '👷'
  },
  'material_supplier': {
    name: '材料商',
    desc: '管理材料、处理订单、库存管理',
    icon: '🏭'
  }
}

// 认证状态常量 - 根据后端代码更新
const CERTIFICATION_STATUS = {
  PENDING: '0',      // 待审核
  REVIEWING: '1',    // 审核中
  APPROVED: '2',     // 已通过
  REJECTED: '3',     // 已拒绝
  NOT_APPLIED: '9'   // 未入驻
}

// 存储键名
const STORAGE_KEYS = {
  CURRENT_ROLE: 'currentRoleType',
  USER_INFO: 'userInfo'
}

export default {
  data() {
    return {
      windowHeight: uni.getSystemInfoSync().windowHeight,
      selectedRoleType: '',
      currentRoleType: '',
      userInfo: {},
      availableRoles: [],
      loading: false,
      defaultAvatar: 'https://design.gemcoder.com/staticResource/echoAiSystemImages/378da9ddd57051faab2f02fd247494da.png',
      scrollViewHeight: 400,
      showScrollHint: true,
      hasScrolled: false,
      CERTIFICATION_STATUS: CERTIFICATION_STATUS // 将常量暴露到data中，方便模板使用
    }
  },
  computed: {
    currentRoleName() {
      const role = this.getRoleConfig(this.currentRoleType)
      return role ? role.name : '普通用户'
    },
    currentRoleDesc() {
      const role = this.getRoleConfig(this.currentRoleType)
      return role ? role.desc : ''
    },
    confirmButtonText() {
      if (this.selectedRoleType === this.currentRoleType) {
        return '当前身份'
      }
      if (!this.isSelectedRoleAvailable) {
        return '身份不可用'
      }
      const selectedRole = this.getRoleConfig(this.selectedRoleType)
      return selectedRole ? `切换为${selectedRole.name}` : '切换身份'
    },
    isSelectedRoleAvailable() {
      if (this.selectedRoleType === this.currentRoleType) {
        return true
      }
      const selectedRole = this.availableRoles.find(role => role.roleType === this.selectedRoleType)
      return selectedRole ? this.isRoleAvailable(selectedRole) : false
    }
  },
  async onLoad() {
    await this.initPage()
    this.calculateScrollHeight()
  },
  onReady() {
    setTimeout(() => {
      this.calculateScrollHeight()
    }, 100)
  },
  onPullDownRefresh() {
    this.initPage().finally(() => {
      uni.stopPullDownRefresh()
    })
  },
  onResize() {
    this.calculateScrollHeight()
  },
  onUnload() {
    // 清理事件监听，避免内存泄漏
    uni.$off('roleChanged')
    uni.$off('userInfoUpdated')
    uni.$off('roleSwitchCompleted')
  },
  methods: {
    calculateScrollHeight() {
      const systemInfo = uni.getSystemInfoSync()
      const windowHeight = systemInfo.windowHeight
      
      const currentRoleSectionHeight = 200
      const identityHintHeight = 40
      const confirmBtnHeight = 100
      const paddingHeight = 80
      
      const scrollHeight = windowHeight - currentRoleSectionHeight - identityHintHeight - confirmBtnHeight - paddingHeight
      
      this.scrollViewHeight = Math.max(scrollHeight, 300)
    },

    onScroll(event) {
      if (!this.hasScrolled) {
        this.hasScrolled = true
        this.showScrollHint = false
      }
      
      const { scrollTop, scrollHeight } = event.detail
      const clientHeight = this.scrollViewHeight
      
      if (scrollHeight - scrollTop - clientHeight < 50) {
        this.showScrollHint = false
      }
    },

    async initPage() {
      try {
        this.loading = true
        await this.loadCurrentRole()
        await this.loadUserInfo()
        await this.loadAvailableRoles()
        
        // 添加权限检查日志
        console.log('用户权限状态分析:')
        this.availableRoles.forEach(role => {
          console.log(`角色 ${role.roleTypeName}:`, {
            认证状态: role.certificationStatus,
            状态文本: role.certificationStatusText,
            是否可用: this.isRoleAvailable(role),
            是否当前: role.isCurrent
          })
        })
        
        console.log('页面初始化完成:', {
          当前角色: this.currentRoleType,
          用户信息角色: this.userInfo.currentRoleType
        })
      } catch (error) {
        console.error('页面初始化失败:', error)
        uni.showToast({
          title: '加载失败，请下拉刷新',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    getRoleConfig(roleType) {
      return ROLE_CONFIG[roleType] || ROLE_CONFIG['user']
    },

    getRoleIcon(roleType) {
      const config = this.getRoleConfig(roleType)
      return config.icon
    },

    getRoleDesc(roleType) {
      const config = this.getRoleConfig(roleType)
      return config.desc
    },

    // 检查角色是否可用（基于后端 sys_user_role 表逻辑）
    isRoleAvailable(role) {
      // 当前角色始终可用
      if (role.roleType === this.currentRoleType) {
        return true
      }
      // 普通用户角色始终可用
      if (role.roleType === 'user') {
        return true
      }
      // 其他角色：认证状态为 "2"（已通过）即可用
      return role.certificationStatus === CERTIFICATION_STATUS.APPROVED
    },

    getStoredRole() {
      try {
        const storedRole = uni.getStorageSync(STORAGE_KEYS.CURRENT_ROLE)
        return storedRole || null
      } catch (error) {
        console.error('获取本地存储角色失败:', error)
        return null
      }
    },

    saveRoleToStorage(roleType) {
      try {
        uni.setStorageSync(STORAGE_KEYS.CURRENT_ROLE, roleType)
        console.log('角色信息已保存到本地存储:', roleType)
      } catch (error) {
        console.error('保存角色到本地存储失败:', error)
      }
    },

    saveUserInfoToStorage(userInfo) {
      try {
        uni.setStorageSync(STORAGE_KEYS.USER_INFO, userInfo)
        console.log('用户信息已保存到本地存储')
      } catch (error) {
        console.error('保存用户信息到本地存储失败:', error)
      }
    },

    getStoredUserInfo() {
      try {
        return uni.getStorageSync(STORAGE_KEYS.USER_INFO) || {}
      } catch (error) {
        console.error('获取本地存储用户信息失败:', error)
        return {}
      }
    },

    async loadUserInfo() {
      try {
        const res = await getUserProfile()
        if (res.code === 200) {
          this.userInfo = res.data
          
          if (this.currentRoleType) {
            this.userInfo.currentRoleType = this.currentRoleType
          } else if (this.userInfo.currentRoleType) {
            this.currentRoleType = this.userInfo.currentRoleType
            this.selectedRoleType = this.currentRoleType
            this.saveRoleToStorage(this.currentRoleType)
          }
          
          this.saveUserInfoToStorage(this.userInfo)
          console.log('用户信息加载成功:', {
            用户信息: this.userInfo,
            当前角色: this.currentRoleType
          })
        } else {
          throw new Error(res.msg || '获取用户信息失败')
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        const storedUserInfo = this.getStoredUserInfo()
        if (storedUserInfo && Object.keys(storedUserInfo).length > 0) {
          this.userInfo = storedUserInfo
          if (this.userInfo.currentRoleType && !this.currentRoleType) {
            this.currentRoleType = this.userInfo.currentRoleType
            this.selectedRoleType = this.currentRoleType
          }
          console.log('从本地存储获取用户信息:', storedUserInfo)
        }
        throw error
      }
    },

    async loadCurrentRole() {
      try {
        const res = await getCurrentRole()
        console.log('当前角色响应:', res)
        if (res.code === 200 && res.data) {
          this.currentRoleType = res.data.roleType
          this.selectedRoleType = this.currentRoleType
          
          this.saveRoleToStorage(this.currentRoleType)
          console.log('当前角色类型:', this.currentRoleType)
        } else {
          throw new Error(res.msg || '获取当前角色失败')
        }
      } catch (error) {
        console.error('获取当前角色失败:', error)
        const storedRole = this.getStoredRole()
        if (storedRole !== null) {
          this.currentRoleType = storedRole
          this.selectedRoleType = storedRole
          console.log('从本地存储获取角色:', storedRole)
        } else {
          this.currentRoleType = 'user'
          this.selectedRoleType = 'user'
        }
        throw error
      }
    },

    async loadAvailableRoles() {
      try {
        const res = await getAvailableRoles()
        console.log('可用角色列表完整响应:', JSON.stringify(res, null, 2))
        
        if (res.code === 200 && res.data && Array.isArray(res.data)) {
          this.availableRoles = res.data.map(item => ({
            roleType: item.roleType,
            roleTypeName: item.roleTypeName,
            certificationStatus: item.certificationStatus,
            certificationStatusText: item.certificationStatusText,
            isCurrent: item.roleType === this.currentRoleType
          }))
          
          console.log('处理后的可用角色:', this.availableRoles)
          
          this.ensureDefaultRoles()
        } else {
          throw new Error(res.msg || '获取可用角色失败')
        }
      } catch (error) {
        console.error('获取可用角色失败:', error)
        this.setDefaultRoles()
        throw error
      }
    },

    ensureDefaultRoles() {
      const hasUserRole = this.availableRoles.some(role => role.roleType === 'user')
      if (!hasUserRole) {
        this.availableRoles.unshift({
          roleType: 'user',
          roleTypeName: '普通用户',
          certificationStatus: CERTIFICATION_STATUS.APPROVED,
          certificationStatusText: '已通过',
          isCurrent: this.currentRoleType === 'user'
        })
      }
    },

    setDefaultRoles() {
      this.availableRoles = Object.keys(ROLE_CONFIG).map(roleType => ({
        roleType: roleType,
        roleTypeName: ROLE_CONFIG[roleType].name,
        certificationStatus: CERTIFICATION_STATUS.APPROVED,
        certificationStatusText: '已通过',
        isCurrent: this.currentRoleType === roleType
      }))
    },

    selectRole(role) {
      console.log('选择角色详情:', {
        角色信息: role,
        当前角色: this.currentRoleType,
        是否可用: this.isRoleAvailable(role)
      })
      
      // 检查角色是否可用
      if (!this.isRoleAvailable(role) && role.roleType !== this.currentRoleType) {
        let message = ''
        let showGuide = false
        
        switch (role.certificationStatus) {
          case CERTIFICATION_STATUS.PENDING:
          case CERTIFICATION_STATUS.REVIEWING:
            message = `${role.roleTypeName}身份审核中，请耐心等待`
            break
          case CERTIFICATION_STATUS.REJECTED:
            message = `${role.roleTypeName}身份审核未通过`
            break
          case CERTIFICATION_STATUS.NOT_APPLIED:
            message = `您尚未入驻${role.roleTypeName}身份`
            showGuide = true
            break
          default:
            message = `${role.roleTypeName}身份暂不可用`
        }
        
        uni.showModal({
          title: '提示',
          content: message,
          confirmText: showGuide ? '去入驻' : '知道了',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm && showGuide) {
              // 跳转到入驻页面
              this.navigateToSettlePage(role.roleType)
            }
          }
        })
        return
      }
      
      if (role.roleType === this.currentRoleType) {
        uni.showToast({
          title: `您当前已经是${role.roleTypeName}身份`,
          icon: 'none',
          duration: 2000
        })
        return
      }
      
      this.selectedRoleType = role.roleType
    },
    
    // 跳转到入驻页面
    navigateToSettlePage(roleType) {
      const settlePages = {
        'designer': '/pages/designer/settle/index',
        'supervisor': '/pages/supervisor/settle/index', 
        'material_supplier': '/pages/supplier/settle/index'
      }
      
      const targetPage = settlePages[roleType]
      if (targetPage) {
        uni.navigateTo({
          url: targetPage
        })
      } else {
        uni.showToast({
          title: '暂不支持该身份入驻',
          icon: 'none'
        })
      }
    },
    
    async forceRefreshUserInfo() {
      try {
        const roleRes = await getCurrentRole()
        if (roleRes.code === 200 && roleRes.data) {
          this.currentRoleType = roleRes.data.roleType
          this.selectedRoleType = this.currentRoleType
          this.saveRoleToStorage(this.currentRoleType)
          console.log('当前角色强制刷新成功:', this.currentRoleType)
        }
        
        const userRes = await getUserProfile()
        if (userRes.code === 200) {
          this.userInfo = userRes.data
          this.userInfo.currentRoleType = this.currentRoleType
          this.saveUserInfoToStorage(this.userInfo)
          console.log('用户信息强制刷新成功:', this.userInfo)
        }
      } catch (error) {
        console.error('强制刷新用户信息失败:', error)
        this.updateLocalRoleInfo(this.selectedRoleType)
      }
    },

    updateLocalRoleInfo(newRoleType) {
      this.currentRoleType = newRoleType
      this.selectedRoleType = newRoleType
      
      this.saveRoleToStorage(newRoleType)
      
      if (this.userInfo) {
        this.userInfo.currentRoleType = newRoleType
        this.saveUserInfoToStorage(this.userInfo)
      }
      
      const roleConfig = this.getRoleConfig(newRoleType)
      console.log('本地角色信息已更新:', {
        新角色类型: newRoleType,
        新角色名称: roleConfig.name,
        用户信息: this.userInfo
      })
    },

    notifyRoleChanged(roleType, roleName) {
      this.updateGlobalState(roleType)
      
      uni.$emit('roleChanged', { 
        roleType: roleType,
        roleName: roleName,
        userInfo: this.userInfo,
        timestamp: new Date().getTime()
      })
      
      uni.$emit('userInfoUpdated', {
        userInfo: this.userInfo,
        currentRoleType: roleType,
        timestamp: new Date().getTime()
      })
      
      uni.$emit('roleSwitchCompleted', {
        roleType: roleType,
        roleName: roleName,
        userInfo: this.userInfo,
        timestamp: new Date().getTime()
      })
    },

    updateGlobalState(roleType) {
      if (typeof getApp !== 'undefined') {
        const app = getApp()
        if (app && app.globalData) {
          app.globalData.currentRoleType = roleType
          app.globalData.userInfo = {
            ...app.globalData.userInfo,
            currentRoleType: roleType
          }
          console.log('全局状态已更新:', app.globalData)
        }
      }
    },

    async handleConfirm() {
      console.log('确认切换角色详情:', {
        当前角色: this.currentRoleType,
        选中角色: this.selectedRoleType,
        是否可用: this.isSelectedRoleAvailable,
        用户信息: this.userInfo.currentRoleType
      })

      if (this.selectedRoleType === this.currentRoleType) {
        const roleConfig = this.getRoleConfig(this.selectedRoleType)
        uni.showToast({
          title: `您当前已经是${roleConfig.name}身份`,
          icon: 'none'
        })
        return
      }

      if (!this.isSelectedRoleAvailable) {
        const selectedRole = this.availableRoles.find(role => role.roleType === this.selectedRoleType)
        let message = '该身份暂不可用'
        if (selectedRole) {
          // 根据新的认证状态给出具体提示
          switch (selectedRole.certificationStatus) {
            case CERTIFICATION_STATUS.PENDING:
            case CERTIFICATION_STATUS.REVIEWING:
              message = `${selectedRole.roleTypeName}身份审核中，请耐心等待`
              break
            case CERTIFICATION_STATUS.REJECTED:
              message = `${selectedRole.roleTypeName}身份审核未通过`
              break
            case CERTIFICATION_STATUS.NOT_APPLIED:
              message = `您尚未入驻${selectedRole.roleTypeName}身份，请先申请入驻`
              break
          }
        }
        uni.showToast({
          title: message,
          icon: 'none',
          duration: 3000
        })
        return
      }

      this.loading = true
      
      try {
        const targetRoleType = this.selectedRoleType
        const roleConfig = this.getRoleConfig(targetRoleType)
        
        console.log('开始切换到:', targetRoleType, roleConfig)
        
        // 统一使用 switchRole 接口
        const switchData = {
          roleType: targetRoleType
        }
        console.log('切换请求数据:', switchData)
        const result = await switchRole(switchData)

        console.log('切换结果:', result)

        if (result.code === 200) {
          this.updateLocalRoleInfo(targetRoleType)
          
          await this.forceRefreshUserInfo()
          
          uni.showToast({
            title: `已成功切换到${roleConfig.name}`,
            icon: 'success',
            duration: 1500
          })
          
          setTimeout(() => {
            this.notifyRoleChanged(targetRoleType, roleConfig.name)
            uni.navigateBack()
          }, 1500)
        } else {
          // 提供更详细的错误信息
          let errorMessage = result.msg || '切换失败'
          if (result.code === 400) {
            // 根据后端返回的具体错误信息进行处理
            if (errorMessage.includes('未入驻')) {
              errorMessage = `您尚未入驻${roleConfig.name}身份，请先申请入驻`
            } else if (errorMessage.includes('审核未通过')) {
              errorMessage = `${roleConfig.name}身份审核未通过，无法切换`
            } else {
              errorMessage = `${roleConfig.name}身份暂不可用：${errorMessage}`
            }
          }
          throw new Error(errorMessage)
        }
      } catch (error) {
        console.error('切换角色失败:', error)
        // 显示更详细的错误信息
        let errorMessage = error.message || '切换失败，请重试'
        
        // 处理网络错误或服务器错误
        if (error.message.includes('Network Error') || error.message.includes('timeout')) {
          errorMessage = '网络连接失败，请检查网络后重试'
        } else if (error.message.includes('500')) {
          errorMessage = '服务器内部错误，请稍后重试'
        }
        
        uni.showToast({
          title: errorMessage,
          icon: 'none',
          duration: 3000
        })
        
        // 重新加载可用角色列表，确保状态最新
        try {
          await this.loadAvailableRoles()
        } catch (reloadError) {
          console.error('重新加载角色列表失败:', reloadError)
        }
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.setting-container {
  background-color: #f8f8f8;
  padding: 40rpx 30rpx;
  display: flex;
  flex-direction: column;
}

.current-role-section {
  margin-bottom: 40rpx;
}

.current-role-card {
  background: linear-gradient(135deg, #4A90E2 0%, #5B6EF7 100%);
  border-radius: 24rpx;
  padding: 40rpx;
  display: flex;
  align-items: center;
  color: white;
  box-shadow: 0 8rpx 24rpx rgba(74, 144, 226, 0.3);
}

.role-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  overflow: hidden;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  margin-right: 30rpx;
}

.avatar {
  width: 100%;
  height: 100%;
}

.role-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.current-role-text {
  font-size: 28rpx;
  opacity: 0.9;
  margin-bottom: 8rpx;
}

.role-desc {
  font-size: 24rpx;
  opacity: 0.7;
}

.identity-hint {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 30rpx;
  font-weight: 500;
}

.menu-scroll-container {
  flex: 1;
  margin-bottom: 20rpx;
  border-radius: 16rpx;
  overflow: hidden;
}

.menu-list {
  background-color: #FFFFFF;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.list-cell {
  padding: 40rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  
  &:last-child {
    border-bottom: none;
  }
  
  &.selected {
    background-color: #f0f7ff;
  }
  
  &.current {
    border-left: 6rpx solid #1890ff;
  }
  
  &.disabled {
    opacity: 0.6;
    background-color: #f9f9f9;
  }
}

.menu-item-box {
  display: flex;
  align-items: center;
  flex: 1;
}

.menu-icon {
  font-size: 48rpx;
  margin-right: 30rpx;
  width: 60rpx;
  text-align: center;
}

.menu-text {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.role-title {
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 8rpx;
}

.role-subtitle {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 4rpx;
}

.role-status-text {
  font-size: 22rpx;
  
  &.status-approved {
    color: #52c41a;
  }
  
  &.status-pending {
    color: #faad14;
  }
  
  &.status-rejected {
    color: #ff4d4f;
  }
  
  &.status-not-applied {
    color: #999;
  }
  
  &.status-unknown {
    color: #999;
  }
}

.role-status {
  background: #1890ff;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
}

.status-text {
  color: #fff;
  font-size: 22rpx;
}

.role-check {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #1890ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-icon {
  color: #fff;
  font-size: 24rpx;
  font-weight: bold;
}

.role-unavailable {
  margin-left: 16rpx;
}

.unavailable-icon {
  font-size: 28rpx;
  opacity: 0.6;
}

.scroll-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0;
  background: linear-gradient(transparent, #f8f8f8);
  position: sticky;
  bottom: 0;
}

.scroll-hint-text {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 10rpx;
}

.scroll-arrow {
  font-size: 28rpx;
  color: #ccc;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10rpx);
  }
  60% {
    transform: translateY(-5rpx);
  }
}

.confirm-btn-container {
  margin-top: auto;
  padding: 0 30rpx;
}

.confirm-btn {
  background-color: #1890ff;
  border-radius: 50rpx;
  padding: 28rpx;
  text-align: center;
  box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.3);
  transition: all 0.3s;
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.4);
  }
}

.confirm-btn.disabled {
  background-color: #ccc;
  box-shadow: none;
  
  &:active {
    transform: none;
    box-shadow: none;
  }
}

.confirm-text {
  color: #fff;
  font-size: 32rpx;
  font-weight: 500;
}

.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  background: white;
  padding: 48rpx;
  border-radius: 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #f3f3f3;
  border-top: 4rpx solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
  color: #4A5568;
}
</style>