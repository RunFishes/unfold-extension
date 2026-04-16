import { resolve } from "node:path";
import { defineConfig } from "vite";

const rootDir = __dirname;

// content.js runs in the ISOLATED world of content scripts.
// Chrome content scripts cannot be ESM modules, so we build this as an IIFE.
// emptyOutDir: false because vite.config.ts has already run and emptied
// the dir; we just want to drop our file alongside sidebar.js / background.js.
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: resolve(rootDir, "src/content/index.ts"),
      name: "SageContentScript",
      formats: ["iife"],
      fileName: () => "content.js"
    }
  }
});
