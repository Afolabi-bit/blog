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
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full border border-border/80 bg-background/95 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition-all animate-in fade-in slide-in-from-bottom-2"
    >
      <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-hidden="true" />
      <span>Connecting…</span>
    </div>
  );
}
