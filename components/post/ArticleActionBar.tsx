"use client";

import { LikeButton } from "./LikeButton";
import { Button } from "@/components/ui/button";
import { MessageSquare, Share2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ArticleActionBarProps {
  postId: string;
  initialLikesCount: number;
  commentsCount: number;
}

export function ArticleActionBar({
  postId,
  initialLikesCount,
  commentsCount,
}: ArticleActionBarProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        toast.success("Article link copied to clipboard");
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleScrollToComments = () => {
    const el = document.getElementById("comments");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <LikeButton postId={postId} initialLikesCount={initialLikesCount} />

      <Button
        variant="outline"
        size="sm"
        onClick={handleScrollToComments}
        className="h-8 gap-2 rounded-full border border-border px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={`Jump to comments, ${commentsCount} comments`}
      >
        <MessageSquare className="size-3.5" />
        <span>{commentsCount}</span>
        <span className="sr-only">comments</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        className="h-8 gap-1.5 rounded-full border border-border px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Share article link"
      >
        {copied ? (
          <Check className="size-3.5 text-status-success" />
        ) : (
          <Share2 className="size-3.5" />
        )}
        <span className="hidden sm:inline">Share</span>
      </Button>
    </div>
  );
}
