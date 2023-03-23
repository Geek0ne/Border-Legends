"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vite_1 = require("vite");
const path_1 = require("path");
exports.default = (0, vite_1.defineConfig)({
    root: '.',
    publicDir: 'public',
    base: '/',
    build: {
        outDir: 'dist',
        sourcemap: true,
        rollupOptions: {
            input: (0, path_1.resolve)(__dirname, 'index.html'),
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
    server: {
        port: 3000,
        strictPort: true,
        open: false,
    },
});
