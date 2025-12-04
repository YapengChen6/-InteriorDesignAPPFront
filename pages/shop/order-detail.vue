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

    <!-- 物流信息 -->
    <view class="section card" v-if="order.orderStatus === 'SHIPPED' || order.orderStatus === 'DELIVERED'">
      <view class="section-title">物流信息</view>
      <view class="field-row" v-if="order.shippingCompany">
        <text class="field-label">物流公司</text>
        <text class="field-value">{{ order.shippingCompany }}</text>
      </view>
      <view class="field-row" v-if="order.trackingNumber">
        <text class="field-label">物流单号</text>
        <text class="field-value">{{ order.trackingNumber }}</text>
      </view>
      <view class="field-row" v-if="order.shippedTime">
        <text class="field-label">发货时间</text>
        <text class="field-value">{{ formatTime(order.shippedTime) }}</text>
      </view>
      <view class="field-row" v-if="order.deliveredTime">
        <text class="field-label">送达时间</text>
        <text class="field-value">{{ formatTime(order.deliveredTime) }}</text>
      </view>
    </view>

    <!-- 售后服务 -->
    <view class="section card" v-if="canApplyAfterSale">
      <view class="section-title">售后服务</view>
      <view class="after-sale-actions">
        <!-- 申请退款/退货 -->
        <button 
          class="action-btn refund-btn" 
          v-if="canRefund"
          @click="applyRefund"
        >
          <text class="btn-icon">💰</text>
          <text class="btn-text">申请退款</text>
        </button>
        <button 
          class="action-btn return-btn" 
          v-if="canReturn"
          @click="applyReturn"
        >
          <text class="btn-icon">📦</text>
          <text class="btn-text">申请退货</text>
        </button>
        <!-- 申请换货 -->
        <button 
          class="action-btn exchange-btn" 
          v-if="canExchange"
          @click="applyExchange"
        >
          <text class="btn-icon">🔄</text>
          <text class="btn-text">申请换货</text>
        </button>
        <!-- 查看售后记录 -->
        <button 
          class="action-btn record-btn" 
          @click="viewAfterSaleRecords"
        >
          <text class="btn-icon">📋</text>
          <text class="btn-text">售后记录</text>
        </button>
        <!-- 联系客服 -->
        <button 
          class="action-btn service-btn" 
          @click="contactService"
        >
          <text class="btn-icon">💬</text>
          <text class="btn-text">联系客服</text>
        </button>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-bar" v-if="showActionButtons">
      <button 
        class="action-button secondary" 
        v-if="order.orderStatus === 'PENDING'"
        @click="cancelOrder"
      >
        取消订单
      </button>
      <button 
        class="action-button secondary" 
        v-if="order.orderStatus === 'PENDING'"
        @click="payOrder"
      >
        立即支付
      </button>
      <button 
        class="action-button primary" 
        v-if="order.orderStatus === 'SHIPPED'"
        @click="confirmReceipt"
      >
        确认收货
      </button>
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
  computed: {
    // 是否可以申请售后
    canApplyAfterSale() {
      const status = this.order.orderStatus
      // 已支付、已发货、已送达的订单可以申请售后
      return status === 'PAID' || status === 'SHIPPED' || status === 'DELIVERED'
    },
    // 是否可以申请退款（已支付但未发货）
    canRefund() {
      return this.order.orderStatus === 'PAID'
    },
    // 是否可以申请退货（已发货或已送达）
    canReturn() {
      return this.order.orderStatus === 'SHIPPED' || this.order.orderStatus === 'DELIVERED'
    },
    // 是否可以申请换货（已送达）
    canExchange() {
      return this.order.orderStatus === 'DELIVERED'
    },
    // 是否显示操作按钮
    showActionButtons() {
      const status = this.order.orderStatus
      return status === 'PENDING' || status === 'SHIPPED'
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
    },
    // 申请退款
    applyRefund() {
      uni.navigateTo({
        url: `/pages/shop/after-sale?orderId=${this.orderId}&type=refund`
      })
    },
    // 申请退货
    applyReturn() {
      uni.navigateTo({
        url: `/pages/shop/after-sale?orderId=${this.orderId}&type=return`
      })
    },
    // 申请换货
    applyExchange() {
      uni.navigateTo({
        url: `/pages/shop/after-sale?orderId=${this.orderId}&type=exchange`
      })
    },
    // 查看售后记录
    viewAfterSaleRecords() {
      uni.navigateTo({
        url: `/pages/shop/after-sale-list?orderId=${this.orderId}`
      })
    },
    // 联系客服
    contactService() {
      if (this.order.shopId) {
        // 跳转到商家聊天页面
        uni.navigateTo({
          url: `/pages/chat/chatDetail?userId=${this.order.shopUserId || ''}&shopId=${this.order.shopId}`
        })
      } else {
        uni.showToast({
          title: '商家信息不存在',
          icon: 'none'
        })
      }
    },
    // 取消订单
    async cancelOrder() {
      uni.showModal({
        title: '确认取消',
        content: '确定要取消该订单吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              uni.showLoading({ title: '处理中...' })
              const result = await orderApi.cancelOrder(this.orderId)
              uni.hideLoading()
              if (result && result.code === 200) {
                uni.showToast({ title: '取消成功', icon: 'success' })
                setTimeout(() => {
                  uni.navigateBack()
                }, 1500)
              } else {
                uni.showToast({ title: result?.msg || '取消失败', icon: 'none' })
              }
            } catch (error) {
              uni.hideLoading()
              console.error('取消订单失败:', error)
              uni.showToast({ title: '取消失败', icon: 'none' })
            }
          }
        }
      })
    },
    // 支付订单
    payOrder() {
      uni.showToast({
        title: '支付功能开发中',
        icon: 'none'
      })
    },
    // 确认收货
    async confirmReceipt() {
      uni.showModal({
        title: '确认收货',
        content: '确认已收到商品吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              uni.showLoading({ title: '处理中...' })
              const result = await orderApi.confirmReceipt(this.orderId)
              uni.hideLoading()
              if (result && result.code === 200) {
                uni.showToast({ title: '确认成功', icon: 'success' })
                this.loadDetail()
              } else {
                uni.showToast({ title: result?.msg || '确认失败', icon: 'none' })
              }
            } catch (error) {
              uni.hideLoading()
              console.error('确认收货失败:', error)
              uni.showToast({ title: '确认失败', icon: 'none' })
            }
          }
        }
      })
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

/* 售后服务样式 */
.after-sale-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 16rpx;
}

.action-btn {
  flex: 1;
  min-width: 140rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24rpx 16rpx;
  border-radius: 12rpx;
  border: 2rpx solid #e4e7ed;
  background: #fff;
  gap: 8rpx;
}

.action-btn:active {
  opacity: 0.8;
  transform: scale(0.98);
}

.btn-icon {
  font-size: 40rpx;
  margin-bottom: 4rpx;
}

.btn-text {
  font-size: 24rpx;
  color: #606266;
}

.refund-btn {
  border-color: #f56c6c;
}

.refund-btn .btn-text {
  color: #f56c6c;
}

.return-btn {
  border-color: #e6a23c;
}

.return-btn .btn-text {
  color: #e6a23c;
}

.exchange-btn {
  border-color: #409eff;
}

.exchange-btn .btn-text {
  color: #409eff;
}

.record-btn {
  border-color: #909399;
}

.record-btn .btn-text {
  color: #909399;
}

.service-btn {
  border-color: #67c23a;
}

.service-btn .btn-text {
  color: #67c23a;
}

/* 操作按钮栏 */
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 16rpx;
  z-index: 100;
}

.action-button {
  flex: 1;
  padding: 24rpx 0;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: 500;
  border: none;
}

.action-button.secondary {
  background: #f5f7fa;
  color: #606266;
}

.action-button.primary {
  background: linear-gradient(135deg, #409eff, #66b1ff);
  color: #fff;
}

.action-button:active {
  opacity: 0.8;
}
</style>


