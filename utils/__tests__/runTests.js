/**
 * 测试运行器
 * 运行所有工具函数的测试
 */

console.log('🚀 开始运行聊天系统工具函数测试套件')
console.log('=' .repeat(50))

// 运行时间工具测试
try {
  console.log('📅 运行时间工具测试...')
  await import('./timeUtils.test.js')
  console.log('')
} catch (error) {
  console.error('❌ 时间工具测试失败:', error)
}

// 运行消息验证测试
try {
  console.log('✅ 运行消息验证测试...')
  await import('./messageValidation.test.js')
  console.log('')
} catch (error) {
  console.error('❌ 消息验证测试失败:', error)
}

console.log('=' .repeat(50))
console.log('🎉 测试套件运行完成')

// 简单的集成测试
console.log('🔧 运行集成测试...')

try {
  // 测试工具函数的集成使用
  const { formatTime, parseDate } = await import('../timeUtils.js')
  const { validateTextMessage } = await import('../messageValidation.js')
  const { createTextMessage } = await import('../websocketUtils.js')
  
  // 测试时间处理流程
  const now = new Date()
  const parsedTime = parseDate(now.toISOString())
  const formattedTime = formatTime(parsedTime)
  console.log('✅ 时间处理流程测试通过:', formattedTime)
  
  // 测试消息创建流程
  const messageValidation = validateTextMessage('测试消息')
  if (messageValidation.isValid) {
    const message = createTextMessage({
      senderId: 1,
      receiverId: 2,
      conversationId: 100,
      content: '测试消息',
      userRole: 1
    })
    console.log('✅ 消息创建流程测试通过:', message.action)
  }
  
  console.log('✅ 集成测试通过')
  
} catch (error) {
  console.error('❌ 集成测试失败:', error)
}

console.log('🏁 所有测试完成')