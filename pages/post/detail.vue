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
					<view class="post-title-row">
						<h1 class="post-title">{{ post.title || '无标题' }}</h1>
						<!-- 删除按钮（仅作者可见） -->
						<view v-if="isPostAuthor" class="post-actions">
							<button class="delete-post-btn" @click="handleDeletePost" :disabled="deletingPost">
								{{ deletingPost ? '删除中...' : '删除' }}
							</button>
						</view>
					</view>
					
					<!-- 作者信息 -->
					<view class="author-info">
						<image :src="post.authorAvatar || getDefaultAvatar()" class="author-avatar" mode="aspectFill"
							@error="handleAvatarError"></image>
						<view class="author-details">
							<text class="author-name">{{ post.author || '匿名用户' }}</text>
							<!-- <view class="post-meta">
								<text class="post-date">{{ formatDate(post.createTime) }}</text>
								<text class="post-views">浏览 {{ post.viewCount || 0 }}</text>
							</view> -->
						</view>
						<button :class="['follow-btn', { followed: isFollowed }]" @click="handleFollow"
							:disabled="followLoading">
							{{ isFollowed ? '已关注' : '关注' }}
						</button>
					</view>
				</view>

				<!-- 图片展示区域 -->
				<view class="post-images" v-if="hasImages">
					<!-- 单图展示 -->
					<view v-if="getImageList().length === 1" class="single-image">
						<image :src="getImageList()[0]" mode="widthFix" class="post-image" @tap="previewImage(0)"
							@error="handleImageError" @load="handleImageLoad" lazy-load></image>
					</view>

					<!-- 多图轮播展示 -->
					<view v-else-if="getImageList().length > 1" class="swiper-container">
						<swiper ref="postSwiper" class="post-swiper" :indicator-dots="true"
							:indicator-color="'rgba(255, 255, 255, 0.5)'" :indicator-active-color="'#ff2e63'"
							:autoplay="swiperAutoplay" :circular="true" :interval="4000" :duration="500"
							:disable-touch="false" :current="currentImageIndex" @change="onSwiperChange"
							@animationfinish="onSwiperAnimationFinish" @tap="handleSwiperTap">
							<swiper-item v-for="(image, index) in getImageList()" :key="index" class="swiper-item"
								@tap="previewImage(index)">
								<image :src="image" mode="aspectFit" class="swiper-image"
									@tap.stop="previewImage(index)" @error="handleImageError" @load="handleImageLoad"
									lazy-load></image>
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
					<view class="video-wrapper" v-for="(video, vIndex) in getVideoList()" :key="vIndex">
						<video class="post-video" :src="video" :poster="post.coverUrl || getImageList()[0] || ''"
							controls :enable-progress-gesture="true" :show-center-play-btn="true"
							@error="handleVideoError"></video>
					</view>
				</view>

				<!-- 帖子内容 -->
				<view class="post-body">
					<view class="content-text">
						<!-- 富文本内容：包含 HTML 标签时使用 rich-text 渲染 -->
						<rich-text v-if="isRichContent" :nodes="post.content"></rich-text>
						<!-- 纯文本内容：无 HTML 标签时按纯文本显示 -->
						<text v-else>{{ post.content || '暂无内容' }}</text>
					</view>

					<!-- 帖子标签 -->
					<view class="post-tags" v-if="post.tags && post.tags.length > 0">
						<view v-for="tag in post.tags" :key="tag" class="tag" @click="searchByTag(tag)">
							#{{ tag }}
						</view>
					</view>

					<!-- 帖子统计 -->
					<view class="post-stats">
						<text class="stat-item">点赞 {{ post.likeCount || 0 }}</text>
						<text class="stat-item">收藏 {{ post.collectCount || 0 }}</text>
						<text class="stat-item">评论 {{ mainCommentCount }}</text>
					</view>
				</view>

				<!-- 相关推荐 -->
				<view class="related-posts" v-if="relatedPosts.length > 0">
					<view class="section-title">相关推荐</view>
					<view class="related-list">
						<view v-for="relatedPost in relatedPosts" :key="relatedPost.id" class="related-item"
							@click="viewRelatedPost(relatedPost.id)">
							<image :src="getPostImageUrl(relatedPost)" class="related-image" mode="aspectFill"></image>
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
				<!-- 评论输入框改为绿色按钮样式 - 点击后弹出输入框直接发送评论 -->
				<button class="comment-btn" @click="openCommentInput">
					<text class="comment-btn-icon">💬</text>
					<text class="comment-btn-text">说点什么...</text>
				</button>
			</view>
			
			<view class="action-right">
				<!-- 点赞 -->
				<view :class="['action-item', { liked: isLiked }]" @click="handleLike">
					<text class="action-icon">{{ isLiked ? '❤️' : '🤍' }}</text>
					<text class="action-count">{{ post ? post.likeCount : 0 }}</text>
				</view>

				<!-- 收藏 -->
				<view :class="['action-item', { collected: isCollected }]" @click="handleCollect">
					<text class="action-icon">{{ isCollected ? '⭐' : '☆' }}</text>
					<text class="action-count">{{ post ? post.collectCount : 0 }}</text>
				</view>

				<!-- 查看评论 -->
				<view class="action-item" @click="openCommentModal">
					<text class="action-icon">💬</text>
					<text class="action-count">{{ mainCommentCount }}</text>
				</view>

				<!-- 分享 -->
				<view class="action-item" @click="handleShare">
					<text class="action-icon">📤</text>
					<text class="action-count">分享</text>
				</view>
			</view>
		</view>

		<!-- 评论弹窗 -->
		<view v-if="showCommentModal" class="comment-modal" @touchmove.stop.prevent>
			<view class="modal-mask" @click="closeCommentModal" @touchmove.stop.prevent></view>
			<view class="modal-content" @touchmove.stop.prevent>
				<view class="modal-header">
					<text class="modal-title">评论</text>
					<text class="modal-close" @click="closeCommentModal">×</text>
				</view>
				<scroll-view ref="commentScrollView" class="comment-list" scroll-y="true" :scroll-top="commentScrollTop" @scrolltolower="loadMoreComments" @scroll="onCommentScroll">
					<!-- 评论列表内容 -->
					<view class="no-comments" v-if="!commentLoading && comments.length === 0">
						<text>暂无评论，快来抢沙发吧~</text>
					</view>

					<!-- 评论项 - 扁平化结构 -->
					<view v-for="comment in displayedComments" :key="comment.id" 
						:class="['comment-item', { 'reply-item': !comment.isMainComment }]" 
						:data-comment-id="comment.id"
						:style="{ paddingLeft: comment.isMainComment ? '0px' : '30px' }">
						<!-- 评论者头像 -->
						<image :src="comment.userAvatar || getDefaultAvatar()" 
							:class="comment.isMainComment ? 'comment-avatar' : 'reply-avatar'" 
							mode="aspectFill"
							@error="handleAvatarError"></image>

						<!-- 评论内容区域 -->
						<view :class="comment.isMainComment ? 'comment-content' : 'reply-content'">
							<!-- 评论者信息 -->
							<view :class="comment.isMainComment ? 'comment-header' : 'reply-header'">
								<text :class="comment.isMainComment ? 'comment-author' : 'reply-author'">
									{{ comment.userName || '匿名用户' }}
								</text>
								<!-- 如果是回复，显示被回复者 -->
								<text v-if="comment.replyToUserName && !comment.isMainComment" class="reply-to">
									<text class="reply-to-icon">@</text>
									<text class="reply-to-target">{{ comment.replyToUserName }}</text>
								</text>
								<text :class="comment.isMainComment ? 'comment-time' : 'reply-time'">
									{{ formatDate(comment.createTime) }}
								</text>
							</view>
							
							<!-- 评论内容 -->
							<text :class="comment.isMainComment ? 'comment-text' : 'reply-text'">
								{{ comment.content }}
							</text>
							
							<!-- 评论操作 -->
							<view :class="comment.isMainComment ? 'comment-actions' : 'reply-actions'">
								<view :class="[comment.isMainComment ? 'comment-action-btn' : 'reply-action-btn', { liked: likedComments.has(comment.id) }]" 
									@click="handleLikeComment(comment)">
									<text class="action-icon">{{ likedComments.has(comment.id) ? '❤️' : '🤍' }}</text>
									<text class="action-count" v-if="comment.likeCount > 0">{{ comment.likeCount }}</text>
								</view>
								<view :class="comment.isMainComment ? 'comment-action-btn' : 'reply-action-btn'" 
									@click="startReply(comment)">
									<text class="action-text">回复</text>
								</view>
								<!-- 删除按钮（仅作者可见） -->
								<view v-if="comment.canDelete" 
									:class="[comment.isMainComment ? 'comment-action-btn' : 'reply-action-btn', 'delete-btn']"
									@click="handleDeleteComment(comment)">
									<text class="action-text">删除</text>
								</view>
							</view>
						</view>
					</view>

					<!-- 展开更多评论按钮 -->
					<view v-if="hasMoreDisplayedComments()" class="expand-more-comments" @click="loadMoreDisplayedComments">
						<text>展开更多评论 ({{ comments.length - displayedCount }} 条)</text>
						<text class="expand-icon">▼</text>
					</view>

					<!-- 加载更多 -->
					<view v-if="commentLoading" class="comment-loading">
						<text>加载中...</text>
					</view>
					<view v-if="!hasMoreComments && comments.length > 0" class="no-more-comments">
						<text>没有更多评论了</text>
					</view>
				</scroll-view>
				<view class="comment-input-area">
					<!-- 回复提示 -->
					<view v-if="replyingTo" class="reply-hint">
						<text>回复 @{{ replyingTo.userName || replyingTo.author }}：</text>
						<text class="cancel-reply" @click="cancelReply">取消</text>
					</view>
					<textarea :value="replyingTo ? replyText : commentText" class="comment-textarea"
						:placeholder="replyingTo ? `回复 @${replyingTo.userName || replyingTo.author}...` : '写下你的评论...'"
						maxlength="500" :adjust-position="true" :show-confirm-bar="false" :auto-height="true"
						:hold-keyboard="true" :fixed="false" :cursor-spacing="20" @focus="onTextareaFocus"
						@blur="onTextareaBlur" @input="onTextareaInput"
						@confirm="replyingTo ? submitReply() : submitComment()"></textarea>
					<button class="submit-comment-btn" @tap="replyingTo ? submitReply() : submitComment()"
						:disabled="(!replyingTo && !commentText.trim()) || (replyingTo && !replyText.trim()) || commentLoading"
						:loading="commentLoading" hover-class="button-hover">
						{{ commentLoading ? '发送中...' : '发送' }}
					</button>
				</view>
			</view>
		</view>

		<!-- 评论输入弹窗（绿色按钮点击后弹出） -->
		<view v-if="showCommentInput" class="comment-input-modal" @touchmove.stop.prevent>
			<view class="input-modal-mask" @click="closeCommentInput" @touchmove.stop.prevent></view>
			<view class="input-modal-content" @touchmove.stop.prevent>
				<view class="input-modal-header">
					<text class="input-modal-title">评论</text>
					<text class="input-modal-close" @click="closeCommentInput">×</text>
				</view>
				<view class="input-modal-body">
					<textarea 
						v-model="commentText" 
						class="comment-input-textarea"
						placeholder="写下你的评论..."
						maxlength="500" 
						:adjust-position="true" 
						:show-confirm-bar="false" 
						:auto-height="true"
						:hold-keyboard="true" 
						:fixed="false" 
						:cursor-spacing="20" 
						@focus="onTextareaFocus"
						@blur="onTextareaBlur"
						@input="onCommentInput"
						@confirm="submitComment()"></textarea>
					<button 
						class="input-submit-btn" 
						@tap="submitComment()"
						:disabled="!commentText.trim() || commentLoading"
						:loading="commentLoading" 
						hover-class="button-hover">
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
	import {
		getPostDetail,
		getPostList,
		likePost,
		unlikePost,
		getPostComments,
		submitComment,
		deleteComment,
		likeComment,
		unlikeComment,
		deletePost
	} from '@/api/community.js'
	import {
		addFavorite,
		removeFavorite,
		getFavorites,
		followUser,
		unfollowUser,
		checkFollow
	} from '@/api/social.js'
	import { getUserProfile } from '@/api/users.js'

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
			deletingPost: false,
			currentUserId: null,
			
			// UI状态
			showCommentModal: false,
			showCommentInput: false, // 评论输入弹窗
			
			// 评论相关
			commentText: '',
			comments: [], // 所有评论（扁平化）
			displayedComments: [], // 当前显示的评论（分页）
			commentPageNum: 1,
			commentPageSize: 20,
			displayPageSize: 10, // 每次显示的评论数量
			displayedCount: 10, // 当前已显示的评论数量
			hasMoreComments: true,
			commentLoading: false,
			replyingTo: null, // 正在回复的评论ID
			replyText: '', // 回复内容
			likedComments: new Set(), // 已点赞的评论ID集合
			textareaFocused: false, // textarea 是否聚焦
			
			// 相关推荐
			relatedPosts: [],
			
			// 轮播图当前索引
			currentImageIndex: 0,
			
			// 轮播图自动播放控制
				swiperAutoplay: true,

				// 评论滚动位置
				commentScrollTop: 0
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
		},
		
		// 主评论数量（只统计主评论，不包括回复）
		mainCommentCount() {
			if (this.comments && this.comments.length > 0) {
				// 从已加载的评论中统计主评论数量
				return this.comments.filter(c => c.isMainComment).length
			}
			// 如果评论列表为空，使用帖子数据中的评论数（可能是后端返回的主评论数）
			return this.post ? (this.post.commentCount || 0) : 0
		},
		
		// 判断当前用户是否是帖子作者
		isPostAuthor() {
			if (!this.post || !this.currentUserId) return false
			const postUserId = this.post.userId || this.post.user_id
			return postUserId && String(postUserId) === String(this.currentUserId)
		}
	},
	
	async onLoad(options) {
		console.log('📖 进入帖子详情页，参数:', options)
		
		// 获取当前用户ID
		await this.getCurrentUserInfo()
		
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
		// 获取当前用户信息
		async getCurrentUserInfo() {
			try {
				const res = await getUserProfile()
				if (res.code === 200) {
					this.currentUserId = res.data.userId
				}
			} catch (error) {
				console.error('获取用户信息失败:', error)
				// 失败不影响页面显示，只是无法判断是否是作者
			}
		},
		
		// 删除帖子
		async handleDeletePost() {
			if (!this.post || !this.postId) {
				uni.showToast({
					title: '帖子信息不存在',
					icon: 'none'
				})
				return
			}
			
			if (this.deletingPost) return
			
			// 确认删除
			const modalRes = await uni.showModal({
				title: '确认删除',
				content: '确定要删除这条帖子吗？删除后无法恢复。',
				confirmText: '删除',
				confirmColor: '#f56c6c',
				cancelText: '取消'
			})
			
			// 处理 uni.showModal 的返回值格式（可能是对象或数组）
			let res = modalRes
			if (Array.isArray(modalRes)) {
				// 如果是数组格式 [error, result]，取第二个元素
				res = modalRes[1] || modalRes[0]
			}
			
			// 检查确认结果
			if (!res || !res.confirm) {
				return
			}
			
			this.deletingPost = true
			try {
				console.log('🗑️ 开始删除帖子，ID:', this.postId)
				const response = await deletePost(this.postId)
				console.log('📨 删除帖子响应:', JSON.stringify(response))
				
				// 检查响应格式：可能是 { code: 200 } 或直接是数据
				const code = response?.code
				const msg = response?.msg || response?.message
				
				// 如果响应中没有 code，可能是直接返回了数据或 null
				if (code === undefined && response !== null && response !== undefined) {
					console.warn('⚠️ 响应格式异常，未找到 code 字段:', response)
				}
				
				// 判断是否成功：code === 200 或 code 为 undefined/null（某些情况下可能直接返回成功）
				if (code === 200 || (code === undefined && !msg)) {
					uni.showToast({
						title: '删除成功',
						icon: 'success',
						duration: 1500
					})
					// 延迟返回上一页，让用户看到成功提示
					setTimeout(() => {
						uni.navigateBack()
					}, 1500)
				} else {
					const errorMsg = msg || '删除失败，可能是权限不足'
					console.error('❌ 删除失败，响应码:', code, '错误信息:', errorMsg)
					throw new Error(errorMsg)
				}
			} catch (error) {
				console.error('❌ 删除帖子异常:', error)
				console.error('❌ 错误详情:', {
					message: error?.message,
					response: error?.response,
					stack: error?.stack
				})
				
				// 显示详细的错误信息
				let errorMessage = '删除失败，请重试'
				if (error?.message) {
					errorMessage = error.message
				} else if (error?.response?.data?.msg) {
					errorMessage = error.response.data.msg
				} else if (typeof error === 'string') {
					errorMessage = error
				}
				
				uni.showToast({
					title: errorMessage,
					icon: 'none',
					duration: 2000
				})
			} finally {
				this.deletingPost = false
			}
		},
		
		// 获取帖子详情
		async fetchPostDetail(loadCommentsFlag = true) {
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
					
					// 根据参数决定是否加载评论列表
					if (loadCommentsFlag) {
						// 加载评论列表
						this.loadComments()
					}

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
			if (!data) return '匿名用户'
			
			const possibleFields = [
				data.authorName,
				data.nickName,
				data.nickname,
				data.userName,
				data.username,
				data.author,
				data.realName,
				data.contactName
			]
			
			if (data.user) {
				possibleFields.push(
					data.user.nickName,
					data.user.nickname,
					data.user.userName,
					data.user.username,
					data.user.realName
				)
			}
			
			const name = possibleFields
				.map(item => {
					if (typeof item === 'string') {
						return item.trim()
					}
					return item
				})
				.find(item => item)
			
			if (name) {
				return name
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
						Promise.resolve({
							data: false
						}),
					
					// 检查是否已收藏
						getFavorites({
							postId: this.postId
						}).catch(() => ({
							data: {
								rows: []
							}
						})),
					
					// 检查是否已关注（如果有作者userId）
						this.post.userId ? checkFollow(this.post.userId).catch(() => ({
							data: false
						})) : Promise.resolve({
							data: false
						})
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
						response = await addFavorite({
							postId: this.postId
						})
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
						response = await followUser({
							targetUserId: this.post.userId
						})
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

			// 加载评论列表
			async loadComments() {
				if (!this.postId || this.commentLoading) return

				try {
					this.commentLoading = true

					// 添加时间戳防止缓存
					const timestamp = new Date().getTime()
					const response = await getPostComments(this.postId, {
						pageNum: this.commentPageNum,
						pageSize: this.commentPageSize,
						_t: timestamp
					})

					if (response && response.code === 200) {
						let commentList = []

						// 处理响应数据
						if (response.data) {
							if (response.data.rows) {
								commentList = response.data.rows
							} else if (response.data.list) {
								commentList = response.data.list
							} else if (Array.isArray(response.data)) {
								commentList = response.data
							}
						}

						// 调试：打印原始评论数据，查看字段名
						if (commentList && commentList.length > 0) {
							console.log('原始评论数据示例:', commentList[0])
							console.log('评论对象的所有字段:', Object.keys(commentList[0]))
						}

						// 处理评论数据（扁平化）
						const processedComments = this.processComments(commentList)

						if (this.commentPageNum === 1) {
							// 重置评论列表
							this.comments = processedComments
							this.displayedCount = this.displayPageSize // 重置显示数量
						} else {
							// 追加评论
							this.comments = [...this.comments, ...processedComments]
						}

						// 更新显示的评论列表
						this.updateDisplayedComments()

						// 更新分页信息
						this.hasMoreComments = commentList.length === this.commentPageSize

						console.log('✅ 评论加载完成，总评论数:', this.comments.length, '显示评论数:', this.displayedComments.length)
						
						// 强制更新视图
						this.$nextTick(() => {
							this.$forceUpdate()
						})
					}

				} catch (error) {
					console.error('加载评论失败:', error)
					// 失败时不影响主流程
				} finally {
					this.commentLoading = false
				}
			},

			// 获取默认头像
			getDefaultAvatar() {
				// 使用 base64 编码的占位符头像（1x1 透明像素，避免加载错误）
				// 或者使用现有的图片
				return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGNUY1RjUiLz4KPHBhdGggZD0iTTIwIDEyQzIyLjIwOTEgMTIgMjQgMTAuMjA5MSAyNCA4QzI0IDUuNzkwODYgMjIuMjA5MSA0IDIwIDRDMcuNzkwODYgNCAxNiA1Ljc5MDg2IDE2IDhDMTYgMTAuMjA5MSAxNy43OTA5IDEyIDIwIDEyWiIgZmlsbD0iIzk5OTk5OSIvPgo8cGF0aCBkPSJNMTAgMjhDMTAgMjMuNTgxNyAxNC4wMzQ2IDIwIDIwIDIwQzI1Ljk2NTQgMjAgMzAgMjMuNTgxNyAzMCAyOFYzMEgxMFYyOFoiIGZpbGw9IiM5OTk5OTkiLz4KPC9zdmc+'
			},

			// 处理头像加载错误
			handleAvatarError(e) {
				// 如果头像加载失败，使用默认头像
				if (e && e.target) {
					e.target.src = this.getDefaultAvatar()
				}
			},

			// 处理评论数据 - 扁平化结构：将所有评论（包括回复）展平为一级列表
			processComments(comments) {
				if (!Array.isArray(comments)) return []

				const flatComments = []

				// 递归函数：将嵌套的评论结构扁平化
				const flattenComments = (commentList, level = 0) => {
					commentList.forEach(comment => {
						// 兼容多种ID字段名
						const commentId = comment.id || comment.commentId || comment.comment_id
						
						// 如果ID不存在，跳过
						if (!commentId) {
							console.warn('评论ID不存在，跳过该评论:', comment)
							return
						}

						// 添加到扁平列表
						flatComments.push({
							id: commentId,
							content: comment.content,
							userName: comment.userName || comment.user_name || comment.author,
							userAvatar: comment.userAvatar || comment.user_avatar || comment.avatar,
							likeCount: comment.likeCount || comment.like_count || 0,
							createTime: comment.createTime || comment.create_time,
							canDelete: comment.canDelete !== undefined ? comment.canDelete : false,
							parentId: comment.parentId || null, // 父评论ID
							replyToUserName: comment.replyToUserName || comment.reply_to_user_name || null, // 被回复者名称
							level: level, // 评论层级（0=主评论，1=一级回复，2=二级回复...）
							isMainComment: level === 0 // 是否为主评论
						})

						// 如果有回复，递归处理
						if (comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0) {
							// 为每个回复设置 parentId
							const repliesWithParent = comment.replies.map(reply => ({
								...reply,
								parentId: commentId
							}))
							flattenComments(repliesWithParent, level + 1)
						}
					})
				}

				// 开始扁平化处理
				flattenComments(comments, 0)

				// 按创建时间排序（保持后端返回的顺序，如果需要的话）
				// 这里不排序，保持后端返回的原始顺序
				return flatComments
			},

			// 更新显示的评论列表（分页）
			updateDisplayedComments() {
				// 根据 displayedCount 截取要显示的评论
				this.displayedComments = this.comments.slice(0, this.displayedCount)
			},

			// 展开更多评论
			loadMoreDisplayedComments() {
				if (this.displayedCount < this.comments.length) {
					this.displayedCount = Math.min(
						this.displayedCount + this.displayPageSize,
						this.comments.length
					)
					this.updateDisplayedComments()
				}
			},

			// 检查是否还有更多评论可以显示
			hasMoreDisplayedComments() {
				return this.displayedCount < this.comments.length
			},

			// 加载更多评论
			async loadMoreComments() {
				if (!this.hasMoreComments || this.commentLoading) return

				this.commentPageNum++
				await this.loadComments()
			},


		
		// 打开评论输入框（绿色按钮点击）
		openCommentInput() {
			this.showCommentInput = true
			this.commentText = ''
			this.replyingTo = null
			// 聚焦到输入框
			this.$nextTick(() => {
				this.textareaFocused = true
			})
		},

		// 关闭评论输入框
		closeCommentInput() {
			this.showCommentInput = false
			this.commentText = ''
			this.replyingTo = null
			this.textareaFocused = false
		},

		// 打开评论查看弹窗
		openCommentModal() {
			this.showCommentModal = true
			// 如果评论列表为空，加载评论
			if (this.comments.length === 0 && !this.commentLoading) {
				this.loadComments()
			}
		},

		// 提交评论（给帖子发送评论，parentId为null）
		async submitComment() {
				if (!this.commentText.trim() || this.commentLoading || !this.postId) return
			
			try {
				this.commentLoading = true
				
					// 给帖子发送评论，parentId为null
					const response = await submitComment(this.postId, {
						content: this.commentText.trim(),
						parentId: null
					})
				
					if (response && response.code === 200) {
						const commentContent = this.commentText.trim()
						this.commentText = ''

						// 关闭输入框
						this.closeCommentInput()

						// 显示成功提示
						uni.showToast({
							title: '评论成功',
							icon: 'success',
							duration: 1000
						})

						// 从响应中获取新评论数据，如果没有则构建一个
						const newCommentData = response.data || {}
						const commentId = newCommentData.id || newCommentData.commentId || newCommentData.comment_id || Date.now()
						
						// 获取当前用户信息
						let currentUser = null
						try {
							const userInfo = uni.getStorageSync('userInfo')
							if (userInfo) {
								currentUser = typeof userInfo === 'string' ? JSON.parse(userInfo) : userInfo
							}
						} catch (e) {
							console.warn('获取用户信息失败:', e)
						}

						// 构建新评论对象
						const newComment = {
							id: commentId,
							content: commentContent,
							userName: newCommentData.userName || newCommentData.user_name || currentUser?.nickName || currentUser?.userName || '我',
							userAvatar: newCommentData.userAvatar || newCommentData.user_avatar || currentUser?.avatar || '',
							likeCount: newCommentData.likeCount || newCommentData.like_count || 0,
							createTime: newCommentData.createTime || newCommentData.create_time || new Date(),
							canDelete: true, // 自己发的评论可以删除
							parentId: null, // 主评论没有parentId
							replyToUserName: null,
							level: 0, // 主评论level为0
							isMainComment: true
						}

						// 直接添加到评论列表（添加到最前面）
						this.comments.unshift(newComment)
						
						// 更新显示的评论列表
						this.updateDisplayedComments()
						
						// 更新帖子评论数
						this.post.commentCount = (this.post.commentCount || 0) + 1

						// 如果评论弹窗已打开，滚动到顶部显示新评论
						if (this.showCommentModal) {
							this.$nextTick(() => {
								this.scrollToTop()
							})
						}
					} else {
						throw new Error(response ? response.msg || response.message : '评论失败')
					}
				
			} catch (error) {
				console.error('评论提交失败:', error)
					const errorMsg = error.msg || error.message || '评论失败'
				uni.showToast({
						title: errorMsg,
					icon: 'none'
				})

					// 如果是"请先登录"错误，引导用户登录
					if (errorMsg.includes('登录')) {
						setTimeout(() => {
							uni.navigateTo({
								url: '/pages/login/login'
							})
						}, 1500)
					}
			} finally {
				this.commentLoading = false
			}
		},

			// 开始回复（扁平化结构，所有评论都在同一层级）
			startReply(comment) {
				// 兼容不同的ID字段名
				const commentId = comment.id || comment.commentId || comment.comment_id
				
				if (!commentId) {
					console.error('回复失败：评论ID不存在', comment)
					console.error('尝试的字段名: id, commentId, comment_id')
					console.error('评论对象的所有字段:', Object.keys(comment))
					uni.showToast({
						title: '回复失败：缺少评论ID',
						icon: 'none'
					})
					return
				}
				
				// 设置回复目标（parentId 就是被回复的评论ID）
				this.replyingTo = {
					id: commentId, // 被回复的评论ID
					userName: comment.userName || comment.user_name || '匿名用户',
					parentId: commentId // 父评论ID（被回复的评论ID）
				}
				
				console.log('开始回复，replyingTo:', this.replyingTo)
				this.replyText = ''
				
				// 确保评论弹窗打开
				if (!this.showCommentModal) {
					this.showCommentModal = true
				}
				
				// 聚焦到输入框
				this.$nextTick(() => {
					this.textareaFocused = true
				})
			},

			// 取消回复
			cancelReply() {
				this.replyingTo = null
				this.replyText = ''
			},

			// 提交回复
			async submitReply() {
				if (!this.replyText.trim() || this.commentLoading || !this.postId || !this.replyingTo) return

				try {
					this.commentLoading = true

					// 保存回复目标信息，用于后续定位
					// parentId 必须是父评论的ID（回复主评论时是主评论ID，回复回复时是被回复的回复ID）
					const targetParentId = this.replyingTo.parentId || this.replyingTo.id // 父评论ID，如果parentId不存在则使用id
					const mainCommentId = this.replyingTo.mainCommentId || this.replyingTo.id // 主评论ID（用于定位）

					// 验证 parentId 是否存在
					if (!targetParentId) {
						console.error('提交回复失败：parentId 不存在', this.replyingTo)
						uni.showToast({
							title: '回复失败：缺少父评论ID',
							icon: 'none'
						})
						this.commentLoading = false
						return
					}

					console.log('提交回复，parentId:', targetParentId, 'parentId类型:', typeof targetParentId, 'content:', this.replyText.trim())

					// 确保 parentId 是数字类型
					const parentIdNum = Number(targetParentId)
					if (isNaN(parentIdNum) || parentIdNum <= 0) {
						console.error('parentId 格式错误:', targetParentId)
						uni.showToast({
							title: '回复失败：父评论ID格式错误',
							icon: 'none'
						})
						this.commentLoading = false
						return
					}

					// 提交回复时，parentId 必须是父评论的ID
					const response = await submitComment(this.postId, {
						content: this.replyText.trim(),
						parentId: parentIdNum // 父评论ID（确保是数字类型）
					})

					console.log('回复API响应:', response)

					if (response && response.code === 200) {
						const replyContent = this.replyText.trim()
						this.replyText = ''
						
						// 从响应中获取新回复数据，如果没有则构建一个
						const newReplyData = response.data || {}
						const replyId = newReplyData.id || newReplyData.commentId || newReplyData.comment_id || Date.now()
						
						// 获取当前用户信息
						let currentUser = null
						try {
							const userInfo = uni.getStorageSync('userInfo')
							if (userInfo) {
								currentUser = typeof userInfo === 'string' ? JSON.parse(userInfo) : userInfo
							}
						} catch (e) {
							console.warn('获取用户信息失败:', e)
						}

						// 查找父评论，确定level和replyToUserName
						const parentComment = this.comments.find(c => c.id === targetParentId)
						const replyLevel = parentComment ? (parentComment.level || 0) + 1 : 1
						const replyToUserName = parentComment ? (parentComment.userName || '匿名用户') : this.replyingTo.userName

						// 构建新回复对象
						const newReply = {
							id: replyId,
							content: replyContent,
							userName: newReplyData.userName || newReplyData.user_name || currentUser?.nickName || currentUser?.userName || '我',
							userAvatar: newReplyData.userAvatar || newReplyData.user_avatar || currentUser?.avatar || '',
							likeCount: newReplyData.likeCount || newReplyData.like_count || 0,
							createTime: newReplyData.createTime || newReplyData.create_time || new Date(),
							canDelete: true, // 自己发的回复可以删除
							parentId: targetParentId,
							replyToUserName: replyToUserName,
							level: replyLevel,
							isMainComment: false
						}

						// 找到父评论的位置，将新回复插入到父评论之后
						const parentIndex = this.comments.findIndex(c => c.id === targetParentId)
						if (parentIndex !== -1) {
							// 找到父评论后面最后一个同级或子级评论的位置
							let insertIndex = parentIndex + 1
							while (insertIndex < this.comments.length && 
								   this.comments[insertIndex].level > replyLevel) {
								insertIndex++
							}
							this.comments.splice(insertIndex, 0, newReply)
						} else {
							// 如果找不到父评论，直接添加到末尾
							this.comments.push(newReply)
						}
						
						// 更新显示的评论列表
						this.updateDisplayedComments()
						
						// 更新帖子评论数
						this.post.commentCount = (this.post.commentCount || 0) + 1
						
						// 清空回复目标
						this.replyingTo = null

						// 显示成功提示
						uni.showToast({
							title: '回复成功',
							icon: 'success',
							duration: 1000
						})

						// 滚动到新回复位置
						this.$nextTick(() => {
							this.scrollToComment(replyId)
						})
					} else {
						throw new Error(response ? response.msg || response.message : '回复失败')
					}

				} catch (error) {
					console.error('回复提交失败:', error)
					console.error('错误详情:', {
						message: error.message,
						msg: error.msg,
						response: error.response,
						data: error.data,
						status: error.status,
						statusCode: error.statusCode
					})
					
					// 提取更详细的错误信息
					let errorMsg = '回复失败'
					if (error.response && error.response.data) {
						errorMsg = error.response.data.msg || error.response.data.message || errorMsg
					} else if (error.data) {
						errorMsg = error.data.msg || error.data.message || errorMsg
					} else if (error.msg) {
						errorMsg = error.msg
					} else if (error.message) {
						errorMsg = error.message
					}
					
					// 如果是500错误，显示更友好的提示
					if (error.status === 500 || error.statusCode === 500 || errorMsg.includes('500')) {
						errorMsg = '服务器错误，请稍后重试'
					}
					
					uni.showToast({
						title: errorMsg,
						icon: 'none',
						duration: 2000
					})
				} finally {
					this.commentLoading = false
				}
			},

			// 点赞评论
			async handleLikeComment(comment) {
				if (!this.postId || !comment.id) return

				try {
					const isLiked = this.likedComments.has(comment.id)
					const api = isLiked ? unlikeComment : likeComment

					const response = await api(this.postId, comment.id)

					if (response && response.code === 200) {
						// 更新点赞状态
						if (isLiked) {
							this.likedComments.delete(comment.id)
							comment.likeCount = Math.max(0, (comment.likeCount || 0) - 1)
						} else {
							this.likedComments.add(comment.id)
							comment.likeCount = (comment.likeCount || 0) + 1
						}
					} else {
						throw new Error(response ? response.msg || response.message : '操作失败')
					}

				} catch (error) {
					console.error('点赞评论失败:', error)
					const errorMsg = error.msg || error.message || '操作失败'
					uni.showToast({
						title: errorMsg,
						icon: 'none'
					})
				}
			},

			// 删除评论（嵌套结构）
			async handleDeleteComment(comment) {
				if (!this.postId || !comment.id) return

				uni.showModal({
					title: '确认删除',
					content: '确定要删除这条评论吗？',
					success: async (res) => {
						if (res.confirm) {
							try {
								const response = await deleteComment(this.postId, comment.id)

								if (response && response.code === 200) {
									// 更新评论数
									this.post.commentCount = Math.max(0, (this.post.commentCount || 0) - 1)

									// 从扁平化列表中移除（包括所有评论和显示的评论）
									const commentIndex = this.comments.findIndex(c => c.id === comment.id)
									if (commentIndex !== -1) {
										this.comments.splice(commentIndex, 1)
									}
									
									// 更新显示的评论列表
									this.updateDisplayedComments()

									uni.showToast({
										title: '删除成功',
										icon: 'success'
									})
								} else {
									throw new Error(response ? response.msg || response.message : '删除失败')
								}

							} catch (error) {
								console.error('删除评论失败:', error)
								uni.showToast({
									title: error.msg || error.message || '删除失败',
									icon: 'none'
								})
							}
						}
					}
				})
			},
		
		// 图片预览
		previewImage(index) {
			const images = this.getImageList()
			
				if (images && images.length > 0) {
					// 确保 index 在有效范围内
					const currentIndex = typeof index === 'number' ? index : this.currentImageIndex
					const validIndex = Math.max(0, Math.min(currentIndex, images.length - 1))

				uni.previewImage({
					urls: images,
						current: images[validIndex] || images[0],
					indicator: 'number',
						loop: true,
						longPressActions: {
							itemList: ['保存图片'],
							success: (res) => {
								if (res.tapIndex === 0) {
									// 保存图片
									this.saveImage(images[validIndex])
								}
							}
						}
				})
			}
		},

			// 处理 swiper 点击事件
			handleSwiperTap(e) {
				// 点击 swiper 时预览当前图片
				this.previewImage(this.currentImageIndex)
			},

			// 保存图片到相册
			saveImage(imageUrl) {
				uni.downloadFile({
					url: imageUrl,
					success: (res) => {
						if (res.statusCode === 200) {
							uni.saveImageToPhotosAlbum({
								filePath: res.tempFilePath,
								success: () => {
									uni.showToast({
										title: '保存成功',
										icon: 'success'
									})
								},
								fail: (err) => {
									console.error('保存图片失败:', err)
									uni.showToast({
										title: '保存失败',
										icon: 'none'
									})
								}
							})
						}
					},
					fail: (err) => {
						console.error('下载图片失败:', err)
						uni.showToast({
							title: '下载失败',
							icon: 'none'
						})
					}
				})
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

			// 评论滚动事件
			onCommentScroll(e) {
				// 记录滚动位置，但不更新 commentScrollTop（避免循环）
			},

			// 滚动到顶部（用于显示新评论）
			scrollToTop() {
				// 在评论弹窗中滚动到顶部
				this.$nextTick(() => {
					this.commentScrollTop = 0
					// 强制刷新滚动位置
					setTimeout(() => {
						this.commentScrollTop = 0.01
						setTimeout(() => {
							this.commentScrollTop = 0
						}, 10)
					}, 50)
				})
			},

			// 滚动到指定评论
			scrollToComment(commentId) {
				this.$nextTick(() => {
					const query = uni.createSelectorQuery().in(this)
					// 查找对应的评论元素
					query.select(`[data-comment-id="${commentId}"]`).boundingClientRect((res) => {
						if (res) {
							// 计算滚动位置（相对于评论列表容器）
							const scrollTop = res.top - 20
							this.commentScrollTop = scrollTop > 0 ? scrollTop : 0
							// 强制刷新滚动位置
							setTimeout(() => {
								this.commentScrollTop = scrollTop + 0.01
								setTimeout(() => {
									this.commentScrollTop = scrollTop
								}, 10)
							}, 50)
						}
					}).exec()
				})
			},
		
		
		// 关闭评论弹窗
		closeCommentModal() {
			this.showCommentModal = false
				this.replyingTo = null
				this.replyText = ''
				this.textareaFocused = false
			},

			// textarea 聚焦事件
			onTextareaFocus() {
				this.textareaFocused = true
				// 在小程序中，聚焦时可能需要延迟一下确保键盘弹起
				setTimeout(() => {
					// 可以在这里添加滚动到底部的逻辑
				}, 300)
			},

			// textarea 失焦事件
			onTextareaBlur() {
				this.textareaFocused = false
			},

			// textarea 输入事件（评论弹窗中的）
			onTextareaInput(e) {
				// 确保数据同步（小程序中使用 @input 事件）
				const value = e.detail.value
				if (this.replyingTo) {
					this.replyText = value
				} else {
					this.commentText = value
				}
			},

			// 评论输入弹窗中的输入事件
			onCommentInput(e) {
				this.commentText = e.detail.value
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
				this.relatedPosts = [{
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

	.nav-left,
	.nav-right {
	width: 60px;
}

	.back-icon,
	.more-icon {
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
	.loading-container,
	.error-container {
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
		0% {
			transform: rotate(0deg);
		}

		100% {
			transform: rotate(360deg);
		}
}

	.loading-text,
	.error-text {
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

.post-title-row {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 16px;
}

.post-title {
	font-size: 22px;
	font-weight: 600;
	line-height: 1.4;
	color: #1a1a1a;
	flex: 1;
	margin-right: 12px;
}

.post-actions {
	display: flex;
	align-items: center;
}

.delete-post-btn {
	padding: 6px 16px;
	background-color: #f56c6c;
	color: white;
	border: none;
	border-radius: 16px;
	font-size: 13px;
	cursor: pointer;
	white-space: nowrap;
}

.delete-post-btn[disabled] {
	background-color: #f2a3a3;
	opacity: 0.8;
	cursor: not-allowed;
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

	.post-date,
	.post-views {
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
		/* 确保可以点击 */
		cursor: pointer;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
		/* 添加点击反馈 */
		transition: opacity 0.2s;
	}

	.post-image:active {
		opacity: 0.8;
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
		/* 确保可以点击 */
		position: relative;
}

.swiper-image {
	width: 100%;
	height: 100%;
	object-fit: contain;
		/* 确保可以点击 */
		cursor: pointer;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
		/* 添加点击反馈 */
		transition: opacity 0.2s;
	}

	.swiper-image:active {
		opacity: 0.8;
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
	justify-content: space-between;
	padding: 12px 15px;
	background-color: #fff;
	border-top: 1px solid #f0f0f0;
	position: sticky;
	bottom: 0;
	z-index: 100;
}

.action-left {
	flex-shrink: 0;
	margin-right: 12px;
}

/* 评论按钮（绿色按钮样式，类似图二的"我的家"按钮） */
.comment-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #67C23A, #85CE61);
	border: none;
	border-radius: 20px;
	padding: 8px 16px;
	min-width: auto;
	cursor: pointer;
	box-shadow: 0 2px 8px rgba(103, 194, 58, 0.2);
}

.comment-btn-icon {
	font-size: 18px;
	margin-right: 6px;
}

.comment-btn-text {
	font-size: 14px;
	color: #ffffff;
	font-weight: 500;
}

.action-right {
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex: 1;
	margin-left: 20px;
}

/* 操作项（水平排列，无背景卡片） */
.action-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: none;
	border: none;
	padding: 0;
	cursor: pointer;
	flex: 1;
}

.action-icon {
	font-size: 22px;
	margin-bottom: 4px;
}

.action-count {
	font-size: 12px;
	color: #333;
	font-weight: 500;
}

.action-item.liked .action-count,
.action-item.collected .action-count {
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
		/* 小程序中确保弹窗在最上层 */
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
		/* 小程序中确保内容可以正常显示 */
		transform: translateZ(0);
		-webkit-transform: translateZ(0);
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
		max-height: 400px;
		/* 小程序中确保滚动正常 */
		-webkit-overflow-scrolling: touch;
}

.no-comments {
	text-align: center;
	color: #999;
	padding: 40px 0;
}

	/* 评论项 - 扁平化结构 */
	.comment-item {
		display: flex;
		margin-bottom: 16px;
		padding-bottom: 12px;
		position: relative;
		box-sizing: border-box;
	}

	.comment-item:last-child {
		border-bottom: none;
	}

	/* 回复项样式（抖音风格中回复和评论视觉上类似） */
	.comment-item.is-reply {
		padding-left: 0;
		margin-bottom: 12px;
	}

	.comment-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		margin-right: 10px;
		flex-shrink: 0;
	}

	.comment-content {
		flex: 1;
		min-width: 0;
	}

	/* 评论头部：用户名和时间 */
	.comment-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;
	}

	.comment-author-wrapper {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
	}

	.comment-author {
		font-size: 14px;
		font-weight: 500;
		color: #333;
	}

	.reply-mention {
		font-size: 13px;
		color: #ff2e63;
		font-weight: 500;
	}

	.comment-time {
		font-size: 12px;
		color: #999;
	}

	/* 评论内容 */
	.comment-text {
		font-size: 14px;
		line-height: 1.6;
		color: #333;
		margin-bottom: 8px;
		word-break: break-word;
	}

	.comment-actions {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.comment-action-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		cursor: pointer;
		font-size: 12px;
		color: #666;
		padding: 2px 4px;
	}

	.comment-action-btn.liked {
		color: #ff2e63;
	}

	.action-icon {
		font-size: 14px;
	}

	.action-count {
		font-size: 11px;
		color: #999;
	}

	.action-text {
		font-size: 12px;
	}

	.delete-btn {
		color: #ff4d4f;
	}

	/* 回复容器 */
	.replies-container {
		margin-top: 12px;
		padding-left: 0;
	}

	.reply-item {
		display: flex;
		margin-bottom: 12px;
		position: relative;
		box-sizing: border-box;
	}

	.reply-item:last-child {
		margin-bottom: 0;
	}
	
	/* 为回复项添加左侧视觉指示线 */
	.reply-item::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 2px;
		background-color: #e0e0e0;
		border-radius: 1px;
	}

	.reply-avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		margin-right: 8px;
		flex-shrink: 0;
	}

	.reply-content {
		flex: 1;
		min-width: 0;
	}

	.reply-header {
		display: flex;
		align-items: center;
		margin-bottom: 4px;
		gap: 6px;
		flex-wrap: wrap;
	}

	.reply-author {
		font-size: 13px;
		font-weight: 500;
		color: #333;
	}

	.reply-to {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 12px;
		color: #666;
	}

	.reply-to-icon {
		font-size: 12px;
		color: #ff2e63;
	}

	.reply-to-name {
		color: #333;
		font-weight: 500;
	}

	.reply-to-arrow {
		color: #999;
		margin: 0 2px;
	}

	.reply-to-target {
		color: #ff2e63;
		font-weight: 500;
	}

	.reply-time {
		font-size: 11px;
		color: #999;
	}

	.reply-text {
		font-size: 13px;
		line-height: 1.5;
		color: #333;
		margin-bottom: 6px;
		word-break: break-word;
	}

	.reply-actions {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.reply-action-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		cursor: pointer;
		font-size: 11px;
		color: #666;
		padding: 2px 4px;
	}

	.reply-action-btn.liked {
		color: #ff2e63;
	}

	/* 展开更多评论 */
	.expand-more-comments {
		margin: 16px 0;
		padding: 12px;
		text-align: center;
		color: #ff2e63;
		font-size: 14px;
		cursor: pointer;
		border-top: 1px solid #f0f0f0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
	}

	.expand-more-comments:active {
		opacity: 0.7;
	}

	.expand-more-comments .expand-icon {
		font-size: 12px;
		margin-left: 4px;
	}

	/* 展开/收起回复（保留样式，但不再使用） */
	.expand-replies {
		margin-top: 8px;
		padding: 8px 0;
		text-align: left;
		color: #999;
		font-size: 12px;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.expand-replies:active {
		opacity: 0.7;
	}

	.expand-icon {
		font-size: 10px;
		margin-left: 4px;
	}

	.comment-loading,
	.no-more-comments {
		text-align: center;
		padding: 16px;
		color: #999;
		font-size: 12px;
	}

.comment-input-area {
	display: flex;
		flex-direction: column;
	padding: 16px;
	border-top: 1px solid #f0f0f0;
	gap: 12px;
		/* 小程序中确保输入区域固定在底部 */
		background-color: #fff;
		position: relative;
		z-index: 10;
	}

	.reply-hint {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 12px;
		background-color: #f5f5f5;
		border-radius: 6px;
		font-size: 12px;
		color: #666;
	}

	.cancel-reply {
		color: #ff2e63;
		cursor: pointer;
}

.comment-textarea {
	flex: 1;
	min-height: 80px;
		max-height: 200px;
	padding: 12px;
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	font-size: 14px;
	resize: none;
		/* 小程序中确保 textarea 可以正常使用 */
		box-sizing: border-box;
		line-height: 1.5;
}

.submit-comment-btn {
	padding: 8px 16px;
	background-color: #ff2e63;
	color: white;
	border: none;
	border-radius: 6px;
	font-size: 14px;
	cursor: pointer;
		/* 小程序中确保按钮可以正常点击 */
		line-height: 1.5;
		white-space: nowrap;
}

.submit-comment-btn:disabled {
	background-color: #ccc;
	cursor: not-allowed;
		opacity: 0.6;
	}

	/* 小程序中 button 组件的样式重置 */
	.submit-comment-btn::after {
		border: none;
	}

	.button-hover {
		opacity: 0.8;
		transform: scale(0.98);
	}

/* 评论输入弹窗（绿色按钮点击后弹出） */
.comment-input-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 1001;
}

.input-modal-mask {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
}

.input-modal-content {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	background: #fff;
	border-radius: 16px 16px 0 0;
	max-height: 50vh;
	display: flex;
	flex-direction: column;
}

.input-modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px;
	border-bottom: 1px solid #f0f0f0;
}

.input-modal-title {
	font-size: 16px;
	font-weight: 600;
	color: #333;
}

.input-modal-close {
	font-size: 24px;
	color: #999;
	cursor: pointer;
}

.input-modal-body {
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.comment-input-textarea {
	flex: 1;
	min-height: 100px;
	max-height: 200px;
	padding: 12px;
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	font-size: 14px;
	box-sizing: border-box;
	line-height: 1.5;
}

.input-submit-btn {
	padding: 8px 16px;
	background-color: #ff2e63;
	color: white;
	border: none;
	border-radius: 6px;
	font-size: 14px;
	cursor: pointer;
	line-height: 1.5;
	white-space: nowrap;
}

.input-submit-btn:disabled {
	background-color: #ccc;
	cursor: not-allowed;
	opacity: 0.6;
}

.input-submit-btn::after {
	border: none;
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