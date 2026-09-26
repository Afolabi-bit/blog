"use client";

import { useEffect, useState, useTransition, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { postsEndpoints } from "@/lib/endpoints";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CoverUploader } from "@/components/editor/CoverUploader";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;
    postsEndpoints
      .getPostById(id)
      .then((res) => {
        if (!isMounted) return;
        const post = res.data;
        if (post) {
          setTitle(post.title || "");
          setContent(post.content || "");
          setCoverImage(post.cover_image || "");
          setTags(post.tags?.join(", ") || "");
          setStatus(post.status || "draft");
        } else {
          setError("Post not found");
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        let msg = "Failed to load post";
        if (axios.isAxiosError(err)) {
          msg = err.response?.data?.message || err.message || msg;
        }
        setError(msg);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    startTransition(async () => {
      try {
        const response = await postsEndpoints.updatePost(id, {
          title,
          content,
          cover_image: coverImage || undefined,
          status,
          tags: parsedTags,
        });

        toast.success(response.message || "Post updated successfully!");
        router.push("/dashboard");
        router.refresh();
      } catch (err: unknown) {
        let msg = "Failed to update post";
        if (axios.isAxiosError(err)) {
          msg =
            err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            msg;
        } else if (err instanceof Error) {
          msg = err.message;
        }
        setError(msg);
        toast.error(msg);
      }
    });
  }

  if (loading) {
    return (
      <div className="py-12 max-w-2xl mx-auto">
        <div className="h-8 w-48 bg-gray-100 rounded-md animate-pulse mb-6" />
        <div className="h-96 bg-gray-50 border border-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error && !title) {
    return (
      <div className="py-12 max-w-md mx-auto text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
        <p className="text-sm text-red-600 mb-6">{error}</p>
        <Link href="/dashboard" className={buttonVariants({ variant: "secondary" })}>
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Edit Post</CardTitle>
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Cancel
            </Link>
          </div>
          <CardDescription>Make updates to your article</CardDescription>
        </CardHeader>

        <CardContent>
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                name="content"
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Cover Image</Label>
              <CoverUploader
                value={coverImage}
                onChange={setCoverImage}
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                name="tags"
                type="text"
                placeholder="golang, web, architecture (comma-separated)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "draft" | "published")
                }
                disabled={isPending}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Link
                href="/dashboard"
                className={buttonVariants({ variant: "outline" })}
              >
                Cancel
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
