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



# 问题

## stockItems（出入库明细表）

1. stockBefore操作前库存（冗余）stockAfter操作后库存（冗余）这两个冗余字段设计意图是什么，在哪里有使用到？

设计意图

- 历史快照：在明细层记录“当次变更前后”的库存值，形成可审计、可追溯的现场快照，避免后续因产品名或成本被修改而影响历史阅读。
- 展示友好：单据详情页直观显示本次操作的库存变化（如 50 → 100），无需额外计算或回放台账。
- 差额校验与回滚：单据被编辑/撤销时，能快速定位差值并与台账、结存进行一致性校验，降低重算成本。
- 性能折中：避免为每条明细都“回放所有流水”才能得到操作前后的库存；在确认/审批时一次性写入冗余，后续查询开销小。
使用位置

- 单据详情与列表展示
  - pages/bill_detail ：展示每行产品操作前后数量变化，提升可读性。
  - pages/bills ：列表摘要可显示变化（可选），便于快速审阅。
- 统计与盘点辅助
  - pages/statistics 的盘点场景中，明细快照便于交叉验证 inventoryBalances 当前值与历史变动是否吻合（非主数据，仅用于佐证）。
- 单据编辑/差额调整
  - 当入/出库单被修改时，基于旧的 stockBefore/stockAfter 计算差额并对 inventoryBalances 与 stockLedger 做“补记/回滚”；避免全量回放流水。
- 导出与审计
  - 导出 Excel 或审计抽查时，直接提供当次变更前后库存值，减少解释成本。
  写入与维护时机

- 草稿阶段：可填“预估值”（来自 inventoryBalances.quantity ），最终以确认/审批时的实际值为准。
- 确认/审批通过时（生效）
  - 入库： stockBefore = 当前结存数量 ， stockAfter = stockBefore + quantity
  - 出库： stockBefore = 当前结存数量 ， stockAfter = stockBefore - quantity
  - 按此快照写入 stockItems ，同时更新 inventoryBalances 和记 stockLedger 。
- 单据修改/撤销
  - 以明细旧快照为基线，计算差额并对 inventoryBalances 与 stockLedger 做补差（推荐“补记差额”而非覆盖原流水，便于审计）。
  注意事项

- 非主数据来源：库存真相以 inventoryBalances （当前结存）与 stockLedger （流水）为准， stockBefore/stockAfter 主要用于展示与审计辅助。
- 并发与一致性：最终以“确认/审批时刻”的结存为快照来源，避免并发期间的读写竞态；编辑时务必同步重算快照，保持与结存/流水一致。
- 成本模型：与加权平均成本（ avgCost ）配合，仅反映数量快照；成本在 inventoryBalances/stockLedger 维护与使用。



## stockLedger（库存台账）



# 入库流程

入库流程

- 涉及集合： stockBills 、 stockItems 、 inventoryBalances 、 stockLedger 、 statsMonthly 、 shops （仅当需要审批）
- 流程阶段：草稿单创建 → 明细录入与汇总 → 确认/审批 → 生效写台账与更新结存 → 增量更新统计
步骤与示例

- 创建草稿单据头（stockBills）
  
  - 说明：员工在入库页保存草稿，方向为 in
  - 示例
    ```
    {
      id: "SB202501150001",
      shopId: "shop_001",
      direction: "in",
      billNo: "IN202501150001",
      billType: "采购",
      billDate: "2025-01-15T00:00:00.000Z",
      counterparty: { supplierId: "sup_001", 
      supplierName: "广州科技" },
      totals: { totalQuantity: 0, totalAmount: 0 },
      remarks: "一月补货",
      status: "draft",
      approvalStatus: "pending",     // 若店铺开启审批
      createdAt: "2025-01-15T08:20:00.000Z",
      updatedAt: "2025-01-15T08:20:00.000Z",
      createdBy: "user_staff_001",
      ext: { attachments: [] }
    }
    ```
- 录入明细（stockItems）
  
  - 说明：每个产品一条明细，录入单价与数量；可支持扫码填充 productCode
  - 示例（两行）
    ```
    {
      id: "SI202501150001_1",
      shopId: "shop_001",
      billId: "SB202501150001",
      direction: "in",
      lineNo: 1,
      productId: "prod_001",
      productName: "可口可乐",
      productCode: "COCA001",
      unit: "瓶",
      specification: "500ml",
      quantity: 50,
      unitPrice: 2.5,
      amount: 125.0,
      stockBefore: 50,     // 来源于 inventoryBalances 或页
      面展示
      stockAfter: 100,     // 预估（确认后最终生效）
      createdAt: "2025-01-15T08:25:00.000Z",
      updatedAt: "2025-01-15T08:25:00.000Z",
      createdBy: "user_staff_001"
    }
    {
      id: "SI202501150001_2",
      shopId: "shop_001",
      billId: "SB202501150001",
      direction: "in",
      lineNo: 2,
      productId: "prod_002",
      productName: "雪碧",
      productCode: "SPRITE001",
      unit: "瓶",
      specification: "500ml",
      quantity: 30,
      unitPrice: 2.0,
      amount: 60.0,
      stockBefore: 20,
      stockAfter: 50,
      createdAt: "2025-01-15T08:26:00.000Z",
      updatedAt: "2025-01-15T08:26:00.000Z",
      createdBy: "user_staff_001"
    }
    ```
- 汇总与确认（stockBills）
  
  - 说明：计算 totals 并从草稿改为 confirmed ；若店铺需要审批则先 pending ，通过后 approved
  - 汇总更新
    ```
    // 更新头部 totals 与状态
    {
      id: "SB202501150001",
      totals: { totalQuantity: 80, totalAmount: 185.0 },
      status: "confirmed",
      approvalStatus: "approved",       // 经店主审批通过
      approvedBy: "user_owner_001",
      approvedAt: "2025-01-15T09:00:00.000Z",
      updatedAt: "2025-01-15T09:00:00.000Z"
    }
    ```
- 更新库存结存（inventoryBalances，加权平均）
  
  - 说明：入库确认（或审批通过）后，对每个产品按加权平均法更新结存与成本
  - 计算示例（prod_001）
    - 入库前： quantity=50 ， avgCost=2.00 ， totalCost=100.00
    - 本次入库： inboundQty=50 ， inboundPrice=2.50
    - 新平均： newAvg=(2.00×50 + 2.50×50) ÷ (50 + 50) = 2.25
    - 新结存： newQty=100 ， newTotalCost=2.25×100=225.00
    ```
    // prod_001
    {
      id: "IB_prod_001",
      shopId: "shop_001",
      productId: "prod_001",
      productName: "可口可乐",
      quantity: 100,
      avgCost: 2.25,
      totalCost: 225.0,
      updatedAt: "2025-01-15T09:00:00.000Z",
      updatedBy: "system"
    }
    // prod_002
    // 入库前：quantity=20, avgCost=1.80 → 新avg=(1.80×20
    +2.00×30)/50=1.92, newQty=50, totalCost=96.0
    {
      id: "IB_prod_002",
      shopId: "shop_001",
      productId: "prod_002",
      productName: "雪碧",
      quantity: 50,
      avgCost: 1.92,
      totalCost: 96.0,
      updatedAt: "2025-01-15T09:00:00.000Z",
      updatedBy: "system"
    }
    ```
- 写入库存台账（stockLedger）
  
  - 说明：每条明细生成一条流水，记录当次入库与更新后的结存，用于统计与追溯
  ```
  {
    id: "SL_202501150001_1",
    shopId: "shop_001",
    productId: "prod_001",
    productName: "可口可乐",
    direction: "in",
    quantity: 50,
    unitPrice: 2.5,
    amount: 125.0,
    balanceQuantity: 100,
    balanceAmount: 225.0,                // 结存总成本
    （avgCost × balanceQuantity）
    billRef: { billId: "SB202501150001", billNo: 
    "IN202501150001", lineNo: 1 },
    createdAt: "2025-01-15T09:00:00.000Z",
    createdBy: "user_staff_001"
  }
  {
    id: "SL_202501150001_2",
    shopId: "shop_001",
    productId: "prod_002",
    productName: "雪碧",
    direction: "in",
    quantity: 30,
    unitPrice: 2.0,
    amount: 60.0,
    balanceQuantity: 50,
    balanceAmount: 96.0,
    billRef: { billId: "SB202501150001", billNo: 
    "IN202501150001", lineNo: 2 },
    createdAt: "2025-01-15T09:00:00.000Z",
    createdBy: "user_staff_001"
  }
  ```
- 增量更新月度统计（statsMonthly）
  
  - 说明：收益分析优先读取月度汇总；入库确认后可增量更新当月入库金额与单据数
  ```
  // 当月记录若存在则累加，否则创建
  {
    id: "SM_2025_01_shop_001",
    shopId: "shop_001",
    year: 2025,
    month: 1,
    inboundAmount: 185.0,      // 本次+历史（示例仅本次）
    inboundCount: 1,
    outboundAmount: 0.0,
    outboundCount: 0,
    profit: 0.0,               // 利润在出库时累积（销售额-出
    库成本）
    generatedAt: "2025-01-15T09:01:00.000Z",
    source: "onConfirm"
  }
  ```
- 可选：附件与审批（shops.staffPermissions）
  
  - 若 shops.staffPermissions.adminApproval 为 true ，草稿 → pending ，店主审批后 approved 才写台账与结存
  - 附件示例（保存在 stockBills.ext.attachments ）
    ```
    {
      ext: {
        attachments: [
          { fileId: "cloud://.../products/
          shop_001_invoice.jpg", name: "发票.jpg" }
        ]
      }
    }
    ```
- 修改单据（差额调整示例）
  
  - 场景：将 SI202501150001_1 数量 50 → 60（单价不变 2.5）
  - 差额： deltaQty=+10 ， deltaAmount=+25.0
  - 调整 inventoryBalances （prod_001）
    - 旧： qty=100, avg=2.25 → total=225.0
    - 新平均： newAvg=(2.25×100 + 10×2.5) ÷ 110 = 2.2727...
    - 新结存： qty=110, total≈250.0
  ```
  {
    id: "IB_prod_001",
    quantity: 110,
    avgCost: 2.2727,
    totalCost: 250.0,
    updatedAt: "2025-01-15T10:00:00.000Z",
    updatedBy: "system"
  }
  ```
  - 台账补记一条差额流水（或更新原流水，推荐补差更易审计）
  ```
  {
    id: "SL_202501150001_1a",
    shopId: "shop_001",
    productId: "prod_001",
    productName: "可口可乐",
    direction: "in",
    quantity: 10,
    unitPrice: 2.5,
    amount: 25.0,
    balanceQuantity: 110,
    balanceAmount: 250.0,
    billRef: { billId: "SB202501150001", billNo: 
    "IN202501150001", lineNo: 1 },
    createdAt: "2025-01-15T10:00:00.000Z",
    createdBy: "user_staff_001"
  }
  ```
  - 更新 stockItems 与 stockBills.totals 同步差额
  ```
  // 明细变更
  { id: "SI202501150001_1", quantity: 60, amount: 150.0, 
  updatedAt: "2025-01-15T10:00:00.000Z" }
  // 头部汇总
  { id: "SB202501150001", totals: { totalQuantity: 90, 
  totalAmount: 210.0 }, updatedAt: "2025-01-15T10:00:00.
  000Z" }
  ```
  - 更新 statsMonthly ： inboundAmount += 25.0 （同月单据数不变）
  以上示例覆盖了入库从草稿到生效的完整数据链条，字段均为驼峰并带注释；加权平均法用于成本与结存维护，支持单据修改的差额回滚/重放，统计模块通过 statsMonthly 提供快速读取，盘点模块通过 inventoryBalances 提供当前结存与成本。



# 出库流程

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

# 修改入库单

## 概述 

已入账后的修改方式

- 差额调整（推荐，审计友好）
  
  - 适用：修改数量/单价/增删行；保留原单据不变更历史，仅补记差额
  - 步骤
    - 计算差额： deltaQty 、 deltaAmount （入库金额）；逐行生成差额记录
    - 写入差额台账： stockLedger 新增 direction='in' 的差额流水； billRef.lineNo 可加后缀如 1a
    - 更新结存： inventoryBalances 使用加权平均公式更新 quantity/avgCost/totalCost
    - 更新头部与明细：同步 stockBills.totals 与对应 stockItems 新值
    - 更新统计： statsMonthly.inboundAmount += deltaAmount
  - 示例（将行1数量 50→60，单价 2.5 不变）
    ```
    // 差额台账
    {
      id: "SL_202501150001_1a",
      shopId: "shop_001",
      productId: "prod_001",
      productName: "可口可乐",
      direction: "in",
      quantity: 10,
      unitPrice: 2.5,
      amount: 25.0,
      balanceQuantity: 110,               // 更新后结
      存
      balanceAmount: 250.0,
      billRef: { billId: "SB202501150001", billNo: 
      "IN202501150001", lineNo: 1 },
      createdAt: "2025-01-15T10:00:00.000Z",
      createdBy: "user_staff_001"
    }
    // 结存
    { id: "IB_prod_001", quantity: 110, avgCost: 2.
    2727, totalCost: 250.0, updatedAt: "..." }
    // 明细与头部
    { id: "SI202501150001_1", quantity: 60, amount: 
    150.0, updatedAt: "..." }
    { id: "SB202501150001", totals: { totalQuantity: 
    90, totalAmount: 210.0 }, updatedAt: "..." }
    // 统计
    { id: "SM_2025_01_shop_001", inboundAmount: 185.
    0 + 25.0, generatedAt: "..." }
    ```
- 作废与冲销（整单回滚）
  
  - 适用：整单错误，需要完全撤回；保留审计痕迹
  - 步骤
    - 标记作废： stockBills.status='confirmed' → 'void' ，记录 remarks='void reason'
    - 冲销台账：对每条入库流水生成反向差额（负数量方法不推荐），采用一条或多条“冲销”流水（可以记录 ext.adjustReason:'void' ）
    - 更新结存：按差额减少库存并回滚加权平均（用反向加权： newQty=oldQty - qty ; avgCost 回到历史值，或按补差法保持加权一致）
    - 更新统计： statsMonthly.inboundAmount -= 原入库金额 ，如当月
  - 示例（单据总量 80、总额 185.0 全部冲销）
    ```
    // 冲销流水（示例合并为单条差额，实际建议按明细逐条记录）
    {
      id: "SL_202501150001_void",
      shopId: "shop_001",
      productId: "prod_001",
      productName: "可口可乐",
      direction: "in",
      quantity: -50,
      unitPrice: 2.5,
      amount: -125.0,
      billRef: { billId: "SB202501150001", billNo: 
      "IN202501150001", lineNo: 1 },
      createdAt: "2025-01-15T10:30:00.000Z",
      createdBy: "user_owner_001",
      ext: { adjustReason: "void" }
    }
    // 头部
    { id: "SB202501150001", status: "void", remarks: 
    "误录入，已作废", updatedAt: "..." }
    // 统计
    { id: "SM_2025_01_shop_001", inboundAmount: 185.
    0 - 185.0, generatedAt: "..." }
    ```
- 采购退货（业务性回退，不直接改原入库）
  
  - 适用：与供应商发生退货；应产生业务出库对供应商
  - 步骤
    - 新建出库单： stockBills.direction='out' ， counterparty.supplierId/supplierName
    - 写台账与结存：减少库存；成本按当前 avgCost （也可按原入库价，视财务政策）
    - 统计影响： outboundAmount 增加（若视为负采购则也可单独计入采购退货统计）
  - 示例
    ```
    { id: "SB202501170001", direction: "out", 
    billType: "采购退货", counterparty: { 
    supplierId:"sup_001", supplierName:"广州科技
    " }, ... }
    ```
- 单价变更（不变数量）
  
  - 适用：价格入账错误，需要调整成本但不影响库存数量
  - 步骤（推荐“成本补差”）
    - 计算差额： deltaAmount = quantity × (newPrice - oldPrice)
    - 台账补差： stockLedger 记录 quantity:0, unitPrice:newPrice, amount:deltaAmount （仅金额补差）
    - 结存更新： inventoryBalances.totalCost += deltaAmount ， avgCost = totalCost / quantity
    - 统计更新： statsMonthly.inboundAmount += deltaAmount
  - 示例
    ```
    {
      id: "SL_202501150001_costAdj",
      shopId: "shop_001",
      productId: "prod_001",
      productName: "可口可乐",
      direction: "in",
      quantity: 0,
      unitPrice: 2.6,
      amount: +5.0,                        // 成本补差
      billRef: { billId: "SB202501150001", billNo: 
      "IN202501150001", lineNo: 1 },
      createdAt: "2025-01-15T12:00:00.000Z",
      createdBy: "user_owner_001",
      ext: { adjustReason: "price correction" }
    }
    { id: "IB_prod_001", totalCost: 250.0 + 5.0, 
    avgCost: (255.0 / 110), updatedAt: "..." }
    ```
    影响面与联动

- 成本与结存：统一由 inventoryBalances 管理；入库改动用加权平均调整，出库按当前 avgCost 计成本
- 台账： stockLedger 作为唯一流水审计源；所有修改建议“补记差额”而非直接覆盖原流水
- 汇总统计： statsMonthly 增量更新当前月份的入库金额与单据数，出库影响利润在出库侧累计
- 审批与权限：若 shops.staffPermissions.adminApproval=true ，员工改动需审批；Owner不受限
建议与约束

- 业务策略
  - 未入账允许覆盖；已入账后仅允许差额与冲销两种方式
  - 价格更正使用“成本补差”而不改库存数量
  - 明确是否允许负数量台账；如不允许，用独立“冲销/退货”单据替代
- 技术保障
  - 所有修改在云函数中用事务更新： stockItems → stockBills.totals → stockLedger → inventoryBalances → statsMonthly
  - 明细冗余 stockBefore/stockAfter 作为变更前后数量快照，辅助审计与回滚
- 审计可读性
  - 使用 ext.adjustReason 、差额后缀行号（如 1a ）与操作人 createdBy 保证追溯链完整
  这样你可以在入库已生效的前提下，既保持库存与成本正确，又保证审计与统计一致，并把复杂度控制在“差额补记 + 统一台账”的合理范围。

## 废除重做法

方案概览

- 采用整单覆盖重算：删旧流水→回滚旧影响→写新明细→重算结存/台账→更新统计
- 涉及集合与字段： stockBills 、 stockItems 、 inventoryBalances 、 stockLedger 、 statsMonthly
场景设定

- 店铺 shopId=shop_001
- 原入库单 stockBills.id=SB202503010001 ，两行明细，已确认/已审批
  - 行1： productId=prod_001 ， quantity=40 ， unitPrice=2.50 ， amount=100.00
  - 行2： productId=prod_002 ， quantity=30 ， unitPrice=1.80 ， amount=54.00
  - 汇总 totals.totalQuantity=70 ， totals.totalAmount=154.00
- 修改目标（覆盖重算）
  - 行1改为： quantity=50 （单价不变 2.50，金额 125.00）
  - 行2改为： unitPrice=2.00 （数量不变 30，金额 60.00）
  - 新汇总： totals.totalQuantity=80 ， totals.totalAmount=185.00
  修改前状态（关键结存）

- inventoryBalances(prod_001) ： quantity=100 ， avgCost=2.20 ， totalCost=220.00
- inventoryBalances(prod_002) ： quantity=80 ， avgCost=1.90 ， totalCost=152.00
- statsMonthly(2025-03) ： inboundAmount 已包含 154.00（该单入库额）
事务步骤与每步示例数据

- 读取旧单据与明细
  
  - stockBills 按 id=SB202503010001
  - stockItems 按 billId=SB202503010001
- 删除旧台账流水（只按该单）
  
  - stockLedger 删除条件 billRef.billId=SB202503010001
  - 示例删除目标：
    - id=SL_202503010001_1 （prod_001，quantity=40，unitPrice=2.50）
    - id=SL_202503010001_2 （prod_002，quantity=30，unitPrice=1.80）
- 回滚旧影响到结存（替换法第一步：减旧值）
  
  - 公式： TC = quantity × avgCost ；回滚后 TC1 = TC − q0 × p0 ， Q1 = Q − q0 ， avg1 = Q1 ? TC1/Q1 : 0
  - prod_001（减 40 × 2.50 = 100.00）
    - 旧： Q=100 ， avg=2.20 → TC=220.00
    - 回滚： TC1=220.00−100.00=120.00 ， Q1=100−40=60 → avg1=120.00/60=2.00
    - 更新 inventoryBalances(prod_001) ：
      - quantity=60 ， avgCost=2.00 ， totalCost=120.00 ， updatedAt=... ， updatedBy=system
  - prod_002（减 30 × 1.80 = 54.00）
    - 旧： Q=80 ， avg=1.90 → TC=152.00
    - 回滚： TC1=152.00−54.00=98.00 ， Q1=80−30=50 → avg1=98.00/50=1.96
    - 更新 inventoryBalances(prod_002) ：
      - quantity=50 ， avgCost=1.96 ， totalCost=98.00 ， updatedAt=... ， updatedBy=system
- 更新月度统计（先减旧汇总）
  
  - statsMonthly(shop_001, 2025-03) ：
    - inboundAmount = inboundAmount − 154.00
    - inboundCount 不变（整单覆盖，仍是一张单）
- 覆盖明细与单据头（写新值）
  
  - stockItems(billId=SB202503010001) ：
    - 行1： quantity=50 ， unitPrice=2.50 ， amount=125.00
      - stockBefore=60 （来自当前结存）→ stockAfter=60+50=110
    - 行2： quantity=30 ， unitPrice=2.00 ， amount=60.00
      - stockBefore=50 → stockAfter=50+30=80
    - 其他字段保持驼峰： productId/productName/productCode/unit/specification/createdAt/updatedAt/createdBy
  - stockBills(id=SB202503010001) ：
    - totals.totalQuantity=80 ， totals.totalAmount=185.00
    - status='confirmed' ， approvalStatus='approved' （若启用审批）
    - updatedAt=...
- 写新台账流水（替换法第二步：加新值）
  
  - prod_001（加 50 × 2.50 = 125.00）
    - 回滚后状态： Q1=60 ， TC1=120.00
    - 加新： TC2=120.00+125.00=245.00 ， Q2=60+50=110 → avgNew=245.00/110≈2.2273
    - inventoryBalances(prod_001) 更新：
      - quantity=110 ， avgCost≈2.2273 ， totalCost=245.00 ， updatedAt=...
    - 新 stockLedger ：
      - id=SL_202503010001_1_new ， direction='in'
      - quantity=50 ， unitPrice=2.50 ， amount=125.00
      - balanceQuantity=110 ， balanceAmount=245.00
      - billRef={ billId:SB202503010001, billNo:IN202503010001, lineNo:1 }
  - prod_002（加 30 × 2.00 = 60.00）
    - 回滚后状态： Q1=50 ， TC1=98.00
    - 加新： TC2=98.00+60.00=158.00 ， Q2=50+30=80 → avgNew=158.00/80=1.975
    - inventoryBalances(prod_002) 更新：
      - quantity=80 ， avgCost=1.975 ， totalCost=158.00 ， updatedAt=...
    - 新 stockLedger ：
      - id=SL_202503010001_2_new ， direction='in'
      - quantity=30 ， unitPrice=2.00 ， amount=60.00
      - balanceQuantity=80 ， balanceAmount=158.00
      - billRef={ billId:SB202503010001, billNo:IN202503010001, lineNo:2 }
- 更新月度统计（再加新汇总）
  
  - statsMonthly(shop_001, 2025-03) ：
    - inboundAmount = (减完旧值后) + 185.00
    - generatedAt=... ， source='onConfirm'
    最终各集合关键字段变更汇总

- stockBills(id=SB202503010001) ：
  - 旧： totals.totalQuantity=70 ， totals.totalAmount=154.00
  - 新： totals.totalQuantity=80 ， totals.totalAmount=185.00 ， updatedAt=...
- stockItems(billId=SB202503010001) ：
  - 行1： quantity=50 ， unitPrice=2.50 ， amount=125.00 ， stockBefore=60 ， stockAfter=110
  - 行2： quantity=30 ， unitPrice=2.00 ， amount=60.00 ， stockBefore=50 ， stockAfter=80
- inventoryBalances(prod_001) ：
  - 旧： quantity=100 ， avgCost=2.20 ， totalCost=220.00
  - 回滚： quantity=60 ， avgCost=2.00 ， totalCost=120.00
  - 新增后： quantity=110 ， avgCost≈2.2273 ， totalCost=245.00
- inventoryBalances(prod_002) ：
  - 旧： quantity=80 ， avgCost=1.90 ， totalCost=152.00
  - 回滚： quantity=50 ， avgCost=1.96 ， totalCost=98.00
  - 新增后： quantity=80 ， avgCost=1.975 ， totalCost=158.00
- stockLedger ：
  - 删除旧两条，新增两条：
    - prod_001 ： quantity=50 ， unitPrice=2.50 ， amount=125.00 ， balanceQuantity=110 ， balanceAmount=245.00
    - prod_002 ： quantity=30 ， unitPrice=2.00 ， amount=60.00 ， balanceQuantity=80 ， balanceAmount=158.00
- statsMonthly(shop_001, 2025-03) ：
  - inboundAmount ：先减 154.00 ，后加 185.00 （ inboundCount 不变）
  实现要点

- 事务顺序：
  - 锁定单据与涉及产品 → 删除旧 stockLedger → 回滚 inventoryBalances → 更新 statsMonthly （减旧） → 覆盖写 stockItems/stockBills → 写新 stockLedger → 重算并更新 inventoryBalances → 更新 statsMonthly （加新） → 提交事务
- 边界控制：
  - 回滚后 inventoryBalances.quantity 不得为负；若为负，拒绝修改并提示库存异常
- 索引与性能：
  - 使用 shopId + billId/billNo 、 shopId + productId 、 shopId + year + month 索引保障查询与更新效率
  这套“整单覆盖重算”路径最简单直观，统计准确，且不引入差额流水审计复杂度

=====问题======

给出入库单的更新的流程以及涉及到需要修改的集合，给出demo数据
给出出库单的更新的流程以及涉及到需要修改的集合，给出demo数据

stockItems（出入库明细表）
stockBefore操作前库存（冗余）stockAfter操作后库存（冗余）这两个冗余字段设计意图是什么，在哪里有使用到

stockLedger（库存台账）
 "balanceQuantity":本次后结存数量，  "balanceAmount": 本次后结存金额（可选加权平均）
这两个字段的设计意图是什么，以及计算方法？ 

出库成本与结存（inventoryBalances）
为什么需要记录totalCost字段？ 

商品	数量	均价	售价	销售额	成本	净利润		
可乐	20	2.2727	3	60	45.454	14.546		
雪碧	10	1.92	2.5	25	19.2	5.8		20.346

