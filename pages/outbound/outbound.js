// outbound.js
Page({
  data: {
    billNo: 'CK' + new Date().getFullYear() + 
            (new Date().getMonth() + 1).toString().padStart(2, '0') + 
            new Date().getDate().toString().padStart(2, '0') + 
            Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
    date: new Date().toISOString().split('T')[0],
    typeIndex: -1,
    typeOptions: ['销售出库', '退货出库', '调拨出库'],
    customerIndex: -1,
    customerOptions: ['广州手机配件商城', '深圳电子市场', '东莞数码专卖店'],
    productOptions: ['苹果手机壳', 'Type-C数据线', '无线充电器', '蓝牙耳机', '手机支架'],
    products: [
      {
        productIndex: -1,
        stock: 100,
        quantity: '',
        price: '',
      }
    ],
    remark: '',
    totalQuantity: 0,
    totalAmount: '0.00'
  },
  
  onLoad: function() {
    // 可以在这里加载实际数据
  },
  
  navigateBack: function() {
    wx.navigateBack();
  },
  
  bindTypeChange: function(e) {
    this.setData({
      typeIndex: parseInt(e.detail.value)
    });
  },
  
  bindDateChange: function(e) {
    this.setData({
      date: e.detail.value
    });
  },
  
  bindCustomerChange: function(e) {
    this.setData({
      customerIndex: parseInt(e.detail.value)
    });
  },
  
  bindProductChange: function(e) {
    const index = e.currentTarget.dataset.index;
    const products = this.data.products;
    const productIndex = parseInt(e.detail.value);
    products[index].productIndex = productIndex;
    
    // 模拟获取库存数量
    const stockMap = {
      0: 100,
      1: 200,
      2: 50,
      3: 80,
      4: 120
    };
    
    products[index].stock = stockMap[productIndex] || 0;
    
    this.setData({
      products: products
    });
  },
  
  inputQuantity: function(e) {
    const index = e.currentTarget.dataset.index;
    const products = this.data.products;
    products[index].quantity = e.detail.value;
    
    this.setData({
      products: products
    });
    
    this.calculateTotal();
  },
  
  inputPrice: function(e) {
    const index = e.currentTarget.dataset.index;
    const products = this.data.products;
    products[index].price = e.detail.value;
    
    this.setData({
      products: products
    });
    
    this.calculateTotal();
  },
  
  addProduct: function() {
    const products = this.data.products;
    products.push({
      productIndex: -1,
      stock: 0,
      quantity: '',
      price: ''
    });
    
    this.setData({
      products: products
    });
  },
  
  deleteProduct: function(e) {
    const index = e.currentTarget.dataset.index;
    const products = this.data.products;
    
    if (products.length > 1) {
      products.splice(index, 1);
      
      this.setData({
        products: products
      });
      
      this.calculateTotal();
    } else {
      wx.showToast({
        title: '至少需要一个产品',
        icon: 'none'
      });
    }
  },
  
  scanCode: function(e) {
    const that = this;
    const index = e.currentTarget.dataset.index;
    
    wx.scanCode({
      success: function(res) {
        // 这里可以处理扫码结果，例如查询产品信息
        wx.showToast({
          title: '扫码成功',
          icon: 'success'
        });
      },
      fail: function() {
        wx.showToast({
          title: '扫码失败',
          icon: 'none'
        });
      }
    });
  },
  
  calculateTotal: function() {
    let totalQuantity = 0;
    let totalAmount = 0;
    
    this.data.products.forEach(product => {
      if (product.quantity && product.price) {
        totalQuantity += parseInt(product.quantity);
        totalAmount += parseInt(product.quantity) * parseFloat(product.price);
      }
    });
    
    this.setData({
      totalQuantity: totalQuantity,
      totalAmount: totalAmount.toFixed(2)
    });
  },
  
  submitForm: function(e) {
    // 表单验证
    if (this.data.typeIndex === -1) {
      wx.showToast({
        title: '请选择出库类型',
        icon: 'none'
      });
      return;
    }
    
    let valid = true;
    this.data.products.forEach((product, index) => {
      if (product.productIndex === -1) {
        wx.showToast({
          title: `请选择第${index + 1}个产品`,
          icon: 'none'
        });
        valid = false;
        return;
      }
      
      if (!product.quantity) {
        wx.showToast({
          title: `请输入第${index + 1}个产品的数量`,
          icon: 'none'
        });
        valid = false;
        return;
      }
      
      if (parseInt(product.quantity) > product.stock) {
        wx.showToast({
          title: `第${index + 1}个产品的出库数量不能大于库存数量`,
          icon: 'none'
        });
        valid = false;
        return;
      }
      
      if (!product.price) {
        wx.showToast({
          title: `请输入第${index + 1}个产品的单价`,
          icon: 'none'
        });
        valid = false;
        return;
      }
    });
    
    if (!valid) return;
    
    // 提交表单
    wx.showLoading({
      title: '提交中...',
    });
    
    // 模拟提交
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '出库成功',
        icon: 'success',
        duration: 2000,
        success: function() {
          setTimeout(() => {
            wx.navigateBack();
          }, 2000);
        }
      });
    }, 1500);
  }
});