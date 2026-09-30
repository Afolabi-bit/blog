"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import axios from "axios";
import { postsEndpoints } from "@/lib/endpoints";
import { PostEditor } from "@/components/editor/PostEditor";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Post } from "@/lib/types";
import { ArrowLeft, AlertCircle } from "lucide-react";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const { id } = use(params);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    postsEndpoints
      .getPostById(id)
      .then((res) => {
        if (!isMounted) return;
        if (res.data) {
          setPost(res.data);
        } else {
          setError("Article not found or you don't have permission to edit it.");
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        let msg = "Failed to load article";
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

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl py-6 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col gap-4">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="lg:col-span-4">
            <Skeleton className="h-44 w-full rounded-xl" />
          </div>
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-md py-16 text-center flex flex-col items-center gap-4">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Cannot edit article</AlertTitle>
          <AlertDescription>{error || "Article not found"}</AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href="/dashboard" className="gap-2">
            <ArrowLeft className="size-4" />
            <span>Return to Studio</span>
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl py-2">
      <PostEditor initialPost={post} />
    </div>
  );
}
