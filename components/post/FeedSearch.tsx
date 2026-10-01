"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Loader2 } from "lucide-react";

interface FeedSearchProps {
  initialSearch?: string;
}

export function FeedSearch({ initialSearch = "" }: FeedSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();

  // Keep input in sync if URL search param changes outside
  useEffect(() => {
    setQuery(initialSearch);
  }, [initialSearch]);

  // Debounced search update
  useEffect(() => {
    const trimmed = query.trim();
    const currentQ = searchParams.get("q") || searchParams.get("search") || "";

    if (trimmed === currentQ) return;

    const timeout = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (trimmed) {
          params.set("q", trimmed);
          params.delete("search");
          // Clear tag filter when user actively searches (per §M1.1 plan)
          params.delete("tag");
        } else {
          params.delete("q");
          params.delete("search");
        }
        params.delete("cursor");

        const qs = params.toString();
        router.push(qs ? `/?${qs}` : "/");
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, searchParams, router]);

  const handleClear = () => {
    setQuery("");
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("q");
      params.delete("search");
      params.delete("cursor");
      const qs = params.toString();
      router.push(qs ? `/?${qs}` : "/");
    });
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <label htmlFor="feed-search-input" className="sr-only">
          Search articles by title, tags, or content
        </label>
        <Search
          className="absolute left-3 size-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <Input
          id="feed-search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stories, topics, tags..."
          className="h-10 pl-9 pr-9 bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring text-sm rounded-full shadow-2xs transition-colors"
          aria-label="Search articles"
        />
        {isPending ? (
          <Loader2
            className="absolute right-3 size-4 text-muted-foreground animate-spin"
            aria-label="Searching..."
          />
        ) : query ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 size-7 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Clear search query"
          >
            <X className="size-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
