<template>
  <view 
    class="online-status-indicator" 
    v-if="showStatus"
    :aria-label="ariaLabel"
    @tap="handleClick"
  >
    <view 
      class="status-dot" 
      :class="statusClasses"
      role="img"
      :aria-label="statusText"
    ></view>
    <text v-if="showText" class="status-text">
      {{ statusText }}
    </text>
  </view>
</template>

<script>
/**
 * OnlineStatusIndicator 在线状态指示器组件
 * @description 显示用户在线/离线状态的可复用组件
 * @property {Boolean} isOnline 是否在线
 * @property {Boolean} showText 是否显示文字
 * @property {Boolean} showStatus 是否显示状态指示器
 * @property {Boolean} enableAnimation 是否启用动画效果
 * @property {String} size 指示器大小 small|medium|large
 * @property {String} theme 主题色彩 default|success|warning
 */
export default {
  name: 'OnlineStatusIndicator',
  props: {
    isOnline: {
      type: Boolean,
      default: false
    },
    showText: {
      type: Boolean,
      default: false
    },
    showStatus: {
      type: Boolean,
      default: true
    },
    enableAnimation: {
      type: Boolean,
      default: true
    },
    size: {
      type: String,
      default: 'medium',
      validator: function (value) {
        return ['small', 'medium', 'large'].indexOf(value) !== -1
      }
    },
    theme: {
      type: String,
      default: 'default',
      validator: function (value) {
        return ['default', 'success', 'warning'].indexOf(value) !== -1
      }
    }
  },
  data() {
    return {
      previousOnlineState: this.isOnline,
      isStatusChanging: false
    }
  },
  computed: {
    statusClasses() {
      return {
        online: this.isOnline,
        offline: !this.isOnline,
        'with-animation': this.enableAnimation,
        'status-change': this.isStatusChanging,
        [`size-${this.size}`]: true,
        [`theme-${this.theme}`]: true
      }
    },
    statusText() {
      return this.isOnline ? '在线' : '离线'
    },
    ariaLabel() {
      return `用户状态: ${this.statusText}`
    }
  },
  watch: {
    isOnline(newValue, oldValue) {
      if (newValue !== oldValue) {
        this.triggerStatusChangeAnimation()
      }
      this.previousOnlineState = oldValue
    }
  },
  methods: {
    triggerStatusChangeAnimation() {
      if (!this.enableAnimation) return
      
      this.isStatusChanging = true
      setTimeout(() => {
        this.isStatusChanging = false
      }, 400)
    },
    
    handleClick() {
      this.$emit('click', {
        isOnline: this.isOnline,
        userId: this.userId
      })
    }
  },
  mounted() {
    // 初始化时的入场动画
    if (this.enableAnimation) {
      this.$nextTick(() => {
        this.triggerStatusChangeAnimation()
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.online-status-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
}

.status-dot {
  border-radius: 50%;
  position: relative;
  display: inline-block;
  
  // 默认中等尺寸
  &.size-small {
    width: 6px;
    height: 6px;
  }
  
  &.size-medium {
    width: 8px;
    height: 8px;
  }
  
  &.size-large {
    width: 10px;
    height: 10px;
  }
  
  // 在线状态 - 绿色指示器
  &.online {
    background-color: #52c41a;
    box-shadow: 0 0 0 1px #fff, 0 0 0 2px rgba(82, 196, 26, 0.2);
    
    // 在线状态的呼吸动画
    &.with-animation {
      animation: pulse 2s infinite ease-in-out;
    }
    
    // 在线状态的光晕效果
    &::after {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(82, 196, 26, 0.3) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    &.with-animation::after {
      animation: glow 2s infinite ease-in-out;
    }
  }
  
  // 离线状态 - 灰色指示器
  &.offline {
    background-color: #d9d9d9;
    box-shadow: 0 0 0 1px #fff;
    
    // 离线状态的淡入淡出效果
    &.with-animation {
      opacity: 0.7;
      transition: opacity 0.3s ease-in-out;
    }
  }
  
  // 状态切换的平滑动画
  &.with-animation {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    // 悬停效果
    &:hover {
      transform: scale(1.15);
      cursor: pointer;
    }
  }
  
  // 状态切换时的弹性动画
  &.status-change {
    animation: statusChange 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
}

.status-text {
  font-size: 12px;
  font-weight: 500;
  color: #666;
  transition: color 0.3s ease;
  user-select: none;
  
  // 在线状态文字颜色
  .online-status-indicator:has(.status-dot.online) & {
    color: #52c41a;
  }
  
  // 离线状态文字颜色
  .online-status-indicator:has(.status-dot.offline) & {
    color: #999;
  }
  
  // 文字动画效果
  .status-dot.with-animation ~ & {
    transition: all 0.3s ease;
  }
}

// 在线状态的呼吸动画
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.85;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

// 光晕动画
@keyframes glow {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
  100% {
    opacity: 0;
    transform: scale(1.4);
  }
}

// 状态切换动画
@keyframes statusChange {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .online-status-indicator {
    gap: 3px;
  }
  
  .status-text {
    font-size: 11px;
  }
  
  .status-dot {
    &.size-small {
      width: 5px;
      height: 5px;
    }
    
    &.size-medium {
      width: 7px;
      height: 7px;
    }
    
    &.size-large {
      width: 9px;
      height: 9px;
    }
  }
}

// 高对比度模式支持
@media (prefers-contrast: high) {
  .status-dot {
    &.online {
      background-color: #00aa00;
      box-shadow: 0 0 0 2px #fff, 0 0 0 3px #00aa00;
    }
    
    &.offline {
      background-color: #666;
      box-shadow: 0 0 0 2px #fff, 0 0 0 3px #666;
    }
  }
}

// 减少动画模式支持
@media (prefers-reduced-motion: reduce) {
  .status-dot {
    &.with-animation {
      animation: none !important;
      transition: none !important;
    }
    
    &.with-animation::after {
      animation: none !important;
    }
  }
  
  .status-text {
    transition: none !important;
  }
}
</style>