import { globalShortcut } from 'electron';
import { WindowManager } from '../window';
import { logger } from '../utils/logger';

export class HotkeyService {
    private windowManager: WindowManager;
    private currentHotkey: string = 'Alt+Space';

    constructor(windowManager: WindowManager) {
        this.windowManager = windowManager;
    }

    register(hotkey: string): boolean {
        try {
            // 注销旧的快捷键
            if (this.currentHotkey) {
                globalShortcut.unregister(this.currentHotkey);
            }

            // 注册新的快捷键
            const success = globalShortcut.register(hotkey, () => {
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
