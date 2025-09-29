// pages/customers/customers.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    customerName: '',
    contactPerson: '',
    phone: '',
    customers: [
      {
        id: 1,
        name: '北京科技有限公司',
        code: 'CUS001',
        address: '北京市朝阳区科技园区168号',
        contactPerson: '张总',
        phone: '13800138001',
        serviceMonths: 12,
        products: ['无线充电器', 'Type-C数据线'],
        remark: '重要客户，长期合作伙伴'
      },
      {
        id: 2,
        name: '上海电子商务有限公司',
        code: 'CUS002',
        address: '上海市浦东新区金融中心大厦A座',
        contactPerson: '李经理',
        phone: '13900139002',
        serviceMonths: 24,
        products: ['蓝牙耳机', '手机壳'],
        remark: '电商平台客户'
      },
      {
        id: 3,
        name: '深圳智能设备有限公司',
        code: 'CUS003',
        address: '深圳市南山区高新技术产业园B栋',
        contactPerson: '王总监',
        phone: '13700137003',
        serviceMonths: 6,
        products: ['无线充电器'],
        remark: '新客户，有潜力'
      },
      {
        id: 4,
        name: '广州零售连锁有限公司',
        code: 'CUS004',
        address: '广州市天河区商业中心C区',
        contactPerson: '陈店长',
        phone: '13600136004',
        serviceMonths: 18,
        products: ['Type-C数据线', '手机壳', '蓝牙耳机'],
        remark: '零售连锁客户'
      }
    ],
    originalCustomers: [] // 用于存储原始数据，方便搜索过滤
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 保存原始客户列表
    this.setData({
      originalCustomers: this.data.customers
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
    const { customerName, contactPerson, phone, originalCustomers } = this.data;
    
    // 过滤客户
    const filteredCustomers = originalCustomers.filter(customer => {
      const nameMatch = !customerName || customer.name.includes(customerName);
      const contactMatch = !contactPerson || customer.contactPerson.includes(contactPerson);
      const phoneMatch = !phone || customer.phone.includes(phone);
      return nameMatch && contactMatch && phoneMatch;
    });
    
    this.setData({
      customers: filteredCustomers
    });
    
    // 显示搜索结果数量
    wx.showToast({
      title: `找到 ${filteredCustomers.length} 个客户`,
      icon: 'none'
    });
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
    // 刷新数据
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
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
})