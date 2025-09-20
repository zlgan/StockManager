// pages/bills/bills.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    searchKeyword: '',
    dateRange: '',
    billTypes: ['全部', '入库单', '出库单'],
    billTypeIndex: 0,
    suppliers: ['全部', '广州电子科技有限公司', '北京科技有限公司', '深圳数码配件厂'],
    supplierIndex: 0,
    totalCount: 0,
    showExportSuccess: false,
    bills: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.loadBillData();
  },

  /**
   * 返回上一页
   */
  goBack: function() {
    wx.navigateBack();
  },

  /**
   * 显示日期选择器
   */
  showDatePicker: function() {
    // 实际应用中这里会调用日期选择器组件
    // 这里简化为直接设置一个固定的日期范围
    this.setData({
      dateRange: '2023-09-01 至 2023-09-30'
    });
  },

  /**
   * 单据类型选择器变化事件
   */
  bindBillTypeChange: function(e) {
    this.setData({
      billTypeIndex: e.detail.value
    });
  },

  /**
   * 供应商/客户选择器变化事件
   */
  bindSupplierChange: function(e) {
    this.setData({
      supplierIndex: e.detail.value
    });
  },

  /**
   * 搜索单据
   */
  search: function() {
    // 实际应用中这里会根据搜索条件请求后端API
    // 这里简化为重新加载模拟数据
    this.loadBillData();
    wx.showToast({
      title: '搜索成功',
      icon: 'success',
      duration: 1000
    });
  },

  /**
   * 重置搜索条件
   */
  reset: function() {
    this.setData({
      searchKeyword: '',
      dateRange: '',
      billTypeIndex: 0,
      supplierIndex: 0
    });
  },

  /**
   * 导出Excel
   */
  exportToExcel: function() {
    // 显示导出中状态
    wx.showLoading({
      title: '导出中...',
    });
    
    // 模拟导出延迟
    setTimeout(() => {
      wx.hideLoading();
      
      // 显示导出成功提示
      this.setData({
        showExportSuccess: true
      });
    }, 1500);
  },

  /**
   * 隐藏导出成功提示
   */
  hideExportSuccess: function() {
    this.setData({
      showExportSuccess: false
    });
  },

  /**
   * 查看单据详情
   */
  viewBillDetail: function(e) {
    const billId = e.currentTarget.dataset.id;
    // 实际应用中这里会跳转到单据详情页面
    wx.showToast({
      title: '查看单据: ' + billId,
      icon: 'none'
    });
  },

  /**
   * 加载单据数据（模拟数据）
   */
  loadBillData: function() {
    // 模拟单据数据
    const mockBills = [
      {
        id: '001',
        type: 'inbound',
        billNumber: 'RK20230915001',
        date: '2023-09-15',
        billTypeName: '采购入库',
        totalAmount: '1,500.00',
        creator: '张三',
        createTime: '2023-09-15 10:30',
        products: [
          { name: '苹果手机壳', quantity: 100 }
        ]
      },
      {
        id: '002',
        type: 'outbound',
        billNumber: 'CK20230915001',
        date: '2023-09-15',
        billTypeName: '销售出库',
        totalAmount: '400.00',
        creator: '李四',
        createTime: '2023-09-15 14:20',
        products: [
          { name: '苹果手机壳', quantity: 20 }
        ]
      },
      {
        id: '003',
        type: 'inbound',
        billNumber: 'RK20230914001',
        date: '2023-09-14',
        billTypeName: '采购入库',
        totalAmount: '3,200.00',
        creator: '张三',
        createTime: '2023-09-14 09:15',
        products: [
          { name: '三星手机壳', quantity: 150 },
          { name: '手机贴膜', quantity: 200 }
        ]
      },
      {
        id: '004',
        type: 'outbound',
        billNumber: 'CK20230913002',
        date: '2023-09-13',
        billTypeName: '销售出库',
        totalAmount: '1,200.00',
        creator: '王五',
        createTime: '2023-09-13 16:45',
        products: [
          { name: '三星手机壳', quantity: 30 },
          { name: '手机贴膜', quantity: 50 }
        ]
      }
    ];
    
    this.setData({
      bills: mockBills,
      totalCount: mockBills.length
    });
  }
})