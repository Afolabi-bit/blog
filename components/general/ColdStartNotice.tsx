"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function ColdStartNotice() {
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    function handleColdStart(e: Event) {
      const customEvent = e as CustomEvent<{ waking: boolean }>;
      setWaking(Boolean(customEvent.detail?.waking));
    }

    window.addEventListener("bloggr:cold-start", handleColdStart);
    return () => {
      window.removeEventListener("bloggr:cold-start", handleColdStart);
    };
  }, []);

  if (!waking) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-2.5 text-xs text-card-foreground shadow-md transition-all animate-in fade-in slide-in-from-bottom-2"
    >
      <Loader2 className="size-3.5 animate-spin text-accent-solid" />
      <span>Connecting to server (waking up free-tier backend)…</span>
    </div>
  );
}
