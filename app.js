// app.js
App({
  onError(err){
    console.error(err)
  },
  onLaunch() {
    if (wx.cloud) {
      const envConfig = {
        develop: 'cloud1-1gb6hxc2a529122a',
        trial: 'cloud1-1gb6hxc2a529122a',
        release: 'cloud1-1gb6hxc2a529122a'
      }
      const { envVersion } = wx.getAccountInfoSync().miniProgram
      const currentEnv = envConfig[envVersion] || envConfig.develop
      wx.cloud.init({ traceUser: true, env: currentEnv })
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
