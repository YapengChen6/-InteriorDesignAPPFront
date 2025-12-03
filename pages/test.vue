<template>
  <view class="container">
    <view class="header">
      <text class="title">功能测试页面</text>
      <text class="subtitle">对话检查 & PDF预览</text>
    </view>
    
    <!-- 对话检查测试区域 -->
    <view class="test-section">
      <view class="section-title">对话检查功能测试</view>
      
      <view class="input-group">
        <text class="input-label">用户1 ID:</text>
        <input class="test-input" v-model="testUserId1" placeholder="输入用户1的ID" type="number" />
      </view>
      
      <view class="input-group">
        <text class="input-label">用户2 ID:</text>
        <input class="test-input" v-model="testUserId2" placeholder="输入用户2的ID" type="number" />
      </view>
      
      <button class="test-btn" @click="testConversationCheck" :loading="conversationLoading">
        <text class="btn-text">{{ conversationLoading ? '检查中...' : '测试对话检查' }}</text>
      </button>
      
      <view v-if="conversationResult" class="result-box">
        <text class="result-title">检查结果:</text>
        <text class="result-text">{{ conversationResult }}</text>
      </view>
    </view>
    
    <!-- PDF预览测试区域 -->
    <view class="test-section">
      <view class="section-title">PDF预览功能测试</view>
      <view class="preview-card">
        <view class="pdf-icon">📄</view>
        <text class="card-title">PDF文档</text>
        <text class="card-desc">{{ fileName }}</text>
      
      <button class="preview-btn" @click="downloadAndPreview" :loading="loading">
        <text class="btn-icon">👁️</text>
        <text class="btn-text">{{ loading ? '加载中...' : '立即预览' }}</text>
      </button>
      
      <!-- 进度显示 -->
      <view v-if="downloadProgress > 0" class="progress-container">
        <text class="progress-text">下载进度: {{ downloadProgress }}%</text>
        <view class="progress-bar">
          <view class="progress-inner" :style="{width: downloadProgress + '%'}"></view>
        </view>
      </view>
    </view>
    </view>
    
    <view class="action-buttons">
      <button class="action-btn secondary" @click="openInBrowser">
        <text class="action-icon">🌐</text>
        <text class="action-text">浏览器打开</text>
      </button>
      
      <button class="action-btn secondary" @click="copyLink">
        <text class="action-icon">📋</text>
        <text class="action-text">复制链接</text>
      </button>
    </view>
    
    <!-- 调试信息 -->
    <view class="debug-info" v-if="showDebug">
      <text class="debug-title">调试信息</text>
      <text class="debug-item">状态: {{ debugStatus }}</text>
      <text class="debug-item">进度: {{ downloadProgress }}%</text>
      <text class="debug-item">文件大小: {{ fileSize }}</text>
    </view>
  </view>
</template>

<script>
import { checkOrCreateConversation } from '@/api/conversationCheck.js'

export default {
  data() {
    return {
      // 对话检查测试相关
      testUserId1: '',
      testUserId2: '',
      conversationLoading: false,
      conversationResult: '',
      originalPdfUrl: 'https://cypphoto.oss-cn-chengdu.aliyuncs.com/photo//2025/11/26/addce7090a794b8582a87a2531a0b2ec.pdf',
      backendBaseUrl: 'http://localhost:8081/api/media/preview',
      fileName: '测试文档.pdf',
      loading: false,
      downloadProgress: 0,
      debugStatus: '等待操作',
      fileSize: '未知',
      showDebug: true // 设置为false可隐藏调试信息
    }
  },
  computed: {
    previewUrl() {
      return `${this.backendBaseUrl}?fileUrl=${encodeURIComponent(this.originalPdfUrl)}`;
    }
  },
  methods: {
    // 测试对话检查功能
    async testConversationCheck() {
      if (!this.testUserId1 || !this.testUserId2) {
        uni.showToast({
          title: '请输入两个用户ID',
          icon: 'none'
        });
        return;
      }
      
      if (this.testUserId1 === this.testUserId2) {
        uni.showToast({
          title: '不能与自己创建对话',
          icon: 'none'
        });
        return;
      }
      
      this.conversationLoading = true;
      this.conversationResult = '';
      
      try {
        console.log('🧪 测试对话检查:', {
          userId1: this.testUserId1,
          userId2: this.testUserId2
        });
        
        const response = await checkOrCreateConversation(
          parseInt(this.testUserId1), 
          parseInt(this.testUserId2)
        );
        
        console.log('✅ 对话检查响应:', response);
        
        if (response.code === 200) {
          const data = response.data;
          this.conversationResult = JSON.stringify({
            exists: data.exists,
            conversationId: data.conversation.conversationId,
            message: data.message,
            createTime: data.conversation.createTime
          }, null, 2);
          
          uni.showToast({
            title: data.exists ? '对话已存在' : '创建新对话',
            icon: 'success'
          });
        } else {
          throw new Error(response.msg || '检查失败');
        }
        
      } catch (error) {
        console.error('❌ 对话检查失败:', error);
        this.conversationResult = `错误: ${error.message}`;
        
        uni.showToast({
          title: error.message || '检查失败',
          icon: 'none'
        });
      } finally {
        this.conversationLoading = false;
      }
    },
    async downloadAndPreview() {
      this.loading = true;
      this.downloadProgress = 0;
      this.debugStatus = '开始下载...';
      
      try {
        uni.showLoading({
          title: '准备下载PDF',
          mask: true
        });

        console.log('开始下载PDF:', this.previewUrl);
        
        return new Promise((resolve, reject) => {
          const downloadTask = uni.downloadFile({
            url: this.previewUrl,
            success: (downloadResult) => {
              console.log('下载完成:', downloadResult);
              this.debugStatus = '下载完成，准备预览';
              
              if (downloadResult.statusCode === 200) {
                uni.hideLoading();
                
                // 使用系统文档查看器打开
                uni.openDocument({
                  filePath: downloadResult.tempFilePath,
                  fileType: 'pdf',
                  success: () => {
                    console.log('PDF预览成功');
                    this.debugStatus = '预览成功';
                    uni.showToast({
                      title: '预览成功',
                      icon: 'success',
                      duration: 2000
                    });
                    resolve();
                  },
                  fail: (err) => {
                    console.error('打开文档失败:', err);
                    this.debugStatus = '打开失败: ' + JSON.stringify(err);
                    uni.showToast({
                      title: '打开失败，尝试浏览器预览',
                      icon: 'none'
                    });
                    this.openInBrowser();
                    reject(err);
                  }
                });
              } else {
                this.debugStatus = `下载失败，状态码: ${downloadResult.statusCode}`;
                uni.showToast({
                  title: '下载失败',
                  icon: 'none'
                });
                reject(new Error(`下载失败: ${downloadResult.statusCode}`));
              }
            },
            fail: (error) => {
              console.error('下载请求失败:', error);
              this.debugStatus = '下载请求失败: ' + JSON.stringify(error);
              uni.hideLoading();
              uni.showToast({
                title: '下载失败，尝试浏览器打开',
                icon: 'none'
              });
              this.openInBrowser();
              reject(error);
            }
          });

          // 监听下载进度 - 修复Infinity问题
          downloadTask.onProgressUpdate((res) => {
            console.log('下载进度原始数据:', res);
            // 修复进度计算
            if (res.totalBytesExpectedToWrite > 0) {
              this.downloadProgress = Math.round((res.totalBytesWritten / res.totalBytesExpectedToWrite) * 100);
              this.fileSize = this.formatFileSize(res.totalBytesExpectedToWrite);
            } else {
              // 如果无法获取总大小，显示已下载大小
              this.downloadProgress = 50; // 默认显示50%
              this.fileSize = `已下载: ${this.formatFileSize(res.totalBytesWritten)}`;
            }
            this.debugStatus = `下载中: ${this.downloadProgress}%`;
          });
        });

      } catch (error) {
        console.error('预览异常:', error);
        this.debugStatus = '异常: ' + error.message;
        uni.showToast({
          title: '预览失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    formatFileSize(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    openInBrowser() {
      console.log('在浏览器中打开:', this.previewUrl);
      this.debugStatus = '跳转到浏览器...';
      
      // H5环境
      if (typeof window !== 'undefined') {
        window.open(this.previewUrl, '_blank');
      }
      
      // App环境
      // #ifdef APP-PLUS
      plus.runtime.openURL(this.previewUrl);
      // #endif
      
      uni.showToast({
        title: '请在浏览器中查看',
        icon: 'none'
      });
    },
    
    copyLink() {
      uni.setClipboardData({
        data: this.previewUrl,
        success: () => {
          uni.showToast({
            title: '链接已复制',
            icon: 'success'
          });
        }
      });
    }
  },
  onLoad(options) {
    if (options.fileName) {
      this.fileName = options.fileName;
    }
    if (options.fileUrl) {
      this.originalPdfUrl = decodeURIComponent(options.fileUrl);
    }
    
    console.log('PDF预览页面加载完成');
    console.log('文件URL:', this.originalPdfUrl);
    console.log('预览接口:', this.previewUrl);
    this.debugStatus = '页面加载完成';
  }
}
</script>

<style>
.container {
  padding: 40rpx;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 测试区域样式 */
.test-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  text-align: center;
}

.input-group {
  margin-bottom: 25rpx;
}

.input-label {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.test-input {
  width: 100%;
  height: 80rpx;
  padding: 0 20rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 10rpx;
  font-size: 28rpx;
  background: #f8f9fa;
}

.test-input:focus {
  border-color: #007AFF;
  background: #fff;
}

.test-btn {
  width: 100%;
  background: linear-gradient(135deg, #28a745, #20c997);
  color: #fff;
  border: none;
  border-radius: 15rpx;
  padding: 25rpx 0;
  font-size: 30rpx;
  font-weight: bold;
  margin: 30rpx 0;
}

.test-btn:active {
  transform: scale(0.98);
}

.result-box {
  background: #f8f9fa;
  border: 2rpx solid #e9ecef;
  border-radius: 10rpx;
  padding: 20rpx;
  margin-top: 20rpx;
}

.result-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #495057;
  margin-bottom: 10rpx;
}

.result-text {
  display: block;
  font-size: 24rpx;
  color: #6c757d;
  white-space: pre-wrap;
  word-break: break-all;
}

.header {
  text-align: center;
  margin-bottom: 60rpx;
}

.title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 20rpx;
}

.subtitle {
  display: block;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.preview-card {
  background: #fff;
  border-radius: 30rpx;
  padding: 60rpx 40rpx;
  text-align: center;
  margin-bottom: 40rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.1);
}

.pdf-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
}

.card-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 15rpx;
}

.card-desc {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 50rpx;
}

.preview-btn {
  background: linear-gradient(135deg, #007AFF, #5856D6);
  border-radius: 50rpx;
  padding: 30rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 122, 255, 0.3);
  margin-bottom: 30rpx;
}

.btn-icon {
  font-size: 36rpx;
}

.btn-text {
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
}

/* 进度条样式 */
.progress-container {
  margin-top: 30rpx;
}

.progress-text {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 15rpx;
}

.progress-bar {
  width: 100%;
  height: 8rpx;
  background: #f0f0f0;
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-inner {
  height: 100%;
  background: linear-gradient(135deg, #007AFF, #5856D6);
  border-radius: 4rpx;
  transition: width 0.3s ease;
}

.action-buttons {
  display: flex;
  gap: 20rpx;
  margin-bottom: 40rpx;
}

.action-btn {
  flex: 1;
  background: rgba(255, 255, 255, 0.2);
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  border-radius: 25rpx;
  padding: 25rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15rpx;
  backdrop-filter: blur(10rpx);
}

.action-icon {
  font-size: 32rpx;
}

.action-text {
  color: #fff;
  font-size: 28rpx;
}

/* 调试信息 */
.debug-info {
  background: rgba(0, 0, 0, 0.7);
  border-radius: 15rpx;
  padding: 30rpx;
  margin-top: 40rpx;
}

.debug-title {
  display: block;
  font-size: 28rpx;
  color: #fff;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.debug-item {
  display: block;
  font-size: 24rpx;
  color: #ccc;
  margin-bottom: 8rpx;
}
</style>