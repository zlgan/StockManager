// pages/staff_detail/staff_detail.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    staffInfo: {
      id: '',
      username: '',
      password: '',
      realName: '',
      phone: '',
      remark: '',
      canStockIn: true,
      canStockOut: true
    },
    originalStaffInfo: {},
    isEditMode: false,
    isAddMode: false,
    updateTime: '',
    confirmPassword: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.mode === 'add') {
      this.setData({
        isAddMode: true,
        isEditMode: true
      });
    } else if (options.id) {
      this.loadStaffDetail(options.id);
    }
  },

  /**
   * 加载员工详情
   */
  loadStaffDetail(staffId) {
    const db = wx.cloud.database()
    db.collection('users').doc(staffId).get().then(res=>{
      const u = res.data || {}
      const currentTime = new Date().toLocaleString('zh-CN')
      this.setData({
        staffInfo: { id: u._id, username: u.username||'', password: '', realName: u.realName||'', phone: u.phone||'', remark: u.remarks||'', canStockIn: true, canStockOut: true },
        originalStaffInfo: JSON.parse(JSON.stringify(this.data.staffInfo)),
        updateTime: currentTime,
        isEditMode: true,
        isAddMode: false
      })
    })
  },

  /**
   * 进入编辑模式
   */
  enterEditMode() {
    this.setData({
      isEditMode: true,
      originalStaffInfo: JSON.parse(JSON.stringify(this.data.staffInfo))
    });
  },

  /**
   * 取消编辑
   */
  cancelEdit() {
    wx.navigateBack();
  },

  /**
   * 保存员工信息
   */
  saveStaff() {
    const { staffInfo, isAddMode } = this.data;
    
    // 验证必填字段
    if (!staffInfo.username.trim()) {
      wx.showToast({
        title: '请输入用户名',
        icon: 'none'
      });
      return;
    }

    if (!staffInfo.password.trim()) {
      wx.showToast({
        title: '请输入密码',
        icon: 'none'
      });
      return;
    }
    if ((staffInfo.password||'').trim()!== (this.data.confirmPassword||'').trim()){
      wx.showToast({ title:'两次输入的密码不一致', icon:'none' });
      return;
    }

    if (!staffInfo.realName.trim()) {
      wx.showToast({
        title: '请输入姓名',
        icon: 'none'
      });
      return;
    }

    if (!staffInfo.phone.trim()) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      });
      return;
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(staffInfo.phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: isAddMode ? '添加中...' : '保存中...' })
    const user = wx.getStorageSync('currentUser') || {}
    const shopId = user.shopId || ''
    if (isAddMode) {
      const payload = { action: 'add', shopId, data: { username: staffInfo.username.trim(), password: staffInfo.password.trim(), realName: staffInfo.realName.trim(), phone: staffInfo.phone.trim(), remark: staffInfo.remark||'' } }
      wx.cloud.callFunction({ name: 'staffService', data: payload }).then(res=>{
        const r=(res&&res.result)||{}
        wx.hideLoading()
        if(!(r.ok===undefined || r.ok===true)){
          const map={ INVALID_PARAMS:'参数不完整', USERNAME_EXISTS:'用户名已存在', NO_SHOP:'未选择店铺', INTERNAL_ERROR:'服务器异常，请稍后重试' }
          const msg=r.message||map[r.code]||'保存失败'
          wx.showToast({ title: msg, icon:'none' })
          return
        }
        wx.showToast({ title: '添加成功', icon: 'success' })
        setTimeout(()=>{ wx.navigateBack() }, 800)
      }).catch(()=>{
        wx.hideLoading()
        wx.showToast({ title:'网络异常或服务器错误', icon:'none' })
      })
    } else {
      const payload = { action: 'update', shopId, id: staffInfo.id, data: { realName: staffInfo.realName.trim(), phone: staffInfo.phone.trim(), remark: staffInfo.remark||'', password: staffInfo.password.trim() } }
      wx.cloud.callFunction({ name: 'staffService', data: payload }).then(res=>{
        const r=(res&&res.result)||{}
        wx.hideLoading()
        if(!(r.ok===undefined || r.ok===true)){
          const map={ INVALID_PARAMS:'参数不完整', USERNAME_EXISTS:'用户名已存在', NO_SHOP:'未选择店铺', INTERNAL_ERROR:'服务器异常，请稍后重试' }
          const msg=r.message||map[r.code]||'保存失败'
          wx.showToast({ title: msg, icon:'none' })
          return
        }
        wx.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(()=>{ wx.navigateBack() }, 800)
      }).catch(()=>{
        wx.hideLoading()
        wx.showToast({ title:'网络异常或服务器错误', icon:'none' })
      })
    }
  },

  /**
   * 输入事件处理
   */
  onUsernameInput(e) {
    this.setData({
      'staffInfo.username': e.detail.value
    });
  },

  onPasswordInput(e) {
    this.setData({
      'staffInfo.password': e.detail.value
    });
  },
  onConfirmPasswordInput(e){ this.setData({ confirmPassword: e.detail.value }) },

  onRealNameInput(e) {
    this.setData({
      'staffInfo.realName': e.detail.value
    });
  },

  onPhoneInput(e) {
    this.setData({
      'staffInfo.phone': e.detail.value
    });
  },

  onRemarkInput(e) {
    this.setData({
      'staffInfo.remark': e.detail.value
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
