// app.js
App({
  onError(err){
    console.error(err)
  },
  onLaunch() {
    if (wx.cloud) {
    // 1. 定义各环境的云环境ID
    const envConfig = {
      develop: 'cloud1-1gb6hxc2a529122a',   // 开发环境ID
      trial: 'test-environment-id',    // 体验版环境ID
      release: 'prod-environment-id'   // 正式版环境ID
    };

    // 2. 获取当前小程序版本
    const { envVersion } = wx.getAccountInfoSync().miniProgram;

    // 3. 动态选择环境ID，如果没有匹配则提供默认值
    const currentEnv = envConfig[envVersion] || envConfig.develop;      
      wx.cloud.init({
        traceUser: true,
        env: currentEnv
      })
      wx.cloud.callFunction({ name: 'initDb' }).catch(err => { console.error(err); throw err })
    }
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 初始化用户信息
    this.initUserInfo()

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },

  /**
   * 初始化用户信息
   */
  initUserInfo() {
    const currentUser = wx.getStorageSync('currentUser')
    if (currentUser) {
      // 用户已登录，更新全局用户信息
      this.globalData.userInfo = currentUser
    }
  },

  /**
   * 检查登录状态（供页面调用）
   */
  checkLoginStatus() {
    const isLoggedIn = wx.getStorageSync('isLoggedIn')
    const currentUser = wx.getStorageSync('currentUser')
    
    return !!(isLoggedIn && currentUser)
  },

  /**
   * 获取当前登录用户信息
   */
  getCurrentUser() {
    return wx.getStorageSync('currentUser') || null
  },

  /**
   * 退出登录
   */
  logout() {
    wx.removeStorageSync('isLoggedIn')
    wx.removeStorageSync('currentUser')
    this.globalData.userInfo = null
    
    // 跳转到登录页
    wx.reLaunch({
      url: '/pages/login/login'
    })
  },

  globalData: {
    userInfo: null
  }
})
