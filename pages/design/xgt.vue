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
			<!-- 加载状态 -->
			<view class="loading-state" v-if="loading">
				<view class="loading-spinner large"></view>
				<text class="loading-text">加载中...</text>
			</view>

			<!-- 空状态 -->
			<view class="empty-state" v-else-if="!schemeData">
				<view class="empty-icon">📁</view>
				<view class="empty-text">暂无效果图方案</view>
				<view class="empty-desc">设计师尚未上传效果图文件，请耐心等待</view>
			</view>

			<!-- 方案内容 -->
			<template v-else>
				<!-- 方案基本信息卡片 -->
				<view class="card">
					<view class="card-header">
						<view class="card-icon">📋</view>
						<text class="card-title">方案信息</text>
					</view>
					<view class="card-body">
						<view class="info-row">
							<view class="info-item">
								<view class="info-label">方案名称</view>
								<view class="info-value">{{ schemeData.schemeName || '效果图方案' }}</view>
							</view>
							<view class="info-item">
								<view class="info-label">方案类型</view>
								<view class="info-value tag">{{ schemeTypeText }}</view>
							</view>
						</view>
						
						<view class="info-row">
							<view class="info-item">
								<view class="info-label">订单号</view>
								<view class="info-value">DD{{ orderId }}</view>
							</view>
							<view class="info-item">
								<view class="info-label">设计师</view>
								<view class="info-value">{{ designerInfo.name || '--' }}</view>
							</view>
						</view>
						
						<view class="info-row">
							<view class="info-item">
								<view class="info-label">创建时间</view>
								<view class="info-value">{{ formatTime(schemeData.createTime) }}</view>
							</view>
							<view class="info-item">
								<view class="info-label">状态</view>
								<view class="info-value tag" :class="getStatusClass(schemeData.status)">
									{{ getStatusText(schemeData.status) }}
								</view>
							</view>
						</view>
					</view>
				</view>

				<!-- 方案文件卡片 -->
				<view class="card">
					<view class="card-header">
						<view class="card-icon">📁</view>
						<text class="card-title">效果图文件</text>
						<view class="card-subtitle">共 {{ fileList.length }} 个文件</view>
					</view>
					<view class="card-body">
						<!-- 文件列表区域 -->
						<view class="file-list" v-if="fileList.length > 0">
							<view class="file-item" v-for="(file, index) in fileList" :key="index">
								<view class="file-icon">
									<text class="file-type-icon">{{ getFileTypeIcon(file.type) }}</text>
								</view>
								<view class="file-info">
									<view class="file-name">{{ file.name }}</view>
									<view class="file-meta">
										<text class="file-size">{{ file.size }}</text>
										<text class="file-format">{{ file.format }}</text>
									</view>
								</view>
								<view class="file-actions">
									<button class="btn-action preview" @click="previewFile(file)" v-if="isPreviewable(file)">
										<text class="btn-icon">👁️</text>
										<text class="btn-text">预览</text>
									</button>
									<button class="btn-action download" @click="downloadFile(file)">
										<text class="btn-icon">⬇️</text>
										<text class="btn-text">下载</text>
									</button>
								</view>
							</view>
						</view>
						
						<!-- 空状态 -->
						<view class="empty-files" v-else>
							<view class="empty-icon">📁</view>
							<view class="empty-text">暂无效果图文件</view>
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
						<view class="description-content">
							<text class="description-text">{{ schemeData.description || '设计师暂未添加方案说明' }}</text>
						</view>
					</view>
				</view>

				<!-- 设计师信息卡片 -->
				<view class="card" v-if="designerInfo.name">
					<view class="card-header">
						<view class="card-icon">👨‍🎨</view>
						<text class="card-title">设计师信息</text>
					</view>
					<view class="card-body">
						<view class="designer-detail">
							<view class="designer-avatar">
								<image :src="designerInfo.avatar" mode="aspectFill" class="avatar-image" />
							</view>
							<view class="designer-info-content">
								<view class="designer-name">{{ designerInfo.name }}</view>
								<view class="designer-role">{{ designerInfo.role || '设计师' }}</view>
							</view>
							<view class="contact-btn" @click="contactDesigner">
								联系设计师
							</view>
						</view>
					</view>
				</view>

				<!-- 底部操作区域 - 始终显示，无限制条件 -->
				<view class="bottom-actions" v-if="schemeData">
					<view class="action-buttons">
						<button class="btn btn-reject" @click="rejectScheme" :disabled="submitting">
							<text class="btn-text">{{ submitting ? '处理中...' : '拒绝方案' }}</text>
						</button>
						<button class="btn btn-confirm" @click="confirmScheme" :disabled="submitting">
							<text class="btn-text">{{ submitting ? '处理中...' : '确认方案' }}</text>
						</button>
					</view>
				</view>
				
				<!-- 状态提示 -->
				<view class="status-tips" v-if="schemeData && schemeData.status !== SCHEME_STATUS.PENDING">
					<view class="tips-card" :class="getStatusCardClass(schemeData.status)">
						<view class="tips-icon">{{ getStatusIcon(schemeData.status) }}</view>
						<view class="tips-content">
							<view class="tips-title">{{ getStatusTitle(schemeData.status) }}</view>
							<view class="tips-desc">{{ getStatusDesc(schemeData.status) }}</view>
						</view>
					</view>
				</view>
			</template>
		</scroll-view>

		<!-- 文件预览弹窗 - 仅用于不支持预览的文件类型 -->
		<view class="preview-modal" v-if="showPreview">
			<view class="preview-overlay" @click="closePreview"></view>
			<view class="preview-content">
				<view class="preview-header">
					<text class="preview-title">{{ currentPreviewFile ? currentPreviewFile.name : '文件预览' }}</text>
					<view class="preview-actions">
						<button class="btn-close" @click="closePreview">
							<text class="btn-icon">✕</text>
						</button>
					</view>
				</view>
				<view class="preview-body">
					<view class="preview-unsupported">
						<text class="unsupported-icon">📄</text>
						<text class="unsupported-text">当前文件类型不支持在线预览</text>
						<text class="unsupported-desc">请下载后使用本地应用打开</text>
						<button class="btn-download-large" @click="downloadCurrentFile">
							<text class="btn-icon">⬇️</text>
							<text class="btn-text">下载文件</text>
						</button>
					</view>
				</view>
			</view>
		</view>

		<!-- 下载进度弹窗 -->
		<view class="download-progress" v-if="showDownloadProgress">
			<view class="progress-overlay"></view>
			<view class="progress-content">
				<view class="progress-spinner"></view>
				<text class="progress-text">下载中...</text>
				<text class="progress-subtext">{{ downloadFileName }}</text>
			</view>
		</view>
	</view>
</template>

<script>
	import { getDesignSchemeList, updateDesignSchemeStatus } from '@/api/designScheme.js'

	// 方案状态常量 - 根据接口文档定义
	// 注意：确认按钮对应status=2，拒绝对应status=0
	const SCHEME_STATUS = {
		PENDING: 1,      // 待确认/待审核
		CONFIRMED: 2,    // 已确认/已通过 (确认按钮对应)
		REJECTED: 0,     // 已拒绝/未通过 (拒绝按钮对应)
		DELETED: 3       // 已删除
	}

	// 方案类型常量
	const SCHEME_TYPE = {
		EFFECT_DRAWING: 1,    // 效果图
		CONSTRUCTION_DRAWING: 2 // 施工设计图
	}

	export default {
		data() {
			return {
				// 页面参数
				orderId: null,
				schemeType: null,
				designerName: '',
				pageTitle: '确认效果图',
				
				// 方案数据
				schemeData: null,
				
				// 文件列表
				fileList: [],
				
				// 设计师信息
				designerInfo: {
					name: '',
					avatar: '',
					role: ''
				},
				
				// 状态控制
				loading: false,
				submitting: false,
				
				// 预览相关
				showPreview: false,
				currentPreviewFile: null,
				
				// 下载相关
				showDownloadProgress: false,
				downloadFileName: '',
				
				// 导出常量到模板
				SCHEME_STATUS: SCHEME_STATUS
			}
		},
		
		computed: {
			// 方案类型文本
			schemeTypeText() {
				return this.schemeType === SCHEME_TYPE.EFFECT_DRAWING ? '效果图' : '施工设计图'
			}
		},
		
		onLoad(options) {
			console.log('📝 确认效果图页面参数:', options)
			this.initPageParams(options)
		},
		
		methods: {
			// 初始化页面参数
			initPageParams(options) {
				try {
					// 解析参数
					this.orderId = options.orderId ? parseInt(options.orderId) : null
					this.schemeType = options.schemeType ? parseInt(options.schemeType) : SCHEME_TYPE.EFFECT_DRAWING
					this.designerName = options.designerName ? decodeURIComponent(options.designerName) : ''
					
					console.log('🔍 解析后的参数:', {
						orderId: this.orderId,
						schemeType: this.schemeType,
						designerName: this.designerName
					})
					
					// 验证必要参数
					if (!this.orderId) {
						this.showParamsError()
						return
					}
					
					// 初始化设计师信息
					this.initDesignerInfo()
					
					// 加载数据
					this.loadSchemeData()
					
				} catch (error) {
					console.error('❌ 参数解析失败:', error)
					this.showParamsError()
				}
			},
			
			// 初始化设计师信息
			initDesignerInfo() {
				// 使用传递过来的设计师姓名
				if (this.designerName) {
					this.designerInfo.name = this.designerName
					this.designerInfo.avatar = '/static/images/default-avatar.png'
					this.designerInfo.role = '设计师'
				}
			},
			
			// 加载方案数据
			async loadSchemeData() {
				if (this.loading) return
				
				this.loading = true
				try {
					console.log('📋 开始加载效果图方案数据，订单ID:', this.orderId, '方案类型:', this.schemeType)
					
					// 1. 根据订单ID和方案类型查询方案
					const queryParams = {
						pageNum: 1,
						pageSize: 10,
						orderId: this.orderId,
						schemeType: this.schemeType
					}
					
					const schemeResult = await getDesignSchemeList(queryParams)
					console.log('✅ 方案查询结果:', schemeResult)
					
					if (schemeResult.code === 200 && schemeResult.data) {
						let schemeList = []
						
						// 处理返回数据格式
						if (schemeResult.data.records) {
							schemeList = schemeResult.data.records
						} else if (schemeResult.data.list) {
							schemeList = schemeResult.data.list
						} else if (Array.isArray(schemeResult.data)) {
							schemeList = schemeResult.data
						} else if (Array.isArray(schemeResult)) {
							schemeList = schemeResult
						}
						
						// 获取第一个效果图方案
						if (schemeList.length > 0) {
							this.schemeData = schemeList[0]
							console.log('✅ 找到效果图方案:', this.schemeData)
							console.log('🔍 方案状态:', this.schemeData.status)
							
							// 2. 构建文件列表
							this.buildFileList()
							
						} else {
							console.log('❌ 未找到效果图方案')
							this.schemeData = null
						}
						
					} else {
						throw new Error(schemeResult.msg || '查询方案失败')
					}
					
				} catch (error) {
					console.error('❌ 加载方案数据失败:', error)
					uni.showToast({
						title: '加载方案数据失败',
						icon: 'none'
					})
				} finally {
					this.loading = false
				}
			},
			
			// 构建文件列表
			buildFileList() {
				this.fileList = []
				
				// 如果有主图文件URL，添加到文件列表
				if (this.schemeData.fileUrl) {
					this.fileList.push({
						url: this.schemeData.fileUrl,
						name: '效果图设计方案',
						type: this.getFileType(this.schemeData.fileUrl),
						format: this.getFileFormat(this.schemeData.fileUrl),
						size: this.getFileSize(this.schemeData.fileSize)
					})
				}
				
				// 如果有其他文件URL，也添加到列表
				if (this.schemeData.fileUrls && Array.isArray(this.schemeData.fileUrls)) {
					this.schemeData.fileUrls.forEach((url, index) => {
						this.fileList.push({
							url: url,
							name: `效果图文件 ${index + 1}`,
							type: this.getFileType(url),
							format: this.getFileFormat(url),
							size: '--'
						})
					})
				}
				
				console.log('📁 构建的文件列表:', this.fileList)
			},
			
			// 获取文件类型
			getFileType(url) {
				if (!url) return 'unknown'
				
				// 清除URL参数
				const cleanUrl = url.split('?')[0]
				const ext = cleanUrl.split('.').pop().toLowerCase()
				
				const typeMap = {
					// 图片类型
					'jpg': 'image', 'jpeg': 'image', 'png': 'image', 
					'gif': 'image', 'bmp': 'image', 'webp': 'image', 'svg': 'image',
					// 文档类型
					'pdf': 'pdf',
					'doc': 'doc', 'docx': 'doc',
					'xls': 'excel', 'xlsx': 'excel',
					'ppt': 'ppt', 'pptx': 'ppt',
					'txt': 'text',
					// 压缩文件
					'zip': 'zip', 'rar': 'zip', '7z': 'zip', 'tar': 'zip'
				}
				return typeMap[ext] || 'unknown'
			},
			
			// 获取文件类型图标
			getFileTypeIcon(fileType) {
				const iconMap = {
					'image': '🖼️',
					'pdf': '📄',
					'doc': '📝',
					'excel': '📊',
					'ppt': '📑',
					'text': '📃',
					'zip': '📦',
					'default': '📁'
				}
				return iconMap[fileType] || iconMap.default
			},
			
			// 获取文件格式
			getFileFormat(url) {
				if (!url) return '未知格式'
				const ext = url.split('.').pop().toLowerCase()
				const formatMap = {
					'jpg': 'JPG',
					'jpeg': 'JPEG',
					'png': 'PNG',
					'gif': 'GIF',
					'pdf': 'PDF',
					'doc': 'DOC',
					'docx': 'DOCX',
					'xls': 'XLS',
					'xlsx': 'XLSX',
					'ppt': 'PPT',
					'pptx': 'PPTX',
					'txt': 'TXT',
					'zip': 'ZIP',
					'rar': 'RAR'
				}
				return formatMap[ext] || ext.toUpperCase()
			},
			
			// 获取文件大小
			getFileSize(size) {
				if (!size) return '--'
				if (size < 1024) {
					return size + 'B'
				} else if (size < 1024 * 1024) {
					return (size / 1024).toFixed(1) + 'KB'
				} else {
					return (size / (1024 * 1024)).toFixed(1) + 'MB'
				}
			},
			
			// 判断文件是否可预览
			isPreviewable(file) {
				if (!file) return false
				
				const fileType = file.type || this.getFileType(file.url)
				// 支持预览的类型：图片、PDF
				return fileType === 'image' || fileType === 'pdf'
			},
			
			// 判断是否为图片文件
			isImageFile(file) {
				return file && file.type === 'image'
			},
			
			// 判断是否为PDF文件
			isPdfFile(file) {
				return file && file.type === 'pdf'
			},
			
			// 预览文件
			previewFile(file) {
				console.log('👁️ 预览文件:', file)
				console.log('📄 文件URL:', file.url)
				console.log('🔍 文件类型:', file.type)
				
				if (!file || !file.url) {
					uni.showToast({
						title: '文件链接无效',
						icon: 'none'
					})
					return
				}
				
				// 验证URL是否有效
				if (!this.isValidUrl(file.url)) {
					uni.showToast({
						title: '文件链接格式错误',
						icon: 'none'
					})
					return
				}
				
				// 根据文件类型选择不同的预览方式
				const fileType = file.type || this.getFileType(file.url)
				console.log('🎯 确定的文件类型:', fileType)
				
				if (fileType === 'image') {
					// 图片使用uni-app原生预览
					this.previewImage(file)
				} else if (fileType === 'pdf') {
					// PDF使用下载后打开的方式
					this.previewPdf(file)
				} else {
					// 其他文件类型在弹窗中显示不支持预览
					this.previewInModal(file)
				}
			},
			
			// 验证URL格式
			isValidUrl(string) {
				try {
					new URL(string)
					return true
				} catch (_) {
					return false
				}
			},
			
			// 预览PDF文件
			previewPdf(file) {
				console.log('📄 开始预览PDF文件:', file.name)
				
				// 显示加载提示
				uni.showLoading({
					title: '加载中...',
					mask: true
				})
				
				uni.downloadFile({
					url: file.url,
					success: (res) => {
						uni.hideLoading()
						
						if (res.statusCode === 200) {
							const filePath = res.tempFilePath
							console.log('✅ PDF下载成功，文件路径:', filePath)
							
							// 使用uni.openDocument打开PDF
							uni.openDocument({
								filePath: filePath,
								fileType: 'pdf',
								success: (res) => {
									console.log('✅ 打开PDF文档成功')
								},
								fail: (err) => {
									console.error('❌ 打开PDF失败:', err)
									uni.showToast({
										title: '打开文件失败',
										icon: 'none'
									})
								}
							})
						} else {
							throw new Error(`下载失败，状态码: ${res.statusCode}`)
						}
					},
					fail: (err) => {
						uni.hideLoading()
						console.error('❌ PDF下载失败:', err)
						uni.showToast({
							title: '文件加载失败',
							icon: 'none'
						})
					}
				})
			},
			
			// 预览图片 - 使用uni-app原生预览
			previewImage(file) {
				uni.previewImage({
					urls: [file.url],
					current: 0,
					indicator: 'default',
					loop: false,
					success: () => {
						console.log('图片预览成功')
					},
					fail: (error) => {
						console.error('图片预览失败:', error)
						uni.showToast({
							title: '图片加载失败',
							icon: 'none'
						})
					}
				})
			},
			
			// 在弹窗中预览（用于不支持的文件类型）
			previewInModal(file) {
				this.currentPreviewFile = file
				this.showPreview = true
			},
			
			// 关闭预览
			closePreview() {
				this.showPreview = false
				this.currentPreviewFile = null
			},
			
			// 下载文件
			async downloadFile(file) {
				console.log('⬇️ 下载文件:', file)
				
				if (!file || !file.url) {
					uni.showToast({
						title: '文件链接无效',
						icon: 'none'
					})
					return
				}
				
				// 显示下载进度
				this.downloadFileName = file.name
				this.showDownloadProgress = true
				
				try {
					const downloadResult = await new Promise((resolve, reject) => {
						uni.downloadFile({
							url: file.url,
							success: resolve,
							fail: reject
						})
					})
					
					if (downloadResult.statusCode === 200) {
						// 保存文件到本地
						const saveResult = await new Promise((resolve, reject) => {
							uni.saveFile({
								tempFilePath: downloadResult.tempFilePath,
								success: resolve,
								fail: reject
							})
						})
						
						uni.showToast({
							title: '下载成功',
							icon: 'success'
						})
						
						console.log('✅ 文件保存成功:', saveResult.savedFilePath)
						
					} else {
						throw new Error(`下载失败，状态码: ${downloadResult.statusCode}`)
					}
					
				} catch (error) {
					console.error('❌ 下载失败:', error)
					uni.showToast({
						title: '下载失败，请重试',
						icon: 'none'
					})
				} finally {
					this.showDownloadProgress = false
					this.downloadFileName = ''
				}
			},
			
			// 下载当前预览的文件
			downloadCurrentFile() {
				if (this.currentPreviewFile) {
					this.downloadFile(this.currentPreviewFile)
					this.closePreview()
				}
			},
			
			// 返回上一页
			goBack() {
				uni.navigateBack()
			},
			
			// 联系设计师
			contactDesigner() {
				if (!this.designerInfo.name || this.designerInfo.name === '未知设计师') {
					uni.showToast({
						title: '暂无设计师信息',
						icon: 'none'
					})
					return
				}
				
				// 跳转到聊天页面
				const designerId = this.schemeData.contractorId
				if (designerId) {
					uni.navigateTo({
						url: `/pages/chat/designer?designerId=${designerId}`
					})
				} else {
					uni.showToast({
						title: '无法联系设计师',
						icon: 'none'
					})
				}
			},
			
			// 确认方案 - 对应 status=2
			async confirmScheme() {
				console.log('🟢 确认按钮被点击')
				if (this.submitting || !this.schemeData) {
					console.log('❌ 按钮被阻止：submitting=', this.submitting, 'schemeData=', !!this.schemeData)
					return
				}
				
				console.log('✅ 确认按钮可以正常点击')
				uni.showModal({
					title: '确认方案',
					content: '确定要确认这个效果图方案吗？确认后方案将生效，设计师将开始后续工作。',
					confirmColor: '#07C160',
					success: async (res) => {
						if (res.confirm) {
							await this.updateSchemeStatus(SCHEME_STATUS.CONFIRMED, '客户确认效果图方案')
						}
					}
				})
			},
			
			// 拒绝方案 - 对应 status=0
			async rejectScheme() {
				console.log('🔴 拒绝按钮被点击')
				if (this.submitting || !this.schemeData) {
					console.log('❌ 按钮被阻止：submitting=', this.submitting, 'schemeData=', !!this.schemeData)
					return
				}
				
				console.log('✅ 拒绝按钮可以正常点击')
				uni.showModal({
					title: '拒绝方案',
					content: '确定要拒绝这个效果图方案吗？请确保已与设计师充分沟通修改需求。',
					confirmColor: '#FF4757',
					success: async (res) => {
						if (res.confirm) {
							await this.updateSchemeStatus(SCHEME_STATUS.REJECTED, '客户拒绝效果图方案')
						}
					}
				})
			},
			
			// 更新方案状态
			async updateSchemeStatus(status, description = '') {
				this.submitting = true
				
				try {
					console.log('🔄 更新方案状态:', {
						designSchemeId: this.schemeData.designSchemeId,
						status: status,
						description: description
					})
					
					// 验证必要参数
					if (!this.schemeData.designSchemeId) {
						throw new Error('方案ID不存在，无法更新状态')
					}
					
					// 调用API更新方案状态
					const result = await updateDesignSchemeStatus(
						this.schemeData.designSchemeId, 
						status, 
						description
					)
					
					console.log('✅ 更新状态API响应:', result)
					
					if (result.code === 200) {
						const successMessage = status === SCHEME_STATUS.CONFIRMED ? 
							'方案确认成功' : '方案已拒绝'
						
						uni.showToast({
							title: successMessage,
							icon: 'success',
							duration: 2000
						})
						
						// 更新本地状态
						this.schemeData.status = status
						
						// 显示状态更新提示
						this.showStatusUpdateTips(status)
						
						// 刷新订单页面
						setTimeout(() => {
							this.refreshOrderPage()
						}, 1500)
						
					} else {
						throw new Error(result.msg || '操作失败')
					}
					
				} catch (error) {
					console.error('❌ 更新方案状态失败:', error)
					uni.showToast({
						title: error.message || '操作失败，请重试',
						icon: 'none',
						duration: 3000
					})
				} finally {
					this.submitting = false
				}
			},
			
			// 显示状态更新后的提示
			showStatusUpdateTips(status) {
				const tipsMap = {
					[SCHEME_STATUS.CONFIRMED]: {
						title: '方案已确认',
						content: '您已成功确认效果图方案，设计师将开始后续工作'
					},
					[SCHEME_STATUS.REJECTED]: {
						title: '方案已拒绝',
						content: '您已拒绝效果图方案，请及时与设计师沟通修改需求'
					}
				}
				
				const tip = tipsMap[status]
				if (tip) {
					console.log(`📢 ${tip.title}: ${tip.content}`)
				}
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
			},
			
			// 显示参数错误提示
			showParamsError() {
				uni.showModal({
					title: '参数错误',
					content: '缺少必要的参数，无法查看方案详情',
					showCancel: false,
					confirmText: '返回',
					success: () => {
						uni.navigateBack()
					}
				})
			},
			
			// 格式化时间
			formatTime(timeStr) {
				if (!timeStr) return '--'
				if (typeof timeStr === 'number') {
					const date = new Date(timeStr)
					return date.toLocaleDateString() + ' ' + date.toLocaleTimeString().slice(0, 5)
				}
				return timeStr
			},
			
			// 获取状态文本
			getStatusText(status) {
				const statusMap = {
					[SCHEME_STATUS.PENDING]: '待确认',
					[SCHEME_STATUS.CONFIRMED]: '已确认',
					[SCHEME_STATUS.REJECTED]: '已拒绝',
					[SCHEME_STATUS.DELETED]: '已删除'
				}
				return statusMap[status] || '未知状态'
			},
			
			// 获取状态样式类
			getStatusClass(status) {
				const classMap = {
					[SCHEME_STATUS.PENDING]: 'status-pending',
					[SCHEME_STATUS.CONFIRMED]: 'status-confirmed',
					[SCHEME_STATUS.REJECTED]: 'status-rejected',
					[SCHEME_STATUS.DELETED]: 'status-deleted'
				}
				return classMap[status] || ''
			},
			
			// 获取状态卡片样式类
			getStatusCardClass(status) {
				const classMap = {
					[SCHEME_STATUS.CONFIRMED]: 'tips-confirmed',
					[SCHEME_STATUS.REJECTED]: 'tips-rejected'
				}
				return classMap[status] || ''
			},
			
			// 获取状态图标
			getStatusIcon(status) {
				const iconMap = {
					[SCHEME_STATUS.CONFIRMED]: '✅',
					[SCHEME_STATUS.REJECTED]: '❌',
					[SCHEME_STATUS.DELETED]: '🗑️'
				}
				return iconMap[status] || 'ℹ️'
			},
			
			// 获取状态标题
			getStatusTitle(status) {
				const titleMap = {
					[SCHEME_STATUS.CONFIRMED]: '方案已确认',
					[SCHEME_STATUS.REJECTED]: '方案已拒绝',
					[SCHEME_STATUS.DELETED]: '方案已删除'
				}
				return titleMap[status] || '方案状态'
			},
			
			// 获取状态描述
			getStatusDesc(status) {
				const descMap = {
					[SCHEME_STATUS.CONFIRMED]: '您已确认此效果图方案，设计师将开始后续工作',
					[SCHEME_STATUS.REJECTED]: '您已拒绝此效果图方案，请与设计师沟通修改需求',
					[SCHEME_STATUS.DELETED]: '此方案已被删除'
				}
				return descMap[status] || '请及时处理方案确认'
			}
		}
	}
</script>

<style scoped>
	.container {
		min-height: 100vh;
		background-color: #f8f9fa;
	}
	
	/* 顶部导航栏样式 */
	.header-section {
		position: sticky;
		top: 0;
		z-index: 999;
		background: #fff;
		padding: 32rpx 32rpx 24rpx;
		border-bottom: 1rpx solid #e1e4e8;
		display: flex;
		align-items: center;
	}
	
	.header-back {
		flex-shrink: 0;
	}
	
	.back-btn {
		display: flex;
		align-items: center;
		padding: 16rpx 0;
	}
	
	.back-icon {
		font-size: 48rpx;
		color: #1890ff;
		line-height: 1;
	}
	
	.back-text {
		font-size: 32rpx;
		color: #1890ff;
		margin-left: 8rpx;
	}
	
	.header-title {
		flex: 1;
		text-align: center;
		font-size: 36rpx;
		font-weight: 600;
		color: #1f2329;
		margin-right: 120rpx;
	}
	
	/* 内容区域样式 */
	.content {
		height: calc(100vh - 120rpx);
		padding: 24rpx;
	}
	
	/* 加载状态 */
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 120rpx 0;
	}
	
	.loading-spinner {
		width: 64rpx;
		height: 64rpx;
		border: 4rpx solid transparent;
		border-top: 4rpx solid #1890ff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 24rpx;
	}
	
	.loading-text {
		font-size: 28rpx;
		color: #666;
	}
	
	/* 空状态 */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 120rpx 0;
		text-align: center;
	}
	
	.empty-icon {
		font-size: 120rpx;
		color: #ccc;
		margin-bottom: 24rpx;
	}
	
	.empty-text {
		font-size: 32rpx;
		color: #999;
		margin-bottom: 16rpx;
	}
	
	.empty-desc {
		font-size: 28rpx;
		color: #ccc;
	}
	
	/* 卡片样式 */
	.card {
		background: #fff;
		border-radius: 20rpx;
		margin-bottom: 24rpx;
		overflow: hidden;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
	}
	
	.card-header {
		display: flex;
		align-items: center;
		padding: 32rpx 32rpx 24rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}
	
	.card-icon {
		font-size: 36rpx;
		margin-right: 16rpx;
	}
	
	.card-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #1f2329;
	}
	
	.card-subtitle {
		font-size: 24rpx;
		color: #999;
		margin-left: auto;
	}
	
	.card-body {
		padding: 32rpx;
	}
	
	/* 信息行样式 */
	.info-row {
		display: flex;
		justify-content: space-between;
		gap: 32rpx;
		margin-bottom: 24rpx;
	}
	
	.info-row:last-child {
		margin-bottom: 0;
	}
	
	.info-item {
		flex: 1;
	}
	
	.info-label {
		font-size: 28rpx;
		color: #8f959e;
		margin-bottom: 16rpx;
	}
	
	.info-value {
		font-size: 28rpx;
		color: #1f2329;
		font-weight: 500;
	}
	
	.info-value.tag {
		display: inline-block;
		padding: 8rpx 16rpx;
		border-radius: 8rpx;
		font-size: 24rpx;
	}
	
	.status-pending {
		background: #fff9e6;
		color: #f39c12;
	}
	
	.status-confirmed {
		background: #e6f7ff;
		color: #1890ff;
	}
	
	.status-rejected {
		background: #fff2f0;
		color: #ff4757;
	}
	
	.status-deleted {
		background: #f8f9fa;
		color: #999;
	}
	
	/* 文件列表样式 */
	.file-list {
		margin-top: 8rpx;
	}
	
	.file-item {
		display: flex;
		align-items: center;
		padding: 24rpx;
		background: #f8f9fa;
		border-radius: 12rpx;
		margin-bottom: 16rpx;
	}
	
	.file-item:last-child {
		margin-bottom: 0;
	}
	
	.file-icon {
		margin-right: 20rpx;
		flex-shrink: 0;
	}
	
	.file-type-icon {
		font-size: 48rpx;
	}
	
	.file-info {
		flex: 1;
	}
	
	.file-name {
		font-size: 28rpx;
		color: #1f2329;
		font-weight: 500;
		margin-bottom: 8rpx;
	}
	
	.file-meta {
		display: flex;
		gap: 16rpx;
	}
	
	.file-size, .file-format {
		font-size: 24rpx;
		color: #8f959e;
	}
	
	.file-actions {
		flex-shrink: 0;
		display: flex;
		gap: 12rpx;
	}
	
	.btn-action {
		padding: 12rpx 20rpx;
		border: none;
		border-radius: 8rpx;
		font-size: 24rpx;
		display: flex;
		align-items: center;
		gap: 8rpx;
		transition: all 0.3s ease;
	}
	
	.btn-action.preview {
		background: #1890ff;
		color: #fff;
	}
	
	.btn-action.preview:active {
		background: #0d7ae5;
	}
	
	.btn-action.download {
		background: #07C160;
		color: #fff;
	}
	
	.btn-action.download:active {
		background: #06a652;
	}
	
	.btn-text {
		font-size: 24rpx;
	}
	
	/* 空文件状态 */
	.empty-files {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 80rpx 40rpx;
		text-align: center;
	}
	
	.empty-icon {
		font-size: 64rpx;
		color: #ccc;
		margin-bottom: 24rpx;
	}
	
	.empty-text {
		font-size: 28rpx;
		color: #999;
	}
	
	/* 方案说明内容 */
	.description-content {
		background: #f8f9fa;
		border-radius: 12rpx;
		padding: 24rpx;
	}
	
	.description-text {
		font-size: 28rpx;
		color: #1f2329;
		line-height: 1.6;
	}
	
	/* 设计师信息样式 */
	.designer-detail {
		display: flex;
		align-items: center;
		gap: 24rpx;
	}
	
	.designer-avatar {
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		overflow: hidden;
		background: #f0f0f0;
		flex-shrink: 0;
	}
	
	.avatar-image {
		width: 100%;
		height: 100%;
	}
	
	.designer-info-content {
		flex: 1;
	}
	
	.designer-name {
		font-size: 32rpx;
		font-weight: 600;
		color: #1f2329;
		margin-bottom: 8rpx;
	}
	
	.designer-role {
		font-size: 26rpx;
		color: #8f959e;
	}
	
	.contact-btn {
		background: #1890ff;
		color: #fff;
		padding: 16rpx 24rpx;
		border-radius: 8rpx;
		font-size: 24rpx;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.3s ease;
		flex-shrink: 0;
	}
	
	.contact-btn:active {
		background: #0d7ae5;
	}
	
	/* 底部操作区域 */
	.bottom-actions {
		position: sticky;
		bottom: 0;
		background: #fff;
		padding: 24rpx 32rpx 48rpx;
		border-top: 1rpx solid #e1e4e8;
		margin-top: 24rpx;
	}
	
	.action-buttons {
		display: flex;
		gap: 24rpx;
	}
	
	.btn {
		flex: 1;
		height: 96rpx;
		border: none;
		border-radius: 16rpx;
		font-size: 32rpx;
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
		cursor: pointer;
	}
	
	.btn:active:not(:disabled) {
		transform: scale(0.98);
	}
	
	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	.btn-reject {
		background: #fff;
		color: #ff4757;
		border: 2rpx solid #ff4757;
	}
	
	.btn-reject:active:not(:disabled) {
		background: #fff2f0;
	}
	
	.btn-confirm {
		background: #07C160;
		color: #fff;
	}
	
	.btn-confirm:active:not(:disabled) {
		background: #06a652;
	}
	
	.btn-text {
		font-size: 32rpx;
		font-weight: 500;
	}
	
	/* 状态提示 */
	.status-tips {
		margin-top: 24rpx;
	}
	
	.tips-card {
		background: #f8f9fa;
		border-radius: 16rpx;
		padding: 32rpx;
		display: flex;
		align-items: center;
		gap: 24rpx;
	}
	
	.tips-confirmed {
		background: #e6f7ff;
		border-left: 8rpx solid #1890ff;
	}
	
	.tips-rejected {
		background: #fff2f0;
		border-left: 8rpx solid #ff4757;
	}
	
	.tips-icon {
		font-size: 48rpx;
		flex-shrink: 0;
	}
	
	.tips-content {
		flex: 1;
	}
	
	.tips-title {
		font-size: 28rpx;
		font-weight: 600;
		color: #1f2329;
		margin-bottom: 8rpx;
	}
	
	.tips-desc {
		font-size: 24rpx;
		color: #666;
		line-height: 1.4;
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
	
	.btn-close {
		padding: 16rpx 24rpx;
		border: none;
		border-radius: 12rpx;
		background: #8f959e;
		color: #fff;
		font-size: 26rpx;
		display: flex;
		align-items: center;
		gap: 8rpx;
		transition: all 0.3s ease;
	}
	
	.btn-close:active {
		transform: scale(0.95);
		background: #6a737d;
	}
	
	.preview-body {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
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
	
	/* 下载进度样式 */
	.download-progress {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 10000;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.progress-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
	}
	
	.progress-content {
		position: relative;
		background: #fff;
		border-radius: 20rpx;
		padding: 64rpx 48rpx;
		text-align: center;
		min-width: 300rpx;
		box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.2);
	}
	
	.progress-spinner {
		width: 64rpx;
		height: 64rpx;
		border: 4rpx solid transparent;
		border-top: 4rpx solid #1890ff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 24rpx;
	}
	
	.progress-text {
		font-size: 32rpx;
		font-weight: 600;
		color: #1f2329;
		display: block;
		margin-bottom: 8rpx;
	}
	
	.progress-subtext {
		font-size: 26rpx;
		color: #8f959e;
		display: block;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
</style>