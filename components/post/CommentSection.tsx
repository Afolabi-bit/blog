"use client";

import { useEffect, useState, useTransition, useCallback, useRef } from "react";
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
import type { Comment, PaginationMeta } from "@/lib/types";
import {
  MessageSquare,
  CornerDownRight,
  Trash2,
  Loader2,
  LogIn,
  Send,
  ArrowDown,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

const MAX_COMMENT_LENGTH = 1000;

interface CommentSectionProps {
  postId: string;
  postAuthorId: string;
}

export function CommentSection({ postId, postAuthorId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus reply textarea when reply composer opens
  useEffect(() => {
    if (replyingToId && replyTextareaRef.current) {
      replyTextareaRef.current.focus();
    }
  }, [replyingToId]);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await commentsEndpoints.getComments(postId, { limit: 10 });
      if (res.data) {
        if (Array.isArray(res.data)) {
          setComments(res.data);
          setPagination(undefined);
        } else if ("comments" in res.data) {
          setComments(res.data.comments || []);
          setPagination(res.data.pagination);
        }
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleLoadMoreComments = async () => {
    if (!pagination?.next_cursor || loadingMore) return;

    setLoadingMore(true);
    try {
      const res = await commentsEndpoints.getComments(postId, {
        limit: 10,
        cursor: pagination.next_cursor,
      });

      if (res.data) {
        if (!Array.isArray(res.data) && "comments" in res.data) {
          const newBatch = res.data.comments || [];
          setComments((prev) => {
            const existingIds = new Set(prev.map((c) => c.id));
            const filteredNew = newBatch.filter((c) => !existingIds.has(c.id));
            return [...prev, ...filteredNew];
          });
          setPagination(res.data.pagination);
        }
      }
    } catch {
      toast.error("Failed to load more comments. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    const content = parentId ? replyContent.trim() : newComment.trim();

    if (!content) {
      toast.error("Comment cannot be empty");
      return;
    }

    if (content.length > MAX_COMMENT_LENGTH) {
      toast.error(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`);
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

        // Preserve tree structure: if comment has replies, mark as [comment deleted]
        const updateCommentTree = (list: Comment[], targetId: string): Comment[] => {
          return list
            .map((c) => {
              if (c.id === targetId) {
                if (c.replies && c.replies.length > 0) {
                  return {
                    ...c,
                    content: "[comment deleted]",
                    author_name: "Deleted",
                    user_name: "Deleted",
                  };
                }
                return null;
              }
              if (c.replies && c.replies.length > 0) {
                return {
                  ...c,
                  replies: updateCommentTree(c.replies, targetId),
                };
              }
              return c;
            })
            .filter(Boolean) as Comment[];
        };

        setComments((prev) => updateCommentTree(prev, commentToDelete));
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

  const canDelete = (c: Comment) => {
    if (!user) return false;
    if (c.content === "[comment deleted]") return false;
    const authorId = c.author_id || c.user_id;
    return (
      user.id === authorId ||
      user.id === postAuthorId ||
      user.role === "admin"
    );
  };

  // Count all comments including replies
  const countTotalComments = (list: Comment[]): number => {
    return list.reduce((acc, item) => {
      return acc + 1 + (item.replies ? countTotalComments(item.replies) : 0);
    }, 0);
  };

  const totalCommentCount = countTotalComments(comments);
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "";

  const renderComment = (
    comment: Comment,
    isReply = false,
    parentAuthorName?: string
  ) => {
    const isDeleted = comment.content === "[comment deleted]";
    const commenterName = isDeleted
      ? "[deleted]"
      : comment.author_name || comment.user_name || "Reader";
    const initials = isDeleted
      ? "--"
      : commenterName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase();

    const isPostAuthor =
      !isDeleted &&
      ((comment.author_id && comment.author_id === postAuthorId) ||
        (comment.user_id && comment.user_id === postAuthorId));

    const replies = comment.replies || [];
    const isComposerOpen = replyingToId === comment.id;

    return (
      <div
        key={comment.id}
        className={`group rounded-xl border border-border bg-card p-4 transition-colors ${
          isReply
            ? "ml-3 sm:ml-6 mt-3 border-l-2 border-l-accent-solid/60 bg-muted/20"
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
                <span
                  className={`text-sm font-semibold ${
                    isDeleted ? "text-muted-foreground italic" : "text-foreground"
                  }`}
                >
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

        <p
          className={`mt-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
            isDeleted ? "italic text-muted-foreground" : "text-foreground/90"
          }`}
        >
          {comment.content}
        </p>

        {/* Reply Action & Inline Composer (for top-level comments) */}
        {!isReply && user && !isDeleted && (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setReplyingToId(isComposerOpen ? null : comment.id);
                setReplyContent("");
              }}
              aria-expanded={isComposerOpen}
              aria-label={
                isComposerOpen
                  ? "Cancel reply"
                  : `Reply to ${commenterName}'s comment`
              }
              className="h-7 px-2 text-xs font-medium text-accent-solid hover:bg-accent-solid/10 hover:text-accent-solid"
            >
              {isComposerOpen ? "Cancel" : "Reply"}
            </Button>

            {isComposerOpen && (
              <form
                aria-label={`Reply to ${commenterName}`}
                onSubmit={(e) => handleAddComment(e, comment.id)}
                className="mt-3 flex flex-col gap-2 rounded-lg border border-border bg-background p-3 shadow-2xs"
              >
                <div className="relative">
                  <Textarea
                    ref={replyTextareaRef}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setReplyingToId(null);
                        setReplyContent("");
                      }
                    }}
                    placeholder={`Reply to ${commenterName}… (Press Esc to cancel)`}
                    rows={2}
                    maxLength={MAX_COMMENT_LENGTH}
                    className="resize-none text-sm pr-16"
                    required
                  />
                  <span className="absolute right-2 bottom-2 text-[10px] text-muted-foreground font-mono tabular-nums">
                    {replyContent.length}/{MAX_COMMENT_LENGTH}
                  </span>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReplyingToId(null);
                      setReplyContent("");
                    }}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isPending || !replyContent.trim()}
                    className="h-7 gap-1.5 text-xs bg-accent-solid text-white hover:bg-accent-solid/90"
                  >
                    {isPending ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Send className="size-3" />
                    )}
                    <span>Post reply</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Nested Replies */}
        {replies.length > 0 && (
          <div className="mt-2 flex flex-col">
            {replies.map((reply) => renderComment(reply, true, commenterName))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section aria-labelledby="discussion-heading" className="mt-12 border-t border-border/60 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <h2
          id="discussion-heading"
          className="flex items-center gap-2 font-serif text-2xl font-bold tracking-tight text-foreground"
        >
          <MessageSquare className="size-5 text-accent-solid" />
          <span>Discussion</span>
          <span
            aria-live="polite"
            className="tabular-nums font-sans text-sm font-semibold text-muted-foreground"
          >
            ({totalCommentCount})
          </span>
        </h2>
      </div>

      {/* New Top-Level Comment Form */}
      {user ? (
        <form
          aria-label="Write a comment"
          onSubmit={(e) => handleAddComment(e)}
          className="mb-8 flex flex-col gap-3"
        >
          <div className="relative">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts or ask a question…"
              rows={3}
              maxLength={MAX_COMMENT_LENGTH}
              className="resize-none text-sm leading-relaxed pr-16"
              required
            />
            <span className="absolute right-3 bottom-2.5 text-xs text-muted-foreground font-mono tabular-nums">
              {newComment.length}/{MAX_COMMENT_LENGTH}
            </span>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPending || !newComment.trim()}
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
        <div className="mb-8 rounded-2xl border border-border bg-card/60 p-6 text-center shadow-2xs">
          <p className="text-base font-serif font-bold text-foreground mb-1">
            Join the conversation
          </p>
          <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
            Sign in to share your thoughts, ask questions, and discuss with the author.
          </p>
          <div className="flex justify-center gap-3">
            <Button asChild size="sm" className="bg-accent-solid text-white hover:bg-accent-solid/90">
              <Link
                href={
                  currentPath
                    ? `/login?redirect=${encodeURIComponent(currentPath)}`
                    : "/login"
                }
                className="flex items-center gap-1.5"
              >
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
      ) : error && comments.length === 0 ? (
        <div className="rounded-xl border border-border bg-card/60 p-6 text-center flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">
            Comments couldn&apos;t load. Try refreshing.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchComments}
            className="text-xs"
          >
            Retry
          </Button>
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
          <p className="text-sm text-muted-foreground italic font-serif">
            No comments yet. Be the first to share your thoughts.
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {comments.map((comment) => renderComment(comment))}

          {/* Cursor-based Load More Comments button */}
          {pagination?.has_next && (
            <div className="mt-4 flex justify-center pb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMoreComments}
                disabled={loadingMore}
                className="gap-2 rounded-full border-border text-xs text-foreground hover:bg-muted font-medium"
                aria-label="Load more comments"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin text-accent-solid" />
                    <span>Loading more comments…</span>
                  </>
                ) : (
                  <>
                    <span>Load more comments</span>
                    <ArrowDown className="size-3.5 text-muted-foreground" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Accessible Destructive Delete Dialog */}
      <AlertDialog
        open={Boolean(commentToDelete)}
        onOpenChange={(open) => !open && setCommentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
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
