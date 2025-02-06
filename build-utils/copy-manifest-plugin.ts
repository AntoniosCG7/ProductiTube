import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { paths } from './paths';
import { resolve } from 'path';

export const copyManifest = () => {
  return {
    name: 'copy-manifest',
    closeBundle: () => {
      // Create dist directory if it doesn't exist
      if (!existsSync(paths.distDir)) {
        mkdirSync(paths.distDir);
      }

      try {
        // Create icons directory
        if (!existsSync(paths.distIconsDir)) {
          mkdirSync(paths.distIconsDir);
        }

        const filesToCopy = [
          {
            src: resolve(paths.publicDir, 'manifest.json'),
            dest: resolve(paths.distDir, 'manifest.json'),
          },
          {
            src: resolve(paths.publicDir, 'popup.html'),
            dest: resolve(paths.distDir, 'popup.html'),
          },
          {
            src: resolve(paths.publicDir, 'icons/icon128.png'),
            dest: resolve(paths.distDir, 'icons/icon128.png'),
          },
        ];

        filesToCopy.forEach(({ src, dest }) => copyFileSync(src, dest));
      } catch (error) {
        console.error('Error copying files:', error);
        throw error;
      }
    },
  };
};
