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
        entryFileNames: (chunk) => {
          return `${chunk.name}/[name].js`;
        },
      },
    },
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
});
