import { paths } from './paths';
import { resolve } from 'path';

export const buildConfig = {
  rollupOptions: {
    input: {
      popup: resolve(paths.srcDir, 'popup/popup.tsx'),
      content: resolve(paths.srcDir, 'content/content-script.ts'),
      background: resolve(paths.srcDir, 'background/service-worker.ts'),
    },
    output: {
      entryFileNames: '[name].js',
      assetFileNames: '[name].[ext]',
    },
  },
  outDir: paths.distDir,
  emptyOutDir: true,
};
