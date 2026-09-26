"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { adminEndpoints } from "@/lib/endpoints";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AuthorRequest, Post } from "@/lib/types";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"requests" | "posts">("requests");

  // Author Requests state
  const [requests, setRequests] = useState<AuthorRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>("pending");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const fetchRequests = async (status?: string) => {
    try {
      setRequestsLoading(true);
      const res = await adminEndpoints.getAuthorRequests(status || undefined);
      if (res.data) {
        if (Array.isArray(res.data)) {
          setRequests(res.data);
        } else if ("requests" in res.data && Array.isArray(res.data.requests)) {
          setRequests(res.data.requests);
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
  };

  const fetchPosts = async () => {
    try {
      setPostsLoading(true);
      const res = await adminEndpoints.getAllPosts();
      if (res.data) {
        if (Array.isArray(res.data)) {
          setPosts(res.data);
        } else if ("posts" in res.data && Array.isArray(res.data.posts)) {
          setPosts(res.data.posts);
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
  };

  useEffect(() => {
    if (activeTab === "requests") {
      fetchRequests(requestStatusFilter);
    } else {
      fetchPosts();
    }
  }, [activeTab, requestStatusFilter]);

  const handleReview = async (id: string, status: "approved" | "rejected") => {
    setProcessingId(id);
    const notes = reviewNotes[id] || "";
    const toastId = toast.loading(`${status === "approved" ? "Approving" : "Rejecting"} request...`);

    try {
      const res = await adminEndpoints.reviewAuthorRequest(id, {
        status,
        review_notes: notes || undefined,
      });

      if (res.status === "success") {
        toast.success(
          status === "approved"
            ? "Author request approved and role elevated!"
            : "Author request rejected.",
          { id: toastId }
        );
        // Refresh requests list
        await fetchRequests(requestStatusFilter);
      } else {
        toast.error(res.message || "Failed to review request", { id: toastId });
      }
    } catch (err: unknown) {
      let msg = "Failed to review request";
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || err.message || msg;
      }
      toast.error(msg, { id: toastId });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeletePost = async (post: Post) => {
    if (!confirm(`Are you sure you want to permanently delete "${post.title}"?`)) return;

    setDeletingPostId(post.id);
    const toastId = toast.loading("Moderator deleting post...");

    try {
      const res = await adminEndpoints.deletePost(post.id);
      if (res.status === "success") {
        toast.success("Post successfully removed by moderator", { id: toastId });
        setPosts((prev) => prev.filter((p) => p.id !== post.id));
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
      setDeletingPostId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab selection */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab("requests")}
          className={`pb-3 text-sm font-semibold transition-colors ${
            activeTab === "requests"
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          Author Applications
        </button>
        <button
          onClick={() => setActiveTab("posts")}
          className={`pb-3 text-sm font-semibold transition-colors ${
            activeTab === "posts"
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          Post Moderation
        </button>
      </div>

      {/* Tab 1: Author Requests Queue */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Applications Queue ({requests.length})
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Filter:</span>
              {(["pending", "approved", "rejected", ""] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setRequestStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md font-medium capitalize transition-colors ${
                    requestStatusFilter === st
                      ? "bg-purple-100 text-purple-800"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {st || "All"}
                </button>
              ))}
            </div>
          </div>

          {requestsLoading ? (
            <div className="space-y-3">
              <div className="h-32 bg-gray-50 rounded-xl border border-gray-100 animate-pulse" />
              <div className="h-32 bg-gray-50 rounded-xl border border-gray-100 animate-pulse" />
            </div>
          ) : requests.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-sm text-gray-500 italic">
                  No author applications found for the selected filter.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <Card key={req.id} className="overflow-hidden border-gray-200 shadow-sm">
                  <CardHeader className="bg-gray-50/50 pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-base text-gray-900">
                          {req.user_name || req.username || "Applicant"}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {req.user_email || `User ID: ${req.user_id}`} • Submitted{" "}
                          {new Intl.DateTimeFormat("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(req.created_at))}
                        </CardDescription>
                      </div>

                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                          req.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : req.status === "rejected"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-3 text-sm">
                    <div>
                      <strong className="text-gray-900 block text-xs font-semibold mb-1">
                        Bio:
                      </strong>
                      <p className="text-gray-700 bg-gray-50 p-2.5 rounded-md text-xs leading-relaxed">
                        {req.bio}
                      </p>
                    </div>

                    <div>
                      <strong className="text-gray-900 block text-xs font-semibold mb-1">
                        Motivation:
                      </strong>
                      <p className="text-gray-700 bg-gray-50 p-2.5 rounded-md text-xs leading-relaxed">
                        {req.motivation || req.reason || "None provided"}
                      </p>
                    </div>

                    {((req.sample_links && req.sample_links.length > 0) || req.sample_work) && (
                      <div>
                        <strong className="text-gray-900 block text-xs font-semibold mb-1">
                          Portfolio & Sample Work:
                        </strong>
                        <div className="flex flex-wrap gap-2">
                          {req.sample_links?.map((link, i) => (
                            <a
                              key={i}
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-[#ef862b] hover:underline bg-orange-50 px-2 py-1 rounded border border-orange-100 inline-flex items-center gap-1"
                            >
                              <span>{link}</span>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          ))}
                          {req.sample_work && !req.sample_links?.length && (
                            <span className="text-xs text-gray-700">{req.sample_work}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {req.review_notes && (
                      <div className="bg-purple-50/60 p-2.5 rounded border border-purple-100 text-xs">
                        <strong className="text-purple-900">Review Notes: </strong>
                        <span className="text-purple-800">{req.review_notes}</span>
                      </div>
                    )}

                    {/* Action buttons if status === "pending" */}
                    {req.status === "pending" && (
                      <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <input
                          type="text"
                          placeholder="Optional review notes or feedback..."
                          value={reviewNotes[req.id] || ""}
                          onChange={(e) =>
                            setReviewNotes({ ...reviewNotes, [req.id]: e.target.value })
                          }
                          disabled={processingId === req.id}
                          className="flex-1 text-xs rounded-md border border-gray-200 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleReview(req.id, "approved")}
                            disabled={processingId === req.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReview(req.id, "rejected")}
                            disabled={processingId === req.id}
                            className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Post Moderation */}
      {activeTab === "posts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Published & Draft Publications ({posts.length})
            </h2>
          </div>

          {postsLoading ? (
            <div className="space-y-2">
              <div className="h-16 bg-gray-50 rounded-lg animate-pulse" />
              <div className="h-16 bg-gray-50 rounded-lg animate-pulse" />
              <div className="h-16 bg-gray-50 rounded-lg animate-pulse" />
            </div>
          ) : posts.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-sm text-gray-500 italic">No posts found in database.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="p-3">Title</th>
                    <th className="p-3">Author</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Engagement</th>
                    <th className="p-3">Created</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 font-semibold text-gray-900 max-w-xs truncate">
                        {post.title}
                      </td>
                      <td className="p-3 text-gray-600">{post.author_name}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            post.status === "published"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {post.status}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500">
                        {post.likes_count ?? 0} likes • {post.comments_count ?? 0} comments
                      </td>
                      <td className="p-3 text-gray-500">
                        {new Intl.DateTimeFormat("en-US", {
                          dateStyle: "short",
                        }).format(new Date(post.created_at))}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/post/${post.slug}`}
                            className={buttonVariants({ variant: "ghost", size: "sm" }) + " text-xs h-7"}
                          >
                            View
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeletePost(post)}
                            disabled={deletingPostId === post.id}
                            className="px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition-colors disabled:opacity-50"
                          >
                            {deletingPostId === post.id ? "..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
