import Store from 'electron-store';
import { Settings, defaultSettings } from '../../shared/types/settings';

// 设置存储
export const settingsStore = new Store<Settings>({
    name: 'settings',
    defaults: defaultSettings,
});

// 应用使用频率存储
export interface AppFrequency {
    [appPath: string]: number;
}

export const frequencyStore = new Store<AppFrequency>({
    name: 'app-frequency',
    defaults: {},
});

// 增加应用使用频率
export function incrementAppFrequency(appPath: string): void {
    const current = frequencyStore.get(appPath, 0);
    frequencyStore.set(appPath, current + 1);
}

// 获取应用使用频率
export function getAppFrequency(appPath: string): number {
    return frequencyStore.get(appPath, 0);
}

// 获取所有设置
export function getSettings(): Settings {
    return settingsStore.store;
}

// 更新单个设置
export function setSetting<K extends keyof Settings>(
    key: K,
    value: Settings[K]
): void {
    settingsStore.set(key, value);
}

// 重置所有设置
export function resetSettings(): void {
    settingsStore.clear();
}

// 历史记录存储
export interface HistoryItem {
    id: string;
    title: string;
    path: string; // Action data path
    icon: string;
    type: string;
    action: string;
    timestamp: number;
}

export const historyStore = new Store<{ history: HistoryItem[] }>({
    name: 'app-history',
    defaults: { history: [] },
});

// 添加历史记录
export function addHistory(item: Omit<HistoryItem, 'timestamp'>): void {
    const history = historyStore.get('history', []);

    // Remove if exists (to move to top)
    const filtered = history.filter(h => h.path !== item.path);

    // Add to front
    filtered.unshift({ ...item, timestamp: Date.now() });

    // Limit to 10 items
    const limited = filtered.slice(0, 10);

    historyStore.set('history', limited);
}

// 获取历史记录
export function getHistory(): HistoryItem[] {
    return historyStore.get('history', []);
}

// 清除历史记录
export function clearHistory(): void {
    historyStore.set('history', []);
}

// 删除单条历史
export function removeHistory(id: string): void {
    const history = historyStore.get('history', []);
    const filtered = history.filter(h => h.id !== id);
    historyStore.set('history', filtered);
}
