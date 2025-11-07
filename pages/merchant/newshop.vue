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
          <text class="section-title">父产品信息</text>
          <text class="section-desc">商品基础信息配置</text>
        </view>
      </view>
      
      <view class="form-group">
        <label class="form-label">选择已有商品</label>
        <view class="picker-with-add-container">
          <view class="picker-with-add">
            <picker 
              @change="onExistingSpuChange" 
              :value="existingSpuIndex" 
              :range="existingSpuOptions" 
              range-key="name"
              class="full-width-picker"
            >
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
              <picker 
                @change="onProductStatusChange" 
                :value="productStatusIndex" 
                :range="productStatusOptions" 
                range-key="name"
                class="full-width-picker"
              >
                <view class="picker custom-picker">
                  <text class="picker-text">{{ productStatusIndex >= 0 ? productStatusOptions[productStatusIndex].name : '请选择状态' }}</text>
                  <text class="picker-arrow">▼</text>
                </view>
              </picker>
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
              <!-- 添加图片按钮 -->
              <view class="image-upload-item" @tap="chooseImage" v-if="previewMediaFiles.length < 9">
                <view class="upload-placeholder">
                  <text class="upload-icon">+</text>
                  <text class="upload-text">添加图片</text>
                </view>
              </view>
              
              <!-- 图片预览 -->
              <view class="image-preview-item" v-for="(file, index) in previewMediaFiles" :key="file.id">
                <image class="preview-image" :src="file.tempFilePath" mode="aspectFill" />
                <view class="image-actions">
                  <button class="btn-danger btn-sm remove-image-btn" @tap="removePreviewMedia(index)">删除</button>
                </view>
                <view class="media-status" v-if="file.uploadStatus === 'uploading'">
                  <text class="status-text">上传中...</text>
                </view>
                <view class="media-status" v-else-if="file.uploadStatus === 'failed'">
                  <text class="status-text error">上传失败</text>
                </view>
              </view>
            </view>

            <!-- 上传进度 -->
            <view v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
              <text class="progress-text">批量上传中 {{uploadProgress}}%</text>
              <view class="progress-bar">
                <view class="progress-inner" :style="{width: uploadProgress + '%'}"></view>
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
    </view>
    
    <!-- SKU表单部分 - 多规格时显示 -->
    <view class="form-section" v-if="showNewSpuForm && spuData.specType === '1'">
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
    <view class="action-bar" v-if="showNewSpuForm">
      <button class="btn-primary submit-btn" @tap="submitForm" :disabled="isSubmitting">
        <text class="submit-text">
          <text class="loading-spinner" v-if="isSubmitting"></text>
          {{ isSubmitting ? '提交中...' : '提交商品信息' }}
        </text>
      </button>
    </view>
  </view>
</template>

<script>
import productSpuApi from '@/api/productSpu.js';
import { uploadImage } from '@/api/join.js'
import { getUserProfile } from '@/api/users.js'

export default {
  data() {
    return {
      showSuccessMessage: false,
      showNewSpuForm: false,
      existingSpuIndex: -1,
      categoryIndex: -1,
      productStatusIndex: 0,
      isSubmitting: false,
      uploadProgress: 0, // 上传进度
      
      existingSpuOptions: [],
      categoryOptions: ['建材', '家具', '灯具', '厨卫', '软装', '饰品', '家电', '全屋定制', '其他'],
      productStatusOptions: [
        { id: '1', name: '上架' },
        { id: '0', name: '下架' },
        { id: '2', name: '待审核' }
      ],
      skuStatusOptions: [
        { id: '1', name: '上架' },
        { id: '0', name: '下架' }
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
      previewMediaFiles: [], // 预览文件列表（临时路径）
      uploadedMediaFiles: [], // 已上传的媒体文件
      errors: {},
      
      easyInputStyles: {
        color: '#333',
        disableColor: '#eee',
        borderColor: '#e8e8e8'
      }
    }
  },
  
  onLoad() {
    console.log('组件加载，检查API:', productSpuApi);
    this.loadExistingProducts();
  },
  
  methods: {
    // 加载已有商品列表
    async loadExistingProducts() {
      try {
        console.log('开始加载商品列表');
        
        let result;
        try {
          // 使用正确的API方法名
          result = await productSpuApi.getProductList();
        } catch (error) {
          console.log('API调用失败，使用模拟数据');
          // 使用模拟数据
          result = {
            data: [
              { id: 1, productName: '示例商品1', category: '建材' },
              { id: 2, productName: '示例商品2', category: '家具' },
              { id: 3, productName: '示例商品3', category: '灯具' }
            ]
          };
        }
        
        console.log('商品列表API响应:', result);
        
        if (result.data && result.data.length > 0) {
          this.existingSpuOptions = result.data.map(item => ({
            id: item.id,
            name: item.productName
          }));
        } else {
          this.existingSpuOptions = [];
        }
        
        console.log('最终商品选项:', this.existingSpuOptions);
      } catch (error) {
        console.error('加载商品列表失败:', error);
        uni.showToast({
          title: '加载商品列表失败',
          icon: 'none'
        });
        this.existingSpuOptions = [];
      }
    },
    
    // 图片选择（仅预览）
    chooseImage() {
      uni.chooseImage({
        count: 9 - this.previewMediaFiles.length,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          for (let i = 0; i < res.tempFilePaths.length; i++) {
            this.addPreviewMedia({
              type: 'image',
              tempFilePath: res.tempFilePaths[i],
              fileInfo: res.tempFiles[i],
              uploadStatus: 'pending' // 等待上传
            })
          }
        },
        fail: (error) => {
          console.error('选择图片失败:', error)
          uni.showToast({
            title: '选择图片失败',
            icon: 'none'
          })
        }
      })
    },

    // 添加预览媒体文件
    addPreviewMedia(media) {
      if (this.previewMediaFiles.length >= 9) {
        uni.showToast({
          title: '最多只能上传9张图片',
          icon: 'none'
        })
        return
      }

      this.previewMediaFiles.push({
        id: Date.now() + Math.random(),
        type: media.type,
        tempFilePath: media.tempFilePath,
        fileInfo: media.fileInfo,
        uploadStatus: media.uploadStatus || 'pending'
      })
    },

    // 移除预览文件
    removePreviewMedia(index) {
      uni.showModal({
        title: '提示',
        content: '确定要删除这个文件吗？',
        success: (res) => {
          if (res.confirm) {
            this.previewMediaFiles.splice(index, 1)
            uni.showToast({
              title: '删除成功',
              icon: 'success',
              duration: 2000
            })
          }
        }
      })
    },

    // 批量上传媒体文件
    async uploadAllMediaFiles(productId) {
      const pendingMedia = this.previewMediaFiles.filter(media => media.uploadStatus === 'pending')
      
      if (pendingMedia.length === 0) {
        console.log('📝 没有需要上传的图片');
        return this.uploadedMediaFiles
      }
      
      console.log(`📤 开始上传 ${pendingMedia.length} 张图片，商品ID: ${productId}`);
      
      this.uploadProgress = 0
      const totalFiles = pendingMedia.length
      let completedFiles = 0
      let successCount = 0
      
      for (let i = 0; i < pendingMedia.length; i++) {
        const media = pendingMedia[i]
        const index = this.previewMediaFiles.findIndex(m => m.tempFilePath === media.tempFilePath)
        
        if (index !== -1) {
          // 更新状态为上传中
          this.previewMediaFiles[index].uploadStatus = 'uploading'
          
          try {
            console.log(`🔄 上传第 ${i + 1} 张图片...`);
            
            // 使用传入的商品ID进行上传
            const result = await this.uploadSingleMediaFile(
              media.tempFilePath, 
              media.type, 
              media.fileInfo, 
              productId
            )
            
            if (result && result.code === 200) {
              // 上传成功，添加到已上传列表
              const uploadedMedia = {
                type: media.type,
                fileUrl: result.data.fileUrl,
                mediaId: result.data.mediaId,
                fileName: result.data.fileName,
                fileSize: result.data.fileSize,
                uploadStatus: 'completed'
              }
              this.uploadedMediaFiles.push(uploadedMedia)
              
              // 更新预览文件状态
              this.previewMediaFiles[index].uploadStatus = 'completed'
              successCount++
              console.log(`✅ 第 ${i + 1} 张图片上传成功`);
            } else {
              throw new Error(result?.msg || result?.message || '上传失败')
            }
          } catch (error) {
            console.error(`❌ 第 ${i + 1} 张图片上传失败:`, error)
            this.previewMediaFiles[index].uploadStatus = 'failed'
            // 继续上传其他文件，不抛出错误
            continue
          }
          
          // 更新进度
          completedFiles++
          this.uploadProgress = Math.round((completedFiles / totalFiles) * 100)
        }
      }
      
      console.log(`📊 图片上传完成: 成功 ${successCount}/${totalFiles}`);
      return this.uploadedMediaFiles
    },
    
    // 上传单个媒体文件 - relatedType 修改为 5
    async uploadSingleMediaFile(filePath, fileType, fileInfo, productId) {
      try {
        if (fileInfo.size > 50 * 1024 * 1024) {
          throw new Error('文件大小不能超过50MB')
        }
        
        const relatedType = 5; // 修改为 5
        const relatedId = productId ? Number(productId) : 0 // 使用传入的商品ID
        const description = `商品${fileType === 'image' ? '图片' : '视频'}`
        const stage = 'product'
        const sequence = this.uploadedMediaFiles.length + 1
        
        console.log('📤 上传商品文件参数:', {
          filePath,
          relatedType, // 现在为 5
          relatedId,   // 商品ID
          description,
          stage,
          sequence
        })
        
        const response = await uploadImage(
          filePath,
          relatedType, // 修改为 5
          relatedId,
          description,
          stage,
          sequence
        )
        
        console.log('✅ 商品图片上传成功:', response)
        return response
        
      } catch (error) {
        console.error('❌ 商品图片上传失败:', error)
        throw error
      }
    },
    
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
    
    onProductStatusChange(e) {
      this.productStatusIndex = e.detail.value;
      this.spuData.productStatus = this.productStatusOptions[this.productStatusIndex].id;
    },
    
    onSpecTypeChange(e) {
      this.spuData.specType = e.detail.value ? '1' : '0';
      // 重置SKU数据
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
        // 重新排序
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
    
    async loadExistingProduct(productId) {
      try {
        console.log('加载商品详情，API对象:', productSpuApi);
        
        if (!productSpuApi || typeof productSpuApi.getProductDetail !== 'function') {
          throw new Error('API方法不可用');
        }
        
        // 修改：使用正确的API方法名
        const result = await productSpuApi.getProductDetail(productId);
        const product = result.data;
        
        if (product) {
          // 映射数据到表单 - 匹配DTO结构
          this.spuData = {
            productName: product.productName || '',
            productDetail: product.productDetail || '',
            category: product.category || '',
            productStatus: product.productStatus?.toString() || '0',
            specType: product.specType?.toString() || '0',
            marketPrice: product.marketPrice?.toString() || '',
            costPrice: product.costPrice?.toString() || '',
            stock: product.stock?.toString() || '',
            spuAttributes: product.spuAttributes || [{
              attributeCategory: '',
              attributeValue: '',
              sortOrder: 0
            }]
          };
          
          // 重置预览文件列表
          this.previewMediaFiles = [];
          this.uploadedMediaFiles = [];
          
          // 如果有已上传的图片，添加到预览列表
          // 注意：这里需要根据你的实际图片接口来加载
          if (product.coverImages && product.coverImages.length > 0) {
            product.coverImages.forEach((media, index) => {
              if (media.fileUrl) {
                this.previewMediaFiles.push({
                  id: `existing_${index}`,
                  type: 'image',
                  tempFilePath: media.fileUrl,
                  fileInfo: { size: 0 },
                  uploadStatus: 'completed'
                });
              }
            });
          }
          
          // 设置分类选择器
          this.categoryIndex = this.categoryOptions.indexOf(product.category);
          
          // 设置状态选择器
          const statusIndex = this.productStatusOptions.findIndex(item => 
            item.id === product.productStatus?.toString()
          );
          if (statusIndex >= 0) {
            this.productStatusIndex = statusIndex;
          }
          
          // 加载SKU数据
          if (product.productSkus && product.productSkus.length > 0) {
            this.productSkus = product.productSkus.map(sku => ({
              skuDetail: sku.skuDetail || '',
              salePrice: sku.salePrice?.toString() || '',
              costPrice: sku.costPrice?.toString() || '',
              stockQuantity: sku.stockQuantity?.toString() || '',
              skuStatus: sku.skuStatus?.toString() || '0'
            }));
          }
        }
      } catch (error) {
        console.error('加载商品详情失败:', error);
        uni.showToast({
          title: '加载商品详情失败',
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
      
      this.previewMediaFiles = [];
      this.uploadedMediaFiles = [];
      this.errors = {};
      this.categoryIndex = -1;
      this.productStatusIndex = 0;
      this.existingSpuIndex = -1;
      this.uploadProgress = 0;
    },
    
    validateForm() {
      this.errors = {};
      let isValid = true;
      
      // SPU 基础验证
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
      
      // SPU 属性验证
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
      
      // SKU 验证
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
        // 第一步：创建商品（不包含图片）
        const productData = {
          productName: this.spuData.productName,
          productDetail: this.spuData.productDetail,
          category: this.spuData.category,
          productStatus: parseInt(this.spuData.productStatus), // 转换为数字
          specType: parseInt(this.spuData.specType), // 转换为数字
          marketPrice: parseFloat(this.spuData.marketPrice), // 转换为数字
          costPrice: parseFloat(this.spuData.costPrice), // 转换为数字
          stock: parseInt(this.spuData.stock), // 转换为数字
          spuAttributes: this.spuData.specType === '0' ? this.spuData.spuAttributes.map(attr => ({
            attributeCategory: attr.attributeCategory,
            attributeValue: attr.attributeValue,
            sortOrder: parseInt(attr.sortOrder) // 转换为数字
          })) : [],
          productSkus: this.spuData.specType === '1' ? this.productSkus.map(sku => ({
            skuDetail: sku.skuDetail,
            salePrice: parseFloat(sku.salePrice), // 转换为数字
            costPrice: parseFloat(sku.costPrice), // 转换为数字
            stockQuantity: parseInt(sku.stockQuantity), // 转换为数字
            skuStatus: parseInt(sku.skuStatus) // 转换为数字
          })) : []
        };

        console.log('📦 提交商品数据:', JSON.stringify(productData, null, 2));

        // 创建商品
        uni.showLoading({ title: '创建商品中...', mask: true });
        
        // 修改：使用正确的API方法名
        const createResult = await productSpuApi.saveProduct(productData);
        
        uni.hideLoading();

        console.log('🔍 商品创建API返回:', createResult);

        // 根据API返回结构获取商品ID
        let productId = null;
        
        if (createResult && createResult.code === 200) {
          // data字段就是商品ID的字符串
          productId = createResult.data;
          console.log('✅ 从 createResult.data 获取到商品ID:', productId);
        } else {
          console.error('❌ API返回失败:', createResult);
          throw new Error(createResult.message || '创建商品失败');
        }

        if (!productId) {
          console.error('❌ 无法获取商品ID，完整返回结构:', createResult);
          throw new Error('创建商品失败，未返回商品ID');
        }

        console.log('🎯 最终获取的商品ID:', productId);

        // 第二步：如果有图片，使用单独的图片上传接口（relatedType=5）
        if (this.previewMediaFiles.length > 0 && productId) {
          uni.showLoading({ title: '上传商品图片中...', mask: true });
          
          // 上传图片到专门的图片接口
          const uploadedFiles = await this.uploadAllMediaFiles(productId);
          
          if (uploadedFiles.length > 0) {
            console.log('✅ 商品图片上传成功，数量:', uploadedFiles.length);
            uni.showToast({
              title: `商品创建成功，${uploadedFiles.length}张图片已上传`,
              icon: 'success',
              duration: 3000
            });
          } else {
            console.log('⚠️ 商品图片上传失败');
            uni.showToast({
              title: '商品创建成功，但图片上传失败',
              icon: 'none',
              duration: 3000
            });
          }
          
          uni.hideLoading();
        } else {
          // 没有图片的情况
          uni.showToast({
            title: '商品创建成功',
            icon: 'success',
            duration: 2000
          });
        }

        // 提交成功
        this.showSuccessMessage = true;

        setTimeout(() => {
          this.showSuccessMessage = false;
          this.resetNewSpuForm();
          this.showNewSpuForm = false;
          this.isSubmitting = false;
          this.loadExistingProducts();
        }, 3000);

      } catch (error) {
        uni.hideLoading();
        console.error('❌ 提交失败:', error);
        
        let errorMessage = '提交失败，请重试';
        if (error.message && error.message.includes('未返回商品ID')) {
          errorMessage = '商品创建成功但未返回商品ID，请联系管理员';
        } else if (error.message && error.message.includes('405')) {
          errorMessage = '接口方法不允许，请检查后端接口';
        } else if (error.message && error.message.includes('404')) {
          errorMessage = '接口不存在，请检查接口路径';
        } else if (error.message && error.message.includes('500')) {
          errorMessage = '服务器内部错误，请检查数据格式';
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
/* 样式保持不变，与之前相同 */
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

.picker-with-add-container {
  width: 100%;
  position: relative;
  z-index: 5;
}

.picker-with-add {
  display: flex;
  align-items: center;
  gap: 16rpx;
  width: 100%;
  position: relative;
  z-index: 5;
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
  position: relative;
  z-index: 10;
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
  z-index: 20;
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

.image-actions {
  position: absolute;
  bottom: 8rpx;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 8rpx;
  padding: 0 8rpx;
}

.remove-image-btn {
  background: rgba(255, 255, 255, 0.9);
  color: #ff4d4f;
  border: none;
  font-size: 24rpx;
  z-index: 15;
}

/* 新增状态样式 */
.media-status {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-text {
  color: white;
  font-size: 24rpx;
  text-align: center;
}

.status-text.error {
  color: #ff4d4f;
}

.upload-progress {
  margin-top: 15px;
  width: 100%;
}

.progress-text {
  font-size: 28rpx;
  color: #1890ff;
  text-align: center;
  display: block;
  margin-bottom: 10rpx;
}

.progress-bar {
  width: 100%;
  height: 8rpx;
  background-color: #e0e0e0;
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-inner {
  height: 100%;
  background-color: #1890ff;
  border-radius: 4rpx;
  transition: width 0.3s ease;
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
  
  .picker-with-add-container {
    width: 100%;
  }
  
  .form-card {
    margin: 16rpx 0;
  }
  
  .card-content {
    padding: 20rpx;
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