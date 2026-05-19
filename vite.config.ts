import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: path.resolve(__dirname, "./client"),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
      "/app/src": path.resolve(__dirname, "./client/src"),
      "server": path.resolve(__dirname, "./server")
    }
  },
  build: {
    outDir: path.resolve(__dirname, "./dist/public"),
    emptyOutDir: true
  }
});
