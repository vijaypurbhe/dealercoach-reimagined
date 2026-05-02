import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
    // For local Firebase development: forward /api/* to the Firebase Functions emulator.
    // Update the project ID after `firebase use --add`.
    proxy: {
      "/api": {
        target:
          process.env.VITE_API_PROXY ??
          "http://127.0.0.1:5001/dealer-coach-ai/us-central1/api",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
