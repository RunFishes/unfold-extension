/**
 * Background service worker.
 *
 * Runs as an ESM module service worker. In Phase 0 + bridge phase, its
 * jobs are:
 *   1. Open the side panel when the toolbar icon is clicked
 *   2. Relay SAGE_CALL messages from the sidebar to the content script
 *      on the target tab (and relay responses back)
 *
 * The background is a pure relay for bridge calls — no business logic
 * here. All sage operations happen in the page's MAIN world, which is
 * reached through the ISOLATED content script.
 */

import type {
  BackgroundToContent,
  BackgroundToSidebar,
  SageBridgeResponse,
  SidebarToBackground,
} from "../bridge/protocol.ts";

console.log("[sage-extension] background alive");

// Open side panel when the toolbar icon is clicked
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => {
    console.error("[sage-extension] setPanelBehavior failed", error);
  });

// Relay SAGE_CALL messages from sidebar → content script on target tab
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const msg = message as SidebarToBackground;
  if (msg.type !== "SAGE_CALL") return undefined;

  const toContent: BackgroundToContent = {
    type: "SAGE_CALL",
    method: msg.method,
    args: msg.args,
  };

  // chrome.tabs.sendMessage returns a promise in MV3
  chrome.tabs
    .sendMessage(msg.tabId, toContent)
    .then((response: SageBridgeResponse | undefined) => {
      // Content script returned a SageBridgeResponse; unwrap into our
      // sidebar-facing shape.
      if (!response) {
        const reply: BackgroundToSidebar = {
          ok: false,
          error: "No response from content script",
        };
        sendResponse(reply);
        return;
      }
      const reply: BackgroundToSidebar = {
        ok: response.ok,
        result: response.result,
        error: response.error,
      };
      sendResponse(reply);
    })
    .catch((error: unknown) => {
      const reply: BackgroundToSidebar = {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
      sendResponse(reply);
    });

  // Keep the sidebar's sendMessage channel open for async response
  return true;
});
