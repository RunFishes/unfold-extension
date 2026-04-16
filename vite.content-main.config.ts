import { resolve } from "node:path";
import { defineConfig } from "vite";

const rootDir = __dirname;

// content-main.js runs in the MAIN world (same JS realm as the page itself),
// injected via manifest.content_scripts[].world = "MAIN". This is the only
// script that can see page-defined globals like window.__sage__.
// Same IIFE build as content.js.
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: resolve(rootDir, "src/content/main-world.ts"),
      name: "SageMainWorld",
      formats: ["iife"],
      fileName: () => "content-main.js"
    }
  }
});
