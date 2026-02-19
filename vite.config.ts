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
    // Primary singleton guarantee: all imports of these packages resolve to ONE copy
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  optimizeDeps: {
    // force: true discards node_modules/.vite/deps/ on every server start.
    // Combined with the package reinstall (which changes the lock file hash),
    // this guarantees a single fresh esbuild pass that co-bundles react+react-dom
    // into chunks with matching internal ReactCurrentDispatcher references.
    force: true,
    esbuildOptions: {
      // This banner changes the CONTENT (and therefore the hash) of every
      // pre-bundled chunk. Any CDN or filesystem cache serving the old
      // chunk-TKA7E7G6.js?v=4112562a will miss, and fresh chunks are fetched.
      banner: {
        js: "/* vetmedix-react-dedup-v2 */",
      },
    },
    // All packages that import React must be listed so they're ALL processed
    // in a SINGLE esbuild invocation. esbuild then creates one shared chunk
    // for the React internals (ReactCurrentDispatcher) that every package uses.
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
