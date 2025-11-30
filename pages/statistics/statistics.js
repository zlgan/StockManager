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
  const inboundData = monthlyData.map(item => parseFloat(String(item.inbound).replace(/,/g, '')));
  const outboundData = monthlyData.map(item => parseFloat(String(item.outbound).replace(/,/g, '')));
  const profitData = monthlyData.map(item => parseFloat(String(item.profit).replace(/,/g, '')));

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
    years: [],
    yearIndex: 0,
    selectedYear: String(new Date().getFullYear()),
    
    // 图表配置
    monthlyChart: {
      onInit: function(canvas, width, height, dpr) {
        const chart = initChart(canvas, width, height, dpr);
        const page = getCurrentPages()[getCurrentPages().length - 1];
        page.chart = chart;
        return chart;
      }
    },
    
    // 收益分析数据
    totalProfit: '0.00',
    totalInbound: '0.00',
    inboundCount: 0,
    totalOutbound: '0.00',
    outboundCount: 0,
    
    // 月度数据
    monthlyData: [],
    
    // 库存盘点数据
    productCount: 0,
    inventoryValue: '0.00',
    searchKeyword: '',
    
    // 分类统计
    categoryStats: [],
    
    // 产品列表
    products: [],
    sourceProducts: [],
    
    // 产品详情弹窗
    showProductModal: false,
    currentProduct: {},
    statsMonthlyRaw: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.loadStatisticsData();
  },

  /**
   * 加载统计数据
   */
  loadStatisticsData: function () {
    const user=wx.getStorageSync('currentUser')||{}
    const shopId=user.shopId||''
    const db=wx.cloud.database()
    db.collection('statsMonthly').where({shopId}).orderBy('year','desc').get().then(res=>{
      const rows=res.data||[]
      const years=[...new Set(rows.map(r=>String(r.year)))].sort((a,b)=>Number(b)-Number(a))
      const selectedYear=this.data.selectedYear && years.includes(this.data.selectedYear)? this.data.selectedYear : (years[0]||String(new Date().getFullYear()))
      const forYear=rows.filter(r=>String(r.year)===selectedYear).sort((a,b)=>a.month-b.month)
      const md=forYear.map(x=>({month:x.month+'月',inbound:(x.inboundAmount||0).toFixed(2),outbound:(x.outboundAmount||0).toFixed(2),profit:(x.profit||0).toFixed(2)}))
      const totals=forYear.reduce((acc,x)=>({
        inboundAmount: acc.inboundAmount+(x.inboundAmount||0),
        outboundAmount: acc.outboundAmount+(x.outboundAmount||0),
        profit: acc.profit+(x.profit||0),
        inboundCount: acc.inboundCount+(x.inboundCount||0),
        outboundCount: acc.outboundCount+(x.outboundCount||0)
      }),{inboundAmount:0,outboundAmount:0,profit:0,inboundCount:0,outboundCount:0})
      this.setData({
        years,
        yearIndex: Math.max(0, years.indexOf(selectedYear)),
        selectedYear,
        statsMonthlyRaw: rows,
        monthlyData: md,
        totalProfit: (totals.profit||0).toFixed(2),
        totalInbound: (totals.inboundAmount||0).toFixed(2),
        inboundCount: totals.inboundCount||0,
        totalOutbound: (totals.outboundAmount||0).toFixed(2),
        outboundCount: totals.outboundCount||0
      })
      if(this.chart){ setChartOption(this.chart, md) }
    })
    Promise.all([
      db.collection('inventoryBalances').where({shopId}).get(),
      db.collection('products').where({shopId}).field({name:true,code:true,categoryName:true,imageUrl:true,warningStock:true}).get()
    ]).then(([resBal,resProd])=>{
      const balances=resBal.data||[]
      const prodMap={}
      (resProd.data||[]).forEach(p=>{ prodMap[p._id]=p })
      const products=balances.map(b=>{
        const p=prodMap[b.productId]||{}
        const avg=(b.avgCost||0)
        const qty=(b.quantity||0)
        return {
          id:b.productId,
          name:b.productName||p.name||'',
          code:p.code||b.productId,
          category:p.categoryName||'',
          image:p.imageUrl||'',
          stock:qty,
          averagePrice: avg.toFixed(2),
          stockValue: (qty*avg).toFixed(2),
          warningStock: Number(p.warningStock||0),
          lastInbound:'',
          records:[]
        }
      })
      const productCount=products.length
      const inventoryValue=balances.reduce((s,b)=>s+(b.quantity||0)*(b.avgCost||0),0).toFixed(2)
      const catAgg={}
      products.forEach(pr=>{
        const k=pr.category||'未分类'
        const val=Number(pr.stockValue)||0
        if(!catAgg[k]) catAgg[k]={category:k,value:0,count:0}
        catAgg[k].value+=val
        catAgg[k].count+=1
      })
      const categoryStats=Object.values(catAgg).map(c=>({category:c.category,value:c.value.toFixed(2),count:c.count}))
      this.setData({products,sourceProducts:products,productCount,inventoryValue,categoryStats})
    })
  },

  /**
   * 切换标签页
   */
  switchTab: function (e) { this.setData({ activeTab: e.currentTarget.dataset.tab }); },

  /**
   * 年份选择器变化事件
   */
  bindYearChange: function (e) {
    const yearIndex = e.detail.value;
    const selectedYear = this.data.years[yearIndex];
    const rows=this.data.statsMonthlyRaw||[]
    const forYear=rows.filter(r=>String(r.year)===selectedYear).sort((a,b)=>a.month-b.month)
    const md=forYear.map(x=>({month:x.month+'月',inbound:(x.inboundAmount||0).toFixed(2),outbound:(x.outboundAmount||0).toFixed(2),profit:(x.profit||0).toFixed(2)}))
    const totals=forYear.reduce((acc,x)=>({
      inboundAmount: acc.inboundAmount+(x.inboundAmount||0),
      outboundAmount: acc.outboundAmount+(x.outboundAmount||0),
      profit: acc.profit+(x.profit||0),
      inboundCount: acc.inboundCount+(x.inboundCount||0),
      outboundCount: acc.outboundCount+(x.outboundCount||0)
    }),{inboundAmount:0,outboundAmount:0,profit:0,inboundCount:0,outboundCount:0})
    this.setData({ yearIndex, selectedYear, monthlyData: md, totalProfit:(totals.profit||0).toFixed(2), totalInbound:(totals.inboundAmount||0).toFixed(2), inboundCount:totals.inboundCount||0, totalOutbound:(totals.outboundAmount||0).toFixed(2), outboundCount:totals.outboundCount||0 })
    if(this.chart){ setChartOption(this.chart, md) }
  },

  /**
   * 加载指定年份的数据
   */
  loadYearData: function (year) {},

  /**
   * 加载产品数据
   */
  loadProductsData: function () {},

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
    const keyword = (this.data.searchKeyword||'').trim();
    if (!keyword) { this.setData({products:this.data.sourceProducts}); return; }
    const filteredProducts = (this.data.sourceProducts||[]).filter(product => {
      const name=(product.name||''); const code=(product.code||'');
      return name.includes(keyword) || code.includes(keyword);
    });
    this.setData({ products: filteredProducts });
  },

  /**
   * 显示预警库存产品
   */
  showWarningProducts: function () {
    const list=this.data.sourceProducts||[]
    const warningProducts = list.filter(product => {
      const threshold = Number(product.warningStock||50)
      return Number(product.stock||0) < threshold;
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
    const product = (this.data.products||[]).find(item => item.id === productId);
    
    if (product) {
      this.setData({ showProductModal: true, currentProduct: product });
      const user=wx.getStorageSync('currentUser')||{}
      const shopId=user.shopId||''
      const db=wx.cloud.database()
      db.collection('stockLedger').where({shopId,productId}).orderBy('createdAt','desc').limit(20).get().then(res=>{
        const records=(res.data||[]).map(r=>({
          date:(new Date(r.createdAt)).toISOString().slice(0,10),
          quantity:Number(r.quantity||0),
          type:(r.direction==='in'?'in':'out'),
          typeName:(r.direction==='in'?'入库':'出库')
        }))
        const lastIn=(res.data||[]).find(r=>r.direction==='in')
        const cp={...this.data.currentProduct, records, lastInbound: lastIn? (new Date(lastIn.createdAt)).toISOString().slice(0,10): (this.data.currentProduct.lastInbound||'')}
        this.setData({currentProduct:cp})
      })
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
  onReachBottom: function () {},

  /**
   * 加载更多产品
   */
  loadMoreProducts: function () {},

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