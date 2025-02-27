
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
    }
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        format: 'es',
        manualChunks: {
          // Core vendor dependencies - grouped by major functionality
          'vendor-core': [
            '@supabase/supabase-js',
            '@supabase/postgrest-js',
            '@supabase/realtime-js',
            '@supabase/storage-js',
            '@supabase/functions-js',
            '@supabase/auth-helpers-react'
          ],
          'vendor-auth': [
            '@supabase/auth-ui-react',
            '@supabase/auth-ui-shared'
          ],
          // Form validation and handling
          'vendor-forms': [
            'zod',
            '@hookform/resolvers',
            'react-hook-form'
          ],
          // UI components in logical groups
          'ui-core': [
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-toast'
          ],
          'ui-navigation': [
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-tabs'
          ],
          // Charts as complete functionality units
          'charts': [
            'recharts',
            'recharts/es6/component/ResponsiveContainer',
            'recharts/es6/chart/LineChart',
            'recharts/es6/chart/BarChart',
            'recharts/es6/cartesian/Line',
            'recharts/es6/cartesian/Bar',
            'recharts/es6/cartesian/XAxis',
            'recharts/es6/cartesian/YAxis'
          ],
          // Icons and assets
          'icons': [
            'lucide-react', 
            '@fortawesome/react-fontawesome'
          ]
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
      '@supabase/supabase-js',
      '@supabase/postgrest-js',
      '@supabase/realtime-js',
      '@supabase/storage-js',
      '@supabase/functions-js',
      '@supabase/auth-helpers-react',
      'recharts',
      'zod',
      '@hookform/resolvers',
      'react-hook-form'
    ],
    esbuildOptions: {
      target: 'es2020',
      platform: 'browser',
      format: 'esm'
    }
  }
}));
