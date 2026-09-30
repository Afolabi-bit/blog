import Link from "next/link";
import { redirect } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AuthorPostList } from "@/components/dashboard/AuthorPostList";
import { getServerSession, getAccessToken } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/client";
import type { Post, ApiResponse, PostsResponse } from "@/lib/types";
import { Plus, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Author Studio — Bloggr",
  description: "Manage your published stories and drafts",
};

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
    <div className="py-6 flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Author Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Write, publish, and track engagement across your articles.
          </p>
        </div>

        {(user.role === "author" || user.role === "admin") && (
          <Button asChild className="gap-2 bg-accent-solid text-white hover:bg-accent-solid/90">
            <Link href="/dashboard/create">
              <Plus className="size-4" />
              <span>New Article</span>
            </Link>
          </Button>
        )}
      </div>

      {user.role === "reader" && (
        <Alert className="border-accent-warm/30 bg-accent-warm/5">
          <Sparkles className="size-4 text-accent-warm" />
          <AlertTitle className="text-foreground font-semibold">
            Reader Account
          </AlertTitle>
          <AlertDescription className="text-muted-foreground text-sm">
            You are currently browsing as a reader.{" "}
            <Link
              href="/settings/author-request"
              className="font-medium text-accent-solid underline hover:opacity-80"
            >
              Apply to become an author
            </Link>{" "}
            to start publishing your own articles.
          </AlertDescription>
        </Alert>
      )}

      <AuthorPostList initialPosts={posts} />
    </div>
  );
}
