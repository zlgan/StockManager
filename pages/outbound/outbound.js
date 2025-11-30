// outbound.js
Page({
  data: {
    billNo: 'CK' + new Date().getFullYear() + 
            (new Date().getMonth() + 1).toString().padStart(2, '0') + 
            new Date().getDate().toString().padStart(2, '0') + 
            Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
    date: new Date().toISOString().split('T')[0],
    typeIndex: -1,
    typeOptions: ['销售出库', '退货出库', '调拨出库', '增加配件出库', '折旧出库'],
    customerIndex: -1,
    customerOptions: ['广州手机配件商城', '深圳电子市场', '东莞数码专卖店'],
    productOptions: ['苹果手机壳', 'Type-C数据线', '无线充电器', '蓝牙耳机', '手机支架'],
    products: [
      {
        id: 1,
        name: '',
        quantity: 1,
        price: '',
        amount: 0,
        productIndex: -1,
        stock: 100,
        model: '',
        imageUrl: ''
      }
    ],
    remark: '',
    totalQuantity: 0,
    totalAmount: '0.00',
    permissions: null,
    canSubmit: true
  },
  
  onLoad: function() {
    const user=wx.getStorageSync('currentUser')||{}
    const shopId=user.shopId||''
    const role=user.role||''
    if(role==='staff'){
      const db=wx.cloud.database()
      db.collection('shops').doc(shopId).get().then(res=>{
        const p=(res.data&&res.data.staffPermissions)||{}
        const disabled=!!p.disableOutbound
        this.setData({permissions:p,canSubmit:!disabled})
        if(disabled){ wx.showToast({title:'已禁用出库权限',icon:'none'}) }
      }).catch(err=>{ console.error(err); throw err })
    }
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
  
  // 扫描产品型号
  scanModel: function(e) {
    const index = e.currentTarget.dataset.index;
    wx.scanCode({
      success: (res) => {
        const model = res.result;
        const products = this.data.products;
        products[index].model = model;
        this.setData({
          products: products
        });
        wx.showToast({
          title: '扫码成功',
          icon: 'success'
        });
      }
    });
  },
  
  // 输入产品名称
  inputName: function(e) {
    const index = e.currentTarget.dataset.index;
    const value = e.detail.value;
    const products = this.data.products;
    products[index].name = value;
    this.setData({
      products: products
    });
    const user=wx.getStorageSync('currentUser')||{}
    const shopId=user.shopId||''
    const db=wx.cloud.database(); const _=db.command
    if(value){
      db.collection('products').where({shopId,name:_.regex({regexp:value,options:'i'})}).limit(20).get().then(r=>{
        this.setData({productOptions:(r.data||[]).map(p=>p.name)})
      })
    }
  },
  
  // 输入产品型号
  inputModel: function(e) {
    const index = e.currentTarget.dataset.index;
    const value = e.detail.value;
    const products = this.data.products;
    products[index].model = value;
    this.setData({
      products: products
    });
  },
  
  // 选择图片
  chooseImage: function(e) {
    const index = e.currentTarget.dataset.index;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        const products = this.data.products;
        products[index].imageUrl = tempFilePath;
        this.setData({
          products: products
        });
      }
    });
  },
  
  // 预览图片
  previewImage: function(e) {
    const index = e.currentTarget.dataset.index;
    const imageUrl = this.data.products[index].imageUrl;
    wx.previewImage({
      urls: [imageUrl],
      current: imageUrl
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
    
    const user=wx.getStorageSync('currentUser')||{}
    const shopId=user.shopId||''
    const createdBy=user._id||''
    const billType=this.data.typeOptions[this.data.typeIndex]
    const billDate=this.data.date+'T00:00:00.000Z'
    const counterparty={customerName:this.data.customerOptions[this.data.customerIndex]||''}
    const items=this.data.products.map((p,i)=>({lineNo:i+1,productName:this.data.productOptions[p.productIndex]||p.name,productCode:p.model||'',unit:'',specification:'',quantity:Number(p.quantity),unitPrice:Number(p.price)}))
    if(!this.data.canSubmit){ wx.showToast({title:'无出库权限',icon:'none'}); return }
    wx.showLoading({title:'提交中'})
    wx.cloud.callFunction({name:'stockService',data:{action:'createBill',shopId,direction:'out',billType,billDate,counterparty,items,createdBy,remarks:this.data.remark||''}}).then(()=>{
      wx.hideLoading(); wx.showToast({title:'出库成功',icon:'success'})
      setTimeout(()=>{ wx.navigateBack() },800)
    }).catch(err=>{ wx.hideLoading(); wx.showToast({title: (err&&err.errMsg)||'提交失败',icon:'none'}) })
  }
});