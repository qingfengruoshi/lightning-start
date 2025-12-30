import { Plugin, SearchResult } from '@shared/types/plugin';
import { logger } from '../utils/logger';
import { PluginLoader } from './plugin-loader';

export class SearchService {
    private plugins: Plugin[] = [];
    private pluginLoader: PluginLoader;

    constructor(pluginLoader: PluginLoader) {
        this.pluginLoader = pluginLoader;
    }

    registerPlugin(plugin: Plugin): void {
        this.plugins.push(plugin);
        // 按优先级排序
        this.plugins.sort((a, b) => b.priority - a.priority);
        logger.info(`Plugin registered: ${plugin.name}`);
    }

    unregisterPlugin(name: string): void {
        const index = this.plugins.findIndex((p) => p.name === name);
        if (index !== -1) {
            this.plugins.splice(index, 1);
            logger.info(`Plugin unregistered: ${name}`);
        }
    }

    setPluginEnabled(name: string, enabled: boolean): void {
        const plugin = this.plugins.find(p => p.name === name);
        if (plugin) {
            plugin.enabled = enabled;
            logger.info(`Plugin ${name} enabled state set to: ${enabled}`);
        }
    }

    async search(query: string, maxResults: number = 10, mode: 'fuzzy' | 'exact' = 'fuzzy'): Promise<SearchResult[]> {
        if (!query || query.trim() === '') {
            return [];
        }

        const results: SearchResult[] = [];

        // 找到所有匹配的插件
        const matchedPlugins = this.plugins.filter(
            (p) => p.enabled && p.match(query)
        );

        // 并行搜索
        const promises = matchedPlugins.map(async (plugin) => {
            try {
                return await plugin.search(query, { searchMode: mode });
            } catch (error) {
                logger.error(`Error in plugin ${plugin.name}:`, error);
                return [];
            }
        });

        const pluginResults = await Promise.all(promises);

        // 合并结果
        for (const result of pluginResults) {
            results.push(...result);
        }

        // 排序和限制结果数量
        return this.rankResults(results, query).slice(0, maxResults);
    }

    private rankResults(results: SearchResult[], query: string): SearchResult[] {
        return results
            .map((r) => ({
                ...r,
                score: r.score !== undefined ? r.score : this.calculateScore(r, query),
            }))
            .sort((a, b) => b.score! - a.score!);
    }

    private calculateScore(result: SearchResult, query: string): number {
        let score = 0;
        const lowerQuery = query.toLowerCase();
        const lowerTitle = result.title.toLowerCase();

        // 完全匹配
        if (lowerTitle === lowerQuery) {
            score += 100;
        }
        // 前缀匹配
        else if (lowerTitle.startsWith(lowerQuery)) {
            score += 50;
        }
        // 包含匹配
        else if (lowerTitle.includes(lowerQuery)) {
            score += 25;
        }

        // 拼音匹配
        if (result.pinyin && result.pinyin.includes(lowerQuery)) {
            score += 30;
        }

        // 使用频率
        score += (result.frequency || 0) * 10;

        return score;
    }

    getPlugins(): Plugin[] {
        return this.plugins;
    }

    async initializePlugins(): Promise<void> {
        // Load external plugins
        const externalPlugins = this.pluginLoader.loadPlugins();
        externalPlugins.forEach(p => this.registerPlugin(p));

        for (const plugin of this.plugins) {
            if (plugin.onLoad) {
                try {
                    await plugin.onLoad();
                    logger.info(`Plugin initialized: ${plugin.name}`);
                } catch (error) {
                    logger.error(`Error initializing plugin ${plugin.name}:`, error);
                }
            }
        }
    }

    async cleanupPlugins(): Promise<void> {
        for (const plugin of this.plugins) {
            if (plugin.onUnload) {
                try {
                    await plugin.onUnload();
                    logger.info(`Plugin cleaned up: ${plugin.name}`);
                } catch (error) {
                    logger.error(`Error cleaning up plugin ${plugin.name}:`, error);
                }
            }
        }
    }

    async executePluginItem(result: SearchResult): Promise<void> {
        if (result.data && result.data.pluginName) {
            const plugin = this.plugins.find(p => p.name === result.data.pluginName);
            if (plugin && plugin.execute) {
                try {
                    await plugin.execute(result);
                    logger.info(`Executed action for plugin ${plugin.name}`);
                } catch (e) {
                    logger.error(`Failed to execute action for plugin ${plugin.name}:`, e);
                }
            }
        }
    }

    async reloadExternalPlugins(): Promise<void> {
        // 1. Unload existing external plugins
        // Filter out plugins that are NOT external (keep system plugins)
        const builtInPlugins = this.plugins.filter(p => !p.isExternal);

        // Call lifecycle unload for external plugins
        const externalPlugins = this.plugins.filter(p => p.isExternal);
        for (const p of externalPlugins) {
            if (p.onUnload) await p.onUnload();
        }

        // 2. Clear loader cache and reload
        const newExternalPlugins = this.pluginLoader.reload();

        // 3. Rebuild plugins list
        this.plugins = [...builtInPlugins];
        newExternalPlugins.forEach(p => this.registerPlugin(p));

        // 4. Initialize new plugins
        for (const p of newExternalPlugins) {
            if (p.onLoad) await p.onLoad();
        }

        logger.info(`[SearchService] Reloaded ${newExternalPlugins.length} external plugins`);
    }
}
