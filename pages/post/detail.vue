<template>
	<view class="post-detail-container">
		

		<!-- 加载状态 -->
		<view v-if="loading" class="loading-container">
			<view class="loading-spinner"></view>
			<text class="loading-text">加载中...</text>
		</view>

		<!-- 错误状态 -->
		<view v-else-if="error" class="error-container">
			<text class="error-text">{{ error }}</text>
			<button class="retry-btn" @click="fetchPostDetail">重新加载</button>
		</view>

		<!-- 帖子内容 -->
		<view v-else-if="post" class="post-content">
			<scroll-view class="scroll-content" scroll-y="true" @scrolltolower="onScrollToLower">
				<!-- 帖子头部 -->
				<view class="post-header">
					<h1 class="post-title">{{ post.title || '无标题' }}</h1>
					
					<!-- 作者信息 -->
					<view class="author-info">
						<image 
							:src="post.authorAvatar || '/static/images/default-avatar.png'" 
							class="author-avatar"
							mode="aspectFill"
						></image>
						<view class="author-details">
							<text class="author-name">{{ post.author || '匿名用户' }}</text>
							<view class="post-meta">
								<text class="post-date">{{ formatDate(post.createTime) }}</text>
								<text class="post-views">浏览 {{ post.viewCount || 0 }}</text>
							</view>
						</view>
						<button 
							:class="['follow-btn', { followed: isFollowed }]"
							@click="handleFollow"
							:disabled="followLoading"
						>
							{{ isFollowed ? '已关注' : '关注' }}
						</button>
					</view>
				</view>

				<!-- 图片展示区域 -->
				<view class="post-images" v-if="hasImages">
					<!-- 单图展示 -->
					<view v-if="getImageList().length === 1" class="single-image">
						<image 
							:src="getImageList()[0]" 
							mode="widthFix"
							class="post-image"
							@click="previewImage(0)"
							@error="handleImageError"
							@load="handleImageLoad"
							lazy-load
						></image>
					</view>

					<!-- 多图轮播展示 -->
					<view v-else-if="getImageList().length > 1" class="swiper-container">
						<swiper 
							ref="postSwiper"
							class="post-swiper"
							:indicator-dots="true"
							:indicator-color="'rgba(255, 255, 255, 0.5)'"
							:indicator-active-color="'#ff2e63'"
							:autoplay="swiperAutoplay"
							:circular="true"
							:interval="4000"
							:duration="500"
							:disable-touch="false"
							:current="currentImageIndex"
							@change="onSwiperChange"
							@animationfinish="onSwiperAnimationFinish"
						>
							<swiper-item 
								v-for="(image, index) in getImageList()" 
								:key="index"
								class="swiper-item"
							>
								<image 
									:src="image" 
									mode="aspectFit"
									class="swiper-image"
									@click="previewImage(index)"
									@error="handleImageError"
									@load="handleImageLoad"
									lazy-load
								></image>
							</swiper-item>
						</swiper>
						<!-- 左箭头 -->
						<view class="swiper-arrow swiper-arrow-left" @click="prevImage">
							<uni-icons type="left" size="20" color="#ffffff"></uni-icons>
						</view>
						<!-- 右箭头 -->
						<view class="swiper-arrow swiper-arrow-right" @click="nextImage">
							<uni-icons type="right" size="20" color="#ffffff"></uni-icons>
						</view>
						<!-- 图片数量指示器 -->
						<view class="swiper-indicator-text">
							{{ currentImageIndex + 1 }} / {{ getImageList().length }}
						</view>
					</view>
				</view>

				<!-- 视频展示区域 -->
				<view class="post-videos" v-if="getVideoList().length > 0">
					<view 
						class="video-wrapper" 
						v-for="(video, vIndex) in getVideoList()" 
						:key="vIndex"
					>
						<video
							class="post-video"
							:src="video"
							:poster="post.coverUrl || getImageList()[0] || ''"
							controls
							:enable-progress-gesture="true"
							:show-center-play-btn="true"
							@error="handleVideoError"
						></video>
					</view>
				</view>

				<!-- 帖子内容 -->
				<view class="post-body">
					<view class="content-text">
						<!-- 富文本内容：包含 HTML 标签时使用 rich-text 渲染 -->
						<rich-text 
							v-if="isRichContent" 
							:nodes="post.content" 
						></rich-text>
						<!-- 纯文本内容：无 HTML 标签时按纯文本显示 -->
						<text v-else>{{ post.content || '暂无内容' }}</text>
					</view>

					<!-- 帖子标签 -->
					<view class="post-tags" v-if="post.tags && post.tags.length > 0">
						<view 
							v-for="tag in post.tags" 
							:key="tag"
							class="tag"
							@click="searchByTag(tag)"
						>
							#{{ tag }}
						</view>
					</view>

					<!-- 帖子统计 -->
					<view class="post-stats">
						<text class="stat-item">点赞 {{ post.likeCount || 0 }}</text>
						<text class="stat-item">收藏 {{ post.collectCount || 0 }}</text>
						<text class="stat-item">评论 {{ post.commentCount || 0 }}</text>
					</view>
				</view>

				<!-- 相关推荐 -->
				<view class="related-posts" v-if="relatedPosts.length > 0">
					<view class="section-title">相关推荐</view>
					<view class="related-list">
						<view 
							v-for="relatedPost in relatedPosts" 
							:key="relatedPost.id"
							class="related-item"
							@click="viewRelatedPost(relatedPost.id)"
						>
							<image 
								:src="getPostImageUrl(relatedPost)" 
								class="related-image"
								mode="aspectFill"
							></image>
							<view class="related-content">
								<text class="related-title">{{ relatedPost.title }}</text>
								<text class="related-author">{{ relatedPost.author }}</text>
							</view>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 底部操作栏 -->
		<view class="bottom-actions">
			<view class="action-left">
				<!-- 评论输入框 -->
				<view class="comment-input-container">
					<input 
						v-model="commentText" 
						class="comment-input" 
						placeholder="说点什么..."
						@focus="onCommentFocus"
					/>
				</view>
			</view>
			
			<view class="action-right">
				<!-- 点赞 -->
				<button 
					:class="['action-btn', { liked: isLiked }]"
					@click="handleLike"
					:disabled="likeLoading"
				>
					<text class="action-icon">{{ isLiked ? '❤️' : '🤍' }}</text>
					<text class="action-count">{{ post ? post.likeCount : 0 }}</text>
				</button>

				<!-- 收藏 -->
				<button 
					:class="['action-btn', { collected: isCollected }]"
					@click="handleCollect"
					:disabled="collectLoading"
				>
					<text class="action-icon">{{ isCollected ? '⭐' : '☆' }}</text>
					<text class="action-count">{{ post ? post.collectCount : 0 }}</text>
				</button>

				<!-- 评论 -->
				<button class="action-btn" @click="onCommentFocus">
					<text class="action-icon">💬</text>
					<text class="action-count">{{ post ? post.commentCount : 0 }}</text>
				</button>

				<!-- 分享 -->
				<button class="action-btn" @click="handleShare">
					<text class="action-icon">📤</text>
					<text class="action-count">分享</text>
				</button>
			</view>
		</view>

		<!-- 评论弹窗 -->
		<view v-if="showCommentModal" class="comment-modal">
			<view class="modal-mask" @click="closeCommentModal"></view>
			<view class="modal-content">
				<view class="modal-header">
					<text class="modal-title">评论</text>
					<text class="modal-close" @click="closeCommentModal">×</text>
				</view>
				<view class="comment-list">
					<!-- 评论列表内容 -->
					<view class="no-comments" v-if="comments.length === 0">
						<text>暂无评论，快来抢沙发吧~</text>
					</view>
				</view>
				<view class="comment-input-area">
					<textarea 
						v-model="commentText" 
						class="comment-textarea" 
						placeholder="写下你的评论..."
						maxlength="500"
					></textarea>
					<button 
						class="submit-comment-btn"
						@click="submitComment"
						:disabled="!commentText.trim() || commentLoading"
					>
						{{ commentLoading ? '发送中...' : '发送' }}
					</button>
				</view>
			</view>
		</view>

		<!-- 操作菜单 -->
		<uni-popup ref="actionMenu" type="bottom">
			<view class="action-menu">
				<view class="menu-item" @click="handleShare">分享</view>
				<view class="menu-item" @click="handleReport">举报</view>
				<view class="menu-item" @click="handleCollect">{{ isCollected ? '取消收藏' : '收藏' }}</view>
				<view class="menu-item cancel" @click="closeActionMenu">取消</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
import { getPostDetail, getPostList, likePost, unlikePost } from '@/api/community.js'
import { addFavorite, removeFavorite, getFavorites, followUser, unfollowUser, checkFollow } from '@/api/social.js'

export default {
	data() {
		return {
			// 帖子ID
			postId: null,
			
			// 帖子数据
			post: null,
			loading: false,
			error: null,
			
			// 用户交互状态
			isLiked: false,
			isCollected: false,
			isFollowed: false,
			likeLoading: false,
			collectLoading: false,
			followLoading: false,
			commentLoading: false,
			
			// UI状态
			showCommentModal: false,
			
			// 评论相关
			commentText: '',
			comments: [],
			
			// 相关推荐
			relatedPosts: [],
			
			// 轮播图当前索引
			currentImageIndex: 0,
			
			// 轮播图自动播放控制
			swiperAutoplay: true
		}
	},
	
	computed: {
		// 是否有图片
		hasImages() {
			if (!this.post) return false
			const imgs = this.getImageList()
			return (imgs && imgs.length > 0) || !!this.post.coverUrl
		},
		
		// 内容是否为富文本（包含 HTML 标签）
		isRichContent() {
			if (!this.post || !this.post.content) {
				return false
			}
			// 简单判断：只要包含 HTML 标签（如 <p>、<br> 等），就按富文本渲染
			const content = this.post.content
			return /<[^>]+>/.test(content)
		}
	},
	
	onLoad(options) {
		console.log('📖 进入帖子详情页，参数:', options)
		
		if (options && options.id) {
			this.postId = options.id
			this.fetchPostDetail()
		} else {
			this.error = '帖子ID不存在'
		}
	},
	
	onShow() {
		// 页面显示时恢复自动播放
		if (this.post && this.getImageList().length > 1) {
			this.swiperAutoplay = true
		}
	},
	
	onHide() {
		// 页面隐藏时暂停自动播放，节省资源
		this.swiperAutoplay = false
	},
	
	methods: {
		// 获取帖子详情
		async fetchPostDetail() {
			try {
				this.loading = true
				this.error = null
				
				console.log('🔍 开始获取帖子详情，ID:', this.postId)
				
				const response = await getPostDetail(this.postId)
				console.log('📨 帖子详情响应:', response)
				
				if (response && response.code === 200) {
					// 处理API返回的数据
					this.post = this.processPostData(response.data)
					console.log('✅ 帖子详情处理完成:', this.post)
					
					// 加载相关推荐
					this.loadRelatedPosts()
					
					// 加载用户交互状态（点赞、收藏、关注）
					this.loadUserInteractionStatus()
					
				} else {
					throw new Error(response ? response.message : '获取帖子详情失败')
				}
				
			} catch (error) {
				console.error('❌ 获取帖子详情失败:', error)
				this.error = error.message || '加载失败，请稍后重试'
				this.useMockDataAsFallback()
			} finally {
				this.loading = false
			}
		},
		
		// 处理帖子数据
		processPostData(data) {
			if (!data) return null
			
			// 根据API返回的数据结构处理
			return {
				// 基础信息
				id: data.id || data.thread_id,
				title: data.title || '无标题',
				content: data.content || '暂无内容',
				
				// 作者信息
				author: this.getAuthorName(data),
				authorAvatar: data.avatar || data.authorAvatar,
				userId: data.userId || data.user_id,
				roleType: data.roleType || data.role_type,
				
				// 统计信息
				viewCount: data.viewCount || data.view_count || 0,
				likeCount: data.likeCount || data.like_count || 0,
				commentCount: data.commentCount || data.comment_count || 0,
				collectCount: data.collectCount || data.collect_count || 0,
				
				// 媒体信息
				coverUrl: data.coverUrl || data.cover_url,
				mediaUrls: data.mediaUrls || data.media_urls || [],
				
				// 分类和类型
				threadType: data.threadType || data.thread_type,
				categoryId: data.categoryId || data.category_id,
				
				// 时间信息
				createTime: data.createTime || data.create_time,
				updateTime: data.updateTime || data.update_time,
				
				// 状态
				status: data.status,
				delFlag: data.delFlag || data.del_flag,
				
				// 模板数据
				normalPost: data.normalPost,
				portfolio: data.portfolio,
				caseStudy: data.caseStudy,
				materialShow: data.materialShow,
				
				// 标签（如果有）
				tags: data.tags || []
			}
		},
		
		// 获取作者名称
		getAuthorName(data) {
			if (data.nickname || data.userName || data.author) {
				return data.nickname || data.userName || data.author
			}
			
			const roleType = data.roleType || data.role_type
			const roleNames = {
				1: '普通用户',
				2: '设计师',
				3: '监理',
				4: '材料商'
			}
			
			return roleNames[roleType] || '匿名用户'
		},
		
		// 加载相关推荐
		async loadRelatedPosts() {
			try {
				// 根据当前帖子的分类或类型加载相关帖子
				const queryParams = {
					pageNum: 1,
					pageSize: 3,
					categoryId: this.post ? this.post.categoryId : null,
					threadType: this.post ? this.post.threadType : null,
					excludeId: this.postId // 排除当前帖子
				}
				
				const response = await getPostList(queryParams)
				
				if (response && response.code === 200) {
					let posts = []
					
					// 处理响应数据
					if (response.data) {
						if (response.data.rows) {
							posts = response.data.rows
						} else if (response.data.list) {
							posts = response.data.list
						} else if (Array.isArray(response.data)) {
							posts = response.data
						}
					}
					
					this.relatedPosts = posts.slice(0, 3).map(post => this.processPostData(post))
				}
				
			} catch (error) {
				console.error('加载相关推荐失败:', error)
				// 失败时不显示相关推荐，不影响主流程
			}
		},
		
		// 加载用户交互状态
		async loadUserInteractionStatus() {
			if (!this.post || !this.postId) return
			
			try {
				// 并行加载点赞、收藏、关注状态
				const [likedRes, favoriteRes, followRes] = await Promise.allSettled([
					// 检查是否已点赞 - 通过尝试查询点赞记录
					// 由于后端没有直接查询是否点赞的接口，我们需要通过其他方式判断
					// 这里先设置为false，实际可通过其他API或从帖子详情中获取
					Promise.resolve({ data: false }),
					
					// 检查是否已收藏
					getFavorites({ postId: this.postId }).catch(() => ({ data: { rows: [] } })),
					
					// 检查是否已关注（如果有作者userId）
					this.post.userId ? checkFollow(this.post.userId).catch(() => ({ data: false })) : Promise.resolve({ data: false })
				])
				
				// 处理点赞状态（如果有接口可以查询）
				this.isLiked = false // 默认未点赞，实际应该通过API查询
				
				// 处理收藏状态
				if (favoriteRes.status === 'fulfilled' && favoriteRes.value) {
					const favoriteData = favoriteRes.value.data || favoriteRes.value
					if (favoriteData.rows && favoriteData.rows.length > 0) {
						this.isCollected = true
					} else if (Array.isArray(favoriteData) && favoriteData.length > 0) {
						this.isCollected = true
					} else {
						this.isCollected = false
					}
				}
				
				// 处理关注状态
				if (followRes.status === 'fulfilled' && followRes.value) {
					const followData = followRes.value.data !== undefined ? followRes.value.data : followRes.value
					this.isFollowed = !!followData
				} else {
					this.isFollowed = false
				}
				
				console.log('✅ 用户交互状态加载完成:', {
					isLiked: this.isLiked,
					isCollected: this.isCollected,
					isFollowed: this.isFollowed
				})
				
			} catch (error) {
				console.error('加载用户交互状态失败:', error)
				// 失败时使用默认值
				this.isLiked = false
				this.isCollected = false
				this.isFollowed = false
			}
		},
		
		// 处理点赞
		async handleLike() {
			if (this.likeLoading || !this.postId) return
			
			try {
				this.likeLoading = true
				
				// 调用点赞/取消点赞接口
				const api = this.isLiked ? unlikePost : likePost
				const response = await api(this.postId)
				
				// 检查响应
				if (response && response.code === 200) {
					// 更新本地状态
					if (this.isLiked) {
						this.post.likeCount = Math.max(0, (this.post.likeCount || 0) - 1)
					} else {
						this.post.likeCount = (this.post.likeCount || 0) + 1
					}
					this.isLiked = !this.isLiked
					
					// 通知首页更新点赞数
					uni.$emit('postLikeUpdated', {
						postId: this.postId,
						likeCount: this.post.likeCount,
						isLiked: this.isLiked
					})
					
					uni.showToast({
						title: this.isLiked ? '点赞成功' : '已取消点赞',
						icon: 'success'
					})
				} else {
					throw new Error(response ? response.msg || response.message : '操作失败')
				}
				
			} catch (error) {
				console.error('点赞操作失败:', error)
				
				// 显示错误信息
				const errorMsg = error.msg || error.message || '操作失败'
				uni.showToast({
					title: errorMsg,
					icon: 'none'
				})
				
				// 如果是"请先登录"错误，可以引导用户登录
				if (errorMsg.includes('登录')) {
					setTimeout(() => {
						uni.navigateTo({
							url: '/pages/login/login'
						})
					}, 1500)
				}
			} finally {
				this.likeLoading = false
			}
		},
		
		// 处理收藏
		async handleCollect() {
			if (this.collectLoading || !this.postId) return
			
			try {
				this.collectLoading = true
				
				// 调用收藏/取消收藏接口
				let response
				if (this.isCollected) {
					// 取消收藏
					response = await removeFavorite(this.postId)
				} else {
					// 添加收藏
					response = await addFavorite({ postId: this.postId })
				}
				
				// 检查响应
				if (response && response.code === 200) {
					// 更新本地状态
					if (this.isCollected) {
						this.post.collectCount = Math.max(0, (this.post.collectCount || 0) - 1)
					} else {
						this.post.collectCount = (this.post.collectCount || 0) + 1
					}
					this.isCollected = !this.isCollected
					
					uni.showToast({
						title: this.isCollected ? '收藏成功' : '已取消收藏',
						icon: 'success'
					})
				} else {
					throw new Error(response ? response.msg || response.message : '操作失败')
				}
				
				this.closeActionMenu()
				
			} catch (error) {
				console.error('收藏操作失败:', error)
				
				// 显示错误信息
				const errorMsg = error.msg || error.message || '操作失败'
				uni.showToast({
					title: errorMsg,
					icon: 'none'
				})
				
				// 如果是"请先登录"错误，可以引导用户登录
				if (errorMsg.includes('登录')) {
					setTimeout(() => {
						uni.navigateTo({
							url: '/pages/login/login'
						})
					}, 1500)
				}
			} finally {
				this.collectLoading = false
			}
		},
		
		// 处理关注
		async handleFollow() {
			if (this.followLoading || !this.post || !this.post.userId) return
			
			// 不能关注自己
			// 这里需要获取当前登录用户的ID，暂时跳过这个检查
			
			try {
				this.followLoading = true
				
				// 调用关注/取消关注接口
				let response
				if (this.isFollowed) {
					// 取消关注
					response = await unfollowUser(this.post.userId)
				} else {
					// 添加关注
					response = await followUser({ targetUserId: this.post.userId })
				}
				
				// 检查响应
				if (response && response.code === 200) {
					this.isFollowed = !this.isFollowed
					
					uni.showToast({
						title: this.isFollowed ? '关注成功' : '已取消关注',
						icon: 'success'
					})
				} else {
					throw new Error(response ? response.msg || response.message : '操作失败')
				}
				
			} catch (error) {
				console.error('关注操作失败:', error)
				
				// 显示错误信息
				const errorMsg = error.msg || error.message || '操作失败'
				uni.showToast({
					title: errorMsg,
					icon: 'none'
				})
				
				// 如果是"请先登录"或"不能关注自己"等错误
				if (errorMsg.includes('登录')) {
					setTimeout(() => {
						uni.navigateTo({
							url: '/pages/login/login'
						})
					}, 1500)
				}
			} finally {
				this.followLoading = false
			}
		},
		
		// 提交评论
		async submitComment() {
			if (!this.commentText.trim() || this.commentLoading) return
			
			try {
				this.commentLoading = true
				
				// 调用评论接口
				// await submitComment(this.postId, this.commentText.trim())
				
				// 更新评论数
				this.post.commentCount = (this.post.commentCount || 0) + 1
				this.commentText = ''
				
				uni.showToast({
					title: '评论成功',
					icon: 'success'
				})
				
				this.closeCommentModal()
				
			} catch (error) {
				console.error('评论提交失败:', error)
				uni.showToast({
					title: '评论失败',
					icon: 'none'
				})
			} finally {
				this.commentLoading = false
			}
		},
		
		// 图片预览
		previewImage(index) {
			const images = this.getImageList()
			
			if (images.length > 0) {
				uni.previewImage({
					urls: images,
					current: images[index] || images[0],
					indicator: 'number',
					loop: true
				})
			}
		},
		
		// 获取图片列表（统一处理 mediaUrls 和 coverUrl）
		getImageList() {
			if (!this.post) return []

			const urls = Array.isArray(this.post.mediaUrls) ? this.post.mediaUrls : []
			// 过滤出图片（非视频）
			const imageUrls = urls.filter(url => !this.isVideoUrl(url))

			if (imageUrls.length > 0) {
				return imageUrls
			} else if (this.post.coverUrl) {
				return [this.post.coverUrl]
			}
			return []
		},
		
		// 轮播图切换事件
		onSwiperChange(e) {
			this.currentImageIndex = e.detail.current
		},
		
		// 轮播图动画完成事件（用于检测手动滑动）
		onSwiperAnimationFinish(e) {
			this.currentImageIndex = e.detail.current
			// 手动滑动后，短暂暂停自动播放，给用户时间查看
			if (!this.swiperAutoplay) {
				setTimeout(() => {
					this.swiperAutoplay = true
				}, 3000)
			}
		},
		
		// 切换到上一张图片
		prevImage() {
			const imageList = this.getImageList()
			if (imageList.length <= 1) return
			
			// 暂停自动播放
			this.swiperAutoplay = false
			
			// 计算上一张的索引（支持循环）
			let prevIndex = this.currentImageIndex - 1
			if (prevIndex < 0) {
				prevIndex = imageList.length - 1 // 循环到最后一张
			}
			
			// 更新当前索引，swiper会通过:current绑定自动更新
			this.currentImageIndex = prevIndex
			
			// 3秒后恢复自动播放
			setTimeout(() => {
				if (this.post && this.getImageList().length > 1) {
					this.swiperAutoplay = true
				}
			}, 3000)
		},
		
		// 切换到下一张图片
		nextImage() {
			const imageList = this.getImageList()
			if (imageList.length <= 1) return
			
			// 暂停自动播放
			this.swiperAutoplay = false
			
			// 计算下一张的索引（支持循环）
			let nextIndex = this.currentImageIndex + 1
			if (nextIndex >= imageList.length) {
				nextIndex = 0 // 循环到第一张
			}
			
			// 更新当前索引，swiper会通过:current绑定自动更新
			this.currentImageIndex = nextIndex
			
			// 3秒后恢复自动播放
			setTimeout(() => {
				if (this.post && this.getImageList().length > 1) {
					this.swiperAutoplay = true
				}
			}, 3000)
		},
		
		// 简单判断是否为视频URL
		isVideoUrl(url) {
			if (!url || typeof url !== 'string') return false
			return /\.(mp4|mov|wmv|avi|flv|m3u8|webm)$/i.test(url)
		},

		// 获取视频列表（从 mediaUrls 中筛选视频）
		getVideoList() {
			if (!this.post || !Array.isArray(this.post.mediaUrls)) return []
			return this.post.mediaUrls.filter(url => this.isVideoUrl(url))
		},
		
		// 获取帖子图片URL
		getPostImageUrl(post) {
			if (!post) return ''
			if (post.coverUrl) return post.coverUrl

			if (post.mediaUrls && post.mediaUrls.length > 0) {
				// 相关推荐里只显示图片封面，过滤掉视频
				const firstImg = post.mediaUrls.find(u => !this.isVideoUrl(u))
				return firstImg || post.mediaUrls[0]
			}
			return ''
		},
		
		// 图片加载处理
		handleImageLoad() {
			console.log('图片加载成功')
		},
		
		handleImageError() {
			console.log('图片加载失败')
		},

		handleVideoError(e) {
			console.log('视频加载失败', e)
		},
		
		// 返回上一页
		goBack() {
			uni.navigateBack()
		},
		
		// 滚动到底部
		onScrollToLower() {
			console.log('滚动到底部')
		},
		
		// 评论输入框聚焦
		onCommentFocus() {
			this.showCommentModal = true
		},
		
		// 关闭评论弹窗
		closeCommentModal() {
			this.showCommentModal = false
		},
		
		// 显示操作菜单
		showActionSheet() {
			this.$refs.actionMenu.open()
		},
		
		// 关闭操作菜单
		closeActionMenu() {
			this.$refs.actionMenu.close()
		},
		
		// 处理分享
		handleShare() {
			uni.share({
				provider: 'weixin',
				scene: 'WXSceneSession',
				type: 0,
				href: `https://your-domain.com/post/${this.postId}`,
				title: this.post.title,
				summary: this.post.content ? this.post.content.substring(0, 100) : '分享一个有趣的帖子',
				success: function(res) {
					console.log('分享成功:', res)
				},
				fail: function(err) {
					console.log('分享失败:', err)
				}
			})
			this.closeActionMenu()
		},
		
		// 处理举报
		handleReport() {
			uni.showModal({
				title: '举报帖子',
				content: '请选择举报原因',
				showCancel: true,
				success: (res) => {
					if (res.confirm) {
						uni.showToast({
							title: '举报成功',
							icon: 'success'
						})
					}
				}
			})
			this.closeActionMenu()
		},
		
		// 通过标签搜索
		searchByTag(tag) {
			uni.navigateTo({
				url: `/pages/search/result?keyword=${tag}&type=tag`
			})
		},
		
		// 查看相关帖子
		viewRelatedPost(postId) {
			uni.navigateTo({
				url: `/pages/post/detail?id=${postId}`
			})
		},
		
		// 格式化日期
		formatDate(dateString) {
			if (!dateString) return '未知时间'
			
			const date = new Date(dateString)
			const now = new Date()
			const diff = now - date
			
			// 一分钟内
			if (diff < 60000) {
				return '刚刚'
			}
			
			// 一小时内
			if (diff < 3600000) {
				return `${Math.floor(diff / 60000)}分钟前`
			}
			
			// 一天内
			if (diff < 86400000) {
				return `${Math.floor(diff / 3600000)}小时前`
			}
			
			// 一周内
			if (diff < 604800000) {
				return `${Math.floor(diff / 86400000)}天前`
			}
			
			// 返回完整日期
			return date.toLocaleDateString('zh-CN', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			})
		},
		
		// 降级方案：使用模拟数据
		useMockDataAsFallback() {
			console.log('🔄 使用模拟数据作为降级方案')
			
			this.post = {
				id: this.postId,
				title: '现代简约风格家居设计',
				content: '这是一个关于现代简约风格家居设计的详细分享。我们从空间规划、材料选择到软装搭配都做了精心设计，希望能给大家带来一些装修灵感。\n\n客厅采用了开放式设计，让空间更加通透。主色调以白色和浅灰色为主，搭配原木元素，营造出温馨舒适的氛围。',
				author: '设计师张工',
				authorAvatar: '/static/images/default-avatar.png',
				userId: 123,
				roleType: 2,
				viewCount: 2300,
				likeCount: 156,
				commentCount: 42,
				collectCount: 89,
				coverUrl: 'https://cypphoto.oss-cn-chengdu.aliyuncs.com/photo//2025/10/30/c0609e506f304cb48d0fd526255e51e7.jpg',
				mediaUrls: [
					'https://cypphoto.oss-cn-chengdu.aliyuncs.com/photo//2025/10/30/c0609e506f304cb48d0fd526255e51e7.jpg',
					'https://cypphoto.oss-cn-chengdu.aliyuncs.com/photo//2025/10/30/5c92c50d76b047308767329292ccddf7.jpg'
				],
				threadType: 1,
				categoryId: 1,
				createTime: new Date().toISOString(),
				tags: ['现代简约', '家居设计', '装修灵感']
			}
			
			// 加载模拟的相关推荐
			this.relatedPosts = [
				{
					id: 2,
					title: '欧式古典风格别墅设计',
					author: '设计工作室',
					coverUrl: 'https://cypphoto.oss-cn-chengdu.aliyuncs.com/photo//2025/10/30/design-2-preview.jpg'
				},
				{
					id: 3,
					title: '小户型改造案例分享',
					author: '改造专家',
					coverUrl: 'https://cypphoto.oss-cn-chengdu.aliyuncs.com/photo//2025/10/30/case-1-preview.jpg'
				}
			]
		}
	}
}
</script>

<style scoped>
.post-detail-container {
	height: 100vh;
	background-color: #ffffff;
	display: flex;
	flex-direction: column;
}

/* 导航栏 */
.navbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 15px;
	background-color: #fff;
	border-bottom: 1px solid #f0f0f0;
	position: sticky;
	top: 0;
	z-index: 100;
}

.nav-left, .nav-right {
	width: 60px;
}

.back-icon, .more-icon {
	font-size: 20px;
	color: #333;
	cursor: pointer;
}

.nav-title {
	font-size: 18px;
	font-weight: 600;
	color: #333;
}

/* 加载状态 */
.loading-container, .error-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 60px 20px;
}

.loading-spinner {
	width: 40px;
	height: 40px;
	border: 4px solid #f3f3f3;
	border-top: 4px solid #ff2e63;
	border-radius: 50%;
	animation: spin 1s linear infinite;
	margin-bottom: 16px;
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

.loading-text, .error-text {
	font-size: 16px;
	color: #666;
	text-align: center;
}

.retry-btn {
	margin-top: 16px;
	padding: 8px 16px;
	background-color: #ff2e63;
	color: white;
	border: none;
	border-radius: 6px;
	cursor: pointer;
}

/* 帖子内容 */
.post-content {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.scroll-content {
	flex: 1;
}

/* 帖子头部 */
.post-header {
	padding: 20px 15px 0;
}

.post-title {
	font-size: 22px;
	font-weight: 600;
	line-height: 1.4;
	color: #1a1a1a;
	margin-bottom: 16px;
}

.author-info {
	display: flex;
	align-items: center;
	margin-bottom: 20px;
}

.author-avatar {
	width: 44px;
	height: 44px;
	border-radius: 50%;
	margin-right: 12px;
}

.author-details {
	flex: 1;
}

.author-name {
	display: block;
	font-size: 16px;
	font-weight: 500;
	color: #333;
	margin-bottom: 4px;
}

.post-meta {
	display: flex;
	gap: 12px;
}

.post-date, .post-views {
	font-size: 13px;
	color: #999;
}

.follow-btn {
	padding: 6px 16px;
	background-color: #ff2e63;
	color: white;
	border: none;
	border-radius: 16px;
	font-size: 13px;
	cursor: pointer;
}

.follow-btn.followed {
	background-color: #ccc;
}

/* 图片展示 */
.post-images {
	padding: 0 15px 20px;
}

.single-image {
	width: 100%;
	border-radius: 8px;
	overflow: hidden;
}

.post-image {
	width: 100%;
	display: block;
}

/* 轮播图容器 */
.swiper-container {
	position: relative;
	width: 100%;
	height: 400rpx;
	border-radius: 8px;
	overflow: hidden;
	background-color: #f5f5f5;
}

.post-swiper {
	width: 100%;
	height: 100%;
}

.swiper-item {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.swiper-image {
	width: 100%;
	height: 100%;
	object-fit: contain;
}

/* 左右箭头 */
.swiper-arrow {
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
	width: 60rpx;
	height: 60rpx;
	background: rgba(0, 0, 0, 0.4);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 20;
	cursor: pointer;
	transition: all 0.3s;
}

.swiper-arrow:active {
	background: rgba(0, 0, 0, 0.6);
	transform: translateY(-50%) scale(0.95);
}

.swiper-arrow-left {
	left: 20rpx;
}

.swiper-arrow-right {
	right: 20rpx;
}

/* 图片数量指示器 */
.swiper-indicator-text {
	position: absolute;
	bottom: 10rpx;
	right: 10rpx;
	background: rgba(0, 0, 0, 0.6);
	color: white;
	padding: 4rpx 12rpx;
	border-radius: 20rpx;
	font-size: 24rpx;
	z-index: 10;
}

/* 视频展示 */
.post-videos {
	padding: 0 15px 20px;
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.video-wrapper {
	width: 100%;
	border-radius: 8px;
	overflow: hidden;
	background-color: #000;
}

.post-video {
	width: 100%;
	height: 220px;
	object-fit: contain;
	background-color: #000;
}

/* 帖子正文 */
.post-body {
	padding: 0 15px 20px;
}

.content-text {
	font-size: 16px;
	line-height: 1.8;
	color: #333;
	margin-bottom: 16px;
	white-space: pre-line;
}

.post-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-bottom: 16px;
}

.tag {
	padding: 4px 12px;
	background-color: #f5f5f5;
	color: #666;
	border-radius: 16px;
	font-size: 13px;
	cursor: pointer;
}

.post-stats {
	display: flex;
	gap: 16px;
}

.stat-item {
	font-size: 13px;
	color: #999;
}

/* 相关推荐 */
.related-posts {
	padding: 20px 15px;
	border-top: 8px solid #f8f9fa;
}

.section-title {
	font-size: 18px;
	font-weight: 600;
	color: #333;
	margin-bottom: 12px;
}

.related-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.related-item {
	display: flex;
	gap: 12px;
	padding: 12px;
	background-color: #f8f9fa;
	border-radius: 8px;
	cursor: pointer;
}

.related-image {
	width: 80px;
	height: 80px;
	border-radius: 6px;
	object-fit: cover;
}

.related-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
}

.related-title {
	font-size: 14px;
	font-weight: 500;
	color: #333;
	line-height: 1.4;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.related-author {
	font-size: 12px;
	color: #999;
}

/* 底部操作栏 */
.bottom-actions {
	display: flex;
	align-items: center;
	padding: 12px 15px;
	background-color: #fff;
	border-top: 1px solid #f0f0f0;
	position: sticky;
	bottom: 0;
	z-index: 100;
}

.action-left {
	flex: 1;
	margin-right: 12px;
}

.comment-input-container {
	background-color: #f5f5f5;
	border-radius: 20px;
	padding: 8px 16px;
}

.comment-input {
	width: 100%;
	border: none;
	background: transparent;
	outline: none;
	font-size: 14px;
}

.action-right {
	display: flex;
	align-items: center;
	gap: 8px;
}

.action-btn {
	display: flex;
	flex-direction: column;
	align-items: center;
	background: none;
	border: none;
	padding: 8px;
	min-width: 50px;
	cursor: pointer;
}

.action-btn:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.action-icon {
	font-size: 20px;
	margin-bottom: 2px;
}

.action-count {
	font-size: 11px;
	color: #666;
}

.action-btn.liked .action-count,
.action-btn.collected .action-count {
	color: #ff2e63;
}

/* 评论弹窗 */
.comment-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 1000;
}

.modal-mask {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
}

.modal-content {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	background: #fff;
	border-radius: 16px 16px 0 0;
	max-height: 70vh;
	display: flex;
	flex-direction: column;
}

.modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px;
	border-bottom: 1px solid #f0f0f0;
}

.modal-title {
	font-size: 16px;
	font-weight: 600;
	color: #333;
}

.modal-close {
	font-size: 24px;
	color: #999;
	cursor: pointer;
}

.comment-list {
	flex: 1;
	padding: 16px;
	overflow-y: auto;
}

.no-comments {
	text-align: center;
	color: #999;
	padding: 40px 0;
}

.comment-input-area {
	display: flex;
	align-items: flex-end;
	padding: 16px;
	border-top: 1px solid #f0f0f0;
	gap: 12px;
}

.comment-textarea {
	flex: 1;
	min-height: 80px;
	padding: 12px;
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	font-size: 14px;
	resize: none;
}

.submit-comment-btn {
	padding: 8px 16px;
	background-color: #ff2e63;
	color: white;
	border: none;
	border-radius: 6px;
	font-size: 14px;
	cursor: pointer;
}

.submit-comment-btn:disabled {
	background-color: #ccc;
	cursor: not-allowed;
}

/* 操作菜单 */
.action-menu {
	background: #fff;
	border-radius: 12px 12px 0 0;
	padding: 10px 0;
}

.menu-item {
	padding: 16px 20px;
	text-align: center;
	font-size: 16px;
	color: #333;
	border-bottom: 1px solid #f0f0f0;
}

.menu-item:last-child {
	border-bottom: none;
}

.menu-item.cancel {
	color: #666;
	margin-top: 8px;
	background: #f8f9fa;
}

/* 响应式设计 */
@media (max-width: 480px) {
	.post-title {
		font-size: 20px;
	}
	
	.author-avatar {
		width: 40px;
		height: 40px;
	}
	
	.action-right {
		gap: 4px;
	}
	
	.action-btn {
		min-width: 45px;
		padding: 6px;
	}
}
</style>