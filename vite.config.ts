
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      timeout: 60000
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
      output: {
        format: 'es',
        manualChunks: (id) => {
          // Handle specific packages
          if (id.includes('node_modules')) {
            // Create a single React vendor chunk, including ALL React dependencies
            if (id.includes('react') || 
                id.includes('react-dom') ||
                id.includes('@radix-ui')) {
              return 'vendor-react';
            }
            
            if (id.includes('zod') || 
                id.includes('react-hook-form') || 
                id.includes('@hookform/resolvers')) {
              return 'vendor-forms';
            }
            
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            
            if (id.includes('lucide-react') || 
                id.includes('@fortawesome')) {
              return 'vendor-icons';
            }
            
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            
            // Default vendor chunk for other node_modules
            return 'vendor';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
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
      'recharts'
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
