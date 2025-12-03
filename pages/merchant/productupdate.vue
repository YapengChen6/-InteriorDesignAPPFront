<template>
  <view class="container">
    <!-- 头部标题 -->
    <view class="page-header">
      <text class="page-title">{{ pageTitle }}</text>
      <text class="page-subtitle">{{ pageSubtitle }}</text>
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
          <text class="section-title">父产品信息</text>
          <text class="section-desc">商品基础信息配置</text>
        </view>
      </view>
      
      <!-- 基础信息卡片 -->
      <view class="form-card">
        <view class="card-header">
          <text class="card-title">基础信息</text>
        </view>
        <view class="card-content">
          <view class="form-group">
            <label class="form-label required">商品名称</label>
            <uni-easyinput 
              type="text" 
              v-model="spuData.productName" 
              placeholder="请输入商品名称"
              :inputBorder="false"
              :styles="easyInputStyles"
            />
            <view class="error-message" v-if="errors.productName">商品名称不能为空</view>
          </view>
          
          <view class="form-group">
            <label class="form-label required">商品详情</label>
            <uni-easyinput 
              type="textarea" 
              v-model="spuData.productDetail" 
              placeholder="请输入商品详情描述"
              :inputBorder="false"
              :styles="easyInputStyles"
            />
            <view class="error-message" v-if="errors.productDetail">商品详情不能为空</view>
          </view>
          
          <view class="form-group">
            <label class="form-label required">商品类别</label>
            <picker 
              @change="onCategoryChange" 
              :value="categoryIndex" 
              :range="categoryOptions"
              class="full-width-picker"
            >
              <view class="picker custom-picker">
                <text class="picker-text">{{ categoryIndex >= 0 ? categoryOptions[categoryIndex] : '请选择商品类别' }}</text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
            <view class="error-message" v-if="errors.category">请选择商品类别</view>
          </view>

          <view class="form-group">
            <label class="form-label">商品状态</label>
            <view class="picker custom-picker disabled-picker">
              <text class="picker-text">{{ productStatusIndex >= 0 ? productStatusOptions[productStatusIndex].name : '请选择状态' }}</text>
              <text class="picker-tip">（状态修改请在商品管理页面的上下架按钮操作）</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 规格类型设置 -->
      <view class="form-card">
        <view class="card-header">
          <text class="card-title">规格设置</text>
        </view>
        <view class="card-content">
          <view class="setting-item">
            <view class="setting-label">
              <text class="label-text">有无子产品</text>
              <text class="label-desc">{{ spuData.specType === '1' ? '有子产品(多规格)' : '无子产品(单规格)' }}</text>
            </view>
            <switch :checked="spuData.specType === '1'" @change="onSpecTypeChange" color="#1890ff" />
          </view>
        </view>
      </view>

      <!-- SPU属性卡片 - 单规格时显示 -->
      <view class="form-card" v-if="spuData.specType === '0'">
        <view class="card-header">
          <text class="card-title">商品属性</text>
          <text class="card-tips">商品基础属性配置</text>
        </view>
        <view class="card-content">
          <view class="specs-container">
            <view class="spec-item" v-for="(attribute, index) in spuData.spuAttributes" :key="index">
              <view class="spec-header">
                <text class="spec-number">属性 {{ index + 1 }}</text>
                <button class="remove-btn-top-right" @tap="removeAttribute(index)" v-if="spuData.spuAttributes.length > 1">
                  <text class="remove-icon">×</text>
                </button>
              </view>
              <view class="form-group">
                <label class="form-label required">属性类别</label>
                <uni-easyinput 
                  type="text" 
                  v-model="attribute.attributeCategory" 
                  placeholder="例如：尺寸、颜色、材质"
                  :inputBorder="false"
                  :styles="easyInputStyles"
                />
                <view class="error-message" v-if="errors[`attributeCategory${index}`]">属性类别不能为空</view>
              </view>
              <view class="form-group">
                <label class="form-label required">属性值</label>
                <uni-easyinput 
                  type="text" 
                  v-model="attribute.attributeValue" 
                  placeholder="请输入属性值"
                  :inputBorder="false"
                  :styles="easyInputStyles"
                />
                <view class="error-message" v-if="errors[`attributeValue${index}`]">属性值不能为空</view>
              </view>
            </view>
          </view>
          <button class="btn-outline add-spec-btn" @tap="addNewAttribute">
            <text class="add-icon">+</text>
            <text>添加属性</text>
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
            <view class="image-upload-item" @tap="chooseImage" v-if="uploadedImages.length < 9">
              <view class="upload-placeholder">
                <text class="upload-icon">+</text>
                <text class="upload-text">添加图片</text>
              </view>
            </view>
            <view class="image-preview-item" v-for="(image, index) in uploadedImages" :key="index">
              <image class="preview-image" :src="getImageUrl(image)" mode="aspectFill" @tap="previewImage(index)" />
              <view class="image-overlay">
                <button class="btn-danger btn-sm remove-image-btn" @tap.stop="removeImage(index)">删除</button>
              </view>
              <!-- 图片状态标识 -->
              <view class="image-status-badge" v-if="getImageStatus(image) !== 'existing'">
                <text class="status-text">{{ getImageStatus(image) === 'new' ? '新' : '删除' }}</text>
              </view>
            </view>
          </view>
          <!-- 图片状态统计 -->
          <view class="image-status-summary" v-if="isEditMode">
            <text class="status-item">保留: {{ getExistingImageCount() }}张</text>
            <text class="status-item">新增: {{ imageStatus.newImages.length }}张</text>
            <text class="status-item">删除: {{ imageStatus.deletedImages.length }}张</text>
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
              <uni-easyinput 
                type="digit" 
                v-model="spuData.marketPrice" 
                placeholder="0.00"
                :inputBorder="false"
                :styles="easyInputStyles"
              />
              <view class="error-message" v-if="errors.marketPrice">请输入有效的市场价</view>
            </view>
            
            <view class="form-group">
              <label class="form-label required">成本价（元）</label>
              <uni-easyinput 
                type="digit" 
                v-model="spuData.costPrice" 
                placeholder="0.00"
                :inputBorder="false"
                :styles="easyInputStyles"
              />
              <view class="error-message" v-if="errors.costPrice">请输入有效的成本价</view>
            </view>
            
            <view class="form-group">
              <label class="form-label required">库存</label>
              <uni-easyinput 
                type="number" 
                v-model="spuData.stock" 
                placeholder="0"
                :inputBorder="false"
                :styles="easyInputStyles"
              />
              <view class="error-message" v-if="errors.stock">请输入有效的库存数量</view>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- SKU表单部分 - 多规格时显示 -->
    <view class="form-section" v-if="spuData.specType === '1'">
      <view class="section-header">
        <view class="section-icon">📋</view>
        <view class="section-title-content">
          <text class="section-title">子产品信息</text>
          <text class="section-desc">子产品规格与定价</text>
        </view>
      </view>
      
      <view class="sku-container">
        <view class="sku-card" v-for="(sku, index) in productSkus" :key="index">
          <view class="sku-header">
            <view class="sku-title">
              <text class="sku-number">子产品 {{ index + 1 }}</text>
            </view>
            <button class="remove-btn-top-right" @tap="removeSku(index)" v-if="productSkus.length > 1">
              <text class="remove-icon">×</text>
            </button>
          </view>
          
          <view class="sku-content">
            <view class="form-group">
              <label class="form-label required">子产品描述</label>
              <uni-easyinput 
                type="text" 
                v-model="sku.skuDetail" 
                placeholder="例如：红色，128GB"
                :inputBorder="false"
                :styles="easyInputStyles"
              />
              <view class="error-message" v-if="errors[`skuDetail${index}`]">子产品描述不能为空</view>
            </view>
            
            <view class="inline-form-group">
              <view class="form-group">
                <label class="form-label required">售价（元）</label>
                <uni-easyinput 
                  type="digit" 
                  v-model="sku.salePrice" 
                  placeholder="0.00"
                  :inputBorder="false"
                  :styles="easyInputStyles"
                />
                <view class="error-message" v-if="errors[`salePrice${index}`]">请输入有效的售价</view>
              </view>
              
              <view class="form-group">
                <label class="form-label required">成本价（元）</label>
                <uni-easyinput 
                  type="digit" 
                  v-model="sku.costPrice" 
                  placeholder="0.00"
                  :inputBorder="false"
                  :styles="easyInputStyles"
                />
                <view class="error-message" v-if="errors[`skuCostPrice${index}`]">请输入有效的成本价</view>
              </view>
              
              <view class="form-group">
                <label class="form-label required">库存量</label>
                <uni-easyinput 
                  type="number" 
                  v-model="sku.stockQuantity" 
                  placeholder="0"
                  :inputBorder="false"
                  :styles="easyInputStyles"
                />
                <view class="error-message" v-if="errors[`stockQuantity${index}`]">请输入有效的库存量</view>
              </view>
            </view>

            <!-- 子产品状态 -->
            <view class="form-group">
              <label class="form-label">子产品状态</label>
              <picker 
                @change="(e) => onSkuStatusChange(index, e)" 
                :value="getSkuStatusIndex(index)" 
                :range="skuStatusOptions" 
                range-key="name"
                class="full-width-picker"
              >
                <view class="picker custom-picker">
                  <text class="picker-text">{{ getSkuStatusText(index) }}</text>
                  <text class="picker-arrow">▼</text>
                </view>
              </picker>
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
      <button class="btn-primary submit-btn" @tap="submitForm" :disabled="isSubmitting">
        <text class="submit-text">
          <text class="loading-spinner" v-if="isSubmitting"></text>
          {{ isSubmitting ? '提交中...' : (isEditMode ? '更新商品信息' : '提交商品信息') }}
        </text>
      </button>
    </view>
  </view>
</template>

<script>
import productSpuApi from '@/api/productSpu.js';
import { uploadImage } from '@/api/join.js'

export default {
  data() {
    return {
      productId: null,
      isEditMode: false,
      showSuccessMessage: false,
      categoryIndex: -1,
      productStatusIndex: 0,
      isSubmitting: false,
      
      categoryOptions: ['建材', '家具', '灯具', '厨卫', '软装', '饰品', '家电', '全屋定制', '其他'],
      productStatusOptions: [
        { id: '0', name: '上架' },
        { id: '2', name: '下架' }
      ],
      originalProductStatus: null, // 保存编辑时的原始状态，确保编辑时不能修改状态
      skuStatusOptions: [
        { id: '0', name: '上架' },
        { id: '2', name: '下架' }
      ],
      
      spuData: {
        productName: '',
        productDetail: '',
        category: '',
        productStatus: '0',
        specType: '0',
        marketPrice: '',
        costPrice: '',
        stock: '',
        spuAttributes: [
          {
            attributeCategory: '',
            attributeValue: '',
            sortOrder: 0
          }
        ]
      },
      productSkus: [
        {
          skuDetail: '',
          salePrice: '',
          costPrice: '',
          stockQuantity: '',
          skuStatus: '0'
        }
      ],
      uploadedImages: [],
      // 图片状态管理
      imageStatus: {
        existingImages: [],    // 已存在的图片（从服务器加载的）
        newImages: [],         // 新上传的图片
        deletedImages: []      // 被删除的图片
      },
      errors: {},
      
      easyInputStyles: {
        color: '#333',
        disableColor: '#eee',
        borderColor: '#e8e8e8'
      }
    }
  },
  
  computed: {
    pageTitle() {
      return this.isEditMode ? '商品信息编辑' : '商品信息更改';
    },
    pageSubtitle() {
      return this.isEditMode ? '编辑商品信息，提升销售转化' : '更改商品信息，提升销售转化';
    }
  },
  
  onLoad(options) {
    console.log('接收到的URL参数:', options);
    
    if (options.id && options.type === 'edit') {
      this.productId = options.id;
      this.isEditMode = true;
      console.log('编辑模式，商品ID:', this.productId);
      this.loadExistingProduct(this.productId);
    } else {
      console.log('新增模式');
      this.isEditMode = false;
    }
  },
  
  methods: {
    // 加载商品详情
    async loadExistingProduct(productId) {
      try {
        console.log('开始加载商品详情，商品ID:', productId);
        
        if (!productId) {
          throw new Error('商品ID不能为空');
        }
        
        const result = await productSpuApi.getProductDetail(productId);
        console.log('商品详情API响应:', result);
        
        if (result.code === 200 && result.data) {
          const product = result.data;
          console.log('商品详情数据:', product);
          
          // 修复规格类型映射
          let specType = '0';
          if (product.specType === '2') {
            specType = '1';
          } else {
            specType = product.specType?.toString() || '0';
          }
          
          // 根据实际接口返回的数据结构映射到表单
          this.spuData = {
            productName: product.productName || '',
            productDetail: product.productDetail || '',
            category: product.category || '',
            productStatus: product.productStatus?.toString() || '0',
            specType: specType,
            marketPrice: product.marketPrice?.toString() || '',
            costPrice: product.costPrice?.toString() || '',
            stock: product.stock?.toString() || '',
            spuAttributes: product.spuAttributes ? product.spuAttributes.map(attr => ({
              attributeCategory: attr.attributeCategory || '',
              attributeValue: attr.attributeValue || '',
              sortOrder: parseInt(attr.sortOrder) || 0
            })) : [{
              attributeCategory: '',
              attributeValue: '',
              sortOrder: 0
            }]
          };
          
          // 处理图片数据 - 现在区分已存在和新图片
          this.processImageData(product.coverImages);
          
          // 设置分类选择器
          this.categoryIndex = this.categoryOptions.indexOf(product.category);
          if (this.categoryIndex === -1) {
            this.categoryIndex = this.categoryOptions.indexOf('其他');
          }
          
          // 设置商品状态选择器（保存原始状态，编辑时不能修改）
          const originalStatus = product.productStatus?.toString() || '0';
          this.originalProductStatus = originalStatus;
          const statusIndex = this.productStatusOptions.findIndex(item => 
            item.id === originalStatus
          );
          this.productStatusIndex = statusIndex >= 0 ? statusIndex : 0;
          // 确保 spuData 中的状态与原始状态一致
          this.spuData.productStatus = originalStatus;
          
          // 加载SKU数据
          if (specType === '1' && product.productSkus && product.productSkus.length > 0) {
            this.productSkus = product.productSkus.map(sku => ({
              skuDetail: sku.skuDetail || '',
              salePrice: sku.salePrice?.toString() || '',
              costPrice: sku.costPrice?.toString() || '',
              stockQuantity: sku.stockQuantity?.toString() || '',
              skuStatus: sku.skuStatus?.toString() || '0'
            }));
          } else {
            this.productSkus = [{
              skuDetail: '',
              salePrice: '',
              costPrice: '',
              stockQuantity: '',
              skuStatus: '0'
            }];
          }
          
          console.log('表单数据加载完成:', this.spuData);
          console.log('SKU数据:', this.productSkus);
          console.log('图片状态:', this.imageStatus);
          
        } else {
          throw new Error(result.msg || '获取商品详情失败');
        }
      } catch (error) {
        console.error('加载商品详情失败:', error);
        uni.showToast({
          title: '加载商品详情失败: ' + (error.message || '请检查网络连接'),
          icon: 'none',
          duration: 3000
        });
      }
    },
    
    // 处理图片数据 - 现在区分已存在和新图片
    processImageData(images) {
      if (!images || !Array.isArray(images)) {
        this.uploadedImages = [];
        this.imageStatus.existingImages = [];
        return;
      }
      
      this.uploadedImages = [];
      this.imageStatus.existingImages = [];
      
      images.forEach((image, index) => {
        if (!image) return;
        
        let imageUrl = '';
        
        if (typeof image === 'string') {
          imageUrl = image;
        } else if (image.fileUrl) {
          imageUrl = image.fileUrl;
        } else if (image.url) {
          imageUrl = image.url;
        }
        
        if (imageUrl && imageUrl.trim() !== '') {
          this.uploadedImages.push(imageUrl);
          this.imageStatus.existingImages.push(imageUrl);
        }
      });
      
      console.log('图片数组:', this.uploadedImages);
      console.log('已存在图片:', this.imageStatus.existingImages);
    },
    
    // 获取图片URL
    getImageUrl(image) {
      if (!image) return '';
      
      if (image.startsWith('http') || image.startsWith('https') || image.startsWith('//')) {
        return image;
      }
      
      if (image.startsWith('/') || image.startsWith('_www') || image.startsWith('_doc')) {
        return image;
      }
      
      return image;
    },
    
    // 获取图片状态
    getImageStatus(image) {
      if (this.imageStatus.deletedImages.includes(image)) {
        return 'deleted';
      } else if (this.imageStatus.newImages.includes(image)) {
        return 'new';
      } else if (this.imageStatus.existingImages.includes(image)) {
        return 'existing';
      }
      return 'unknown';
    },
    
    // 获取保留的已存在图片数量
    getExistingImageCount() {
      return this.imageStatus.existingImages.filter(img => 
        !this.imageStatus.deletedImages.includes(img)
      ).length;
    },
    
    // 图片预览功能
    previewImage(index) {
      if (!this.uploadedImages || this.uploadedImages.length === 0) return;
      
      const urls = this.uploadedImages.map(img => this.getImageUrl(img));
      
      uni.previewImage({
        current: index,
        urls: urls,
        indicator: 'number',
        loop: true,
        success: () => {
          console.log('图片预览打开成功');
        },
        fail: (error) => {
          console.error('图片预览失败:', error);
          uni.showToast({
            title: '图片预览失败',
            icon: 'none'
          });
        }
      });
    },
    
    // 选择图片
    chooseImage() {
      const remainingCount = 9 - this.uploadedImages.length;
      if (remainingCount <= 0) {
        uni.showToast({
          title: '最多只能上传9张图片',
          icon: 'none'
        });
        return;
      }

      uni.chooseImage({
        count: remainingCount,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          console.log('选择图片成功:', res);
          
          if (!res || !res.tempFilePaths) {
            console.error('选择图片返回数据异常:', res);
            uni.showToast({
              title: '选择图片失败，返回数据异常',
              icon: 'none'
            });
            return;
          }
          
          const tempFilePaths = res.tempFilePaths || [];
          
          // 添加到图片数组和新图片数组
          this.uploadedImages.push(...tempFilePaths);
          this.imageStatus.newImages.push(...tempFilePaths);

          console.log('更新后的图片数组:', this.uploadedImages);
          console.log('新图片数组:', this.imageStatus.newImages);
          
          uni.showToast({
            title: `成功添加${tempFilePaths.length}张图片`,
            icon: 'success'
          });
        },
        fail: (error) => {
          console.error('选择图片失败:', error);
          let errorMsg = '选择图片失败';
          if (error && error.errMsg) {
            errorMsg = error.errMsg;
          }
          uni.showToast({
            title: errorMsg,
            icon: 'none'
          });
        }
      });
    },
    
    // 删除图片
    removeImage(index) {
      uni.showModal({
        title: '提示',
        content: '确定要删除这张图片吗？',
        success: (res) => {
          if (res.confirm) {
            const deletedImage = this.uploadedImages[index];
            
            // 检查删除的是已存在的图片还是新图片
            const isExistingImage = this.imageStatus.existingImages.includes(deletedImage);
            if (isExistingImage) {
              // 如果是已存在的图片，添加到删除列表
              this.imageStatus.deletedImages.push(deletedImage);
            } else {
              // 如果是新图片，从新图片列表中移除
              const newImageIndex = this.imageStatus.newImages.indexOf(deletedImage);
              if (newImageIndex > -1) {
                this.imageStatus.newImages.splice(newImageIndex, 1);
              }
            }
            
            // 从显示列表中移除
            this.uploadedImages.splice(index, 1);
            
            console.log('删除后的图片数组:', this.uploadedImages);
            console.log('删除的图片:', deletedImage);
            console.log('删除列表:', this.imageStatus.deletedImages);
            console.log('新图片列表:', this.imageStatus.newImages);
            
            uni.showToast({
              title: '删除成功',
              icon: 'success'
            });
          }
        }
      });
    },

    onCategoryChange(e) {
      this.categoryIndex = e.detail.value;
      this.spuData.category = this.categoryOptions[this.categoryIndex];
    },
    
    onProductStatusChange(e) {
      // 已禁用状态修改功能，此方法不再使用
      // 状态修改请在商品管理页面（shop.vue）的上下架按钮操作
      console.warn('商品状态修改已禁用，请在商品管理页面使用上下架按钮操作');
    },
    
    onSpecTypeChange(e) {
      this.spuData.specType = e.detail.value ? '1' : '0';
      if (this.spuData.specType === '1' && this.productSkus.length === 0) {
        this.productSkus = [{
          skuDetail: '',
          salePrice: '',
          costPrice: '',
          stockQuantity: '',
          skuStatus: '0'
        }];
      }
    },
    
    onSkuStatusChange(index, e) {
      this.productSkus[index].skuStatus = this.skuStatusOptions[e.detail.value].id;
    },
    
    getSkuStatusIndex(index) {
      return this.skuStatusOptions.findIndex(item => item.id === this.productSkus[index].skuStatus);
    },
    
    getSkuStatusText(index) {
      const status = this.skuStatusOptions.find(item => item.id === this.productSkus[index].skuStatus);
      return status ? status.name : '请选择状态';
    },
    
    addNewAttribute() {
      this.spuData.spuAttributes.push({
        attributeCategory: '',
        attributeValue: '',
        sortOrder: this.spuData.spuAttributes.length
      });
    },
    
    removeAttribute(index) {
      if (this.spuData.spuAttributes.length > 1) {
        this.spuData.spuAttributes.splice(index, 1);
        this.spuData.spuAttributes.forEach((attr, idx) => {
          attr.sortOrder = idx;
        });
      } else {
        uni.showToast({
          title: '至少需要保留一个属性',
          icon: 'none'
        });
      }
    },
    
    addNewSku() {
      this.productSkus.push({
        skuDetail: '',
        salePrice: '',
        costPrice: '',
        stockQuantity: '',
        skuStatus: '0'
      });
    },
    
    removeSku(index) {
      if (this.productSkus.length > 1) {
        this.productSkus.splice(index, 1);
      } else {
        uni.showToast({
          title: '至少需要保留一个子产品',
          icon: 'none'
        });
      }
    },
    
    resetNewSpuForm() {
      this.spuData = {
        productName: '',
        productDetail: '',
        category: '',
        productStatus: '0',
        specType: '0',
        marketPrice: '',
        costPrice: '',
        stock: '',
        spuAttributes: [
          {
            attributeCategory: '',
            attributeValue: '',
            sortOrder: 0
          }
        ]
      };
      
      this.productSkus = [
        {
          skuDetail: '',
          salePrice: '',
          costPrice: '',
          stockQuantity: '',
          skuStatus: '0'
        }
      ];
      
      this.uploadedImages = [];
      this.imageStatus = {
        existingImages: [],
        newImages: [],
        deletedImages: []
      };
      this.errors = {};
      this.categoryIndex = -1;
      this.productStatusIndex = 0;
      this.originalProductStatus = null; // 重置原始状态
    },
    
    validateForm() {
      this.errors = {};
      let isValid = true;
      
      if (!this.spuData.productName.trim()) {
        this.errors.productName = true;
        isValid = false;
      }
      
      if (!this.spuData.productDetail.trim()) {
        this.errors.productDetail = true;
        isValid = false;
      }
      
      if (!this.spuData.category) {
        this.errors.category = true;
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
      
      if (this.spuData.specType === '0') {
        this.spuData.spuAttributes.forEach((attr, index) => {
          if (!attr.attributeCategory.trim()) {
            this.errors[`attributeCategory${index}`] = true;
            isValid = false;
          }
          
          if (!attr.attributeValue.trim()) {
            this.errors[`attributeValue${index}`] = true;
            isValid = false;
          }
        });
      }
      
      if (this.spuData.specType === '1') {
        this.productSkus.forEach((sku, index) => {
          if (!sku.skuDetail.trim()) {
            this.errors[`skuDetail${index}`] = true;
            isValid = false;
          }
          
          if (!sku.salePrice || parseFloat(sku.salePrice) < 0) {
            this.errors[`salePrice${index}`] = true;
            isValid = false;
          }
          
          if (!sku.costPrice || parseFloat(sku.costPrice) < 0) {
            this.errors[`skuCostPrice${index}`] = true;
            isValid = false;
          }
          
          if (!sku.stockQuantity || parseInt(sku.stockQuantity) < 0) {
            this.errors[`stockQuantity${index}`] = true;
            isValid = false;
          }
        });
      }
      
      return isValid;
    },
    
    // 上传所有需要上传的图片（保留的 + 新增的）
    async uploadAllImages(productId) {
      // 获取所有需要上传的图片（保留的图片 + 新图片）
      const imagesToUpload = [
        ...this.imageStatus.existingImages.filter(img => 
          !this.imageStatus.deletedImages.includes(img)
        ),
        ...this.imageStatus.newImages
      ];

      if (imagesToUpload.length === 0) {
        console.log('没有需要上传的图片');
        return [];
      }

      console.log('开始上传所有图片，商品ID:', productId);
      console.log('需要上传的图片数量:', imagesToUpload.length);
      console.log('需要上传的图片:', imagesToUpload);

      try {
        // 使用完整的图片上传参数
        const uploadPromises = imagesToUpload.map(async (imagePath, index) => {
          try {
            console.log(`开始上传第 ${index + 1} 张图片:`, imagePath);
            
            // 完整的图片上传参数
            const uploadResult = await uploadImage(
              imagePath,                    // filePath: 文件临时路径
              5,                            // relatedType: 关联类型，5表示商品
              productId,                    // relatedId: 商品ID
              `商品图片${index + 1}`,       // description: 图片描述
              'product',                    // stage: 阶段标识
              index + 1                     // sequence: 排序序号
            );
            
            console.log(`第 ${index + 1} 张图片上传结果:`, uploadResult);
            
            if (uploadResult.code === 200 && uploadResult.data) {
              // 上传成功，返回图片URL
              return uploadResult.data;
            } else {
              throw new Error(uploadResult.msg || `第 ${index + 1} 张图片上传失败`);
            }
          } catch (error) {
            console.error(`第 ${index + 1} 张图片上传失败:`, error);
            throw error;
          }
        });

        // 等待所有图片上传完成
        const uploadedUrls = await Promise.all(uploadPromises);
        console.log('所有图片上传完成，返回的URL:', uploadedUrls);

        uni.showToast({
          title: `成功上传${imagesToUpload.length}张图片`,
          icon: 'success'
        });

        return uploadedUrls;

      } catch (error) {
        console.error('图片上传失败:', error);
        uni.showToast({
          title: '图片上传失败: ' + (error.message || '请稍后重试'),
          icon: 'none',
          duration: 3000
        });
        return [];
      }
    },

    // 处理图片更新（编辑模式下）
    async handleImageUpdate(productId) {
      try {
        // 上传所有需要上传的图片（保留的 + 新增的）
        const uploadedUrls = await this.uploadAllImages(productId);
        
        // 如果有删除的图片，调用删除接口（如果需要）
        if (this.imageStatus.deletedImages.length > 0) {
          console.log('需要删除的图片:', this.imageStatus.deletedImages);
          // 这里可以调用删除图片的API
          // await productSpuApi.deleteProductImages(productId, this.imageStatus.deletedImages);
        }
        
        console.log('最终上传成功的图片URL:', uploadedUrls);
        return uploadedUrls;
        
      } catch (error) {
        console.error('图片更新处理失败:', error);
        throw error;
      }
    },

    // 提交表单
    async submitForm() {
      if (this.isSubmitting) return;
      
      if (!this.validateForm()) {
        uni.showToast({
          title: '请检查表单中的错误信息',
          icon: 'none'
        });
        return;
      }

      this.isSubmitting = true;

      try {
        // 准备商品数据
        // 编辑模式下，使用原始状态值，不允许通过编辑页面修改状态
        const finalProductStatus = this.isEditMode && this.originalProductStatus !== null 
          ? parseInt(this.originalProductStatus) 
          : parseInt(this.spuData.productStatus);
        
        const formData = {
          productName: this.spuData.productName,
          productDetail: this.spuData.productDetail,
          category: this.spuData.category,
          productStatus: finalProductStatus,
          specType: parseInt(this.spuData.specType),
          marketPrice: parseFloat(this.spuData.marketPrice),
          costPrice: parseFloat(this.spuData.costPrice),
          stock: parseInt(this.spuData.stock),
          spuAttributes: this.spuData.specType === '0' ? this.spuData.spuAttributes.map(attr => ({
            attributeCategory: attr.attributeCategory,
            attributeValue: attr.attributeValue,
            sortOrder: attr.sortOrder
          })) : [],
          productSkus: this.spuData.specType === '1' ? this.productSkus.map(sku => ({
            skuDetail: sku.skuDetail,
            salePrice: parseFloat(sku.salePrice),
            costPrice: parseFloat(sku.costPrice),
            stockQuantity: parseInt(sku.stockQuantity),
            skuStatus: parseInt(sku.skuStatus)
          })) : []
        };

        console.log('提交的商品数据:', JSON.stringify(formData, null, 2));

        let result;
        let finalProductId = this.productId;
        
        if (this.isEditMode && this.productId) {
          // 编辑模式 - 直接使用现有的 productId
          formData.productSpuId = this.productId;
          console.log('编辑商品，ID:', this.productId);
          
          uni.showLoading({ title: '更新商品中...', mask: true });
          result = await productSpuApi.updateProduct(formData);
          uni.hideLoading();
          
          console.log('商品更新API返回:', result);
          
          if (result && result.code === 200) {
            // 更新成功后处理图片（上传保留图片 + 新图片）
            await this.handleImageUpdate(this.productId);
          } else {
            throw new Error(result.msg || '更新商品失败');
          }
          
        } else {
          // 新增模式 - 需要先创建商品获取ID
          console.log('新增商品');
          
          uni.showLoading({ title: '创建商品中...', mask: true });
          const createResult = await productSpuApi.saveProduct(formData);
          uni.hideLoading();

          console.log('商品创建API返回:', createResult);

          if (createResult && createResult.code === 200) {
            finalProductId = createResult.data;
            console.log('获取到商品ID:', finalProductId);
            
            // 创建成功后上传所有图片（新增模式下所有图片都是新图片）
            await this.uploadAllImages(finalProductId);
            
            result = createResult;
          } else {
            throw new Error(createResult.msg || '创建商品失败');
          }
        }
        
        // 提交成功
        this.showSuccessMessage = true;
        uni.showToast({
          title: this.isEditMode ? '商品更新成功' : '商品添加成功',
          icon: 'success'
        });
        
        setTimeout(() => {
          this.showSuccessMessage = false;
          this.isSubmitting = false;
          
          if (this.isEditMode) {
            uni.navigateBack();
          } else {
            this.resetNewSpuForm();
          }
        }, 2000);
        
      } catch (error) {
        console.error('提交失败:', error);
        uni.hideLoading();
        
        let errorMessage = this.isEditMode ? '更新失败，请重试' : '提交失败，请重试';
        if (error.message) {
          if (error.message.includes('405')) {
            errorMessage = '接口方法不允许，请检查后端接口';
          } else if (error.message.includes('404')) {
            errorMessage = '接口不存在，请检查接口路径';
          } else if (error.message.includes('500')) {
            errorMessage = '服务器内部错误，请检查数据格式';
          } else {
            errorMessage = error.message;
          }
        }
        
        uni.showToast({
          title: errorMessage,
          icon: 'none',
          duration: 3000
        });
        this.isSubmitting = false;
      }
    }
  }
}
</script>

<style scoped>
/* 样式部分保持不变 */
.container {
  padding: 24rpx;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4efe9 100%);
  min-height: 100vh;
  position: relative;
  z-index: 1;
}

.page-header {
  text-align: center;
  margin-bottom: 40rpx;
  padding: 40rpx 0;
  position: relative;
  z-index: 1;
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

.success-message {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: white;
  padding: 24rpx 32rpx;
  border-radius: 16rpx;
  margin-bottom: 32rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 4rpx 16rpx rgba(82, 196, 26, 0.3);
  position: relative;
  z-index: 10;
}

.icon-success {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.form-section {
  background: white;
  border-radius: 20rpx;
  margin-bottom: 32rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid #f0f0f0;
  position: relative;
  z-index: 2;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 32rpx;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
  position: relative;
  z-index: 1;
}

.section-icon {
  font-size: 48rpx;
  margin-right: 20rpx;
}

.section-title-content {
  flex: 1;
  position: relative;
  z-index: 1;
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

.full-width-picker {
  width: 100%;
  position: relative;
  z-index: 10;
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
  width: 100%;
  position: relative;
  z-index: 10;
  box-sizing: border-box;
}

.picker-text {
  font-size: 28rpx;
  color: #333;
  flex: 1;
}

.picker-arrow {
  font-size: 24rpx;
  color: #999;
  margin-left: 16rpx;
}

.disabled-picker {
  background-color: #f5f5f5 !important;
  border-color: #d9d9d9 !important;
  opacity: 0.8;
}

.disabled-picker .picker-text {
  color: #666;
}

.picker-tip {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}

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
  z-index: 20;
}

.form-card {
  background: #fafafa;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  border: 1rpx solid #e8e8e8;
  overflow: hidden;
  position: relative;
  z-index: 3;
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

.card-content {
  padding: 32rpx;
  position: relative;
  z-index: 1;
}

.form-group {
  margin-bottom: 32rpx;
  position: relative;
  z-index: 1;
}

.form-label {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 16rpx;
  position: relative;
  z-index: 1;
}

.form-label.required::after {
  content: '*';
  color: #ff4d4f;
  margin-left: 8rpx;
}

::v-deep .uni-easyinput__content {
  border: 2rpx solid #e8e8e8 !important;
  border-radius: 12rpx !important;
  padding: 20rpx 24rpx !important;
  background: white !important;
  transition: all 0.3s !important;
  box-sizing: border-box !important;
  position: relative;
  z-index: 5;
}

::v-deep .uni-easyinput__content:focus-within {
  border-color: #1890ff !important;
  box-shadow: 0 0 0 4rpx rgba(24, 144, 255, 0.1) !important;
  z-index: 6;
}

::v-deep .uni-easyinput__content-input {
  font-size: 28rpx !important;
  color: #333 !important;
}

::v-deep .uni-textarea-textarea {
  font-size: 28rpx !important;
  color: #333 !important;
  min-height: 200rpx !important;
}

.btn-primary {
  background: linear-gradient(135deg, #1890ff, #096dd9);
  color: white;
  border: none;
  border-radius: 12rpx;
  padding: 20rpx 32rpx;
  font-size: 28rpx;
  font-weight: 500;
  transition: all 0.3s;
  position: relative;
  z-index: 5;
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
  z-index: 5;
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
  position: relative;
  z-index: 5;
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
  position: relative;
  z-index: 15;
}

.btn-danger:active {
  background: #d9363e;
}

.add-icon {
  font-size: 32rpx;
  font-weight: bold;
  margin-right: 8rpx;
}

.specs-container {
  margin-bottom: 24rpx;
  position: relative;
  z-index: 1;
}

.spec-item {
  background: white;
  border: 1rpx solid #e8e8e8;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  position: relative;
  z-index: 1;
}

.spec-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
  position: relative;
  z-index: 1;
}

.spec-number {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.add-spec-btn, .add-sku-btn {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12rpx;
  margin-top: 16rpx;
  position: relative;
  z-index: 1;
}

.image-upload-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  position: relative;
  z-index: 1;
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
  position: relative;
  z-index: 1;
}

.image-upload-item:active {
  border-color: #1890ff;
  background: #f0f8ff;
}

.upload-placeholder {
  text-align: center;
  position: relative;
  z-index: 1;
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
  position: relative;
  z-index: 1;
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
  z-index: 10;
}

.image-preview-item:hover .image-overlay {
  opacity: 1;
}

.remove-image-btn {
  background: rgba(255, 255, 255, 0.9);
  color: #ff4d4f;
  border: none;
  font-size: 24rpx;
  z-index: 15;
}

/* 新增图片状态样式 */
.image-status-badge {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  font-size: 20rpx;
  z-index: 20;
}

.status-text {
  font-size: 20rpx;
}

.image-status-summary {
  display: flex;
  justify-content: space-around;
  margin-top: 20rpx;
  padding: 16rpx;
  background: #f8f9fa;
  border-radius: 8rpx;
}

.status-item {
  font-size: 24rpx;
  color: #666;
}

.inline-form-group {
  display: flex;
  gap: 24rpx;
  width: 100%;
  position: relative;
  z-index: 1;
}

.inline-form-group .form-group {
  flex: 1;
  margin-bottom: 0;
  min-width: 0;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  position: relative;
  z-index: 1;
}

.setting-label {
  flex: 1;
  position: relative;
  z-index: 1;
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

.sku-container {
  margin-bottom: 24rpx;
  position: relative;
  z-index: 1;
}

.sku-card {
  background: white;
  border: 1rpx solid #e8e8e8;
  border-radius: 12rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
  position: relative;
  z-index: 1;
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
  position: relative;
  z-index: 1;
}

.sku-number {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.sku-content {
  padding: 32rpx;
  position: relative;
  z-index: 1;
}

.action-bar {
  background: white;
  padding: 32rpx;
  margin: 0 -24rpx -24rpx;
  border-top: 1rpx solid #f0f0f0;
  position: sticky;
  bottom: 0;
  z-index: 100;
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
  position: relative;
  z-index: 5;
}

.submit-btn:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.3);
}

.submit-text {
  color: white;
}

.error-message {
  color: #ff4d4f;
  font-size: 24rpx;
  margin-top: 8rpx;
  position: relative;
  z-index: 1;
}

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
  
  .form-card {
    margin: 16rpx 0;
  }
  
  .card-content {
    padding: 20rpx;
  }
  
  .image-status-summary {
    flex-direction: column;
    gap: 8rpx;
  }
}

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

.full-width-picker {
  width: 100%;
}

.custom-picker:active {
  background-color: #f5f5f5;
}

@media (hover: hover) {
  .custom-picker:hover {
    border-color: #1890ff;
  }
}

.picker, .input, .textarea, .button, .switch {
  position: relative;
  z-index: 5;
}

.form-group {
  isolation: isolate;
}

.spec-item, .sku-card {
  isolation: isolate;
}
</style>