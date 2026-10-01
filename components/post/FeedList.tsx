"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Post, PaginationMeta } from "@/lib/types";
import { BlogPostCard } from "@/components/general/BlogPostCard";
import { Button } from "@/components/ui/button";
import { postsEndpoints } from "@/lib/endpoints";
import { BookOpen, Loader2, ArrowDown } from "lucide-react";
import { toast } from "sonner";

interface FeedListProps {
  initialPosts: Post[];
  initialPagination?: PaginationMeta;
  hasFeaturedHero?: boolean;
  activeTag?: string;
  activeSearch?: string;
}

export function FeedList({
  initialPosts,
  initialPagination,
  hasFeaturedHero = false,
  activeTag,
  activeSearch,
}: FeedListProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [pagination, setPagination] = useState<PaginationMeta | undefined>(
    initialPagination
  );
  const [loading, setLoading] = useState(false);

  // Sync state if initial server props change (e.g. navigation / filter update)
  useEffect(() => {
    setPosts(initialPosts);
    setPagination(initialPagination);
  }, [initialPosts, initialPagination]);

  const handleLoadMore = async () => {
    if (!pagination?.next_cursor || loading) return;

    setLoading(true);
    try {
      const res = await postsEndpoints.getPosts({
        cursor: pagination.next_cursor,
        tag: activeTag || undefined,
        search: activeSearch || undefined,
        limit: 12,
      });

      if (res.data?.posts) {
        const newPosts = res.data.posts;
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const filteredNew = newPosts.filter((p) => !existingIds.has(p.id));
          return [...prev, ...filteredNew];
        });
      }

      if (res.data?.pagination) {
        setPagination(res.data.pagination);
      } else {
        setPagination((prev) => (prev ? { ...prev, has_next: false } : undefined));
      }
    } catch {
      toast.error("Failed to load more stories. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const hasFilter = Boolean(activeTag || activeSearch);

  if (posts.length === 0) {
    return (
      <div className="my-12 rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center shadow-2xs">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
          <BookOpen className="size-6" />
        </div>
        <h3 className="font-serif text-xl font-bold text-foreground">
          No stories found
        </h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
          {activeSearch
            ? `No articles matched your search for "${activeSearch}". Try another keyword or browse all topics.`
            : activeTag
              ? `There are no published articles with the tag #${activeTag} yet.`
              : "No published articles available at this time. Check back soon!"}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {hasFilter && (
            <Button asChild variant="outline" size="sm">
              <Link href="/">Clear all filters</Link>
            </Button>
          )}
          <Button asChild size="sm" className="bg-accent-solid text-white hover:bg-accent-solid/90">
            <Link href="/dashboard">Write a story</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Editorial layout variation:
  // When no featured hero is shown (e.g. search / tag active or no featured post exists),
  // make the first post a prominent lead story card.
  const shouldLead = !hasFeaturedHero && posts.length > 0;
  const leadPost = shouldLead ? posts[0] : null;
  const remainingPosts = shouldLead ? posts.slice(1) : posts;

  return (
    <div className="flex flex-col gap-8">
      {/* Post Grid with Magazine Layout */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {leadPost && (
          <BlogPostCard
            key={leadPost.id}
            data={leadPost}
            priority={true}
            variant="lead"
          />
        )}
        {remainingPosts.map((post, idx) => (
          <BlogPostCard
            key={post.id}
            data={post}
            priority={!leadPost && idx < 2}
            variant="default"
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {pagination?.has_next && (
        <div className="mt-8 flex justify-center pb-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handleLoadMore}
            disabled={loading}
            className="h-11 px-6 rounded-full border-border font-medium text-sm gap-2 text-foreground hover:bg-muted shadow-2xs transition-all hover:scale-102"
            aria-label="Load more articles"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin text-accent-solid" />
                <span>Loading more stories...</span>
              </>
            ) : (
              <>
                <span>Load more stories</span>
                <ArrowDown className="size-4 text-muted-foreground" />
              </>
            )}
          </Button>
        </div>
      )}

      {pagination && !pagination.has_next && posts.length > 6 && (
        <p className="text-center text-xs text-muted-foreground/80 py-4 font-serif italic">
          You have reached the end of the catalog.
        </p>
      )}
    </div>
  );
}
