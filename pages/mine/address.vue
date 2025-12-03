<template>
	<view class="container">
		<!-- 头部 -->
		<view class="header">
			<text class="header-title">收货地址</text>
			<button class="btn-add" @tap="openAddModal">+ 新增地址</button>
		</view>
		
		<!-- 地址列表 -->
		<view class="address-list" v-if="addresses.length > 0">
			<view 
				class="address-card" 
				:class="{ 'default': address.isDefault }" 
				v-for="address in addresses" 
				:key="address.addressId"
			>
				<view class="default-tag" v-if="address.isDefault">默认地址</view>
				<view class="address-info">
					<view class="address-name">{{ address.name }} {{ address.phone }}</view>
					<view class="address-detail">{{ address.region }}</view>
				</view>
				<view class="address-actions">
					<view>
						<text 
							class="action-btn" 
							@tap="setDefaultAddress(address.addressId)"
							v-if="!address.isDefault"
						>设为默认</text>
					</view>
					<view>
						<text class="action-btn" @tap="editAddress(address.addressId)">编辑</text>
						<text class="action-btn" @tap="deleteAddress(address.addressId)">删除</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 空状态 -->
		<view class="empty-state" v-else>
			<text class="empty-text">您还没有添加收货地址</text>
			<button class="btn-add-first" @tap="openAddModal">添加收货地址</button>
		</view>
		
		<!-- 添加/编辑地址模态框 -->
		<view class="modal" v-if="showModal">
			<view class="modal-mask" @tap="closeModal"></view>
			<view class="modal-content">
				<view class="modal-header">
					<text class="modal-title">{{ isEditing ? '编辑收货地址' : '新增收货地址' }}</text>
					<text class="close-btn" @tap="closeModal">×</text>
				</view>
				<view class="modal-body">
					<view class="form-row">
						<view class="form-group">
							<label class="form-label">收货人</label>
							<input 
								type="text" 
								class="editor-input"
								v-model="formData.name" 
								placeholder="请输入收货人姓名"
								placeholder-class="placeholder"
								maxlength="20"
								confirm-type="done"
								@focus="onInputFocus"
								@blur="onInputBlur"
							/>
						</view>
						<view class="form-group">
							<label class="form-label">手机号码</label>
							<input 
								type="number" 
								class="editor-input"
								v-model="formData.phone" 
								placeholder="请输入手机号码"
								placeholder-class="placeholder"
								maxlength="11"
								confirm-type="done"
								@focus="onInputFocus"
								@blur="onInputBlur"
							/>
						</view>
					</view>
					<view class="form-group">
						<label class="form-label">收货地址</label>
						<input 
							type="text" 
							class="editor-input"
							v-model="formData.region" 
							placeholder="省市区 + 街道楼牌等详细信息"
							placeholder-class="placeholder"
							maxlength="200"
							confirm-type="done"
							@focus="onInputFocus"
							@blur="onInputBlur"
						/>
					</view>
					<view class="checkbox-group">
						<checkbox-group @change="onDefaultChange">
						<label class="checkbox-label">
							<checkbox 
									value="1"
									:checked="!!formData.isDefault"
								style="transform:scale(0.7)"
							/>
							<text>设为默认地址</text>
						</label>
						</checkbox-group>
					</view>
					<view class="modal-footer">
						<button class="btn-cancel" @tap="closeModal">取消</button>
						<button class="btn-submit" @tap="handleFormSubmit">保存</button>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { 
		getAddressList, 
		addAddress, 
		updateAddress, 
		deleteAddress as apiDeleteAddress, 
		setDefaultAddress as apiSetDefaultAddress 
	} from '@/api/address.js'

	export default {
		data() {
			return {
				fromPage: '', // 标记从哪个页面进入，例：checkout
				addresses: [],
				formData: {
					name: '',
					phone: '',
					region: '',
					isDefault: false
				},
				currentEditId: null,
				isEditing: false,
				showModal: false
			}
		},
		async onLoad(options) {
			// 记录来源页面，例如 /pages/mine/address?from=checkout
			if (options && options.from) {
				this.fromPage = options.from;
			}
			// 初始化加载后端地址列表
			await this.loadAddressList();
		},
		methods: {
			// 从后端加载地址列表
			async loadAddressList() {
				try {
					const res = await getAddressList();
					if (res && res.code === 200 && Array.isArray(res.data)) {
						this.addresses = res.data;
					} else {
						this.addresses = [];
					}
				} catch (e) {
					console.error('加载地址列表失败：', e);
					this.addresses = [];
					uni.showToast({
						title: e.message || '加载地址失败',
						icon: 'none'
					});
				}
			},
			// 输入框聚焦事件
			onInputFocus() {
				console.log('输入框聚焦');
			},
			
			// 输入框失焦事件
			onInputBlur() {
				console.log('输入框失焦');
			},
			
			// 打开添加地址模态框
			openAddModal() {
				this.currentEditId = null;
				this.isEditing = false;
				this.resetForm();
				this.showModal = true;
			},
			
			// 打开编辑地址模态框
			editAddress(id) {
				const address = this.addresses.find(addr => addr.addressId === id);
				if (!address) return;
				
				this.currentEditId = id;
				this.isEditing = true;
				// 后端 isDefault 通常是 0/1，把它转成布尔值，避免勾选异常
				this.formData = {
					name: address.name || '',
					phone: address.phone || '',
					region: address.region || '',
					isDefault: address.isDefault === 1 || address.isDefault === true
				};
				this.showModal = true;
			},
			
			// 关闭模态框
			closeModal() {
				this.showModal = false;
			},
			
			// 重置表单
			resetForm() {
				this.formData = {
					name: '',
					phone: '',
					region: '',
					isDefault: false
				};
			},
			
			// 勾选“设为默认地址”时触发
			onDefaultChange(e) {
				// checkbox-group 返回选中的 value 数组，非空表示选中
				const values = e && e.detail && e.detail.value ? e.detail.value : [];
				this.formData.isDefault = Array.isArray(values) && values.length > 0;
			},
			
			// 设置默认地址
			async setDefaultAddress(id) {
				try {
					await apiSetDefaultAddress(id);
					// 重新从后端加载，确保当前页和结算页看到的是同一条默认地址
					await this.loadAddressList();

				uni.showToast({
					title: '设置成功',
					icon: 'success'
				});

					// 如果是从结算页进入，设置默认后自动返回上一页
					if (this.fromPage === 'checkout') {
						setTimeout(() => {
							uni.navigateBack();
						}, 400);
					}
				} catch (e) {
					console.error('设置默认地址失败：', e);
					uni.showToast({
						title: e.message || '设置失败',
						icon: 'none'
					});
				}
			},
			
			// 删除地址
			deleteAddress(id) {
				uni.showModal({
					title: '提示',
					content: '确定要删除这个地址吗？',
					success: async (res) => {
						if (res.confirm) {
							try {
								await apiDeleteAddress(id);
								await this.loadAddressList();
							uni.showToast({
								title: '删除成功',
								icon: 'success'
							});
							} catch (e) {
								console.error('删除地址失败：', e);
								uni.showToast({
									title: e.message || '删除失败',
									icon: 'none'
								});
							}
						}
					}
				});
			},
			
			// 处理表单提交
			async handleFormSubmit() {
				if (!this.formData.name || !this.formData.phone || !this.formData.region) {
					uni.showToast({
						title: '请填写完整信息',
						icon: 'none'
					});
					return;
				}
				
				// 手机号验证
				const phoneRegex = /^1[3-9]\d{9}$/;
				if (!phoneRegex.test(this.formData.phone)) {
					uni.showToast({
						title: '请输入正确的手机号码',
						icon: 'none'
					});
					return;
				}
				
				try {
				if (this.isEditing) {
						// 编辑现有地址：带上 addressId
						await updateAddress({
							addressId: this.currentEditId,
							name: this.formData.name,
							phone: this.formData.phone,
							region: this.formData.region,
							isDefault: this.formData.isDefault ? 1 : 0
						});
				} else {
					// 添加新地址
						await addAddress({
							name: this.formData.name,
							phone: this.formData.phone,
							region: this.formData.region,
							isDefault: this.formData.isDefault ? 1 : 0
						});
					}
					
					// 重新加载地址列表，和后端保持一致
					await this.loadAddressList();
				
				this.closeModal();
				uni.showToast({
					title: '保存成功',
					icon: 'success'
				});

					// 如果是从结算页进入，保存后直接返回结算页（结算页会重新拉取默认地址）
					if (this.fromPage === 'checkout') {
						setTimeout(() => {
							uni.navigateBack();
						}, 400);
					}
				} catch (e) {
					console.error('保存地址失败：', e);
					uni.showToast({
						title: e.message || '保存失败',
						icon: 'none'
					});
				}
			}
		}
	}
</script>

<style>
	.container {
		padding: 20rpx;
		background-color: #f4f4f4;
		min-height: 100vh;
	}
	
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30rpx;
		padding-bottom: 20rpx;
		border-bottom: 1rpx solid #e0e0e0;
	}
	
	.header-title {
		font-size: 36rpx;
		color: #1890ff;
	}
	
	.btn-add {
		background-color: #1890ff;
		color: white;
		border: none;
		padding: 16rpx 32rpx;
		border-radius: 8rpx;
		font-size: 28rpx;
	}
	
	.address-list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}
	
	.address-card {
		background-color: white;
		border-radius: 16rpx;
		padding: 30rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
		position: relative;
		border: 2rpx solid #e0e0e0;
	}
	
	.address-card.default {
		border-color: #1890ff;
	}
	
	.default-tag {
		position: absolute;
		top: 0;
		right: 0;
		background-color: #1890ff;
		color: white;
		padding: 8rpx 16rpx;
		font-size: 24rpx;
		border-radius: 0 16rpx 0 16rpx;
	}
	
	.address-info {
		margin-bottom: 20rpx;
	}
	
	.address-name {
		font-weight: bold;
		margin-bottom: 10rpx;
		font-size: 32rpx;
	}
	
	.address-detail {
		color: #666;
		font-size: 28rpx;
		line-height: 1.5;
	}
	
	.address-actions {
		display: flex;
		justify-content: space-between;
		margin-top: 20rpx;
		padding-top: 20rpx;
		border-top: 1rpx solid #f0f0f0;
	}
	
	.action-btn {
		color: #1890ff;
		font-size: 28rpx;
		margin-left: 20rpx;
	}
	
	.action-btn:first-child {
		margin-left: 0;
	}
	
	.empty-state {
		text-align: center;
		padding: 80rpx 40rpx;
		color: #999;
	}
	
	.empty-text {
		display: block;
		margin-bottom: 40rpx;
		font-size: 32rpx;
	}
	
	.btn-add-first {
		background-color: #1890ff;
		color: white;
		border: none;
		padding: 20rpx 40rpx;
		border-radius: 8rpx;
		font-size: 28rpx;
	}
	
	/* 模态框样式 */
	.modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 999;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.modal-mask {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
	}
	
	.modal-content {
		background-color: white;
		width: 90%;
		max-width: 600rpx;
		border-radius: 16rpx;
		padding: 40rpx;
		position: relative;
		z-index: 1000;
	}
	
	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30rpx;
		padding-bottom: 20rpx;
		border-bottom: 1rpx solid #e0e0e0;
	}
	
	.modal-title {
		font-size: 36rpx;
		font-weight: normal;
	}
	
	.close-btn {
		font-size: 48rpx;
		color: #999;
	}
	
	.form-row {
		display: flex;
		gap: 20rpx;
	}
	
	.form-group {
		flex: 1;
		margin-bottom: 30rpx;
	}
	
	.form-label {
		display: block;
		margin-bottom: 10rpx;
		font-size: 28rpx;
		color: #666;
	}
	
	/* 输入框样式 */
	.editor-input {
		width: 100%;
		padding: 20rpx;
		border: 1rpx solid #ddd;
		border-radius: 8rpx;
		font-size: 28rpx;
		background-color: #fff;
		height: 80rpx;
		line-height: 80rpx;
	}
	
	.placeholder {
		color: #999;
		font-size: 28rpx;
	}
	
	.checkbox-group {
		margin-top: 20rpx;
	}
	
	.checkbox-label {
		display: flex;
		align-items: center;
		font-size: 28rpx;
	}
	
	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 20rpx;
		margin-top: 40rpx;
	}
	
	.btn-cancel {
		background-color: #f4f4f4;
		color: #333;
		border: none;
		padding: 20rpx 40rpx;
		border-radius: 8rpx;
		font-size: 28rpx;
	}
	
	.btn-submit {
		background-color: #1890ff;
		color: white;
		border: none;
		padding: 20rpx 40rpx;
		border-radius: 8rpx;
		font-size: 28rpx;
	}
</style>