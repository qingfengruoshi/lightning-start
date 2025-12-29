import { Plugin, SearchResult } from '@shared/types/plugin';
import { logger } from '../utils/logger';

export class SearchService {
    private plugins: Plugin[] = [];

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
                score: this.calculateScore(r, query),
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
}
