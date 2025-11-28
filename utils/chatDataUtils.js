/**
 * 聊天数据处理工具类
 * 基于chatMain.vue中的数据处理逻辑
 */

import { normalizeBackendTime, parseDate } from './timeUtils.js'

/**
 * 角色映射配置
 */
export const ROLE_MAP = {
  user: {
    name: '普通用户',
    userRole: 1,
    icon: 'icon-user',
    desc: '浏览内容、购买商品'
  },
  designer: {
    name: '设计师',
    userRole: 2,
    icon: 'icon-paint-brush',
    desc: '发布作品、管理内容'
  },
  material_supplier: {
    name: '材料商',
    userRole: 4,
    icon: 'icon-store',
    desc: '管理店铺、处理订单'
  },
  supervisor: {
    name: '监理',
    userRole: 3,
    icon: 'icon-user-check',
    desc: '监督工程、管理案例'
  }
}

/**
 * 角色标准化处理 - 确保兼容性
 * @param {*} role - 角色输入
 * @returns {number} - 标准化的角色数字
 */
export function normalizeUserRole(role) {
  if (!role) return 1 // 默认为普通用户
  
  // 如果已经是有效的角色数字，直接返回
  const validRoles = [1, 2, 3, 4] // user, designer, supervisor, material_supplier
  if (validRoles.includes(parseInt(role))) {
    return parseInt(role)
  }
  
  // 如果是字符串，尝试映射
  if (typeof role === 'string') {
    const roleMapping = {
      'user': 1,
      'designer': 2,
      'supervisor': 3,
      'material_supplier': 4,
      'materialSupplier': 4
    }
    return roleMapping[role.toLowerCase()] || 1
  }
  
  // 其他情况默认为普通用户
  return 1
}

/**
 * 转换后端对话数据为前端聊天列表格式
 * @param {Array} conversations - 后端对话数据
 * @param {number} currentUserId - 当前用户ID
 * @param {Function} getUserInfo - 获取用户信息的函数
 * @returns {Promise<Array>} - 转换后的聊天列表
 */
export async function convertConversationsToChats(conversations, currentUserId, getUserInfo) {
  const chatPromises = conversations.map(async (conv) => {
    // 确定对方用户ID
    const otherUserId = conv.userId1 === currentUserId ? conv.userId2 : conv.userId1
    
    // 获取对方用户真实昵称
    let otherUserName = `用户${otherUserId}`
    let otherUserAvatar = '/static/images/default-avatar.png'
    
    try {
      // 调用用户信息接口获取真实昵称
      const userInfo = await getUserInfo(otherUserId)
      if (userInfo) {
        otherUserName = userInfo.userName || userInfo.nickName || otherUserName
        otherUserAvatar = userInfo.avatar || otherUserAvatar
        console.log('👤 获取用户信息成功:', { userId: otherUserId, userName: otherUserName })
      }
    } catch (error) {
      console.warn('⚠️ 获取用户信息失败，使用默认昵称:', error)
    }

    // 解析时间，如果解析失败则使用当前时间
    const parsedTime = normalizeBackendTime(conv.lastMessageTime)
    
    return {
      id: conv.conversationId,
      conversationId: conv.conversationId,
      name: otherUserName,
      avatar: otherUserAvatar,
      lastMessage: conv.lastMessage || '暂无消息',
      lastMessageTime: parsedTime,
      unreadCount: conv.unreadCount || 0,
      online: conv.online || false,
      userRole: conv.otherUserRole || 1,
      // 兼容性处理：确保userRole是有效的数字
      normalizedUserRole: normalizeUserRole(conv.otherUserRole),
      userId1: conv.userId1,
      userId2: conv.userId2,
      otherUserId: otherUserId,
      type: 'conversation', // 标记这是对话类型
      // 添加调试信息
      _debug: {
        originalOtherUserRole: conv.otherUserRole,
        mappedUserRole: conv.otherUserRole || 1,
        roleMap: ROLE_MAP
      }
    }
  })

  return await Promise.all(chatPromises)
}

/**
 * 转换消息中心数据为聊天请求列表
 * @param {Array} messages - 消息中心数据
 * @returns {Array} - 转换后的聊天请求列表
 */
export function convertMessagesToChatRequests(messages) {
  return messages
    .filter(msg => msg.messageType === 3) // 只处理聊天请求消息
    .map(msg => {
      console.log('🔍 处理聊天请求消息:', {
        messageId: msg.messageId,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        senderName: msg.senderName,
        content: msg.content,
        readStatus: msg.readStatus
      })
      
      // 解析聊天请求内容
      let senderName = msg.senderName || `用户${msg.senderId}`
      let conversationId = msg.conversationId
      
      // 如果消息内容是JSON格式，解析获取更多信息
      try {
        const content = JSON.parse(msg.content || '{}')
        if (content.type === 'CHAT_REQUEST') {
          senderName = content.fromNickName || senderName
          console.log('🔍 解析聊天请求内容:', {
            fromUserId: content.fromUserId,
            fromNickName: content.fromNickName,
            finalSenderName: senderName
          })
        }
      } catch (e) {
        console.warn('🔍 解析聊天请求内容失败:', e)
      }
      
      // 对于聊天请求，显示的是请求聊天的人（发送者）
      return {
        id: `msg_${msg.messageId}`,
        conversationId: conversationId || msg.messageId,
        name: senderName, // 显示请求聊天的人的姓名
        avatar: '/static/images/default-avatar.png',
        lastMessage: '请求与您聊天',
        lastMessageTime: new Date(msg.sendTime || Date.now()),
        unreadCount: msg.readStatus === 0 ? 1 : 0,
        online: false,
        userRole: 1,
        normalizedUserRole: 1,
        otherUserId: msg.senderId, // 对方用户ID就是发送者ID
        type: 'chat-request', // 标记这是聊天请求类型
        messageId: msg.messageId,
        messageStatusId: msg.messageStatusId,
        // 添加调试信息
        _debug: {
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          senderName: msg.senderName,
          messageType: msg.messageType
        }
      }
    })
}

/**
 * 按角色过滤聊天列表
 * @param {Array} chats - 聊天列表
 * @param {string} roleType - 角色类型
 * @returns {Array} - 过滤后的聊天列表
 */
export function filterChatsByRole(chats, roleType) {
  if (roleType === 'all') return chats
  
  return chats.filter(chat => {
    const roleToCheck = chat.normalizedUserRole !== undefined ? chat.normalizedUserRole : chat.userRole
    
    console.log('🔍 过滤聊天:', {
      chatName: chat.name,
      chatUserRole: chat.userRole,
      chatNormalizedUserRole: chat.normalizedUserRole,
      activeTab: roleType,
      expectedRole: ROLE_MAP[roleType]?.userRole
    })
    
    return roleToCheck === ROLE_MAP[roleType]?.userRole
  })
}

/**
 * 按搜索文本过滤聊天列表
 * @param {Array} chats - 聊天列表
 * @param {string} searchText - 搜索文本
 * @returns {Array} - 过滤后的聊天列表
 */
export function filterChatsBySearch(chats, searchText) {
  if (!searchText) return chats
  
  return chats.filter(chat =>
    (chat && chat.name ? chat.name : '').includes(searchText) ||
    (chat && chat.lastMessage ? chat.lastMessage : '').includes(searchText)
  )
}

/**
 * 更新聊天列表中的分类计数
 * @param {Array} chats - 聊天列表
 * @returns {Object} - 分类计数对象
 */
export function updateCategoryCount(chats) {
  const designerCount = chats.filter(c => {
    const role = c.normalizedUserRole !== undefined ? c.normalizedUserRole : c.userRole
    return role === ROLE_MAP.designer.userRole
  }).length
  
  const supervisorCount = chats.filter(c => {
    const role = c.normalizedUserRole !== undefined ? c.normalizedUserRole : c.userRole
    return role === ROLE_MAP.supervisor.userRole
  }).length
  
  const userCount = chats.filter(c => {
    const role = c.normalizedUserRole !== undefined ? c.normalizedUserRole : c.userRole
    return role === ROLE_MAP.user.userRole
  }).length

  const counts = {
    all: chats.length,
    designer: designerCount,
    supervisor: supervisorCount,
    user: userCount
  }
  
  console.log('📊 分类计数更新:', counts)
  return counts
}

/**
 * 更新聊天列表中的最后一条消息
 * @param {Array} chats - 聊天列表
 * @param {number} conversationId - 对话ID
 * @param {string} content - 消息内容
 * @param {Date} time - 消息时间
 * @param {number} currentUserId - 当前用户ID
 * @param {number} otherUserId - 对方用户ID
 * @returns {Array} - 更新后的聊天列表
 */
export function updateChatLastMessage(chats, conversationId, content, time, currentUserId, otherUserId) {
  const chatIndex = chats.findIndex(c => c.conversationId === conversationId)
  if (chatIndex >= 0) {
    chats[chatIndex].lastMessage = content
    chats[chatIndex].lastMessageTime = time
    
    // 如果不是当前用户发送的消息，增加未读数
    if (currentUserId !== otherUserId) {
      chats[chatIndex].unreadCount = (chats[chatIndex].unreadCount || 0) + 1
    }
    
    // 将更新的聊天项移到列表顶部
    const updatedChat = chats.splice(chatIndex, 1)[0]
    chats.unshift(updatedChat)
  }
  
  return chats
}

/**
 * 更新本地未读消息数量
 * @param {Array} chats - 聊天列表
 * @param {number} conversationId - 对话ID
 * @param {number} unreadCount - 未读数量
 * @returns {Array} - 更新后的聊天列表
 */
export function updateLocalUnreadCount(chats, conversationId, unreadCount) {
  const chatIndex = chats.findIndex(chat => chat.conversationId === conversationId)
  if (chatIndex !== -1) {
    const oldUnreadCount = chats[chatIndex].unreadCount
    chats[chatIndex].unreadCount = unreadCount
    
    console.log('🔢 更新未读消息数量:', {
      conversationId: conversationId,
      oldCount: oldUnreadCount,
      newCount: unreadCount
    })
    
    // 如果未读数量变为0，移除未读样式
    if (unreadCount === 0) {
      chats[chatIndex].unread = false
    } else {
      // 如果有未读消息，添加未读样式
      chats[chatIndex].unread = true
    }
  }
  
  return chats
}

/**
 * 增加未读消息数量
 * @param {Array} chats - 聊天列表
 * @param {number} conversationId - 对话ID
 * @returns {Array} - 更新后的聊天列表
 */
export function incrementUnreadCount(chats, conversationId) {
  const chatIndex = chats.findIndex(chat => chat.conversationId === conversationId)
  if (chatIndex !== -1) {
    const oldCount = chats[chatIndex].unreadCount || 0
    chats[chatIndex].unreadCount = oldCount + 1
    chats[chatIndex].unread = true
    
    console.log('📈 增加未读消息数量:', {
      conversationId: conversationId,
      oldCount: oldCount,
      newCount: chats[chatIndex].unreadCount,
      showBadge: chats[chatIndex].unreadCount > 0
    })
  }
  
  return chats
}