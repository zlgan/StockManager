
## AI IDE(TRAE)
1. https://docs.trae.ai/ide/what-is-trae?_lang=zh
### 智能体/LLM/MCP关系
```mermaid
sequenceDiagram
    actor 用户
    participant 智能体 as 智能体<br/>(Agent)
    participant LLM as LLM<br/>(大脑/推理引擎)
    participant MCP as MCP服务器<br/>(协议层)
    participant 工具 as 外部工具/数据源

    Note over 智能体,MCP: 初始化阶段
    智能体->>MCP: 发现/注册可用工具
    MCP-->>智能体: 工具列表与规范描述
    
    Note over 用户,工具: 任务执行阶段
    用户->>智能体: 提出复杂请求<br/>"规划杭州2日游"
    
    智能体->>LLM: 调用规划：任务分解与推理
    LLM-->>智能体: 规划步骤：<br/>1.查天气 2.查车票 3.找酒店
    
    loop 对每个规划步骤
        智能体->>MCP: 标准化请求<br/>(动作: "查询天气", 参数: "杭州")
        MCP->>工具: 执行具体工具调用<br/>(调用天气API)
        工具-->>MCP: 返回原始结果<br/>(温度、天气状况)
        MCP-->>智能体: 格式化响应<br/>(标准MCP格式)
        
        智能体->>智能体: 更新记忆/状态
    end
    
    智能体->>LLM: 调用整合：综合所有信息生成最终答案
    LLM-->>智能体: 生成结构化旅行计划
    
    智能体->>用户: 返回完整答案<br/>(包含天气、车票、酒店等)
    
    Note right of 智能体: 智能体协调整个流程<br/>- 任务规划<br/>- 状态管理<br/>- 迭代控制
    Note left of MCP: MCP作为中间层<br/>- 协议标准化<br/>- 安全控制<br/>- 工具抽象
```
## npx/uvx
> npx 的本质是一个智能的包执行调度器。它将“安装”和“运行”这两个动作无缝地结合在了一起，让你感觉工具是“召之即来，挥之即去”的。它通过临时缓存目录和隔离的执行环境，从根本上避免了全局安装带来的污染、冲突和安全问题，极大地改善了开发者的工作流
- npx：依赖于 Node.js，版本需大于等于 18。 
- uvx：命令行工具，用于快速运行 Python 脚本
1. 工作原理
```mermaid
graph TD
    A[用户执行: npx some-tool] --> B[npx 开始工作]
    B --> C{检查本地/全局安装}
    C -- 已找到 --> D[直接运行该工具]
    C -- 未找到 --> E[临时下载该工具]
    E --> F[在缓存目录安装并运行]
    F --> G[运行结束]
    G --> H[删除临时文件]
    D --> I[结束]
    H --> I
```