"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { TagItem } from "@/lib/types";

interface TagRailProps {
  tags: (TagItem | string)[];
  activeTag?: string;
}

export function TagRail({ tags, activeTag }: TagRailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (!tags || tags.length === 0) {
    return null;
  }

  const handleSelectTag = (tag: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tag) {
      params.set("tag", tag);
    } else {
      params.delete("tag");
    }
    params.delete("cursor"); // Reset pagination on tag change
    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : "/");
  };

  const isAllActive = !activeTag;

  return (
    <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      <Button
        variant={isAllActive ? "default" : "outline"}
        size="sm"
        onClick={() => handleSelectTag(null)}
        className={`h-8 shrink-0 rounded-full text-xs font-medium transition-all ${
          isAllActive
            ? "bg-foreground text-background hover:bg-foreground/90"
            : "hover:bg-muted"
        }`}
      >
        All Articles
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
                ? "bg-accent-solid text-white hover:bg-accent-solid/90"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <span>#{tagName}</span>
            {typeof tagCount === "number" && tagCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-sans ${
                  isCurrent
                    ? "bg-white/20 text-white"
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
  );
}
