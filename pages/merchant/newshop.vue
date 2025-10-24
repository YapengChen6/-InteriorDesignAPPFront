<template>
  <view class="page">
    

    <!-- 表单区域 -->
    <scroll-view scroll-y class="form-scroll">
      <view class="card">
        <view class="form-container">
          <h2 class="form-title">上架新产品</h2>

          <!-- 产品名称 -->
          <view class="form-group">
            <text class="form-label">产品名称</text>
            <input
              v-model="productData.name"
              type="text"
              class="editor-input"
              placeholder="点击输入产品名称"
              maxlength="20"
              confirm-type="done"
            />
          </view>

          <!-- 产品类别 -->
          <view class="form-group">
            <text class="form-label">产品类别</text>
            <picker
              @change="onCategoryChange"
              :value="categoryIndex"
              :range="categoryOptions"
            >
              <view class="picker-box">
                {{ categoryIndex >= 0 ? categoryOptions[categoryIndex] : '选择装修设计类别' }}
              </view>
            </picker>
          </view>

          <!-- 价格 -->
          <view class="form-group">
            <text class="form-label">价格</text>
            <input
              v-model="productData.price"
              type="digit"
              class="editor-input"
              placeholder="点击输入价格"
              maxlength="10"
              confirm-type="done"
            />
          </view>

          <!-- 上架状态 -->
          <view class="form-group">
            <text class="form-label">上架状态</text>
            <picker
              @change="onStatusChange"
              :value="statusIndex"
              :range="statusOptions"
            >
              <view class="picker-box">
                {{ statusOptions[statusIndex] }}
              </view>
            </picker>
          </view>

          <!-- 产品描述 -->
          <view class="form-group">
            <text class="form-label">产品描述</text>
            <textarea
              v-model="productData.description"
              class="form-textarea"
              placeholder="点击输入描述"
            />
          </view>

          <!-- 规格参数 -->
          <view class="form-group">
            <view class="spec-header">
              <text class="form-label">规格参数</text>
              <button class="add-btn" @tap="addSpecItem">+ 添加规格</button>
            </view>
            <view class="spec-list">
              <view class="spec-item" v-for="(spec, i) in specList" :key="i">
                <input v-model="spec.name" class="spec-input" placeholder="参数名" />
                <input v-model="spec.value" class="spec-input" placeholder="参数值" />
                <text class="remove-btn" @tap="removeSpecItem(i)">×</text>
              </view>
            </view>
          </view>

          <!-- 产品图片 -->
          <view class="form-group">
            <text class="form-label">产品图片</text>
            <button class="file-btn" @tap="chooseImage">选择图片</button>
            <text class="file-text">{{ imageFile || '未选择文件' }}</text>
          </view>

          <!-- 子产品 -->
          <view class="form-group">
            <view class="subproduct-header">
              <text class="form-label">子产品</text>
              <button class="add-btn" @tap="addSubproductItem">+ 添加子产品</button>
            </view>
            <view class="subproduct-list">
              <view class="subproduct-item" v-for="(sub, i) in subproductList" :key="i">
                <input v-model="sub.name" class="subproduct-input" placeholder="子产品名称" />
                <input v-model="sub.price" class="subproduct-input" placeholder="子产品价格" type="digit" />
                <text class="remove-btn" @tap="removeSubproductItem(i)">×</text>
              </view>
            </view>
          </view>

          <!-- 操作按钮 -->
          <view class="action-buttons">
            <button class="btn btn-cancel" @tap="handleCancel">取消</button>
            <button class="btn btn-save" @tap="handleSave">⚡ 保存产品</button>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      productData: { name: '', price: '', description: '' },
      categoryOptions: ['家具', '灯具', '地板', '墙纸', '装饰品', '厨房用品', '卫浴用品'],
      categoryIndex: -1,
      statusOptions: ['已上架', '未上架'],
      statusIndex: 0,
      imageFile: '',
      specList: [{ name: '', value: '' }],
      subproductList: []
    }
  },
  methods: {
    onCategoryChange(e) { this.categoryIndex = +e.detail.value },
    onStatusChange(e) { this.statusIndex = +e.detail.value },
    chooseImage() {
      uni.chooseImage({
        count: 1,
        success: (res) => { this.imageFile = res.tempFilePaths[0] }
      })
    },
    addSpecItem() { this.specList.push({ name: '', value: '' }) },
    removeSpecItem(i) {
      if (this.specList.length > 1) this.specList.splice(i, 1)
    },
    addSubproductItem() { this.subproductList.push({ name: '', price: '' }) },
    removeSubproductItem(i) { this.subproductList.splice(i, 1) },
    handleClose() { uni.navigateBack() },
    handleCancel() {
      uni.showModal({
        title: '确认取消',
        content: '确定要取消吗？所有未保存的更改将会丢失。',
        success: (res) => { if (res.confirm) uni.navigateBack() }
      })
    },
    handleSave() {
      if (!this.productData.name) return uni.showToast({ title: '请输入产品名称', icon: 'none' })
      if (this.categoryIndex < 0) return uni.showToast({ title: '请选择产品类别', icon: 'none' })
      if (!this.productData.price) return uni.showToast({ title: '请输入价格', icon: 'none' })

      const productInfo = {
        ...this.productData,
        category: this.categoryOptions[this.categoryIndex],
        status: this.statusOptions[this.statusIndex],
        image: this.imageFile,
        specs: this.specList.filter(s => s.name && s.value),
        subproducts: this.subproductList.filter(s => s.name && s.price)
      }
      console.log('保存产品', productInfo)
      uni.showToast({
        title: '保存成功',
        success: () => setTimeout(() => uni.navigateBack(), 1500)
      })
    }
  }
}
</script>

<style>
.page {
  min-height: 100vh;
  background-color: #f3f4f6;
  padding-top: 60rpx;
}

.form-scroll {
  height: calc(100vh - 60rpx);
}
.card {
  margin: 0 32rpx 32rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
}
.form-title {
  font-size: 36rpx;
  font-weight: 600;
  margin-bottom: 32rpx;
}
.form-label {
  display: block;
  font-size: 28rpx;
  color: #374151;
  margin-bottom: 12rpx;
}
.editor-input,
.picker-box,
.form-textarea,
.spec-input,
.subproduct-input {
  width: 100%;
  padding: 24rpx;
  border: 2rpx solid #d1d5db;
  border-radius: 8rpx;
  font-size: 28rpx;
  background: #fff;
}
.form-textarea {
  height: 160rpx;
}
.spec-header,
.subproduct-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}
.add-btn {
  font-size: 24rpx;
  color: #2563eb;
  background: none;
  padding: 0;
}
.spec-list,
.subproduct-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.spec-item,
.subproduct-item {
  display: flex;
  gap: 16rpx;
  align-items: center;
}
.remove-btn {
  color: #9ca3af;
  font-size: 40rpx;
  line-height: 1;
  padding: 0 12rpx;
}
.file-btn {
  font-size: 24rpx;
  padding: 12rpx 24rpx;
  background: #e5e7eb;
  color: #374151;
  border-radius: 8rpx;
  margin-bottom: 8rpx;
}
.file-text {
  font-size: 24rpx;
  color: #6b7280;
}
.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 24rpx;
  margin-top: 40rpx;
}
.btn {
  padding: 24rpx 40rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  font-weight: 500;
}
.btn-cancel {
  background: #fed7aa;
  color: #ea580c;
}
.btn-save {
  background: #7c3aed;
  color: #fff;
}
</style>