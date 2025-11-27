/**
 * 消息验证工具函数测试
 * 验证消息验证功能的正确性
 */

import { 
  validateTextMessage, 
  validatePhoneNumber, 
  validateMessageParams,
  validateChatRequestParams
} from '../messageValidation.js'
import { test, expect } from './timeUtils.test.js'

console.log('🧪 开始消息验证工具函数测试')

test('validateTextMessage - 验证有效文本消息', () => {
  const result = validateTextMessage('Hello, world!')
  expect(result.isValid).toBe(true)
  expect(result.error).toBe(null)
})

test('validateTextMessage - 验证空消息', () => {
  const result = validateTextMessage('')
  expect(result.isValid).toBe(false)
  expect(result.error).toContain('不能为空')
})

test('validateTextMessage - 验证空白消息', () => {
  const result = validateTextMessage('   ')
  expect(result.isValid).toBe(false)
  expect(result.error).toContain('不能为空')
})

test('validateTextMessage - 验证过长消息', () => {
  const longMessage = 'a'.repeat(5001)
  const result = validateTextMessage(longMessage)
  expect(result.isValid).toBe(false)
  expect(result.error).toContain('过长')
})

test('validatePhoneNumber - 验证有效手机号', () => {
  const result = validatePhoneNumber('13812345678')
  expect(result.isValid).toBe(true)
  expect(result.error).toBe(null)
})

test('validatePhoneNumber - 验证无效手机号', () => {
  const result = validatePhoneNumber('12345')
  expect(result.isValid).toBe(false)
  expect(result.error).toContain('正确的手机号格式')
})

test('validatePhoneNumber - 验证空手机号', () => {
  const result = validatePhoneNumber('')
  expect(result.isValid).toBe(false)
  expect(result.error).toContain('请输入手机号')
})

test('validateMessageParams - 验证有效消息参数', () => {
  const params = {
    senderId: 1,
    receiverId: 2,
    conversationId: 100,
    content: 'Hello',
    messageType: 1
  }
  const result = validateMessageParams(params)
  expect(result.isValid).toBe(true)
  expect(result.errors.length).toBe(0)
})

test('validateMessageParams - 验证无效消息参数', () => {
  const params = {
    senderId: null,
    receiverId: 2,
    conversationId: 100,
    content: '',
    messageType: 1
  }
  const result = validateMessageParams(params)
  expect(result.isValid).toBe(false)
  expect(result.errors.length > 0).toBe(true)
})

test('validateMessageParams - 验证发送者和接收者相同', () => {
  const params = {
    senderId: 1,
    receiverId: 1,
    conversationId: 100,
    content: 'Hello',
    messageType: 1
  }
  const result = validateMessageParams(params)
  expect(result.isValid).toBe(false)
  expect(result.errors.some(error => error.includes('不能给自己发送消息'))).toBe(true)
})

test('validateChatRequestParams - 验证有效聊天请求参数', () => {
  const params = {
    currentUserId: 1,
    targetUserId: 2
  }
  const result = validateChatRequestParams(params)
  expect(result.isValid).toBe(true)
  expect(result.errors.length).toBe(0)
})

test('validateChatRequestParams - 验证添加自己为聊天对象', () => {
  const params = {
    currentUserId: 1,
    targetUserId: 1
  }
  const result = validateChatRequestParams(params)
  expect(result.isValid).toBe(false)
  expect(result.errors.some(error => error.includes('不能添加自己为聊天对象'))).toBe(true)
})

console.log('🧪 消息验证工具函数测试完成')