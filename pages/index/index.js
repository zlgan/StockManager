// index.js
Page({
  data: {
    todayStats: {
      inbound: {
        count: 12,
        amount: '8,560.00'
      },
      outbound: {
        count: 8,
        amount: '5,280.00'
      }
    },
    recentRecords: {
      inbound: [
        {
          id: 'in001',
          productName: '苹果手机壳',
          type: '采购入库',
          quantity: 100,
          unit: '个',
          amount: '1,500.00',
          time: '2023-09-15 10:30'
        },
        {
          id: 'in002',
          productName: 'Type-C数据线',
          type: '采购入库',
          quantity: 200,
          unit: '个',
          amount: '2,000.00',
          time: '2023-09-15 09:15'
        }
      ],
      outbound: [
        {
          id: 'out001',
          productName: '苹果手机壳',
          type: '销售出库',
          quantity: 20,
          unit: '个',
          amount: '400.00',
          time: '2023-09-15 14:20'
        },
        {
          id: 'out002',
          productName: 'Type-C数据线',
          type: '销售出库',
          quantity: 50,
          unit: '个',
          amount: '750.00',
          time: '2023-09-15 13:45'
        }
      ]
    }
  },
  
  onLoad: function() {
    this.checkLoginStatus();
  },

  onShow: function() {
    // 每次显示页面时也检查登录状态
    this.checkLoginStatus();
  },

  checkLoginStatus: function() {
    const isLoggedIn = wx.getStorageSync('isLoggedIn');
    const currentUser = wx.getStorageSync('currentUser');
    
    if (!isLoggedIn || !currentUser) {
      // 用户未登录，跳转到登录页
      wx.reLaunch({
        url: '/pages/login/login'
      });
      return;
    }
    
    // 用户已登录，加载页面数据
    this.loadPageData();
  },

  loadPageData: function() {
    // 可以在这里加载实际数据
    console.log('用户已登录，加载首页数据');
  },
  
  navigateToInbound: function() {
    wx.navigateTo({
      url: '/pages/inbound/inbound'
    });
  },
  
  navigateToOutbound: function() {
    wx.navigateTo({
      url: '/pages/outbound/outbound'
    });
  },
  
  navigateToBills: function() {
    wx.switchTab({
      url: '/pages/bills/bills'
    });
  },
  
  viewBillDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    const type = e.currentTarget.dataset.type;
    wx.navigateTo({
      url: `/pages/bill-detail/bill-detail?id=${id}&type=${type}`
    });
  }
});