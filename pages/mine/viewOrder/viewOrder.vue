<template>
  <view class="page">
    <!-- 顶部栏 -->
    <view class="header">
      <view class="header-title">我的订单</view>
    </view>

    <!-- 订单状态筛选 -->
    <view class="status-filter">
      <scroll-view class="filter-scroll" scroll-x="true" :show-scrollbar="false">
        <view class="filter-list">
          <view
            class="filter-item"
            :class="{ active: activeStatus === '' }"
            @click="changeStatus('')"
          >
            <text>全部</text>
          </view>
          <view
            class="filter-item"
            :class="{ active: activeStatus === 'PENDING' }"
            @click="changeStatus('PENDING')"
          >
            <text>待支付</text>
          </view>
          <view
            class="filter-item"
            :class="{ active: activeStatus === 'PAID' }"
            @click="changeStatus('PAID')"
          >
            <text>待发货</text>
          </view>
          <view
            class="filter-item"
            :class="{ active: activeStatus === 'SHIPPED' }"
            @click="changeStatus('SHIPPED')"
          >
            <text>已发货</text>
          </view>
          <view
            class="filter-item"
            :class="{ active: activeStatus === 'DELIVERED' }"
            @click="changeStatus('DELIVERED')"
          >
            <text>已完成</text>
          </view>
          <view
            class="filter-item"
            :class="{ active: activeStatus === 'CANCELLED' }"
            @click="changeStatus('CANCELLED')"
          >
            <text>已取消</text>
          </view>
          <view
            class="filter-item"
            :class="{ active: activeStatus === 'AFTER_SALE' }"
            @click="changeStatus('AFTER_SALE')"
          >
            <text>售后</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 订单列表 -->
    <scroll-view
      class="order-list"
      scroll-y="true"
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 空状态 -->
      <view v-if="!loading && orderList.length === 0" class="empty-state">
        <view class="empty-icon">🧾</view>
        <view class="empty-text">暂无订单</view>
        <view class="empty-desc">快去购物车结算一笔订单吧</view>
      </view>

      <!-- 加载状态 -->
      <view v-if="loading && orderList.length === 0" class="loading-state">
        <text class="loading-text">加载中...</text>
      </view>

      <!-- 订单项 -->
      <view class="order-card" v-for="order in orderList" :key="order.orderId">
        <view class="order-header">
          <view class="order-info">
            <text class="order-no">订单号：{{ order.orderNo }}</text>
            <text class="order-time">{{ formatTime(order.createTime) }}</text>
            <!-- 售后标签：如果有售后记录则显示 -->
            <view class="after-sale-tag" v-if="order.hasAfterSale">
              <text class="after-sale-text">有售后</text>
            </view>
          </view>
          <view :class="['status-pill', getStatusClass(order.orderStatus)]">
            {{ getStatusText(order.orderStatus) }}
          </view>
        </view>

        <!-- 商品列表 -->
        <view class="goods-list" @click="viewOrderDetail(order.orderId)">
          <view
            class="goods-row"
            v-for="item in order.orderItems"
            :key="item.itemId"
          >
            <view class="goods-info">
              <text class="goods-name">{{ item.productName }}</text>
              <text class="goods-sku" v-if="item.skuDetail">{{ formatSkuDetail(item.skuDetail) }}</text>
              <view class="goods-price-row">
                <text class="goods-price">￥{{ formatPrice(item.unitPrice) }}</text>
                <text class="goods-qty">x{{ item.quantity }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 收货信息 -->
        <view class="shipping-info">
          <text class="shipping-label">收货人：</text>
          <text class="shipping-text">{{ order.contactName || '-' }} {{ order.contactPhone || '' }}</text>
        </view>
        <view class="shipping-info">
          <text class="shipping-label">收货地址：</text>
          <text class="shipping-text">{{ order.shippingAddress || '-' }}</text>
        </view>

        <!-- 金额与操作 -->
        <view class="order-footer">
          <view class="amount-row">
            <text class="amount-label">订单金额：</text>
            <text class="amount-value">￥{{ formatPrice(order.totalAmount) }}</text>
          </view>
          <view class="action-row">
            <!-- 待支付：显示确认付款/取消 -->
            <template v-if="order.orderStatus === 'PENDING'">
              <button class="btn ghost" @click.stop="cancelOrder(order.orderId)">取消订单</button>
              <button class="btn primary" @click.stop="payOrder(order.orderId)">确认付款</button>
            </template>
            <!-- 已发货：显示确认收货 -->
            <template v-else-if="order.orderStatus === 'SHIPPED'">
              <button class="btn ghost" @click.stop="viewOrderDetail(order.orderId)">查看详情</button>
              <button class="btn primary" @click.stop="confirmReceipt(order.orderId)">确认收货</button>
            </template>
            <!-- 已支付/已发货/已完成：显示售后按钮 -->
            <template v-else-if="order.orderStatus === 'PAID' || order.orderStatus === 'SHIPPED' || order.orderStatus === 'DELIVERED'">
              <button class="btn ghost" @click.stop="viewOrderDetail(order.orderId)">查看详情</button>
              <button class="btn after-sale-btn" @click.stop="viewAfterSale(order.orderId)">售后服务</button>
            </template>
            <!-- 其他状态：仅查看 -->
            <template v-else>
              <button class="btn ghost" @click.stop="viewOrderDetail(order.orderId)">查看详情</button>
            </template>
          </view>
        </view>
      </view>
    </scroll-view>
	</view>
</template>

<script>
const ORDER_EVENT = 'productOrderUpdated'

import * as orderApi from '@/api/product-order.js'
import * as afterSaleApi from '@/api/after-sale.js'

	export default {
  name: 'UserProductOrderList',
		data() {
			return {
      orderList: [],
      loading: false,
      refreshing: false,
      activeStatus: ''
			}
		},
  onLoad() {
    this.loadOrders()
    uni.$on(ORDER_EVENT, this.handleOrderEvent)
  },
  onUnload() {
    uni.$off(ORDER_EVENT, this.handleOrderEvent)
		},
		methods: {
    async loadOrders() {
      this.loading = true
      try {
        // 售后筛选需要先加载全部订单，再前端按 hasAfterSale 过滤
        const queryStatus = this.activeStatus && this.activeStatus !== 'AFTER_SALE'
          ? this.activeStatus
          : undefined

        const res = await orderApi.getUserOrderList(queryStatus)
        if (res && res.code === 200) {
          this.orderList = res.data || []
          // 加载每个订单的售后状态
          await this.loadAfterSaleStatus()

          // 如果当前是“售后”标签，只保留有售后的订单
          if (this.activeStatus === 'AFTER_SALE') {
            this.orderList = (this.orderList || []).filter(order => order.hasAfterSale)
          }
        } else {
          uni.showToast({ title: res?.msg || '加载订单失败', icon: 'none' })
        }
      } catch (error) {
        console.error('加载订单失败:', error)
        uni.showToast({ title: error.message || '加载订单失败', icon: 'none' })
      } finally {
        this.loading = false
        this.refreshing = false
      }
    },
    async loadAfterSaleStatus() {
      // 为每个订单检查是否有售后记录
      for (let order of this.orderList) {
        try {
          const afterSaleRes = await afterSaleApi.getAfterSaleList(order.orderId)
          if (afterSaleRes && afterSaleRes.code === 200 && afterSaleRes.data && afterSaleRes.data.length > 0) {
            order.hasAfterSale = true
          } else {
            order.hasAfterSale = false
          }
        } catch (error) {
          console.error(`加载订单 ${order.orderId} 售后记录失败:`, error)
          order.hasAfterSale = false
        }
      }
    },
    viewAfterSale(orderId) {
      uni.navigateTo({
        url: `/pages/shop/after-sale-list?orderId=${orderId}`
      })
    },
    handleOrderEvent() {
      this.loadOrders()
    },
    notifyOrderChange() {
      uni.$emit(ORDER_EVENT)
    },
    changeStatus(status) {
      this.activeStatus = status
      this.loadOrders()
    },
    onRefresh() {
      this.refreshing = true
      this.loadOrders()
    },
    loadMore() {
      // 当前后端不分页，此处保留占位
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
    // 规范化展示 SKU 文本，兼容字符串/对象/数组
    formatSkuDetail(skuDetail) {
      if (!skuDetail) return ''
      try {
        const parsed = typeof skuDetail === 'string' ? JSON.parse(skuDetail) : skuDetail
        // 新版结构 { type: 'multi', combination: [{name, value}], description, skuName }
        if (parsed?.combination?.length) {
          return parsed.combination
            .map(item => `${item.name || ''}:${item.value || ''}`)
            .filter(Boolean)
            .join(' / ')
        }
        if (parsed?.skuName) return parsed.skuName
        if (parsed?.description) return parsed.description
        if (Array.isArray(parsed)) {
          return parsed
            .map(item => `${item.name || ''}:${item.value || ''}`)
            .filter(Boolean)
            .join(' / ')
        }
      } catch (e) {
        // ignore parse error, fallback to raw
      }
      return typeof skuDetail === 'string' ? skuDetail : JSON.stringify(skuDetail)
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
    getStatusClass(status) {
      const map = {
        PENDING: 'pending',
        PAID: 'paid',
        SHIPPED: 'shipped',
        DELIVERED: 'delivered',
        CANCELLED: 'cancelled'
      }
      return map[status] || ''
    },
    viewOrderDetail(orderId) {
      uni.navigateTo({
        url: `/pages/shop/order-detail?orderId=${orderId}`
      })
    },
    async payOrder(orderId) {
      uni.showModal({
        title: '确认付款',
        content: '确定要支付该订单吗？',
        success: async res => {
          if (!res.confirm) return
          try {
            uni.showLoading({ title: '付款中...' })
            const result = await orderApi.payOrder(orderId)
            uni.hideLoading()
            if (result && result.code === 200) {
              uni.showToast({ title: '付款成功', icon: 'success' })
              this.notifyOrderChange()
            } else {
              uni.showToast({ title: result?.msg || '付款失败', icon: 'none' })
            }
          } catch (error) {
            uni.hideLoading()
            console.error('付款失败:', error)
            uni.showToast({ title: error.message || '付款失败', icon: 'none' })
          }
        }
      })
    },
    async confirmReceipt(orderId) {
      uni.showModal({
        title: '确认收货',
        content: '确认已收到货物吗？',
        success: async res => {
          if (!res.confirm) return
          try {
            uni.showLoading({ title: '提交中...' })
            const result = await orderApi.confirmReceipt(orderId)
            uni.hideLoading()
            if (result && result.code === 200) {
              uni.showToast({ title: '已确认收货', icon: 'success' })
              this.notifyOrderChange()
            } else {
              uni.showToast({ title: result?.msg || '操作失败', icon: 'none' })
            }
          } catch (error) {
            uni.hideLoading()
            console.error('确认收货失败:', error)
            uni.showToast({ title: error.message || '操作失败', icon: 'none' })
          }
        }
      })
    },
    async cancelOrder(orderId) {
      uni.showModal({
        title: '取消订单',
        content: '确定要取消该订单吗？',
        success: async res => {
          if (!res.confirm) return
          try {
            uni.showLoading({ title: '取消中...' })
            const result = await orderApi.cancelOrder(orderId)
            uni.hideLoading()
            if (result && result.code === 200) {
              uni.showToast({ title: '订单已取消', icon: 'success' })
              this.notifyOrderChange()
            } else {
              uni.showToast({ title: result?.msg || '取消失败', icon: 'none' })
            }
          } catch (error) {
            uni.hideLoading()
            console.error('取消订单失败:', error)
            uni.showToast({ title: error.message || '取消失败', icon: 'none' })
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
  background-color: #f5f7fa;
  padding: 24rpx;
  box-sizing: border-box;
}

.header {
  padding: 12rpx 0 24rpx;
}

.header-title {
  font-size: 36rpx;
  font-weight: 600;
  text-align: center;
  color: #303133;
}

.status-filter {
  margin: 12rpx 0 16rpx;
}

.filter-scroll {
  white-space: nowrap;
}

.filter-list {
  display: flex;
}

.filter-item {
  padding: 12rpx 24rpx;
  margin-right: 16rpx;
  border-radius: 999rpx;
  background-color: #ffffff;
  font-size: 26rpx;
  color: #606266;
}

.filter-item.active {
  background-color: #409eff;
  color: #fff;
}

.order-list {
  margin-top: 8rpx;
  max-height: calc(100vh - 160rpx);
}

.order-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.03);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.order-info {
  display: flex;
  flex-direction: column;
}

.order-no {
  font-size: 26rpx;
  color: #303133;
}

.order-time {
  font-size: 22rpx;
  color: #909399;
  margin-top: 4rpx;
}

.status-pill {
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  color: #fff;
}

.status-pill.pending {
  background-color: #e6a23c;
}
.status-pill.paid {
  background-color: #409eff;
}
.status-pill.shipped {
  background-color: #67c23a;
}
.status-pill.delivered {
  background-color: #13ce66;
}
.status-pill.cancelled {
  background-color: #909399;
}

.goods-list {
  border-top: 1rpx solid #f2f2f2;
  border-bottom: 1rpx solid #f2f2f2;
  padding: 12rpx 0;
  margin-bottom: 8rpx;
}

.goods-row {
  display: flex;
  padding: 8rpx 0;
}

.goods-info {
  flex: 1;
}

.goods-name {
  font-size: 26rpx;
  color: #303133;
}

.goods-sku {
  font-size: 22rpx;
  color: #909399;
  margin-top: 4rpx;
  display: block;
}

.goods-price-row {
  display: flex;
  justify-content: space-between;
  margin-top: 8rpx;
}

.goods-price {
  font-size: 26rpx;
  color: #f56c6c;
}

.goods-qty {
  font-size: 24rpx;
  color: #909399;
}

.shipping-info {
  display: flex;
  margin-top: 4rpx;
}

.shipping-label {
  font-size: 22rpx;
  color: #909399;
  width: 150rpx;
}

.shipping-text {
  font-size: 22rpx;
  color: #606266;
  flex: 1;
}

.order-footer {
  margin-top: 12rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount-row {
  display: flex;
  align-items: center;
}

.amount-label {
  font-size: 24rpx;
  color: #909399;
}

.amount-value {
  font-size: 28rpx;
  color: #f56c6c;
  margin-left: 4rpx;
}

.action-row {
  display: flex;
  gap: 12rpx;
}

.btn {
  padding: 10rpx 20rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  border: none;
}

.btn.ghost {
  background-color: #f4f4f5;
  color: #606266;
}

.btn.primary {
  background-color: #409eff;
  color: #fff;
}

.empty-state {
  padding: 120rpx 40rpx;
  text-align: center;
  color: #909399;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 30rpx;
  margin-bottom: 8rpx;
}

.empty-desc {
  font-size: 24rpx;
}

.loading-state {
  padding: 80rpx 0;
  text-align: center;
  color: #909399;
}

.loading-text {
  font-size: 26rpx;
}

/* 售后状态标签 */
.after-sale-tag {
  margin-top: 8rpx;
  display: inline-block;
  padding: 4rpx 12rpx;
  background: #fff7e6;
  border-radius: 12rpx;
  border: 1rpx solid #fa8c16;
}

.after-sale-text {
  font-size: 20rpx;
  color: #fa8c16;
}

.btn.after-sale-btn {
  background-color: #fa8c16;
  color: #fff;
}
</style>
