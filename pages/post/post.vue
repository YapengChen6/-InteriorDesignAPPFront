<template>
  <view class="container">
    <!-- 第一部分：顶部切换 -->
    <view class="card">
      <view class="section-title">
        <uni-icons type="compose" size="18" color="#3498db"></uni-icons>
        <text>发布类型</text>
      </view>
      <view class="segmented-control">
        <view 
          class="segmented-control-item" 
          :class="{ active: postMode === 'new' }"
          @click="handleModeChange('new')">
          新增帖子
        </view>
        <view 
          class="segmented-control-item" 
          :class="{ active: postMode === 'draft' }"
          @click="handleModeChange('draft')">
          我的草稿
        </view>
      </view>
    </view>
    
    <!-- 第二部分：选择帖子类型 -->
    <view class="card">
      <view class="section-title">
        <uni-icons type="tags" size="18" color="#3498db"></uni-icons>
        <text>帖子类型</text>
      </view>
      <view class="type-selector">
        <view 
          class="type-item" 
          :class="{ active: postType === 1 }"
          @click="handleTypeChange(1)">
          <view class="type-icon">
            <uni-icons type="contact" size="24" :color="postType === 1 ? '#3498db' : '#666'"></uni-icons>
          </view>
          <view class="type-name">作品集</view>
          <view class="type-desc">展示个人作品</view>
        </view>
        <view 
          class="type-item" 
          :class="{ active: postType === 2 }"
          @click="handleTypeChange(2)">
          <view class="type-icon">
            <uni-icons type="folder" size="24" :color="postType === 2 ? '#3498db' : '#666'"></uni-icons>
          </view>
          <view class="type-name">案例集</view>
          <view class="type-desc">项目案例分析</view>
        </view>
        <view 
          class="type-item" 
          :class="{ active: postType === 3 }"
          @click="handleTypeChange(3)">
          <view class="type-icon">
            <uni-icons type="paperclip" size="24" :color="postType === 3 ? '#3498db' : '#666'"></uni-icons>
          </view>
          <view class="type-name">普通帖</view>
          <view class="type-desc">日常交流分享</view>
        </view>
        <view 
          class="type-item" 
          :class="{ active: postType === 4 }"
          @click="handleTypeChange(4)">
          <view class="type-icon">
            <uni-icons type="shop" size="24" :color="postType === 4 ? '#3498db' : '#666'"></uni-icons>
          </view>
          <view class="type-name">材料展示</view>
          <view class="type-desc">素材资源分享</view>
        </view>
      </view>
    </view>
    
    <!-- 第三部分：帖子表单 -->
    <view class="card">
      <view class="section-title">
        <uni-icons type="list" size="18" color="#3498db"></uni-icons>
        <text>帖子内容</text>
      </view>
      
   <view class="form-group">
     <view class="form-label">帖子标题</view>
     <uni-easyinput 
       type="text" 
       class="form-input" 
       v-model="postTitle" 
       placeholder="请输入帖子标题"
       placeholder-style="color: #c0c4cc"
       maxlength="100"
     />
   </view>
      
      <view class="form-group">
        <view class="form-label">插入图片或视频</view>
        <view class="media-upload" @click="handleMediaUpload">
          <view class="upload-icon">
            <uni-icons type="cloud-upload" size="40" color="#95a5a6"></uni-icons>
          </view>
          <view class="upload-text">点击上传图片或视频</view>
          <view class="upload-tip">支持 JPG, PNG, MP4 格式</view>
        </view>
        
        <!-- 媒体预览 -->
        <view class="media-preview" v-if="mediaFiles.length > 0">
          <view class="media-list">
            <view class="media-item" v-for="(media, index) in mediaFiles" :key="index">
              <image 
                v-if="media.type === 'image'" 
                :src="media.path" 
                class="media-image"
                mode="aspectFill"
                @click="previewImage(index)"
              />
              <video 
                v-else 
                :src="media.path" 
                class="media-video"
                controls
              />
              <view class="media-remove" @click="removeMedia(index)">
                <uni-icons type="close" size="16" color="#fff"></uni-icons>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <view class="form-group">
        <view class="form-label">帖子正文</view>
        <textarea 
          class="form-input textarea" 
          v-model="postContent" 
          placeholder="请输入帖子正文内容..."
          placeholder-style="color: #c0c4cc"
          maxlength="5000"
        />
        <view class="word-count">{{ postContent.length }}/5000</view>
      </view>
      
      <!-- 动态表单字段（根据帖子类型显示不同字段） -->
      <view class="form-group" v-if="postType === 1">
        <view class="form-label">项目类型</view>
        <input 
          type="text" 
          class="form-input" 
          v-model="portfolioFields.projectType" 
          placeholder="请输入项目类型"
          placeholder-style="color: #c0c4cc"
        />
      </view>
      
      <view class="form-group" v-if="postType === 2">
        <view class="form-label">案例背景</view>
        <textarea 
          class="form-input textarea" 
          v-model="caseStudyFields.caseBackground" 
          placeholder="请输入案例背景..."
          placeholder-style="color: #c0c4cc"
        />
      </view>
      
      <view class="form-group" v-if="postType === 4">
        <view class="form-label">材料类型</view>
        <input 
          type="text" 
          class="form-input" 
          v-model="materialShowFields.materialType" 
          placeholder="请输入材料类型"
          placeholder-style="color: #c0c4cc"
        />
      </view>
    </view>
    
    <!-- 第四部分：底部按钮 -->
    <view class="bottom-actions">
      <button class="btn btn-save" @click="saveDraft" :disabled="isSubmitting">
        {{ isSubmitting ? '保存中...' : '保存草稿' }}
      </button>
      <button class="btn btn-publish" @click="publishPost" :disabled="isSubmitting">
        {{ isSubmitting ? '发布中...' : '发布帖子' }}
      </button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      postMode: 'new', // 'new' 或 'draft'
      postType: 3, // 对应 threadType: 1-作品集, 2-案例集, 3-普通帖, 4-材料展示
      postTitle: '',
      postContent: '',
      roleType: 1, // 角色类型，根据用户信息设置
      mediaFiles: [], // 存储上传的媒体文件
      editingPostId: null, // 编辑时的帖子ID
      isSubmitting: false, // 防止重复提交
      
      // 不同类型帖子的特有字段
      portfolioFields: {
        projectType: '',
        completionDate: '',
        techStack: ''
      },
      caseStudyFields: {
        caseBackground: '',
        solution: '',
        result: ''
      },
      materialShowFields: {
        materialType: '',
        specifications: '',
        priceRange: ''
      },
      normalPostFields: {
        tags: [],
        isPublic: true
      }
    }
  },
  
  onLoad(options) {
    // 如果是编辑模式，从参数获取帖子ID并加载数据
    if (options.postId) {
      this.editingPostId = options.postId
      this.loadPostData(options.postId)
    }
  },
  
  methods: {
    // 处理模式切换
    handleModeChange(mode) {
      this.postMode = mode
    },
    
    // 处理类型切换
    handleTypeChange(type) {
      this.postType = type
    },
    
    // 加载帖子数据（编辑模式）
    loadPostData(postId) {
      // 这里可以调用API加载帖子数据
      console.log('加载帖子数据:', postId)
    },
    
    // 处理媒体上传
    handleMediaUpload() {
      uni.showActionSheet({
        itemList: ['选择图片', '选择视频'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.chooseImage()
          } else if (res.tapIndex === 1) {
            this.chooseVideo()
          }
        }
      })
    },
    
    // 选择图片
    chooseImage() {
      uni.chooseImage({
        count: 9 - this.mediaFiles.length, // 最多9个
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const newImages = res.tempFilePaths.map(path => ({
            type: 'image',
            path: path,
            uploadStatus: 'pending'
          }))
          this.mediaFiles = [...this.mediaFiles, ...newImages]
          uni.showToast({
            title: `已选择${res.tempFilePaths.length}张图片`,
            icon: 'success'
          })
        }
      })
    },
    
    // 选择视频
    chooseVideo() {
      uni.chooseVideo({
        sourceType: ['album', 'camera'],
        maxDuration: 60,
        camera: 'back',
        success: (res) => {
          this.mediaFiles.push({
            type: 'video',
            path: res.tempFilePath,
            duration: res.duration,
            size: res.size,
            uploadStatus: 'pending'
          })
          uni.showToast({
            title: '视频选择成功',
            icon: 'success'
          })
        }
      })
    },
    
    // 预览图片
    previewImage(index) {
      const imageUrls = this.mediaFiles
        .filter(media => media.type === 'image')
        .map(media => media.path)
      
      const currentIndex = this.mediaFiles
        .slice(0, index)
        .filter(media => media.type === 'image')
        .length
      
      uni.previewImage({
        urls: imageUrls,
        current: currentIndex
      })
    },
    
    // 删除媒体文件
    removeMedia(index) {
      uni.showModal({
        title: '提示',
        content: '确定要删除这个文件吗？',
        success: (res) => {
          if (res.confirm) {
            this.mediaFiles.splice(index, 1)
            uni.showToast({
              title: '删除成功',
              icon: 'success'
            })
          }
        }
      })
    },
    
    // 构建帖子数据
    buildPostData() {
      const baseData = {
        title: this.postTitle.trim(),
        content: this.postContent.trim(),
        roleType: this.roleType,
        threadType: this.postType
      }
      
      // 根据帖子类型设置对应的模板字段
      switch (this.postType) {
        case 1: // 作品集
          baseData.portfolio = {
            projectType: this.portfolioFields.projectType,
            completionDate: this.portfolioFields.completionDate,
            techStack: this.portfolioFields.techStack
          }
          break
        case 2: // 案例集
          baseData.caseStudy = {
            caseBackground: this.caseStudyFields.caseBackground,
            solution: this.caseStudyFields.solution,
            result: this.caseStudyFields.result
          }
          break
        case 3: // 普通帖
          baseData.normalPost = {
            tags: this.normalPostFields.tags,
            isPublic: this.normalPostFields.isPublic
          }
          break
        case 4: // 材料展示
          baseData.materialShow = {
            materialType: this.materialShowFields.materialType,
            specifications: this.materialShowFields.specifications,
            priceRange: this.materialShowFields.priceRange
          }
          break
      }
      
      return baseData
    },
    
    // 表单验证
    validateForm() {
      if (!this.postTitle.trim()) {
        uni.showToast({
          title: '请输入帖子标题',
          icon: 'none'
        })
        return false
      }
      
      if (this.postTitle.trim().length < 2) {
        uni.showToast({
          title: '标题至少需要2个字符',
          icon: 'none'
        })
        return false
      }
      
      if (!this.postContent.trim()) {
        uni.showToast({
          title: '请输入帖子内容',
          icon: 'none'
        })
        return false
      }
      
      return true
    },
    
    // 保存草稿
    async saveDraft() {
      if (this.isSubmitting) return
      
      if (!this.validateForm()) return
      
      this.isSubmitting = true
      
      try {
        const postData = this.buildPostData()
        
        // 这里调用保存草稿的API
        console.log('保存草稿数据:', postData)
        
        uni.showToast({
          title: '草稿保存成功',
          icon: 'success'
        })
        
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error('保存草稿失败:', error)
        uni.showToast({
          title: '保存草稿失败',
          icon: 'none'
        })
      } finally {
        this.isSubmitting = false
      }
    },
    
    // 发布帖子
    async publishPost() {
      if (this.isSubmitting) return
      
      if (!this.validateForm()) return
      
      this.isSubmitting = true
      
      try {
        const postData = this.buildPostData()
        
        // 这里调用发布帖子的API
        console.log('发布帖子数据:', postData)
        
        uni.showToast({
          title: '帖子发布成功',
          icon: 'success'
        })
        
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 发布成功后返回上一页
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
        
      } catch (error) {
        console.error('发布帖子失败:', error)
        uni.showToast({
          title: '发布帖子失败',
          icon: 'none'
        })
      } finally {
        this.isSubmitting = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  background-color: #f5f7fa;
  min-height: 100vh;
  padding: 15px;
  padding-bottom: 100px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

/* 第一部分：顶部切换 */
.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #2c3e50;
  display: flex;
  align-items: center;
}

.section-title text {
  margin-left: 8px;
}

.segmented-control {
  display: flex;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 5px;
}

.segmented-control-item {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.3s;
  cursor: pointer;
}

.segmented-control-item.active {
  background: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  color: #3498db;
}

/* 第二部分：帖子类型选择 */
.type-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
}

.type-item {
  flex: 1;
  min-width: 120px;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  padding: 15px 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.type-item.active {
  border-color: #3498db;
  background-color: rgba(52, 152, 219, 0.05);
  color: #3498db;
}

.type-icon {
  margin-bottom: 8px;
}

.type-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.type-desc {
  font-size: 12px;
  color: #7f8c8d;
}

/* 第三部分：表单 */
.form-group {
  margin-bottom: 20px;
  position: relative;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #2c3e50;
}

.form-input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  font-size: 15px;
  transition: border 0.3s;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #3498db;
}

.textarea {
  min-height: 150px;
}

.word-count {
  position: absolute;
  right: 10px;
  bottom: 10px;
  font-size: 12px;
  color: #95a5a6;
}

/* 媒体上传区域 */
.media-upload {
  border: 2px dashed #e1e8ed;
  border-radius: 8px;
  padding: 30px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 10px;
}

.media-upload:active {
  border-color: #3498db;
  background-color: rgba(52, 152, 219, 0.03);
}

.upload-icon {
  margin-bottom: 10px;
}

.upload-text {
  color: #7f8c8d;
  font-size: 14px;
  margin-bottom: 5px;
}

.upload-tip {
  color: #95a5a6;
  font-size: 12px;
}

/* 媒体预览 */
.media-preview {
  margin-top: 15px;
}

.media-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.media-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
}

.media-image {
  width: 100%;
  height: 100%;
}

.media-video {
  width: 100%;
  height: 100%;
}

.media-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* 第四部分：底部按钮 */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 15px;
  display: flex;
  gap: 15px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.08);
}

.btn {
  flex: 1;
  padding: 14px 0;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-publish {
  background: #3498db;
  color: white;
}

.btn-publish:active:not(:disabled) {
  background: #2980b9;
}

.btn-save {
  background: #f8f9fa;
  color: #7f8c8d;
  border: 1px solid #e1e8ed;
}

.btn-save:active:not(:disabled) {
  background: #e9ecef;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .container {
    padding: 10px;
    padding-bottom: 100px;
  }
  
  .card {
    padding: 15px;
  }
  
  .type-item {
    min-width: calc(50% - 6px);
    padding: 12px 5px;
  }
}
</style>