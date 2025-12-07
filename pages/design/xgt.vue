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
								<view class="info-value tag" :class="statusClass">
									{{ statusText }}
								</view>
							</view>
						</view>
						
						<!-- 新增：文件数量信息 -->
						<view class="info-row" v-if="fileList.length > 0">
							<view class="info-item full-width">
								<view class="info-label">文件数量</view>
								<view class="info-value">
									<text class="file-count-badge">{{ fileList.length }} 个文件</text>
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
								<view class="file-icon" :class="file.type === 'pdf' ? 'file-type-pdf' : 'file-type-other'">
									<text class="file-type-icon">{{ file.type === 'pdf' ? '📄' : '📎' }}</text>
								</view>
								<view class="file-info">
									<view class="file-name">{{ file.name }}</view>
									<view class="file-meta">
										<text class="file-index">文件{{ index + 1 }}</text>
										<text class="file-format">{{ file.format }}</text>
										<text class="file-size">{{ file.size }}</text>
									</view>
									<view class="file-status" v-if="file.previewLoading">
										<view class="status-badge loading">
											<text class="status-icon">⏳</text>
											<text class="status-text">打开中...</text>
										</view>
									</view>
								</view>
								<view class="file-actions">
									<button class="btn-action preview" @click="previewFile(file, index)" :disabled="file.previewLoading">
										<text class="btn-icon">👁️</text>
										<text class="btn-text">{{ file.previewLoading ? '打开中...' : '预览' }}</text>
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
					<view class="tips-card" :class="statusCardClass">
						<view class="tips-icon">{{ statusIcon }}</view>
						<view class="tips-content">
							<view class="tips-title">{{ statusTitle }}</view>
							<view class="tips-desc">{{ statusDesc }}</view>
						</view>
					</view>
				</view>
			</template>
		</scroll-view>

		<!-- 全局加载遮罩 -->
		<view class="global-loading" v-if="loadingPreview">
			<view class="loading-modal">
				<view class="loading-content">
					<view class="loading-spinner large"></view>
					<text class="loading-text">文件打开中，请稍候...</text>
					<text class="loading-subtext">请不要关闭页面</text>
				</view>
			</view>
		</view>

		<!-- 简单提示组件 -->
		<uni-popup ref="errorPopup" type="message">
			<uni-popup-message 
				type="error" 
				:message="errorMessage" 
				:duration="3000"
			/>
		</uni-popup>
	</view>
</template>

<script>
	import { getDesignSchemeList, updateDesignSchemeStatus } from '@/api/designScheme.js'
	import uniPopup from '@/uni_modules/uni-popup/components/uni-popup/uni-popup.vue'
	import uniPopupMessage from '@/uni_modules/uni-popup/components/uni-popup-message/uni-popup-message.vue'
	import { isUserLoggedIn, handleNotLoggedIn, createConversationAndNavigate } from "@/utils/conversationHelper.js"
	import { getUserById } from '@/api/users.js'

	// 方案状态常量
	const SCHEME_STATUS = {
		PENDING: 1,
		CONFIRMED: 2,
		REJECTED: 0,
		DELETED: 3
	}

	// 方案类型常量
	const SCHEME_TYPE = {
		EFFECT_DRAWING: 1,
		CONSTRUCTION_DRAWING: 2
	}
	
	// 微信小程序支持的文档类型映射
	const WECHAT_FILE_TYPES = {
		'pdf': 'pdf'
	}

	export default {
		components: {
			uniPopup,
			uniPopupMessage
		},
		
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
				loadingPreview: false,
				
				// 错误信息
				errorMessage: '',
				
				// 当前正在预览的文件索引
				currentPreviewIndex: -1,
				
				// 导出常量到模板
				SCHEME_STATUS: SCHEME_STATUS
			}
		},
		
		computed: {
			schemeTypeText() {
				return this.schemeType === SCHEME_TYPE.EFFECT_DRAWING ? '效果图' : '施工设计图'
			},
			
			statusText() {
				if (!this.schemeData) return ''
				return this.getStatusText(this.schemeData.status)
			},
			
			statusClass() {
				if (!this.schemeData) return ''
				return this.getStatusClass(this.schemeData.status)
			},
			
			statusCardClass() {
				if (!this.schemeData) return ''
				return this.getStatusCardClass(this.schemeData.status)
			},
			
			statusIcon() {
				if (!this.schemeData) return 'ℹ️'
				return this.getStatusIcon(this.schemeData.status)
			},
			
			statusTitle() {
				if (!this.schemeData) return '方案状态'
				return this.getStatusTitle(this.schemeData.status)
			},
			
			statusDesc() {
				if (!this.schemeData) return '请及时处理方案确认'
				return this.getStatusDesc(this.schemeData.status)
			}
		},
		
		onLoad(options) {
			console.log('📝 确认效果图页面参数:', options)
			this.initPageParams(options)
		},
		
		methods: {
			// 在线联系设计师 - 完善版本
			async contactDesigner() {
				console.log('💬 客户开始联系设计师，订单ID:', this.orderId);
				
				// 1. 检查登录状态
				if (!isUserLoggedIn()) {
					handleNotLoggedIn();
					return;
				}
				
				// 2. 检查方案信息完整性
				if (!this.schemeData || !this.schemeData.contractorId) {
					console.error('❌ 方案信息不完整:', this.schemeData);
					uni.showToast({
						title: '方案信息无效',
						icon: 'error',
						duration: 2000
					});
					return;
				}
				
				// 3. 获取设计师ID（承接方）
				const designerId = this.schemeData.contractorId;
				if (!designerId) {
					uni.showToast({
						title: '设计师信息不存在',
						icon: 'none'
					});
					return;
				}
				
				// 4. 获取设计师详细信息
				let designerName = this.designerInfo.name || '';
				let designerAvatar = this.designerInfo.avatar || '';
				
				// 如果设计师信息不全，尝试通过API获取
				if (!designerName || designerName === '未知设计师') {
					try {
						const designerInfo = await this.getDesignerInfoById(designerId);
						designerName = designerInfo.name || '设计师';
						designerAvatar = designerInfo.avatar || '';
					} catch (error) {
						console.warn('⚠️ 获取设计师详细信息失败:', error);
					}
				}
				
				// 5. 显示加载中
				uni.showLoading({
					title: '创建对话中...',
					mask: true
				});
				
				try {
					console.log('💬 准备创建对话:', {
						客户身份: '用户',
						设计师ID: designerId,
						设计师姓名: designerName,
						订单ID: this.orderId,
						方案类型: this.schemeTypeText
					});
					
					// 6. 使用工具函数创建对话并跳转
					await createConversationAndNavigate(
						designerId,
						designerName,
						designerAvatar
					);
					
					console.log('✅ 对话创建成功');
					
				} catch (error) {
					console.error('❌ 创建对话失败:', error);
					
					// 错误处理
					let errorMessage = '联系设计师失败';
					if (error.message) {
						if (error.message.includes('请先登录')) {
							errorMessage = '请先登录';
						} else if (error.message.includes('不能与自己')) {
							errorMessage = '不能联系自己';
						} else if (error.message.includes('权限')) {
							errorMessage = '没有权限联系设计师';
						} else if (error.message.includes('对方不存在')) {
							errorMessage = '设计师信息不存在';
						} else {
							errorMessage = error.message;
						}
					}
					
					uni.showToast({
						title: errorMessage,
						icon: 'none',
						duration: 3000
					});
					
					// 如果是因为对话不存在，尝试直接跳转到聊天页面
					if (error.message && error.message.includes('对话不存在')) {
						console.log('⚠️ 尝试直接跳转到聊天页面');
						setTimeout(() => {
							uni.navigateTo({
								url: `/pages/chat/chat?otherUserId=${designerId}&otherUserName=${encodeURIComponent(designerName)}&orderId=${this.orderId}`
							});
						}, 1000);
					}
				} finally {
					// 7. 隐藏加载状态
					uni.hideLoading();
				}
			},
			
			// 通过ID获取设计师信息
			async getDesignerInfoById(designerId) {
				try {
					console.log('👤 获取设计师信息，ID:', designerId);
					
					const userResponse = await getUserById(designerId);
					console.log('👤 设计师信息响应:', userResponse);
					
					if (userResponse && userResponse.code === 200 && userResponse.data) {
						const userData = userResponse.data;
						
						return {
							// 根据示例数据格式解析
							name: userData.nickName || userData.userName || userData.name || '设计师',
							avatar: userData.avatar || '/static/images/default-avatar.png',
							phone: userData.phone || userData.userName || '',
							role: '设计师'
						};
					} else {
						throw new Error('未获取到设计师信息');
					}
				} catch (error) {
					console.error('❌ 获取设计师信息失败:', error);
					throw error;
				}
			},
			
			initPageParams(options) {
				try {
					this.orderId = options.orderId ? parseInt(options.orderId) : null
					this.schemeType = options.schemeType ? parseInt(options.schemeType) : SCHEME_TYPE.EFFECT_DRAWING
					this.designerName = options.designerName ? decodeURIComponent(options.designerName) : ''
					
					if (!this.orderId) {
						this.showParamsError()
						return
					}
					
					this.initDesignerInfo()
					this.loadSchemeData()
					
				} catch (error) {
					console.error('❌ 参数解析失败:', error)
					this.showParamsError()
				}
			},
			
			initDesignerInfo() {
				if (this.designerName) {
					this.designerInfo.name = this.designerName
					this.designerInfo.avatar = '/static/images/default-avatar.png'
					this.designerInfo.role = '设计师'
				}
			},
			
			async loadSchemeData() {
				if (this.loading) return
				
				this.loading = true
				try {
					console.log('📋 开始加载效果图方案数据，订单ID:', this.orderId, '方案类型:', this.schemeType)
					
					const queryParams = {
						pageNum: 1,
						pageSize: 100,
						orderId: this.orderId,
						schemeType: this.schemeType
					}
					
					const schemeResult = await getDesignSchemeList(queryParams)
					console.log('✅ 方案查询结果:', schemeResult)
					
					if (schemeResult.code === 200 && schemeResult.data) {
						let schemeList = []
						
						if (schemeResult.data.records) {
							schemeList = schemeResult.data.records
						} else if (schemeResult.data.list) {
							schemeList = schemeResult.data.list
						} else if (Array.isArray(schemeResult.data)) {
							schemeList = schemeResult.data
						} else if (Array.isArray(schemeResult)) {
							schemeList = schemeResult
						}
						
						if (schemeList.length > 0) {
							// 按 createTime 倒序排序（最新的在前面）
							schemeList.sort((a, b) => {
								const timeA = new Date(a.createTime || a.uploadTime || 0).getTime();
								const timeB = new Date(b.createTime || b.uploadTime || 0).getTime();
								
								// 降序排列，最新的在前
								return timeB - timeA;
							});
							
							console.log('📊 排序后的方案列表:', schemeList);
							
							// 取第一个（最新的）方案
							this.schemeData = schemeList[0];
							
							console.log('✅ 找到最新效果图方案:', this.schemeData)
							
							// 如果设计师信息不完整，尝试通过ID获取
							if (!this.designerInfo.name && this.schemeData.contractorId) {
								try {
									const designerInfo = await this.getDesignerInfoById(this.schemeData.contractorId);
									this.designerInfo.name = designerInfo.name;
									this.designerInfo.avatar = designerInfo.avatar;
									this.designerInfo.role = designerInfo.role;
								} catch (error) {
									console.warn('⚠️ 获取设计师信息失败，使用默认值:', error);
								}
							}
							
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
			
			// 构建文件列表 - 支持多个文件
			buildFileList() {
				this.fileList = []
				
				console.log('🔍 开始构建文件列表，原始数据:')
				console.log('fileUrl:', this.schemeData.fileUrl)
				console.log('fileUrls:', this.schemeData.fileUrls)
				
				// 情况1：fileUrl字段是逗号分隔的字符串（新格式）
				if (this.schemeData.fileUrl && typeof this.schemeData.fileUrl === 'string') {
					// 检查是否是逗号分隔的多个URL
					if (this.schemeData.fileUrl.includes(',')) {
						const urls = this.schemeData.fileUrl.split(',').filter(url => url && url.trim())
						
						console.log('📁 检测到逗号分隔的多个文件URL，数量:', urls.length)
						
						urls.forEach((url, index) => {
							const cleanUrl = url.trim()
							if (cleanUrl) {
								const fileName = this.getFileNameFromUrl(cleanUrl)
								const fileType = this.getFileType(cleanUrl)
								
								this.fileList.push({
									url: cleanUrl,
									name: fileName || `${this.schemeTypeText}_${index + 1}`,
									type: fileType,
									format: this.getFileFormat(cleanUrl),
									size: this.getFileSize(this.schemeData.fileSize),
									previewLoading: false,
									index: index + 1
								})
							}
						})
					} else {
						// 单个文件的情况
						const cleanUrl = this.schemeData.fileUrl.trim()
						const fileName = this.getFileNameFromUrl(cleanUrl)
						const fileType = this.getFileType(cleanUrl)
						
						this.fileList.push({
							url: cleanUrl,
							name: fileName || `${this.schemeTypeText}方案`,
							type: fileType,
							format: this.getFileFormat(cleanUrl),
							size: this.getFileSize(this.schemeData.fileSize),
							previewLoading: false,
							index: 1
						})
					}
				}
				// 情况2：fileUrls字段是数组
				else if (this.schemeData.fileUrls && Array.isArray(this.schemeData.fileUrls)) {
					console.log('📁 检测到fileUrls数组，数量:', this.schemeData.fileUrls.length)
					
					this.schemeData.fileUrls.forEach((url, index) => {
						if (url && typeof url === 'string') {
							const cleanUrl = url.trim()
							const fileName = this.getFileNameFromUrl(cleanUrl)
							const fileType = this.getFileType(cleanUrl)
							
							this.fileList.push({
								url: cleanUrl,
								name: fileName || `${this.schemeTypeText}_${index + 1}`,
								type: fileType,
								format: this.getFileFormat(cleanUrl),
								size: this.getFileSize(this.schemeData.fileSize),
								previewLoading: false,
								index: index + 1
							})
						}
					})
				}
				// 情况3：没有文件的情况
				else {
					console.log('⚠️ 没有找到有效的文件URL')
				}
				
				console.log('📁 构建完成的文件列表:', this.fileList)
				console.log('📊 文件总数量:', this.fileList.length)
			},
			
			// 从URL中提取文件名
			getFileNameFromUrl(url) {
				if (!url) return ''
				try {
					// 先去掉查询参数
					const cleanUrl = url.split('?')[0]
					// 获取路径的最后一部分
					const pathParts = cleanUrl.split('/')
					let fileName = pathParts[pathParts.length - 1]
					
					// 解码URL编码的文件名
					try {
						fileName = decodeURIComponent(fileName)
					} catch (e) {
						console.warn('解码文件名失败:', e)
					}
					
					// 如果文件名是空的或者看起来像是时间戳，返回更好的名字
					if (!fileName || fileName.match(/^\d+$/)) {
						return `${this.schemeTypeText}_${Date.now().toString().slice(-4)}.pdf`
					}
					
					return fileName
				} catch (error) {
					console.error('提取文件名失败:', error)
					return `${this.schemeTypeText}_文件`
				}
			},
			
			getFileType(url) {
				if (!url) return 'pdf' // 默认为PDF
				const cleanUrl = url.split('?')[0]
				const ext = cleanUrl.split('.').pop().toLowerCase()
				
				const typeMap = {
					'pdf': 'pdf',
					'jpg': 'image', 'jpeg': 'image', 'png': 'image', 
					'gif': 'image', 'bmp': 'image', 'webp': 'image', 'svg': 'image',
					'doc': 'doc', 'docx': 'doc',
					'xls': 'excel', 'xlsx': 'excel',
					'ppt': 'ppt', 'pptx': 'ppt',
					'txt': 'text',
					'zip': 'archive', 'rar': 'archive', '7z': 'archive', 'tar': 'archive'
				}
				return typeMap[ext] || 'pdf' // 默认为PDF
			},
			
			getFileTypeIcon(fileType) {
				const iconMap = {
					'image': '🖼️',
					'pdf': '📄',
					'doc': '📝',
					'excel': '📊',
					'ppt': '📑',
					'text': '📃',
					'archive': '📦',
					'other': '📎'
				}
				return iconMap[fileType] || '📄' // 默认显示PDF图标
			},
			
			getFileFormat(url) {
				if (!url) return 'PDF'
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
					'rar': 'RAR',
					'7z': '7Z'
				}
				return formatMap[ext] || 'PDF' // 默认PDF
			},
			
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
			
			// 预览文件 - 使用与之前代码一致的预览逻辑
			async previewFile(file, index) {
				console.log('🔍 预览文件信息:', file)
				
				if (!file.url) {
					uni.showToast({
						title: '文件链接无效',
						icon: 'none'
					})
					return
				}
				
				this.currentPreviewIndex = index
				this.fileList[index].previewLoading = true
				
				try {
					// 获取文件扩展名
					const fileExt = this.getFileExtension(file.url)
					
					console.log('📄 开始预览文件:', {
						url: file.url,
						ext: fileExt,
						type: file.type,
						name: file.name
					})
					
					// 如果是图片，直接预览
					if (file.type === 'image') {
						await this.previewImageFile(file.url)
					} 
					// 如果是支持的文档类型（PDF、Word、Excel、PPT）
					else if (WECHAT_FILE_TYPES[fileExt]) {
						await this.previewDocumentFile(file.url, fileExt, file.name)
					}
					// 其他文件类型，提示下载
					else {
						await this.handleOtherFile(file, fileExt)
					}
					
				} catch (error) {
					console.error('❌ 预览文件失败:', error)
					this.showError(this.getErrorMessage(error))
				} finally {
					// 重置加载状态
					if (this.currentPreviewIndex === index) {
						this.fileList[index].previewLoading = false
						this.currentPreviewIndex = -1
					}
				}
			},
			
			// 获取文件扩展名
			getFileExtension(url) {
				const cleanUrl = url.split('?')[0]
				const parts = cleanUrl.split('.')
				return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'pdf'
			},
			
			// 预览图片文件
			async previewImageFile(url) {
				return new Promise((resolve, reject) => {
					uni.previewImage({
						urls: [url],
						current: 0,
						success: () => {
							console.log('✅ 图片预览成功')
							resolve()
						},
						fail: (error) => {
							console.error('❌ 图片预览失败:', error)
							reject(new Error('图片预览失败'))
						}
					})
				})
			},
			
			// 预览文档文件（PDF、Word、Excel、PPT）
			async previewDocumentFile(url, fileExt, fileName) {
				return new Promise((resolve, reject) => {
					this.loadingPreview = true
					
					uni.downloadFile({
						url: url,
						header: {
							'Content-Type': 'application/octet-stream'
						},
						success: (res) => {
							this.loadingPreview = false
							console.log('✅ 文件下载成功:', res)
							
							if (res.statusCode === 200) {
								const fileType = WECHAT_FILE_TYPES[fileExt] || 'pdf'
								
								uni.openDocument({
									filePath: res.tempFilePath,
									fileType: fileType,
									showMenu: true,
									success: () => {
										console.log('✅ 文档打开成功')
										resolve()
									},
									fail: (err) => {
										console.error('❌ 文档打开失败:', err)
										reject(new Error(`${fileExt.toUpperCase()}文件打开失败`))
									}
								})
							} else {
								reject(new Error(`下载失败，状态码: ${res.statusCode}`))
							}
						},
						fail: (err) => {
							this.loadingPreview = false
							console.error('❌ 下载失败:', err)
							reject(new Error(`下载请求失败: ${err.errMsg}`))
						}
					})
				})
			},
			
			// 处理其他文件类型
			async handleOtherFile(file, fileExt) {
				return new Promise((resolve, reject) => {
					uni.showModal({
						title: '文件预览',
						content: `${fileExt.toUpperCase()}文件无法在线预览，是否下载文件？`,
						confirmText: '下载',
						cancelText: '取消',
						success: (res) => {
							if (res.confirm) {
								this.downloadFile(file)
								resolve()
							} else {
								reject(new Error('用户取消操作'))
							}
						},
						fail: () => {
							reject(new Error('操作失败'))
						}
					})
				})
			},
			
			// 获取错误信息
			getErrorMessage(error) {
				const msg = error.message || error.errMsg || '预览失败'
				
				if (msg.includes('404')) {
					return '文件不存在或已被删除'
				} else if (msg.includes('网络') || msg.includes('connect') || msg.includes('download')) {
					return '网络连接失败，请检查网络设置'
				} else if (msg.includes('不支持') || msg.includes('不支持的文件类型')) {
					return '文件格式不支持在线预览'
				} else if (msg.includes('用户取消')) {
					return ''
				} else {
					return `预览失败: ${msg}`
				}
			},
			
			// 显示错误提示
			showError(message) {
				if (message) {
					this.errorMessage = message
					this.$refs.errorPopup.open()
				}
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
				
				this.loadingPreview = true
				
				try {
					const downloadResult = await new Promise((resolve, reject) => {
						uni.downloadFile({
							url: file.url,
							success: resolve,
							fail: reject
						})
					})
					
					if (downloadResult.statusCode === 200) {
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
					this.loadingPreview = false
				}
			},
			
			goBack() {
				uni.navigateBack()
			},
			
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
							await this.updateSchemeStatus(SCHEME_STATUS.CONFIRMED)
						}
					}
				})
			},
			
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
							await this.updateSchemeStatus(SCHEME_STATUS.REJECTED)
						}
					}
				})
			},
			
			async updateSchemeStatus(status) {
				this.submitting = true
				
				try {
					console.log('🔄 更新方案状态:', {
						designSchemeId: this.schemeData.designSchemeId,
						status: status
					})
					
					if (!this.schemeData.designSchemeId) {
						throw new Error('方案ID不存在，无法更新状态')
					}
					
					// 重新查询确保我们更新的是最新方案
					const queryParams = {
						pageNum: 1,
						pageSize: 100,
						orderId: this.orderId,
						schemeType: this.schemeType
					}
					
					const checkResult = await getDesignSchemeList(queryParams)
					let latestScheme = null
					
					if (checkResult.code === 200 && checkResult.data) {
						let schemeList = []
						
						if (checkResult.data.records) {
							schemeList = checkResult.data.records
						} else if (checkResult.data.list) {
							schemeList = checkResult.data.list
						} else if (Array.isArray(checkResult.data)) {
							schemeList = checkResult.data
						} else if (Array.isArray(checkResult)) {
							schemeList = checkResult
						}
						
						if (schemeList.length > 0) {
							// 按 createTime 倒序排序
							schemeList.sort((a, b) => {
								const timeA = new Date(a.createTime || a.uploadTime || 0).getTime();
								const timeB = new Date(b.createTime || b.uploadTime || 0).getTime();
								return timeB - timeA;
							});
							
							// 取第一个（最新的）方案
							latestScheme = schemeList[0];
						}
					}
					
					// 验证是否在更新最新方案
					if (!latestScheme || latestScheme.designSchemeId !== this.schemeData.designSchemeId) {
						console.warn('⚠️ 当前方案不是最新方案，不能更新状态')
						uni.showToast({
							title: '只能更新最新方案的状态',
							icon: 'none',
							duration: 3000
						});
						return;
					}
					
					const result = await updateDesignSchemeStatus(
						this.schemeData.designSchemeId, 
						status
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
						
						this.schemeData.status = status
						
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
			
			refreshOrderPage() {
				try {
					const pages = getCurrentPages()
					if (pages.length >= 2) {
						const prevPage = pages[pages.length - 2]
						if (prevPage.route && prevPage.route.includes('order/my-order')) {
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
			
			formatTime(timeStr) {
				if (!timeStr) return '--'
				if (typeof timeStr === 'number') {
					const date = new Date(timeStr)
					return date.toLocaleDateString() + ' ' + date.toLocaleTimeString().slice(0, 5)
				}
				return timeStr
			},
			
			getStatusText(status) {
				const statusMap = {
					[SCHEME_STATUS.PENDING]: '待确认',
					[SCHEME_STATUS.CONFIRMED]: '已确认',
					[SCHEME_STATUS.REJECTED]: '已拒绝',
					[SCHEME_STATUS.DELETED]: '已删除'
				}
				return statusMap[status] || '未知状态'
			},
			
			getStatusClass(status) {
				const classMap = {
					[SCHEME_STATUS.PENDING]: 'status-pending',
					[SCHEME_STATUS.CONFIRMED]: 'status-confirmed',
					[SCHEME_STATUS.REJECTED]: 'status-rejected',
					[SCHEME_STATUS.DELETED]: 'status-deleted'
				}
				return classMap[status] || ''
			},
			
			getStatusCardClass(status) {
				const classMap = {
					[SCHEME_STATUS.CONFIRMED]: 'tips-confirmed',
					[SCHEME_STATUS.REJECTED]: 'tips-rejected'
				}
				return classMap[status] || ''
			},
			
			getStatusIcon(status) {
				const iconMap = {
					[SCHEME_STATUS.CONFIRMED]: '✅',
					[SCHEME_STATUS.REJECTED]: '❌',
					[SCHEME_STATUS.DELETED]: '🗑️'
				}
				return iconMap[status] || 'ℹ️'
			},
			
			getStatusTitle(status) {
				const titleMap = {
					[SCHEME_STATUS.CONFIRMED]: '方案已确认',
					[SCHEME_STATUS.REJECTED]: '方案已拒绝',
					[SCHEME_STATUS.DELETED]: '方案已删除'
				}
				return titleMap[status] || '方案状态'
			},
			
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
		color: #1890ff;
		margin-left: auto;
		background: rgba(24, 144, 255, 0.1);
		padding: 4rpx 12rpx;
		border-radius: 12rpx;
		font-weight: 500;
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
	
	.info-item.full-width {
		flex: none;
		width: 100%;
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
	
	/* 文件数量徽章 */
	.file-count-badge {
		display: inline-block;
		padding: 6rpx 12rpx;
		background: linear-gradient(135deg, #1890ff, #36cfc9);
		color: #fff;
		border-radius: 6rpx;
		font-size: 22rpx;
		font-weight: 500;
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
		border: 1rpx solid rgba(225, 228, 232, 0.6);
	}
	
	.file-item:last-child {
		margin-bottom: 0;
	}
	
	.file-icon {
		width: 80rpx;
		height: 80rpx;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 20rpx;
		flex-shrink: 0;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	}
	
	/* 文件类型图标样式 */
	.file-type-pdf {
		background: linear-gradient(135deg, #1890ff, #36cfc9);
	}
	
	.file-type-other {
		background: linear-gradient(135deg, #722ed1, #9254de);
	}
	
	.file-type-icon {
		font-size: 36rpx;
		color: #fff;
	}
	
	.file-info {
		flex: 1;
		min-width: 0;
	}
	
	.file-name {
		font-size: 28rpx;
		color: #1f2329;
		font-weight: 500;
		margin-bottom: 8rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.file-meta {
		display: flex;
		align-items: center;
		gap: 16rpx;
		margin-bottom: 8rpx;
		flex-wrap: wrap;
	}
	
	.file-index {
		font-size: 24rpx;
		color: #1890ff;
		background: rgba(24, 144, 255, 0.1);
		padding: 2rpx 8rpx;
		border-radius: 6rpx;
		font-weight: 500;
	}
	
	.file-size, .file-format {
		font-size: 24rpx;
		color: #8f959e;
	}
	
	.file-format {
		background: rgba(82, 196, 26, 0.1);
		color: #52c41a;
		padding: 2rpx 8rpx;
		border-radius: 6rpx;
		font-size: 22rpx;
		font-weight: 500;
	}
	
	.file-status {
		margin-top: 4rpx;
	}
	
	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 6rpx;
		padding: 4rpx 12rpx;
		border-radius: 20rpx;
		font-size: 22rpx;
		font-weight: 500;
	}
	
	.status-badge.loading {
		background: rgba(255, 193, 7, 0.1);
		color: #f39c12;
		border: 1rpx solid rgba(243, 156, 18, 0.3);
	}
	
	.status-icon {
		font-size: 20rpx;
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
		flex-direction: column;
		align-items: center;
		gap: 4rpx;
		transition: all 0.3s ease;
		min-width: 80rpx;
		background: transparent;
	}
	
	.btn-action:active:not(:disabled) {
		transform: scale(0.95);
	}
	
	.btn-action:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	.btn-action.preview:active:not(:disabled) {
		background: rgba(24, 144, 255, 0.1);
	}
	
	.btn-action.download:active:not(:disabled) {
		background: rgba(7, 193, 96, 0.1);
	}
	
	.btn-icon {
		font-size: 24rpx;
	}
	
	.btn-text {
		font-size: 20rpx;
		color: #8f959e;
		font-weight: 500;
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
	
	/* 联系设计师卡片样式 */
	.contact-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 24rpx;
		text-align: center;
	}
	
	.contact-desc {
		font-size: 28rpx;
		color: #666;
		line-height: 1.5;
	}
	
	.contact-btn {
		background: #1890ff;
		color: #fff;
		padding: 20rpx 40rpx;
		border-radius: 12rpx;
		font-size: 28rpx;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 10rpx;
		border: none;
	}
	
	.contact-btn:active {
		background: #0d7ae5;
		transform: scale(0.98);
	}
	
	.contact-icon {
		font-size: 28rpx;
	}
	
	.contact-text {
		font-size: 28rpx;
		font-weight: 500;
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
	
	/* 全局加载遮罩 */
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
	
	.loading-spinner.large {
		width: 64rpx;
		height: 64rpx;
		border: 4rpx solid transparent;
		border-top: 4rpx solid #1890ff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 24rpx;
	}
	
	.loading-text {
		font-size: 32rpx;
		font-weight: 600;
		color: #1f2329;
		margin-bottom: 8rpx;
	}
	
	.loading-subtext {
		font-size: 26rpx;
		color: #8f959e;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
</style>