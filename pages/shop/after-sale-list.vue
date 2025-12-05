<template>
  <view class="page">
    <view class="section card" v-if="orderId">
      <view class="section-title">订单信息</view>
      <view class="field-row">
        <text class="field-label">订单号</text>
        <text class="field-value">{{ order.orderNo || '-' }}</text>
      </view>
    </view>

    <view class="section card" v-if="afterSaleList.length > 0">
      <view class="section-title">售后记录</view>
      <view
        class="record-item"
        v-for="record in afterSaleList"
        :key="record.afterSaleId || record.id"
      >
        <view class="record-header">
          <!-- 修复：使用对象语法代替方法调用 -->
          <view class="record-type" :class="{
            'type-refund': record.type == 1 || record.type == 'refund',
            'type-return': record.type == 2 || record.type == 'return',
            'type-exchange': record.type == 3 || record.type == 'exchange'
          }">
            {{ getTypeText(record.type) }}
          </view>
        </view>
        <view class="record-content">
          <view class="record-row">
            <text class="record-label">申请原因：</text>
            <text class="record-value">{{ getReasonText(record.reason) || '-' }}</text>
          </view>
          <view class="record-row" v-if="record.remark">
            <text class="record-label">补充说明：</text>
            <text class="record-value">{{ record.remark }}</text>
          </view>
          <view class="record-row" v-if="record.createdTime">
            <text class="record-label">申请时间：</text>
            <text class="record-value">{{ formatTime(record.createdTime) }}</text>
          </view>
          <view class="record-row" v-if="record.updateTime">
            <text class="record-label">更新时间：</text>
            <text class="record-value">{{ formatTime(record.updateTime) }}</text>
          </view>
        </view>
        <!-- 优化：避免在模板中重复调用方法 -->
        <view class="record-images" v-if="recordImages(record).length > 0">
          <image
            v-for="(img, index) in recordImages(record)"
            :key="index"
            :src="img"
            mode="aspectFill"
            class="record-image"
            @click="previewImage(img, recordImages(record))"
          ></image>
        </view>
      </view>
    </view>

    <view class="empty-state" v-if="!loading && afterSaleList.length === 0">
      <view class="empty-icon">📋</view>
      <text class="empty-text">暂无售后记录</text>
      <text class="empty-desc">该订单还没有售后申请记录</text>
    </view>

    <view class="loading-state" v-if="loading">
      <text class="loading-text">加载中...</text>
    </view>
  </view>
</template>

<script>
import * as orderApi from '@/api/product-order.js'
import * as afterSaleApi from '@/api/after-sale.js'

export default {
  name: 'AfterSaleList',
  data() {
    return {
      orderId: null,
      order: {},
      afterSaleList: [],
      loading: false
    }
  },
  onLoad(query) {
    if (query && query.orderId) {
      this.orderId = Number(query.orderId)
      this.loadOrderDetail()
      this.loadAfterSaleList()
    } else {
      uni.showToast({ title: '订单ID缺失', icon: 'none' })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
  },
  methods: {
    async loadOrderDetail() {
      try {
        const res = await orderApi.getOrderDetail(this.orderId)
        if (res && res.code === 200 && res.data) {
          this.order = res.data
        }
      } catch (error) {
        console.error('加载订单详情失败:', error)
      }
    },
    async loadAfterSaleList() {
      this.loading = true
      try {
        const res = await afterSaleApi.getAfterSaleList(this.orderId)
        if (res && res.code === 200) {
          this.afterSaleList = res.data || []
        } else {
          uni.showToast({ title: res?.msg || '加载失败', icon: 'none' })
        }
      } catch (error) {
        console.error('加载售后记录失败:', error)
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    getTypeText(type) {
      // 支持数字类型和字符串类型
      const typeStr = String(type)
      const typeMap = {
        '1': '退款',
        '2': '退货',
        '3': '换货',
        'refund': '退款',
        'return': '退货',
        'exchange': '换货'
      }
      return typeMap[typeStr] || '售后'
    },
    // 新增：返回类名对象的方法
    typeClassObj(type) {
      const typeStr = String(type)
      return {
        'type-refund': typeStr === '1' || typeStr === 'refund',
        'type-return': typeStr === '2' || typeStr === 'return',
        'type-exchange': typeStr === '3' || typeStr === 'exchange'
      }
    },
    // 或者也可以用这种简写方式
    getTypeClass(type) {
      const typeStr = String(type)
      const classMap = {
        '1': 'type-refund',
        '2': 'type-return',
        '3': 'type-exchange',
        'refund': 'type-refund',
        'return': 'type-return',
        'exchange': 'type-exchange'
      }
      return classMap[typeStr] || ''
    },
    getReasonText(reason) {
      if (!reason) return ''
      
      // 原因代码到中文的映射
      const reasonMap = {
        'QUALITY': '质量问题',
        'DAMAGED': '商品损坏',
        'WRONG': '发错商品',
        'NOT_MATCH': '与描述不符',
        'SIZE': '尺寸不合适',
        'NO_NEED': '不需要了',
        'OTHER': '其他原因'
      }
      
      // 如果是英文代码，转换为中文
      if (reasonMap[reason]) {
        return reasonMap[reason]
      }
      
      // 如果已经是中文或其他文本，直接返回
      return reason
    },
    formatTime(time) {
      if (!time) return '-'
      return new Date(time).toLocaleString()
    },
    // 修改：简化图片获取逻辑
    recordImages(record) {
      if (!record.images) return []
      try {
        // 如果是字符串，尝试解析JSON
        if (typeof record.images === 'string') {
          // 先检查是否是有效的JSON字符串
          if (record.images.startsWith('[') || record.images.startsWith('{')) {
            const parsed = JSON.parse(record.images)
            // 如果是数组，直接返回
            if (Array.isArray(parsed)) {
              return parsed
            }
            // 如果是对象且有图片数组，返回数组
            if (parsed && Array.isArray(parsed.images)) {
              return parsed.images
            }
          }
          // 如果不是JSON，可能是一个图片URL字符串
          return [record.images]
        }
        // 如果已经是数组，直接返回
        if (Array.isArray(record.images)) {
          return record.images
        }
      } catch (e) {
        console.warn('解析图片列表失败，使用原始值:', record.images)
        // 解析失败，返回包含原始值的数组
        return [record.images]
      }
      return []
    },
    previewImage(current, urls) {
      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        urls = [current]
      }
      uni.previewImage({
        current: current,
        urls: urls
      })
    }
  }
}
</script>

<style scoped>
/* 样式保持不变 */
.page {
  min-height: 100vh;
  padding: 24rpx;
  box-sizing: border-box;
  background-color: #f5f7fa;
}

.section {
  margin-bottom: 20rpx;
}

.card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.03);
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16rpx;
}

.field-row {
  display: flex;
  margin-top: 12rpx;
}

.field-label {
  width: 150rpx;
  font-size: 26rpx;
  color: #909399;
}

.field-value {
  flex: 1;
  font-size: 26rpx;
  color: #606266;
}

.record-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f2f2f2;
}

.record-item:last-child {
  border-bottom-width: 0;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.record-type {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 500;
}

.type-refund {
  background: #fef0f0;
  color: #f56c6c;
}

.type-return {
  background: #fdf6ec;
  color: #e6a23c;
}

.type-exchange {
  background: #ecf5ff;
  color: #409eff;
}

.record-content {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.record-row {
  display: flex;
  font-size: 26rpx;
}

.record-label {
  color: #909399;
  min-width: 140rpx;
}

.record-value {
  flex: 1;
  color: #606266;
}

.record-images {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}

.record-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 40rpx;
  text-align: center;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 32rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #999;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}
</style>