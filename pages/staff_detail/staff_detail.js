// pages/staff_detail/staff_detail.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    staffInfo: {
      id: '',
      username: '',
      password: '',
      realName: '',
      phone: '',
      remark: '',
      canStockIn: true,
      canStockOut: true
    },
    originalStaffInfo: {},
    isEditMode: false,
    isAddMode: false,
    updateTime: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.mode === 'add') {
      this.setData({
        isAddMode: true,
        isEditMode: false
      });
    } else if (options.id) {
      this.loadStaffDetail(options.id);
    }
  },

  /**
   * 加载员工详情
   */
  loadStaffDetail(staffId) {
    // 模拟从服务器获取员工详情，实际项目中应该调用API
    const mockStaffData = {
      1: {
        id: 1,
        username: '张飞虎123',
        password: '123456',
        realName: '张飞',
        phone: '13800138001',
        remark: '',
        canStockIn: true,
        canStockOut: true
      },
      2: {
        id: 2,
        username: 'admin',
        password: '123456',
        realName: '管理员',
        phone: '13800138002',
        remark: '系统管理员',
        canStockIn: true,
        canStockOut: true
      }
    };

    const staffInfo = mockStaffData[staffId] || {};
    const currentTime = new Date().toLocaleString('zh-CN');
    
    this.setData({
      staffInfo: staffInfo,
      originalStaffInfo: JSON.parse(JSON.stringify(staffInfo)),
      updateTime: currentTime
    });
  },

  /**
   * 进入编辑模式
   */
  enterEditMode() {
    this.setData({
      isEditMode: true,
      originalStaffInfo: JSON.parse(JSON.stringify(this.data.staffInfo))
    });
  },

  /**
   * 取消编辑
   */
  cancelEdit() {
    if (this.data.isAddMode) {
      wx.navigateBack();
    } else {
      this.setData({
        isEditMode: false,
        staffInfo: this.data.originalStaffInfo
      });
    }
  },

  /**
   * 保存员工信息
   */
  saveStaff() {
    const { staffInfo, isAddMode } = this.data;
    
    // 验证必填字段
    if (!staffInfo.username.trim()) {
      wx.showToast({
        title: '请输入用户名',
        icon: 'none'
      });
      return;
    }

    if (!staffInfo.password.trim()) {
      wx.showToast({
        title: '请输入密码',
        icon: 'none'
      });
      return;
    }

    if (!staffInfo.realName.trim()) {
      wx.showToast({
        title: '请输入姓名',
        icon: 'none'
      });
      return;
    }

    if (!staffInfo.phone.trim()) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      });
      return;
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(staffInfo.phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      });
      return;
    }

    // 模拟保存操作
    wx.showLoading({
      title: isAddMode ? '添加中...' : '保存中...'
    });

    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: isAddMode ? '添加成功' : '保存成功',
        icon: 'success'
      });

      if (isAddMode) {
        // 添加模式下返回列表页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        // 编辑模式下退出编辑状态
        this.setData({
          isEditMode: false,
          updateTime: new Date().toLocaleString('zh-CN')
        });
      }
    }, 1000);
  },

  /**
   * 输入事件处理
   */
  onUsernameInput(e) {
    this.setData({
      'staffInfo.username': e.detail.value
    });
  },

  onPasswordInput(e) {
    this.setData({
      'staffInfo.password': e.detail.value
    });
  },

  onRealNameInput(e) {
    this.setData({
      'staffInfo.realName': e.detail.value
    });
  },

  onPhoneInput(e) {
    this.setData({
      'staffInfo.phone': e.detail.value
    });
  },

  onRemarkInput(e) {
    this.setData({
      'staffInfo.remark': e.detail.value
    });
  },

  /**
   * 权限开关处理
   */
  onStockInChange(e) {
    this.setData({
      'staffInfo.canStockIn': !e.detail.value
    });
  },

  onStockOutChange(e) {
    this.setData({
      'staffInfo.canStockOut': !e.detail.value
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})