"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { adminEndpoints } from "@/lib/endpoints";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { AuthorRequest, Post, Comment } from "@/lib/types";
import {
  Check,
  ExternalLink,
  FileText,
  Heart,
  Loader2,
  MessageSquare,
  Search,
  Star,
  Trash2,
  User,
  UserCheck,
  X,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<string>("requests");

  // Author Requests state
  const [requests, setRequests] = useState<AuthorRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>("pending");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reviewingRequest, setReviewingRequest] = useState<AuthorRequest | null>(null);
  const [sheetReviewNotes, setSheetReviewNotes] = useState("");

  // Posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postSearch, setPostSearch] = useState("");
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [postToReplaceFeatured, setPostToReplaceFeatured] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [featuringId, setFeaturingId] = useState<string | null>(null);

  // Comments state (ADM-7)
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSearch, setCommentSearch] = useState("");
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

  const fetchRequests = useCallback(async (status?: string) => {
    try {
      setRequestsLoading(true);
      const res = await adminEndpoints.getAuthorRequests(status || undefined);
      if (res.data) {
        if (Array.isArray(res.data)) {
          setRequests(res.data);
        } else if ("requests" in res.data && Array.isArray((res.data as { requests: AuthorRequest[] }).requests)) {
          setRequests((res.data as { requests: AuthorRequest[] }).requests);
        }
      }
    } catch (err: unknown) {
      let msg = "Failed to load author requests";
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || err.message || msg;
      }
      toast.error(msg);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      setPostsLoading(true);
      const res = await adminEndpoints.getAllPosts({
        search: postSearch.trim() || undefined,
      });
      if (res.data) {
        if (Array.isArray(res.data)) {
          setPosts(res.data);
        } else if ("posts" in res.data && Array.isArray((res.data as { posts: Post[] }).posts)) {
          setPosts((res.data as { posts: Post[] }).posts);
        }
      }
    } catch (err: unknown) {
      let msg = "Failed to load posts";
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || err.message || msg;
      }
      toast.error(msg);
    } finally {
      setPostsLoading(false);
    }
  }, [postSearch]);

  const fetchComments = useCallback(async () => {
    try {
      setCommentsLoading(true);
      const res = await adminEndpoints.getComments({
        search: commentSearch.trim() || undefined,
      });
      if (res.data) {
        if (Array.isArray(res.data)) {
          setComments(res.data);
        } else if ("comments" in res.data && Array.isArray((res.data as { comments: Comment[] }).comments)) {
          setComments((res.data as { comments: Comment[] }).comments);
        }
      }
    } catch (err: unknown) {
      let msg = "Failed to load comments";
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || err.message || msg;
      }
      toast.error(msg);
    } finally {
      setCommentsLoading(false);
    }
  }, [commentSearch]);

  useEffect(() => {
    if (activeTab === "requests") {
      fetchRequests(requestStatusFilter);
    } else if (activeTab === "posts") {
      fetchPosts();
    } else if (activeTab === "comments") {
      fetchComments();
    }
  }, [activeTab, requestStatusFilter, fetchRequests, fetchPosts, fetchComments]);

  const handleReview = async (
    id: string,
    status: "approved" | "rejected",
    overrideNotes?: string
  ) => {
    setProcessingId(id);
    const notes = overrideNotes !== undefined ? overrideNotes : (reviewNotes[id] || "");
    const actionLabel = status === "approved" ? "Approving" : "Declining";
    const toastId = toast.loading(`${actionLabel} author application…`);

    try {
      const res = await adminEndpoints.reviewAuthorRequest(id, {
        status,
        review_notes: notes || undefined,
      });

      if (res.status === "success") {
        toast.success(
          status === "approved"
            ? "Author request approved"
            : "Author request declined",
          { id: toastId },
        );
        await fetchRequests(requestStatusFilter);
      } else {
        toast.error(res.message || "Failed to review request", { id: toastId });
      }
    } catch (err: unknown) {
      let msg = "Failed to review request";
      if (axios.isAxiosError(err)) {
        const backendMsg = err.response?.data?.message || "";
        if (backendMsg.includes("already been processed")) {
          toast.info("Request has already been processed", {
            id: toastId,
          });
          await fetchRequests(requestStatusFilter);
          return;
        }
        msg = backendMsg || err.message || msg;
      }
      toast.error(msg, { id: toastId });
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleFeatured = async (post: Post) => {
    setFeaturingId(post.id);
    const newFeatured = !post.is_featured;
    const actionText = newFeatured ? "Setting featured article…" : "Removing featured status…";
    const toastId = toast.loading(actionText);

    try {
      const res = await adminEndpoints.setFeaturedPost(post.id, newFeatured);
      if (res.status === "success") {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id === post.id) return { ...p, is_featured: newFeatured };
            if (newFeatured && p.is_featured) return { ...p, is_featured: false };
            return p;
          }),
        );
        toast.success(
          newFeatured
            ? "Featured article updated"
            : "Featured status removed",
          { id: toastId },
        );
      } else {
        toast.error(res.message || "Failed to update featured status", { id: toastId });
      }
    } catch (err: unknown) {
      let msg = "Failed to update featured status";
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || err.message || msg;
      }
      toast.error(msg, { id: toastId });
    } finally {
      setFeaturingId(null);
    }
  };

  const handleFeatureClick = (post: Post) => {
    if (post.is_featured) {
      handleToggleFeatured(post);
      return;
    }
    const hasExistingFeatured = posts.some((p) => p.is_featured && p.id !== post.id);
    if (hasExistingFeatured) {
      setPostToReplaceFeatured(post);
    } else {
      handleToggleFeatured(post);
    }
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    const toastId = toast.loading("Deleting post…");

    try {
      const res = await adminEndpoints.deletePost(postToDelete.id);
      if (res.status === "success") {
        toast.success("Post removed", { id: toastId });
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

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    setIsDeletingComment(true);
    const toastId = toast.loading("Deleting comment…");

    try {
      const res = await adminEndpoints.deleteComment(commentToDelete.id);
      if (res.status === "success") {
        toast.success("Comment removed", { id: toastId });
        setComments((prev) => prev.filter((c) => c.id !== commentToDelete.id));
      } else {
        toast.error(res.message || "Failed to delete comment", { id: toastId });
      }
    } catch (err: unknown) {
      let msg = "Failed to delete comment";
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || err.message || msg;
      }
      toast.error(msg, { id: toastId });
    } finally {
      setIsDeletingComment(false);
      setCommentToDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger
            value="requests"
            aria-current={activeTab === "requests" ? "page" : undefined}
            className="gap-2 text-xs font-semibold"
          >
            <UserCheck className="size-3.5" />
            <span>Author Requests</span>
          </TabsTrigger>
          <TabsTrigger
            value="posts"
            aria-current={activeTab === "posts" ? "page" : undefined}
            className="gap-2 text-xs font-semibold"
          >
            <FileText className="size-3.5" />
            <span>Articles</span>
          </TabsTrigger>
          <TabsTrigger
            value="comments"
            aria-current={activeTab === "comments" ? "page" : undefined}
            className="gap-2 text-xs font-semibold"
          >
            <MessageSquare className="size-3.5" />
            <span>Comments</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Author Requests Queue */}
        <TabsContent value="requests" className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-serif text-xl font-bold tracking-tight text-foreground">
              Author Applications ({requests.length})
            </h2>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
              {(["pending", "approved", "rejected", ""] as const).map((st) => (
                <Button
                  key={st}
                  variant="ghost"
                  size="sm"
                  onClick={() => setRequestStatusFilter(st)}
                  className={`h-7 px-2.5 text-xs font-medium capitalize ${
                    requestStatusFilter === st
                      ? "bg-muted text-foreground font-semibold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {st || "All"}
                </Button>
              ))}
            </div>
          </div>

          {requestsLoading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-44 w-full rounded-xl" />
              <Skeleton className="h-44 w-full rounded-xl" />
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
              <p className="text-sm text-muted-foreground italic">
                No author applications found for this filter.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {requests.map((req) => (
                <Card key={req.id} className="border-border bg-card">
                  <CardHeader className="p-5 pb-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-lg font-bold text-foreground">
                          {req.user_name || "Applicant"}
                        </span>
                        {req.user_email && (
                          <span className="text-xs text-muted-foreground">
                            ({req.user_email})
                          </span>
                        )}
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-xs font-mono font-semibold py-0.5 px-2 capitalize ${
                          req.status === "pending"
                            ? "border-status-warning/40 bg-status-warning/10 text-status-warning"
                            : req.status === "approved"
                              ? "border-status-success/40 bg-status-success/10 text-status-success"
                              : "border-status-danger/40 bg-status-danger/10 text-status-danger"
                        }`}
                      >
                        {req.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Submitted on {formatDate(req.created_at)}
                    </p>
                  </CardHeader>

                  <CardContent className="px-5 py-2 flex flex-col gap-3 text-sm">
                    <div>
                      <span className="font-semibold text-foreground text-xs uppercase tracking-wider font-mono">
                        Biography:
                      </span>
                      <p className="mt-1 text-muted-foreground leading-relaxed">
                        {req.bio}
                      </p>
                    </div>

                    {req.motivation && (
                      <div>
                        <span className="font-semibold text-foreground text-xs uppercase tracking-wider font-mono">
                          Motivation:
                        </span>
                        <p className="mt-1 text-muted-foreground leading-relaxed">
                          {req.motivation}
                        </p>
                      </div>
                    )}

                    {req.sample_links && req.sample_links.length > 0 && (
                      <div>
                        <span className="font-semibold text-foreground text-xs uppercase tracking-wider font-mono">
                          Portfolio / Sample Links:
                        </span>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {req.sample_links.map((link) => (
                            <a
                              key={link}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs text-accent-solid hover:underline"
                            >
                              <span>{link}</span>
                              <ExternalLink className="size-3" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Review Notes field for Pending requests */}
                    {req.status === "pending" && (
                      <div className="mt-2 flex flex-col gap-1.5">
                        <Label
                          htmlFor={`notes-${req.id}`}
                          className="text-xs font-semibold"
                        >
                          Review Feedback / Internal Note (optional)
                        </Label>
                        <Textarea
                          id={`notes-${req.id}`}
                          placeholder="Feedback or rationale for approval/rejection…"
                          rows={2}
                          value={reviewNotes[req.id] || ""}
                          onChange={(e) =>
                            setReviewNotes((prev) => ({
                              ...prev,
                              [req.id]: e.target.value,
                            }))
                          }
                          className="text-xs bg-background resize-none"
                          disabled={processingId === req.id}
                        />
                      </div>
                    )}

                    {req.review_notes && req.status !== "pending" && (
                      <div className="rounded-md border border-border bg-muted/30 p-2.5 text-xs">
                        <span className="font-semibold text-foreground">
                          Review Note:{" "}
                        </span>
                        <span className="text-muted-foreground">
                          {req.review_notes}
                        </span>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 p-4 pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setReviewingRequest(req);
                        setSheetReviewNotes(reviewNotes[req.id] || "");
                      }}
                      className="h-8 gap-1.5 text-xs text-foreground"
                    >
                      <FileText className="size-3.5" />
                      <span>Review application</span>
                    </Button>

                    {req.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={processingId === req.id}
                          onClick={() => handleReview(req.id, "rejected")}
                          className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          {processingId === req.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <X className="size-3.5" />
                          )}
                          <span>Reject</span>
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          disabled={processingId === req.id}
                          onClick={() => handleReview(req.id, "approved")}
                          className="h-8 gap-1.5 text-xs bg-status-success text-white hover:bg-status-success/90"
                        >
                          {processingId === req.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Check className="size-3.5" />
                          )}
                          <span>Approve</span>
                        </Button>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Post Moderation (with ADM-6 Featured Article management) */}
        <TabsContent value="posts" className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-serif text-xl font-bold tracking-tight text-foreground">
              Platform Articles ({posts.length})
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchPosts();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search articles by title…"
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  className="h-8 w-56 pl-8 text-xs bg-card"
                />
              </div>
              <Button type="submit" size="sm" variant="outline" className="h-8 text-xs">
                Search
              </Button>
            </form>
          </div>

          {postsLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
              <p className="text-sm text-muted-foreground italic">
                No articles found matching search criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-2xs">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Article</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="max-w-xs font-medium sm:max-w-sm">
                        <Link
                          href={`/post/${post.slug}`}
                          target="_blank"
                          className="font-serif font-bold text-foreground hover:text-accent-solid transition-colors line-clamp-1"
                        >
                          {post.title}
                        </Link>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {formatDate(post.created_at)}
                        </p>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {post.author_name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 mr-3">
                          <Heart className="size-3 text-accent-warm" />
                          {post.likes_count || 0}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="size-3" />
                          {post.comments_count || 0}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {post.is_featured ? (
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px] uppercase tracking-wider py-0 gap-1 border-accent-solid/40 bg-accent-solid text-white"
                          >
                            <Star className="size-2.5 fill-white/40" />
                            <span>Featured</span>
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="font-mono text-[10px] uppercase tracking-wider py-0"
                          >
                            {post.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {/* Feature Hero Toggle */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={featuringId === post.id}
                            onClick={() => handleFeatureClick(post)}
                            className={`h-7 gap-1 text-xs ${
                              post.is_featured
                                ? "border-accent-solid text-accent-solid hover:bg-accent-solid/10"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                            title={post.is_featured ? "Remove from featured hero" : "Set as featured hero"}
                          >
                            {featuringId === post.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Star
                                className={`size-3 ${
                                  post.is_featured ? "fill-accent-solid text-accent-solid" : ""
                                }`}
                              />
                            )}
                            <span>{post.is_featured ? "Featured" : "Feature"}</span>
                          </Button>

                          <Button asChild variant="outline" size="sm" className="h-7 gap-1 text-xs">
                            <Link href={`/post/${post.slug}`} target="_blank">
                              <ExternalLink className="size-3" />
                              <span>View</span>
                            </Link>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPostToDelete(post)}
                            className="h-7 gap-1 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Admin delete ${post.title}`}
                          >
                            <Trash2 className="size-3 text-destructive" />
                            <span className="text-destructive">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Comment Moderation Queue (ADM-7) */}
        <TabsContent value="comments" className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-serif text-xl font-bold tracking-tight text-foreground">
              Comment Moderation Queue ({comments.length})
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchComments();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search comments by text or user…"
                  value={commentSearch}
                  onChange={(e) => setCommentSearch(e.target.value)}
                  className="h-8 w-64 pl-8 text-xs bg-card"
                />
              </div>
              <Button type="submit" size="sm" variant="outline" className="h-8 text-xs">
                Search
              </Button>
            </form>
          </div>

          {commentsLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : comments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
              <p className="text-sm text-muted-foreground italic">
                No comments found matching moderation search.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-card p-4 shadow-2xs transition-colors hover:border-border/80"
                >
                  <div className="flex flex-col gap-1 max-w-xl">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-foreground flex items-center gap-1">
                        <User className="size-3 text-muted-foreground" />
                        {comment.user_name || comment.author_name || "Community Member"}
                      </span>
                      <span>•</span>
                      <span className="text-muted-foreground">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>

                    <p className="text-sm text-foreground/90 line-clamp-2 leading-relaxed">
                      &ldquo;{comment.content}&rdquo;
                    </p>

                    <div className="text-[11px] text-muted-foreground">
                      Post ID: <span className="font-mono">{comment.post_id}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCommentToDelete(comment)}
                      className="h-8 gap-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Delete comment"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Replace Featured Post AlertDialog */}
      <AlertDialog
        open={Boolean(postToReplaceFeatured)}
        onOpenChange={(open) => !open && setPostToReplaceFeatured(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace featured post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace the current featured post. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (postToReplaceFeatured) {
                  handleToggleFeatured(postToReplaceFeatured);
                  setPostToReplaceFeatured(null);
                }
              }}
              className="bg-accent-solid text-white hover:bg-accent-solid/90"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admin Post Deletion AlertDialog */}
      <AlertDialog
        open={Boolean(postToDelete)}
        onOpenChange={(open) => !open && setPostToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Permanently delete &ldquo;{postToDelete?.title}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePost}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete post"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admin Comment Deletion AlertDialog */}
      <AlertDialog
        open={Boolean(commentToDelete)}
        onOpenChange={(open) => !open && setCommentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingComment}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteComment}
              disabled={isDeletingComment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingComment ? "Deleting…" : "Delete comment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Review Sheet for Author Applications */}
      <Sheet
        open={Boolean(reviewingRequest)}
        onOpenChange={(open) => !open && setReviewingRequest(null)}
      >
        <SheetContent side="right" className="sm:max-w-md flex flex-col gap-6 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-serif text-xl font-bold">
              Review application — {reviewingRequest?.user_name || "Applicant"}
            </SheetTitle>
            <SheetDescription>
              Review the applicant details, writing samples, and editorial motivation.
            </SheetDescription>
          </SheetHeader>

          {reviewingRequest && (
            <div className="flex flex-col gap-5 text-sm">
              <div>
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  Biography
                </span>
                <p className="mt-1 font-serif text-sm leading-relaxed text-foreground rounded-lg border border-border bg-muted/20 p-3">
                  {reviewingRequest.bio}
                </p>
              </div>

              {reviewingRequest.motivation && (
                <div>
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    Motivation
                  </span>
                  <p className="mt-1 font-serif text-sm leading-relaxed text-foreground rounded-lg border border-border bg-muted/20 p-3">
                    {reviewingRequest.motivation}
                  </p>
                </div>
              )}

              {reviewingRequest.sample_links && reviewingRequest.sample_links.length > 0 && (
                <div>
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    Sample Links
                  </span>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {reviewingRequest.sample_links.map((link) => (
                      <a
                        key={link}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-accent-solid hover:underline break-all"
                      >
                        <ExternalLink className="size-3 shrink-0" />
                        <span>{link}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {reviewingRequest.status === "pending" && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sheet-review-notes" className="text-xs font-semibold">
                    Rejection reason (optional)
                  </Label>
                  <Textarea
                    id="sheet-review-notes"
                    aria-label="Rejection reason (optional)"
                    placeholder="Feedback or rationale for rejection…"
                    rows={3}
                    value={sheetReviewNotes}
                    onChange={(e) => setSheetReviewNotes(e.target.value)}
                    className="text-xs bg-background resize-none"
                  />
                </div>
              )}

              {reviewingRequest.status === "pending" && (
                <div className="mt-2 flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      await handleReview(reviewingRequest.id, "rejected", sheetReviewNotes);
                      setReviewingRequest(null);
                    }}
                    disabled={processingId === reviewingRequest.id}
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    Reject
                  </Button>
                  <Button
                    type="button"
                    onClick={async () => {
                      await handleReview(reviewingRequest.id, "approved", sheetReviewNotes);
                      setReviewingRequest(null);
                    }}
                    disabled={processingId === reviewingRequest.id}
                    className="bg-accent-solid text-white hover:bg-accent-solid/90"
                  >
                    Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
