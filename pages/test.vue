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
                  class="picker"
                >
                  <view class="picker-text">
                    {{ category1Options[category1Index] || '请选择' }}
                  </view>
                </picker>
              </view>
              <view class="picker-group">
                <text class="picker-label">二级分类</text>
                <picker 
                  @change="onCategory2Change" 
                  :value="category2Index" 
                  :range="category2Options"
                  :disabled="!category1Options[category1Index]"
                  class="picker"
                >
                  <view class="picker-text" :class="{ disabled: !category1Options[category1Index] }">
                    {{ category2Options[category2Index] || '请选择' }}
                  </view>
                </picker>
              </view>
              <view class="picker-group">
                <text class="picker-label">三级分类</text>
                <picker 
                  @change="onCategory3Change" 
                  :value="category3Index" 
                  :range="category3Options"
                  :disabled="!category2Options[category2Index]"
                  class="picker"
                >
                  <view class="picker-text" :class="{ disabled: !category2Options[category2Index] }">
                    {{ category3Options[category3Index] || '请选择' }}
                  </view>
                </picker>
              </view>
            </view>
          </view>
          
          <view class="action-buttons">
            <view></view>
            <button class="btn btn-primary" @tap="goToStep(2)">下一步</button>
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
              v-model="productData.title"
              placeholder="请输入商品标题"
              :styles="inputStyles"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">商品属性</text>
            <view class="specification-container">
              <view class="spec-body">
                <view class="property-item">
                  <text class="property-label">品牌</text>
                  <view class="property-input">
                    <uni-easyinput
                      v-model="productData.brand"
                      placeholder="请输入品牌"
                      :styles="inputStyles"
                    />
                    <text class="brand-apply" @tap="applyBrand">没有的可以申请</text>
                  </view>
                </view>
                <view class="property-item">
                  <text class="property-label">材质</text>
                  <view class="property-input">
                    <uni-easyinput
                      v-model="productData.material"
                      placeholder="请输入材质"
                      :styles="inputStyles"
                    />
                  </view>
                </view>
                <view class="property-item">
                  <text class="property-label">详细描述</text>
                  <view class="property-input">
                    <uni-easyinput
                      v-model="productData.description"
                      type="textarea"
                      placeholder="请输入详细描述"
                      :styles="textareaStyles"
                    />
                  </view>
                </view>
              </view>
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
                    <view 
                      v-if="specifications.length > 0" 
                      class="table-header-cell"
                    >
                      图片
                    </view>
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
                    <view v-if="specifications.length > 0" class="table-cell preview-image-cell">
                      <view class="preview-image-upload" @tap="uploadPreviewImage(index)">
                        <text v-if="!item.previewImage" class="upload-text">上传</text>
                        <image v-else :src="item.previewImage" class="preview-image" mode="aspectFill"></image>
                      </view>
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
            <button class="btn btn-success" @tap="submitProduct">提交商品</button>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      currentStep: 1,
      
      // 分类数据
      category1Index: 0,
      category2Index: 0,
      category3Index: 0,
      category1Options: ['地板', '瓷砖', '涂料', '灯具', '家具'],
      category2Options: [],
      category3Options: [],
      
      // 商品图片
      productImages: [],
      
      // 商品数据
      productData: {
        title: '',
        brand: '',
        material: '',
        description: ''
      },
      
      // 规格数据
      specifications: [],
      specCounter: 1,
      
      // 价格库存数据
      priceStockData: [{
        stock: '',
        singlePrice: '',
        status: 'on'  // 默认上架
      }],
      
      // 批量设置
      batchStock: '',
      batchSinglePrice: '',
      
      // 参考价
      referencePrice: '',
      
      // 分类映射数据
      categoryMap: {
        '地板': ['实木地板', '复合地板', '强化地板'],
        '瓷砖': ['抛光砖', '釉面砖', '通体砖'],
        '涂料': ['乳胶漆', '油漆', '防水涂料'],
        '灯具': ['吊灯', '壁灯', '台灯'],
        '家具': ['沙发', '床', '餐桌']
      },
      subCategoryMap: {
        '实木地板': ['橡木实木地板', '柚木实木地板', '枫木实木地板'],
        '复合地板': ['实木复合地板', '强化复合地板'],
        '抛光砖': ['亮光抛光砖', '亚光抛光砖'],
        '乳胶漆': ['内墙乳胶漆', '外墙乳胶漆'],
        '吊灯': ['水晶吊灯', '现代吊灯', '欧式吊灯']
      },
      
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
        minHeight: '160rpx'
      },
      specNameInputStyles: {
        borderColor: 'transparent',
        color: '#333',
        backgroundColor: 'transparent',
        fontSize: '30rpx',
        fontWeight: '500'
      },
      tableInputStyles: {
        borderColor: '#e0e0e0',
        color: '#333',
        backgroundColor: '#fff',
        fontSize: '24rpx',
        padding: '16rpx'
      },
      batchInputStyles: {
        borderColor: '#e0e0e0',
        color: '#333',
        backgroundColor: '#fff',
        fontSize: '26rpx',
        padding: '20rpx'
      },
      priceInputStyles: {
        borderColor: '#e0e0e0',
        color: '#333',
        backgroundColor: '#fff',
        textAlign: 'right'
      }
    }
  },
  
  methods: {
    // 步骤切换
    goToStep(step) {
      this.currentStep = step
      if (step === 3) {
        this.generatePriceStockTable()
      }
    },
    
    // 分类选择
    onCategory1Change(e) {
      this.category1Index = e.detail.value
      const selectedCategory = this.category1Options[this.category1Index]
      this.category2Options = this.categoryMap[selectedCategory] || []
      this.category2Index = 0
      this.category3Options = []
      this.category3Index = 0
    },
    
    onCategory2Change(e) {
      this.category2Index = e.detail.value
      const selectedSubCategory = this.category2Options[this.category2Index]
      this.category3Options = this.subCategoryMap[selectedSubCategory] || []
      this.category3Index = 0
    },
    
    onCategory3Change(e) {
      this.category3Index = e.detail.value
    },
    
    // 图片上传
    chooseImages() {
      uni.chooseImage({
        count: 10,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.productImages = [...this.productImages, ...res.tempFilePaths]
        }
      })
    },
    
    removeImage(index) {
      this.productImages.splice(index, 1)
    },
    
    // 品牌申请
    applyBrand() {
      uni.showModal({
        title: '品牌申请',
        content: '请联系客服申请品牌',
        showCancel: false
      })
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
        name: '',  // 初始为空，让用户输入
        values: [],
        newValue: ''
      }
      
      this.specifications.push(spec)
      this.specCounter++
      this.generatePriceStockTable()
    },
    
    removeSpecification(specId) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个规格类型吗？',
        success: (res) => {
          if (res.confirm) {
            this.specifications = this.specifications.filter(spec => spec.id !== specId)
            this.generatePriceStockTable()
          }
        }
      })
    },
    
    updateSpecName(specId, newName) {
      const spec = this.specifications.find(s => s.id === specId)
      if (spec) {
        // 如果名称为空，给一个默认名称
        if (!newName || newName.trim() === '') {
          spec.name = `规格${this.specCounter}`
        }
        this.generatePriceStockTable()
      }
    },
    
    addSpecValue(specId) {
      const spec = this.specifications.find(s => s.id === specId)
      if (spec && spec.newValue.trim()) {
        if (!spec.values.includes(spec.newValue.trim())) {
          spec.values.push(spec.newValue.trim())
          spec.newValue = ''
          this.generatePriceStockTable()
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
          stock: '',
          singlePrice: '',
          status: 'on'  // 默认上架
        }]
        return
      }
      
      // 生成所有规格组合
      const combinations = this.generateCombinations()
      // 保留原有的数据
      combinations.forEach((combination, index) => {
        const existingData = this.priceStockData[index]
        if (existingData) {
          combination.stock = existingData.stock || ''
          combination.singlePrice = existingData.singlePrice || ''
          combination.status = existingData.status || 'on'  // 默认上架
          combination.previewImage = existingData.previewImage || ''
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
            status: 'on'  // 默认上架
          }]
        }
        
        const spec = this.specifications[specIndex]
        let combinations = []
        
        for (const value of spec.values) {
          const newCombination = {
            ...currentCombination,
            values: [...(currentCombination.values || []), value]
          }
          combinations = combinations.concat(generate(specIndex + 1, newCombination))
        }
        
        return combinations
      }
      
      return generate(0, {})
    },
    
    uploadPreviewImage(index) {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.$set(this.priceStockData[index], 'previewImage', res.tempFilePaths[0])
        }
      })
    },
    
    toggleStatus(index) {
      if (this.priceStockData[index]) {
        this.priceStockData[index].status = 
          this.priceStockData[index].status === 'on' ? 'off' : 'on'
      }
    },
    
    batchSetValues() {
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
    
    // 提交商品
    submitProduct() {
      // 验证必填字段
      if (!this.productData.title) {
        uni.showToast({
          title: '请输入商品标题',
          icon: 'none'
        })
        return
      }
      
      if (!this.productImages.length) {
        uni.showToast({
          title: '请上传商品图片',
          icon: 'none'
        })
        return
      }
      
      // 验证规格名称是否填写
      for (let spec of this.specifications) {
        if (!spec.name || spec.name.trim() === '') {
          uni.showToast({
            title: '请填写规格名称',
            icon: 'none'
          })
          return
        }
        
        if (spec.values.length === 0) {
          uni.showToast({
            title: `请为${spec.name}添加规格值`,
            icon: 'none'
          })
          return
        }
      }
      
      const productData = {
        category: {
          level1: this.category1Options[this.category1Index],
          level2: this.category2Options[this.category2Index],
          level3: this.category3Options[this.category3Index]
        },
        images: this.productImages,
        ...this.productData,
        specifications: this.specifications,
        priceStock: this.priceStockData,
        referencePrice: this.referencePrice
      }
      
      console.log('提交的商品数据:', productData)
      uni.showToast({
        title: '商品提交成功！',
        icon: 'success'
      })
    }
  },
  
  onLoad() {
    // 默认从第一步开始
    this.currentStep = 1
  }
}
</script>

<style scoped>
/* 这里保持之前的所有样式不变 */
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

.property-item {
  margin-bottom: 30rpx;
}

.property-label {
  display: block;
  margin-bottom: 16rpx;
  color: #333;
  font-size: 28rpx;
}

.property-input {
  position: relative;
}

.brand-apply {
  position: absolute;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
  color: #007AFF;
  font-size: 26rpx;
  z-index: 2;
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

.preview-image-cell {
  justify-content: center;
}

.preview-image-upload {
  width: 80rpx;
  height: 80rpx;
  border: 1rpx dashed #e0e0e0;
  border-radius: 8rpx;
  background-color: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  color: #999;
}

.preview-image-upload .upload-text {
  font-size: 20rpx;
  margin: 0;
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