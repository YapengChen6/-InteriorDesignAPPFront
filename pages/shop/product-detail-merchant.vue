<template>
  <view class="product-detail-page">
    <scroll-view class="detail-scroll" scroll-y>
      <!-- 图片轮播 -->
      <view class="media-section" v-if="imageList.length">
        <view class="swiper-container">
          <swiper
            ref="swiper"
            class="media-swiper"
            :indicator-dots="true"
            :autoplay="true"
            :interval="3000"
            :duration="500"
            circular
            :current="currentSwiperIndex"
            @change="onSwiperChange"
          >
            <swiper-item v-for="(img, index) in imageList" :key="index">
              <image
                :src="img.fileUrl || img.url || img"
                class="swiper-image"
                mode="aspectFill"
                @click="previewImage(index)"
              ></image>
            </swiper-item>
          </swiper>
          <!-- 左右切换按钮 -->
          <view class="swiper-nav-btn swiper-nav-prev" v-if="imageList.length > 1" @click.stop="prevImage">
            <text class="nav-icon">‹</text>
          </view>
          <view class="swiper-nav-btn swiper-nav-next" v-if="imageList.length > 1" @click.stop="nextImage">
            <text class="nav-icon">›</text>
          </view>
        </view>
      </view>
      <view class="media-section" v-else>
        <image
          src="/static/images/default-product.jpg"
          class="swiper-image"
          mode="aspectFill"
        ></image>
      </view>

      <!-- 价格 / 状态 -->
      <view class="price-panel">
        <view class="price-row">
          <text class="price">￥{{ formatPrice(product.marketPrice) }}</text>
          <view
            class="status-pill"
            :class="productStatus === '0' ? 'on' : 'off'"
          >
            {{ productStatus === '0' ? '上架中' : '已下架' }}
          </view>
        </view>
        <text class="meta-text" v-if="product.categoryPath">
          分类路径：{{ product.categoryPath }}
        </text>
      </view>

      <!-- 商家信息 -->
      <view class="shop-info-panel" v-if="product.shopId || product.shopName" @click="goToShopDetail">
        <view class="shop-info-content">
          <image 
            class="shop-avatar" 
            :src="getShopAvatar()"
            mode="aspectFill"
          ></image>
          <view class="shop-info-text">
            <text class="shop-name">{{ product.shopName || '商家店铺' }}</text>
            <text class="shop-desc">点击查看商家详情</text>
          </view>
          <uni-icons type="arrowright" size="20" color="#999"></uni-icons>
        </view>
      </view>

      <!-- 规格选择 -->
      <view class="info-panel" v-if="skuList.length > 0">
        <text class="panel-title">规格选择</text>
        <view class="sku-tags">
          <view
            class="sku-tag"
            v-for="sku in skuList"
            :key="getSkuId(sku)"
            :class="{ active: selectedSkuId === getSkuId(sku) }"
            @click="selectSku(sku)"
          >
            {{ formatSkuText(sku) }}
          </view>
        </view>
      </view>

      <!-- 基本信息 -->
      <view class="info-panel">
        <text class="panel-title">基础信息</text>
        <view class="info-item">
          <text class="label">商品名称</text>
          <text class="value">{{ product.productName || '-' }}</text>
        </view>
        <view class="info-item">
          <text class="label">规格类型</text>
          <text class="value">{{ getSpecTypeText(product.specType) }}</text>
        </view>
        <view class="info-item">
          <text class="label">总库存</text>
          <text class="value">{{ totalStock }}</text>
        </view>
        <view class="info-item">
          <text class="label">销量</text>
          <text class="value">{{ product.salesVolume || 0 }}</text>
        </view>
        <view class="info-item">
          <text class="label">创建时间</text>
          <text class="value">{{ formatDate(product.createTime) }}</text>
        </view>
        <view class="info-item">
          <text class="label">更新时间</text>
          <text class="value">{{ formatDate(product.updateTime) }}</text>
        </view>
      </view>

      <!-- 商品描述 -->
      <view class="info-panel">
        <text class="panel-title">商品描述</text>
        <rich-text
          v-if="isRichContent"
          :nodes="product.productDetail"
        ></rich-text>
        <text v-else class="desc-text">
          {{ product.productDetail || '暂无更多描述' }}
        </text>
      </view>

      <!-- 图集 -->
      <view class="info-panel" v-if="imageList.length > 0">
        <text class="panel-title">图集</text>
        <view class="gallery-grid">
          <image
            v-for="(img, index) in imageList"
            :key="index"
            :src="img.fileUrl || img.url || img"
            class="gallery-image"
            mode="aspectFill"
            @click="previewImage(index)"
          ></image>
        </view>
      </view>
    </scroll-view>

    
  </view>
</template>

<script>
import * as productApi from '@/api/product.js'
import * as mediaApi from '@/api/media.js'
import * as cartApi from '@/api/cart.js'

export default {
  data() {
    return {
      spuId: null,
      loading: false,
      product: {},
      imageList: [],
      skuList: [],
      totalStock: 0,
      selectedSkuId: null,
      purchaseQuantity: 1,
      actionLoading: false,
      currentSwiperIndex: 0 // 当前轮播图索引
    }
  },
  computed: {
    isRichContent() {
      const content = this.product.productDetail
      if (!content) return false
      return /<[^>]+>/.test(content)
    },
    currentSku() {
      if (!this.selectedSkuId) return null
      return this.skuList.find(sku => this.getSkuId(sku) === this.selectedSkuId) || null
    },
    maxPurchasable() {
      if (this.currentSku) {
        const stock = this.currentSku.stock || this.currentSku.stockQuantity || this.currentSku.quantity
        return Math.max(Number(stock) || 0, 0) || 0
      }
      const base = this.totalStock || this.product.stock || 0
      return Math.max(Number(base) || 0, 0)
    },
    productStatus() {
      // 统一获取商品状态（计算属性）
      if (this.product.productStatus !== undefined) {
        return String(this.product.productStatus)
      }
      if (this.product.status !== undefined) {
        return String(this.product.status)
      }
      return '0'
    },
    canPurchase() {
      const status = this.productStatus
      const onShelf = status === '0'
      // 数据库中使用2表示多规格，0表示单规格
      return onShelf && (this.maxPurchasable > 0 || this.product.specType === '2' || this.product.specType === 2)
    },
    numberBoxMax() {
      return this.maxPurchasable > 0 ? this.maxPurchasable : 999
    }
  },
  watch: {
    maxPurchasable(val) {
      if (val && this.purchaseQuantity > val) {
        this.purchaseQuantity = val
      }
    }
  },
  methods: {
    async initPage(id) {
      if (!id) {
        uni.showToast({
          title: '缺少商品ID',
          icon: 'none'
        })
        return
      }
      this.spuId = id
      this.loading = true
      try {
        const [detailRes, imagesRes, skuRes] = await Promise.all([
          productApi.getProductSpuDetail(id),
          mediaApi.getProductSpuImages(id).catch(() => ({})),
          productApi.getProductSkusBySpuId(id).catch(() => ({}))
        ])

        if (detailRes && detailRes.code === 200) {
          this.product = detailRes.data || {}
        }

        this.imageList = this.normalizeImages(imagesRes)
        this.skuList = Array.isArray(skuRes?.data) ? skuRes.data : []
        this.totalStock = this.calculateStock()
        this.initSkuSelection()
      } catch (error) {
        console.error('加载商品详情失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    normalizeImages(imageRes) {
      if (!imageRes) return []
      if (Array.isArray(imageRes.data)) {
        return imageRes.data
      }
      if (imageRes.data?.images && Array.isArray(imageRes.data.images)) {
        return imageRes.data.images
      }
      if (imageRes.data?.data && Array.isArray(imageRes.data.data)) {
        return imageRes.data.data
      }
      return []
    },

    calculateStock() {
      if (this.skuList.length > 0) {
        return this.skuList.reduce((total, sku) => {
          const stock = sku.stock || sku.stockQuantity || sku.quantity || 0
          return total + Number(stock || 0)
        }, 0)
      }
      return this.product.stock || this.product.stockQuantity || 0
    },

    formatPrice(price) {
      if (!price && price !== 0) return '0.00'
      const num = Number(price)
      if (Number.isNaN(num)) return '0.00'
      return num.toFixed(2)
    },

    getSpecTypeText(specType) {
      const map = {
        '0': '单规格',
        '2': '多规格'
      }
      return map[String(specType)] || '未知'
    },

    formatDate(date) {
      if (!date) return '-'
      return new Date(date).toLocaleString()
    },

    initSkuSelection() {
      if (this.skuList.length > 0) {
        this.selectedSkuId = this.getSkuId(this.skuList[0])
      } else {
        this.selectedSkuId = null
      }
    },

    previewImage(index) {
      const urls = this.imageList.map(
        img => img.fileUrl || img.url || img
      )
      uni.previewImage({
        urls,
        current: urls[index] || urls[0]
      })
    },
    
    // 轮播图切换事件
    onSwiperChange(e) {
      this.currentSwiperIndex = e.detail.current
    },
    
    // 上一张图片
    prevImage() {
      if (this.imageList.length <= 1) return
      // 由于使用了 circular，直接计算索引即可
      const prevIndex = this.currentSwiperIndex - 1
      this.currentSwiperIndex = prevIndex < 0 ? this.imageList.length - 1 : prevIndex
      // 通过修改 current 属性触发 swiper 切换
      this.$nextTick(() => {
        if (this.$refs.swiper) {
          // uni-app 的 swiper 组件会自动响应 current 的变化
        }
      })
    },
    
    // 下一张图片
    nextImage() {
      if (this.imageList.length <= 1) return
      // 由于使用了 circular，直接计算索引即可
      const nextIndex = this.currentSwiperIndex + 1
      this.currentSwiperIndex = nextIndex >= this.imageList.length ? 0 : nextIndex
      // 通过修改 current 属性触发 swiper 切换
      this.$nextTick(() => {
        if (this.$refs.swiper) {
          // uni-app 的 swiper 组件会自动响应 current 的变化
        }
      })
    },
    
    // 跳转到商家详情页
    goToShopDetail() {
      const shopId = this.product.shopId
      if (!shopId) {
        uni.showToast({ title: '商家信息不存在', icon: 'none' })
        return
      }
      uni.navigateTo({
        url: `/pages/shop/shop-detail?shopId=${shopId}`
      })
    },
    
    // 获取商家头像
    getShopAvatar() {
      if (this.product && this.product.shopAvatar) {
        return this.product.shopAvatar
      }
      return '/static/images/default-shop.png'
    },

    getSkuId(sku) {
      return sku?.productSkuId || sku?.skuId || sku?.id || ''
    },

    formatSkuText(sku) {
      if (!sku) return '默认规格'
      const detail = sku.skuDetail || sku.detail
      if (detail) {
        try {
          const parsed = typeof detail === 'string' ? JSON.parse(detail) : detail
          if (parsed?.combination?.length) {
            return parsed.combination
              .map(item => `${item.name || item.attrName || ''}${item.value ? ':' : ''}${item.value || item.attrValue || ''}`.trim())
              .filter(Boolean)
              .join(' / ')
          }
          if (parsed?.description) return parsed.description
        } catch (error) {
          // ignore parse error
        }
      }
      return sku.skuName || sku.name || '默认规格'
    },

    selectSku(sku) {
      this.selectedSkuId = this.getSkuId(sku)
      if (this.maxPurchasable && this.purchaseQuantity > this.maxPurchasable) {
        this.purchaseQuantity = this.maxPurchasable
      }
    },

    handleQuantityChange(val) {
      const quantity = Number(val)
      if (!quantity || quantity < 1) {
        this.purchaseQuantity = 1
        return
      }
      if (this.maxPurchasable && quantity > this.maxPurchasable) {
        this.purchaseQuantity = this.maxPurchasable
        uni.showToast({ title: '超过库存数量', icon: 'none' })
        return
      }
      this.purchaseQuantity = quantity
    },

    getSpuId() {
      return this.product.productSpuId || this.product.spuId || this.spuId
    },

    ensurePurchaseReady() {
      if (!this.canPurchase) {
        uni.showToast({ title: '商品不可购买', icon: 'none' })
        return false
      }
      if (this.skuList.length > 0 && !this.selectedSkuId) {
        uni.showToast({ title: '请选择商品规格', icon: 'none' })
        return false
      }
      if (this.maxPurchasable && this.purchaseQuantity > this.maxPurchasable) {
        uni.showToast({ title: '库存不足', icon: 'none' })
        return false
      }
      return true
    },

    async submitCart(goCart = false) {
      if (!this.ensurePurchaseReady()) return
      const payload = {
        spuId: this.getSpuId(),
        skuId: this.selectedSkuId,
        quantity: this.purchaseQuantity
      }
      this.actionLoading = true
      try {
        const res = await cartApi.addCartItem(payload)
        if (res && (res.code === 200 || res.success)) {
          uni.showToast({ title: '已加入购物车', icon: 'success' })
          if (goCart) {
            uni.navigateTo({ url: '/pages/shop/cart' })
          }
        } else {
          uni.showToast({ title: res?.msg || '操作失败', icon: 'none' })
        }
      } catch (error) {
        console.error('购物车操作失败:', error)
        uni.showToast({ title: error.message || '操作失败', icon: 'none' })
      } finally {
        this.actionLoading = false
      }
    },

    handleAddToCart() {
      this.submitCart(false)
    },

    handleBuyNow() {
      this.submitCart(true)
    }
  },
  onLoad(options) {
    if (options?.id) {
      this.initPage(options.id)
    } else {
      uni.showToast({
        title: '缺少商品ID',
        icon: 'none'
      })
    }
  }
}
</script>

<style scoped>
.product-detail-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  display: flex;
  flex-direction: column;
}

.detail-scroll {
  flex: 1;
  padding-bottom: 160rpx;
}

.media-section {
  background-color: #fff;
  position: relative;
}

.swiper-container {
  position: relative;
  width: 100%;
}

.media-swiper {
  height: 460rpx;
}

.swiper-image {
  width: 100%;
  height: 460rpx;
  object-fit: cover;
}

.swiper-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 60rpx;
  height: 60rpx;
  background-color: rgba(0, 0, 0, 0.4);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  cursor: pointer;
  transition: background-color 0.3s;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.swiper-nav-btn:active {
  background-color: rgba(0, 0, 0, 0.6);
}

.swiper-nav-prev {
  left: 20rpx;
}

.swiper-nav-next {
  right: 20rpx;
}

.nav-icon {
  font-size: 40rpx;
  color: #fff;
  font-weight: bold;
  line-height: 1;
}

.price-panel {
  background-color: #fff;
  margin-top: 18rpx;
  padding: 28rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.price {
  font-size: 40rpx;
  font-weight: 700;
  color: #ff2d55;
}

.status-pill {
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: #fff;
}

.status-pill.on {
  background: linear-gradient(135deg, #ff9a9e, #fad0c4);
}

.status-pill.off {
  background: #c0c4cc;
}

.cost-price {
  font-size: 26rpx;
  color: #606266;
}

.meta-text {
  font-size: 24rpx;
  color: #909399;
}

.shop-info-panel {
  margin-top: 18rpx;
  background-color: #fff;
  padding: 28rpx;
  border-radius: 0;
}

.shop-info-content {
  display: flex;
  align-items: center;
}

.shop-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  background-color: #f0f0f0;
}

.shop-info-text {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.shop-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 8rpx;
}

.shop-desc {
  font-size: 24rpx;
  color: #999;
}

.info-panel {
  margin-top: 18rpx;
  background-color: #fff;
  padding: 28rpx;
  border-radius: 0;
}

.panel-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
  margin-bottom: 18rpx;
  display: block;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  font-size: 26rpx;
  border-bottom: 1rpx dashed #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  color: #909399;
}

.value {
  color: #303133;
}

.desc-text {
  font-size: 26rpx;
  color: #606266;
  line-height: 1.6;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.gallery-image {
  width: 100%;
  height: 240rpx;
  border-radius: 12rpx;
}

.sku-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.sku-tag {
  padding: 12rpx 24rpx;
  border-radius: 999rpx;
  border: 1rpx solid #e5e5e5;
  font-size: 24rpx;
  color: #606266;
  background: #fff;
}

.sku-tag.active {
  border-color: #fa541c;
  color: #fa541c;
  background: rgba(250, 84, 28, 0.08);
}

.detail-action-bar {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 20rpx 28rpx env(safe-area-inset-bottom);
  box-shadow: 0 -8rpx 24rpx rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.quantity-box {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.qty-label {
  font-size: 26rpx;
  color: #606266;
}

.action-buttons {
  flex: 1;
  display: flex;
  gap: 16rpx;
}

.bar-btn {
  flex: 1;
  border-radius: 999rpx;
  font-size: 28rpx;
  padding: 20rpx;
}

.bar-btn.ghost {
  border: 2rpx solid #fa541c;
  color: #fa541c;
  background: #fff;
}

.bar-btn.primary {
  border: none;
  color: #fff;
  background: linear-gradient(135deg, #ff7a45, #fa541c);
  box-shadow: 0 10rpx 24rpx rgba(250, 84, 28, 0.35);
}
</style>


