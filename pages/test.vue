<template>
  <view class="container">
    <view class="header">
      <text class="title">商品上传</text>
      <text class="subtitle">请按照步骤填写商品信息，确保信息准确完整</text>
    </view>
    
    <view class="upload-container">
      <!-- 步骤指示器 -->
      <view class="steps">
        <view 
          class="step" 
          :class="{ active: currentStep === 1 }"
        >
          <text class="step-number">1</text>
          <text class="step-text">选择类别</text>
        </view>
        <view 
          class="step" 
          :class="{ active: currentStep === 2 }"
        >
          <text class="step-number">2</text>
          <text class="step-text">基本信息</text>
        </view>
        <view 
          class="step" 
          :class="{ active: currentStep === 3 }"
        >
          <text class="step-number">3</text>
          <text class="step-text">规格库存</text>
        </view>
      </view>
      
      <!-- 步骤内容 -->
      <scroll-view class="step-content" scroll-y>
        <!-- 步骤1: 选择类别 -->
        <view v-if="currentStep === 1" class="step-panel">
          <view class="form-group">
            <text class="form-label">商品分类</text>
            <view class="category-selector">
              <view class="picker-group">
                <text class="picker-label">一级分类</text>
                <picker 
                  @change="onCategory1Change" 
                  :value="category1Index" 
                  :range="category1Options"
                  range-key="name"
                  class="picker"
                >
                  <view class="picker-text">
                    {{ category1Options[category1Index] ? category1Options[category1Index].name : '请选择一级分类' }}
                  </view>
                </picker>
              </view>
              <view class="picker-group">
                <text class="picker-label">二级分类</text>
                <picker 
                  @change="onCategory2Change" 
                  :value="category2Index" 
                  :range="category2Options"
                  range-key="name"
                  :disabled="!category1Options[category1Index]"
                  class="picker"
                >
                  <view class="picker-text" :class="{ disabled: !category1Options[category1Index] }">
                    {{ category2Options[category2Index] ? category2Options[category2Index].name : '请选择二级分类' }}
                  </view>
                </picker>
              </view>
              <view class="picker-group">
                <text class="picker-label">三级分类</text>
                <picker 
                  @change="onCategory3Change" 
                  :value="category3Index" 
                  :range="category3Options"
                  range-key="name"
                  :disabled="!category2Options[category2Index]"
                  class="picker"
                >
                  <view class="picker-text" :class="{ disabled: !category2Options[category2Index] }">
                    {{ category3Options[category3Index] ? category3Options[category3Index].name : '请选择三级分类' }}
                  </view>
                </picker>
              </view>
            </view>
            
            <!-- 分类选择状态显示 -->
            <view class="category-status" v-if="selectedCategory3Id">
              <text class="status-text">已选择分类：</text>
              <text class="category-path">{{ productData.category }}</text>
            </view>
          </view>
          
          <view class="action-buttons">
            <view></view>
            <button class="btn btn-primary" @tap="goToStep(2)" :disabled="!selectedCategory3Id">
              {{ selectedCategory3Id ? '下一步' : '请先选择完整分类' }}
            </button>
          </view>
        </view>
        
        <!-- 步骤2: 基本信息 -->
        <view v-if="currentStep === 2" class="step-panel">
          <view class="form-group">
            <text class="form-label">商品轮播图</text>
            <view class="upload-area" @tap="chooseImages">
              <text class="upload-icon">📷</text>
              <text class="upload-text">点击上传图片</text>
              <text class="upload-tip">建议尺寸：800x800像素，最多10张</text>
            </view>
            <view class="image-preview">
              <view 
                v-for="(image, index) in productImages" 
                :key="index" 
                class="preview-item"
              >
                <image :src="image" class="preview-image" mode="aspectFill"></image>
                <view class="remove" @tap="removeImage(index)">×</view>
              </view>
            </view>
          </view>
          
          <view class="form-group">
            <text class="form-label">商品标题</text>
            <uni-easyinput
              v-model="productData.productName"
              placeholder="请输入商品标题"
              :styles="inputStyles"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">商品描述</text>
            <view class="description-container">
              <uni-easyinput
                v-model="productData.productDetail"
                type="textarea"
                placeholder="请输入商品的详细描述，包括产品特点、材质、用途等信息"
                :styles="textareaStyles"
              />
            </view>
          </view>
          
          <view class="action-buttons">
            <button class="btn btn-secondary" @tap="goToStep(1)">上一步</button>
            <button class="btn btn-primary" @tap="goToStep(3)">下一步</button>
          </view>
        </view>
        
        <!-- 步骤3: 规格与库存 -->
        <view v-if="currentStep === 3" class="step-panel">
          <view class="form-group">
            <text class="form-label">商品规格</text>
            <view class="specifications-container">
              <view 
                v-for="(spec, index) in specifications" 
                :key="spec.id" 
                class="specification-container"
              >
                <view class="spec-header">
                  <view class="spec-name-input">
                    <uni-easyinput
                      v-model="spec.name"
                      placeholder="请输入规格名称，如：颜色、尺寸等"
                      :styles="specNameInputStyles"
                      :clearable="true"
                      @blur="updateSpecName(spec.id, spec.name)"
                    />
                  </view>
                  <text class="delete-spec" @tap="removeSpecification(spec.id)">删除</text>
                </view>
                <view class="spec-body">
                  <view class="spec-values">
                    <view 
                      v-for="value in spec.values" 
                      :key="value" 
                      class="spec-value-item"
                    >
                      <text>{{ value }}</text>
                      <text class="remove-value" @tap="removeSpecValue(spec.id, value)">×</text>
                    </view>
                  </view>
                  <view class="add-value-input">
                    <uni-easyinput
                      v-model="spec.newValue"
                      placeholder="输入规格值"
                      :styles="inputStyles"
                      :clearable="true"
                      @confirm="addSpecValue(spec.id)"
                    />
                    <button class="btn btn-mini add-btn" @tap="addSpecValue(spec.id)">添加</button>
                  </view>
                </view>
              </view>
            </view>
            
            <view class="add-spec-btn" @tap="addSpecification" v-if="specifications.length < 2">
              <text class="add-icon">+</text>
              <text>添加规格类型</text>
              <text class="spec-count">({{ specifications.length }}/2)</text>
            </view>
          </view>
          
          <view class="form-group">
            <text class="form-label">价格及库存</text>
            <text class="warning-text">请如实填写库存信息，以确保商品可以在承诺发货时间内发出，避免物流违规</text>
            
            <!-- 价格库存表格 -->
            <view class="price-stock-container">
              <view class="table">
                <view class="table-header">
                  <view class="table-row">
                    <view 
                      v-for="spec in specifications" 
                      :key="spec.id" 
                      class="table-header-cell"
                    >
                      {{ spec.name || '规格' }}
                    </view>
                    <view class="table-header-cell required-field">库存</view>
                    <view class="table-header-cell required-field">单价(元)</view>
                    <view class="table-header-cell">状态</view>
                  </view>
                </view>
                
                <view class="table-body">
                  <view 
                    v-for="(item, index) in priceStockData" 
                    :key="index" 
                    class="table-row"
                  >
                    <view 
                      v-for="(value, valueIndex) in item.values" 
                      :key="valueIndex" 
                      class="table-cell"
                    >
                      {{ value }}
                    </view>
                    <view class="table-cell">
                      <uni-easyinput
                        v-model="item.stock"
                        placeholder="库存"
                        type="number"
                        :styles="tableInputStyles"
                        :clearable="false"
                      />
                    </view>
                    <view class="table-cell">
                      <uni-easyinput
                        v-model="item.singlePrice"
                        placeholder="价格"
                        type="number"
                        :styles="tableInputStyles"
                        :clearable="false"
                      />
                    </view>
                    <view class="table-cell">
                      <text 
                        class="status-badge" 
                        :class="{ 'status-off': item.status === 'off' }"
                        @tap="toggleStatus(index)"
                      >
                        {{ item.status === 'on' ? '上架' : '下架' }}
                      </text>
                    </view>
                  </view>
                </view>
              </view>
              
              <!-- 批量设置 -->
              <view class="batch-setting" v-if="specifications.length > 0">
                <text class="batch-label">批量设置：</text>
                <view class="batch-inputs">
                  <uni-easyinput
                    v-model="batchStock"
                    placeholder="库存"
                    type="number"
                    :styles="batchInputStyles"
                    :clearable="false"
                  />
                  <uni-easyinput
                    v-model="batchSinglePrice"
                    placeholder="价格"
                    type="number"
                    :styles="batchInputStyles"
                    :clearable="false"
                  />
                  <button class="btn btn-mini batch-btn" @tap="batchSetValues">应用</button>
                </view>
              </view>
            </view>
          </view>
          
          <view class="price-section">
            <view class="price-header">
              <text class="price-title">商品参考价</text>
              <text class="price-tip">应大于商品最大单买价</text>
            </view>
            <view class="reference-price">
              <uni-easyinput
                v-model="referencePrice"
                placeholder="0.00"
                type="number"
                :styles="priceInputStyles"
                :clearable="false"
              />
              <text class="price-unit">元</text>
            </view>
          </view>
          
          <view class="action-buttons">
            <button class="btn btn-secondary" @tap="goToStep(2)">上一步</button>
            <button class="btn btn-success" :disabled="loading" @tap="submitProduct">
              {{ loading ? '提交中...' : '提交商品' }}
            </button>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
import { getCategoryTree, createProduct } from '@/api/product.js'

export default {
  data() {
    return {
      currentStep: 1,
      
      // 分类数据
      category1Index: 0,
      category2Index: 0,
      category3Index: 0,
      category1Options: [],
      category2Options: [],
      category3Options: [],
      
      // 存储选中的分类ID
      selectedCategory1Id: null,
      selectedCategory2Id: null,
      selectedCategory3Id: null,
      
      // 商品图片
      productImages: [],
      
      // 商品数据 - 匹配后端 ProductSpuDTO
      productData: {
        productName: '',
        productDetail: '',
        categoryId: null, // 三级分类ID
        productStatus: 0, // 0-下架，1-上架
        specType: 0, // 0-单规格，2-多规格
        marketPrice: 0,
        costPrice: 0,
        stock: 100
      },
      
      // 规格数据
      specifications: [],
      specCounter: 1,
      
      // 价格库存数据
      priceStockData: [],
      
      // 批量设置
      batchStock: '',
      batchSinglePrice: '',
      
      // 参考价
      referencePrice: '',
      
      // 加载状态
      loading: false,
      
      // uni-easyinput 样式配置
      inputStyles: {
        borderColor: '#e0e0e0',
        color: '#333',
        backgroundColor: '#fff'
      },
      textareaStyles: {
        borderColor: '#e0e0e0',
        color: '#333',
        backgroundColor: '#fff',
        minHeight: '200rpx'
      }
    }
  },
  
  methods: {
    // 步骤切换
    goToStep(step) {
      if (step === 2 && !this.selectedCategory3Id) {
        uni.showToast({
          title: '请先选择完整的三级分类',
          icon: 'none'
        })
        return
      }
      this.currentStep = step
      if (step === 3) {
        this.generatePriceStockTable()
      }
    },
    
    // 分类选择方法
    onCategory1Change(e) {
      const index = parseInt(e.detail.value)
      this.category1Index = index
      const selectedCategory = this.category1Options[index]
      
      if (selectedCategory) {
        this.selectedCategory1Id = selectedCategory.id
        // 根据一级分类查找二级分类
        this.category2Options = this.getCategoriesByParentId(this.selectedCategory1Id)
        this.category2Index = 0
        this.category3Options = []
        this.category3Index = 0
        this.selectedCategory2Id = null
        this.selectedCategory3Id = null
        
        this.updateCategoryData()
      }
    },
    
    onCategory2Change(e) {
      const index = parseInt(e.detail.value)
      this.category2Index = index
      const selectedCategory = this.category2Options[index]
      
      if (selectedCategory) {
        this.selectedCategory2Id = selectedCategory.id
        // 根据二级分类查找三级分类
        this.category3Options = this.getCategoriesByParentId(this.selectedCategory2Id)
        this.category3Index = 0
        this.selectedCategory3Id = null
        
        this.updateCategoryData()
      }
    },
    
    onCategory3Change(e) {
      const index = parseInt(e.detail.value)
      this.category3Index = index
      const selectedCategory = this.category3Options[index]
      
      if (selectedCategory) {
        this.selectedCategory3Id = selectedCategory.id
        this.productData.categoryId = this.selectedCategory3Id
        this.updateCategoryData()
        
        uni.showToast({
          title: '分类选择完成',
          icon: 'success',
          duration: 1500
        })
      }
    },
    
    // 根据父级ID获取分类
    getCategoriesByParentId(parentId) {
      if (!this.categoryTree || !Array.isArray(this.categoryTree)) {
        return []
      }
      return this.categoryTree.filter(category => category.parentId === parentId)
    },
    
    // 更新分类数据
    updateCategoryData() {
      const category1 = this.category1Options[this.category1Index]
      const category2 = this.category2Options[this.category2Index]
      const category3 = this.category3Options[this.category3Index]
      
      let categoryPath = ''
      if (category1) categoryPath += category1.name
      if (category2) categoryPath += ' / ' + category2.name
      if (category3) categoryPath += ' / ' + category3.name
      
      this.productData.category = categoryPath
    },
    
    // 加载分类数据
    async loadCategoryTree() {
      try {
        uni.showLoading({
          title: '加载分类中...',
          mask: true
        })
        
        const response = await getCategoryTree()
        
        if (response.code === 200 || response.success) {
          this.categoryTree = response.data || []
          
          // 设置一级分类 (parentId=0)
          this.category1Options = this.getCategoriesByParentId(0)
          
          console.log('分类数据加载成功:', {
            '总分类数量': this.categoryTree.length,
            '一级分类数量': this.category1Options.length
          })
          
        } else {
          throw new Error(response.message || '加载分类失败')
        }
        
      } catch (error) {
        console.error('加载分类数据失败:', error)
        uni.showToast({
          title: '分类加载失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },
    
    // 图片上传
    async chooseImages() {
      if (this.productImages.length >= 10) {
        uni.showToast({
          title: '最多只能上传10张图片',
          icon: 'none'
        })
        return
      }
      
      try {
        const res = await uni.chooseImage({
          count: 10 - this.productImages.length,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera']
        })
        
        this.productImages = this.productImages.concat(res.tempFilePaths)
        
        uni.showToast({
          title: '图片添加成功',
          icon: 'success'
        })
        
      } catch (error) {
        console.error('图片选择失败:', error)
        uni.showToast({
          title: '图片选择失败',
          icon: 'none'
        })
      }
    },
    
    removeImage(index) {
      this.productImages.splice(index, 1)
    },
    
    // 规格管理
    addSpecification() {
      if (this.specifications.length >= 2) {
        uni.showToast({
          title: '最多只能添加2个规格类型',
          icon: 'none'
        })
        return
      }
      
      const spec = {
        id: 'spec_' + Date.now(),
        name: '',
        values: [],
        newValue: ''
      }
      
      this.specifications.push(spec)
      this.specCounter++
      this.generatePriceStockTable()
      
      // 更新规格类型
      this.productData.specType = this.specifications.length > 0 ? 2 : 0
    },
    
    removeSpecification(specId) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个规格类型吗？',
        success: (res) => {
          if (res.confirm) {
            this.specifications = this.specifications.filter(spec => spec.id !== specId)
            this.generatePriceStockTable()
            this.productData.specType = this.specifications.length > 0 ? 2 : 0
          }
        }
      })
    },
    
    addSpecValue(specId) {
      const spec = this.specifications.find(s => s.id === specId)
      if (spec && spec.newValue && spec.newValue.trim()) {
        const value = spec.newValue.trim()
        if (!spec.values.includes(value)) {
          spec.values.push(value)
          spec.newValue = ''
          this.generatePriceStockTable()
        } else {
          uni.showToast({
            title: '规格值已存在',
            icon: 'none'
          })
        }
      }
    },
    
    removeSpecValue(specId, value) {
      const spec = this.specifications.find(s => s.id === specId)
      if (spec) {
        spec.values = spec.values.filter(v => v !== value)
        this.generatePriceStockTable()
      }
    },
    
    // 价格库存管理
    generatePriceStockTable() {
      if (this.specifications.length === 0) {
        this.priceStockData = [{
          values: [],
          stock: '',
          singlePrice: '',
          status: 'on'
        }]
        return
      }
      
      const combinations = this.generateCombinations()
      combinations.forEach((combination, index) => {
        const existingData = this.priceStockData[index]
        if (existingData) {
          combination.stock = existingData.stock || ''
          combination.singlePrice = existingData.singlePrice || ''
          combination.status = existingData.status || 'on'
        }
      })
      this.priceStockData = combinations
    },
    
    generateCombinations() {
      if (this.specifications.length === 0) return []
      
      const generate = (specIndex, currentCombination) => {
        if (specIndex >= this.specifications.length) {
          return [{
            ...currentCombination,
            status: 'on'
          }]
        }
        
        const spec = this.specifications[specIndex]
        let combinations = []
        
        for (const value of spec.values) {
          const newCombination = {
            ...currentCombination,
            values: (currentCombination.values || []).concat([value])
          }
          combinations = combinations.concat(generate(specIndex + 1, newCombination))
        }
        
        return combinations
      }
      
      return generate(0, { values: [] })
    },
    
    toggleStatus(index) {
      if (this.priceStockData[index]) {
        this.priceStockData[index].status = 
          this.priceStockData[index].status === 'on' ? 'off' : 'on'
      }
    },
    
    batchSetValues() {
      if (!this.batchStock && !this.batchSinglePrice) {
        uni.showToast({
          title: '请填写要批量设置的值',
          icon: 'none'
        })
        return
      }
      
      this.priceStockData.forEach((item) => {
        if (this.batchStock) {
          item.stock = this.batchStock
        }
        if (this.batchSinglePrice) {
          item.singlePrice = this.batchSinglePrice
        }
      })
      
      uni.showToast({
        title: '批量设置成功',
        icon: 'success'
      })
      this.batchStock = ''
      this.batchSinglePrice = ''
    },
    
    // 构建SKU列表 - 匹配后端 ProductSkuDTO
    buildSkuList() {
      if (this.specifications.length === 0) {
        // 单规格商品
        return [{
          stockQuantity: parseInt(this.priceStockData[0].stock) || 0,
          salePrice: parseFloat(this.priceStockData[0].singlePrice) || 0,
          costPrice: this.productData.costPrice || 0,
          skuStatus: this.priceStockData[0].status === 'on' ? 1 : 0, // 1-上架，0-下架
          skuDetail: JSON.stringify({
            type: 'single',
            productName: this.productData.productName
          })
        }]
      } else {
        // 多规格商品
        return this.priceStockData.map(item => {
          const specValues = item.values || []
          const specCombination = this.specifications.map((spec, index) => ({
            name: spec.name,
            value: specValues[index] || ''
          }))
          
          const specDescription = specCombination.map(spec => `${spec.name}:${spec.value}`).join(' ')
          
          return {
            stockQuantity: parseInt(item.stock) || 0,
            salePrice: parseFloat(item.singlePrice) || 0,
            costPrice: this.productData.costPrice || 0,
            skuStatus: item.status === 'on' ? 1 : 0, // 1-上架，0-下架
            skuDetail: JSON.stringify({
              type: 'multi',
              combination: specCombination,
              description: specDescription
            })
          }
        })
      }
    },
    
    // 验证表单
    validateForm() {
      if (!this.productData.productName || this.productData.productName.trim() === '') {
        throw new Error('请输入商品标题')
      }
      
      if (!this.selectedCategory3Id) {
        throw new Error('请选择完整的三级分类')
      }
      
      if (this.productImages.length === 0) {
        throw new Error('请上传商品图片')
      }
      
      // 验证规格
      for (let i = 0; i < this.specifications.length; i++) {
        const spec = this.specifications[i]
        if (!spec.name || spec.name.trim() === '') {
          throw new Error('请填写规格名称')
        }
        
        if (spec.values.length === 0) {
          throw new Error('请为' + spec.name + '添加规格值')
        }
      }
      
      // 验证价格库存
      for (let i = 0; i < this.priceStockData.length; i++) {
        const item = this.priceStockData[i]
        if (!item.stock || parseInt(item.stock) <= 0) {
          throw new Error('请填写有效的库存数量')
        }
        
        if (!item.singlePrice || parseFloat(item.singlePrice) <= 0) {
          throw new Error('请填写有效的价格')
        }
      }
    },
    
    // 提交商品 - 匹配后端 ProductSpuDTO 结构
    async submitProduct() {
      if (this.loading) return
      
      try {
        this.validateForm()
        
        this.loading = true
        uni.showLoading({
          title: '提交中...',
          mask: true
        })
        
        // 构建商品数据 - 匹配后端 ProductSpuDTO
        const submitData = {
          productName: this.productData.productName,
          productDetail: this.productData.productDetail,
          categoryId: this.selectedCategory3Id,
          productStatus: 0, // 默认下架，创建后手动上架
          specType: this.productData.specType,
          marketPrice: parseFloat(this.referencePrice) || 0,
          costPrice: this.productData.costPrice || 0,
          stock: this.productData.stock || 100,
          skuList: this.buildSkuList()
        }
        
        console.log('提交的商品数据:', JSON.stringify(submitData, null, 2))
        
        const response = await createProduct(submitData)
        
        console.log('创建商品响应:', response)
        
        if (response.code === 200 || response.success) {
          const productSpuId = response.data || response.data?.productSpuId
          
          console.log('创建商品成功，商品ID:', productSpuId)
          
          // 上传商品图片
          if (this.productImages.length > 0 && productSpuId) {
            await this.uploadProductImages(productSpuId)
          }
          
          uni.hideLoading()
          uni.showToast({
            title: '商品创建成功！',
            icon: 'success',
            duration: 2000
          })
          
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
          
        } else {
          throw new Error(response.message || response.msg || '创建商品失败')
        }
        
      } catch (error) {
        uni.hideLoading()
        console.error('提交商品失败:', error)
        uni.showToast({
          title: error.message || '提交失败，请重试',
          icon: 'none',
          duration: 3000
        })
      } finally {
        this.loading = false
      }
    },
    
    // 上传商品图片
    async uploadProductImages(productSpuId) {
      try {
        uni.showLoading({
          title: '上传图片中...',
          mask: true
        })
        
        const uploadPromises = this.productImages.map(async (imagePath, index) => {
          try {
            const uploadResult = await uni.uploadFile({
              url: `${this.$baseURL || 'http://localhost:8081'}/api/media/upload`,
              filePath: imagePath,
              name: 'file',
              formData: {
                relatedType: '5', // 商品类型
                relatedId: productSpuId.toString(),
                description: '商品主图',
                stage: 'MAIN',
                sequence: index.toString()
              },
              header: {
                'Authorization': 'Bearer ' + (uni.getStorageSync('token') || '')
              }
            })
            
            const result = typeof uploadResult.data === 'string' ? JSON.parse(uploadResult.data) : uploadResult.data
            return result
          } catch (error) {
            console.error(`第${index + 1}张图片上传失败:`, error)
            return null
          }
        })
        
        const results = await Promise.all(uploadPromises)
        const successResults = results.filter(result => result && (result.code === 200 || result.success))
        
        console.log('图片上传完成:', {
          总数量: results.length,
          成功数量: successResults.length
        })
        
      } catch (error) {
        console.error('图片上传过程出错:', error)
      } finally {
        uni.hideLoading()
      }
    }
  },
  
  async onLoad() {
    await this.loadCategoryTree()
  },
  
  watch: {
    priceStockData: {
      handler(newVal) {
        if (newVal && newVal.length > 0) {
          const prices = newVal
            .map(item => parseFloat(item.singlePrice) || 0)
            .filter(price => price > 0)
          
          if (prices.length > 0) {
            this.productData.marketPrice = Math.max.apply(null, prices)
            this.productData.costPrice = Math.min.apply(null, prices)
            this.referencePrice = (this.productData.marketPrice * 1.2).toFixed(2)
          }
        }
      },
      deep: true
    }
  }
}
</script>
<style scoped>
/* 样式保持不变 */
.container {
  background-color: #f8f9fa;
  min-height: 100vh;
}

.header {
  background: white;
  padding: 30rpx 24rpx 20rpx;
  border-bottom: 1rpx solid #eee;
}

.title {
  font-size: 36rpx;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
  font-weight: 600;
}

.subtitle {
  color: #999;
  font-size: 26rpx;
  display: block;
}

.upload-container {
  background: white;
  min-height: calc(100vh - 160rpx);
}

.steps {
  display: flex;
  background: white;
  padding: 0 24rpx;
  border-bottom: 1rpx solid #eee;
}

.step {
  flex: 1;
  padding: 24rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  color: #999;
}

.step.active {
  color: #007AFF;
}

.step.active .step-number {
  background: #007AFF;
  color: white;
}

.step-number {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  margin-bottom: 8rpx;
}

.step-text {
  font-size: 24rpx;
}

.step-content {
  height: calc(100vh - 280rpx);
  padding: 0 24rpx;
}

.step-panel {
  padding: 30rpx 0;
}

.form-group {
  margin-bottom: 40rpx;
}

.form-label {
  display: block;
  margin-bottom: 20rpx;
  font-weight: 500;
  color: #333;
  font-size: 30rpx;
}

.category-selector {
  gap: 24rpx;
}

.picker-group {
  margin-bottom: 24rpx;
}

.picker-label {
  display: block;
  margin-bottom: 12rpx;
  color: #666;
  font-size: 28rpx;
}

.picker-text {
  padding: 24rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  font-size: 28rpx;
  background: white;
}

.picker-text.disabled {
  background-color: #f8f9fa;
  color: #c0c4cc;
}

/* 新增分类状态显示样式 */
.category-status {
  margin-top: 20rpx;
  padding: 20rpx;
  background-color: #f8f9fa;
  border-radius: 12rpx;
  border: 1rpx solid #e0e0e0;
}

.status-text {
  color: #666;
  font-size: 26rpx;
}

.category-path {
  color: #007AFF;
  font-size: 28rpx;
  font-weight: 500;
  margin-left: 12rpx;
}

.upload-area {
  border: 2rpx dashed #e0e0e0;
  border-radius: 16rpx;
  padding: 60rpx 30rpx;
  text-align: center;
  background-color: #fafafa;
}

.upload-icon {
  font-size: 64rpx;
  color: #999;
  display: block;
  margin-bottom: 20rpx;
}

.upload-text {
  color: #666;
  display: block;
  margin-bottom: 12rpx;
  font-size: 30rpx;
}

.upload-tip {
  font-size: 24rpx;
  color: #999;
  display: block;
}

.image-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-top: 24rpx;
}

.preview-item {
  position: relative;
  width: 140rpx;
  height: 140rpx;
  border-radius: 12rpx;
  overflow: hidden;
  border: 1rpx solid #e0e0e0;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.remove {
  position: absolute;
  top: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  width: 40rpx;
  height: 40rpx;
  border-radius: 0 0 0 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
}

.specification-container {
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
}

.spec-header {
  padding: 24rpx;
  background-color: #f8f9fa;
  border-bottom: 1rpx solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
}

.spec-name-input {
  flex: 1;
}

.delete-spec {
  color: #ff4757;
  font-size: 26rpx;
  white-space: nowrap;
}

.spec-body {
  padding: 24rpx;
}

.spec-values {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.spec-value-item {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  padding: 16rpx 20rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
  border: 1rpx solid #e0e0e0;
}

.remove-value {
  color: #ff4757;
  margin-left: 12rpx;
  font-size: 24rpx;
  font-weight: bold;
}

.add-value-input {
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
}

.add-value-input .uni-easyinput {
  flex: 1;
}

.add-btn {
  width: 120rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.btn {
  padding: 20rpx 32rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  border: none;
}

.btn:disabled {
  background-color: #c0c4cc !important;
  color: #fff !important;
}

.btn-primary {
  background-color: #007AFF;
  color: white;
}

.btn-secondary {
  background-color: #f8f9fa;
  color: #666;
  border: 1rpx solid #e0e0e0;
}

.btn-success {
  background-color: #34C759;
  color: white;
}

.btn-mini {
  padding: 16rpx 24rpx;
  font-size: 24rpx;
  white-space: nowrap;
  height: auto;
}

.add-spec-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 24rpx;
  border: 2rpx dashed #e0e0e0;
  border-radius: 12rpx;
  color: #007AFF;
  font-size: 28rpx;
  background: #fafafa;
}

.add-icon {
  font-size: 32rpx;
  font-weight: bold;
}

.spec-count {
  color: #999;
  font-size: 24rpx;
}

.warning-text {
  color: #ff9500;
  font-size: 24rpx;
  margin-bottom: 24rpx;
  display: block;
  line-height: 1.5;
}

.table {
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  overflow: hidden;
  margin-bottom: 24rpx;
}

.table-header {
  background-color: #f8f9fa;
}

.table-row {
  display: flex;
  border-bottom: 1rpx solid #e0e0e0;
}

.table-row:last-child {
  border-bottom: none;
}

.table-header-cell {
  padding: 20rpx 16rpx;
  font-weight: 500;
  flex: 1;
  font-size: 24rpx;
  text-align: center;
  color: #666;
}

.table-cell {
  padding: 20rpx 16rpx;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  min-height: 80rpx;
}

.required-field::before {
  content: "*";
  color: #ff4757;
  margin-right: 4rpx;
}

.status-badge {
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  background-color: #e8f5e8;
  color: #34C759;
  transition: all 0.3s;
}

.status-badge.status-off {
  background-color: #ffeaea;
  color: #ff4757;
}

.batch-setting {
  margin-top: 24rpx;
}

.batch-label {
  display: block;
  margin-bottom: 16rpx;
  color: #666;
  font-size: 26rpx;
}

.batch-inputs {
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
}

.batch-inputs .uni-easyinput {
  flex: 1;
}

.batch-btn {
  width: 120rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.price-section {
  background-color: #f8f9fa;
  padding: 30rpx;
  border-radius: 12rpx;
  margin-top: 40rpx;
}

.price-header {
  margin-bottom: 20rpx;
}

.price-title {
  font-size: 28rpx;
  display: block;
  margin-bottom: 8rpx;
  font-weight: 500;
}

.price-tip {
  display: block;
  color: #999;
  font-size: 24rpx;
}

.reference-price {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.reference-price .uni-easyinput {
  flex: 1;
}

.price-unit {
  color: #666;
  font-size: 28rpx;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 60rpx;
  gap: 24rpx;
}

.action-buttons .btn {
  flex: 1;
}

/* 隐藏价格库存输入框的清除按钮 */
.table-cell ::v-deep .uni-easyinput__icon-clear,
.batch-inputs ::v-deep .uni-easyinput__icon-clear,
.reference-price ::v-deep .uni-easyinput__icon-clear {
  display: none !important;
}

/* 规格名称输入框样式 */
.spec-header ::v-deep .uni-easyinput__content {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
}

.spec-header ::v-deep .uni-easyinput__content-input {
  font-size: 30rpx !important;
  font-weight: 500 !important;
  color: #333 !important;
  padding: 0 !important;
}

/* 确保 uni-easyinput 在表格中的样式 */
.table-cell .uni-easyinput__content {
  min-height: auto !important;
}

.table-cell .uni-easyinput__content-input {
  text-align: center;
  font-size: 24rpx !important;
}
</style>