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
    const id = options.id ? parseInt(options.id) : null;
    
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
    // 模拟从服务器获取数据
    // 实际项目中应该从API获取
    const mockSuppliers = [
      {
        id: 1,
        name: '广州科技有限公司',
        code: 'SUP001',
        address: '广州市天河区科技园区88号',
        contactPerson: '张经理',
        phone: '13800138000',
        remark: '主要电子产品供应商'
      },
      {
        id: 2,
        name: '深圳电子科技有限公司',
        code: 'SUP002',
        address: '深圳市南山区高新技术产业园A栋',
        contactPerson: '李总',
        phone: '13900139000',
        remark: '主要提供电子元器件'
      },
      {
        id: 3,
        name: '东莞包装材料有限公司',
        code: 'SUP003',
        address: '东莞市长安镇工业园C区',
        contactPerson: '王经理',
        phone: '13700137000',
        remark: '包装材料供应商'
      }
    ];
    
    const supplier = mockSuppliers.find(item => item.id === id);
    
    if (supplier) {
      this.setData({ supplier });
    } else {
      wx.showToast({
        title: '供应商数据不存在',
        icon: 'none'
      });
      setTimeout(() => {
        this.navigateBack();
      }, 1500);
    }
  },
  
  /**
   * 生成供应商编号
   */
  generateSupplierCode() {
    // 模拟生成编号，实际项目中应该从服务器获取
    const code = 'SUP' + String(Math.floor(Math.random() * 900) + 100);
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
    
    // 构建供应商数据
    const supplier = {
      ...this.data.supplier,
      ...formData
    };
    
    if (this.data.mode === 'add') {
      // 模拟新增供应商
      supplier.id = Date.now(); // 使用时间戳作为临时ID
      console.log('新增供应商:', supplier);
    } else {
      // 模拟更新供应商
      console.log('更新供应商:', supplier);
    }
    
    // 显示成功提示
    wx.showToast({
      title: this.data.mode === 'add' ? '新增成功' : '更新成功',
      icon: 'success'
    });
    
    // 返回上一页
    setTimeout(() => {
      this.navigateBack();
    }, 1500);
  },
  
  /**
   * 返回上一页
   */
  navigateBack() {
    wx.navigateBack();
  }
})