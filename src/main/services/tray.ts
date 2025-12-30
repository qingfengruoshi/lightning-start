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
            // Priority: tray_icon.png (Custom) -> icon.png (Default)
            // Use resolve to get absolute path for fs.existsSync
            const resourcesDir = process.env.NODE_ENV === 'development'
                ? path.join(process.cwd(), 'resources')
                : path.join(__dirname, '../../resources');

            let iconPath = path.join(resourcesDir, 'tray_icon.png');
            let usingCustomIcon = false;

            if (fs.existsSync(iconPath)) {
                usingCustomIcon = true;
                logger.info(`[Tray] Found custom icon at: ${iconPath}`);
            } else {
                logger.info(`[Tray] Custom icon not found at ${iconPath}, fallback to default.`);
                iconPath = path.join(resourcesDir, 'icon.png');
            }

            // If icon doesn't exist, Electron might show a default or transparent icon
            const icon = nativeImage.createFromPath(iconPath);

            // Resize for tray (16x16 is standard for Windows)
            // If using custom, maybe try without resize or use 32x32 for better quality?
            // Windows usually scales down automatically if too big, but consistent 32x32 is often better for HiDPI.
            // Let's try 32x32 if it's custom.
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
            title: 'Antigravity'
        },
        'en': {
            showHide: 'Show/Hide',
            settings: 'Settings',
            quit: 'Quit',
            title: 'Antigravity'
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
