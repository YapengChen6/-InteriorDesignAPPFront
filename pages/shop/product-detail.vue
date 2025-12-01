<template>
  <view class="product-detail-page">
    <view class="nav-bar">
      <text class="back-icon" @click="goBack">←</text>
      <text class="nav-title">{{ product.productName || '商品详情' }}</text>
      <view class="nav-placeholder"></view>
    </view>

    <scroll-view class="detail-scroll" scroll-y>
      <!-- 图片轮播 -->
      <view class="media-section" v-if="imageList.length">
        <swiper
          class="media-swiper"
          :indicator-dots="true"
          :autoplay="false"
          circular
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
            :class="product.status === '0' ? 'on' : 'off'"
          >
            {{ product.status === '0' ? '上架中' : '已下架' }}
          </view>
        </view>
        <text class="cost-price" v-if="product.costPrice">
          成本价 ￥{{ formatPrice(product.costPrice) }}
        </text>
        <text class="meta-text" v-if="product.categoryPath">
          分类路径：{{ product.categoryPath }}
        </text>
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

export default {
  data() {
    return {
      spuId: null,
      loading: false,
      product: {},
      imageList: [],
      skuList: [],
      totalStock: 0
    }
  },
  computed: {
    isRichContent() {
      const content = this.product.productDetail
      if (!content) return false
      return /<[^>]+>/.test(content)
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
        '1': '多规格',
        '2': '无规格'
      }
      return map[String(specType)] || '未知'
    },

    formatDate(date) {
      if (!date) return '-'
      return new Date(date).toLocaleString()
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

    goBack() {
      uni.navigateBack()
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

.nav-bar {
  padding: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;
}

.back-icon {
  font-size: 32rpx;
  color: #303133;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #303133;
}

.nav-placeholder {
  width: 32rpx;
}

.detail-scroll {
  flex: 1;
}

.media-section {
  background-color: #fff;
}

.media-swiper {
  height: 460rpx;
}

.swiper-image {
  width: 100%;
  height: 460rpx;
  object-fit: cover;
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
</style>


