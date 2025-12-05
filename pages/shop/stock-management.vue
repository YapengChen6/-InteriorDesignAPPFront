<template>
  <view class="stock-management-page">
    <!-- 导航栏 -->
    <view class="navbar">
      <view class="nav-left" @click="goBack">
        <uni-icons type="left" size="20" color="#333"></uni-icons>
      </view>
      <view class="nav-title">库存管理</view>
      <view class="nav-right"></view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <uni-load-more status="loading" content="加载中..."></uni-load-more>
    </view>

    <!-- 商品信息 -->
    <view v-else-if="product" class="product-info-section">
      <view class="product-header">
        <text class="product-name">{{ product.productName || '未命名商品' }}</text>
        <text class="product-id">商品ID: {{ productId }}</text>
      </view>

      <!-- 单规格商品库存管理 -->
      <view v-if="isSingleSpec" class="stock-section">
        <view class="section-title">商品库存</view>
        <view class="stock-card">
          <view class="stock-display">
            <text class="stock-label">当前库存</text>
            <text class="stock-value">{{ totalStock }}</text>
          </view>
          <view class="stock-input-group">
            <input
              class="stock-input"
              type="number"
              v-model="singleStockValue"
              placeholder="请输入库存数量"
              :disabled="saving"
            />
            <button class="save-btn" @click="saveSingleStock" :disabled="saving || !singleStockValue">
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </view>
        </view>
      </view>

      <!-- 多规格商品库存管理 -->
      <view v-else class="stock-section">
        <view class="section-title">SKU库存管理</view>
        
        <!-- SKU列表 -->
        <view class="sku-list">
          <view
            v-for="(sku, index) in skuList"
            :key="sku.productSkuId || index"
            class="sku-card"
          >
            <view class="sku-header">
              <text class="sku-name">{{ getSkuDisplayName(sku) }}</text>
              <text class="sku-price">¥{{ formatPrice(sku.salePrice) }}</text>
            </view>
            <view class="sku-stock-info">
              <text class="stock-label">当前库存: {{ sku.stockQuantity || sku.stock || 0 }}</text>
            </view>
            <view class="stock-input-group">
              <input
                class="stock-input"
                type="number"
                v-model="sku.editStock"
                placeholder="请输入库存数量"
                :disabled="saving"
              />
              <button class="save-btn" @click="saveSkuStock(sku)" :disabled="saving || !sku.editStock">
                {{ saving ? '保存中...' : '保存' }}
              </button>
            </view>
          </view>
        </view>

        <!-- 批量设置 -->
        <view class="batch-section">
          <view class="section-title">批量设置库存</view>
          <view class="batch-card">
            <view class="stock-input-group">
              <input
                class="stock-input"
                type="number"
                v-model="batchStockValue"
                placeholder="输入库存数量，将应用到所有SKU"
                :disabled="saving"
              />
              <button class="batch-btn" @click="batchSaveStock" :disabled="saving || !batchStockValue">
                {{ saving ? '设置中...' : '应用到全部' }}
              </button>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 错误状态 -->
    <view v-else class="error-container">
      <text class="error-text">{{ error || '商品不存在' }}</text>
      <button class="retry-btn" @click="loadProductData">重新加载</button>
    </view>
  </view>
</template>

<script>
import * as productApi from '@/api/product.js';

export default {
  data() {
    return {
      productId: null,
      productName: '',
      product: null,
      skuList: [],
      loading: false,
      saving: false,
      error: null,
      singleStockValue: '',
      batchStockValue: ''
    }
  },
  
  computed: {
    isSingleSpec() {
      if (!this.product) return true;
      const specType = this.product.specType;
      return specType === '0' || specType === 0 || !specType;
    },
    
    totalStock() {
      if (this.isSingleSpec) {
        return this.singleStockValue || this.product.stock || this.product.stockQuantity || 0;
      }
      return this.skuList.reduce((total, sku) => {
        return total + (Number(sku.stockQuantity || sku.stock || 0));
      }, 0);
    }
  },
  
  onLoad(options) {
    if (options.productId) {
      this.productId = parseInt(options.productId);
      this.productName = decodeURIComponent(options.productName || '');
      this.loadProductData();
    } else {
      this.error = '商品ID不存在';
    }
  },
  
  methods: {
    // 加载商品数据（从数据库获取最新数据，确保数据同步）
    async loadProductData() {
      if (!this.productId) return;
      
      this.loading = true;
      this.error = null;
      
      try {
        console.log('📦 从数据库加载商品最新数据，productId:', this.productId);
        
        // 并行加载商品信息和SKU列表（从数据库获取最新数据）
        const [productRes, skuRes] = await Promise.all([
          productApi.getProductSpuDetail(this.productId).catch(() => ({ code: 404, data: null })),
          productApi.getProductSkusBySpuId(this.productId)
        ]);
        
        console.log('📦 商品详情响应:', productRes);
        console.log('📦 SKU列表响应:', skuRes);
        
        // 处理商品信息（使用数据库返回的最新数据）
        if (productRes.code === 200 && productRes.data) {
          this.product = productRes.data;
          console.log('✅ 商品信息已从数据库加载:', {
            productName: this.product.productName,
            stock: this.product.stock,
            salesVolume: this.product.salesVolume,
            clickCount: this.product.clickCount,
            productStatus: this.product.productStatus,
            specType: this.product.specType
          });
        } else {
          // 如果获取商品信息失败，使用基本信息
          this.product = {
            productSpuId: this.productId,
            productName: this.productName || '未知商品',
            specType: '2' // 默认多规格（数据库中使用2表示多规格）
          };
          console.warn('⚠️ 商品信息获取失败，使用默认值');
        }
        
        // 处理SKU列表（从数据库获取最新库存）
        if (skuRes && skuRes.code === 200) {
          const skus = skuRes.data || [];
          console.log('✅ SKU列表已从数据库加载，数量:', skus.length);
          
          // 规范化SKU列表，解析JSON格式的skuDetail
          this.skuList = skus.map(sku => {
            const parsedDetail = this.parseSkuDetail(sku);
            const specText = this.buildSkuSpecText(parsedDetail, sku);
            // 确保使用数据库中的最新 stockQuantity 字段
            const dbStock = sku.stockQuantity || sku.stock || 0;
            return {
              ...sku,
              parsedDetail,
              specText,
              stockQuantity: dbStock,
              stock: dbStock,
              editStock: dbStock // 初始化编辑值为数据库中的最新值
            };
          });
          
          // 根据SKU数量判断规格类型（与数据库保持一致：0=单规格，2=多规格）
          if (this.skuList.length === 0) {
            // 没有SKU，可能是单规格商品
            this.product.specType = '0';
          } else if (this.skuList.length === 1) {
            // 只有一个SKU，可能是单规格
            this.product.specType = '0';
            this.singleStockValue = this.skuList[0].stockQuantity || this.skuList[0].stock || 0;
          } else {
            // 多个SKU，是多规格（数据库中使用2表示多规格）
            this.product.specType = '2';
          }
        } else {
          this.skuList = [];
          // 如果没有SKU，默认为单规格
          this.product.specType = '0';
          this.singleStockValue = 0;
          console.warn('⚠️ SKU列表获取失败或为空');
        }
      } catch (error) {
        console.error('❌ 加载商品数据失败:', error);
        this.error = error.message || '加载失败，请重试';
      } finally {
        this.loading = false;
      }
    },
    
    // 解析SKU详情字段（上传时存储的JSON）
    parseSkuDetail(sku) {
      if (!sku) return null;
      let detail = sku.skuDetail || sku.sku_detail || sku.detail;
      if (typeof detail === 'string') {
        try {
          detail = JSON.parse(detail);
        } catch (error) {
          console.warn('SKU详情解析失败:', error, detail);
          // 如果不是JSON，直接返回字符串
          return detail;
        }
      }
      return detail || null;
    },
    
    // 组装规格展示文本
    buildSkuSpecText(detail, sku) {
      // 如果detail是字符串（不是JSON对象），直接返回
      if (typeof detail === 'string' && !detail.startsWith('{')) {
        return detail;
      }
      
      // 如果是JSON对象，解析组合信息
      if (detail && typeof detail === 'object') {
        if (Array.isArray(detail.combination) && detail.combination.length > 0) {
          return detail.combination
            .map(item => {
              const name = item.name || item.attrName || '';
              const value = item.value || item.attrValue || '';
              return name ? `${name}:${value}` : value;
            })
            .filter(Boolean)
            .join(' / ');
        }
        if (detail.description) {
          return detail.description;
        }
        if (detail.skuName) {
          return detail.skuName;
        }
        if (detail.productName) {
          return detail.productName;
        }
      }
      
      // 回退到其他字段
      return sku.skuName || sku.name || sku.specText || `规格 ${sku.productSkuId || ''}`;
    },
    
    // 获取SKU显示名称
    getSkuDisplayName(sku) {
      const parsedDetail = this.parseSkuDetail(sku);
      const specText = this.buildSkuSpecText(parsedDetail, sku);
      return specText || '默认规格';
    },
    
    // 保存单规格商品库存
    async saveSingleStock() {
      if (!this.singleStockValue || isNaN(parseInt(this.singleStockValue))) {
        uni.showToast({
          title: '请输入有效的库存数量',
          icon: 'none'
        });
        return;
      }
      
      const stockValue = parseInt(this.singleStockValue);
      if (stockValue < 0) {
        uni.showToast({
          title: '库存不能为负数',
          icon: 'none'
        });
        return;
      }
      
      // 如果有SKU，更新第一个SKU的库存
      if (this.skuList.length > 0) {
        await this.saveSkuStock({ ...this.skuList[0], editStock: stockValue });
      } else {
        uni.showToast({
          title: '该商品没有SKU信息，无法更新库存',
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
      
      // 验证必填字段
      const salePrice = parseFloat(sku.salePrice || sku.sale_price || 0);
      const costPrice = parseFloat(sku.costPrice || sku.cost_price || 0);
      
      if (!salePrice || salePrice <= 0) {
        uni.showToast({
          title: 'SKU售价信息不完整，无法更新库存',
          icon: 'none'
        });
        return;
      }
      
      if (!costPrice || costPrice <= 0) {
        uni.showToast({
          title: 'SKU成本价信息不完整，无法更新库存',
          icon: 'none'
        });
        return;
      }
      
      this.saving = true;
      try {
        uni.showLoading({ title: '保存中...' });
        
        // 确保所有字段都是正确的类型和格式
        const updateData = {
          productSkuId: Number(sku.productSkuId),
          spuId: Number(this.productId),
          salePrice: Number(salePrice),
          costPrice: Number(costPrice),
          stockQuantity: Number(stockValue),
          skuDetail: sku.skuDetail || sku.sku_detail || sku.detail || '',
          skuStatus: String(sku.skuStatus || sku.sku_status || '0')
        };
        
        console.log('📦 准备更新SKU库存:', {
          productSkuId: updateData.productSkuId,
          spuId: updateData.spuId,
          stockQuantity: updateData.stockQuantity,
          updateData: updateData
        });
        
        const res = await productApi.updateProductSku(updateData);
        
        console.log('📦 SKU更新响应:', res);
        
        uni.hideLoading();
        
        if (res && res.code === 200) {
          console.log('✅ SKU库存更新成功，响应数据:', res.data);
          
          uni.showToast({
            title: '保存成功',
            icon: 'success',
            duration: 2000
          });
          
          // 立即从数据库重新加载最新数据，确保数据同步（包括库存、销售量、点击量等所有字段）
          await this.loadProductData();
          
          // 触发库存更新事件，通知其他页面刷新
          uni.$emit('productStockUpdated', {
            productId: this.productId,
            skuId: sku.productSkuId,
            stockQuantity: stockValue
          });
        } else {
          const errorMsg = res?.message || res?.msg || '保存失败';
          console.error('❌ SKU更新失败:', res);
          throw new Error(errorMsg);
        }
      } catch (error) {
        uni.hideLoading();
        console.error('❌ 保存库存失败:', error);
        console.error('❌ 错误详情:', {
          message: error.message,
          response: error.response,
          data: error.data
        });
        uni.showToast({
          title: error.message || error.response?.data?.message || '保存失败，请重试',
          icon: 'none',
          duration: 3000
        });
      } finally {
        this.saving = false;
      }
    },
    
    // 批量保存库存
    async batchSaveStock() {
      if (!this.batchStockValue || isNaN(parseInt(this.batchStockValue))) {
        uni.showToast({
          title: '请输入有效的库存数量',
          icon: 'none'
        });
        return;
      }
      
      const stockValue = parseInt(this.batchStockValue);
      if (stockValue < 0) {
        uni.showToast({
          title: '库存不能为负数',
          icon: 'none'
        });
        return;
      }
      
      if (this.skuList.length === 0) {
        uni.showToast({
          title: '没有可更新的SKU',
          icon: 'none'
        });
        return;
      }
      
      this.saving = true;
      try {
        uni.showLoading({ title: '批量设置中...' });
        
        console.log('📦 准备批量更新SKU库存:', {
          spuId: this.productId,
          stockValue: stockValue,
          skuCount: this.skuList.length
        });
        
        // 并行更新所有SKU
        const updatePromises = this.skuList.map(async (sku, index) => {
          // 验证必填字段
          const salePrice = parseFloat(sku.salePrice || sku.sale_price || 0);
          const costPrice = parseFloat(sku.costPrice || sku.cost_price || 0);
          
          if (!salePrice || salePrice <= 0 || !costPrice || costPrice <= 0) {
            console.error(`❌ SKU ${sku.productSkuId} 的价格信息不完整:`, {
              salePrice,
              costPrice,
              sku
            });
            throw new Error(`SKU ${sku.productSkuId} 的价格信息不完整`);
          }
          
          const updateData = {
            productSkuId: Number(sku.productSkuId),
            spuId: Number(this.productId),
            salePrice: Number(salePrice),
            costPrice: Number(costPrice),
            stockQuantity: Number(stockValue),
            skuDetail: sku.skuDetail || sku.sku_detail || sku.detail || '',
            skuStatus: String(sku.skuStatus || sku.sku_status || '0')
          };
          
          console.log(`📦 更新SKU ${index + 1}/${this.skuList.length}:`, updateData);
          
          try {
            const res = await productApi.updateProductSku(updateData);
            console.log(`✅ SKU ${sku.productSkuId} 更新响应:`, res);
            
            if (res && res.code === 200) {
              return { success: true, skuId: sku.productSkuId };
            } else {
              console.error(`❌ SKU ${sku.productSkuId} 更新失败:`, res);
              return { success: false, skuId: sku.productSkuId, error: res?.message || res?.msg };
            }
          } catch (err) {
            console.error(`❌ SKU ${sku.productSkuId} 更新异常:`, err);
            return { success: false, skuId: sku.productSkuId, error: err.message };
          }
        });
        
        const results = await Promise.all(updatePromises);
        
        // 检查结果
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;
        
        console.log('📦 批量更新结果:', {
          total: results.length,
          success: successCount,
          failed: failCount,
          results: results
        });
        
        if (failCount > 0) {
          const failedSkus = results.filter(r => !r.success).map(r => r.skuId).join(', ');
          throw new Error(`${failCount} 个SKU更新失败 (ID: ${failedSkus})`);
        }
        
        console.log('✅ 批量更新完成，成功:', successCount, '失败:', failCount);
        
        uni.hideLoading();
        uni.showToast({
          title: `批量设置成功 (${successCount}个SKU)`,
          icon: 'success',
          duration: 2000
        });
        
        // 立即从数据库重新加载最新数据，确保数据同步（包括库存、销售量、点击量等所有字段）
        await this.loadProductData();
        
        // 触发库存更新事件，通知其他页面刷新
        uni.$emit('productStockUpdated', {
          productId: this.productId,
          stockQuantity: stockValue
        });
      } catch (error) {
        uni.hideLoading();
        console.error('❌ 批量设置库存失败:', error);
        uni.showToast({
          title: error.message || '批量设置失败，请重试',
          icon: 'none',
          duration: 3000
        });
      } finally {
        this.saving = false;
      }
    },
    
    // 格式化价格
    formatPrice(price) {
      if (!price) return '0.00';
      return Number(price).toFixed(2);
    },
    
    // 返回上一页
    goBack() {
      uni.navigateBack();
    }
  }
}
</script>

<style scoped>
.stock-management-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 导航栏 */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-left, .nav-right {
  width: 60px;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

/* 加载状态 */
.loading-container {
  padding: 60px 20px;
  display: flex;
  justify-content: center;
}

/* 商品信息区域 */
.product-info-section {
  padding: 20px 15px;
}

.product-header {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.product-name {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.product-id {
  display: block;
  font-size: 14px;
  color: #999;
}

/* 库存区域 */
.stock-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding: 0 5px;
}

.stock-card, .sku-card, .batch-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 12px;
}

.stock-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.stock-label {
  font-size: 14px;
  color: #666;
}

.stock-value {
  font-size: 24px;
  font-weight: 600;
  color: #409EFF;
}

.stock-input-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.stock-input {
  flex: 1;
  height: 44px;
  padding: 0 15px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
}

.stock-input:disabled {
  background: #f5f5f5;
  color: #999;
}

.save-btn, .batch-btn {
  padding: 0 24px;
  height: 44px;
  background: #409EFF;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  white-space: nowrap;
}

.save-btn:disabled, .batch-btn:disabled {
  background: #c0c4cc;
  color: #fff;
}

/* SKU列表 */
.sku-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sku-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.sku-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.sku-price {
  font-size: 16px;
  font-weight: 600;
  color: #ff2e63;
}

.sku-stock-info {
  margin-bottom: 12px;
}

/* 批量设置 */
.batch-section {
  margin-top: 20px;
}

.batch-btn {
  background: #67C23A;
}

.batch-btn:disabled {
  background: #c0c4cc;
}

/* 错误状态 */
.error-container {
  padding: 60px 20px;
  text-align: center;
}

.error-text {
  display: block;
  font-size: 16px;
  color: #666;
  margin-bottom: 20px;
}

.retry-btn {
  padding: 10px 20px;
  background: #409EFF;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
}
</style>

