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

    <view class="section card" v-if="showLogisticsSection">
      <view class="section-title">物流信息</view>
      <view class="field-row">
        <text class="field-label">物流公司</text>
        <text class="field-value">{{ order.shippingCompany || '-' }}</text>
      </view>
      <view class="field-row">
        <text class="field-label">物流单号</text>
        <text class="field-value">{{ order.trackingNumber || '-' }}</text>
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

    <view class="action-bar" v-if="pageType === 'user'">
      <button
        class="action-btn primary"
        v-if="order.orderStatus === 'PENDING'"
        @click="handlePayOrder"
      >确认付款</button>
      <button
        class="action-btn primary"
        v-else-if="order.orderStatus === 'SHIPPED'"
        @click="handleConfirmReceipt"
      >确认收货</button>
    </view>

    <view class="action-bar" v-else-if="pageType === 'shop'">
      <button
        class="action-btn primary"
        v-if="order.orderStatus === 'PAID'"
        @click="openShipPopup"
      >去发货</button>
    </view>

    <uni-popup ref="shipPopup" type="center">
      <view class="ship-dialog">
        <view class="ship-title">发货信息</view>
      <view class="ship-item">
        <text class="ship-label">物流公司</text>
        <uni-easyinput
          class="ship-input"
          type="text"
          v-model="shipForm.shippingCompany"
          placeholder="请输入物流公司"
        />
      </view>
      <view class="ship-item">
        <text class="ship-label">物流单号</text>
        <uni-easyinput
          class="ship-input"
          type="text"
          v-model="shipForm.trackingNumber"
          placeholder="请输入物流单号"
        />
      </view>
        <view class="ship-actions">
          <button class="ship-btn ghost" @click="closeShipPopup">取消</button>
          <button class="ship-btn primary" :disabled="saving" @click="submitShip">
            {{ saving ? '提交中...' : '确认发货' }}
          </button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
const ORDER_EVENT = 'productOrderUpdated'
import * as orderApi from '@/api/product-order.js'

export default {
  name: 'ShopOrderDetail',
  data() {
    return {
      orderId: null,
      pageType: 'user',
      order: {
        orderItems: []
      },
      loading: false,
      saving: false,
      shipForm: {
        shippingCompany: '',
        trackingNumber: ''
      }
    }
  },
  onLoad(query) {
    if (query && (query.id || query.orderId)) {
      this.orderId = Number(query.id || query.orderId)
      if (query.type) {
        this.pageType = query.type
      }
      this.loadDetail()
      uni.$on(ORDER_EVENT, this.handleOrderEvent)
    } else {
      uni.showToast({ title: '订单ID缺失', icon: 'none' })
    }
  },
  onUnload() {
    uni.$off(ORDER_EVENT, this.handleOrderEvent)
  },
  computed: {
    showLogisticsSection() {
      if (!this.order) return false
      return Boolean(
        this.order.shippingCompany ||
        this.order.trackingNumber ||
        this.order.shippedTime ||
        this.order.deliveredTime
      )
    }
  },
  methods: {
    async loadDetail() {
      if (!this.orderId) return
      this.loading = true
      try {
        const fetcher =
          this.pageType === 'shop' ? orderApi.getShopOrderDetail : orderApi.getOrderDetail
        const res = await fetcher(this.orderId)
        if (res && res.code === 200 && res.data) {
          this.order = res.data
          if (!Array.isArray(this.order.orderItems)) {
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
    handleOrderEvent() {
      this.loadDetail()
    },
    notifyOrderChange() {
      uni.$emit(ORDER_EVENT)
    },
    openShipPopup() {
      this.shipForm.shippingCompany = this.order.shippingCompany || ''
      this.shipForm.trackingNumber = this.order.trackingNumber || ''
      this.$refs.shipPopup && this.$refs.shipPopup.open()
    },
    closeShipPopup() {
      this.$refs.shipPopup && this.$refs.shipPopup.close()
      this.shipForm.shippingCompany = ''
      this.shipForm.trackingNumber = ''
    },
    async submitShip() {
      if (!this.orderId) return
      if (!this.shipForm.shippingCompany && !this.shipForm.trackingNumber) {
        uni.showToast({ title: '请至少填写一项物流信息', icon: 'none' })
        return
      }
      this.saving = true
      uni.showLoading({ title: '提交中...' })
      try {
        const res = await orderApi.shipOrder(
          this.orderId,
          this.shipForm.shippingCompany,
          this.shipForm.trackingNumber
        )
        if (res && res.code === 200) {
          uni.showToast({ title: '发货成功', icon: 'success' })
          this.closeShipPopup()
          this.notifyOrderChange()
        } else {
          uni.showToast({ title: res?.msg || '发货失败', icon: 'none' })
        }
      } catch (error) {
        console.error('发货失败:', error)
        uni.showToast({ title: error.message || '发货失败', icon: 'none' })
      } finally {
        this.saving = false
        uni.hideLoading()
      }
    },
    handleConfirmReceipt() {
      if (!this.orderId || this.pageType !== 'user') return
      uni.showModal({
        title: '确认收货',
        content: '确认已收到货物吗？',
        success: async res => {
          if (!res.confirm) return
          try {
            uni.showLoading({ title: '提交中...' })
            const result = await orderApi.confirmReceipt(this.orderId)
            if (result && result.code === 200) {
              uni.showToast({ title: '已确认收货', icon: 'success' })
              this.notifyOrderChange()
            } else {
              uni.showToast({ title: result?.msg || '操作失败', icon: 'none' })
            }
          } catch (error) {
            console.error('确认收货失败:', error)
            uni.showToast({ title: error.message || '操作失败', icon: 'none' })
          } finally {
            uni.hideLoading()
          }
        }
      })
    },
    handlePayOrder() {
      if (!this.orderId || this.pageType !== 'user') return
      uni.showModal({
        title: '确认付款',
        content: '确定要支付该订单吗？',
        success: async res => {
          if (!res.confirm) return
          try {
            uni.showLoading({ title: '付款中...' })
            const result = await orderApi.payOrder(this.orderId)
            if (result && result.code === 200) {
              uni.showToast({ title: '付款成功', icon: 'success' })
              this.notifyOrderChange()
            } else {
              uni.showToast({ title: result?.msg || '付款失败', icon: 'none' })
            }
          } catch (error) {
            console.error('付款失败:', error)
            uni.showToast({ title: error.message || '付款失败', icon: 'none' })
          } finally {
            uni.hideLoading()
          }
        }
      })
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

.action-bar {
  margin-top: 20rpx;
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
}

.action-btn {
  padding: 16rpx 36rpx;
  border-radius: 999rpx;
  border: none;
  font-size: 26rpx;
  background-color: #f4f4f5;
  color: #606266;
}

.action-btn.primary {
  background-color: #409eff;
  color: #fff;
}

.ship-dialog {
  width: 540rpx;
  background-color: #fff;
  border-radius: 20rpx;
  padding: 32rpx;
  box-sizing: border-box;
}

.ship-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 20rpx;
  color: #303133;
}

.ship-item {
  margin-bottom: 20rpx;
}

.ship-label {
  font-size: 24rpx;
  color: #606266;
  margin-bottom: 8rpx;
  display: block;
}

.ship-input {
  width: 100%;
  border: 1rpx solid #e4e7ed;
  border-radius: 12rpx;
  padding: 16rpx;
  font-size: 26rpx;
  box-sizing: border-box;
}

.ship-actions {
  margin-top: 10rpx;
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
}

.ship-btn {
  padding: 16rpx 30rpx;
  border-radius: 999rpx;
  border: none;
  font-size: 26rpx;
}

.ship-btn.ghost {
  background-color: #f4f4f5;
  color: #606266;
}

.ship-btn.primary {
  background-color: #409eff;
  color: #fff;
}
</style>


