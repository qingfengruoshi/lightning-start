import Store from 'electron-store';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import { logger } from '../utils/logger';

export interface PluginDatabase {
    get(key: string, defaultValue?: any): any;
    set(key: string, value: any): void;
    delete(key: string): void;
    has(key: string): boolean;
    store: any; // Direct access to full store object if needed
}

export class PluginDataService {
    private stores: Map<string, Store> = new Map();
    private dataDir: string;

    constructor() {
        this.dataDir = path.join(app.getPath('userData'), 'plugin-data');
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    /**
     * Get or create a database instance for a specific plugin
     * @param pluginId Unique ID of the plugin (folder name)
     */
    getStore(pluginId: string): Store {
        if (!this.stores.has(pluginId)) {
            const store = new Store({
                name: pluginId, // File name will be <userData>/plugin-data/<pluginId>.json? 
                // Wait, electron-store 'name' is relative to 'cwd' or default userData.
                // We want it in 'plugin-data' subdir.
                // electron-store options: cwd
                cwd: this.dataDir,
                fileExtension: 'json',
                clearInvalidConfig: false
            });
            this.stores.set(pluginId, store);
            logger.debug(`[Database] Initialized store for plugin: ${pluginId}`);
        }
        return this.stores.get(pluginId)!;
    }

    /**
     * Create a secure API wrapper for plugins
     * This prevents plugins from accessing other stores easily
     */
    createPluginApi(pluginId: string): PluginDatabase {
        const store = this.getStore(pluginId);

        return {
            get: (key, defaultValue) => store.get(key, defaultValue),
            set: (key, value) => store.set(key, value),
            delete: (key) => store.delete(key as any),
            has: (key) => store.has(key as any),
            get store() { return store.store; } // Read-only access to full object
        };
    }
}
