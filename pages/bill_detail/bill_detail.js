// pages/bill_detail/bill_detail.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    billId: '',
    mode: 'view', // view: 查看模式, edit: 编辑模式
    billData: {
      id: '',
      billNumber: '',
      type: '',
      date: '',
      supplier: '',
      products: [],
      remark: '',
      creator: '',
      createTime: ''
    },
    supplierList: ['广州电子科技有限公司', '北京科技有限公司', '深圳数码配件厂'],
    supplierIndex: 0,
    totalQuantity: 0,
    totalAmount: '0.00'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const { id, mode } = options;
    this.setData({
      billId: id || '',
      mode: mode || 'view'
    });
    
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
        const pro=(rs.data||[]).map(it=>({productNumber: it.productId, productModel: it.productCode, productName: it.productName, quantity: it.quantity, price: it.unitPrice}))
        const type=b.direction==='in'?'入库单':'出库单'
        const data={ id: billId, billNumber: b.billNo, type, date: new Date(b.billDate).toISOString().slice(0,10), supplier: (b.counterparty&&b.counterparty.supplierName)|| (b.counterparty&&b.counterparty.customerName)||'', products: pro, remark: b.remarks||'', creator: b.createdBy||'', createTime: new Date(b.createdAt).toISOString().replace('T',' ').slice(0,16)}
        const supplierIndex=this.data.supplierList.findIndex(item=>item===data.supplier)
        this.setData({ billData: data, supplierIndex: supplierIndex>=0?supplierIndex:0 })
        this.calculateTotal()
      })
    })
  },

  /**
   * 切换到编辑模式
   */
  editBill: function() {
    this.setData({
      mode: 'edit'
    });
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
  addProduct: function() {
    const newProduct = {
      productNumber: '',
      productModel: '',
      productName: '',
      quantity: 1,
      price: 0.00
    };

    const products = [...this.data.billData.products, newProduct];
    this.setData({
      'billData.products': products
    });
  },

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
  },

  /**
   * 删除产品
   */
  deleteProduct: function(e) {
    const index = e.currentTarget.dataset.index;
    const products = this.data.billData.products.filter((item, i) => i !== index);
    
    this.setData({
      'billData.products': products
    });

    this.calculateTotal();
  },

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
    wx.cloud.callFunction({name:'stockService',data:{action:'adjustBillDelta',billId:this.data.billId,newItems,createdBy}}).then(()=>{
      wx.hideLoading(); wx.showToast({title:'保存成功',icon:'success'})
      this.setData({mode:'view'})
    }).catch(()=>{ wx.hideLoading(); wx.showToast({title:'保存失败',icon:'none'}) })
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