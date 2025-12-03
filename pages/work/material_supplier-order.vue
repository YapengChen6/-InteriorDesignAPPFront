<template>
  <view class="container">
    <!-- 顶部标题栏 -->
    <view class="header-section">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">←</text>
        <text class="back-text">返回</text>
      </view>
      <view class="header-title">我的订单</view>
      <view class="header-placeholder"></view>
    </view>
    
    <!-- 订单状态筛选 -->
    <view class="status-filter">
      <scroll-view class="filter-scroll" scroll-x="true">
        <view class="filter-list">
          <view class="filter-item" 
            :class="{ active: activeStatus === '' }" 
            @click="changeStatus('')">
            <text>全部</text>
          </view>
          <view class="filter-item" 
            :class="{ active: activeStatus === 'PENDING' }" 
            @click="changeStatus('PENDING')">
            <text>待支付</text>
          </view>
          <view class="filter-item" 
            :class="{ active: activeStatus === 'PAID' }" 
            @click="changeStatus('PAID')">
            <text>待发货</text>
          </view>
          <view class="filter-item" 
            :class="{ active: activeStatus === 'SHIPPED' }" 
            @click="changeStatus('SHIPPED')">
            <text>已发货</text>
          </view>
          <view class="filter-item" 
            :class="{ active: activeStatus === 'DELIVERED' }" 
            @click="changeStatus('DELIVERED')">
            <text>已完成</text>
          </view>
          <view class="filter-item" 
            :class="{ active: activeStatus === 'CANCELLED' }" 
            @click="changeStatus('CANCELLED')">
            <text>已取消</text>
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
        <view class="empty-icon">📦</view>
        <view class="empty-text">暂无订单</view>
        <view class="empty-desc">您还没有任何订单</view>
      </view>
      
      <!-- 加载状态 -->
      <view v-if="loading && orderList.length === 0" class="loading-state">
        <text class="loading-text">加载中...</text>
      </view>
      
      <!-- 订单项 -->
      <view class="order-item" v-for="order in orderList" :key="order.orderId">
        <view class="order-header">
          <view class="order-info">
            <text class="order-number">订单号：{{ order.orderNo }}</text>
            <text class="order-time">{{ formatTime(order.createTime) }}</text>
          </view>
          <view :class="['order-status', getStatusClass(order.orderStatus)]">
            {{ getStatusText(order.orderStatus) }}
          </view>
        </view>
        
        <view class="order-content" @click="viewOrderDetail(order.orderId)">
          <!-- 订单商品列表 -->
          <view class="order-items">
            <view 
              class="order-item-goods" 
              v-for="item in order.orderItems" 
              :key="item.itemId"
            >
              <image 
                class="goods-image" 
                :src="getProductImage(item)" 
                mode="aspectFill"
              ></image>
              <view class="goods-info">
                <text class="goods-name">{{ item.productName }}</text>
                <text class="goods-spec" v-if="item.skuDetail">{{ formatSkuDetail(item.skuDetail) }}</text>
                <view class="goods-price-row">
                  <text class="goods-price">￥{{ formatPrice(item.unitPrice) }}</text>
                  <text class="goods-quantity">x{{ item.quantity }}</text>
                </view>
              </view>
            </view>
          </view>
          
          <!-- 收货信息 -->
          <view class="shipping-info">
            <text class="shipping-label">收货地址：</text>
            <text class="shipping-text">{{ order.shippingAddress }}</text>
          </view>
          <view class="shipping-info" v-if="order.contactName">
            <text class="shipping-label">收货人：</text>
            <text class="shipping-text">{{ order.contactName }} {{ order.contactPhone }}</text>
          </view>
        </view>
        
        <view class="order-footer">
          <view class="order-amount">
            <text class="amount-label">订单金额：</text>
            <text class="amount-value">￥{{ formatPrice(order.totalAmount) }}</text>
          </view>
          <view class="order-actions">
            <!-- 待支付状态 -->
            <template v-if="order.orderStatus === 'PENDING'">
              <button class="btn secondary" @click.stop="viewOrderDetail(order.orderId)">
                查看详情
              </button>
            </template>
            
            <!-- 已支付状态（待发货） -->
            <template v-else-if="order.orderStatus === 'PAID'">
              <button class="btn secondary" @click.stop="viewOrderDetail(order.orderId)">
                查看详情
              </button>
              <button class="btn primary" @click.stop="handleShipOrder(order)">
                发货
              </button>
            </template>
            
            <!-- 已发货状态 -->
            <template v-else-if="order.orderStatus === 'SHIPPED'">
              <button class="btn secondary" @click.stop="viewOrderDetail(order.orderId)">
                查看详情
              </button>
            </template>
            
            <!-- 其他状态 -->
            <template v-else>
              <button class="btn secondary" @click.stop="viewOrderDetail(order.orderId)">
                查看详情
              </button>
            </template>
          </view>
        </view>
      </view>
    </scroll-view>
    
    <!-- 发货弹窗 -->
    <uni-popup ref="shipPopup" type="dialog">
      <uni-popup-dialog 
        type="input" 
        placeholder="请输入物流公司"
        v-model="shipForm.shippingCompany"
        title="发货信息"
        @confirm="confirmShip"
        @close="cancelShip"
      >
        <view class="ship-form">
          <view class="form-item">
            <text class="form-label">物流公司：</text>
            <input 
              class="form-input" 
              v-model="shipForm.shippingCompany" 
              placeholder="请输入物流公司名称"
            />
          </view>
          <view class="form-item">
            <text class="form-label">物流单号：</text>
            <input 
              class="form-input" 
              v-model="shipForm.trackingNumber" 
              placeholder="请输入物流单号"
            />
          </view>
        </view>
      </uni-popup-dialog>
    </uni-popup>
  </view>
</template>

<script>
import * as orderApi from '@/api/product-order.js'

export default {
  data() {
    return {
      orderList: [],
      loading: false,
      refreshing: false,
      activeStatus: '', // 当前选中的订单状态
      currentOrder: null, // 当前要发货的订单
      shipForm: {
        shippingCompany: '',
        trackingNumber: ''
      }
    }
  },
  
  onLoad() {
    this.loadOrders()
  },
  
  methods: {
    // 加载订单列表
    async loadOrders() {
      this.loading = true
      try {
        const res = await orderApi.getShopOrderList(this.activeStatus || undefined)
        if (res && res.code === 200) {
          this.orderList = res.data || []
          console.log('订单列表加载成功:', this.orderList)
        } else {
          uni.showToast({
            title: res?.msg || '加载订单失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('加载订单失败:', error)
        uni.showToast({
          title: '加载订单失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
        this.refreshing = false
      }
    },
    
    // 切换订单状态
    changeStatus(status) {
      this.activeStatus = status
      this.loadOrders()
    },
    
    // 下拉刷新
    onRefresh() {
      this.refreshing = true
      this.loadOrders()
    },
    
    // 加载更多
    loadMore() {
      // TODO: 实现分页加载
    },
    
    // 查看订单详情
    viewOrderDetail(orderId) {
      uni.navigateTo({
        url: `/pages/order/detail?id=${orderId}&type=shop`
      })
    },
    
    // 处理发货
    handleShipOrder(order) {
      this.currentOrder = order
      this.shipForm.shippingCompany = ''
      this.shipForm.trackingNumber = ''
      this.$refs.shipPopup.open()
    },
    
    // 确认发货
    async confirmShip() {
      if (!this.currentOrder) return
      
      if (!this.shipForm.shippingCompany && !this.shipForm.trackingNumber) {
        uni.showToast({
          title: '请至少填写物流公司或物流单号',
          icon: 'none'
        })
        return
      }
      
      try {
        uni.showLoading({ title: '发货中...' })
        const res = await orderApi.shipOrder(
          this.currentOrder.orderId,
          this.shipForm.shippingCompany,
          this.shipForm.trackingNumber
        )
        
        uni.hideLoading()
        
        if (res && res.code === 200) {
          uni.showToast({
            title: '发货成功',
            icon: 'success'
          })
          this.$refs.shipPopup.close()
          this.loadOrders()
        } else {
          uni.showToast({
            title: res?.msg || '发货失败',
            icon: 'none'
          })
        }
      } catch (error) {
        uni.hideLoading()
        console.error('发货失败:', error)
        uni.showToast({
          title: '发货失败',
          icon: 'none'
        })
      }
    },
    
    // 取消发货
    cancelShip() {
      this.currentOrder = null
      this.shipForm.shippingCompany = ''
      this.shipForm.trackingNumber = ''
    },
    
    // 获取订单状态文本
    getStatusText(status) {
      const statusMap = {
        'PENDING': '待支付',
        'PAID': '待发货',
        'SHIPPED': '已发货',
        'DELIVERED': '已完成',
        'CANCELLED': '已取消'
      }
      return statusMap[status] || '未知状态'
    },
    
    // 获取订单状态样式类
    getStatusClass(status) {
      const classMap = {
        'PENDING': 'status-pending',
        'PAID': 'status-paid',
        'SHIPPED': 'status-shipped',
        'DELIVERED': 'status-delivered',
        'CANCELLED': 'status-cancelled'
      }
      return classMap[status] || ''
    },
    
    // 格式化时间
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hour = String(date.getHours()).padStart(2, '0')
      const minute = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day} ${hour}:${minute}`
    },
    
    // 格式化价格
    formatPrice(price) {
      if (!price && price !== 0) return '0.00'
      const num = Number(price)
      if (Number.isNaN(num)) return '0.00'
      return num.toFixed(2)
    },
    
    // 格式化SKU详情
    formatSkuDetail(skuDetail) {
      if (!skuDetail) return ''
      try {
        const parsed = typeof skuDetail === 'string' ? JSON.parse(skuDetail) : skuDetail
        if (parsed?.combination?.length) {
          return parsed.combination
            .map(item => `${item.name || ''}:${item.value || ''}`)
            .filter(Boolean)
            .join(' / ')
        }
        if (parsed?.description) return parsed.description
      } catch (error) {
        // ignore parse error
      }
      return skuDetail
    },
    
    // 获取商品图片
    getProductImage(item) {
      // TODO: 从商品信息中获取图片
      return '/static/images/default-product.jpg'
    },
    
    // 返回
    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.back-icon {
  font-size: 36rpx;
  color: #333;
}

.back-text {
  font-size: 28rpx;
  color: #333;
}

.header-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.header-placeholder {
  width: 100rpx;
}

.status-filter {
  background-color: #fff;
  border-bottom: 1rpx solid #eee;
}

.filter-scroll {
  white-space: nowrap;
}

.filter-list {
  display: flex;
  padding: 20rpx 0;
}

.filter-item {
  padding: 10rpx 30rpx;
  margin: 0 10rpx;
  border-radius: 30rpx;
  font-size: 28rpx;
  color: #666;
  background-color: #f5f5f5;
  white-space: nowrap;
}

.filter-item.active {
  background-color: #007AFF;
  color: #fff;
}

.order-list {
  height: calc(100vh - 200rpx);
  padding: 20rpx;
}

.empty-state, .loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  text-align: center;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #999;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

.order-item {
  background-color: #fff;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #eee;
}

.order-info {
  flex: 1;
}

.order-number {
  display: block;
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 10rpx;
}

.order-time {
  display: block;
  font-size: 24rpx;
  color: #999;
}

.order-status {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.status-pending {
  background-color: #fff3cd;
  color: #856404;
}

.status-paid {
  background-color: #d1ecf1;
  color: #0c5460;
}

.status-shipped {
  background-color: #d4edda;
  color: #155724;
}

.status-delivered {
  background-color: #d1ecf1;
  color: #0c5460;
}

.status-cancelled {
  background-color: #f8d7da;
  color: #721c24;
}

.order-content {
  margin-bottom: 20rpx;
}

.order-items {
  margin-bottom: 20rpx;
}

.order-item-goods {
  display: flex;
  margin-bottom: 20rpx;
}

.order-item-goods:last-child {
  margin-bottom: 0;
}

.goods-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 10rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.goods-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.goods-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 10rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.goods-spec {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 10rpx;
}

.goods-price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.goods-price {
  font-size: 32rpx;
  color: #ff2d55;
  font-weight: bold;
}

.goods-quantity {
  font-size: 26rpx;
  color: #666;
}

.shipping-info {
  display: flex;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.shipping-info:last-child {
  margin-bottom: 0;
}

.shipping-label {
  color: #999;
  margin-right: 10rpx;
}

.shipping-text {
  flex: 1;
  color: #666;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid #eee;
}

.order-amount {
  display: flex;
  align-items: baseline;
}

.amount-label {
  font-size: 26rpx;
  color: #666;
  margin-right: 10rpx;
}

.amount-value {
  font-size: 36rpx;
  color: #ff2d55;
  font-weight: bold;
}

.order-actions {
  display: flex;
  gap: 20rpx;
}

.btn {
  padding: 12rpx 30rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
  border: none;
}

.btn.secondary {
  background-color: #f5f5f5;
  color: #666;
}

.btn.primary {
  background-color: #007AFF;
  color: #fff;
}

.ship-form {
  padding: 20rpx 0;
}

.form-item {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.form-label {
  width: 150rpx;
  font-size: 28rpx;
  color: #333;
  flex-shrink: 0;
}

.form-input {
  flex: 1;
  padding: 15rpx 20rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  font-size: 28rpx;
}
</style>
