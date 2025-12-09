
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
7. 单据的修改，单价和数量同时修改怎么处理
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

add to powershll $profile:
 function global:bash { & "C:\Program Files\Git\usr\bin\bash.exe" -i -l }