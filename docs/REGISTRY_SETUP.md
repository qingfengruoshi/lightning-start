# 🏗️ 插件市场仓库搭建指南

为了让其他人能够发布插件，我们需要建立一个公共的“插件仓库”(Registry)。
目前的实现可以直接使用一个 **GitHub Repository** 来作为静态数据库。

## 1. 创建仓库

**推荐方案：使用 GitHub Organization (组织)**
如果你希望建立一个官方、专业的插件社区，建议创建一个 **Organization**（例如命名为 `lightning-start-community`），而不是使用个人账号。
*   **个人仓库**：`github.com/YourName/registry` (适合个人开发者)
*   **组织仓库**：`github.com/ProjectName/registry` (适合社区维护，显得更官方，支持多人管理)

1.  在 GitHub 上创建一个新仓库，例如命名为 `registry` 或 `plugins`.
2.  确保它是 **Public (公开)** 的。

## 2. 仓库结构

仓库中只需要维护一个核心文件：`plugins.json`。

```
registry/
├── plugins.json       # [核心] 插件列表数据库
└── README.md          # [推荐] 贡献指南
```

## 3. plugins.json 格式

`plugins.json` 是一个 JSON 数组，包含了所有上架插件的信息。

```json
[
  {
    "id": "demo-plugin",
    "name": "示例插件",
    "description": "这是一个测试插件",
    "version": "1.0.0",
    "author": "Only",
    "repo": "https://github.com/yourname/demo-plugin",
    "downloadUrl": "https://github.com/yourname/demo-plugin/releases/download/v1.0.0/plugin.zip",
    "icon": "https://raw.githubusercontent.com/yourname/demo-plugin/main/icon.png"
  },
  {
    "id": "another-plugin",
    ...
  }
]
```

## 4. 接受投稿流程 (Pull Request)

当开发者想要发布插件时：

1.  开发者 Fork 你的 `registry` 仓库。
2.  开发者编辑 `plugins.json`，在数组末尾追加他们的插件信息。
3.  开发者提交 Pull Request (PR)。
4.  **你 (维护者)**：
    *   检查 PR 内容（GitHub 会显示绿色高亮的新增行）。
    *   **不用担心覆盖**：PR 只是“请求修改”。GitHub 会自动将对方**新增**的那个插件 `{...}` 块 **合并 (Merge)** 进你的列表，而**不会覆盖**掉你原有的其他插件数据。
    *   确认 `downloadUrl` 有效且安全。
    *   Merge PR。
5.  Lightning Start 客户端会自动获取最新的 JSON，用户即可看到新插件。

## 5. 配置客户端连接

目前客户端硬编码连接到了：
`https://raw.githubusercontent.com/lightning-start/registry/main/plugins.json`

如果你创建了自己的仓库，你需要修改客户端代码 (`src/main/services/plugin-market.ts`) 中的 `registryUrl` 指向你的仓库的 Raw JSON 地址。

例如：
`https://raw.githubusercontent.com/<你的用户名>/registry/main/plugins.json`
