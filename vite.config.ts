import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { devApiPlugin } from "./vite.dev-api";

const useEmulator = !!process.env.VITE_API_PROXY || process.env.USE_FIREBASE_EMULATOR === "1";

export default defineConfig({
  plugins: [react(), tailwindcss(), ...(useEmulator ? [] : [devApiPlugin()])],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
    // When running the Firebase Functions emulator locally, set VITE_API_PROXY
    // (or USE_FIREBASE_EMULATOR=1) to route /api/* there. Otherwise the in-process
    // dev plugin (vite.dev-api.ts) serves /api/* directly using LOVABLE_API_KEY.
    proxy: useEmulator
      ? {
          "/api": {
            target:
              process.env.VITE_API_PROXY ??
              "http://127.0.0.1:5001/dealer-coach-ai/us-central1/api",
            changeOrigin: true,
            rewrite: (p) => p.replace(/^\/api/, ""),
          },
        }
      : undefined,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
