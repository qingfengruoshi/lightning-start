# 插件中心系统架构设计建议

目前项目的插件系统是基于硬编码（Built-in）的方式实现的。为了支持动态安装、社区开发和“插件中心”功能，建议采用以下架构进行重构和扩展。

## 1. 插件形态定义 (Plugin Standard)

建议采用类似 node_modules 的结构，每个插件是一个独立的文件夹。

### 目录结构
```
plugins/
  ├── com.example.translate/      # 插件ID（建议使用反向域名风格）
       ├── package.json           # 元数据定义
       ├── index.js               # 入口文件 (Main Process Logic)
       ├── index.html             # (可选) UI 界面 (Renderer View)
       └── icon.png               # 图标
```

### package.json 规范
扩展标准的 `package.json`，增加 `antigravity` 字段：

```json
{
  "name": "ag-plugin-translate",
  "version": "1.0.0",
  "main": "index.js",
  "antigravity": {
    "type": "search",             // 插件类型: search(搜索结果), app(独立界面), system(后台服务)
    "triggers": ["tr", "翻译"],    // 触发关键词
    "icon": "icon.png",
    "title": "快捷翻译",
    "description": "基于 Google 翻译的快捷插件"
  }
}
```

### 代码接口 (Interface)
外部插件应导出一个类或对象，符合当前 `Plugin` 接口，但需要增加生命周期钩子：

```javascript
// index.js
module.exports = {
  // 当用户输入触发 match 时调用
  search: async (query, { display }) => {
    // 异步获取数据
    const result = await fetchTranslation(query);
    
    // display 回调函数将结果渲染到主列表 (类似 Alfred Script Filter)
    display([
      {
        title: result.text,
        subtitle: `翻译自: ${result.source}`,
        action: 'copy', // 定义操作
        data: result.text
      }
    ]);
  },

  // (可选) 选中某项后的回调
  execute: async (item) => {
    // 处理点击事件，例如写入剪贴板
  }
}
```

---

## 2. 核心模块设计 (Core Modules)

需要在 Main Process 实现一个 `PermissionPluginLoader` (或 `DynamicPluginService`)。

### A. 插件加载器 (PluginLoader)
*   **路径管理**：监听 `app.getPath('userData')/plugins` 目录。
*   **动态加载**：使用 Node.js 的 `require` 动态加载外部 JS。
    *   *注意*：为了安全，建议包裹在 `vm2` 沙箱中，或者简单起见，仅允许访问特定的 API (通过构造函数注入 API 实例)。
*   **热重载**：监听文件夹变化，自动卸载并重新 `require` 插件。

### B. 插件中心 (Marketplace Backend)
*   **源 (Registry)**：维护一个远端 JSON 文件（如托管在 GitHub/Gitee Pages）。
    *   格式：`[{ id, version, downloadUrl, ... }]`
*   **安装流程**：
    1.  用户点击“安装”。
    2.  主进程下载 ZIP 包到临时目录。
    3.  校验完整性。
    4.  解压至 `plugins/` 目录。
    5.  触发 Loader 重载。

---

## 3. UI 交互设计 (Front-end)

### 已安装 (Installed)
*   复用现有列表，但数据源改为从 `PluginLoader` 获取的动态列表。
*   增加“卸载”、“重载”、“设置”按钮。
*   “设置”按钮：如果插件定义了配置项（schema），前端自动生成表单（Schema Form）。

### 插件市场 (Market)
*   **布局**：卡片网格布局，展示图标、名称、下载量、简介。
*   **搜索**：过滤远端 JSON 数据。
*   **状态**：根据本地是否已存在同名 ID，显示“安装”、“更新”或“已安装”。

### 本地开发 (Dev Mode)
*   提供“加载本地插件”按钮，允许开发者选择任意文件夹作为插件载入（创建软链接或直接路径引用的方式）。
*   提供“控制台”或日志查看器，方便调试插件报错。

---

## 4. 推荐实施路线图 (Roadmap)

1.  **Phase 1: 基础动态加载**
    *   在 `SearchService` 旁实现 `loadExternalPlugins()`。
    *   实现简单的 `package.json` 解析逻辑。
    *   手动放入一个 Demo 插件文件夹进行测试。

2.  **Phase 2: 插件市场 UI**
    *   在 `PluginManager.vue` 中实现 Market Tab 的网络请求（fetch JSON）。
    *   实现 IPC `plugin:install` (下载+解压)。

3.  **Phase 3: 安全与隔离 (高级)**
    *   引入沙箱机制，限制插件对 `fs`、`child_process` 的任意访问，只暴露封装好的 `AntigravityAPI`。
