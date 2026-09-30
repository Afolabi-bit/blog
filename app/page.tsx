import { Suspense } from "react";
import { BlogPostCard } from "@/components/general/BlogPostCard";
import { FeaturedPostHero } from "@/components/post/FeaturedPostHero";
import { TagRail } from "@/components/post/TagRail";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { postsEndpoints } from "@/lib/endpoints";
import Link from "next/link";
import { PenSquare, BookOpen } from "lucide-react";

export const revalidate = 60;

interface PageProps {
  searchParams: Promise<{ tag?: string; search?: string; cursor?: string }>;
}

async function getPostsData(tag?: string, search?: string) {
  try {
    const data = await postsEndpoints.getPosts({
      tag: tag || undefined,
      search: search || undefined,
      limit: 12,
    });
    return data.data?.posts ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const activeTag = params.tag;
  const activeSearch = params.search;

  return (
    <div className="py-4">
      <Suspense fallback={<FeedSkeleton />}>
        <FeedContent activeTag={activeTag} activeSearch={activeSearch} />
      </Suspense>
    </div>
  );
}

async function FeedContent({
  activeTag,
  activeSearch,
}: {
  activeTag?: string;
  activeSearch?: string;
}) {
  const posts = await getPostsData(activeTag, activeSearch);

  // Extract unique tags from loaded posts, plus canonical tags
  const defaultTags = ["golang", "react", "architecture", "typescript", "systems", "web"];
  const dynamicTags = Array.from(
    new Set(posts.flatMap((p) => p.tags || [])),
  ).filter(Boolean);
  const combinedTags = Array.from(new Set([...dynamicTags, ...defaultTags])).slice(0, 8);

  const hasFilter = Boolean(activeTag || activeSearch);
  const leadPost = !hasFilter && posts.length > 0 ? posts[0] : null;
  const gridPosts = !hasFilter && posts.length > 0 ? posts.slice(1) : posts;

  return (
    <div>
      {/* Featured Lead Story (shown when browsing root feed without filters) */}
      {leadPost && <FeaturedPostHero post={leadPost} />}

      {/* Section Header & Tag Filter Rail */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {activeTag
              ? `Articles tagged #${activeTag}`
              : activeSearch
                ? `Results for "${activeSearch}"`
                : "Latest Articles"}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Discover in-depth engineering breakdowns, patterns, and essays.
          </p>
        </div>

        <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex gap-1.5 h-8">
          <Link href="/dashboard">
            <PenSquare className="size-3.5 text-accent-solid" />
            <span>Write an article</span>
          </Link>
        </Button>
      </div>

      <TagRail tags={combinedTags} activeTag={activeTag} />

      {/* Empty State */}
      {posts.length === 0 && (
        <div className="my-12 rounded-xl border border-dashed border-border bg-card/60 p-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
            <BookOpen className="size-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-foreground">
            No articles found
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
            {activeTag
              ? `There are no published articles with the tag #${activeTag} yet.`
              : "No published articles available at this time."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {hasFilter && (
              <Button asChild variant="outline" size="sm">
                <Link href="/">Clear tag filter</Link>
              </Button>
            )}
            <Button asChild size="sm" className="bg-accent-solid text-white hover:bg-accent-solid/90">
              <Link href="/dashboard">Create first post</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Post Grid */}
      {gridPosts.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {gridPosts.map((post, idx) => (
            <BlogPostCard key={post.id} data={post} priority={idx < 2} />
          ))}
        </div>
      )}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      {/* Featured hero skeleton */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[340px]">
        <Skeleton className="h-[280px] lg:h-full lg:col-span-7 rounded-none" />
        <div className="p-8 lg:col-span-5 flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-8 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex flex-col gap-1.5 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid skeletons */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-xl border border-border bg-card overflow-hidden h-[380px]"
          >
            <Skeleton className="h-48 w-full rounded-none" />
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-6 w-5/6" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-6 rounded-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
