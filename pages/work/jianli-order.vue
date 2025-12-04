<template>
  <view class="container">
    <!-- 顶部标题栏 -->
    <view class="header-section">
      <!-- 添加返回按钮 -->
      <view class="back-btn" @click="goBack">
        <text class="back-icon">←</text>
        <text class="back-text">返回</text>
      </view>
      <view class="header-title">我的订单</view>
      <view class="header-actions">
        <view class="action-item" @click="goToMessage">
          <text class="action-icon">💬</text>
        </view>
      </view>
    </view>
    
    <!-- 订单状态筛选 -->
    <view class="status-filter">
      <scroll-view class="filter-scroll" scroll-x="true">
        <view class="filter-list">
          <view class="filter-item" 
            :class="{ active: activeStatus === '' }" 
            @click="changeStatus('')">
            <text>全部</text>
          </view>
          <view class="filter-item" 
            :class="{ active: activeStatus === '0' }" 
            @click="changeStatus('0')">
            <text>待确认</text>
            <text v-if="statusCount['0'] > 0" class="count-badge">{{ statusCount['0'] }}</text>
          </view>
          <view class="filter-item" 
            :class="{ active: activeStatus === '1' }" 
            @click="changeStatus('1')">
            <text>进行中</text>
            <text v-if="statusCount['1'] > 0" class="count-badge">{{ statusCount['1'] }}</text>
          </view>
          <view class="filter-item" 
            :class="{ active: activeStatus === '2' }" 
            @click="changeStatus('2')">
            <text>已完成</text>
          </view>
          <view class="filter-item" 
            :class="{ active: activeStatus === '3' }" 
            @click="changeStatus('3')">
            <text>已取消</text>
          </view>
        </view>
      </scroll-view>
    </view>
    
    <!-- 订单列表 -->
    <scroll-view class="order-list" scroll-y="true" @scrolltolower="loadMore" refresher-enabled @refresherrefresh="onRefresh">
      <!-- 下拉刷新 -->
      <view class="refresh-container" v-if="refreshing">
        <text class="refresh-text">刷新中...</text>
      </view>
      
      <!-- 空状态 -->
      <view v-if="!loading && filteredOrders.length === 0" class="empty-state">
        <view class="empty-icon">🎨</view>
        <view class="empty-text">暂无订单</view>
        <view class="empty-desc">您还没有接到的订单</view>
      </view>
      
      <!-- 加载状态 -->
      <view v-if="loading && filteredOrders.length === 0" class="loading-state">
        <text class="loading-text">加载中...</text>
      </view>
      
      <!-- 订单项 -->
      <view class="order-item" v-for="order in filteredOrders" :key="order.orderId">
        <view class="order-header">
          <view class="order-info">
            <text class="order-number">订单号：DD{{ order.orderId }}</text>
            <text class="order-time">{{ formatTime(order.createTime) }}</text>
          </view>
          <!-- 修复：使用映射表而不是函数调用 -->
          <view class="order-status" :class="statusClassMap[order.status]">
            {{ statusTextMap[order.status] || '未知状态' }}
          </view>
        </view>
        
        <view class="order-content" @click="viewOrderDetail(order.orderId)">
          <view class="project-info">
            <view class="project-title">{{ order.projectInfo ? order.projectInfo.title : '设计项目' }}</view>
            <view class="project-desc">{{ order.projectInfo ? order.projectInfo.description : (order.remark || '暂无描述') }}</view>
            <view class="project-tags">
              <text class="tag" v-if="order.projectInfo && order.projectInfo.budget">预算 {{ order.projectInfo.budget }}元</text>
              <text class="tag" v-if="order.expectedEndTime">预计 {{ formatDate(order.expectedEndTime) }}完成</text>
              <text class="tag">{{ orderTypeTextMap[order.type] || '未知类型' }}</text>
              <text class="tag" v-if="order.projectInfo && order.projectInfo.area">{{ order.projectInfo.area }}㎡</text>
              <text class="tag" v-if="order.projectInfo && order.projectInfo.address">{{ order.projectInfo.address }}</text>
            </view>
          </view>
          
          <!-- 显示发布人（客户）信息 -->
          <view class="designer-info" v-if="order.userId && order.publisherInfo && order.publisherInfo.name">
            <view class="designer-avatar">
              <image :src="order.publisherInfo.avatar" mode="aspectFill" />
            </view>
            <view class="designer-details">
              <text class="designer-name">{{ order.publisherInfo.name }}</text>
              <text class="designer-role">客户</text>
              <text class="designer-phone">电话: {{ order.publisherInfo.phone }}</text>
            </view>
            <view class="contact-btn" @click.stop="contactOrderParty(order)">
              联系
            </view>
          </view>
          
          <!-- 未获取客户信息 -->
          <view class="no-designer" v-else-if="order.userId && order.publisherInfo">
            <text class="no-designer-text">{{ order.publisherInfo.name || '' }}</text>
          </view>
          
          <!-- 完全未获取客户信息 -->
          <view class="no-designer" v-else>
            <text class="no-designer-text">暂未获取客户信息</text>
          </view>
        </view>
        
        <view class="order-footer">
          <view class="order-amount">
            <text class="amount-label">订单金额：</text>
            <text class="amount-value">¥{{ order.totalAmount || 0 }}</text>
          </view>
          <view class="order-actions">
            <!-- 状态0：待确认 -->
            <template v-if="order.status === 0">
              <button class="btn secondary" @click="cancelOrder(order.orderId)">
                取消订单
              </button>
            </template>
            
            <!-- 状态1：进行中 -->
            <template v-else-if="order.status === 1">
              <!-- 合同状态0：待上传 -->
              <template v-if="order.contractStatus === 0">
                <button class="btn secondary" @click="cancelOrder(order.orderId)">
                  取消订单
                </button>
                <button class="btn primary" @click="uploadContract(order.orderId)">
                  上传合同
                </button>
              </template>
              
              <!-- 合同状态1：合同待确认 -->
              <template v-else-if="order.contractStatus === 1">
                <button class="btn secondary" @click="viewContract(order)">
                  查看合同
                </button>
                <button class="btn secondary" @click="cancelOrder(order.orderId)">
                  取消订单
                </button>
                <button class="btn primary" @click="uploadContract(order.orderId, true)">
                  修改合同
                </button>
              </template>
              
              <!-- 合同状态2：合同已确认 - 显示施工进程按钮 -->
              <template v-else-if="order.contractStatus === 2">
                <!-- 监理订单：显示施工阶段按钮 -->
                <template>
                  <!-- 没有施工阶段：上传施工阶段 -->
                  <button v-if="!order.hasStages" 
                      class="btn primary" 
                      @click="uploadConstructionStage(order.orderId)">
                    上传施工阶段
                  </button>
                  
                  <!-- 有施工阶段且状态为0：修改施工阶段 -->
                  <button v-else-if="order.hasStages && order.stageStatus === 0" 
                      class="btn primary" 
                      @click="modifyConstructionStage(order.orderId)">
                    修改施工阶段
                  </button>
                  
                  <!-- 情况6：有施工阶段且不是所有阶段都待验收或已完成 -->
                  <button v-else-if="order.hasStages && !(order.allStagesCompleted && (order.allStagesStatus === 3 || order.allStagesStatus === 4))" 
                      class="btn primary" 
                      @click="viewConstructionStage(order.orderId)">
                    施工阶段
                  </button>
                  
                  <!-- 所有阶段status=3：待验收 -->
                  <button v-else-if="order.allStagesCompleted && order.allStagesStatus === 3" 
                      class="btn primary waiting-inspection"
                      @click="viewConstructionStage(order.orderId)">
                    待验收
                  </button>
                  
                  <!-- 所有阶段status=4且订单status=1：待付款 -->
                  <button v-else-if="order.allStagesCompleted && order.allStagesStatus === 4 && order.status === 1" 
                      class="btn primary waiting-payment"
                      @click="handleWaitingPayment(order)">
                    待付款
                  </button>
                  
                  
                </template>
              </template>
            </template>
            
            <!-- 状态2：已完成 -->
            <template v-else-if="order.status === 2">
              <button class="btn primary" @click="goToFinishedOrderDetail(order)">
                订单详情
              </button>
            </template>
          </view>
        </view>
      </view>
      
      <!-- 加载更多 -->
      <view v-if="loading && filteredOrders.length > 0" class="load-more">
        <text class="load-more-text">加载中...</text>
      </view>
      <view v-if="hasMore && filteredOrders.length > 0" class="load-more">
        <text class="load-more-text">上拉加载更多</text>
      </view>
      <view v-if="!hasMore && filteredOrders.length > 0" class="load-more">
        <text class="load-more-text">没有更多数据了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
  import { orderService } from '@/api/order.js'
  import { projectService } from '@/api/project.js'
  import { getUserProfile, getCurrentRole, getUserById } from '@/api/users.js'
  // 新增：导入施工阶段API
  import { orderStageService } from '@/api/orderStage.js'
  // 新增：导入对话辅助工具
  import { createConversationAndNavigate, isUserLoggedIn, handleNotLoggedIn } from "@/utils/conversationHelper.js"
  
  export default {
    data() {
      return {
        // 订单状态筛选
        activeStatus: '',
        loading: false,
        refreshing: false,
        hasMore: true,
        
        // 用户信息
        userInfo: {
          userId: null,
          phone: '',
          name: '',
          avatar: '',
          address: '',
          role: '', // 用户角色：customer/designer/supervisor
          roleName: '' // 角色名称
        },
        
        // 分页参数
        pagination: {
          pageNum: 1,
          pageSize: 10,
          total: 0
        },
        
        // 订单列表数据
        orderList: [],
        
        // 订单状态数量统计
        statusCount: {
          '0': 0,
          '1': 0,
          '2': 0,
          '3': 0
        },
        
        // 修复：添加状态类映射表
        statusClassMap: {
          0: 'status-pending',
          1: 'status-progress',
          2: 'status-completed',
          3: 'status-canceled'
        },
        
        // 新增：状态文本映射表
        statusTextMap: {
          0: '待确认',
          1: '进行中',
          2: '已完成',
          3: '已取消'
        },
        
        // 新增：订单类型文本映射表
        orderTypeTextMap: {
          '0': '设计订单',
          '1': '设计师订单',
          '2': '监理订单'
        }
      }
    },
    computed: {
      // 过滤后的订单列表 - 只显示contractorId与当前用户相同的订单
      filteredOrders() {
        // 首先过滤出contractorId与当前用户ID相同的订单
        const myOrders = this.orderList.filter(order => {
          const currentUserIdStr = String(this.userInfo.userId);
          const contractorIdStr = String(order.contractorId);
          
          console.log('🔍 订单过滤比较:', {
            orderId: order.orderId,
            currentUserId: currentUserIdStr,
            contractorId: contractorIdStr,
            是否匹配: contractorIdStr === currentUserIdStr
          });
          
          return contractorIdStr === currentUserIdStr;
        });
        
        // 然后根据状态筛选
        if (this.activeStatus === '') {
          return myOrders;
        }
        
        // 根据状态筛选订单
        return myOrders.filter(order => {
          return String(order.status) === this.activeStatus;
        });
      }
    },
    onLoad() {
      console.log('🚀 监理师订单页面加载');
      this.loadCurrentUserInfo();
    },
    onShow() {
      console.log('🔄 监理师订单页面显示，刷新数据');
      if (this.userInfo.userId) {
        this.pagination.pageNum = 1;
        this.loadOrderList();
      }
    },
    methods: {
      // 返回首页
      goBack() {
        console.log('🔙 返回首页');
        uni.switchTab({
          url: '/pages/index'
        });
      },

      // 检查订单施工阶段状态
      async checkConstructionStagesStatus(orderId) {
        try {
          console.log('🔍 检查施工阶段状态，订单ID:', orderId);
          
          const response = await orderStageService.list({ orderId: orderId });
          console.log('📋 施工阶段查询结果:', response);
          
          let stages = [];
          
          // 解析施工阶段列表
          if (response && response.code === 200) {
            if (Array.isArray(response.data)) {
              stages = response.data;
            } else if (response.data && Array.isArray(response.data.records)) {
              stages = response.data.records;
            } else if (response.data && Array.isArray(response.data.list)) {
              stages = response.data.list;
            }
          } else if (Array.isArray(response)) {
            stages = response;
          }
          
          console.log('📝 施工阶段列表:', stages);
          
          // 检查阶段状态：如果没有阶段或有阶段但都已完成
          const hasActiveStages = stages.some(stage => {
            const status = Number(stage.status) || 0;
            return status >= 1 && status <= 3; // 状态1-3为活跃状态
          });
          
          // 如果有阶段，获取第一个阶段的状态作为代表
          const firstStageStatus = stages.length > 0 ? Number(stages[0].status) : null;
          
          // 检查所有阶段的状态
          let allStagesCompleted = false;
          let allStagesStatus = null;
          
          if (stages.length > 0) {
            // 检查是否所有阶段的状态都相同
            const uniqueStatuses = [...new Set(stages.map(stage => Number(stage.status) || 0))];
            if (uniqueStatuses.length === 1) {
              allStagesCompleted = true;
              allStagesStatus = uniqueStatuses[0];
            } else {
              // 检查是否所有阶段都已完成（状态为4）
              const allCompleted = stages.every(stage => (Number(stage.status) || 0) === 4);
              if (allCompleted) {
                allStagesCompleted = true;
                allStagesStatus = 4;
              } else {
                // 检查是否所有阶段都为待验收（状态为3）
                const allWaitingInspection = stages.every(stage => (Number(stage.status) || 0) === 3);
                if (allWaitingInspection) {
                  allStagesCompleted = true;
                  allStagesStatus = 3;
                }
              }
            }
          }
          
          // 返回施工阶段状态信息
          return {
            hasStages: stages.length > 0,
            stageStatus: firstStageStatus,
            totalStages: stages.length,
            hasActiveStages: hasActiveStages,
            allStages: stages,
            allStagesCompleted: allStagesCompleted,
            allStagesStatus: allStagesStatus
          };
          
        } catch (error) {
          console.error('❌ 检查施工阶段状态失败:', error);
          return {
            hasStages: false,
            stageStatus: null,
            totalStages: 0,
            hasActiveStages: false,
            allStages: [],
            allStagesCompleted: false,
            allStagesStatus: null
          };
        }
      },

      // 上传施工阶段
      async uploadConstructionStage(orderId) {
        try {
          console.log('📤 上传施工阶段，订单ID:', orderId, '用户ID:', this.userInfo.userId);
          
          // 跳转到design-update页面
          uni.navigateTo({
            url: `/pages/order-hall/design-update?orderId=${orderId}&userId=${this.userInfo.userId}`
          });
          
        } catch (error) {
          console.error('❌ 跳转上传施工阶段页面失败:', error);
          this.handleApiError(error, '跳转失败');
        }
      },

      // 修改施工阶段
      async modifyConstructionStage(orderId) {
        try {
          console.log('✏️ 修改施工阶段，订单ID:', orderId, '用户ID:', this.userInfo.userId);
          
          // 跳转到design-gx页面（修改施工阶段）
          uni.navigateTo({
            url: `/pages/order-hall/design-gx?orderId=${orderId}&userId=${this.userInfo.userId}`
          });
          
        } catch (error) {
          console.error('❌ 跳转修改施工阶段页面失败:', error);
          this.handleApiError(error, '跳转失败');
        }
      },

      // 查看施工阶段 - 修改为跳转到designorder-work页面
      async viewConstructionStage(orderId) {
        try {
          console.log('👀 查看施工阶段，订单ID:', orderId, '用户ID:', this.userInfo.userId);
          
          // 关键修改：监理订单跳转到designorder-work页面
          uni.navigateTo({
            url: `/pages/order-hall/designorder-work?orderId=${orderId}&userId=${this.userInfo.userId}`
          });
          
        } catch (error) {
          console.error('❌ 跳转施工阶段页面失败:', error);
          this.handleApiError(error, '跳转失败');
        }
      },

      // 跳转到已完成订单详情
      goToFinishedOrderDetail(order) {
        try {
          console.log('📋 跳转到已完成订单详情，订单ID:', order.orderId, '用户ID:', this.userInfo.userId, '订单类型:', order.type);
          
          uni.navigateTo({
            url: `/pages/finishedorder-detail/finishedorder-detail?orderId=${order.orderId}&userId=${this.userInfo.userId}&orderType=${order.type}`
          });
          
        } catch (error) {
          console.error('❌ 跳转已完成订单详情失败:', error);
          this.handleApiError(error, '跳转失败');
        }
      },

      // 处理待付款订单
      handleWaitingPayment(order) {
        console.log('💰 待付款订单，订单ID:', order.orderId);
        uni.showToast({
          title: '等待客户付款',
          icon: 'none',
          duration: 2000
        });
        
        // 可以跳转到订单详情页面查看付款状态
        this.viewOrderDetail(order.orderId);
      },

      // 查看订单详情（根据订单状态跳转不同页面）
      viewOrderDetail(orderId) {
        const order = this.orderList.find(item => item.orderId === orderId);
        if (!order) {
          uni.showToast({
            title: '订单信息不存在',
            icon: 'none'
          });
          return;
        }
        
        console.log('📋 查看订单详情，订单ID:', orderId, '订单类型:', order.type, '订单状态:', order.status);
        
        // 订单状态为2（已完成）：跳转到已完成订单详情页面
        if (order.status === 2) {
          console.log('✅ 订单已完成，跳转到已完成订单详情页面');
          this.goToFinishedOrderDetail(order);
        } else {
          // 其他状态订单：跳转到设计师订单详情页面
          console.log('🎨 订单进行中，跳转到设计师订单详情页面');
          uni.navigateTo({
            url: `/pages/order-hall/order-detail?id=${orderId}`
          });
        }
      },

      // 统一的错误处理方法
      handleApiError(error, defaultMessage = '操作失败') {
        console.error('API Error:', error);
        
        let message = defaultMessage;
        if (error && error.errMsg) {
          message = error.errMsg;
        } else if (error && error.message) {
          message = error.message;
        } else if (typeof error === 'string') {
          message = error;
        }
        
        uni.showToast({
          title: message,
          icon: 'none',
          duration: 3000
        });
        
        return message;
      },

      // 加载当前用户信息 - 使用原来的 getUserProfile() 方法
      async loadCurrentUserInfo() {
        try {
          console.log('👤 开始获取当前用户信息（使用 getUserProfile）...');
          
          // 同时获取用户基本信息和角色信息
          const [userRes, roleRes] = await Promise.all([
            getUserProfile(),
            getCurrentRole()
          ]);
          
          if (userRes.code === 200) {
            this.userInfo = userRes.data;
            
            // 添加角色信息
            if (roleRes.code === 200 && roleRes.data) {
              this.userInfo.role = roleRes.data.role || roleRes.data.roleType || 'supervisor';
              this.userInfo.roleName = roleRes.data.roleName || '监理师';
            } else {
              this.userInfo.role = 'supervisor'; // 默认角色为监理师
              this.userInfo.roleName = '监理师';
            }
            
            console.log('👤 当前用户信息加载完成:', {
              userId: this.userInfo.userId,
              name: this.userInfo.name,
              role: this.userInfo.role,
              roleName: this.userInfo.roleName
            });
            
            // 确保用户信息存储到缓存
            this.ensureUserInfoInStorage();
            
            this.loadOrderList();
          } else {
            console.error('获取当前用户信息失败:', userRes.msg);
            this.handleApiError(userRes.msg, '获取用户信息失败');
          }
        } catch (error) {
          console.error('❌ 获取当前用户信息失败:', error);
          this.handleApiError(error, '获取用户信息失败');
        }
      },
      
      // 确保用户信息存储到缓存
      ensureUserInfoInStorage() {
        try {
          // 如果用户信息存在，存储到缓存
          if (this.userInfo && this.userInfo.userId) {
            // 存储完整用户信息
            uni.setStorageSync('userInfo', this.userInfo);
            
            // 单独存储用户ID（确保是字符串）
            if (this.userInfo.userId) {
              const userIdStr = String(this.userInfo.userId);
              uni.setStorageSync('userId', userIdStr);
              console.log('✅ 存储用户ID到缓存:', userIdStr);
            }
            
            // 存储到全局数据
            if (getApp().globalData) {
              getApp().globalData.userInfo = this.userInfo;
            }
            
            console.log('✅ 用户信息已更新到缓存:', {
              userId: this.userInfo.userId,
              name: this.userInfo.name
            });
            
            return true;
          }
          
          // 检查缓存是否存在
          const cachedUserInfo = uni.getStorageSync('userInfo');
          const cachedUserId = uni.getStorageSync('userId');
          
          if (!cachedUserInfo || !cachedUserId) {
            console.warn('⚠️ 缓存中用户信息不完整');
            return false;
          }
          
          return true;
          
        } catch (storageError) {
          console.error('❌ 存储用户信息失败:', storageError);
          return false;
        }
      },
      
      // 加载订单列表 - 关键修改：使用 getOrderListByContractorId 方法
      async loadOrderList() {
        if (this.loading || !this.userInfo.userId) return
        
        try {
          this.loading = true
          
          const queryParams = {
            pageNum: this.pagination.pageNum,
            pageSize: this.pagination.pageSize,
            type: '2'  // 关键修改：指定获取监理订单
          }
          
          if (this.activeStatus !== '') {
            queryParams.status = this.activeStatus
          }
          
          console.log('📋 加载监理师订单列表 - 监理师ID:', this.userInfo.userId, '查询参数:', queryParams)
          
          // 关键修改：使用 getOrderListByContractorId 方法，将当前用户ID作为 contractorId
          const result = await orderService.getOrderListByContractorId(
            this.userInfo.userId,  // contractorId 参数
            queryParams            // 其他查询参数
          )
          
          console.log('✅ 监理师订单列表响应:', result)
          
          let list = []
          let total = 0
          
          if (Array.isArray(result)) {
            list = result
            total = result.length
          } else if (result && result.records) {
            list = result.records
            total = result.total
          } else if (result && result.list) {
            list = result.list
            total = result.total
          } else if (result && result.data) {
            list = result.data.records || result.data.list || []
            total = result.data.total || 0
          }
          
          console.log('🔄 开始获取订单对应的详细信息...')
          const ordersWithDetails = []
          for (const order of list) {
            let projectInfo = {}
            let publisherInfo = {}
            
            if (order.projectId) {
              try {
                projectInfo = await this.getProjectDetail(order.projectId) || {}
              } catch (error) {
                console.error(`获取订单 ${order.orderId} 的项目详情失败:`, error)
              }
            }
            
            if (order.userId) {
              try {
                // 使用 getUserById 方法获取其他用户信息
                publisherInfo = await this.getUserInfoById(order.userId) || {}
              } catch (error) {
                console.error(`获取订单 ${order.orderId} 的发布人信息失败:`, error)
              }
            }
            
            const orderWithDetails = {
              ...order,
              projectInfo,
              publisherInfo,
              // 新增施工阶段状态字段
              hasStages: false,
              stageStatus: null,
              allStagesCompleted: false,
              allStagesStatus: null
            }
            
            // 只有合同已确认的订单才需要检查施工阶段状态
            if (order.contractStatus === 2) {
              const stagesStatus = await this.checkConstructionStagesStatus(order.orderId);
              orderWithDetails.hasStages = stagesStatus.hasStages;
              orderWithDetails.stageStatus = stagesStatus.stageStatus;
              orderWithDetails.allStagesCompleted = stagesStatus.allStagesCompleted;
              orderWithDetails.allStagesStatus = stagesStatus.allStagesStatus;
              
              console.log(`🏗️ 订单 ${order.orderId} 施工阶段状态:`, {
                是否有阶段: stagesStatus.hasStages,
                阶段状态: stagesStatus.stageStatus,
                所有阶段完成状态: stagesStatus.allStagesCompleted,
                所有阶段状态: stagesStatus.allStagesStatus,
                总阶段数: stagesStatus.totalStages,
                有活跃阶段: stagesStatus.hasActiveStages
              });
            }
            
            ordersWithDetails.push(orderWithDetails)
          }
          console.log('✅ 监理师订单数据整合完成:', ordersWithDetails)
          
          if (this.pagination.pageNum === 1) {
            this.orderList = ordersWithDetails
          } else {
            this.orderList = [...this.orderList, ...ordersWithDetails]
          }
          
          this.pagination.total = total
          this.hasMore = this.orderList.length < total
          
          this.updateStatusCount()
          
        } catch (error) {
          console.error('❌ 加载订单列表失败:', error)
          this.handleApiError(error, '加载订单列表失败')
        } finally {
          this.loading = false
          this.refreshing = false
        }
      },
      
      // 获取其他用户信息的方法 - 只能使用 getUserById(userId)
      async getUserInfoById(userId) {
        if (!userId) {
          console.warn('用户ID为空');
          return {
            name: '',
            phone: '',
            avatar: '/static/images/default-avatar.png',
            role: ''
          };
        }
        
        try {
          console.log('👤 使用 getUserById 获取用户信息，用户ID:', userId);
          
          const result = await getUserById(userId);
          console.log('✅ getUserById 原始结果:', result);
          
          // 解析API响应
          let userData = null;
          
          if (result && typeof result === 'object') {
            if (result.code === 200) {
              userData = result.data || {};
            }
            else if (!result.code && (result.name || result.phone || result.avatar)) {
              userData = result;
            }
            else if (result.data) {
              userData = result.data;
            }
          }
          
          if (!userData) {
            console.warn('⚠️ 无法从响应中解析用户数据，使用默认值');
            userData = {};
          }
          
          console.log('✅ 解析后的用户数据:', userData);
          
          return {
            name: userData.nickName || userData.name || userData.nickname || userData.username || '',
            phone: userData.phone || userData.userName || userData.mobile || userData.telephone || '',
            avatar: userData.avatar || userData.profilePicture || '/static/images/default-avatar.png',
            role: userData.role || userData.userType || ''
          };
          
        } catch (error) {
          console.error('❌ 使用 getUserById 获取用户信息失败:', error);
          return {
            name: '',
            phone: '',
            avatar: '/static/images/default-avatar.png',
            role: ''
          };
        }
      },
      
      // 查看合同
      async viewContract(order) {
        try {
          console.log('📄 查看合同，订单ID:', order.orderId);
          console.log('📄 合同URL:', order.contractUrl);
          
          if (order.contractUrl) {
            uni.previewImage({
              urls: [order.contractUrl],
              current: order.contractUrl,
              success: () => {
                console.log('✅ 合同预览成功');
              },
              fail: (error) => {
                console.error('❌ 合同预览失败:', error);
                this.handleApiError(error, '合同预览失败');
              }
            });
          } else {
            uni.showToast({
              title: '合同文件不存在',
              icon: 'none'
            });
          }
        } catch (error) {
          console.error('❌ 查看合同失败:', error);
          this.handleApiError(error, '查看合同失败');
        }
      },

      // 监理师上传/修改合同图片
      async uploadContract(orderId, isModify = false) {
        try {
          console.log(`📄 开始${isModify ? '修改' : '上传'}合同图片，订单ID:`, orderId);
          
          const imageRes = await this.chooseContractImage();
          if (!imageRes.tempFilePaths || imageRes.tempFilePaths.length === 0) {
            console.log('❌ 用户取消选择图片');
            return;
          }

          const imagePath = imageRes.tempFilePaths[0];
          const imageFile = imageRes.tempFiles[0];

          console.log('🖼️ 选择的图片信息:', {
            path: imagePath,
            size: imageFile.size,
            type: imageFile.type,
            name: imageFile.name
          });

          const maxSize = 10 * 1024 * 1024;
          if (imageFile.size > maxSize) {
            uni.showToast({
              title: '图片大小不能超过10MB',
              icon: 'none'
            });
            return;
          }

          uni.showLoading({ 
            title: `${isModify ? '修改' : '上传'}合同中...`,
            mask: true
          });

          const uploadResult = await this.uploadContractImageDirect(orderId, imagePath);
          
          if (uploadResult && uploadResult.code === 200) {
            console.log(`✅ 合同图片${isModify ? '修改' : '上传'}成功:`, uploadResult);
            
            const contractUrl = uploadResult.data?.url || uploadResult.data?.fileUrl;
            console.log('📸 合同图片URL:', contractUrl);
            
            if (contractUrl) {
              uni.showLoading({ title: '更新合同信息...' });
              
              try {
                const updateResult = await orderService.updateContractUrlAndContractStatus(
                  orderId, 
                  contractUrl, 
                  1
                );
                
                console.log('✅ 合同URL和状态更新成功:', updateResult);
                
                uni.hideLoading();
                
                uni.showToast({
                  title: `合同${isModify ? '修改' : '上传'}成功`,
                  icon: 'success',
                  duration: 2000
                });
                
                this.pagination.pageNum = 1;
                this.loadOrderList();
                
              } catch (updateError) {
                uni.hideLoading();
                console.error('❌ 更新合同URL和状态失败:', updateError);
                this.handleApiError(updateError, '更新合同信息失败');
              }
            } else {
              throw new Error('未获取到合同图片URL');
            }
            
          } else {
            throw new Error(uploadResult?.msg || `${isModify ? '修改' : '上传'}失败`);
          }
          
        } catch (error) {
          uni.hideLoading();
          console.error(`❌ 合同${isModify ? '修改' : '上传'}失败:`, error);
          this.handleApiError(error, `${isModify ? '修改' : '上传'}失败`);
        }
      },

      // 选择合同图片
      chooseContractImage() {
        return new Promise((resolve, reject) => {
          uni.chooseImage({
            count: 1,
            sizeType: ['compressed', 'original'],
            sourceType: ['album', 'camera'],
            success: (res) => {
              console.log('🖼️ 选择的合同图片:', res);
              resolve(res);
            },
            fail: (error) => {
              console.error('❌ 选择图片失败:', error);
              reject(new Error('选择图片失败: ' + error.errMsg));
            }
          });
        });
      },

      // 上传合同图片
      async uploadContractImageDirect(orderId, filePath) {
        return new Promise((resolve, reject) => {
          const token = uni.getStorageSync('token');
          if (!token) {
            reject(new Error('用户未登录'));
            return;
          }

          const formData = {
            relatedType: 9,
            relatedId: orderId,
            description: '订单合同图片',
            stage: 'CONTRACT',
            sequence: 0
          };

          console.log('📤 上传合同图片到8081端口:', { 
            orderId, 
            filePath, 
            formData,
            baseURL: 'http://localhost:8081'
          });

          const uploadTask = uni.uploadFile({
            url: 'http://localhost:8081/api/media/upload',
            filePath: filePath,
            name: 'file',
            formData: formData,
            header: {
              'Authorization': 'Bearer ' + token,
            },
            success: (res) => {
              console.log('📡 上传响应状态码:', res.statusCode);
              console.log('📡 上传响应数据:', res.data);
              
              if (res.statusCode === 200) {
                try {
                  const data = JSON.parse(res.data);
                  console.log('📡 解析后的响应:', data);
                  if (data.code === 200) {
                    resolve(data);
                  } else {
                    reject(new Error(data.msg || '上传失败'));
                  }
                } catch (e) {
                  console.error('❌ JSON解析错误:', e, '原始响应:', res.data);
                  reject(new Error('服务器响应格式错误'));
                }
              } else {
                reject(new Error(`上传失败，状态码: ${res.statusCode}`));
              }
            },
            fail: (error) => {
              console.error('❌ 上传请求失败:', error);
              reject(new Error('网络请求失败: ' + error.errMsg));
            }
          });

          uploadTask.onProgressUpdate((res) => {
            console.log('📊 上传进度:', res.progress + '%');
            if (res.progress < 100) {
              uni.showLoading({
                title: `上传中 ${res.progress}%`,
                mask: true
              });
            } else {
              uni.hideLoading();
            }
          });
        });
      },
      
      // 切换订单状态
      changeStatus(status) {
        this.activeStatus = status
        this.pagination.pageNum = 1
        this.hasMore = true
        this.orderList = []
        this.loadOrderList()
      },
      
      // 格式化时间
      formatTime(timeStr) {
        if (!timeStr) return ''
        if (typeof timeStr === 'number') {
          const date = new Date(timeStr)
          return date.toLocaleDateString()
        }
        return timeStr.split(' ')[0]
      },
      
      // 格式化日期
      formatDate(dateStr) {
        if (!dateStr) return ''
        if (dateStr.includes('T')) {
          return dateStr.split('T')[0]
        }
        return dateStr.split(' ')[0]
      },
      
      // 根据项目ID获取项目详情
      async getProjectDetail(projectId) {
        if (!projectId) {
          console.warn('项目ID为空')
          return null
        }
        
        try {
          console.log('📋 获取项目详情，项目ID:', projectId)
          const projectDetail = await projectService.getProjectDetail(projectId)
          console.log('✅ 项目详情获取成功:', projectDetail)
          return projectDetail
        } catch (error) {
          console.error('❌ 获取项目详情失败:', error)
          return null
        }
      },
      
      // 更新状态统计（只统计contractorId与当前用户相同的订单）
      updateStatusCount() {
        // 重置统计
        this.statusCount = { '0': 0, '1': 0, '2': 0, '3': 0 }
        
        // 只统计contractorId与当前用户ID相同的订单
        const currentUserIdStr = String(this.userInfo.userId);
        const myOrders = this.orderList.filter(order => {
          const contractorIdStr = String(order.contractorId);
          return contractorIdStr === currentUserIdStr;
        });
        
        myOrders.forEach(order => {
          const status = order.status.toString()
          if (this.statusCount[status] !== undefined) {
            this.statusCount[status]++
          }
        })
        
        console.log('📊 监理师订单状态统计（我的订单）:', this.statusCount)
      },
      
      // 加载更多
      loadMore() {
        if (this.loading || !this.hasMore) return
        this.pagination.pageNum++
        this.loadOrderList()
      },
      
      // 下拉刷新
      onRefresh() {
        if (this.refreshing) return
        this.refreshing = true
        this.pagination.pageNum = 1
        this.hasMore = true
        this.loadOrderList()
      },
      
      // 联系订单相关方（监理师 -> 客户）- 完善版
      async contactOrderParty(order) {
        console.log('👷 监理师开始联系客户，订单信息:', order);
        
        try {
          // 1. 检查登录状态
          if (!isUserLoggedIn()) {
            handleNotLoggedIn();
            return;
          }
          
          // 2. 检查订单信息完整性
          if (!order || !order.userId) {
            console.error('❌ 订单信息不完整:', order);
            uni.showToast({
              title: '订单信息无效',
              icon: 'error',
              duration: 2000
            });
            return;
          }
          
          // 3. 确认当前用户身份
          const currentUserId = String(this.userInfo.userId || '');
          const contractorId = String(order.contractorId || '');
          const customerId = String(order.userId || '');
          
          console.log('👤 身份确认:', {
            当前用户ID: currentUserId,
            订单客户ID: customerId,
            承接方ID: contractorId,
            当前用户角色: this.userInfo.role,
            当前用户角色名称: this.userInfo.roleName,
            页面类型: '监理师订单页面'
          });
          
          // 4. 验证当前用户是否是订单承接方（监理师）
          if (currentUserId !== contractorId) {
            console.warn('⚠️ 当前用户不是订单承接方，权限验证失败');
            uni.showToast({
              title: '权限不足，只能联系自己承接的订单',
              icon: 'none',
              duration: 2000
            });
            return;
          }
          
          // 5. 确定联系对象：监理师联系客户
          let targetUserId = customerId;
          let targetUserName = '';
          let targetUserAvatar = '';
          
          // 6. 防止联系自己
          if (String(targetUserId) === String(currentUserId)) {
            console.warn('⚠️ 尝试联系自己:', {
              当前用户ID: currentUserId,
              目标用户ID: targetUserId
            });
            uni.showToast({
              title: '不能联系自己',
              icon: 'none',
              duration: 2000
            });
            return;
          }
          
          // 7. 获取客户信息
          try {
            const customerInfo = await this.getUserInfoById(targetUserId);
            targetUserName = customerInfo.name || '客户';
            targetUserAvatar = customerInfo.avatar || '';
          } catch (error) {
            console.warn('⚠️ 获取客户信息失败:', error);
            // 使用默认值
            targetUserName = '客户';
            targetUserAvatar = '';
          }
          
          console.log('📞 监理师准备联系客户:', {
            客户ID: targetUserId,
            客户姓名: targetUserName,
            监理师ID: currentUserId,
            订单ID: order.orderId,
            订单类型: order.type
          });
          
          // 8. 显示加载状态
          uni.showLoading({
            title: '创建对话中...',
            mask: true
          });
          
          try {
            // 9. 创建对话并跳转
            await createConversationAndNavigate(
              targetUserId,
              targetUserName,
              targetUserAvatar || ''
            );
            
            console.log('✅ 对话创建成功，跳转聊天页面');
            
          } catch (conversationError) {
            console.error('❌ 创建对话失败:', conversationError);
            
            // 错误处理
            let errorMessage = '创建对话失败';
            if (conversationError.message) {
              if (conversationError.message.includes('请先登录')) {
                errorMessage = '请先登录';
              } else if (conversationError.message.includes('不能与自己')) {
                errorMessage = '不能联系自己';
              } else if (conversationError.message.includes('权限')) {
                errorMessage = '没有权限联系该用户';
              } else if (conversationError.message.includes('对方不存在')) {
                errorMessage = '对方用户不存在';
              } else {
                errorMessage = conversationError.message;
              }
            }
            
            uni.showToast({
              title: errorMessage,
              icon: 'none',
              duration: 3000
            });
            
            // 如果是因为对话不存在，尝试直接跳转到聊天页面
            if (conversationError.message && conversationError.message.includes('对话不存在')) {
              console.log('⚠️ 尝试直接跳转到聊天页面');
              setTimeout(() => {
                uni.navigateTo({
                  url: `/pages/chat/chat?otherUserId=${targetUserId}&otherUserName=${encodeURIComponent(targetUserName)}`
                });
              }, 1000);
            }
          } finally {
            // 10. 隐藏加载状态
            uni.hideLoading();
          }
          
        } catch (error) {
          console.error('❌ 联系客户失败:', error);
          
          uni.showToast({
            title: '联系失败，请稍后重试',
            icon: 'none',
            duration: 3000
          });
        }
      },
      
      // 取消订单
      async cancelOrder(orderId) {
        try {
          uni.showModal({
            title: '确认取消',
            content: '确定要取消这个订单吗？',
            success: async (res) => {
              if (res.confirm) {
                uni.showLoading({ title: '取消中...' })
                await orderService.cancelOrder(orderId)
                uni.hideLoading()
                uni.showToast({
                  title: '订单已取消',
                  icon: 'success'
                })
                this.pagination.pageNum = 1
                this.loadOrderList()
              }
            }
          })
        } catch (error) {
          uni.hideLoading()
          this.handleApiError(error, '取消订单失败')
        }
      },
      
      // 跳转到消息页面
      goToMessage() {
        uni.navigateTo({
          url: '/pages/message/message'
        })
      }
    },
    
    onPullDownRefresh() {
      this.onRefresh()
      uni.stopPullDownRefresh()
    },
    
    onReachBottom() {
      this.loadMore()
    }
  }
</script>

<style scoped>
  /* 样式保持不变 */
  .back-btn {
    display: flex;
    align-items: center;
    padding: 10rpx 20rpx;
    margin-right: 20rpx;
    background-color: #f5f5f5;
    border-radius: 20rpx;
  }
  
  .back-icon {
    font-size: 32rpx;
    margin-right: 10rpx;
  }
  
  .back-text {
    font-size: 28rpx;
    color: #333;
  }
  
  .header-section {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 30rpx;
    background: white;
    border-bottom: 1rpx solid #eee;
  }
  
  .header-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
    flex: 1;
    text-align: center;
    margin-right: 120rpx; /* 为右侧按钮留出空间 */
  }
  
  .header-actions {
    display: flex;
    align-items: center;
  }
  
  .action-item {
    padding: 10rpx;
  }
  
  .action-icon {
    font-size: 40rpx;
  }
  
  .status-filter {
    background: white;
    padding: 20rpx 0;
  }
  
  .filter-scroll {
    white-space: nowrap;
  }
  
  .filter-list {
    display: inline-flex;
    padding: 0 30rpx;
  }
  
  .filter-item {
    position: relative;
    padding: 20rpx 30rpx;
    margin-right: 40rpx;
    font-size: 28rpx;
    color: #666;
  }
  
  .filter-item.active {
    color: #007AFF;
    font-weight: bold;
  }
  
  .filter-item.active::after {
    content: '';
    position: absolute;
    bottom: 10rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 40rpx;
    height: 4rpx;
    background: #007AFF;
    border-radius: 2rpx;
  }
  
  .count-badge {
    position: absolute;
    top: 10rpx;
    right: 10rpx;
    background: #FF3B30;
    color: white;
    font-size: 20rpx;
    padding: 4rpx 8rpx;
    border-radius: 20rpx;
    min-width: 24rpx;
    text-align: center;
  }
  
  .order-list {
    height: calc(100vh - 200rpx);
    padding: 20rpx;
  }
  
  .refresh-container {
    text-align: center;
    padding: 20rpx;
  }
  
  .refresh-text {
    font-size: 28rpx;
    color: #999;
  }
  
  .empty-state, .loading-state {
    text-align: center;
    padding: 100rpx 0;
  }
  
  .empty-icon {
    font-size: 120rpx;
    margin-bottom: 30rpx;
  }
  
  .empty-text {
    font-size: 32rpx;
    color: #999;
    margin-bottom: 20rpx;
  }
  
  .empty-desc {
    font-size: 28rpx;
    color: #ccc;
  }
  
  .loading-text {
    font-size: 28rpx;
    color: #999;
  }
  
  .order-item {
    background: white;
    border-radius: 16rpx;
    margin-bottom: 20rpx;
    padding: 30rpx;
    box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
  }
  
  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    padding-bottom: 20rpx;
    border-bottom: 1rpx solid #f0f0f0;
  }
  
  .order-info {
    flex: 1;
  }
  
  .order-number {
    display: block;
    font-size: 26rpx;
    color: #666;
    margin-bottom: 10rpx;
  }
  
  .order-time {
    font-size: 24rpx;
    color: #999;
  }
  
  .order-status {
    font-size: 26rpx;
    font-weight: bold;
    padding: 8rpx 16rpx;
    border-radius: 20rpx;
  }
  
  .status-pending {
    background: #FFF6E6;
    color: #FF9500;
  }
  
  .status-progress {
    background: #E6F7FF;
    color: #007AFF;
  }
  
  .status-completed {
    background: #E6FFED;
    color: #52C41A;
  }
  
  .status-canceled {
    background: #FFF2F0;
    color: #FF4D4F;
  }
  
  .order-content {
    margin-bottom: 20rpx;
  }
  
  .project-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 10rpx;
  }
  
  .project-desc {
    font-size: 28rpx;
    color: #666;
    margin-bottom: 15rpx;
    line-height: 1.4;
  }
  
  .project-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10rpx;
  }
  
  .tag {
    font-size: 24rpx;
    color: #999;
    background: #f5f5f5;
    padding: 6rpx 12rpx;
    border-radius: 12rpx;
  }
  
  .designer-info {
    display: flex;
    align-items: center;
    margin-top: 20rpx;
    padding: 20rpx;
    background: #f9f9f9;
    border-radius: 12rpx;
  }
  
  .designer-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 20rpx;
  }
  
  .designer-avatar image {
    width: 100%;
    height: 100%;
  }
  
  .designer-details {
    flex: 1;
  }
  
  .designer-name {
    display: block;
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 5rpx;
  }
  
  .designer-role {
    font-size: 24rpx;
    color: #007AFF;
    margin-bottom: 5rpx;
  }
  
  .designer-phone {
    font-size: 24rpx;
    color: #666;
  }
  
  .contact-btn {
    font-size: 26rpx;
    color: #007AFF;
    padding: 10rpx 20rpx;
    border: 1rpx solid #007AFF;
    border-radius: 20rpx;
  }
  
  .no-designer {
    text-align: center;
    padding: 20rpx;
    background: #f9f9f9;
    border-radius: 12rpx;
    margin-top: 20rpx;
  }
  
  .no-designer-text {
    font-size: 26rpx;
    color: #999;
  }
  
  .order-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 20rpx;
    border-top: 1rpx solid #f0f0f0;
  }
  
  .order-amount {
    font-size: 28rpx;
  }
  
  .amount-label {
    color: #666;
  }
  
  .amount-value {
    color: #FF6B35;
    font-weight: bold;
  }
  
  .order-actions {
    display: flex;
    gap: 15rpx;
  }
  
  .btn {
    padding: 12rpx 24rpx;
    font-size: 26rpx;
    border-radius: 20rpx;
    border: none;
  }
  
  .btn.primary {
    background: #007AFF;
    color: white;
  }
  
  .btn.secondary {
    background: #f5f5f5;
    color: #666;
    border: 1rpx solid #ddd;
  }
  
  /* 新增样式 */
  .btn.primary.waiting-inspection {
    background: linear-gradient(135deg, #ff9800, #f57c00);
  }
  
  .btn.primary.waiting-payment {
    background: linear-gradient(135deg, #f44336, #d32f2f);
  }
  
  .status-text {
    font-size: 26rpx;
    color: #666;
    padding: 12rpx 0;
  }
  
  .load-more {
    text-align: center;
    padding: 30rpx;
  }
  
  .load-more-text {
    font-size: 26rpx;
    color: #999;
  }
</style>