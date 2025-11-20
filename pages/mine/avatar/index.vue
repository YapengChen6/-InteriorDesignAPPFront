<template>
	<view class="container">
		<view class="page-body uni-content-info">
			<!-- 图片裁剪区域 -->
			<view class='cropper-content'>
				<view v-if="isShowImg" class="uni-corpper" :style="'width:'+cropperInitW+'px;height:'+cropperInitH+'px;background:#000'">
					<view class="uni-corpper-content" :style="'width:'+cropperW+'px;height:'+cropperH+'px;left:'+cropperL+'px;top:'+cropperT+'px'">
						<image :src="imageSrc" :style="'width:'+cropperW+'px;height:'+cropperH+'px'"></image>
						<view class="uni-corpper-crop-box" @touchstart.stop="contentStartMove" @touchmove.stop="contentMoveing" @touchend.stop="contentTouchEnd"
						    :style="'left:'+cutL+'px;top:'+cutT+'px;right:'+cutR+'px;bottom:'+cutB+'px'">
							<view class="uni-cropper-view-box">
								<view class="uni-cropper-dashed-h"></view>
								<view class="uni-cropper-dashed-v"></view>
								<view class="uni-cropper-line-t" data-drag="top" @touchstart.stop="dragStart" @touchmove.stop="dragMove"></view>
								<view class="uni-cropper-line-r" data-drag="right" @touchstart.stop="dragStart" @touchmove.stop="dragMove"></view>
								<view class="uni-cropper-line-b" data-drag="bottom" @touchstart.stop="dragStart" @touchmove.stop="dragMove"></view>
								<view class="uni-cropper-line-l" data-drag="left" @touchstart.stop="dragStart" @touchmove.stop="dragMove"></view>
								<view class="uni-cropper-point point-t" data-drag="top" @touchstart.stop="dragStart" @touchmove.stop="dragMove"></view>
								<view class="uni-cropper-point point-tr" data-drag="topTight"></view>
								<view class="uni-cropper-point point-r" data-drag="right" @touchstart.stop="dragStart" @touchmove.stop="dragMove"></view>
								<view class="uni-cropper-point point-rb" data-drag="rightBottom" @touchstart.stop="dragStart" @touchmove.stop="dragMove"></view>
								<view class="uni-cropper-point point-b" data-drag="bottom" @touchstart.stop="dragStart" @touchmove.stop="dragMove"></view>
								<view class="uni-cropper-point point-bl" data-drag="bottomLeft"></view>
								<view class="uni-cropper-point point-l" data-drag="left" @touchstart.stop="dragStart" @touchmove.stop="dragMove"></view>
								<view class="uni-cropper-point point-lt" data-drag="leftTop"></view>
							</view>
						</view>
					</view>
				</view>
			</view>
			
			<view class='cropper-config'>
				<button type="primary reverse" @click="getImage" style='margin-top: 30rpx;'> 选择头像 </button>
				<button type="warn" @click="getImageInfo" style='margin-top: 30rpx;'> 提交 </button>
			</view>
			<canvas canvas-id="myCanvas" :style="'position:absolute;border: 1px solid red; width:'+imageW+'px;height:'+imageH+'px;top:-9999px;left:-9999px;'"></canvas>
		</view>
	</view>
</template>

<script>
  import config from '@/config'
  import store from "@/store"
  import { uploadImage, RELATED_TYPES, UPLOAD_STAGES } from "@/api/join.js"
  
  const baseUrl = config.baseUrl
	let sysInfo = uni.getSystemInfoSync()
	let SCREEN_WIDTH = sysInfo.screenWidth
	let PAGE_X, // 手按下的x位置
		PAGE_Y, // 手按下y的位置 
		PR = sysInfo.pixelRatio, // dpi
		T_PAGE_X, // 手移动的时候x的位置
		T_PAGE_Y, // 手移动的时候Y的位置
		CUT_L, // 初始化拖拽元素的left值
		CUT_T, // 初始化拖拽元素的top值
		CUT_R, // 初始化拖拽元素的
		CUT_B, // 初始化拖拽元素的
		CUT_W, // 初始化拖拽元素的宽度
		CUT_H, //  初始化拖拽元素的高度
		IMG_RATIO, // 图片比例
		IMG_REAL_W, // 图片实际的宽度
		IMG_REAL_H, // 图片实际的高度
		DRAFG_MOVE_RATIO = 1, //移动时候的比例,
		INIT_DRAG_POSITION = 100, // 初始化屏幕宽度和裁剪区域的宽度之差，用于设置初始化裁剪的宽度
		DRAW_IMAGE_W = sysInfo.screenWidth // 设置生成的图片宽度

	export default {
		/**
		 * 页面的初始数据
		 */
		data() {
			return {
				imageSrc: store.getters.avatar,
				isShowImg: false,
				// 初始化的宽高
				cropperInitW: SCREEN_WIDTH,
				cropperInitH: SCREEN_WIDTH,
				// 动态的宽高
				cropperW: SCREEN_WIDTH,
				cropperH: SCREEN_WIDTH,
				// 动态的left top值
				cropperL: 0,
				cropperT: 0,

				transL: 0,
				transT: 0,

				// 图片缩放值
				scaleP: 0,
				imageW: 0,
				imageH: 0,

				// 裁剪框 宽高
				cutL: 0,
				cutT: 0,
				cutB: SCREEN_WIDTH,
				cutR: '100%',
				qualityWidth: DRAW_IMAGE_W,
				innerAspectRadio: DRAFG_MOVE_RATIO,
				
				// 上传相关
				uploading: false,
				
				// 统一的压缩设置（不再展示给用户）
				compressionQuality: 80, // 统一压缩质量80%
				targetSize: 400, // 统一目标尺寸400×400
				originalFileSize: 0
			}
		},
		/**
		 * 生命周期函数--监听页面初次渲染完成
		 */
		onReady: function () {
			this.loadImage()
		},
		onUnload() {
			// 移除事件监听
			uni.$off('avatarUpdated')
		},
		methods: {
			setData: function (obj) {
				let that = this
				Object.keys(obj).forEach(function (key) {
					that.$set(that.$data, key, obj[key])
				})
			},
			
			getImage: function () {
				var _this = this
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed', 'original'], // 可以选压缩图或原图
					sourceType: ['album', 'camera'],
					success: function (res) {
						console.log('📸 选择的图片:', res.tempFilePaths[0])
						
						// 获取原图文件大小
						uni.getFileInfo({
							filePath: res.tempFilePaths[0],
							success: (fileInfo) => {
								_this.originalFileSize = fileInfo.size
							}
						})
						
						_this.setData({
							imageSrc: res.tempFilePaths[0],
						})
						_this.loadImage()
					},
				})
			},
			
			loadImage: function () {
				var _this = this

				uni.getImageInfo({
					src: _this.imageSrc,
					success: function success(res) {
						IMG_RATIO = 1 / 1
						if (IMG_RATIO >= 1) {
							IMG_REAL_W = SCREEN_WIDTH
							IMG_REAL_H = SCREEN_WIDTH / IMG_RATIO
						} else {
							IMG_REAL_W = SCREEN_WIDTH * IMG_RATIO
							IMG_REAL_H = SCREEN_WIDTH
						}
						let minRange = IMG_REAL_W > IMG_REAL_H ? IMG_REAL_W : IMG_REAL_H
						INIT_DRAG_POSITION = minRange > INIT_DRAG_POSITION ? INIT_DRAG_POSITION : minRange
						// 根据图片的宽高显示不同的效果   保证图片可以正常显示
						if (IMG_RATIO >= 1) {
							let cutT = Math.ceil((SCREEN_WIDTH / IMG_RATIO - (SCREEN_WIDTH / IMG_RATIO - INIT_DRAG_POSITION)) / 2)
							let cutB = cutT
							let cutL = Math.ceil((SCREEN_WIDTH - SCREEN_WIDTH + INIT_DRAG_POSITION) / 2)
							let cutR = cutL
							_this.setData({
								cropperW: SCREEN_WIDTH,
								cropperH: SCREEN_WIDTH / IMG_RATIO,
								// 初始化left right
								cropperL: Math.ceil((SCREEN_WIDTH - SCREEN_WIDTH) / 2),
								cropperT: Math.ceil((SCREEN_WIDTH - SCREEN_WIDTH / IMG_RATIO) / 2),
								cutL: cutL,
								cutT: cutT,
								cutR: cutR,
								cutB: cutB,
								// 图片缩放值
								imageW: IMG_REAL_W,
								imageH: IMG_REAL_H,
								scaleP: IMG_REAL_W / SCREEN_WIDTH,
								qualityWidth: DRAW_IMAGE_W,
								innerAspectRadio: IMG_RATIO
							})
						} else {
							let cutL = Math.ceil((SCREEN_WIDTH * IMG_RATIO - (SCREEN_WIDTH * IMG_RATIO)) / 2)
							let cutR = cutL
							let cutT = Math.ceil((SCREEN_WIDTH - INIT_DRAG_POSITION) / 2)
							let cutB = cutT
							_this.setData({
								cropperW: SCREEN_WIDTH * IMG_RATIO,
								cropperH: SCREEN_WIDTH,
								// 初始化left right
								cropperL: Math.ceil((SCREEN_WIDTH - SCREEN_WIDTH * IMG_RATIO) / 2),
								cropperT: Math.ceil((SCREEN_WIDTH - SCREEN_WIDTH) / 2),

								cutL: cutL,
								cutT: cutT,
								cutR: cutR,
								cutB: cutB,
								// 图片缩放值
								imageW: IMG_REAL_W,
								imageH: IMG_REAL_H,
								scaleP: IMG_REAL_W / SCREEN_WIDTH,
								qualityWidth: DRAW_IMAGE_W,
								innerAspectRadio: IMG_RATIO
							})
						}
						_this.setData({
							isShowImg: true
						})
						uni.hideLoading()
					}
				})
			},
			
			// 拖动时候触发的touchStart事件
			contentStartMove(e) {
				PAGE_X = e.touches[0].pageX
				PAGE_Y = e.touches[0].pageY
			},

			// 拖动时候触发的touchMove事件
			contentMoveing(e) {
				var _this = this
				var dragLengthX = (PAGE_X - e.touches[0].pageX) * DRAFG_MOVE_RATIO
				var dragLengthY = (PAGE_Y - e.touches[0].pageY) * DRAFG_MOVE_RATIO
				// 左移
				if (dragLengthX > 0) {
					if (this.cutL - dragLengthX < 0) dragLengthX = this.cutL
				} else {
					if (this.cutR + dragLengthX < 0) dragLengthX = -this.cutR
				}

				if (dragLengthY > 0) {
					if (this.cutT - dragLengthY < 0) dragLengthY = this.cutT
				} else {
					if (this.cutB + dragLengthY < 0) dragLengthY = -this.cutB
				}
				this.setData({
					cutL: this.cutL - dragLengthX,
					cutT: this.cutT - dragLengthY,
					cutR: this.cutR + dragLengthX,
					cutB: this.cutB + dragLengthY
				})

				PAGE_X = e.touches[0].pageX
				PAGE_Y = e.touches[0].pageY
			},

			contentTouchEnd() {

			},

			// 获取图片
			getImageInfo() {
				var _this = this
				
				if (this.uploading) {
					uni.showToast({ title: "正在上传中...", icon: 'none' })
					return
				}
				
				uni.showLoading({
					title: '图片生成中...',
				})
				
				// 将图片写入画布
				const ctx = uni.createCanvasContext('myCanvas')
				ctx.drawImage(_this.imageSrc, 0, 0, IMG_REAL_W, IMG_REAL_H)
				ctx.draw(true, () => {
					// 获取画布要裁剪的位置和宽度   均为百分比 * 画布中图片的宽度    保证了在微信小程序中裁剪的图片模糊  位置不对的问题 canvasT = (_this.cutT / _this.cropperH) * (_this.imageH / pixelRatio)
					var canvasW = ((_this.cropperW - _this.cutL - _this.cutR) / _this.cropperW) * IMG_REAL_W
					var canvasH = ((_this.cropperH - _this.cutT - _this.cutB) / _this.cropperH) * IMG_REAL_H
					var canvasL = (_this.cutL / _this.cropperW) * IMG_REAL_W
					var canvasT = (_this.cutT / _this.cropperH) * IMG_REAL_H
					
					console.log('🎨 压缩设置:', {
						质量: _this.compressionQuality + '%',
						目标尺寸: _this.targetSize + '×' + _this.targetSize,
						裁剪区域: { canvasL, canvasT, canvasW, canvasH }
					})
					
					// 计算压缩质量 (0-1)
					const quality = _this.compressionQuality / 100
					
					uni.canvasToTempFilePath({
						x: canvasL,
						y: canvasT,
						width: canvasW,
						height: canvasH,
						destWidth: _this.targetSize,  // 使用统一的压缩尺寸
						destHeight: _this.targetSize, // 使用统一的压缩尺寸
						quality: quality,              // 使用统一的压缩质量
						canvasId: 'myCanvas',
						success: function (res) {
							uni.hideLoading()
							console.log('🎨 生成的临时文件路径:', res.tempFilePath)
							
							_this.uploadAvatar(res.tempFilePath)
						},
						fail: function (error) {
							uni.hideLoading()
							console.error('❌ 生成图片失败:', error)
							uni.showToast({ title: "生成图片失败", icon: 'none' })
						}
					})
				})
			},
			
			// 格式化文件大小
			formatFileSize(bytes) {
				if (bytes === 0) return '0 Bytes'
				const k = 1024
				const sizes = ['Bytes', 'KB', 'MB', 'GB']
				const i = Math.floor(Math.log(bytes) / Math.log(k))
				return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
			},
			
			// 使用统一的图片上传接口上传头像
			async uploadAvatar(filePath) {
				try {
					this.uploading = true
					uni.showLoading({
						title: '上传中...',
					})
					
					console.log('🚀 开始上传头像，文件路径:', filePath)
					console.log('🔍 RELATED_TYPES.USER_AVATAR:', RELATED_TYPES.USER_AVATAR)
					
					// 获取用户ID，如果没有则使用0
					const userInfo = store.getters.userInfo
					const userId = userInfo?.userId || 0
					
					console.log('👤 用户信息:', userInfo)
					console.log('🆔 用户ID:', userId)
					
					// 检查 RELATED_TYPES.USER_AVATAR 是否存在
					const relatedType = RELATED_TYPES.USER_AVATAR || 8
					console.log('📝 关联类型:', relatedType)
					
					// 使用统一的图片上传接口
					const result = await uploadImage(
						filePath,                    // 文件路径
						relatedType,                 // 关联类型：用户头像
						userId,                      // 关联ID：用户ID
						'用户头像',                   // 描述
						UPLOAD_STAGES.APPLICATION,   // 阶段：申请阶段
						0                            // 序列号
					)
					
					console.log('✅ 头像上传成功:', result)
					
					// 更新用户头像
					if (result.imageUrl) {
						// 存储完整的头像URL
						const avatarUrl = result.imageUrl
						
						// 1. 更新 Vuex store
						store.commit('SET_AVATAR', avatarUrl)
						
						// 2. 同时更新用户信息中的头像
						const currentUserInfo = store.getters.userInfo
						if (currentUserInfo) {
							const updatedUserInfo = {
								...currentUserInfo,
								avatar: avatarUrl
							}
							store.commit('SET_USER_INFO', updatedUserInfo)
						}
						
						// 3. 更新本地存储（如果需要）
						try {
							uni.setStorageSync('userAvatar', avatarUrl)
						} catch (e) {
							console.error('保存头像到本地存储失败:', e)
						}
						
						uni.showToast({ 
							title: "头像上传成功", 
							icon: 'success',
							duration: 2000
						})
						
						// 延迟返回上一页，让用户看到成功提示
						setTimeout(() => {
							uni.navigateBack({
								success: () => {
									// 发送全局事件通知其他页面更新头像
									uni.$emit('avatarUpdated', avatarUrl)
								}
							})
						}, 1500)
					} else {
						throw new Error('上传成功但未返回图片URL')
					}
					
				} catch (error) {
					console.error('❌ 头像上传失败:', error)
					uni.showToast({ 
						title: "上传失败: " + (error.message || '未知错误'), 
						icon: 'none',
						duration: 3000
					})
				} finally {
					this.uploading = false
					uni.hideLoading()
				}
			},
			
			// 设置大小的时候触发的touchStart事件
			dragStart(e) {
				T_PAGE_X = e.touches[0].pageX
				T_PAGE_Y = e.touches[0].pageY
				CUT_L = this.cutL
				CUT_R = this.cutR
				CUT_B = this.cutB
				CUT_T = this.cutT
			},

			// 设置大小的时候触发的touchMove事件
			dragMove(e) {
				var _this = this
				var dragType = e.target.dataset.drag
				switch (dragType) {
					case 'right':
						var dragLength = (T_PAGE_X - e.touches[0].pageX) * DRAFG_MOVE_RATIO
						if (CUT_R + dragLength < 0) dragLength = -CUT_R
						this.setData({
							cutR: CUT_R + dragLength
						})
						break
					case 'left':
						var dragLength = (T_PAGE_X - e.touches[0].pageX) * DRAFG_MOVE_RATIO
						if (CUT_L - dragLength < 0) dragLength = CUT_L
						if ((CUT_L - dragLength) > (this.cropperW - this.cutR)) dragLength = CUT_L - (this.cropperW - this.cutR)
						this.setData({
							cutL: CUT_L - dragLength
						})
						break
					case 'top':
						var dragLength = (T_PAGE_Y - e.touches[0].pageY) * DRAFG_MOVE_RATIO
						if (CUT_T - dragLength < 0) dragLength = CUT_T
						if ((CUT_T - dragLength) > (this.cropperH - this.cutB)) dragLength = CUT_T - (this.cropperH - this.cutB)
						this.setData({
							cutT: CUT_T - dragLength
						})
						break
					case 'bottom':
						var dragLength = (T_PAGE_Y - e.touches[0].pageY) * DRAFG_MOVE_RATIO
						if (CUT_B + dragLength < 0) dragLength = -CUT_B
						this.setData({
							cutB: CUT_B + dragLength
						})
						break
					case 'rightBottom':
						var dragLengthX = (T_PAGE_X - e.touches[0].pageX) * DRAFG_MOVE_RATIO
						var dragLengthY = (T_PAGE_Y - e.touches[0].pageY) * DRAFG_MOVE_RATIO

						if (CUT_B + dragLengthY < 0) dragLengthY = -CUT_B
						if (CUT_R + dragLengthX < 0) dragLengthX = -CUT_R
						let cutB = CUT_B + dragLengthY
						let cutR = CUT_R + dragLengthX

						this.setData({
							cutB: cutB,
							cutR: cutR
						})
						break
					default:
						break
				}
			}
		}
	}
</script>

<style scoped>
	.cropper-config {
		padding: 20rpx 40rpx;
	}

	.cropper-content {
		min-height: 750rpx;
		width: 100%;
	}

	.uni-corpper {
		position: relative;
		overflow: hidden;
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
		-webkit-touch-callout: none;
		box-sizing: border-box;
	}

	.uni-corpper-content {
		position: relative;
	}

	.uni-corpper-content image {
		display: block;
		width: 100%;
		min-width: 0 !important;
		max-width: none !important;
		height: 100%;
		min-height: 0 !important;
		max-height: none !important;
		image-orientation: 0deg !important;
		margin: 0 auto;
	}

	/* 移动图片效果 */
	.uni-cropper-drag-box {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		cursor: move;
		background: rgba(0, 0, 0, 0.6);
		z-index: 1;
	}

	/* 内部的信息 */
	.uni-corpper-crop-box {
		position: absolute;
		background: rgba(255, 255, 255, 0.3);
		z-index: 2;
	}

	.uni-corpper-crop-box .uni-cropper-view-box {
		position: relative;
		display: block;
		width: 100%;
		height: 100%;
		overflow: visible;
		outline: 1rpx solid #69f;
		outline-color: rgba(102, 153, 255, .75)
	}

	/* 横向虚线 */
	.uni-cropper-dashed-h {
		position: absolute;
		top: 33.33333333%;
		left: 0;
		width: 100%;
		height: 33.33333333%;
		border-top: 1rpx dashed rgba(255, 255, 255, 0.5);
		border-bottom: 1rpx dashed rgba(255, 255, 255, 0.5);
	}

	/* 纵向虚线 */
	.uni-cropper-dashed-v {
		position: absolute;
		left: 33.33333333%;
		top: 0;
		width: 33.33333333%;
		height: 100%;
		border-left: 1rpx dashed rgba(255, 255, 255, 0.5);
		border-right: 1rpx dashed rgba(255, 255, 255, 0.5);
	}

	/* 四个方向的线  为了之后的拖动事件*/
	.uni-cropper-line-t {
		position: absolute;
		display: block;
		width: 100%;
		background-color: #69f;
		top: 0;
		left: 0;
		height: 1rpx;
		opacity: 0.1;
		cursor: n-resize;
	}

	.uni-cropper-line-t::before {
		content: '';
		position: absolute;
		top: 50%;
		right: 0rpx;
		width: 100%;
		-webkit-transform: translate3d(0, -50%, 0);
		transform: translate3d(0, -50%, 0);
		bottom: 0;
		height: 41rpx;
		background: transparent;
		z-index: 11;
	}

	.uni-cropper-line-r {
		position: absolute;
		display: block;
		background-color: #69f;
		top: 0;
		right: 0rpx;
		width: 1rpx;
		opacity: 0.1;
		height: 100%;
		cursor: e-resize;
	}

	.uni-cropper-line-r::before {
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		width: 41rpx;
		-webkit-transform: translate3d(-50%, 0, 0);
		transform: translate3d(-50%, 0, 0);
		bottom: 0;
		height: 100%;
		background: transparent;
		z-index: 11;
	}

	.uni-cropper-line-b {
		position: absolute;
		display: block;
		width: 100%;
		background-color: #69f;
		bottom: 0;
		left: 0;
		height: 1rpx;
		opacity: 0.1;
		cursor: s-resize;
	}

	.uni-cropper-line-b::before {
		content: '';
		position: absolute;
		top: 50%;
		right: 0rpx;
		width: 100%;
		-webkit-transform: translate3d(0, -50%, 0);
		transform: translate3d(0, -50%, 0);
		bottom: 0;
		height: 41rpx;
		background: transparent;
		z-index: 11;
	}

	.uni-cropper-line-l {
		position: absolute;
		display: block;
		background-color: #69f;
		top: 0;
		left: 0;
		width: 1rpx;
		opacity: 0.1;
		height: 100%;
		cursor: w-resize;
	}

	.uni-cropper-line-l::before {
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		width: 41rpx;
		-webkit-transform: translate3d(-50%, 0, 0);
		transform: translate3d(-50%, 0, 0);
		bottom: 0;
		height: 100%;
		background: transparent;
		z-index: 11;
	}

	.uni-cropper-point {
		width: 5rpx;
		height: 5rpx;
		background-color: #69f;
		opacity: .75;
		position: absolute;
		z-index: 3;
	}

	.point-t {
		top: -3rpx;
		left: 50%;
		margin-left: -3rpx;
		cursor: n-resize;
	}

	.point-tr {
		top: -3rpx;
		left: 100%;
		margin-left: -3rpx;
		cursor: n-resize;
	}

	.point-r {
		top: 50%;
		left: 100%;
		margin-left: -3rpx;
		margin-top: -3rpx;
		cursor: n-resize;
	}

	.point-rb {
		left: 100%;
		top: 100%;
		-webkit-transform: translate3d(-50%, -50%, 0);
		transform: translate3d(-50%, -50%, 0);
		cursor: n-resize;
		width: 36rpx;
		height: 36rpx;
		background-color: #69f;
		position: absolute;
		z-index: 1112;
		opacity: 1;
	}

	.point-b {
		left: 50%;
		top: 100%;
		margin-left: -3rpx;
		margin-top: -3rpx;
		cursor: n-resize;
	}

	.point-bl {
		left: 0%;
		top: 100%;
		margin-left: -3rpx;
		margin-top: -3rpx;
		cursor: n-resize;
	}

	.point-l {
		left: 0%;
		top: 50%;
		margin-left: -3rpx;
		margin-top: -3rpx;
		cursor: n-resize;
	}

	.point-lt {
		left: 0%;
		top: 0%;
		margin-left: -3rpx;
		margin-top: -3rpx;
		cursor: n-resize;
	}

	/* 裁剪框预览内容 */
	.uni-cropper-viewer {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.uni-cropper-viewer image {
		position: absolute;
		z-index: 2;
	}
</style>