import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyManifest } from './build-utils/copy-manifest-plugin';
import { buildConfig } from './build-utils/build-config';
import { paths } from './build-utils/paths';

export default defineConfig({
  plugins: [react(), copyManifest()],
  resolve: {
    alias: [{ find: '@', replacement: paths.srcDir }],
  },
  build: buildConfig,
  css: {
    modules: false,
  },
});
