// pages/settings/settings.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    settings: {
      disableStockPoint: false,        // 员工账户禁用库存点
      hideInboundPrice: false,         // 员工账户不显示产品入库价信息
      ownRecordsOnly: false,           // 员工账户只能看见自己的出入库记录
      adminApproval: false,            // 出入库记录开启管理员审核
      hideInventory: false,            // 员工账户不可以查看产品库存
      disableProductEdit: false        // 员工账户不可以编辑产品
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadSettings();
  },

  /**
   * 加载设置数据
   */
  loadSettings() {
    // 从本地存储加载设置
    const settings = wx.getStorageSync('systemSettings') || this.data.settings;
    this.setData({
      settings: settings
    });
  },

  /**
   * 保存设置到本地存储
   */
  saveSettings() {
    wx.setStorageSync('systemSettings', this.data.settings);
    wx.showToast({
      title: '设置已保存',
      icon: 'success',
      duration: 1500
    });
  },

  /**
   * 员工账户禁用库存点开关
   */
  onStockPointChange(e) {
    this.setData({
      'settings.disableStockPoint': e.detail.value
    });
    this.saveSettings();
  },

  /**
   * 员工账户不显示产品入库价信息开关
   */
  onHideInboundPriceChange(e) {
    this.setData({
      'settings.hideInboundPrice': e.detail.value
    });
    this.saveSettings();
  },

  /**
   * 员工账户只能看见自己的出入库记录开关
   */
  onOwnRecordsOnlyChange(e) {
    this.setData({
      'settings.ownRecordsOnly': e.detail.value
    });
    this.saveSettings();
  },

  /**
   * 出入库记录开启管理员审核开关
   */
  onAdminApprovalChange(e) {
    this.setData({
      'settings.adminApproval': e.detail.value
    });
    this.saveSettings();
  },

  /**
   * 员工账户不可以查看产品库存开关
   */
  onHideInventoryChange(e) {
    this.setData({
      'settings.hideInventory': e.detail.value
    });
    this.saveSettings();
  },

  /**
   * 员工账户不可以编辑产品开关
   */
  onDisableProductEditChange(e) {
    this.setData({
      'settings.disableProductEdit': e.detail.value
    });
    this.saveSettings();
  },

  /**
   * 显示帮助信息
   */
  showHelp(e) {
    const type = e.currentTarget.dataset.type;
    let content = '';
    
    switch(type) {
      case 'stockPoint':
        content = '开启后，员工账户将无法使用库存点功能';
        break;
      case 'hideInboundPrice':
        content = '开启后，员工账户在查看产品时不会显示入库价格信息';
        break;
      case 'ownRecordsOnly':
        content = '开启后，员工账户只能查看自己创建的出入库记录';
        break;
      case 'adminApproval':
        content = '开启后，员工的出入库操作需要管理员审核后才能生效';
        break;
      case 'hideInventory':
        content = '开启后，员工账户无法查看产品的库存数量';
        break;
      case 'disableProductEdit':
        content = '开启后，员工账户无法编辑产品信息';
        break;
      default:
        content = '暂无帮助信息';
    }

    wx.showModal({
      title: '帮助说明',
      content: content,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadSettings();
  }
})