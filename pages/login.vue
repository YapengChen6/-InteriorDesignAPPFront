<template>
	<view class="content">
		<!-- 跳过按钮放在右上角 -->
		<view class="skip-container">
			<button class="skip-btn" @click="skipCountdown">跳过 {{countdown}}s</button>
		</view>
		
		<image class="logo" src="/static/logo.png"></image>
		<view class="text-area">
			<text class="title">{{title}}</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				title: 'Hello',
				countdown: 5, // 倒计时5秒
				timer: null // 定时器
			}
		},
		onLoad() {
			// 页面加载时开始倒计时
			this.startCountdown();
		},
		onUnload() {
			// 页面卸载时清除定时器
			this.clearTimer();
		},
		methods: {
			// 开始倒计时
			startCountdown() {
				this.timer = setInterval(() => {
					this.countdown--;
					
					if (this.countdown <= 0) {
						this.clearTimer();
						this.goToPhoneNumber();
					}
				}, 1000);
			},
			
			// 清除定时器
			clearTimer() {
				if (this.timer) {
					clearInterval(this.timer);
					this.timer = null;
				}
			},
			
			// 跳过倒计时，立即跳转
			skipCountdown() {
				this.clearTimer();
				this.goToPhoneNumber();
			},
			
			// 跳转到手机号登录页面
			goToPhoneNumber() {
				uni.navigateTo({
					url: '/pages/register'
				});
			}
		}
	}
</script>

<style>
	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		background-color: #f5f5f5;
		position: relative;
	}
	
	/* 跳过按钮样式 */
	.skip-container {
		position: absolute;
		top: 40px;
		right: 20px;
		z-index: 10;
	}
	
	.skip-btn {
		background-color: rgba(0, 0, 0, 0.3);
		color: white;
		border: none;
		border-radius: 15px;
		padding: 6px 12px;
		font-size: 14px;
		cursor: pointer;
		transition: background-color 0.3s;
	}
	
	.skip-btn:hover {
		background-color: rgba(0, 0, 0, 0.5);
	}
	
	/* 图片样式 */
	.logo {
		width: 120px;
		height: 120px;
		margin-bottom: 30px;
	}
	
	/* 标题样式 */
	.text-area {
		text-align: center;
	}
	
	.title {
		font-size: 24px;
		color: #333;
		font-weight: bold;
	}
</style>