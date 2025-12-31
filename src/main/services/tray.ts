import { Tray, Menu, app, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { WindowManager } from '../window';
import { logger } from '../utils/logger';

export class TrayService {
    private tray: Tray | null = null;
    private windowManager: WindowManager;

    constructor(windowManager: WindowManager) {
        this.windowManager = windowManager;
    }

    create(): void {
        if (this.tray) return;

        try {
            // Priority:
            // 1. Dev: assets/icon.png (User updated)
            // 2. Prod: resources/icon.png (Packaged)

            let iconPath = '';

            if (process.env.NODE_ENV === 'development') {
                const assetIcon = path.join(process.cwd(), 'assets/tray_icon.png');
                if (fs.existsSync(assetIcon)) {
                    iconPath = assetIcon;
                    logger.info(`[Tray] Development mode: Using asset icon at ${iconPath}`);
                }
            }

            if (!iconPath) {
                const resourcesDir = process.env.NODE_ENV === 'development'
                    ? path.join(process.cwd(), 'resources')
                    : process.resourcesPath;

                // Try tray_icon.png first, fall back to icon.png if needed? 
                // User said tray_icon.png IS the one.
                iconPath = path.join(resourcesDir, 'tray_icon.png');

                // Fallback validation could be added here if we were unsure, but let's trust the user intent.
                if (!fs.existsSync(iconPath)) {
                    // If it doesn't exist in resources, maybe fall back to generic icon.png to avoid crash
                    // valid for dev-without-resources or prod-without-copy
                    const fallback = path.join(resourcesDir, 'icon.png');
                    if (fs.existsSync(fallback)) iconPath = fallback;
                }
            }

            // If icon doesn't exist, Electron might show a default or transparent icon
            const icon = nativeImage.createFromPath(iconPath);

            // Resize for tray (16x16 is standard for Windows)
            // If using custom, maybe try without resize or use 32x32 for better quality?
            // Windows usually scales down automatically if too big, but consistent 32x32 is often better for HiDPI.
            // Let's try 32x32 if it's custom.
            // Let's try 32x32 if it's custom.
            const usingCustomIcon = iconPath.includes('assets');
            const size = usingCustomIcon ? 32 : 16;
            const trayIcon = icon.resize({ width: size, height: size });

            this.tray = new Tray(trayIcon);
            this.tray.setToolTip('Lightning Start');

            this.updateMenu(this.currentLanguage); // Changed from setupContextMenu to updateMenu, passing currentLanguage

            this.tray.on('click', () => {
                this.windowManager.toggle();
            });

            logger.info('Tray icon created');
        } catch (error) {
            logger.error('Failed to create tray icon', error);
        }
    }

    destroy(): void {
        if (this.tray) {
            this.tray.destroy();
            this.tray = null;
            logger.info('Tray icon destroyed');
        }
    }

    private currentLanguage: string = 'zh-CN';

    private locales: Record<string, any> = {
        'zh-CN': {
            showHide: '显示/隐藏',
            settings: '设置',
            quit: '退出',
            title: 'Lightning Start'
        },
        'en': {
            showHide: 'Show/Hide',
            settings: 'Settings',
            quit: 'Quit',
            title: 'Lightning Start'
        }
    };

    updateMenu(language: string): void {
        this.currentLanguage = language;
        // Re-create tray if it doesn't exist? No, just update context menu and tooltip
        if (this.tray) {
            const t = this.locales[language] || this.locales['en'];
            this.tray.setToolTip(t.title);
            this.setupContextMenu();
        }
    }

    private setupContextMenu(): void {
        if (!this.tray) return;

        const t = this.locales[this.currentLanguage] || this.locales['en'];

        const contextMenu = Menu.buildFromTemplate([
            {
                label: t.showHide,
                click: () => {
                    this.windowManager.toggle();
                }
            },
            {
                label: t.settings,
                click: () => {
                    this.windowManager.openSettings();
                }
            },
            { type: 'separator' },
            {
                label: t.quit,
                click: () => {
                    app.quit();
                }
            }
        ]);

        this.tray.setContextMenu(contextMenu);
    }
}
