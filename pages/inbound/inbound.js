// pages/inbound/inbound.js
Page({
  data: {
    billNo: '',
    date: new Date().toISOString().slice(0, 10),
    inboundType: '',
    supplier: '',
    remark: '',
    typeIndex: -1,
    supplierIndex: -1,
    showSuggestions: false,
    currentEditIndex: -1,
    filteredProducts: [],
    suggestIndex: -1,
    
    supplierOptions: [],
    productOptions: [],
    inboundTypeOptions: [],
    products: [
      {
        id: 1,
        name: '',
        quantity: 1,
        price: '',
        amount: 0,
        productIndex: -1,
        model: '',
        unit: '',
        specification: '',
        imageUrl: ''
      }
    ],
    totalQuantity: 1,
    totalAmount: 0,
    productList: [],
    permissions: null,
    canSubmit: true
  },

  onLoad: function (options) {
    const user=wx.getStorageSync('currentUser')||{}
    const shopId=user.shopId||''
    const role=user.role||''
    const db=wx.cloud.database()
    // 权限
    if(role==='staff'){
      db.collection('shops').doc(shopId).get().then(res=>{
        const p=(res.data&&res.data.staffPermissions)||{}
        const disabled=!!p.disableInbound
        this.setData({permissions:p,canSubmit:!disabled})
        if(disabled){ wx.showToast({title:'已禁用入库权限',icon:'none'}) }
      }).catch(err=>{ console.error(err); throw err })
    }
    // 入库类型
    db.collection('config').get().then(r=>{
      const types=[...new Set((r.data||[]).flatMap(x=>x.inboundType||[]))]
      this.setData({inboundTypeOptions:types})
    })
    // 供应商
    db.collection('suppliers').where({shopId,status:'active'}).field({name:true}).limit(100).get().then(r=>{
      this.setData({supplierOptions:(r.data||[]).map(x=>x.name)})
    })
    if(options && options.productId){
      const pid=options.productId
      db.collection('products').doc(pid).get().then(res=>{
        const p=res.data||{}
        if(!p._id) return
        const products=this.data.products
        const idx=0
        products[idx].productId=p._id
        products[idx].name=p.name||products[idx].name||''
        products[idx].model=p.code||products[idx].model||''
        products[idx].price=(p.inboundPrice||products[idx].price||0)
        products[idx].unit=p.unit||products[idx].unit||''
        products[idx].specification=p.specification||products[idx].specification||''
        products[idx].imageUrl=p.imageUrl||products[idx].imageUrl||''
        products[idx].amount=(Number(products[idx].quantity)||0)*(Number(products[idx].price)||0)
        this.setData({products})
        return db.collection('inventoryBalances').where({shopId,productId:p._id}).limit(1).get()
      }).then(rs=>{
        if(!rs) return
        const b=(rs.data&&rs.data[0])||{quantity:0}
        const products=this.data.products
        products[0].stock=Number(b.quantity)||0
        this.setData({products})
        this.calculateTotal()
      })
    }
  },

  // 选择入库类型
  bindTypeChange: function(e) {
    const index = e.detail.value;
    const type = this.data.inboundTypeOptions[index];
    this.setData({
      inboundType: type,
      typeIndex: index
    });
  },

  // 选择供应商
  bindSupplierChange: function(e) {
    const index = e.detail.value;
    const supplier = this.data.supplierOptions[index];
    this.setData({
      supplier: supplier,
      supplierIndex: index
    });
  },

  // 选择产品
  bindProductChange: function(e) {
    const { index } = e.currentTarget.dataset;
    const productIndex = e.detail.value;
    const productName = this.data.productOptions[productIndex];
    
    const products = this.data.products;
    products[index].name = productName;
    products[index].productIndex = productIndex;
    
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
      amount: 0,
      model: '',
      unit: '',
      specification: '',
      imageUrl: ''
    };
    
    products.unshift(newProduct);
    
    this.setData({
      products: products
    });
    
    this.calculateTotal();
  },

  // 删除产品
  removeProduct: function(e) {
    const { index } = e.currentTarget.dataset;
    const products = this.data.products;
    if (products.length <= 1) {
      wx.showToast({ title: '至少需要一个产品', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '确认删除',
      content: '确定删除该产品吗？',
      success: (res) => {
        if (res.confirm) {
          products.splice(index, 1);
          this.setData({ products });
          this.calculateTotal();
        }
      }
    });
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

  // 扫码
  scanCode: function(e) {
    const index = e.currentTarget.dataset.index;
    wx.scanCode({
      success: (res) => {
        // 这里处理扫码结果
        wx.showToast({
          title: '扫码成功',
          icon: 'success'
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
        this.linkByModel(index, model);
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
    
    // 搜索匹配产品
    if(value){
      this.searchProducts(value, index);
      this.linkByName(index, value)
    }else{
      products[index].productId=''
      products[index].model=''
      products[index].price=''
      products[index].unit=''
      products[index].specification=''
      products[index].imageUrl=''
      products[index].stock=0
      products[index].amount=0
      this.setData({products})
      this.calculateTotal()
    }
  },
  
  // 搜索匹配产品
  searchProducts: function(keyword, index) {
    if (!keyword) {
      this.setData({
        filteredProducts: [],
        showSuggestions: false
      });
      return;
    }
    
    const user=wx.getStorageSync('currentUser')||{}
    const shopId=user.shopId||''
    const db=wx.cloud.database()
    const _=db.command
    db.collection('products').where({shopId,name:db.RegExp({regexp:keyword,options:'i'})}).limit(20).get().then(res=>{
      const filtered=(res.data||[]).map(p=>({id:p._id,name:p.name,model:p.code,price:p.inboundPrice||0,imageUrl:p.imageUrl||''}))
      this.setData({filteredProducts:filtered,currentEditIndex:index,showSuggestions:true})
    })
  },
  
  // 显示建议列表
  showSuggestions: function(e) {
    const { index } = e.currentTarget.dataset;
    const keyword = this.data.products[index].name;
    
    this.setData({
      currentEditIndex: index,
      showSuggestions: true
    });
    
    if (keyword) {
      this.searchProducts(keyword, index);
    }
  },
  
  // 延迟隐藏建议列表（防止点击建议项时因为blur事件导致无法选择）
  hideSuggestionsDelayed: function() {
    setTimeout(() => {
      this.setData({
        showSuggestions: false
      });
    }, 300);
  },
  
  // 选择产品
  selectProduct: function(e) {
    const { name, id } = e.currentTarget.dataset;
    const productIndex = this.data.currentEditIndex;
    const selectedProduct = this.data.filteredProducts.find(p => p.id === id) || {};
    
    // 更新产品信息
    const products = this.data.products;
    products[productIndex].name = name;
    products[productIndex].productId = id;
    products[productIndex].model = selectedProduct.model;
    products[productIndex].price = selectedProduct.price;
    // 查询当前库存
    const user=wx.getStorageSync('currentUser')||{}
    const shopId=user.shopId||''
    const db=wx.cloud.database()
    db.collection('inventoryBalances').where({shopId,productId:id}).limit(1).get().then(r=>{
      const b=(r.data&&r.data[0])||{quantity:0}
      products[productIndex].stock = b.quantity||0;
      products[productIndex].imageUrl = selectedProduct.imageUrl;
      products[productIndex].amount = (products[productIndex].quantity||0) * (selectedProduct.price||0);
      this.setData({products,showSuggestions:false,filteredProducts:[]});
      this.calculateTotal();
    })
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
    if(value){
      this.linkByModel(index, value)
    } else {
      products[index].productId=''
      products[index].name=''
      products[index].price=''
      products[index].unit=''
      products[index].specification=''
      products[index].imageUrl=''
      products[index].stock=0
      products[index].amount=0
      this.setData({products})
      this.calculateTotal()
    }
  },

  linkByModel: function(index, code){
    const user=wx.getStorageSync('currentUser')||{}
    const shopId=user.shopId||''
    const db=wx.cloud.database()
    db.collection('products').where({shopId,code}).limit(1).get().then(r=>{
      const p=(r.data&&r.data[0])
      if(!p){
        const products=this.data.products
        products[index].productId=''
        products[index].name=''
        products[index].price=''
        products[index].unit=''
        products[index].specification=''
        products[index].imageUrl=''
        products[index].stock=0
        products[index].amount=0
        this.setData({products})
        this.calculateTotal()
        return
      }
      const products=this.data.products
      products[index].productId=p._id
      products[index].name=p.name||products[index].name||''
      products[index].price=(p.inboundPrice||products[index].price||0)
      products[index].unit=p.unit||products[index].unit||''
      products[index].specification=p.specification||products[index].specification||''
      products[index].imageUrl=p.imageUrl||products[index].imageUrl||''
      products[index].amount=(products[index].quantity||0)*(products[index].price||0)
      this.setData({products})
      return db.collection('inventoryBalances').where({shopId,productId:p._id}).limit(1).get()
    }).then(rs=>{
      console.log("aaaaaaaaaaaaaa");
      if(!rs) return
      const b=(rs.data&&rs.data[0])||{quantity:0}
      const products=this.data.products
      products[index].stock=b.quantity||0
      this.setData({products})
      this.calculateTotal()
    })
  },

  linkByName: function(index, name){
    const user=wx.getStorageSync('currentUser')||{}
    const shopId=user.shopId||''
    const db=wx.cloud.database()
    db.collection('products').where({shopId,name}).limit(1).get().then(r=>{
      const p=(r.data&&r.data[0])
      if(!p){
        const products=this.data.products
        products[index].productId=''
        products[index].model=''
        products[index].price=''
        products[index].unit=''
        products[index].specification=''
        products[index].imageUrl=''
        products[index].stock=0
        products[index].amount=0
        this.setData({products})
        this.calculateTotal()
        return
      }
      const products=this.data.products
      products[index].productId=p._id
      products[index].name=p.name||products[index].name||''
      products[index].model=p.code||products[index].model||''
      products[index].price=(p.inboundPrice||products[index].price||0)
      products[index].unit=p.unit||products[index].unit||''
      products[index].specification=p.specification||products[index].specification||''
      products[index].imageUrl=p.imageUrl||products[index].imageUrl||''
      products[index].amount=(products[index].quantity||0)*(products[index].price||0)
      this.setData({products})
      return db.collection('inventoryBalances').where({shopId,productId:p._id}).limit(1).get()
    }).then(rs=>{
      if(!rs) return
      const b=(rs.data&&rs.data[0])||{quantity:0}
      const products=this.data.products
      products[index].stock=b.quantity||0
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
    const ids = new Set();
    const names = new Set();
    
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
      const pid=(product.productId||''); const pname=(product.name||'');
      const key=pid||pname;
      if(key){
        if((pid && ids.has(pid)) || (pname && names.has(pname))){
          wx.showToast({ title: '不允许在一次入库中提交重复产品', icon: 'none' });
          valid=false; return;
        }
        if(pid) ids.add(pid); if(pname) names.add(pname);
      }
    });
    
    if (!valid) return;
    
    const user=wx.getStorageSync('currentUser')||{}
    const shopId=user.shopId||''
    const createdBy=user.username||''
    const billType=this.data.inboundType
    const billDate=this.data.date+'T00:00:00.000Z'
    const counterparty={supplierName:this.data.supplier}
    const items=this.data.products.map((p,i)=>({lineNo:i+1,productId:p.productId,productName:p.name,productCode:p.model||'',unit:p.unit||'',specification:p.specification||'',quantity:Number(p.quantity),unitPrice:Number(p.price)}))
    if(!this.data.canSubmit){ wx.showToast({title:'无入库权限',icon:'none'}); return }
    wx.showLoading({title:'提交中'})
    wx.cloud.callFunction({name:'stockService',data:{action:'createBill',shopId,direction:'in',billType,billDate,counterparty,items,createdBy,remarks:this.data.remark||''}}).then(res=>{
      const r=(res&&res.result)||{}
      wx.hideLoading()
      if(!(r.ok===undefined || r.ok===true)){
        const map={ INVALID_PARAMS:'参数不完整', PRODUCT_NOT_FOUND:'产品不存在', NO_STOCK:'无库存记录', INSUFFICIENT_STOCK:'库存不足', INTERNAL_ERROR:'服务器异常，请稍后重试' }
        const msg=r.message||map[r.code]||'提交失败'
        wx.showToast({title: msg, icon:'none'})
        return
      }
      wx.showToast({title:'提交成功',icon:'success'})
      setTimeout(()=>{ wx.navigateBack() },800)
    }).catch(()=>{ wx.hideLoading(); wx.showToast({title:'网络异常或服务器错误',icon:'none'}) })
  },

  // 取消
  cancel: function() {
    wx.navigateBack();
  }
})
