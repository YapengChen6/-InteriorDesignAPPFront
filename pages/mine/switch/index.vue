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
    
    <!-- 身份选择列表 - 添加滚动容器 -->
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
            'disabled': !isRoleAvailable(role)
          }"
          @click="selectRole(role)"
        >
          <view class="menu-item-box">
            <view class="menu-icon">{{ getRoleIcon(role.roleType) }}</view>
            <view class="menu-text">
              <text class="role-title">{{ role.roleTypeName }}</text>
              <text class="role-subtitle">{{ getRoleDesc(role.roleType) }}</text>
              <!-- 显示认证状态 -->
              <text class="role-status-text" :class="getStatusClass(role.certificationStatus)">
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

// 角色类型配置（直接使用字符串）
const ROLE_CONFIG = {
  'user': {
    name: '普通用户',
    desc: '浏览内容、发布作品、参与互动',
    icon: '👤',
    alwaysAvailable: true // 普通用户始终可用
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

// 认证状态常量
const CERTIFICATION_STATUS = {
  PENDING: '1',      // 审核中
  APPROVED: '2',     // 已通过
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
      selectedRoleType: '', // 选中的角色类型（字符串）
      currentRoleType: '', // 当前角色类型（字符串）
      userInfo: {},
      availableRoles: [], // 可用的角色列表
      loading: false,
      defaultAvatar: 'https://design.gemcoder.com/staticResource/echoAiSystemImages/378da9ddd57051faab2f02fd247494da.png',
      scrollViewHeight: 400, // 默认滚动区域高度
      showScrollHint: true, // 是否显示滚动提示
      hasScrolled: false // 用户是否已经滚动过
    }
  },
  computed: {
    // 当前角色名称
    currentRoleName() {
      const role = this.getRoleConfig(this.currentRoleType)
      return role ? role.name : '普通用户'
    },
    // 当前角色描述
    currentRoleDesc() {
      const role = this.getRoleConfig(this.currentRoleType)
      return role ? role.desc : ''
    },
    // 确认按钮文本
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
    // 选中的角色是否可用
    isSelectedRoleAvailable() {
      if (this.selectedRoleType === this.currentRoleType) {
        return true // 当前角色始终可用
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
    // 确保页面渲染完成后计算高度
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
    // 窗口尺寸变化时重新计算高度
    this.calculateScrollHeight()
  },
  methods: {
    // 计算滚动区域高度
    calculateScrollHeight() {
      const systemInfo = uni.getSystemInfoSync()
      const windowHeight = systemInfo.windowHeight
      
      // 计算其他元素的高度（估算值，可根据实际调整）
      const currentRoleSectionHeight = 200 // 当前角色区域高度
      const identityHintHeight = 40 // 提示文字高度
      const confirmBtnHeight = 100 // 确认按钮区域高度
      const paddingHeight = 80 // 上下内边距
      
      // 计算滚动区域可用高度
      const scrollHeight = windowHeight - currentRoleSectionHeight - identityHintHeight - confirmBtnHeight - paddingHeight
      
      this.scrollViewHeight = Math.max(scrollHeight, 300) // 最小高度300px
      console.log('滚动区域高度计算:', {
        windowHeight,
        scrollHeight,
        finalHeight: this.scrollViewHeight
      })
    },

    // 滚动事件处理
    onScroll(event) {
      if (!this.hasScrolled) {
        this.hasScrolled = true
        this.showScrollHint = false
      }
      
      const { scrollTop, scrollHeight } = event.detail
      const clientHeight = this.scrollViewHeight
      
      // 如果接近底部，隐藏滚动提示
      if (scrollHeight - scrollTop - clientHeight < 50) {
        this.showScrollHint = false
      }
    },

    // 初始化页面 - 修改为顺序执行，确保数据一致性
    async initPage() {
      try {
        this.loading = true
        // 顺序执行，确保角色信息优先加载
        await this.loadCurrentRole() // 先加载当前角色
        await this.loadUserInfo()    // 再加载用户信息，并同步角色信息
        await this.loadAvailableRoles() // 最后加载可用角色
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

    // 根据角色类型获取角色配置
    getRoleConfig(roleType) {
      return ROLE_CONFIG[roleType] || ROLE_CONFIG['user']
    },

    // 获取角色图标
    getRoleIcon(roleType) {
      const config = this.getRoleConfig(roleType)
      return config.icon
    },

    // 获取角色描述
    getRoleDesc(roleType) {
      const config = this.getRoleConfig(roleType)
      return config.desc
    },

    // 检查角色是否可用（认证状态为2）
    isRoleAvailable(role) {
      // 当前角色始终可用
      if (role.roleType === this.currentRoleType) {
        return true
      }
      // 检查角色配置中是否标记为始终可用
      const roleConfig = this.getRoleConfig(role.roleType)
      if (roleConfig.alwaysAvailable) {
        return true
      }
      // 检查认证状态是否为2（已通过）
      return role.certificationStatus === CERTIFICATION_STATUS.APPROVED
    },

    // 获取认证状态对应的样式类
    getStatusClass(status) {
      switch (status) {
        case CERTIFICATION_STATUS.APPROVED:
          return 'status-approved'
        case CERTIFICATION_STATUS.PENDING:
          return 'status-pending'
        case CERTIFICATION_STATUS.NOT_APPLIED:
          return 'status-not-applied'
        default:
          return 'status-unknown'
      }
    },

    // 从本地存储获取当前角色
    getStoredRole() {
      try {
        const storedRole = uni.getStorageSync(STORAGE_KEYS.CURRENT_ROLE)
        return storedRole || null
      } catch (error) {
        console.error('获取本地存储角色失败:', error)
        return null
      }
    },

    // 保存当前角色到本地存储
    saveRoleToStorage(roleType) {
      try {
        uni.setStorageSync(STORAGE_KEYS.CURRENT_ROLE, roleType)
        console.log('角色信息已保存到本地存储:', roleType)
      } catch (error) {
        console.error('保存角色到本地存储失败:', error)
      }
    },

    // 保存用户信息到本地存储
    saveUserInfoToStorage(userInfo) {
      try {
        uni.setStorageSync(STORAGE_KEYS.USER_INFO, userInfo)
        console.log('用户信息已保存到本地存储')
      } catch (error) {
        console.error('保存用户信息到本地存储失败:', error)
      }
    },

    // 从本地存储获取用户信息
    getStoredUserInfo() {
      try {
        return uni.getStorageSync(STORAGE_KEYS.USER_INFO) || {}
      } catch (error) {
        console.error('获取本地存储用户信息失败:', error)
        return {}
      }
    },

    // 加载用户信息 - 修改为使用当前角色信息同步
    async loadUserInfo() {
      try {
        const res = await getUserProfile()
        if (res.code === 200) {
          this.userInfo = res.data
          
          // 关键修改：使用当前角色接口的数据覆盖用户信息中的角色类型
          if (this.currentRoleType) {
            this.userInfo.currentRoleType = this.currentRoleType
          } else if (this.userInfo.currentRoleType) {
            // 如果当前角色为空，但用户信息中有角色，则使用用户信息的角色
            this.currentRoleType = this.userInfo.currentRoleType
            this.selectedRoleType = this.currentRoleType
            this.saveRoleToStorage(this.currentRoleType)
          }
          
          // 保存到本地存储
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
        // 降级方案：从本地存储获取
        const storedUserInfo = this.getStoredUserInfo()
        if (storedUserInfo && Object.keys(storedUserInfo).length > 0) {
          this.userInfo = storedUserInfo
          // 从存储的用户信息中恢复角色类型
          if (this.userInfo.currentRoleType && !this.currentRoleType) {
            this.currentRoleType = this.userInfo.currentRoleType
            this.selectedRoleType = this.currentRoleType
          }
          console.log('从本地存储获取用户信息:', storedUserInfo)
        }
        throw error
      }
    },

    // 加载当前角色 - 作为主要角色信息来源
    async loadCurrentRole() {
      try {
        const res = await getCurrentRole()
        console.log('当前角色响应:', res)
        if (res.code === 200 && res.data) {
          // 优先使用当前角色接口返回的数据
          this.currentRoleType = res.data.roleType
          this.selectedRoleType = this.currentRoleType
          
          // 保存到本地存储
          this.saveRoleToStorage(this.currentRoleType)
          console.log('当前角色类型:', this.currentRoleType)
        } else {
          throw new Error(res.msg || '获取当前角色失败')
        }
      } catch (error) {
        console.error('获取当前角色失败:', error)
        // 降级方案：从本地存储获取
        const storedRole = this.getStoredRole()
        if (storedRole !== null) {
          this.currentRoleType = storedRole
          this.selectedRoleType = storedRole
          console.log('从本地存储获取角色:', storedRole)
        } else {
          // 如果都没有，默认使用用户角色
          this.currentRoleType = 'user'
          this.selectedRoleType = 'user'
        }
        throw error
      }
    },

    // 加载可用的角色列表
    async loadAvailableRoles() {
      try {
        const res = await getAvailableRoles()
        console.log('可用角色列表:', res)
        if (res.code === 200 && res.data && Array.isArray(res.data)) {
          // 直接使用后端返回的角色数据
          this.availableRoles = res.data.map(item => ({
            roleType: item.roleType,
            roleTypeName: item.roleTypeName,
            certificationStatus: item.certificationStatus,
            certificationStatusText: item.certificationStatusText,
            isCurrent: item.roleType === this.currentRoleType // 根据当前角色设置isCurrent
          }))
          
          // 确保普通用户角色存在
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

    // 确保默认角色存在
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

    // 设置默认角色列表
    setDefaultRoles() {
      this.availableRoles = Object.keys(ROLE_CONFIG).map(roleType => ({
        roleType: roleType,
        roleTypeName: ROLE_CONFIG[roleType].name,
        certificationStatus: CERTIFICATION_STATUS.APPROVED,
        certificationStatusText: '已通过',
        isCurrent: this.currentRoleType === roleType
      }))
    },

    // 选择角色
    selectRole(role) {
      console.log('选择角色:', role, '当前角色:', this.currentRoleType)
      
      // 检查角色是否可用
      if (!this.isRoleAvailable(role) && role.roleType !== this.currentRoleType) {
        let message = ''
        switch (role.certificationStatus) {
          case CERTIFICATION_STATUS.PENDING:
            message = `${role.roleTypeName}身份审核中，请耐心等待`
            break
          case CERTIFICATION_STATUS.NOT_APPLIED:
            message = `您尚未入驻${role.roleTypeName}身份，请先申请入驻`
            break
          default:
            message = `${role.roleTypeName}身份暂不可用`
        }
        
        uni.showToast({
          title: message,
          icon: 'none',
          duration: 2000
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
    
    // 强制刷新用户信息
    async forceRefreshUserInfo() {
      try {
        // 先刷新当前角色信息
        const roleRes = await getCurrentRole()
        if (roleRes.code === 200 && roleRes.data) {
          this.currentRoleType = roleRes.data.roleType
          this.selectedRoleType = this.currentRoleType
          this.saveRoleToStorage(this.currentRoleType)
          console.log('当前角色强制刷新成功:', this.currentRoleType)
        }
        
        // 再刷新用户信息，并同步角色信息
        const userRes = await getUserProfile()
        if (userRes.code === 200) {
          this.userInfo = userRes.data
          // 使用当前角色信息覆盖用户信息中的角色类型
          this.userInfo.currentRoleType = this.currentRoleType
          this.saveUserInfoToStorage(this.userInfo)
          console.log('用户信息强制刷新成功:', this.userInfo)
        }
      } catch (error) {
        console.error('强制刷新用户信息失败:', error)
        // 即使刷新失败，也要确保本地状态正确
        this.updateLocalRoleInfo(this.selectedRoleType)
      }
    },

    // 更新本地角色信息
    updateLocalRoleInfo(newRoleType) {
      // 更新当前角色类型
      this.currentRoleType = newRoleType
      this.selectedRoleType = newRoleType
      
      // 保存到本地存储
      this.saveRoleToStorage(newRoleType)
      
      // 更新用户信息中的角色类型
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

    // 通知角色变更
    notifyRoleChanged(roleType, roleName) {
      // 更新全局状态
      this.updateGlobalState(roleType)
      
      // 发送全局事件
      uni.$emit('roleChanged', { 
        roleType: roleType,
        roleName: roleName,
        userInfo: this.userInfo,
        timestamp: new Date().getTime()
      })
      
      // 通知用户信息更新
      uni.$emit('userInfoUpdated', {
        userInfo: this.userInfo,
        currentRoleType: roleType,
        timestamp: new Date().getTime()
      })
      
      // 新增：发送角色切换完成事件
      uni.$emit('roleSwitchCompleted', {
        roleType: roleType,
        roleName: roleName,
        userInfo: this.userInfo,
        timestamp: new Date().getTime()
      })
    },

    // 更新全局状态
    updateGlobalState(roleType) {
      // 更新应用全局数据
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

    // 确认切换
    async handleConfirm() {
      console.log('确认切换:', {
        当前角色: this.currentRoleType,
        选中角色: this.selectedRoleType,
        用户信息角色: this.userInfo.currentRoleType
      })

      // 如果选择的是当前身份，不执行切换
      if (this.selectedRoleType === this.currentRoleType) {
        const roleConfig = this.getRoleConfig(this.selectedRoleType)
        uni.showToast({
          title: `您当前已经是${roleConfig.name}身份`,
          icon: 'none'
        })
        return
      }

      // 检查选中的角色是否可用
      if (!this.isSelectedRoleAvailable) {
        const selectedRole = this.availableRoles.find(role => role.roleType === this.selectedRoleType)
        let message = '该身份暂不可用'
        if (selectedRole) {
          switch (selectedRole.certificationStatus) {
            case CERTIFICATION_STATUS.PENDING:
              message = `${selectedRole.roleTypeName}身份审核中，请耐心等待`
              break
            case CERTIFICATION_STATUS.NOT_APPLIED:
              message = `您尚未入驻${selectedRole.roleTypeName}身份，请先申请入驻`
              break
          }
        }
        uni.showToast({
          title: message,
          icon: 'none'
        })
        return
      }

      this.loading = true
      
      try {
        let result
        const targetRoleType = this.selectedRoleType
        const roleConfig = this.getRoleConfig(targetRoleType)
        
        console.log('开始切换到:', targetRoleType, roleConfig)
        
        // 根据角色类型选择不同的切换方式
        if (targetRoleType === 'user') {
          // 切换到普通用户
          result = await switchToUser()
        } else {
          // 切换到其他角色
          const switchData = {
            roleType: targetRoleType,
            remark: `用户主动切换到${roleConfig.name}身份`
          }
          console.log('切换请求数据:', switchData)
          result = await switchRole(switchData)
        }

        console.log('切换结果:', result)

        if (result.code === 200) {
          // 立即更新本地角色信息
          this.updateLocalRoleInfo(targetRoleType)
          
          // 强制刷新用户信息，确保获取到最新的角色信息
          await this.forceRefreshUserInfo()
          
          uni.showToast({
            title: `已成功切换到${roleConfig.name}`,
            icon: 'success',
            duration: 1500
          })
          
          // 延迟返回上一页
          setTimeout(() => {
            // 触发全局事件，通知其他页面身份已变更
            this.notifyRoleChanged(targetRoleType, roleConfig.name)
            
            uni.navigateBack()
          }, 1500)
        } else {
          throw new Error(result.msg || '切换失败')
        }
      } catch (error) {
        console.error('切换角色失败:', error)
        uni.showToast({
          title: error.message || '切换失败，请重试',
          icon: 'none',
          duration: 2000
        })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
/* 样式保持不变 */
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

/* 新增滚动容器样式 */
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
  
  &.status-not-applied {
    color: #ff4d4f;
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

/* 新增滚动提示样式 */
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