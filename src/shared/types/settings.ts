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
    // 外观设置
    window: {
        width: number;
        height: number;
        opacity: number;
        fontSize: number;
    };
    plugins: {
        [key: string]: {
            enabled: boolean;
            config: Record<string, any>;
        };
    };
}

// 默认设置
export const defaultSettings: Settings = {
    hotkey: 'Alt+Space',
    theme: 'auto',
    language: 'en',
    autoStart: true,
    showTray: true,
    hideOnBlur: true,
    clipboardEnabled: false,
    maxResults: 10,
    searchMode: 'fuzzy',
    customPaths: [],
    window: {
        width: 800,
        height: 600,
        opacity: 0.95,
        fontSize: 14,
    },
    plugins: {},
};
