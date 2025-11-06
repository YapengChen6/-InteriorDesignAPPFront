<template>
  <view class="product-management">
    <!-- 搜索和添加按钮 -->
    <view class="top-section">
      <view class="search-box">
        <uni-icons type="search" size="18" color="#999"></uni-icons>
        <input 
          class="search-input" 
          placeholder="搜索产品名称、类别、详情..." 
          v-model="searchQuery"
          @input="handleSearch"
        />
        <uni-icons 
          v-if="searchQuery" 
          type="clear" 
          size="18" 
          color="#999"
          @click="searchQuery = ''; handleSearch()"
          class="clear-icon"
        ></uni-icons>
      </view>
      <button class="add-btn" @click="handleAddProduct">
        <uni-icons type="plus" size="16" color="#fff"></uni-icons>
        上架新产品
      </button>
    </view>

    <!-- 筛选栏 -->
    <view class="filter-section">
      <view class="filter-group">
        <picker 
          @change="onCategoryChange" 
          :value="categoryIndex" 
          :range="categoryOptions"
          class="filter-picker"
        >
          <view class="filter-box">
            <text class="filter-text">{{ categoryOptions[categoryIndex] }}</text>
            <uni-icons type="arrowdown" size="14" color="#666"></uni-icons>
          </view>
        </picker>
        
        <picker 
          @change="onStatusChange" 
          :value="statusIndex" 
          :range="statusOptions"
          class="filter-picker"
        >
          <view class="filter-box">
            <text class="filter-text">{{ statusOptions[statusIndex] }}</text>
            <uni-icons type="arrowdown" size="14" color="#666"></uni-icons>
          </view>
        </picker>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading && products.length === 0">
      <uni-load-more status="loading" content="正在加载..."></uni-load-more>
    </view>

    <!-- 产品网格 -->
    <scroll-view 
      class="product-grid" 
      scroll-y
      @scrolltolower="handleReachBottom"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="handlePullDownRefresh"
    >
      <view class="grid-container">
        <view 
          class="product-card" 
          v-for="(product, index) in filteredProducts" 
          :key="product.id"
        >
          <!-- 商品图片 -->
          <view class="product-image">
            <image 
              :src="getProductImage(product)" 
              mode="aspectFill" 
              class="image"
              @error="onImageError(product)"
              lazy-load
            ></image>
            <!-- 状态标签 -->
            <view class="status-badge" :class="product.status === '0' ? 'status-on' : 'status-off'">
              {{ product.status === '0' ? '上架' : '下架' }}
            </view>
          </view>
          
          <!-- 商品信息 -->
          <view class="product-info">
            <text class="product-name">{{ product.productName }}</text>
            <text class="product-category">{{ product.category }}</text>
            <text class="product-detail">{{ product.productDetail }}</text>
            <view class="price-section">
              <text class="market-price">￥{{ formatPrice(product.marketPrice) }}</text>
              <text class="cost-price" v-if="product.costPrice">成本: ￥{{ formatPrice(product.costPrice) }}</text>
            </view>
            <text class="product-stock">库存: {{ product.stock }}</text>
            <text class="spec-type">规格类型: {{ getSpecTypeText(product.specType) }}</text>
          </view>
          
          <!-- 操作按钮 -->
          <view class="action-buttons">
            <button class="status-btn" @click="toggleProductStatus(product)" :disabled="actionLoading">
              <uni-icons 
                :type="product.status === '0' ? 'arrowdown' : 'arrowup'" 
                size="14" 
                :color="product.status === '0' ? '#E6A23C' : '#67C23A'"
              ></uni-icons>
              {{ product.status === '0' ? '下架' : '上架' }}
            </button>
            <button class="edit-btn" @click="handleEdit(product)" :disabled="actionLoading">
              <uni-icons type="compose" size="14" color="#409EFF"></uni-icons>
              编辑
            </button>
            <button class="delete-btn" @click="handleDelete(product)" :disabled="actionLoading">
              <uni-icons type="trash" size="14" color="#F56C6C"></uni-icons>
              删除
            </button>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view class="load-more" v-if="products.length > 0">
        <uni-load-more 
          :status="loadMoreStatus" 
          :content-text="{
            contentdown: '上拉加载更多',
            contentrefresh: '正在加载...',
            contentnomore: '没有更多数据了'
          }"
        ></uni-load-more>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="!loading && filteredProducts.length === 0">
        <image src="/static/images/empty-product.png" class="empty-image"></image>
        <text class="empty-text">暂无产品数据</text>
        <button class="empty-btn" @click="handleAddProduct">立即添加产品</button>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import productApi from '@/api/productSpu.js';

export default {
  data() {
    return {
      searchQuery: '',
      categoryIndex: 0,
      statusIndex: 0,
      categoryOptions: ['全部', '建材', '家具', '灯具', '厨卫', '软装', '饰品', '家电', '全屋定制', '其他'],
      statusOptions: ['全部', '上架', '下架'],
      products: [],
      loading: false,
      refreshing: false,
      loadMoreStatus: 'more',
      pageParams: {
        pageNum: 1,
        pageSize: 10,
        total: 0
      },
      searchTimer: null,
      actionLoading: false
    }
  },
  
  computed: {
    filteredProducts() {
      let filtered = [...this.products];
      
      // 搜索过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(product => 
          product.productName.toLowerCase().includes(query) || 
          (product.category && product.category.toLowerCase().includes(query)) ||
          (product.productDetail && product.productDetail.toLowerCase().includes(query))
        );
      }
      
      // 类别过滤
      if (this.categoryIndex > 0) {
        const category = this.categoryOptions[this.categoryIndex];
        filtered = filtered.filter(product => 
          product.category === category
        );
      }
      
      // 状态过滤 ('0':上架, '2':下架)
      if (this.statusIndex > 0) {
        const statusValue = this.statusIndex === 1 ? '0' : '2';
        filtered = filtered.filter(product => 
          product.status === statusValue
        );
      }
      
      return filtered;
    }
  },
  
  methods: {
    // 获取商品图片
    getProductImage(product) {
      if (product.coverImages && product.coverImages.length > 0) {
        // 按sequence排序，取第一张图片
        const sortedImages = [...product.coverImages].sort((a, b) => a.sequence - b.sequence);
        const mainImage = sortedImages[0];
        if (mainImage && mainImage.fileUrl) {
          // 处理blob URL和正常URL
          if (mainImage.fileUrl.startsWith('blob:')) {
            return mainImage.fileUrl;
          } else {
            return mainImage.fileUrl;
          }
        }
      }
      return '/static/images/default-product.jpg';
    },

    // 获取规格类型文本
    getSpecTypeText(specType) {
      const specTypes = {
        '0': '单规格',
        '1': '多规格',
        '2': '无规格'
      };
      return specTypes[specType] || '未知';
    },

    // 检查网络状态
    async checkNetworkStatus() {
      return new Promise((resolve, reject) => {
        uni.getNetworkType({
          success: (res) => {
            console.log('📶 当前网络状态:', res.networkType);
            if (res.networkType === 'none') {
              reject(new Error('网络连接不可用，请检查网络设置'));
            } else {
              resolve();
            }
          },
          fail: (err) => {
            console.error('❌ 网络状态检查失败:', err);
            reject(new Error('网络状态检查失败'));
          }
        });
      });
    },

    // 加载商品列表 - 使用新的接口
    async loadProducts() {
      if (this.loading && this.pageParams.pageNum > 1) {
        return;
      }
      
      this.loading = true;
      try {
        // 检查网络状态
        await this.checkNetworkStatus();
        
        // 构建请求参数
        const requestParams = {
          pageNum: this.pageParams.pageNum,
          pageSize: this.pageParams.pageSize
        };
        
        // 添加搜索条件
        if (this.searchQuery) {
          requestParams.productName = this.searchQuery;
        }
        
        // 添加分类条件
        if (this.categoryIndex > 0) {
          requestParams.category = this.categoryOptions[this.categoryIndex];
        }
        
        // 添加状态条件
        if (this.statusIndex > 0) {
          requestParams.productStatus = this.getStatusValue();
        }
        
        console.log('📤 发送GET请求参数:', requestParams);
        
        // 使用新的接口获取带媒体信息的商品列表
        const res = await productApi.getProductListWithMedia(requestParams);
        console.log('✅ 接口响应成功:', res);
        
        if (res.code === 200) {
          const productList = res.data || [];
          if (this.pageParams.pageNum === 1) {
            this.products = this.formatProductData(productList);
          } else {
            this.products = [...this.products, ...this.formatProductData(productList)];
          }
          
          // 注意：新接口可能没有返回total字段，需要根据实际情况调整
          this.pageParams.total = res.total || productList.length;
          
          if (this.products.length >= this.pageParams.total) {
            this.loadMoreStatus = 'noMore';
          } else {
            this.loadMoreStatus = 'more';
          }
          
          console.log(`✅ 成功加载 ${this.products.length} 个商品`);
        } else {
          console.error('❌ 接口返回错误:', res);
          uni.showToast({
            title: res.message || '获取商品列表失败',
            icon: 'none',
            duration: 3000
          });
        }
      } catch (error) {
        console.error('💥 加载商品列表失败:', error);
        uni.showToast({
          title: error.message || '加载失败，请重试',
          icon: 'none',
          duration: 3000
        });
      } finally {
        this.loading = false;
        this.refreshing = false;
        uni.stopPullDownRefresh();
      }
    },

    // 获取状态值 ('0':上架, '2':下架)
    getStatusValue() {
      if (this.statusIndex === 0) return ''; // 全部
      if (this.statusIndex === 1) return '0'; // 上架
      if (this.statusIndex === 2) return '2'; // 下架
      return '';
    },
    
    // 格式化商品数据 - 根据新接口结构调整
    formatProductData(products) {
      return products.map(product => ({
        id: product.productSpuId,
        productName: product.productName,
        category: product.category,
        productDetail: product.productDetail,
        marketPrice: product.marketPrice,
        costPrice: product.costPrice,
        status: product.productStatus,
        stock: product.stock,
        specType: product.specType,
        coverImages: product.coverImages || [],
        originalData: product
      }));
    },
    
    // 格式化价格
    formatPrice(price) {
      if (!price) return '0.00';
      return parseFloat(price).toFixed(2);
    },
    
    onImageError(product) {
      console.log('🖼️ 图片加载失败，使用默认图片');
      // 这里可以设置一个默认图片标记，但实际图片URL已经在getProductImage中处理
    },
    
    handleSearch() {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        this.pageParams.pageNum = 1;
        this.loadProducts();
      }, 500);
    },
    
    onCategoryChange(e) {
      this.categoryIndex = parseInt(e.detail.value);
      this.pageParams.pageNum = 1;
      this.loadProducts();
    },
    
    onStatusChange(e) {
      this.statusIndex = parseInt(e.detail.value);
      this.pageParams.pageNum = 1;
      this.loadProducts();
    },
    
    // 添加新产品
    handleAddProduct() {
      uni.navigateTo({
        url: '/pages/merchant/newshop?type=add'
      });
    },
    
    // 编辑产品
    handleEdit(product) {
      uni.navigateTo({
        url: `/pages/merchant/productupdate?type=edit&id=${product.id}`
      });
    },
    
    // 删除产品
    async handleDelete(product) {
      if (this.actionLoading) return;
      
      uni.showModal({
        title: '确认删除',
        content: `确定要删除"${product.productName}"吗？此操作不可恢复。`,
        confirmColor: '#F56C6C',
        success: async (res) => {
          if (res.confirm) {
            await this.deleteProduct(product.id);
          }
        }
      });
    },
    
    async deleteProduct(id) {
      this.actionLoading = true;
      try {
        // 检查网络状态
        await this.checkNetworkStatus();
        
        uni.showLoading({
          title: '删除中...',
          mask: true
        });
        
        console.log(`🗑️ 开始删除商品 ID: ${id}`);
        
        const res = await productApi.deleteProduct(id);
        
        uni.hideLoading();
        
        console.log('✅ 删除接口响应:', res);
        
        if (res.code === 200) {
          uni.showToast({
            title: '删除成功',
            icon: 'success',
            duration: 2000
          });
          setTimeout(() => {
            this.pageParams.pageNum = 1;
            this.loadProducts();
          }, 500);
        } else {
          uni.showToast({
            title: res.msg || '删除失败',
            icon: 'none',
            duration: 3000
          });
        }
      } catch (error) {
        console.error('💥 删除商品失败:', error);
        uni.hideLoading();
        uni.showToast({
          title: error.message || '删除失败，请重试',
          icon: 'none',
          duration: 3000
        });
      } finally {
        this.actionLoading = false;
      }
    },
    
    // 上架/下架商品 ('0':上架, '2':下架)
    async toggleProductStatus(product) {
      if (this.actionLoading) return;
      
      try {
        const newStatus = product.status === '0' ? '2' : '0';
        const action = newStatus === '0' ? '上架' : '下架';
        
        uni.showModal({
          title: '确认操作',
          content: `确定要${action}商品"${product.productName}"吗？`,
          success: async (res) => {
            if (res.confirm) {
              await this.doUpdateStatusWithRetry(product, newStatus, action);
            }
          }
        });
      } catch (error) {
        console.error('更新商品状态失败:', error);
      }
    },
    
    // 带重试机制的状态更新
    async doUpdateStatusWithRetry(product, newStatus, action, retries = 2) {
      for (let i = 0; i < retries; i++) {
        try {
          console.log(`🔄 第 ${i + 1} 次尝试更新状态`);
          await this.doUpdateStatus(product, newStatus, action);
          return;
        } catch (error) {
          console.warn(`⚠️ 第 ${i + 1} 次尝试失败:`, error);
          if (i === retries - 1) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    },
    
    async doUpdateStatus(product, newStatus, action) {
      this.actionLoading = true;
      try {
        await this.checkNetworkStatus();
        
        uni.showLoading({
          title: `${action}中...`,
          mask: true
        });

        console.log(`🔄 开始更新商品状态 - ID: ${product.id}, 新状态: ${newStatus}`);
        
        let res;
        
        try {
          res = await productApi.updateProductStatus(product.id, newStatus);
          console.log('✅ 状态更新接口响应:', res);
        } catch (apiError) {
          console.warn('⚠️ 状态更新接口失败，错误信息:', apiError);
          
          // 使用通用更新接口
          const updateData = {
            productSpuId: product.id,
            productName: product.productName,
            productDetail: product.productDetail,
            category: product.category,
            productStatus: newStatus,
            marketPrice: product.marketPrice,
            costPrice: product.costPrice,
            stock: product.stock,
            specType: product.specType
          };
          
          console.log('📤 通用更新接口参数:', updateData);
          res = await productApi.updateProduct(updateData);
          console.log('✅ 通用更新接口响应:', res);
        }

        uni.hideLoading();

        if (res.code === 200) {
          uni.showToast({
            title: `${action}成功`,
            icon: 'success',
            duration: 2000
          });
          
          // 更新本地状态
          const productIndex = this.products.findIndex(p => p.id === product.id);
          if (productIndex !== -1) {
            this.products[productIndex].status = newStatus;
            this.$forceUpdate();
          }
          
          console.log(`✅ 商品状态更新成功，本地状态已同步`);
        } else {
          console.error('❌ 接口返回错误:', res);
          uni.showToast({
            title: res.msg || `${action}失败`,
            icon: 'none',
            duration: 3000
          });
          throw new Error(res.msg || `${action}失败`);
        }
      } catch (error) {
        console.error('💥 更新商品状态失败:', error);
        uni.hideLoading();
        uni.showToast({
          title: error.message || '操作失败，请重试',
          icon: 'none',
          duration: 3000
        });
        throw error;
      } finally {
        this.actionLoading = false;
      }
    },
    
    // 下拉刷新
    handlePullDownRefresh() {
      this.refreshing = true;
      this.pageParams.pageNum = 1;
      this.loadProducts();
    },
    
    // 上拉加载更多
    handleReachBottom() {
      if (this.loading || this.loadMoreStatus === 'noMore') {
        return;
      }
      
      this.loadMoreStatus = 'loading';
      this.pageParams.pageNum++;
      this.loadProducts();
    }
  },
  
  onLoad() {
    console.log('🚀 商品管理页面加载');
    this.loadProducts();
  },
  
  onShow() {
    console.log('🔄 商品管理页面显示，刷新数据');
    this.pageParams.pageNum = 1;
    this.loadProducts();
  },
  
  onPullDownRefresh() {
    console.log('⬇️ 触发下拉刷新');
    this.handlePullDownRefresh();
  },
  
  onReachBottom() {
    console.log('⬆️ 触发上拉加载更多');
    this.handleReachBottom();
  }
}
</script>

<style lang="scss" scoped>
.product-management {
  padding: 30rpx;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.top-section {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 30rpx;
  
  .search-box {
    display: flex;
    align-items: center;
    background: #fff;
    border-radius: 12rpx;
    padding: 20rpx 24rpx;
    border: 1rpx solid #e1e5eb;
    position: relative;
    
    .search-input {
      flex: 1;
      margin-left: 16rpx;
      font-size: 28rpx;
      height: 40rpx;
      line-height: 40rpx;
    }
    
    .clear-icon {
      margin-left: 16rpx;
    }
  }
  
  .add-btn {
    background: #409EFF;
    color: #fff;
    border: none;
    border-radius: 12rpx;
    padding: 24rpx;
    font-size: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: auto;
    min-height: 88rpx;
    line-height: normal;
    
    &::after {
      border: none;
    }
  }
}

.filter-section {
  margin-bottom: 30rpx;
  
  .filter-group {
    display: flex;
    gap: 20rpx;
    
    .filter-picker {
      flex: 1;
      
      .filter-box {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #fff;
        border-radius: 12rpx;
        padding: 20rpx 24rpx;
        border: 1rpx solid #e1e5eb;
        
        .filter-text {
          font-size: 26rpx;
          color: #333;
        }
      }
    }
  }
}

.loading-state {
  padding: 100rpx 0;
  text-align: center;
}

.product-grid {
  height: calc(100vh - 400rpx);
  
  .grid-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    
    .product-card {
      width: calc(50% - 10rpx);
      background: #fff;
      border-radius: 16rpx;
      margin-bottom: 20rpx;
      overflow: hidden;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
      
      .product-image {
        width: 100%;
        height: 300rpx;
        position: relative;
        
        .image {
          width: 100%;
          height: 100%;
        }
        
        .status-badge {
          position: absolute;
          top: 16rpx;
          right: 16rpx;
          padding: 8rpx 16rpx;
          border-radius: 20rpx;
          font-size: 22rpx;
          font-weight: 500;
          
          &.status-on {
            background: rgba(64, 158, 255, 0.9);
            color: #fff;
          }
          
          &.status-off {
            background: rgba(153, 153, 153, 0.9);
            color: #fff;
          }
        }
      }
      
      .product-info {
        padding: 24rpx;
        
        .product-name {
          display: block;
          font-size: 30rpx;
          font-weight: 600;
          color: #303133;
          margin-bottom: 12rpx;
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        
        .product-category {
          display: block;
          font-size: 24rpx;
          color: #909399;
          margin-bottom: 8rpx;
        }
        
        .product-detail {
          display: block;
          font-size: 24rpx;
          color: #606266;
          margin-bottom: 12rpx;
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        
        .price-section {
          margin-bottom: 8rpx;
          
          .market-price {
            display: block;
            font-size: 28rpx;
            color: #F56C6C;
            font-weight: 600;
            margin-bottom: 4rpx;
          }
          
          .cost-price {
            display: block;
            font-size: 22rpx;
            color: #909399;
          }
        }
        
        .product-stock {
          display: block;
          font-size: 24rpx;
          color: #909399;
          margin-bottom: 4rpx;
        }
        
        .spec-type {
          display: block;
          font-size: 22rpx;
          color: #909399;
        }
      }
      
      .action-buttons {
        display: flex;
        justify-content: space-between;
        padding: 20rpx 24rpx;
        border-top: 1rpx solid #f0f0f0;
        
        button {
          background: none;
          border: none;
          padding: 12rpx 0;
          font-size: 24rpx;
          display: flex;
          align-items: center;
          flex: 1;
          justify-content: center;
          border-radius: 8rpx;
          margin: 0 4rpx;
          transition: all 0.3s;
          
          &::after {
            border: none;
          }
          
          &:disabled {
            opacity: 0.5;
          }
        }
        
        .status-btn {
          color: #E6A23C;
          background: #fdf6ec;
        }
        
        .edit-btn {
          color: #409EFF;
          background: #f0f9ff;
        }
        
        .delete-btn {
          color: #F56C6C;
          background: #fef0f0;
        }
      }
    }
  }
  
  .load-more {
    padding: 30rpx 0;
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 120rpx 0;
    
    .empty-image {
      width: 200rpx;
      height: 200rpx;
      margin-bottom: 30rpx;
      opacity: 0.6;
    }
    
    .empty-text {
      margin-bottom: 40rpx;
      font-size: 28rpx;
      color: #909399;
    }
    
    .empty-btn {
      background: #409EFF;
      color: #fff;
      border: none;
      border-radius: 12rpx;
      padding: 20rpx 40rpx;
      font-size: 28rpx;
      
      &::after {
        border: none;
      }
    }
  }
}
</style>