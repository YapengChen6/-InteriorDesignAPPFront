<!-- components/pdf-viewer/pdf-viewer.vue -->
<template>
  <view class="pdf-viewer">
    <!-- 顶部控制栏 -->
    <view class="control-bar">
      <button class="btn" @tap="prevPage" :disabled="currentPage <= 1">‹ 上一页</button>
      <text class="page-info">第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</text>
      <button class="btn" @tap="nextPage" :disabled="currentPage >= totalPages">下一页 ›</button>
    </view>

    <!-- PDF 页面容器 -->
    <scroll-view class="pdf-container" scroll-y :scroll-top="scrollTop">
      <view 
        v-for="page in renderedPages" 
        :key="page.pageNumber"
        class="page-wrapper"
      >
        <canvas 
          :id="'pdf-canvas-' + page.pageNumber"
          class="pdf-canvas"
          :style="{
            width: page.width + 'px',
            height: page.height + 'px'
          }"
        ></canvas>
      </view>
    </scroll-view>

    <!-- 底部缩放控制 -->
    <view class="zoom-controls">
      <button class="zoom-btn" @tap="zoomOut" :disabled="scale <= 0.5">－</button>
      <text class="zoom-info">{{ Math.round(scale * 100) }}%</text>
      <button class="zoom-btn" @tap="zoomIn" :disabled="scale >= 3">＋</button>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-mask">
      <view class="loading-content">
        <text class="loading-text">加载PDF中...</text>
      </view>
    </view>

    <!-- 错误状态 -->
    <view v-if="error" class="error-mask">
      <view class="error-content">
        <text class="error-text">{{ error }}</text>
        <button class="retry-btn" @tap="loadPdf">重试</button>
      </view>
    </view>
  </view>
</template>

<script>
// 引入安装的 pdfjs-dist
const pdfjsLib = require('pdfjs-dist');

// 设置 worker 路径（重要！）
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js';

export default {
  name: 'pdf-viewer',
  props: {
    // PDF 文件 URL
    src: {
      type: String,
      required: true
    },
    // 初始缩放比例
    initialScale: {
      type: Number,
      default: 1.2
    }
  },
  data() {
    return {
      pdfDoc: null,
      currentPage: 1,
      totalPages: 0,
      scale: this.initialScale,
      renderedPages: [],
      loading: false,
      error: '',
      scrollTop: 0
    };
  },
  watch: {
    src: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.loadPdf();
        }
      }
    }
  },
  methods: {
    // 加载 PDF 文档
    async loadPdf() {
      this.loading = true;
      this.error = '';
      this.renderedPages = [];
      
      try {
        console.log('开始加载PDF:', this.src);
        
        // 使用您的预览接口
        const pdfUrl = `/api/media/preview?fileUrl=${encodeURIComponent(this.src)}`;
        
        // 加载 PDF 文档
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        this.pdfDoc = await loadingTask.promise;
        this.totalPages = this.pdfDoc.numPages;
        
        console.log(`PDF加载成功，共 ${this.totalPages} 页`);
        
        // 渲染第一页
        await this.renderPage(1);
        
        this.$emit('loaded', {
          totalPages: this.totalPages,
          pdfDoc: this.pdfDoc
        });
        
      } catch (error) {
        console.error('PDF 加载失败:', error);
        this.error = this.getErrorMessage(error);
        this.$emit('error', error);
      } finally {
        this.loading = false;
      }
    },

    // 渲染指定页面
    async renderPage(pageNumber) {
      if (!this.pdfDoc || pageNumber < 1 || pageNumber > this.totalPages) {
        return;
      }

      try {
        const page = await this.pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: this.scale });
        
        // 等待 DOM 更新
        await this.$nextTick();
        
        // 获取 canvas 上下文
        const canvasInfo = await this.getCanvasContext(pageNumber);
        if (!canvasInfo) {
          console.warn(`Canvas #pdf-canvas-${pageNumber} 未找到`);
          return;
        }

        const { node: canvas, ctx } = canvasInfo;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // 渲染页面
        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };

        await page.render(renderContext).promise;
        
        // 记录已渲染的页面
        if (!this.renderedPages.find(p => p.pageNumber === pageNumber)) {
          this.renderedPages.push({
            pageNumber,
            width: viewport.width,
            height: viewport.height
          });
        }

        console.log(`第 ${pageNumber} 页渲染完成`);
        
      } catch (error) {
        console.error(`渲染第 ${pageNumber} 页失败:`, error);
      }
    },

    // 获取 Canvas 上下文（uni-app 方式）
    getCanvasContext(pageNumber) {
      return new Promise((resolve) => {
        // 使用 this.$scope 确保在正确的组件上下文中查询
        const query = uni.createSelectorQuery().in(this.$scope || this);
        query.select(`#pdf-canvas-${pageNumber}`).fields({
          node: true,
          size: true
        }).exec((res) => {
          if (res && res[0] && res[0].node) {
            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');
            resolve({ node: canvas, ctx });
          } else {
            // 如果没找到，延迟重试
            setTimeout(() => {
              this.getCanvasContext(pageNumber).then(resolve);
            }, 100);
          }
        });
      });
    },

    // 上一页
    async prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        await this.renderPage(this.currentPage);
        this.scrollToPage(this.currentPage);
        this.$emit('page-change', this.currentPage);
      }
    },

    // 下一页
    async nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        await this.renderPage(this.currentPage);
        this.scrollToPage(this.currentPage);
        this.$emit('page-change', this.currentPage);
      }
    },

    // 放大
    async zoomIn() {
      if (this.scale < 3) {
        this.scale += 0.2;
        await this.rerenderCurrentPage();
      }
    },

    // 缩小
    async zoomOut() {
      if (this.scale > 0.5) {
        this.scale -= 0.2;
        await this.rerenderCurrentPage();
      }
    },

    // 重新渲染当前页（缩放时使用）
    async rerenderCurrentPage() {
      // 移除当前页的渲染记录
      this.renderedPages = this.renderedPages.filter(p => p.pageNumber !== this.currentPage);
      await this.renderPage(this.currentPage);
      this.scrollToPage(this.currentPage);
    },

    // 滚动到指定页面
    scrollToPage(pageNumber) {
      this.$nextTick(() => {
        const query = uni.createSelectorQuery().in(this.$scope || this);
        query.select(`#pdf-canvas-${pageNumber}`).boundingClientRect();
        query.select('.pdf-container').boundingClientRect();
        query.exec((res) => {
          if (res[0] && res[1]) {
            const pageRect = res[0];
            const containerRect = res[1];
            this.scrollTop = pageRect.top - containerRect.top + this.scrollTop;
          }
        });
      });
    },

    // 跳转到指定页面
    gotoPage(pageNumber) {
      if (pageNumber >= 1 && pageNumber <= this.totalPages) {
        this.currentPage = pageNumber;
        this.renderPage(pageNumber);
        this.scrollToPage(pageNumber);
        this.$emit('page-change', pageNumber);
      }
    },

    // 获取错误信息
    getErrorMessage(error) {
      if (error.name === 'PasswordException') {
        return 'PDF文件受密码保护';
      } else if (error.name === 'InvalidPDFException') {
        return '无效的PDF文件';
      } else if (error.message.includes('NetworkError')) {
        return '网络错误，请检查PDF链接';
      } else {
        return `加载失败: ${error.message || '未知错误'}`;
      }
    }
  }
};
</script>

<style scoped>
.pdf-viewer {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.control-bar {
  padding: 20rpx;
  background: white;
  border-bottom: 1rpx solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.btn {
  padding: 16rpx 24rpx;
  font-size: 26rpx;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 8rpx;
  min-width: 120rpx;
}

.btn:disabled {
  background: #cccccc;
  color: #666666;
}

.page-info {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.pdf-container {
  flex: 1;
  background: white;
}

.page-wrapper {
  display: flex;
  justify-content: center;
  padding: 30rpx 0;
}

.pdf-canvas {
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
  border: 1rpx solid #e0e0e0;
  border-radius: 8rpx;
}

.zoom-controls {
  padding: 20rpx;
  background: white;
  border-top: 1rpx solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30rpx;
}

.zoom-btn {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: #007AFF;
  color: white;
  border: none;
  font-size: 32rpx;
  font-weight: bold;
}

.zoom-btn:disabled {
  background: #cccccc;
}

.zoom-info {
  font-size: 26rpx;
  color: #333;
  min-width: 100rpx;
  text-align: center;
}

.loading-mask, .error-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content, .error-content {
  text-align: center;
  padding: 60rpx;
  background: white;
  border-radius: 16rpx;
  box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.1);
}

.loading-text {
  font-size: 28rpx;
  color: #666;
}

.error-text {
  font-size: 28rpx;
  color: #dc3545;
  display: block;
  margin-bottom: 30rpx;
}

.retry-btn {
  padding: 20rpx 40rpx;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 8rpx;
  font-size: 26rpx;
}
</style>