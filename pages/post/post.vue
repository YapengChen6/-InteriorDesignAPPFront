<template>
  <view class="container">
    <!-- 第一部分：选择帖子类型 -->
    <view class="card">
      <view class="section-title">
        <uni-icons type="tags" size="18" color="#3498db"></uni-icons>
        <text>帖子类型</text>
      </view>
      <view class="type-selector">
        <!-- 设计师角色显示：作品集 -->
        <view 
          v-if="showType('works')"
          class="type-item" 
          :class="{ active: threadType === 1 }"
          @click="handleTypeChange(1)">
          <view class="type-icon">
            <uni-icons type="contact" size="24" :color="threadType === 1 ? '#3498db' : '#666'"></uni-icons>
          </view>
          <view class="type-name">作品集</view>
          <view class="type-desc">展示个人作品</view>
        </view>
        
        <!-- 监工角色显示：案例集 -->
        <view 
          v-if="showType('cases')"
          class="type-item" 
          :class="{ active: threadType === 2 }"
          @click="handleTypeChange(2)">
          <view class="type-icon">
            <uni-icons type="list" size="24" :color="threadType === 2 ? '#3498db' : '#666'"></uni-icons>
          </view>
          <view class="type-name">案例集</view>
          <view class="type-desc">项目案例分析</view>
        </view>
        
        <!-- 所有角色都显示：普通帖 -->
        <view 
          v-if="showType('normal')"
          class="type-item" 
          :class="{ active: threadType === 3 }"
          @click="handleTypeChange(3)">
          <view class="type-icon">
            <uni-icons type="paperclip" size="24" :color="threadType === 3 ? '#3498db' : '#666'"></uni-icons>
          </view>
          <view class="type-name">普通帖</view>
          <view class="type-desc">日常交流分享</view>
        </view>
        
        <!-- 材料商角色显示：材料展示 -->
        <view 
          v-if="showType('materials')"
          class="type-item" 
          :class="{ active: threadType === 4 }"
          @click="handleTypeChange(4)">
          <view class="type-icon">
            <uni-icons type="shop" size="24" :color="threadType === 4 ? '#3498db' : '#666'"></uni-icons>
          </view>
          <view class="type-name">材料展示</view>
          <view class="type-desc">素材资源分享</view>
        </view>
      </view>
    </view>
    
    <!-- 第二部分：帖子表单 -->
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
          v-model="title" 
          placeholder="请输入帖子标题"
          placeholder-style="color: #c0c4cc"
          maxlength="100"
        />
      </view>

      <!-- 封面图上传 -->
      <view class="form-group">
        <view class="form-label">封面图</view>
        <view class="cover-upload" @click="handleCoverUpload">
          <view class="upload-icon">
            <uni-icons type="image" size="40" color="#95a5a6"></uni-icons>
          </view>
          <view class="upload-text">点击上传封面图</view>
          <view class="upload-tip">建议尺寸 750x400 像素</view>
        </view>
        
        <!-- 封面预览 -->
        <view class="cover-preview" v-if="coverUrl && coverUrl !== defaultCoverUrl">
          <image :src="coverUrl" class="cover-image" mode="aspectFill" @click="previewCover"></image>
          <view class="cover-remove" @click="removeCover">
            <uni-icons type="close" size="16" color="#fff"></uni-icons>
          </view>
        </view>
      </view>
      
      <!-- 根据帖子类型显示不同的扩展字段 -->
      
      <!-- 普通帖扩展字段 -->
      <view v-if="threadType === 3" class="form-group">
        <view class="form-label">装修类型</view>
        <uni-data-select
          v-model="normalPost.decorationType"
          :localdata="decorationTypes"
          placeholder="请选择装修类型"
        ></uni-data-select>
        
        <view class="form-label" style="margin-top: 15px;">预算估算(元)</view>
        <uni-easyinput 
          type="digit" 
          class="form-input" 
          v-model="normalPost.costEstimate" 
          placeholder="请输入预算金额"
        />
        
        <view class="form-label" style="margin-top: 15px;">是否分享到社区</view>
        <view class="switch-group">
          <text class="switch-label">分享到社区</text>
          <switch :checked="normalPost.isShared === 1" @change="onSharedChange" color="#3498db" />
        </view>
      </view>
      
      <!-- 作品集扩展字段 -->
      <view v-if="threadType === 1" class="form-group">
        <view class="form-label">项目名称</view>
        <uni-easyinput 
          type="text" 
          class="form-input" 
          v-model="portfolio.projectName" 
          placeholder="请输入项目名称"
        />
        
        <view class="form-label" style="margin-top: 15px;">设计风格</view>
        <uni-data-select
          v-model="portfolio.style"
          :localdata="designStyles"
          placeholder="请选择设计风格"
        ></uni-data-select>
        
        <view class="form-label" style="margin-top: 15px;">房屋面积(㎡)</view>
        <uni-easyinput 
          type="digit" 
          class="form-input" 
          v-model="portfolio.area" 
          placeholder="请输入房屋面积"
        />
        
        <view class="form-label" style="margin-top: 15px;">项目预算(元)</view>
        <uni-easyinput 
          type="digit" 
          class="form-input" 
          v-model="portfolio.budget" 
          placeholder="请输入项目预算"
        />
        
        <view class="form-label" style="margin-top: 15px;">设计方案</view>
        <textarea 
          class="form-input textarea" 
          v-model="portfolio.designScheme" 
          placeholder="请描述您的设计方案..."
          maxlength="500"
          style="min-height: 100px;"
        />
        <view class="word-count">{{ portfolio.designScheme.length }}/500</view>
        
        <view class="form-label" style="margin-top: 15px;">是否公开</view>
        <view class="switch-group">
          <text class="switch-label">公开作品</text>
          <switch :checked="portfolio.isPublic === 1" @change="onPublicChange" color="#3498db" />
        </view>
      </view>
      
      <!-- 案例集扩展字段 -->
      <view v-if="threadType === 2" class="form-group">
        <view class="form-label">项目名称</view>
        <uni-easyinput 
          type="text" 
          class="form-input" 
          v-model="caseStudy.projectName" 
          placeholder="请输入项目名称"
        />
        
        <view class="form-label" style="margin-top: 15px;">项目位置</view>
        <uni-easyinput 
          type="text" 
          class="form-input" 
          v-model="caseStudy.location" 
          placeholder="请输入项目详细位置"
        />
        
        <view class="form-label" style="margin-top: 15px;">施工单位</view>
        <uni-easyinput 
          type="text" 
          class="form-input" 
          v-model="caseStudy.constructionCompany" 
          placeholder="请输入施工单位名称"
        />
        
        <view class="form-row">
          <view class="form-col">
            <view class="form-label">开始日期</view>
            <uni-datetime-picker 
              type="date" 
              v-model="caseStudy.startDate" 
              placeholder="选择开始日期"
            />
          </view>
          <view class="form-col">
            <view class="form-label">完成日期</view>
            <uni-datetime-picker 
              type="date" 
              v-model="caseStudy.completionDate" 
              placeholder="选择完成日期"
            />
          </view>
        </view>
        
        <view class="form-label" style="margin-top: 15px;">案例描述</view>
        <textarea 
          class="form-input textarea" 
          v-model="caseStudy.description" 
          placeholder="请详细描述项目案例..."
          maxlength="1000"
          style="min-height: 120px;"
        />
        <view class="word-count">{{ caseStudy.description.length }}/1000</view>
      </view>
      
      <!-- 材料展示扩展字段 -->
      <view v-if="threadType === 4" class="form-group">
        <view class="form-label">材料名称</view>
        <uni-easyinput 
          type="text" 
          class="form-input" 
          v-model="materialShow.materialName" 
          placeholder="请输入材料名称"
        />
        
        <view class="form-label" style="margin-top: 15px;">材料类型</view>
        <uni-data-select
          v-model="materialShow.materialType"
          :localdata="materialTypes"
          placeholder="请选择材料类型"
        ></uni-data-select>
        
        <view class="form-label" style="margin-top: 15px;">品牌</view>
        <uni-easyinput 
          type="text" 
          class="form-input" 
          v-model="materialShow.brand" 
          placeholder="请输入品牌名称"
        />
        
        <view class="form-label" style="margin-top: 15px;">规格</view>
        <uni-easyinput 
          type="text" 
          class="form-input" 
          v-model="materialShow.specification" 
          placeholder="请输入材料规格"
        />
        
        <view class="form-row">
          <view class="form-col">
            <view class="form-label">价格</view>
            <uni-easyinput 
              type="digit" 
              class="form-input" 
              v-model="materialShow.price" 
              placeholder="请输入价格"
            />
          </view>
          <view class="form-col">
            <view class="form-label">单位</view>
            <uni-easyinput 
              type="text" 
              class="form-input" 
              v-model="materialShow.unit" 
              placeholder="如：元/桶"
            />
          </view>
        </view>
        
        <view class="form-label" style="margin-top: 15px;">供应商名称</view>
        <uni-easyinput 
          type="text" 
          class="form-input" 
          v-model="materialShow.supplierName" 
          placeholder="请输入供应商名称"
        />
        
        <view class="form-label" style="margin-top: 15px;">联系方式</view>
        <uni-easyinput 
          type="text" 
          class="form-input" 
          v-model="materialShow.contactInfo" 
          placeholder="请输入联系电话"
        />
        
        <view class="form-label" style="margin-top: 15px;">是否现货</view>
        <view class="switch-group">
          <text class="switch-label">有现货</text>
          <switch :checked="materialShow.isAvailable === 1" @change="onAvailableChange" color="#3498db" />
        </view>
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
        <view class="media-preview" v-if="previewMediaFiles.length > 0">
          <view class="media-list">
            <view class="media-item" v-for="(media, index) in previewMediaFiles" :key="index">
              <image 
                v-if="media.type === 'image'" 
                :src="media.tempFilePath" 
                class="media-image"
                mode="aspectFill"
                @click="previewImage(index)"
              />
              <video 
                v-else 
                :src="media.tempFilePath" 
                class="media-video"
                controls
              />
              <view class="media-remove" @click="removePreviewMedia(index)">
                <uni-icons type="close" size="16" color="#fff"></uni-icons>
              </view>
              <view class="media-status" v-if="media.uploadStatus === 'uploading'">
                <text class="status-text">上传中...</text>
              </view>
              <view class="media-status" v-else-if="media.uploadStatus === 'failed'">
                <text class="status-text error">上传失败</text>
              </view>
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
      
      <!-- 富文本编辑器 -->
      <view class="form-group">
        <view class="form-label">帖子正文</view>
        <view class="editor-container">
          <editor
            id="editor"
            class="editor"
            :placeholder="'请输入帖子正文内容...'"
            @ready="onEditorReady"
            @input="onEditorInput"
          ></editor>
        </view>
        
        <view class="word-count">{{ content.length }}/5000</view>
      </view>
    </view>
    
    <!-- 第三部分：底部按钮 -->
    <view class="bottom-actions">
      <button class="btn btn-publish" @click="publishPost" :disabled="isSubmitting">
        {{ isSubmitting ? '发布中...' : '发布帖子' }}
      </button>
    </view>
  </view>
</template>

<script>
import { createPost, updatePost, getPostDetail } from '@/api/community'
import { uploadImage } from '@/api/join.js' // 图片上传接口
import { uploadVideo } from '@/api/join.js' // 视频上传接口
import { getUserProfile } from '@/api/users.js'

export default {
  data() {
    return {
      postMode: 'new', // 'new' 或 'draft'
      threadType: 3, // 帖子类型：1-作品集, 2-案例集, 3-普通帖, 4-材料展示
      title: '',
      content: '',
      coverUrl: '', // 封面图URL - 必填字段
      categoryId: null, // 分类ID
      status: 1, // 帖子状态：0-草稿，1-发布
      previewMediaFiles: [], // 预览媒体文件（临时路径）
      uploadedMediaFiles: [], // 已上传的媒体文件（服务器返回的信息）
      editingPostId: null, // 编辑时的帖子ID
      isSubmitting: false, // 防止重复提交
      uploadProgress: 0, // 上传进度
      roleType: null, // 用户角色类型字符串：'user', 'designer', 'supervisor', 'material_supplier'
      
      // 角色权限配置
      rolePermissions: {
        user: {
          name: '普通用户',
          allowedTypes: ['normal'] // 只能发布普通帖
        },
        designer: {
          name: '设计师',
          allowedTypes: ['normal', 'works'] // 可以发布普通帖和作品集
        },
        supervisor: {
          name: '监工',
          allowedTypes: ['normal', 'cases'] // 可以发布普通帖和案例集
        },
        material_supplier: {
          name: '材料商',
          allowedTypes: ['normal', 'materials'] // 可以发布普通帖和材料展示
        }
      },
      
      // 富文本编辑器相关
      editor: null,
      
      // 默认封面图
      defaultCoverUrl: '/static/images/default-cover.jpg',
      
      // 封面图临时路径和上传状态
      coverTempFilePath: '',
      isCoverUploading: false,
      
      // 新增：封面图在媒体资源中的信息
      coverMediaInfo: null,
      
      // 普通帖扩展字段
      normalPost: {
        decorationType: '新房',
        costEstimate: 0,
        isShared: 1
      },
      
      // 作品集扩展字段
      portfolio: {
        designScheme: '',
        projectName: '',
        area: 0,
        style: '现代简约',
        budget: 0,
        version: 1,
        isPublic: 1
      },
      
      // 案例集扩展字段
      caseStudy: {
        projectName: '',
        location: '',
        startDate: '',
        completionDate: '',
        constructionCompany: '',
        description: ''
      },
      
      // 材料展示扩展字段
      materialShow: {
        materialName: '',
        materialType: '涂料',
        brand: '',
        specification: '',
        price: 0,
        unit: '',
        supplierName: '',
        contactInfo: '',
        isAvailable: 1
      },
      
      // 选择器数据
      decorationTypes: [
        { value: '新房', text: '新房' },
        { value: '旧房翻新', text: '旧房翻新' },
        { value: '局部改造', text: '局部改造' },
        { value: '商业空间', text: '商业空间' }
      ],
      
      designStyles: [
        { value: '现代简约', text: '现代简约' },
        { value: '北欧风格', text: '北欧风格' },
        { value: '工业风', text: '工业风' },
        { value: '新中式', text: '新中式' },
        { value: '欧式古典', text: '欧式古典' },
        { value: '美式乡村', text: '美式乡村' },
        { value: '日式', text: '日式' },
        { value: '混搭', text: '混搭' }
      ],
      
      materialTypes: [
        { value: '涂料', text: '涂料' },
        { value: '地板', text: '地板' },
        { value: '瓷砖', text: '瓷砖' },
        { value: '卫浴', text: '卫浴' },
        { value: '厨具', text: '厨具' },
        { value: '灯具', text: '灯具' },
        { value: '五金', text: '五金' },
        { value: '板材', text: '板材' },
        { value: '管材', text: '管材' },
        { value: '其他', text: '其他' }
      ]
    }
  },
  
  computed: {
    // 计算当前角色的默认帖子类型
    defaultThreadType() {
      const role = this.roleType || 'user'
      const permissions = this.rolePermissions[role]
      
      if (permissions.allowedTypes.includes('normal')) {
        return 3 // 普通帖
      } else if (permissions.allowedTypes.includes('works')) {
        return 1 // 作品集
      } else if (permissions.allowedTypes.includes('cases')) {
        return 2 // 案例集
      } else if (permissions.allowedTypes.includes('materials')) {
        return 4 // 材料展示
      }
      
      return 3 // 默认普通帖
    }
  },
  
  onLoad(options) {
    // 初始化时获取用户信息
    this.getUserRoleInfo()
    
    // 设置默认封面
    this.coverUrl = this.defaultCoverUrl
    
    // 如果是编辑模式，从参数获取帖子ID并加载数据
    if (options.postId) {
      this.editingPostId = options.postId
      this.loadPostData(options.postId)
    }
  },
  
  onUnload() {
    // 清理编辑器实例
    this.editor = null
  },
  
  methods: {
    // 获取用户角色信息
    async getUserRoleInfo() {
      try {
        const response = await getUserProfile()
        if (response.code === 200 && response.data) {
          const userData = response.data
          // 直接使用后端返回的角色类型字符串
          this.roleType = userData.role_type || userData.currentRoleType || 'user'
          console.log('用户角色信息:', {
            roleType: this.roleType,
            roleName: this.rolePermissions[this.roleType]?.name || '未知角色'
          })
          
          // 根据角色设置默认帖子类型
          this.threadType = this.defaultThreadType
          console.log('设置默认帖子类型:', this.threadType)
        }
      } catch (error) {
        console.error('获取用户角色信息失败:', error)
        // 如果获取失败，默认设为普通用户
        this.roleType = 'user'
        this.threadType = this.defaultThreadType
      }
    },
    
    // 判断是否显示某个帖子类型
    showType(type) {
      const role = this.roleType || 'user'
      const permissions = this.rolePermissions[role]
      
      if (!permissions) {
        // 如果没有权限配置，默认只显示普通帖
        return type === 'normal'
      }
      
      return permissions.allowedTypes.includes(type)
    },
    
    // 处理类型切换
    handleTypeChange(type) {
      this.threadType = type
    },
    
    // Switch 事件处理
    onSharedChange(e) {
      this.normalPost.isShared = e.detail.value ? 1 : 0
    },
    
    onPublicChange(e) {
      this.portfolio.isPublic = e.detail.value ? 1 : 0
    },
    
    onAvailableChange(e) {
      this.materialShow.isAvailable = e.detail.value ? 1 : 0
    },
    
    // 处理封面图上传
    handleCoverUpload() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0]
          // 保存临时路径用于后续上传
          this.coverTempFilePath = tempFilePath
          // 预览用临时路径
          this.coverUrl = tempFilePath
          console.log('封面图选择成功:', tempFilePath)
        },
        fail: (error) => {
          console.error('选择封面图失败:', error)
        }
      })
    },
    
    // 预览封面图
    previewCover() {
      if (this.coverUrl) {
        uni.previewImage({
          urls: [this.coverUrl]
        })
      }
    },
    
    // 移除封面图
    removeCover() {
      uni.showModal({
        title: '提示',
        content: '确定要移除封面图吗？',
        success: (res) => {
          if (res.confirm) {
            this.coverUrl = this.defaultCoverUrl
            this.coverTempFilePath = ''
            this.coverMediaInfo = null
          }
        }
      })
    },
    
    // 加载帖子数据（编辑模式）
    async loadPostData(postId) {
      try {
        uni.showLoading({
          title: '加载中...'
        })
        
        const response = await getPostDetail(postId)
        const postData = response.data
        
        // 填充表单数据
        this.title = postData.title
        this.content = postData.content
        this.threadType = postData.threadType
        this.categoryId = postData.categoryId
        this.status = postData.status
        this.coverUrl = postData.coverUrl || this.defaultCoverUrl
        
        // 加载扩展字段数据
        if (postData.normalPost) {
          this.normalPost = { ...this.normalPost, ...postData.normalPost }
        }
        if (postData.portfolio) {
          this.portfolio = { ...this.portfolio, ...postData.portfolio }
        }
        if (postData.caseStudy) {
          this.caseStudy = { ...this.caseStudy, ...postData.caseStudy }
        }
        if (postData.materialShow) {
          this.materialShow = { ...this.materialShow, ...postData.materialShow }
        }
        
        // 处理媒体文件（如果有的话，用于前端展示）
        if (postData.mediaUrls && postData.mediaUrls.length > 0) {
          this.uploadedMediaFiles = postData.mediaUrls.map(media => ({
            type: media.type || 'image',
            fileUrl: media.fileUrl,
            mediaId: media.mediaId,
            fileName: media.fileName,
            fileSize: media.fileSize,
            uploadStatus: 'completed'
          }))
        }
        
        uni.hideLoading()
        
        // 延迟设置编辑器内容，确保编辑器已初始化
        setTimeout(() => {
          if (this.editor && postData.content) {
            this.editor.setContents({
              html: postData.content
            })
          }
        }, 500)
        
      } catch (error) {
        console.error('加载帖子数据失败:', error)
        uni.hideLoading()
        uni.showToast({
          title: '加载帖子失败',
          icon: 'none'
        })
      }
    },
    
    // 富文本编辑器准备就绪
    onEditorReady() {
      // 注意：编辑器组件需要延时才能获取到实例
      setTimeout(() => {
        uni.createSelectorQuery()
          .in(this)
          .select('#editor')
          .context((res) => {
            this.editor = res.context
            console.log('编辑器实例:', this.editor)
            
            // 如果是在编辑模式且有内容，设置编辑器内容
            if (this.editingPostId && this.content) {
              this.editor.setContents({
                html: this.content
              })
            }
          })
          .exec()
      }, 200)
    },
    
    // 编辑器输入事件
    onEditorInput(e) {
      // 获取HTML内容
      this.editor.getContents({
        success: (res) => {
          this.content = res.html
          console.log('编辑器内容:', this.content)
        }
      })
    },
    
    // 处理媒体上传（仅选择，不上传）
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
    
    // 选择图片（仅预览）
    chooseImage() {
      uni.chooseImage({
        count: 9 - this.previewMediaFiles.length, // 最多9个
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
        }
      })
    },
    
    // 选择视频（仅预览）
    chooseVideo() {
      uni.chooseVideo({
        sourceType: ['album', 'camera'],
        maxDuration: 60,
        camera: 'back',
        success: (res) => {
          this.addPreviewMedia({
            type: 'video',
            tempFilePath: res.tempFilePath,
            fileInfo: {
              size: res.size,
              type: 'video/mp4'
            },
            uploadStatus: 'pending' // 等待上传
          })
        }
      })
    },
    
    // 添加预览媒体
    addPreviewMedia(media) {
      this.previewMediaFiles.push(media)
    },
    
    // 删除预览媒体
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
    
    // 预览图片
    previewImage(index) {
      const imageUrls = this.previewMediaFiles
        .filter(media => media.type === 'image')
        .map(media => media.tempFilePath)
      
      const currentIndex = this.previewMediaFiles
        .slice(0, index)
        .filter(media => media.type === 'image')
        .length
      
      uni.previewImage({
        urls: imageUrls,
        current: currentIndex
      })
    },
    
    // 上传封面图片
    async uploadCoverImage(postId) {
      if (!this.coverTempFilePath || this.coverTempFilePath.startsWith('http')) {
        console.log('无需上传封面图，使用默认封面或已有封面')
        return this.coverUrl
      }
      
      this.isCoverUploading = true
      
      try {
        const response = await uploadImage(
          this.coverTempFilePath,
          3, // relatedType: 固定为3（帖子类型）
          Number(postId), // relatedId: 帖子ID
          '帖子封面图', // description
          'post', // stage
          0 // sequence: 封面图序号为0
        )
        
        if (response.code === 200) {
          const coverUrl = response.data.fileUrl
          this.coverMediaInfo = {
            fileUrl: coverUrl,
            mediaId: response.data.mediaId,
            fileName: response.data.fileName
          }
          console.log('封面图上传成功:', coverUrl)
          return coverUrl
        } else {
          throw new Error(response.msg || '封面图上传失败')
        }
      } catch (error) {
        console.error('封面图上传失败:', error)
        throw error
      } finally {
        this.isCoverUploading = false
      }
    },
    
    // 批量上传媒体文件
    async uploadAllMediaFiles(postId) {
      const pendingMedia = this.previewMediaFiles.filter(media => media.uploadStatus === 'pending')
      
      if (pendingMedia.length === 0) {
        return this.uploadedMediaFiles
      }
      
      this.uploadProgress = 0
      const totalFiles = pendingMedia.length
      let completedFiles = 0
      
      for (let i = 0; i < pendingMedia.length; i++) {
        const media = pendingMedia[i]
        const index = this.previewMediaFiles.findIndex(m => m.tempFilePath === media.tempFilePath)
        
        if (index !== -1) {
          // 更新状态为上传中
          this.previewMediaFiles[index].uploadStatus = 'uploading'
          
          try {
            // 根据文件类型调用不同的上传接口
            const result = await this.uploadSingleMediaFile(
              media.tempFilePath, 
              media.type, 
              media.fileInfo, 
              postId,
              i + 1 // sequence从1开始（封面图是0）
            )
            
            if (result.code === 200) {
              // 上传成功，添加到已上传列表
              const uploadedMedia = {
                type: media.type,
                fileUrl: result.data.fileUrl,
                mediaId: result.data.mediaId,
                fileName: result.data.filename,
                fileSize: result.data.size,
                uploadStatus: 'completed'
              }
              this.uploadedMediaFiles.push(uploadedMedia)
              
              // 更新预览文件状态
              this.previewMediaFiles[index].uploadStatus = 'completed'
            } else {
              throw new Error(result.msg || result.message || '上传失败')
            }
          } catch (error) {
            console.error(`上传文件失败: ${media.tempFilePath}`, error)
            this.previewMediaFiles[index].uploadStatus = 'failed'
            throw error
          }
          
          // 更新进度
          completedFiles++
          this.uploadProgress = Math.round((completedFiles / totalFiles) * 100)
        }
      }
      
      return this.uploadedMediaFiles
    },
    
    // 上传单个媒体文件 - 图片使用图片接口，视频使用视频接口
    async uploadSingleMediaFile(filePath, fileType, fileInfo, postId, sequence = 1) {
      try {
        if (fileInfo.size > 50 * 1024 * 1024) {
          throw new Error('文件大小不能超过50MB')
        }
        
        // 统一的参数
        const relatedType = 3 // 固定为3，帖子类型
        const relatedId = postId ? Number(postId) : 0 // 使用传入的帖子ID
        const description = `帖子${fileType === 'image' ? '图片' : '视频'}`
        const stage = 'post'
        
        console.log('📤 上传文件参数:', {
          filePath,
          fileType,
          relatedType, // 固定为3
          relatedId,   // 帖子ID
          description,
          stage,
          sequence
        })
        
        let response
        if (fileType === 'image') {
          // 图片使用图片上传接口
          response = await uploadImage(
            filePath,
            relatedType,
            relatedId,
            description,
            stage,
            sequence
          )
        } else {
          // 视频使用视频上传接口
          response = await uploadVideo(
            filePath,
            relatedType,
            relatedId,
            description,
            stage,
            sequence
          )
        }
        
        console.log('✅ 上传成功:', response)
        return response
        
      } catch (error) {
        console.error('❌ 上传失败:', error)
        throw error
      }
    },
    
    // 构建帖子数据
    buildPostData() {
      const baseData = {
        title: this.title.trim(),
        coverUrl: this.defaultCoverUrl, // 先使用默认封面，后续上传后再更新
        content: this.content.trim(),
        threadType: this.threadType,
        status: this.status,
        roleType: this.getRoleTypeNumber() // 根据用户角色设置roleType
      }
      
      // 添加分类ID（根据帖子类型设置不同的categoryId）
      const categoryId = this.getCategoryIdByThreadType()
      if (categoryId) {
        baseData.categoryId = categoryId
      }
      
      // 根据帖子类型添加对应的扩展字段
      switch (this.threadType) {
        case 1: // 作品集
          baseData.portfolio = { ...this.portfolio }
          break
        case 2: // 案例集
          baseData.caseStudy = { ...this.caseStudy }
          break
        case 3: // 普通帖
          baseData.normalPost = { ...this.normalPost }
          break
        case 4: // 材料展示
          baseData.materialShow = { ...this.materialShow }
          break
      }
      
      console.log('📦 帖子数据:', baseData)
      return baseData
    },
    
    // 根据用户角色字符串返回对应的roleType数字
    getRoleTypeNumber() {
      const roleMap = {
        'user': 1,
        'designer': 2,
        'supervisor': 3,
        'material_supplier': 4
      }
      return roleMap[this.roleType] || 1
    },
    
    // 根据帖子类型设置对应的categoryId
    getCategoryIdByThreadType() {
      const categoryMap = {
        1: 10, // 作品集 -> 分类ID 10
        2: 12, // 案例集 -> 分类ID 12
        3: 8,  // 普通帖 -> 分类ID 8
        4: 20  // 材料展示 -> 分类ID 20
      }
      return categoryMap[this.threadType]
    },
    
    // 表单验证
    validateForm() {
      if (!this.title.trim()) {
        uni.showToast({
          title: '请输入帖子标题',
          icon: 'none'
        })
        return false
      }
      
      if (this.title.trim().length < 2) {
        uni.showToast({
          title: '标题至少需要2个字符',
          icon: 'none'
        })
        return false
      }
      
      // 检查必填字段coverUrl
      if (!this.coverUrl || this.coverUrl === this.defaultCoverUrl) {
        uni.showToast({
          title: '请上传封面图',
          icon: 'none'
        })
        return false
      }
      
      // 移除HTML标签后检查纯文本内容
      const textContent = this.content.replace(/<[^>]*>/g, '').trim()
      if (!textContent) {
        uni.showToast({
          title: '请输入帖子内容',
          icon: 'none'
        })
        return false
      }
      
      // 根据帖子类型验证扩展字段
      switch (this.threadType) {
        case 1: // 作品集验证
          if (!this.portfolio.projectName.trim()) {
            uni.showToast({
              title: '请输入项目名称',
              icon: 'none'
            })
            return false
          }
          if (!this.portfolio.designScheme.trim()) {
            uni.showToast({
              title: '请输入设计方案',
              icon: 'none'
            })
            return false
          }
          break
          
        case 2: // 案例集验证
          if (!this.caseStudy.projectName.trim()) {
            uni.showToast({
              title: '请输入项目名称',
              icon: 'none'
            })
            return false
          }
          if (!this.caseStudy.description.trim()) {
            uni.showToast({
              title: '请输入案例描述',
              icon: 'none'
            })
            return false
          }
          break
          
        case 4: // 材料展示验证
          if (!this.materialShow.materialName.trim()) {
            uni.showToast({
              title: '请输入材料名称',
              icon: 'none'
            })
            return false
          }
          if (!this.materialShow.brand.trim()) {
            uni.showToast({
              title: '请输入品牌名称',
              icon: 'none'
            })
            return false
          }
          break
      }
      
      return true
    },
    
    // 发布帖子
    async publishPost() {
      if (this.isSubmitting) return
      
      if (!this.validateForm()) return
      
      this.isSubmitting = true
      
      try {
        // 第一步：创建帖子（使用默认封面）
        const postData = this.buildPostData()
        postData.status = 1 // 发布状态
        
        console.log('🚀 发送创建帖子请求数据:', postData)
        
        let result
        let postId
        
        if (this.editingPostId) {
          // 编辑模式
          result = await updatePost(this.editingPostId, postData)
          postId = this.editingPostId
        } else {
          // 新建模式
          result = await createPost(postData)
          console.log('📝 创建帖子返回:', result)
          if (result.code === 200 && result.data) {
            postId = String(result.data)
            this.editingPostId = postId
            console.log('✅ 获取到帖子ID:', postId)
          } else {
            throw new Error('创建帖子失败: ' + (result.message || '未知错误'))
          }
        }
        
        // 第二步：上传封面图（如果有新选择的封面图）
        let finalCoverUrl = this.defaultCoverUrl
        if (this.coverTempFilePath && !this.coverTempFilePath.startsWith('http')) {
          uni.showLoading({
            title: '上传封面图中...'
          })
          try {
            finalCoverUrl = await this.uploadCoverImage(postId)
            console.log('✅ 封面图上传成功，URL:', finalCoverUrl)
          } catch (error) {
            console.error('封面图上传失败，使用默认封面:', error)
            // 封面图上传失败，继续使用默认封面
            finalCoverUrl = this.defaultCoverUrl
          } finally {
            uni.hideLoading()
          }
        } else if (this.coverUrl && this.coverUrl !== this.defaultCoverUrl) {
          // 如果封面图已经是网络URL（编辑模式），直接使用
          finalCoverUrl = this.coverUrl
        }
        
        // 第三步：更新帖子，设置最终的封面图URL
        if (finalCoverUrl !== this.defaultCoverUrl) {
          console.log('🔄 更新帖子封面图:', finalCoverUrl)
          const updateResult = await updatePost(postId, {
            coverUrl: finalCoverUrl
          })
          
          if (updateResult.code !== 200) {
            console.warn('更新帖子封面图失败，但帖子已发布')
          }
        }
        
        // 第四步：上传其他媒体文件
        if (this.previewMediaFiles.length > 0) {
          uni.showLoading({
            title: '上传文件中...'
          })
          await this.uploadAllMediaFiles(postId)
          uni.hideLoading()
        }
        
        uni.showToast({
          title: '帖子发布成功',
          icon: 'success'
        })
        
        // 清空预览文件
        this.previewMediaFiles = []
        this.coverTempFilePath = ''
        
        // 发布成功后返回上一页
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
        
      } catch (error) {
        console.error('发布帖子失败:', error)
        uni.showToast({
          title: '发布帖子失败: ' + (error.message || '未知错误'),
          icon: 'none'
        })
      } finally {
        this.isSubmitting = false
        this.uploadProgress = 0
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
  font-family: inherit;
}

.word-count {
  position: absolute;
  right: 10px;
  bottom: 10px;
  font-size: 12px;
  color: #95a5a6;
}

/* 表单行布局 */
.form-row {
  display: flex;
  gap: 15px;
}

.form-col {
  flex: 1;
}

/* Switch 组样式 */
.switch-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.switch-label {
  font-size: 15px;
  color: #2c3e50;
}

/* 封面图上传样式 */
.cover-upload {
  border: 2px dashed #e1e8ed;
  border-radius: 8px;
  padding: 30px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 10px;
}

.cover-upload:active {
  border-color: #3498db;
  background-color: rgba(52, 152, 219, 0.03);
}

.cover-preview {
  position: relative;
  width: 200px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  margin-top: 15px;
  border: 1px solid #e1e8ed;
}

.cover-image {
  width: 100%;
  height: 100%;
}

.cover-remove {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

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
  font-size: 12px;
  text-align: center;
}

.status-text.error {
  color: #e74c3c;
}

.upload-progress {
  margin-top: 15rpx;
  width: 100%;
}

.progress-text {
  font-size: 24rpx;
  color: #3498db;
  text-align: center;
  display: block;
  margin-bottom: 10rpx;
}

.progress-bar {
  width: 100%;
  height: 6rpx;
  background-color: #e0e0e0;
  border-radius: 3rpx;
  overflow: hidden;
}

.progress-inner {
  height: 100%;
  background-color: #3498db;
  border-radius: 3rpx;
  transition: width 0.3s ease;
}

/* 富文本编辑器样式 - 移除了工具栏 */
.editor-container {
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  overflow: hidden;
}

.editor {
  min-height: 300px;
  padding: 12px 15px;
  font-size: 15px;
  line-height: 1.6;
}

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
  
  .editor {
    min-height: 250px;
  }
  
  .cover-preview {
    width: 150px;
    height: 90px;
  }
  
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>