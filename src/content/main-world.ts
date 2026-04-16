// Content script — MAIN world.
//
// Runs in the same JS realm as the page itself (manifest
// content_scripts[].world = "MAIN", run_at = "document_start"). This
// is the only context that can see page-defined globals like
// window.__sage__ once the page initializes sage.
//
// Phase 0: stub only. Later this file will host the bridge that lets
// background scripts call into sage on the page.

console.log("[sage-extension] content-main (MAIN world) loaded");
