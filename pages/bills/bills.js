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
    sourceBills: [],
    pageSize: 20,
    page: 0,
    hasMore: true,
    loading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.initDateRange();
    this.loadBillData(true);
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
  loadBillData: function(reset) {
    const user=wx.getStorageSync('currentUser')||{}
    const shopId=user.shopId||''
    const db=wx.cloud.database()
    let {page,pageSize}=this.data
    if(reset){ page=0; this.setData({page:0,hasMore:true,sourceBills:[],bills:[]}) }
    this.setData({loading:true})
    db.collection('stockBills').where({shopId}).orderBy('billDate','desc').skip(page*pageSize).limit(pageSize).get().then(res=>{
      const chunk=(res.data||[]).map(b=>({
        id:b._id,
        type:b.direction==='in'?'inbound':'outbound',
        billNumber:b.billNo,
        date:(b.billDate&&b.billDate.slice)?b.billDate.slice(0,10):new Date(b.billDate).toISOString().slice(0,10),
        billTypeName:b.billType,
        totalAmount:(b.totals&&b.totals.totalAmount||0).toFixed? (b.totals.totalAmount).toFixed(2): (b.totals&&b.totals.totalAmount)||0,
        creator:b.createdBy,
        createTime: new Date(b.createdAt).toISOString().replace('T',' ').slice(0,16),
        supplier:b.counterparty&&b.counterparty.supplierName,
        customer:b.counterparty&&b.counterparty.customerName,
        products: []
      }))
      const merged=[...this.data.sourceBills,...chunk]
      const hasMore=(chunk.length===pageSize)
      const pageNext=page+1
      const filtered=this.applyFiltersWith(merged)
      this.setData({sourceBills:merged,bills:filtered,totalCount:filtered.length,hasMore,page:pageNext,loading:false})
    })
  },

  
  onReachBottom: function(){
    if(this.data.loading||!this.data.hasMore) return
    this.loadBillData(false)
  }
  ,
  /**
   * 根据当前筛选条件过滤数据
   */
  applyFilters: function() {
    const { sourceBills } = this.data;
    return this.applyFiltersWith(sourceBills)
  }
  ,
  applyFiltersWith: function(sourceBills){
    const { searchKeyword, startDate, endDate, billTypes, billTypeIndex, suppliers, supplierIndex, customers, customerIndex } = this.data;
    const keyword = (searchKeyword || '').trim();
    const typeMap = { 1: 'inbound', 2: 'outbound' };
    const selectedType = billTypeIndex === 0 ? null : typeMap[billTypeIndex];
    const selectedSupplier = supplierIndex === 0 ? null : suppliers[supplierIndex];
    const selectedCustomer = customerIndex === 0 ? null : customers[customerIndex];

    const start = startDate ? new Date(startDate).getTime() : null;
    const end = endDate ? new Date(endDate).getTime() : null;

    const list=(sourceBills || []).filter(bill => {
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
    return list
  }
})