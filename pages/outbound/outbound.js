// outbound.js
Page({
  data: {
    billNo: '',
    date: new Date().toISOString().split('T')[0],
    typeIndex: -1,
    typeOptions: [],
    customerIndex: -1,
    customerOptions: [],
    products: [
      {
        productId: '',
        name: '',
        quantity: '',
        price: '',
        amount: 0,
        stock: 0,
        model: '',
        unit: '',
        specification: '',
        imageUrl: '',
        suggestions: [],
        showSuggestions: false
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
    const db=wx.cloud.database(); const _=db.command
    if(role==='staff'){
      db.collection('shops').doc(shopId).get().then(res=>{
        const p=(res.data&&res.data.staffPermissions)||{}
        const disabled=!!p.disableOutbound
        this.setData({permissions:p,canSubmit:!disabled})
        if(disabled){ wx.showToast({title:'已禁用出库权限',icon:'none'}) }
      }).catch(err=>{ console.error(err) })
    }
    db.collection('config').limit(1).get().then(r=>{
      const cfg=(r.data&&r.data[0])||{}
      const opts=cfg.outboundType||[]
      this.setData({typeOptions:opts})
    })
    db.collection('customers').where({shopId}).field({name:true}).orderBy('name','asc').get().then(r=>{
      this.setData({customerOptions:(r.data||[]).map(x=>x.name)})
    })
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
  
  selectSuggestion: function(e){
    const index = e.currentTarget.dataset.index;
    const sidx = e.currentTarget.dataset.sidx;
    const products = this.data.products;
    const sel = products[index].suggestions[sidx]
    const user=wx.getStorageSync('currentUser')||{}
    const shopId=user.shopId||''
    const db=wx.cloud.database()
    products[index].productId=sel._id
    products[index].name=sel.name
    products[index].model=sel.code||products[index].model
    products[index].unit=sel.unit||''
    products[index].specification=sel.specification||''
    products[index].imageUrl=sel.imageUrl||products[index].imageUrl
    products[index].price=sel.outboundPrice||products[index].price
    products[index].showSuggestions=false
    this.setData({products})
    this.calculateTotal()
    db.collection('inventoryBalances').where({shopId,productId:sel._id}).limit(1).get().then(r=>{
      const b=(r.data&&r.data[0])||null
      products[index].stock=b?b.quantity:0
      this.setData({products})
    })
  },
  
  addProduct: function() {
    const products = this.data.products;
    products.push({
      productId: '',
      name: '',
      stock: 0,
      quantity: '',
      price: '',
      model: '',
      unit: '',
      specification: '',
      imageUrl: '',
      suggestions: [],
      showSuggestions: false
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
        this.linkByModel(index, model)
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
        const list=(r.data||[])
        products[index].suggestions=list
        products[index].showSuggestions=true
        this.setData({products})
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
    if(value){ this.linkByModel(index, value) }
  },

  linkByModel: function(index, code){
    const user=wx.getStorageSync('currentUser')||{}
    const shopId=user.shopId||''
    const db=wx.cloud.database()
    db.collection('products').where({shopId,code}).limit(1).get().then(r=>{
      const p=(r.data&&r.data[0])
      if(!p) return
      const products=this.data.products
      products[index].productId=p._id
      products[index].name=p.name||products[index].name||''
      products[index].price=(p.outboundPrice||products[index].price||0)
      products[index].unit=p.unit||products[index].unit||''
      products[index].specification=p.specification||products[index].specification||''
      products[index].imageUrl=p.imageUrl||products[index].imageUrl||''
      products[index].amount=(Number(products[index].quantity)||0)*(Number(products[index].price)||0)
      this.setData({products})
      return db.collection('inventoryBalances').where({shopId,productId:p._id}).limit(1).get()
    }).then(rs=>{
      if(!rs) return
      const b=(rs.data&&rs.data[0])||{quantity:0}
      const products=this.data.products
      products[index].stock=Number(b.quantity)||0
      this.setData({products})
      this.calculateTotal()
    })
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
      if (!product.name) {
        wx.showToast({
          title: `请输入第${index + 1}个产品名称`,
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
      
      if (product.productId && Number(product.quantity) > Number(product.stock)) {
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
    const items=this.data.products.map((p,i)=>({lineNo:i+1,productId:p.productId||'',productName:p.name,productCode:p.model||'',unit:p.unit||'',specification:p.specification||'',quantity:Number(p.quantity),unitPrice:Number(p.price)}))
    if(!this.data.canSubmit){ wx.showToast({title:'无出库权限',icon:'none'}); return }
    wx.showLoading({title:'提交中'})
    wx.cloud.callFunction({name:'stockService',data:{action:'createBill',shopId,direction:'out',billType,billDate,counterparty,items,createdBy,remarks:this.data.remark||''}}).then(res=>{
      wx.hideLoading();
      const r=(res&&res.result)||{}
      this.setData({billNo:r.billNo||''})
      wx.showToast({title:'出库成功',icon:'success'})
      setTimeout(()=>{ wx.navigateBack() },1000)
    }).catch(err=>{ wx.hideLoading(); wx.showToast({title: (err&&err.errMsg)||'提交失败',icon:'none'}) })
  }
});