# sage-extension

Chrome extension (MV3) that drives [sage](../sage/) — a browser AI agent
for annotated SaaS pages.

## Status

Phase 0 — scaffolding only. Extension loads, sidebar shows "Hello Sage",
background / content scripts log a single line. Nothing else works yet.

## Scripts

```bash
npm install
npm run typecheck   # tsc --noEmit
npm run build       # typecheck + vite build (3 entries)
npm run dev         # vite watch mode
```

## Loading into Chrome

1. `npm install && npm run build`
2. Open `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** → select the `dist/` directory
5. Pin the "Sage AI Agent" icon to the toolbar
6. Click it → side panel opens → should show "Hello Sage"

## Architecture (multi-entry build)

Three separate vite configs, because Chrome extension entry points have
different runtime requirements:

| Config | Entry | Output | World |
|---|---|---|---|
| `vite.config.ts` | `sidebar.html` + `src/background/index.ts` | `sidebar.js` + `background.js` | sidebar iframe / service worker |
| `vite.content.config.ts` | `src/content/index.ts` | `content.js` (IIFE) | content script ISOLATED |
| `vite.content-main.config.ts` | `src/content/main-world.ts` | `content-main.js` (IIFE) | content script MAIN |

`scripts/build.mjs` runs all three in sequence (or in parallel with
`--watch`). Content scripts must be IIFE because Chrome content scripts
cannot be ESM modules.
