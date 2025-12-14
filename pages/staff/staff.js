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
    const user = wx.getStorageSync('currentUser') || {}
    const shopId = user.shopId || ''
    const db = wx.cloud.database()
    db.collection('users').where({ shopId, role: 'staff', status: 'active' }).get().then(res=>{
      const list = (res.data||[]).map(u=>({ id: u._id, username: u.username, realName: u.realName||'', phone: u.phone||'' }))
      this.setData({ staffList: list, filteredStaffList: list })
    })
  },
  confirmDelete(e){
    const id=e.currentTarget.dataset.id
    if(!id) return
    wx.showModal({
      title:'确认删除',
      content:'确定删除该员工吗？删除后将不在列表显示',
      confirmText:'删除',
      confirmColor:'#ff4d4f',
      success:(res)=>{
        if(res.confirm){
          const user=wx.getStorageSync('currentUser')||{}
          const shopId=user.shopId||''
          wx.cloud.callFunction({name:'staffService',data:{action:'delete',id,shopId}}).then(r=>{
            const ret=(r&&r.result)||{}
            if(!(ret.ok===undefined||ret.ok===true)){
              wx.showToast({title:ret.message||'删除失败',icon:'none'})
              return
            }
            const list=(this.data.filteredStaffList||[]).filter(s=>s.id!==id)
            this.setData({filteredStaffList:list,staffList:list})
            wx.showToast({title:'删除成功',icon:'success'})
          }).catch(()=>{ wx.showToast({title:'网络异常或服务器错误',icon:'none'}) })
        }
      }
    })
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
