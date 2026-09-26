import Link from "next/link";
import { redirect } from "next/navigation";
import axios from "axios";
import { buttonVariants } from "@/components/ui/button";
import { BlogPostCard } from "@/components/general/BlogPostCard";
import { getServerSession, getAccessToken } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/client";
import type { Post, ApiResponse, PostsResponse } from "@/lib/types";

async function getMyPosts(token: string): Promise<Post[]> {
  try {
    const { data } = await axios.get<ApiResponse<PostsResponse>>(
      `${API_BASE_URL}/api/my-posts`,
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      },
    );
    return data.data?.posts ?? [];
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const user = await getServerSession();
  if (!user) redirect("/login");

  const token = await getAccessToken();
  const posts = token ? await getMyPosts(token) : [];

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
