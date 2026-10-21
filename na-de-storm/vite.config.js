import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// SINGLE=1 maakt één zelfstandig HTML-bestand (zie scripts/build-single.mjs).
const single = !!process.env.SINGLE;

// Relatieve base, zodat de build ook vanuit een submap werkt.
export default defineConfig({
  base: './',
  publicDir: single ? false : 'public',
  plugins: single ? [viteSingleFile()] : [],
  build: {
    outDir: single ? 'dist-single' : 'dist',
    assetsInlineLimit: single ? 100000000 : 0,
    chunkSizeWarningLimit: single ? 20000 : 900,
    rollupOptions: single ? {} : {
      output: {
        manualChunks: { three: ['three'] }
      }
    }
  },
  server: { host: true, port: 5173 }
});
