# Lightning Start 快速启动器

**Lightning Start** 是一个现代、可扩展的效率启动器，深受 Rubick 和 uTools 的启发。它基于 Electron 和 Vue 3 构建，旨在提供快速、美观且高度可定制的体验。

---

## 🚀 启动应用

开发模式启动：
```bash
npm run dev
```

生产环境构建：
```bash
npm run build
npm run dist
```

---

## 🎮 使用说明

### 默认快捷键
- `Alt+Space` - 打开/关闭启动器
- `↑/↓` - 上下选择结果
- `Enter` - 执行选中的项目
- `Esc` - 隐藏窗口

### 核心功能
*   **应用搜索**: 秒级搜索本地已安装的应用，支持中文拼音。
*   **系统命令**: 快速执行关机、重启、锁屏等系统操作。
*   **计算器**: 直接在搜索框进行数学计算。
*   **剪贴板历史**: 记录并快速粘贴历史剪贴板内容。
*   **插件扩展**: 支持安装第三方插件以扩展功能。

---

## 📁 项目结构

```
Lightning Start
├── src/
│   ├── main/           # 主进程 (Electron Backend)
│   │   ├── services/   # 核心服务 (搜索, 插件, 数据库等)
│   │   ├── ipc/        # IPC 通信处理
│   │   └── plugins/    # 内置核心插件
│   ├── renderer/       # 渲染进程 (Vue 3 Frontend)
│   │   ├── components/ # UI 组件
│   │   ├── views/      # 页面视图 (搜索框, 设置页)
│   │   └── styles/     # 全局样式与变量
│   ├── preload/        # 预加载脚本 (安全桥接)
│   └── shared/         # 前后端共享类型定义
├── docs/               # 项目文档
├── dist/               # 构建输出目录
└── package.json
```

---

## 📚 开发文档

本项目包含详细的开发与架构文档，位于 `docs/` 目录下：

*   **[插件开发指南](docs/PLUGIN_DEVELOPMENT.md)**: 了解如何为 Lightning Start 开发插件。
*   **[架构概览](ARCHITECTURE.md)**: 项目整体架构设计说明。
*   **[技术总结](docs/TECHNICAL_SUMMARY.md)**: 技术栈与核心实现细节。
*   **[数据库设计](docs/DATABASE_DESIGN.md)**: 本地数据库结构说明。

---

## 👥 贡献者

特别感谢以下贡献者对本项目的支持：

*   **困困**

## ❤️ 致谢

本项目构建于以下优秀的开源技术之上：

*   **Electron**: 跨平台桌面应用开发框架
*   **Vue 3**: 渐进式 JavaScript 框架
*   **Vite**: 下一代前端构建工具
*   **pinyin-pro**: 专业的 JS 汉字拼音转换库 (实现拼音搜索)
*   **electron-store**: 简单的数据持久化存储方案

---

## 💡 提示

1. **首次运行**: 应用索引需要一些时间，请耐心等待。
2. **图标提取**: 图标会在后台异步提取，不会阻塞搜索。
3. **日志**: 开发模式下可查看控制台了解应用运行状态。
