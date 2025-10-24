<template>
  <view class="container">
    <view class="content">
      <view class="text-editor">
        <view class="section-label">新昵称</view>
        <input 
          type="text" 
          class="editor-input"
          v-model="editForm.nickName" 
          placeholder="请输入新昵称"
          placeholder-class="placeholder"
          maxlength="20"
          confirm-type="done"
          @focus="onInputFocus"
          @blur="onInputBlur"
        />
        <view class="char-count">{{ editForm.nickName.length }}/20</view>
      </view>
    </view>
    
    <view class="submit-btn-container">
      <view class="submit-btn" @tap="saveNickName" :class="{ disabled: !editForm.nickName.trim() }">提交</view>
    </view>
  </view>
</template>

<script>
  import { getUserProfile, updateUserProfile } from "@/api/users.js"

  export default {
    data() {
      return {
        editForm: {
        nickName: ''
        }
      }
    },
    onLoad() {
      this.getUser()
    },
    methods: {
      getUser() {
        getUserProfile().then(response => {
          this.editForm.nickName = response.data.nickName
        }).catch(error => {
          console.error('获取用户信息失败:', error)
          uni.showToast({
            title: '获取用户信息失败',
            icon: 'none'
          })
        })
      },
      onInputFocus() {
        // 输入框获取焦点时的处理（如有需要）
        console.log('输入框获取焦点')
      },
      onInputBlur() {
        // 输入框失去焦点时的处理（如有需要）
        console.log('输入框失去焦点')
      },
      saveNickName() {
        if (!this.editForm.nickName.trim()) {
          uni.showToast({
            title: '请输入昵称',
            icon: 'none'
          })
          return
        }
        
        if (this.editForm.nickName.length < 2) {
          uni.showToast({
            title: '昵称至少2个字符',
            icon: 'none'
          })
          return
        }
        
        uni.showLoading({
          title: '提交中...'
        })
        
        updateUserProfile({
          nickName: this.editForm.nickName
        }).then(response => {
          uni.hideLoading()
          
          // 更新全局用户信息
          const app = getApp()
          if (app.globalData.userInfo) {
            app.globalData.userInfo.nickName = this.editForm.nickName
          }
          
          uni.showToast({
            title: '昵称修改成功',
            icon: 'success'
          })
          
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        }).catch(error => {
          uni.hideLoading()
          console.error('提交昵称失败:', error)
          uni.showToast({
            title: '提交失败',
            icon: 'none'
          })
        })
      }
    }
  }
</script>

<style lang="scss">
  .container {
    background-color: #f5f7fa;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  .content {
    padding: 40rpx;
    flex: 1;
  }
  
  .text-editor {
    background: white;
    border-radius: 16rpx;
    padding: 32rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
    position: relative;
  }
  
  .section-label {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 24rpx;
  }
  
  .editor-input {
    width: 100%;
    min-height: 120rpx;
    padding: 20rpx;
    border: 1rpx solid #e0e0e0;
    border-radius: 12rpx;
    font-size: 32rpx;
    background: #fafafa;
    box-sizing: border-box;
    line-height: 1.5;
  }
  
  .editor-input:focus {
    border-color: #07c160;
    background: white;
  }
  
  .placeholder {
    color: #cccccc;
    font-size: 32rpx;
  }
  
  .char-count {
    text-align: right;
    font-size: 24rpx;
    color: #999;
    margin-top: 16rpx;
  }
  
  .submit-btn-container {
    padding: 40rpx;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .submit-btn {
    width: 80%;
    height: 88rpx;
    background-color: #07c160;
    color: white;
    font-size: 32rpx;
    font-weight: 500;
    border-radius: 44rpx;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 4rpx 16rpx rgba(7, 193, 96, 0.3);
    transition: all 0.3s;
  }
  
  .submit-btn:active {
    background-color: #06a652;
    transform: scale(0.98);
  }
  
  .submit-btn.disabled {
    background-color: #cccccc;
    color: #999999;
    box-shadow: none;
  }
  
  .submit-btn.disabled:active {
    transform: none;
    background-color: #cccccc;
  }
</style>