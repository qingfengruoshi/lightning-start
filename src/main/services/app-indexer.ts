import { app } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import { AppInfo } from '@shared/types/plugin';
import { getAppFrequency } from '../utils/config';
import { logger } from '../utils/logger';
import { pinyin } from 'pinyin-pro';

const execAsync = promisify(exec);

export class AppIndexer {
    private apps: AppInfo[] = [];
    private indexing = false;
    private iconCacheDir: string;

    constructor() {
        this.iconCacheDir = path.join(app.getPath('userData'), 'icon-cache');
    }

    async buildIndex(customPaths: string[] = []): Promise<void> {
        if (this.indexing) {
            logger.warn('Indexing already in progress');
            return;
        }

        this.indexing = true;
        logger.info('Starting app indexing...');

        try {
            // 确保图标缓存目录存在
            await fs.mkdir(this.iconCacheDir, { recursive: true });

            const apps: AppInfo[] = [];

            // 1. 扫描开始菜单
            const startMenuApps = await this.scanStartMenu();
            apps.push(...startMenuApps);

            // 2. 扫描用户开始菜单
            const userStartMenuApps = await this.scanUserStartMenu();
            apps.push(...userStartMenuApps);

            // 3. 扫描 UWP 应用
            const uwpApps = await this.scanUWPApps();
            apps.push(...uwpApps);

            // 4. 扫描自定义路径
            if (customPaths && customPaths.length > 0) {
                const customApps = await this.scanCustomPaths(customPaths);
                apps.push(...customApps);
            }

            // 去重并添加频率信息
            this.apps = this.deduplicateApps(apps);

            logger.info(`Indexed ${this.apps.length} applications`);
        } catch (error) {
            logger.error('Error building index:', error);
        } finally {
            this.indexing = false;
        }
    }

    private async scanCustomPaths(paths: string[]): Promise<AppInfo[]> {
        const apps: AppInfo[] = [];
        for (const p of paths) {
            try {
                // Check if file or directory
                const stats = await fs.stat(p);
                if (stats.isDirectory()) {
                    logger.debug(`Scanning custom directory: ${p}`);
                    const found = await this.recursiveScan(p);
                    apps.push(...found);
                } else if (stats.isFile()) {
                    const ext = path.extname(p).toLowerCase();
                    if (ext === '.exe' || ext === '.lnk') {
                        logger.debug(`Adding custom file: ${p}`);
                        const name = path.basename(p, ext);
                        apps.push(this.createAppInfo(name, p, 'custom'));
                    }
                }
            } catch (error) {
                logger.error(`Error scanning custom path ${p}:`, error);
            }
        }
        return apps;
    }

    private async recursiveScan(dir: string, depth = 0): Promise<AppInfo[]> {
        if (depth > 5) return []; // Limit depth
        const results: AppInfo[] = [];
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    // Skip hidden folders or node_modules etc if needed
                    if (!entry.name.startsWith('.')) {
                        results.push(...await this.recursiveScan(fullPath, depth + 1));
                    }
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    if (ext === '.exe' || ext === '.lnk') {
                        const name = path.basename(entry.name, ext);
                        results.push(this.createAppInfo(name, fullPath, 'custom'));
                    }
                }
            }
        } catch (e) {
            // Ignore access errors
        }
        return results;
    }

    private async scanStartMenu(): Promise<AppInfo[]> {
        try {
            logger.debug('Scanning system start menu...');

            // 创建临时 PowerShell 脚本文件
            const tempDir = app.getPath('temp');
            const scriptPath = path.join(tempDir, 'scan-start-menu.ps1');

            const script = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
Get-ChildItem "$env:ProgramData\\Microsoft\\Windows\\Start Menu\\Programs" -Recurse -Filter *.lnk -ErrorAction SilentlyContinue |
ForEach-Object {
  try {
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($_.FullName)
    if ($shortcut.TargetPath -and (Test-Path $shortcut.TargetPath)) {
      [PSCustomObject]@{
        Name = $_.BaseName
        Path = $shortcut.TargetPath
      }
    }
  } catch {}
} | ConvertTo-Json
            `.trim();

            // 写入脚本文件
            await fs.writeFile(scriptPath, script, 'utf8');

            // 执行脚本
            const { stdout, stderr } = await execAsync(
                `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`,
                { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
            );

            // 删除临时文件
            try {
                await fs.unlink(scriptPath);
            } catch (e) {
                // 忽略删除错误
            }

            if (stderr) {
                logger.warn('PowerShell stderr (system start menu):', stderr);
            }

            const result = stdout.trim();
            logger.debug(`System start menu raw output length: ${result.length}`);

            if (!result || result === '') {
                logger.warn('No apps found in system start menu');
                return [];
            }

            const parsed = JSON.parse(result);
            const items = Array.isArray(parsed) ? parsed : [parsed];
            const apps = items
                .filter((item: any) => item && item.Name && item.Path)
                .map((item: any) => this.createAppInfo(item.Name, item.Path, 'exe'));

            logger.info(`Found ${apps.length} apps in system start menu`);
            return apps;
        } catch (error) {
            logger.error('Error scanning start menu:', error);
            return [];
        }
    }

    private async scanUserStartMenu(): Promise<AppInfo[]> {
        try {
            logger.debug('Scanning user start menu...');

            // 创建临时 PowerShell 脚本文件
            const tempDir = app.getPath('temp');
            const scriptPath = path.join(tempDir, 'scan-user-start-menu.ps1');

            const script = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
Get-ChildItem "$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs" -Recurse -Filter *.lnk -ErrorAction SilentlyContinue |
ForEach-Object {
  try {
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($_.FullName)
    if ($shortcut.TargetPath -and (Test-Path $shortcut.TargetPath)) {
      [PSCustomObject]@{
        Name = $_.BaseName
        Path = $shortcut.TargetPath
      }
    }
  } catch {}
} | ConvertTo-Json
            `.trim();

            // 写入脚本文件
            await fs.writeFile(scriptPath, script, 'utf8');

            // 执行脚本
            const { stdout, stderr } = await execAsync(
                `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`,
                { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
            );

            // 删除临时文件
            try {
                await fs.unlink(scriptPath);
            } catch (e) {
                // 忽略删除错误
            }

            if (stderr) {
                logger.warn('PowerShell stderr (user start menu):', stderr);
            }

            const result = stdout.trim();
            logger.debug(`User start menu raw output length: ${result.length}`);

            if (!result || result === '') {
                logger.warn('No apps found in user start menu');
                return [];
            }

            const parsed = JSON.parse(result);
            const items = Array.isArray(parsed) ? parsed : [parsed];
            const apps = items
                .filter((item: any) => item && item.Name && item.Path)
                .map((item: any) => this.createAppInfo(item.Name, item.Path, 'exe'));

            logger.info(`Found ${apps.length} apps in user start menu`);
            return apps;
        } catch (error) {
            logger.error('Error scanning user start menu:', error);
            return [];
        }
    }

    private async scanUWPApps(): Promise<AppInfo[]> {
        try {
            const script = `
        Get-AppxPackage | Where-Object { $_.IsFramework -eq $false } |
        ForEach-Object {
          [PSCustomObject]@{
            Name = $_.Name
            Path = "shell:AppsFolder\\$($_.PackageFamilyName)!App"
          }
        } | ConvertTo-Json
      `;

            const { stdout } = await execAsync(
                `powershell -NoProfile -Command "${script.replace(/"/g, '\\"')}"`,
                { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
            );

            const result = stdout.trim();
            if (!result || result === '') return [];

            const parsed = JSON.parse(result);
            const items = Array.isArray(parsed) ? parsed : [parsed];

            return items
                .filter((item: any) => item && item.Name && item.Path)
                .map((item: any) => this.createAppInfo(item.Name, item.Path, 'uwp'));
        } catch (error) {
            logger.error('Error scanning UWP apps:', error);
            return [];
        }
    }

    private createAppInfo(name: string, appPath: string, type: 'exe' | 'uwp' | 'custom'): AppInfo {
        return {
            name,
            path: appPath,
            pinyin: pinyin(name, { toneType: 'none', type: 'array' }).join('').toLowerCase(),
            frequency: getAppFrequency(appPath),
            type,
        };
    }

    private deduplicateApps(apps: AppInfo[]): AppInfo[] {
        const seen = new Map<string, AppInfo>();

        for (const app of apps) {
            const key = app.path.toLowerCase();
            if (!seen.has(key)) {
                seen.set(key, app);
            } else {
                const existingApp = seen.get(key)!;
                if (this.isBetterName(app.name, existingApp.name)) {
                    logger.debug(`Replacing app name "${existingApp.name}" with "${app.name}" for path: ${app.path}`);
                    seen.set(key, app);
                }
            }
        }

        return Array.from(seen.values());
    }

    private isBetterName(newName: string, oldName: string): boolean {
        const penaltyKeywords = ['uninstall', '卸载', 'remove', '移除', 'delete', '删除', 'helper', 'assistant', 'configuration', '配置', '设置'];

        const newHasPenalty = penaltyKeywords.some(kw => newName.toLowerCase().includes(kw));
        const oldHasPenalty = penaltyKeywords.some(kw => oldName.toLowerCase().includes(kw));

        // 1. 优先选择不含惩罚关键词的名称
        if (!newHasPenalty && oldHasPenalty) return true;
        if (newHasPenalty && !oldHasPenalty) return false;

        // 2. 如果情况相同，优先选择更短的名称
        if (newName.length < oldName.length) return true;
        if (newName.length > oldName.length) return false;

        // 3. 长度也相同，认为不是更好的（保持主要/第一个发现的）
        return false;
    }

    search(query: string, mode: 'fuzzy' | 'exact' = 'fuzzy'): AppInfo[] {
        if (!query) return [];

        logger.debug(`Searching for: "${query}" in ${this.apps.length} apps`);
        const lowerQuery = query.toLowerCase();
        const queryPinyin = pinyin(query, { toneType: 'none', type: 'array' }).join('');
        logger.debug(`Query pinyin: "${queryPinyin}"`);

        const results = this.apps
            .filter((app) => {
                const lowerName = app.name.toLowerCase();
                const lowerPath = app.path.toLowerCase();

                // 名称匹配
                if (lowerName.includes(lowerQuery)) {
                    logger.debug(`  ✓ Name match: ${app.name}`);
                    return true;
                }

                // 路径匹配
                if (lowerPath.includes(lowerQuery)) {
                    logger.debug(`  ✓ Path match: ${app.name}`);
                    return true;
                }

                // 拼音匹配 (仅模糊模式)
                if (mode === 'fuzzy' && app.pinyin && app.pinyin.includes(queryPinyin)) {
                    logger.debug(`  ✓ Pinyin match: ${app.name} (pinyin: ${app.pinyin})`);
                    return true;
                }

                return false;
            })
            .sort((a, b) => {
                // 优先显示使用频率高的
                return (b.frequency || 0) - (a.frequency || 0);
            })
            .slice(0, 20);

        logger.debug(`Found ${results.length} matching apps`);
        return results;
    }

    getAll(): AppInfo[] {
        return this.apps;
    }

    isIndexing(): boolean {
        return this.indexing;
    }
}
