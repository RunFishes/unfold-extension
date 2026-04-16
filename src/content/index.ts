// Content script — ISOLATED world.
//
// This script runs in its own JS realm, isolated from the page's own
// variables. It can touch the DOM, but it CANNOT see window.__sage__
// (which lives in the page's MAIN world). Its job in later phases is
// to proxy messages between background (via chrome.runtime) and
// content-main.js (via window.postMessage).
//
// Phase 0: stub only.

console.log("[sage-extension] content (ISOLATED) loaded");
