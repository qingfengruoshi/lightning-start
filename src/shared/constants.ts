// IPC 通道常量
export const IPC_CHANNELS = {
    // 搜索相关
    SEARCH_QUERY: 'search:query',

    // 应用操作
    APP_LAUNCH: 'app:launch',
    APP_REVEAL: 'app:reveal',

    // 窗口控制
    WINDOW_SHOW: 'window:show',
    WINDOW_HIDE: 'window:hide',
    WINDOW_TOGGLE: 'window:toggle',

    // 设置相关
    SETTINGS_GET: 'settings:get',
    SETTINGS_SET: 'settings:set',
    SETTINGS_OPEN: 'settings:open',

    // 插件相关
    PLUGIN_LIST: 'plugin:list',
    PLUGIN_TOGGLE: 'plugin:toggle',

    // 应用索引
    INDEX_REBUILD: 'index:rebuild',
    INDEX_STATUS: 'index:status',
} as const;

// 应用类型
export const APP_TYPES = {
    EXE: 'exe',
    UWP: 'uwp',
    CUSTOM: 'custom',
} as const;

// 搜索结果类型
export const RESULT_TYPES = {
    APP: 'app',
    FILE: 'file',
    CALCULATOR: 'calculator',
    SYSTEM: 'system',
    PLUGIN: 'plugin',
} as const;
