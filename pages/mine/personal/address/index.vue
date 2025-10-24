<template>
  <view class="container">
    <view class="content">
      <view class="form-section">
        <!-- 所在地区 -->
        <view class="form-item">
          <view class="form-label">所在地区</view>
          <view class="picker-wrapper" @tap="showRegionPicker = true">
            <view class="picker-display">
              {{ addressForm.regionText || '请选择省市区' }}
            </view>
            <view class="picker-arrow">›</view>
          </view>
        </view>
        
        <!-- 详细地址 -->
        <view class="form-item">
          <view class="form-label">详细地址</view>
          <textarea 
            class="form-textarea"
            v-model="addressForm.detail" 
            placeholder="请输入详细地址（街道、楼号、门牌等）"
            placeholder-class="placeholder"
            maxlength="100"
            confirm-type="done"
            @focus="onTextareaFocus"
            @blur="onTextareaBlur"
          />
          <view class="char-count">{{ addressForm.detail.length }}/100</view>
        </view>
      </view>
      
      <!-- 提示信息 -->
      <view class="tip-section">
        <text class="tip-text">请填写详细的收货地址，确保商品能够准确送达</text>
      </view>
    </view>
    
    <!-- 地区选择器 -->
    <view class="region-picker" v-if="showRegionPicker">
      <view class="picker-mask" @tap="showRegionPicker = false"></view>
      <view class="picker-content">
        <view class="picker-header">
          <view class="picker-cancel" @tap="showRegionPicker = false">取消</view>
          <view class="picker-title">选择地区</view>
          <view class="picker-confirm" @tap="confirmRegion">确定</view>
        </view>
        <picker-view 
          class="picker-view" 
          :value="regionIndex" 
          @change="onRegionChange"
          indicator-style="height: 50px;"
        >
          <picker-view-column>
            <view class="picker-item" v-for="(province, index) in regionData" :key="index">
              {{ province.name }}
            </view>
          </picker-view-column>
          <picker-view-column>
            <view class="picker-item" v-for="(city, index) in cityList" :key="index">
              {{ city.name }}
            </view>
          </picker-view-column>
          <picker-view-column>
            <view class="picker-item" v-for="(district, index) in districtList" :key="index">
              {{ district.name }}
            </view>
          </picker-view-column>
        </picker-view>
      </view>
    </view>
    
    <!-- 提交按钮 -->
    <view class="submit-btn-container">
      <view 
        class="submit-btn" 
        @tap="saveAddress" 
        :class="{ disabled: !isFormValid }"
      >
        保存地址
      </view>
    </view>
  </view>
</template>

<script>
  import { getUserProfile, updateUserProfile } from "@/api/users.js"

  export default {
    data() {
      return {
        addressForm: {
          province: '',
          city: '',
          district: '',
          regionText: '',
          detail: ''
        },
        showRegionPicker: false,
        regionData: [], // 省市区数据
        regionIndex: [0, 0, 0], // 当前选择的省市区索引
        cityList: [], // 当前省份下的城市列表
        districtList: [] // 当前城市下的区县列表
      }
    },
    computed: {
      // 表单验证
      isFormValid() {
        return this.addressForm.regionText && this.addressForm.detail.trim()
      }
    },
    onLoad() {
      this.getUserAddress()
      this.loadRegionData()
    },
    methods: {
      // 获取用户地址信息
      getUserAddress() {
        getUserProfile().then(response => {
          const userData = response.data
          // 如果用户已有地址信息，解析并填充到表单中
          if (userData.address) {
            this.parseAddress(userData.address)
          }
        }).catch(error => {
          console.error('获取用户信息失败:', error)
          uni.showToast({
            title: '获取地址信息失败',
            icon: 'none'
          })
        })
      },
      
      // 解析地址字符串（假设地址格式为"省 市 区 详细地址"）
      parseAddress(addressStr) {
        if (!addressStr) return
        
        // 简单的地址解析逻辑，实际项目中可能需要更复杂的处理
        const parts = addressStr.split(' ')
        if (parts.length >= 4) {
          this.addressForm.province = parts[0]
          this.addressForm.city = parts[1]
          this.addressForm.district = parts[2]
          this.addressForm.regionText = `${parts[0]} ${parts[1]} ${parts[2]}`
          this.addressForm.detail = parts.slice(3).join(' ')
        } else {
          // 如果地址格式不符合预期，直接显示原地址
          this.addressForm.detail = addressStr
        }
      },
      
      // 加载省市区数据
      loadRegionData() {
        // 这里应该从API获取省市区数据
        // 为简化演示，使用模拟数据
        this.regionData = [
          {
            name: '北京市',
            cities: [
              {
                name: '北京市',
                districts: [
                  { name: '东城区' },
                  { name: '西城区' },
                  { name: '朝阳区' },
                  { name: '丰台区' },
                  { name: '石景山区' },
                  { name: '海淀区' },
                  { name: '门头沟区' },
                  { name: '房山区' },
                  { name: '通州区' },
                  { name: '顺义区' }
                ]
              }
            ]
          },
          {
            name: '上海市',
            cities: [
              {
                name: '上海市',
                districts: [
                  { name: '黄浦区' },
                  { name: '徐汇区' },
                  { name: '长宁区' },
                  { name: '静安区' },
                  { name: '普陀区' },
                  { name: '虹口区' },
                  { name: '杨浦区' },
                  { name: '闵行区' },
                  { name: '宝山区' },
                  { name: '嘉定区' }
                ]
              }
            ]
          },
          {
            name: '广东省',
            cities: [
              {
                name: '广州市',
                districts: [
                  { name: '荔湾区' },
                  { name: '越秀区' },
                  { name: '海珠区' },
                  { name: '天河区' },
                  { name: '白云区' },
                  { name: '黄埔区' },
                  { name: '番禺区' },
                  { name: '花都区' },
                  { name: '南沙区' },
                  { name: '从化区' }
                ]
              },
              {
                name: '深圳市',
                districts: [
                  { name: '罗湖区' },
                  { name: '福田区' },
                  { name: '南山区' },
                  { name: '宝安区' },
                  { name: '龙岗区' },
                  { name: '盐田区' },
                  { name: '龙华区' },
                  { name: '坪山区' },
                  { name: '光明区' }
                ]
              }
            ]
          },
          {
            name: '浙江省',
            cities: [
              {
                name: '杭州市',
                districts: [
                  { name: '上城区' },
                  { name: '下城区' },
                  { name: '江干区' },
                  { name: '拱墅区' },
                  { name: '西湖区' },
                  { name: '滨江区' },
                  { name: '萧山区' },
                  { name: '余杭区' },
                  { name: '富阳区' },
                  { name: '临安区' }
                ]
              },
              {
                name: '宁波市',
                districts: [
                  { name: '海曙区' },
                  { name: '江北区' },
                  { name: '北仑区' },
                  { name: '镇海区' },
                  { name: '鄞州区' },
                  { name: '奉化区' },
                  { name: '余姚市' },
                  { name: '慈溪市' }
                ]
              }
            ]
          }
        ]
        
        // 初始化城市和区县列表
        this.cityList = this.regionData[0].cities
        this.districtList = this.cityList[0].districts
        
        // 如果已有地址信息，设置地区选择器初始位置
        this.setRegionPickerInitial()
      },
      
      // 设置地区选择器初始位置
      setRegionPickerInitial() {
        if (!this.addressForm.province) return
        
        // 根据当前地址信息设置地区选择器的初始位置
        for (let i = 0; i < this.regionData.length; i++) {
          if (this.regionData[i].name === this.addressForm.province) {
            for (let j = 0; j < this.regionData[i].cities.length; j++) {
              if (this.regionData[i].cities[j].name === this.addressForm.city) {
                for (let k = 0; k < this.regionData[i].cities[j].districts.length; k++) {
                  if (this.regionData[i].cities[j].districts[k].name === this.addressForm.district) {
                    this.regionIndex = [i, j, k]
                    this.cityList = this.regionData[i].cities
                    this.districtList = this.cityList[j].districts
                    return
                  }
                }
              }
            }
          }
        }
      },
      
      // 地区选择器变化
      onRegionChange(e) {
        const value = e.detail.value
        this.regionIndex = value
        
        // 更新城市列表
        this.cityList = this.regionData[value[0]].cities
        
        // 更新区县列表
        this.districtList = this.cityList[value[1]].districts
      },
      
      // 确认地区选择
      confirmRegion() {
        const provinceIndex = this.regionIndex[0]
        const cityIndex = this.regionIndex[1]
        const districtIndex = this.regionIndex[2]
        
        const province = this.regionData[provinceIndex].name
        const city = this.cityList[cityIndex].name
        const district = this.districtList[districtIndex].name
        
        this.addressForm.province = province
        this.addressForm.city = city
        this.addressForm.district = district
        this.addressForm.regionText = `${province} ${city} ${district}`
        
        this.showRegionPicker = false
      },
      
      // 文本域获取焦点
      onTextareaFocus() {
        console.log('文本域获取焦点')
      },
      
      // 文本域失去焦点
      onTextareaBlur() {
        console.log('文本域失去焦点')
      },
      
      // 保存地址
      saveAddress() {
        if (!this.isFormValid) {
          uni.showToast({
            title: '请填写完整的地址信息',
            icon: 'none'
          })
          return
        }
        
        uni.showLoading({
          title: '保存中...'
        })
        
        // 构建完整的地址字符串
        const fullAddress = `${this.addressForm.province} ${this.addressForm.city} ${this.addressForm.district} ${this.addressForm.detail}`
        
        updateUserProfile({
          address: fullAddress
        }).then(response => {
          uni.hideLoading()
          
          // 更新全局用户信息
          const app = getApp()
          if (app.globalData.userInfo) {
            app.globalData.userInfo.address = fullAddress
          }
          
          uni.showToast({
            title: '地址保存成功',
            icon: 'success'
          })
          
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        }).catch(error => {
          uni.hideLoading()
          console.error('保存地址失败:', error)
          uni.showToast({
            title: '保存失败',
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
    padding: 30rpx;
    flex: 1;
  }
  
  .form-section {
    background: white;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
    margin-bottom: 30rpx;
  }
  
  .form-item {
    padding: 32rpx;
    border-bottom: 1rpx solid #f0f0f0;
    display: flex;
    align-items: center;
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .form-label {
    width: 180rpx;
    font-size: 32rpx;
    color: #333;
    font-weight: 500;
    flex-shrink: 0;
  }
  
  .form-textarea {
    flex: 1;
    min-height: 120rpx;
    padding: 20rpx;
    border: 1rpx solid #e0e0e0;
    border-radius: 12rpx;
    font-size: 32rpx;
    background: #fafafa;
    box-sizing: border-box;
    line-height: 1.5;
    color: #333;
  }
  
  .form-textarea:focus {
    border-color: #07c160;
    background: white;
  }
  
  .picker-wrapper {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20rpx 0;
  }
  
  .picker-display {
    font-size: 32rpx;
    color: #333;
  }
  
  .picker-arrow {
    font-size: 36rpx;
    color: #999;
    transform: rotate(90deg);
  }
  
  .char-count {
    text-align: right;
    font-size: 24rpx;
    color: #999;
    margin-top: 16rpx;
  }
  
  .placeholder {
    color: #cccccc;
    font-size: 32rpx;
  }
  
  .tip-section {
    padding: 20rpx;
    text-align: center;
  }
  
  .tip-text {
    font-size: 26rpx;
    color: #999;
  }
  
  .region-picker {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999;
  }
  
  .picker-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
  }
  
  .picker-content {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-top-left-radius: 20rpx;
    border-top-right-radius: 20rpx;
    overflow: hidden;
  }
  
  .picker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx;
    border-bottom: 1rpx solid #f0f0f0;
  }
  
  .picker-cancel, .picker-confirm {
    font-size: 32rpx;
    color: #07c160;
  }
  
  .picker-title {
    font-size: 36rpx;
    font-weight: 500;
    color: #333;
  }
  
  .picker-view {
    height: 400rpx;
  }
  
  .picker-item {
    height: 50px;
    line-height: 50px;
    text-align: center;
    font-size: 32rpx;
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