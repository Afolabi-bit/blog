"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected errors for telemetry
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-xs">
        <AlertCircle className="size-7" />
      </div>

      <span className="font-mono text-xs font-semibold uppercase tracking-widest text-destructive">
        Application Error
      </span>

      <h1 className="mt-2 font-serif text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        Something went wrong
      </h1>

      <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
        An unexpected error occurred while loading this page. You can try refreshing
        the component or return home.
      </p>

      {error.message && process.env.NODE_ENV !== "production" && (
        <div className="mt-4 max-w-lg rounded-lg border border-border bg-muted/40 p-3 text-left font-mono text-xs text-muted-foreground overflow-x-auto">
          {error.message}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => reset()} className="gap-2 bg-accent-solid text-white hover:bg-accent-solid/90">
          <RefreshCw className="size-4" />
          <span>Try again</span>
        </Button>

        <Button asChild variant="outline" className="gap-2">
          <Link href="/">
            <Home className="size-4" />
            <span>Return to Home</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
