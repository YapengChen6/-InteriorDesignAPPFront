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
          <view class="filter-box" :class="{ 'disabled': !level1CategoryIndex || level2CategoryOptions.length === 0 }">
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
            <text class="product-category">{{ product.categoryPath || '未分类' }}</text>
            <text class="product-detail">{{ product.productDetail }}</text>
            <view class="price-section">
              <text class="market-price">￥{{ formatPrice(product.marketPrice) }}</text>
              <text class="cost-price" v-if="product.costPrice">成本: ￥{{ formatPrice(product.costPrice) }}</text>
            </view>
            <text class="product-stock">总库存: {{ calculateTotalStock(product) }}</text>
            <text class="spec-type">规格类型: {{ getSpecTypeText(product.specType) }}</text>
            <view 
              class="sku-summary" 
              v-if="productSkuSummary[product.id] && productSkuSummary[product.id].length"
            >
              <text class="sku-summary-title">SKU：</text>
              <view class="sku-summary-chips">
                <text
                  class="sku-chip"
                  v-for="(specText, skuIndex) in productSkuSummary[product.id]"
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
      loadingCategories: false
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
          (product.categoryPath && product.categoryPath.toLowerCase().includes(query)) ||
          (product.productDetail && product.productDetail.toLowerCase().includes(query))
        );
      }
      
      // 三级分类过滤
      if (this.selectedCategoryId) {
        filtered = filtered.filter(product => 
          product.categoryId === this.selectedCategoryId
        );
      }
      
      // 状态过滤
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
      const productId = product.id || product.productSpuId || product.spuId;
      
      // 优先从加载的图片列表中获取
      if (productId && this.productImagesMap.has(productId)) {
        const images = this.productImagesMap.get(productId);
        if (images && images.length > 0) {
          // 选择第一张图片作为展示图片
          const firstImage = images[0];
          return firstImage.fileUrl || firstImage.url || firstImage;
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
        return typeof firstImg === 'string' ? firstImg : (firstImg.fileUrl || firstImg.url);
      }
      
      // 默认图片
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
      if (this.productSkusMap.has(product.id)) {
        const skus = this.productSkusMap.get(product.id);
        return skus.reduce((total, sku) => {
          // 兼容不同的库存字段名
          const stock = sku.stock || sku.stockQuantity || sku.quantity || 0;
          return total + (Number(stock) || 0);
        }, 0);
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

          // 调用媒体API获取商品图片列表
          const imageRes = await mediaApi.getProductSpuImages(spuId);
          
          if (imageRes && imageRes.code === 200) {
            // 兼容不同的返回格式
            let images = [];
            if (Array.isArray(imageRes.data)) {
              images = imageRes.data;
            } else if (imageRes.data && imageRes.data.images && Array.isArray(imageRes.data.images)) {
              images = imageRes.data.images;
            } else if (imageRes.data && imageRes.data.data && Array.isArray(imageRes.data.data)) {
              images = imageRes.data.data;
            }
            
            // 过滤掉已删除的图片（del_flag !== '2'）
            images = images.filter(img => !img.delFlag || img.delFlag !== '2');
            
            // 如果有图片，按sequence排序
            if (images.length > 0) {
              // 按sequence排序，sequence小的在前
              const sortedImages = images.sort((a, b) => {
                const seqA = a.sequence || 0;
                const seqB = b.sequence || 0;
                return seqA - seqB;
              });
              this.productImagesMap.set(spuId, sortedImages);
            } else {
              // 没有图片时也设置空数组，避免重复请求
              this.productImagesMap.set(spuId, []);
            }
          } else {
            // API返回失败，设置空数组
            this.productImagesMap.set(spuId, []);
          }
        } catch (error) {
          console.error(`加载商品 ${product.productName || product.id} 的图片失败:`, error);
          const spuId = product.productSpuId || product.spuId || product.id;
          if (spuId) {
            // 出错时也设置空数组，避免重复请求
            this.productImagesMap.set(spuId, []);
          }
        }
      });
      
      await Promise.all(imagePromises);
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
    
    // 格式化商品数据
    formatProductData(products) {
      return products.map(product => {
        const id = product.productSpuId || product.spuId || product.id
        return {
          id,
          productName: product.productName,
          categoryId: product.categoryId,
          categoryPath: product.categoryPath,
          productDetail: product.productDetail,
          marketPrice: product.marketPrice,
          costPrice: product.costPrice,
          status: product.status !== undefined ? String(product.status) : '0', // 确保status是字符串
          specType: product.specType,
          imageUrl: product.imageUrl,
          coverImage: product.coverImage,
          imageList: product.imageList || [],
          skuList: this.productSkusMap.get(id) || [],
          originalData: product
        }
      })
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
    
    // 上架/下架商品
    async toggleProductStatus(product) {
      if (this.actionLoading) return;
      
      const newStatus = product.status === '0' ? '2' : '0';
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
        const spuId = product.id || (product.originalData && (product.originalData.productSpuId || product.originalData.spuId));
        if (!spuId) {
          throw new Error('商品ID不存在');
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
          
          // 更新本地状态
          const productIndex = this.products.findIndex(p => p.id === product.id);
          if (productIndex !== -1) {
            this.products[productIndex].status = newStatus;
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