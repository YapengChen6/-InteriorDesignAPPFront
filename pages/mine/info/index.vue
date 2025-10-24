<template>
  <view class="container">
    <view class="user-card">
      <view class="info-list">
        <view class="info-item" @tap="openModal('nickName')">
          <view class="info-icon">👤</view>
          <view class="info-content">
            <view class="info-title">昵称</view>
            <view class="info-value">{{ user.nickName }}</view>
          </view>
          <view class="info-arrow">›</view>
        </view>
        
        <view class="info-item" @tap="openModal('phone')">
          <view class="info-icon">📱</view>
          <view class="info-content">
            <view class="info-title">手机号码</view>
            <view class="info-value">{{ user.phonenumber }}</view>
          </view>
          <view class="info-arrow">›</view>
        </view>
        
        
        
        <view class="info-item" @tap="openModal('city')">
          <view class="info-icon">🏙️</view>
          <view class="info-content">
            <view class="info-title">所在城市</view>
            <view class="info-value">{{ user.city || '未设置' }}</view>
          </view>
          <view class="info-arrow">›</view>
        </view>
        
        <!-- 将密码修改更改为账号注销 -->
        <view class="info-item delete-account" @tap="openModal('deleteAccount')">
          <view class="info-icon">⚠️</view>
          <view class="info-content">
            <view class="info-title">账号注销</view>
            <view class="info-value">永久删除账号</view>
          </view>
          <view class="info-arrow">›</view>
        </view>
      </view>
    </view>
    
    <!-- 修改昵称模态框 -->
    <view class="modal" :class="{ active: activeModal === 'nickName' }">
      <view class="modal-content">
        <view class="modal-header">
          <view class="modal-title">修改昵称</view>
          <view class="modal-close" @tap="closeModal">×</view>
        </view>
        <view class="form-group">
          <view class="form-label">新昵称</view>
          <input type="text" class="form-input" v-model="editForm.nickName" placeholder="请输入新昵称" />
        </view>
        <view class="btn btn-block" @tap="saveNickName">保存</view>
        <view class="success-message" :class="{ show: saveSuccess.nickName }">昵称修改成功！</view>
      </view>
    </view>
    
    <!-- 修改手机号码模态框 -->
    <view class="modal" :class="{ active: activeModal === 'phone' }">
      <view class="modal-content">
        <view class="modal-header">
          <view class="modal-title">修改手机号码</view>
          <view class="modal-close" @tap="closeModal">×</view>
        </view>
        <view class="form-group">
          <view class="form-label">新手机号码</view>
          <input type="tel" class="form-input" v-model="editForm.phone" placeholder="请输入新手机号码" />
        </view>
        <view class="btn btn-block" @tap="savePhone">保存</view>
        <view class="success-message" :class="{ show: saveSuccess.phone }">手机号码修改成功！</view>
      </view>
    </view>
    
    <!-- 修改邮箱模态框 -->
    <view class="modal" :class="{ active: activeModal === 'email' }">
      <view class="modal-content">
        <view class="modal-header">
          <view class="modal-title">修改邮箱</view>
          <view class="modal-close" @tap="closeModal">×</view>
        </view>
        <view class="form-group">
          <view class="form-label">新邮箱</view>
          <input type="email" class="form-input" v-model="editForm.email" placeholder="请输入新邮箱" />
        </view>
        <view class="btn btn-block" @tap="saveEmail">保存</view>
        <view class="success-message" :class="{ show: saveSuccess.email }">邮箱修改成功！</view>
      </view>
    </view>
    
    <!-- 修改头像模态框 -->
    <view class="modal" :class="{ active: activeModal === 'avatar' }">
      <view class="modal-content">
        <view class="modal-header">
          <view class="modal-title">更换头像</view>
          <view class="modal-close" @tap="closeModal">×</view>
        </view>
        <view class="form-group">
          <view class="form-label">选择头像</view>
          <view class="avatar-options">
            <view class="avatar-option" 
                 v-for="(avatar, index) in avatarOptions" 
                 :key="index"
                 :class="{ selected: editForm.avatar === avatar }"
                 @tap="editForm.avatar = avatar">
              <image :src="avatar" mode="aspectFill" class="avatar-image"></image>
            </view>
          </view>
        </view>
        <view class="btn btn-block" @tap="saveAvatar">保存</view>
        <view class="success-message" :class="{ show: saveSuccess.avatar }">头像更换成功！</view>
      </view>
    </view>
    
    <!-- 修改所在城市模态框 -->
    <view class="modal" :class="{ active: activeModal === 'city' }">
      <view class="modal-content">
        <view class="modal-header">
          <view class="modal-title">修改所在城市</view>
          <view class="modal-close" @tap="closeModal">×</view>
        </view>
        <view class="form-group">
          <view class="form-label">选择城市</view>
          <view class="city-select-wrapper">
            <picker @change="onCityChange" :value="cityIndex" :range="cities" class="city-select">
              <view class="picker-text">{{ editForm.city || '请选择城市' }}</view>
            </picker>
          </view>
        </view>
        <view class="btn btn-block" @tap="saveCity">保存</view>
        <view class="success-message" :class="{ show: saveSuccess.city }">所在城市修改成功！</view>
      </view>
    </view>
    
    <!-- 账号注销模态框 -->
    <view class="modal" :class="{ active: activeModal === 'deleteAccount' }">
      <view class="modal-content delete-modal">
        <view class="modal-header">
          <view class="modal-title">账号注销</view>
          <view class="modal-close" @tap="closeModal">×</view>
        </view>
        <view class="delete-warning">
          <view class="warning-icon">⚠️</view>
          <view class="warning-title">重要提醒</view>
          <view class="warning-text">
            账号注销后将无法恢复，所有数据将被永久删除，包括：
          </view>
          <view class="warning-list">
            <view class="warning-item">• 个人资料信息</view>
            <view class="warning-item">• 历史记录和收藏</view>
            <view class="warning-item">• 账户余额和积分</view>
            <view class="warning-item">• 所有关联数据</view>
          </view>
        </view>
        
        <view class="btn-group">
          <view class="btn btn-cancel" @tap="closeModal">取消</view>
          <view class="btn btn-danger" :class="{ disabled: !canDeleteAccount }" @tap="deleteAccount">确认注销</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
  import { getUserProfile } from "@/api/system/user"

  export default {
    data() {
      return {
        user: {
          nickName: '',
          phonenumber: '',
          email: '',
          avatar: '',
          city: ''
        },
        roleGroup: "",
        postGroup: "",
        activeModal: null,
        editForm: {
          nickName: '',
          phone: '',
          email: '',
          avatar: '',
          city: '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        },
        deleteForm: {
          password: '',
          confirmText: ''
        },
        saveSuccess: {
          nickName: false,
          phone: false,
          email: false,
          avatar: false,
          city: false
        },
        avatarOptions: [
          '/static/avatars/avatar1.jpg',
          '/static/avatars/avatar2.jpg',
          '/static/avatars/avatar3.jpg',
          '/static/avatars/avatar4.jpg',
          '/static/avatars/avatar5.jpg',
          '/static/avatars/avatar6.jpg'
        ],
        cities: ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安'],
        cityIndex: 0
      }
    },
    computed: {
      canDeleteAccount() {
        return this.deleteForm.password && this.deleteForm.confirmText === '确认注销';
      }
    },
    onLoad() {
      this.getUser()
    },
    methods: {
      getUser() {
        getUserProfile().then(response => {
          this.user = response.data
          this.roleGroup = response.roleGroup
          this.postGroup = response.postGroup
          
          // 设置初始表单值
          this.editForm.nickName = this.user.nickName
          this.editForm.phone = this.user.phonenumber
          this.editForm.email = this.user.email
          this.editForm.avatar = this.user.avatar
          this.editForm.city = this.user.city
          
          // 设置城市选择器的默认值
          const cityIndex = this.cities.indexOf(this.user.city)
          if (cityIndex !== -1) {
            this.cityIndex = cityIndex
          }
        })
      },
      openModal(type) {
        this.activeModal = type
        // 重置成功提示
        for (let key in this.saveSuccess) {
          this.saveSuccess[key] = false
        }
        // 重置注销表单
        if (type === 'deleteAccount') {
          this.deleteForm.password = ''
          this.deleteForm.confirmText = ''
        }
      },
      closeModal() {
        this.activeModal = null
      },
      saveNickName() {
        if (!this.editForm.nickName.trim()) {
          uni.showToast({
            title: '请输入昵称',
            icon: 'none'
          })
          return
        }
        
        // 调用API保存昵称
        // 这里需要根据实际API调整
        this.user.nickName = this.editForm.nickName
        this.saveSuccess.nickName = true
        setTimeout(() => {
          this.closeModal()
        }, 1500)
      },
      savePhone() {
        if (!this.editForm.phone.trim()) {
          uni.showToast({
            title: '请输入手机号码',
            icon: 'none'
          })
          return
        }
        
        // 调用API保存手机号码
        this.user.phonenumber = this.editForm.phone
        this.saveSuccess.phone = true
        setTimeout(() => {
          this.closeModal()
        }, 1500)
      },
      saveEmail() {
        if (!this.editForm.email.trim()) {
          uni.showToast({
            title: '请输入邮箱',
            icon: 'none'
          })
          return
        }
        
        // 调用API保存邮箱
        this.user.email = this.editForm.email
        this.saveSuccess.email = true
        setTimeout(() => {
          this.closeModal()
        }, 1500)
      },
      saveAvatar() {
        if (!this.editForm.avatar) {
          uni.showToast({
            title: '请选择头像',
            icon: 'none'
          })
          return
        }
        
        // 调用API保存头像
        this.user.avatar = this.editForm.avatar
        this.saveSuccess.avatar = true
        setTimeout(() => {
          this.closeModal()
        }, 1500)
      },
      onCityChange(e) {
        this.cityIndex = e.detail.value
        this.editForm.city = this.cities[this.cityIndex]
      },
      saveCity() {
        if (!this.editForm.city) {
          uni.showToast({
            title: '请选择城市',
            icon: 'none'
          })
          return
        }
        
        // 调用API保存城市
        this.user.city = this.editForm.city
        this.saveSuccess.city = true
        setTimeout(() => {
          this.closeModal()
        }, 1500)
      },
      deleteAccount() {
        if (!this.canDeleteAccount) {
          return
        }
        
        uni.showModal({
          title: '最后确认',
          content: '此操作不可撤销，确定要永久注销您的账号吗？',
          confirmColor: '#ff4757',
          success: (res) => {
            if (res.confirm) {
              // 调用API注销账号
              uni.showLoading({
                title: '注销中...'
              })
              
              // 模拟API调用
              setTimeout(() => {
                uni.hideLoading()
                uni.showToast({
                  title: '账号已成功注销',
                  icon: 'success',
                  duration: 2000
                })
                
                setTimeout(() => {
                  // 跳转到登录页或首页
                  uni.reLaunch({
                    url: '/pages/login/login'
                  })
                }, 2000)
              }, 1500)
            }
          }
        })
      }
    }
  }
</script>

<style lang="scss">
  page {
    background-color: #f5f7fa;
  }
  
  .container {
    padding: 20rpx;
  }
  
  .user-card {
    background: white;
    border-radius: 16rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
    overflow: hidden;
    margin-bottom: 20rpx;
    transition: all 0.3s ease;
  }
  
  .info-list {
    padding: 0;
  }
  
  .info-item {
    display: flex;
    align-items: center;
    padding: 32rpx 40rpx;
    border-bottom: 1rpx solid #f0f0f0;
  }
  
  .info-item:last-child {
    border-bottom: none;
  }
  
  .info-item.delete-account {
    .info-title, .info-value {
      color: #ff4757;
    }
    
    .info-icon {
      color: #ff4757;
    }
  }
  
  .info-icon {
    width: 48rpx;
    height: 48rpx;
    margin-right: 30rpx;
    color: #6a11cb;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .info-content {
    flex: 1;
  }
  
  .info-title {
    font-size: 30rpx;
    color: #666;
    margin-bottom: 8rpx;
  }
  
  .info-value {
    font-size: 32rpx;
    color: #333;
    font-weight: 500;
  }
  
  .info-arrow {
    color: #999;
    font-size: 28rpx;
  }
  
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
  }
  
  .modal.active {
    opacity: 1;
    visibility: visible;
  }
  
  .modal-content {
    background: white;
    width: 90%;
    max-width: 600rpx;
    border-radius: 16rpx;
    padding: 50rpx;
    box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.15);
    transform: translateY(40rpx);
    transition: transform 0.3s ease;
  }
  
  .modal.active .modal-content {
    transform: translateY(0);
  }
  
  .delete-modal {
    max-width: 650rpx;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40rpx;
  }
  
  .modal-title {
    font-size: 36rpx;
    font-weight: 600;
    color: #333;
  }
  
  .delete-modal .modal-title {
    color: #ff4757;
  }
  
  .modal-close {
    font-size: 48rpx;
    color: #999;
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .delete-warning {
    background: #fff5f5;
    border: 1rpx solid #ffcccc;
    border-radius: 12rpx;
    padding: 30rpx;
    margin-bottom: 40rpx;
  }
  
  .warning-icon {
    font-size: 40rpx;
    text-align: center;
    margin-bottom: 20rpx;
  }
  
  .warning-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #ff4757;
    text-align: center;
    margin-bottom: 20rpx;
  }
  
  .warning-text {
    font-size: 28rpx;
    color: #666;
    margin-bottom: 20rpx;
    line-height: 1.5;
  }
  
  .warning-list {
    padding-left: 20rpx;
  }
  
  .warning-item {
    font-size: 26rpx;
    color: #666;
    line-height: 1.6;
  }
  
  
  .form-label {
    display: block;
    margin-bottom: 16rpx;
    font-size: 28rpx;
    color: #666;
  }
  
  .form-input {
    width: 100%;
    padding: 24rpx 30rpx;
    border: 1rpx solid #e0e0e0;
    border-radius: 16rpx;
    font-size: 32rpx;
  }
  
  .btn {
    display: flex;
    padding: 24rpx 48rpx;
    background: #6a11cb;
    color: white;
    border-radius: 16rpx;
    font-size: 32rpx;
    font-weight: 500;
    justify-content: center;
    align-items: center;
    transition: all 0.3s;
  }
  
  .btn:active {
    opacity: 0.8;
    transform: scale(0.98);
  }
  
  .btn-block {
    width: 100%;
  }
  
  .btn-danger {
    background: #ff4757;
  }
  
  .btn-danger.disabled {
    background: #cccccc;
    color: #999999;
  }
  
  .btn-cancel {
    background: #f1f2f6;
    color: #666;
  }
  
  .btn-group {
    display: flex;
    gap: 20rpx;
  }
  
  .btn-group .btn {
    flex: 1;
  }
  
  .avatar-options {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
    margin-top: 30rpx;
  }
  
  .avatar-option {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    overflow: hidden;
    border: 4rpx solid transparent;
  }
  
  .avatar-option.selected {
    border-color: #6a11cb;
  }
  
  .avatar-image {
    width: 100%;
    height: 100%;
  }
  
  .city-select-wrapper {
    width: 100%;
  }
  
  .city-select {
    width: 100%;
    padding: 24rpx 30rpx;
    border: 1rpx solid #e0e0e0;
    border-radius: 16rpx;
    font-size: 32rpx;
    background-color: white;
  }
  
  .picker-text {
    font-size: 32rpx;
    color: #333;
  }
  
  .success-message {
    background-color: #e8f5e9;
    color: #2e7d32;
    padding: 24rpx 30rpx;
    border-radius: 16rpx;
    margin-top: 30rpx;
    text-align: center;
    display: none;
  }
  
  .success-message.show {
    display: block;
  }
</style>