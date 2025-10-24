<template>
  <view class="container">
    <!-- 头部标题 -->
    <view class="page-header">
      <text class="page-title">商品上传</text>
      <text class="page-subtitle">完善商品信息，提升销售转化</text>
    </view>

    <view class="success-message" v-if="showSuccessMessage">
      <text class="icon-success">✓</text>
      <text>商品信息提交成功！</text>
    </view>
    
    <!-- SPU表单部分 -->
    <view class="form-section">
      <view class="section-header">
        <view class="section-icon">📦</view>
        <view class="section-title-content">
          <text class="section-title">SPU信息</text>
          <text class="section-desc">商品基础信息配置</text>
        </view>
      </view>
      
      <view class="form-group">
        <label class="form-label">选择已有商品</label>
        <view class="picker-with-add-container">
          <view class="picker-with-add">
            <picker @change="onExistingSpuChange" :value="existingSpuIndex" :range="existingSpuOptions" range-key="name">
              <view class="picker custom-picker">
                <text class="picker-text">{{ existingSpuIndex >= 0 ? existingSpuOptions[existingSpuIndex].name : '请选择商品' }}</text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
            <button class="add-btn-single" @tap="toggleNewSpuForm">
              <text class="add-icon">+</text>
            </button>
          </view>
        </view>
      </view>
      
      <view class="new-spu-form" v-if="showNewSpuForm">
        <!-- 基础信息卡片 -->
        <view class="form-card">
          <view class="card-header">
            <text class="card-title">基础信息</text>
            <button class="close-btn" @tap="toggleNewSpuForm">
              <text class="close-icon">×</text>
            </button>
          </view>
          <view class="card-content">
            <view class="form-group">
              <label class="form-label required">商品名称</label>
              <input type="text" class="form-input" v-model="spuData.name" placeholder="请输入商品名称" />
              <view class="error-message" v-if="errors.productName">商品名称不能为空</view>
            </view>
            
            <view class="form-group">
              <label class="form-label required">商品详情</label>
              <textarea class="form-textarea" v-model="spuData.detail" placeholder="请输入商品详情描述" />
              <view class="error-message" v-if="errors.productDetail">商品详情不能为空</view>
            </view>
            
            <view class="form-group">
              <label class="form-label required">商品类别</label>
              <picker @change="onCategoryChange" :value="categoryIndex" :range="categoryOptions">
                <view class="picker custom-picker">
                  <text class="picker-text">{{ categoryIndex >= 0 ? categoryOptions[categoryIndex] : '请选择商品类别' }}</text>
                  <text class="picker-arrow">▼</text>
                </view>
              </picker>
              <view class="error-message" v-if="errors.productCategory">请选择商品类别</view>
            </view>
          </view>
        </view>

        <!-- 规格参数卡片 -->
        <view class="form-card">
          <view class="card-header">
            <text class="card-title">规格参数</text>
            <text class="card-tips">可添加多个规格属性</text>
          </view>
          <view class="card-content">
            <view class="specs-container">
              <view class="spec-item" v-for="(spec, index) in spuData.specs" :key="index">
                <view class="spec-header">
                  <text class="spec-number">规格 {{ index + 1 }}</text>
                  <button class="remove-btn-top-right" @tap="removeSpec(index)" v-if="spuData.specs.length > 1">
                    <text class="remove-icon">×</text>
                  </button>
                </view>
                <view class="form-group">
                  <label class="form-label required">规格名称</label>
                  <input type="text" class="form-input" v-model="spec.name" placeholder="例如：颜色、尺寸、材质" />
                  <view class="error-message" v-if="errors[`specName${index}`]">规格名称不能为空</view>
                </view>
                <view class="form-group">
                  <label class="form-label">规格值</label>
                  <view class="spec-values" v-if="spec.values.length > 0">
                    <view class="spec-value-tag" v-for="(value, valueIndex) in spec.values" :key="valueIndex">
                      <text class="value-text">{{ value }}</text>
                      <text class="remove-value" @tap="removeSpecValue(index, valueIndex)">×</text>
                    </view>
                  </view>
                  <view class="add-spec-value">
                    <input type="text" class="form-input spec-value-input" v-model="spec.newValue" placeholder="输入规格值后点击添加" />
                    <button class="btn-primary btn-sm" @tap="addSpecValue(index)">添加</button>
                  </view>
                </view>
              </view>
            </view>
            <button class="btn-outline add-spec-btn" @tap="addNewSpec">
              <text class="add-icon">+</text>
              <text>添加规格参数</text>
            </button>
          </view>
        </view>

        <!-- 图片上传卡片 -->
        <view class="form-card">
          <view class="card-header">
            <text class="card-title">商品图片</text>
            <text class="card-tips">最多上传9张图片</text>
          </view>
          <view class="card-content">
            <view class="image-upload-container">
              <view class="image-upload-item" @tap="chooseImage">
                <view class="upload-placeholder">
                  <text class="upload-icon">+</text>
                  <text class="upload-text">添加图片</text>
                </view>
              </view>
              <view class="image-preview-item" v-for="(image, index) in uploadedImages" :key="index">
                <image class="preview-image" :src="image" mode="aspectFill" />
                <view class="image-overlay">
                  <button class="btn-danger btn-sm remove-image-btn" @tap="removeImage(index)">删除</button>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 价格库存卡片 -->
        <view class="form-card">
          <view class="card-header">
            <text class="card-title">价格与库存</text>
          </view>
          <view class="card-content">
            <view class="inline-form-group">
              <view class="form-group">
                <label class="form-label required">市场价（元）</label>
                <input type="number" class="form-input" v-model="spuData.marketPrice" placeholder="0.00" />
                <view class="error-message" v-if="errors.marketPrice">请输入有效的市场价</view>
              </view>
              
              <view class="form-group">
                <label class="form-label required">成本价（元）</label>
                <input type="number" class="form-input" v-model="spuData.costPrice" placeholder="0.00" />
                <view class="error-message" v-if="errors.costPrice">请输入有效的成本价</view>
              </view>
              
              <view class="form-group">
                <label class="form-label required">库存</label>
                <input type="number" class="form-input" v-model="spuData.stock" placeholder="0" />
                <view class="error-message" v-if="errors.stock">请输入有效的库存数量</view>
              </view>
            </view>
          </view>
        </view>

        <!-- 设置卡片 -->
        <view class="form-card">
          <view class="card-header">
            <text class="card-title">商品设置</text>
          </view>
          <view class="card-content">
            <view class="setting-item">
              <view class="setting-label">
                <text class="label-text">有无子产品</text>
                <text class="label-desc">开启后需要配置SKU信息</text>
              </view>
              <switch :checked="spuData.hasSku" @change="onHasSkuChange" color="#1890ff" />
            </view>
            
            <view class="form-group">
              <label class="form-label">商品状态</label>
              <picker @change="onStatusChange" :value="statusIndex" :range="statusOptions" range-key="name">
                <view class="picker custom-picker">
                  <text class="picker-text">{{ statusIndex >= 0 ? statusOptions[statusIndex].name : '请选择状态' }}</text>
                  <text class="picker-arrow">▼</text>
                </view>
              </picker>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- SKU表单部分 -->
    <view class="form-section" v-if="!spuData.hasSku">
      <view class="section-header">
        <view class="section-icon">📋</view>
        <view class="section-title-content">
          <text class="section-title">SKU信息</text>
          <text class="section-desc">子产品规格与定价</text>
        </view>
      </view>
      
      <view class="sku-container">
        <view class="sku-card" v-for="(sku, index) in skuData" :key="index">
          <view class="sku-header">
            <view class="sku-title">
              <text class="sku-number">子产品 {{ index + 1 }}</text>
            </view>
            <button class="remove-btn-top-right" @tap="removeSku(index)" v-if="skuData.length > 1">
              <text class="remove-icon">×</text>
            </button>
          </view>
          
          <view class="sku-content">
            <view class="form-group">
              <label class="form-label required">子产品描述</label>
              <input type="text" class="form-input" v-model="sku.description" placeholder="例如：红色，128GB" />
              <view class="error-message" v-if="errors[`skuDesc${index}`]">子产品描述不能为空</view>
            </view>
            
            <view class="inline-form-group">
              <view class="form-group">
                <label class="form-label required">售价（元）</label>
                <input type="number" class="form-input" v-model="sku.price" placeholder="0.00" />
                <view class="error-message" v-if="errors[`skuPrice${index}`]">请输入有效的售价</view>
              </view>
              
              <view class="form-group">
                <label class="form-label required">成本价（元）</label>
                <input type="number" class="form-input" v-model="sku.cost" placeholder="0.00" />
                <view class="error-message" v-if="errors[`skuCost${index}`]">请输入有效的成本价</view>
              </view>
              
              <view class="form-group">
                <label class="form-label required">库存量</label>
                <input type="number" class="form-input" v-model="sku.stock" placeholder="0" />
                <view class="error-message" v-if="errors[`skuStock${index}`]">请输入有效的库存量</view>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <button class="btn-outline add-sku-btn" @tap="addNewSku">
        <text class="add-icon">+</text>
        <text>添加子产品</text>
      </button>
    </view>
    
    <!-- 提交按钮 -->
    <view class="action-bar">
      <button class="btn-primary submit-btn" @tap="submitForm">
        <text class="submit-text">提交商品信息</text>
      </button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      showSuccessMessage: false,
      showNewSpuForm: false,
      existingSpuIndex: -1,
      categoryIndex: -1,
      statusIndex: 0,
      existingSpuOptions: [
        { id: '1', name: 'iPhone 14 Pro Max' },
        { id: '2', name: 'MacBook Pro 14英寸' },
        { id: '3', name: 'AirPods Pro 2' },
        { id: '4', name: 'iPad Air 5' }
      ],
      categoryOptions: ['建材', '家具', '灯具', '厨卫', '软装', '饰品', '家电', '全屋定制', '其他'],
      statusOptions: [
        { id: '1', name: '上架' },
        { id: '0', name: '下架' },
        { id: '2', name: '待审核' }
      ],
      spuData: {
        name: '',
        detail: '',
        category: '',
        marketPrice: '',
        costPrice: '',
        stock: '',
        hasSku: false,
        status: '1',
        specs: [
          {
            name: '',
            values: [],
            newValue: ''
          }
        ]
      },
      skuData: [
        {
          description: '',
          price: '',
          cost: '',
          stock: ''
        }
      ],
      uploadedImages: [],
      errors: {}
    }
  },
  methods: {
    toggleNewSpuForm() {
      this.showNewSpuForm = !this.showNewSpuForm;
      if (this.showNewSpuForm) {
        this.resetNewSpuForm();
      }
    },
    
    onExistingSpuChange(e) {
      this.existingSpuIndex = e.detail.value;
      if (this.existingSpuIndex >= 0) {
        this.showNewSpuForm = false;
        this.loadExistingProduct(this.existingSpuOptions[this.existingSpuIndex].id);
      }
    },
    
    onCategoryChange(e) {
      this.categoryIndex = e.detail.value;
      this.spuData.category = this.categoryOptions[this.categoryIndex];
    },
    
    onStatusChange(e) {
      this.statusIndex = e.detail.value;
      this.spuData.status = this.statusOptions[this.statusIndex].id;
    },
    
    onHasSkuChange(e) {
      this.spuData.hasSku = e.detail.value;
      if (this.spuData.hasSku && this.skuData.length === 0) {
        this.skuData.push({
          description: '',
          price: '',
          cost: '',
          stock: ''
        });
      }
    },
    
    addNewSpec() {
      this.spuData.specs.push({
        name: '',
        values: [],
        newValue: ''
      });
    },
    
    removeSpec(index) {
      if (this.spuData.specs.length > 1) {
        this.spuData.specs.splice(index, 1);
      } else {
        uni.showToast({
          title: '至少需要保留一个规格参数',
          icon: 'none'
        });
      }
    },
    
    addSpecValue(index) {
      const spec = this.spuData.specs[index];
      if (!spec.newValue.trim()) {
        uni.showToast({
          title: '请输入规格值',
          icon: 'none'
        });
        return;
      }
      
      spec.values.push(spec.newValue);
      spec.newValue = '';
    },
    
    removeSpecValue(specIndex, valueIndex) {
      this.spuData.specs[specIndex].values.splice(valueIndex, 1);
    },
    
    addNewSku() {
      this.skuData.push({
        description: '',
        price: '',
        cost: '',
        stock: ''
      });
    },
    
    removeSku(index) {
      if (this.skuData.length > 1) {
        this.skuData.splice(index, 1);
      } else {
        uni.showToast({
          title: '至少需要保留一个子产品',
          icon: 'none'
        });
      }
    },
    
    chooseImage() {
      uni.chooseImage({
        count: 9,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.uploadedImages = this.uploadedImages.concat(res.tempFilePaths);
        }
      });
    },
    
    removeImage(index) {
      this.uploadedImages.splice(index, 1);
    },
    
    loadExistingProduct(productId) {
      // 模拟从服务器加载数据
      const products = {
        '1': {
          name: 'iPhone 14 Pro Max',
          detail: '苹果最新旗舰手机，搭载A16仿生芯片',
          category: '家电',
          marketPrice: '8999',
          costPrice: '6500',
          stock: '100',
          hasSku: true,
          status: '1'
        },
        '2': {
          name: 'MacBook Pro 14英寸',
          detail: '专业级笔记本电脑，适合创意工作者',
          category: '家电',
          marketPrice: '14999',
          costPrice: '12000',
          stock: '50',
          hasSku: false,
          status: '1'
        },
        '3': {
          name: 'AirPods Pro 2',
          detail: '主动降噪无线耳机',
          category: '家电',
          marketPrice: '1899',
          costPrice: '1400',
          stock: '200',
          hasSku: false,
          status: '1'
        },
        '4': {
          name: 'iPad Air 5',
          detail: '轻薄便携的平板电脑',
          category: '家电',
          marketPrice: '4399',
          costPrice: '3500',
          stock: '80',
          hasSku: true,
          status: '1'
        }
      };
      
      const product = products[productId];
      if (product) {
        this.spuData.name = product.name;
        this.spuData.detail = product.detail;
        this.spuData.category = product.category;
        this.spuData.marketPrice = product.marketPrice;
        this.spuData.costPrice = product.costPrice;
        this.spuData.stock = product.stock;
        this.spuData.hasSku = product.hasSku;
        this.spuData.status = product.status;
        
        this.categoryIndex = this.categoryOptions.indexOf(product.category);
        const statusIndex = this.statusOptions.findIndex(item => item.id === product.status);
        if (statusIndex >= 0) {
          this.statusIndex = statusIndex;
        }
      }
    },
    
    resetNewSpuForm() {
      this.spuData = {
        name: '',
        detail: '',
        category: '',
        marketPrice: '',
        costPrice: '',
        stock: '',
        hasSku: false,
        status: '1',
        specs: [
          {
            name: '',
            values: [],
            newValue: ''
          }
        ]
      };
      
      this.skuData = [
        {
          description: '',
          price: '',
          cost: '',
          stock: ''
        }
      ];
      
      this.uploadedImages = [];
      this.errors = {};
      this.categoryIndex = -1;
      this.statusIndex = 0;
      this.existingSpuIndex = -1;
    },
    
    validateForm() {
      this.errors = {};
      let isValid = true;
      
      if (!this.spuData.name.trim()) {
        this.errors.productName = true;
        isValid = false;
      }
      
      if (!this.spuData.detail.trim()) {
        this.errors.productDetail = true;
        isValid = false;
      }
      
      if (!this.spuData.category) {
        this.errors.productCategory = true;
        isValid = false;
      }
      
      if (!this.spuData.marketPrice || parseFloat(this.spuData.marketPrice) < 0) {
        this.errors.marketPrice = true;
        isValid = false;
      }
      
      if (!this.spuData.costPrice || parseFloat(this.spuData.costPrice) < 0) {
        this.errors.costPrice = true;
        isValid = false;
      }
      
      if (!this.spuData.stock || parseInt(this.spuData.stock) < 0) {
        this.errors.stock = true;
        isValid = false;
      }
      
      this.spuData.specs.forEach((spec, index) => {
        if (!spec.name.trim()) {
          this.errors[`specName${index}`] = true;
          isValid = false;
        }
      });
      
      if (!this.spuData.hasSku) {
        this.skuData.forEach((sku, index) => {
          if (!sku.description.trim()) {
            this.errors[`skuDesc${index}`] = true;
            isValid = false;
          }
          
          if (!sku.price || parseFloat(sku.price) < 0) {
            this.errors[`skuPrice${index}`] = true;
            isValid = false;
          }
          
          if (!sku.cost || parseFloat(sku.cost) < 0) {
            this.errors[`skuCost${index}`] = true;
            isValid = false;
          }
          
          if (!sku.stock || parseInt(sku.stock) < 0) {
            this.errors[`skuStock${index}`] = true;
            isValid = false;
          }
        });
      }
      
      return isValid;
    },
    
    submitForm() {
      if (!this.validateForm()) {
        uni.showToast({
          title: '请检查表单中的错误信息',
          icon: 'none'
        });
        return;
      }
      
      const formData = {
        spu: {
          ...this.spuData,
          images: this.uploadedImages,
          specs: this.spuData.specs.map(spec => ({
            name: spec.name,
            values: spec.values
          }))
        },
        skus: !this.spuData.hasSku ? this.skuData : []
      };
      
      console.log('提交的数据:', formData);
      
      this.showSuccessMessage = true;
      setTimeout(() => {
        this.showSuccessMessage = false;
      }, 3000);
      
      this.resetNewSpuForm();
      this.showNewSpuForm = false;
    }
  }
}
</script>

<style scoped>
/* 基础样式 */
/* 基础样式 */
.container {
  padding: 24rpx;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4efe9 100%);
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: 40rpx;
  padding: 40rpx 0;
}

.page-title {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 12rpx;
}

.page-subtitle {
  display: block;
  font-size: 28rpx;
  color: #666;
}

/* 成功消息 */
.success-message {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: white;
  padding: 24rpx 32rpx;
  border-radius: 16rpx;
  margin-bottom: 32rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 4rpx 16rpx rgba(82, 196, 26, 0.3);
}

.icon-success {
  font-size: 36rpx;
  margin-right: 16rpx;
}

/* 表单区块 */
.form-section {
  background: white;
  border-radius: 20rpx;
  margin-bottom: 32rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid #f0f0f0;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 32rpx;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.section-icon {
  font-size: 48rpx;
  margin-right: 20rpx;
}

.section-title-content {
  flex: 1;
}

.section-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8rpx;
}

.section-desc {
  display: block;
  font-size: 26rpx;
  color: #999;
}

/* 选择器与添加按钮 - 宽度调整为100% */
.picker-with-add-container {
  width: 100%;
}

.picker-with-add {
  display: flex;
  align-items: center;
  gap: 16rpx;
  width: 100%;
}

.custom-picker {
  flex: 1;
  padding: 20rpx 24rpx;
  border: 2rpx solid #e8e8e8;
  border-radius: 12rpx;
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 80rpx;
}

.picker-text {
  font-size: 28rpx;
  color: #333;
}

.picker-arrow {
  font-size: 24rpx;
  color: #999;
}

.add-btn-single {
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 12rpx;
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: bold;
  flex-shrink: 0;
}

/* 删除按钮 - 右上角无边框 */
.remove-btn-top-right {
  background: none;
  border: none;
  color: #ff4d4f;
  font-size: 36rpx;
  font-weight: bold;
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  z-index: 10;
}

/* 表单卡片 */
.form-card {
  background: #fafafa;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  border: 1rpx solid #e8e8e8;
  overflow: hidden;
  position: relative;
}

.card-header {
  background: white;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  min-height: 80rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
  flex: 1;
  padding-right: 60rpx;
}

.card-tips {
  font-size: 24rpx;
  color: #999;
  position: absolute;
  right: 80rpx;
  top: 24rpx;
}

.close-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 36rpx;
  font-weight: bold;
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  z-index: 10;
}

.card-content {
  padding: 32rpx;
}

/* 表单元素 */
.form-group {
  margin-bottom: 32rpx;
  position: relative;
}

.form-label {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 16rpx;
}

.form-label.required::after {
  content: '*';
  color: #ff4d4f;
  margin-left: 8rpx;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 20rpx 24rpx;
  border: 2rpx solid #e8e8e8;
  border-radius: 12rpx;
  font-size: 28rpx;
  background: white;
  transition: all 0.3s;
  box-sizing: border-box;
}

.form-input:focus, .form-textarea:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 4rpx rgba(24, 144, 255, 0.1);
  outline: none;
}

.form-textarea {
  height: 200rpx;
  resize: vertical;
}

/* 按钮样式 */
.btn-primary {
  background: linear-gradient(135deg, #1890ff, #096dd9);
  color: white;
  border: none;
  border-radius: 12rpx;
  padding: 20rpx 32rpx;
  font-size: 28rpx;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-primary.btn-sm {
  padding: 16rpx 24rpx;
  font-size: 24rpx;
  min-width: 120rpx;
  white-space: nowrap;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-outline {
  background: transparent;
  border: 2rpx solid #1890ff;
  color: #1890ff;
  border-radius: 12rpx;
  padding: 20rpx 32rpx;
  font-size: 28rpx;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-outline:active {
  background: rgba(24, 144, 255, 0.1);
}

.btn-danger {
  background: #ff4d4f;
  color: white;
  border: none;
  border-radius: 8rpx;
  padding: 12rpx 20rpx;
  font-size: 24rpx;
  transition: all 0.3s;
}

.btn-danger:active {
  background: #d9363e;
}

.add-icon {
  font-size: 32rpx;
  font-weight: bold;
  margin-right: 8rpx;
}

/* 规格参数 */
.specs-container {
  margin-bottom: 24rpx;
}

.spec-item {
  background: white;
  border: 1rpx solid #e8e8e8;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  position: relative;
}

.spec-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.spec-number {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.spec-values {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.spec-value-tag {
  background: #f0f8ff;
  border: 1rpx solid #1890ff;
  border-radius: 20rpx;
  padding: 12rpx 20rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.value-text {
  font-size: 24rpx;
  color: #1890ff;
}

.remove-value {
  color: #ff4d4f;
  font-size: 24rpx;
  font-weight: bold;
  cursor: pointer;
  width: 24rpx;
  height: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-spec-value {
  display: flex;
  gap: 16rpx;
  align-items: stretch;
  width: 100%;
}

.spec-value-input {
  flex: 1;
  min-width: 0;
}

.add-spec-btn, .add-sku-btn {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12rpx;
  margin-top: 16rpx;
}

/* 图片上传 */
.image-upload-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.image-upload-item, .image-preview-item {
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}

.image-upload-item {
  border: 2rpx dashed #d9d9d9;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  transition: all 0.3s;
}

.image-upload-item:active {
  border-color: #1890ff;
  background: #f0f8ff;
}

.upload-placeholder {
  text-align: center;
}

.upload-icon {
  font-size: 48rpx;
  color: #999;
  display: block;
  margin-bottom: 12rpx;
}

.upload-text {
  font-size: 24rpx;
  color: #999;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-preview-item:hover .image-overlay {
  opacity: 1;
}

.remove-image-btn {
  background: rgba(255, 255, 255, 0.9);
  color: #ff4d4f;
  border: none;
  font-size: 24rpx;
}

/* 行内表单组 */
.inline-form-group {
  display: flex;
  gap: 24rpx;
  width: 100%;
}

.inline-form-group .form-group {
  flex: 1;
  margin-bottom: 0;
  min-width: 0;
}

/* 设置项 */
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.setting-label {
  flex: 1;
}

.label-text {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 8rpx;
}

.label-desc {
  display: block;
  font-size: 24rpx;
  color: #999;
}

/* SKU样式 */
.sku-container {
  margin-bottom: 24rpx;
}

.sku-card {
  background: white;
  border: 1rpx solid #e8e8e8;
  border-radius: 12rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
  position: relative;
}

.sku-header {
  background: #fafafa;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  min-height: 80rpx;
}

.sku-title {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.sku-number {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.sku-content {
  padding: 32rpx;
}

/* 操作栏 */
.action-bar {
  background: white;
  padding: 32rpx;
  margin: 0 -24rpx -24rpx;
  border-top: 1rpx solid #f0f0f0;
  position: sticky;
  bottom: 0;
}

.submit-btn {
  width: 100%;
  background: linear-gradient(135deg, #52c41a, #73d13d);
  border: none;
  border-radius: 16rpx;
  padding: 28rpx;
  font-size: 32rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 24rpx rgba(82, 196, 26, 0.3);
  transition: all 0.3s;
}

.submit-btn:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.3);
}

.submit-text {
  color: white;
}

/* 错误消息 */
.error-message {
  color: #ff4d4f;
  font-size: 24rpx;
  margin-top: 8rpx;
}

/* 加载状态 */
.submit-btn:disabled {
  background: #ccc !important;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.loading-spinner {
  display: inline-block;
  width: 20rpx;
  height: 20rpx;
  border: 2rpx solid #fff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
  margin-right: 12rpx;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 20rpx;
  }
  
  .inline-form-group {
    flex-direction: column;
    gap: 0;
  }
  
  .inline-form-group .form-group {
    margin-bottom: 24rpx;
  }
  
  .image-upload-container {
    justify-content: center;
  }
  
  .picker-with-add-container {
    width: 100%;
  }
  
  .form-card {
    margin: 16rpx 0;
  }
  
  .card-content {
    padding: 20rpx;
  }
  
  .add-spec-value {
    flex-direction: column;
    gap: 12rpx;
  }
  
  .btn-primary.btn-sm {
    min-width: 100%;
    margin-top: 8rpx;
  }
}

/* 小屏幕优化 */
@media (max-width: 480px) {
  .page-title {
    font-size: 40rpx;
  }
  
  .section-title {
    font-size: 32rpx;
  }
  
  .form-section {
    padding: 24rpx;
  }
  
  .card-header {
    padding: 20rpx 24rpx;
  }
  
  .card-content {
    padding: 16rpx;
  }
  
  .image-upload-item, .image-preview-item {
    width: 160rpx;
    height: 160rpx;
  }
}
</style>