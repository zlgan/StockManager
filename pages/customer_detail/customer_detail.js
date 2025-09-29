// pages/customer_detail/customer_detail.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    mode: 'add', // add: 新增, edit: 编辑
    customerId: null,
    customerInfo: {
      name: '',
      code: '',
      address: '',
      contactPerson: '',
      phone: '',
      serviceMonths: null,
      remark: ''
    },
    // 产品列表（模拟数据）
    productList: [
      { id: 1, name: '无线充电器', price: 99.00, selected: false },
      { id: 2, name: 'Type-C数据线', price: 29.00, selected: false },
      { id: 3, name: '蓝牙耳机', price: 199.00, selected: false },
      { id: 4, name: '手机壳', price: 39.00, selected: false },
      { id: 5, name: '移动电源', price: 129.00, selected: false },
      { id: 6, name: '车载充电器', price: 59.00, selected: false }
    ],
    selectedProducts: [], // 已选择的产品
    showProductModal: false, // 是否显示产品选择弹窗
    // 售后周期选项（1-120个月）
    serviceMonthOptions: [],
    selectedServiceMonthIndex: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 初始化售后周期选项
    this.initServiceMonthOptions();
    
    // 获取页面参数
    if (options.mode) {
      this.setData({
        mode: options.mode
      });
    }
    
    if (options.id && options.mode === 'edit') {
      this.setData({
        customerId: parseInt(options.id)
      });
      this.loadCustomerInfo(parseInt(options.id));
    }
    
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: options.mode === 'add' ? '新增客户' : '编辑客户'
    });
  },

  /**
   * 初始化售后周期选项
   */
  initServiceMonthOptions() {
    const options = [];
    for (let i = 1; i <= 120; i++) {
      options.push({
        value: i,
        label: `${i}个月`
      });
    }
    this.setData({
      serviceMonthOptions: options
    });
  },

  /**
   * 加载客户信息
   */
  loadCustomerInfo(id) {
    // 模拟从服务器获取客户信息
    const mockCustomers = [
      {
        id: 1,
        name: '北京科技有限公司',
        code: 'CUS001',
        address: '北京市朝阳区科技园区168号',
        contactPerson: '张总',
        phone: '13800138001',
        serviceMonths: 12,
        products: [
          { id: 1, name: '无线充电器', price: 99.00 },
          { id: 2, name: 'Type-C数据线', price: 29.00 }
        ],
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
        products: [
          { id: 3, name: '蓝牙耳机', price: 199.00 },
          { id: 4, name: '手机壳', price: 39.00 }
        ],
        remark: '电商平台客户'
      }
    ];
    
    const customer = mockCustomers.find(c => c.id === id);
    if (customer) {
      this.setData({
        customerInfo: {
          name: customer.name,
          code: customer.code,
          address: customer.address,
          contactPerson: customer.contactPerson,
          phone: customer.phone,
          serviceMonths: customer.serviceMonths,
          remark: customer.remark
        },
        selectedProducts: customer.products || [],
        selectedServiceMonthIndex: customer.serviceMonths ? customer.serviceMonths - 1 : 0
      });
    }
  },

  /**
   * 输入客户名称
   */
  inputCustomerName(e) {
    this.setData({
      'customerInfo.name': e.detail.value
    });
  },

  /**
   * 输入客户编号
   */
  inputCustomerCode(e) {
    this.setData({
      'customerInfo.code': e.detail.value
    });
  },

  /**
   * 输入客户地址
   */
  inputCustomerAddress(e) {
    this.setData({
      'customerInfo.address': e.detail.value
    });
  },

  /**
   * 输入联系人
   */
  inputContactPerson(e) {
    this.setData({
      'customerInfo.contactPerson': e.detail.value
    });
  },

  /**
   * 输入手机号
   */
  inputPhone(e) {
    this.setData({
      'customerInfo.phone': e.detail.value
    });
  },

  /**
   * 输入备注
   */
  inputRemark(e) {
    this.setData({
      'customerInfo.remark': e.detail.value
    });
  },

  /**
   * 显示产品选择弹窗
   */
  showProductSelector() {
    // 根据已选择的产品更新产品列表的选中状态
    const productList = this.data.productList.map(product => {
      const isSelected = this.data.selectedProducts.some(selected => selected.id === product.id);
      return {
        ...product,
        selected: isSelected
      };
    });
    
    this.setData({
      productList: productList,
      showProductModal: true
    });
  },

  /**
   * 隐藏产品选择弹窗
   */
  hideProductSelector() {
    this.setData({
      showProductModal: false
    });
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 阻止点击弹窗内容时关闭弹窗
  },

  /**
   * 切换产品选择状态
   */
  toggleProduct(e) {
    const productId = e.currentTarget.dataset.id;
    const productList = this.data.productList.map(product => {
      if (product.id === productId) {
        return {
          ...product,
          selected: !product.selected
        };
      }
      return product;
    });
    
    this.setData({
      productList: productList
    });
  },

  /**
   * 确认产品选择
   */
  confirmProductSelection() {
    const selectedProducts = this.data.productList.filter(product => product.selected);
    this.setData({
      selectedProducts: selectedProducts,
      showProductModal: false
    });
  },

  /**
   * 移除已选择的产品
   */
  removeProduct(e) {
    const productId = e.currentTarget.dataset.id;
    const selectedProducts = this.data.selectedProducts.filter(p => p.id !== productId);
    this.setData({
      selectedProducts: selectedProducts
    });
  },

  /**
   * 选择售后周期
   */
  selectServiceMonth(e) {
    const index = e.detail.value;
    const serviceMonths = this.data.serviceMonthOptions[index].value;
    this.setData({
      selectedServiceMonthIndex: index,
      'customerInfo.serviceMonths': serviceMonths
    });
  },

  /**
   * 验证表单
   */
  validateForm() {
    const { name, code, address, contactPerson, phone } = this.data.customerInfo;
    
    if (!name.trim()) {
      wx.showToast({
        title: '请输入客户名称',
        icon: 'none'
      });
      return false;
    }
    
    if (!code.trim()) {
      wx.showToast({
        title: '请输入客户编号',
        icon: 'none'
      });
      return false;
    }
    
    if (!address.trim()) {
      wx.showToast({
        title: '请输入客户地址',
        icon: 'none'
      });
      return false;
    }
    
    if (!contactPerson.trim()) {
      wx.showToast({
        title: '请输入联系人',
        icon: 'none'
      });
      return false;
    }
    
    if (!phone.trim()) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      });
      return false;
    }
    
    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return false;
    }
    
    return true;
  },

  /**
   * 保存客户信息
   */
  saveCustomer() {
    if (!this.validateForm()) {
      return;
    }
    
    const customerData = {
      ...this.data.customerInfo,
      products: this.data.selectedProducts
    };
    
    // 模拟保存到服务器
    wx.showLoading({
      title: '保存中...'
    });
    
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: this.data.mode === 'add' ? '新增成功' : '保存成功',
        icon: 'success'
      });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }, 1000);
  },

  /**
   * 返回上一页
   */
  goBack() {
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