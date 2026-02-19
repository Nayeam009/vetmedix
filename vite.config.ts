import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
// Rebuild token: 20260219-C — forces fresh dep optimization pass
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
    // Sole deduplication mechanism: ensures all React imports share one instance
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  optimizeDeps: {
    // force: true busts the .vite/deps/ cache on every server start
    force: true,
    // All React packages + their heavy consumers in one esbuild pass.
    // Listing them together guarantees esbuild creates shared chunks,
    // not separate chunks with diverging internal references.
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
