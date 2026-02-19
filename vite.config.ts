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
    // resolve.dedupe ensures ALL packages that import react/react-dom/react/jsx-runtime
    // resolve to the EXACT same physical file on disk. This is the key guarantee:
    // even if esbuild creates two chunks, they import the same module instance.
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  optimizeDeps: {
    // CRITICAL FIX: Exclude react-dom from pre-bundling.
    //
    // Root cause of the duplicate-React crash:
    //   The Lovable Cloud infrastructure pre-warms node_modules/.vite with separate
    //   esbuild chunks for react (chunk-PMKBOVCG.js) and react-dom (chunk-LPF6KSF2.js).
    //   Each chunk has its OWN inlined ReactCurrentDispatcher closure variable.
    //   renderWithHooks (in react-dom's chunk) sets ITS dispatcher.current, but
    //   useState (in react's chunk) reads FROM A DIFFERENT dispatcher.current → null → CRASH.
    //
    // Why this exclude fix works:
    //   When react-dom is NOT pre-bundled, Vite serves it through its CJS transform
    //   pipeline. During that transform, react-dom's internal `require('react')` is
    //   resolved by Vite's module graph to the SAME pre-bundled react chunk (PMKBOVCG)
    //   that user code uses. This guarantees ONE shared ReactCurrentDispatcher object
    //   between react-dom's renderWithHooks and react's useState.
    exclude: ["react-dom", "react-dom/client"],
    include: [
      "react",
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
