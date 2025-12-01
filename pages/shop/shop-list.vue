<template>
  <view class="product-list-page">
    <!-- 顶部标题 -->
    <view class="header">
      <view class="title-wrap">
        <text class="title">好物精选</text>
        <text class="subtitle">实时同步全部商品 · 点击卡片即可查看详情</text>
      </view>
      <view class="header-badge">JD STYLE</view>
    </view>

    <!-- 搜索 & 筛选 -->
    <view class="filter-bar">
      <view class="search-box">
        <uni-icons type="search" size="18" color="#999"></uni-icons>
        <input
          class="search-input"
          placeholder="搜索商品名称、类别、详情..."
          v-model="searchQuery"
          @input="handleSearch"
        />
        <uni-icons
          v-if="searchQuery"
          type="clear"
          size="18"
          color="#999"
          class="clear-icon"
          @click="clearSearch"
        ></uni-icons>
      </view>

      <view class="tags-row">
        <view
          class="status-tag"
          :class="{ active: statusFilter === 'all' }"
          @click="changeStatusFilter('all')"
        >
          全部
        </view>
        <view
          class="status-tag"
          :class="{ active: statusFilter === '0' }"
          @click="changeStatusFilter('0')"
        >
          上架
        </view>
        <view
          class="status-tag"
          :class="{ active: statusFilter === '2' }"
          @click="changeStatusFilter('2')"
        >
          下架
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading && displayList.length === 0">
      <uni-load-more status="loading" content="正在加载商品..."></uni-load-more>
    </view>

    <!-- 商品列表 -->
    <scroll-view
      class="list-scroll"
      scroll-y
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="refresh"
    >
      <view class="product-grid" v-if="displayList.length > 0">
        <view
          v-for="item in displayList"
          :key="item.id"
          class="jd-card"
          @click="openDetail(item)"
        >
          <view class="card-media">
            <image
              class="thumb"
              :src="getProductImage(item)"
              mode="aspectFill"
            ></image>
            <view
              class="status-badge"
              :class="item.status === '0' ? 'on' : 'off'"
            >
              {{ item.status === '0' ? '上架' : '下架' }}
            </view>
            <view class="corner-tag" v-if="item.stock > 99">爆款</view>
          </view>

          <view class="card-body">
            <text class="name">{{ item.productName || '未命名商品' }}</text>
            <view class="price-row">
              <text class="price">￥{{ formatPrice(item.marketPrice) }}</text>
              <text class="sub-price" v-if="item.costPrice">
                成本 ￥{{ formatPrice(item.costPrice) }}
              </text>
            </view>
            <text class="desc">
              {{ item.productDetail || '暂无描述' }}
            </text>
            <view class="meta-row">
              <text class="stock">库存 {{ item.stock || 0 }}</text>
              <text class="category">{{ item.categoryPath || '未分类' }}</text>
            </view>
          </view>
        </view>

        <!-- 加载更多状态 -->
        <view class="load-more">
          <uni-load-more
            :status="loadMoreStatus"
            :content-text="{
              contentdown: '上拉加载更多',
              contentrefresh: '正在加载...',
              contentnomore: '没有更多商品了'
            }"
          ></uni-load-more>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="!loading && displayList.length === 0">
        <image
          src="/static/images/empty-product.png"
          class="empty-image"
        ></image>
        <text class="empty-text">暂无商品数据</text>
        <text class="empty-subtext">
          请在管理端添加商品后再来查看
        </text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import * as productApi from '@/api/product.js'
import * as mediaApi from '@/api/media.js'

export default {
  name: 'ShopProductList',
  data() {
    return {
      loading: false,
      refreshing: false,
      allProducts: [], // 后端返回的完整商品列表
      pageNum: 1,
      pageSize: 10,
      searchQuery: '',
      statusFilter: 'all', // all | '0' | '2'
      loadMoreStatus: 'more',
      productImagesMap: new Map()
    }
  },
  computed: {
    // 根据搜索和状态过滤后的完整列表
    filteredList() {
      let list = [...this.allProducts]

      // 状态筛选
      if (this.statusFilter !== 'all') {
        list = list.filter(item => String(item.status) === this.statusFilter)
      }

      // 搜索
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase()
        list = list.filter(item => {
          const name = (item.productName || '').toLowerCase()
          const cat = (item.categoryPath || '').toLowerCase()
          const detail = (item.productDetail || '').toLowerCase()
          return (
            name.includes(q) ||
            cat.includes(q) ||
            detail.includes(q)
          )
        })
      }

      return list
    },
    // 当前页需要展示的列表（前端分页）
    displayList() {
      const start = 0
      const end = this.pageNum * this.pageSize
      return this.filteredList.slice(start, end).map(p => this.wrapProduct(p))
    }
  },
  methods: {
    // 将原始商品数据包装成前端展示结构（与管理页保持一致字段）
    wrapProduct(product) {
      return {
        id: product.productSpuId || product.spuId || product.id,
        productName: product.productName,
        categoryPath: product.categoryPath,
        productDetail: product.productDetail,
        marketPrice: product.marketPrice,
        costPrice: product.costPrice,
        status: product.status !== undefined ? String(product.status) : '0',
        stock: product.stock || 0,
        imageUrl: product.imageUrl,
        coverImage: product.coverImage,
        imageList: product.imageList || [],
        originalData: product
      }
    },

    async loadData() {
      if (this.loading) return
      this.loading = true
      this.loadMoreStatus = 'loading'
      try {
        const res = await productApi.getAllProductSpus()
        if (res && res.code === 200) {
          this.allProducts = res.data || []
          // 重置页码
          this.pageNum = 1
          // 预加载当前页商品图片
          await this.loadImagesForCurrentPage()
          this.updateLoadMoreStatus()
        } else {
          this.allProducts = []
          this.loadMoreStatus = 'noMore'
        }
      } catch (e) {
        console.error('加载商品失败:', e)
        this.allProducts = []
        this.loadMoreStatus = 'noMore'
      } finally {
        this.loading = false
        this.refreshing = false
      }
    },

    async loadImagesForCurrentPage() {
      const currentPageItems = this.displayList
      const promises = currentPageItems.map(async item => {
        const spuId = item.id
        if (!spuId || this.productImagesMap.has(spuId)) return

        try {
          const imageRes = await mediaApi.getProductSpuImages(spuId)
          if (imageRes && imageRes.code === 200) {
            let images = []
            if (Array.isArray(imageRes.data)) {
              images = imageRes.data
            } else if (imageRes.data && Array.isArray(imageRes.data.images)) {
              images = imageRes.data.images
            } else if (imageRes.data && Array.isArray(imageRes.data.data)) {
              images = imageRes.data.data
            }
            images = images.filter(img => !img.delFlag || img.delFlag !== '2')
            if (images.length > 0) {
              images.sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
            }
            this.productImagesMap.set(spuId, images)
          } else {
            this.productImagesMap.set(spuId, [])
          }
        } catch (err) {
          console.error('加载商品图片失败:', err)
          this.productImagesMap.set(spuId, [])
        }
      })

      await Promise.all(promises)
    },

    // 获取展示图片 (与管理页逻辑保持基本一致)
    getProductImage(product) {
      const productId = product.id

      if (productId && this.productImagesMap.has(productId)) {
        const images = this.productImagesMap.get(productId)
        if (images && images.length > 0) {
          const firstImage = images[0]
          return firstImage.fileUrl || firstImage.url || firstImage
        }
      }

      if (product.imageUrl) return product.imageUrl
      if (product.coverImage) return product.coverImage
      if (product.imageList && product.imageList.length > 0) {
        const first = product.imageList[0]
        return typeof first === 'string'
          ? first
          : (first.fileUrl || first.url)
      }
      return '/static/images/default-product.jpg'
    },

    openDetail(product) {
      const spuId = product && product.id
      if (!spuId) {
        uni.showToast({
          title: '商品信息不完整',
          icon: 'none'
        })
        return
      }
      uni.navigateTo({
        url: `/pages/shop/product-detail?id=${spuId}`
      })
    },

    formatPrice(price) {
      if (!price && price !== 0) return '0.00'
      const num = Number(price)
      if (Number.isNaN(num)) return '0.00'
      return num.toFixed(2)
    },

    handleSearch() {
      // 重置分页，重新计算列表
      this.pageNum = 1
      this.updateLoadMoreStatus()
    },

    clearSearch() {
      this.searchQuery = ''
      this.handleSearch()
    },

    changeStatusFilter(status) {
      if (this.statusFilter === status) return
      this.statusFilter = status
      this.pageNum = 1
      this.updateLoadMoreStatus()
    },

    async loadMore() {
      if (this.loading || this.loadMoreStatus === 'noMore') return
      // 如果当前已显示数量小于过滤后总数，则继续翻页
      const total = this.filteredList.length
      const currentCount = this.displayList.length
      if (currentCount >= total) {
        this.loadMoreStatus = 'noMore'
        return
      }
      this.pageNum += 1
      this.updateLoadMoreStatus()
      // 为新页商品预加载图片
      await this.loadImagesForCurrentPage()
    },

    refresh() {
      this.refreshing = true
      this.loadData()
    },

    updateLoadMoreStatus() {
      const total = this.filteredList.length
      const currentCount = this.displayList.length
      if (currentCount >= total) {
        this.loadMoreStatus = 'noMore'
      } else {
        this.loadMoreStatus = 'more'
      }
    }
  },
  onLoad() {
    this.loadData()
  }
}
</script>

<style scoped>
.product-list-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 24rpx;
  box-sizing: border-box;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 28rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, #fef0f0, #fdf6ec);
  margin-bottom: 20rpx;
}

.title-wrap {
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 36rpx;
  font-weight: 700;
  color: #303133;
}

.subtitle {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #909399;
}

.header-badge {
  font-size: 22rpx;
  color: #ff6b6b;
  border: 1rpx solid rgba(255, 107, 107, 0.4);
  padding: 6rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.6);
}

.filter-bar {
  margin-bottom: 20rpx;
}

.search-box {
  flex-direction: row;
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  border: 1rpx solid #e1e5eb;
}

.search-input {
  flex: 1;
  margin-left: 16rpx;
  font-size: 26rpx;
  height: 40rpx;
  line-height: 40rpx;
}

.clear-icon {
  margin-left: 12rpx;
}

.tags-row {
  margin-top: 12rpx;
  display: flex;
  flex-direction: row;
  gap: 16rpx;
}

.status-tag {
  padding: 8rpx 24rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: #606266;
  background-color: #ffffff;
  border: 1rpx solid #dcdfe6;
  transition: all 0.2s;
}

.status-tag.active {
  color: #ff6b6b;
  border-color: rgba(255, 107, 107, 0.4);
  background-color: #fff5f5;
}

.loading-state {
  padding: 80rpx 0;
}

.list-scroll {
  height: calc(100vh - 260rpx);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 20rpx;
  padding-bottom: 30rpx;
}

.jd-card {
  background: #fff;
  border-radius: 18rpx;
  overflow: hidden;
  box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.4s ease;
}

.card-media {
  position: relative;
  width: 100%;
  height: 320rpx;
}

.thumb {
  width: 100%;
  height: 100%;
}

.status-badge {
  position: absolute;
  top: 16rpx;
  left: 16rpx;
  padding: 4rpx 16rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  color: #ffffff;
}

.status-badge.on {
  background: rgba(255, 87, 34, 0.9);
}

.status-badge.off {
  background: rgba(144, 147, 153, 0.9);
}

.corner-tag {
  position: absolute;
  bottom: 16rpx;
  right: 0;
  background: linear-gradient(135deg, #ff9a9e, #fad0c4);
  color: #fff;
  padding: 6rpx 24rpx;
  border-top-left-radius: 999rpx;
  border-bottom-left-radius: 999rpx;
  font-size: 20rpx;
}

.card-body {
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.name {
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
  height: 84rpx;
  overflow: hidden;
}

.price-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.price {
  font-size: 34rpx;
  color: #ff2727;
  font-weight: 700;
}

.sub-price {
  font-size: 22rpx;
  color: #909399;
}

.desc {
  font-size: 24rpx;
  color: #606266;
  line-height: 1.4;
  height: 68rpx;
  overflow: hidden;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 22rpx;
  color: #a0a3a8;
}

.load-more {
  grid-column: 1 / -1;
  padding: 24rpx 0 40rpx;
}

.empty-state {
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  display: flex;
  flex-direction: column;
}

.empty-image {
  width: 220rpx;
  height: 220rpx;
  margin-bottom: 24rpx;
  opacity: 0.8;
}

.empty-text {
  font-size: 30rpx;
  color: #606266;
  margin-bottom: 8rpx;
}

.empty-subtext {
  font-size: 24rpx;
  color: #a0a3a8;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(12rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>


