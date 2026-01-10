import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      name: 'CSLEditor',
      formats: ['es', 'umd'],
      fileName: (format) => `csl-editor.${format}.js`
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: ['jquery'],
      output: {
        globals: {
          jquery: 'jQuery'
        },
        // Preserve the directory structure for assets
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'css/[name][extname]';
          }
          return 'assets/[name][extname]';
        }
      }
    },
    outDir: 'dist',
    sourcemap: true,
    // Increase chunk size warning limit for citeproc.js
    chunkSizeWarningLimit: 2000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'external': path.resolve(__dirname, 'external')
    }
  },
  server: {
    port: 3000,
    open: true
  },
  // Don't try to optimize citeproc.js - it's legacy code
  optimizeDeps: {
    exclude: ['external/citeproc/citeproc.js']
  }
});
