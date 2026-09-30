"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface TagRailProps {
  tags: string[];
  activeTag?: string;
}

export function TagRail({ tags, activeTag }: TagRailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

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
        className={`h-8 rounded-full text-xs font-medium transition-all ${
          isAllActive
            ? "bg-foreground text-background hover:bg-foreground/90"
            : "hover:bg-muted"
        }`}
      >
        All Articles
      </Button>

      {tags.map((tag) => {
        const isCurrent = activeTag?.toLowerCase() === tag.toLowerCase();
        return (
          <Button
            key={tag}
            variant={isCurrent ? "default" : "outline"}
            size="sm"
            onClick={() => handleSelectTag(tag)}
            className={`h-8 rounded-full font-mono text-xs transition-all ${
              isCurrent
                ? "bg-accent-solid text-white hover:bg-accent-solid/90"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            #{tag}
          </Button>
        );
      })}
    </div>
  );
}
