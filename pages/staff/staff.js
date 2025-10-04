// pages/staff/staff.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    staffList: [],
    filteredStaffList: [],
    searchKeyword: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadStaffList();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadStaffList();
  },

  /**
   * 加载员工列表
   */
  loadStaffList() {
    // 模拟员工数据，实际项目中应该从服务器获取
    const staffList = [
      {
        id: 1,
        username: '张飞虎123',
        realName: '张飞',
        phone: '13800138001',
        password: '123456',
        canStockIn: true,
        canStockOut: true
      },
      {
        id: 2,
        username: 'admin',
        realName: '管理员',
        phone: '13800138002',
        password: '123456',
        canStockIn: true,
        canStockOut: true
      }
    ];

    this.setData({
      staffList: staffList,
      filteredStaffList: staffList
    });
  },

  /**
   * 搜索输入处理
   */
  onSearchInput(e) {
    const keyword = e.detail.value.toLowerCase();
    this.setData({
      searchKeyword: keyword
    });

    if (keyword === '') {
      this.setData({
        filteredStaffList: this.data.staffList
      });
    } else {
      const filtered = this.data.staffList.filter(staff => {
        return staff.username.toLowerCase().includes(keyword) ||
               staff.realName.toLowerCase().includes(keyword) ||
               staff.phone.includes(keyword);
      });
      this.setData({
        filteredStaffList: filtered
      });
    }
  },

  /**
   * 查看员工详情
   */
  viewStaffDetail(e) {
    const staffId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/staff_detail/staff_detail?id=${staffId}`
    });
  },

  /**
   * 添加员工
   */
  addStaff() {
    wx.navigateTo({
      url: '/pages/staff_detail/staff_detail?mode=add'
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

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
    this.loadStaffList();
    wx.stopPullDownRefresh();
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