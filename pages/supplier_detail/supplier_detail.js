// pages/supplier_detail/supplier_detail.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    mode: 'add', // 'add' 或 'edit'
    id: null,
    supplier: {
      name: '',
      code: '',
      address: '',
      contactPerson: '',
      phone: '',
      remark: ''
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 设置页面模式（新增或编辑）
    const mode = options.mode || 'add';
    const id = options.id || null;
    
    this.setData({ mode, id });
    
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: mode === 'add' ? '新增供应商' : '供应商详情'
    });
    
    // 如果是编辑模式，加载供应商数据
    if (mode === 'edit' && id) {
      this.loadSupplierData(id);
    } else if (mode === 'add') {
      // 新增模式，生成新的供应商编号
      this.generateSupplierCode();
    }
  },
  
  /**
   * 加载供应商数据
   */
  loadSupplierData(id) {
    const db = wx.cloud.database()
    db.collection('suppliers').doc(id).get().then(res=>{
      const s = res.data
      if(!s){
        wx.showToast({ title:'供应商数据不存在', icon:'none' })
        setTimeout(()=>{ this.navigateBack() },1500)
        return
      }
      this.setData({ supplier: { name: s.name||'', code: s.code||'', address: s.address||'', contactPerson: s.contactPerson||'', phone: s.phone||'', remark: s.remarks||'' } })
    })
  },
  
  /**
   * 生成供应商编号
   */
  generateSupplierCode() {
    const code = 'SUP' + String(Math.floor(Math.random() * 90000) + 10000);
    this.setData({
      'supplier.code': code
    });
  },
  
  /**
   * 表单提交
   */
  submitForm(e) {
    const formData = e.detail.value;
    
    // 表单验证
    if (!formData.name.trim()) {
      wx.showToast({
        title: '请输入供应商名称',
        icon: 'none'
      });
      return;
    }
    
    if (!formData.code.trim()) {
      wx.showToast({
        title: '请输入供应商编号',
        icon: 'none'
      });
      return;
    }
    
    // 手机号格式验证（如果有填写）
    if (formData.phone && !/^1\d{10}$/.test(formData.phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return;
    }
    
    const supplier = { ...this.data.supplier, ...formData }
    wx.showLoading({ title: '保存中...' })
    const user = wx.getStorageSync('currentUser') || {}
    const shopId = user.shopId || ''
    const payload = this.data.mode==='add' ? { action: 'add', shopId, data: { name: supplier.name.trim(), code: supplier.code.trim(), address: supplier.address||'', contactPerson: supplier.contactPerson||'', phone: supplier.phone||'', remarks: supplier.remark||'', createdBy: user._id } } : { action: 'update', id: this.data.id, shopId, data: { name: supplier.name.trim(), code: supplier.code.trim(), address: supplier.address||'', contactPerson: supplier.contactPerson||'', phone: supplier.phone||'', remarks: supplier.remark||'' } }
    wx.cloud.callFunction({ name: 'supplierService', data: payload }).then(res=>{
      const r=(res&&res.result)||{}
      wx.hideLoading()
      if(!(r.ok===undefined || r.ok===true)){
        const map={ INVALID_PARAMS:'参数不完整', CODE_EXISTS:'编号已存在', NAME_EXISTS:'名称已存在', NO_SHOP:'未选择店铺', INTERNAL_ERROR:'服务器异常，请稍后重试' }
        const msg=r.message||map[r.code]||'保存失败'
        wx.showToast({ title: msg, icon:'none' })
        return
      }
      wx.showToast({ title: this.data.mode==='add' ? '新增成功' : '更新成功', icon:'success' })
      setTimeout(()=>{ this.navigateBack() }, 800)
    }).catch(()=>{
      wx.hideLoading()
      wx.showToast({ title:'网络异常或服务器错误', icon:'none' })
    })
  },
  
  /**
   * 返回上一页
   */
  navigateBack() {
    wx.navigateBack();
  }
})
