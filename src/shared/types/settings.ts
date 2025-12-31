// 设置接口
export interface Settings {
    hotkey: string;
    theme: 'light' | 'dark' | 'auto';
    language: string;
    autoStart: boolean;
    showTray: boolean; // New
    hideOnBlur: boolean;
    clipboardEnabled: boolean; // New
    maxResults: number;
    searchMode: 'fuzzy' | 'exact'; // New
    customPaths: string[];
    pluginPath: string; // New: Custom plugin directory
    // 外观设置
    window: {
        width: number;
        height: number;
        opacity: number;
        fontSize: number;
        gridGap: number; // New
    };
    plugins: {
        [key: string]: {
            enabled: boolean;
            config: Record<string, any>;
        };
    };
    hasSeenWelcome: boolean; // New: First run guide flag
}

// 默认设置
export const defaultSettings: Settings = {
    hotkey: 'Alt+Space',
    theme: 'auto',
    language: 'zh-CN',
    autoStart: true,
    showTray: true,
    hideOnBlur: true,
    clipboardEnabled: false,
    maxResults: 10,
    searchMode: 'fuzzy',
    customPaths: [],
    pluginPath: '', // Empty means default path
    window: {
        width: 800,
        height: 600,
        opacity: 0.95,
        fontSize: 14,
        gridGap: 12, // Default
    },
    plugins: {},
    hasSeenWelcome: false,
};
