<template>
  <view class="container">
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">
        <text class="iconfont icon-arrow-left">←</text>
      </view>
      <text class="nav-title">我的关注</text>
      <view class="nav-right"></view>
    </view>

    <view class="content-area">
      <scroll-view class="follow-list" scroll-y="true" @scrolltolower="loadMore">
        <view
          v-for="user in followUsers"
          :key="user.followId"
          class="follow-card"
        >
          <view class="card-main">
            <image
              class="user-avatar"
              :src="user.avatar || defaultAvatar"
              mode="aspectFill"
            />
            <view class="user-info">
              <view class="user-line">
                <text class="user-name">{{ user.nickName }}</text>
                <text class="user-role" v-if="user.roleLabel">{{ user.roleLabel }}</text>
              </view>
              <text class="user-meta" v-if="user.phone">手机 {{ user.phone }}</text>
              <text class="user-meta">关注于 {{ formatFollowTime(user.createTime) }}</text>
            </view>
          </view>
          <view class="card-actions">
            <button class="btn-danger" @tap.stop="handleUnfollow(user.userId)">取消关注</button>
          </view>
        </view>

        <view class="load-more" v-if="hasMore && !loading" @tap="loadMore">
          <text>加载更多</text>
        </view>

        <view class="load-more loading" v-if="loading">
          <text>加载中...</text>
        </view>

        <view class="no-more" v-if="!hasMore && followUsers.length > 0">
          <text>已经到底啦</text>
        </view>

        <view class="empty-state" v-if="!loading && followUsers.length === 0">
          <view class="empty-icon">👥</view>
          <text class="empty-title">暂无关注</text>
          <text class="empty-desc">快去关注你感兴趣的用户吧~</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
import { getFollowings, unfollowUser } from '@/api/social.js'
import { getUserInfoBatch } from '@/api/conversation.js'

export default {
  name: 'FollowsPage',
  data() {
    return {
      followUsers: [],
      loading: false,
      hasMore: true,
      total: 0,
      pageParams: {
        pageNum: 1,
        pageSize: 10
      },
      defaultAvatar: '/static/images/default-avatar.png'
    }
  },

  onLoad() {
    this.resetAndLoad()
  },

  methods: {
    goBack() {
      uni.navigateBack()
    },

    async resetAndLoad() {
      this.pageParams.pageNum = 1
      this.followUsers = []
      this.hasMore = true
      await this.loadFollowUsers()
    },

    extractRows(res) {
      if (!res || !res.data) {
        return []
      }
      if (Array.isArray(res.data.rows)) {
        return res.data.rows
      }
      if (Array.isArray(res.data.list)) {
        return res.data.list
      }
      if (Array.isArray(res.data)) {
        return res.data
      }
      return []
    },

    async loadFollowUsers() {
      if (this.loading || (!this.hasMore && this.pageParams.pageNum > 1)) {
        return
      }
      try {
        this.loading = true
        const res = await getFollowings(this.pageParams)
        if (!res || res.code !== 200) {
          throw new Error(res ? res.msg || res.message : '获取关注列表失败')
        }
        const rows = this.extractRows(res)
        if (rows.length === 0) {
          this.hasMore = false
          return
        }

        const enriched = await this.enrichFollowUsers(rows)
        if (this.pageParams.pageNum === 1) {
          this.followUsers = enriched
        } else {
          this.followUsers = [...this.followUsers, ...enriched]
        }

        const total = typeof res.data?.total === 'number' ? res.data.total : this.followUsers.length
        this.total = total
        if (this.followUsers.length >= total || rows.length < this.pageParams.pageSize) {
          this.hasMore = false
        } else {
          this.pageParams.pageNum += 1
        }
      } catch (error) {
        console.error('加载关注用户失败', error)
        uni.showToast({
          title: error.msg || error.message || '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    async enrichFollowUsers(rows) {
      if (!rows.length) {
        return []
      }
      const userIds = [...new Set(rows.map(item => item.followedId || item.followed_id).filter(Boolean))]
      let profileMap = {}
      if (userIds.length) {
        try {
          const res = await getUserInfoBatch(userIds)
          if (res && res.code === 200 && Array.isArray(res.data)) {
            profileMap = res.data.reduce((acc, user) => {
              acc[user.userId] = user
              return acc
            }, {})
          }
        } catch (error) {
          console.warn('获取用户资料失败', error)
        }
      }
      return rows.map(row => this.normalizeFollowRow(row, profileMap))
    },

    normalizeFollowRow(row, profileMap) {
      const followId = row.followId || row.follow_id
      const userId = row.followedId || row.followed_id
      const profile = profileMap[userId] || {}
      return {
        followId,
        userId,
        nickName: profile.nickName || profile.userName || `用户${userId || ''}`,
        avatar: profile.avatar || row.avatar || '',
        role: profile.userRole,
        roleLabel: this.getRoleLabel(profile.userRole),
        phone: profile.phonenumber || profile.phone,
        createTime: row.createTime || row.create_time
      }
    },

    getRoleLabel(role) {
      const map = {
        1: '普通用户',
        2: '设计师',
        3: '监理',
        4: '材料商'
      }
      return role ? (map[role] || '用户') : ''
    },

    formatFollowTime(value) {
      if (!value) {
        return '未知时间'
      }
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) {
        return value
      }
      const y = date.getFullYear()
      const m = `${date.getMonth() + 1}`.padStart(2, '0')
      const d = `${date.getDate()}`.padStart(2, '0')
      return `${y}-${m}-${d}`
    },

    async handleUnfollow(userId) {
      if (!userId) {
        return
      }
      uni.showModal({
        title: '取消关注',
        content: '确定不再关注该用户吗？',
        success: async (res) => {
          if (!res.confirm) {
            return
          }
          try {
            await unfollowUser(userId)
            uni.showToast({ title: '已取消', icon: 'success' })
            await this.resetAndLoad()
          } catch (error) {
            console.error('取消关注失败', error)
            uni.showToast({
              title: error.msg || error.message || '操作失败',
              icon: 'none'
            })
          }
        }
      })
    },

    loadMore() {
      this.loadFollowUsers()
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.nav-back {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: #333;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

.nav-right {
  width: 60rpx;
}

.content-area {
  flex: 1;
}

.follow-list {
  height: calc(100vh - 120rpx);
  padding: 20rpx;
}

.follow-card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 24rpx 24rpx 24rpx 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.card-main {
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex: 1;
}

.user-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background-color: #f2f2f2;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.user-line {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.user-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.user-role {
  font-size: 24rpx;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  background: #eef5ff;
  color: #1890ff;
}

.user-meta {
  font-size: 26rpx;
  color: #999;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  margin-left: 20rpx;
}

.btn-danger {
  padding: 16rpx 40rpx;
  border-radius: 999rpx;
  background: #ff4d4f;
  color: #fff;
  font-size: 28rpx;
  border: none;
}

.load-more {
  text-align: center;
  padding: 40rpx 0;
  color: #666;
  font-size: 28rpx;
}

.load-more.loading {
  color: #999;
}

.no-more {
  text-align: center;
  padding: 40rpx 0;
  color: #999;
  font-size: 24rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  text-align: center;
  color: #999;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
  opacity: 0.5;
}

.empty-title {
  font-size: 32rpx;
  color: #666;
  margin-bottom: 12rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #999;
}
</style>

