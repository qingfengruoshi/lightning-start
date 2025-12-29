import { Tray, Menu, app, nativeImage } from 'electron';
import * as path from 'path';
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
            // Use a specific icon for the tray
            let iconPath = path.join(__dirname, '../../resources/icon.png');
            if (process.env.NODE_ENV === 'development') {
                // Adjust path for dev mode if needed, usually resources/icon.png is fine if copied
                // Or fallback to a known location
                iconPath = path.join(process.cwd(), 'resources/icon.png');
            }

            // If icon doesn't exist, Electron might show a default or transparent icon
            const icon = nativeImage.createFromPath(iconPath);

            // Resize for tray (16x16 is standard for Windows)
            const trayIcon = icon.resize({ width: 16, height: 16 });

            this.tray = new Tray(trayIcon);
            this.tray.setToolTip('Antigravity');

            this.setupContextMenu();

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
