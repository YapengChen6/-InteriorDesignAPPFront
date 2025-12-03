<template>
  <view class="shop-detail-page">
    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <uni-load-more status="loading" content="加载中..."></uni-load-more>
    </view>

    <!-- 商家信息 -->
    <view class="shop-info-section" v-else-if="shop">
      <!-- 商家头部信息 -->
      <view class="shop-header">
        <image 
          class="shop-avatar" 
          :src="getShopAvatar()"
          mode="aspectFill"
        ></image>
        <view class="shop-basic-info">
          <text class="shop-name">{{ shop.shopName || '未设置店铺名称' }}</text>
          <view class="shop-rating" v-if="shop.rating">
            <uni-icons type="star-filled" size="16" color="#ffa500"></uni-icons>
            <text class="rating-text">{{ shop.rating.toFixed(1) }}</text>
          </view>
          <view class="shop-status-row">
            <text class="shop-status" :class="shopStatusClass">
              {{ getShopStatusText() }}
            </text>
            <text class="online-status" :class="onlineStatusClass">
              {{ getOnlineStatusText() }}
            </text>
          </view>
        </view>
      </view>

      <!-- 商家详细信息 -->
      <view class="shop-detail-card">
        <view class="detail-item" v-if="shop.shopDescription">
          <text class="detail-label">店铺描述</text>
          <text class="detail-value">{{ shop.shopDescription }}</text>
        </view>
        <view class="detail-item" v-if="shop.contactPhone">
          <text class="detail-label">联系电话</text>
          <text class="detail-value">{{ shop.contactPhone }}</text>
        </view>
        <view class="detail-item" v-if="shop.contactAddress">
          <text class="detail-label">联系地址</text>
          <text class="detail-value">{{ shop.contactAddress }}</text>
        </view>
        <view class="detail-item" v-if="shop.businessHours">
          <text class="detail-label">营业时间</text>
          <text class="detail-value">{{ shop.businessHours }}</text>
        </view>
      </view>

      <!-- 联系商家按钮 -->
      <view class="shop-contact-bar">
        <button class="contact-merchant-btn" @click.stop="contactMerchant">
          联系商家
        </button>
      </view>
    </view>

    <!-- 商品列表 -->
    <view class="products-section">
      <view class="section-header">
        <text class="section-title">店铺商品</text>
        <text class="product-count" v-if="products.length > 0">共{{ products.length }}件商品</text>
      </view>

      <!-- 加载状态 -->
      <view class="loading-state" v-if="productsLoading">
        <uni-load-more status="loading" content="加载商品中..."></uni-load-more>
      </view>

      <!-- 商品网格 -->
      <scroll-view 
        class="product-scroll"
        scroll-y
        @scrolltolower="loadMore"
        refresher-enabled
        :refresher-triggered="refreshing"
        @refresherrefresh="refresh"
      >
        <view class="product-grid" v-if="products.length > 0">
          <view
            v-for="item in products"
            :key="item.id"
            class="product-card"
            @click="openProductDetail(item)"
          >
            <view class="product-image-wrapper">
              <image
                class="product-image"
                :src="getProductImage(item)"
                mode="aspectFill"
              ></image>
              <view
                class="status-badge"
                :class="getProductStatus(item) === '0' ? 'on' : 'off'"
              >
                {{ getProductStatus(item) === '0' ? '上架' : '下架' }}
              </view>
            </view>
            <view class="product-info">
              <text class="product-name">{{ item.productName || '未命名商品' }}</text>
              <view class="price-row">
                <text class="price">￥{{ formatPrice(item.marketPrice) }}</text>
              </view>
              <text class="product-desc">
                {{ item.productDetail || '暂无描述' }}
              </text>
              <view class="product-meta">
                <text class="stock">库存 {{ item.stock || 0 }}</text>
                <text class="category">{{ item.categoryPath || '未分类' }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view class="empty-state" v-else-if="!productsLoading">
          <image src="/static/images/empty-product.png" class="empty-image"></image>
          <text class="empty-text">该商家暂无商品</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
import * as shopApi from '@/api/shop.js'
import * as productApi from '@/api/product.js'
import * as userApi from '@/api/users.js'
import { createConversationAndNavigate, isUserLoggedIn, handleNotLoggedIn } from '@/utils/conversationHelper.js'

export default {
  data() {
    return {
      shopId: null,
      loading: false,
      productsLoading: false,
      refreshing: false,
      shop: null,
      products: [],
      pageNum: 1,
      pageSize: 10,
      loadMoreStatus: 'more'
    }
  },
  onLoad(options) {
    if (options.shopId) {
      this.shopId = parseInt(options.shopId)
      this.loadShopInfo()
      this.loadProducts()
    } else {
      uni.showToast({
        title: '商家ID不存在',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
  },
  computed: {
    shopStatusClass() {
      if (!this.shop) return ''
      return this.shop.shopStatus === 1 ? 'status-normal' : 'status-disabled'
    },
    onlineStatusClass() {
      if (!this.shop) return ''
      const status = this.shop.onlineStatus || '0'
      return `online-${status}`
    }
  },
  methods: {
    async loadShopInfo() {
      this.loading = true
      try {
        const res = await shopApi.getShopById(this.shopId)
        if (res && res.code === 200) {
          this.shop = res.data
        } else {
          uni.showToast({
            title: res.msg || '加载商家信息失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('加载商家信息失败:', error)
        uni.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    async loadProducts() {
      if (this.productsLoading) return
      this.productsLoading = true
      try {
        const res = await productApi.getOnShelfProductSpusByShopId(this.shopId)
        if (res && res.code === 200) {
          this.products = res.data || []
          this.loadMoreStatus = 'noMore'
        } else {
          uni.showToast({
            title: res.msg || '加载商品失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('加载商品列表失败:', error)
        uni.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        })
      } finally {
        this.productsLoading = false
        this.refreshing = false
      }
    },
    
    refresh() {
      this.refreshing = true
      this.pageNum = 1
      this.loadProducts()
    },
    
    loadMore() {
      // 商品列表一次性加载，不需要分页
      if (this.loadMoreStatus === 'noMore') {
        return
      }
    },
    
    getShopAvatar() {
      if (this.shop && this.shop.shopAvatar) {
        return this.shop.shopAvatar
      }
      return '/static/images/default-shop.png'
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
    
    getOnlineStatusText() {
      if (!this.shop) return ''
      const status = this.shop.onlineStatus || '0'
      const statusMap = {
        '0': '营业中',
        '1': '打样',
        '2': '休息中'
      }
      return statusMap[status] || '营业中'
    },
    
    getOnlineStatusClass() {
      if (!this.shop) return ''
      const status = this.shop.onlineStatus || '0'
      return `online-${status}`
    },
    
    getProductImage(product) {
      if (product.imageUrls && product.imageUrls.length > 0) {
        return product.imageUrls[0]
      }
      if (product.mainImageUrl) {
        return product.mainImageUrl
      }
      if (product.imageUrl) {
        return product.imageUrl
      }
      if (product.coverImage) {
        return product.coverImage
      }
      return '/static/images/default-product.jpg'
    },
    
    getProductStatus(product) {
      if (product.productStatus !== undefined) {
        return String(product.productStatus)
      }
      if (product.status !== undefined) {
        return String(product.status)
      }
      return '0'
    },
    
    formatPrice(price) {
      if (!price && price !== 0) return '0.00'
      const num = Number(price)
      if (Number.isNaN(num)) return '0.00'
      return num.toFixed(2)
    },
    
    openProductDetail(item) {
      const spuId = item.productSpuId || item.id
      if (!spuId) {
        uni.showToast({ title: '商品ID不存在', icon: 'none' })
        return
      }
      uni.navigateTo({
        url: `/pages/shop/product-detail?id=${spuId}`
      })
    },

    // 联系商家
    contactMerchant() {
      if (!this.shop) {
        uni.showToast({
          title: '商家信息不存在',
          icon: 'none'
        })
        return
      }

      const hasPhone = !!this.shop.contactPhone
      const itemList = hasPhone ? ['拨打电话', '在线咨询'] : ['在线咨询']

      uni.showActionSheet({
        itemList,
        success: (res) => {
          const index = res.tapIndex
          if (hasPhone) {
            if (index === 0) {
              this.callMerchant()
            } else if (index === 1) {
              this.onlineConsultMerchant()
            }
          } else {
            if (index === 0) {
              this.onlineConsultMerchant()
            }
          }
        }
      })
    },

    // 拨打商家电话
    callMerchant() {
      const phone = this.shop && this.shop.contactPhone
      if (!phone) {
        uni.showToast({
          title: '该商家未提供电话',
          icon: 'none'
        })
        return
      }

      uni.makePhoneCall({
        phoneNumber: phone
      })
    },

    // 在线咨询商家（参考联系设计师逻辑）
    async onlineConsultMerchant() {
      if (!isUserLoggedIn()) {
        handleNotLoggedIn()
        return
      }

      if (!this.shop || !this.shop.userId) {
        uni.showToast({
          title: '商家用户信息缺失',
          icon: 'none'
        })
        return
      }

      await createConversationAndNavigate(
        this.shop.userId,
        this.shop.shopName || '商家',
        this.shop.shopAvatar || ''
      )
    }
  }
}
</script>

<style scoped>
.shop-detail-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.loading-state {
  padding: 100rpx 0;
}

.shop-info-section {
  background: white;
  margin-bottom: 20rpx;
}

.shop-header {
  display: flex;
  align-items: center;
  padding: 40rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.shop-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  margin-right: 30rpx;
  background-color: #f0f0f0;
}

.shop-basic-info {
  flex: 1;
}

.shop-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 12rpx;
}

.shop-rating {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.rating-text {
  font-size: 28rpx;
  color: #ffa500;
  margin-left: 8rpx;
}

.shop-status-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
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

.online-status {
  font-size: 24rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  display: inline-block;
}

.online-0 {
  background-color: #f6ffed;
  color: #52c41a;
}

.online-1 {
  background-color: #fff7e6;
  color: #fa8c16;
}

.online-2 {
  background-color: #fff1f0;
  color: #ff4d4f;
}

.shop-detail-card {
  padding: 30rpx 40rpx;
}

.shop-contact-bar {
  padding: 0 40rpx 30rpx 40rpx;
}

.contact-merchant-btn {
  width: 100%;
  background: linear-gradient(135deg, #6a11cb, #a78bfa);
  color: #ffffff;
  border: none;
  border-radius: 40rpx;
  padding: 22rpx 0;
  font-size: 30rpx;
  font-weight: 500;
}

.contact-merchant-btn:active {
  opacity: 0.9;
  transform: scale(0.98);
}

.detail-item {
  margin-bottom: 24rpx;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-size: 26rpx;
  color: #999;
  display: block;
  margin-bottom: 8rpx;
}

.detail-value {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
}

.products-section {
  background: white;
  min-height: 400rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 40rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.product-count {
  font-size: 24rpx;
  color: #999;
}

.product-scroll {
  height: calc(100vh - 500rpx);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  padding: 20rpx;
}

.product-card {
  background: white;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.product-image-wrapper {
  position: relative;
  width: 100%;
  height: 300rpx;
  background-color: #f5f5f5;
}

.product-image {
  width: 100%;
  height: 100%;
}

.status-badge {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
}

.status-badge.on {
  background-color: rgba(82, 196, 26, 0.9);
  color: white;
}

.status-badge.off {
  background-color: rgba(140, 140, 140, 0.9);
  color: white;
}

.product-info {
  padding: 20rpx;
}

.product-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 12rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price-row {
  margin-bottom: 12rpx;
}

.price {
  font-size: 32rpx;
  color: #fa541c;
  font-weight: bold;
}

.product-desc {
  font-size: 24rpx;
  color: #666;
  line-height: 1.4;
  height: 68rpx;
  overflow: hidden;
  display: block;
  margin-bottom: 12rpx;
}

.product-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 22rpx;
  color: #999;
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
  font-size: 28rpx;
  color: #999;
}
</style>











