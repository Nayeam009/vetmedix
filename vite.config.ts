import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Use a non-default cacheDir to bypass any infrastructure-level pre-warm
  // of node_modules/.vite. When Vite finds no cache here it re-bundles
  // from scratch using our optimizeDeps.entries config, guaranteeing
  // react + react-dom land in ONE esbuild chunk with a shared dispatcher.
  cacheDir: "node_modules/.vite-vetmedix",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // resolve.dedupe ensures ALL packages that import react/react-dom/react/jsx-runtime
    // resolve to the EXACT same physical file on disk. This is the key guarantee:
    // even if esbuild creates two chunks, they import the same module instance.
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  optimizeDeps: {
    // force: true busts the stale pre-bundle cache so the entries array
    // is actually respected and react + react-dom land in ONE esbuild chunk.
    force: true,
    // entries forces esbuild to process react + react-dom in ONE pass,
    // guaranteeing a single ReactCurrentDispatcher across all chunks.
    entries: ["src/lib/reactProxy.ts", "src/main.tsx"],
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
          // All React runtime in ONE chunk — single ReactCurrentDispatcher in prod.
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
