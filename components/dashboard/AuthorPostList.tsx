"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { toast } from "sonner";
import { postsEndpoints } from "@/lib/endpoints";
import { buttonVariants } from "@/components/ui/button";
import type { Post } from "@/lib/types";

interface AuthorPostListProps {
  initialPosts: Post[];
}

export function AuthorPostList({ initialPosts }: AuthorPostListProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (post: Post) => {
    if (!confirm(`Are you sure you want to delete "${post.title}"?`)) return;

    setDeletingId(post.id);
    const toastId = toast.loading("Deleting post...");

    try {
      const res = await postsEndpoints.deletePost(post.id);
      if (res.status === "success") {
        toast.success("Post deleted successfully", { id: toastId });
        setPosts((prev) => prev.filter((p) => p.id !== post.id));
      } else {
        toast.error(res.message || "Failed to delete post", { id: toastId });
      }
    } catch (err: unknown) {
      let msg = "Failed to delete post";
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || err.message || msg;
      }
      toast.error(msg, { id: toastId });
    } finally {
      setDeletingId(null);
    }
  };

  if (posts.length === 0) {
    return (
      <div className="py-12 border-2 border-dashed border-gray-200 rounded-xl text-center">
        <p className="text-gray-500 text-sm mb-4">
          You haven&apos;t written any posts yet.
        </p>
        <Link className={buttonVariants()} href="/dashboard/create">
          Write your first post
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <div
          key={post.id}
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
        >
          <div>
            <div className="relative h-44 w-full overflow-hidden bg-gray-100">
              {post.cover_image ? (
                <Image
                  src={post.cover_image}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm bg-gray-50">
                  No cover image
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute top-3 right-3">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm ${
                    post.status === "published"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {post.status === "published" ? "Published" : "Draft"}
                </span>
              </div>
            </div>

            <div className="p-4">
              <Link href={`/post/${post.slug}`}>
                <h3 className="mb-2 text-base font-bold text-gray-900 line-clamp-1 hover:text-[#ef862b] transition-colors">
                  {post.title}
                </h3>
              </Link>
              <p className="mb-3 text-xs text-gray-600 line-clamp-2 leading-relaxed">
                {post.content}
              </p>

              {post.tags?.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 pt-0 border-t border-gray-100 mt-2">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-3 pt-3">
              <time>
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }).format(new Date(post.created_at))}
              </time>
              <div className="flex items-center gap-3">
                <span>{post.likes_count ?? 0} likes</span>
                <span>{post.comments_count ?? 0} comments</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/post/${post.slug}`}
                className={buttonVariants({ variant: "outline", size: "sm" }) + " flex-1 text-xs"}
              >
                View
              </Link>
              <Link
                href={`/dashboard/edit/${post.id}`}
                className={buttonVariants({ variant: "secondary", size: "sm" }) + " flex-1 text-xs"}
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(post)}
                disabled={deletingId === post.id}
                className="px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md border border-red-200 transition-colors disabled:opacity-50"
              >
                {deletingId === post.id ? "..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
