// index.js
Page({
  data: {
    todayStats: { inbound: { count: 0, amount: '0.00' }, outbound: { count: 0, amount: '0.00' } },
    recentRecords: { inbound: [], outbound: [] }
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
    const user=wx.getStorageSync('currentUser')||{}
    const shopId=user.shopId||''
    wx.cloud.callFunction({name:'stockService',data:{action:'homeOverview',shopId}}).then(res=>{
      const d=res.result||{}
      const todayStats={
        inbound:{count:d.today&&d.today.inbound?d.today.inbound.count:0,amount:(d.today&&d.today.inbound?d.today.inbound.amount:0).toFixed?d.today.inbound.amount.toFixed(2):d.today&&d.today.inbound?d.today.inbound.amount:0},
        outbound:{count:d.today&&d.today.outbound?d.today.outbound.count:0,amount:(d.today&&d.today.outbound?d.today.outbound.amount:0).toFixed?d.today.outbound.amount.toFixed(2):d.today&&d.today.outbound?d.today.outbound.amount:0}
      }
      const recentRecords={
        inbound:(d.recent||[]).filter(x=>x.direction==='in').map(x=>({id:x.billRef&&x.billRef.billId,productName:x.productName,type:'入库',quantity:x.quantity,unit:'',amount:(x.amount||0).toFixed(2),time:new Date(x.createdAt).toISOString().replace('T',' ').slice(0,16)})),
        outbound:(d.recent||[]).filter(x=>x.direction==='out').map(x=>({id:x.billRef&&x.billRef.billId,productName:x.productName,type:'出库',quantity:x.quantity,unit:'',amount:(x.amount||0).toFixed(2),time:new Date(x.createdAt).toISOString().replace('T',' ').slice(0,16)}))
      }
      this.setData({todayStats,recentRecords})
    })
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
      url: `/pages/bill_detail/bill_detail?id=${id}&type=${type}`
    });
  }
});
