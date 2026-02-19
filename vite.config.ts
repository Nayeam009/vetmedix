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
    },
    // Deduplicate React so all imports share a single module instance.
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
    ],
  },
  optimizeDeps: {
    // EXCLUDE React from Vite's esbuild pre-bundler entirely.
    //
    // Why: Vite's dep optimizer has been creating two separate pre-bundled chunks
    // for react (chunk-PMKBOVCG) and react-dom (chunk-TKA7E7G6) with different
    // content hashes, causing "Cannot read properties of null (reading 'useState')".
    //
    // When React is EXCLUDED, Vite serves it directly from node_modules without
    // creating .vite/deps/ chunks. There is no chunk, so there can be no stale
    // chunk, and no version-hash mismatch. resolve.dedupe above handles the
    // singleton guarantee at the module-graph level.
    exclude: ["react", "react-dom", "react/jsx-runtime"],
    // Pre-bundle all other packages normally
    include: [
      "@tanstack/react-query",
      "react-router-dom",
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
      "@supabase/supabase-js",
      "date-fns",
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
          "vendor-query": ["@tanstack/react-query"],
          "vendor-date": ["date-fns"],
          "vendor-supabase": ["@supabase/supabase-js"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
}));
