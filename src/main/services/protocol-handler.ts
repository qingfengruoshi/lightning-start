import { protocol } from 'electron';
import { readFile } from 'fs/promises';
import { URL } from 'url';
import * as path from 'path';

export const SCHEME = 'antigravity-file';

export function registerPrivilegedSchemes() {
    protocol.registerSchemesAsPrivileged([
        {
            scheme: SCHEME,
            privileges: {
                secure: true,
                standard: true,
                supportFetchAPI: true,
                corsEnabled: true,
                bypassCSP: true
            }
        }
    ]);
}

export function registerAppProtocol() {
    protocol.handle(SCHEME, async (request) => {
        try {
            const requestUrl = new URL(request.url);
            let filePath = '';

            // Robust path extraction for Windows
            if (process.platform === 'win32') {
                if (requestUrl.hostname && requestUrl.hostname.length === 1) {
                    // antigravity-file://c/path -> c:/path
                    filePath = `${requestUrl.hostname}:${requestUrl.pathname}`;
                } else if (requestUrl.pathname.startsWith('/')) {
                    // antigravity-file:///C:/path -> pathname /C:/path -> C:/path (strip leading slash)
                    if (/^\/[a-zA-Z]:/.test(requestUrl.pathname)) {
                        filePath = requestUrl.pathname.slice(1);
                    } else {
                        filePath = requestUrl.pathname;
                    }
                }
            } else {
                filePath = requestUrl.pathname;
            }

            // Decode URI components (essential for spaces, emojis etc.)
            filePath = decodeURIComponent(filePath);

            // Determine mime type
            const ext = path.extname(filePath).toLowerCase();
            let mimeType = 'application/octet-stream';
            if (ext === '.png') mimeType = 'image/png';
            else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
            else if (ext === '.svg') mimeType = 'image/svg+xml';
            else if (ext === '.html') mimeType = 'text/html';
            else if (ext === '.js') mimeType = 'text/javascript';
            else if (ext === '.json') mimeType = 'application/json';
            else if (ext === '.css') mimeType = 'text/css';

            try {
                const data = await readFile(filePath);
                return new Response(data, {
                    headers: { 'content-type': mimeType }
                });
            } catch (fsError: any) {
                console.error(`[Protocol] FS Error for ${filePath}:`, fsError);
                if (fsError.code === 'ENOENT') {
                    return new Response('Not Found', { status: 404 });
                }
                throw fsError;
            }

        } catch (error) {
            console.error(`[Protocol] Failed to handle ${request.url}:`, error);
            return new Response('Internal Server Error', { status: 500 });
        }
    });
}
