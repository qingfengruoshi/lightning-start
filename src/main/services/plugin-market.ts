import { app, net } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

import { exec } from 'child_process';
import * as util from 'util';
import { logger } from '../utils/logger';
import { PluginLoader } from './plugin-loader';
import { getSettings } from '../utils/config';

const execAsync = util.promisify(exec);

export interface MarketPlugin {
    id: string; // e.g., "com.example.plugin"
    name: string;
    description: string;
    version: string;
    author: string;
    repo: string; // e.g. "lightning-start/plugin-calc"
    downloadUrl: string; // Direct zip link
    icon?: string;
}

export class PluginMarketService {
    private registryUrl = 'https://github.com/qingfengruoshi/lightning_start_registry.git';
    private pluginLoader: PluginLoader;

    constructor(pluginLoader: PluginLoader) {
        this.pluginLoader = pluginLoader;
    }

    // Fetch list of available plugins
    async getPluginList(): Promise<MarketPlugin[]> {
        logger.info(`[Market] Fetching plugins from: ${this.registryUrl}`);

        return new Promise((resolve, reject) => {
            const request = net.request(this.registryUrl);

            logger.info(`[Market] Requesting: ${this.registryUrl}`);

            request.on('response', (response) => {
                logger.info(`[Market] Response status: ${response.statusCode}`);
                let data = '';
                response.on('data', (chunk) => {
                    data += chunk;
                });
                response.on('end', () => {
                    logger.info(`[Market] Response received. Length: ${data.length}`);
                    try {
                        if (response.statusCode !== 200) {
                            logger.error(`[Market] Bad status code: ${response.statusCode}. Body: ${data.substring(0, 200)}...`);
                            reject(new Error(`Failed to fetch registry (Status: ${response.statusCode})`));
                            return;
                        }
                        const list = JSON.parse(data);
                        logger.info(`[Market] Parsed ${list.length} plugins`);
                        resolve(list);
                    } catch (e) {
                        logger.error(`[Market] JSON Parse Error: ${e}. Raw Data: ${data}`);
                        reject(new Error('Failed to parse registry JSON (Check logs for raw data)'));
                    }
                });
            });

            request.on('error', (err) => {
                logger.error(`[Market] Network Error:`, err);
                reject(err);
            });

            request.end();
        });
    }

    private getInstallPath(): string {
        const settings = getSettings();
        return (settings.pluginPath && fs.existsSync(settings.pluginPath))
            ? settings.pluginPath
            : path.join(app.getPath('userData'), 'plugins');
    }

    // Install a plugin
    async installPlugin(plugin: MarketPlugin): Promise<void> {
        let zipPath = '';
        try {
            const tempDir = app.getPath('temp');
            zipPath = path.join(tempDir, `${plugin.id}.zip`);

            logger.info(`[Market] Installing ${plugin.name} (Remote)`);
            // 1. Download
            await this.downloadFile(plugin.downloadUrl, zipPath);

            // 2. Install from Zip
            await this.installFromZip(zipPath, plugin.id);

            // 3. Cleanup Zip
            if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

            // 4. Trigger Reload
            this.pluginLoader.reload();
            logger.info(`[Market] Successfully installed ${plugin.name}`);

        } catch (error) {
            logger.error(`[Market] Installation failed for ${plugin.name}:`, error);
            if (zipPath && fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
            throw error;
        }
    }

    // Install from a local .zip file
    async installLocalPlugin(filePath: string): Promise<void> {
        logger.info(`[Market] Installing local plugin from: ${filePath}`);
        try {
            // Use filename (without extension) as ID
            const filename = path.basename(filePath, path.extname(filePath));
            const pluginId = filename; // Simple mapping

            await this.installFromZip(filePath, pluginId);

            this.pluginLoader.reload();
            logger.info(`[Market] Successfully installed local plugin: ${pluginId}`);
        } catch (error) {
            logger.error(`[Market] Local installation failed:`, error);
            throw error;
        }
    }

    private async installFromZip(zipPath: string, pluginId: string): Promise<void> {
        const targetDir = this.getInstallPath();
        const installPath = path.join(targetDir, pluginId);

        // 1. Clear target if exists
        if (fs.existsSync(installPath)) {
            fs.rmSync(installPath, { recursive: true, force: true });
        }

        // 2. Unzip using PowerShell
        const psCommand = `powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${installPath}' -Force"`;
        await execAsync(psCommand);

        // 3. Verify package.json (Nested check)
        if (!fs.existsSync(path.join(installPath, 'package.json'))) {
            const items = fs.readdirSync(installPath);
            if (items.length === 1 && fs.statSync(path.join(installPath, items[0])).isDirectory()) {
                const nestedDir = path.join(installPath, items[0]);
                const nestedItems = fs.readdirSync(nestedDir);
                for (const item of nestedItems) {
                    fs.renameSync(path.join(nestedDir, item), path.join(installPath, item));
                }
                fs.rmdirSync(nestedDir);
            }
        }

        if (!fs.existsSync(path.join(installPath, 'package.json'))) {
            // Cleanup if invalid
            fs.rmSync(installPath, { recursive: true, force: true });
            throw new Error('Invalid plugin: package.json not found');
        }
    }

    async uninstallPlugin(pluginId: string): Promise<void> {
        const pluginsDir = this.getInstallPath();
        const targetDir = path.join(pluginsDir, pluginId);

        if (!fs.existsSync(targetDir)) {
            logger.warn(`[Market] Cannot uninstall plugin: directory not found ${targetDir}`);
            return;
        }

        logger.info(`[Market] Uninstalling plugin: ${pluginId}`);
        try {
            fs.rmSync(targetDir, { recursive: true, force: true });
            logger.info(`[Market] Uninstalled ${pluginId}`);
            this.pluginLoader.reload();
        } catch (e) {
            logger.error(`[Market] Failed to uninstall plugin ${pluginId}:`, e);
            throw new Error(`Failed to uninstall: ${e}`);
        }
    }

    private async downloadFile(url: string, dest: string): Promise<void> {
        return new Promise((resolve, reject) => {
            logger.info(`[Market] Downloading from ${url}`);
            const request = net.request(url);

            request.on('response', (response) => {
                if (response.statusCode >= 400) {
                    reject(new Error(`Failed to download (Status: ${response.statusCode})`));
                    return;
                }

                const file = fs.createWriteStream(dest);

                response.on('data', (chunk) => {
                    file.write(chunk);
                });

                response.on('end', () => {
                    file.end();
                    logger.info(`[Market] Download complete: ${dest}`);
                    resolve();
                });

                response.on('error', (err: Error) => {
                    file.close();
                    if (fs.existsSync(dest)) fs.unlinkSync(dest);
                    reject(err);
                });
            });

            request.on('error', (err: Error) => {
                if (fs.existsSync(dest)) fs.unlinkSync(dest);
                reject(err);
            });

            request.end();
        });
    }
}
