// pages/suppliers/suppliers.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    supplierName: '',
    supplierCode: '',
    suppliers: [
      {
        id: 1,
        name: '广州科技有限公司',
        code: 'SUP001',
        address: '广州市天河区科技园区88号',
        contactPerson: '张经理',
        phone: '13800138000',
        remark: '主要电子产品供应商'
      },
      {
        id: 2,
        name: '深圳电子科技有限公司',
        code: 'SUP002',
        address: '深圳市南山区高新技术产业园A栋',
        contactPerson: '李总',
        phone: '13900139000',
        remark: '主要提供电子元器件'
      },
      {
        id: 3,
        name: '东莞包装材料有限公司',
        code: 'SUP003',
        address: '东莞市长安镇工业园C区',
        contactPerson: '王经理',
        phone: '13700137000',
        remark: '包装材料供应商'
      }
    ],
    originalSuppliers: [] // 用于存储原始数据，方便搜索过滤
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 保存原始数据
    this.setData({
      originalSuppliers: this.data.suppliers
    });
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
    const { supplierName, supplierCode, originalSuppliers } = this.data;
    
    // 过滤供应商
    const filteredSuppliers = originalSuppliers.filter(supplier => {
      const nameMatch = !supplierName || supplier.name.includes(supplierName);
      const codeMatch = !supplierCode || supplier.code.includes(supplierCode);
      return nameMatch && codeMatch;
    });
    
    this.setData({
      suppliers: filteredSuppliers
    });
    
    // 显示搜索结果数量
    wx.showToast({
      title: `找到 ${filteredSuppliers.length} 个供应商`,
      icon: 'none'
    });
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
    // 刷新数据
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  }
})