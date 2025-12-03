<template>
  <view class="shop-manage-page">
    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <uni-load-more status="loading" content="加载中..."></uni-load-more>
    </view>

    <!-- 店铺信息 -->
    <view class="shop-info" v-else-if="shop">
      <!-- 店铺头像和基本信息 -->
      <view class="shop-header">
        <view class="avatar-wrapper">
          <image 
            class="shop-avatar" 
            :src="getShopAvatar()"
            mode="aspectFill"
            @click="chooseAvatar"
          ></image>
          <view class="avatar-edit-tip" @click="chooseAvatar">
            <uni-icons type="camera" size="20" color="#fff"></uni-icons>
          </view>
        </view>
        <view class="shop-basic">
          <text class="shop-name">{{ shop.shopName || '未设置店铺名称' }}</text>
          <view class="shop-rating" v-if="shop.rating">
            <uni-icons type="star-filled" size="16" color="#ffa500"></uni-icons>
            <text class="rating-text">{{ shop.rating.toFixed(1) }}</text>
          </view>
          <text class="shop-status" :class="shopStatusClass">
            {{ getShopStatusText() }}
          </text>
        </view>
      </view>

      <!-- 店铺详情表单 -->
      <view class="form-section">
        <view class="form-item">
          <text class="form-label">店铺名称</text>
          <input 
            class="form-input" 
            v-model="formData.shopName" 
            placeholder="请输入店铺名称"
            maxlength="50"
          />
        </view>

        <view class="form-item">
          <view class="form-label-row">
            <text class="form-label">店铺头像</text>
            <text class="form-tip" v-if="userInfo && userInfo.avatar" @click="fillAvatarFromUser">
              使用个人头像
            </text>
          </view>
          <view class="avatar-preview-wrapper">
            <image 
              class="avatar-preview" 
              :src="getShopAvatar()"
              mode="aspectFill"
              @click="chooseAvatar"
            ></image>
            <view class="avatar-actions">
              <text class="avatar-action-btn" @click="chooseAvatar">选择图片</text>
              <text class="avatar-action-btn" v-if="userInfo && userInfo.avatar" @click="fillAvatarFromUser">使用个人头像</text>
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">店铺描述</text>
          <textarea 
            class="form-textarea" 
            v-model="formData.shopDescription" 
            placeholder="请输入店铺描述"
            maxlength="500"
          ></textarea>
        </view>

        <view class="form-item">
          <view class="form-label-row">
            <text class="form-label">联系电话</text>
            <text class="form-tip" v-if="userInfo && (userInfo.phone || userInfo.phonenumber)" @click="fillPhoneFromUser">
              使用个人手机号
            </text>
          </view>
          <input 
            class="form-input" 
            v-model="formData.contactPhone" 
            placeholder="请输入联系电话或使用个人手机号"
            type="number"
            maxlength="20"
          />
        </view>

        <view class="form-item">
          <view class="form-label-row">
            <text class="form-label">联系地址</text>
            <text class="form-tip" v-if="userInfo && userInfo.address" @click="fillAddressFromUser">
              使用个人地址
            </text>
          </view>
          <textarea 
            class="form-textarea" 
            v-model="formData.contactAddress" 
            placeholder="请输入联系地址或使用个人地址"
            maxlength="200"
          ></textarea>
        </view>

        <view class="form-item">
          <text class="form-label">营业时间</text>
          <input 
            class="form-input" 
            v-model="formData.businessHours" 
            placeholder="例如：周一至周五 9:00-18:00"
            maxlength="100"
          />
        </view>

        <view class="form-item">
          <text class="form-label">线上营业状态</text>
          <picker 
            @change="onOnlineStatusChange" 
            :value="onlineStatusIndex" 
            :range="onlineStatusOptions"
            range-key="label"
          >
            <view class="form-picker">
              <text>{{ onlineStatusOptions[onlineStatusIndex].label }}</text>
              <uni-icons type="arrowright" size="16" color="#999"></uni-icons>
            </view>
          </picker>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons">
        <button class="save-btn" @click="saveShop" :disabled="saving">
          {{ saving ? '保存中...' : '保存修改' }}
        </button>
      </view>
    </view>

    <!-- 无店铺状态 -->
    <view class="empty-state" v-else>
      <image src="/static/images/empty-shop.png" class="empty-image"></image>
      <text class="empty-text">您还没有店铺</text>
      <text class="empty-subtext">请先完成商家入驻申请</text>
      <button class="create-btn" @click="goToJoin">去入驻</button>
    </view>
  </view>
</template>

<script>
import * as shopApi from '@/api/shop.js'
import * as mediaApi from '@/api/media.js'
import * as userApi from '@/api/users.js'

export default {
  data() {
    return {
      loading: false,
      saving: false,
      shop: null,
      userInfo: null, // 用户信息
      formData: {
        shopId: null,
        shopName: '',
        shopDescription: '',
        contactPhone: '',
        contactAddress: '',
        businessHours: '',
        onlineStatus: '0',
        shopAvatar: ''
      },
      onlineStatusIndex: 0,
      onlineStatusOptions: [
        { value: '0', label: '营业中' },
        { value: '1', label: '打样' },
        { value: '2', label: '休息中' }
      ]
    }
  },
  onLoad() {
    this.loadShopInfo()
  },
  onShow() {
    // 页面显示时刷新数据
    this.loadShopInfo()
  },
  computed: {
    shopStatusClass() {
      if (!this.shop) return ''
      return this.shop.shopStatus === 1 ? 'status-normal' : 'status-disabled'
    }
  },
  methods: {
    async loadShopInfo() {
      this.loading = true
      try {
        // 并行加载店铺信息和用户信息
        const [shopRes, userRes] = await Promise.all([
          shopApi.getMyShop().catch(() => ({ code: 404 })),
          userApi.getUserProfile().catch(() => null)
        ])
        
        // 保存用户信息
        if (userRes && userRes.code === 200) {
          this.userInfo = userRes.data
        }
        
        if (shopRes && shopRes.code === 200) {
          this.shop = shopRes.data
          this.initFormData()
        } else if (shopRes.code === 404) {
          // 没有店铺
          this.shop = null
        } else {
          uni.showToast({
            title: shopRes.msg || '加载失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('加载店铺信息失败:', error)
        uni.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    initFormData() {
      if (this.shop) {
        // 从店铺信息初始化表单
        this.formData = {
          shopId: this.shop.shopId,
          shopName: this.shop.shopName || '',
          shopDescription: this.shop.shopDescription || '',
          contactPhone: this.shop.contactPhone || '',
          contactAddress: this.shop.contactAddress || '',
          businessHours: this.shop.businessHours || '',
          onlineStatus: this.shop.onlineStatus || '0',
          shopAvatar: this.shop.shopAvatar || ''
        }
        
        // 如果店铺的联系电话或联系地址为空，从用户信息中获取
        if (!this.formData.contactPhone && this.userInfo) {
          this.formData.contactPhone = this.userInfo.phone || this.userInfo.phonenumber || ''
        }
        
        if (!this.formData.contactAddress && this.userInfo) {
          this.formData.contactAddress = this.userInfo.address || ''
        }
        
        // 如果店铺头像为空，从用户信息中获取（但不自动填充到表单，只用于显示）
        // 用户可以选择是否使用个人头像
        
        // 设置营业状态选择器索引
        const statusIndex = this.onlineStatusOptions.findIndex(
          item => item.value === this.formData.onlineStatus
        )
        this.onlineStatusIndex = statusIndex >= 0 ? statusIndex : 0
      }
    },
    
    // 获取店铺头像（优先使用店铺头像，如果为空则使用用户头像）
    getShopAvatar() {
      if (this.formData.shopAvatar) {
        return this.formData.shopAvatar
      }
      if (this.userInfo && this.userInfo.avatar) {
        return this.userInfo.avatar
      }
      return '/static/images/default-shop.png'
    },
    
    onOnlineStatusChange(e) {
      this.onlineStatusIndex = e.detail.value
      this.formData.onlineStatus = this.onlineStatusOptions[this.onlineStatusIndex].value
    },
    
    async chooseAvatar() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: async (res) => {
          const tempFilePath = res.tempFilePaths[0]
          // 这里可以上传图片到服务器，获取图片URL
          // 暂时使用本地路径
          this.formData.shopAvatar = tempFilePath
          uni.showToast({
            title: '头像已选择，请保存',
            icon: 'success'
          })
        }
      })
    },
    
    async saveShop() {
      if (!this.formData.shopName || !this.formData.shopName.trim()) {
        uni.showToast({
          title: '请输入店铺名称',
          icon: 'none'
        })
        return
      }
      
      this.saving = true
      try {
        const res = await shopApi.updateShop(this.formData)
        if (res && res.code === 200) {
          uni.showToast({
            title: '保存成功',
            icon: 'success'
          })
          // 重新加载店铺信息
          await this.loadShopInfo()
        } else {
          uni.showToast({
            title: res.msg || '保存失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('保存店铺信息失败:', error)
        uni.showToast({
          title: '保存失败，请重试',
          icon: 'none'
        })
      } finally {
        this.saving = false
      }
    },
    
    getShopStatusText() {
      if (!this.shop) return ''
      if (this.shop.shopStatus === 1) {
        return '正常营业'
      } else {
        return '已禁用'
      }
    },
    
    getShopStatusClass() {
      if (!this.shop) return ''
      return this.shop.shopStatus === 1 ? 'status-normal' : 'status-disabled'
    },
    
    goToJoin() {
      uni.navigateTo({
        url: '/pages/join/ShopJoin1'
      })
    },
    
    // 从用户信息填充联系电话
    fillPhoneFromUser() {
      if (this.userInfo) {
        const phone = this.userInfo.phone || this.userInfo.phonenumber
        if (phone) {
          this.formData.contactPhone = phone
          uni.showToast({
            title: '已填充个人手机号',
            icon: 'success',
            duration: 1500
          })
        } else {
          uni.showToast({
            title: '个人资料中未设置手机号',
            icon: 'none'
          })
        }
      }
    },
    
    // 从用户信息填充联系地址
    fillAddressFromUser() {
      if (this.userInfo && this.userInfo.address) {
        this.formData.contactAddress = this.userInfo.address
        uni.showToast({
          title: '已填充个人地址',
          icon: 'success',
          duration: 1500
        })
      } else {
        uni.showToast({
          title: '个人资料中未设置地址',
          icon: 'none'
        })
      }
    },
    
    // 从用户信息填充店铺头像
    fillAvatarFromUser() {
      if (this.userInfo && this.userInfo.avatar) {
        this.formData.shopAvatar = this.userInfo.avatar
        uni.showToast({
          title: '已使用个人头像',
          icon: 'success',
          duration: 1500
        })
      } else {
        uni.showToast({
          title: '个人资料中未设置头像',
          icon: 'none'
        })
      }
    }
  }
}
</script>

<style scoped>
.shop-manage-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 40rpx;
}

.loading-state {
  padding: 100rpx 0;
}

.shop-info {
  padding: 20rpx;
}

.shop-header {
  background: white;
  border-radius: 16rpx;
  padding: 40rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
}

.avatar-wrapper {
  position: relative;
  margin-right: 30rpx;
}

.shop-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background-color: #f0f0f0;
}

.avatar-edit-tip {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 40rpx;
  height: 40rpx;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid white;
}

.avatar-preview-wrapper {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.avatar-preview {
  width: 120rpx;
  height: 120rpx;
  border-radius: 8rpx;
  background-color: #f0f0f0;
  flex-shrink: 0;
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  flex: 1;
}

.avatar-action-btn {
  padding: 12rpx 24rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #333;
  text-align: center;
  border: 1rpx solid #e0e0e0;
}

.avatar-action-btn:active {
  background-color: #e0e0e0;
}

.shop-basic {
  flex: 1;
}

.shop-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.shop-rating {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;
}

.rating-text {
  font-size: 28rpx;
  color: #ffa500;
  margin-left: 8rpx;
}

.shop-status {
  font-size: 24rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  display: inline-block;
}

.status-normal {
  background-color: #e6f7ff;
  color: #1890ff;
}

.status-disabled {
  background-color: #fff1f0;
  color: #ff4d4f;
}

.form-section {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  font-size: 28rpx;
  color: #333;
  display: block;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.form-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.form-tip {
  font-size: 24rpx;
  color: #1890ff;
  padding: 4rpx 12rpx;
  border: 1rpx solid #1890ff;
  border-radius: 8rpx;
  background-color: #e6f7ff;
}

.form-input {
  width: 100%;
  height: 80rpx;
  padding: 0 20rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
}

.form-textarea {
  width: 100%;
  min-height: 160rpx;
  padding: 20rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
}

.form-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80rpx;
  padding: 0 20rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
}

.action-buttons {
  padding: 0 20rpx;
}

.save-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.save-btn:disabled {
  opacity: 0.6;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 40rpx;
}

.empty-image {
  width: 300rpx;
  height: 300rpx;
  margin-bottom: 40rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #333;
  margin-bottom: 16rpx;
}

.empty-subtext {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 60rpx;
}

.create-btn {
  width: 300rpx;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

