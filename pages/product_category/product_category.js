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
    wx.cloud.callFunction({ name: 'categoryService', data: { action, ...payload } }).then(() => {
      wx.showToast({ title: editMode ? '类别更新成功' : '类别添加成功', icon: 'success' })
      this.setData({ currentCategory: { id: '', name: '' }, editMode: false })
      this.loadCategories()
    })
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
          wx.cloud.callFunction({ name: 'categoryService', data: { action: 'delete', id, shopId } }).then(() => {
            wx.showToast({ title: '删除成功', icon: 'success' })
            this.loadCategories()
          })
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