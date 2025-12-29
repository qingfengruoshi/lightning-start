// 搜索结果接口
export interface SearchResult {
    id: string;
    title: string;
    subtitle?: string;
    icon?: string;
    type: 'app' | 'file' | 'calculator' | 'system' | 'plugin';
    action: string; // 序列化的操作类型
    data?: any; // 操作所需的数据
    frequency?: number;
    pinyin?: string;
    score?: number;
}

// 插件接口
export interface Plugin {
    name: string;
    description: string;
    priority: number;
    icon?: string;
    enabled: boolean;

    // 是否匹配当前查询
    match(query: string): boolean;

    // 执行搜索
    search(query: string): Promise<SearchResult[]>;

    // 初始化插件
    onLoad?(): void | Promise<void>;

    // 卸载插件
    onUnload?(): void | Promise<void>;
}

// 应用信息
export interface AppInfo {
    name: string;
    path: string;
    icon?: string;
    pinyin?: string;
    frequency: number;
    type: 'exe' | 'uwp' | 'custom';
}
