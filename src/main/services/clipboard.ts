import { clipboard } from 'electron';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

export interface ClipboardItem {
    id: string;
    text: string;
    timestamp: number;
}

export class ClipboardService extends EventEmitter {
    private history: ClipboardItem[] = [];
    private maxHistory = 50;
    private checkInterval: NodeJS.Timeout | null = null;
    private lastText = '';
    private isEnabled = false;

    constructor() {
        super();
    }

    start(): void {
        if (this.isEnabled && !this.checkInterval) {
            this.lastText = clipboard.readText();
            this.checkInterval = setInterval(() => this.checkClipboard(), 1000);
            logger.info('Clipboard service started');
        }
    }

    stop(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            logger.info('Clipboard service stopped');
        }
    }

    setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
        if (enabled) {
            this.start();
        } else {
            this.stop();
        }
    }

    private checkClipboard(): void {
        const text = clipboard.readText();
        if (text && text !== this.lastText) {
            this.lastText = text;
            this.addHistory(text);
        }
    }

    private addHistory(text: string): void {
        // Avoid duplicates at top
        if (this.history.length > 0 && this.history[0].text === text) {
            this.history[0].timestamp = Date.now();
            return;
        }

        // Remove if exists elsewhere to bump up
        this.history = this.history.filter(item => item.text !== text);

        this.history.unshift({
            id: Date.now().toString(),
            text,
            timestamp: Date.now()
        });

        if (this.history.length > this.maxHistory) {
            this.history.pop();
        }

        logger.debug(`Clipboard history updated: ${text.substring(0, 20)}...`);
    }

    getHistory(): ClipboardItem[] {
        return this.history;
    }

    writeText(text: string): void {
        clipboard.writeText(text);
        this.lastText = text; // Prevent re-adding
    }

    clear(): void {
        this.history = [];
    }
}
