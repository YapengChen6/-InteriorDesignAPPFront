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
                    请先选择一级分类
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
                    请先选择二级分类
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
            <button class="btn btn-primary" hover-class="none" @tap="goToStep(2)" :disabled="!selectedCategory3Id">
              {{ selectedCategory3Id ? '下一步' : '请先选择完整分类' }}
            </button>
          </view>
        </view>
        
        <!-- 步骤2: 基本信息 -->
        <view v-if="currentStep === 2" class="step-panel">
          <view class="form-group">
            <text class="form-label">商品轮播图</text>
            <view class="upload-area" @tap="chooseImages" :class="{ 'drag-over': isDragOver }" 
                  @touchmove.prevent @touchend="isDragOver = false" @touchstart="isDragOver = true">
              <text class="upload-icon">📷</text>
              <text class="upload-text">点击上传商品图片</text>
              <text class="upload-tip">建议尺寸：800x800像素，最多10张</text>
              <text class="upload-tip" v-if="tempImageFiles.length > 0">
                已选择 {{ tempImageFiles.length }} 张图片待上传
              </text>
            </view>
            
            <!-- 上传状态提示 -->
            <view class="upload-status" v-if="uploading">
              <text class="upload-status-text">图片上传中... {{ uploadProgress }}%</text>
            </view>
            
            <view class="upload-tips">
              <text class="tip-text">• 支持 JPG、PNG 格式</text>
              <text class="tip-text">• 单张图片不超过 5MB</text>
              <text class="tip-text">• 建议尺寸：800x800 像素</text>
              <text class="tip-text">• 图片将在提交商品时上传</text>
            </view>
            
            <view class="image-preview">
              <!-- 已上传的图片 -->
              <view 
                v-for="(image, index) in productImages" 
                :key="index" 
                class="preview-item"
              >
                <image :src="image.url" class="preview-image" mode="aspectFill"></image>
                <view class="remove" @tap="removeImage(index)">×</view>
                <view class="upload-success">
                  <text class="success-icon">✓</text>
                </view>
              </view>
              
              <!-- 待上传的临时图片 -->
              <view 
                v-for="(file, index) in tempImageFiles" 
                :key="index" 
                class="preview-item temp-image"
              >
                <image :src="file.tempFilePath" class="preview-image" mode="aspectFill"></image>
                <view class="remove" @tap="removeTempImage(index)">×</view>
                <view class="upload-pending">
                  <text class="pending-text">待上传</text>
                </view>
              </view>
              
              <view v-if="productImages.length === 0 && tempImageFiles.length === 0" class="empty-preview">
                <text class="empty-text">暂无图片，请上传商品轮播图</text>
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
            <button class="btn btn-secondary" hover-class="none" @tap="goToStep(1)">上一步</button>
            <button class="btn btn-primary" hover-class="none" @tap="goToStep(3)" :disabled="productImages.length === 0 && tempImageFiles.length === 0">
              {{ (productImages.length > 0 || tempImageFiles.length > 0) ? '下一步' : '请先选择商品图片' }}
            </button>
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
                  <!-- 修改后的规格值添加区域 -->
                  <view class="add-value-container">
                    <view class="add-value-input-wrapper">
                      <uni-easyinput
                        v-model="spec.newValue"
                        placeholder="输入规格值"
                        :styles="specValueInputStyles"
                        :clearable="true"
                        @confirm="addSpecValue(spec.id)"
                      />
                    </view>
                    <button class="btn btn-mini add-value-btn" hover-class="none" @tap="addSpecValue(spec.id)">添加</button>
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
                  <button class="btn btn-mini batch-btn" hover-class="none" @tap="batchSetValues">应用</button>
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
            <button class="btn btn-secondary" hover-class="none" @tap="goToStep(2)">上一步</button>
            <button class="btn btn-success" hover-class="none" :disabled="loading" @tap="submitProduct">
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

// 导入图片上传相关API
import { uploadImage, deleteImage, updateImageInfo } from '@/api/join.js'

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
      
      // 商品图片 - 已上传的图片
      productImages: [], // { url: '', uploaded: boolean, mediaId: null, fileInfo: {} }
      
      // 临时图片文件（未上传）
      tempImageFiles: [], // { tempFilePath: '', size: 0, name: '' }
      
      uploading: false,
      uploadProgress: 0,
      isDragOver: false,
      
      // 商品数据
      productData: {
        productName: '',
        productDetail: '',
        categoryId: null,
        productStatus: '0',
        specType: '0',
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
        borderColor: '#e0e0e0',
        color: '#333',
        backgroundColor: '#fff'
      },
      specValueInputStyles: {
        borderColor: '#e0e0e0',
        color: '#333',
        backgroundColor: '#fff'
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
    
    // 图片上传 - 修改后的版本，只保存临时文件
    async chooseImages() {
      const totalImages = this.productImages.length + this.tempImageFiles.length
      if (totalImages >= 10) {
        uni.showToast({
          title: '最多只能上传10张图片',
          icon: 'none'
        })
        return
      }

      try {
        uni.showLoading({
          title: '选择图片中...',
          mask: true
        })

        // 使用 Promise 包装 uni.chooseImage
        const res = await new Promise((resolve, reject) => {
          uni.chooseImage({
            count: 10 - totalImages,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success: resolve,
            fail: reject
          })
        })

        uni.hideLoading()

        console.log('chooseImage 返回结果:', res)

        // 处理不同的返回结构
        let tempFiles = []
        if (res.tempFiles && Array.isArray(res.tempFiles)) {
          tempFiles = res.tempFiles
        } else if (res.tempFilePaths && Array.isArray(res.tempFilePaths)) {
          tempFiles = res.tempFilePaths.map(path => ({ path }))
        }

        if (tempFiles.length === 0) {
          throw new Error('未选择到有效图片')
        }

        console.log('提取到的图片文件:', tempFiles)

        // 保存到临时文件列表，不上传
        tempFiles.forEach(file => {
          this.tempImageFiles.push({
            tempFilePath: file.path || file.tempFilePath,
            size: file.size,
            name: file.name || `image_${Date.now()}.jpg`
          })
        })

        uni.showToast({
          title: `已选择 ${tempFiles.length} 张图片，提交时上传`,
          icon: 'success',
          duration: 2000
        })

      } catch (error) {
        uni.hideLoading()
        console.error('图片选择失败:', error)
        
        let errorMessage = '图片选择失败'
        if (error.errMsg) {
          if (error.errMsg.includes('cancel')) {
            errorMessage = '已取消选择'
          } else {
            errorMessage = error.errMsg
          }
        } else if (error.message) {
          errorMessage = error.message
        }
        
        uni.showToast({
          title: errorMessage,
          icon: 'none',
          duration: 2000
        })
      }
    },

    // 删除已上传图片
    async removeImage(index) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这张图片吗？',
        success: async (res) => {
          if (res.confirm) {
            const image = this.productImages[index]
            
            // 如果图片已上传到服务器，调用删除API
            if (image.mediaId) {
              try {
                console.log('🗑️ 删除服务器图片, mediaId:', image.mediaId)
                await deleteImage(image.mediaId)
              } catch (error) {
                console.error('删除服务器图片失败:', error)
              }
            }
            
            // 从预览列表中移除
            this.productImages.splice(index, 1)
            
            uni.showToast({
              title: '图片已删除',
              icon: 'success'
            })
          }
        }
      })
    },

    // 删除临时图片
    removeTempImage(index) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这张图片吗？',
        success: (res) => {
          if (res.confirm) {
            this.tempImageFiles.splice(index, 1)
            uni.showToast({
              title: '图片已删除',
              icon: 'success'
            })
          }
        }
      })
    },

    // 在创建SPU后上传图片
    async uploadProductImagesAfterSpuCreation(spuId) {
      if (this.tempImageFiles.length === 0) {
        return { success: true, uploadedCount: 0 }
      }

      this.uploading = true
      this.uploadProgress = 0

      try {
        uni.showLoading({
          title: '上传商品图片中...',
          mask: true
        })

        const uploadPromises = this.tempImageFiles.map(async (fileInfo, index) => {
          try {
            console.log(`🔄 上传第${index + 1}张商品图片`)
            
            // 使用SPU ID作为relatedId上传图片
            const relatedType = 5 // PRODUCT - 商品类型
            const relatedId = spuId // 使用生成的SPU ID
            const description = this.getProductImageDescription(index)
            const stage = 'PRODUCT_CAROUSEL'
            
            console.log('📋 商品图片上传参数:', {
              filePath: fileInfo.tempFilePath,
              relatedType,
              relatedId,
              description,
              stage,
              sequence: index
            })
            
            const response = await uploadImage(
              fileInfo.tempFilePath,
              relatedType,
              relatedId,
              description,
              stage,
              index
            )
            
            console.log('✅ 商品图片上传响应:', response)
            
            if (response.code === 200 && response.data) {
              const imageData = {
                ...response.data,
                fileUrl: response.data.fileUrl,
                mediaId: response.data.mediaId,
                fileName: response.data.fileName,
                fileSize: response.data.fileSize
              }
              
              // 添加到已上传图片列表
              this.productImages.push({
                url: imageData.fileUrl,
                uploaded: true,
                fileInfo: imageData,
                mediaId: imageData.mediaId
              })
              
              // 更新进度
              this.uploadProgress = Math.round(((index + 1) / this.tempImageFiles.length) * 100)
              
              return {
                success: true,
                data: imageData,
                index: index
              }
            } else {
              throw new Error(response.msg || response.message || '上传失败')
            }
          } catch (error) {
            console.error(`第${index + 1}张图片上传失败:`, error)
            return {
              success: false,
              error: error.message,
              index: index
            }
          }
        })

        const results = await Promise.all(uploadPromises)
        
        // 处理上传结果
        const successResults = results.filter(result => result.success)
        const failedResults = results.filter(result => !result.success)
        
        // 清空临时文件
        this.tempImageFiles = []
        
        uni.hideLoading()
        this.uploading = false
        
        return {
          success: failedResults.length === 0,
          uploadedCount: successResults.length,
          failedCount: failedResults.length,
          results: results
        }
        
      } catch (error) {
        uni.hideLoading()
        this.uploading = false
        console.error('图片上传过程出错:', error)
        throw error
      }
    },

    // 获取商品图片描述
    getProductImageDescription(sequence) {
      const descriptions = [
        '商品轮播图1',
        '商品轮播图2', 
        '商品轮播图3',
        '商品轮播图4',
        '商品轮播图5',
        '商品轮播图6',
        '商品轮播图7',
        '商品轮播图8',
        '商品轮播图9',
        '商品轮播图10'
      ]
      return descriptions[sequence] || `商品轮播图${sequence + 1}`
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
      this.productData.specType = this.specifications.length > 0 ? '2' : '0'
    },
    
    removeSpecification(specId) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个规格类型吗？',
        success: (res) => {
          if (res.confirm) {
            this.specifications = this.specifications.filter(spec => spec.id !== specId)
            this.generatePriceStockTable()
            this.productData.specType = this.specifications.length > 0 ? '2' : '0'
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
    
    // 构建SKU列表数据 - 根据ProductSkuDTO结构调整
    buildSkuList() {
      if (this.specifications.length === 0) {
        const item = this.priceStockData[0]
        return [{
          stockQuantity: Number(item.stock) || 0,
          salePrice: Number(item.singlePrice) || 0,
          costPrice: Number(item.singlePrice) * 0.8 || 0,
          skuStatus: item.status === 'on' ? '0' : '2', // 使用字符串 '0' 或 '2'
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
            stockQuantity: Number(item.stock) || 0,
            salePrice: Number(item.singlePrice) || 0,
            costPrice: Number(item.singlePrice) * 0.8 || 0,
            skuStatus: item.status === 'on' ? '0' : '2', // 使用字符串 '0' 或 '2'
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
    
    // 调试SPU数据
    debugSPUData() {
      const spuData = {
        productName: this.productData.productName.trim(),
        productDetail: this.productData.productDetail.trim(),
        categoryId: Number(this.selectedCategory3Id),
        productStatus: '0',
        specType: this.specifications.length > 0 ? '2' : '0',
        marketPrice: Number(this.referencePrice) || 0,
        costPrice: Number(this.referencePrice) * 0.8 || 0,
        stock: this.calculateTotalStock(),
        level1CategoryId: Number(this.selectedCategory1Id),
        level2CategoryId: Number(this.selectedCategory2Id)
      }

      if (this.specifications.length > 0) {
        spuData.skuList = this.buildSkuList()
      }

      console.log('🔍 SPU数据调试信息:')
      console.log('原始数据:', spuData)
      console.log('数据类型检查:')
      Object.keys(spuData).forEach(key => {
        if (key === 'skuList') {
          console.log(`  ${key}: Array(${spuData[key].length})`)
        } else {
          console.log(`  ${key}: ${spuData[key]} (${typeof spuData[key]})`)
        }
      })
      
      // 检查是否有空值或无效值
      const invalidFields = Object.keys(spuData).filter(key => {
        if (key === 'skuList') return false // 跳过skuList检查
        const value = spuData[key]
        return value === null || value === undefined || value === '' || (typeof value === 'number' && isNaN(value))
      })
      
      if (invalidFields.length > 0) {
        console.warn('❌ 无效字段:', invalidFields)
      } else {
        console.log('✅ 所有字段都有效')
      }
      
      return spuData
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
      if (this.productImages.length === 0 && this.tempImageFiles.length === 0) {
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
    
    // 显示提交结果
    showSubmitResult(result) {
      const { spuId, imageUploadResult, hasImages, hasSpecs, tempImagesCount } = result
      
      let message = '商品创建成功！\n'
      message += `商品ID: ${spuId}\n`
      
      if (hasImages) {
        message += `图片: ${this.productImages.length}张\n`
      }
      
      if (tempImagesCount > 0) {
        if (imageUploadResult.success) {
          message += `新上传图片: ${imageUploadResult.uploadedCount}张成功\n`
        } else {
          message += `新上传图片: ${imageUploadResult.uploadedCount}/${tempImagesCount}张成功\n`
          message += `部分图片上传失败，请稍后重试\n`
        }
      }
      
      if (hasSpecs) {
        message += `规格: ${this.priceStockData.length}个SKU创建成功\n`
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
          已上传图片数量: this.productImages.length,
          待上传图片数量: this.tempImageFiles.length,
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
          categoryId: Number(this.selectedCategory3Id),
          productStatus: '0',
          specType: this.specifications.length > 0 ? '2' : '0',
          marketPrice: Number(this.referencePrice) || 0,
          costPrice: Number(this.referencePrice) * 0.8 || 0,
          stock: this.calculateTotalStock(),
          level1CategoryId: Number(this.selectedCategory1Id),
          level2CategoryId: Number(this.selectedCategory2Id)
        }

        console.log('提交SPU数据:', spuData)
        
        // 2. 如果有规格，构建SKU列表
        if (this.specifications.length > 0) {
          const skuList = this.buildSkuList()
          console.log('SKU列表:', skuList)
          spuData.skuList = skuList
        }
        
        // 3. 创建SPU（包含SKU列表）
        const spuResponse = await addProductSpu(spuData)
        
        if (spuResponse.code === 200) {
          const spuId = spuResponse.data
          
          console.log('SPU创建成功，ID:', spuId)
          
          // 4. 如果有待上传的图片，使用SPU ID上传图片
          let imageUploadResult = { success: true, uploadedCount: 0 }
          if (this.tempImageFiles.length > 0) {
            try {
              imageUploadResult = await this.uploadProductImagesAfterSpuCreation(spuId)
              console.log('图片上传结果:', imageUploadResult)
            } catch (uploadError) {
              console.error('图片上传失败:', uploadError)
              imageUploadResult = {
                success: false,
                error: uploadError.message,
                uploadedCount: 0
              }
              
              // 图片上传失败，但SPU已创建成功，仍然显示成功，但提示图片上传问题
              uni.showToast({
                title: '商品创建成功，但部分图片上传失败',
                icon: 'none',
                duration: 3000
              })
            }
          }
          
          uni.hideLoading()
          
          // 5. 显示最终结果
          this.showSubmitResult({
            spuId,
            imageUploadResult,
            hasImages: this.productImages.length > 0,
            hasSpecs: this.specifications.length > 0,
            tempImagesCount: this.tempImageFiles.length
          })
          
        } else {
          console.error('SPU创建失败响应:', spuResponse)
          let errorMessage = spuResponse.message || '创建商品失败'
          
          if (spuResponse.data && Array.isArray(spuResponse.data) && spuResponse.data.length > 0) {
            const fieldErrors = spuResponse.data.map(error => {
              return `${error.field || '字段'}: ${error.message || '校验失败'}`
            })
            errorMessage += `\n${fieldErrors.join('\n')}`
          }
          
          throw new Error(errorMessage)
        }
        
      } catch (error) {
        uni.hideLoading()
        console.error('提交商品失败:', error)
        uni.showToast({
          title: error.message || '提交失败，请重试',
          icon: 'none',
          duration: 5000
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
  padding-top: calc(20rpx + env(safe-area-inset-top));
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: #f5f7fb;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft Yahei', sans-serif;
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
  border-radius: 32rpx;
  padding: 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
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
  background: linear-gradient(135deg, #e5e7eb, #d1d5db);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 10rpx;
  transition: all 0.3s;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.step.active .step-number {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  box-shadow: 0 4rpx 16rpx rgba(37, 99, 235, 0.4);
  transform: scale(1.1);
}

.step-text {
  font-size: 26rpx;
  color: #9ca3af;
  font-weight: 500;
  transition: all 0.3s;
}

.step.active .step-text {
  color: #2563eb;
  font-weight: 600;
}

.step-content {
  max-height: calc(100vh - 400rpx);
  padding-bottom: env(safe-area-inset-bottom);
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
  border: 2rpx solid #e5e7eb;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
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
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  border: 2rpx solid #10b981;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-top: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(16, 185, 129, 0.2);
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
  background: linear-gradient(135deg, #fee2e2, #fecaca);
  border: 2rpx solid #ef4444;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-top: 20rpx;
  text-align: center;
  box-shadow: 0 2rpx 8rpx rgba(239, 68, 68, 0.2);
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
  border: 2rpx dashed #3b82f6;
  border-radius: 24rpx;
  padding: 60rpx 30rpx;
  text-align: center;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  transition: all 0.3s ease;
}

.upload-area.drag-over {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-color: #2563eb;
  border-style: solid;
  transform: scale(1.02);
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

.upload-status {
  background: #e3f2fd;
  border: 1rpx solid #2196F3;
  border-radius: 8rpx;
  padding: 15rpx;
  margin-top: 15rpx;
  text-align: center;
}

.upload-status-text {
  font-size: 24rpx;
  color: #1976D2;
}

.upload-tips {
  margin-top: 15rpx;
  padding: 0 10rpx;
}

.tip-text {
  display: block;
  font-size: 22rpx;
  color: #666;
  margin-bottom: 5rpx;
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
  border-radius: 20rpx;
  overflow: hidden;
  border: 2rpx solid #e5e7eb;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
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
  z-index: 2;
}

.upload-success {
  position: absolute;
  bottom: 8rpx;
  right: 8rpx;
  width: 30rpx;
  height: 30rpx;
  background: #4CAF50;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18rpx;
  font-weight: bold;
}

.upload-pending {
  position: absolute;
  bottom: 8rpx;
  right: 8rpx;
  width: 60rpx;
  height: 30rpx;
  background: #ff9800;
  color: white;
  border-radius: 15rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18rpx;
  font-weight: bold;
}

.pending-text {
  font-size: 18rpx;
}

.success-icon {
  font-size: 18rpx;
}

.empty-preview {
  width: 100%;
  padding: 40rpx;
  text-align: center;
  background: #f9f9f9;
  border-radius: 12rpx;
  border: 2rpx dashed #e0e0e0;
}

.empty-text {
  font-size: 26rpx;
  color: #999;
}

.description-container {
  margin-top: 10rpx;
}

.specifications-container {
  margin-bottom: 30rpx;
}

.specification-container {
  border: 2rpx solid #e5e7eb;
  border-radius: 24rpx;
  margin-bottom: 30rpx;
  overflow: hidden;
  background: white;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
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
  margin-right: 20rpx;
}

.delete-spec {
  color: #ff4757;
  font-size: 26rpx;
  padding: 8rpx 16rpx;
  border-radius: 6rpx;
  background: #fff5f5;
  border: 1rpx solid #ff4757;
  white-space: nowrap;
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

.add-value-container {
  display: flex;
  gap: 15rpx;
  align-items: center;
  width: 100%;
}

.add-value-input-wrapper {
  flex: 1;
  min-width: 0;
}

.add-value-btn {
  color: #2563eb;
  font-size: 26rpx;
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  white-space: nowrap;
  border: 1rpx solid #3b82f6;
  height: auto;
  line-height: 1.4;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 120rpx;
  box-shadow: 0 2rpx 8rpx rgba(37, 99, 235, 0.2);
}

.add-spec-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx dashed #007AFF;
  border-radius: 12rpx;
  padding: 20rpx;
  color: #007AFF;
  gap: 8rpx;
  background: #f0f8ff;
  font-size: 26rpx;
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
  border: 2rpx solid #e5e7eb;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.table {
  width: 100%;
}

.table-header {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
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
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
  padding: 10rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  min-width: 80rpx;
  text-align: center;
  box-shadow: 0 2rpx 8rpx rgba(16, 185, 129, 0.3);
}

.status-off {
  background: linear-gradient(135deg, #ef4444, #f87171);
  box-shadow: 0 2rpx 8rpx rgba(239, 68, 68, 0.3);
}

.batch-setting {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  padding: 24rpx;
  border-top: 1rpx solid #e5e7eb;
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
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-top: 30rpx;
  border: 2rpx solid #e5e7eb;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
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
  margin-bottom: env(safe-area-inset-bottom);
  gap: 20rpx;
  padding-bottom: 20rpx;
}

.btn {
  flex: 1;
  border: none;
  border-radius: 24rpx;
  padding: 28rpx;
  font-size: 30rpx;
  font-weight: 600;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.btn::after {
  display: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: linear-gradient(135deg, #6c757d, #5a6268);
  color: white;
}

.btn-primary {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white;
}

.btn-success {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
}

.btn-mini {
  padding: 16rpx 28rpx;
  font-size: 26rpx;
  flex: none;
  border-radius: 20rpx;
}

.btn-mini::after {
  display: none;
}

.btn-mini.batch-btn {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
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
    flex-direction: column;
    gap: 15rpx;
  }
  
  .spec-name-input {
    margin-right: 0;
    width: 100%;
  }
  
  .delete-spec {
    align-self: flex-end;
  }
  
  .spec-body {
    padding: 15rpx;
  }
  
  .spec-value-item {
    padding: 8rpx 15rpx;
    font-size: 22rpx;
  }
  
  .add-value-container {
    flex-direction: column;
    gap: 10rpx;
  }
  
  .add-value-input-wrapper {
    width: 100%;
  }
  
  .add-value-btn {
    width: 100%;
    min-width: auto;
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
</style>