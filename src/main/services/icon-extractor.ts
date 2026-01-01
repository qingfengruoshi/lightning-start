import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

export class IconExtractor {
    private iconCache = new Map<string, string>();
    private cacheDir: string;
    private extractionQueue: Array<{ path: string; resolve: (iconPath: string) => void }> = [];
    private isProcessing = false;

    constructor() {
        this.cacheDir = path.join(app.getPath('userData'), 'icon-cache');
    }

    async init(): Promise<void> {
        // 确保缓存目录存在
        await fs.mkdir(this.cacheDir, { recursive: true });
        logger.info('Icon extractor initialized');
    }

    async extractIcon(exePath: string): Promise<string> {
        // 检查内存缓存
        if (this.iconCache.has(exePath)) {
            logger.debug(`Icon cache hit (memory): ${exePath}`);
            return this.iconCache.get(exePath)!;
        }

        // 检查文件缓存
        const cachedPath = this.getCachedIconPath(exePath);
        try {
            await fs.access(cachedPath);
            // Check file size
            const stats = await fs.stat(cachedPath);
            if (stats.size < 1000) {
                logger.warn(`Cached icon is suspected bad/small (${stats.size} bytes < 1000), re-extracting: ${exePath}`);
                throw new Error('Invalid cache');
            }

            logger.debug(`Icon cache hit (file): ${exePath}`);
            // 读取缓存文件并转为 base64
            const pngBuffer = await fs.readFile(cachedPath);
            const base64Icon = `data:image/png;base64,${pngBuffer.toString('base64')}`;
            this.iconCache.set(exePath, base64Icon);
            return base64Icon;
        } catch (error) {
            logger.debug(`Icon cache miss or invalid: ${exePath}`);
        }

        // 提取图标
        logger.debug(`Extracting icon: ${exePath}`);
        return new Promise((resolve) => {
            this.extractionQueue.push({ path: exePath, resolve });
            this.processQueue();
        });
    }

    private async processQueue(): Promise<void> {
        if (this.isProcessing || this.extractionQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.extractionQueue.length > 0) {
            const item = this.extractionQueue.shift();
            if (!item) break;

            try {
                const iconPath = await this.doExtractIcon(item.path);
                this.iconCache.set(item.path, iconPath);
                item.resolve(iconPath);
            } catch (error) {
                logger.error(`Failed to extract icon for ${item.path}:`, error);
                item.resolve(''); // 返回空字符串表示使用默认图标
            }

            // 避免阻塞
            await new Promise((resolve) => setTimeout(resolve, 50));
        }

        this.isProcessing = false;
    }

    private async doExtractIcon(exePath: string): Promise<string> {
        try {
            logger.debug(`Attempting to extract icon using Electron API: ${exePath}`);
            // 使用 Electron 的 nativeImage 提取图标
            const icon = await app.getFileIcon(exePath, { size: 'large' });

            if (icon.isEmpty()) {
                logger.warn(`Icon is empty (Electron API): ${exePath}`);
                throw new Error('Icon is empty');
            }

            const iconPath = this.getCachedIconPath(exePath);
            const pngBuffer = icon.toPNG();

            // 检查是否为低质量图标
            if (pngBuffer.length < 1000) {
                logger.warn(`Icon is low quality (${pngBuffer.length} bytes): ${exePath}`);
                throw new Error('Low quality icon');
            }

            await fs.writeFile(iconPath, pngBuffer);

            // 返回 base64 编码的图标数据，而不是文件路径
            const base64Icon = `data:image/png;base64,${pngBuffer.toString('base64')}`;
            logger.debug(`Icon extracted successfully: ${exePath} (${pngBuffer.length} bytes)`);
            return base64Icon;
        } catch (error) {
            logger.debug(`Electron API failed for ${exePath}, trying PowerShell: ${error}`);
            // 尝试使用 PowerShell 提取
            return this.extractIconWithPowerShell(exePath);
        }
    }

    private async extractIconWithPowerShell(exePath: string): Promise<string> {
        let scriptPath = '';
        try {
            logger.debug(`Attempting PowerShell icon extraction: ${exePath}`);
            const iconPath = this.getCachedIconPath(exePath);

            // Create temp directory for script if needed
            const tempDir = path.join(app.getPath('userData'), 'temp-scripts');
            await fs.mkdir(tempDir, { recursive: true });
            scriptPath = path.join(tempDir, `extract-icon-${Date.now()}-${Math.random().toString(36).substring(7)}.ps1`);

            // Use the same robust logic as app-indexer
            // Use IShellItemImageFactory for high-quality thumbnails (Windows Vista+)
            // This is much better than ExtractAssociatedIcon which is limited to 32x32
            const script = `
Add-Type -AssemblyName System.Drawing
$path = '${exePath.replace(/'/g, "''")}'
$dest = '${iconPath.replace(/'/g, "''")}'

$code = @'
using System;
using System.Runtime.InteropServices;
using System.Drawing;
using System.Drawing.Imaging;

namespace IconExtract {
    [ComImport]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    [Guid("bcc18b79-ba16-442f-80c4-8a59c30c463b")]
    public interface IShellItemImageFactory {
        void GetImage(
            [In, MarshalAs(UnmanagedType.Struct)] Size size,
            [In] int flags,
            [Out] out IntPtr phbm);
    }

    [ComImport]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    [Guid("43826d1e-e718-42ee-bc55-a1e261c37bfe")]
    public interface IShellItem {
        void BindToHandler(IBindCtx pbc, [MarshalAs(UnmanagedType.LPStruct)] Guid bhid, [MarshalAs(UnmanagedType.LPStruct)] Guid riid, out IntPtr ppv);
        void GetParent(out IShellItem ppsi);
        void GetDisplayName(int sigdnName, out IntPtr ppszName);
        void GetAttributes(uint sfgaoMask, out uint psfgaoAttribs);
        void Compare(IShellItem psi, uint hint, out int piOrder);
    }

    public class Extractor {
        [DllImport("shell32.dll", CharSet = CharSet.Unicode, PreserveSig = false)]
        public static extern void SHCreateItemFromParsingName(
            [MarshalAs(UnmanagedType.LPWStr)] string pszPath,
            IntPtr pbc,
            [MarshalAs(UnmanagedType.LPStruct)] Guid riid,
            [MarshalAs(UnmanagedType.Interface)] out IShellItem ppv);

        [DllImport("gdi32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool DeleteObject(IntPtr hObject);

        public static void SaveIcon(string inputPath, string outputPath) {
            Guid IID_IShellItem = new Guid("43826d1e-e718-42ee-bc55-a1e261c37bfe");
            IShellItem shellItem;
            SHCreateItemFromParsingName(inputPath, IntPtr.Zero, IID_IShellItem, out shellItem);

            var imageFactory = (IShellItemImageFactory)shellItem;
            IntPtr hBitmap;
            
            // SIIGBF_ICONONLY = 0x00000004 (Available in Win7+)
            // SIIGBF_BIGGERSIZEOK = 0x00000001
            // Requesting 256x256 for maximum quality
            imageFactory.GetImage(new Size(256, 256), 0x00000004 | 0x00000001, out hBitmap);

            if (hBitmap != IntPtr.Zero) {
                using (var bitmap = Image.FromHbitmap(hBitmap)) {
                    bitmap.Save(outputPath, ImageFormat.Png);
                }
                DeleteObject(hBitmap);
            } else {
                throw new Exception("Failed to get image");
            }
        }
    }
}
'@

Add-Type -TypeDefinition $code -Language CSharp
[IconExtract.Extractor]::SaveIcon($path, $dest)
`.trim();

            await fs.writeFile(scriptPath, script, 'utf8');

            await execAsync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`);

            // 检查文件是否存在且大小正常
            try {
                const stats = await fs.stat(iconPath);
                if (stats.size < 100) {
                    logger.warn(`PowerShell extracted icon is too small (${stats.size} bytes) for ${exePath}`);
                    return '';
                }
            } catch (e) {
                logger.warn(`PowerShell icon file not created for ${exePath}`);
                return '';
            }

            // 读取文件并返回 base64
            const pngBuffer = await fs.readFile(iconPath);
            const base64Icon = `data:image/png;base64,${pngBuffer.toString('base64')}`;
            logger.debug(`PowerShell icon extracted successfully: ${exePath} (${pngBuffer.length} bytes)`);
            return base64Icon;
        } catch (error) {
            logger.error(`PowerShell icon extraction failed for ${exePath}:`, error);
            return ''; // 返回空字符串表示失败
        } finally {
            // Clean up temp script
            if (scriptPath) {
                try {
                    await fs.unlink(scriptPath);
                } catch (e) {
                    // Ignore cleanup error
                }
            }
        }
    }

    private getCachedIconPath(exePath: string): string {
        const hash = this.hashPath(exePath);
        return path.join(this.cacheDir, `${hash}.png`);
    }

    private hashPath(filePath: string): string {
        let hash = 0;
        for (let i = 0; i < filePath.length; i++) {
            hash = ((hash << 5) - hash) + filePath.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    async clearCache(): Promise<void> {
        try {
            const files = await fs.readdir(this.cacheDir);
            for (const file of files) {
                await fs.unlink(path.join(this.cacheDir, file));
            }
            this.iconCache.clear();
            logger.info('Icon cache cleared');
        } catch (error) {
            logger.error('Error clearing icon cache:', error);
        }
    }
}
