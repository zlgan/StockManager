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
    customers: ['全部', '深圳华强客户', '广州天河客户', '北京中关村客户'],
    customerIndex: 0,
    totalCount: 0,
    showExportSuccess: false,
    bills: [],
    sourceBills: []
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
   * 输入搜索关键词
   */
  inputSearchKeyword: function(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
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
        // 自动执行搜索
        this.search();
      },
      fail: (err) => {
        wx.showToast({
          title: '扫码失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation: function(e) {
    // 阻止事件冒泡
  },

  /**
   * 编辑单据
   */
  editBill: function(e) {
    const billId = e.currentTarget.dataset.id;
    const bill = this.data.bills.find(item => item.id === billId);
    
    if (!bill) {
      wx.showToast({
        title: '单据不存在',
        icon: 'none'
      });
      return;
    }

    // 跳转到单据详情页面进行编辑
    wx.navigateTo({
      url: `/pages/bill_detail/bill_detail?id=${billId}&mode=edit`
    });
  },

  /**
   * 删除单据
   */
  deleteBill: function(e) {
    const billId = e.currentTarget.dataset.id;
    const bill = this.data.bills.find(item => item.id === billId);
    
    if (!bill) {
      wx.showToast({
        title: '单据不存在',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: `确定要删除单据 ${bill.billNumber} 吗？此操作不可恢复。`,
      confirmText: '删除',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          // 执行删除操作
          this.performDeleteBill(billId);
        }
      }
    });
  },

  /**
   * 执行删除单据操作
   */
  performDeleteBill: function(billId) {
    // 模拟删除操作
    const bills = this.data.bills.filter(item => item.id !== billId);
    this.setData({
      bills: bills,
      totalCount: bills.length
    });

    wx.showToast({
      title: '删除成功',
      icon: 'success'
    });

    // 这里应该调用后端API删除数据
    // wx.request({
    //   url: '/api/bills/' + billId,
    //   method: 'DELETE',
    //   success: (res) => {
    //     // 重新加载数据
    //     this.loadBillData();
    //   }
    // });
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
   * 客户选择器变化事件
   */
  bindCustomerChange: function(e) {
    this.setData({
      customerIndex: e.detail.value
    });
  },

  /**
   * 搜索单据
   */
  search: function() {
    // 过滤 sourceBills 得到结果
    const bills = this.applyFilters();
    this.setData({
      bills: bills,
      totalCount: bills.length
    });
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
      startDate: '',
      endDate: '',
      billTypeIndex: 0,
      supplierIndex: 0,
      customerIndex: 0
    });
    // 恢复完整数据
    const bills = this.applyFilters();
    this.setData({
      bills: bills,
      totalCount: bills.length
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
    const bill = this.data.bills.find(item => item.id === billId);
    
    if (!bill) {
      wx.showToast({
        title: '单据不存在',
        icon: 'none'
      });
      return;
    }

    // 跳转到单据详情页面
    wx.navigateTo({
      url: `/pages/bill_detail/bill_detail?id=${billId}&mode=view`
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
        billNumber: 'RK20240115001',
        date: '2024-01-15',
        billTypeName: '采购入库',
        totalAmount: '15,000.00',
        creator: '张三',
        createTime: '2024-01-15 10:30',
        supplier: '广州电子科技有限公司',
        products: [
          { name: 'iPhone 15 Pro', quantity: 10 }
        ]
      },
      {
        id: '002',
        type: 'outbound',
        billNumber: 'CK20240116001',
        date: '2024-01-16',
        billTypeName: '销售出库',
        totalAmount: '8,000.00',
        creator: '李四',
        createTime: '2024-01-16 14:20',
        customer: '深圳华强客户',
        products: [
          { name: 'iPhone 15 Pro', quantity: 5 }
        ]
      },
      {
        id: '003',
        type: 'inbound',
        billNumber: 'RK20240117001',
        date: '2024-01-17',
        billTypeName: '采购入库',
        totalAmount: '32,000.00',
        creator: '张三',
        createTime: '2024-01-17 09:15',
        supplier: '北京科技有限公司',
        products: [
          { name: 'MacBook Pro', quantity: 8 },
          { name: 'iPad Air', quantity: 15 }
        ]
      },
      {
        id: '004',
        type: 'outbound',
        billNumber: 'CK20240118001',
        date: '2024-01-18',
        billTypeName: '销售出库',
        totalAmount: '12,000.00',
        creator: '王五',
        createTime: '2024-01-18 16:45',
        customer: '广州天河客户',
        products: [
          { name: 'MacBook Pro', quantity: 3 },
          { name: 'iPad Air', quantity: 8 }
        ]
      },
      {
        id: '005',
        type: 'inbound',
        billNumber: 'RK20240119001',
        date: '2024-01-19',
        billTypeName: '采购入库',
        totalAmount: '25,600.00',
        creator: '赵六',
        createTime: '2024-01-19 11:20',
        supplier: '深圳数码配件厂',
        products: [
          { name: 'AirPods Pro', quantity: 50 },
          { name: 'Apple Watch', quantity: 20 }
        ]
      },
      {
        id: '006',
        type: 'outbound',
        billNumber: 'CK20240120001',
        date: '2024-01-20',
        billTypeName: '销售出库',
        totalAmount: '18,500.00',
        creator: '钱七',
        createTime: '2024-01-20 15:30',
        customer: '北京中关村客户',
        products: [
          { name: 'AirPods Pro', quantity: 30 },
          { name: 'Apple Watch', quantity: 15 }
        ]
      }
    ];
    
    console.log('Loading bill data:', mockBills);
    
    this.setData({
      sourceBills: mockBills
    });
    
    // 初始显示所有数据
    this.setData({
      bills: mockBills,
      totalCount: mockBills.length
    });
    
    console.log('Bills loaded:', this.data.bills);
  }

  ,
  /**
   * 根据当前筛选条件过滤数据
   */
  applyFilters: function() {
    const { sourceBills, searchKeyword, startDate, endDate, billTypeIndex, suppliers, supplierIndex, customers, customerIndex } = this.data;
    const keyword = (searchKeyword || '').trim();
    const typeMap = { 1: 'inbound', 2: 'outbound' };
    const selectedType = billTypeIndex === 0 ? null : typeMap[billTypeIndex];
    const selectedSupplier = supplierIndex === 0 ? null : suppliers[supplierIndex];
    const selectedCustomer = customerIndex === 0 ? null : customers[customerIndex];

    const start = startDate ? new Date(startDate).getTime() : null;
    const end = endDate ? new Date(endDate).getTime() : null;

    return (sourceBills || []).filter(bill => {
      // 类型
      if (selectedType && bill.type !== selectedType) return false;
      // 日期
      const ts = new Date(bill.date).getTime();
      if (start && ts < start) return false;
      if (end && ts > end) return false;
      // 供应商
      if (selectedSupplier && bill.supplier !== selectedSupplier) return false;
      // 客户
      if (selectedCustomer && bill.customer !== selectedCustomer) return false;
      // 关键词：单号、制单人、产品名称
      if (keyword) {
        const inProducts = (bill.products || []).some(p => (p.name || '').includes(keyword));
        if (!((bill.billNumber || '').includes(keyword) || (bill.creator || '').includes(keyword) || inProducts)) {
          return false;
        }
      }
      return true;
    });
  }
})