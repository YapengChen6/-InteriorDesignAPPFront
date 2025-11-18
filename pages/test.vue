<template>
  <view class="container">
    <view class="header">
      <text class="title">省市区选择</text>
      <text class="subtitle">请选择您所在的地区</text>
    </view>

    <!-- 使用普通的 picker mode="region" - 不依赖 uniCloud -->
    <view class="picker-section">
      <view class="picker-label">所在地区</view>
      <picker mode="region" @change="bindRegionChange">
        <view class="picker-display">
          <text class="picker-text" :class="{ placeholder: !selectedAddress }">
            {{ selectedAddress || '请选择省市区' }}
          </text>
          <text class="picker-arrow">▼</text>
        </view>
      </picker>
    </view>

    <!-- 显示选中的地址 -->
    <view class="selected-info" v-if="selectedAddress">
      <view class="info-card">
        <text class="info-title">已选择的地址</text>
        <view class="address-detail">
          <text class="address-text">{{ selectedAddress }}</text>
        </view>
        <view class="address-parts">
          <text class="part-item">省份：{{ selectedProvince }}</text>
          <text class="part-item">城市：{{ selectedCity }}</text>
          <text class="part-item">区县：{{ selectedDistrict }}</text>
        </view>
      </view>
    </view>

    <!-- 空状态提示 -->
    <view class="empty-state" v-if="!selectedAddress">
      <text class="empty-icon">📍</text>
      <text class="empty-text">尚未选择地区</text>
      <text class="empty-desc">请在上方选择器中选择您的所在地区</text>
    </view>

    <!-- 操作按钮 -->
    <view class="button-group">
      <button class="btn btn-primary" @click="confirmSelection" :disabled="!selectedAddress">
        {{ selectedAddress ? '确认选择' : '请先选择地区' }}
      </button>
      <button class="btn btn-secondary" @click="resetSelection" :disabled="!selectedAddress">
        重置选择
      </button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      selectedAddress: '',
      selectedProvince: '',
      selectedCity: '',
      selectedDistrict: ''
    }
  },
  methods: {
    // 地区选择变化
    bindRegionChange(e) {
      console.log('地区选择变化:', e.detail.value)
      
      const value = e.detail.value
      this.selectedProvince = value[0]
      this.selectedCity = value[1]
      this.selectedDistrict = value[2]
      this.selectedAddress = value.join(' ')
      
      console.log('选中的地址信息:', {
        province: this.selectedProvince,
        city: this.selectedCity,
        district: this.selectedDistrict,
        fullAddress: this.selectedAddress
      })
    },
    
    // 确认选择
    confirmSelection() {
      if (!this.selectedAddress) {
        uni.showToast({
          title: '请先选择地区',
          icon: 'none'
        })
        return
      }
      
      console.log('确认选择的地址:', {
        province: this.selectedProvince,
        city: this.selectedCity,
        district: this.selectedDistrict,
        fullAddress: this.selectedAddress
      })
      
      uni.showToast({
        title: '选择成功',
        icon: 'success',
        duration: 2000
      })
      
      // 保存到本地存储
      this.saveToLocalStorage()
    },
    
    // 重置选择
    resetSelection() {
      this.selectedAddress = ''
      this.selectedProvince = ''
      this.selectedCity = ''
      this.selectedDistrict = ''
      
      uni.showToast({
        title: '已重置',
        icon: 'success'
      })
    },
    
    // 保存到本地存储
    saveToLocalStorage() {
      try {
        const addressData = {
          province: this.selectedProvince,
          city: this.selectedCity,
          district: this.selectedDistrict,
          fullAddress: this.selectedAddress,
          timestamp: new Date().getTime()
        }
        
        uni.setStorageSync('userSelectedAddress', addressData)
        console.log('地址已保存到本地存储')
      } catch (error) {
        console.error('保存到本地存储失败:', error)
      }
    }
  }
}
</script>

<style scoped>
.container {
  padding: 30rpx;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 50rpx;
}

.title {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.subtitle {
  display: block;
  font-size: 28rpx;
  color: #666;
}

.picker-section {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.picker-label {
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 20rpx;
}

.picker-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 30rpx;
  background-color: #f8f9fa;
  border: 2rpx solid #e9ecef;
  border-radius: 12rpx;
  transition: all 0.3s;
}

.picker-display:active {
  background-color: #e9ecef;
  border-color: #007aff;
}

.picker-text {
  font-size: 32rpx;
  color: #333;
  flex: 1;
}

.picker-text.placeholder {
  color: #999;
}

.picker-arrow {
  font-size: 24rpx;
  color: #999;
  margin-left: 20rpx;
}

.selected-info {
  margin-bottom: 30rpx;
  animation: fadeInUp 0.5s ease-out;
}

.info-card {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  border-left: 8rpx solid #007aff;
}

.info-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.address-detail {
  background: #f0f7ff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.address-text {
  font-size: 32rpx;
  color: #007aff;
  font-weight: 500;
  line-height: 1.5;
}

.address-parts {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.part-item {
  font-size: 28rpx;
  color: #666;
  line-height: 1.4;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 30rpx;
  text-align: center;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 30rpx;
  opacity: 0.6;
}

.empty-text {
  font-size: 32rpx;
  color: #999;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.empty-desc {
  font-size: 28rpx;
  color: #ccc;
  line-height: 1.5;
}

.button-group {
  display: flex;
  gap: 20rpx;
  margin-top: 40rpx;
}

.btn {
  flex: 1;
  height: 88rpx;
  border-radius: 16rpx;
  font-size: 32rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  font-weight: 500;
}

.btn-primary {
  background: linear-gradient(135deg, #007aff, #0056cc);
  color: white;
  box-shadow: 0 4rpx 20rpx rgba(0, 122, 255, 0.3);
}

.btn-primary:disabled {
  background: #ccc;
  color: #999;
  box-shadow: none;
}

.btn-primary:active:not(:disabled) {
  transform: translateY(2rpx);
}

.btn-secondary {
  background-color: #f8f9fa;
  color: #666;
  border: 2rpx solid #e9ecef;
}

.btn-secondary:disabled {
  background-color: #f8f9fa;
  color: #ccc;
  border-color: #f0f0f0;
}

.btn-secondary:active:not(:disabled) {
  background-color: #e9ecef;
  transform: translateY(2rpx);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 750rpx) {
  .container {
    padding: 20rpx;
  }
  
  .button-group {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>