"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Unhandled error loading page:", error);
  }, [error]);

  const handleTryAgain = () => {
    reset();
    router.refresh();
  };

  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-xs">
        <AlertCircle className="size-7" />
      </div>

      <span className="font-mono text-xs font-semibold uppercase tracking-widest text-destructive">
        Error
      </span>

      <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Something went wrong loading this page.
      </h1>

      <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
        An unexpected issue occurred while rendering this view. Try reloading or return home.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={handleTryAgain}
          className="gap-2 bg-accent-solid text-white hover:bg-accent-solid/90"
        >
          <RefreshCw className="size-4" />
          <span>Try again</span>
        </Button>

        <Button asChild variant="outline" className="gap-2">
          <Link href="/">
            <Home className="size-4" />
            <span>Go home</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
