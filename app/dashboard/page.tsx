import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { BlogPostCard } from "@/components/general/BlogPostCard";
import { getServerSession, getAccessToken } from "@/lib/auth";
import type { Post, ApiResponse, PostsResponse } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function getMyPosts(token: string): Promise<Post[]> {
  const res = await fetch(`${API_URL}/api/posts/author/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) return [];
  const json: ApiResponse<PostsResponse> = await res.json();
  return json.data?.posts ?? [];
}

export default async function DashboardPage() {
  const user = await getServerSession();
  if (!user) redirect("/login");

  const token = await getAccessToken();
  const posts = await getMyPosts(token!);

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Your articles</h2>
        {(user.role === "author" || user.role === "admin") && (
          <Link className={buttonVariants()} href="/dashboard/create">
            + New post
          </Link>
        )}
      </div>

      {user.role === "reader" && (
        <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4">
          <p className="text-sm text-orange-800">
            You&apos;re currently a reader.{" "}
            <Link
              href="/settings/author-request"
              className="font-semibold underline"
            >
              Apply to become an author
            </Link>{" "}
            to start publishing.
          </p>
        </div>
      )}

      {posts.length === 0 ? (
        <p className="text-gray-500 text-sm">
          You haven&apos;t written any posts yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <BlogPostCard key={post.id} data={post} />
          ))}
        </div>
      )}
    </div>
  );
}
