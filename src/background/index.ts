// Background service worker entry point.
//
// Runs as an ESM module service worker (manifest.background.type = "module").
// Phase 0: just prove we're alive. No message handling, no side panel logic,
// no LLM calls — all that arrives in later phases.

console.log("[sage-extension] background alive");

// Open side panel when the toolbar icon is clicked.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => {
    console.error("[sage-extension] setPanelBehavior failed", error);
  });
