/**
 * 头像工具函数测试
 */

import { processAvatarUrl, processAvatarUrls } from '../avatarUtils'

describe('avatarUtils', () => {
  describe('processAvatarUrl', () => {
    test('应该返回完整的HTTP URL', () => {
      const url = 'http://example.com/avatar.png'
      expect(processAvatarUrl(url)).toBe(url)
    })

    test('应该返回完整的HTTPS URL', () => {
      const url = 'https://cypphoto.oss-cn-chengdu.aliyuncs.com/photo/2025/11/25/test.png'
      expect(processAvatarUrl(url)).toBe(url)
    })

    test('应该返回相对路径', () => {
      const url = '/uploads/avatar/test.png'
      expect(processAvatarUrl(url)).toBe(url)
    })

    test('空URL应该返回默认头像', () => {
      expect(processAvatarUrl('')).toBe('/static/images/default-avatar.png')
      expect(processAvatarUrl(null)).toBe('/static/images/default-avatar.png')
      expect(processAvatarUrl(undefined)).toBe('/static/images/default-avatar.png')
    })

    test('应该支持自定义默认头像', () => {
      const customDefault = '/custom/default.png'
      expect(processAvatarUrl('', customDefault)).toBe(customDefault)
    })

    test('应该处理带空格的URL', () => {
      const url = '  https://example.com/avatar.png  '
      expect(processAvatarUrl(url)).toBe('https://example.com/avatar.png')
    })
  })

  describe('processAvatarUrls', () => {
    test('应该批量处理头像URL', () => {
      const items = [
        { id: 1, avatar: 'https://example.com/1.png', name: 'User 1' },
        { id: 2, avatar: '', name: 'User 2' },
        { id: 3, avatar: '/uploads/3.png', name: 'User 3' }
      ]

      const processed = processAvatarUrls(items)

      expect(processed[0].avatar).toBe('https://example.com/1.png')
      expect(processed[1].avatar).toBe('/static/images/default-avatar.png')
      expect(processed[2].avatar).toBe('/uploads/3.png')
    })

    test('应该处理空数组', () => {
      expect(processAvatarUrls([])).toEqual([])
    })

    test('应该处理非数组输入', () => {
      expect(processAvatarUrls(null)).toBe(null)
      expect(processAvatarUrls(undefined)).toBe(undefined)
    })

    test('应该支持自定义字段名', () => {
      const items = [
        { id: 1, userAvatar: 'https://example.com/1.png' }
      ]

      const processed = processAvatarUrls(items, 'userAvatar')
      expect(processed[0].userAvatar).toBe('https://example.com/1.png')
    })
  })
})
