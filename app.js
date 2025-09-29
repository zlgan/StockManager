// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 检查用户登录状态
    this.checkLoginStatus()

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    const isLoggedIn = wx.getStorageSync('isLoggedIn')
    const currentUser = wx.getStorageSync('currentUser')
    
    if (!isLoggedIn || !currentUser) {
      // 用户未登录，跳转到登录页
      wx.reLaunch({
        url: '/pages/login/login'
      })
    } else {
      // 用户已登录，更新全局用户信息
      this.globalData.userInfo = currentUser
    }
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
