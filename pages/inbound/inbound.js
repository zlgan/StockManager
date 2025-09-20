// pages/inbound/inbound.js
Page({
  data: {
    billNo: 'RK' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '001',
    date: new Date().toISOString().slice(0, 10),
    inboundType: '',
    supplier: '',
    remark: '',
    products: [
      {
        id: 1,
        name: '',
        quantity: 1,
        price: '',
        amount: 0
      }
    ],
    totalQuantity: 1,
    totalAmount: 0,
    suppliers: [
      { id: 1, name: '广州电子科技有限公司' },
      { id: 2, name: '深圳数码配件厂' },
      { id: 3, name: '东莞塑胶制品有限公司' }
    ],
    inboundTypes: [
      { id: 1, name: '采购入库' },
      { id: 2, name: '退货入库' },
      { id: 3, name: '调拨入库' }
    ],
    productList: [
      { id: 1, name: '苹果手机壳' },
      { id: 2, name: 'Type-C数据线' },
      { id: 3, name: '无线充电器' }
    ]
  },

  onLoad: function (options) {
    // 页面加载时执行
  },

  // 选择入库类型
  bindTypeChange: function(e) {
    const index = e.detail.value;
    const type = this.data.inboundTypes[index].name;
    this.setData({
      inboundType: type
    });
  },

  // 选择供应商
  bindSupplierChange: function(e) {
    const index = e.detail.value;
    const supplier = this.data.suppliers[index].name;
    this.setData({
      supplier: supplier
    });
  },

  // 选择产品
  bindProductChange: function(e) {
    const { index } = e.currentTarget.dataset;
    const productIndex = e.detail.value;
    const productName = this.data.productList[productIndex].name;
    
    const products = this.data.products;
    products[index].name = productName;
    
    this.setData({
      products: products
    });
    
    this.calculateTotal();
  },

  // 输入数量
  inputQuantity: function(e) {
    const { index } = e.currentTarget.dataset;
    const quantity = parseInt(e.detail.value) || 0;
    
    const products = this.data.products;
    products[index].quantity = quantity;
    products[index].amount = quantity * (products[index].price || 0);
    
    this.setData({
      products: products
    });
    
    this.calculateTotal();
  },

  // 输入单价
  inputPrice: function(e) {
    const { index } = e.currentTarget.dataset;
    const price = parseFloat(e.detail.value) || 0;
    
    const products = this.data.products;
    products[index].price = price;
    products[index].amount = price * (products[index].quantity || 0);
    
    this.setData({
      products: products
    });
    
    this.calculateTotal();
  },

  // 添加产品
  addProduct: function() {
    const products = this.data.products;
    const newProduct = {
      id: products.length + 1,
      name: '',
      quantity: 1,
      price: '',
      amount: 0
    };
    
    products.push(newProduct);
    
    this.setData({
      products: products
    });
    
    this.calculateTotal();
  },

  // 删除产品
  removeProduct: function(e) {
    const { index } = e.currentTarget.dataset;
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

  // 计算总计
  calculateTotal: function() {
    const products = this.data.products;
    let totalQuantity = 0;
    let totalAmount = 0;
    
    products.forEach(product => {
      totalQuantity += product.quantity || 0;
      totalAmount += product.amount || 0;
    });
    
    this.setData({
      totalQuantity: totalQuantity,
      totalAmount: totalAmount.toFixed(2)
    });
  },

  // 提交表单
  submitForm: function() {
    // 表单验证
    if (!this.data.inboundType) {
      wx.showToast({
        title: '请选择入库类型',
        icon: 'none'
      });
      return;
    }
    
    const products = this.data.products;
    let valid = true;
    
    products.forEach(product => {
      if (!product.name) {
        wx.showToast({
          title: '请选择产品',
          icon: 'none'
        });
        valid = false;
        return;
      }
      
      if (!product.quantity) {
        wx.showToast({
          title: '请输入数量',
          icon: 'none'
        });
        valid = false;
        return;
      }
      
      if (!product.price) {
        wx.showToast({
          title: '请输入单价',
          icon: 'none'
        });
        valid = false;
        return;
      }
    });
    
    if (!valid) return;
    
    // 提交数据
    wx.showLoading({
      title: '提交中',
    });
    
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '提交成功',
        icon: 'success'
      });
      
      // 返回首页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }, 1000);
  },

  // 取消
  cancel: function() {
    wx.navigateBack();
  }
})