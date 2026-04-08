import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // Animation library
          'vendor-animation': ['framer-motion'],

          // UI components (Radix)
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-tabs',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
          ],

          // Visualization libraries (heavy)
          'vendor-visualization': ['reactflow', 'dagre', 'recharts'],

          // Markdown and syntax highlighting
          'vendor-markdown': ['react-markdown'],
          'vendor-syntax': ['react-syntax-highlighter'],

          // State and data fetching
          'vendor-state': ['zustand', '@tanstack/react-query', 'axios'],

          // Form handling
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],

          // Date utilities
          'vendor-date': ['date-fns'],

          // Auth
          'vendor-auth': ['@clerk/clerk-react', '@clerk/themes'],
        },
      },
    },
    // Increase chunk size warning limit (optional)
    chunkSizeWarningLimit: 600,
  },
}));
