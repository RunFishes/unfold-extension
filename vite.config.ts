import { cpSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = __dirname;

// Copy non-bundled static files (manifest etc.) into dist/ after the
// sidebar + background build finishes. Content scripts are built by
// separate vite configs; only the sidebar + background go through this one.
function copyStaticFiles() {
  return {
    name: "copy-static-files",
    writeBundle() {
      cpSync(resolve(rootDir, "manifest.json"), resolve(rootDir, "dist/manifest.json"));
    }
  };
}

export default defineConfig({
  plugins: [react(), copyStaticFiles()],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidebar: resolve(rootDir, "sidebar.html"),
        background: resolve(rootDir, "src/background/index.ts")
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  }
});
