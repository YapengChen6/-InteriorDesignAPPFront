<template>
  <view class="container">
    <view class="header">
      <text class="header-title">🔄 图片上传测试 - 完整版</text>
      <text class="header-subtitle">支持图片预览和URL提取</text>
    </view>

    <view class="content">
      <!-- 连接测试区域 -->
      <view class="section">
        <view class="section-title">🔗 服务连接测试</view>
        <view class="test-buttons">
          <button class="test-btn" @tap="testConnection('media')">媒体接口测试</button>
          <button class="test-btn" @tap="testConnection('test')">测试接口测试</button>
          <button class="test-btn" @tap="testAllConnections">全部测试</button>
        </view>
        <view class="selected-files">
          <view v-for="(status, index) in connectionStatus" :key="index" :class="['status', status.type]">
            {{ status.message }}
          </view>
        </view>
      </view>

      <!-- 文件上传区域 -->
      <view class="section">
        <view class="section-title">📤 文件上传配置</view>

        <view class="form-group">
          <text class="label">选择上传接口:</text>
          <picker @change="onApiUrlChange" :value="apiUrlIndex" :range="apiUrls" range-key="name">
            <view class="picker">{{ apiUrls[apiUrlIndex].name }}</view>
          </picker>
        </view>

        <view class="form-group" v-if="showParams">
          <text class="label">接口参数:</text>
          <view class="params-grid">
            <input type="number" v-model="relatedType" placeholder="关联类型" class="param-input" />
            <input type="number" v-model="relatedId" placeholder="关联ID" class="param-input" />
          </view>
          <input type="text" v-model="description" placeholder="描述（可选）" class="description-input" />
        </view>

        <view class="file-input-container">
          <button class="file-input-btn" @tap="chooseImage">
            📁 点击选择图片<br>
            <text class="small-text">支持图片文件，最大10MB</text>
          </button>
        </view>

        <view class="selected-files">
          {{ selectedFileInfo || '未选择文件' }}
        </view>

        <!-- 图片预览区域 -->
        <view class="image-preview-section" v-if="uploadedImageUrl">
          <view class="section-title">🖼️ 上传结果预览</view>
          <view class="image-preview">
            <image :src="uploadedImageUrl" mode="aspectFit" class="preview-image" @tap="previewImage"></image>
            <view class="image-info">
              <text class="info-label">图片URL:</text>
              <text class="info-value url-text" @tap="copyUrl">{{ uploadedImageUrl }}</text>
              <text class="info-label">文件名:</text>
              <text class="info-value">{{ uploadedImageInfo.filename }}</text>
              <text class="info-label">文件大小:</text>
              <text class="info-value">{{ uploadedImageInfo.size }} bytes</text>
            </view>
          </view>
        </view>

        <view class="buttons">
          <button class="btn btn-primary" @tap="uploadFile">
            🚀 开始上传
          </button>
          <button class="btn btn-secondary" @tap="clearLogs">
            🗑️ 清空日志
          </button>
          <button class="btn btn-info" @tap="testMaterialSupplierAPI">
            🧪 测试供应商API
          </button>
        </view>
      </view>

      <!-- 响应信息区域 -->
      <view class="section response-section">
        <view class="section-title">📋 请求日志</view>
        <scroll-view class="response-content" scroll-y="true">
          <view v-for="(entry, index) in logEntries" :key="index" :class="['log-entry', entry.class]">
            <text class="timestamp">[{{ entry.timestamp }}]</text> {{ entry.message }}
          </view>
        </scroll-view>
      </view>

      <!-- 加载动画 -->
      <view class="loading" v-if="loading">
        <view class="spinner"></view>
        <text>处理中，请稍候...</text>
      </view>
    </view>
  </view>
</template>

<script>
import * as api from '@/api/join.js'

export default {
  data() {
    return {
      apiUrls: [
        { name: '媒体接口 (需要参数)', value: '/api/media/upload' },
        { name: '媒体简化接口', value: '/api/media/upload-simple' },
        { name: '测试接口', value: '/test/upload' }
      ],
      apiUrlIndex: 0,
      relatedType: 1,
      relatedId: 123,
      description: '',
      selectedFile: null,
      selectedFileInfo: '',
      uploadedImageUrl: '',
      uploadedImageInfo: {},
      logEntries: [],
      connectionStatus: [],
      loading: false
    }
  },
  computed: {
    showParams() {
      return this.apiUrls[this.apiUrlIndex].value === '/api/media/upload';
    }
  },
  onLoad() {
    this.addLog('页面加载完成', 'info');
    this.addLog('API模块加载成功', 'success');
  },
  methods: {
    onApiUrlChange(e) {
      this.apiUrlIndex = parseInt(e.detail.value);
    },
    
    chooseImage() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.selectedFile = res.tempFiles[0];
          this.selectedFileInfo = `已选择文件:\n文件名: ${this.selectedFile.name}\n大小: ${api.formatFileSize(this.selectedFile.size)}`;
          this.addLog(`选择了文件: ${this.selectedFile.name} (${api.formatFileSize(this.selectedFile.size)})`, 'success');
          
          // 清空之前的预览
          this.uploadedImageUrl = '';
          this.uploadedImageInfo = {};
        },
        fail: (err) => {
          this.addLog(`选择文件失败: ${err.errMsg}`, 'error');
        }
      });
    },
    
    async testConnection(type) {
      this.addLog(`测试 ${type} 接口连接...`, 'info');
      this.loading = true;

      try {
        const result = await api.testConnection(type);
        this.loading = false;

        if (result.success) {
          this.addLog(`✅ ${result.name} 连接成功`, 'success');
          this.updateConnectionStatus(`${result.name}: ✅ 正常`, 'success');
        } else {
          this.addLog(`❌ ${result.name} 连接失败`, 'error');
          this.updateConnectionStatus(`${result.name}: ❌ 失败`, 'error');
        }
      } catch (error) {
        this.loading = false;
        this.addLog(`❌ 连接测试失败: ${error.message}`, 'error');
        this.updateConnectionStatus(`${type}接口: ❌ 网络错误`, 'error');
      }
    },
    
    async testAllConnections() {
      this.addLog('开始测试所有服务连接...', 'info');
      this.connectionStatus = [];
      
      await this.testConnection('media');
      await this.testConnection('test');
    },
    
    async uploadFile() {
      if (!this.selectedFile) {
        this.addLog('❌ 请先选择要上传的文件', 'error');
        return;
      }

      const apiUrl = this.apiUrls[this.apiUrlIndex].value;

      this.addLog(`开始上传到: ${apiUrl}`, 'info');
      this.addLog(`文件: ${this.selectedFile.name} (${api.formatFileSize(this.selectedFile.size)})`, 'info');
      this.loading = true;

      try {
        const uploadConfig = {
          file: this.selectedFile,
          apiUrl: apiUrl,
          relatedType: this.relatedType,
          relatedId: this.relatedId,
          description: this.description
        };

        const result = await api.uploadFileTest(uploadConfig);
        this.loading = false;

        if (result.success) {
          this.addLog(`✅ 上传成功`, 'success');
          this.addLog(`图片URL: ${result.imageUrl}`, 'success');
          this.addLog(`文件信息: ${JSON.stringify(result.imageInfo, null, 2)}`, 'info');
          
          // 显示上传的图片和URL
          this.uploadedImageUrl = result.imageUrl;
          this.uploadedImageInfo = result.imageInfo;
          
          this.addLog(`🖼️ 图片预览已更新`, 'success');
        } else {
          this.addLog(`❌ 上传失败: ${result.message}`, 'error');
        }
      } catch (error) {
        this.loading = false;
        this.addLog(`❌ 上传请求失败: ${error.message}`, 'error');
      }
    },
    
    async testMaterialSupplierAPI() {
      this.addLog('🧪 开始测试物料供应商API...', 'info');
      this.loading = true;

      try {
        // 测试获取申请列表
        const result = await api.getApplicationList({ page: 1, size: 5 });
        this.loading = false;
        
        if (result.code === 200) {
          this.addLog('✅ 物料供应商API测试成功', 'success');
          this.addLog(`获取到 ${result.data.length} 条申请记录`, 'info');
        } else {
          this.addLog(`❌ 物料供应商API测试失败: ${result.msg}`, 'error');
        }
      } catch (error) {
        this.loading = false;
        this.addLog(`❌ 物料供应商API测试异常: ${error.message}`, 'error');
      }
    },
    
    // 预览图片
    previewImage() {
      if (this.uploadedImageUrl) {
        uni.previewImage({
          urls: [this.uploadedImageUrl],
          current: 0
        });
      }
    },
    
    // 复制URL
    copyUrl() {
      if (this.uploadedImageUrl) {
        uni.setClipboardData({
          data: this.uploadedImageUrl,
          success: () => {
            uni.showToast({
              title: 'URL已复制',
              icon: 'success'
            });
          }
        });
      }
    },
    
    addLog(message, type = 'info') {
      const timestamp = api.getCurrentTimestamp();
      const typeClass = `status-${type}`;

      const logEntry = {
        timestamp,
        message,
        type,
        class: typeClass
      };

      this.logEntries.unshift(logEntry);
      
      // 限制日志条目数量
      if (this.logEntries.length > 50) {
        this.logEntries = this.logEntries.slice(0, 50);
      }
    },
    
    updateConnectionStatus(message, type) {
      this.connectionStatus.unshift({
        message,
        type,
        timestamp: api.getCurrentTimestamp()
      });
    },
    
    clearLogs() {
      this.logEntries = [];
      this.uploadedImageUrl = '';
      this.uploadedImageInfo = {};
      this.addLog('日志和预览已清空', 'info');
    }
  }
}
</script>

<style>
/* 基础样式保持不变，只添加新的样式 */

.container {
  padding: 20rpx;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.content {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 20rpx;
  box-shadow: 0 10rpx 30rpx rgba(0,0,0,0.2);
  overflow: hidden;
}

.header {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  padding: 40rpx;
  text-align: center;
}

.header-title {
  font-size: 36rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 10rpx;
}

.header-subtitle {
  font-size: 24rpx;
  display: block;
}

.section {
  background: #f8f9fa;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  border: 1px solid #e9ecef;
}

.section-title {
  color: #495057;
  margin-bottom: 20rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.form-group {
  margin-bottom: 30rpx;
}

.label {
  display: block;
  margin-bottom: 10rpx;
  font-weight: 500;
  color: #495057;
  font-size: 28rpx;
}

.picker {
  width: 100%;
  padding: 16rpx 24rpx;
  border: 2px solid #e9ecef;
  border-radius: 10rpx;
  font-size: 28rpx;
  background: white;
}

.params-grid {
  display: flex;
  gap: 20rpx;
  margin-bottom: 10rpx;
}

.param-input, .description-input {
  flex: 1;
  padding: 16rpx 24rpx;
  border: 2px solid #e9ecef;
  border-radius: 10rpx;
  font-size: 28rpx;
}

.file-input-container {
  margin: 30rpx 0;
}

.file-input-btn {
  display: block;
  padding: 40rpx;
  background: white;
  border: 2px dashed #4facfe;
  border-radius: 16rpx;
  text-align: center;
  color: #4facfe;
  font-weight: 600;
  width: 100%;
}

.file-input-btn:active {
  background: #f0f8ff;
  border-color: #2196f3;
}

.small-text {
  font-size: 24rpx;
  font-weight: normal;
}

.selected-files {
  margin-top: 20rpx;
  font-size: 24rpx;
  color: #6c757d;
  background: white;
  padding: 16rpx;
  border-radius: 8rpx;
  border: 1px solid #e9ecef;
  white-space: pre-line;
}

/* 图片预览区域样式 */
.image-preview-section {
  margin-top: 30rpx;
  padding: 20rpx;
  background: white;
  border-radius: 12rpx;
  border: 2px solid #e9ecef;
}

.image-preview {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.preview-image {
  width: 100%;
  height: 300rpx;
  border-radius: 8rpx;
  background: #f8f9fa;
}

.image-info {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.info-label {
  font-weight: 600;
  color: #495057;
  font-size: 24rpx;
}

.info-value {
  color: #6c757d;
  font-size: 24rpx;
  word-break: break-all;
}

.url-text {
  color: #007bff;
  text-decoration: underline;
  cursor: pointer;
}

.buttons {
  display: flex;
  gap: 20rpx;
  margin: 40rpx 0;
}

.btn {
  flex: 1;
  padding: 24rpx;
  border: none;
  border-radius: 10rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.btn-primary {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.btn-primary:active {
  transform: translateY(-4rpx);
  box-shadow: 0 10rpx 30rpx rgba(79, 172, 254, 0.4);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:active {
  background: #5a6268;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:active {
  background: #138496;
}

.response-section {
  margin-top: 40rpx;
}

.response-content {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 10rpx;
  padding: 30rpx;
  font-family: 'Courier New', monospace;
  font-size: 24rpx;
  max-height: 600rpx;
  white-space: pre-wrap;
  word-break: break-all;
}

.loading {
  text-align: center;
  padding: 40rpx;
  color: #4facfe;
}

.spinner {
  border: 6rpx solid #f3f3f3;
  border-top: 6rpx solid #4facfe;
  border-radius: 50%;
  width: 60rpx;
  height: 60rpx;
  animation: spin 1s linear infinite;
  margin: 0 auto 20rpx;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.test-buttons {
  display: flex;
  gap: 16rpx;
  margin: 30rpx 0;
}

.test-btn {
  flex: 1;
  padding: 16rpx;
  font-size: 24rpx;
  background: #e9ecef;
  border: 1px solid #dee2e6;
  border-radius: 8rpx;
}

.test-btn:active {
  background: #dee2e6;
}

.log-entry {
  margin-bottom: 10rpx;
  padding: 6rpx 0;
  border-bottom: 1px solid #eee;
}

.timestamp {
  color: #6c757d;
  font-size: 20rpx;
}

.status-success {
  color: #28a745;
}

.status-error {
  color: #dc3545;
}

.status-info {
  color: #17a2b8;
}
</style>