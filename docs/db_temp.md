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

---

## 扩展集合设计（统计、盘点、查询）

### 4. statsMonthly（月度统计汇总）

用途：为统计模块的收益分析提供快速查询的月度聚合数据，减少每次扫描台账的压力

字段设计：
```javascript
{
  "id": "string",                   // 主键（原 _id）
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

索引建议：
- `shopId + year + month`（唯一）
- `shopId + year`（范围查询）

数据来源：
- 由 `stockLedger` 每次入/出库确认（或审批通过）后增量更新；或每日定时全量重算。

### 5. inventoryBalances（库存结存/加权成本）

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

索引建议：
- `shopId + productId`（唯一）
- `shopId + updatedAt`

更新规则（加权平均法）：
- 入库确认：`newAvg = (oldAvg × oldQty + inboundQty × inboundPrice) ÷ (oldQty + inboundQty)`；`newQty = oldQty + inboundQty`
- 出库确认：按当前 `avgCost` 计入出库成本；`newQty = oldQty − outboundQty`；`avgCost` 通常保持不变（如需精确按批次可扩展批次法）。
- 编辑单据：对旧值与新值做差额调整，同步回滚/重放到 `inventoryBalances` 与 `stockLedger`。

### 6. billSearchViews（可选：单据快速检索视图）

用途：为单据查询模块提供快速检索（可不建独立集合，直接使用 `stockBills` 足够）。

字段设计（如启用）：
```javascript
{
  "id": "string",                   // 主键（原 _id）
  "shopId": "string",               // 店铺ID
  "direction": "string",            // in/out
  "billNo": "string",               // 单据号
  "billDate": "date",               // 单据日期
  "billType": "string",             // 单据类型
  "counterpartyName": "string",     // 供应商/客户名称（统一为一个字段）
  "creatorName": "string",          // 制单人名称（冗余便于展示）
  "status": "string",               // 单据状态
  "approvalStatus": "string"        // 审批状态
}
```

建议：
- 若 `stockBills` 已建立相应索引，通常无需此视图集合；列表页直接查 `stockBills`，详情再拉 `stockItems` 即可。

---

## 模块与集合关系说明

### 入库模块（pages/inbound）
- 使用 `stockBills.direction = 'in'` 与对应 `stockItems`
- 单价来源：入库单价（`unitPrice`）；确认后按加权平均更新 `inventoryBalances` 与写入 `stockLedger`
- 修改单据：需对差异进行回滚/重放，保证台账与结存一致

### 出库模块（pages/outbound）
- 使用 `stockBills.direction = 'out'` 与对应 `stockItems`
- 成本计算：按出库当时的 `inventoryBalances.avgCost` 计入成本；销售价来自 `stockItems.unitPrice`
- 修改单据：同入库，做差额调整并同步台账/结存

### 单据查询模块（pages/bills, pages/bill_detail）
- 列表：直接查询 `stockBills`，按 `direction/billType/billDate/counterpartyName/billNo/createdBy` 过滤
- 详情：读取 `stockBills` + `stockItems`；附件在 `stockBills.ext.attachments`

### 统计模块（pages/statistics）
- 收益分析：优先读取 `statsMonthly`；缺失时回落到 `stockLedger` 聚合
- 库存盘点：读取 `inventoryBalances` 展示当前库存数量与价值；支持预警与分类汇总

---

## 索引（驼峰同步）

### stockBills
- `shopId + billDate`
- `shopId + billNo`（唯一）
- `shopId + direction + status`
- `shopId + direction + billType`

### stockItems
- `billId`
- `shopId + productId`
- `shopId + direction + createdAt`

### stockLedger
- `shopId + productId + createdAt`
- `shopId + createdAt`
- `shopId + direction + createdAt`

### statsMonthly
- `shopId + year + month`（唯一）

### inventoryBalances
- `shopId + productId`（唯一）




SOLO Coder

思考过程

涉及集合

- stockBills ：出库单据主表（direction='out'）
- stockItems ：出库明细
- inventoryBalances ：当前库存结存与加权平均成本
- stockLedger ：库存流水（用于统计与追溯）
- statsMonthly ：月度汇总（收益分析）
- shops ：如需审批，读取 staffPermissions.adminApproval
示例前置

- 当前结存（示例）：
  - prod_001 ：quantity=110，avgCost=2.2727（约），totalCost≈250.0
  - prod_002 ：quantity=50，avgCost=1.92，totalCost=96.0
步骤与示例数据

- 新建草稿单（stockBills）
  
  - 说明：员工在出库页保存草稿，方向为 out
  - 数据
    ```
    {
      id: "SB202501160001",
      shopId: "shop_001",
      direction: "out",
      billNo: "OUT202501160001",
      billType: "销售出库",
      billDate: "2025-01-16T00:00:00.000Z",
      counterparty: { customerId: "cus_001", customerName: "上海电商" },
      totals: { totalQuantity: 0, totalAmount: 0 },   // 金额为销售额
      remarks: "线上订单",
      status: "draft",
      approvalStatus: "pending",                     // 若启用审批
      createdAt: "2025-01-16T09:10:00.000Z",
      updatedAt: "2025-01-16T09:10:00.000Z",
      createdBy: "user_staff_001",
      ext: { attachments: [] }
    }
    ```
- 录入明细（stockItems）
  
  - 说明：每个产品一条明细， unitPrice 为销售单价
  - 数据
    ```
    {
      id: "SI202501160001_1",
      shopId: "shop_001",
      billId: "SB202501160001",
      direction: "out",
      lineNo: 1,
      productId: "prod_001",
      productName: "可口可乐",
      productCode: "COCA001",
      unit: "瓶",
      specification: "500ml",
      quantity: 20,                 // 出库数量
      unitPrice: 3.0,               // 销售价
      amount: 60.0,                 // 销售额小计
      stockBefore: 110,             // 出库前库存
      stockAfter: 90,               // 预估（确认后生效）
      createdAt: "2025-01-16T09:12:00.000Z",
      updatedAt: "2025-01-16T09:12:00.000Z",
      createdBy: "user_staff_001"
    }
    {
      id: "SI202501160001_2",
      shopId: "shop_001",
      billId: "SB202501160001",
      direction: "out",
      lineNo: 2,
      productId: "prod_002",
      productName: "雪碧",
      productCode: "SPRITE001",
      unit: "瓶",
      specification: "500ml",
      quantity: 10,
      unitPrice: 2.5,
      amount: 25.0,
      stockBefore: 50,
      stockAfter: 40,
      createdAt: "2025-01-16T09:13:00.000Z",
      updatedAt: "2025-01-16T09:13:00.000Z",
      createdBy: "user_staff_001"
    }
    ```
- 汇总与确认/审批（stockBills）
  
  - 说明：计算销售总额与总数量，草稿→confirmed；若启用审批则通过后→approved
  - 数据
    ```
    {
      id: "SB202501160001",
      totals: { totalQuantity: 30, totalAmount: 85.0 },
      status: "confirmed",
      approvalStatus: "approved",
      approvedBy: "user_owner_001",
      approvedAt: "2025-01-16T10:00:00.000Z",
      updatedAt: "2025-01-16T10:00:00.000Z"
    }
    ```
- 出库成本与结存（inventoryBalances）
  
  - 说明：出库成本按当前加权平均成本计算；出库后数量减少， avgCost 通常保持不变
  - 计算与数据
    - prod_001 成本：20 × 2.2727 ≈ 45.454 → 45.45
      ```
      {
        id: "IB_prod_001",
        shopId: "shop_001",
        productId: "prod_001",
        productName: "可口可乐",
        quantity: 90,                 // 110 - 20
        avgCost: 2.2727,              // 不变（批次法除外）
        totalCost: 204.54,            // 90 × 2.2727
        updatedAt: "2025-01-16T10:01:00.000Z",
        updatedBy: "system"
      }
      ```
    - prod_002 成本：10 × 1.92 = 19.20
      ```
      {
        id: "IB_prod_002",
        shopId: "shop_001",
        productId: "prod_002",
        productName: "雪碧",
        quantity: 40,                 // 50 - 10
        avgCost: 1.92,
        totalCost: 76.8,              // 40 × 1.92
        updatedAt: "2025-01-16T10:01:00.000Z",
        updatedBy: "system"
      }
      ```
- 写台账流水（stockLedger）
  
  - 说明：每条明细一条 direction='out' 流水，记录销售额与结存
  ```
  {
    id: "SL_202501160001_1",
    shopId: "shop_001",
    productId: "prod_001",
    productName: "可口可乐",
    direction: "out",
    quantity: 20,
    unitPrice: 3.0,                 // 销售单价
    amount: 60.0,                   // 销售额
    balanceQuantity: 90,
    balanceAmount: 204.54,          // 结存总成本（avgCost × balanceQuantity）
    billRef: { billId: "SB202501160001", billNo: "OUT202501160001", lineNo: 1 },
    createdAt: "2025-01-16T10:01:00.000Z",
    createdBy: "user_staff_001"
  }
  {
    id: "SL_202501160001_2",
    shopId: "shop_001",
    productId: "prod_002",
    productName: "雪碧",
    direction: "out",
    quantity: 10,
    unitPrice: 2.5,
    amount: 25.0,
    balanceQuantity: 40,
    balanceAmount: 76.8,
    billRef: { billId: "SB202501160001", billNo: "OUT202501160001", lineNo: 2 },
    createdAt: "2025-01-16T10:01:00.000Z",
    createdBy: "user_staff_001"
  }
  ```
- 更新月度统计（statsMonthly）
  
  - 说明：销售额与单据数累加，利润为销售额 − 出库成本（加权平均）
  - 计算：销售额=60.0+25.0=85.0；成本=45.45+19.20≈64.65；利润≈20.35
  - 数据
    ```
    {
      id: "SM_2025_01_shop_001",
      shopId: "shop_001",
      year: 2025,
      month: 1,
      inboundAmount: 185.0,        // 示例上一单入库（参考前例）
      inboundCount: 1,
      outboundAmount: 85.0,        // 本次增加
      outboundCount: 1,
      profit: 20.35,               // 当前累计利润（本次 + 历史）
      generatedAt: "2025-01-16T10:02:00.000Z",
      source: "onConfirm"
    }
    ```
- 附件与审批（可选）
  
  - 若启用审批： stockBills.status='confirmed' 但 approvalStatus='pending' ，通过后才写 stockLedger 与更新 inventoryBalances
  - 附件示例：
    ```
    {
      ext: {
        attachments: [
          { fileId: "cloud://.../outbound/shop_001_delivery.jpg", name: "发货单.
          jpg" }
        ]
      }
    }
    ```
- 修改单据（差额调整示例）
  
  - 场景：将 SI202501160001_1 数量 20 → 25（销售价 3.0 不变）
  - 差额： deltaQty=+5 ， deltaSales=+15.0 ， deltaCost=5 × 2.2727 ≈ 11.36
  - 结存调整（prod_001）： quantity: 90 → 85 ， avgCost 不变， totalCost: 204.54 → 193.18
    ```
    {
      id: "IB_prod_001",
      quantity: 85,
      avgCost: 2.2727,
      totalCost: 193.18,
      updatedAt: "2025-01-16T11:00:00.000Z",
      updatedBy: "system"
    }
    ```
  - 台账补记差额流水：
    ```
    {
      id: "SL_202501160001_1a",
      shopId: "shop_001",
      productId: "prod_001",
      productName: "可口可乐",
      direction: "out",
      quantity: 5,
      unitPrice: 3.0,
      amount: 15.0,
      balanceQuantity: 85,
      balanceAmount: 193.18,
      billRef: { billId: "SB202501160001", billNo: "OUT202501160001", lineNo: 1 },
      createdAt: "2025-01-16T11:00:00.000Z",
      createdBy: "user_staff_001"
    }
    ```
  - 更新明细与头部汇总：
    ```
    { id: "SI202501160001_1", quantity: 25, amount: 75.0, updatedAt: 
    "2025-01-16T11:00:00.000Z" }
    { id: "SB202501160001", totals: { totalQuantity: 35, totalAmount: 100.0 }, 
    updatedAt: "2025-01-16T11:00:00.000Z" }
    ```
  - 更新月度统计： outboundAmount += 15.0 ， profit += (15.0 − 11.36) ≈ 3.64
要点总结

- 出库成本采用加权平均：读取 inventoryBalances.avgCost 计成本； avgCost 在出库时保持不变
- 修改单据用“差额补记”确保审计与台账可追溯，同时同步结存与统计
- 若启用审批，出库仅在 approved 后生效，才写台账与结存，并更新月度统计





=====问题======

给出入库单的更新的流程以及涉及到需要修改的集合，给出demo数据
给出出库单的更新的流程以及涉及到需要修改的集合，给出demo数据

stockItems（出入库明细表）
stockBefore操作前库存（冗余）stockAfter操作后库存（冗余）这两个冗余字段设计意图是什么，是否与

stockLedger（库存台账）
 "balanceQuantity":本次后结存数量，  "balanceAmount": 本次后结存金额（可选加权平均）
这两个字段的设计意图是什么，以及计算方法？ 

出库成本与结存（inventoryBalances）
为什么需要记录totalCost字段？ 

商品	数量	均价	售价	销售额	成本	净利润		
可乐	20	2.2727	3	60	45.454	14.546		
雪碧	10	1.92	2.5	25	19.2	5.8		20.346

