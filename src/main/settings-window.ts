import { BrowserWindow, shell } from 'electron';
import * as path from 'path';
import { logger } from './utils/logger';

export class SettingsWindow {
    private window: BrowserWindow | null = null;
    private isDev = !require('electron').app.isPackaged;

    createWindow(onClose?: () => void): void {
        if (this.window && !this.window.isDestroyed()) {
            this.window.focus();
            return;
        }

        this.window = new BrowserWindow({
            width: 800,
            height: 600,
            show: false,
            frame: true, // 设置窗口有边框
            autoHideMenuBar: true,
            title: 'Settings - Antigravity',
            webPreferences: {
                preload: path.join(__dirname, '../preload/index.js'),
                contextIsolation: true,
                nodeIntegration: false,
            },
        });

        const url = this.isDev
            ? 'http://localhost:5173/#/settings'
            : `file://${path.join(__dirname, '../renderer/index.html')}#/settings`;

        this.window.loadURL(url);

        this.window.once('ready-to-show', () => {
            this.window?.show();
        });

        // 处理外部链接
        this.window.webContents.setWindowOpenHandler(({ url }) => {
            shell.openExternal(url);
            return { action: 'deny' };
        });

        this.window.on('closed', () => {
            this.window = null;
            if (onClose) onClose();
        });

        logger.info('Settings window created');
    }

    close(): void {
        if (this.window && !this.window.isDestroyed()) {
            this.window.close();
        }
    }

    isVisible(): boolean {
        return this.window ? !this.window.isDestroyed() && this.window.isVisible() : false;
    }

    getWindow(): BrowserWindow | null {
        return this.window && !this.window.isDestroyed() ? this.window : null;
    }
}
