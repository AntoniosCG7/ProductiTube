import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import zipPack from 'vite-plugin-zip-pack';

export default defineConfig({
  plugins: [
    react(),
    zipPack({
      outDir: 'package',
      inDir: 'dist',
      outFileName: 'productitube.zip'
    })
  ],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'public/popup.html'),
        content: resolve(__dirname, 'src/content/content-script.ts'),
        background: resolve(__dirname, 'src/background/service-worker.ts')
      },
      output: {
        entryFileNames: chunk => {
          return `${chunk.name}/[name].js`;
        }
      }
    },
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
}); 