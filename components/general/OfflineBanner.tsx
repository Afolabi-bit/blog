"use client";

import { useState, useEffect } from "react";
import { WifiOff, X } from "lucide-react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setDismissed(false);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setDismissed(false);
    };

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-status-warning/95 px-4 py-2 text-xs font-medium text-foreground backdrop-blur-xs shadow-xs"
    >
      <div className="flex items-center gap-2 mx-auto">
        <WifiOff className="size-4 shrink-0 text-foreground" />
        <span>No internet connection. Some features won&apos;t work.</span>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss offline notice"
        className="rounded p-1 text-foreground/80 hover:text-foreground hover:bg-black/10 transition-colors"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
