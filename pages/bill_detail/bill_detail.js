// pages/bill_detail/bill_detail.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    billId: '',
    billData: {
      id: '',
      billNumber: '',
      type: '',
      direction: '',
      date: '',
      supplier: '',
      products: [],
      remark: '',
      creator: '',
      createTime: ''
    },
    supplierList: [],
    supplierIndex: 0,
    totalQuantity: 0,
    totalAmount: '0.00',
    showSuggestions: false,
    currentEditIndex: -1,
    filteredProducts: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const { id } = options;
    this.setData({ billId: id || '' });
    
    if (id) {
      this.loadBillDetail(id);
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.calculateTotal();
  },

  /**
   * 返回上一页
   */
  goBack: function() {
    wx.navigateBack();
  },

  /**
   * 加载单据详情
   */
  loadBillDetail: function(billId) {
    const db=wx.cloud.database()
    db.collection('stockBills').doc(billId).get().then(r=>{
      const b=r.data
    db.collection('stockItems').where({billId}).get().then(rs=>{
        const pro=(rs.data||[]).map(it=>({productNumber: it.productId, productModel: it.productCode, productName: it.productName, quantity: it.quantity, price: it.unitPrice, stock: 0, imageUrl: ''}))
        const type=b.direction==='in'?'入库单':'出库单'
        const data={ id: billId, billNumber: b.billNo, type, direction:b.direction, date: new Date(b.billDate).toISOString().slice(0,10), supplier: (b.counterparty&&b.counterparty.supplierName)|| (b.counterparty&&b.counterparty.customerName)||'', products: pro, remark: b.remarks||'', creator: b.createdBy||'', createTime: new Date(b.createdAt).toISOString().replace('T',' ').slice(0,16)}
        this.setData({ billData: data })
        const user=wx.getStorageSync('currentUser')||{}
        const shopId=user.shopId||''
        const db2=wx.cloud.database()
        const listCol=b.direction==='in'? 'suppliers':'customers'
        db2.collection(listCol).where({shopId,status:'active'}).field({name:true}).limit(200).get().then(ls=>{
          const names=(ls.data||[]).map(x=>x.name)
          const idx=Math.max(0, names.indexOf(data.supplier))
          this.setData({supplierList:names,supplierIndex:idx})
        })
        const tasks=(data.products||[]).map((p,i)=>{
          const t1=db2.collection('inventoryBalances').where({shopId,productId:p.productNumber}).limit(1).get()
          const t2=p.productNumber?db2.collection('products').doc(p.productNumber).get():Promise.resolve({data:{}})
          return Promise.all([t1,t2]).then(([rb,rp])=>{
            const bbal=(rb.data&&rb.data[0])||{quantity:0}
            const prod=(rp.data||{})
            const arr=this.data.billData.products
            arr[i].stock=bbal.quantity||0
            arr[i].imageUrl=prod.imageUrl||arr[i].imageUrl||''
            this.setData({billData:{...this.data.billData,products:arr}})
          })
        })
        Promise.all(tasks).then(()=>{ this.calculateTotal() })
      })
    })
  },

  

  /**
   * 删除单据
   */
  deleteBill: function() {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除单据 ${this.data.billData.billNumber} 吗？此操作不可恢复。`,
      confirmText: '删除',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          this.performDeleteBill();
        }
      }
    });
  },

  /**
   * 执行删除单据操作
   */
  performDeleteBill: function() {
    // 模拟删除操作
    wx.showToast({
      title: '删除成功',
      icon: 'success'
    });

    // 延迟返回上一页
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);

    // 实际应用中这里应该调用API删除数据
    // wx.request({
    //   url: '/api/bills/' + this.data.billId,
    //   method: 'DELETE',
    //   success: (res) => {
    //     wx.showToast({
    //       title: '删除成功',
    //       icon: 'success'
    //     });
    //     setTimeout(() => {
    //       wx.navigateBack();
    //     }, 1500);
    //   }
    // });
  },

  /**
   * 日期变更处理
   */
  bindDateChange: function(e) {
    this.setData({
      'billData.date': e.detail.value
    });
  },

  /**
   * 供应商变更处理
   */
  bindSupplierChange: function(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      supplierIndex: index,
      'billData.supplier': this.data.supplierList[index]
    });
  },

  /**
   * 添加产品
   */
  

  /**
   * 更新产品字段
   */
  updateProductField: function(e) {
    const { index, field } = e.currentTarget.dataset;
    const value = e.detail.value;
    const products = [...this.data.billData.products];
    
    if (field === 'quantity' || field === 'price') {
      products[index][field] = parseFloat(value) || 0;
    } else {
      products[index][field] = value;
    }

    this.setData({
      'billData.products': products
    });

    this.calculateTotal();
    if(field==='productName'){ this.searchProducts(value,index) }
    if(field==='productModel'){ if(value){ this.linkByModel(index,value) } }
  },

  /**
   * 删除产品
   */
  

  /**
   * 更新备注
   */
  updateRemark: function(e) {
    this.setData({
      'billData.remark': e.detail.value
    });
  },

  /**
   * 计算总计
   */
  calculateTotal: function() {
    const products = this.data.billData.products || [];
    let totalQuantity = 0;
    let totalAmount = 0;

    const updatedProducts = products.map(product => {
      const quantity = parseFloat(product.quantity) || 0;
      const price = parseFloat(product.price) || 0;
      totalQuantity += quantity;
      totalAmount += quantity * price;
      return {
        ...product,
        subtotalStr: (quantity * price).toFixed(2)
      };
    });

    this.setData({
      'billData.products': updatedProducts,
      totalQuantity: totalQuantity,
      totalAmount: totalAmount.toFixed(2)
    });
  },

  

  

  

  

  /**
   * 保存单据
   */
  saveBill: function() {


    // 验证必填字段
    if (!this.validateBillData()) {
      return;
    }

    wx.showLoading({
      title: '保存中...'
    });

    const user=wx.getStorageSync('currentUser')||{}
    const createdBy=user._id||''
    const newItems=(this.data.billData.products||[]).map((p,i)=>({lineNo:i+1,productId:p.productNumber,productName:p.productName,productCode:p.productModel||'',quantity:Number(p.quantity),unitPrice:Number(p.price)}))
    const remarks=this.data.billData.remark||''
    wx.cloud.callFunction({name:'stockService',data:{action:'adjustBillDelta',billId:this.data.billId,newItems,createdBy,remarks}}).then(res=>{
      const r=(res&&res.result)||{}
      wx.hideLoading()
      if(!(r.ok===undefined || r.ok===true)){
        const map={ INVALID_PARAMS:'参数不完整', PRODUCT_NOT_FOUND:'产品不存在', NO_STOCK:'无库存记录', INSUFFICIENT_STOCK:'库存不足', INTERNAL_ERROR:'服务器异常，请稍后重试' }
        const msg=r.message||map[r.code]||'保存失败'
        wx.showToast({title: msg, icon:'none'})
        return
      }
      wx.showToast({title:'保存成功',icon:'success'})
      setTimeout(()=>{ wx.redirectTo({url:'/pages/bills/bills'}) },800)
    }).catch(()=>{ wx.hideLoading(); wx.showToast({title:'网络异常或服务器错误',icon:'none'}) })
  },

  /**
   * 验证单据数据
   */
  validateBillData: function() {
    const { billData } = this.data;

    if (!billData.date) {
      wx.showToast({
        title: '请选择日期',
        icon: 'none'
      });
      return false;
    }

    if (!billData.supplier) {
      wx.showToast({
        title: '请选择供应商',
        icon: 'none'
      });
      return false;
    }

    if (!billData.products || billData.products.length === 0) {
      wx.showToast({
        title: '请添加产品信息',
        icon: 'none'
      });
      return false;
    }

    // 验证产品信息
    for (let i = 0; i < billData.products.length; i++) {
      const product = billData.products[i];
      if (!product.productName) {
        wx.showToast({
          title: `第${i + 1}个产品名称不能为空`,
          icon: 'none'
        });
        return false;
      }
      if (!product.quantity || product.quantity <= 0) {
        wx.showToast({
          title: `第${i + 1}个产品数量必须大于0`,
          icon: 'none'
        });
        return false;
      }
      if (!product.price || product.price <= 0) {
        wx.showToast({
          title: `第${i + 1}个产品单价必须大于0`,
          icon: 'none'
        });
        return false;
      }
    }

    return true;
  }
});
