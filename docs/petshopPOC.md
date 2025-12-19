# petshop
## 技术选型
### 前端方案
#### Flutter
前后端分离
Flutter前端 (各平台) → REST/GraphQL API → 后端服务层 → MongoDB集群
前端UI层: Flutter (Dart)
- ✅ 真正跨平台：一套代码生成iOS/Android App、Windows桌面端、Web版
- ✅ 性能接近原生，支持复杂交互
- ✅ 丰富的组件库和成熟的生态
- ✅ 热重载提高开发效率

部署方案:
  - 移动端: Flutter编译原生应用
  - 桌面端: Flutter Desktop (Windows/macOS)
  - Web版: Flutter Web + PWA

  Flutter框架: 
  - Flutter 3.19+ (支持最新桌面端)
  - 状态管理: Riverpod 2.0 (推荐) 或 BloC
  - UI组件库: 
    * 基础: Flutter原生组件
    * 增强: fluent_ui (Windows风格) 或 material_you
    * 图表: fl_chart
    * 表格: syncfusion_flutter_datagrid (商业) 或 pluto_grid (开源)

#### React
- React Native(App) 
- React Native Web (App & H5)
- Tauri (桌面)
### 后端方案
推荐方案A: Go + Gin (高性能，适合宠物医院场景)
  - Web框架: Gin
  - MongoDB驱动: mongo-go-driver
  - 认证: JWT + RBAC
  - API文档: Swagger/OpenAPI
  - 部署: Docker + Kubernetes(可选)

推荐方案B: Node.js + NestJS (全栈JavaScript)
  - 框架: NestJS (TypeScript)
  - ORM: Mongoose
  - 认证: Passport.js
  - 实时通信: Socket.io
### 通讯方案
- REST
- GraphQL
- WebSocket ：https://copilot.microsoft.com/chats/EFzASEze2fFdy4zbGYPuZ

##


## 知识图谱

```mermaid
graph BT
    %% 金字塔结构：底层到上层
    L4["应用层: NestJS应用<br/>包含整个技术栈 + 业务代码"]
    
    L3["框架层: NestJS框架<br/>包含: TypeScript支持、依赖注入、模块系统"]
    
    L2["HTTP层: Express.js<br/>包含: HTTP服务器、路由、中间件"]
    
    L1["运行时: Node.js<br/>包含: V8引擎、事件循环、API库"]
    
    L0["引擎层: V8<br/>JavaScript执行引擎"]
    
    %% 包含关系：每层都包含下面的所有层
    L1 -->|包含| L0
    L2 -->|包含| L1
    L3 -->|包含| L2
    L4 -->|包含| L3
    
    %% 说明框
    Note["包含关系说明:<br/>上层组件包含并依赖下层所有组件<br/>NestJS应用包含整个技术栈"]
    
    classDef level0 fill:#f9f,stroke:#333
    classDef level1 fill:#ccf,stroke:#333
    classDef level2 fill:#cfc,stroke:#333
    classDef level3 fill:#fdd,stroke:#333
    classDef level4 fill:#faa,stroke:#333
    
    class L0 level0
    class L1 level1
    class L2 level2
    class L3 level3
    class L4 level4
```

```mermaid
graph TD
    subgraph "V8容器"
        V8["V8引擎"]
    end
    
    subgraph "Node.js容器[包含V8]"
        direction LR
        V8InNode[V8引擎]
        NodeAPI[Node.js API]
        EventLoop[事件循环]
        
        subgraph "Node.js容器"
            V8InNode
            NodeAPI
            EventLoop
        end
    end
    
    subgraph "Express容器[包含Node.js]"
        direction LR
        NodeInExpress[Node.js运行时]
        ExpressRouter[路由系统]
        ExpressMW[中间件]
        
        subgraph "Express容器"
            NodeInExpress
            ExpressRouter
            ExpressMW
        end
    end
    
    subgraph "NestJS容器[包含Express]"
        direction LR
        ExpressInNest[Express HTTP层]
        IoC[IoC容器]
        Modules[模块系统]
        
        subgraph "NestJS容器"
            ExpressInNest
            IoC
            Modules
        end
    end
    
    %% 显示包含关系
    V8 -->|被Node.js包含| V8InNode
    V8InNode -->|被Express包含| NodeInExpress
    NodeInExpress -->|被NestJS包含| ExpressInNest
```

