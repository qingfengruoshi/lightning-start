# 🗄️ 数据库层实现计划 (Lite)

为了快速落地并保持架构轻量，我们将基于 `electron-store` 实现一个**文档型数据库封装**。

## 1. 核心设计
*   **存储引擎**：`electron-store` (JSON File System)
*   **隔离策略**：每个插件拥有独立的数据文件 (`userData/plugin-data/<plugin-id>.json`)。
*   **数据模型**：NoSQL 风格 (Key-Value 或 Document)。

## 2. API 设计 (面向插件)

我们将向插件的 `index.js` 注入一个 `db` 对象 (类似于 MongoDB 或 LocalStorage 的混合体)。

```typescript
interface PluginDatabase {
  // 基础 KV
  get(key: string, defaultValue?: any): any;
  set(key: string, value: any): void;
  delete(key: string): void;
  has(key: string): boolean;
  
  // 集合操作 (模拟 MongoDB) - 可选，视需求而定
  // collection(name: string): Collection;
}
```

## 3. 实现细节

### Backend (`src/main/services/database.ts`)

```typescript
import Store from 'electron-store';

export class PluginDataService {
  private stores: Map<string, Store> = new Map();

  // 获取指定插件的数据库实例
  getStore(pluginId: string): Store {
    if (!this.stores.has(pluginId)) {
      const store = new Store({ 
        name: `plugin-data/${pluginId}`, // 存储在 plugin-data 子目录下
        fileExtension: 'json'
      });
      this.stores.set(pluginId, store);
    }
    return this.stores.get(pluginId)!;
  }
}
```

### Plugin Loader 集成 (`src/main/services/plugin-loader.ts`)

在加载插件时，实例化 `db` 并注入：

```typescript
const dbAdapter = {
    get: (k, d) => store.get(k, d),
    set: (k, v) => store.set(k, v),
    // ...
};

const pluginContext = {
    db: dbAdapter,
    // ... other APIs
};
```

## 4. 优势
1.  **零新依赖**：复用已有的 `electron-store`。
2.  **物理隔离**：插件 A 无法读取 `plugin-data/plugin-b.json` (除非恶意遍历路径，但 API 层做了限制)。
3.  **用户友好**：用户可以直接打开 JSON 修改配置。
