import { BlogPostCard } from "@/components/general/BlogPostCard";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { postsEndpoints } from "@/lib/endpoints";
import type { Post } from "@/lib/types";

export const revalidate = 60;

async function getPosts(): Promise<Post[]> {
  try {
    const data = await postsEndpoints.getPosts({ limit: 12 });
    return data.data?.posts ?? [];
  } catch {
    return [];
  }
}

export default async function Home() {
  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Latest posts</h1>
      <Suspense fallback={<BlogPostsGridSkeleton />}>
        <BlogPosts />
      </Suspense>
    </div>
  );
}

async function BlogPosts() {
  const posts = await getPosts();

  if (posts.length === 0) {
    return (
      <p className="text-gray-500 text-sm">
        No posts yet. Be the first to write one!
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {posts.map((post) => (
        <BlogPostCard key={post.id} data={post} />
      ))}
    </div>
  );
}

function BlogPostsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border bg-card text-card-foreground shadow-sm h-[400px] flex flex-col overflow-hidden"
        >
          <Skeleton className="h-48 w-full rounded-none" />
          <div className="p-4 flex-1 flex flex-col gap-3">
            <Skeleton className="h-6 w-3/4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="mt-auto flex items-center justify-between pt-4">
              <div className="flex items-center">
                <Skeleton className="h-8 w-8 rounded-full mr-2" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
