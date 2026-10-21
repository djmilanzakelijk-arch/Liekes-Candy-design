import { defineConfig } from 'vite';

// Relative base so the build also works from a sub-folder or a file preview.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: { three: ['three'] }
      }
    }
  },
  server: { host: true, port: 5173 }
});
