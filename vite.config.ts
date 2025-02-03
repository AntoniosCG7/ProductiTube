import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import zipPack from 'vite-plugin-zip-pack';
import { copyFileSync, mkdirSync } from 'fs';

// Plugin to copy manifest and other assets
const copyManifest = () => {
  return {
    name: 'copy-manifest',
    closeBundle: () => {
      try {
        mkdirSync('dist');
      } catch (e) {
        console.warn('Directory might already exist, skipping...');
      }

      copyFileSync('public/manifest.json', 'dist/manifest.json');
      copyFileSync('public/popup.html', 'dist/popup.html');

      try {
        mkdirSync('dist/icons');
        copyFileSync('public/icons/icon16.png', 'dist/icons/icon16.png');
        copyFileSync('public/icons/icon48.png', 'dist/icons/icon48.png');
        copyFileSync('public/icons/icon128.png', 'dist/icons/icon128.png');
      } catch (e) {
        console.warn('Icons not found, skipping...');
      }
    },
  };
};

export default defineConfig({
  plugins: [
    react(),
    copyManifest(),
    zipPack({
      outDir: 'package',
      inDir: 'dist',
      outFileName: 'productitube.zip',
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.tsx'),
        content: resolve(__dirname, 'src/content/content-script.ts'),
        background: resolve(__dirname, 'src/background/service-worker.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
});
