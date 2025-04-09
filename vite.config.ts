
import { defineConfig, type ConfigEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// NOTE: Lovable-tagger is a Vite plugin used in development to add helpful tagging to React components for easier debugging,
// but it requires Vite 5.x and is not compatible with Vite 6.x, so we must use --legacy-peer-deps for installation
// to resolve this conflict. NEVER upgrade Vite past version 5.x as it will break this plugin.
export default defineConfig(({ mode }: ConfigEnv) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      timeout: 60000
    },
    // Fix for allowedHosts - it should be an array or true, not a string
    allowedHosts: ['all'],
    proxy: {
      // Forward API requests to Supabase Edge Functions
      '/api/payments/create-promotion-checkout': {
        target: 'https://owtufhdsuuyrgmxytclj.supabase.co/functions/v1/create-checkout-session',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/payments\/create-promotion-checkout/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Forward the Authorization header if it exists
            const authHeader = req.headers.authorization;
            if (authHeader) {
              proxyReq.setHeader('Authorization', authHeader);
            }
          });
        }
      },
      '/api/spotify/search': {
        target: 'https://owtufhdsuuyrgmxytclj.supabase.co/functions/v1/spotify-search',
        changeOrigin: true,
        rewrite: (path) => '',
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Forward the Authorization header if it exists
            const authHeader = req.headers.authorization;
            if (authHeader) {
              proxyReq.setHeader('Authorization', authHeader);
            }
          });
        }
      },
      // Add proxy for process-campaign-results function (development only)
      '/api/admin/process-campaign-results': {
        target: 'https://owtufhdsuuyrgmxytclj.supabase.co/functions/v1/process-campaign-results',
        changeOrigin: true,
        rewrite: (path) => '',
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Forward the Authorization header if it exists
            const authHeader = req.headers.authorization;
            if (authHeader) {
              proxyReq.setHeader('Authorization', authHeader);
            }
          });
        }
      }
    }
  },
  plugins: [
    react({
      // Using proper SWC plugin options
      jsxImportSource: 'react',
    }),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react": path.resolve("./node_modules/react"),
      "react-dom": path.resolve("./node_modules/react-dom"),
      "zod": path.resolve("./node_modules/zod"),
      "@hookform/resolvers": path.resolve("./node_modules/@hookform/resolvers"),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    dedupe: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@radix-ui/react-primitive',
      '@radix-ui/react-slot',
      '@radix-ui/react-compose-refs',
      '@radix-ui/primitive',
      '@radix-ui/react-context',
      '@radix-ui/react-presence',
      '@radix-ui/react-use-callback-ref',
      '@radix-ui/react-use-controllable-state',
      '@radix-ui/react-collection',
      '@radix-ui/react-direction',
      '@radix-ui/react-dismissable-layer',
      '@radix-ui/react-focus-guards',
      '@radix-ui/react-focus-scope',
      '@radix-ui/react-id',
      '@radix-ui/react-popper',
      '@radix-ui/react-portal',
      '@radix-ui/react-primitive',
      '@radix-ui/react-roving-focus',
      '@radix-ui/react-use-previous',
      '@radix-ui/react-use-size',
      '@radix-ui/react-visually-hidden',
      'zod', 
      'react-hook-form', 
      '@hookform/resolvers'
    ]
  },
  build: {
    target: 'es2020',
    commonjsOptions: {
      include: [/node_modules/],
      extensions: ['.js', '.cjs', '.mjs', '.ts'],
      strictRequires: true,
      transformMixedEsModules: true,
    },
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      // Don't externalize any dependencies
      external: [],
      output: {
        format: 'es',
        manualChunks: (id) => {
          // Create more explicit chunk groupings to avoid dynamic import errors
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/@radix-ui')) {
            return 'react-vendor';
          }
          
          if (id.includes('node_modules/zod') || 
              id.includes('node_modules/react-hook-form') ||
              id.includes('node_modules/@hookform')) {
            return 'forms-vendor';
          }
          
          if (id.includes('node_modules/@supabase')) {
            return 'supabase-vendor';
          }
          
          if (id.includes('node_modules/@fortawesome')) {
            return 'fontawesome-vendor';
          }
          
          if (id.includes('src/pages/admin/SmartLinks')) {
            return 'smart-links';
          }
          
          // Ensure control room pages are bundled together
          if (id.includes('src/pages/admin') || id.includes('src/components/admin')) {
            return 'admin';
          }
          
          return null;
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        // Ensure proper loading order
        entryFileNames: 'assets/[name]-[hash].js'
      }
    },
    sourcemap: false,
    minify: 'esbuild'
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'zod',
      '@hookform/resolvers',
      'react-hook-form',
      '@supabase/supabase-js',
      '@supabase/postgrest-js',
      '@supabase/realtime-js',
      '@supabase/storage-js',
      '@supabase/functions-js',
      '@supabase/auth-helpers-react',
      'recharts',
      // Include all Radix UI components that use hooks
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-tabs',
      // Add FontAwesome packages
      '@fortawesome/fontawesome-svg-core',
      '@fortawesome/free-brands-svg-icons',
      '@fortawesome/free-solid-svg-icons',
      '@fortawesome/react-fontawesome'
    ],
    exclude: [],
    esbuildOptions: {
      target: 'es2020',
      platform: 'browser',
      format: 'esm',
      resolveExtensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
      jsx: 'automatic',
      logLevel: 'info',
      treeShaking: true,
      minify: true
    }
  },
  ssr: {
    noExternal: ['zod', '@hookform/resolvers']
  }
}));
