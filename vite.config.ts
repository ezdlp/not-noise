
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    host: "::",
    port: 8080
  },
  plugins: [
    react(),
    componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}']
      }
    }),
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  build: {
    target: 'es2015',
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020'
    }
  }
});
