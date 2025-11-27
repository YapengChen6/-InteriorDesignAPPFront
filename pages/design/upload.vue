<template>
	<view class="container">
		<!-- 顶部导航栏 -->
		<view class="header-section">
			<view class="header-back" @click="goBack">
				<view class="back-btn">
					<text class="back-icon">‹</text>
					<text class="back-text">返回</text>
				</view>
			</view>
			<view class="header-title">{{ pageTitle }}</view>
		</view>

		<!-- 内容区域 -->
		<scroll-view class="content" scroll-y="true">
			<!-- 方案基本信息卡片 -->
			<view class="card">
				<view class="card-header">
					<view class="card-icon">📋</view>
					<text class="card-title">方案信息</text>
				</view>
				<view class="card-body">
					<view class="form-group">
						<view class="form-label required">方案名称</view>
						<input 
							class="form-input" 
							v-model="schemeName"
							placeholder="请输入方案名称"
							placeholder-class="placeholder"
							maxlength="50"
						/>
						<view class="input-counter">{{ schemeName.length }}/50</view>
					</view>
					
					<view class="info-row">
						<view class="info-item">
							<view class="info-label">方案类型</view>
							<view class="info-value tag">{{ schemeTypeText }}</view>
						</view>
						<view class="info-item">
							<view class="info-label">订单号</view>
							<view class="info-value">DD{{ orderId }}</view>
						</view>
					</view>
				</view>
			</view>

			<!-- 文件上传卡片 -->
			<view class="card">
				<view class="card-header">
					<view class="card-icon">📎</view>
					<text class="card-title">方案文件</text>
					<view class="card-subtitle">{{ fileList.length }}/1 个</view>
				</view>
				<view class="card-body">
					<view class="upload-tips">
						<view class="tips-content">
							<text class="tips-icon">💡</text>
							<text class="tips-text">支持图片(JPG/PNG)、文档(PDF/DOC/DOCX)、压缩包等格式，文件不超过20MB，只能上传1个文件</text>
						</view>
					</view>
					
					<!-- 文件上传区域 -->
					<view class="file-upload-area" @click="chooseFiles" v-if="fileList.length === 0">
						<view class="upload-content">
							<view class="upload-icon">
								<image class="upload-icon-img" src="/static/images/upload-icon.png" mode="aspectFit"></image>
							</view>
							<view class="upload-text">点击上传方案文件</view>
							<view class="upload-desc">单个文件不超过20MB</view>
							<view class="upload-count">支持图片、文档、压缩包格式</view>
						</view>
					</view>

					<!-- 文件预览区域 -->
					<view class="file-preview" v-if="fileList.length > 0">
						<view class="file-list">
							<view class="file-item" v-for="(file, index) in fileList" :key="index">
								<view class="file-wrapper">
									<view class="file-icon" :class="getFileTypeClass(file.type)">
										<text class="file-type-icon">{{ getFileTypeIcon(file.type) }}</text>
									</view>
									<view class="file-info">
										<view class="file-name">{{ file.name }}</view>
										<view class="file-meta">
											<text class="file-size">{{ formatFileSize(file.size) }}</text>
											<text class="file-type">{{ getFileTypeText(file.type) }}</text>
										</view>
										<view class="file-progress" v-if="file.uploading">
											<view class="progress-container">
												<view class="progress-bar">
													<view class="progress-fill" :style="{ width: file.progress + '%' }"></view>
												</view>
												<text class="progress-text">{{ file.progress }}%</text>
											</view>
										</view>
										<view class="file-status" v-else-if="file.url">
											<view class="status-badge success">
												<text class="status-icon">✓</text>
												<text class="status-text">上传成功</text>
											</view>
										</view>
										<view class="file-status" v-else>
											<view class="status-badge ready">
												<text class="status-icon">📁</text>
												<text class="status-text">待上传</text>
											</view>
										</view>
									</view>
									<view class="file-actions">
										<button class="btn-action preview" @click.stop="previewFile(index)">
											<text class="btn-icon">👁️</text>
											<text class="btn-text">预览</text>
										</button>
										<button class="btn-action delete" @click.stop="removeFile(index)">
											<text class="btn-icon">🗑️</text>
											<text class="btn-text">删除</text>
										</button>
									</view>
								</view>
							</view>
						</view>
					</view>

					<!-- 上传数量提示 -->
					<view class="upload-count-tip" v-if="fileList.length > 0">
						<text class="count-text">已选择 1/1 个文件</text>
					</view>
				</view>
			</view>

			<!-- 方案说明卡片 -->
			<view class="card">
				<view class="card-header">
					<view class="card-icon">📝</view>
					<text class="card-title">方案说明</text>
				</view>
				<view class="card-body">
					<view class="form-group">
						<view class="form-label required">设计说明</view>
						<textarea 
							class="form-textarea" 
							v-model="description"
							placeholder="请详细描述设计方案，包括设计理念、材料选择、施工要点等..."
							placeholder-class="textarea-placeholder"
							maxlength="500"
							:show-confirm-bar="false"
						/>
						<view class="textarea-counter">{{ description.length }}/500</view>
					</view>
				</view>
			</view>

			<!-- 底部操作区域 -->
			<view class="bottom-actions">
				<view class="action-buttons">
					<button class="btn btn-cancel" @click="goBack">
						<text class="btn-text">取消</text>
					</button>
					<button 
						class="btn btn-submit" 
						@click="submitScheme" 
						:disabled="submitting || !isFormValid"
						:class="{ 'btn-disabled': submitting || !isFormValid }"
					>
						<view class="btn-loading" v-if="submitting">
							<view class="loading-spinner"></view>
						</view>
						<text class="btn-text">{{ submitting ? '提交中...' : '提交方案' }}</text>
					</button>
				</view>
			</view>
		</scroll-view>

		<!-- 文件预览弹窗 -->
		<view class="preview-modal" v-if="showPreview">
			<view class="preview-overlay" @click="closePreview"></view>
			<view class="preview-content">
				<view class="preview-header">
					<text class="preview-title">{{ previewFileName }}</text>
					<view class="preview-actions">
						<button class="btn-download" @click="downloadFile" v-if="previewUrl">
							<text class="btn-icon">⬇️</text>
							<text class="btn-text">下载</text>
						</button>
						<button class="btn-close" @click="closePreview">
							<text class="btn-icon">✕</text>
						</button>
					</view>
				</view>
				<view class="preview-body">
					<image 
						v-if="isImageFile(previewFileType)" 
						:src="previewUrl" 
						class="preview-image"
						mode="aspectFit"
					/>
					<iframe 
						v-else-if="previewFileType.includes('pdf')" 
						:src="previewUrl" 
						class="preview-iframe"
					/>
					<view v-else class="preview-unsupported">
						<text class="unsupported-icon">📄</text>
						<text class="unsupported-text">当前文件类型不支持在线预览</text>
						<text class="unsupported-desc">请下载后使用本地应用打开</text>
						<button class="btn-download-large" @click="downloadFile">
							<text class="btn-icon">⬇️</text>
							<text class="btn-text">下载文件</text>
						</button>
					</view>
				</view>
			</view>
		</view>

		<!-- 全局加载遮罩 -->
		<view class="global-loading" v-if="loading">
			<view class="loading-modal">
				<view class="loading-content">
					<view class="loading-spinner large"></view>
					<text class="loading-text">文件上传中，请稍候...</text>
					<text class="loading-subtext">请不要关闭页面</text>
					<text class="loading-progress">已上传 {{ uploadedCount }}/{{ fileList.length }} 个</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { uploadDocument } from '@/api/join.js'
	import { updateDesignScheme } from '@/api/designScheme.js'
	import { updateDesignSchemeStatus } from '@/api/designScheme.js'
	
	// 文件相关常量
	const RELATED_TYPES = {
		DESIGN_SCHEME: 10  // 设计方案类型
	}
	
	// 文件类型常量
	const FILE_TYPES = {
		EFFECT: 1,      // 效果图
		CONSTRUCTION: 2 // 施工设计图
	}

	// 最大上传数量
	const MAX_UPLOAD_COUNT = 1
	
	// 支持的文件类型
	const SUPPORTED_FILE_TYPES = {
		// 图片类型
		'image/jpeg': 'image',
		'image/jpg': 'image',
		'image/png': 'image',
		'image/gif': 'image',
		'image/bmp': 'image',
		'image/webp': 'image',
		
		// 文档类型
		'application/pdf': 'document',
		'application/msword': 'document',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
		'application/vnd.ms-excel': 'document',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'document',
		'application/vnd.ms-powerpoint': 'document',
		'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'document',
		'text/plain': 'document',
		
		// 压缩包类型
		'application/zip': 'archive',
		'application/x-rar-compressed': 'archive',
		'application/x-7z-compressed': 'archive',
		'application/x-tar': 'archive',
		'application/gzip': 'archive'
	}
	
	export default {
		data() {
			return {
				// 页面参数
				orderId: null,
				schemeId: null,
				schemeType: null,
				pageTitle: '方案上传',
				
				// 方案数据
				schemeName: '',
				description: '',
				
				// 文件列表
				fileList: [],
				
				// 状态控制
				loading: false,
				submitting: false,
				uploadedCount: 0,
				
				// 预览相关
				showPreview: false,
				previewUrl: '',
				previewFileName: '',
				previewFileType: ''
			}
		},
		
		computed: {
			// 方案类型文本
			schemeTypeText() {
				return this.schemeType === 'effect' ? '效果图' : '施工设计图'
			},
			
			// 文件类型数值
			fileTypeValue() {
				return this.schemeType === 'effect' ? FILE_TYPES.EFFECT : FILE_TYPES.CONSTRUCTION
			},
			
			// 表单验证
			isFormValid() {
				return this.schemeName.trim() && 
					   this.description.trim() && 
					   this.fileList.length > 0
			},
			
			// 剩余可上传数量
			remainingCount() {
				return MAX_UPLOAD_COUNT - this.fileList.length
			},
			
			// 参数是否有效
			isParamsValid() {
				return this.orderId && this.schemeId && this.schemeType
			},
			
			// 是否可预览
			isPreviewable() {
				return this.previewFileType && (
					this.isImageFile(this.previewFileType) || 
					this.previewFileType.includes('pdf')
				)
			}
		},
		
		onLoad(options) {
			console.log('📝 设计方案上传页面参数:', options)
			this.initPageParams(options)
		},
		
		methods: {
			// 初始化页面参数
			initPageParams(options) {
				try {
					// 解析参数
					this.orderId = options.orderId ? parseInt(options.orderId) : null
					this.schemeId = options.schemeId ? parseInt(options.schemeId) : null
					this.schemeType = options.schemeType || null
					this.pageTitle = options.title || '方案上传'
					
					console.log('🔍 解析后的参数:', {
						orderId: this.orderId,
						schemeId: this.schemeId,
						schemeType: this.schemeType,
						pageTitle: this.pageTitle
					})
					
					// 验证必要参数
					if (!this.isParamsValid) {
						console.error('❌ 参数缺失:', {
							orderId: this.orderId,
							schemeId: this.schemeId,
							schemeType: this.schemeType
						})
						
						uni.showModal({
							title: '参数错误',
							content: '缺少必要的参数，无法继续操作',
							showCancel: false,
							confirmText: '返回',
							success: () => {
								uni.navigateBack()
							}
						})
						return
					}
					
					// 验证 schemeType 是否有效
					if (!['effect', 'construction'].includes(this.schemeType)) {
						console.error('❌ 无效的方案类型:', this.schemeType)
						uni.showModal({
							title: '参数错误',
							content: '方案类型参数无效',
							showCancel: false,
							confirmText: '返回',
							success: () => {
								uni.navigateBack()
							}
						})
						return
					}
					
					// 初始化方案名称
					this.schemeName = `${this.schemeTypeText}方案_${this.orderId}`
					
					console.log('✅ 页面初始化完成:', {
						orderId: this.orderId,
						schemeId: this.schemeId,
						schemeType: this.schemeType,
						fileTypeValue: this.fileTypeValue,
						pageTitle: this.pageTitle,
						maxUploadCount: MAX_UPLOAD_COUNT
					})
					
				} catch (error) {
					console.error('❌ 参数解析失败:', error)
					uni.showModal({
						title: '初始化失败',
						content: '页面参数解析失败，请返回重试',
						showCancel: false,
						confirmText: '返回',
						success: () => {
							uni.navigateBack()
						}
					})
				}
			},
			
			// 返回上一页
			goBack() {
				uni.navigateBack()
			},
			
			// 选择文件
			chooseFiles() {
				if (!this.isParamsValid) {
					this.showParamsError()
					return
				}
				
				const remainingCount = MAX_UPLOAD_COUNT - this.fileList.length
				if (remainingCount <= 0) {
					uni.showToast({
						title: `只能上传${MAX_UPLOAD_COUNT}个文件`,
						icon: 'none'
					})
					return
				}
				
				uni.chooseFile({
					count: remainingCount,
					type: 'all',
					extension: Object.keys(SUPPORTED_FILE_TYPES),
					success: (res) => {
						console.log('📁 选择的文件:', res)
						this.handleSelectedFiles(res.tempFiles)
					},
					fail: (error) => {
						console.error('❌ 选择文件失败:', error)
						uni.showToast({
							title: '选择文件失败',
							icon: 'none'
						})
					}
				})
			},
			
			// 处理选择的文件
			handleSelectedFiles(tempFiles) {
				// 如果已有文件，先清空
				if (this.fileList.length > 0) {
					this.fileList = []
				}
				
				const newFiles = tempFiles.map((file, index) => {
					const fileType = this.getFileType(file.type)
					return {
						path: file.path,
						name: file.name || `文件${this.fileList.length + index + 1}.${this.getFileExtension(file.path)}`,
						size: file.size,
						type: fileType,
						uploading: false,
						progress: 0,
						url: null,
						fileType: file.type
					}
				})
				
				this.fileList = [...this.fileList, ...newFiles]
				console.log('📋 更新后的文件列表:', this.fileList)
				
				// 如果超过最大数量，截取前1个
				if (this.fileList.length > MAX_UPLOAD_COUNT) {
					this.fileList = this.fileList.slice(0, MAX_UPLOAD_COUNT)
					uni.showToast({
						title: `只能上传${MAX_UPLOAD_COUNT}个文件，已自动截取`,
						icon: 'none'
					})
				}
			},
			
			// 获取文件类型
			getFileType(mimeType) {
				return SUPPORTED_FILE_TYPES[mimeType] || 'other'
			},
			
			// 获取文件扩展名
			getFileExtension(filePath) {
				return filePath.split('.').pop().toLowerCase()
			},
			
			// 获取文件类型图标
			getFileTypeIcon(fileType) {
				const icons = {
					'image': '🖼️',
					'document': '📄',
					'archive': '📦',
					'other': '📎'
				}
				return icons[fileType] || '📎'
			},
			
			// 获取文件类型CSS类
			getFileTypeClass(fileType) {
				return `file-type-${fileType}`
			},
			
			// 获取文件类型文本
			getFileTypeText(fileType) {
				const texts = {
					'image': '图片',
					'document': '文档',
					'archive': '压缩包',
					'other': '文件'
				}
				return texts[fileType] || '文件'
			},
			
			// 格式化文件大小
			formatFileSize(bytes) {
				if (bytes === 0) return '0 Bytes';
				const k = 1024;
				const sizes = ['Bytes', 'KB', 'MB', 'GB'];
				const i = Math.floor(Math.log(bytes) / Math.log(k));
				return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
			},
			
			// 预览文件 - 处理 blob: 协议和其他文件路径
			previewFile(index) {
				const file = this.fileList[index]
				console.log('🔍 预览文件信息:', file)
				
				// 获取文件路径
				const filePath = file.path
				
				if (!filePath) {
					uni.showToast({
						title: '文件未选择或已失效',
						icon: 'none'
					})
					return
				}
				
				// 处理 blob: 协议路径（H5环境）
				if (filePath.startsWith('blob:')) {
					this.handleBlobFilePreview(filePath, file.name, file.fileType || file.type)
				} else {
					// 正常的小程序临时文件路径
					this.previewLocalFile(filePath, file.name, file.fileType || file.type)
				}
			},

			// 处理 blob: 协议文件预览（H5环境）- 在当前页面预览
			handleBlobFilePreview(blobUrl, fileName, fileType) {
				console.log('🌐 处理blob文件预览:', { blobUrl, fileName, fileType })
				
				// 设置预览数据
				this.previewUrl = blobUrl
				this.previewFileName = fileName
				this.previewFileType = fileType
				this.showPreview = true
			},

			// 预览本地临时文件（小程序环境）
			previewLocalFile(filePath, fileName, fileType) {
				console.log('📂 预览本地文件:', { filePath, fileName, fileType })
				
				uni.showLoading({
					title: '打开文件中...',
					mask: true
				})
				
				// 如果是图片，使用图片预览
				if (this.isImageFile(fileType)) {
					uni.previewImage({
						urls: [filePath],
						current: 0,
						success: () => {
							uni.hideLoading()
							console.log('✅ 图片预览成功')
						},
						fail: (error) => {
							uni.hideLoading()
							console.error('❌ 图片预览失败:', error)
							uni.showToast({
								title: '图片预览失败',
								icon: 'none'
							})
						}
					})
				} else {
					// 其他文件类型使用 openDocument
					uni.openDocument({
						filePath: filePath,
						success: () => {
							uni.hideLoading()
							console.log('✅ 文档打开成功')
						},
						fail: (error) => {
							uni.hideLoading()
							console.error('❌ 文档打开失败:', error)
							
							// 简化错误处理
							if (error.errMsg.includes('file not found')) {
								uni.showToast({
									title: '文件不存在',
									icon: 'none'
								})
							} else {
								uni.showToast({
									title: '暂不支持预览此文件类型',
									icon: 'none'
								})
							}
						}
					})
				}
			},

			// 判断是否为图片文件
			isImageFile(fileType) {
				const imageTypes = [
					'image/jpeg', 'image/jpg', 'image/png', 
					'image/gif', 'image/bmp', 'image/webp'
				]
				return imageTypes.includes(fileType) || fileType === 'image'
			},
			
			// 关闭预览
			closePreview() {
				this.showPreview = false
				this.previewUrl = ''
				this.previewFileName = ''
				this.previewFileType = ''
			},
			
			// 下载文件
			downloadFile() {
				if (!this.previewUrl) return
				
				const link = document.createElement('a')
				link.href = this.previewUrl
				link.download = this.previewFileName
				document.body.appendChild(link)
				link.click()
				document.body.removeChild(link)
				
				uni.showToast({
					title: '文件下载中...',
					icon: 'none'
				})
			},
			
			// 删除文件
			removeFile(index) {
				uni.showModal({
					title: '确认删除',
					content: '确定要删除这个文件吗？',
					confirmColor: '#FF4757',
					success: (res) => {
						if (res.confirm) {
							this.fileList.splice(index, 1)
							uni.showToast({
								title: '删除成功',
								icon: 'success'
							})
						}
					}
				})
			},
			
			// 上传单个文件
			async uploadSingleFile(file, index) {
				if (!this.isParamsValid) {
					throw new Error('参数无效，无法上传文件')
				}
				
				return new Promise((resolve, reject) => {
					// 更新文件状态
					this.fileList[index].uploading = true
					this.fileList[index].progress = 0
					
					// 准备上传参数
					const relatedType = RELATED_TYPES.DESIGN_SCHEME
					const relatedId = this.orderId
					const description = `${this.schemeTypeText}_${this.schemeName}_${file.name}`
					const stage = 'DESIGN_SCHEME'
					
					console.log('📤 上传文件参数:', {
						relatedType,
						relatedId,
						description,
						stage,
						fileType: this.fileTypeValue,
						orderId: this.orderId,
						schemeId: this.schemeId,
						fileName: file.name,
						fileSize: file.size
					})
					
					// 使用 join.js 中的 uploadDocument 接口
					uploadDocument(
						file.path,
						relatedType,
						relatedId,
						description,
						stage
					).then(result => {
						console.log('✅ 文件上传成功:', result)
						
						// 根据 join.js 接口返回结构获取文件URL
						let fileUrl = null
						if (result.fileUrl) {
							fileUrl = result.fileUrl
						} else if (result.data?.fileUrl) {
							fileUrl = result.data.fileUrl
						} else if (result.data?.url) {
							fileUrl = result.data.url
						} else if (result.url) {
							fileUrl = result.url
						}
						
						if (fileUrl) {
							this.fileList[index].url = fileUrl
							this.fileList[index].uploading = false
							this.fileList[index].progress = 100
							this.uploadedCount++
							resolve({
								fileUrl: fileUrl,
								fileInfo: result.documentInfo || result.data
							})
						} else {
							throw new Error('未获取到文件URL，返回数据:' + JSON.stringify(result))
						}
					}).catch(error => {
						console.error('❌ 文件上传失败:', error)
						this.fileList[index].uploading = false
						this.fileList[index].progress = 0
						reject(error)
					})
				})
			},
			
			// 上传所有文件
			async uploadAllFiles() {
				if (!this.isParamsValid) {
					throw new Error('参数无效，无法上传文件')
				}
				
				const uploadPromises = []
				this.uploadedCount = 0
				
				for (let i = 0; i < this.fileList.length; i++) {
					const file = this.fileList[i]
					if (!file.url && !file.uploading) {
						uploadPromises.push(this.uploadSingleFile(file, i))
					} else if (file.url) {
						this.uploadedCount++
					}
				}
				
				if (uploadPromises.length === 0) {
					return Promise.resolve([])
				}
				
				this.loading = true
				try {
					const results = await Promise.allSettled(uploadPromises)
					this.loading = false
					
					// 处理上传结果
					const successfulUploads = []
					const failedUploads = []
					
					results.forEach((result, index) => {
						if (result.status === 'fulfilled') {
							successfulUploads.push(result.value)
						} else {
							failedUploads.push({
								index: index,
								error: result.reason
							})
						}
					})
					
					if (failedUploads.length > 0) {
						console.error('❌ 文件上传失败:', failedUploads)
						throw new Error('文件上传失败')
					}
					
					return successfulUploads
				} catch (error) {
					this.loading = false
					throw error
				}
			},
			
			// 提交方案
			async submitScheme() {
				if (this.submitting) return
				
				if (!this.isParamsValid) {
					this.showParamsError()
					return
				}
				
				// 表单验证
				if (!this.schemeName.trim()) {
					uni.showToast({
						title: '请输入方案名称',
						icon: 'none'
					})
					return
				}
				
				if (!this.description.trim()) {
					uni.showToast({
						title: '请输入设计说明',
						icon: 'none'
					})
					return
				}
				
				if (this.fileList.length === 0) {
					uni.showToast({
						title: '请上传文件',
						icon: 'none'
					})
					return
				}
				
				this.submitting = true
				
				try {
					// 1. 上传所有文件
					const uploadResults = await this.uploadAllFiles()
					
					// 2. 获取成功上传的文件URL
					const fileUrls = uploadResults.map(result => result.fileUrl).filter(url => url)
					
					if (fileUrls.length === 0) {
						throw new Error('文件上传失败')
					}
					
					// 3. 使用上传的文件URL
					const mainFileUrl = fileUrls[0]
					
					// 4. 更新设计方案信息 - 移除status字段
					const updateData = {
						designSchemeId: this.schemeId,
						fileUrl: mainFileUrl,
						description: this.description,
						orderId: this.orderId,
						schemeType: this.fileTypeValue
					}
					
					console.log('📤 更新设计方案数据:', {
						...updateData,
						schemeTypeText: this.schemeTypeText,
						originalSchemeType: this.schemeType
					})
					
					// 5. 先更新方案信息
					const updateResult = await updateDesignScheme(updateData)
					
					if (updateResult.code === 200) {
						console.log('✅ 方案信息更新成功')
						
						// 6. 再更新方案状态为1（已提交）
						const statusResult = await updateDesignSchemeStatus(
							this.schemeId,
							1, // 状态码1
							`${this.schemeTypeText}方案已提交`
						)
						
						if (statusResult.code === 200) {
							console.log('✅ 方案状态更新成功:', statusResult)
							uni.showToast({
								title: `${this.schemeTypeText}提交成功`,
								icon: 'success',
								duration: 2000
							})
							
							setTimeout(() => {
								this.refreshOrderPage()
							}, 1500)
							
						} else {
							throw new Error(statusResult.msg || '更新方案状态失败')
						}
						
					} else {
						throw new Error(updateResult.msg || '更新方案信息失败')
					}
					
				} catch (error) {
					console.error('❌ 提交方案失败:', error)
					uni.showToast({
						title: error.message || '提交方案失败',
						icon: 'none',
						duration: 3000
					})
				} finally {
					this.submitting = false
				}
			},
			
			// 显示参数错误提示
			showParamsError() {
				uni.showModal({
					title: '参数错误',
					content: '页面参数不完整，无法进行操作',
					showCancel: false,
					confirmText: '返回',
					success: () => {
						uni.navigateBack()
					}
				})
			},
			
			// 刷新订单页面
			refreshOrderPage() {
				try {
					const pages = getCurrentPages()
					if (pages.length >= 2) {
						const prevPage = pages[pages.length - 2]
						// 检查是否是订单页面
						if (prevPage.route && prevPage.route.includes('order/my-order')) {
							// 调用订单页面的刷新方法
							if (prevPage.$vm && prevPage.$vm.loadOrderList) {
								prevPage.$vm.pagination.pageNum = 1
								prevPage.$vm.loadOrderList()
							}
						}
					}
				} catch (error) {
					console.error('刷新订单页面失败:', error)
				} finally {
					uni.navigateBack()
				}
			}
		}
	}
</script>

<style scoped>
	/* 全局样式优化 */
	.container {
		min-height: 100vh;
		background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ec 100%);
	}
	
	/* 顶部导航栏样式优化 */
	.header-section {
		position: sticky;
		top: 0;
		z-index: 999;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		padding: 32rpx 32rpx 24rpx;
		border-bottom: 1rpx solid rgba(225, 228, 232, 0.8);
		display: flex;
		align-items: center;
		box-shadow: 0 2rpx 20rpx rgba(0, 0, 0, 0.08);
	}
	
	.header-back {
		flex-shrink: 0;
	}
	
	.back-btn {
		display: flex;
		align-items: center;
		padding: 16rpx 24rpx;
		border-radius: 12rpx;
		transition: all 0.3s ease;
		background: rgba(24, 144, 255, 0.1);
	}
	
	.back-btn:active {
		background: rgba(24, 144, 255, 0.2);
		transform: scale(0.95);
	}
	
	.back-icon {
		font-size: 48rpx;
		color: #1890ff;
		line-height: 1;
		font-weight: bold;
	}
	
	.back-text {
		font-size: 28rpx;
		color: #1890ff;
		margin-left: 8rpx;
		font-weight: 500;
	}
	
	.header-title {
		flex: 1;
		text-align: center;
		font-size: 36rpx;
		font-weight: 600;
		color: #1f2329;
		margin-right: 120rpx;
	}
	
	/* 内容区域样式优化 */
	.content {
		height: calc(100vh - 120rpx);
		padding: 24rpx;
	}
	
	/* 卡片样式优化 */
	.card {
		background: #fff;
		border-radius: 24rpx;
		margin-bottom: 24rpx;
		overflow: hidden;
		box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.06);
		border: 1rpx solid rgba(225, 228, 232, 0.6);
		transition: all 0.3s ease;
	}
	
	.card:hover {
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
		transform: translateY(-2rpx);
	}
	
	.card-header {
		display: flex;
		align-items: center;
		padding: 32rpx 32rpx 24rpx;
		border-bottom: 1rpx solid rgba(240, 240, 240, 0.8);
		background: linear-gradient(135deg, #fafbfc 0%, #f6f8fa 100%);
	}
	
	.card-icon {
		font-size: 36rpx;
		margin-right: 16rpx;
		background: linear-gradient(135deg, #1890ff, #36cfc9);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}
	
	.card-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #1f2329;
	}
	
	.card-subtitle {
		font-size: 24rpx;
		color: #8f959e;
		margin-left: auto;
		background: rgba(24, 144, 255, 0.1);
		padding: 8rpx 16rpx;
		border-radius: 20rpx;
		font-weight: 500;
	}
	
	.card-body {
		padding: 32rpx;
	}
	
	/* 表单组样式优化 */
	.form-group {
		margin-bottom: 32rpx;
		position: relative;
	}
	
	.form-group:last-child {
		margin-bottom: 0;
	}
	
	.form-label {
		font-size: 28rpx;
		font-weight: 600;
		color: #1f2329;
		margin-bottom: 16rpx;
		display: flex;
		align-items: center;
	}
	
	.form-label.required::before {
		content: '*';
		color: #ff4d4f;
		margin-right: 8rpx;
		font-size: 32rpx;
	}
	
	.form-input {
		height: 96rpx;
		padding: 0 24rpx;
		background: #f8f9fa;
		border: 2rpx solid #e1e4e8;
		border-radius: 16rpx;
		font-size: 28rpx;
		color: #1f2329;
		transition: all 0.3s ease;
		font-weight: 500;
	}
	
	.form-input:focus {
		border-color: #1890ff;
		background: #fff;
		box-shadow: 0 0 0 4rpx rgba(24, 144, 255, 0.1);
	}
	
	.placeholder {
		color: #8f959e;
		font-size: 28rpx;
		font-weight: 400;
	}
	
	.input-counter {
		position: absolute;
		right: 24rpx;
		bottom: 24rpx;
		font-size: 24rpx;
		color: #8f959e;
		font-weight: 500;
	}
	
	/* 信息行样式优化 */
	.info-row {
		display: flex;
		justify-content: space-between;
		gap: 32rpx;
	}
	
	.info-item {
		flex: 1;
	}
	
	.info-label {
		font-size: 28rpx;
		color: #8f959e;
		margin-bottom: 16rpx;
		font-weight: 500;
	}
	
	.info-value {
		font-size: 28rpx;
		color: #1f2329;
		font-weight: 600;
	}
	
	.info-value.tag {
		display: inline-block;
		padding: 12rpx 20rpx;
		background: linear-gradient(135deg, #e6f7ff, #bae7ff);
		color: #1890ff;
		border-radius: 12rpx;
		font-size: 24rpx;
		font-weight: 600;
		border: 1rpx solid rgba(24, 144, 255, 0.2);
	}
	
	/* 上传提示样式优化 */
	.upload-tips {
		background: linear-gradient(135deg, #f0f8ff, #e6f7ff);
		border: 1rpx solid #d0e8ff;
		border-radius: 16rpx;
		padding: 24rpx;
		margin-bottom: 24rpx;
		position: relative;
		overflow: hidden;
	}
	
	.upload-tips::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 8rpx;
		height: 100%;
		background: linear-gradient(135deg, #1890ff, #36cfc9);
	}
	
	.tips-content {
		display: flex;
		align-items: flex-start;
	}
	
	.tips-icon {
		font-size: 28rpx;
		margin-right: 12rpx;
		margin-top: 4rpx;
	}
	
	.tips-text {
		font-size: 26rpx;
		color: #1890ff;
		line-height: 1.5;
		flex: 1;
		font-weight: 500;
	}
	
	/* 文件上传区域优化 */
	.file-upload-area {
		border: 3rpx dashed #d0d7de;
		border-radius: 24rpx;
		background: #fafbfc;
		transition: all 0.3s ease;
		cursor: pointer;
		overflow: hidden;
		margin-bottom: 24rpx;
		position: relative;
	}
	
	.file-upload-area:active {
		border-color: #1890ff;
		background: #f0f8ff;
		transform: scale(0.98);
		box-shadow: 0 8rpx 32rpx rgba(24, 144, 255, 0.2);
	}
	
	.upload-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 80rpx 40rpx;
		text-align: center;
	}
	
	.upload-icon {
		margin-bottom: 24rpx;
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #e6f7ff, #bae7ff);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.upload-icon-img {
		width: 60rpx;
		height: 60rpx;
	}
	
	.upload-text {
		font-size: 32rpx;
		font-weight: 600;
		color: #1f2329;
		margin-bottom: 16rpx;
	}
	
	.upload-desc {
		font-size: 26rpx;
		color: #8f959e;
		margin-bottom: 8rpx;
		font-weight: 500;
	}
	
	.upload-count {
		font-size: 24rpx;
		color: #1890ff;
		font-weight: 600;
	}
	
	/* 文件预览区域优化 */
	.file-preview {
		margin-top: 8rpx;
	}
	
	.file-list {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
	}
	
	.file-item {
		background: #f8f9fa;
		border-radius: 20rpx;
		padding: 32rpx;
		border: 1rpx solid rgba(225, 228, 232, 0.6);
		transition: all 0.3s ease;
	}
	
	.file-item:hover {
		background: #fff;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
		transform: translateY(-2rpx);
	}
	
	.file-wrapper {
		display: flex;
		align-items: center;
		gap: 24rpx;
	}
	
	.file-icon {
		width: 100rpx;
		height: 100rpx;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 40rpx;
		flex-shrink: 0;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
	}
	
	.file-type-image {
		background: linear-gradient(135deg, #ff4d4f, #ff7875);
	}
	
	.file-type-document {
		background: linear-gradient(135deg, #1890ff, #36cfc9);
	}
	
	.file-type-archive {
		background: linear-gradient(135deg, #52c41a, #73d13d);
	}
	
	.file-type-other {
		background: linear-gradient(135deg, #722ed1, #9254de);
	}
	
	.file-info {
		flex: 1;
		min-width: 0;
	}
	
	.file-name {
		font-size: 28rpx;
		font-weight: 600;
		color: #1f2329;
		margin-bottom: 8rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.file-meta {
		display: flex;
		align-items: center;
		gap: 16rpx;
		margin-bottom: 12rpx;
	}
	
	.file-size {
		font-size: 24rpx;
		color: #8f959e;
		font-weight: 500;
	}
	
	.file-type {
		font-size: 22rpx;
		color: #fff;
		background: rgba(24, 144, 255, 0.8);
		padding: 4rpx 12rpx;
		border-radius: 12rpx;
		font-weight: 500;
	}
	
	.progress-container {
		display: flex;
		align-items: center;
		gap: 16rpx;
	}
	
	.progress-bar {
		flex: 1;
		height: 8rpx;
		background: #e1e4e8;
		border-radius: 4rpx;
		overflow: hidden;
	}
	
	.progress-fill {
		height: 100%;
		background: linear-gradient(135deg, #52c41a, #73d13d);
		transition: width 0.3s ease;
		border-radius: 4rpx;
	}
	
	.progress-text {
		font-size: 22rpx;
		color: #52c41a;
		font-weight: 600;
		min-width: 60rpx;
	}
	
	.file-status {
		margin-top: 8rpx;
	}
	
	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 8rpx;
		padding: 8rpx 16rpx;
		border-radius: 20rpx;
		font-size: 24rpx;
		font-weight: 600;
	}
	
	.status-badge.success {
		background: linear-gradient(135deg, #f6ffed, #d9f7be);
		color: #52c41a;
		border: 1rpx solid rgba(82, 196, 26, 0.3);
	}
	
	.status-badge.ready {
		background: linear-gradient(135deg, #f0f8ff, #e6f7ff);
		color: #1890ff;
		border: 1rpx solid rgba(24, 144, 255, 0.3);
	}
	
	.status-icon {
		font-size: 20rpx;
	}
	
	.file-actions {
		display: flex;
		gap: 12rpx;
		flex-shrink: 0;
	}
	
	.btn-action {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4rpx;
		padding: 16rpx;
		border: none;
		background: transparent;
		border-radius: 12rpx;
		transition: all 0.3s ease;
		min-width: 80rpx;
	}
	
	.btn-action:active {
		transform: scale(0.9);
	}
	
	.btn-action.preview:active {
		background: rgba(24, 144, 255, 0.1);
	}
	
	.btn-action.delete:active {
		background: rgba(255, 77, 79, 0.1);
	}
	
	.btn-icon {
		font-size: 24rpx;
		margin-bottom: 4rpx;
	}
	
	.btn-text {
		font-size: 20rpx;
		color: #8f959e;
		font-weight: 500;
	}
	
	/* 上传数量提示优化 */
	.upload-count-tip {
		text-align: center;
		margin-top: 24rpx;
		padding: 20rpx;
		background: linear-gradient(135deg, #f6ffed, #d9f7be);
		border-radius: 16rpx;
		border: 1rpx solid rgba(82, 196, 26, 0.3);
	}
	
	.count-text {
		font-size: 26rpx;
		color: #52c41a;
		font-weight: 600;
	}
	
	/* 文本域样式优化 */
	.form-textarea {
		width: 100%;
		height: 240rpx;
		padding: 24rpx;
		background: #f8f9fa;
		border: 2rpx solid #e1e4e8;
		border-radius: 16rpx;
		font-size: 28rpx;
		color: #1f2329;
		line-height: 1.5;
		transition: all 0.3s ease;
		box-sizing: border-box;
		font-weight: 500;
	}
	
	.form-textarea:focus {
		border-color: #1890ff;
		background: #fff;
		box-shadow: 0 0 0 4rpx rgba(24, 144, 255, 0.1);
	}
	
	.textarea-placeholder {
		color: #8f959e;
		font-size: 28rpx;
		font-weight: 400;
	}
	
	.textarea-counter {
		text-align: right;
		font-size: 24rpx;
		color: #8f959e;
		margin-top: 16rpx;
		font-weight: 500;
	}
	
	/* 底部操作区域优化 */
	.bottom-actions {
		position: sticky;
		bottom: 0;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		padding: 24rpx 32rpx 48rpx;
		border-top: 1rpx solid rgba(225, 228, 232, 0.8);
		margin-top: 24rpx;
		box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.08);
	}
	
	.action-buttons {
		display: flex;
		gap: 24rpx;
	}
	
	.btn {
		flex: 1;
		height: 96rpx;
		border: none;
		border-radius: 20rpx;
		font-size: 32rpx;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}
	
	.btn::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
		transition: left 0.5s ease;
	}
	
	.btn:active::before {
		left: 100%;
	}
	
	.btn:active {
		transform: scale(0.98);
	}
	
	.btn-cancel {
		background: #fff;
		color: #1f2329;
		border: 2rpx solid #e1e4e8;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
	}
	
	.btn-cancel:active {
		background: #f8f9fa;
		border-color: #d0d7de;
	}
	
	.btn-submit {
		background: linear-gradient(135deg, #1890ff, #36cfc9);
		color: #fff;
		box-shadow: 0 4rpx 20rpx rgba(24, 144, 255, 0.3);
	}
	
	.btn-submit.btn-disabled {
		background: linear-gradient(135deg, #c2c8d1, #d0d7de);
		color: #fff;
		transform: none;
		box-shadow: none;
	}
	
	.btn-submit:not(.btn-disabled):active {
		background: linear-gradient(135deg, #0d7ae5, #2db8b3);
		box-shadow: 0 2rpx 12rpx rgba(24, 144, 255, 0.4);
	}
	
	.btn-loading {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 16rpx;
	}
	
	.loading-spinner {
		width: 32rpx;
		height: 32rpx;
		border: 3rpx solid transparent;
		border-top: 3rpx solid #fff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	.loading-spinner.large {
		width: 64rpx;
		height: 64rpx;
		border-width: 4rpx;
		margin-bottom: 24rpx;
		border-top-color: #1890ff;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	.btn-text {
		font-size: 32rpx;
		font-weight: 600;
	}
	
	/* 全局加载遮罩优化 */
	.global-loading {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(10px);
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.loading-modal {
		background: #fff;
		border-radius: 24rpx;
		padding: 64rpx 48rpx;
		text-align: center;
		max-width: 500rpx;
		box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.2);
		border: 1rpx solid rgba(225, 228, 232, 0.8);
	}
	
	.loading-content {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	
	.loading-text {
		font-size: 32rpx;
		font-weight: 600;
		color: #1f2329;
		margin-bottom: 16rpx;
	}
	
	.loading-subtext {
		font-size: 26rpx;
		color: #8f959e;
		margin-bottom: 8rpx;
		font-weight: 500;
	}
	
	.loading-progress {
		font-size: 24rpx;
		color: #1890ff;
		font-weight: 600;
		background: rgba(24, 144, 255, 0.1);
		padding: 8rpx 16rpx;
		border-radius: 20rpx;
		margin-top: 8rpx;
	}
	
	/* 预览弹窗样式 */
	.preview-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.preview-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(10px);
	}
	
	.preview-content {
		position: relative;
		background: #fff;
		border-radius: 20rpx;
		width: 90vw;
		height: 80vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);
		overflow: hidden;
	}
	
	.preview-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 32rpx;
		border-bottom: 1rpx solid #e1e4e8;
		background: #fafbfc;
	}
	
	.preview-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #1f2329;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.preview-actions {
		display: flex;
		align-items: center;
		gap: 16rpx;
	}
	
	.btn-download, .btn-close {
		padding: 16rpx 24rpx;
		border: none;
		border-radius: 12rpx;
		background: #1890ff;
		color: #fff;
		font-size: 26rpx;
		display: flex;
		align-items: center;
		gap: 8rpx;
		transition: all 0.3s ease;
	}
	
	.btn-download:active, .btn-close:active {
		transform: scale(0.95);
		background: #0d7ae5;
	}
	
	.btn-close {
		background: #8f959e;
	}
	
	.btn-close:active {
		background: #6a737d;
	}
	
	.preview-body {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}
	
	.preview-image {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
	
	.preview-iframe {
		width: 100%;
		height: 100%;
		border: none;
	}
	
	.preview-unsupported {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 80rpx;
		text-align: center;
	}
	
	.unsupported-icon {
		font-size: 120rpx;
		margin-bottom: 32rpx;
	}
	
	.unsupported-text {
		font-size: 32rpx;
		font-weight: 600;
		color: #1f2329;
		margin-bottom: 16rpx;
	}
	
	.unsupported-desc {
		font-size: 28rpx;
		color: #8f959e;
		margin-bottom: 48rpx;
	}
	
	.btn-download-large {
		padding: 24rpx 48rpx;
		border: none;
		border-radius: 16rpx;
		background: linear-gradient(135deg, #1890ff, #36cfc9);
		color: #fff;
		font-size: 32rpx;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 16rpx;
		transition: all 0.3s ease;
	}
	
	.btn-download-large:active {
		transform: scale(0.95);
		background: linear-gradient(135deg, #0d7ae5, #2db8b3);
	}
</style>