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
            
            <!-- 一级分类 -->
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
                  <text v-if="loadingCategory1" class="loading-indicator">加载中...</text>
                </view>
              </picker>
            </view>
            
            <!-- 二级分类 -->
            <view class="picker-group">
              <text class="picker-label">二级分类</text>
              <picker 
                @change="onCategory2Change" 
                :value="category2Index" 
                :range="category2Options"
                range-key="name"
                :disabled="!selectedCategory1Id || loadingCategory2"
                class="picker"
              >
                <view class="picker-text" :class="{ 
                  disabled: !selectedCategory1Id,
                  loading: loadingCategory2 
                }">
                  <template v-if="loadingCategory2">
                    加载中...
                  </template>
                  <template v-else-if="!selectedCategory1Id">
                    请先选择二级分类
                  </template>
                  <template v-else>
                    {{ category2Options[category2Index] ? category2Options[category2Index].name : '请选择二级分类' }}
                  </template>
                </view>
              </picker>
            </view>
            
            <!-- 三级分类 -->
            <view class="picker-group">
              <text class="picker-label">三级分类</text>
              <picker 
                @change="onCategory3Change" 
                :value="category3Index" 
                :range="category3Options"
                range-key="name"
                :disabled="!selectedCategory2Id || loadingCategory3"
                class="picker"
              >
                <view class="picker-text" :class="{ 
                  disabled: !selectedCategory2Id,
                  loading: loadingCategory3 
                }">
                  <template v-if="loadingCategory3">
                    加载中...
                  </template>
                  <template v-else-if="!selectedCategory2Id">
                    请先选择三级分类
                  </template>
                  <template v-else>
                    {{ category3Options[category3Index] ? category3Options[category3Index].name : '请选择三级分类' }}
                  </template>
                </view>
              </picker>
            </view>
            
            <!-- 分类选择状态显示 -->
            <view class="category-status" v-if="selectedCategory3Id">
              <text class="status-text">已选择分类：</text>
              <text class="category-path">{{ selectedCategoryPath }}</text>
            </view>

            <!-- 错误信息显示 -->
            <view v-if="categoryError" class="error-message">
              <text>{{ categoryError }}</text>
              <text class="retry-text" @tap="loadLevel1Categories">点击重试</text>
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
// 导入API函数
import { 
  getLevel1Categories, 
  getLevel2CategoriesByLevel1, 
  getLevel3CategoriesByLevel2,
  addProductSpu, 
  addProductSku
} from '@/api/product.js'

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
      
      // 分类加载状态
      loadingCategory1: false,
      loadingCategory2: false,
      loadingCategory3: false,
      categoryError: '',
      
      // 存储选中的分类信息
      selectedCategory1Id: null,
      selectedCategory2Id: null,
      selectedCategory3Id: null,
      selectedCategory1Name: '',
      selectedCategory2Name: '',
      selectedCategory3Name: '',
      selectedCategoryPath: '',
      
      // 商品图片
      productImages: [],
      
      // 商品数据
      productData: {
        productName: '',
        productDetail: '',
        categoryId: null,
        productStatus: 0,
        specType: 0,
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
      },
      specNameInputStyles: {
        borderColor: 'transparent',
        color: '#333',
        backgroundColor: 'transparent'
      },
      tableInputStyles: {
        borderColor: 'transparent',
        color: '#333',
        backgroundColor: 'transparent',
        textAlign: 'center'
      },
      batchInputStyles: {
        borderColor: '#e0e0e0',
        color: '#333',
        backgroundColor: '#fff'
      },
      priceInputStyles: {
        borderColor: '#e0e0e0',
        color: '#333',
        backgroundColor: '#fff'
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
    
    // 一级分类选择
    async onCategory1Change(e) {
      const index = parseInt(e.detail.value)
      this.category1Index = index
      const selectedCategory = this.category1Options[index]
      
      if (selectedCategory) {
        this.selectedCategory1Id = selectedCategory.id
        this.selectedCategory1Name = selectedCategory.name
        
        console.log('选择一级分类:', {
          名称: selectedCategory.name,
          ID: this.selectedCategory1Id
        })
        
        // 重置下级分类
        this.category2Options = []
        this.category3Options = []
        this.category2Index = 0
        this.category3Index = 0
        this.selectedCategory2Id = null
        this.selectedCategory2Name = ''
        this.selectedCategory3Id = null
        this.selectedCategory3Name = ''
        
        this.updateCategoryPath()
        
        // 加载二级分类
        await this.loadLevel2Categories(this.selectedCategory1Id)
        
      }
    },
    
    // 二级分类选择
    async onCategory2Change(e) {
      const index = parseInt(e.detail.value)
      this.category2Index = index
      const selectedCategory = this.category2Options[index]
      
      if (selectedCategory) {
        this.selectedCategory2Id = selectedCategory.id
        this.selectedCategory2Name = selectedCategory.name
        
        console.log('选择二级分类:', {
          名称: selectedCategory.name,
          ID: this.selectedCategory2Id
        })
        
        // 重置三级分类
        this.category3Options = []
        this.category3Index = 0
        this.selectedCategory3Id = null
        this.selectedCategory3Name = ''
        
        this.updateCategoryPath()
        
        // 加载三级分类
        await this.loadLevel3Categories(this.selectedCategory2Id)
      }
    },
    
    // 三级分类选择
    onCategory3Change(e) {
      const index = parseInt(e.detail.value)
      this.category3Index = index
      const selectedCategory = this.category3Options[index]
      
      if (selectedCategory) {
        this.selectedCategory3Id = selectedCategory.id
        this.selectedCategory3Name = selectedCategory.name
        this.productData.categoryId = this.selectedCategory3Id
        
        this.updateCategoryPath()
        
        uni.showToast({
          title: '分类选择完成',
          icon: 'success',
          duration: 1500
        })
        
        console.log('三级分类选择:', {
          选择的三级分类: selectedCategory.name,
          分类ID: this.selectedCategory3Id
        })
      }
    },
    
    // 更新分类路径显示
    updateCategoryPath() {
      let path = ''
      if (this.selectedCategory1Name) path += this.selectedCategory1Name
      if (this.selectedCategory2Name) path += ' / ' + this.selectedCategory2Name
      if (this.selectedCategory3Name) path += ' / ' + this.selectedCategory3Name
      
      this.selectedCategoryPath = path
    },
    
    // 加载一级分类
    async loadLevel1Categories() {
      try {
        this.loadingCategory1 = true
        this.categoryError = ''
        
        uni.showLoading({
          title: '加载分类中...',
          mask: true
        })
        
        const response = await getLevel1Categories()
        console.log('一级分类API响应:', response)
        
        if (response.code === 200) {
          const categoryData = response.data
          
          if (!categoryData || categoryData.length === 0) {
            throw new Error('一级分类数据为空')
          }
          
          this.category1Options = categoryData
          
          console.log('一级分类加载成功:', {
            '一级分类数量': this.category1Options.length,
            '一级分类列表': this.category1Options.map(cat => ({
              name: cat.name,
              id: cat.id
            }))
          })
          
          uni.showToast({
            title: '分类加载成功',
            icon: 'success',
            duration: 1500
          })
          
        } else {
          throw new Error(response.message || '加载一级分类失败')
        }
        
      } catch (error) {
        console.error('加载一级分类失败:', error)
        this.categoryError = error.message || '一级分类加载失败，请检查网络连接'
        uni.showToast({
          title: '分类加载失败',
          icon: 'none',
          duration: 3000
        })
        
        this.category1Options = []
      } finally {
        this.loadingCategory1 = false
        uni.hideLoading()
      }
    },
    
    // 加载二级分类 - 根据一级分类ID
    async loadLevel2Categories(level1CategoryId) {
      try {
        this.loadingCategory2 = true
        
        console.log('开始加载二级分类，一级分类ID:', level1CategoryId)
        
        const response = await getLevel2CategoriesByLevel1(level1CategoryId)
        console.log('二级分类API响应:', response)
        
        if (response.code === 200) {
          const categoryData = response.data
          
          this.category2Options = categoryData
          
          console.log('二级分类加载成功:', {
            '二级分类数量': this.category2Options.length,
            '二级分类列表': this.category2Options.map(cat => ({
              name: cat.name,
              id: cat.id
            }))
          })
          
          if (this.category2Options.length === 0) {
            uni.showToast({
              title: '该分类下暂无二级分类',
              icon: 'none',
              duration: 2000
            })
          }
          
        } else {
          throw new Error(response.message || '加载二级分类失败')
        }
        
      } catch (error) {
        console.error('加载二级分类失败:', error)
        uni.showToast({
          title: '二级分类加载失败',
          icon: 'none',
          duration: 2000
        })
        
        this.category2Options = []
      } finally {
        this.loadingCategory2 = false
      }
    },
    
    // 加载三级分类 - 根据二级分类ID
    async loadLevel3Categories(level2CategoryId) {
      try {
        this.loadingCategory3 = true
        
        console.log('开始加载三级分类，二级分类ID:', level2CategoryId)
        
        const response = await getLevel3CategoriesByLevel2(level2CategoryId)
        console.log('三级分类API响应:', response)
        
        if (response.code === 200) {
          const categoryData = response.data
          
          this.category3Options = categoryData
          
          console.log('三级分类加载成功:', {
            '三级分类数量': this.category3Options.length,
            '三级分类列表': this.category3Options.map(cat => ({
              name: cat.name,
              id: cat.id
            }))
          })
          
          if (this.category3Options.length === 0) {
            uni.showToast({
              title: '该分类下暂无三级分类',
              icon: 'none',
              duration: 2000
            })
          }
          
        } else {
          throw new Error(response.message || '加载三级分类失败')
        }
        
      } catch (error) {
        console.error('加载三级分类失败:', error)
        uni.showToast({
          title: '三级分类加载失败',
          icon: 'none',
          duration: 2000
        })
        
        this.category3Options = []
      } finally {
        this.loadingCategory3 = false
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
      this.generatePriceStockTable()
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
    
    updateSpecName(specId, newName) {
      const spec = this.specifications.find(s => s.id === specId)
      if (spec) {
        spec.name = newName
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
    
    // 计算总库存
    calculateTotalStock() {
      if (this.specifications.length === 0) {
        return parseInt(this.priceStockData[0].stock) || 0
      }
      
      return this.priceStockData.reduce((total, item) => {
        return total + (parseInt(item.stock) || 0)
      }, 0)
    },
    
    // 构建SKU列表数据
    buildSkuList() {
      if (this.specifications.length === 0) {
        const item = this.priceStockData[0]
        return [{
          stockQuantity: parseInt(item.stock) || 0,
          salePrice: parseFloat(item.singlePrice) || 0,
          costPrice: parseFloat(item.singlePrice) * 0.8 || 0,
          skuStatus: item.status === 'on' ? 1 : 0,
          skuDetail: JSON.stringify({
            type: 'single',
            productName: this.productData.productName,
            description: '单规格商品'
          })
        }]
      } else {
        return this.priceStockData.map((item, index) => {
          const specValues = item.values || []
          const specCombination = this.specifications.map((spec, specIndex) => ({
            name: spec.name,
            value: specValues[specIndex] || ''
          }))
          
          const specDescription = specCombination.map(spec => `${spec.name}:${spec.value}`).join(';')
          const skuName = `${this.productData.productName} ${specDescription}`
          
          return {
            stockQuantity: parseInt(item.stock) || 0,
            salePrice: parseFloat(item.singlePrice) || 0,
            costPrice: parseFloat(item.singlePrice) * 0.8 || 0,
            skuStatus: item.status === 'on' ? 1 : 0,
            skuDetail: JSON.stringify({
              type: 'multi',
              combination: specCombination,
              description: specDescription,
              skuName: skuName,
              index: index
            })
          }
        })
      }
    },
    
    // 验证表单
    validateForm() {
      console.log('开始表单验证...')
      
      // 验证商品标题
      if (!this.productData.productName || this.productData.productName.trim() === '') {
        throw new Error('请输入商品标题')
      }
      
      if (this.productData.productName.trim().length < 2) {
        throw new Error('商品标题至少2个字符')
      }

      // 验证分类
      if (!this.selectedCategory3Id) {
        throw new Error('请选择完整的三级分类')
      }

      // 验证图片
      if (this.productImages.length === 0) {
        throw new Error('请上传至少1张商品图片')
      }

      // 验证规格
      for (let i = 0; i < this.specifications.length; i++) {
        const spec = this.specifications[i]
        if (!spec.name || spec.name.trim() === '') {
          throw new Error('请填写规格名称')
        }
        
        if (spec.values.length === 0) {
          throw new Error('请为"' + spec.name + '"添加规格值')
        }
        
        // 验证规格值是否重复
        const uniqueValues = [...new Set(spec.values)]
        if (uniqueValues.length !== spec.values.length) {
          throw new Error('"' + spec.name + '"中存在重复的规格值')
        }
      }

      // 验证价格和库存
      let hasValidItem = false
      for (let i = 0; i < this.priceStockData.length; i++) {
        const item = this.priceStockData[i]
        const stock = parseInt(item.stock)
        const price = parseFloat(item.singlePrice)
        
        if (!item.stock || isNaN(stock) || stock < 0) {
          throw new Error('请填写有效的库存数量')
        }
        
        if (!item.singlePrice || isNaN(price) || price <= 0) {
          throw new Error('请填写有效的价格')
        }
        
        if (price > 999999) {
          throw new Error('价格不能超过999999元')
        }
        
        hasValidItem = true
      }
      
      if (!hasValidItem) {
        throw new Error('请至少填写一个有效的价格库存项')
      }
      
      // 验证参考价
      const referencePrice = parseFloat(this.referencePrice)
      if (isNaN(referencePrice) || referencePrice < 0) {
        throw new Error('请填写有效的商品参考价')
      }
      
      console.log('表单验证通过')
    },
    
    // 上传商品图片
    async uploadProductImages(spuId) {
      try {
        uni.showLoading({
          title: '上传图片中...',
          mask: true
        })

        const token = uni.getStorageSync('token') || ''
        
        console.log('开始上传商品图片:', {
          spuId,
          图片数量: this.productImages.length,
          token: token ? '有token' : '无token'
        })

        const uploadPromises = this.productImages.map(async (imagePath, index) => {
          try {
            console.log(`上传第${index + 1}张图片:`, imagePath)
            
            // 使用 uni.uploadFile 直接上传到媒体服务
            const uploadResult = await new Promise((resolve, reject) => {
              uni.uploadFile({
                url: 'http://localhost:8081/api/media/upload',
                filePath: imagePath,
                name: 'file',
                formData: {
                  relatedType: '5', // 商品类型
                  relatedId: spuId.toString(),
                  description: `商品主图${index + 1}`,
                  stage: 'MAIN',
                  sequence: index.toString()
                },
                header: {
                  'Authorization': 'Bearer ' + token
                },
                success: (res) => {
                  console.log(`第${index + 1}张图片上传响应:`, res)
                  resolve(res)
                },
                fail: (err) => {
                  console.error(`第${index + 1}张图片上传失败:`, err)
                  reject(err)
                }
              })
            })

            // 处理上传结果
            if (uploadResult.statusCode === 200) {
              let resultData
              try {
                resultData = typeof uploadResult.data === 'string' ? 
                  JSON.parse(uploadResult.data) : uploadResult.data
              } catch (e) {
                console.error('解析响应数据失败:', e)
                resultData = { success: true, data: uploadResult.data }
              }
              
              console.log(`第${index + 1}张图片上传成功:`, resultData)
              return resultData
            } else {
              console.error(`上传失败，状态码: ${uploadResult.statusCode}`, uploadResult)
              throw new Error(`上传失败: ${uploadResult.statusCode}`)
            }
          } catch (error) {
            console.error(`第${index + 1}张图片上传失败:`, error)
            // 返回错误信息，但不阻断其他图片上传
            return { 
              success: false, 
              error: error.message,
              index: index 
            }
          }
        })

        const results = await Promise.all(uploadPromises)
        
        // 统计成功和失败的数量
        const successResults = results.filter(result => 
          result && (result.code === 200 || result.success === true || result.success)
        )
        const failedResults = results.filter(result => 
          result && (result.success === false || result.error)
        )

        console.log('图片上传统计:', {
          总数量: results.length,
          成功数量: successResults.length,
          失败数量: failedResults.length
        })

        if (successResults.length > 0) {
          uni.showToast({
            title: `图片上传完成 (${successResults.length}/${results.length})`,
            icon: 'success',
            duration: 2000
          })
        }

        if (failedResults.length > 0) {
          console.warn('部分图片上传失败:', failedResults)
          // 可以选择是否抛出错误
          if (successResults.length === 0) {
            throw new Error('所有图片上传失败')
          }
        }

        return {
          success: true,
          total: results.length,
          successCount: successResults.length,
          failedCount: failedResults.length,
          failedItems: failedResults
        }

      } catch (error) {
        console.error('图片上传过程出错:', error)
        uni.showToast({
          title: error.message || '图片上传失败',
          icon: 'none',
          duration: 3000
        })
        throw error // 重新抛出错误，让调用方处理
      } finally {
        uni.hideLoading()
      }
    },
    
    // 创建SKU
    async createProductSkus(spuId) {
      try {
        const skuList = this.buildSkuList()
        console.log('创建SKU列表:', skuList)
        
        const skuPromises = skuList.map(async (skuData, index) => {
          try {
            const skuDto = {
              spuId: spuId,
              stockQuantity: skuData.stockQuantity,
              salePrice: skuData.salePrice,
              costPrice: skuData.costPrice,
              skuStatus: skuData.skuStatus,
              skuDetail: skuData.skuDetail
            }
            
            const result = await addProductSku(skuDto)
            console.log(`第${index + 1}个SKU创建结果:`, result)
            return result
          } catch (error) {
            console.error(`创建第${index + 1}个SKU失败:`, error)
            return { success: false, error: error.message, index }
          }
        })
        
        const results = await Promise.all(skuPromises)
        const successResults = results.filter(result => 
          result && (result.code === 200 || result.success === true || result.success)
        )
        
        console.log('SKU创建统计:', {
          总数量: results.length,
          成功数量: successResults.length
        })
        
        return {
          success: successResults.length > 0,
          createdCount: successResults.length,
          totalCount: results.length,
          results: results
        }
        
      } catch (error) {
        console.error('创建SKU过程出错:', error)
        throw new Error('SKU创建失败: ' + error.message)
      }
    },
    
    // 显示提交结果
    showSubmitResult(result) {
      const { spuId, uploadResult, skuResult, hasImages, hasSpecs } = result
      
      let message = '商品创建成功！\n'
      message += `商品ID: ${spuId}\n`
      
      if (hasImages) {
        message += `图片: ${uploadResult.successCount}张上传成功\n`
      }
      
      if (hasSpecs) {
        message += `规格: ${skuResult.createdCount}个SKU创建成功\n`
      }
      
      uni.showModal({
        title: '提交成功',
        content: message,
        showCancel: false,
        confirmText: '确定',
        success: (res) => {
          if (res.confirm) {
            // 返回上一页
            setTimeout(() => {
              uni.navigateBack()
            }, 500)
          }
        }
      })
    },
    
    // 提交商品
    async submitProduct() {
      if (this.loading) return
      
      try {
        console.log('开始提交商品，当前数据:', {
          步骤: this.currentStep,
          分类ID: this.selectedCategory3Id,
          商品名称: this.productData.productName,
          图片数量: this.productImages.length,
          规格数量: this.specifications.length,
          价格库存项: this.priceStockData.length
        })
        
        // 验证表单
        this.validateForm()
        
        this.loading = true
        uni.showLoading({
          title: '提交中...',
          mask: true
        })

        // 1. 构建SPU数据
        const spuData = {
          productName: this.productData.productName.trim(),
          productDetail: this.productData.productDetail.trim(),
          categoryId: this.selectedCategory3Id,
          productStatus: 0, // 默认下架状态
          specType: this.specifications.length > 0 ? 2 : 0, // 根据是否有规格确定类型
          marketPrice: parseFloat(this.referencePrice) || 0,
          costPrice: this.productData.costPrice || 0,
          stock: this.calculateTotalStock() // 计算总库存
        }

        console.log('提交SPU数据:', spuData)
        
        // 2. 创建SPU
        const spuResponse = await addProductSpu(spuData)
        
        if (spuResponse.code === 200) {
          const spuId = spuResponse.data
          
          console.log('SPU创建成功，ID:', spuId)
          
          let uploadResult = { success: false, successCount: 0 }
          
          // 3. 上传商品图片（如果失败不影响SPU创建）
          if (this.productImages.length > 0) {
            try {
              uploadResult = await this.uploadProductImages(spuId)
              console.log('图片上传结果:', uploadResult)
            } catch (uploadError) {
              console.error('图片上传失败，但SPU已创建:', uploadError)
              // 记录错误但继续执行
              uploadResult = {
                success: false,
                error: uploadError.message,
                successCount: 0
              }
            }
          }
          
          // 4. 创建SKU（如果有规格）
          let skuResult = { success: true, createdCount: 0 }
          if (this.specifications.length > 0) {
            try {
              skuResult = await this.createProductSkus(spuId)
              console.log('SKU创建结果:', skuResult)
            } catch (skuError) {
              console.error('SKU创建失败:', skuError)
              skuResult = {
                success: false,
                error: skuError.message,
                createdCount: 0
              }
            }
          }
          
          uni.hideLoading()
          
          // 5. 显示最终结果
          this.showSubmitResult({
            spuId,
            uploadResult,
            skuResult,
            hasImages: this.productImages.length > 0,
            hasSpecs: this.specifications.length > 0
          })
          
        } else {
          throw new Error(spuResponse.message || '创建商品失败')
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
    }
  },
  
  async onLoad() {
    // 页面加载时只加载一级分类
    await this.loadLevel1Categories()
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
.container {
  padding: 20rpx;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 30rpx;
}

.title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.subtitle {
  display: block;
  font-size: 24rpx;
  color: #666;
}

.upload-container {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
}

.steps {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40rpx;
  position: relative;
}

.steps::before {
  content: '';
  position: absolute;
  top: 40rpx;
  left: 20%;
  right: 20%;
  height: 4rpx;
  background: #e0e0e0;
  z-index: 1;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
  flex: 1;
}

.step-number {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: #e0e0e0;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  margin-bottom: 10rpx;
  transition: all 0.3s;
}

.step.active .step-number {
  background: #007AFF;
}

.step-text {
  font-size: 24rpx;
  color: #999;
}

.step.active .step-text {
  color: #007AFF;
  font-weight: bold;
}

.step-content {
  max-height: 70vh;
}

.step-panel {
  padding: 20rpx 0;
}

.form-group {
  margin-bottom: 40rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.picker-group {
  margin-bottom: 30rpx;
}

.picker-group:last-child {
  margin-bottom: 0;
}

.picker-label {
  display: block;
  font-size: 26rpx;
  color: #333;
  margin-bottom: 15rpx;
}

.picker {
  background: white;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 20rpx;
}

.picker-text {
  font-size: 28rpx;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.picker-text.disabled {
  color: #999;
  background: #f5f5f5;
}

.picker-text.loading {
  color: #007AFF;
}

.loading-indicator {
  color: #007AFF;
  font-size: 24rpx;
}

.category-status {
  background: #e8f5e8;
  border: 2rpx solid #4CAF50;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-top: 20rpx;
}

.status-text {
  font-size: 26rpx;
  color: #2E7D32;
  margin-right: 10rpx;
}

.category-path {
  font-size: 26rpx;
  color: #2E7D32;
  font-weight: bold;
}

.error-message {
  background: #ffebee;
  border: 2rpx solid #f44336;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-top: 20rpx;
  text-align: center;
}

.error-message text:first-child {
  display: block;
  font-size: 26rpx;
  color: #d32f2f;
  margin-bottom: 10rpx;
}

.retry-text {
  font-size: 26rpx;
  color: #007AFF;
  text-decoration: underline;
}

.upload-area {
  border: 2rpx dashed #007AFF;
  border-radius: 12rpx;
  padding: 60rpx 30rpx;
  text-align: center;
  background: #f0f8ff;
}

.upload-icon {
  display: block;
  font-size: 60rpx;
  margin-bottom: 20rpx;
}

.upload-text {
  display: block;
  font-size: 28rpx;
  color: #007AFF;
  margin-bottom: 10rpx;
}

.upload-tip {
  display: block;
  font-size: 24rpx;
  color: #666;
}

.image-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-top: 20rpx;
}

.preview-item {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  overflow: hidden;
  border: 2rpx solid #e0e0e0;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.remove {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 40rpx;
  height: 40rpx;
  background: rgba(0,0,0,0.7);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: bold;
}

.description-container {
  margin-top: 10rpx;
}

.specifications-container {
  margin-bottom: 30rpx;
}

.specification-container {
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  margin-bottom: 30rpx;
  overflow: hidden;
}

.spec-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8f9fa;
  padding: 20rpx;
  border-bottom: 2rpx solid #e0e0e0;
}

.spec-name-input {
  flex: 1;
}

.delete-spec {
  color: #ff4757;
  font-size: 26rpx;
  margin-left: 20rpx;
  padding: 8rpx 16rpx;
  border-radius: 6rpx;
  background: #fff5f5;
}

.spec-body {
  padding: 20rpx;
}

.spec-values {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
  margin-bottom: 20rpx;
}

.spec-value-item {
  background: #e3f2fd;
  border: 1rpx solid #2196F3;
  border-radius: 20rpx;
  padding: 12rpx 20rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
  font-size: 24rpx;
}

.remove-value {
  color: #ff4757;
  font-size: 20rpx;
  font-weight: bold;
  cursor: pointer;
  width: 24rpx;
  height: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: white;
}

.add-value-input {
  display: flex;
  gap: 15rpx;
  align-items: center;
}

.add-btn {
  white-space: nowrap;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 8rpx;
  padding: 15rpx 25rpx;
  font-size: 24rpx;
}

.add-spec-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx dashed #007AFF;
  border-radius: 12rpx;
  padding: 25rpx;
  color: #007AFF;
  gap: 10rpx;
  background: #f0f8ff;
}

.add-icon {
  font-size: 32rpx;
  font-weight: bold;
}

.spec-count {
  color: #666;
  font-size: 24rpx;
}

.warning-text {
  display: block;
  font-size: 24rpx;
  color: #ff6b35;
  margin-bottom: 20rpx;
  background: #fff3e0;
  padding: 15rpx;
  border-radius: 8rpx;
  line-height: 1.4;
}

.price-stock-container {
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  overflow: hidden;
}

.table {
  width: 100%;
}

.table-header {
  background: #f5f5f5;
}

.table-row {
  display: flex;
  border-bottom: 1rpx solid #e0e0e0;
}

.table-row:last-child {
  border-bottom: none;
}

.table-header-cell {
  flex: 1;
  padding: 20rpx 15rpx;
  font-size: 26rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  border-right: 1rpx solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-header-cell:last-child {
  border-right: none;
}

.required-field::after {
  content: '*';
  color: #ff4757;
  margin-left: 4rpx;
}

.table-body .table-row:nth-child(even) {
  background: #fafafa;
}

.table-cell {
  flex: 1;
  padding: 15rpx 10rpx;
  font-size: 26rpx;
  color: #333;
  text-align: center;
  border-right: 1rpx solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80rpx;
}

.table-cell:last-child {
  border-right: none;
}

.status-badge {
  background: #4CAF50;
  color: white;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  min-width: 80rpx;
  text-align: center;
}

.status-off {
  background: #ff6b35;
}

.batch-setting {
  background: #f8f9fa;
  padding: 20rpx;
  border-top: 1rpx solid #e0e0e0;
}

.batch-label {
  font-size: 26rpx;
  color: #333;
  margin-bottom: 15rpx;
  display: block;
  font-weight: bold;
}

.batch-inputs {
  display: flex;
  gap: 15rpx;
  align-items: center;
}

.batch-inputs .uni-easyinput {
  flex: 1;
}

.batch-btn {
  white-space: nowrap;
  background: #ff9800;
  color: white;
  border: none;
  border-radius: 8rpx;
  padding: 15rpx 25rpx;
  font-size: 24rpx;
}

.price-section {
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-top: 30rpx;
  border: 2rpx solid #e0e0e0;
}

.price-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.price-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.price-tip {
  font-size: 24rpx;
  color: #666;
}

.reference-price {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.reference-price .uni-easyinput {
  flex: 1;
}

.price-unit {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  min-width: 60rpx;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 50rpx;
  gap: 20rpx;
}

.btn {
  flex: 1;
  border: none;
  border-radius: 12rpx;
  padding: 25rpx;
  font-size: 28rpx;
  font-weight: bold;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-primary {
  background: #007AFF;
  color: white;
}

.btn-success {
  background: #4CAF50;
  color: white;
}

.btn-mini {
  padding: 15rpx 25rpx;
  font-size: 24rpx;
  flex: none;
}

.btn-mini.add-btn {
  background: #2196F3;
  color: white;
}

.btn-mini.batch-btn {
  background: #ff9800;
  color: white;
}

/* 响应式设计 */
@media (max-width: 750rpx) {
  .container {
    padding: 15rpx;
  }
  
  .upload-container {
    padding: 20rpx;
  }
  
  .steps {
    margin-bottom: 30rpx;
  }
  
  .step-number {
    width: 60rpx;
    height: 60rpx;
    font-size: 28rpx;
  }
  
  .step-text {
    font-size: 22rpx;
  }
  
  .picker-group {
    margin-bottom: 20rpx;
  }
  
  .upload-area {
    padding: 40rpx 20rpx;
  }
  
  .preview-item {
    width: 150rpx;
    height: 150rpx;
  }
  
  .spec-header {
    padding: 15rpx;
  }
  
  .spec-body {
    padding: 15rpx;
  }
  
  .spec-value-item {
    padding: 8rpx 15rpx;
    font-size: 22rpx;
  }
  
  .table-header-cell {
    padding: 15rpx 10rpx;
    font-size: 24rpx;
  }
  
  .table-cell {
    padding: 10rpx 5rpx;
    font-size: 24rpx;
  }
  
  .batch-inputs {
    flex-direction: column;
    gap: 10rpx;
  }
  
  .batch-inputs .uni-easyinput {
    width: 100%;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 15rpx;
  }
  
  .btn {
    width: 100%;
  }
}

/* 动画效果 */
.preview-item, .specification-container, .category-status {
  transition: all 0.3s ease;
}

.preview-item:hover, .specification-container:hover {
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.15);
  transform: translateY(-2rpx);
}

.btn {
  transition: all 0.3s ease;
}

.btn:active {
  transform: scale(0.98);
}

.btn:not(:disabled):hover {
  opacity: 0.9;
}

/* 滚动条样式 */
.step-content ::-webkit-scrollbar {
  width: 6rpx;
}

.step-content ::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10rpx;
}

.step-content ::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 10rpx;
}

.step-content ::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 输入框聚焦样式 */
.uni-easyinput:focus {
  border-color: #007AFF !important;
  box-shadow: 0 0 0 2rpx rgba(0, 122, 255, 0.2);
}

/* 禁用状态样式 */
.picker-text.disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

/* 加载动画 */
@keyframes loading {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-container {
  animation: loading 1.5s linear infinite;
}

/* 错误状态样式 */
.error-message {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10rpx); }
  75% { transform: translateX(10rpx); }
}

/* 成功状态样式 */
.category-status {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10rpx); }
  to { opacity: 1; transform: translateY(0); }
}

/* 图片预览悬停效果 */
.preview-item .remove {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.preview-item:hover .remove {
  opacity: 1;
}

/* 表格行悬停效果 */
.table-body .table-row:hover {
  background: #f0f8ff;
}

/* 规格值项悬停效果 */
.spec-value-item:hover {
  background: #bbdefb;
  transform: translateY(-1rpx);
}

/* 添加按钮悬停效果 */
.add-spec-btn:hover {
  background: #e3f2fd;
  border-color: #2196F3;
}

/* 批量设置区域样式 */
.batch-setting {
  transition: all 0.3s ease;
}

.batch-setting:hover {
  background: #e8f5e8;
}

/* 价格区域强调样式 */
.price-section {
  border-left: 4rpx solid #4CAF50;
}

/* 步骤指示器动画 */
.step-number {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.step.active .step-number {
  box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.3);
}

/* 分类选择器交互反馈 */
.picker:active {
  background: #f0f8ff;
  border-color: #007AFF;
}

/* 图片上传区域拖拽效果 */
.upload-area.drag-over {
  background: #e3f2fd;
  border-color: #2196F3;
  border-style: solid;
}

/* 状态徽章点击反馈 */
.status-badge:active {
  transform: scale(0.95);
}

/* 删除按钮危险色强调 */
.delete-spec:active {
  background: #ff4757;
  color: white;
}

/* 移动端优化 */
@media (max-width: 480rpx) {
  .title {
    font-size: 32rpx;
  }
  
  .subtitle {
    font-size: 22rpx;
  }
  
  .form-label {
    font-size: 26rpx;
  }
  
  .picker-text {
    font-size: 26rpx;
  }
  
  .upload-text {
    font-size: 26rpx;
  }
  
  .spec-value-item {
    font-size: 20rpx;
    padding: 6rpx 12rpx;
  }
  
  .table-header-cell {
    font-size: 22rpx;
    padding: 12rpx 8rpx;
  }
  
  .table-cell {
    font-size: 22rpx;
    padding: 8rpx 4rpx;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .container {
    background: #000;
    color: #fff;
  }
  
  .upload-container {
    background: #111;
    border: 2rpx solid #fff;
  }
  
  .step-number {
    border: 2rpx solid #fff;
  }
  
  .picker {
    border: 2rpx solid #fff;
    background: #222;
  }
  
  .picker-text {
    color: #fff;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>