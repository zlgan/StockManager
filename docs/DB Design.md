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
  "staffPermissions": {        // 员工的权限设置
    "disableInbound": false,   
    "disableIoutbound": false
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
  "shopId": "string",          // 店铺ID
  "inboundType": [string],     // 入库类型
  "outboundType": [string],    // 出库类型
  "productUnit":[string],      // 产品单位（个、箱、瓶等）
}
```

### 8. inbound_bills（入库单表）

**用途：** 存储入库单据主信息

**字段设计：**
```javascript
{
  "_id": "string",              // 入库单唯一标识
  "user_id": "string",          // 关联的用户ID（店主）
  "bill_no": "string",          // 单据号，自动生成
  "bill_type_id": "string",     // 入库类型ID
  "bill_date": "date",          // 入库日期
  "supplier_id": "string",      // 供应商ID
  "total_quantity": "number",   // 总数量
  "total_amount": "number",     // 总金额
  "remarks": "string",          // 备注信息
  "status": "string",           // 单据状态：draft（草稿）、confirmed（已确认）、approved（已审批）
  "approval_status": "string",  // 审批状态：pending（待审批）、approved（已通过）、rejected（已拒绝）
  "approved_by": "string",      // 审批人ID
  "approved_at": "date",        // 审批时间
  "created_at": "date",         // 创建时间
  "updated_at": "date",         // 更新时间
  "created_by": "string"        // 创建人ID
}
```

**示例数据：**
```javascript
{
  "_id": "inbound_001",
  "user_id": "user_001",
  "bill_no": "IN202401150001",
  "bill_type_id": "bill_type_001",
  "bill_date": "2024-01-15T00:00:00.000Z",
  "supplier_id": "supplier_001",
  "total_quantity": 50,
  "total_amount": 125.0,
  "remarks": "月度采购",
  "status": "confirmed",
  "approval_status": "approved",
  "approved_by": "user_001",
  "approved_at": "2024-01-15T09:00:00.000Z",
  "created_at": "2024-01-15T08:30:00.000Z",
  "updated_at": "2024-01-15T09:00:00.000Z",
  "created_by": "staff_001"
}
```

### 9. outbound_bills（出库单表）

**用途：** 存储出库单据主信息

**字段设计：**
```javascript
{
  "_id": "string",              // 出库单唯一标识
  "user_id": "string",          // 关联的用户ID（店主）
  "bill_no": "string",          // 单据号，自动生成
  "bill_type_id": "string",     // 出库类型ID
  "bill_date": "date",          // 出库日期
  "customer_id": "string",      // 客户ID
  "total_quantity": "number",   // 总数量
  "total_amount": "number",     // 总金额
  "remarks": "string",          // 备注信息
  "status": "string",           // 单据状态：draft（草稿）、confirmed（已确认）、approved（已审批）
  "approval_status": "string",  // 审批状态：pending（待审批）、approved（已通过）、rejected（已拒绝）
  "approved_by": "string",      // 审批人ID
  "approved_at": "date",        // 审批时间
  "created_at": "date",         // 创建时间
  "updated_at": "date",         // 更新时间
  "created_by": "string"        // 创建人ID
}
```

**示例数据：**
```javascript
{
  "_id": "outbound_001",
  "user_id": "user_001",
  "bill_no": "OUT202401150001",
  "bill_type_id": "bill_type_002",
  "bill_date": "2024-01-15T00:00:00.000Z",
  "customer_id": "customer_001",
  "total_quantity": 20,
  "total_amount": 60.0,
  "remarks": "日常销售",
  "status": "confirmed",
  "approval_status": "approved",
  "approved_by": "user_001",
  "approved_at": "2024-01-15T14:00:00.000Z",
  "created_at": "2024-01-15T13:30:00.000Z",
  "updated_at": "2024-01-15T14:00:00.000Z",
  "created_by": "staff_001"
}
```

### 10. bill_items（单据明细表）

**用途：** 存储入库和出库单据的产品明细信息

**字段设计：**
```javascript
{
  "_id": "string",              // 明细唯一标识
  "user_id": "string",          // 关联的用户ID（店主）
  "bill_id": "string",          // 关联的单据ID（入库单或出库单）
  "bill_type": "string",        // 单据类型：inbound（入库）、outbound（出库）
  "product_id": "string",       // 产品ID
  "product_name": "string",     // 产品名称（冗余存储，防止产品删除后查询问题）
  "product_model": "string",    // 产品型号（冗余存储）
  "product_unit": "string",     // 产品单位（冗余存储）
  "quantity": "number",         // 数量
  "unit_price": "number",       // 单价
  "total_price": "number",      // 小计金额
  "stock_before": "number",     // 操作前库存
  "stock_after": "number",      // 操作后库存
  "line_no": "number",          // 行号
  "created_at": "date",         // 创建时间
  "updated_at": "date",         // 更新时间
  "created_by": "string"        // 创建人ID
}
```

**示例数据：**
```javascript
[
  {
    "_id": "bill_item_001",
    "user_id": "user_001",
    "bill_id": "inbound_001",
    "bill_type": "inbound",
    "product_id": "product_001",
    "product_name": "可口可乐",
    "product_model": "COCA001",
    "product_unit": "瓶",
    "quantity": 50,
    "unit_price": 2.5,
    "total_price": 125.0,
    "stock_before": 50,
    "stock_after": 100,
    "line_no": 1,
    "created_at": "2024-01-15T08:30:00.000Z",
    "updated_at": "2024-01-15T08:30:00.000Z",
    "created_by": "staff_001"
  },
  {
    "_id": "bill_item_002",
    "user_id": "user_001",
    "bill_id": "outbound_001",
    "bill_type": "outbound",
    "product_id": "product_001",
    "product_name": "可口可乐",
    "product_model": "COCA001",
    "product_unit": "瓶",
    "quantity": 20,
    "unit_price": 3.0,
    "total_price": 60.0,
    "stock_before": 100,
    "stock_after": 80,
    "line_no": 1,
    "created_at": "2024-01-15T13:30:00.000Z",
    "updated_at": "2024-01-15T13:30:00.000Z",
    "created_by": "staff_001"
  }
]
```



## 数据关系说明

### 主要关系

1. **用户与其他实体**：所有业务数据都通过 `user_id` 关联到具体的店主用户
2. **产品与类别**：products.category_id → categories._id
3. **产品与供应商**：products.supplier_id → suppliers._id
4. **入库单与供应商**：inbound_bills.supplier_id → suppliers._id
5. **出库单与客户**：outbound_bills.customer_id → customers._id
6. **单据与明细**：bill_items.bill_id → inbound_bills._id 或 outbound_bills._id
7. **明细与产品**：bill_items.product_id → products._id
8. **单据与类型**：inbound_bills.bill_type_id → bill_types._id

### 数据完整性

1. **级联更新**：当产品信息变更时，需要考虑是否更新历史单据中的冗余字段
2. **软删除**：重要业务数据（如产品、客户、供应商）建议使用状态字段标记删除，而非物理删除
3. **库存同步**：入库出库操作需要同步更新产品表的库存数量
4. **审计日志**：所有重要操作都记录创建人、创建时间、更新人、更新时间

## 索引建议

### 必要索引

1. **users集合**：
   - username（唯一索引）
   - _openid（唯一索引）

2. **staff集合**：
   - user_id + username（复合唯一索引）
   - user_id + status（复合索引）

3. **products集合**：
   - user_id + model（复合唯一索引）
   - user_id + category_id（复合索引）
   - user_id + name（复合索引，支持搜索）

4. **bill_items集合**：
   - bill_id（索引）
   - user_id + bill_type + created_at（复合索引，支持按时间查询）
   - product_id（索引）

5. **inbound_bills/outbound_bills集合**：
   - user_id + bill_date（复合索引）
   - user_id + bill_no（复合唯一索引）
   - user_id + status（复合索引）

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