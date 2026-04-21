import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "../components/ui/button.tsx";
import type {
  BackgroundToSidebar,
  SidebarToBackground,
} from "../bridge/protocol.ts";

export function App() {
  const [output, setOutput] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  async function testScan() {
    setIsLoading(true);
    setOutput("Scanning...");

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        setOutput("No active tab found");
        return;
      }

      const request: SidebarToBackground = {
        type: "SAGE_CALL",
        tabId: tab.id,
        method: "scan",
        args: [],
      };

      const response = (await chrome.runtime.sendMessage(request)) as BackgroundToSidebar;

      if (!response?.ok) {
        setOutput(`Error: ${response?.error ?? "unknown"}`);
        return;
      }

      const result = response.result as { text?: string } | undefined;
      setOutput(result?.text ?? JSON.stringify(response.result, null, 2));
    } catch (error) {
      setOutput(`Exception: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-lg font-semibold">Sage AI</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Phase 0 — bridge test. Open a page that calls{" "}
        <code className="rounded bg-muted px-1">initSage()</code>, then click below.
      </p>

      <Button onClick={testScan} disabled={isLoading} className="mt-4">
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" />
            Scanning...
          </>
        ) : (
          "Test Bridge — scan current page"
        )}
      </Button>

      <pre className="mt-4 max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-md border bg-muted p-3 text-xs text-foreground">
        {output || "// click above to test"}
      </pre>
    </div>
  );
}
