# 出入库数据库重新设计（草案）

## 设计目标

- 统一出入库模型，简化统计与查询
- 保留店铺隔离与审批流程，兼容扫码与价格隐藏等业务特性
- 强化审计与台账，保证库存一致性与可追溯性

## 核心集合

### 1. stockBills（出入库单据主表）

用途：统一存储入库与出库单据头，避免两个集合分开查询的复杂度

字段设计：
```javascript
{
  "id": "string",                   // 单据主键（原 _id）
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
  "id": "SB202501150001",
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

### 2. stockItems（出入库明细表）

用途：存储每张单据的产品行项目，冗余关键产品信息以保证历史可读性

字段设计：
```javascript
{
  "id": "string",                   // 明细主键（原 _id）
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

示例：
```javascript
{
  "id": "SI202501150001_1",
  "shopId": "shop_001",
  "billId": "SB202501150001",
  "direction": "in",
  "lineNo": 1,
  "productId": "prod_001",
  "productName": "可口可乐",
  "productCode": "COCA001",
  "unit": "瓶",
  "specification": "500ml",
  "quantity": 50,
  "unitPrice": 2.5,
  "amount": 125.0,
  "stockBefore": 50,
  "stockAfter": 100,
  "createdAt": "2025-01-15T08:30:00.000Z",
  "updatedAt": "2025-01-15T08:30:00.000Z",
  "createdBy": "user_staff_001"
}
```

### 3. stockLedger（库存台账）

用途：记录产品的每一次出入库流水（面向统计与快速盘点），由业务写入或定时任务生成

字段设计：
```javascript
{
  "id": "string",                   // 台账主键（原 _id）
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

## 生成规则与流程

- 单据号：`INyyyyMMddNNNN` / `OUTyyyyMMddNNNN`（按店铺+日期自增）
- 审批：当店铺`shops.staffPermissions.adminApproval`为`true`时，员工提交的单据需审批后才计入台账与库存
- 权限：员工受`shops.staffPermissions`限制；店主（Owner）不受限
- 冗余策略：明细冗余产品名称、编码、单位、规格；主表冗余供应商/客户名称，保证历史可追溯

## 索引设计

### stock_bills
- `shopId + bill_date`
- `shopId + bill_no`（唯一）
- `shopId + direction + status`
- `shopId + direction + bill_type`

### stock_items
- `bill_id`
- `shopId + product_id`
- `shopId + direction + created_at`

### stock_ledger
- `shopId + product_id + created_at`
- `shopId + created_at`
- `shopId + direction + created_at`

## 统计与盘点建议

- 收益分析：按`stock_ledger`聚合年度/月度入库金额、出库金额与利润（出库金额−入库加权成本）
- 库存盘点：按`stock_ledger.balance_quantity`汇总到产品与类别；支持预警与分类价值统计
- 导出：基于`stock_bills`与`stock_items`生成Excel；图片附件存储于云存储并以`fileId`关联

## 迁移与兼容

- 旧`inbound_bills/outbound_bills`可逐步迁移到`stock_bills`，`bill_items`迁移到`stock_items`
- 统计页与查询统一改为按`direction`过滤，减少双集合联查