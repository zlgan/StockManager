// products.js
Page({
  data: {
    categoryIndex: -1,
    categoryOptions: ['手机配件', '数码配件', '电脑周边', '智能设备'],
    productName: '',
    productCode: '',
    products: [
      {
        id: 1,
        name: '无线充电器',
        category: '手机配件',
        code: 'SP20230001',
        stock: 128,
        price: '59.00',
        image: '../../images/product-placeholder.png'
      },
      {
        id: 2,
        name: 'Type-C数据线',
        category: '手机配件',
        code: 'SP20230002',
        stock: 256,
        price: '29.00',
        image: '../../images/product-placeholder.png'
      },
      {
        id: 3,
        name: '蓝牙耳机',
        category: '数码配件',
        code: 'SP20230003',
        stock: 64,
        price: '129.00',
        image: '../../images/product-placeholder.png'
      },
      {
        id: 4,
        name: '手机壳',
        category: '手机配件',
        code: 'SP20230004',
        stock: 320,
        price: '19.00',
        image: '../../images/product-placeholder.png'
      }
    ],
    originalProducts: [] // 用于存储原始产品列表，便于搜索过滤
  },
  
  onLoad: function() {
    // 保存原始产品列表
    this.setData({
      originalProducts: this.data.products
    });
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
    const { categoryIndex, productName, productCode, originalProducts, categoryOptions } = this.data;
    
    // 过滤产品
    let filteredProducts = [...originalProducts];
    
    if (categoryIndex !== -1) {
      const category = categoryOptions[categoryIndex];
      filteredProducts = filteredProducts.filter(product => product.category === category);
    }
    
    if (productName) {
      filteredProducts = filteredProducts.filter(product => 
        product.name.toLowerCase().includes(productName.toLowerCase())
      );
    }
    
    if (productCode) {
      filteredProducts = filteredProducts.filter(product => 
        product.code.toLowerCase().includes(productCode.toLowerCase())
      );
    }
    
    this.setData({
      products: filteredProducts
    });
    
    // 显示搜索结果提示
    wx.showToast({
      title: `找到 ${filteredProducts.length} 个产品`,
      icon: 'none'
    });
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
  }
});