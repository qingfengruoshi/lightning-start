# Rubick 架构设计文档

## 项目概述

基于 Electron + Vue 的跨平台快速启动器应用，类似 macOS 的 Spotlight 或 Windows 的 PowerToys Run。

## 技术栈

- **框架**: Electron (主进程 + 渲染进程)
- **前端**: Vue 3 + TypeScript
- **构建**: Vite / Webpack
- **UI**: 自定义组件 + CSS
- **数据持久化**: electron-store
- **全局快捷键**: electron

---

## 目录结构

```
antigravity/
├── src/
│   ├── main/                    # 主进程代码
│   │   ├── index.ts            # 主进程入口
│   │   ├── window.ts           # 窗口管理
│   │   ├── ipc/                # IPC 通信处理
│   │   │   ├── handlers.ts     # IPC 处理器
│   │   │   └── events.ts       # 事件定义
│   │   ├── services/           # 核心服务
│   │   │   ├── search.ts       # 搜索服务
│   │   │   ├── hotkey.ts       # 全局快捷键
│   │   │   ├── icon-extractor.ts  # 图标提取
│   │   │   ├── app-indexer.ts  # 应用索引
│   │   │   └── plugin-manager.ts  # 插件管理
│   │   ├── plugins/            # 内置插件
│   │   │   ├── app-search/     # 应用搜索插件
│   │   │   ├── file-search/    # 文件搜索插件
│   │   │   ├── calculator/     # 计算器插件
│   │   │   └── system/         # 系统命令插件
│   │   └── utils/              # 工具函数
│   │       ├── logger.ts       # 日志
│   │       └── config.ts       # 配置管理
│   │
│   ├── renderer/               # 渲染进程代码
│   │   ├── index.html          # HTML 入口
│   │   ├── main.ts             # Vue 应用入口
│   │   ├── App.vue             # 根组件
│   │   ├── components/         # UI 组件
│   │   │   ├── SearchBar.vue   # 搜索框
│   │   │   ├── ResultList.vue  # 结果列表
│   │   │   ├── ResultItem.vue  # 结果项
│   │   │   ├── Settings.vue    # 设置面板
│   │   │   └── PluginCard.vue  # 插件卡片
│   │   ├── composables/        # 组合式函数
│   │   │   ├── useSearch.ts    # 搜索逻辑
│   │   │   ├── useKeyboard.ts  # 键盘导航
│   │   │   └── useTheme.ts     # 主题切换
│   │   ├── stores/             # 状态管理
│   │   │   ├── app.ts          # 应用状态
│   │   │   ├── search.ts       # 搜索状态
│   │   │   └── settings.ts     # 设置状态
│   │   ├── styles/             # 样式文件
│   │   │   ├── global.css      # 全局样式
│   │   │   ├── variables.css   # CSS 变量
│   │   │   └── themes/         # 主题样式
│   │   └── utils/              # 渲染进程工具
│   │       └── ipc.ts          # IPC 封装
│   │
│   ├── shared/                 # 共享代码
│   │   ├── types/              # TypeScript 类型定义
│   │   │   ├── plugin.ts       # 插件接口
│   │   │   ├── search.ts       # 搜索类型
│   │   │   └── settings.ts     # 设置类型
│   │   └── constants.ts        # 常量定义
│   │
│   └── preload/                # 预加载脚本
│       └── index.ts            # 预加载入口
│
├── assets/                     # 静态资源
│   ├── icons/                  # 应用图标
│   └── images/                 # 图片资源
│
├── dist/                       # 构建输出
├── release/                    # 打包输出
├── scripts/                    # 构建脚本
│   ├── dev.js                  # 开发脚本
│   └── build.js                # 构建脚本
│
├── .agent/                     # 工作流定义
│   └── workflows/
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── electron-builder.yml        # 打包配置
```

---

## 核心架构设计

### 1. 进程通信 (IPC)

#### 主进程 → 渲染进程
```typescript
// src/main/ipc/handlers.ts
import { ipcMain } from 'electron';

export function registerIpcHandlers(mainWindow: BrowserWindow) {
  // 搜索请求
  ipcMain.handle('search:query', async (event, query: string) => {
    const results = await searchService.search(query);
    return results;
  });

  // 打开应用
  ipcMain.handle('app:launch', async (event, appPath: string) => {
    await launchApp(appPath);
    mainWindow.hide();
  });

  // 获取设置
  ipcMain.handle('settings:get', async () => {
    return settingsStore.store;
  });

  // 更新设置
  ipcMain.handle('settings:set', async (event, key: string, value: any) => {
    settingsStore.set(key, value);
  });
}
```

#### 渲染进程调用
```typescript
// src/renderer/utils/ipc.ts
export const ipcRenderer = {
  search: (query: string) => 
    window.electron.invoke('search:query', query),
  
  launchApp: (appPath: string) => 
    window.electron.invoke('app:launch', appPath),
  
  getSettings: () => 
    window.electron.invoke('settings:get'),
  
  setSetting: (key: string, value: any) => 
    window.electron.invoke('settings:set', key, value),
};
```

### 2. 窗口管理

```typescript
// src/main/window.ts
import { BrowserWindow, screen } from 'electron';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;

  createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    
    this.mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      x: (width - 800) / 2,
      y: height * 0.2,
      frame: false,
      transparent: true,
      resizable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // 加载页面
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.loadURL('http://localhost:5173');
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // 窗口失去焦点时隐藏
    this.mainWindow.on('blur', () => {
      if (!this.isSettingsOpen) {
        this.hide();
      }
    });
  }

  show() {
    this.mainWindow?.show();
    this.mainWindow?.focus();
  }

  hide() {
    this.mainWindow?.hide();
  }

  toggle() {
    this.mainWindow?.isVisible() ? this.hide() : this.show();
  }
}
```

### 3. 全局快捷键

```typescript
// src/main/services/hotkey.ts
import { globalShortcut } from 'electron';

export class HotkeyService {
  private windowManager: WindowManager;
  private currentHotkey: string = 'Alt+Space';

  constructor(windowManager: WindowManager) {
    this.windowManager = windowManager;
  }

  register(hotkey: string) {
    // 注销旧的快捷键
    if (this.currentHotkey) {
      globalShortcut.unregister(this.currentHotkey);
    }

    // 注册新的快捷键
    const success = globalShortcut.register(hotkey, () => {
      this.windowManager.toggle();
    });

    if (success) {
      this.currentHotkey = hotkey;
      console.log(`Hotkey registered: ${hotkey}`);
    } else {
      console.error(`Failed to register hotkey: ${hotkey}`);
    }

    return success;
  }

  unregister() {
    if (this.currentHotkey) {
      globalShortcut.unregister(this.currentHotkey);
    }
  }
}
```

### 4. 搜索服务架构

```typescript
// src/main/services/search.ts
export interface SearchPlugin {
  name: string;
  priority: number;
  match(query: string): boolean;
  search(query: string): Promise<SearchResult[]>;
}

export class SearchService {
  private plugins: SearchPlugin[] = [];

  registerPlugin(plugin: SearchPlugin) {
    this.plugins.push(plugin);
    this.plugins.sort((a, b) => b.priority - a.priority);
  }

  async search(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    // 并行搜索所有匹配的插件
    const matchedPlugins = this.plugins.filter(p => p.match(query));
    const promises = matchedPlugins.map(p => p.search(query));
    const pluginResults = await Promise.all(promises);

    // 合并结果
    for (const result of pluginResults) {
      results.push(...result);
    }

    // 排序和去重
    return this.rankResults(results, query);
  }

  private rankResults(results: SearchResult[], query: string): SearchResult[] {
    return results
      .map(r => ({
        ...r,
        score: this.calculateScore(r, query),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // 限制结果数量
  }

  private calculateScore(result: SearchResult, query: string): number {
    let score = 0;
    const lowerQuery = query.toLowerCase();
    const lowerTitle = result.title.toLowerCase();

    // 完全匹配
    if (lowerTitle === lowerQuery) score += 100;
    // 前缀匹配
    else if (lowerTitle.startsWith(lowerQuery)) score += 50;
    // 包含匹配
    else if (lowerTitle.includes(lowerQuery)) score += 25;

    // 拼音匹配（如果有）
    if (result.pinyin?.includes(lowerQuery)) score += 30;

    // 使用频率
    score += (result.frequency || 0) * 10;

    return score;
  }
}
```

### 5. 应用索引器

```typescript
// src/main/services/app-indexer.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface AppInfo {
  name: string;
  path: string;
  icon: string;
  pinyin?: string;
  frequency: number;
}

export class AppIndexer {
  private apps: AppInfo[] = [];
  private indexing = false;

  async buildIndex(): Promise<void> {
    if (this.indexing) return;
    this.indexing = true;

    try {
      const apps: AppInfo[] = [];

      // 1. 扫描开始菜单
      const startMenuApps = await this.scanStartMenu();
      apps.push(...startMenuApps);

      // 2. 扫描 UWP 应用
      const uwpApps = await this.scanUWPApps();
      apps.push(...uwpApps);

      // 3. 扫描自定义路径
      const customApps = await this.scanCustomPaths();
      apps.push(...customApps);

      // 去重并保存
      this.apps = this.deduplicateApps(apps);
      
      console.log(`Indexed ${this.apps.length} applications`);
    } finally {
      this.indexing = false;
    }
  }

  private async scanStartMenu(): Promise<AppInfo[]> {
    const script = `
      Get-ChildItem "$env:ProgramData\\Microsoft\\Windows\\Start Menu\\Programs" -Recurse -Filter *.lnk |
      ForEach-Object {
        $shell = New-Object -ComObject WScript.Shell
        $shortcut = $shell.CreateShortcut($_.FullName)
        [PSCustomObject]@{
          Name = $_.BaseName
          Path = $shortcut.TargetPath
        }
      } | ConvertTo-Json
    `;

    const { stdout } = await execAsync(`powershell -Command "${script}"`);
    return JSON.parse(stdout || '[]');
  }

  private async scanUWPApps(): Promise<AppInfo[]> {
    const script = `
      Get-AppxPackage | ForEach-Object {
        [PSCustomObject]@{
          Name = $_.Name
          Path = $_.InstallLocation
        }
      } | ConvertTo-Json
    `;

    const { stdout } = await execAsync(`powershell -Command "${script}"`);
    return JSON.parse(stdout || '[]');
  }

  search(query: string): AppInfo[] {
    const lowerQuery = query.toLowerCase();
    return this.apps.filter(app =>
      app.name.toLowerCase().includes(lowerQuery) ||
      app.pinyin?.includes(lowerQuery)
    );
  }
}
```

### 6. 图标提取服务

```typescript
// src/main/services/icon-extractor.ts
import { nativeImage } from 'electron';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

export class IconExtractor {
  private iconCache = new Map<string, string>();
  private cacheDir: string;

  constructor(cacheDir: string) {
    this.cacheDir = cacheDir;
  }

  async extractIcon(exePath: string): Promise<string> {
    // 检查缓存
    if (this.iconCache.has(exePath)) {
      return this.iconCache.get(exePath)!;
    }

    try {
      // 使用 Electron 的 nativeImage 提取图标
      const icon = await app.getFileIcon(exePath, { size: 'large' });
      const iconPath = path.join(this.cacheDir, `${this.hashPath(exePath)}.png`);
      
      await fs.writeFile(iconPath, icon.toPNG());
      
      this.iconCache.set(exePath, iconPath);
      return iconPath;
    } catch (error) {
      console.error(`Failed to extract icon for ${exePath}:`, error);
      return ''; // 返回默认图标
    }
  }

  private hashPath(filePath: string): string {
    // 简单的哈希函数
    let hash = 0;
    for (let i = 0; i < filePath.length; i++) {
      hash = ((hash << 5) - hash) + filePath.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}
```

### 7. 插件系统

```typescript
// src/shared/types/plugin.ts
export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  action: () => void | Promise<void>;
  frequency?: number;
  pinyin?: string;
}

export interface Plugin {
  name: string;
  description: string;
  priority: number;
  icon?: string;
  
  // 是否匹配当前查询
  match(query: string): boolean;
  
  // 执行搜索
  search(query: string): Promise<SearchResult[]>;
  
  // 初始化插件
  onLoad?(): void | Promise<void>;
  
  // 卸载插件
  onUnload?(): void | Promise<void>;
}
```

#### 应用搜索插件示例

```typescript
// src/main/plugins/app-search/index.ts
export class AppSearchPlugin implements Plugin {
  name = 'app-search';
  description = '搜索已安装的应用程序';
  priority = 100;

  private appIndexer: AppIndexer;

  constructor(appIndexer: AppIndexer) {
    this.appIndexer = appIndexer;
  }

  match(query: string): boolean {
    // 总是匹配
    return query.length > 0;
  }

  async search(query: string): Promise<SearchResult[]> {
    const apps = this.appIndexer.search(query);
    
    return apps.map(app => ({
      id: `app:${app.path}`,
      title: app.name,
      subtitle: app.path,
      icon: app.icon,
      action: async () => {
        await this.launchApp(app.path);
      },
      frequency: app.frequency,
      pinyin: app.pinyin,
    }));
  }

  private async launchApp(appPath: string): Promise<void> {
    const { shell } = require('electron');
    await shell.openPath(appPath);
  }

  async onLoad() {
    await this.appIndexer.buildIndex();
  }
}
```

### 8. 前端组件架构

```vue
<!-- src/renderer/App.vue -->
<template>
  <div class="app" :class="{ 'settings-open': isSettingsOpen }">
    <SearchBar 
      v-model="searchQuery" 
      @clear="handleClear"
    />
    
    <ResultList 
      v-if="!isSettingsOpen"
      :results="searchResults"
      :selected-index="selectedIndex"
      @select="handleSelect"
    />
    
    <Settings 
      v-if="isSettingsOpen"
      @close="closeSettings"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useSearch } from './composables/useSearch';
import { useKeyboard } from './composables/useKeyboard';

const searchQuery = ref('');
const isSettingsOpen = ref(false);

const { searchResults, selectedIndex, search, selectNext, selectPrev } = useSearch();

// 监听搜索输入
watch(searchQuery, (query) => {
  search(query);
});

// 键盘导航
useKeyboard({
  onArrowDown: selectNext,
  onArrowUp: selectPrev,
  onEnter: () => handleSelect(selectedIndex.value),
  onEscape: handleClear,
});

function handleSelect(index: number) {
  const result = searchResults.value[index];
  result?.action();
}

function handleClear() {
  searchQuery.value = '';
  window.electron.send('window:hide');
}

function closeSettings() {
  isSettingsOpen.value = false;
}
</script>
```

```typescript
// src/renderer/composables/useSearch.ts
import { ref, computed } from 'vue';
import { ipcRenderer } from '../utils/ipc';

export function useSearch() {
  const searchQuery = ref('');
  const searchResults = ref<SearchResult[]>([]);
  const selectedIndex = ref(0);

  async function search(query: string) {
    searchQuery.value = query;
    selectedIndex.value = 0;

    if (!query) {
      searchResults.value = [];
      return;
    }

    const results = await ipcRenderer.search(query);
    searchResults.value = results;
  }

  function selectNext() {
    if (selectedIndex.value < searchResults.value.length - 1) {
      selectedIndex.value++;
    }
  }

  function selectPrev() {
    if (selectedIndex.value > 0) {
      selectedIndex.value--;
    }
  }

  return {
    searchQuery,
    searchResults,
    selectedIndex,
    search,
    selectNext,
    selectPrev,
  };
}
```

### 9. 预加载脚本（安全桥接）

```typescript
// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electron', {
  // 调用主进程方法
  invoke: (channel: string, ...args: any[]) => {
    return ipcRenderer.invoke(channel, ...args);
  },

  // 发送消息到主进程
  send: (channel: string, ...args: any[]) => {
    ipcRenderer.send(channel, ...args);
  },

  // 监听主进程消息
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (event, ...args) => callback(...args));
  },

  // 移除监听器
  removeListener: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },
});
```

---

## 性能优化策略

### 1. 应用索引优化
- **增量更新**: 只更新变化的应用，而不是每次重建整个索引
- **后台索引**: 在应用启动后延迟索引，避免阻塞启动
- **缓存**: 使用 LRU 缓存存储最近搜索的结果

### 2. 图标提取优化
- **异步提取**: 图标提取在后台队列中进行
- **懒加载**: 只提取可见结果的图标
- **本地缓存**: 缓存已提取的图标，避免重复提取

### 3. 搜索优化
- **防抖**: 输入时使用 300ms 防抖，减少搜索次数
- **模糊搜索**: 使用 Fuse.js 或自定义算法实现模糊匹配
- **结果限制**: 限制返回结果数量（10-20 条）

### 4. UI 优化
- **虚拟滚动**: 对长列表使用虚拟滚动
- **过渡动画**: 使用 CSS 动画而非 JS 动画
- **节流**: 对频繁触发的事件（如滚动）进行节流

---

## 数据持久化

```typescript
// src/main/utils/config.ts
import Store from 'electron-store';

interface Settings {
  hotkey: string;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  customPaths: string[];
  plugins: {
    [key: string]: {
      enabled: boolean;
      config: Record<string, any>;
    };
  };
}

export const settingsStore = new Store<Settings>({
  defaults: {
    hotkey: 'Alt+Space',
    theme: 'auto',
    language: 'zh-CN',
    customPaths: [],
    plugins: {},
  },
});

// 应用频率统计
interface AppFrequency {
  [appPath: string]: number;
}

export const frequencyStore = new Store<AppFrequency>({
  name: 'app-frequency',
  defaults: {},
});
```

---

## 主题系统

```css
/* src/renderer/styles/variables.css */
:root {
  /* 亮色主题 */
  --bg-primary: rgba(255, 255, 255, 0.95);
  --bg-secondary: rgba(248, 248, 248, 0.95);
  --bg-hover: rgba(0, 0, 0, 0.05);
  --text-primary: #333333;
  --text-secondary: #666666;
  --border-color: rgba(0, 0, 0, 0.1);
  --shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] {
  /* 暗色主题 */
  --bg-primary: rgba(30, 30, 30, 0.95);
  --bg-secondary: rgba(40, 40, 40, 0.95);
  --bg-hover: rgba(255, 255, 255, 0.1);
  --text-primary: #ffffff;
  --text-secondary: #cccccc;
  --border-color: rgba(255, 255, 255, 0.1);
  --shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}
```

---

## 打包配置

```yaml
# electron-builder.yml
appId: com.example.antigravity
productName: Antigravity
directories:
  output: release
  buildResources: assets

win:
  target:
    - nsis
  icon: assets/icons/icon.ico

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: Antigravity
  
files:
  - dist/**/*
  - package.json

extraResources:
  - assets/**/*
```

---

## 总结

这个架构设计遵循以下原则:

1. **关注点分离**: 主进程负责系统交互,渲染进程负责 UI
2. **模块化**: 每个功能模块独立,易于维护和测试
3. **可扩展**: 插件系统允许轻松添加新功能
4. **性能优先**: 异步操作、缓存、防抖等优化
5. **安全性**: 使用 contextBridge 隔离进程
6. **用户体验**: 快速响应、平滑动画、智能排序

可以根据实际需求调整和扩展此架构。
