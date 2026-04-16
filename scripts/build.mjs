import { spawn } from "node:child_process";

// We have three separate vite configs that must run in order:
// 1. vite.config.ts        — sidebar + background (empties dist/ first)
// 2. vite.content.config.ts       — content.js (appends)
// 3. vite.content-main.config.ts  — content-main.js (appends)
//
// In --watch mode, all three run in parallel so edits to any file
// rebuild the right bundle.

const mode = process.argv.includes("--watch") ? "watch" : "build";
const configs = [
  "vite.config.ts",
  "vite.content.config.ts",
  "vite.content-main.config.ts"
];

function runBuild(config) {
  return new Promise((resolvePromise, rejectPromise) => {
    const args = ["vite", "build", "--config", config];
    if (mode === "watch") {
      args.push("--watch", "--mode", "development");
    }

    const child = spawn("npx", args, {
      stdio: "inherit",
      shell: process.platform === "win32"
    });

    if (mode === "watch") {
      resolvePromise(child);
      return;
    }

    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise(undefined);
        return;
      }
      rejectPromise(new Error(`Build failed for ${config} with exit code ${code}`));
    });
  });
}

if (mode === "watch") {
  const children = await Promise.all(configs.map((config) => runBuild(config)));

  const shutdown = () => {
    for (const child of children) {
      child.kill("SIGINT");
    }
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Block forever — the children keep running until killed.
  await new Promise(() => {});
} else {
  for (const config of configs) {
    await runBuild(config);
  }
}
