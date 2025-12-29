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
