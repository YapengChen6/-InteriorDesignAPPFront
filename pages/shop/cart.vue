<template>
  <view class="cart-page">
    <!-- 顶部总览 -->
    <view class="cart-summary-card">
      <view class="summary-left">
        <text class="summary-title">购物车</text>
        <text class="summary-subtitle">共 {{ cartSummary.totalItems }} 件，数量 {{ cartSummary.totalQuantity }}</text>
      </view>
      <view class="summary-right">
        <text class="summary-amount-label">总额</text>
        <text class="summary-amount">￥{{ cartSummary.totalAmount }}</text>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <uni-load-more
        status="loading"
        :content-text="{
          contentdown: '加载中',
          contentrefresh: '加载中',
          contentnomore: '加载完成'
        }"
      ></uni-load-more>
    </view>

    <!-- 购物车内容 -->
    <view class="cart-content" v-else>
      <scroll-view
        class="cart-list"
        scroll-y
        refresher-enabled
        @refresherrefresh="handleRefresh"
        :refresher-triggered="refreshing"
      >
        <view
          class="cart-item"
          v-for="item in cartItems"
          :key="item.cartId"
        >
          <view class="item-select" @click="toggleItemSelection(item)">
            <view :class="['checkbox', isSelected(item.cartId) ? 'checked' : '']">
              <uni-icons v-if="isSelected(item.cartId)" type="checkmarkempty" size="14" color="#fff"></uni-icons>
            </view>
          </view>
          <image
            class="item-image"
            :src="item.imageUrl"
            mode="aspectFill"
            @error="onImageError(item)"
          ></image>
          <view class="item-body">
            <view class="item-header">
              <text class="item-title">{{ item.productSpu.productName || '未命名商品' }}</text>
              <text class="item-price">￥{{ formatPrice(getUnitPrice(item)) }}</text>
            </view>
            <text class="item-sku" v-if="item.skuText">{{ item.skuText }}</text>
            <text class="item-desc" v-else>{{ item.productSpu.productDetail || '暂无商品描述' }}</text>
            <view class="item-meta">
              <text class="stock-text" :class="{ danger: !item.stockSufficient }">
                库存 {{ item.availableStock != null ? item.availableStock : '未知' }}
              </text>
              <text class="status-tag" v-if="!isProductOnShelf(item)">已下架</text>
            </view>
            <view class="item-actions">
              <uni-number-box
                class="number-box"
                :value="item.quantity"
                :min="1"
                :max="item.availableStock || 999"
                :disabled="item.loading"
                @change="value => handleQuantityChange(item, value)"
              ></uni-number-box>
              <view class="item-tools">
                <button class="link-btn" :disabled="actionLoading" @click.stop="handleDelete(item)">
                  删除
                </button>
              </view>
            </view>
          </view>
        </view>

        <view class="empty-state" v-if="!cartItems.length">
          <image src="/static/images/empty-product.png" class="empty-image"></image>
          <text class="empty-title">购物车还是空的</text>
          <text class="empty-text">去商城逛逛，挑选喜欢的商品</text>
          <button class="empty-btn" @click="goShopList">立即选购</button>
        </view>
      </scroll-view>
    </view>

    <!-- 底部操作条 -->
    <view class="cart-toolbar">
      <view class="toolbar-left">
        <label class="select-all" @click="toggleSelectAll">
          <view :class="['checkbox', isAllSelected ? 'checked' : '']">
            <uni-icons v-if="isAllSelected" type="checkmarkempty" size="14" color="#fff"></uni-icons>
          </view>
          <text>全选</text>
        </label>
        <button class="clear-btn" :disabled="!cartItems.length || actionLoading" @click="handleClearCart">清空</button>
      </view>
      <view class="toolbar-summary">
        <text class="summary-count">已选 {{ selectedSummary.count }} 件</text>
        <text class="summary-amount">合计 ￥{{ selectedSummary.amount }}</text>
      </view>
      <button
        class="checkout-btn"
        :disabled="!selectedSummary.count || actionLoading"
        @click="handleCheckout"
      >
        去结算
      </button>
    </view>
  </view>
</template>

<script>
import { mapState } from 'vuex'
import * as cartApi from '@/api/cart.js'
import * as orderApi from '@/api/product-order.js'
import { getDefaultAddress } from '@/api/address.js'
import * as mediaApi from '@/api/media.js'

export default {
  name: 'ShopCartPage',
  data() {
    return {
      loading: false,
      refreshing: false,
      cartItems: [],
      selectedCartIds: [],
      actionLoading: false,
      productImagesMap: {},
      initialized: false
    }
  },
  computed: {
    ...mapState({
      currentUserId: state => state.user.id
    }),
    isAllSelected() {
      return this.cartItems.length > 0 && this.selectedCartIds.length === this.cartItems.length
    },
    selectedIdSet() {
      return new Set(this.selectedCartIds)
    },
    selectedItems() {
      return this.cartItems.filter(item => this.selectedIdSet.has(item.cartId))
    },
    cartSummary() {
      const totalQuantity = this.cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
      const totalAmount = this.cartItems.reduce((sum, item) => sum + this.calcItemAmount(item), 0)
      return {
        totalItems: this.cartItems.length,
        totalQuantity,
        totalAmount: this.formatPrice(totalAmount)
      }
    },
    selectedSummary() {
      const totalQuantity = this.selectedItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
      const totalAmount = this.selectedItems.reduce((sum, item) => sum + this.calcItemAmount(item), 0)
      return {
        count: this.selectedItems.length,
        quantity: totalQuantity,
        amount: this.formatPrice(totalAmount)
      }
    }
  },
  onShow() {
    if (!this.initialized) {
      this.loadCart()
      this.initialized = true
    } else {
      this.loadCart()
    }
  },
  methods: {
    async loadCart() {
      this.loading = true
      try {
        const res = await cartApi.getCartList()
        const items = res && res.code === 200 && Array.isArray(res.data) ? res.data : []
        this.cartItems = items.map(item => this.decorateCartItem(item))
        this.syncSelectionFromServer()
        await this.preloadImages(this.cartItems)
      } catch (error) {
        console.error('加载购物车失败:', error)
        uni.showToast({ title: error.message || '加载失败', icon: 'none' })
        this.cartItems = []
        this.selectedCartIds = []
      } finally {
        this.loading = false
        this.refreshing = false
      }
    },
    decorateCartItem(raw) {
      const productSpu = raw.productSpu || {}
      const productSku = raw.productSku || {}
      const quantity = Number(raw.quantity) || 1
      const availableStock = this.getAvailableStock(raw)
      
      // 计算库存是否充足
      let stockSufficient = true
      if (raw.stockSufficient !== undefined) {
        stockSufficient = Boolean(raw.stockSufficient)
      } else if (availableStock !== null) {
        stockSufficient = availableStock >= quantity
      }
      
      return {
        cartId: raw.cartId,
        spuId: raw.spuId,
        skuId: raw.skuId,
        quantity,
        selected: Boolean(raw.selected),
        productSpu,
        productSku,
        unitPrice: this.getUnitPrice(raw),
        availableStock,
        stockSufficient,
        imageUrl: this.resolveProductImage({
          spuId: raw.spuId,
          productSpu,
          productSku
        }),
        skuText: this.buildSkuText(productSku),
        loading: false
      }
    },
    getUnitPrice(item) {
      if (item.unitPrice != null) return Number(item.unitPrice)
      if (item.productSku && item.productSku.salePrice != null) return Number(item.productSku.salePrice)
      if (item.productSpu && item.productSpu.marketPrice != null) return Number(item.productSpu.marketPrice)
      return 0
    },
    getAvailableStock(item) {
      if (item.availableStock != null) return Number(item.availableStock)
      if (item.productSku && item.productSku.stockQuantity != null) return Number(item.productSku.stockQuantity)
      if (item.productSpu && item.productSpu.stock != null) return Number(item.productSpu.stock)
      return null
    },
    calcItemAmount(item) {
      const quantity = Number(item.quantity) || 0
      const unitPrice = this.getUnitPrice(item)
      return Number((unitPrice * quantity).toFixed(2))
    },
    buildSkuText(productSku = {}) {
      const detail = productSku.skuDetail || productSku.detail
      if (!detail) return ''
      let parsed = detail
      if (typeof detail === 'string') {
        try {
          parsed = JSON.parse(detail)
        } catch (error) {
          parsed = null
        }
      }
      if (parsed && Array.isArray(parsed.combination)) {
        return parsed.combination
          .map(item => `${item.name || item.attrName || ''}${item.value || item.attrValue ? ':' : ''}${item.value || item.attrValue || ''}`.trim())
          .filter(Boolean)
          .join(' / ')
      }
      if (parsed && parsed.description) return parsed.description
      return productSku.skuName || productSku.name || ''
    },
    async preloadImages(items) {
      const spuIds = Array.from(new Set(items.map(item => item.spuId).filter(Boolean)))
      const tasks = spuIds.map(async spuId => {
        if (this.productImagesMap[spuId]) return
        try {
          const res = await mediaApi.getProductSpuImages(spuId)
          const list = this.normalizeMediaList(res && res.data)
          this.$set(this.productImagesMap, spuId, list)
        } catch (error) {
          console.warn('加载商品图片失败:', error)
          this.$set(this.productImagesMap, spuId, [])
        }
      })
      await Promise.all(tasks)
      this.cartItems = this.cartItems.map(item => ({
        ...item,
        imageUrl: this.resolveProductImage(item)
      }))
    },
    normalizeMediaList(payload) {
      if (!payload) return []
      if (Array.isArray(payload)) return payload
      if (Array.isArray(payload.images)) return payload.images
      if (Array.isArray(payload.data)) return payload.data
      return []
    },
    resolveProductImage(item) {
      const fallback = '/static/images/default-product.jpg'
      if (item.productSpu) {
        if (item.productSpu.mainImageUrl) return item.productSpu.mainImageUrl
        if (Array.isArray(item.productSpu.imageUrls) && item.productSpu.imageUrls.length) {
          return item.productSpu.imageUrls[0]
        }
      }
      const cached = this.productImagesMap[item.spuId]
      if (Array.isArray(cached) && cached.length) {
        const first = cached[0]
        if (typeof first === 'string') return first
        return first.fileUrl || first.url || first.previewUrl || fallback
      }
      if (item.imageUrl && item.imageUrl !== fallback) {
        return item.imageUrl
      }
      return fallback
    },
    onImageError(item) {
      item.imageUrl = '/static/images/default-product.jpg'
    },
    syncSelectionFromServer() {
      this.selectedCartIds = this.cartItems.filter(item => item.selected).map(item => item.cartId)
    },
    isSelected(cartId) {
      return this.selectedIdSet.has(cartId)
    },
    async toggleItemSelection(item) {
      const target = !this.isSelected(item.cartId)
      await this.updateSelection([item.cartId], target)
    },
    async toggleSelectAll() {
      if (!this.cartItems.length) return
      const ids = this.cartItems.map(item => item.cartId)
      const target = !this.isAllSelected
      await this.updateSelection(ids, target)
    },
    async updateSelection(cartIds, selected) {
      if (!cartIds.length) return
      this.actionLoading = true
      try {
        await cartApi.updateCartSelectedStatus(cartIds, selected)
        this.cartItems = this.cartItems.map(item => {
          if (cartIds.includes(item.cartId)) {
            return { ...item, selected }
          }
          return item
        })
        this.syncSelectionFromServer()
      } catch (error) {
        console.error('更新选中状态失败:', error)
        uni.showToast({ title: error.message || '操作失败', icon: 'none' })
      } finally {
        this.actionLoading = false
      }
    },
    async handleQuantityChange(item, value) {
      const newQuantity = Number(value)
      if (!newQuantity || newQuantity < 1) {
        uni.showToast({ title: '数量必须大于0', icon: 'none' })
        return
      }
      if (newQuantity === item.quantity) return
      
      // 检查库存
      if (item.availableStock !== null && newQuantity > item.availableStock) {
        uni.showToast({ title: `库存不足，最多可购买${item.availableStock}件`, icon: 'none' })
        // 自动调整到最大库存
        if (item.availableStock > 0) {
          this.$nextTick(() => {
            item.quantity = item.availableStock
          })
        }
        return
      }
      
      // 检查商品状态
      if (!this.isProductOnShelf(item)) {
        uni.showToast({ title: '商品已下架，无法修改数量', icon: 'none' })
        return
      }
      
      item.loading = true
      try {
        const res = await cartApi.updateCartQuantity(item.cartId, newQuantity)
        if (res && (res.code === 200 || res.success)) {
          item.quantity = newQuantity
          item.stockSufficient = item.availableStock === null || item.availableStock >= newQuantity
        } else {
          uni.showToast({ title: res?.msg || '更新数量失败', icon: 'none' })
        }
      } catch (error) {
        console.error('更新数量失败:', error)
        const errorMsg = error.response?.data?.msg || error.message || '更新数量失败'
        uni.showToast({ title: errorMsg, icon: 'none' })
      } finally {
        item.loading = false
      }
    },
    async handleDelete(item) {
      const confirm = await this.showConfirm('确定删除该商品吗？')
      if (!confirm) return
      this.actionLoading = true
      try {
        await cartApi.deleteCartItems([item.cartId])
        this.cartItems = this.cartItems.filter(cartItem => cartItem.cartId !== item.cartId)
        this.selectedCartIds = this.selectedCartIds.filter(id => id !== item.cartId)
        uni.showToast({ title: '删除成功', icon: 'success' })
      } catch (error) {
        console.error('删除购物车项失败:', error)
        uni.showToast({ title: error.message || '删除失败', icon: 'none' })
      } finally {
        this.actionLoading = false
      }
    },
    async handleClearCart() {
      if (!this.cartItems.length) return
      const confirm = await this.showConfirm('确定清空购物车吗？')
      if (!confirm) return
      this.actionLoading = true
      try {
        await cartApi.clearCart()
        this.cartItems = []
        this.selectedCartIds = []
        uni.showToast({ title: '购物车已清空', icon: 'success' })
      } catch (error) {
        console.error('清空购物车失败:', error)
        uni.showToast({ title: error.message || '操作失败', icon: 'none' })
      } finally {
        this.actionLoading = false
      }
    },
    async handleCheckout() {
      if (!this.selectedItems.length) {
        uni.showToast({ title: '请选择需要结算的商品', icon: 'none' })
        return
      }
      
      // 仅做基础校验，随后跳转到确认订单页，由确认页完成地址选择与下单
      const invalidItems = this.selectedItems.filter(item => {
        if (!this.isProductOnShelf(item)) {
          return true
        }
        if (item.availableStock !== null && item.quantity > item.availableStock) {
          return true
        }
        return false
      })
      
      if (invalidItems.length > 0) {
        const names = invalidItems
          .map(item => (item.productSpu && item.productSpu.productName) || '商品')
          .join('、')
        uni.showModal({
          title: '提示',
          content: `${names}已下架或库存不足，请先移除后再结算`,
          showCancel: false
        })
        return
      }
      
      // 跳转到确认订单页，在该页面展示订单详情和收货地址，并执行虚拟支付
      uni.navigateTo({
        url: '/pages/shop/checkout'
      })
    },
    formatPrice(value) {
      const num = Number(value)
      if (Number.isNaN(num)) return '0.00'
      return num.toFixed(2)
    },
    getProductStatus(item) {
      // 统一获取商品状态
      if (item.productSpu) {
        if (item.productSpu.productStatus !== undefined) {
          return String(item.productSpu.productStatus)
        }
        if (item.productSpu.status !== undefined) {
          return String(item.productSpu.status)
        }
      }
      return '0'
    },
    isProductOnShelf(item) {
      return this.getProductStatus(item) === '0'
    },
    showConfirm(message) {
      return new Promise(resolve => {
        uni.showModal({
          title: '提示',
          content: message,
          success: res => resolve(res.confirm),
          fail: () => resolve(false)
        })
      })
    },
    handleRefresh() {
      this.refreshing = true
      this.loadCart()
    },
    goShopList() {
      uni.navigateTo({
        url: '/pages/shop/shop-list'
      })
    }
  }
}
</script>

<style scoped>
.cart-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f6f7fb;
  padding: 24rpx;
  box-sizing: border-box;
}

.cart-summary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #fef5f1, #fdeee3);
  box-shadow: 0 12rpx 28rpx rgba(255, 170, 136, 0.25);
  margin-bottom: 24rpx;
}

.summary-title {
  font-size: 40rpx;
  font-weight: 600;
  color: #303133;
}

.summary-subtitle {
  font-size: 26rpx;
  color: #909399;
  margin-top: 6rpx;
}

.summary-right {
  text-align: right;
}

.summary-amount-label {
  font-size: 24rpx;
  color: #909399;
}

.summary-amount {
  display: block;
  font-size: 38rpx;
  font-weight: 600;
  color: #fa541c;
}

.cart-content {
  flex: 1;
  overflow: hidden;
}

.cart-list {
  height: 100%;
}

.cart-item {
  display: flex;
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(31, 45, 61, 0.08);
}

.item-select {
  padding-right: 16rpx;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 2rpx solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox.checked {
  background-color: #fa541c;
  border-color: #fa541c;
  box-shadow: 0 6rpx 16rpx rgba(250, 84, 28, 0.35);
}

.item-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 18rpx;
  background: #f2f3f5;
  margin-right: 20rpx;
}

.item-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #303133;
  max-width: 360rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-price {
  font-size: 32rpx;
  font-weight: 600;
  color: #fa541c;
}

.item-sku,
.item-desc {
  font-size: 26rpx;
  color: #909399;
  margin-top: 8rpx;
}

.item-meta {
  display: flex;
  align-items: center;
  margin-top: 12rpx;
  gap: 16rpx;
}

.stock-text {
  font-size: 24rpx;
  color: #67c23a;
}

.stock-text.danger {
  color: #f56c6c;
}

.status-tag {
  font-size: 22rpx;
  color: #e6a23c;
  background: rgba(230, 162, 60, 0.12);
  padding: 4rpx 16rpx;
  border-radius: 999rpx;
}

.item-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
}

.item-tools {
  display: flex;
  gap: 16rpx;
}

.link-btn {
  border: none;
  background: transparent;
  color: #909399;
  font-size: 26rpx;
  padding: 0;
}

.cart-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  border-radius: 20rpx;
  background: #fff;
  box-shadow: 0 -6rpx 20rpx rgba(31, 45, 61, 0.08);
  margin-top: 20rpx;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 28rpx;
  color: #303133;
}

.clear-btn {
  font-size: 26rpx;
  padding: 10rpx 24rpx;
  border-radius: 999rpx;
  border: 2rpx solid #f56c6c;
  color: #f56c6c;
  background: #fff;
}

.toolbar-summary {
  flex: 1;
  text-align: right;
  margin-right: 20rpx;
}

.summary-count {
  display: block;
  font-size: 26rpx;
  color: #909399;
}

.summary-amount {
  font-size: 32rpx;
  font-weight: 600;
  color: #fa541c;
}

.checkout-btn {
  background: linear-gradient(135deg, #ff7a45, #fa541c);
  color: #fff;
  font-size: 30rpx;
  padding: 18rpx 48rpx;
  border-radius: 999rpx;
  box-shadow: 0 12rpx 24rpx rgba(250, 84, 28, 0.45);
}

.loading-state {
  margin-top: 120rpx;
}

.empty-state {
  padding: 120rpx 40rpx;
  text-align: center;
  color: #909399;
}

.empty-image {
  width: 320rpx;
  height: 240rpx;
  margin-bottom: 24rpx;
}

.empty-title {
  display: block;
  font-size: 32rpx;
  color: #303133;
  margin-bottom: 12rpx;
}

.empty-text {
  font-size: 26rpx;
  color: #909399;
  margin-bottom: 24rpx;
}

.empty-btn {
  background: #fa541c;
  color: #fff;
  border-radius: 999rpx;
  padding: 16rpx 48rpx;
}
</style>

