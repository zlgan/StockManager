// 商品类别管理页面
Page({
  data: {
    categories: [],
    currentCategory: {
      id: '',
      name: ''
    },
    editMode: false
  },

  onLoad: function() {
    this.loadCategories();
  },

  // 加载类别数据
  loadCategories: function() {
    const user = wx.getStorageSync('currentUser') || {}
    const shopId = user.shopId || ''
    const db = wx.cloud.database()
    db.collection('categories').where({ shopId, status: 'active' }).get().then(res => {
      const list = (res.data || []).map(i => ({ id: i._id, name: i.name }))
      this.setData({ categories: list })
    })
  },

  // 输入类别名称
  inputCategoryName: function(e) {
    this.setData({
      'currentCategory.name': e.detail.value
    });
  },

  // 保存类别（添加或更新）
  saveCategory: function() {
    const { currentCategory, editMode, categories } = this.data;
    
    if (!currentCategory.name.trim()) {
      wx.showToast({
        title: '请输入类别名称',
        icon: 'none'
      });
      return;
    }
    const user = wx.getStorageSync('currentUser') || {}
    const shopId = user.shopId || ''
    const action = editMode ? 'update' : 'add'
    const payload = editMode ? { id: currentCategory.id, name: currentCategory.name, shopId } : { name: currentCategory.name, shopId }
    wx.showLoading({ title: '处理中' })
    wx.cloud.callFunction({ name: 'categoryService', data: { action, ...payload } }).then(res => {
      const r=(res&&res.result)||{}
      if(!(r.ok)){
        const map={ NO_SHOP:'未选择店铺', INVALID_NAME:'类别名称不能为空', DUPLICATE:'类别已存在', INVALID_PARAMS:'参数不完整', INVALID_ID:'ID无效', UNKNOWN_ACTION:'未知操作', INTERNAL_ERROR:'服务器异常，请稍后重试' }
        const msg=r.message||map[r.code]||'操作失败'
        wx.hideLoading(); wx.showToast({ title: msg, icon: 'none' })
        return
      }
      wx.hideLoading(); wx.showToast({ title: editMode ? '类别更新成功' : '类别添加成功', icon: 'success' })
      this.setData({ currentCategory: { id: '', name: '' }, editMode: false })
      this.loadCategories()
    }).catch(()=>{ wx.hideLoading(); wx.showToast({ title:'网络异常或服务器错误', icon:'none' }) })
  },

  // 编辑类别
  editCategory: function(e) {
    const id = e.currentTarget.dataset.id;
    const category = this.data.categories.find(item => item.id === id);
    
    if (category) {
      this.setData({
        currentCategory: {...category},
        editMode: true
      });
    }
  },

  // 删除类别
  deleteCategory: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除此类别吗？',
      success: res => {
        if (res.confirm) {
          const user = wx.getStorageSync('currentUser') || {}
          const shopId = user.shopId || ''
          wx.showLoading({ title: '处理中' })
          wx.cloud.callFunction({ name: 'categoryService', data: { action: 'delete', id, shopId } }).then(res=>{
            const r=(res&&res.result)||{}
            if(!(r.ok)){
              const map={ INVALID_ID:'ID无效', NO_SHOP:'未选择店铺', UNKNOWN_ACTION:'未知操作', INTERNAL_ERROR:'服务器异常，请稍后重试' }
              const msg=r.message||map[r.code]||'删除失败'
              wx.hideLoading(); wx.showToast({ title: msg, icon: 'none' })
              return
            }
            wx.hideLoading(); wx.showToast({ title: '删除成功', icon: 'success' })
            this.loadCategories()
          }).catch(()=>{ wx.hideLoading(); wx.showToast({ title:'网络异常或服务器错误', icon:'none' }) })
        }
      }
    });
  },

  // 重置表单
  resetForm: function() {
    this.setData({
      currentCategory: {
        id: '',
        name: ''
      },
      editMode: false
    });
  }
});
