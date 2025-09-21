// pages/statistics/statistics.js
import * as echarts from '../../components/ec-canvas/echarts';

// 初始化图表
function initChart(canvas, width, height, dpr) {
  const chart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr
  });
  canvas.setChart(chart);

  return chart;
}

// 设置图表选项和数据
function setChartOption(chart, monthlyData) {
  // 提取月份、入库金额、出库金额和利润数据
  const months = monthlyData.map(item => item.month);
  const inboundData = monthlyData.map(item => parseFloat(item.inbound.replace(',', '')));
  const outboundData = monthlyData.map(item => parseFloat(item.outbound.replace(',', '')));
  const profitData = monthlyData.map(item => parseFloat(item.profit.replace(',', '')));

  const option = {
    color: ['#1890ff', '#ff4d4f', '#52c41a'],
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        let result = params[0].name + '<br/>';
        params.forEach(param => {
          let value = param.value;
          if (value >= 10000) {
            value = (value / 10000).toFixed(2) + '万';
          } else {
            value = value.toFixed(2);
          }
          result += param.marker + ' ' + param.seriesName + ': ¥' + value + '<br/>';
        });
        return result;
      }
    },
    legend: {
      data: ['入库金额', '出库金额', '利润'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: months
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: function(value) {
          if (value >= 10000) {
            return (value / 10000) + '万';
          }
          return value;
        }
      }
    },
    series: [
      {
        name: '入库金额',
        type: 'line',
        smooth: true,
        data: inboundData
      },
      {
        name: '出库金额',
        type: 'line',
        smooth: true,
        data: outboundData
      },
      {
        name: '利润',
        type: 'line',
        smooth: true,
        data: profitData
      }
    ]
  };

  chart.setOption(option);
  return chart;
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    activeTab: 'profit', // 当前激活的标签页：profit-收益分析，inventory-库存盘点
    
    // 年份选择
    years: ['2023', '2022', '2021', '2020'],
    yearIndex: 0,
    selectedYear: '2023',
    
    // 图表配置
    monthlyChart: {
      onInit: function(canvas, width, height, dpr) {
        const chart = initChart(canvas, width, height, dpr);
        const that = this;
        // 获取页面实例，以便访问页面数据
        const page = getCurrentPages()[getCurrentPages().length - 1];
        // 设置图表数据
        setChartOption(chart, page.data.monthlyData);
        // 保存图表实例到页面，以便后续更新
        page.chart = chart;
        return chart;
      }
    },
    
    // 收益分析数据
    totalProfit: '128,560.0',
    totalInbound: '356,780.0',
    inboundCount: 125,
    totalOutbound: '485,340.0',
    outboundCount: 198,
    
    // 月度数据
    monthlyData: [
      { month: '1月', inbound: '28,500.00', outbound: '35,600.00', profit: '7,100.00' },
      { month: '2月', inbound: '32,400.00', outbound: '38,900.00', profit: '6,500.00' },
      { month: '3月', inbound: '29,800.00', outbound: '42,300.00', profit: '12,500.00' },
      { month: '4月', inbound: '31,200.00', outbound: '39,800.00', profit: '8,600.00' },
      { month: '5月', inbound: '27,600.00', outbound: '36,400.00', profit: '8,800.00' },
      { month: '6月', inbound: '30,500.00', outbound: '45,200.00', profit: '14,700.00' },
      { month: '7月', inbound: '33,800.00', outbound: '48,600.00', profit: '14,800.00' },
      { month: '8月', inbound: '35,200.00', outbound: '52,300.00', profit: '17,100.00' },
      { month: '9月', inbound: '32,600.00', outbound: '47,800.00', profit: '15,200.00' },
      { month: '10月', inbound: '28,900.00', outbound: '39,500.00', profit: '10,600.00' },
      { month: '11月', inbound: '25,600.00', outbound: '32,800.00', profit: '7,200.00' },
      { month: '12月', inbound: '20,680.00', outbound: '26,140.00', profit: '5,460.00' }
    ],
    
    // 库存盘点数据
    productCount: 68,
    inventoryValue: '256,780.00',
    searchKeyword: '',
    
    // 分类统计
    categoryStats: [
      { category: '食品饮料', value: '85,600.00', count: 22 },
      { category: '日用百货', value: '65,300.00', count: 18 },
      { category: '电子产品', value: '45,800.00', count: 12 },
      { category: '服装鞋帽', value: '35,200.00', count: 10 },
      { category: '其他', value: '24,880.00', count: 6 }
    ],
    
    // 产品列表
    products: [
      {
        id: 1,
        name: '可口可乐 330ml',
        code: 'P001',
        category: '食品饮料',
        image: '/images/product1.png',
        stock: 120,
        averagePrice: '2.50',
        stockValue: '300.00',
        lastInbound: '2023-10-15',
        records: [
          { date: '2023-10-15', quantity: 50, type: 'in', typeName: '采购入库' },
          { date: '2023-10-10', quantity: 30, type: 'out', typeName: '销售出库' },
          { date: '2023-09-28', quantity: 100, type: 'in', typeName: '采购入库' }
        ]
      },
      {
        id: 2,
        name: '雪碧 330ml',
        code: 'P002',
        category: '食品饮料',
        image: '/images/product2.png',
        stock: 85,
        averagePrice: '2.30',
        stockValue: '195.50',
        lastInbound: '2023-10-12',
        records: [
          { date: '2023-10-12', quantity: 40, type: 'in', typeName: '采购入库' },
          { date: '2023-10-05', quantity: 25, type: 'out', typeName: '销售出库' },
          { date: '2023-09-20', quantity: 70, type: 'in', typeName: '采购入库' }
        ]
      },
      {
        id: 3,
        name: '农夫山泉 550ml',
        code: 'P003',
        category: '食品饮料',
        image: '/images/product3.png',
        stock: 200,
        averagePrice: '1.80',
        stockValue: '360.00',
        lastInbound: '2023-10-18',
        records: [
          { date: '2023-10-18', quantity: 100, type: 'in', typeName: '采购入库' },
          { date: '2023-10-08', quantity: 50, type: 'out', typeName: '销售出库' },
          { date: '2023-09-25', quantity: 150, type: 'in', typeName: '采购入库' }
        ]
      },
      {
        id: 4,
        name: '洗发水 500ml',
        code: 'P004',
        category: '日用百货',
        image: '/images/product4.png',
        stock: 45,
        averagePrice: '28.50',
        stockValue: '1,282.50',
        lastInbound: '2023-10-05',
        records: [
          { date: '2023-10-05', quantity: 20, type: 'in', typeName: '采购入库' },
          { date: '2023-09-28', quantity: 15, type: 'out', typeName: '销售出库' },
          { date: '2023-09-15', quantity: 40, type: 'in', typeName: '采购入库' }
        ]
      }
    ],
    
    // 产品详情弹窗
    showProductModal: false,
    currentProduct: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 加载统计数据
    this.loadStatisticsData();
  },

  /**
   * 加载统计数据
   */
  loadStatisticsData: function () {
    // 这里模拟从服务器加载数据
    // 实际应用中应该调用API获取真实数据
    console.log('加载统计数据');
    
    // 模拟加载完成后的处理
    wx.hideLoading();
  },

  /**
   * 切换标签页
   */
  switchTab: function (e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab
    });
    
    // 如果切换到库存盘点，重新加载产品数据
    if (tab === 'inventory') {
      this.loadProductsData();
    }
  },

  /**
   * 年份选择器变化事件
   */
  bindYearChange: function (e) {
    const yearIndex = e.detail.value;
    const selectedYear = this.data.years[yearIndex];
    
    this.setData({
      yearIndex: yearIndex,
      selectedYear: selectedYear
    });
    
    // 根据选择的年份重新加载数据
    this.loadYearData(selectedYear);
  },

  /**
   * 加载指定年份的数据
   */
  loadYearData: function (year) {
    wx.showLoading({
      title: '加载中...',
    });
    
    // 这里模拟从服务器加载指定年份的数据
    // 实际应用中应该调用API获取真实数据
    console.log('加载' + year + '年数据');
    
    // 模拟数据加载延迟
    setTimeout(() => {
      let newMonthlyData = [];
      
      // 模拟不同年份的数据
      if (year === '2022') {
        newMonthlyData = [
          { month: '1月', inbound: '25,500.00', outbound: '32,600.00', profit: '7,100.00' },
          { month: '2月', inbound: '28,400.00', outbound: '35,900.00', profit: '7,500.00' },
          { month: '3月', inbound: '26,800.00', outbound: '38,300.00', profit: '11,500.00' },
          { month: '4月', inbound: '27,200.00', outbound: '35,800.00', profit: '8,600.00' },
          { month: '5月', inbound: '24,600.00', outbound: '32,400.00', profit: '7,800.00' },
          { month: '6月', inbound: '26,500.00', outbound: '39,200.00', profit: '12,700.00' },
          { month: '7月', inbound: '28,800.00', outbound: '42,600.00', profit: '13,800.00' },
          { month: '8月', inbound: '30,200.00', outbound: '45,300.00', profit: '15,100.00' },
          { month: '9月', inbound: '28,600.00', outbound: '41,800.00', profit: '13,200.00' },
          { month: '10月', inbound: '24,900.00', outbound: '35,500.00', profit: '10,600.00' },
          { month: '11月', inbound: '21,600.00', outbound: '28,800.00', profit: '7,200.00' },
          { month: '12月', inbound: '18,680.00', outbound: '24,140.00', profit: '5,460.00' }
        ];
        
        this.setData({
          totalProfit: '98,760.00',
          totalInbound: '286,500.00',
          inboundCount: 105,
          totalOutbound: '385,260.00',
          outboundCount: 168,
          monthlyData: newMonthlyData
        });
        
        // 更新图表
        if (this.chart) {
          setChartOption(this.chart, newMonthlyData);
        }
      } else if (year === '2021') {
        this.setData({
          totalProfit: '78,320.00',
          totalInbound: '245,600.00',
          inboundCount: 92,
          totalOutbound: '323,920.00',
          outboundCount: 145
          // 月度数据也应该更新，这里省略
        });
      } else if (year === '2020') {
        this.setData({
          totalProfit: '65,480.00',
          totalInbound: '198,300.00',
          inboundCount: 78,
          totalOutbound: '263,780.00',
          outboundCount: 120
          // 月度数据也应该更新，这里省略
        });
      } else {
        // 2023年数据（默认）
        this.setData({
          totalProfit: '128,560.00',
          totalInbound: '356,780.00',
          inboundCount: 125,
          totalOutbound: '485,340.00',
          outboundCount: 198
          // 月度数据保持默认
        });
      }
      
      wx.hideLoading();
    }, 500);
  },

  /**
   * 加载产品数据
   */
  loadProductsData: function () {
    // 这里模拟从服务器加载产品数据
    // 实际应用中应该调用API获取真实数据
    console.log('加载产品数据');
  },

  /**
   * 搜索输入事件
   */
  onSearchInput: function (e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  /**
   * 搜索产品
   */
  searchProducts: function () {
    const keyword = this.data.searchKeyword;
    
    if (!keyword) {
      // 如果关键词为空，加载所有产品
      this.loadProductsData();
      return;
    }
    
    // 模拟搜索过滤
    const filteredProducts = this.data.products.filter(product => {
      return product.name.indexOf(keyword) !== -1 || 
             product.code.indexOf(keyword) !== -1;
    });
    
    this.setData({
      products: filteredProducts
    });
  },

  /**
   * 显示预警库存产品
   */
  showWarningProducts: function () {
    // 模拟预警库存过滤（库存低于预警值的产品）
    // 实际应用中应该根据产品的预警阈值来判断
    const warningProducts = this.data.products.filter(product => {
      // 假设库存低于50为预警
      return product.stock < 50;
    });
    
    this.setData({
      products: warningProducts
    });
    
    wx.showToast({
      title: '已显示预警库存',
      icon: 'none'
    });
  },

  /**
   * 显示产品详情
   */
  showProductDetail: function (e) {
    const productId = e.currentTarget.dataset.id;
    const product = this.data.products.find(item => item.id === productId);
    
    if (product) {
      this.setData({
        showProductModal: true,
        currentProduct: product
      });
    }
  },

  /**
   * 隐藏产品详情
   */
  hideProductDetail: function () {
    this.setData({
      showProductModal: false
    });
  },

  /**
   * 跳转到入库页面
   */
  goToInbound: function () {
    const productId = this.data.currentProduct.id;
    
    // 隐藏弹窗
    this.hideProductDetail();
    
    // 跳转到入库页面，并传递产品ID
    wx.navigateTo({
      url: '/pages/inbound/inbound?productId=' + productId
    });
  },

  /**
   * 跳转到出库页面
   */
  goToOutbound: function () {
    const productId = this.data.currentProduct.id;
    
    // 隐藏弹窗
    this.hideProductDetail();
    
    // 跳转到出库页面，并传递产品ID
    wx.navigateTo({
      url: '/pages/outbound/outbound?productId=' + productId
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 页面显示时刷新数据
    this.loadStatisticsData();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    // 下拉刷新
    this.loadStatisticsData();
    
    // 停止下拉刷新
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    // 如果是库存盘点标签页，可以加载更多产品
    if (this.data.activeTab === 'inventory') {
      this.loadMoreProducts();
    }
  },

  /**
   * 加载更多产品
   */
  loadMoreProducts: function () {
    // 模拟加载更多产品
    // 实际应用中应该调用API获取更多数据
    console.log('加载更多产品');
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '库存管理统计报表',
      path: '/pages/statistics/statistics'
    };
  }
})