import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import { logger } from './utils/logger';
import { SettingsWindow } from './settings-window';
import { getSettings } from './utils/config';

export class WindowManager {
    private mainWindow: BrowserWindow | null = null;
    private settingsWindow: SettingsWindow | null = null;
    private isSettingsOpen = false;

    createWindow(): BrowserWindow {
        const { width, height } = screen.getPrimaryDisplay().workAreaSize;

        this.mainWindow = new BrowserWindow({
            width: 800,
            height: 80,
            x: Math.floor((width - 800) / 2),
            y: Math.floor(height * 0.2),
            frame: false,
            transparent: true,
            resizable: false,
            skipTaskbar: true,
            alwaysOnTop: true,
            show: false,
            webPreferences: {
                preload: path.join(__dirname, '../preload/index.js'),
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: false,
            },
        });

        // 加载页面
        if (!require('electron').app.isPackaged) {
            this.mainWindow.loadURL('http://localhost:5173');
            this.mainWindow.webContents.openDevTools({ mode: 'detach' });
        } else {
            this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
        }

        // 窗口失去焦点时隐藏
        this.mainWindow.on('blur', () => {
            const settings = getSettings();


            // Double check validation: If settings window doesn't exist (loading counts as existing), isSettingsOpen should be false
            // We use getWindow() to check existence, as isVisible() might be false during creation/loading phase
            const hasSettingsWindow = this.settingsWindow && this.settingsWindow.getWindow();
            if (this.isSettingsOpen && !hasSettingsWindow) {
                logger.warn('[Window] isSettingsOpen was true but window does not exist. Auto-correcting to false.');
                this.isSettingsOpen = false;
            }

            logger.debug(`[Window] Blur event. hideOnBlur: ${settings.hideOnBlur}, isSettingsOpen: ${this.isSettingsOpen}`);

            if (settings.hideOnBlur && !this.isSettingsOpen) {
                setTimeout(() => {
                    this.hide();
                }, 100);
            }
        });

        // 窗口准备好后显示
        this.mainWindow.once('ready-to-show', () => {
            logger.info('Main window is ready');
        });

        logger.info('Main window created');
        return this.mainWindow;
    }

    getWindow(): BrowserWindow | null {
        return this.mainWindow;
    }

    getAllWindows(): BrowserWindow[] {
        const windows: BrowserWindow[] = [];
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            windows.push(this.mainWindow);
        }
        if (this.settingsWindow) {
            const sw = this.settingsWindow.getWindow();
            if (sw) windows.push(sw);
        }
        return windows;
    }

    setSize(width: number, height: number): void {
        if (this.mainWindow) {
            console.log(`[WindowManager] setSize calling setContentSize(${width}, ${height})`);
            // Use setContentSize for accurate client area sizing (excludes borders if any, though frameless)
            this.mainWindow.setContentSize(width, height);

            // Double ensure with setBounds (sometimes required for transparent windows on Windows)
            const bounds = this.mainWindow.getBounds();
            if (bounds.height !== height) {
                this.mainWindow.setBounds({ width, height, x: bounds.x, y: bounds.y });
            }

            // Verify
            const newBounds = this.mainWindow.getBounds();
            console.log(`[WindowManager] New bounds after resize: w=${newBounds.width}, h=${newBounds.height}`);
        }
    }

    applyWindowSettings(settings: any, isPreview: boolean = false): void {
        if (!this.mainWindow) return;

        if (settings.opacity !== undefined) {
            // Check if it's Windows, setOpacity might behave differently or need separate handling
            // But usually this.mainWindow.setOpacity(settings.opacity) works
            // However, for transparent windows, we might just rely on CSS background opacity if the window is frameless?
            // Electron's setOpacity affects the whole window including text.
            // Let's assume user wants whole window opacity.
            this.mainWindow.setOpacity(settings.opacity);

            // Show window inactive to preview opacity changes if triggered from settings AND isPreview is true
            if (this.isSettingsOpen && !this.mainWindow.isVisible() && isPreview) {
                this.mainWindow.showInactive();
            }
        }

        // Width is handled by resize, but we might want to update the default width for next time
        // or resize immediately if it's just the width changing?
        // The search window size is dynamic based on content...
        // Actually, the user setting 'window.width' dictates the fixed width of the search box.
        if (settings.width !== undefined) {
            const bounds = this.mainWindow.getBounds();
            this.mainWindow.setSize(settings.width, bounds.height);
            // Also notify renderer to update its CSS width?
            this.mainWindow.webContents.send('window:style-update', { width: settings.width });
        }

        if (settings.fontSize !== undefined) {
            this.mainWindow.webContents.send('window:style-update', { fontSize: settings.fontSize });
        }
    }

    show(): void {
        if (this.mainWindow) {
            this.mainWindow.show();
            this.mainWindow.focus();
            this.mainWindow.webContents.send('window:show');
            logger.debug('Window shown');
        }
    }

    hide(): void {
        if (this.mainWindow && this.mainWindow.isVisible()) {
            this.mainWindow.hide();
            // 清空搜索
            this.mainWindow.webContents.send('search:clear');
            // 重置窗口大小到初始高度，防止下次打开时闪烁大窗口
            const bounds = this.mainWindow.getBounds();
            this.mainWindow.setSize(bounds.width, 60);
            logger.debug('Window hidden');
        }
    }

    toggle(): void {
        if (this.mainWindow) {
            if (this.mainWindow.isVisible()) {
                logger.info('Toggle: Hiding window');
                this.hide();
            } else {
                logger.info('Toggle: Showing window');
                this.show();
            }
        } else {
            logger.error('Toggle: No main window available');
        }
    }

    setSettingsOpen(isOpen: boolean): void {
        this.isSettingsOpen = isOpen;
    }

    openSettings(): void {
        this.hide(); // Hide main search window
        if (!this.settingsWindow) {
            this.settingsWindow = new SettingsWindow();
        }
        this.settingsWindow.createWindow(() => {
            console.log('[WindowManager] Settings window closed, resetting isSettingsOpen');
            this.isSettingsOpen = false;
        });
        this.isSettingsOpen = true;
    }

    destroy(): void {
        if (this.mainWindow) {
            this.mainWindow.destroy();
            this.mainWindow = null;
        }
        if (this.settingsWindow) {
            this.settingsWindow.close();
        }
    }
}
