import { Suspense } from "react";
import { FeaturedPostHero } from "@/components/post/FeaturedPostHero";
import { TagRail } from "@/components/post/TagRail";
import { FeedSearch } from "@/components/post/FeedSearch";
import { FeedList } from "@/components/post/FeedList";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { postsEndpoints } from "@/lib/endpoints";
import Link from "next/link";
import { PenSquare } from "lucide-react";
import type { Post, PaginationMeta } from "@/lib/types";

export const revalidate = 60;

interface PageProps {
  searchParams: Promise<{ tag?: string; search?: string; q?: string; cursor?: string }>;
}

async function getPostsData(
  tag?: string,
  search?: string
): Promise<{ posts: Post[]; pagination?: PaginationMeta }> {
  try {
    const data = await postsEndpoints.getPosts({
      tag: tag || undefined,
      search: search || undefined,
      limit: 12,
    });
    return {
      posts: data.data?.posts ?? [],
      pagination: data.data?.pagination,
    };
  } catch {
    return { posts: [], pagination: undefined };
  }
}

async function getFeaturedData(): Promise<Post | null> {
  try {
    const data = await postsEndpoints.getFeaturedPost();
    return data.data ?? null;
  } catch {
    // 404 means no post is currently featured - hide hero gracefully per FEED-2
    return null;
  }
}

async function getTagsData() {
  try {
    const data = await postsEndpoints.getTags();
    return data.data?.tags ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const activeTag = params.tag;
  const activeSearch = params.q || params.search;

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
  const hasFilter = Boolean(activeTag || activeSearch);

  const [postsResult, featuredPost, tagsData] = await Promise.all([
    getPostsData(activeTag, activeSearch),
    !hasFilter ? getFeaturedData() : Promise.resolve(null),
    getTagsData(),
  ]);

  const { posts, pagination } = postsResult;

  // Use tags from /api/tags, fallback to unique post tags if tags endpoint returns empty
  const tags =
    tagsData.length > 0
      ? tagsData
      : Array.from(new Set(posts.flatMap((p) => p.tags || []))).map((t) => ({
          name: t,
          count: 0,
        }));

  // If featuredPost is rendered, omit it from the grid below to avoid immediate duplicate
  const gridPosts =
    featuredPost && !hasFilter
      ? posts.filter((p) => p.id !== featuredPost.id)
      : posts;

  const hasFeaturedHero = Boolean(featuredPost && !hasFilter);

  return (
    <div>
      {/* Featured Lead Story (shown when browsing root feed without filters and a featured post exists) */}
      {hasFeaturedHero && featuredPost && <FeaturedPostHero post={featuredPost} />}

      {/* Section Header with single <h1>, Search bar & Write action */}
      <div className="mb-6 flex flex-col gap-4 border-b border-border/50 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {activeTag
              ? `Articles tagged #${activeTag}`
              : activeSearch
                ? `Results for "${activeSearch}"`
                : "Latest Articles"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            {activeSearch
              ? `Showing stories matching your search keyword.`
              : activeTag
                ? `Stories and essays tagged #${activeTag}.`
                : "Explore stories, essays, and perspectives from writers on any topic."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <FeedSearch initialSearch={activeSearch} />

          <Button
            asChild
            size="sm"
            variant="outline"
            className="hidden lg:inline-flex gap-1.5 h-10 px-4 rounded-full border-border hover:bg-muted font-medium text-xs shrink-0"
          >
            <Link href="/dashboard">
              <PenSquare className="size-3.5 text-accent-solid" />
              <span>Write</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Tag Filter Rail */}
      <div id="topics" className="scroll-mt-20">
        <TagRail tags={tags} activeTag={activeTag} />
      </div>

      {/* Paginated Feed List with Magazine Layout */}
      <FeedList
        initialPosts={gridPosts}
        initialPagination={pagination}
        hasFeaturedHero={hasFeaturedHero}
        activeTag={activeTag}
        activeSearch={activeSearch}
      />
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
