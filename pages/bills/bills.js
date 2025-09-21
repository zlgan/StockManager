// pages/bills/bills.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    searchKeyword: '',
    dateRange: '',
    startDate: '',
    endDate: '',
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
    this.initDateRange();
    this.loadBillData();
  },

  /**
   * 返回上一页
   */
  goBack: function() {
    wx.navigateBack();
  },

  /**
   * 扫码功能
   */
  scanCode: function() {
    wx.scanCode({
      success: (res) => {
        // 将扫码结果填充到搜索框
        this.setData({
          searchKeyword: res.result
        });
        // 可选：自动执行搜索
        // this.search();
      },
      fail: (err) => {
        wx.showToast({
          title: '扫码失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  /**
   * 初始化日期范围
   */
  initDateRange: function() {
    // 获取当前日期
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    // 格式化当前日期
    const today = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // 计算30天前的日期
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const startYear = thirtyDaysAgo.getFullYear();
    const startMonth = thirtyDaysAgo.getMonth() + 1;
    const startDay = thirtyDaysAgo.getDate();
    const startDate = `${startYear}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
    
    // 设置日期范围
    this.setData({
      startDate: startDate,
      endDate: today,
      dateRange: `${startDate} 至 ${today}`
    });
  },
  
  /**
   * 开始日期变更处理
   */
  bindStartDateChange: function(e) {
    this.setData({
      startDate: e.detail.value
    });
    this.updateDateRange();
  },
  
  /**
   * 结束日期变更处理
   */
  bindEndDateChange: function(e) {
    this.setData({
      endDate: e.detail.value
    });
    this.updateDateRange();
  },
  
  /**
   * 更新日期范围显示
   */
  updateDateRange: function() {
    const { startDate, endDate } = this.data;
    if (startDate && endDate) {
      this.setData({
        dateRange: `${startDate} 至 ${endDate}`
      });
    }
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