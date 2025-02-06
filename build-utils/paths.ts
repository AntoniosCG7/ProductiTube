import { resolve } from 'path';

const root = resolve(__dirname, '..');
export const paths = {
  root,
  publicDir: resolve(root, 'public'),
  distDir: resolve(root, 'dist'),
  srcDir: resolve(root, 'src'),
  distIconsDir: resolve(root, 'dist/icons'),
} as const;
