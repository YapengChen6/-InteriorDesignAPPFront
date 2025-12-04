<template>
	<view class="web-view-container">
		<!-- 顶部导航栏 -->
		<view class="header">
			<view class="back-btn" @click="goBack">
				<text class="back-icon">‹</text>
				<text class="back-text">返回</text>
			</view>
			<view class="title">{{ pageTitle }}</view>
			<view class="right-space"></view>
		</view>
		
		<!-- 文件预览内容 -->
		<scroll-view class="preview-content" scroll-y="true" v-if="!loading">
			<!-- PDF预览 -->
			<view class="pdf-preview" v-if="fileType === 'pdf'">
				<view class="pdf-header">
					<text class="pdf-title">{{ fileName }}</text>
					<text class="pdf-type">PDF文档</text>
				</view>
				<view class="pdf-body">
					<!-- 使用web-view展示PDF -->
					<web-view 
						v-if="pdfUrl" 
						:src="pdfUrl" 
						class="pdf-viewer"
						@message="onMessage"
					></web-view>
					
					<!-- 如果web-view不可用，显示提示 -->
					<view class="pdf-fallback" v-else>
						<text class="fallback-icon">📄</text>
						<text class="fallback-text">PDF预览加载中...</text>
						<text class="fallback-desc">如果长时间无法加载，请返回并重新选择</text>
						<button class="btn-retry" @click="loadPdfFile">
							<text class="btn-text">重新加载</text>
						</button>
					</view>
				</view>
			</view>
			
			<!-- 图片预览 -->
			<view class="image-preview" v-else-if="fileType === 'image'">
				<view class="image-header">
					<text class="image-title">{{ fileName }}</text>
					<text class="image-type">图片文件</text>
				</view>
				<view class="image-body">
					<image 
						:src="imageUrl" 
						class="preview-image"
						mode="aspectFit"
						@load="onImageLoad"
						@error="onImageError"
						:show-menu-by-longpress="true"
					/>
				</view>
			</view>
			
			<!-- 其他文件预览 -->
			<view class="other-preview" v-else>
				<view class="other-header">
					<text class="other-title">{{ fileName }}</text>
					<text class="other-type">{{ fileType.toUpperCase() }}文件</text>
				</view>
				<view class="other-body">
					<text class="unsupported-icon">📄</text>
					<text class="unsupported-text">该文件类型不支持在线预览</text>
					<text class="unsupported-desc">您可以通过其他方式查看此文件</text>
					<button class="btn-back" @click="goBack">
						<text class="btn-text">返回</text>
					</button>
				</view>
			</view>
		</scroll-view>
		
		<!-- 加载状态 -->
		<view class="loading-state" v-if="loading">
			<view class="loading-content">
				<view class="loading-spinner"></view>
				<text class="loading-text">文件加载中...</text>
			</view>
		</view>
		
		<!-- 底部操作栏 -->
		<view class="bottom-bar" v-if="!loading">
			<button class="btn-action" @click="goBack">
				<text class="btn-icon">←</text>
				<text class="btn-text">返回</text>
			</button>
			<button class="btn-action" @click="saveFile" v-if="fileType !== 'other'">
				<text class="btn-icon">💾</text>
				<text class="btn-text">保存</text>
			</button>
			<button class="btn-action" @click="shareFile" v-if="fileType !== 'other'">
				<text class="btn-icon">↗️</text>
				<text class="btn-text">分享</text>
			</button>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				filePath: '',
				fileName: '文件预览',
				fileType: '',
				pageTitle: '文件预览',
				pdfUrl: '',
				imageUrl: '',
				loading: true,
				loadError: false
			}
		},
		
		onLoad(options) {
			console.log('📄 web-view页面参数:', options)
			this.initParams(options)
		},
		
		onReady() {
			this.loadFileContent()
		},
		
		methods: {
			// 初始化参数
			initParams(options) {
				try {
					if (options.filePath) {
						this.filePath = decodeURIComponent(options.filePath)
					}
					if (options.fileName) {
						this.fileName = decodeURIComponent(options.fileName)
					}
					if (options.fileType) {
						this.fileType = decodeURIComponent(options.fileType)
					}
					
					this.pageTitle = this.fileName || '文件预览'
					
					console.log('🔍 解析后的参数:', {
						filePath: this.filePath,
						fileName: this.fileName,
						fileType: this.fileType
					})
					
				} catch (error) {
					console.error('❌ 参数解析失败:', error)
					this.loadError = true
				}
			},
			
			// 加载文件内容
			async loadFileContent() {
				try {
					if (!this.filePath) {
						throw new Error('文件路径无效')
					}
					
					console.log('📥 加载文件内容:', this.filePath)
					
					// 根据文件类型处理
					if (this.fileType === 'pdf') {
						await this.loadPdfFile()
					} else if (this.fileType === 'image') {
						await this.loadImageFile()
					} else {
						// 其他文件类型不加载具体内容
						setTimeout(() => {
							this.loading = false
						}, 500)
					}
					
				} catch (error) {
					console.error('❌ 文件加载失败:', error)
					this.loadError = true
					this.loading = false
				}
			},
			
			// 加载PDF文件
			async loadPdfFile() {
				try {
					// 在微信小程序中，PDF可以通过web-view展示
					// 这里创建一个简单的HTML页面来展示PDF
					const baseUrl = 'https://mozilla.github.io/pdf.js/web/viewer.html'
					// 由于微信小程序限制，这里简化处理
					// 实际项目中可以考虑将PDF文件上传到服务器，然后使用在线PDF查看器
					
					// 临时方案：显示文件信息和下载选项
					this.pdfUrl = ''
					setTimeout(() => {
						this.loading = false
					}, 1000)
					
				} catch (error) {
					console.error('❌ PDF加载失败:', error)
					this.loading = false
				}
			},
			
			// 加载图片文件
			async loadImageFile() {
				try {
					this.imageUrl = this.filePath
					setTimeout(() => {
						this.loading = false
					}, 500)
				} catch (error) {
					console.error('❌ 图片加载失败:', error)
					this.loading = false
				}
			},
			
			// 图片加载完成
			onImageLoad() {
				console.log('✅ 图片加载完成')
			},
			
			// 图片加载错误
			onImageError(error) {
				console.error('❌ 图片加载失败:', error)
				this.loadError = true
			},
			
			// 接收web-view消息
			onMessage(event) {
				console.log('📨 收到web-view消息:', event)
			},
			
			// 返回上一页
			goBack() {
				uni.navigateBack()
			},
			
			// 保存文件
			saveFile() {
				uni.showModal({
					title: '保存文件',
					content: '确定要保存此文件吗？',
					success: (res) => {
						if (res.confirm) {
							uni.showLoading({
								title: '保存中...'
							})
							
							// 微信小程序中保存文件
							if (this.fileType === 'image') {
								this.saveImage()
							} else if (this.fileType === 'pdf') {
								this.savePdf()
							}
						}
					}
				})
			},
			
			// 保存图片
			saveImage() {
				uni.downloadFile({
					url: this.filePath,
					success: (res) => {
						if (res.statusCode === 200) {
							uni.saveImageToPhotosAlbum({
								filePath: res.tempFilePath,
								success: () => {
									uni.hideLoading()
									uni.showToast({
										title: '图片保存成功',
										icon: 'success'
									})
								},
								fail: (error) => {
									uni.hideLoading()
									console.error('保存失败:', error)
									uni.showToast({
										title: '保存失败',
										icon: 'none'
									})
								}
							})
						}
					},
					fail: (error) => {
						uni.hideLoading()
						console.error('下载失败:', error)
						uni.showToast({
							title: '下载失败',
							icon: 'none'
						})
					}
				})
			},
			
			// 保存PDF
			savePdf() {
				uni.showToast({
					title: 'PDF保存功能暂不可用',
					icon: 'none'
				})
			},
			
			// 分享文件
			shareFile() {
				uni.showToast({
					title: '分享功能开发中',
					icon: 'none'
				})
			}
		}
	}
</script>

<style scoped>
	.web-view-container {
		width: 100vw;
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #f5f5f5;
	}
	
	/* 顶部导航栏 */
	.header {
		height: 88rpx;
		background: #fff;
		display: flex;
		align-items: center;
		padding: 0 32rpx;
		border-bottom: 1rpx solid #e5e5e5;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
		z-index: 100;
	}
	
	.back-btn {
		display: flex;
		align-items: center;
		padding: 16rpx 0;
		background: transparent;
		border: none;
		font-size: 28rpx;
		color: #1890ff;
		font-weight: 500;
	}
	
	.back-icon {
		font-size: 48rpx;
		line-height: 1;
		margin-right: 8rpx;
	}
	
	.title {
		flex: 1;
		text-align: center;
		font-size: 32rpx;
		font-weight: 600;
		color: #333;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin: 0 120rpx;
	}
	
	.right-space {
		width: 120rpx;
	}
	
	/* 预览内容区域 */
	.preview-content {
		flex: 1;
		background: #fff;
	}
	
	/* PDF预览样式 */
	.pdf-preview {
		width: 100%;
		min-height: 100%;
		display: flex;
		flex-direction: column;
	}
	
	.pdf-header {
		padding: 32rpx;
		border-bottom: 1rpx solid #e5e5e5;
		background: #fafafa;
	}
	
	.pdf-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #333;
		display: block;
		margin-bottom: 16rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.pdf-type {
		font-size: 24rpx;
		color: #666;
		background: #e6f7ff;
		padding: 8rpx 16rpx;
		border-radius: 20rpx;
	}
	
	.pdf-body {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 32rpx;
		background: #f5f5f5;
	}
	
	.pdf-viewer {
		width: 100%;
		height: 100%;
		border: none;
	}
	
	.pdf-fallback {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 80rpx;
	}
	
	.fallback-icon {
		font-size: 120rpx;
		color: #8f959e;
		margin-bottom: 32rpx;
	}
	
	.fallback-text {
		font-size: 32rpx;
		font-weight: 600;
		color: #333;
		margin-bottom: 16rpx;
	}
	
	.fallback-desc {
		font-size: 28rpx;
		color: #666;
		margin-bottom: 48rpx;
	}
	
	.btn-retry {
		padding: 24rpx 48rpx;
		background: #1890ff;
		color: #fff;
		border: none;
		border-radius: 12rpx;
		font-size: 28rpx;
		font-weight: 600;
	}
	
	/* 图片预览样式 */
	.image-preview {
		width: 100%;
		min-height: 100%;
		display: flex;
		flex-direction: column;
	}
	
	.image-header {
		padding: 32rpx;
		border-bottom: 1rpx solid #e5e5e5;
		background: #fafafa;
	}
	
	.image-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #333;
		display: block;
		margin-bottom: 16rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.image-type {
		font-size: 24rpx;
		color: #666;
		background: #fff2e8;
		padding: 8rpx 16rpx;
		border-radius: 20rpx;
	}
	
	.image-body {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 32rpx;
		background: #f5f5f5;
	}
	
	.preview-image {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
	}
	
	/* 其他文件预览样式 */
	.other-preview {
		width: 100%;
		min-height: 100%;
		display: flex;
		flex-direction: column;
	}
	
	.other-header {
		padding: 32rpx;
		border-bottom: 1rpx solid #e5e5e5;
		background: #fafafa;
	}
	
	.other-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #333;
		display: block;
		margin-bottom: 16rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.other-type {
		font-size: 24rpx;
		color: #666;
		background: #f6ffed;
		padding: 8rpx 16rpx;
		border-radius: 20rpx;
	}
	
	.other-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 80rpx;
		text-align: center;
	}
	
	.unsupported-icon {
		font-size: 120rpx;
		color: #8f959e;
		margin-bottom: 32rpx;
	}
	
	.unsupported-text {
		font-size: 32rpx;
		font-weight: 600;
		color: #333;
		margin-bottom: 16rpx;
	}
	
	.unsupported-desc {
		font-size: 28rpx;
		color: #666;
		margin-bottom: 48rpx;
	}
	
	.btn-back {
		padding: 24rpx 48rpx;
		background: #1890ff;
		color: #fff;
		border: none;
		border-radius: 12rpx;
		font-size: 28rpx;
		font-weight: 600;
	}
	
	/* 加载状态 */
	.loading-state {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #fff;
	}
	
	.loading-content {
		display: flex;
		flex-direction: column;
		align-items: center;
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
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	/* 底部操作栏 */
	.bottom-bar {
		height: 100rpx;
		background: #fff;
		display: flex;
		align-items: center;
		justify-content: space-around;
		padding: 0 32rpx;
		border-top: 1rpx solid #e5e5e5;
		box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.08);
	}
	
	.btn-action {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 16rpx;
		background: transparent;
		border: none;
		border-radius: 12rpx;
		transition: all 0.3s ease;
	}
	
	.btn-action:active {
		background: #f5f5f5;
	}
	
	.btn-icon {
		font-size: 36rpx;
		margin-bottom: 8rpx;
	}
	
	.btn-text {
		font-size: 24rpx;
		color: #666;
	}
</style>