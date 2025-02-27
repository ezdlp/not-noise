
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
      // Define explicit path to zod's index file rather than directory
      "zod": path.resolve("./node_modules/zod/lib/index.js"),
      "react": path.resolve("./node_modules/react"),
      "react-dom": path.resolve("./node_modules/react-dom"),
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
      '@hookform/resolvers',
      'framer-motion'
    ]
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 500,
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
          // Core React libraries
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') || 
              id.includes('node_modules/react/jsx-runtime') ||
              id.includes('node_modules/@radix-ui/react-primitive') ||
              id.includes('node_modules/@radix-ui/react-slot')) {
            return 'react-vendor';
          }
          
          // Animation libraries - Must include React in this chunk
          if (id.includes('node_modules/framer-motion/')) {
            return 'react-vendor'; // Changed from 'animation-vendor' to include with React
          }
          
          // Form related packages
          if (id.includes('node_modules/zod/') || 
              id.includes('node_modules/react-hook-form/') ||
              id.includes('node_modules/@hookform/resolvers/')) {
            return 'forms-vendor';
          }
          
          // Supabase related packages
          if (id.includes('node_modules/@supabase/')) {
            return 'supabase-vendor';
          }
          
          // Lucide Icons - split into a separate chunk
          if (id.includes('node_modules/lucide-react/')) {
            return 'icons-vendor';
          }
          
          // UI Components - Radix UI
          if (id.includes('node_modules/@radix-ui/') && !id.includes('react-primitive') && !id.includes('react-slot')) {
            return 'ui-components-vendor';
          }
          
          // Date related libraries
          if (id.includes('node_modules/date-fns/')) {
            return 'date-vendor';
          }
          
          // Chart related libraries
          if (id.includes('node_modules/recharts/')) {
            return 'charts-vendor';
          }
          
          // Rich Text Editor - TipTap and related packages
          if (id.includes('node_modules/@tiptap/') || 
              id.includes('node_modules/prosemirror-')) {
            return 'editor-vendor';
          }
          
          // Split admin components by feature
          if (id.includes('/src/components/admin/blog/RichTextEditor')) {
            return 'admin-editor';
          }
          
          if (id.includes('/src/components/admin/blog/PostEditor')) {
            return 'admin-post-editor';
          }
          
          if (id.includes('/src/components/admin/blog/')) {
            return 'admin-blog-components';
          }
          
          // Large pages should be split
          if (id.includes('/src/pages/admin/Content.tsx')) {
            return 'admin-content';
          }
          
          if (id.includes('/src/pages/admin/Users.tsx')) {
            return 'admin-users';
          }
          
          // Route-based code splitting
          if (id.includes('/src/pages/')) {
            const parts = id.split('/src/pages/')[1].split('/');
            if (parts.length > 0) {
              // Use first-level page directory as chunk name
              return `page-${parts[0].toLowerCase()}`;
            }
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
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
      '@supabase/ssr',
      'recharts',
      'date-fns',
      'lucide-react',
      'framer-motion',
      // Include all Radix UI components that use hooks
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-tabs'
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
    // Force zod to be processed correctly for SSR
    noExternal: ['zod', '@hookform/resolvers'],
    optimizeDeps: {
      disabled: false
    }
  }
}));
