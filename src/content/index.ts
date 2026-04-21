/**
 * Content script — ISOLATED world.
 *
 * Runs in the extension's isolated JS realm. Has access to chrome.*
 * APIs but CANNOT see page globals like window.__sage__. Its job is
 * to bridge between:
 *   - chrome.runtime messages from the background service worker
 *   - window.postMessage messages to/from the MAIN world script
 *
 * Flow for a bridge call:
 *   1. Background sends BackgroundToContent message via chrome.tabs.sendMessage
 *   2. This script wraps it as SageBridgeRequest and posts via window.postMessage
 *   3. main-world.ts receives the request, calls window.__sage__[method]
 *   4. main-world.ts posts SageBridgeResponse back via window.postMessage
 *   5. This script picks up the response and returns it via sendResponse
 */

import {
  isBridgeResponse,
  type BackgroundToContent,
  type SageBridgeRequest,
  type SageBridgeResponse,
} from "../bridge/protocol.ts";

/**
 * Each outgoing request gets a numeric ID. When the MAIN world replies
 * with the same ID, we resolve the pending promise. Required because
 * window.postMessage is broadcast-style — without IDs, concurrent calls
 * would all see each other's responses.
 */
let nextRequestId = 0;
const pendingRequests = new Map<
  number,
  (response: SageBridgeResponse) => void
>();

// Listen for responses from MAIN world
window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (!isBridgeResponse(event.data)) return;

  const response = event.data;
  const resolve = pendingRequests.get(response.id);
  if (!resolve) return; // stale or unknown response

  pendingRequests.delete(response.id);
  resolve(response);
});

/**
 * Send a request to MAIN world and wait for the matching response.
 */
function callMainWorld(
  method: BackgroundToContent["method"],
  args: unknown[]
): Promise<SageBridgeResponse> {
  const id = ++nextRequestId;
  return new Promise((resolve) => {
    pendingRequests.set(id, resolve);
    const request: SageBridgeRequest = {
      __sage_bridge__: "request",
      id,
      method,
      args,
    };
    window.postMessage(request, "*");
  });
}

// Listen for SAGE_CALL from background service worker
chrome.runtime.onMessage.addListener(
  (message: BackgroundToContent, _sender, sendResponse) => {
    if (message.type !== "SAGE_CALL") return undefined;

    void callMainWorld(message.method, message.args).then((response) => {
      sendResponse(response);
    });

    // Return true to keep the message channel open for async response
    return true;
  }
);

console.log("[sage-extension] content (ISOLATED) bridge ready");
