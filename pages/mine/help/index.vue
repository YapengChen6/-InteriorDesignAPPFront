<template>
	<view class="container">
		<view class="report-form">
			<view class="form-section">
				<view class="section-title">
					<view class="step">1</view>
					<text class="section-text">详细描述</text>
				</view>
				<view class="form-group">
					<view class="label required">详细描述</view>
					<textarea 
						v-model="formData.description" 
						placeholder="请详细描述您要举报的问题，包括时间、地点、具体经过等详细信息。提供越详细的信息，越有助于我们处理您的举报。" 
						class="textarea"
						@input="onDescriptionInput"
					></textarea>
					<view class="error-message" v-if="errors.description">
						<text class="error-icon">❌</text>
						<text>请填写详细描述</text>
					</view>
				</view>
			</view>
			
			<view class="form-section">
				<view class="section-title">
					<view class="step">2</view>
					<text class="section-text">上传证据</text>
				</view>
				<view class="form-group">
					<view class="label">图片证据（选填）</view>
					<view class="upload-area" @click="chooseImage">
						<view class="upload-icon">📁</view>
						<view class="upload-text">点击选择图片</view>
						<view class="upload-hint">支持 JPG、PNG 格式，单张图片不超过 5MB</view>
					</view>
					<view class="image-preview">
						<view 
							v-for="(image, index) in uploadedImages" 
							:key="index" 
							class="preview-item"
						>
							<image :src="image" class="preview-image" mode="aspectFill"></image>
							<view class="remove-btn" @click="removeImage(index)">×</view>
						</view>
					</view>
				</view>
			</view>
			
			<view class="form-actions">
				<button type="default" class="btn btn-cancel" @click="cancelForm">取消</button>
				<button 
					type="primary" 
					class="btn btn-submit" 
					:disabled="isSubmitting" 
					@click="submitForm"
					:loading="isSubmitting"
				>
					{{ isSubmitting ? '提交中...' : '提交举报' }}
				</button>
			</view>
			
			<view class="success-message" v-if="showSuccess">
				<view class="success-icon">✅</view>
				<view class="success-title">举报提交成功！</view>
				<view class="success-text">感谢您的反馈，我们会在3个工作日内处理您的举报，并通过站内信通知您处理结果。</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				formData: {
					description: ''
				},
				uploadedImages: [],
				isSubmitting: false,
				showSuccess: false,
				errors: {
					description: false
				}
			}
		},
		methods: {
			onDescriptionInput(e) {
				this.formData.description = e.detail.value;
				if (this.formData.description.trim()) {
					this.errors.description = false;
				}
			},
			
			chooseImage() {
				const that = this;
				uni.chooseImage({
					count: 9,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: function(res) {
						const tempFilePaths = res.tempFilePaths;
						that.uploadedImages = that.uploadedImages.concat(tempFilePaths);
					},
					fail: function(error) {
						console.log('选择图片失败:', error);
						uni.showToast({
							title: '选择图片失败',
							icon: 'none'
						});
					}
				});
			},
			
			removeImage(index) {
				this.uploadedImages.splice(index, 1);
			},
			
			validateForm() {
				this.errors.description = !this.formData.description.trim();
				
				return !this.errors.description;
			},
			
			async submitForm() {
				if (!this.validateForm()) {
					uni.showToast({
						title: '请填写详细描述',
						icon: 'none'
					});
					return;
				}
				
				this.isSubmitting = true;
				
				// 模拟API请求
				await new Promise(resolve => setTimeout(resolve, 2000));
				
				this.showSuccess = true;
				this.resetForm();
				
				setTimeout(() => {
					this.showSuccess = false;
					this.isSubmitting = false;
				}, 5000);
			},
			
			cancelForm() {
				uni.showModal({
					title: '提示',
					content: '确定要取消举报吗？已填写的内容将不会被保存。',
					success: (res) => {
						if (res.confirm) {
							this.resetForm();
							uni.navigateBack();
						}
					}
				});
			},
			
			resetForm() {
				this.formData = {
					description: ''
				};
				this.uploadedImages = [];
				this.errors = {
					description: false
				};
			}
		}
	}
</script>

<style>
	.container {
		min-height: 100vh;
		background-color: #f5f7fa;
	}
	
	.report-form {
		background-color: #fff;
		margin: 20rpx;
		border-radius: 20rpx;
		padding: 40rpx 30rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
	}
	
	.form-section {
		margin-bottom: 60rpx;
		padding-bottom: 40rpx;
		border-bottom: 1rpx solid #eee;
	}
	
	.form-section:last-of-type {
		border-bottom: none;
	}
	
	.section-title {
		display: flex;
		align-items: center;
		margin-bottom: 30rpx;
	}
	
	.step {
		width: 44rpx;
		height: 44rpx;
		background: linear-gradient(135deg, #3498db, #2c3e50);
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24rpx;
		margin-right: 20rpx;
		font-weight: bold;
	}
	
	.section-text {
		font-size: 32rpx;
		color: #2c3e50;
		font-weight: bold;
	}
	
	.form-group {
		margin-bottom: 40rpx;
	}
	
	.label {
		font-size: 30rpx;
		font-weight: 500;
		color: #333;
		margin-bottom: 20rpx;
	}
	
	.required::after {
		content: "*";
		color: #e74c3c;
		margin-left: 8rpx;
	}
	
	.textarea {
		width: 100%;
		min-height: 280rpx;
		padding: 28rpx 30rpx;
		border: 1rpx solid #ddd;
		border-radius: 12rpx;
		background-color: #fafafa;
		font-size: 28rpx;
		line-height: 1.6;
	}
	
	.upload-area {
		border: 2rpx dashed #c8d6e5;
		border-radius: 16rpx;
		padding: 80rpx 40rpx;
		text-align: center;
		background-color: #fafafa;
	}
	
	.upload-icon {
		font-size: 96rpx;
		color: #b2bec3;
		margin-bottom: 30rpx;
	}
	
	.upload-text {
		font-size: 32rpx;
		color: #2d3436;
		margin-bottom: 16rpx;
	}
	
	.upload-hint {
		font-size: 26rpx;
		color: #636e72;
	}
	
	.image-preview {
		display: flex;
		flex-wrap: wrap;
		gap: 30rpx;
		margin-top: 40rpx;
	}
	
	.preview-item {
		position: relative;
		width: 200rpx;
		height: 200rpx;
		border-radius: 16rpx;
		overflow: hidden;
		box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.1);
	}
	
	.preview-image {
		width: 100%;
		height: 100%;
	}
	
	.remove-btn {
		position: absolute;
		top: 10rpx;
		right: 10rpx;
		width: 48rpx;
		height: 48rpx;
		background-color: rgba(231, 76, 60, 0.9);
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rpx;
	}
	
	.form-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 30rpx;
		margin-top: 60rpx;
		padding-top: 40rpx;
		border-top: 1rpx solid #eee;
	}
	
	.btn {
		flex: 1;
		padding: 24rpx 0;
		font-size: 30rpx;
		font-weight: 500;
		border-radius: 12rpx;
		border: none;
		transition: all 0.3s ease;
	}
	
	.btn-cancel {
		background-color: #f5f5f5;
		color: #666;
		order: 1; /* 确保取消按钮在最左边 */
	}
	
	.btn-submit {
		background: linear-gradient(135deg, #3498db, #2c3e50);
		color: white;
		order: 2; /* 确保提交按钮在最右边 */
	}
	
	.btn-cancel:active {
		background-color: #e8e8e8;
		transform: scale(0.98);
	}
	
	.btn-submit:active {
		transform: scale(0.98);
	}
	
	.btn-submit:disabled {
		opacity: 0.6;
	}
	
	.error-message {
		display: flex;
		align-items: center;
		color: #e74c3c;
		font-size: 26rpx;
		margin-top: 16rpx;
	}
	
	.error-icon {
		margin-right: 10rpx;
		font-size: 28rpx;
	}
	
	.success-message {
		background: linear-gradient(135deg, #2ecc71, #27ae60);
		color: white;
		padding: 40rpx;
		border-radius: 16rpx;
		text-align: center;
		margin-top: 40rpx;
		animation: fadeIn 0.5s ease;
	}
	
	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(20rpx); }
		to { opacity: 1; transform: translateY(0); }
	}
	
	.success-icon {
		font-size: 80rpx;
		margin-bottom: 30rpx;
	}
	
	.success-title {
		font-size: 36rpx;
		font-weight: bold;
		margin-bottom: 20rpx;
	}
	
	.success-text {
		font-size: 28rpx;
		line-height: 1.6;
	}
	
	/* 适配小程序 */
	@media (max-width: 750rpx) {
		.report-form {
			margin: 20rpx;
			padding: 30rpx 20rpx;
		}
		
		.form-actions {
			flex-direction: row; /* 保持水平排列 */
		}
		
		.preview-item {
			width: 160rpx;
			height: 160rpx;
		}
	}
</style>