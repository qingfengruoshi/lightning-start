# 🗄️ 数据库集成方案设计

随着插件生态和功能的扩展，单纯依赖 `electron-store` (KV JSON) 已经难以满足复杂的数据存储需求。我们需要引入更强大的数据库方案。

## 1. 需求分析 (Requirements)
我们需要存储：
*   **插件数据**：每个插件的独立配置、持久化数据 (Lite)。
*   **应用状态**：剪贴板历史 (大量文本/图片)、使用频率统计 (Relational)、超级面板配置。
*   **性能要求**：快速读写(影响启动速度)，支持一定量的并发(插件同时写入)。
*   **兼容性**：必须对 Electron 打包友好 (Native Modules 往往是痛点)。

## 2. 候选方案 (Candidates)

### 方案 A: LowDB (JSON Database)
*   **特点**：纯 JavaScript 实现，基于 Lodash，数据存储在本地 JSON 文件中。
*   **优点**：
    *   零依赖 (No Native Modules)，打包 100% 成功。
    *   API 简单，适合前端开发者。
    *   轻量级。
*   **缺点**：
    *   性能随数据量增大而下降（每次读写可能涉及全文件解析）。
    *   不适合存储二进制或大量数据（如剪贴板图片）。
*   **适用场景**：插件配置、简单的列表数据。

### 方案 B: SQLite (via `better-sqlite3` or `sqlite3`)
*   **特点**：工业级关系型数据库，无需多言。
*   **优点**：
    *   性能极强，支持复杂查询 (SQL)。
    *   数据完整性高 (ACID)。
    *   生态成熟 (TypeORM, Prisma)。
*   **缺点**：
    *   **Native Module**：需要编译 C++ 扩展，Electron 升级/打包时容易出现 ABI Mismatch 问题，需要额外配置 `electron-rebuild`。
*   **适用场景**：剪贴板历史、复杂的搜索索引。

### 方案 C: PouchDB / RxDB (NoSQL)
*   **特点**：CouchDB 的 JS 实现，支持同步。
*   **优点**：
    *   支持浏览器环境和 Node 环境。
    *   天生支持数据同步 (Sync)。
*   **缺点**：
    *   查询语法相对特殊 (MapReduce)。
    *   文件体积较大。

### 方案 D: NeDB (MongoDB for Logal)
*   **特点**：API 类似 MongoDB 的纯 JS 数据库。
*   **优点**：
    *   纯 JS，无编译痛点。
    *   支持索引，比 LowDB 快。
*   **缺点**：
    *   原作者已不再维护 (There are forks like `@seald/nedb`).

## 3. 推荐与决策流程

考虑到 Lightning Start 目前仍追求**轻量**和**易维护性**，且主要痛点在于“插件数据隔离”和“剪贴板历史”。

**推荐路线：**

1.  **第一阶段 (LowDB / Adapter)**：
    *   引入 `lowdb` 或自行封装一个基于文件系统的 `PluginDataManager`。
    *   为每个插件分配独立的 `plugins/<id>/data.json`。
    *   保持核心轻量。

2.  **第二阶段 (SQLite)**：
    *   如果确实需要存储大量剪贴板记录（如图片 Blob）或全文索引，再引入 `better-sqlite3`。

## 4. 你的决定？

请选择你倾向的方向，或者直接告诉我你的具体业务场景（比如：是不是想存剪贴板历史？），我会为你落地代码。
