
import { app, BrowserWindow } from 'electron';
import { WindowManager } from './window';
import { HotkeyService } from './services/hotkey';
import { SearchService } from './services/search';
import { AppIndexer } from './services/app-indexer';
import { IconExtractor } from './services/icon-extractor';
import { TrayService } from './services/tray';
import { AppSearchPlugin } from './plugins/app-search';
import { CalculatorPlugin } from './plugins/calculator';
import { SystemPlugin } from './plugins/system';
import { ClipboardPlugin } from './plugins/clipboard';
import { ClipboardService } from './services/clipboard';
import { registerIpcHandlers } from './ipc/handlers';
import { getSettings } from './utils/config';
import { logger, LogLevel } from './utils/logger';

// 设置日志级别
if (!app.isPackaged) {
    logger.setLevel(LogLevel.DEBUG);
}

// 全局实例
let windowManager: WindowManager;
let hotkeyService: HotkeyService;
let trayService: TrayService;
let searchService: SearchService;
let appIndexer: AppIndexer;
let iconExtractor: IconExtractor;
let clipboardService: ClipboardService;

// 应用就绪
app.whenReady().then(async () => {
    logger.info('Application is ready');

    // 创建窗口管理器
    windowManager = new WindowManager();
    // windowManager.createWindow(); // Moved to end

    // 创建服务
    appIndexer = new AppIndexer();
    iconExtractor = new IconExtractor();
    searchService = new SearchService();
    clipboardService = new ClipboardService();
    hotkeyService = new HotkeyService(windowManager);
    trayService = new TrayService(windowManager);

    // 注册插件
    const appSearchPlugin = new AppSearchPlugin(appIndexer, iconExtractor);
    const calculatorPlugin = new CalculatorPlugin();
    const systemPlugin = new SystemPlugin();
    const clipboardPlugin = new ClipboardPlugin(clipboardService);

    searchService.registerPlugin(appSearchPlugin);
    searchService.registerPlugin(calculatorPlugin);
    searchService.registerPlugin(systemPlugin);
    searchService.registerPlugin(clipboardPlugin);

    // 初始化插件
    await searchService.initializePlugins();

    // 注册 IPC 处理器
    registerIpcHandlers(windowManager, searchService, hotkeyService, trayService, appIndexer);

    // 获取设置
    const settings = getSettings();

    // 注册全局快捷键
    // 注册全局快捷键
    hotkeyService.register(settings.hotkey);

    // 初始化剪贴板服务
    if (settings.clipboardEnabled) {
        clipboardService.setEnabled(true);
    }

    // 初始化托盘
    if (settings.showTray) {
        trayService.create();
    }

    // 设置开机自启 (Ensure sync with settings)
    app.setLoginItemSettings({
        openAtLogin: settings.autoStart,
        openAsHidden: true, // Typically start hidden in background
    });

    logger.info('Application initialized successfully');

    // 最后创建窗口，确保所有服务和 IPC 都已就绪
    windowManager.createWindow();

    // macOS 特定行为
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            windowManager.createWindow();
        }
    });
});

// 所有窗口关闭时退出（Windows & Linux）
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 应用退出前清理
app.on('will-quit', async () => {
    logger.info('Application is quitting...');

    // 注销快捷键
    hotkeyService.unregisterAll();

    // 清理插件
    await searchService.cleanupPlugins();

    logger.info('Cleanup completed');
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection:', reason);
});
