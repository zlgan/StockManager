// 商品类别管理页面
Page({
  data: {
    categories: [],
    originalCategories: [],
    currentCategory: {
      id: '',
      name: ''
    },
    editMode: false
  },

  onLoad: function() {
    // 加载类别数据
    this.loadCategories();
  },

  // 加载类别数据
  loadCategories: function() {
    // 模拟数据，实际项目中应从服务器获取
    const categories = [
      { id: '1', name: '电子产品' },
      { id: '2', name: '服装' },
      { id: '3', name: '食品' },
      { id: '4', name: '家居' }
    ];
    
    this.setData({
      categories: categories,
      originalCategories: JSON.parse(JSON.stringify(categories))
    });
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
    
    let newCategories = [...categories];
    
    if (editMode) {
      // 更新现有类别
      const index = newCategories.findIndex(item => item.id === currentCategory.id);
      if (index !== -1) {
        newCategories[index] = {...currentCategory};
        
        wx.showToast({
          title: '类别更新成功',
          icon: 'success'
        });
      }
    } else {
      // 添加新类别
      const newId = Date.now().toString();
      newCategories.push({
        id: newId,
        name: currentCategory.name
      });
      
      wx.showToast({
        title: '类别添加成功',
        icon: 'success'
      });
    }
    
    this.setData({
      categories: newCategories,
      currentCategory: {
        id: '',
        name: ''
      },
      editMode: false
    });
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
          const newCategories = this.data.categories.filter(item => item.id !== id);
          
          this.setData({
            categories: newCategories
          });
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
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