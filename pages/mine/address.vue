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
				:key="address.id"
			>
				<view class="default-tag" v-if="address.isDefault">默认地址</view>
				<view class="address-info">
					<view class="address-name">{{ address.name }} {{ address.phone }}</view>
					<view class="address-detail">{{ address.region }} {{ address.detail }}</view>
				</view>
				<view class="address-actions">
					<view>
						<text 
							class="action-btn" 
							@tap="setDefaultAddress(address.id)"
							v-if="!address.isDefault"
						>设为默认</text>
					</view>
					<view>
						<text class="action-btn" @tap="editAddress(address.id)">编辑</text>
						<text class="action-btn" @tap="deleteAddress(address.id)">删除</text>
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
						<label class="form-label">所在地区</label>
						<input 
							type="text" 
							class="editor-input"
							v-model="formData.region" 
							placeholder="省 市 区"
							placeholder-class="placeholder"
							maxlength="50"
							confirm-type="done"
							@focus="onInputFocus"
							@blur="onInputBlur"
						/>
					</view>
					<view class="form-group">
						<label class="form-label">详细地址</label>
						<input 
							type="text" 
							class="editor-input"
							v-model="formData.detail" 
							placeholder="街道、楼牌号等"
							placeholder-class="placeholder"
							maxlength="100"
							confirm-type="done"
							@focus="onInputFocus"
							@blur="onInputBlur"
						/>
					</view>
					<view class="checkbox-group">
						<label class="checkbox-label">
							<checkbox 
								:checked="formData.isDefault" 
								@tap="toggleDefault" 
								style="transform:scale(0.7)"
							/>
							<text>设为默认地址</text>
						</label>
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
	export default {
		data() {
			return {
				addresses: [
					{
						id: 1,
						name: '张三',
						phone: '13800138000',
						region: '北京市 朝阳区 望京街道',
						detail: '阜通东大街6号院',
						isDefault: true
					},
					{
						id: 2,
						name: '李四',
						phone: '13900139000',
						region: '上海市 浦东新区 陆家嘴街道',
						detail: '世纪大道100号环球金融中心',
						isDefault: false
					}
				],
				formData: {
					name: '',
					phone: '',
					region: '',
					detail: '',
					isDefault: false
				},
				currentEditId: null,
				isEditing: false,
				showModal: false
			}
		},
		methods: {
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
				const address = this.addresses.find(addr => addr.id === id);
				if (!address) return;
				
				this.currentEditId = id;
				this.isEditing = true;
				this.formData = { ...address };
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
					detail: '',
					isDefault: false
				};
			},
			
			// 切换默认地址状态
			toggleDefault() {
				this.formData.isDefault = !this.formData.isDefault;
			},
			
			// 设置默认地址
			setDefaultAddress(id) {
				this.addresses = this.addresses.map(address => ({
					...address,
					isDefault: address.id === id
				}));
				uni.showToast({
					title: '设置成功',
					icon: 'success'
				});
			},
			
			// 删除地址
			deleteAddress(id) {
				uni.showModal({
					title: '提示',
					content: '确定要删除这个地址吗？',
					success: (res) => {
						if (res.confirm) {
							this.addresses = this.addresses.filter(address => address.id !== id);
							uni.showToast({
								title: '删除成功',
								icon: 'success'
							});
						}
					}
				});
			},
			
			// 处理表单提交
			handleFormSubmit() {
				if (!this.formData.name || !this.formData.phone || !this.formData.region || !this.formData.detail) {
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
				
				if (this.isEditing) {
					// 编辑现有地址
					this.addresses = this.addresses.map(address => 
						address.id === this.currentEditId 
							? { ...address, ...this.formData } 
							: { 
								...address, 
								isDefault: this.formData.isDefault ? false : address.isDefault 
							}
					);
				} else {
					// 添加新地址
					const newAddress = {
						id: Date.now(), // 使用时间戳作为ID
						...this.formData
					};
					
					if (this.formData.isDefault) {
						// 如果新地址设为默认，取消其他地址的默认状态
						this.addresses = this.addresses.map(address => ({
							...address,
							isDefault: false
						}));
					}
					
					this.addresses.push(newAddress);
				}
				
				this.closeModal();
				uni.showToast({
					title: '保存成功',
					icon: 'success'
				});
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