"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { commentsEndpoints } from "@/lib/endpoints";
import { useAuth } from "@/components/general/AuthProvider";
import { buttonVariants } from "@/components/ui/button";
import type { Comment } from "@/lib/types";

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
  const [isPending, startTransition] = useTransition();

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await commentsEndpoints.getComments(postId);
      if (res.data) {
        if (Array.isArray(res.data)) {
          setComments(res.data);
        } else if ("comments" in res.data && Array.isArray(res.data.comments)) {
          setComments(res.data.comments);
        }
      }
    } catch {
      // Silently handle initial fetch error
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
      toast.error("Please log in to comment");
      return;
    }

    startTransition(async () => {
      try {
        const res = await commentsEndpoints.createComment(postId, {
          content,
          parent_id: parentId,
        });

        if (res.status === "success" && res.data) {
          toast.success(parentId ? "Reply posted" : "Comment added");
          if (parentId) {
            setReplyingToId(null);
            setReplyContent("");
          } else {
            setNewComment("");
          }
          // Refresh comments list
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

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const res = await commentsEndpoints.deleteComment(commentId);
      if (res.status === "success") {
        toast.success("Comment deleted");
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        toast.error(res.message || "Failed to delete comment");
      }
    } catch (err: unknown) {
      let msg = "Failed to delete comment";
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || err.message || msg;
      }
      toast.error(msg);
    }
  };

  // Group comments: top-level comments and child replies
  const rootComments = comments.filter((c) => !c.parent_id);
  const getReplies = (parentId: string) =>
    comments.filter((c) => c.parent_id === parentId);

  const canDelete = (c: Comment) => {
    if (!user) return false;
    const authorId = c.author_id || c.user_id;
    return (
      user.id === authorId ||
      user.id === postAuthorId ||
      user.role === "admin"
    );
  };

  const renderCommentItem = (comment: Comment, isReply = false) => {
    const commenterName =
      comment.author_name || comment.user_name || "Anonymous";
    const replies = !isReply ? getReplies(comment.id) : [];

    return (
      <div
        key={comment.id}
        className={`group p-4 rounded-lg bg-gray-50/70 border border-gray-100 transition-colors ${
          isReply ? "ml-6 sm:ml-10 mt-3 bg-white border-l-2 border-l-orange-400" : "mb-4"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-semibold uppercase">
              {commenterName.slice(0, 2)}
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900">
                {commenterName}
              </span>
              <time className="block text-xs text-gray-500">
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(comment.created_at))}
              </time>
            </div>
          </div>

          {canDelete(comment) && (
            <button
              onClick={() => handleDeleteComment(comment.id)}
              className="text-xs text-gray-400 hover:text-red-600 transition-colors p-1"
              title="Delete comment"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap leading-relaxed">
          {comment.content}
        </p>

        {!isReply && user && (
          <div className="mt-2.5">
            <button
              onClick={() => {
                setReplyingToId(replyingToId === comment.id ? null : comment.id);
                setReplyContent("");
              }}
              className="text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors"
            >
              {replyingToId === comment.id ? "Cancel Reply" : "Reply"}
            </button>

            {replyingToId === comment.id && (
              <form
                onSubmit={(e) => handleAddComment(e, comment.id)}
                className="mt-3 space-y-2"
              >
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`Replying to ${commenterName}...`}
                  rows={2}
                  className="w-full text-sm rounded-md border border-gray-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none bg-white"
                  required
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReplyingToId(null)}
                    className="px-2.5 py-1 text-xs text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-3 py-1 text-xs bg-[#ef862b] text-white rounded-md hover:bg-orange-600 disabled:opacity-50 font-medium"
                  >
                    {isPending ? "Posting..." : "Post Reply"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Child replies */}
        {replies.length > 0 && (
          <div className="mt-2">
            {replies.map((reply) => renderCommentItem(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="mt-12 pt-8 border-t border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Comments ({comments.length})
        </h2>
      </div>

      {/* New top-level comment form */}
      {user ? (
        <form onSubmit={(e) => handleAddComment(e)} className="mb-8 space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            rows={3}
            className="w-full text-sm rounded-lg border border-gray-200 p-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
            required
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm bg-[#ef862b] text-white rounded-md hover:bg-orange-600 disabled:opacity-50 font-medium transition-colors shadow-sm"
            >
              {isPending ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-orange-50/60 border border-orange-100 rounded-lg text-center">
          <p className="text-sm text-gray-700 mb-2">
            Join the conversation. Sign in to leave a comment.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/login" className={buttonVariants({ variant: "default", size: "sm" })}>
              Log in
            </Link>
            <Link href="/register" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Sign up
            </Link>
          </div>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="space-y-3">
          <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      ) : rootComments.length === 0 ? (
        <p className="text-sm text-gray-500 py-6 text-center italic">
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className="space-y-4">
          {rootComments.map((comment) => renderCommentItem(comment))}
        </div>
      )}
    </section>
  );
}
