<template>
  <view class="checkout-page">
    <!-- 收货地址区域 -->
    <view class="address-card" @click="goAddressPage">
      <view v-if="address" class="address-content">
        <view class="address-header">
          <text class="name">{{ address.name }}</text>
          <text class="phone">{{ address.phone }}</text>
        </view>
        <text class="detail">{{ address.region }}</text>
      </view>
      <view v-else class="address-empty">
        <text class="hint">请选择收货地址</text>
        <text class="sub-hint">点击前往地址管理页新增或设为默认</text>
      </view>
      <text class="iconfont icon-chevron-right right-icon"></text>
    </view>

    <!-- 商品及店铺信息 -->
    <scroll-view scroll-y class="content">
      <view
        v-for="group in shopGroups"
        :key="group.shopKey"
        class="shop-section"
      >
        <view class="shop-header">
          <text class="shop-name">
            {{ group.shopName || '店铺' }}（共 {{ group.items.length }} 件）
          </text>
        </view>

        <view
          v-for="item in group.items"
          :key="item.cartId"
          class="item-row"
        >
          <image
            class="item-image"
            :src="item.imageUrl"
            mode="aspectFill"
          />
          <view class="item-info">
            <text class="item-title">{{ (item.productSpu && item.productSpu.productName) || '商品' }}</text>
            <text class="item-sku" v-if="item.skuText">{{ item.skuText }}</text>
            <view class="item-bottom">
              <text class="price">￥{{ formatPrice(getUnitPrice(item)) }}</text>
              <text class="qty">x{{ item.quantity }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部结算栏（虚拟微信支付） -->
    <view class="footer">
      <view class="summary">
        <text class="label">合计：</text>
        <text class="amount">￥{{ totalAmount }}</text>
      </view>
      <button
        class="pay-btn"
        :disabled="!canPay || loading"
        @click="handleVirtualPay"
      >
        使用微信支付（模拟）
      </button>
    </view>
  </view>
</template>

<script>
import * as cartApi from '@/api/cart.js'
import * as orderApi from '@/api/product-order.js'
import { getDefaultAddress, getAddressList } from '@/api/address.js'

export default {
  name: 'CheckoutPage',
  data() {
    return {
      loading: false,
      address: null,
      cartItems: [],
      shopGroups: [],
      addressList: []
    }
  },
  computed: {
    canPay() {
      return !!this.address && this.cartItems.length > 0
    },
    totalAmount() {
      const sum = this.cartItems.reduce((acc, item) => {
        const unit = this.getUnitPrice(item)
        const qty = Number(item.quantity) || 0
        return acc + unit * qty
      }, 0)
      return this.formatPrice(sum)
    }
  },
  async onLoad() {
    await this.initData()
  },
  onShow() {
    // 从地址管理页返回时，重新加载默认地址，保证“设为默认”的结果能立刻体现在结算页
    this.loadAddress()
  },
  methods: {
    async initData() {
      this.loading = true
      try {
        await Promise.all([
          this.loadAddress(),
          this.loadSelectedItems()
        ])
      } catch (e) {
        console.error('初始化结算页失败:', e)
        uni.showToast({ title: e.message || '加载失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    async loadAddress() {
      try {
        const res = await getDefaultAddress()
        if (res && res.code === 200 && res.data) {
          this.address = res.data
        } else {
          this.address = null
        }
        // 顺便加载地址列表方便后续扩展（比如在本页弹出地址选择）
        const listRes = await getAddressList()
        if (listRes && listRes.code === 200 && Array.isArray(listRes.data)) {
          this.addressList = listRes.data
        }
      } catch (e) {
        console.warn('加载地址失败:', e)
        this.address = null
      }
    },
    async loadSelectedItems() {
      const res = await cartApi.getSelectedItems()
      const items = res && res.code === 200 && Array.isArray(res.data) ? res.data : []
      if (!items.length) {
        uni.showToast({ title: '没有选中的商品', icon: 'none' })
      }
      this.cartItems = items
      this.shopGroups = this.groupByShop(items)
    },
    groupByShop(items) {
      const map = new Map()
      items.forEach(item => {
        const spu = item.productSpu || {}
        const shopKey = spu.createdBy || 'default'
        const shopName = spu.shopName || '店铺'
        if (!map.has(shopKey)) {
          map.set(shopKey, { shopKey, shopName, items: [] })
        }
        map.get(shopKey).items.push(item)
      })
      return Array.from(map.values())
    },
    getUnitPrice(item) {
      if (item.productSku && item.productSku.salePrice != null) {
        return Number(item.productSku.salePrice)
      }
      if (item.productSpu && item.productSpu.marketPrice != null) {
        return Number(item.productSpu.marketPrice)
      }
      if (item.unitPrice != null) {
        return Number(item.unitPrice)
      }
      return 0
    },
    formatPrice(value) {
      const num = Number(value)
      if (Number.isNaN(num)) return '0.00'
      return num.toFixed(2)
    },
    goAddressPage() {
      uni.navigateTo({
        url: '/pages/mine/address?from=checkout'
      })
    },
    async handleVirtualPay() {
      if (!this.address) {
        uni.showModal({
          title: '提示',
          content: '请先设置收货地址',
          confirmText: '去设置',
          success: res => {
            if (res.confirm) {
              this.goAddressPage()
            }
          }
        })
        return
      }
      if (!this.cartItems.length) {
        uni.showToast({ title: '没有可结算的商品', icon: 'none' })
        return
      }

      try {
        this.loading = true
        uni.showLoading({ title: '提交订单中...' })
        const cartIds = this.cartItems.map(i => i.cartId)

        // 1. 创建订单（按商家拆单）
        const orderRes = await orderApi.createOrdersFromCart(cartIds, this.address.addressId)
        if (!orderRes || orderRes.code !== 200 || !Array.isArray(orderRes.data)) {
          uni.hideLoading()
          uni.showToast({ title: (orderRes && orderRes.msg) || '创建订单失败', icon: 'none' })
          return
        }

        const orders = orderRes.data

        // 2. 模拟微信支付：依次调用支付接口，将订单状态改为已支付
        for (const order of orders) {
          if (order && order.orderId) {
            try {
              await orderApi.payOrder(order.orderId)
            } catch (e) {
              console.warn('虚拟支付某个订单失败:', order.orderId, e)
            }
          }
        }

        uni.hideLoading()
        uni.showToast({ title: '支付成功（模拟）', icon: 'success' })

        // 3. 通知商品库存可能已变更，让相关页面刷新商品数据
        try {
          const spuIdSet = new Set()
          this.cartItems.forEach(item => {
            const spu = item.productSpu || {}
            const rawId = spu.productSpuId != null
              ? spu.productSpuId
              : (spu.spuId != null ? spu.spuId : spu.id)
            if (rawId != null) {
              const idNum = Number(rawId)
              if (!Number.isNaN(idNum)) {
                spuIdSet.add(idNum)
              }
            }
          })
          const spuIds = Array.from(spuIdSet)
          uni.$emit('productStockUpdated', { spuIds })
        } catch (e) {
          console.warn('触发库存更新事件失败:', e)
        }

        // 4. 跳转到“我的订单”页面查看
        setTimeout(() => {
          uni.navigateTo({
            url: '/pages/mine/viewOrder/viewOrder'
          })
        }, 800)
      } catch (e) {
        uni.hideLoading()
        console.error('虚拟支付失败:', e)
        uni.showToast({ title: e.message || '支付失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.checkout-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f9;
}

.address-card {
  margin: 24rpx;
  padding: 24rpx;
  background-color: #fff;
  border-radius: 20rpx;
  position: relative;
}

.address-content {
  padding-right: 40rpx;
}

.address-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.name {
  font-size: 32rpx;
  font-weight: 600;
  color: #303133;
}

.phone {
  font-size: 28rpx;
  color: #606266;
}

.detail {
  font-size: 26rpx;
  color: #909399;
}

.address-empty {
  padding-right: 40rpx;
}

.address-empty .hint {
  font-size: 30rpx;
  color: #303133;
}

.address-empty .sub-hint {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #909399;
}

.right-icon {
  position: absolute;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
  color: #c0c4cc;
  font-size: 28rpx;
}

.content {
  flex: 1;
  padding: 0 24rpx 24rpx;
}

.shop-section {
  margin-bottom: 24rpx;
  background-color: #fff;
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
}

.shop-header {
  padding-bottom: 12rpx;
  border-bottom: 1px solid #f2f2f2;
  margin-bottom: 12rpx;
}

.shop-name {
  font-size: 28rpx;
  color: #303133;
  font-weight: 500;
}

.item-row {
  display: flex;
  padding: 16rpx 0;
}

.item-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  background-color: #f2f3f5;
  margin-right: 16rpx;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-title {
  font-size: 28rpx;
  color: #303133;
}

.item-sku {
  margin-top: 4rpx;
  font-size: 24rpx;
  color: #909399;
}

.item-bottom {
  margin-top: 8rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  font-size: 30rpx;
  color: #fa541c;
  font-weight: 600;
}

.qty {
  font-size: 26rpx;
  color: #606266;
}

.footer {
  padding: 16rpx 24rpx;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.summary {
  display: flex;
  align-items: baseline;
}

.label {
  font-size: 26rpx;
  color: #606266;
}

.amount {
  font-size: 34rpx;
  color: #fa541c;
  font-weight: 600;
  margin-left: 4rpx;
}

.pay-btn {
  background: linear-gradient(135deg, #07c160, #06ae56);
  color: #fff;
  font-size: 30rpx;
  padding: 18rpx 48rpx;
  border-radius: 999rpx;
}
</style>


