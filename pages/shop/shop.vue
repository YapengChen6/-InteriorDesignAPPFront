<template>
  <view class="product-management">
    <!-- 搜索栏 -->
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
    </view>

    <!-- 筛选栏 -->
    <view class="filter-section">
      <view class="filter-group">
        <!-- 一级分类 -->
        <picker 
          @change="onLevel1CategoryChange" 
          :value="level1CategoryIndex" 
          :range="level1CategoryOptions"
          range-key="name"
          class="filter-picker"
        >
          <view class="filter-box">
            <text class="filter-text">{{ (level1CategoryOptions[level1CategoryIndex] && level1CategoryOptions[level1CategoryIndex].name) || '一级分类' }}</text>
            <uni-icons type="arrowdown" size="14" color="#666"></uni-icons>
          </view>
        </picker>
        
        <!-- 二级分类 -->
        <picker 
          @change="onLevel2CategoryChange" 
          :value="level2CategoryIndex" 
          :range="level2CategoryOptions"
          range-key="name"
          class="filter-picker"
          :disabled="!level1CategoryIndex || level2CategoryOptions.length === 0"
        >
          <view class="filter-box" :class="{'disabled': !level1CategoryIndex || level2CategoryOptions.length === 0}">
            <text class="filter-text">{{ (level2CategoryOptions[level2CategoryIndex] && level2CategoryOptions[level2CategoryIndex].name) || '二级分类' }}</text>
            <uni-icons type="arrowdown" size="14" color="#666"></uni-icons>
          </view>
        </picker>
        
        <!-- 三级分类 -->
        <picker 
          @change="onLevel3CategoryChange" 
          :value="level3CategoryIndex" 
          :range="level3CategoryOptions"
          range-key="name"
          class="filter-picker"
          :disabled="!level2CategoryIndex || level3CategoryOptions.length === 0"
        >
          <view class="filter-box" :class="{ 'disabled': !level2CategoryIndex || level3CategoryOptions.length === 0 }">
            <text class="filter-text">{{ (level3CategoryOptions[level3CategoryIndex] && level3CategoryOptions[level3CategoryIndex].name) || '三级分类' }}</text>
            <uni-icons type="arrowdown" size="14" color="#666"></uni-icons>
          </view>
        </picker>
        
        <!-- 状态筛选 -->
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
        <template v-for="(product, index) in filteredProducts">
        <view 
            v-if="product && getProductId(product)"
          class="product-card" 
            :key="getProductId(product) || index"
        >
          <!-- 商品图片 -->
          <view class="card-media">
            <image 
              :src="getProductImage(product)" 
              mode="aspectFill" 
              class="thumb"
              @error="onImageError(product)"
              lazy-load
            ></image>
            <!-- 状态标签 -->
            <view class="status-badge" :class="getProductStatus(product) === '0' ? 'on' : 'off'">
              {{ getProductStatus(product) === '0' ? '上架' : '下架' }}
            </view>
          </view>
          
          <!-- 商品信息 -->
          <view class="product-info">
            <text class="product-name">{{ product.productName }}</text>
            <text class="product-category">{{ product.categoryPath || '未分类' }}</text>
            <text class="product-detail">{{ product.productDetail }}</text>
            <view class="price-section">
              <text class="market-price">￥{{ formatPrice(product.marketPrice) }}</text>
            </view>
            <text class="product-stock" @click.stop="goToStockManagement(product)">总库存: {{ calculateTotalStock(product) }}</text>
            <text class="spec-type">规格类型: {{ getSpecTypeText(product.specType) }}</text>
            <view 
              class="sku-summary" 
              v-if="product && getProductId(product) && productSkuSummary[getProductId(product)] && productSkuSummary[getProductId(product)].length"
            >
              <text class="sku-summary-title">SKU：</text>
              <view class="sku-summary-chips">
                <text
                  class="sku-chip"
                  v-for="(specText, skuIndex) in productSkuSummary[getProductId(product)]"
                  :key="skuIndex"
                >
                  {{ specText }}
                </text>
              </view>
            </view>
          </view>
          
          <!-- 操作按钮 -->
          <view class="action-buttons">
            <button class="view-btn" @click="viewProductDetail(product)">
              <uni-icons type="eye" size="14" color="#909399"></uni-icons>
              详情
            </button>
            <button class="stock-btn" @click="goToStockManagement(product)" :disabled="actionLoading">
              <uni-icons type="shop" size="14" color="#409EFF"></uni-icons>
              库存
            </button>
            <button class="status-btn" @click="toggleProductStatus(product)" :disabled="actionLoading">
              <uni-icons 
                :type="getProductStatus(product) === '0' ? 'arrowdown' : 'arrowup'" 
                size="14" 
                :color="getProductStatus(product) === '0' ? '#E6A23C' : '#67C23A'"
              ></uni-icons>
              {{ getProductStatus(product) === '0' ? '下架' : '上架' }}
            </button>
            <button class="delete-btn" @click="handleDelete(product)" :disabled="actionLoading">
              <uni-icons type="trash" size="14" color="#F56C6C"></uni-icons>
              删除
            </button>
          </view>
        </view>
        </template>
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
        <button class="add-product-btn" @click="handleAddProduct">添加商品</button>
      </view>

      <!-- 添加商品浮动按钮 -->
      <view class="floating-action" v-if="filteredProducts.length > 0">
        <button class="add-product-float-btn" @click="handleAddProduct">
          <uni-icons type="plus" size="24" color="#fff"></uni-icons>
          添加商品
        </button>
      </view>
    </scroll-view>

    <!-- 库存管理弹窗 -->
    <uni-popup ref="stockPopup" type="bottom" :safe-area="false">
      <view class="stock-management-popup">
        <view class="popup-header">
          <text class="popup-title">库存管理</text>
          <text class="popup-subtitle">{{ (currentProduct && currentProduct.productName) || '' }}</text>
          <view class="close-btn" @click="closeStockManagement">
            <uni-icons type="close" size="20" color="#666"></uni-icons>
          </view>
        </view>
        
        <scroll-view class="popup-content" scroll-y>
          <!-- 单规格商品 -->
          <view v-if="!currentProduct || getSpecTypeText(currentProduct.specType) === '单规格' || getSpecTypeText(currentProduct.specType) === '无规格'" class="single-sku-stock">
            <view class="stock-item">
              <view class="stock-info">
                <text class="stock-label">商品库存</text>
                <text class="stock-total">总库存: {{ calculateTotalStock(currentProduct) }}</text>
              </view>
              <view class="stock-input-wrapper">
                <input 
                  class="stock-input" 
                  type="number" 
                  v-model="singleStockValue"
                  placeholder="请输入库存"
                  :disabled="stockLoading"
                />
                <button class="save-stock-btn" @click="saveSingleStock" :disabled="stockLoading">
                  {{ stockLoading ? '保存中...' : '保存' }}
                </button>
              </view>
            </view>
          </view>

          <!-- 多规格商品 -->
          <view v-else class="multi-sku-stock">
            <view class="stock-list">
              <view 
                v-for="(sku, index) in currentProductSkus" 
                :key="sku.productSkuId || index"
                class="stock-item"
              >
                <view class="stock-info">
                  <text class="stock-label">{{ getSkuDisplayName(sku) }}</text>
                  <text class="stock-detail">
                    售价: ¥{{ formatPrice(sku.salePrice) }} | 
                    库存: {{ sku.stockQuantity || sku.stock || 0 }}
                  </text>
                </view>
                <view class="stock-input-wrapper">
                  <input 
                    class="stock-input" 
                    type="number" 
                    v-model="sku.editStock"
                    placeholder="请输入库存"
                    :disabled="stockLoading"
                  />
                  <button class="save-stock-btn" @click="saveSkuStock(sku)" :disabled="stockLoading">
                    {{ stockLoading ? '保存中...' : '保存' }}
                  </button>
                </view>
              </view>
            </view>
            
            <!-- 批量设置 -->
            <view class="batch-stock-setting">
              <view class="batch-header">
                <text class="batch-title">批量设置库存</text>
              </view>
              <view class="batch-input-wrapper">
                <input 
                  class="batch-input" 
                  type="number" 
                  v-model="batchStockValue"
                  placeholder="输入库存数量"
                  :disabled="stockLoading"
                />
                <button class="batch-save-btn" @click="batchSaveStock" :disabled="stockLoading">
                  {{ stockLoading ? '设置中...' : '应用到全部' }}
                </button>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
import * as productApi from '@/api/product.js';
import * as mediaApi from '@/api/media.js';

export default {
  data() {
    return {
      searchQuery: '',
      statusIndex: 0,
      statusOptions: ['全部状态', '上架', '下架'],
      products: [],
      allProducts: [], // 存储所有产品用于前端筛选
      loading: false,
      refreshing: false,
      loadMoreStatus: 'more',
      pageParams: {
        pageNum: 1,
        pageSize: 12,
        total: 0
      },
      searchTimer: null,
      actionLoading: false,
      productSkusMap: new Map(), // 存储SPU对应的SKU列表
      productSkuSummary: {}, // 缓存SKU规格文案，便于模板展示
      productImagesMap: new Map(), // 存储SPU对应的图片列表
      // 三级分类相关
      level1CategoryIndex: 0,
      level2CategoryIndex: 0,
      level3CategoryIndex: 0,
      level1CategoryOptions: [{ id: null, name: '全部类别' }],
      level2CategoryOptions: [{ id: null, name: '全部类别' }],
      level3CategoryOptions: [{ id: null, name: '全部类别' }],
      level1Categories: [],
      level2Categories: [],
      level3Categories: [],
      selectedCategoryId: null, // 当前选中的三级分类ID
      loadingCategories: false,
      // 库存管理相关
      currentProduct: null, // 当前正在管理库存的商品
      currentProductSkus: [], // 当前商品的SKU列表
      singleStockValue: '', // 单规格商品的库存值
      batchStockValue: '', // 批量设置的库存值
      stockLoading: false // 库存保存加载状态
    }
  },
  
  computed: {
    filteredProducts() {
      // 先过滤掉 null 或 undefined 的产品，并确保有 id
      let filtered = this.products.filter(product => {
        return product != null && (product.id || product.productSpuId || product.spuId)
      });
      
      // 搜索过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(product => 
          product && product.productName && (
          product.productName.toLowerCase().includes(query) || 
          (product.categoryPath && product.categoryPath.toLowerCase().includes(query)) ||
          (product.productDetail && product.productDetail.toLowerCase().includes(query))
          )
        );
      }
      
      // 三级分类过滤
      if (this.selectedCategoryId) {
        filtered = filtered.filter(product => 
          product && product.categoryId === this.selectedCategoryId
        );
      }
      
      // 状态过滤（统一使用 productStatus 字段）
      if (this.statusIndex > 0) {
        const statusValue = this.statusIndex === 1 ? '0' : '2';
        filtered = filtered.filter(product => {
          if (!product) return false;
          const status = this.getProductStatus(product);
          return status === statusValue;
        });
      }
      
      return filtered;
    }
  },
  
  methods: {
    // 获取商品ID（统一方法）
    getProductId(product) {
      if (!product) return null;
      return product.id || product.productSpuId || product.spuId || null;
    },
    
    // 获取商品图片
    getProductImage(product) {
      if (!product) return '/static/images/default-product.png';
      const productId = this.getProductId(product);
      
      // 优先从加载的图片列表中获取
      if (productId && this.productImagesMap.has(productId)) {
        const images = this.productImagesMap.get(productId);
        if (images && images.length > 0) {
          // 选择第一张图片作为展示图片
          const firstImage = images[0];
          // 兼容不同的字段名：fileUrl, file_url, url
          const imageUrl = firstImage.fileUrl || firstImage.file_url || firstImage.url || firstImage;
          if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
            console.log(`🖼️ 商品 ${product.productName || productId} 使用图片:`, imageUrl);
            return imageUrl;
          }
        }
      }
      
      // 回退到商品数据中的图片字段
      if (product.imageUrl) {
        return product.imageUrl;
      }
      if (product.coverImage) {
        return product.coverImage;
      }
      if (product.imageList && product.imageList.length > 0) {
        const firstImg = product.imageList[0];
        const imageUrl = typeof firstImg === 'string' ? firstImg : (firstImg.fileUrl || firstImg.file_url || firstImg.url);
        if (imageUrl) {
          return imageUrl;
        }
      }
      
      // 默认图片
      console.warn(`⚠️ 商品 ${product.productName || productId} 没有图片，使用默认图片`);
      return '/static/images/default-product.jpg';
    },

    // 规范化SKU列表，解析上传时存储的规格信息
    normalizeSkuList(rawList) {
      if (!Array.isArray(rawList)) {
        return []
      }
      return rawList.map(sku => {
        const parsedDetail = this.parseSkuDetail(sku)
        const specText = this.buildSkuSpecText(parsedDetail, sku)
        return {
          ...sku,
          parsedDetail,
          specText
        }
      })
    },

    // 解析SKU详情字段（上传时存储的JSON）
    parseSkuDetail(sku) {
      if (!sku) return null
      let detail = sku.skuDetail || sku.detail
      if (typeof detail === 'string') {
        try {
          detail = JSON.parse(detail)
        } catch (error) {
          console.warn('SKU详情解析失败:', error, detail)
          detail = null
        }
      }
      return detail || null
    },

    // 组装规格展示文本
    buildSkuSpecText(detail, sku) {
      if (detail && Array.isArray(detail.combination) && detail.combination.length > 0) {
        return detail.combination
          .map(item => {
            const name = item.name || item.attrName || ''
            const value = item.value || item.attrValue || ''
            return name ? `${name}:${value}` : value
          })
          .filter(Boolean)
          .join(' / ')
      }
      if (detail && detail.description) {
        return detail.description
      }
      if (detail && detail.productName) {
        return detail.productName
      }
      return sku.skuName || sku.name || '默认规格'
    },

    // 计算总库存（从SKU汇总）
    calculateTotalStock(product) {
      if (!product) return 0;
      
      const productId = this.getProductId(product);
      if (!productId) return 0;
      
      if (this.productSkusMap.has(productId)) {
        const skus = this.productSkusMap.get(productId);
        if (skus && Array.isArray(skus)) {
        return skus.reduce((total, sku) => {
          // 兼容不同的库存字段名
          const stock = sku.stock || sku.stockQuantity || sku.quantity || 0;
          return total + (Number(stock) || 0);
        }, 0);
        }
      }
      // 如果没有SKU，返回SPU的库存（如果有的话）
      return product.stock || product.stockQuantity || 0;
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
            if (res.networkType === 'none') {
              reject(new Error('网络连接不可用，请检查网络设置'));
            } else {
              resolve();
            }
          },
          fail: (err) => {
            reject(new Error('网络状态检查失败'));
          }
        });
      });
    },

    // 加载一级分类数据
    async loadCategories() {
      if (this.loadingCategories) return;
      
      this.loadingCategories = true;
      try {
        const res = await productApi.getLevel1Categories();
        if (res.code === 200) {
          const categories = res.data || [];
          this.level1Categories = categories;
          this.level1CategoryOptions = [
            { id: null, name: '全部类别' },
            ...categories.map(cat => ({
              id: cat.id || cat.categoryId,
              name: cat.name || cat.categoryName || '未命名分类'
            }))
          ];
        }
      } catch (error) {
        console.error('加载一级分类数据失败:', error);
        uni.showToast({
          title: '加载分类失败',
          icon: 'none',
          duration: 2000
        });
      } finally {
        this.loadingCategories = false;
      }
    },

    // 一级分类变化
    async onLevel1CategoryChange(e) {
      const index = parseInt(e.detail.value);
      this.level1CategoryIndex = index;
      
      // 重置二级和三级分类
      this.level2CategoryIndex = 0;
      this.level3CategoryIndex = 0;
      this.level2Categories = [];
      this.level3Categories = [];
      this.level2CategoryOptions = [{ id: null, name: '全部类别' }];
      this.level3CategoryOptions = [{ id: null, name: '全部类别' }];
      this.selectedCategoryId = null;
      
      // 如果选择的是"全部类别"，重新加载商品
      if (index === 0) {
        this.pageParams.pageNum = 1;
        await this.loadProducts();
        return;
      }
      
      // 加载二级分类
      const selectedLevel1 = this.level1Categories[index - 1];
      if (selectedLevel1) {
        await this.loadLevel2Categories(selectedLevel1.id || selectedLevel1.categoryId);
      }
    },

    // 加载二级分类
    async loadLevel2Categories(level1Id) {
      if (!level1Id) return;
      
      try {
        const res = await productApi.getLevel2CategoriesByLevel1(level1Id);
        if (res.code === 200) {
          const categories = res.data || [];
          this.level2Categories = categories;
          this.level2CategoryOptions = [
            { id: null, name: '全部类别' },
            ...categories.map(cat => ({
              id: cat.id || cat.categoryId,
              name: cat.name || cat.categoryName || '未命名分类'
            }))
          ];
        }
      } catch (error) {
        console.error('加载二级分类数据失败:', error);
        this.level2CategoryOptions = [{ id: null, name: '全部类别' }];
      }
    },

    // 二级分类变化
    async onLevel2CategoryChange(e) {
      const index = parseInt(e.detail.value);
      this.level2CategoryIndex = index;
      
      // 重置三级分类
      this.level3CategoryIndex = 0;
      this.level3Categories = [];
      this.level3CategoryOptions = [{ id: null, name: '全部类别' }];
      this.selectedCategoryId = null;
      
      // 如果选择的是"全部类别"，加载一级分类下的所有商品
      if (index === 0) {
        this.pageParams.pageNum = 1;
        await this.loadProducts();
        return;
      }
      
      // 加载三级分类
      const selectedLevel2 = this.level2Categories[index - 1];
      if (selectedLevel2) {
        await this.loadLevel3Categories(selectedLevel2.id || selectedLevel2.categoryId);
      }
    },

    // 加载三级分类
    async loadLevel3Categories(level2Id) {
      if (!level2Id) return;
      
      try {
        const res = await productApi.getLevel3CategoriesByLevel2(level2Id);
        if (res.code === 200) {
          const categories = res.data || [];
          this.level3Categories = categories;
          this.level3CategoryOptions = [
            { id: null, name: '全部类别' },
            ...categories.map(cat => ({
              id: cat.id || cat.categoryId,
              name: cat.name || cat.categoryName || '未命名分类'
            }))
          ];
        }
      } catch (error) {
        console.error('加载三级分类数据失败:', error);
        this.level3CategoryOptions = [{ id: null, name: '全部类别' }];
      }
    },

    // 三级分类变化
    async onLevel3CategoryChange(e) {
      const index = parseInt(e.detail.value);
      this.level3CategoryIndex = index;
      
      if (index === 0) {
        // 选择"全部类别"，清除选中分类
        this.selectedCategoryId = null;
      } else {
        // 选中具体的三级分类
        const selectedLevel3 = this.level3Categories[index - 1];
        this.selectedCategoryId = (selectedLevel3 && (selectedLevel3.id || selectedLevel3.categoryId)) || null;
      }
      
      // 重新加载商品
      this.pageParams.pageNum = 1;
      await this.loadProductsByCategory();
    },

    // 加载商品列表
    async loadProducts() {
      if (this.loading) return;
      
      this.loading = true;
      try {
        await this.checkNetworkStatus();
        
        console.log('开始加载商品列表');
        
        // 根据状态选择不同的接口
        let res;
        if (this.statusIndex === 1) {
          // 上架商品
          res = await productApi.getOnShelfProductSpus();
        } else if (this.statusIndex === 2) {
          // 下架商品
          res = await productApi.getOffShelfProductSpus();
        } else {
          // 全部商品
          res = await productApi.getAllProductSpus();
        }
        
        console.log('商品列表接口响应:', res);
        
        if (res.code === 200) {
          const productList = res.data || [];
          this.allProducts = productList;
          
          // 前端分页
          const startIndex = (this.pageParams.pageNum - 1) * this.pageParams.pageSize;
          const endIndex = startIndex + this.pageParams.pageSize;
          const pagedProducts = productList.slice(startIndex, endIndex);
          
          // 并行加载每个商品的SKU信息和图片
          await Promise.all([
            this.loadProductsWithSkus(pagedProducts),
            this.loadProductImages(pagedProducts)
          ]);
          
          if (this.pageParams.pageNum === 1) {
            this.products = this.formatProductData(pagedProducts);
          } else {
            this.products = [...this.products, ...this.formatProductData(pagedProducts)];
          }
          
          this.pageParams.total = productList.length;
          
          // 更新加载状态
          if (this.products.length >= this.pageParams.total) {
            this.loadMoreStatus = 'noMore';
          } else {
            this.loadMoreStatus = 'more';
          }
          
          console.log(`成功加载 ${this.products.length} 个商品`);
        } else {
          throw new Error(res.message || '获取商品列表失败');
        }
      } catch (error) {
        console.error('加载商品列表失败:', error);
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

    // 加载商品及其SKU信息
    async loadProductsWithSkus(products) {
      const skuPromises = products.map(async (product) => {
        try {
          const spuId = product.productSpuId || product.spuId || product.id;
          if (!spuId) {
            console.warn('商品缺少SPU ID:', product);
            return;
          }
          const skuRes = await productApi.getProductSkusBySpuId(spuId);
          if (skuRes.code === 200) {
            const normalizedSkus = this.normalizeSkuList(skuRes.data || []);
            this.productSkusMap.set(spuId, normalizedSkus);
            this.$set(this.productSkuSummary, spuId, normalizedSkus.map(sku => sku.specText));
          }
        } catch (error) {
          console.error(`加载商品 ${product.productName} 的SKU失败:`, error);
          const spuId = product.productSpuId || product.spuId || product.id;
          if (spuId) {
            this.productSkusMap.set(spuId, []);
            this.$set(this.productSkuSummary, spuId, []);
          }
        }
      });
      
      await Promise.all(skuPromises);
    },

    // 加载商品的图片
    async loadProductImages(products) {
      if (!products || products.length === 0) {
        return;
      }

      const imagePromises = products.map(async (product) => {
        try {
          const spuId = product.productSpuId || product.spuId || product.id;
          if (!spuId) {
            console.warn('商品缺少SPU ID，无法加载图片:', product);
            return;
          }

          // 如果已经加载过，跳过
          if (this.productImagesMap.has(spuId)) {
            return;
          }

          console.log(`🖼️ 开始加载商品 ${product.productName || spuId} 的图片，SPU ID: ${spuId}`);

          // 调用媒体API获取商品图片列表
          const imageRes = await mediaApi.getProductSpuImages(spuId);
          
          console.log(`🖼️ 商品 ${product.productName || spuId} 图片API响应:`, imageRes);
          
          if (imageRes && imageRes.code === 200) {
            // 兼容不同的返回格式
            let images = [];
            if (Array.isArray(imageRes.data)) {
              images = imageRes.data;
              console.log(`🖼️ 商品 ${product.productName || spuId} 数据格式: Array, 数量: ${images.length}`);
            } else if (imageRes.data && imageRes.data.images && Array.isArray(imageRes.data.images)) {
              images = imageRes.data.images;
              console.log(`🖼️ 商品 ${product.productName || spuId} 数据格式: data.images, 数量: ${images.length}`);
            } else if (imageRes.data && imageRes.data.data && Array.isArray(imageRes.data.data)) {
              images = imageRes.data.data;
              console.log(`🖼️ 商品 ${product.productName || spuId} 数据格式: data.data, 数量: ${images.length}`);
            } else {
              console.warn(`⚠️ 商品 ${product.productName || spuId} 图片数据格式未知:`, imageRes.data);
            }
            
            // 过滤掉已删除的图片（del_flag !== '2'）
            images = images.filter(img => {
              const delFlag = img.delFlag || img.del_flag;
              const isDeleted = delFlag === '2' || delFlag === 2;
              if (isDeleted) {
                console.log(`🖼️ 跳过已删除的图片:`, img);
              }
              return !isDeleted;
            });
            
            console.log(`🖼️ 商品 ${product.productName || spuId} 过滤后的图片数量: ${images.length}`);
            
            // 如果有图片，按sequence排序
            if (images.length > 0) {
              // 按sequence排序，sequence小的在前
              const sortedImages = images.sort((a, b) => {
                const seqA = a.sequence || 0;
                const seqB = b.sequence || 0;
                return seqA - seqB;
              });
              
              // 打印第一张图片的信息用于调试
              if (sortedImages.length > 0) {
                const firstImg = sortedImages[0];
                const imageUrl = firstImg.fileUrl || firstImg.file_url || firstImg.url;
                console.log(`🖼️ 商品 ${product.productName || spuId} 第一张图片信息:`, {
                  fileUrl: imageUrl,
                  mediaId: firstImg.mediaId || firstImg.media_id,
                  sequence: firstImg.sequence
                });
                
                // 将图片URL直接设置到商品对象上，确保响应式更新
                if (imageUrl) {
                  this.$set(product, 'imageUrl', imageUrl);
                  this.$set(product, 'imageList', sortedImages);
                }
              }
              
              this.productImagesMap.set(spuId, sortedImages);
              console.log(`✅ 商品 ${product.productName || spuId} 图片加载成功，共 ${sortedImages.length} 张`);
            } else {
              // 没有图片时也设置空数组，避免重复请求
              console.warn(`⚠️ 商品 ${product.productName || spuId} 没有可用图片`);
              this.productImagesMap.set(spuId, []);
            }
          } else {
            // API返回失败，设置空数组
            console.warn(`⚠️ 商品 ${product.productName || spuId} 图片API返回失败:`, imageRes);
            this.productImagesMap.set(spuId, []);
          }
        } catch (error) {
          console.error(`❌ 加载商品 ${product.productName || product.id} 的图片失败:`, error);
          const spuId = product.productSpuId || product.spuId || product.id;
          if (spuId) {
            // 出错时也设置空数组，避免重复请求
            this.productImagesMap.set(spuId, []);
          }
        }
      });
      
      await Promise.all(imagePromises);
      console.log('🖼️ 所有商品图片加载完成');
    },

    // 根据分类加载商品
    async loadProductsByCategory() {
      // 如果没有选中三级分类，加载所有商品
      if (!this.selectedCategoryId) {
        await this.loadProducts();
        return;
      }
      
      this.loading = true;
      try {
        const res = await productApi.getProductSpusByCategory(this.selectedCategoryId);
        if (res.code === 200) {
          const productList = res.data || [];
          this.allProducts = productList;
          
          // 前端分页
          const startIndex = (this.pageParams.pageNum - 1) * this.pageParams.pageSize;
          const endIndex = startIndex + this.pageParams.pageSize;
          const pagedProducts = productList.slice(startIndex, endIndex);
          
          // 并行加载每个商品的SKU信息和图片
          await Promise.all([
            this.loadProductsWithSkus(pagedProducts),
            this.loadProductImages(pagedProducts)
          ]);
          
          if (this.pageParams.pageNum === 1) {
            this.products = this.formatProductData(pagedProducts);
          } else {
            this.products = [...this.products, ...this.formatProductData(pagedProducts)];
          }
          
          this.pageParams.total = productList.length;
          
          // 更新加载状态
          if (this.products.length >= this.pageParams.total) {
            this.loadMoreStatus = 'noMore';
          } else {
            this.loadMoreStatus = 'more';
          }
        }
      } catch (error) {
        console.error('根据分类加载商品失败:', error);
        uni.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      } finally {
        this.loading = false;
        this.refreshing = false;
        uni.stopPullDownRefresh();
      }
    },
    
    // 格式化商品数据（统一处理状态字段，并确保使用数值型 spuId）
    formatProductData(products) {
      return products
        .map(product => {
          // 确保 product 不为 null 或 undefined
          if (!product) {
            console.warn('商品数据为空，已跳过')
            return null
          }
          
          const rawId = product.productSpuId != null
            ? product.productSpuId
            : (product.spuId != null ? product.spuId : product.id)

          const numericId = Number(rawId)
          if (!Number.isInteger(numericId) || isNaN(numericId)) {
            console.warn('商品ID异常，已跳过该商品：', product.productName, rawId)
            return null
          }

        // 统一获取商品状态，优先使用 productStatus
        const productStatus = product.productStatus !== undefined 
          ? String(product.productStatus) 
          : (product.status !== undefined ? String(product.status) : '0')
        
        return {
            id: numericId,
            spuId: numericId,
          productName: product.productName,
          categoryId: product.categoryId,
          categoryPath: product.categoryPath,
          productDetail: product.productDetail,
          marketPrice: product.marketPrice,
          costPrice: product.costPrice,
          status: productStatus, // 统一使用 status 字段
          productStatus: productStatus, // 同时保留 productStatus 字段以保持一致性
          specType: product.specType,
          imageUrl: product.imageUrl,
          coverImage: product.coverImage,
          imageList: product.imageList || [],
            skuList: this.productSkusMap.get(numericId) || [],
          originalData: product
        }
      })
        .filter(item => item !== null)
    },
    
    // 格式化价格
    formatPrice(price) {
      if (!price) return '0.00';
      return parseFloat(price).toFixed(2);
    },
    
    onImageError(product) {
      console.log('图片加载失败，使用默认图片');
    },
    
    handleSearch() {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        this.pageParams.pageNum = 1;
        // 前端搜索，不需要重新调用接口
        this.applyFilters();
      }, 500);
    },
    
    
    onStatusChange(e) {
      this.statusIndex = parseInt(e.detail.value);
      this.pageParams.pageNum = 1;
      this.loadProducts();
    },

    // 应用前端筛选
    applyFilters() {
      // filteredProducts computed property 会自动处理
      this.$forceUpdate();
    },
    
    // 添加商品
    handleAddProduct() {
      uni.navigateTo({
        url: '/pages/shop/add_shop'
      });
    },

    // 查看商品详情
    viewProductDetail(product) {
      const spuId = product.id || (product.originalData && (product.originalData.productSpuId || product.originalData.spuId));
      if (!spuId) {
        uni.showToast({
          title: '商品信息不完整',
          icon: 'none'
        });
        return;
      }
      uni.navigateTo({
        url: `/pages/shop/product-detail?id=${spuId}`
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
        await this.checkNetworkStatus();
        
        uni.showLoading({
          title: '删除中...',
          mask: true
        });
        
        // 确保id是数字类型
        const spuId = typeof id === 'string' ? parseInt(id) : id;
        const res = await productApi.deleteProductSpu(spuId);
        
        uni.hideLoading();
        
        if (res.code === 200) {
          uni.showToast({
            title: '删除成功',
            icon: 'success',
            duration: 2000
          });
          // 重新加载数据
          setTimeout(() => {
            this.pageParams.pageNum = 1;
            // 如果选中了分类，使用分类加载方法，否则使用普通加载方法
            if (this.selectedCategoryId) {
              this.loadProductsByCategory();
            } else {
              this.loadProducts();
            }
          }, 500);
        } else {
          uni.showToast({
            title: res.message || '删除失败',
            icon: 'none',
            duration: 3000
          });
        }
      } catch (error) {
        console.error('删除商品失败:', error);
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
    
    // 统一获取商品状态
    getProductStatus(product) {
      if (product.productStatus !== undefined) {
        return String(product.productStatus);
      }
      if (product.status !== undefined) {
        return String(product.status);
      }
      return '0';
    },
    
    // 上架/下架商品（只有此页面可以修改商品状态）
    async toggleProductStatus(product) {
      if (this.actionLoading) return;
      
      const currentStatus = this.getProductStatus(product);
      const newStatus = currentStatus === '0' ? '2' : '0';
      const action = newStatus === '0' ? '上架' : '下架';
      
      uni.showModal({
        title: '确认操作',
        content: `确定要${action}商品"${product.productName}"吗？`,
        success: async (res) => {
          if (res.confirm) {
            await this.doUpdateStatus(product, newStatus, action);
          }
        }
      });
    },
    
    async doUpdateStatus(product, newStatus, action) {
      this.actionLoading = true;
      try {
        await this.checkNetworkStatus();
        
        uni.showLoading({
          title: `${action}中...`,
          mask: true
        });

        let res;
        const spuId = product.spuId || product.id;
        if (!Number.isInteger(spuId)) {
          throw new Error('商品ID异常，无法执行上下架操作');
        }
        
        if (newStatus === '0') {
          // 上架
          res = await productApi.publishProductSpu(spuId);
        } else {
          // 下架
          res = await productApi.unpublishProductSpu(spuId);
        }
        
        uni.hideLoading();

        if (res.code === 200) {
          uni.showToast({
            title: `${action}成功`,
            icon: 'success',
            duration: 2000
          });
          
          // 更新本地状态（同时更新 status 和 productStatus 字段以保持一致性）
          const productIndex = this.products.findIndex(p => p.id === product.id);
          if (productIndex !== -1) {
            this.products[productIndex].status = newStatus;
            this.products[productIndex].productStatus = newStatus;
            // 同时更新 allProducts 中的状态
            const allProductIndex = this.allProducts.findIndex(p => {
              const pId = p.productSpuId || p.spuId || p.id;
              const productId = product.id || product.productSpuId || product.spuId;
              return pId === productId;
            });
            if (allProductIndex !== -1) {
              this.allProducts[allProductIndex].status = newStatus;
              this.allProducts[allProductIndex].productStatus = newStatus;
            }
            this.$forceUpdate();
          }
          
          // 如果状态筛选与更新后的状态不一致，重新加载列表
          const statusValue = this.statusIndex === 1 ? '0' : (this.statusIndex === 2 ? '2' : null);
          if (statusValue !== null && newStatus !== statusValue) {
            // 状态不一致，需要重新加载
            setTimeout(() => {
              this.pageParams.pageNum = 1;
              if (this.selectedCategoryId) {
                this.loadProductsByCategory();
              } else {
                this.loadProducts();
              }
            }, 500);
          }
        } else {
          uni.showToast({
            title: res.message || `${action}失败`,
            icon: 'none',
            duration: 3000
          });
        }
      } catch (error) {
        console.error('更新商品状态失败:', error);
        uni.hideLoading();
        uni.showToast({
          title: error.message || '操作失败，请重试',
          icon: 'none',
          duration: 3000
        });
      } finally {
        this.actionLoading = false;
      }
    },
    
    // 下拉刷新
    handlePullDownRefresh() {
      this.refreshing = true;
      this.pageParams.pageNum = 1;
      this.productSkusMap.clear();
      this.productImagesMap.clear();
      this.productSkuSummary = {};
      this.loadProducts();
      this.loadCategories();
    },
    
    // 上拉加载更多
    handleReachBottom() {
      if (this.loading || this.loadMoreStatus === 'noMore') {
        return;
      }
      
      // 如果选中了三级分类，使用分类加载方法
      if (this.selectedCategoryId) {
        this.loadMoreStatus = 'loading';
        this.pageParams.pageNum++;
        this.loadProductsByCategory();
      } else {
        this.loadMoreStatus = 'loading';
        this.pageParams.pageNum++;
        this.loadProducts();
      }
    },

    // 跳转到库存管理页面
    goToStockManagement(product) {
      if (!product) {
        uni.showToast({
          title: '商品信息不完整',
          icon: 'none'
        });
        return;
      }
      
      const productId = this.getProductId(product);
      if (!productId) {
        uni.showToast({
          title: '商品ID不存在',
          icon: 'none'
        });
        return;
      }
      
      // 跳转到库存管理页面，传递商品ID和基本信息
      uni.navigateTo({
        url: `/pages/shop/stock-management?productId=${productId}&productName=${encodeURIComponent(product.productName || '')}`
      });
    },
    
    // 打开库存管理弹窗（保留，可能其他地方用到）
    async openStockManagement(product) {
      if (!product || !product.id) {
        uni.showToast({
          title: '商品信息不完整',
          icon: 'none'
        });
        return;
      }

      this.currentProduct = product;
      this.singleStockValue = '';
      this.batchStockValue = '';
      
      // 获取商品的SKU列表
      const spuId = product.id || product.productSpuId || product.spuId;
      if (this.productSkusMap.has(spuId)) {
        const skus = this.productSkusMap.get(spuId);
        // 为每个SKU添加编辑用的库存字段
        this.currentProductSkus = skus.map(sku => ({
          ...sku,
          editStock: sku.stockQuantity || sku.stock || 0
        }));
      } else {
        // 如果没有SKU，尝试加载
        try {
          const skuRes = await productApi.getProductSkusBySpuId(spuId);
          if (skuRes.code === 200) {
            const normalizedSkus = this.normalizeSkuList(skuRes.data || []);
            this.currentProductSkus = normalizedSkus.map(sku => ({
              ...sku,
              editStock: sku.stockQuantity || sku.stock || 0
            }));
            this.productSkusMap.set(spuId, normalizedSkus);
          } else {
            this.currentProductSkus = [];
          }
        } catch (error) {
          console.error('加载SKU列表失败:', error);
          this.currentProductSkus = [];
        }
      }

      // 如果是单规格商品，设置初始库存值
      const specType = this.getSpecTypeText(product.specType);
      if (specType === '单规格' || specType === '无规格') {
        this.singleStockValue = this.calculateTotalStock(product);
      }

      // 打开弹窗
      this.$refs.stockPopup.open();
    },

    // 关闭库存管理弹窗
    closeStockManagement() {
      this.$refs.stockPopup.close();
      this.currentProduct = null;
      this.currentProductSkus = [];
      this.singleStockValue = '';
      this.batchStockValue = '';
    },

    // 获取SKU显示名称
    getSkuDisplayName(sku) {
      const parsedDetail = this.parseSkuDetail(sku);
      const specText = this.buildSkuSpecText(parsedDetail, sku);
      return specText || '默认规格';
    },

    // 保存单规格商品库存
    async saveSingleStock() {
      if (!this.currentProduct) return;

      const stockValue = parseInt(this.singleStockValue);
      if (isNaN(stockValue) || stockValue < 0) {
        uni.showToast({
          title: '请输入有效的库存数量',
          icon: 'none'
        });
        return;
      }

      const spuId = this.currentProduct.id || this.currentProduct.productSpuId || this.currentProduct.spuId;
      
      // 如果是单规格，需要找到对应的SKU并更新
      if (this.currentProductSkus.length > 0) {
        const sku = this.currentProductSkus[0];
        await this.updateSkuStock(sku, stockValue);
      } else {
        // 如果没有SKU，可能需要创建或更新SPU的库存
        uni.showToast({
          title: '该商品没有SKU信息',
          icon: 'none'
        });
      }
    },

    // 保存单个SKU库存
    async saveSkuStock(sku) {
      if (!sku || !sku.productSkuId) {
        uni.showToast({
          title: 'SKU信息不完整',
          icon: 'none'
        });
        return;
      }

      const stockValue = parseInt(sku.editStock);
      if (isNaN(stockValue) || stockValue < 0) {
        uni.showToast({
          title: '请输入有效的库存数量',
          icon: 'none'
        });
        return;
      }

      await this.updateSkuStock(sku, stockValue);
    },

    // 批量保存库存
    async batchSaveStock() {
      if (!this.currentProduct || this.currentProductSkus.length === 0) {
        uni.showToast({
          title: '没有可设置的SKU',
          icon: 'none'
        });
        return;
      }

      const stockValue = parseInt(this.batchStockValue);
      if (isNaN(stockValue) || stockValue < 0) {
        uni.showToast({
          title: '请输入有效的库存数量',
          icon: 'none'
        });
        return;
      }

      this.stockLoading = true;
      try {
        uni.showLoading({
          title: '批量设置中...',
          mask: true
        });

        const updatePromises = this.currentProductSkus.map(sku => {
          if (sku.productSkuId) {
            return this.updateSkuStock(sku, stockValue, false); // false表示不显示toast
          }
          return Promise.resolve();
        });

        await Promise.all(updatePromises);

        uni.hideLoading();
        uni.showToast({
          title: '批量设置成功',
          icon: 'success'
        });

        // 更新本地数据
        this.currentProductSkus.forEach(sku => {
          sku.editStock = stockValue;
        });

        // 重新加载商品列表以更新显示
        this.pageParams.pageNum = 1;
        if (this.selectedCategoryId) {
          await this.loadProductsByCategory();
        } else {
          await this.loadProducts();
        }
      } catch (error) {
        uni.hideLoading();
        console.error('批量设置库存失败:', error);
        uni.showToast({
          title: '批量设置失败，请重试',
          icon: 'none'
        });
      } finally {
        this.stockLoading = false;
      }
    },

    // 更新SKU库存（内部方法）
    async updateSkuStock(sku, stockValue, showToast = true) {
      if (!sku || !sku.productSkuId) {
        throw new Error('SKU信息不完整');
      }

      this.stockLoading = true;
      try {
        if (showToast) {
          uni.showLoading({
            title: '保存中...',
            mask: true
          });
        }

        const spuId = this.currentProduct.id || this.currentProduct.productSpuId || this.currentProduct.spuId;
        
        // 构建更新数据
        const updateData = {
          productSkuId: Number(sku.productSkuId),
          spuId: Number(spuId),
          salePrice: Number(sku.salePrice || sku.sale_price || 0),
          costPrice: Number(sku.costPrice || sku.cost_price || 0),
          stockQuantity: Number(stockValue),
          skuDetail: sku.skuDetail || sku.sku_detail || '',
          skuStatus: String(sku.skuStatus || sku.sku_status || '0')
        };

        const res = await productApi.updateProductSku(updateData);
        
        if (showToast) {
          uni.hideLoading();
        }

        if (res.code === 200) {
          // 更新本地数据
          sku.stockQuantity = stockValue;
          sku.stock = stockValue;
          sku.editStock = stockValue;

          // 更新productSkusMap
          const spuId = this.currentProduct.id || this.currentProduct.productSpuId || this.currentProduct.spuId;
          if (this.productSkusMap.has(spuId)) {
            const skus = this.productSkusMap.get(spuId);
            const index = skus.findIndex(s => s.productSkuId === sku.productSkuId);
            if (index !== -1) {
              skus[index] = { ...skus[index], ...sku };
            }
          }

          if (showToast) {
            uni.showToast({
              title: '保存成功',
              icon: 'success'
            });
          }

          // 重新加载商品列表以更新显示
          this.pageParams.pageNum = 1;
          if (this.selectedCategoryId) {
            await this.loadProductsByCategory();
          } else {
            await this.loadProducts();
          }
        } else {
          throw new Error(res.message || '保存失败');
        }
      } catch (error) {
        if (showToast) {
          uni.hideLoading();
        }
        console.error('更新库存失败:', error);
        if (showToast) {
          uni.showToast({
            title: error.message || '保存失败，请重试',
            icon: 'none'
          });
        }
        throw error;
      } finally {
        this.stockLoading = false;
      }
    }
  },
  
  onLoad() {
    console.log('商品管理页面加载');
    this.loadProducts();
    this.loadCategories();
  },
  
  onShow() {
    console.log('商品管理页面显示，刷新数据');
    this.pageParams.pageNum = 1;
    this.productSkusMap.clear();
    this.productImagesMap.clear();
    this.productSkuSummary = {};
    this.loadProducts();
  },
  
  onPullDownRefresh() {
    console.log('触发下拉刷新');
    this.handlePullDownRefresh();
  },
  
  onReachBottom() {
    console.log('触发上拉加载更多');
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
        
        &.disabled {
          background: #f5f5f5;
          opacity: 0.6;
          
          .filter-text {
            color: #999;
          }
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
  height: calc(100vh - 300rpx);
  position: relative;
  
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
      
      .card-media {
        position: relative;
        width: 100%;
        height: 320rpx;
        
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
          
          &.on {
            background: rgba(255, 87, 34, 0.9);
          }
          
          &.off {
            background: rgba(144, 147, 153, 0.9);
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
          color: #409EFF;
          margin-bottom: 4rpx;
          cursor: pointer;
          text-decoration: underline;
        }
        
        .spec-type {
          display: block;
          font-size: 22rpx;
          color: #909399;
        }

        .sku-summary {
          margin-top: 12rpx;
          padding-top: 12rpx;
          border-top: 1rpx dashed #ebeef5;
        }

        .sku-summary-title {
          font-size: 22rpx;
          color: #606266;
          margin-bottom: 8rpx;
          display: inline-block;
        }

        .sku-summary-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8rpx;
        }

        .sku-chip {
          font-size: 20rpx;
          color: #606266;
          background: #f4f4f5;
          padding: 6rpx 12rpx;
          border-radius: 999rpx;
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

        .view-btn {
          color: #606266;
          background: #f5f7fa;
        }
        
        .edit-btn {
          color: #409EFF;
          background: #f0f9ff;
        }
        
        .delete-btn {
          color: #F56C6C;
          background: #fef0f0;
        }

        .stock-btn {
          color: #409EFF;
          background: #ecf5ff;
      }
    }
    }
  }

  /* 库存管理弹窗样式 */
  .stock-management-popup {
    background: #fff;
    border-radius: 32rpx 32rpx 0 0;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
  }

  .popup-header {
    display: flex;
    flex-direction: column;
    padding: 32rpx;
    border-bottom: 1rpx solid #ebeef5;
    position: relative;
  }

  .popup-title {
    font-size: 36rpx;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8rpx;
  }

  .popup-subtitle {
    font-size: 26rpx;
    color: #909399;
  }

  .close-btn {
    position: absolute;
    top: 32rpx;
    right: 32rpx;
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #f5f7fa;
  }

  .popup-content {
    flex: 1;
    padding: 32rpx;
    max-height: calc(80vh - 200rpx);
  }

  .stock-item {
    background: #f8f9fa;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 24rpx;
  }

  .stock-info {
    display: flex;
    flex-direction: column;
    margin-bottom: 20rpx;
  }

  .stock-label {
    font-size: 28rpx;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8rpx;
  }

  .stock-total,
  .stock-detail {
    font-size: 24rpx;
    color: #909399;
  }

  .stock-input-wrapper {
    display: flex;
    gap: 16rpx;
    align-items: center;
  }

  .stock-input {
    flex: 1;
    height: 80rpx;
    padding: 0 24rpx;
    background: #fff;
    border: 1rpx solid #dcdfe6;
    border-radius: 12rpx;
    font-size: 28rpx;
    color: #303133;
  }

  .stock-input:disabled {
    background: #f5f7fa;
    color: #c0c4cc;
  }

  .save-stock-btn {
    padding: 0 32rpx;
    height: 80rpx;
    background: #409EFF;
    color: #fff;
    border: none;
    border-radius: 12rpx;
    font-size: 26rpx;
    white-space: nowrap;
  }

  .save-stock-btn:disabled {
    background: #c0c4cc;
    opacity: 0.6;
  }

  .save-stock-btn::after {
    border: none;
  }

  .batch-stock-setting {
    margin-top: 32rpx;
    padding-top: 32rpx;
    border-top: 1rpx solid #ebeef5;
  }

  .batch-header {
    margin-bottom: 20rpx;
  }

  .batch-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #303133;
  }

  .batch-input-wrapper {
    display: flex;
    gap: 16rpx;
    align-items: center;
  }

  .batch-input {
    flex: 1;
    height: 80rpx;
    padding: 0 24rpx;
    background: #fff;
    border: 1rpx solid #dcdfe6;
    border-radius: 12rpx;
    font-size: 28rpx;
    color: #303133;
  }

  .batch-input:disabled {
    background: #f5f7fa;
    color: #c0c4cc;
  }

  .batch-save-btn {
    padding: 0 32rpx;
    height: 80rpx;
    background: #67C23A;
    color: #fff;
    border: none;
    border-radius: 12rpx;
    font-size: 26rpx;
    white-space: nowrap;
  }

  .batch-save-btn:disabled {
    background: #c0c4cc;
    opacity: 0.6;
  }

  .batch-save-btn::after {
    border: none;
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
    
    .add-product-btn {
      background: #409EFF;
      color: #fff;
      border: none;
      padding: 20rpx 40rpx;
      border-radius: 12rpx;
      font-size: 28rpx;
      
      &::after {
        border: none;
      }
    }
  }

  .floating-action {
    position: fixed;
    bottom: 40rpx;
    right: 40rpx;
    z-index: 999;
    
    .add-product-float-btn {
      background: #409EFF;
      color: #fff;
      border: none;
      padding: 20rpx 30rpx;
      border-radius: 50rpx;
      font-size: 26rpx;
      box-shadow: 0 8rpx 24rpx rgba(64, 158, 255, 0.3);
      display: flex;
      align-items: center;
      gap: 10rpx;
      
      &::after {
        border: none;
      }
    }
  }
}
</style>