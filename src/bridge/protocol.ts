/**
 * Shared bridge protocol — types used across all 4 hops:
 *   Sidebar ←port→ Background ←chrome.tabs→ Content(ISOLATED) ←postMessage→ Content(MAIN) ←→ window.__sage__
 *
 * The `__sage_bridge__` discriminator lets us filter unrelated
 * postMessage events (other extensions, libraries, DevTools, etc).
 */

/** Sage API methods that can be called over the bridge. */
export type SageBridgeMethod = "scan" | "getNode" | "click" | "fill";

// ===== ISOLATED ↔ MAIN world (window.postMessage) =====

export interface SageBridgeRequest {
  __sage_bridge__: "request";
  /** Incrementing ID per content script, used to match request/response. */
  id: number;
  method: SageBridgeMethod;
  args: unknown[];
}

export interface SageBridgeResponse {
  __sage_bridge__: "response";
  id: number;
  ok: boolean;
  result?: unknown;
  error?: string;
}

// ===== Background ↔ Content (chrome.tabs.sendMessage) =====

export interface BackgroundToContent {
  type: "SAGE_CALL";
  method: SageBridgeMethod;
  args: unknown[];
}

// ===== Sidebar ↔ Background (chrome.runtime.sendMessage) =====

export interface SidebarToBackground {
  type: "SAGE_CALL";
  /** Which tab to operate on (resolved by sidebar before sending). */
  tabId: number;
  method: SageBridgeMethod;
  args: unknown[];
}

/** Background returns this to sidebar (via sendMessage callback). */
export interface BackgroundToSidebar {
  ok: boolean;
  result?: unknown;
  error?: string;
}

// ===== Type guards =====

export function isBridgeRequest(value: unknown): value is SageBridgeRequest {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<SageBridgeRequest>;
  return v.__sage_bridge__ === "request" && typeof v.id === "number";
}

export function isBridgeResponse(value: unknown): value is SageBridgeResponse {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<SageBridgeResponse>;
  return v.__sage_bridge__ === "response" && typeof v.id === "number";
}
