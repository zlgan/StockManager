// pages/suppliers/suppliers.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    supplierName: '',
    supplierCode: '',
    suppliers: [],
    originalSuppliers: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadSuppliers()
  },

  /**
   * 输入供应商名称
   */
  inputSupplierName(e) {
    this.setData({
      supplierName: e.detail.value
    });
  },

  /**
   * 输入供应商编号
   */
  inputSupplierCode(e) {
    this.setData({
      supplierCode: e.detail.value
    });
  },

  /**
   * 搜索供应商
   */
  searchSuppliers() {
    const { supplierName, supplierCode } = this.data;
    const user = wx.getStorageSync('currentUser') || {}
    const shopId = user.shopId || ''
    const db = wx.cloud.database()
    const where = { shopId, status: 'active' }
    db.collection('suppliers').where(where).get().then(res=>{
      let list = res.data || []
      if (supplierName) list = list.filter(s => (s.name||'').includes(supplierName))
      if (supplierCode) list = list.filter(s => (s.code||'').includes(supplierCode))
      const mapped = list.map(s=>({ id: s._id, name: s.name, code: s.code, address: s.address, contactPerson: s.contactPerson, phone: s.phone, remark: s.remarks }))
      this.setData({ suppliers: mapped })
    }).catch(()=>{ wx.showToast({ title:'网络异常或服务器错误', icon:'none' }) })
  },

  /**
   * 跳转到供应商详情页
   */
  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/supplier_detail/supplier_detail?id=${id}&mode=edit`
    });
  },

  /**
   * 跳转到新增供应商页
   */
  navigateToAdd() {
    wx.navigateTo({
      url: '/pages/supplier_detail/supplier_detail?mode=add'
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadSuppliers()
    setTimeout(() => { wx.stopPullDownRefresh() }, 500)
  }
  ,
  loadSuppliers(){
    const user = wx.getStorageSync('currentUser') || {}
    const shopId = user.shopId || ''
    const db = wx.cloud.database()
    db.collection('suppliers').where({ shopId, status: 'active' }).get().then(res=>{
      const mapped = (res.data||[]).map(s=>({ id: s._id, name: s.name, code: s.code, address: s.address, contactPerson: s.contactPerson, phone: s.phone, remark: s.remarks }))
      this.setData({ suppliers: mapped, originalSuppliers: mapped })
    }).catch(()=>{ wx.showToast({ title:'网络异常或服务器错误', icon:'none' }) })
  }
})
