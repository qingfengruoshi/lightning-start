import { ipcMain, clipboard, shell, nativeTheme, app, dialog } from 'electron';
import { WindowManager } from '../window';
import { SearchService } from '../services/search';
import { getSettings, setSetting } from '../utils/config';
import { HotkeyService } from '../services/hotkey';
import { TrayService } from '../services/tray';
import { IPC_CHANNELS } from '@shared/constants';
import { AppSearchPlugin } from '../plugins/app-search';
import { SystemPlugin } from '../plugins/system';
import { logger } from '../utils/logger';
import { AppIndexer } from '../services/app-indexer';
import { exec } from 'child_process';
import * as util from 'util';

const execAsync = util.promisify(exec);

async function getIconViaPowershell(path: string): Promise<string | null> {
    const psScript = `
    Add-Type -AssemblyName System.Drawing
    $icon = [System.Drawing.Icon]::ExtractAssociatedIcon('${path}')
    if ($icon) {
        $bitmap = $icon.ToBitmap()
        $stream = New-Object System.IO.MemoryStream
        $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
        $bytes = $stream.ToArray()
        $base64 = [Convert]::ToBase64String($bytes)
        Write-Output "BASE64_START$base64"
    }
    `;

    try {
        const { stdout } = await execAsync(`powershell -NoProfile -Command "${psScript.replace(/"/g, '\\"')}"`);
        const match = stdout.match(/BASE64_START(.+)/);
        if (match && match[1]) {
            return `data:image/png;base64,${match[1].trim()}`;
        }
    } catch (e) {
        logger.error(`[Icon] PowerShell extraction failed for ${path}:`, e);
    }
    return null;
}

export function registerIpcHandlers(
    windowManager: WindowManager,
    searchService: SearchService,
    hotkeyService: HotkeyService,
    trayService: TrayService,
    appIndexer: AppIndexer
): void {

    ipcMain.handle('get-file-icon', async (_event, path: string) => {
        try {
            const icon = await app.getFileIcon(path);
            const dataUrl = icon.toDataURL();

            // Check if icon is "empty" or default (usually small size)
            if (dataUrl.length < 1500) {
                logger.warn(`[Icon] Built-in extraction yielded low quality icon (${dataUrl.length} chars) for ${path}. Trying PowerShell fallback...`);
                const psIcon = await getIconViaPowershell(path);
                if (psIcon) {
                    logger.info(`[Icon] PowerShell fallback successful for ${path}`);
                    return psIcon;
                }
            }
            return dataUrl;
        } catch (e) {
            logger.error(`[Icon] Failed to get icon for ${path}:`, e);
            // Fallback immediately on error
            return await getIconViaPowershell(path);
        }
    });

    ipcMain.on('renderer-log', (_event, ...args: any[]) => {
        logger.info('[Renderer]', ...args);
    });
    // 搜索查询
    ipcMain.handle(IPC_CHANNELS.SEARCH_QUERY, async (_event, query: string) => {
        try {
            const settings = getSettings();
            const results = await searchService.search(query, settings.maxResults, settings.searchMode);
            return results;
        } catch (error) {
            logger.error('Error handling search query:', error);
            return [];
        }
    });


    ipcMain.handle('action:execute', async (_event, action: string, data: any) => {
        logger.info(`[IPC] action:execute received: ${action}`, data);
        try {
            switch (action) {
                case 'launch-app':
                    logger.info(`[IPC] Launching app: ${data.path}`);
                    await AppSearchPlugin.launchApp(data.path);
                    windowManager.hide();
                    break;

                case 'copy-to-clipboard':
                    clipboard.writeText(data.text);
                    windowManager.hide();
                    break;

                case 'execute-system-command':
                    await SystemPlugin.executeCommand(data.command);
                    windowManager.hide();
                    break;

                case 'open-path':
                    await shell.openPath(data.path);
                    windowManager.hide();
                    break;

                case IPC_CHANNELS.SETTINGS_OPEN:
                    windowManager.openSettings();
                    windowManager.hide(); // 可选：打开设置后隐藏搜索框
                    break;

                default:
                    logger.warn(`Unknown action: ${action}`);
            }
        } catch (error) {
            logger.error('Error executing action:', error);
            throw error;
        }
    });

    // 窗口控制
    ipcMain.on(IPC_CHANNELS.WINDOW_SHOW, () => {
        windowManager.show();
    });

    ipcMain.on(IPC_CHANNELS.WINDOW_HIDE, () => {
        windowManager.hide();
    });

    ipcMain.on(IPC_CHANNELS.WINDOW_TOGGLE, () => {
        windowManager.toggle();
    });

    ipcMain.on('window:resize', (_event, height: number) => {
        const bounds = windowManager.getWindow()?.getBounds();
        const width = bounds ? bounds.width : 800; // Default or current
        console.log(`[IPC] Received window:resize height=${height}, keeping width=${width}`);
        windowManager.setSize(width, height);
    });

    // 设置相关
    ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
        return getSettings();
    });

    ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, async (_event, key: string, value: any) => {
        setSetting(key as any, value);

        // 如果修改了快捷键，重新注册
        if (key === 'hotkey') {
            hotkeyService.register(value);
        }

        // 如果修改了窗口设置，实时应用
        if (key === 'window') {
            windowManager.applyWindowSettings(value);
        }

        // 修改了自启设置
        if (key === 'autoStart') {
            app.setLoginItemSettings({
                openAtLogin: value,
                openAsHidden: true,
            });
        }

        // 修改了托盘设置
        if (key === 'showTray') {
            if (value) {
                trayService.create();
            } else {
                trayService.destroy();
            }
        }

        // 修改了主题设置
        if (key === 'theme') {
            try {
                const themeVal = value === 'auto' ? 'system' : value;
                logger.info(`[IPC] Setting theme to: ${themeVal} (raw: ${value})`);
                nativeTheme.themeSource = themeVal as any;
            } catch (err) {
                logger.error(`[IPC] Failed to set theme:`, err);
            }
        }

        // 修改了语言设置
        if (key === 'language') {
            trayService.updateMenu(value);
        }

        // Broadcast update to all windows
        const allWindows = windowManager.getAllWindows();
        allWindows.forEach(win => {
            win.webContents.send('settings:updated', getSettings());
        });

        return true;
    });

    ipcMain.handle('settings:save', async (_event, newSettings: any) => {
        // Bulk update
        for (const [key, value] of Object.entries(newSettings)) {
            setSetting(key as any, value);
            // Apply side effects
            if (key === 'hotkey') hotkeyService.register(value as string);
            if (key === 'window') windowManager.applyWindowSettings(value);
            if (key === 'autoStart') {
                app.setLoginItemSettings({ openAtLogin: value as boolean, openAsHidden: true });
            }
            if (key === 'showTray') {
                value ? trayService.create() : trayService.destroy();
            }
            if (key === 'theme') {
                try {
                    const themeVal = value === 'auto' ? 'system' : value;
                    logger.info(`[IPC] Bulk setting theme to: ${themeVal} (raw: ${value})`);
                    nativeTheme.themeSource = themeVal as any;
                } catch (err) {
                    logger.error(`[IPC] Failed to bulk set theme:`, err);
                }
            }
            if (key === 'language') trayService.updateMenu(value as string);
        }

        // Broadcast once
        const allWindows = windowManager.getAllWindows();
        allWindows.forEach(win => {
            win.webContents.send('settings:updated', getSettings());
        });
        return true;
    });

    ipcMain.on(IPC_CHANNELS.SETTINGS_OPEN, () => {
        windowManager.openSettings();
    });

    ipcMain.on('settings:close', () => {
        windowManager.setSettingsOpen(false);
    });

    // 插件列表
    ipcMain.handle(IPC_CHANNELS.PLUGIN_LIST, () => {
        return searchService.getPlugins().map((p) => ({
            name: p.name,
            description: p.description,
            enabled: p.enabled,
            icon: p.icon,
        }));
    });

    // 重建索引
    ipcMain.handle(IPC_CHANNELS.INDEX_REBUILD, async (_event, customPaths?: string[]) => {
        logger.info('Rebuilding index...');
        const settings = getSettings();
        await appIndexer.buildIndex(customPaths || settings.customPaths);
        return true;
    });

    // 打开文件夹对话框
    ipcMain.handle('dialog:open-directory', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory'],
        });
        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }
        return result.filePaths[0];
    });

    logger.info('IPC handlers registered');
}
