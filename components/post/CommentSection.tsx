"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { commentsEndpoints } from "@/lib/endpoints";
import { useAuth } from "@/components/general/AuthProvider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import type { Comment } from "@/lib/types";
import {
  MessageSquare,
  CornerDownRight,
  Trash2,
  Loader2,
  LogIn,
  Send,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface CommentSectionProps {
  postId: string;
  postAuthorId: string;
}

export function CommentSection({ postId, postAuthorId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await commentsEndpoints.getComments(postId);
      if (res.data) {
        if (Array.isArray(res.data)) {
          setComments(res.data);
        } else if ("comments" in res.data && Array.isArray((res.data as { comments: Comment[] }).comments)) {
          setComments((res.data as { comments: Comment[] }).comments);
        }
      }
    } catch {
      // Silently handle fetch error
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleAddComment = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    const content = parentId ? replyContent.trim() : newComment.trim();

    if (!content) {
      toast.error("Comment cannot be empty");
      return;
    }

    if (!user) {
      toast.error("Please sign in to leave a comment");
      return;
    }

    startTransition(async () => {
      try {
        const res = await commentsEndpoints.createComment(postId, {
          content,
          parent_id: parentId,
        });

        if (res.status === "success") {
          toast.success(parentId ? "Reply posted" : "Comment added");
          if (parentId) {
            setReplyingToId(null);
            setReplyContent("");
          } else {
            setNewComment("");
          }
          await fetchComments();
        } else {
          toast.error(res.message || "Failed to post comment");
        }
      } catch (err: unknown) {
        let msg = "Failed to post comment";
        if (axios.isAxiosError(err)) {
          msg = err.response?.data?.message || err.message || msg;
        }
        toast.error(msg);
      }
    });
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    setIsDeleting(true);

    try {
      const res = await commentsEndpoints.deleteComment(commentToDelete);
      if (res.status === "success") {
        toast.success("Comment deleted");
        setComments((prev) => prev.filter((c) => c.id !== commentToDelete));
      } else {
        toast.error(res.message || "Failed to delete comment");
      }
    } catch (err: unknown) {
      let msg = "Failed to delete comment";
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || err.message || msg;
      }
      toast.error(msg);
    } finally {
      setIsDeleting(false);
      setCommentToDelete(null);
    }
  };

  // Build comment map and hierarchy, gracefully handling orphans
  const commentMap = new Map<string, Comment>();
  comments.forEach((c) => commentMap.set(c.id, c));

  const rootComments: Comment[] = [];
  const replyMap = new Map<string, Comment[]>();

  comments.forEach((c) => {
    if (!c.parent_id) {
      rootComments.push(c);
    } else if (commentMap.has(c.parent_id)) {
      const existing = replyMap.get(c.parent_id) || [];
      existing.push(c);
      replyMap.set(c.parent_id, existing);
    } else {
      // Orphan reply (parent was deleted or not yet paginated) -> display at root
      rootComments.push(c);
    }
  });

  const canDelete = (c: Comment) => {
    if (!user) return false;
    const authorId = c.author_id || c.user_id;
    return (
      user.id === authorId ||
      user.id === postAuthorId ||
      user.role === "admin"
    );
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const commenterName =
      comment.author_name || comment.user_name || "Reader";
    const initials = commenterName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    const isPostAuthor =
      (comment.author_id && comment.author_id === postAuthorId) ||
      (comment.user_id && comment.user_id === postAuthorId);

    const replies = replyMap.get(comment.id) || [];
    const parentComment = comment.parent_id ? commentMap.get(comment.parent_id) : null;
    const parentAuthorName = parentComment?.author_name || parentComment?.user_name;

    return (
      <div
        key={comment.id}
        className={`group rounded-xl border border-border bg-card p-4 transition-colors ${
          isReply
            ? "ml-4 sm:ml-8 mt-3 border-l-2 border-l-accent-solid/60 bg-muted/20"
            : "mb-4"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Avatar className="size-7 border border-border">
              <AvatarFallback className="bg-muted text-[11px] font-semibold text-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold text-foreground">
                  {commenterName}
                </span>
                {isPostAuthor && (
                  <Badge
                    variant="secondary"
                    className="h-4 text-[10px] px-1 font-mono uppercase font-semibold text-accent-solid bg-accent-solid/10 border-accent-solid/20"
                  >
                    Author
                  </Badge>
                )}
                {parentAuthorName && isReply && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <CornerDownRight className="size-3" />
                    replying to {parentAuthorName}
                  </span>
                )}
              </div>
              <time
                dateTime={comment.created_at}
                className="text-[11px] text-muted-foreground"
              >
                {formatDate(comment.created_at)}
              </time>
            </div>
          </div>

          {canDelete(comment) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCommentToDelete(comment.id)}
              aria-label="Delete comment"
              className="size-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>

        <p className="mt-2.5 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
          {comment.content}
        </p>

        {!isReply && user && (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setReplyingToId(replyingToId === comment.id ? null : comment.id);
                setReplyContent("");
              }}
              className="h-7 px-2 text-xs font-medium text-accent-solid hover:bg-accent-solid/10 hover:text-accent-solid"
            >
              {replyingToId === comment.id ? "Cancel Reply" : "Reply"}
            </Button>

            {replyingToId === comment.id && (
              <form
                onSubmit={(e) => handleAddComment(e, comment.id)}
                className="mt-3 flex flex-col gap-2 rounded-lg border border-border bg-background p-3"
              >
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`Reply to ${commenterName}…`}
                  rows={2}
                  className="resize-none text-sm"
                  required
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingToId(null)}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isPending}
                    className="h-7 gap-1.5 text-xs bg-accent-solid text-white hover:bg-accent-solid/90"
                  >
                    {isPending ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Send className="size-3" />
                    )}
                    <span>Post Reply</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Nested replies */}
        {replies.length > 0 && (
          <div className="mt-2 flex flex-col">
            {replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="mt-12 border-t border-border/60 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-serif text-2xl font-bold tracking-tight text-foreground">
          <MessageSquare className="size-5 text-accent-solid" />
          <span>Discussion ({comments.length})</span>
        </h2>
      </div>

      {/* New Top-Level Comment Form */}
      {user ? (
        <form onSubmit={(e) => handleAddComment(e)} className="mb-8 flex flex-col gap-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts or ask a question…"
            rows={3}
            className="resize-none text-sm leading-relaxed"
            required
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPending}
              className="gap-2 bg-accent-solid text-white hover:bg-accent-solid/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Publishing…</span>
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  <span>Post comment</span>
                </>
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mb-8 rounded-xl border border-border bg-card/60 p-6 text-center">
          <p className="text-sm font-medium text-foreground mb-1">
            Join the conversation
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Sign in to share your thoughts, ask questions, and discuss with the author.
          </p>
          <div className="flex justify-center gap-3">
            <Button asChild size="sm" className="bg-accent-solid text-white hover:bg-accent-solid/90">
              <Link href="/login" className="flex items-center gap-1.5">
                <LogIn className="size-3.5" />
                <span>Sign in</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/register">Create account</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      ) : rootComments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
          <p className="text-sm text-muted-foreground italic">
            No comments yet. Be the first to share your thoughts!
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {rootComments.map((comment) => renderComment(comment))}
        </div>
      )}

      {/* Accessible Destructive Delete Dialog */}
      <AlertDialog
        open={Boolean(commentToDelete)}
        onOpenChange={(open) => !open && setCommentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this comment. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteComment}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
