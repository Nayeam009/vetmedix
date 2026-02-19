import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // React aliases removed — dedupe handles deduplication correctly
    },
    // Belt-and-suspenders: dedupe so Vite's module graph deduplicates React
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  optimizeDeps: {
    // Pre-bundle these together so they share the same module instance in dev
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "@tanstack/react-query",
      "react-router-dom",
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries — single chunk guarantees one instance
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // React Query for data fetching
          'vendor-query': ['@tanstack/react-query'],
          // Date utilities
          'vendor-date': ['date-fns'],
          // Supabase client
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 600,
  },
}));
