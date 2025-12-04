<template>
  <view class="page">
    <view class="section card">
      <view class="section-title">订单信息</view>
      <view class="field-row">
        <text class="field-label">订单号</text>
        <text class="field-value">{{ order.orderNo || '-' }}</text>
      </view>
      <view class="field-row">
        <text class="field-label">订单金额</text>
        <text class="field-value highlight">￥{{ formatPrice(order.totalAmount) }}</text>
      </view>
      <view class="field-row" v-if="order.createTime">
        <text class="field-label">下单时间</text>
        <text class="field-value">{{ formatTime(order.createTime) }}</text>
      </view>
    </view>

    <view class="section card">
      <view class="section-title">商品信息</view>
      <view
        class="item-row"
        v-for="item in order.orderItems"
        :key="item.itemId"
      >
        <view class="item-main">
          <text class="item-name">{{ item.productName }}</text>
          <text class="item-sku" v-if="item.skuDetail">
            {{ formatSkuDetail(item.skuDetail) }}
          </text>
          <view class="item-bottom">
            <text class="item-price">￥{{ formatPrice(item.unitPrice) }}</text>
            <text class="item-qty">x{{ item.quantity }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="section card">
      <view class="section-title">申请类型</view>
      <view class="type-display">
        <text class="type-text">{{ getTypeText() }}</text>
      </view>
    </view>

    <view class="section card">
      <view class="section-title">申请原因</view>
      <view class="reason-list">
        <view
          class="reason-item"
          v-for="reason in reasonOptions"
          :key="reason.value"
          :class="{ active: selectedReason === reason.value }"
          @click="selectReason(reason.value)"
        >
          <text class="reason-text">{{ reason.label }}</text>
        </view>
      </view>
      <view class="custom-reason" v-if="selectedReason === 'OTHER'">
        <textarea
          class="reason-input"
          v-model="customReason"
          placeholder="请详细描述申请原因"
          maxlength="200"
        ></textarea>
      </view>
    </view>

    <view class="section card" v-if="afterSaleType === 'return' || afterSaleType === 'exchange'">
      <view class="section-title">退货/换货说明</view>
      <view class="field-row">
        <text class="field-label">收货地址</text>
        <text class="field-value">{{ order.shippingAddress || '-' }}</text>
      </view>
      <view class="field-row">
        <text class="field-label">联系电话</text>
        <text class="field-value">{{ order.contactPhone || '-' }}</text>
      </view>
      <view class="tip-text">
        <text>💡 退货/换货时，请将商品寄回至上述地址</text>
      </view>
    </view>

    <view class="section card">
      <view class="section-title">上传凭证（可选）</view>
      <view class="upload-area">
        <view
          class="upload-item"
          v-for="(img, index) in imageList"
          :key="index"
        >
          <image :src="img" mode="aspectFill" class="upload-image"></image>
          <view class="delete-btn" @click="deleteImage(index)">
            <text class="delete-icon">×</text>
          </view>
        </view>
        <view class="upload-btn" v-if="imageList.length < 6" @click="chooseImage">
          <text class="upload-icon">+</text>
          <text class="upload-text">上传图片</text>
        </view>
      </view>
    </view>

    <view class="section card">
      <view class="section-title">补充说明</view>
      <textarea
        class="remark-input"
        v-model="remark"
        placeholder="请详细描述问题情况（选填）"
        maxlength="500"
      ></textarea>
    </view>

    <view class="action-bar">
      <button class="submit-btn" @click="submitApplication" :disabled="submitting">
        {{ submitting ? '提交中...' : '提交申请' }}
      </button>
    </view>
  </view>
</template>

<script>
import * as orderApi from '@/api/product-order.js'
import * as afterSaleApi from '@/api/after-sale.js'

export default {
  name: 'AfterSaleApply',
  data() {
    return {
      orderId: null,
      afterSaleType: 'refund', // refund, return, exchange
      order: {
        orderItems: []
      },
      selectedReason: '',
      customReason: '',
      remark: '',
      imageList: [],
      submitting: false,
      reasonOptions: [
        { value: 'QUALITY', label: '质量问题' },
        { value: 'DAMAGED', label: '商品损坏' },
        { value: 'WRONG', label: '发错商品' },
        { value: 'NOT_MATCH', label: '与描述不符' },
        { value: 'SIZE', label: '尺寸不合适' },
        { value: 'NO_NEED', label: '不需要了' },
        { value: 'OTHER', label: '其他原因' }
      ]
    }
  },
  onLoad(query) {
    if (query && query.orderId) {
      this.orderId = Number(query.orderId)
      this.afterSaleType = query.type || 'refund'
      this.loadOrderDetail()
    } else {
      uni.showToast({ title: '订单ID缺失', icon: 'none' })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
  },
  methods: {
    async loadOrderDetail() {
      try {
        uni.showLoading({ title: '加载中...' })
        const res = await orderApi.getOrderDetail(this.orderId)
        if (res && res.code === 200 && res.data) {
          this.order = res.data
          if (!this.order.orderItems) {
            this.order.orderItems = []
          }
        } else {
          uni.showToast({ title: res?.msg || '加载失败', icon: 'none' })
        }
      } catch (error) {
        console.error('加载订单详情失败:', error)
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    },
    getTypeText() {
      const typeMap = {
        refund: '申请退款',
        return: '申请退货',
        exchange: '申请换货'
      }
      return typeMap[this.afterSaleType] || '申请售后'
    },
    selectReason(value) {
      this.selectedReason = value
      if (value !== 'OTHER') {
        this.customReason = ''
      }
    },
    chooseImage() {
      uni.chooseImage({
        count: 6 - this.imageList.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.imageList = [...this.imageList, ...res.tempFilePaths]
        }
      })
    },
    deleteImage(index) {
      this.imageList.splice(index, 1)
    },
    async submitApplication() {
      if (!this.selectedReason) {
        uni.showToast({
          title: '请选择申请原因',
          icon: 'none'
        })
        return
      }

      if (this.selectedReason === 'OTHER' && !this.customReason.trim()) {
        uni.showToast({
          title: '请填写具体原因',
          icon: 'none'
        })
        return
      }

      this.submitting = true
      try {
        uni.showLoading({ title: '提交中...' })
        
        // 上传图片
        let imageUrls = []
        if (this.imageList.length > 0) {
          // TODO: 实现图片上传逻辑
          // imageUrls = await this.uploadImages()
          // 暂时使用本地路径（实际应该上传到服务器）
          imageUrls = this.imageList
        }

        const applicationData = {
          orderId: this.orderId,
          type: this.afterSaleType,
          reason: this.selectedReason === 'OTHER' ? this.customReason : this.selectedReason,
          remark: this.remark,
          images: imageUrls
        }

        const res = await afterSaleApi.createAfterSaleApplication(applicationData)
        
        uni.hideLoading()
        
        if (res && res.code === 200) {
          uni.showToast({
            title: '申请提交成功',
            icon: 'success'
          })
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        } else {
          uni.showToast({
            title: res?.msg || '提交失败',
            icon: 'none'
          })
        }
      } catch (error) {
        uni.hideLoading()
        console.error('提交申请失败:', error)
        uni.showToast({
          title: error.message || '提交失败',
          icon: 'none'
        })
      } finally {
        this.submitting = false
      }
    },
    formatTime(time) {
      if (!time) return '-'
      return new Date(time).toLocaleString()
    },
    formatPrice(value) {
      const num = Number(value)
      if (Number.isNaN(num)) return '0.00'
      return num.toFixed(2)
    },
    formatSkuDetail(skuDetail) {
      if (!skuDetail) return ''
      try {
        const parsed = typeof skuDetail === 'string' ? JSON.parse(skuDetail) : skuDetail
        if (parsed && parsed.combination && parsed.combination.length) {
          return parsed.combination
            .map(item => (item.name && item.value ? `${item.name}:${item.value}` : ''))
            .filter(Boolean)
            .join(' / ')
        }
        if (parsed && parsed.description) {
          return parsed.description
        }
      } catch (e) {
        // ignore parse error
      }
      return skuDetail
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24rpx;
  padding-bottom: 200rpx;
  box-sizing: border-box;
  background-color: #f5f7fa;
}

.section {
  margin-bottom: 20rpx;
}

.card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.03);
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16rpx;
}

.field-row {
  display: flex;
  margin-top: 12rpx;
}

.field-label {
  width: 150rpx;
  font-size: 26rpx;
  color: #909399;
}

.field-value {
  flex: 1;
  font-size: 26rpx;
  color: #606266;
}

.field-value.highlight {
  font-size: 30rpx;
  color: #f56c6c;
  font-weight: 600;
}

.item-row {
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f2f2f2;
}

.item-row:last-child {
  border-bottom-width: 0;
}

.item-main {
  display: flex;
  flex-direction: column;
}

.item-name {
  font-size: 26rpx;
  color: #303133;
}

.item-sku {
  font-size: 22rpx;
  color: #909399;
  margin-top: 4rpx;
}

.item-bottom {
  display: flex;
  justify-content: space-between;
  margin-top: 8rpx;
}

.item-price {
  font-size: 26rpx;
  color: #f56c6c;
}

.item-qty {
  font-size: 24rpx;
  color: #909399;
}

.type-display {
  padding: 20rpx;
  background: #f0f9ff;
  border-radius: 12rpx;
  border-left: 4rpx solid #409eff;
}

.type-text {
  font-size: 28rpx;
  color: #409eff;
  font-weight: 600;
}

.reason-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.reason-item {
  padding: 20rpx;
  border: 2rpx solid #e4e7ed;
  border-radius: 12rpx;
  background: #fff;
}

.reason-item.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.reason-text {
  font-size: 26rpx;
  color: #606266;
}

.reason-item.active .reason-text {
  color: #409eff;
  font-weight: 500;
}

.custom-reason {
  margin-top: 16rpx;
}

.reason-input {
  width: 100%;
  min-height: 120rpx;
  padding: 16rpx;
  border: 2rpx solid #e4e7ed;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #303133;
  box-sizing: border-box;
}

.tip-text {
  margin-top: 16rpx;
  padding: 16rpx;
  background: #fff7e6;
  border-radius: 12rpx;
  border-left: 4rpx solid #fa8c16;
}

.tip-text text {
  font-size: 24rpx;
  color: #fa8c16;
  line-height: 1.6;
}

.upload-area {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.upload-item {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  overflow: hidden;
}

.upload-image {
  width: 100%;
  height: 100%;
}

.delete-btn {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 40rpx;
  height: 40rpx;
  background: #f56c6c;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-icon {
  color: #fff;
  font-size: 28rpx;
  font-weight: 300;
}

.upload-btn {
  width: 160rpx;
  height: 160rpx;
  border: 2rpx dashed #d9d9d9;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.upload-icon {
  font-size: 48rpx;
  color: #999;
}

.upload-text {
  font-size: 24rpx;
  color: #999;
}

.remark-input {
  width: 100%;
  min-height: 200rpx;
  padding: 16rpx;
  border: 2rpx solid #e4e7ed;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #303133;
  box-sizing: border-box;
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.submit-btn {
  width: 100%;
  padding: 24rpx 0;
  background: linear-gradient(135deg, #409eff, #66b1ff);
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 30rpx;
  font-weight: 500;
}

.submit-btn:disabled {
  opacity: 0.6;
}

.submit-btn:active {
  opacity: 0.8;
}
</style>
