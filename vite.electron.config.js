"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vite_1 = require("vite");
const path_1 = require("path");
// Electron 主进程打包配置
exports.default = (0, vite_1.defineConfig)({
    root: '.',
    build: {
        outDir: 'dist-electron',
        emptyOutDir: true,
        rollupOptions: {
            input: (0, path_1.resolve)(__dirname, 'electron/main.ts'),
            output: {
                entryFileNames: 'main.js',
                chunkFileNames: 'chunks/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash][extname]',
            },
        },
    },
    resolve: {
        alias: {
            '@': (0, path_1.resolve)(__dirname, 'src'),
            '@src': (0, path_1.resolve)(__dirname, 'src'),
            '@assets': (0, path_1.resolve)(__dirname, 'public/assets'),
            '@utils': (0, path_1.resolve)(__dirname, 'src/utils'),
            '@types': (0, path_1.resolve)(__dirname, 'src/types'),
        },
    },
});
