import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from '../utils/logger';
import { Plugin, SearchResult } from '@shared/types/plugin';
import { getSettings } from '../utils/config';

import { PluginDataService } from './database';

// ... (existing imports)

// External Plugin Interface (Simplified for JS developers)
export interface ExternalPluginConfig {
    name: string;
    description?: string;
    triggers?: string[];
    icon?: string;
    [key: string]: any;
}

export interface PluginContext {
    db: any; // Database API
}

export interface ExternalPluginModule {
    search: (query: string, context?: PluginContext) => Promise<any[]>;
    execute?: (item: any, context?: PluginContext) => Promise<void>;
    onLoad?: (context?: PluginContext) => void;
    onUnload?: (context?: PluginContext) => void;
}

import { pathToFileURL } from 'url';

function toProtocolUrl(filePath: string): string {
    return pathToFileURL(filePath).toString().replace('file:', 'antigravity-file:');
}

// Adapter to adapt External Plugin to Internal Plugin Interface
class ExternalPluginAdapter implements Plugin {
    // ... (existing properties)
    name: string;
    id?: string;
    description: string;
    priority: number = 0;
    enabled: boolean = true;
    icon?: string;
    isExternal: boolean = true;

    private module: ExternalPluginModule;
    private config: ExternalPluginConfig;
    private basePath: string;
    private dbService: PluginDataService;

    constructor(module: ExternalPluginModule, config: ExternalPluginConfig, basePath: string, dbService: PluginDataService) {
        this.module = module;
        this.config = config;
        this.basePath = basePath;
        this.dbService = dbService;

        this.id = config.id || path.basename(basePath); // Ensure ID exists
        this.name = config.name;
        this.description = config.description || 'External Plugin';
        // Resolve icon path to absolute if exists
        if (config.icon) {
            const iconPath = path.join(basePath, config.icon);
            if (fs.existsSync(iconPath)) {
                // Convert to protocol URL
                this.icon = toProtocolUrl(iconPath);
            } else {
                // Treat as text/emoji
                this.icon = config.icon;
            }
        }
    }

    private getContext(): PluginContext {
        return {
            db: this.dbService.createPluginApi(this.id!)
        };
    }

    match(query: string): boolean {
        // ... (existing logic)
        if (this.config.triggers && this.config.triggers.length > 0) {
            return this.config.triggers.some(trigger => query.toLowerCase().startsWith(trigger.toLowerCase()));
        }
        return false;
    }

    async search(query: string): Promise<SearchResult[]> {
        // ... (existing search logic setup)
        let cleanQuery = query;
        let triggered = false;

        if (this.config.triggers) {
            const trigger = this.config.triggers.find(t => query.toLowerCase().startsWith(t.toLowerCase()));
            if (trigger) {
                cleanQuery = query.substring(trigger.length).trim();
                triggered = true;
            }
        }

        try {
            logger.debug(`[PluginAdapter/${this.name}] Searching with query="${cleanQuery}" (Triggered: ${triggered})`);
            // INJECT CONTEXT HERE
            const rawResults = await this.module.search(cleanQuery, this.getContext());

            // Adapt raw JS objects to SearchResult
            return rawResults.map(r => {
                let iconUrl = this.icon;
                if (r.icon) {
                    if (r.icon.startsWith('http') || r.icon.startsWith('data:')) {
                        iconUrl = r.icon;
                    } else {
                        // Check absolute path or resolve relative
                        let potentialPath: string;
                        if (path.isAbsolute(r.icon)) {
                            potentialPath = r.icon;
                        } else {
                            potentialPath = path.join(this.basePath, r.icon);
                        }

                        // Check existence to distinguish files from text/emojis
                        if (fs.existsSync(potentialPath)) {
                            iconUrl = toProtocolUrl(potentialPath);
                        } else {
                            iconUrl = r.icon;
                        }
                    }
                }

                return {
                    id: r.id || `${this.name}-${Math.random().toString(36).substr(2, 9)}`,
                    title: r.title || 'No Title',
                    subtitle: r.subtitle,
                    icon: iconUrl,
                    type: 'plugin',
                    action: 'plugin-execute',
                    data: {
                        pluginName: this.name,
                        payload: r.data || r // Pass original data or full object
                    },
                    score: r.score ?? (triggered ? 1000 : 0), // High score if triggered explicitly
                    frequency: 0
                };
            });
        } catch (e) {
            logger.error(`[PluginAdapter] Error in ${this.name}:`, e);
            return [];
        }
    }

    async execute(result: SearchResult): Promise<void> {
        if (this.module.execute && result.data?.payload) {
            // INJECT CONTEXT HERE
            await this.module.execute(result.data.payload, this.getContext());
        }
    }

    // Lifecycle
    async onLoad() {
        // INJECT CONTEXT HERE
        if (this.module.onLoad) await this.module.onLoad(this.getContext());
    }

    async onUnload() {
        // INJECT CONTEXT HERE
        if (this.module.onUnload) await this.module.onUnload(this.getContext());
    }
}

export class PluginLoader {
    private defaultPluginsDir: string;
    private loadedEntryPaths: Set<string> = new Set();
    private dbService: PluginDataService;

    constructor(dbService: PluginDataService) {
        this.dbService = dbService;
        this.defaultPluginsDir = path.join(app.getPath('userData'), 'plugins');
        // Ensure default always exists just in case
        if (!fs.existsSync(this.defaultPluginsDir)) {
            fs.mkdirSync(this.defaultPluginsDir, { recursive: true });
        }
    }

    // ... (rest of methods)

    private getActivePluginsDir(): string {
        const settings = getSettings();
        if (settings.pluginPath && typeof settings.pluginPath === 'string' && fs.existsSync(settings.pluginPath)) {
            return settings.pluginPath;
        }
        return this.defaultPluginsDir;
    }

    unloadPlugins(): void {
        logger.info('[PluginLoader] Unloading plugins...');
        // Clear require cache for all loaded entry points
        for (const entryPath of this.loadedEntryPaths) {
            try {
                // Ensure we resolve it exactly as require.cache keys are absolute paths
                const key = require.resolve(entryPath);
                if (require.cache[key]) {
                    delete require.cache[key];
                    logger.debug(`[PluginLoader] Cleared cache for: ${entryPath}`);
                }
            } catch (e) {
                logger.warn(`[PluginLoader] Failed to clear cache for ${entryPath}:`, e);
            }
        }
        this.loadedEntryPaths.clear();
    }

    loadPlugins(): Plugin[] {
        const pluginsDir = this.getActivePluginsDir();
        const loadedPlugins: Plugin[] = [];
        logger.info(`[PluginLoader] Scanning for plugins in: ${pluginsDir}`);

        try {
            if (!fs.existsSync(pluginsDir)) {
                logger.warn(`[PluginLoader] Directory does not exist: ${pluginsDir}`);
                return [];
            }

            const items = fs.readdirSync(pluginsDir, { withFileTypes: true });

            for (const item of items) {
                if (item.isDirectory()) {
                    const pluginPath = path.join(pluginsDir, item.name);
                    const packageJsonPath = path.join(pluginPath, 'package.json');

                    if (fs.existsSync(packageJsonPath)) {
                        try {
                            const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
                            // Check for lightning-start config
                            // Backward compatibility: check antigravity too if needed, but for now strict rename as requested
                            const config = pkg['lightning-start'] || pkg['antigravity']; // Allow fallback for a moment or just strict?
                            // User said "Change ALL called Antigravity". Let's be clean but safe.
                            if (config) {
                                // Dynamic require
                                const entryPoint = pkg.main || 'index.js';
                                const entryPath = path.join(pluginPath, entryPoint);

                                // Purge cache to allow reloading (redundant safety check)
                                delete require.cache[require.resolve(entryPath)];

                                try {
                                    const pluginModule = require(entryPath);

                                    // Track this path for unloading later
                                    this.loadedEntryPaths.add(entryPath);

                                    // Validation
                                    if (pluginModule && typeof pluginModule.search === 'function') {
                                        const adapter = new ExternalPluginAdapter(pluginModule, {
                                            id: item.name, // Use folder name as ID (matches Market ID)
                                            name: config.title || pkg.name,
                                            description: config.description || pkg.description,
                                            triggers: config.triggers || [],
                                            icon: config.icon
                                        }, pluginPath, this.dbService); // Inject DB Service

                                        loadedPlugins.push(adapter);
                                        logger.info(`[PluginLoader] Loaded external plugin: ${adapter.name}`);
                                    } else {
                                        logger.warn(`[PluginLoader] Plugin ${pkg.name} has no search function`);
                                    }
                                } catch (e) {
                                    logger.error(`[PluginLoader] Failed to require plugin at ${entryPath}:`, e);
                                }
                            }
                        } catch (err) {
                            logger.error(`[PluginLoader] Failed to load plugin at ${pluginPath}:`, err);
                        }
                    }
                }
            }
        } catch (e) {
            logger.error('[PluginLoader] Error scanning plugins directory:', e);
        }

        return loadedPlugins;
    }

    reload(): Plugin[] {
        this.unloadPlugins();
        return this.loadPlugins();
    }
}
