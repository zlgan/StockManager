# 商品库存管理小程序数据库设计

## 概述

本文档描述了商品库存管理小程序的云开发数据库设计。数据库采用NoSQL文档型数据库，每个集合（Collection）对应一个业务实体。这是一个多租户的数据库设计，所有的租户的数据都是在同一个集合中，通过`shopId`字段进行区分。用户在注册的时候需要提供店铺名称，系统会自动创建一个店铺ID，保存到Shops集合中，用户后续的所有操作都需要通过这个店铺ID进行区分。

## 数据库集合设计

### 1. shops（店铺）
**用途：** 存储店铺信息和店铺员工的权限设置
**字段设计：**
```javascript
{
  "_id": "string",             // 用户唯一标识，云开发自动生成
  "openId": "string",         // 微信用户openid，云开发自动生成
  "shopName": "string",        // 店铺名称
  "staffPermissions": {         // 员工的权限设置（系统设置页开关）
    "disableInbound": false,    // 禁用入库操作
    "disableOutbound": false,   // 禁用出库操作
    "adminApproval": false,     // 入/出库需要管理员审批
    "hideInboundPrice": false,  // 员工隐藏入库产品价格
    "ownRecordsOnly": false,    // 员工只能查看自己的入/出库记录
    "hideInventory": false,     // 员工不能查看产品库存
    "disableProductEdit": false,// 员工禁用产品编辑
    "disableStockPoint": false  // 员工账号禁用库存点
  },
  "createdAt": "date",         // 创建时间
}
```

### 2. users（店主、员工表）

**用途：** 存储系统用户（店主和员工）的基本信息和认证信息

**字段设计：**
```javascript
{
  "_id": "string",              // 用户唯一标识，云开发自动生成
  "shopId": "string",          // 店铺ID
  "openId": "string",          // 微信用户openid，云开发自动生成
  "username": "string",         // 用户名，用于登录，唯一
  "password": "string",         // 密码，加密存储
  "realName": "string",        // 真实姓名
  "role": "string",             // 用户角色：owner（店主），staff（员工）
  "status": "string",           // 账户状态：active（激活）、inactive（停用）
  "createdAt": "date",         // 创建时间
  "updatedAt": "date",         // 更新时间
  "lastLogin": "date"          // 最后登录时间
}
```
### 3. categories（产品类别表）

**用途：** 存储产品分类信息

**字段设计：**
```javascript
{
  "_id": "string",              // 类别唯一标识
  "shopId": "string",          // 店铺ID
  "name": "string",             // 类别名称
  "status": "string",           // 状态：active（启用）、inactive（停用）
}
```
### 4. products（产品表）

**用途：** 存储产品基本信息和库存数据

**字段设计：**
```javascript
{
  "_id": "string",              // 产品唯一标识
  "shopId": "string",          // 店铺ID
  "name": "string",             // 产品名称
  "code": "string",            // 产品型号/编码
  "categoryId": "string",      // 产品类别ID
  "categoryName": "string",      // 产品类别名称
  "unit": "string",             // 产品单位（个、箱、瓶等）
  "specification": "string",    // 规格名称
  "supplierId": "string",      // 供应商ID
  "supplierName": "string",      // 供应商名称
  "imageUrl": "string",        // 产品图片URL
  "inboundPrice": "number",    // 入库单价
  "outboundPrice": "number",   // 出库单价
  "warningStock": "number",    // 库存预警数量
  "isEnabled": "boolean",      // 是否启用
  "remarks": "string",          // 备注信息
  "createdAt": "date",         // 创建时间
  "updatedAt": "date",         // 更新时间   
  "createdBy": "string"        // 创建人ID
}
```
### 5. suppliers（供应商表）

**用途：** 存储供应商信息

**字段设计：**
```javascript
{
  "_id": "string",              // 供应商唯一标识
  "shopId": "string",          // 店铺ID
  "name": "string",             // 供应商名称
  "code": "string",             // 供应商编码
  "address": "string",          // 地址
  "contactPerson": "string",   // 联系人
  "phone": "string",           // 联系电话
  "remarks": "string",          // 备注信息
  "status": "string",           // 状态：active（合作中）、inactive（停止合作）
  "createdAt": "date",         // 创建时间
  "updatedAt": "date",         // 更新时间
  "createdBy": "string"        // 创建人ID
}
```
### 6. customers（客户表）

**用途：** 存储客户信息

**字段设计：**
```javascript
{
  "_id": "string",              // 客户唯一标识
  "shopId": "string",          // 店铺ID
  "name": "string",            // 客户名称
  "code": "string",            // 客户编码
  "address": "string",         // 地址
  "contactPerson": "string",   // 联系人
  "phone": "string",           // 联系电话
  "availableProducts": [],     // 可选产品对象数组，每个元素包含产品的Id和name
  "serviceMonths": "number",   // 服务月数（累计）
  "remarks": "string",          // 备注信息
  "status": "string",           // 状态：active（合作中）、inactive（停止合作）
  "createdAt": "date",         // 创建时间
  "updatedAt": "date",         // 更新时间
  "createdBy": "string"        // 创建人ID
}
```
### 7. config（配置信息）

**用途：** 业务参数配置，包括出入库类型、

**字段设计：**
```javascript
{
  "_id": "string",             // 类型唯一标识
  "inboundType": [string],     // 入库类型
  "outboundType": [string],    // 出库类型
  "productUnit":[string],      // 产品单位（个、箱、瓶等）
}
```

### 8. stockBills（出入库单据主表）

用途：统一存储入库与出库单据头，避免两个集合分开查询的复杂度

字段设计：

```javascript
{
  "_id": "string",                   // 单据主键
  "shopId": "string",               // 店铺ID（数据隔离）
  "direction": "string",            // 单据方向：in（入库）、out（出库）
  "billNo": "string",               // 单据号（按日期+序列生成）
  "billType": "string",             // 单据类型（来自 config.inboundType 或 outboundType）
  "billDate": "date",               // 单据日期

  "counterparty": {                   // 往来单位（入库为供应商，出库为客户）
    "supplierId": "string",         // 供应商ID
    "supplierName": "string",       // 供应商名称（冗余）
    "customerId": "string",         // 客户ID
    "customerName": "string"        // 客户名称（冗余）
  },

  "totals": {                         // 汇总信息
    "totalQuantity": "number",      // 总数量
    "totalAmount": "number"         // 总金额
  },

  "remarks": "string",               // 备注

  "status": "string",                // 单据状态：draft、confirmed、approved
  "approvalStatus": "string",        // 审批状态：pending、approved、rejected
  "approvedBy": "string",            // 审批人ID
  "approvedAt": "date",              // 审批时间

  "createdAt": "date",               // 创建时间
  "updatedAt": "date",               // 更新时间
  "createdBy": "string",             // 制单人（员工或店主）

  "ext": {                            // 扩展字段（可选）
    "attachments": [                  // 票据图片等附件列表
      { "fileId": "string",         // 附件 fileID（云存储）
        "name": "string"            // 附件原始名称
      }
    ]
  }
}
```

示例：

```javascript
{
  "_id": "SB202501150001",
  "shopId": "shop_001",
  "direction": "in",
  "billNo": "IN202501150001",
  "billType": "采购",
  "billDate": "2025-01-15T00:00:00.000Z",
  "counterparty": { "supplierId": "sup_001", "supplierName": "广州科技" },
  "totals": { "totalQuantity": 50, "totalAmount": 125.0 },
  "remarks": "一月补货",
  "status": "confirmed",
  "approvalStatus": "approved",
  "approvedBy": "user_owner_001",
  "approvedAt": "2025-01-15T09:00:00.000Z",
  "createdAt": "2025-01-15T08:30:00.000Z",
  "updatedAt": "2025-01-15T09:00:00.000Z",
  "createdBy": "user_staff_001"
}
```

### 9. stockItems（出入库明细表）

用途：存储每张单据的产品行项目，冗余关键产品信息以保证历史可读性

字段设计：

```javascript
{
  "_id": "string",                   // 明细主键
  "shopId": "string",               // 店铺ID
  "billId": "string",               // 关联 stockBills.id
  "direction": "string",            // in/out（与主表一致）
  "lineNo": "number",               // 行号

  "productId": "string",            // 产品ID
  "productName": "string",          // 产品名称（冗余）
  "productCode": "string",          // 产品型号/编码（支持扫码）
  "unit": "string",                 // 产品单位
  "specification": "string",        // 规格名称

  "quantity": "number",             // 数量
  "unitPrice": "number",            // 单价
  "amount": "number",               // 小计金额

  "stockBefore": "number",          // 操作前库存（冗余）
  "stockAfter": "number",           // 操作后库存（冗余）

  "createdAt": "date",              // 创建时间
  "updatedAt": "date",              // 更新时间
  "createdBy": "string"             // 创建人ID
}
```

### 10. inventoryBalances（库存结存/加权成本）

用途：为库存盘点提供当前结存数量与加权平均成本，支持出库成本计算与盘点展示

字段设计：

```javascript
{
  "id": "string",                   // 主键（原 _id）
  "shopId": "string",               // 店铺ID
  "productId": "string",            // 产品ID
  "productName": "string",          // 产品名称（冗余）

  "quantity": "number",             // 当前结存数量
  "avgCost": "number",              // 当前加权平均成本（单价）
  "totalCost": "number",            // 当前结存总成本（quantity × avgCost）

  "updatedAt": "date",              // 最近更新时间
  "updatedBy": "string"             // 最近更新人（系统/用户）
}
```

索

### 11. stockLedger（库存台账）

用途：记录产品的每一次出入库流水（面向统计与快速盘点），由业务写入或定时任务生成

字段设计：

```javascript
{
  "_id": "string",                   // 台账主键
  "shopId": "string",               // 店铺ID
  "productId": "string",            // 产品ID
  "productName": "string",          // 产品名称（冗余）
  "direction": "string",            // in/out
  "quantity": "number",             // 本次数量
  "unitPrice": "number",            // 本次单价
  "amount": "number",               // 本次金额
  "balanceQuantity": "number",      // 本次后结存数量
  "balanceAmount": "number",        // 本次后结存金额（可选加权平均）
  "billRef": {                       // 引用来源
    "billId": "string",             // 单据ID
    "billNo": "string",             // 单据号
    "lineNo": "number"              // 行号
  },
  "createdAt": "date",              // 创建时间
  "createdBy": "string"             // 创建人ID
}
```

### 12. statsMonthly（月度统计汇总）

用途：为统计模块的收益分析提供快速查询的月度聚合数据，减少每次扫描台账的压力

字段设计：

```javascript
{
  " _id": "string",                   // 主键
  "shopId": "string",               // 店铺ID
  "year": "number",                 // 年（YYYY）
  "month": "number",                // 月（1-12）

  "inboundAmount": "number",        // 入库总额（金额）
  "inboundCount": "number",         // 入库单据数
  "outboundAmount": "number",       // 出库总额（销售金额）
  "outboundCount": "number",        // 出库单据数
  "profit": "number",               // 利润（出库金额 − 出库成本）

  "generatedAt": "date",            // 汇总生成时间
  "source": "string"                // 生成来源：job（定时任务）、onConfirm（业务确认时增量刷新）
}
```



## 数据关系说明

### 主要关系（驼峰字段与新集合）

1. **用户与店铺**：users.shopId → shops._id
2. **产品与类别**：products.categoryId → categories._id
3. **产品与供应商**：products.supplierId → suppliers._id
4. **单据与明细**：stockItems.billId → stockBills._id
5. **明细与产品**：stockItems.productId → products._id
6. **单据与类型**：stockBills.billType ∈ config.inboundType 或 config.outboundType

### 数据完整性

1. **级联更新**：当产品信息变更时，需要考虑是否更新历史单据中的冗余字段
2. **软删除**：重要业务数据（如产品、客户、供应商）建议使用状态字段标记删除，而非物理删除
3. **库存同步**：入库出库操作需要同步更新产品表的库存数量
4. **审计日志**：所有重要操作都记录创建人、创建时间、更新人、更新时间

## 索引建议（统一驼峰与新集合命名）

### 必要索引

1. **users 集合**：
   - username（唯一索引）
   - shopId + role（复合索引，用于列表与权限过滤）

2. **products 集合**：
   - shopId + code（复合唯一或普通索引，支持扫码/编码查询）
   - shopId + name（复合索引，支持名称搜索）
   - shopId + categoryId（复合索引，按类别过滤）

3. **stockBills 集合**：
   - shopId + billDate（复合索引，时间范围查询）
   - shopId + billNo（唯一索引，单据号唯一）
   - shopId + direction + status（复合索引，按入/出库与状态过滤）
   - shopId + direction + billType（复合索引，按类型过滤）

4. **stockItems 集合**：
   - billId（索引，按单据关联查询明细）
   - shopId + productId（复合索引，按产品维度查询明细）
   - shopId + direction + createdAt（复合索引，支持时间序列查询）

5. **stockLedger 集合**：
   - shopId + productId + createdAt（复合索引，产品流水按时间查询）
   - shopId + direction + createdAt（复合索引，入/出库流水统计）

6. **statsMonthly 集合**：
   - shopId + year + month（唯一索引，月度汇总唯一）

## 数据安全

### 权限控制

1. **数据隔离**：通过 `user_id` 确保不同店主的数据完全隔离
2. **员工权限**：通过 `system_settings` 和 `staff.permissions` 控制员工操作权限
3. **敏感信息**：密码字段必须加密存储，价格信息根据权限设置控制显示

### 备份策略

1. **定期备份**：建议每日自动备份重要业务数据
2. **增量备份**：对于大量历史数据，采用增量备份策略
3. **数据恢复**：制定数据恢复预案，确保业务连续性

## 性能优化

### 查询优化

1. **分页查询**：列表页面采用分页查询，避免一次性加载大量数据
2. **字段选择**：查询时只选择必要字段，减少数据传输量
3. **缓存策略**：对于系统设置、产品类别等相对稳定的数据，可以考虑客户端缓存

### 数据归档

1. **历史数据**：对于超过一定时间的历史单据，可以考虑归档到单独的集合
2. **统计数据**：可以定期生成统计汇总数据，提高统计查询性能