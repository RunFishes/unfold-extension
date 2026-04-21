/**
 * Content script — MAIN world.
 *
 * Runs in the same JS realm as the page itself (manifest
 * content_scripts[].world = "MAIN", run_at = "document_start"). This
 * is the only context that can see page-defined globals like
 * window.__sage__.
 *
 * Responsibilities:
 * 1. Listen for SageBridgeRequest via window.postMessage
 * 2. Call window.__sage__[method](...args)
 * 3. Strip HTMLElement from results (they can't cross window.postMessage —
 *    structured clone throws DataCloneError on live DOM references)
 * 4. Post SageBridgeResponse back via window.postMessage
 *
 * The ISOLATED content script picks up the response.
 */

import {
  isBridgeRequest,
  type SageBridgeResponse,
} from "../bridge/protocol.ts";
import type { SageAPI } from "sage";

// Extend Window to describe the sage API the page installs via initSage().
// Using sage's own SageAPI type keeps this in sync — when sage adds methods
// (registerTool, call, highlight, etc.), this will pick them up automatically.
declare global {
  interface Window {
    __sage__?: SageAPI;
    __sage_bridge_ready__?: boolean;
  }
}

// Guard against double-injection: if this script runs twice for the same
// page (can happen if background reinjects), we don't want two listeners.
if (!window.__sage_bridge_ready__) {
  window.__sage_bridge_ready__ = true;

  window.addEventListener("message", (event) => {
    // Only accept messages from the same window (not from embedded iframes
    // or cross-origin sources)
    if (event.source !== window) return;
    if (!isBridgeRequest(event.data)) return;

    const request = event.data;
    const response = dispatchAndStrip(request.id, request.method, request.args);

    // Post back — the ISOLATED content script is listening on the same window
    window.postMessage(response, "*");
  });

  console.log("[sage-extension] content-main (MAIN world) bridge ready");
}

/**
 * Call the requested method on window.__sage__, then strip any DOM
 * references from the result so it can cross postMessage.
 */
function dispatchAndStrip(
  id: number,
  method: string,
  args: unknown[]
): SageBridgeResponse {
  const sage = window.__sage__;
  if (!sage) {
    return {
      __sage_bridge__: "response",
      id,
      ok: false,
      error: "window.__sage__ not initialized — page has not called initSage()",
    };
  }

  const fn = (sage as unknown as Record<string, unknown>)[method];
  if (typeof fn !== "function") {
    return {
      __sage_bridge__: "response",
      id,
      ok: false,
      error: `Unknown sage method: ${method}`,
    };
  }

  try {
    const raw = (fn as (...a: unknown[]) => unknown).apply(sage, args);
    const clean = stripDomReferences(raw);
    return { __sage_bridge__: "response", id, ok: true, result: clean };
  } catch (error) {
    return {
      __sage_bridge__: "response",
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Recursively remove `element` fields (HTMLElement references) from a value
 * so it can be serialized by structured clone (window.postMessage).
 *
 * Why this is needed:
 * - SageNode has `element: HTMLElement` for direct DOM access by click/fill
 * - HTMLElement is NOT structured-cloneable → postMessage throws DataCloneError
 * - The bridge only needs data,not the live element — click/fill happen
 *   in MAIN world where the original reference is still valid
 */
function stripDomReferences(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;

  // Arrays: strip each item
  if (Array.isArray(value)) {
    return value.map(stripDomReferences);
  }

  // HTMLElement / Node: drop it (replace with marker)
  if (value instanceof Element || value instanceof Node) {
    return undefined;
  }

  // Plain object: strip each field, drop `element` explicitly
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (key === "element") continue; // always skip, even if not an Element instance
    out[key] = stripDomReferences(val);
  }
  return out;
}
