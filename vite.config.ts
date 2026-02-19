import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
// Cache-bust: 2026-02-19T00:00:00Z — forces fresh dep optimization on restart
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Primary deduplication mechanism — all React imports resolve to one copy
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "@tanstack/react-query",
      "react-router-dom",
    ],
  },
  optimizeDeps: {
    // force: true discards node_modules/.vite/deps/ cache on every server start.
    // This permanently prevents stale chunks from being served alongside new ones.
    force: true,
    // Scan these entry points so ALL transitive React imports are discovered upfront.
    // Prevents Vite from doing a mid-session "discovered dependency" re-optimization
    // that would create a second React bundle with a different version hash.
    entries: [
      "src/main.tsx",
      "src/App.tsx",
    ],
    // Pre-bundle React core + renderer + JSX transform in a single esbuild pass.
    // Every package listed here (and their transitive deps) shares ONE React instance.
    include: [
      // React core — must all be in the same pass
      "react",
      "react-dom",
      "react/jsx-runtime",
      // Routing
      "react-router-dom",
      // Data fetching
      "@tanstack/react-query",
      // UI libraries that import React (prevents lazy re-optimization)
      "react-hook-form",
      "@hookform/resolvers/zod",
      "react-day-picker",
      "embla-carousel-react",
      "recharts",
      "sonner",
      "cmdk",
      "vaul",
      "next-themes",
      "lucide-react",
      // Radix UI primitives (all import React)
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-collapsible",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-popover",
      "@radix-ui/react-progress",
      "@radix-ui/react-radio-group",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slot",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@radix-ui/react-tooltip",
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // All React packages in ONE chunk — guarantees single instance in prod
          "vendor-react": [
            "react",
            "react-dom",
            "react/jsx-runtime",
            "react-router-dom",
          ],
          // React Query for data fetching
          "vendor-query": ["@tanstack/react-query"],
          // Date utilities
          "vendor-date": ["date-fns"],
          // Supabase client
          "vendor-supabase": ["@supabase/supabase-js"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
}));
