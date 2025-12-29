import { shell } from 'electron';
import { Plugin, SearchResult, AppInfo } from '@shared/types/plugin';
import { AppIndexer } from '../../services/app-indexer';
import { IconExtractor } from '../../services/icon-extractor';
import { incrementAppFrequency } from '../../utils/config';
import { logger } from '../../utils/logger';

export class AppSearchPlugin implements Plugin {
    name = 'app-search';
    description = '搜索已安装的应用程序';
    priority = 100;
    enabled = true;

    private appIndexer: AppIndexer;
    private iconExtractor: IconExtractor;

    constructor(appIndexer: AppIndexer, iconExtractor: IconExtractor) {
        this.appIndexer = appIndexer;
        this.iconExtractor = iconExtractor;
    }

    match(query: string): boolean {
        // 总是匹配非空查询
        return query.length > 0;
    }

    async search(query: string, options?: { searchMode?: 'fuzzy' | 'exact' }): Promise<SearchResult[]> {
        logger.debug(`AppSearchPlugin: searching for "${query}" (mode: ${options?.searchMode})`);
        const apps = this.appIndexer.search(query, options?.searchMode);
        logger.debug(`AppSearchPlugin: found ${apps.length} apps from indexer`);

        const results: SearchResult[] = [];

        for (const app of apps) {
            // 异步获取图标（不阻塞搜索）
            const icon = await this.getAppIcon(app);

            results.push({
                id: `app:${app.path}`,
                title: app.name,
                subtitle: app.path,
                icon,
                type: 'app',
                action: 'launch-app',
                data: { path: app.path },
                frequency: app.frequency,
                pinyin: app.pinyin,
            });
        }

        logger.debug(`AppSearchPlugin: returning ${results.length} results`);
        return results;
    }

    private async getAppIcon(app: AppInfo): Promise<string> {
        try {
            if (app.type === 'exe' || app.type === 'custom') {
                return await this.iconExtractor.extractIcon(app.path);
            }
            // UWP 应用暂时返回空
            return '';
        } catch (error) {
            logger.error(`Failed to get icon for ${app.name}:`, error);
            return '';
        }
    }

    async onLoad(): Promise<void> {
        logger.info('App search plugin loading...');
        await this.iconExtractor.init();
        await this.appIndexer.buildIndex();
        logger.info('App search plugin loaded');
    }

    static async launchApp(appPath: string): Promise<void> {
        try {
            // 增加使用频率
            incrementAppFrequency(appPath);

            // 启动应用
            let error = '';
            if (appPath.startsWith('shell:AppsFolder')) {
                // UWP 应用使用 shell 打开
                error = await shell.openPath(appPath);
            } else {
                // 普通 exe 应用
                error = await shell.openPath(appPath);
            }

            if (error) {
                logger.error(`Failed to launch app (openPath error): ${error}`);
                throw new Error(error);
            }

            logger.info(`Launched app: ${appPath}`);
        } catch (error) {
            logger.error(`Failed to launch app ${appPath}:`, error);
            throw error;
        }
    }
}
