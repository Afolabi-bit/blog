import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-accent-solid shadow-xs">
        <BookOpen className="size-7" />
      </div>

      <span className="font-mono text-xs font-semibold uppercase tracking-widest text-accent-solid">
        404
      </span>

      <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Page not found.
      </h1>

      <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
        The page you are looking for doesn&apos;t exist, was moved, or is temporarily unavailable.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button asChild className="gap-2 bg-accent-solid text-white hover:bg-accent-solid/90">
          <Link href="/">
            <Home className="size-4" />
            <span>Go home</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
