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
    // Primary singleton guarantee: all imports of these packages resolve to ONE copy.
    // This is the correct low-level fix — resolve.dedupe ensures a single module
    // instance regardless of how many packages import React.
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  optimizeDeps: {
    // DO NOT use force: true — it re-runs esbuild on every server start which
    // causes two-pass bundling and mismatched ReactCurrentDispatcher singletons.
    // DO NOT use esbuildOptions.banner — it changes chunk content hashes, causing
    // the browser to mix stale cached chunks with freshly built ones.
    // All React-consuming packages must be listed together so esbuild processes
    // them in ONE pass, producing a single shared React internals chunk.
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "@tanstack/react-query",
      "react-router-dom",
      "react-hook-form",
      "@hookform/resolvers/zod",
      "date-fns",
      "lucide-react",
      "sonner",
      "cmdk",
      "vaul",
      "next-themes",
      "recharts",
      "embla-carousel-react",
      "@supabase/supabase-js",
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // All React in ONE chunk — guarantees single instance in production
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
