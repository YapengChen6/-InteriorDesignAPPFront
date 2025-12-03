<template>
  <view class="chat-main-container">
    <!-- 简单的入口页面，直接跳转到聊天列表 -->
    <view class="redirect-container">
      <text class="redirect-text">正在跳转...</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'ChatMain',
  data() {
    return {
      redirecting: true
    }
  },
  
  onLoad(options) {
    console.log('🔄 ChatMain 重定向，参数:', options)
    
    // 检查是否有参数需要传递
    let redirectUrl = '/pages/chat/chatList'
    
    if (options && (options.conversationId || options.otherUserId)) {
      // 如果有会话参数，直接跳转到聊天详情
      const params = []
      if (options.conversationId) params.push(`conversationId=${options.conversationId}`)
      if (options.otherUserId) params.push(`otherUserId=${options.otherUserId}`)
      if (options.name) params.push(`name=${encodeURIComponent(options.name)}`)
      if (options.avatar) params.push(`avatar=${encodeURIComponent(options.avatar)}`)
      
      redirectUrl = `/pages/chat/chatDetail.vue?${params.join('&')}`
      console.log('🔄 跳转到聊天详情:', redirectUrl)
    } else {
      console.log('🔄 跳转到聊天列表')
    }
    
    // 使用 navigateTo 保留页面栈，以便返回
    uni.navigateTo({
      url: redirectUrl,
      fail: (err) => {
        console.error('❌ 跳转失败:', err)
        // 如果是跳转到列表页失败，尝试 switchTab
        if (redirectUrl.includes('chatList')) {
          uni.switchTab({
            url: '/pages/message/index'
          })
        }
      }
    })
  }
}
</script>

<style scoped>
.chat-main-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
}

.redirect-container {
  text-align: center;
}

.redirect-text {
  font-size: 28rpx;
  color: #999;
}
</style>
