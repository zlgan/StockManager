// product_detail.js
Page({
  data: {
    mode: 'view', // 'view', 'edit', 'add'
    productId: null,
    tempImagePath: '',
    categoryIndex: -1,
    categoryOptions: [],
    unitIndex: -1,
    unitOptions: [],
    supplierIndex: -1,
    supplierOptions: [],
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
    this.loadOptions()
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
    const user = wx.getStorageSync('currentUser') || {}
    const shopId = user.shopId || ''
    const db = wx.cloud.database()
    db.collection('products').doc(id).get().then(res=>{
      const p = res.data
      if(!p) return
      const ci = Math.max(0, this.data.categoryOptions.findIndex(n=>n===p.categoryName))
      const ui = Math.max(0, this.data.unitOptions.findIndex(n=>n===p.unit))
      const si = Math.max(0, this.data.supplierOptions.findIndex(n=>n===p.supplierName))
      this.setData({
        product: {
          name: p.name||'', code: p.code||'', spec: p.specification||'', inboundPrice: p.inboundPrice||'', outboundPrice: p.outboundPrice||'', minStock: p.warningStock||'', enabled: !!p.isEnabled, remark: p.remarks||'', image: p.imageUrl||''
        },
        categoryIndex: ci,
        unitIndex: ui,
        supplierIndex: si,
        tempImagePath: p.imageUrl||''
      })
    })
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

  loadOptions: function(){
    const user = wx.getStorageSync('currentUser') || {}
    const shopId = user.shopId || ''
    const db = wx.cloud.database()
    db.collection('categories').where({ shopId, status: 'active' }).get().then(res=>{
      this.setData({ categoryOptions: (res.data||[]).map(i=>i.name) })
    })
    db.collection('suppliers').where({ shopId, status: 'active' }).get().then(res=>{
      this.setData({ supplierOptions: (res.data||[]).map(i=>i.name) })
    })
    db.collection('config').where({ shopId }).get().then(res=>{
      const cfg=(res.data||[])[0]
      this.setData({ unitOptions: (cfg&&cfg.productUnit)||['个','件','套','盒','箱'] })
    })
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
      categoryName: categoryIndex !== -1 ? categoryOptions[categoryIndex] : '',
      unit: unitIndex !== -1 ? unitOptions[unitIndex] : '',
      supplierName: supplierIndex !== -1 ? supplierOptions[supplierIndex] : '',
      specification: formData.spec,
      inboundPrice: Number(formData.inboundPrice||0),
      outboundPrice: Number(formData.outboundPrice||0),
      warningStock: Number(formData.minStock||0),
      isEnabled: this.data.product.enabled,
      remarks: formData.remark,
      imageUrl: this.data.tempImagePath
    };
    
    wx.showLoading({ title: '保存中...' });
    const user = wx.getStorageSync('currentUser') || {}
    const shopId = user.shopId || ''
    const uploadIfNeeded = () => {
      const path = this.data.tempImagePath
      if(path && !/^cloud:/.test(path)){
        const name = `${shopId}_${Date.now()}.jpg`
        return wx.cloud.uploadFile({ cloudPath: `products/${name}`, filePath: path }).then(r=>{ productData.imageUrl = r.fileID })
      }
      return Promise.resolve()
    }
    uploadIfNeeded().then(()=>{
      const isEdit = this.data.mode!=='add' && this.data.productId
      const payload = isEdit ? { action: 'update', id: this.data.productId, shopId, data: productData } : { action: 'add', shopId, data: productData }
      return wx.cloud.callFunction({ name: 'productService', data: payload })
    }).then(()=>{
      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(()=>{ wx.navigateBack() }, 800)
    }).catch(()=>{
      wx.hideLoading()
      wx.showToast({ title: '保存失败', icon: 'none' })
    })
  }
});