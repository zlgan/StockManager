// product-detail.js
Page({
  data: {
    mode: 'view', // 'view', 'edit', 'add'
    productId: null,
    tempImagePath: '',
    categoryIndex: -1,
    categoryOptions: ['手机配件', '数码配件', '电脑周边', '智能设备'],
    unitIndex: -1,
    unitOptions: ['个', '件', '套', '盒', '箱'],
    supplierIndex: -1,
    supplierOptions: ['广州数码科技有限公司', '深圳电子配件批发商', '东莞手机配件厂'],
    product: {
      name: '',
      code: '',
      spec: '',
      inboundPrice: '',
      outboundPrice: '',
      minStock: '',
      enabled: true,
      remark: ''
    }
  },
  
  onLoad: function(options) {
    if (options.mode === 'add') {
      this.setData({
        mode: 'add'
      });
    } else if (options.id) {
      this.setData({
        mode: 'view',
        productId: options.id
      });
      this.loadProductData(options.id);
    }
  },
  
  loadProductData: function(id) {
    // 模拟加载产品数据
    const productData = {
      id: id,
      name: '无线充电器',
      code: 'SP20230001',
      categoryIndex: 0,
      unitIndex: 0,
      supplierIndex: 0,
      spec: 'QI标准',
      inboundPrice: '39.00',
      outboundPrice: '59.00',
      minStock: '10',
      enabled: true,
      remark: '支持多种手机型号',
      image: '../../images/product-placeholder.png'
    };
    
    this.setData({
      product: productData,
      categoryIndex: productData.categoryIndex,
      unitIndex: productData.unitIndex,
      supplierIndex: productData.supplierIndex,
      tempImagePath: productData.image
    });
  },
  
  navigateBack: function() {
    wx.navigateBack();
  },
  
  chooseImage: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          tempImagePath: res.tempFilePaths[0]
        });
      }
    });
  },
  
  scanCode: function() {
    wx.scanCode({
      success: (res) => {
        const product = this.data.product;
        product.code = res.result;
        
        this.setData({
          product: product
        });
      },
      fail: () => {
        wx.showToast({
          title: '扫码失败',
          icon: 'none'
        });
      }
    });
  },
  
  bindCategoryChange: function(e) {
    this.setData({
      categoryIndex: parseInt(e.detail.value)
    });
  },
  
  bindUnitChange: function(e) {
    this.setData({
      unitIndex: parseInt(e.detail.value)
    });
  },
  
  bindSupplierChange: function(e) {
    this.setData({
      supplierIndex: parseInt(e.detail.value)
    });
  },
  
  switchChange: function(e) {
    const product = this.data.product;
    product.enabled = e.detail.value;
    
    this.setData({
      product: product
    });
  },
  
  submitForm: function(e) {
    const formData = e.detail.value;
    const { categoryIndex, unitIndex, supplierIndex, categoryOptions, unitOptions, supplierOptions } = this.data;
    
    // 表单验证
    if (!formData.name) {
      wx.showToast({
        title: '请输入产品名称',
        icon: 'none'
      });
      return;
    }
    
    // 构建产品数据
    const productData = {
      name: formData.name,
      code: formData.code,
      category: categoryIndex !== -1 ? categoryOptions[categoryIndex] : '',
      unit: unitIndex !== -1 ? unitOptions[unitIndex] : '',
      supplier: supplierIndex !== -1 ? supplierOptions[supplierIndex] : '',
      spec: formData.spec,
      inboundPrice: formData.inboundPrice,
      outboundPrice: formData.outboundPrice,
      minStock: formData.minStock,
      enabled: this.data.product.enabled,
      remark: formData.remark,
      image: this.data.tempImagePath
    };
    
    // 保存产品数据
    wx.showLoading({
      title: '保存中...',
    });
    
    // 模拟保存
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 2000,
        success: () => {
          setTimeout(() => {
            wx.navigateBack();
          }, 2000);
        }
      });
    }, 1500);
  }
});