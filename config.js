// 应用全局配置
module.exports = {
  // 开发环境（需要在微信开发者工具中开启"不校验合法域名"）
  baseUrl: 'http://localhost:8081',
  // 生产环境使用HTTPS
  // baseUrl: 'https://your-domain.com',
  // 应用信息
  appInfo: {
    // 应用名称
    name: "ruoyi-app",
    // 应用版本
    version: "1.2.0",
    // 应用logo
    logo: "/static/logo.png",
    // 官方网站
    site_url: "http://ruoyi.vip",
    // 政策协议
    agreements: [{
        title: "隐私政策",
        url: "https://ruoyi.vip/protocol.html"
      },
      {
        title: "用户服务协议",
        url: "https://ruoyi.vip/protocol.html"
      }
    ]
  }
}
