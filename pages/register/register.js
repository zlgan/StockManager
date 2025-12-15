// pages/register/register.js
 
Page({

  /**
   * 页面的初始数据
   */
  data: {
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    canRegister: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 姓名输入处理
   */
  onNameInput(e) {
    this.setData({
      name: e.detail.value
    });
    this.checkCanRegister();
  },

  /**
   * 用户名输入处理
   */
  onUsernameInput(e) {
    this.setData({
      username: e.detail.value
    });
    this.checkCanRegister();
  },

  /**
   * 密码输入处理
   */
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
    this.checkCanRegister();
  },

  /**
   * 确认密码输入处理
   */
  onConfirmPasswordInput(e) {
    this.setData({
      confirmPassword: e.detail.value
    });
    this.checkCanRegister();
  },

  /**
   * 检查是否可以注册
   */
  checkCanRegister() {
    const { name, username, password, confirmPassword } = this.data;
    const uLen=(username||'').trim().length
    const pLen=(password||'').trim().length
    const canRegister = name.trim() && uLen>=3 && uLen<=10 && pLen>=6 && pLen<=20 && 
                       confirmPassword.trim() && password === confirmPassword;
    this.setData({
      canRegister
    });
  },

  /**
   * 注册处理
   */
  async onRegister() {
    const { name, username, password, confirmPassword } = this.data;

    // 验证输入
    if (!name.trim()) {
      wx.showToast({
        title: '请输入姓名',
        icon: 'none'
      });
      return;
    }

    if (!username.trim()) {
      wx.showToast({
        title: '请输入用户名',
        icon: 'none'
      });
      return;
    }
    if (username.trim().length<3 || username.trim().length>10) {
      wx.showToast({ title: '用户名长度3-10字符', icon: 'none' });
      return;
    }

    if (!password.trim()) {
      wx.showToast({
        title: '请输入密码',
        icon: 'none'
      });
      return;
    }
    if (password.trim().length<6 || password.trim().length>20) {
      wx.showToast({ title: '密码长度6-20字符', icon: 'none' });
      return;
    }

    if (password !== confirmPassword) {
      wx.showToast({
        title: '两次密码不一致',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({ title: '处理中', mask: true })
      const res = await wx.cloud.callFunction({ name: 'registerUser', data: { shopName: name.trim(), username: username.trim(), password: password.trim() } })
      const r = (res && res.result) || {}
      if (r.ok && r.currentUser) {
        wx.setStorageSync('currentUser', r.currentUser)
        wx.setStorageSync('isLoggedIn', true)
        wx.hideLoading()
        wx.showToast({ title: '注册成功', icon: 'success' })
        setTimeout(() => { wx.reLaunch({ url: '/pages/profile/profile' }) }, 800)
        return
      }
      const map = { USERNAME_EXISTS: '用户名已存在', INVALID_PARAMS: '参数不完整或格式不正确', INTERNAL_ERROR: '服务器异常，请稍后重试' }
      const msg = r.message || map[r.code] || '注册失败，请重试'
      wx.hideLoading()
      wx.showToast({ title: msg, icon: 'none' })
    } catch (err) {
      console.error(err)
      wx.hideLoading()
      wx.showToast({ title: '网络异常或服务器错误', icon: 'none' })
    }
  },

  /**
   * 跳转到登录页面
   */
  goToLogin() {
    wx.navigateBack();
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
