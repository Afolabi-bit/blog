import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-accent-solid shadow-xs">
        <BookOpen className="size-7" />
      </div>

      <span className="font-mono text-xs font-semibold uppercase tracking-widest text-accent-solid">
        404 — Not Found
      </span>

      <h1 className="mt-2 font-serif text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        Page or article not found
      </h1>

      <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
        The article, page, or resource you are looking for may have been removed,
        renamed, or is temporarily unavailable.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="outline" className="gap-2">
          <Link href="/">
            <ArrowLeft className="size-4" />
            <span>Back to articles</span>
          </Link>
        </Button>

        <Button asChild className="gap-2 bg-accent-solid text-white hover:bg-accent-solid/90">
          <Link href="/">
            <Home className="size-4" />
            <span>Home</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
