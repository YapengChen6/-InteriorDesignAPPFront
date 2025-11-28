<template>
    <view class="container">
        <view class="loading-section">
            <view class="loading-icon">🔄</view>
            <view class="loading-text">身份识别中...</view>
        </view>
    </view>
</template>

<script>
    import { getUserProfile, getCurrentRole } from '@/api/users.js'
    
    export default {
        data() {
            return {
                userInfo: null,
                userRole: 'user'
            }
        },
        onLoad() {
            console.log('🚀 身份跳转页面加载');
            this.checkUserRoleAndRedirect();
        },
        methods: {
            // 检查用户角色并跳转
            async checkUserRoleAndRedirect() {
                try {
                    console.log('🔍 开始检查用户角色...');
                    
                    // 1. 获取用户信息
                    const userRes = await getUserProfile();
                    if (userRes.code === 200) {
                        this.userInfo = userRes.data;
                        
                        // 2. 获取当前角色
                        const roleRes = await getCurrentRole();
                        if (roleRes.code === 200 && roleRes.data) {
                            this.userRole = roleRes.data.roleType;
                        } else if (this.userInfo.currentRoleType) {
                            this.userRole = this.userInfo.currentRoleType;
                        }
                        
                        console.log('🎯 用户角色识别完成:', this.userRole);
                        
                        // 3. 根据角色跳转到对应页面
                        this.redirectByRole();
                    } else {
                        console.error('❌ 获取用户信息失败:', userRes.msg);
                        this.redirectToDefault();
                    }
                } catch (error) {
                    console.error('❌ 角色检查失败:', error);
                    this.redirectToDefault();
                }
            },
            
            // 根据角色跳转
            redirectByRole() {
                const redirectMap = {
                    'designer': '/pages/work/index',
                    'supervisor': '/pages/work/jianli-order',
                    'material_supplier': '/pages/work/material_supplier-order',
                    'user': '/pages/work/user-order' // 修改：普通用户跳转到用户订单页面
                };
                
                const targetPath = redirectMap[this.userRole] || '/pages/work/user-order'; // 修改：默认也跳转到用户订单页面
                
                console.log('📍 跳转目标:', targetPath, '角色:', this.userRole);
                
                // 检查目标页面是否是 tabBar 页面
                this.checkAndNavigate(targetPath);
            },
            
            // 检查页面类型并跳转
            checkAndNavigate(targetPath) {
                // 假设这些是 tabBar 页面（根据您的 pages.json 配置调整）
                const tabBarPages = [
                    '/pages/index',
                    '/pages/work/index',
                    // 添加其他 tabBar 页面路径
                ];
                
                const isTabBarPage = tabBarPages.includes(targetPath);
                
                if (isTabBarPage) {
                    // 使用 switchTab 跳转到 tabBar 页面
                    console.log('📍 使用 switchTab 跳转到 tabBar 页面');
                    uni.switchTab({
                        url: targetPath,
                        success: () => {
                            console.log('✅ 跳转到 tabBar 页面成功');
                        },
                        fail: (error) => {
                            console.error('❌ 跳转到 tabBar 页面失败:', error);
                            this.fallbackRedirect(targetPath);
                        }
                    });
                } else {
                    // 使用 redirectTo 跳转到非 tabBar 页面
                    console.log('📍 使用 redirectTo 跳转到普通页面');
                    uni.redirectTo({
                        url: targetPath,
                        success: () => {
                            console.log('✅ 跳转到普通页面成功');
                        },
                        fail: (error) => {
                            console.error('❌ 跳转到普通页面失败:', error);
                            this.fallbackRedirect(targetPath);
                        }
                    });
                }
            },
            
            // 备用跳转方法
            fallbackRedirect(targetPath) {
                console.log('🔄 使用备用跳转方法');
                try {
                    // 先尝试 reLaunch
                    uni.reLaunch({
                        url: targetPath,
                        success: () => {
                            console.log('✅ reLaunch 跳转成功');
                        },
                        fail: () => {
                            // 最后尝试 navigateTo
                            uni.navigateTo({
                                url: targetPath
                            });
                        }
                    });
                } catch (error) {
                    console.error('❌ 所有跳转方法都失败:', error);
                    this.redirectToDefault();
                }
            },
            
            // 跳转到默认页面（用户订单页面）
            redirectToDefault() {
                console.log('🏠 跳转到默认页面（用户订单）');
                uni.redirectTo({
                    url: '/pages/work/user-order'
                });
            }
        }
    }
</script>

<style scoped>
    .container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .loading-section {
        text-align: center;
        color: white;
    }
    
    .loading-icon {
        font-size: 80rpx;
        margin-bottom: 30rpx;
        animation: spin 1.5s linear infinite;
    }
    
    .loading-text {
        font-size: 32rpx;
        font-weight: 500;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style>