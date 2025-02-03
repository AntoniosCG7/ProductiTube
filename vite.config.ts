import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

const root = resolve(__dirname);
const publicDir = resolve(root, 'public');
const distDir = resolve(root, 'dist');

// Plugin to copy manifest and other assets
const copyManifest = () => {
  return {
    name: 'copy-manifest',
    closeBundle: () => {
      // Create dist directory if it doesn't exist
      if (!existsSync(distDir)) {
        mkdirSync(distDir);
      }

      try {
        // Create icons directory
        const distIconsDir = resolve(distDir, 'icons');
        if (!existsSync(distIconsDir)) {
          mkdirSync(distIconsDir);
        }

        // Copy manifest and popup
        copyFileSync(resolve(publicDir, 'manifest.json'), resolve(distDir, 'manifest.json'));
        copyFileSync(resolve(publicDir, 'popup.html'), resolve(distDir, 'popup.html'));

        // Copy icons
        ['16', '48', '128'].forEach((size) => {
          copyFileSync(
            resolve(publicDir, `icons/icon${size}.png`),
            resolve(distDir, `icons/icon${size}.png`)
          );
        });
      } catch (error) {
        console.error('Error copying files:', error);
        throw error;
      }
    },
  };
};

export default defineConfig({
  plugins: [react(), copyManifest()],
  resolve: {
    alias: [{ find: '@', replacement: resolve(__dirname, 'src') }],
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
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'popup.css') {
            return 'styles/[name][extname]';
          }
          return '[name][extname]';
        },
      },
    },
    outDir: distDir,
    emptyOutDir: true,
  },
});
