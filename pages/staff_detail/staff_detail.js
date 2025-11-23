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
    updateTime: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.mode === 'add') {
      this.setData({
        isAddMode: true,
        isEditMode: false
      });
      this.loadShopPermissions()
    } else if (options.id) {
      this.loadStaffDetail(options.id);
      this.loadShopPermissions()
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
        isEditMode: false,
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
    if (this.data.isAddMode) {
      wx.navigateBack();
    } else {
      this.setData({
        isEditMode: false,
        staffInfo: this.data.originalStaffInfo
      });
    }
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
      wx.cloud.callFunction({ name: 'staffService', data: payload }).then(()=>{
        wx.hideLoading()
        wx.showToast({ title: '添加成功', icon: 'success' })
        setTimeout(()=>{ wx.navigateBack() }, 800)
      }).catch(err=>{
        wx.hideLoading()
        const msg=(err&&err.errMsg)||''
        wx.showToast({ title: msg.includes('USERNAME_EXISTS')?'用户名已存在':'保存失败', icon:'none' })
      })
    } else {
      const payload = { action: 'update', shopId, id: staffInfo.id, data: { realName: staffInfo.realName.trim(), phone: staffInfo.phone.trim(), remark: staffInfo.remark||'', password: staffInfo.password.trim() } }
      wx.cloud.callFunction({ name: 'staffService', data: payload }).then(()=>{
        wx.hideLoading()
        wx.showToast({ title: '保存成功', icon: 'success' })
        this.setData({ isEditMode: false, updateTime: new Date().toLocaleString('zh-CN') })
      }).catch(()=>{
        wx.hideLoading()
        wx.showToast({ title: '保存失败', icon:'none' })
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
   * 权限开关处理
   */
  onStockInChange(e) {
    const user = wx.getStorageSync('currentUser') || {}
    const shopId = user.shopId || ''
    const disableInbound = e.detail.value
    wx.cloud.callFunction({ name: 'shopService', data: { action: 'updateStaffPermissions', shopId, disableInbound, disableOutbound: !this.data.staffInfo ? false : !this.data.staffInfo.canStockOut } })
    this.setData({ 'staffInfo.canStockIn': !disableInbound })
  },

  onStockOutChange(e) {
    const user = wx.getStorageSync('currentUser') || {}
    const shopId = user.shopId || ''
    const disableOutbound = e.detail.value
    wx.cloud.callFunction({ name: 'shopService', data: { action: 'updateStaffPermissions', shopId, disableOutbound, disableInbound: !this.data.staffInfo ? false : !this.data.staffInfo.canStockIn } })
    this.setData({ 'staffInfo.canStockOut': !disableOutbound })
  },

  loadShopPermissions(){
    const user = wx.getStorageSync('currentUser') || {}
    const shopId = user.shopId || ''
    wx.cloud.callFunction({ name: 'shopService', data: { action: 'getStaffPermissions', shopId } }).then(res=>{
      const perms = (res && res.result && res.result.staffPermissions) || { disableInbound:false, disableOutbound:false }
      this.setData({ 'staffInfo.canStockIn': !perms.disableInbound, 'staffInfo.canStockOut': !perms.disableOutbound })
    })
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