
https://mp.weixin.qq.com/wxamp/devprofile/get_profile?token=413127723&lang=zh_CN




## CLI

tcb fn deploy --force --all 

## 自动化测试

总体思路

- 分层测试，分别覆盖云函数业务逻辑、前端页面/组件逻辑和端到端用户流程
- 明确业务错误与系统错误的判定与断言标准（前端按 res.result.ok 、后端按早返回或抛异常）
- 采用可控的测试数据与独立 shopId ，保证数据隔离与可重复执行
测试层次

- 云函数单元/集成测试
  
  - 目标：验证各 action 的参数校验、业务错误码与成功路径；确保系统异常自然抛出
  - 工具： jest
  - 方法：
    - 将事件对象直接传入 cloudfunctions/<service>/index.js 的 exports.main ，断言返回结构 {ok:true} 或 {ok:false, code, message}
    - 使用可控的“伪数据库”或局部 mock wx-server-sdk 的 cloud.database 相关方法，模拟 count/get/update/add 的成功与失败路径
    - 系统异常（例如让 db.collection().add 抛错）断言函数抛出异常而不是返回 {ok:false}
- 前端页面/组件测试
  
  - 目标：验证页面输入校验、调用云函数后的提示文案与 UI 状态更新
  - 工具： miniprogram-simulate
  - 方法：
    - 加载目标页面（如 pages/register/register 、 pages/login/login 、 pages/outbound/outbound ），注入 mock 的 wx.cloud.callFunction 返回结构化结果或抛异常
    - 断言 wx.showToast 文案映射是否正确（如 USERNAME_EXISTS → “用户名已存在”）以及页面数据更新（如 billNo 、 canSubmit 、 totals ）
- 端到端（E2E）测试
  
  - 目标：从 UI 触发完整业务流程（注册→登录→入/出库→编辑单据）
  - 工具： miniprogram-automator （驱动微信开发者工具）
  - 方法：
    - 配置开发者工具路径，启动项目，按测试脚本执行：输入表单、扫码模拟（用手工填充或模拟返回）、提交表单、校验成功提示与页面跳转
    - 测试完成后清理测试数据（删除 shopId=TEST_SHOP_xxx 的集合记录）
数据与环境

- 测试数据隔离
  - 使用专用 shopId （例如 TEST_SHOP_YYYYMMDD ），并在每次测试前后进行数据清理
  - 固定日期与编码前缀，确保 ensureBillNo 的计数行为稳定可断言
- 本地/模拟环境
  - 优先使用真实云数据库的测试环境；如需本地离线模拟，使用 wx-server-sdk 的 mock 替代
  - 前端测试无需真实云环境，统一 mock wx.cloud.callFunction 即可
脚本与目录建议

- 目录
  - tests/cloud/<service>.spec.js ：云函数测试
  - tests/pages/<page>.spec.js ：页面/组件测试
  - tests/e2e/<flow>.spec.js ：端到端流程测试
  - tests/fixtures/*.json ：测试数据模板
- package.json 增加脚本
  - test ：运行所有 jest 测试
  - test:cloud ：仅云函数测试
  - test:pages ：仅页面/组件测试
  - test:e2e ：端到端测试（本地有开发者工具时执行）
  - seed:test / clean:test ：填充与清理测试数据（可调用一个简单的 initDb 云函数 action:'seed'|'clean' ）
断言重点

- 云函数
  - 业务错误：早返回 {ok:false, code, message} （如 NO_SHOP 、 INVALID_PARAMS 、 CODE_EXISTS 、 USERNAME_EXISTS 、 INSUFFICIENT_STOCK ）
  - 成功：返回 {ok:true, ...} （如带 id 或 billNo ）
  - 系统异常：抛出异常并在控制台显示失败（不返回 {ok:false} ）
- 前端
  - 成功分支：正确的提示文案、跳转或视图状态（如保存成功、返回上一页）
  - 业务失败：错误码映射成用户友好文案（如 “用户名已存在”）
  - 网络/平台异常：统一文案 “网络异常或服务器错误” 并输出 console.error 以便调试
CI建议

- GitHub Actions 或其他 CI
  - 步骤： checkout → setup-node → npm ci → npm run test:cloud 和 npm run test:pages
  - E2E 测试在 CI 中通常需要自托管 runner（安装微信开发者工具），可先在本地或专用 Runner 执行；CI 中只跑云函数与页面测试，保障主干稳定
- 覆盖率
  - jest --coverage ，针对云函数提高分支覆盖（包含业务错误与系统异常）
最佳实践

- 为云函数中的关键逻辑提取可测的纯函数（例如 ensureBillNo 的序号计算、 adjustBillDelta 的差额计算），单独做单元测试，数据库仅作为输入/输出边界
- 将错误码维护为统一常量或文档清单，前端映射表统一管理
- 为通用的 wx.cloud.callFunction 包装器增加内部日志上报（ console.error + wx.getLogManager().error ），页面侧仅写成功分支与简短提示
- 测试数据清理与幂等：测试前后分别调用清理脚本，保证多次运行的稳定性
落地次序

- 先建立云函数的 jest 测试（成本最低、收益最高）
- 再加入页面/组件的模拟测试，覆盖主要页面的交互逻辑与错误映射
- 条件允许时加入关键业务的 E2E 测试，至少覆盖登录/出库登记/单据编辑三条主流程
需要我为现有代码库创建基础的 jest 配置与一个示例云函数测试文件（例如 supplierService 的 add/update/delete 场景）以及页面的 miniprogram-simulate 示例吗？我可以直接补上脚手架与示例测试，后续你只需增加用例即可。
## Memo
1. https://mp.weixin.qq.com/wxamp/devprofile/get_profile?token=413127723&lang=zh_CN
2. 腾讯云控制台 https://cloud.tencent.com/login
3. 微信小程序管理后台 https://mp.weixin.qq.com/

### 自动化工具
1. Tencent CloudBase（TCB） https://docs.cloudbase.net/cli-v1/intro
2. 控制台数据库高级操作（运维） https://developers.weixin.qq.com/miniprogram/dev/wxcloudservice/wxcloud/guide/database/console-dbscript.html

## to-do-list 
1. 云存储最好能记录文件的原始名称
2. 如何设计小程序的日志系统，方便快速定位问题
3. 如何在微信开发者工具可创建两个免费环境
4. 如何对实现小程序的自动化测试
5. 如何提示小程序端版本更新并重启更新
6. postman 更新token并写入全局变量
```js
var jsonData = pm.response.json();
var accessToken = jsonData.access_token;
console.log("提取到的access_token:", accessToken);
pm.globals.set("access_token", accessToken);
```

### 引入多环境支持
第一步：创建多个环境的配置内容
为每个环境创建一个独立的JS文件，只导出该环境的配置对象。

```js
// config.develop.js - 开发环境
module.exports = {
  envName: 'develop',
  cloudEnv: 'your-dev-env-id', // 开发环境云ID
  apiBaseUrl: 'https://dev.api.com'
};

// config.release.js - 生产环境
module.exports = {
  envName: 'release',
  cloudEnv: 'your-prod-env-id', // 生产环境云ID
  apiBaseUrl: 'https://api.com'
};

// config.trial.js - 体验版环境（可选）
module.exports = {
  envName: 'trial',
  cloudEnv: 'your-trial-env-id',
  apiBaseUrl: 'https://test.api.com'
};
```
第二步：创建统一入口文件进行动态判断
创建一个主配置文件（如 config.js），在这里使用 wx.getAccountInfoSync() 判断环境，并导入对应的配置。

```js
// config.js - 主入口文件
const { miniProgram } = wx.getAccountInfoSync();
const envVersion = miniProgram.envVersion; // 'develop', 'trial', 'release'[citation:4][citation:7]

let config = {};

switch (envVersion) {
  case 'develop':
    config = require('./config.develop');
    break;
  case 'trial':
    config = require('./config.trial');
    break;
  case 'release':
    config = require('./config.release');
    break;
  default:
    // 默认使用生产环境配置，防止意外
    config = require('./config.release');
    console.warn(`未知 envVersion: ${envVersion}, 已使用生产配置`);
}

// 可选：将环境版本挂载到配置对象上，方便其他地方使用
config.envVersion = envVersion;

module.exports = config;
```
第三步：在 app.js 中使用统一配置
在应用启动时，引入统一入口的配置文件，并使用其提供的配置来初始化云开发。

```js
// app.js
const config = require('./config.js'); // 引入统一配置入口

App({
  onLaunch() {
    console.log('当前运行环境：', config.envName, '云环境ID：', config.cloudEnv);
    
    if (wx.cloud) {
      wx.cloud.init({
        traceUser: true,
        env: config.cloudEnv // 使用动态配置
      });
    }
    // 你也可以将配置挂载到全局，方便页面使用
    this.globalData.config = config;
  },
  globalData: {}
});
```
第四步：在项目其他地方使用配置
在任意页面或工具文件中，都可以引入这个统一的配置文件来获取正确的环境变量。

```javascript
// 在某个页面 page.js 或工具文件 utils/request.js 中
const config = require('../../config.js');
const requestUrl = config.apiBaseUrl + '/user/login';
```
