
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
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    dedupe: [
      'zod', 
      'react-hook-form', 
      '@hookform/resolvers',
      'react', 
      'react-dom'
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
      external: [],
      output: {
        format: 'es',
        manualChunks: (id) => {
          // Handle specific packages
          if (id.includes('node_modules')) {
            if (id.includes('zod') || 
                id.includes('react-hook-form') || 
                id.includes('@hookform/resolvers')) {
              return 'vendor-forms';
            }
            
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            
            if (id.includes('@radix-ui')) {
              return 'vendor-radix';
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
