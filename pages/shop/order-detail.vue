<template>
  <view class="page">
    <view class="section card">
      <view class="section-title">订单状态</view>
      <view class="status-row">
        <text class="status-text">{{ getStatusText(order.orderStatus) }}</text>
        <text class="status-sub" v-if="order.orderNo">订单号：{{ order.orderNo }}</text>
      </view>
      <view class="time-row" v-if="order.createTime">
        <text class="time-text">下单时间：{{ formatTime(order.createTime) }}</text>
      </view>
      <view class="time-row" v-if="order.paymentTime">
        <text class="time-text">支付时间：{{ formatTime(order.paymentTime) }}</text>
      </view>
    </view>

    <view class="section card">
      <view class="section-title">收货信息</view>
      <view class="field-row">
        <text class="field-label">收货人</text>
        <text class="field-value">
          {{ order.contactName || '-' }} {{ order.contactPhone || '' }}
        </text>
      </view>
      <view class="field-row">
        <text class="field-label">收货地址</text>
        <text class="field-value">
          {{ order.shippingAddress || '-' }}
        </text>
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
      <view class="section-title">金额信息</view>
      <view class="field-row">
        <text class="field-label">订单金额</text>
        <text class="field-value highlight">
          ￥{{ formatPrice(order.totalAmount) }}
        </text>
      </view>
      <view class="field-row">
        <text class="field-label">支付方式</text>
        <text class="field-value">
          {{ order.paymentMethod || '微信支付（模拟）' }}
        </text>
      </view>
    </view>
  </view>
</template>

<script>
import * as orderApi from '@/api/product-order.js'

export default {
  name: 'UserOrderDetail',
  data() {
    return {
      orderId: null,
      order: {
        orderItems: []
      },
      loading: false
    }
  },
  onLoad(query) {
    if (query && query.orderId) {
      this.orderId = Number(query.orderId)
      this.loadDetail()
    } else {
      uni.showToast({ title: '订单ID缺失', icon: 'none' })
    }
  },
  methods: {
    async loadDetail() {
      if (!this.orderId) return
      this.loading = true
      try {
        const res = await orderApi.getOrderDetail(this.orderId)
        if (res && res.code === 200 && res.data) {
          this.order = res.data
          if (!this.order.orderItems) {
            this.order.orderItems = []
          }
        } else {
          uni.showToast({ title: res?.msg || '加载详情失败', icon: 'none' })
        }
      } catch (error) {
        console.error('加载订单详情失败:', error)
        uni.showToast({ title: error.message || '加载详情失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    getStatusText(status) {
      const map = {
        PENDING: '待支付',
        PAID: '待发货',
        SHIPPED: '已发货',
        DELIVERED: '已完成',
        CANCELLED: '已取消'
      }
      return map[status] || '未知状态'
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

.status-row {
  display: flex;
  flex-direction: column;
}

.status-text {
  font-size: 34rpx;
  color: #409eff;
  font-weight: 600;
}

.status-sub {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #909399;
}

.time-row {
  margin-top: 8rpx;
}

.time-text {
  font-size: 24rpx;
  color: #909399;
}

.field-row {
  display: flex;
  margin-top: 8rpx;
}

.field-label {
  width: 150rpx;
  font-size: 24rpx;
  color: #909399;
}

.field-value {
  flex: 1;
  font-size: 24rpx;
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
</style>


