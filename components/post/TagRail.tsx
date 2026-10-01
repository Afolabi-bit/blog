"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { TagItem } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TagRailProps {
  tags: (TagItem | string)[];
  activeTag?: string;
}

export function TagRail({ tags, activeTag }: TagRailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [tags]);

  if (!tags || tags.length === 0) {
    return null;
  }

  const handleSelectTag = (tag: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tag) {
      params.set("tag", tag);
      // Clear search when selecting a tag per M1.1
      params.delete("q");
      params.delete("search");
    } else {
      params.delete("tag");
    }
    params.delete("cursor");
    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : "/");
  };

  const scrollBy = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const isAllActive = !activeTag;

  return (
    <div className="relative mb-8 group/rail">
      {/* Optional Left Scroll Control */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollBy(-180)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex size-7 items-center justify-center rounded-full bg-background/90 border border-border shadow-xs text-foreground hover:bg-muted focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring transition-opacity"
          aria-label="Scroll topics left"
        >
          <ChevronLeft className="size-4" />
        </button>
      )}

      {/* Tag Pills Container */}
      <div
        ref={scrollRef}
        role="region"
        aria-label="Filter stories by topic"
        tabIndex={0}
        className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
      >
        <Button
          variant={isAllActive ? "default" : "outline"}
          size="sm"
          onClick={() => handleSelectTag(null)}
          className={`h-8 shrink-0 rounded-full text-xs font-medium transition-all ${
            isAllActive
              ? "bg-foreground text-background hover:bg-foreground/90 font-semibold shadow-2xs"
              : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          All Topics
        </Button>

        {tags.map((item) => {
          const tagName = typeof item === "string" ? item : item.name;
          const tagCount = typeof item === "string" ? undefined : item.count;
          const isCurrent = activeTag?.toLowerCase() === tagName.toLowerCase();

          return (
            <Button
              key={tagName}
              variant={isCurrent ? "default" : "outline"}
              size="sm"
              onClick={() => handleSelectTag(tagName)}
              className={`h-8 shrink-0 rounded-full font-mono text-xs transition-all gap-1.5 ${
                isCurrent
                  ? "bg-accent-solid text-white hover:bg-accent-solid/90 shadow-2xs font-semibold"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <span>#{tagName}</span>
              {typeof tagCount === "number" && tagCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-sans tabular-nums ${
                    isCurrent
                      ? "bg-white/20 text-white font-medium"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tagCount}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Right Peek Gradient & Scroll Control */}
      {canScrollRight && (
        <>
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-1.5 w-12 bg-linear-to-l from-background to-transparent"
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={() => scrollBy(180)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex size-7 items-center justify-center rounded-full bg-background/90 border border-border shadow-xs text-foreground hover:bg-muted focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring transition-opacity"
            aria-label="Scroll topics right"
          >
            <ChevronRight className="size-4" />
          </button>
        </>
      )}
    </div>
  );
}
