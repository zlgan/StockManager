// pages/login/login.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    username: '',
    password: '',
    canLogin: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 检查是否已经登录
    const isLoggedIn = wx.getStorageSync('isLoggedIn');
    if (isLoggedIn) {
      wx.reLaunch({
        url: '/pages/index/index'
      });
    }
  },

  /**
   * 用户名输入处理
   */
  onUsernameInput(e) {
    this.setData({
      username: e.detail.value
    });
    this.checkCanLogin();
  },

  /**
   * 密码输入处理
   */
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
    this.checkCanLogin();
  },

  /**
   * 检查是否可以登录
   */
  checkCanLogin() {
    const { username, password } = this.data;
    const canLogin = username.trim() && password.trim();
    this.setData({
      canLogin
    });
  },

  /**
   * 登录处理
   */
  async onLogin() {
    const { username, password } = this.data;

    // 验证输入
    if (!username.trim()) {
      wx.showToast({
        title: '请输入用户名',
        icon: 'none'
      });
      return;
    }

    if (!password.trim()) {
      wx.showToast({
        title: '请输入密码',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({ title: '登录中', mask: true })
      const res = await wx.cloud.callFunction({ name: 'loginUser', data: { username: username.trim(), password: password.trim() } })
      const currentUser = res && res.result && res.result.currentUser
      if (!currentUser) {
        wx.hideLoading()
        wx.showToast({ title: '用户名或密码错误', icon: 'none' })
        return
      }
      wx.setStorageSync('currentUser', currentUser)
      wx.setStorageSync('isLoggedIn', true)
      wx.hideLoading()
      wx.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => { wx.reLaunch({ url: '/pages/index/index' }) }, 800)
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '登录失败，请重试', icon: 'none' })
    }
  },

  /**
   * 跳转到注册页面
   */
  goToRegister() {
    wx.navigateTo({
      url: '/pages/register/register'
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})