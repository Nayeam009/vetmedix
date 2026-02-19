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
    force: true, // CRITICAL: busts stale dep cache, forces fresh single-instance bundle
    include: [
      "react",
      "react-dom",        // renderer must be in same esbuild pass as core
      "react/jsx-runtime",
      "@tanstack/react-query",
      "react-router-dom",
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // All React packages in ONE chunk — guarantees single instance in prod
          'vendor-react': ['react', 'react-dom', 'react/jsx-runtime', 'react-router-dom'],
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
