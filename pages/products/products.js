Page({
  data: {
    categoryIndex: -1,
    categoryOptions: [],
    productName: '',
    productCode: '',
    products: [],
    originalProducts: []
  },

  onLoad: function() {
    this.loadCategories()
    this.loadProducts()
  },
  
  navigateBack: function() {
    wx.navigateBack();
  },
  
  bindCategoryChange: function(e) {
    this.setData({
      categoryIndex: parseInt(e.detail.value)
    });
  },
  
  inputProductName: function(e) {
    this.setData({
      productName: e.detail.value
    });
  },
  
  inputProductCode: function(e) {
    this.setData({
      productCode: e.detail.value
    });
  },
  
  scanCode: function() {
    wx.scanCode({
      success: (res) => {
        this.setData({
          productCode: res.result
        });
        
        // 扫码后自动搜索
        this.searchProducts();
      },
      fail: () => {
        wx.showToast({
          title: '扫码失败',
          icon: 'none'
        });
      }
    });
  },
  
  searchProducts: function() {
    const { categoryIndex, productName, productCode, categoryOptions } = this.data;
    const user = wx.getStorageSync('currentUser') || {}
    const shopId = user.shopId || ''
    const db = wx.cloud.database()
    const where = { shopId, isEnabled: true }
    if (categoryIndex !== -1 && categoryOptions[categoryIndex]) where.categoryName = categoryOptions[categoryIndex]
    db.collection('products').where(where).get().then(res => {
      let list = res.data || []
      if (productName) list = list.filter(p => (p.name||'').toLowerCase().includes(productName.toLowerCase()))
      if (productCode) list = list.filter(p => (p.code||'').toLowerCase().includes(productCode.toLowerCase()))
      const mapped = list.map(p => ({ id: p._id, name: p.name, category: p.categoryName, code: p.code, stock: p.stock||0, price: p.outboundPrice || 0, image: p.imageUrl || '../../images/product-placeholder.png' }))
      this.setData({ products: mapped })
      wx.showToast({ title: `找到 ${mapped.length} 个产品`, icon: 'none' })
    })
  },
  
  exportToExcel: function() {
    wx.showToast({
      title: '导出功能暂未实现',
      icon: 'none'
    });
  },
  
  navigateToDetail: function(e) {
    const productId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/product_detail/product_detail?id=${productId}`
    });
  },
  
  navigateToAdd: function() {
    wx.navigateTo({
      url: '/pages/product_detail/product_detail?mode=add'
    });
  },

  loadCategories: function(){
    const user = wx.getStorageSync('currentUser') || {}
    const shopId = user.shopId || ''
    const db = wx.cloud.database()
    db.collection('categories').where({ shopId, status: 'active' }).get().then(res=>{
      const names = (res.data||[]).map(i=>i.name)
      this.setData({ categoryOptions: names })
    })
  },

  loadProducts: function(){
    const user = wx.getStorageSync('currentUser') || {}
    const shopId = user.shopId || ''
    const db = wx.cloud.database()
    db.collection('products').where({ shopId, isEnabled: true }).get().then(res=>{
      const mapped = (res.data||[]).map(p=>({ id: p._id, name: p.name, category: p.categoryName, code: p.code, stock: p.stock||0, price: p.outboundPrice || 0, image: p.imageUrl || '../../images/product-placeholder.png' }))
      this.setData({ products: mapped, originalProducts: mapped })
    })
  }
});