<template>
  <view class="checkout-page">
    <!-- 收货地址区域 -->
    <view class="address-card" @click="goAddressPage">
      <view v-if="address" class="address-content">
        <view class="address-header">
          <text class="name">{{ address.name }}</text>
          <text class="phone">{{ address.phone }}</text>
        </view>
        <text class="detail">{{ address.region }}</text>
      </view>
      <view v-else class="address-empty">
        <text class="hint">请选择收货地址</text>
        <text class="sub-hint">点击前往地址管理页新增或设为默认</text>
      </view>
      <text class="iconfont icon-chevron-right right-icon"></text>
    </view>

    <!-- 商品及店铺信息 -->
    <scroll-view scroll-y class="content">
      <view
        v-for="group in shopGroups"
        :key="group.shopKey"
        class="shop-section"
      >
        <view class="shop-header">
          <text class="shop-name">
            {{ group.shopName || '店铺' }}(共 {{ group.items.length }} 件)
          </text>
        </view>

        <view
          v-for="item in group.items"
          :key="item.cartId"
          class="item-row"
        >
          <image
            class="item-image"
            :src="getItemImage(item)"
            mode="aspectFill"
            :lazy-load="true"
            @error="onImageError"
          />
          <view class="item-info">
            <text class="item-title">{{ (item.productSpu && item.productSpu.productName) || '商品' }}</text>
            <text class="item-sku" v-if="item.skuText">{{ item.skuText }}</text>
            <view class="item-bottom">
              <text class="price">￥{{ formatPrice(getUnitPrice(item)) }}</text>
              <text class="qty">x{{ item.quantity }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部结算栏（虚拟微信支付） -->
    <view class="footer">
      <view class="summary">
        <text class="label">合计：</text>
        <text class="amount">￥{{ totalAmount }}</text>
      </view>
      <view class="footer-buttons">
        <button
          class="link-order-btn"
          @click="openOrderListModal"
        >
          关联设计师订单
        </button>
      <button
        class="pay-btn"
        :disabled="!canPay || loading"
        @click="handleVirtualPay"
      >
        使用微信支付（模拟）
      </button>
      </view>
    </view>

    <!-- 订单列表弹窗 -->
    <view v-if="showOrderListModal" class="order-modal" @touchmove.stop.prevent>
      <view class="modal-mask" @click="showOrderListModal = false"></view>
      <view class="modal-content" @touchmove.stop.prevent>
        <view class="modal-header">
          <text class="modal-title">选择设计师订单</text>
          <text class="modal-close" @click="showOrderListModal = false">×</text>
        </view>
        <scroll-view scroll-y class="order-list" v-if="!orderListLoading">
          <view v-if="orderList.length === 0" class="empty-orders">
            <text>暂无订单</text>
          </view>
          <view
            v-for="order in orderList"
            :key="order.orderId"
            class="order-item"
            @click="selectOrder(order)"
          >
            <view class="order-header">
              <text class="order-id">订单号：{{ order.orderNumber || order.orderId || order.order_id }}</text>
              <view class="order-status-group">
                <text class="order-status" :style="{ color: getOrderStatusColor(order.status) }">
                  {{ getOrderStatusText(order.status) }}
                </text>
                <text class="order-type" v-if="!order.contractorId && !order.contractor_id">
                  待分配设计师
                </text>
              </view>
            </view>
            <!-- 设计师订单可能没有orderItems，显示订单基本信息 -->
            <view class="order-items" v-if="order.orderItems && order.orderItems.length > 0">
              <view
                v-for="(item, index) in order.orderItems"
                :key="index"
                class="order-item-row"
              >
                <image
                  class="order-item-image"
                  :src="getOrderItemImage(item)"
                  mode="aspectFill"
                />
                <view class="order-item-info">
                  <text class="order-item-name">{{ item.productName || '商品' }}</text>
                  <text class="order-item-sku" v-if="item.skuDetail">{{ formatSkuDetail(item.skuDetail) }}</text>
                  <view class="order-item-bottom">
                    <text class="order-item-price">￥{{ formatPrice(item.salePrice || item.price || 0) }}</text>
                    <text class="order-item-qty">x{{ item.quantity }}</text>
                  </view>
                </view>
              </view>
            </view>
            <view class="order-info" v-else>
              <text class="order-info-text">设计师订单</text>
              <text class="order-info-detail" v-if="order.projectId || order.project_id">项目ID: {{ order.projectId || order.project_id }}</text>
            </view>
            <view class="order-footer">
              <text class="order-total" v-if="order.orderItems && order.orderItems.length > 0">
                共 {{ (order.orderItems && order.orderItems.length) || 0 }} 件商品，合计：￥{{ formatPrice(order.totalAmount || order.totalPrice || order.total_amount || 0) }}
              </text>
              <text class="order-total" v-else>
                订单金额：￥{{ formatPrice(order.totalAmount || order.totalPrice || order.total_amount || 0) }}
              </text>
            </view>
          </view>
        </scroll-view>
        <view v-if="orderListLoading" class="order-loading">
          <text>加载中...</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import * as cartApi from '@/api/cart.js'
import * as orderApi from '@/api/product-order.js'
import { orderApi as designOrderApi } from '@/api/order.js'
import * as productApi from '@/api/product.js'
import { getDefaultAddress, getAddressList } from '@/api/address.js'

export default {
  name: 'CheckoutPage',
  data() {
    return {
      loading: false,
      address: null,
      cartItems: [],
      shopGroups: [],
      addressList: [],
      // 直接购买模式参数
      directBuy: false,
      directBuySpuId: null,
      directBuySkuId: null,
      directBuyQuantity: 1,
      // 订单列表相关
      showOrderListModal: false,
      orderList: [],
      orderListLoading: false,
      // 关联的设计师订单ID
      linkedDesignerOrderId: null
    }
  },
  computed: {
    canPay() {
      return !!this.address && this.cartItems.length > 0
    },
    totalAmount() {
      const sum = this.cartItems.reduce((acc, item) => {
        const unit = this.getUnitPrice(item)
        const qty = Number(item.quantity) || 0
        return acc + unit * qty
      }, 0)
      return this.formatPrice(sum)
    }
  },
  async onLoad(options) {
    // 检查是否是直接购买模式
    if (options && options.directBuy === '1') {
      this.directBuy = true
      this.directBuySpuId = options.spuId || null
      this.directBuySkuId = options.skuId || null
      this.directBuyQuantity = Number(options.quantity) || 1
    }
    await this.initData()
  },
  onShow() {
    // 从地址管理页返回时，重新加载默认地址，保证"设为默认"的结果能立刻体现在结算页
    this.loadAddress()
    // 如果订单列表弹窗打开，重新加载订单列表
    if (this.showOrderListModal) {
      this.loadOrderList()
    }
    // 从本地存储读取关联的设计师订单ID
    const linkedOrderId = uni.getStorageSync('linkedDesignerOrderId')
    if (linkedOrderId) {
      this.linkedDesignerOrderId = linkedOrderId
    }
  },
  methods: {
    async initData() {
      this.loading = true
      try {
        await Promise.all([
          this.loadAddress(),
          this.directBuy ? this.loadDirectBuyItem() : this.loadSelectedItems()
        ])
      } catch (e) {
        console.error('初始化结算页失败:', e)
        uni.showToast({ title: e.message || '加载失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    
    // 打开订单列表弹窗
    async openOrderListModal() {
      this.showOrderListModal = true
      await this.loadOrderList()
    },
    async loadAddress() {
      try {
        const res = await getDefaultAddress()
        if (res && res.code === 200 && res.data) {
          this.address = res.data
        } else {
          this.address = null
        }
        // 顺便加载地址列表方便后续扩展（比如在本页弹出地址选择）
        const listRes = await getAddressList()
        if (listRes && listRes.code === 200 && Array.isArray(listRes.data)) {
          this.addressList = listRes.data
        }
      } catch (e) {
        console.warn('加载地址失败:', e)
        this.address = null
      }
    },
    async loadSelectedItems() {
      const res = await cartApi.getSelectedItems()
      const items = res && res.code === 200 && Array.isArray(res.data) ? res.data : []
      if (!items.length) {
        uni.showToast({ title: '没有选中的商品', icon: 'none' })
      }
      this.cartItems = items
      this.shopGroups = this.groupByShop(items)
    },
    
    // 加载直接购买的商品
    async loadDirectBuyItem() {
      if (!this.directBuySpuId) {
        uni.showToast({ title: '缺少商品信息', icon: 'none' })
        return
      }
      
      try {
        // 并行加载商品SPU详情和SKU列表
        const [spuRes, skuRes] = await Promise.all([
          productApi.getProductSpuDetail(this.directBuySpuId),
          productApi.getProductSkusBySpuId(this.directBuySpuId).catch(() => ({ code: 200, data: [] }))
        ])
        
        if (!spuRes || spuRes.code !== 200 || !spuRes.data) {
          throw new Error('获取商品信息失败')
        }
        
        const spu = spuRes.data
        let sku = null
        
        // 如果有SKU ID，从SKU列表中查找对应的SKU
        if (this.directBuySkuId && skuRes && skuRes.code === 200) {
          const skuList = Array.isArray(skuRes.data) ? skuRes.data : []
          sku = skuList.find(s => {
            const skuId = s.productSkuId || s.skuId || s.id
            return String(skuId) === String(this.directBuySkuId)
          }) || null
        }
        
        // 构建订单项格式（模拟购物车项格式）
        const orderItem = {
          cartId: `direct_${Date.now()}`, // 临时ID
          productSpu: spu,
          productSku: sku,
          quantity: this.directBuyQuantity,
          unitPrice: sku ? (sku.salePrice || sku.price) : (spu.marketPrice || spu.price),
          skuText: sku ? this.formatSkuText(sku) : null,
          imageUrl: sku?.imageUrl || spu.mainImageUrl || spu.coverImage || spu.imageList?.[0]
        }
        
        this.cartItems = [orderItem]
        this.shopGroups = this.groupByShop([orderItem])
      } catch (error) {
        console.error('加载直接购买商品失败:', error)
        uni.showToast({ 
          title: error.message || '加载商品信息失败', 
          icon: 'none' 
        })
        // 失败后返回上一页
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      }
    },
    
    // 格式化SKU文本
    formatSkuText(sku) {
      if (!sku) return null
      const detail = sku.skuDetail || sku.detail
      if (detail) {
        try {
          const parsed = typeof detail === 'string' ? JSON.parse(detail) : detail
          if (parsed?.combination?.length) {
            return parsed.combination
              .map(item => `${item.name || item.attrName || ''}${item.value ? ':' : ''}${item.value || item.attrValue || ''}`.trim())
              .filter(Boolean)
              .join(' / ')
          }
          if (parsed?.description) return parsed.description
        } catch (error) {
          // ignore parse error
        }
      }
      return sku.skuName || sku.name || null
    },
    groupByShop(items) {
      const map = new Map()
      items.forEach(item => {
        const spu = item.productSpu || {}
        const shopKey = spu.createdBy || 'default'
        const shopName = spu.shopName || '店铺'
        if (!map.has(shopKey)) {
          map.set(shopKey, { shopKey, shopName, items: [] })
        }
        map.get(shopKey).items.push(item)
      })
      return Array.from(map.values())
    },
    getUnitPrice(item) {
      if (item.productSku && item.productSku.salePrice != null) {
        return Number(item.productSku.salePrice)
      }
      if (item.productSpu && item.productSpu.marketPrice != null) {
        return Number(item.productSpu.marketPrice)
      }
      if (item.unitPrice != null) {
        return Number(item.unitPrice)
      }
      return 0
    },
    formatPrice(value) {
      const num = Number(value)
      if (Number.isNaN(num)) return '0.00'
      return num.toFixed(2)
    },
    // 获取商品图片，按优先级回退
    getItemImage(item) {
      if (!item) return this.getDefaultProductImage()

      // 1) 购物车项自身的图片字段
      if (item.imageUrl) return item.imageUrl
      if (item.productImage) return item.productImage
      if (item.coverImage) return item.coverImage

      // 2) SKU 图片
      const sku = item.productSku || {}
      if (sku.imageUrl) return sku.imageUrl
      if (sku.coverImage) return sku.coverImage

      // 3) SPU 图片
      const spu = item.productSpu || {}
      if (spu.imageUrl) return spu.imageUrl
      if (spu.coverImage) return spu.coverImage
      if (spu.productImage) return spu.productImage
      if (spu.imageList && Array.isArray(spu.imageList) && spu.imageList.length) {
        const first = spu.imageList[0]
        return first.fileUrl || first.url || first
      }

      // 4) 默认占位
      return this.getDefaultProductImage()
    },
    // 默认商品占位图（SVG Base64）
    getDefaultProductImage() {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2YyZjNmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5Zu+54mH5Yqg6L29PC90ZXh0Pjwvc3ZnPg=='
    },
    // 图片加载失败兜底
    onImageError(e) {
      if (e?.target) {
        e.target.src = this.getDefaultProductImage()
      }
    },
    goAddressPage() {
      uni.navigateTo({
        url: '/pages/mine/address?from=checkout'
      })
    },
    
    // 获取当前用户ID
    async getCurrentUserId() {
      try {
        // 尝试从本地存储获取用户信息
        const userInfo = uni.getStorageSync('userInfo') || uni.getStorageSync('user')
        if (userInfo && userInfo.userId) {
          return userInfo.userId
        }
        if (userInfo && userInfo.id) {
          return userInfo.id
        }
        
        // 如果本地存储没有，尝试从token中解析（如果有）
        // 或者调用API获取当前用户信息
        const token = uni.getStorageSync('token')
        if (token) {
          // 这里可以调用获取用户信息的API
          // const userRes = await usersApi.getCurrentUser()
          // return userRes?.data?.userId || userRes?.data?.id
        }
        
        return null
      } catch (error) {
        console.error('获取当前用户ID失败:', error)
        return null
      }
    },
    
    // 加载设计师订单列表（只显示已完成的设计师订单，status=2）
    async loadOrderList() {
      this.orderListLoading = true
      try {
        // 获取当前用户ID
        const currentUserId = await this.getCurrentUserId()
        if (!currentUserId) {
          uni.showToast({ title: '请先登录', icon: 'none' })
          this.orderList = []
          this.orderListLoading = false
          return
        }
        
        console.log('📋 加载设计师订单列表，当前用户ID:', currentUserId)
        
        // 查询type=1的设计师订单（通过user_id与当前用户ID关联）
        // type=1是设计师订单，type=2是监理订单
        const res = await designOrderApi.getList({
          type: 1,   // type=1是设计师订单
          userId: currentUserId, // 通过user_id与当前用户ID关联
          status: 2, // status=2是已完成
          pageNum: 1,
          pageSize: 100  // 获取足够多的订单
        })
        
        if (res && res.code === 200) {
          // 处理响应数据
          let orders = []
          if (Array.isArray(res.data)) {
            orders = res.data
          } else if (res.data && Array.isArray(res.data.rows)) {
            orders = res.data.rows
          } else if (res.data && Array.isArray(res.data.list)) {
            orders = res.data.list
          } else if (res.data && Array.isArray(res.data.records)) {
            orders = res.data.records
          }
          
          // 再次过滤确保：
          // 1. type = 1（设计师订单）
          // 2. user_id = 当前用户ID
          // 3. status = 2（已完成）
          this.orderList = orders.filter(order => {
            const orderType = order.type || order.orderType
            const orderUserId = order.userId || order.user_id
            const status = order.status || order.orderStatus
            
            // 确保是设计师订单（type=1）
            const isDesignOrder = orderType === 1 || orderType === '1'
            // 确保是当前用户的订单
            const isCurrentUserOrder = String(orderUserId) === String(currentUserId)
            // 确保是已完成的订单（status = 2）
            const isCompleted = status === 2 || status === '2' || status === 'COMPLETED'
            
            return isDesignOrder && isCurrentUserOrder && isCompleted
          })
          
          // 按创建时间倒序排列
          this.orderList.sort((a, b) => {
            const timeA = new Date(a.createTime || a.create_time || 0).getTime()
            const timeB = new Date(b.createTime || b.create_time || 0).getTime()
            return timeB - timeA
          })
          
          console.log('✅ 找到符合条件的设计师订单:', this.orderList.length, '个')
          
          if (this.orderList.length === 0) {
            uni.showToast({ title: '暂无已完成的设计师订单', icon: 'none' })
          }
        } else {
          this.orderList = []
          if (res && res.msg) {
            uni.showToast({ title: res.msg || '加载订单失败', icon: 'none' })
          }
        }
      } catch (error) {
        console.error('❌ 加载设计师订单列表失败:', error)
        uni.showToast({ title: error.message || '加载订单失败', icon: 'none' })
        this.orderList = []
      } finally {
        this.orderListLoading = false
      }
    },
    
    // 选择订单，将订单关联到当前结算
    selectOrder(order) {
      if (!order) {
        uni.showToast({ title: '订单信息无效', icon: 'none' })
        return
      }
      
      // 设计师订单可能没有orderItems，需要关联订单ID
      // 将订单ID保存到本地，用于后续创建材料订单时关联
      try {
        // 保存关联的订单ID到本地存储和data中
        const linkedOrderId = order.orderId || order.order_id
        this.linkedDesignerOrderId = linkedOrderId
        uni.setStorageSync('linkedDesignerOrderId', linkedOrderId)
        
        // 如果订单有orderItems，添加到结算列表
        if (order.orderItems && order.orderItems.length > 0) {
          const newItems = order.orderItems.map(item => {
            return {
              cartId: `order_${linkedOrderId}_${item.orderItemId || Date.now()}`,
              productSpu: {
                productSpuId: item.productSpuId || item.spuId,
                productName: item.productName,
                marketPrice: item.salePrice || item.price,
                shopName: order.shopName || '店铺',
                createdBy: order.shopId || order.sellerId
              },
              productSku: item.productSkuId ? {
                productSkuId: item.productSkuId,
                salePrice: item.salePrice || item.price,
                skuDetail: item.skuDetail
              } : null,
              quantity: item.quantity,
              unitPrice: item.salePrice || item.price,
              skuText: item.skuDetail ? this.formatSkuDetail(item.skuDetail) : null,
              imageUrl: item.imageUrl || item.productImage
            }
          })
          
          // 合并到现有购物车项
          this.cartItems = [...this.cartItems, ...newItems]
          this.shopGroups = this.groupByShop(this.cartItems)
          
          uni.showToast({
            title: `已关联订单并添加 ${newItems.length} 件商品`,
            icon: 'success'
          })
        } else {
          // 没有商品项，只关联订单
          uni.showToast({
            title: `已关联设计师订单 #${linkedOrderId}`,
            icon: 'success'
          })
        }
        
        // 关闭弹窗
        this.showOrderListModal = false
      } catch (error) {
        console.error('关联订单失败:', error)
        uni.showToast({ title: '关联订单失败', icon: 'none' })
      }
    },
    
    // 获取订单项图片
    getOrderItemImage(item) {
      if (item.imageUrl) return item.imageUrl
      if (item.productImage) return item.productImage
      if (item.coverImage) return item.coverImage
      return this.getDefaultProductImage()
    },
    
    // 格式化SKU详情
    formatSkuDetail(skuDetail) {
      if (!skuDetail) return null
      try {
        const parsed = typeof skuDetail === 'string' ? JSON.parse(skuDetail) : skuDetail
        if (parsed?.combination?.length) {
          return parsed.combination
            .map(item => `${item.name || item.attrName || ''}${item.value ? ':' : ''}${item.value || item.attrValue || ''}`.trim())
            .filter(Boolean)
            .join(' / ')
        }
        if (parsed?.description) return parsed.description
        return skuDetail
      } catch (error) {
        return skuDetail
      }
    },
    
    // 获取订单状态文本（根据order表的状态定义：0-待确认,1-进行中,2-已完成,3-已取消）
    getOrderStatusText(status) {
      const statusMap = {
        0: '待确认',
        1: '进行中',
        2: '已完成',
        3: '已取消',
        'PENDING': '待确认',
        'PROCESSING': '进行中',
        'COMPLETED': '已完成',
        'CANCELLED': '已取消'
      }
      return statusMap[status] || '未知状态'
    },
    
    // 获取订单状态颜色（根据order表的状态定义）
    getOrderStatusColor(status) {
      const colorMap = {
        0: '#fa541c',      // 待确认 - 橙色
        1: '#1890ff',      // 进行中 - 蓝色
        2: '#13c2c2',      // 已完成 - 青色
        3: '#999',         // 已取消 - 灰色
        'PENDING': '#fa541c',
        'PROCESSING': '#1890ff',
        'COMPLETED': '#13c2c2',
        'CANCELLED': '#999'
      }
      return colorMap[status] || '#666'
    },
    async handleVirtualPay() {
      if (!this.address) {
        uni.showModal({
          title: '提示',
          content: '请先设置收货地址',
          confirmText: '去设置',
          success: res => {
            if (res.confirm) {
              this.goAddressPage()
            }
          }
        })
        return
      }
      if (!this.cartItems.length) {
        uni.showToast({ title: '没有可结算的商品', icon: 'none' })
        return
      }

      try {
        this.loading = true
        uni.showLoading({ title: '提交订单中...' })
        
        let orders = []
        
        // 直接购买模式：使用 createOrderDirect
        if (this.directBuy) {
          // 构建订单数据，包含关联的设计师订单ID（作为projectId传递）
          const orderData = {
            spuId: this.directBuySpuId,
            skuId: this.directBuySkuId,
            quantity: this.directBuyQuantity,
            addressId: this.address.addressId
          }
          
          // 如果有关联的设计师订单，添加到订单数据中
          if (this.linkedDesignerOrderId) {
            orderData.projectId = this.linkedDesignerOrderId
            console.log('📦 创建材料订单，关联设计师订单ID:', this.linkedDesignerOrderId)
          }
          
          const orderRes = await orderApi.createOrderDirect(
            orderData.spuId,
            orderData.skuId,
            orderData.quantity,
            orderData.addressId,
            orderData.projectId  // 传递关联的设计师订单ID
          )
          if (!orderRes || orderRes.code !== 200) {
            uni.hideLoading()
            uni.showToast({ title: (orderRes && orderRes.msg) || '创建订单失败', icon: 'none' })
            return
          }
          // createOrderDirect 返回单个订单对象，包装成数组
          orders = orderRes.data ? [orderRes.data] : []
        } else {
          // 购物车模式：使用 createOrdersFromCart
          const cartIds = this.cartItems.map(i => i.cartId)
          // 如果有关联的设计师订单，传递 projectId
          const projectId = this.linkedDesignerOrderId || null
          if (projectId) {
            console.log('📦 创建材料订单（购物车模式），关联设计师订单ID:', projectId)
          }
          const orderRes = await orderApi.createOrdersFromCart(cartIds, this.address.addressId, projectId)
          if (!orderRes || orderRes.code !== 200 || !Array.isArray(orderRes.data)) {
            uni.hideLoading()
            uni.showToast({ title: (orderRes && orderRes.msg) || '创建订单失败', icon: 'none' })
            return
          }
          orders = orderRes.data
        }

        // 2. 模拟微信支付：依次调用支付接口，将订单状态改为已支付
        for (const order of orders) {
          if (order && order.orderId) {
            try {
              await orderApi.payOrder(order.orderId)
            } catch (e) {
              console.warn('虚拟支付某个订单失败:', order.orderId, e)
            }
          }
        }

        uni.hideLoading()
        uni.showToast({ title: '支付成功（模拟）', icon: 'success' })

        // 3. 通知商品库存可能已变更，让相关页面刷新商品数据
        try {
          const spuIdSet = new Set()
          this.cartItems.forEach(item => {
            const spu = item.productSpu || {}
            const rawId = spu.productSpuId != null
              ? spu.productSpuId
              : (spu.spuId != null ? spu.spuId : spu.id)
            if (rawId != null) {
              const idNum = Number(rawId)
              if (!Number.isNaN(idNum)) {
                spuIdSet.add(idNum)
              }
            }
          })
          const spuIds = Array.from(spuIdSet)
          uni.$emit('productStockUpdated', { spuIds })
        } catch (e) {
          console.warn('触发库存更新事件失败:', e)
        }

        // 4. 跳转到“我的订单”页面查看
        setTimeout(() => {
          uni.navigateTo({
            url: '/pages/mine/viewOrder/viewOrder'
          })
        }, 800)
      } catch (e) {
        uni.hideLoading()
        console.error('虚拟支付失败:', e)
        uni.showToast({ title: e.message || '支付失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.checkout-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f9;
}

.address-card {
  margin: 24rpx;
  padding: 24rpx;
  background-color: #fff;
  border-radius: 20rpx;
  position: relative;
}

.address-content {
  padding-right: 40rpx;
}

.address-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.name {
  font-size: 32rpx;
  font-weight: 600;
  color: #303133;
}

.phone {
  font-size: 28rpx;
  color: #606266;
}

.detail {
  font-size: 26rpx;
  color: #909399;
}

.address-empty {
  padding-right: 40rpx;
}

.address-empty .hint {
  font-size: 30rpx;
  color: #303133;
}

.address-empty .sub-hint {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #909399;
}

.right-icon {
  position: absolute;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
  color: #c0c4cc;
  font-size: 28rpx;
}

.content {
  flex: 1;
  padding: 0 24rpx 24rpx;
}

.shop-section {
  margin-bottom: 24rpx;
  background-color: #fff;
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
}

.shop-header {
  padding-bottom: 12rpx;
  border-bottom: 1px solid #f2f2f2;
  margin-bottom: 12rpx;
}

.shop-name {
  font-size: 28rpx;
  color: #303133;
  font-weight: 500;
}

.item-row {
  display: flex;
  padding: 16rpx 0;
}

.item-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  background-color: #f2f3f5;
  background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2YyZjNmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5Zu+54mH5Yqg6L29PC90ZXh0Pjwvc3ZnPg==');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  margin-right: 16rpx;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-title {
  font-size: 28rpx;
  color: #303133;
}

.item-sku {
  margin-top: 4rpx;
  font-size: 24rpx;
  color: #909399;
}

.item-bottom {
  margin-top: 8rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  font-size: 30rpx;
  color: #fa541c;
  font-weight: 600;
}

.qty {
  font-size: 26rpx;
  color: #606266;
}

.footer {
  padding: 16rpx 24rpx;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.footer-buttons {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.summary {
  display: flex;
  align-items: baseline;
}

.label {
  font-size: 26rpx;
  color: #606266;
}

.amount {
  font-size: 34rpx;
  color: #fa541c;
  font-weight: 600;
  margin-left: 4rpx;
}

.link-order-btn {
  background: #fff;
  color: #fa541c;
  font-size: 26rpx;
  padding: 18rpx 32rpx;
  border-radius: 999rpx;
  border: 1px solid #fa541c;
}

.pay-btn {
  background: linear-gradient(135deg, #07c160, #06ae56);
  color: #fff;
  font-size: 30rpx;
  padding: 18rpx 48rpx;
  border-radius: 999rpx;
  flex: 1;
}

/* 订单列表弹窗样式 */
.order-modal {
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
  border-radius: 32rpx 32rpx 0 0;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #303133;
}

.modal-close {
  font-size: 48rpx;
  color: #909399;
  line-height: 1;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.order-list {
  flex: 1;
  padding: 24rpx;
  overflow-y: auto;
}

.empty-orders {
  text-align: center;
  padding: 80rpx 0;
  color: #909399;
  font-size: 28rpx;
}

.order-item {
  background: #f8f9fa;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
  padding-bottom: 16rpx;
  border-bottom: 1px solid #e5e5e5;
}

.order-id {
  font-size: 26rpx;
  color: #606266;
}

.order-status-group {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4rpx;
}

.order-status {
  font-size: 24rpx;
  font-weight: 500;
}

.order-type {
  font-size: 20rpx;
  color: #fa541c;
  background: #fff2e8;
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
}

.order-info {
  padding: 24rpx 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.order-info-text {
  font-size: 28rpx;
  color: #303133;
  font-weight: 500;
}

.order-info-detail {
  font-size: 24rpx;
  color: #909399;
}

.order-items {
  margin-bottom: 16rpx;
}

.order-item-row {
  display: flex;
  margin-bottom: 16rpx;
}

.order-item-row:last-child {
  margin-bottom: 0;
}

.order-item-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  background: #f2f3f5;
  margin-right: 16rpx;
}

.order-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.order-item-name {
  font-size: 28rpx;
  color: #303133;
  margin-bottom: 8rpx;
}

.order-item-sku {
  font-size: 24rpx;
  color: #909399;
  margin-bottom: 8rpx;
}

.order-item-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.order-item-price {
  font-size: 28rpx;
  color: #fa541c;
  font-weight: 600;
}

.order-item-qty {
  font-size: 24rpx;
  color: #606266;
}

.order-footer {
  padding-top: 16rpx;
  border-top: 1px solid #e5e5e5;
}

.order-total {
  font-size: 28rpx;
  color: #303133;
  font-weight: 500;
  text-align: right;
}

.order-loading {
  padding: 80rpx 0;
  text-align: center;
  color: #909399;
  font-size: 28rpx;
}
</style>


