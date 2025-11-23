// pages/customers/customers.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    customerName: '',
    contactPerson: '',
    phone: '',
    customers: [],
    originalCustomers: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadCustomers()
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
    // 每次显示页面时可以刷新客户信息
  },

  /**
   * 输入客户名称
   */
  inputCustomerName(e) {
    this.setData({
      customerName: e.detail.value
    });
  },

  /**
   * 输入联系人
   */
  inputContactPerson(e) {
    this.setData({
      contactPerson: e.detail.value
    });
  },

  /**
   * 输入手机号
   */
  inputPhone(e) {
    this.setData({
      phone: e.detail.value
    });
  },

  /**
   * 搜索客户
   */
  searchCustomers() {
    const { customerName, contactPerson, phone } = this.data;
    const user = wx.getStorageSync('currentUser') || {}
    const shopId = user.shopId || ''
    const db = wx.cloud.database()
    db.collection('customers').where({ shopId, status: 'active' }).get().then(res=>{
      let list = res.data || []
      if (customerName) list = list.filter(c => (c.name||'').includes(customerName))
      if (contactPerson) list = list.filter(c => (c.contactPerson||'').includes(contactPerson))
      if (phone) list = list.filter(c => (c.phone||'').includes(phone))
      const mapped = list.map(c=>({ id: c._id, name: c.name, code: c.code, address: c.address, contactPerson: c.contactPerson, phone: c.phone, serviceMonths: c.serviceMonths, remark: c.remarks }))
      this.setData({ customers: mapped })
      wx.showToast({ title: `找到 ${mapped.length} 个客户`, icon: 'none' })
    })
  },

  /**
   * 跳转到客户详情页
   */
  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/customer_detail/customer_detail?id=${id}&mode=edit`
    });
  },

  /**
   * 跳转到新增客户页
   */
  navigateToAdd() {
    wx.navigateTo({
      url: '/pages/customer_detail/customer_detail?mode=add'
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadCustomers()
    setTimeout(() => { wx.stopPullDownRefresh() }, 500)
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
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
  ,
  loadCustomers(){
    const user = wx.getStorageSync('currentUser') || {}
    const shopId = user.shopId || ''
    const db = wx.cloud.database()
    db.collection('customers').where({ shopId, status: 'active' }).get().then(res=>{
      const mapped = (res.data||[]).map(c=>({ id: c._id, name: c.name, code: c.code, address: c.address, contactPerson: c.contactPerson, phone: c.phone, serviceMonths: c.serviceMonths, remark: c.remarks }))
      this.setData({ customers: mapped, originalCustomers: mapped })
    })
  }
})