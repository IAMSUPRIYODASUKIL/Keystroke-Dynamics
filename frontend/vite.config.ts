/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Allow access through Microsoft Dev Tunnels (e.g. https://<id>-5173.<region>.devtunnels.ms)
    allowedHosts: [".devtunnels.ms"],
    // Same-origin API: the browser only talks to this server, which forwards /api to the
    // backend. Works identically on localhost and through a single dev tunnel (no CORS
    // preflights, no second tunnel to keep alive). 127.0.0.1 is explicit because the
    // backend binds IPv4 while Vite binds ::1, and "localhost" can resolve to either.
    proxy: {
      "/api": { target: "http://127.0.0.1:8000", changeOrigin: true },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
  },
});
