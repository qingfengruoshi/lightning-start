import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import electron from 'vite-plugin-electron';

export default defineConfig({
    plugins: [
        vue(),
        electron([
            {
                entry: resolve(__dirname, 'src/main/index.ts'),
                vite: {
                    build: {
                        outDir: 'dist/main',
                        rollupOptions: {
                            external: ['electron'], // Ensure electron is external
                        },
                    },
                    resolve: {
                        alias: {
                            '@shared': resolve(__dirname, 'src/shared'),
                            '@': resolve(__dirname, 'src'),
                        }
                    }
                },
            },
            {
                entry: resolve(__dirname, 'src/preload/index.ts'),
                onstart(args) {
                    args.reload()
                },
                vite: {
                    build: {
                        outDir: 'dist/preload',
                    },
                    resolve: {
                        alias: {
                            '@shared': resolve(__dirname, 'src/shared'),
                            '@': resolve(__dirname, 'src'),
                        }
                    }
                },
            },
        ]),
    ],
    root: resolve(__dirname, 'src/renderer'),
    base: './',
    build: {
        outDir: resolve(__dirname, 'dist/renderer'),
        emptyOutDir: true,
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '@shared': resolve(__dirname, 'src/shared'),
        },
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.vue', '.json'],
    },
    server: {
        port: 5173,
    },
});
