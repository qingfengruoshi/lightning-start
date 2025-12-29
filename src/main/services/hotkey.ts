import { globalShortcut } from 'electron';
import { WindowManager } from '../window';
import { logger } from '../utils/logger';

export class HotkeyService {
    private windowManager: WindowManager;
    private currentHotkey: string | null = null;

    constructor(windowManager: WindowManager) {
        this.windowManager = windowManager;
    }

    register(hotkey: string): boolean {
        // Avoid redundant registration
        if (this.currentHotkey === hotkey && globalShortcut.isRegistered(hotkey)) {
            logger.debug(`Hotkey ${hotkey} already registered, skipping.`);
            return true;
        }

        try {
            // 注销旧的快捷键
            if (this.currentHotkey) {
                globalShortcut.unregister(this.currentHotkey);
                this.currentHotkey = null;
            }

            // 注册新的快捷键
            const success = globalShortcut.register(hotkey, () => {
                logger.debug(`Hotkey ${hotkey} triggered`);
                this.windowManager.toggle();
            });

            if (success) {
                this.currentHotkey = hotkey;
                logger.info(`Hotkey registered: ${hotkey}`);
            } else {
                logger.error(`Failed to register hotkey: ${hotkey}`);
            }

            return success;
        } catch (error) {
            logger.error('Error registering hotkey:', error);
            return false;
        }
    }

    unregister(): void {
        if (this.currentHotkey) {
            globalShortcut.unregister(this.currentHotkey);
            logger.info(`Hotkey unregistered: ${this.currentHotkey}`);
        }
    }

    unregisterAll(): void {
        globalShortcut.unregisterAll();
        logger.info('All hotkeys unregistered');
    }
}
