<template>
  <view class="supervisor-container">
    <!-- 顶部标题 -->
    <view class="page-header">
      <h1 class="page-title">寻找监工</h1>
    </view>
    
    <!-- 搜索区域 -->
    <view class="search-section">
      <view class="search-box">
        <input 
          v-model="searchKeyword" 
          type="text" 
          class="search-input" 
          placeholder="输入监工姓名搜索" 
          @input="handleSearch"
        />
        <view class="search-icon">🔍</view>
      </view>
    </view>
    
    <!-- 监工列表 -->
    <view class="supervisor-list">
      <view 
        v-for="supervisor in supervisors" 
        :key="supervisor.userId" 
        class="supervisor-card"
        @click="goToSupervisorDetail(supervisor)"
      >
        <!-- 头像区域 -->
        <view class="avatar-wrapper">
          <image
            :src="supervisor.avatar || defaultAvatar"
            mode="aspectFill"
            class="avatar"
            @error="onAvatarError"
          ></image>
          <!-- 在线状态指示器 -->
          <OnlineStatusIndicator 
            :isOnline="supervisor.isOnline || false"
            :showText="false"
            size="small"
            class="online-status-overlay"
          />
          <!-- 评分徽章 -->
          <view v-if="supervisor.ratingLevel && supervisor.rating > 4" class="rating-badge">
            {{ supervisor.ratingLevel }}
          </view>
        </view>
        
        <view class="supervisor-info">
          <view class="supervisor-name">{{ supervisor.name || '匿名监工' }}</view>
          <view class="supervisor-rating">
            <!-- 星级显示 -->
            <view class="stars">
              <view 
                class="star-filled" 
                :style="{ width: getStarWidth(supervisor.rating) }"
              >
                ★★★★★
              </view>
              <view class="star-empty">★★★★★</view>
            </view>
            <view class="rating-info">
              <view class="rating-score">{{ formatRating(supervisor.rating) }}</view>
              <view class="rating-details">
                <text class="rating-level">{{ supervisor.ratingLevel }}</text>
                <text class="rating-count" v-if="supervisor.ratingCount > 0">
                  ({{ supervisor.ratingCount }}条评价)
                </text>
                <text class="rating-count" v-else>
                  (暂无评价)
                </text>
              </view>
            </view>
          </view>
          <view class="supervisor-details">
            <view class="detail-item">
              <view class="detail-icon">📁</view>
              <view>案例: {{ supervisor.caseCount || 0 }}个</view>
            </view>
            <view class="detail-item">
              <view class="detail-icon">✅</view>
              <view>完成: {{ supervisor.completedOrders || 0 }}单</view>
            </view>
            <view class="detail-item">
              <view class="detail-icon">📍</view>
              <view>{{ supervisor.address || supervisor.city || '未知地区' }}</view>
            </view>
          </view>
        </view>
        <view class="card-actions">
          <button class="contact-btn" @click.stop="contactSupervisor(supervisor.userId)">
            联系监工
          </button>
        </view>
      </view>
    </view>
    
    <!-- 空状态 -->
    <view v-if="!loading && supervisors.length === 0" class="empty-state">
      <view class="empty-icon">👷</view>
      <view class="empty-text">{{ emptyText }}</view>
    </view>
    
    <!-- 加载状态 -->
    <view v-if="loading" class="loading">
      <view class="spinner"></view>
      <text>正在加载监工列表...</text>
    </view>
  </view>
</template>

<script>
import { getSupervisorList, contactSupervisor } from '@/api/supervisorpublic'
import { getUserProfile } from "@/api/users.js"
import { createConversationAndNavigate, isUserLoggedIn, handleNotLoggedIn } from "@/utils/conversationHelper.js"
import { getUserRatingDetail } from '@/api/rating' // 修改导入
import { batchGetUserOnlineStatus } from "@/api/onlineStatus.js"

export default {
  name: 'SupervisorList',
  components: {
    OnlineStatusIndicator: () => import('@/components/OnlineStatusIndicator.vue')
  },
  data() {
    return {
      searchKeyword: '',
      supervisors: [],
      loading: false,
      searchTimer: null,
      defaultAvatar: '/static/default-avatar.png',
      currentUserInfo: null,
      isLoadingUser: false,
      isFetchingRatings: false, // 新增：防止重复请求评分
      onlineStatusCache: {}, // 在线状态缓存
      onlineStatusCacheTime: null, // 缓存时间
      CACHE_DURATION: 30000 // 缓存持续时间30秒
    }
  },
  
  computed: {
    emptyText() {
      return this.searchKeyword ? '未找到相关监工' : '暂无监工信息'
    }
  },
  
  async onLoad() {
    // 先获取用户信息，再加载监理列表
    await this.getCurrentUserInfo();
    this.loadSupervisors();
  },
  
  onShow() {
    if (this.supervisors.length === 0) {
      this.loadSupervisors();
    } else {
      // 如果缓存过期，刷新在线状态
      if (!this.isOnlineStatusCacheValid()) {
        this.loadSupervisorOnlineStatus();
      }
    }
  },
  
  methods: {
    // 获取当前用户信息
    async getCurrentUserInfo() {
      if (this.isLoadingUser) return;
      
      this.isLoadingUser = true;
      try {
        const cachedUserInfo = uni.getStorageSync('userInfo');
        if (cachedUserInfo && cachedUserInfo.userId) {
          this.currentUserInfo = cachedUserInfo;
          this.isLoadingUser = false;
          return;
        }
        
        const response = await getUserProfile();
        
        if (response.code === 200 && response.data) {
          this.currentUserInfo = response.data;
          
          if (getApp().globalData) {
            getApp().globalData.userInfo = response.data;
          }
          
          try {
            uni.setStorageSync('userInfo', response.data);
            if (response.data.userId) {
              uni.setStorageSync('userId', response.data.userId.toString());
            }
          } catch (storageError) {
            console.warn('⚠️ 存储用户信息失败:', storageError);
          }
        } else {
          console.error('❌ 获取用户信息失败:', response.msg);
          this.currentUserInfo = null;
          this.handleUserInfoError();
        }
      } catch (error) {
        console.error('❌ 获取用户信息异常:', error);
        this.currentUserInfo = null;
        this.handleUserInfoError();
      } finally {
        this.isLoadingUser = false;
      }
    },
    
    // 处理用户信息获取失败
    handleUserInfoError() {
      try {
        uni.removeStorageSync('userInfo');
        uni.removeStorageSync('userId');
      } catch (e) {
        console.warn('清除缓存失败:', e);
      }
      
      uni.showModal({
        title: '提示',
        content: '获取用户信息失败，请重新登录',
        showCancel: false,
        success: () => {
          uni.reLaunch({
            url: '/pages/register'
          });
        }
      });
    },
    
    // 加载监工列表
    async loadSupervisors() {
      this.loading = true
      
      try {
        const response = await getSupervisorList(this.searchKeyword)
        
        if (response.code === 200) {
          const supervisors = response.data || []
          console.log('📋 获取监工列表:', supervisors)
          
          // 批量获取监工评分
          await this.loadSupervisorRatings(supervisors)
          
          // 批量获取在线状态
          await this.loadSupervisorOnlineStatus()
        } else {
          console.error('获取监工列表失败:', response.msg)
          this.supervisors = []
          uni.showToast({
            title: response.msg || '获取监工列表失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('获取监工列表失败:', error)
        this.supervisors = []
        uni.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    // 批量获取监工评分 - 针对新的API数据结构
    async loadSupervisorRatings(supervisors) {
      if (!supervisors || supervisors.length === 0) {
        this.supervisors = []
        return
      }
      
      console.log('🔍 开始获取监工评分，共', supervisors.length, '个监工')
      
      // 防止重复请求
      if (this.isFetchingRatings) {
        console.log('⏳ 评分请求正在进行中，跳过')
        this.mapSupervisorsWithDefaultRating(supervisors)
        return
      }
      
      this.isFetchingRatings = true
      
      try {
        // 使用Promise.all并行获取评分，但限制并发数量
        const batchSize = 3 // 每次并发请求3个
        const allRatingResults = []
        
        for (let i = 0; i < supervisors.length; i += batchSize) {
          const batch = supervisors.slice(i, i + batchSize)
          console.log(`🔄 处理第${Math.floor(i/batchSize)+1}批监工:`, batch.map(s => s.userId))
          
          const batchPromises = batch.map(supervisor => 
            this.getSupervisorRating(supervisor).catch(error => {
              console.error(`❌ 监工 ${supervisor.userId} 评分获取失败:`, error)
              return {
                userId: supervisor.userId,
                supervisor: supervisor,
                success: false
              }
            })
          )
          
          const batchResults = await Promise.all(batchPromises)
          allRatingResults.push(...batchResults)
          
          // 短暂延迟，避免请求过于频繁
          if (i + batchSize < supervisors.length) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }
        
        console.log('✅ 所有评分结果:', allRatingResults)
        
        // 处理评分结果，更新监工列表
        this.supervisors = allRatingResults.map(result => {
          const supervisor = result.supervisor
          
          if (result.success) {
            // 成功获取评分
            return {
              userId: supervisor.userId,
              id: supervisor.userId,
              name: supervisor.name || result.nickName || '匿名监工',
              rating: result.rating || 5.0,
              ratingCount: result.ratingCount || 0,
              ratingLevel: result.ratingLevel || '良好',
              completedOrders: result.completedOrders || 0,
              totalOrders: result.totalOrders || 0,
              caseCount: supervisor.caseCount || result.totalOrders || 0,
              city: supervisor.city || '未知地区',
              phone: supervisor.phone,
              experience: supervisor.experience || '5年',
              location: supervisor.location || supervisor.city || '未知地区',
              certificates: supervisor.certificates || ['监理资格证书'],
              specialty: supervisor.specialty || '住宅工程监理',
              description: supervisor.description || '资深监理工程师，拥有丰富的施工现场管理经验。',
              projects: supervisor.projects || supervisor.caseCount || 0
            }
          } else {
            // 获取评分失败，使用默认值
            return {
              userId: supervisor.userId,
              id: supervisor.userId,
              name: supervisor.name || '匿名监工',
              rating: supervisor.rating || 5.0,
              ratingCount: 0,
              ratingLevel: '良好',
              completedOrders: 0,
              totalOrders: 0,
              caseCount: supervisor.caseCount || 0,
              city: supervisor.city || '未知地区',
              phone: supervisor.phone,
              experience: supervisor.experience || '5年',
              location: supervisor.location || supervisor.city || '未知地区',
              certificates: supervisor.certificates || ['监理资格证书'],
              specialty: supervisor.specialty || '住宅工程监理',
              description: supervisor.description || '资深监理工程师，拥有丰富的施工现场管理经验。',
              projects: supervisor.projects || supervisor.caseCount || 0
            }
          }
        })
        
        console.log('✅ 最终监工列表:', this.supervisors)
        
      } catch (error) {
        console.error('❌ 批量获取监工评分失败:', error)
        // 发生异常时使用默认评分
        this.mapSupervisorsWithDefaultRating(supervisors)
      } finally {
        this.isFetchingRatings = false
      }
    },
    
    // 获取单个监工的评分
    async getSupervisorRating(supervisor) {
      console.log(`📡 获取监工 ${supervisor.userId} (${supervisor.name}) 的评分...`)
      
      try {
        // 调用getUserRatingDetail接口
        const ratingResponse = await getUserRatingDetail({
          userId: supervisor.userId,
          onlyCompleted: true // 只计算已完成订单
        })
        
        console.log(`📊 监工 ${supervisor.userId} 评分响应:`, ratingResponse)
        
        if (ratingResponse.code === 200 && ratingResponse.data) {
          const ratingData = ratingResponse.data
          
          return {
            userId: supervisor.userId,
            supervisor: supervisor,
            success: true,
            rating: ratingData.avgRating || 5.0,
            ratingCount: ratingData.totalRatingCount || ratingData.reviewedOrders || 0,
            totalOrders: ratingData.totalOrders || 0,
            completedOrders: ratingData.completedOrders || 0,
            ratingLevel: ratingData.ratingLevel || '良好',
            nickName: ratingData.nickName
          }
        } else {
          console.warn(`⚠️ 监工 ${supervisor.userId} 评分数据格式异常:`, ratingResponse)
          throw new Error(ratingResponse.msg || '评分数据格式异常')
        }
      } catch (error) {
        console.error(`❌ 获取监工 ${supervisor.userId} 评分失败:`, error)
        throw error
      }
    },
    
    // 使用默认评分映射监工
    mapSupervisorsWithDefaultRating(supervisors) {
      this.supervisors = supervisors.map(supervisor => ({
        userId: supervisor.userId,
        id: supervisor.userId,
        name: supervisor.name || '匿名监工',
        rating: supervisor.rating || 5.0,
        ratingCount: 0,
        ratingLevel: '良好',
        completedOrders: 0,
        totalOrders: 0,
        caseCount: supervisor.caseCount || 0,
        city: supervisor.city || '未知地区',
        phone: supervisor.phone,
        experience: supervisor.experience || '5年',
        location: supervisor.location || supervisor.city || '未知地区',
        certificates: supervisor.certificates || ['监理资格证书'],
        specialty: supervisor.specialty || '住宅工程监理',
        description: supervisor.description || '资深监理工程师，拥有丰富的施工现场管理经验。',
        projects: supervisor.projects || supervisor.caseCount || 0
      }))
    },
    
    // 处理搜索
    handleSearch() {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer)
      }
      
      this.searchTimer = setTimeout(() => {
        this.loadSupervisors()
      }, 500)
    },
    
    // 跳转到监工详情页
    goToSupervisorDetail(supervisor) {
      console.log('跳转到监工详情，监工ID:', supervisor.userId, '监工数据:', supervisor)
      uni.navigateTo({
        url: `/pages/find-supervisor/supervisor-detail?supervisorId=${supervisor.userId || supervisor.id}`
      })
    },
    
    // 联系监工
    async contactSupervisor(supervisorId) {
      const supervisor = this.supervisors.find(s => s.userId === supervisorId);
      
      if (!supervisor) {
        uni.showToast({
          title: '监理信息不存在',
          icon: 'error'
        });
        return;
      }
      
      uni.showActionSheet({
        itemList: ['查看详情', '在线咨询'],
        success: (res) => {
          const tapIndex = res.tapIndex;
          switch (tapIndex) {
            case 0:
              this.goToSupervisorDetail(supervisor);
              break;
            case 1:
              this.onlineConsult(supervisor);
              break;
          }
        }
      });
    },
    
    async onlineConsult(supervisor) {
      console.log('🔥 开始在线咨询监理:', supervisor);
      
      if (!isUserLoggedIn()) {
        handleNotLoggedIn();
        return;
      }
      
      if (!supervisor || !supervisor.userId) {
        console.error('❌ 监理信息不完整:', supervisor);
        uni.showToast({
          title: '监理信息无效',
          icon: 'error'
        });
        return;
      }
      
      await createConversationAndNavigate(
        supervisor.userId,
        supervisor.name || '监理',
        supervisor.avatar || ''
      );
    },
    
    // 格式化手机号
    formatPhone(phone) {
      if (!phone) return '电话未提供'
      
      if (phone.length === 11) {
        return phone.substring(0, 3) + '****' + phone.substring(7)
      }
      
      return phone
    },
    
    // 格式化评分显示
    formatRating(rating) {
      if (!rating && rating !== 0) return '5.0'
      return typeof rating === 'number' ? rating.toFixed(1) : rating
    },
    
    // 计算星级显示宽度
    getStarWidth(rating) {
      const ratingValue = parseFloat(rating) || 5.0
      // 5星制，计算百分比
      const percentage = (ratingValue / 5) * 100
      return `${percentage}%`
    },
    
    // 加载监理在线状态
    async loadSupervisorOnlineStatus() {
      try {
        // 检查缓存是否有效
        if (this.isOnlineStatusCacheValid()) {
          console.log('🔄 使用缓存的在线状态数据');
          this.applyOnlineStatusFromCache();
          return;
        }
        
        // 提取监理ID
        const supervisorIds = this.supervisors
          .filter(supervisor => supervisor.userId)
          .map(supervisor => supervisor.userId);
        
        console.log('🌐 需要获取在线状态的监理ID:', supervisorIds);
        
        if (supervisorIds.length === 0) {
          console.warn('⚠️ 没有找到有效的监理ID');
          return;
        }
        
        // 批量获取在线状态
        const onlineStatusResponse = await batchGetUserOnlineStatus(supervisorIds);
        console.log('🌐 在线状态API响应:', onlineStatusResponse);
        
        if (onlineStatusResponse.code === 200) {
          const onlineStatusMap = onlineStatusResponse.data || {};
          console.log('📊 在线状态数据映射:', onlineStatusMap);
          
          // 更新缓存
          this.onlineStatusCache = onlineStatusMap;
          this.onlineStatusCacheTime = Date.now();
          
          // 将在线状态数据合并到监理数据中
          this.supervisors = this.supervisors.map(supervisor => {
            const userId = supervisor.userId;
            const onlineInfo = onlineStatusMap[userId] || {};
            
            return {
              ...supervisor,
              isOnline: onlineInfo.isOnline || false,
              lastActiveTime: onlineInfo.lastActiveTime || null
            };
          });
          
          console.log('✅ 在线状态数据已合并到监理列表');
          
        } else {
          console.warn('⚠️ 获取在线状态失败，使用默认离线状态');
          this.setAllSupervisorsOffline();
        }
        
      } catch (error) {
        console.error('❌ 获取在线状态数据错误:', error);
        this.setAllSupervisorsOffline();
      }
    },
    
    // 检查在线状态缓存是否有效
    isOnlineStatusCacheValid() {
      if (!this.onlineStatusCacheTime || Object.keys(this.onlineStatusCache).length === 0) {
        return false;
      }
      
      const now = Date.now();
      const cacheAge = now - this.onlineStatusCacheTime;
      return cacheAge < this.CACHE_DURATION;
    },
    
    // 从缓存应用在线状态
    applyOnlineStatusFromCache() {
      this.supervisors = this.supervisors.map(supervisor => {
        const userId = supervisor.userId;
        const onlineInfo = this.onlineStatusCache[userId] || {};
        
        return {
          ...supervisor,
          isOnline: onlineInfo.isOnline || false,
          lastActiveTime: onlineInfo.lastActiveTime || null
        };
      });
    },
    
    // 设置所有监理为离线状态
    setAllSupervisorsOffline() {
      this.supervisors = this.supervisors.map(supervisor => ({
        ...supervisor,
        isOnline: false,
        lastActiveTime: null
      }));
    },
    
    // 刷新在线状态
    async refreshOnlineStatus() {
      console.log('🔄 刷新在线状态');
      // 清除缓存，强制重新获取
      this.onlineStatusCache = {};
      this.onlineStatusCacheTime = null;
      
      await this.loadSupervisorOnlineStatus();
      
      uni.showToast({
        title: '状态已更新',
        icon: 'success',
        duration: 1500
      });
    },
    
    // 头像加载失败
    onAvatarError(e) {
      console.error('头像加载失败:', e);
      const img = e.target;
      if (img) {
        img.src = this.defaultAvatar;
      }
    },
    
    // 下拉刷新
    onPullDownRefresh() {
      console.log('🔄 下拉刷新');
      // 清除在线状态缓存，确保获取最新状态
      this.onlineStatusCache = {};
      this.onlineStatusCacheTime = null;
      
      this.loadSupervisors().then(() => {
        uni.stopPullDownRefresh();
        uni.showToast({
          title: '刷新成功',
          icon: 'success'
        });
      });
    },
    
    // 上拉加载更多
    onReachBottom() {
      console.log('⬇️ 上拉加载更多');
      // 可以在这里实现分页加载逻辑
    }
  }
}
</script>

<style scoped>
.supervisor-container {
  padding: 30rpx;
  background-color: #f5f7fa;
  min-height: 100vh;
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: 30rpx;
}

.page-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

/* 搜索区域 */
.search-section {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  height: 80rpx;
  border: 1px solid #e0e0e0;
  border-radius: 40rpx;
  padding: 0 80rpx 0 30rpx;
  font-size: 28rpx;
  background: #f8f8f8;
  outline: none;
  transition: all 0.3s;
}

.search-input:focus {
  border-color: #8b5cf6;
  background: white;
}

.search-icon {
  position: absolute;
  right: 30rpx;
  color: #8b5cf6;
  font-size: 32rpx;
}

/* 监工列表 */
.supervisor-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.supervisor-card {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  cursor: pointer;
  transition: all 0.3s ease;
}

.supervisor-card:active {
  transform: translateY(-2px);
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
}

/* 头像区域 */
.avatar-wrapper {
  position: relative;
  margin-right: 25rpx;
  flex-shrink: 0;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid #f0f0f0;
  background: linear-gradient(135deg, #f5f7fa, #e4e7eb);
}

.online-status-overlay {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  z-index: 2;
}

.rating-badge {
  position: absolute;
  bottom: -8rpx;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #ffd700, #ffa500);
  color: white;
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 2rpx 8rpx rgba(255, 165, 0, 0.3);
}

.supervisor-info {
  flex: 1;
  min-width: 0;
}

.supervisor-name {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
  color: #333;
}

/* 评分样式 */
.supervisor-rating {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  gap: 20rpx;
}

.stars {
  position: relative;
  color: #e0e0e0;
  font-size: 30rpx;
  line-height: 1;
  width: 150rpx;
}

.star-filled {
  position: absolute;
  top: 0;
  left: 0;
  color: #ffc107;
  overflow: hidden;
  white-space: nowrap;
}

.star-empty {
  color: #e0e0e0;
}

.rating-info {
  display: flex;
  flex-direction: column;
}

.rating-score {
  font-size: 36rpx;
  font-weight: bold;
  color: #ff8c00;
  line-height: 1.2;
}

.rating-details {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 4rpx;
}

.rating-level {
  font-size: 24rpx;
  color: #52c41a;
  background: rgba(82, 196, 26, 0.1);
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}

.rating-count {
  font-size: 24rpx;
  color: #999;
}

.supervisor-details {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.detail-item {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  color: #666;
  gap: 8rpx;
}

.detail-icon {
  font-size: 26rpx;
}

.card-actions {
  margin-left: 30rpx;
}

.contact-btn {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  color: white;
  border: none;
  border-radius: 32rpx;
  padding: 16rpx 32rpx;
  font-size: 26rpx;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.contact-btn:active {
  background: linear-gradient(135deg, #7c3aed, #8b5cf6);
  transform: translateY(-1px);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80rpx 40rpx;
  color: #999;
}

.empty-icon {
  font-size: 96rpx;
  margin-bottom: 20rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 28rpx;
}

/* 加载状态 */
.loading {
  text-align: center;
  padding: 60rpx;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  display: inline-block;
  width: 32rpx;
  height: 32rpx;
  border: 4rpx solid #f3f3f3;
  border-top: 4rpx solid #8b5cf6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 16rpx;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式调整 */
@media (max-width: 480px) {
  .supervisor-container {
    padding: 30rpx;
  }
  
  .page-title {
    font-size: 40rpx;
  }
  
  .supervisor-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 24rpx;
  }
  
  .avatar-wrapper {
    margin-right: 0;
    margin-bottom: 20rpx;
  }
  
  .avatar {
    width: 100rpx;
    height: 100rpx;
  }
  
  .supervisor-rating {
    flex-direction: column;
    align-items: flex-start;
    gap: 12rpx;
  }
  
  .card-actions {
    margin-left: 0;
    width: 100%;
  }
  
  .contact-btn {
    width: 100%;
  }
}
</style>