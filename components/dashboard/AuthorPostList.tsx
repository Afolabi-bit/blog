"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { toast } from "sonner";
import { postsEndpoints } from "@/lib/endpoints";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Post, AuthorStats } from "@/lib/types";
import {
  BookOpen,
  Edit3,
  ExternalLink,
  FileText,
  Heart,
  MessageSquare,
  PenSquare,
  Plus,
  Trash2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AuthorPostListProps {
  initialPosts: Post[];
  initialStats?: AuthorStats;
}

export function AuthorPostList({ initialPosts, initialStats }: AuthorPostListProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Stats calculation (use server stats from /api/my-posts/stats if available, fallback to client)
  const totalPostsCount = initialStats?.total_posts ?? posts.length;
  const publishedCount = initialStats?.published_posts ?? posts.filter((p) => p.status === "published").length;
  const draftCount = initialStats?.draft_posts ?? posts.filter((p) => p.status === "draft").length;
  const totalLikes = initialStats?.total_likes ?? posts.reduce((sum, p) => sum + (p.likes_count || 0), 0);
  const totalComments = initialStats?.total_comments ?? posts.reduce((sum, p) => sum + (p.comments_count || 0), 0);

  const publishedPosts = posts.filter((p) => p.status === "published");
  const draftPosts = posts.filter((p) => p.status === "draft");

  const filteredPosts =
    filter === "all"
      ? posts
      : filter === "published"
        ? publishedPosts
        : draftPosts;

  const confirmDelete = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    const toastId = toast.loading("Deleting post…");

    try {
      const res = await postsEndpoints.deletePost(postToDelete.id);
      if (res.status === "success") {
        toast.success("Post deleted successfully", { id: toastId });
        setPosts((prev) => prev.filter((p) => p.id !== postToDelete.id));
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
      setIsDeleting(false);
      setPostToDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card className="p-4 bg-card border-border shadow-2xs">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
            Total Articles
          </p>
          <p className="mt-1 text-2xl font-bold font-serif text-foreground">
            {totalPostsCount}
          </p>
        </Card>

        <Card className="p-4 bg-card border-border shadow-2xs">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
            Published
          </p>
          <p className="mt-1 text-2xl font-bold font-serif text-foreground">
            {publishedCount}
          </p>
        </Card>

        <Card className="p-4 bg-card border-border shadow-2xs">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
            Drafts
          </p>
          <p className="mt-1 text-2xl font-bold font-serif text-foreground">
            {draftCount}
          </p>
        </Card>

        <Card className="p-4 bg-card border-border shadow-2xs">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
            Total Likes
          </p>
          <p className="mt-1 text-2xl font-bold font-serif text-accent-warm">
            {totalLikes}
          </p>
        </Card>

        <Card className="p-4 bg-card border-border shadow-2xs col-span-2 sm:col-span-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
            Comments
          </p>
          <p className="mt-1 text-2xl font-bold font-serif text-foreground">
            {totalComments}
          </p>
        </Card>
      </div>

      {/* Filter Tabs & New Post CTA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter("all")}
            className={`h-8 text-xs font-medium ${
              filter === "all"
                ? "bg-muted text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({posts.length})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter("published")}
            className={`h-8 text-xs font-medium ${
              filter === "published"
                ? "bg-muted text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Published ({publishedPosts.length})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter("draft")}
            className={`h-8 text-xs font-medium ${
              filter === "draft"
                ? "bg-muted text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Drafts ({draftPosts.length})
          </Button>
        </div>

        <Button asChild size="sm" className="gap-1.5 bg-accent-solid text-white hover:bg-accent-solid/90">
          <Link href="/dashboard/create">
            <Plus className="size-4" />
            <span>New Article</span>
          </Link>
        </Button>
      </div>

      {/* Empty State */}
      {filteredPosts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
            <FileText className="size-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-foreground">
            {filter === "all"
              ? "You haven't written any articles yet"
              : `No ${filter} articles found`}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto mb-6">
            Share your knowledge, architectural insights, and engineering ideas
            with readers on Bloggr.
          </p>
          <Button asChild className="bg-accent-solid text-white hover:bg-accent-solid/90">
            <Link href="/dashboard/create" className="gap-2">
              <PenSquare className="size-4" />
              <span>Write your first article</span>
            </Link>
          </Button>
        </div>
      ) : (
        /* Post Cards Grid */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <Card
              key={post.id}
              className="flex flex-col justify-between overflow-hidden border border-border bg-card shadow-2xs transition-all hover:border-accent-solid/35 hover:shadow-xs"
            >
              <div>
                <div className="relative h-44 w-full overflow-hidden bg-muted/40">
                  {post.cover_image ? (
                    <Image
                      src={post.cover_image}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground/40 bg-secondary/40">
                      <BookOpen className="size-8" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge
                      variant={post.status === "published" ? "default" : "secondary"}
                      className={`text-[10px] font-mono uppercase tracking-wider font-semibold py-0.5 px-2 ${
                        post.status === "published"
                          ? "bg-status-success text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {post.status}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="p-4 pb-2">
                  <h3 className="font-serif text-lg font-bold tracking-tight text-foreground line-clamp-1">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <time dateTime={post.created_at}>
                      {formatDate(post.created_at)}
                    </time>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Heart className="size-3" />
                      {post.likes_count || 0}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="size-3" />
                      {post.comments_count || 0}
                    </span>
                  </div>
                </CardHeader>
              </div>

              {/* Actions Footer */}
              <CardFooter className="flex items-center justify-between border-t border-border/50 p-4 pt-3">
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                    <Link href={`/dashboard/edit/${post.id}`}>
                      <Edit3 className="size-3.5" />
                      <span>Edit</span>
                    </Link>
                  </Button>

                  {post.status === "published" && (
                    <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
                      <Link href={`/post/${post.slug}`} target="_blank">
                        <ExternalLink className="size-3.5" />
                        <span>View</span>
                      </Link>
                    </Button>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPostToDelete(post)}
                  className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Delete ${post.title}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Accessible Destructive Delete Confirmation Dialog */}
      <AlertDialog
        open={Boolean(postToDelete)}
        onOpenChange={(open) => !open && setPostToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete article?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{postToDelete?.title}&rdquo;?
              This will permanently delete this article, its comments, and its
              likes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete Article"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
