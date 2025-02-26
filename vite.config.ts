
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
          // Core vendor dependencies
          'supabase-core': [
            '@supabase/supabase-js',
            '@supabase/postgrest-js',
            '@supabase/realtime-js'
          ],
          'supabase-auth': [
            '@supabase/auth-helpers-react',
            '@supabase/auth-ui-react',
            '@supabase/auth-ui-shared'
          ],
          'supabase-storage': [
            '@supabase/storage-js',
            '@supabase/functions-js'
          ],
          // UI components split by functionality
          'ui-core': [
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tooltip'
          ],
          'ui-overlays': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-toast'
          ],
          'ui-navigation': [
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-tabs'
          ],
          // Charts split by type
          'charts-core': [
            'recharts/es6/component/ResponsiveContainer',
            'recharts/es6/chart/LineChart',
            'recharts/es6/chart/BarChart'
          ],
          'charts-elements': [
            'recharts/es6/cartesian/Line',
            'recharts/es6/cartesian/Bar',
            'recharts/es6/cartesian/XAxis',
            'recharts/es6/cartesian/YAxis'
          ],
          // Icons and visual assets
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
      '@supabase/auth-helpers-react'
    ],
    esbuildOptions: {
      target: 'es2020',
      platform: 'browser',
      format: 'esm'
    }
  }
}));
