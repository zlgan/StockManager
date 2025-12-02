
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
