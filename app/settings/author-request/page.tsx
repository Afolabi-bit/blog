"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { userEndpoints } from "@/lib/endpoints";
import { useAuth } from "@/components/general/AuthProvider";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { AuthorRequest } from "@/lib/types";

export default function AuthorRequestPage() {
  const { user } = useAuth();

  const [request, setRequest] = useState<AuthorRequest | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [bio, setBio] = useState("");
  const [motivation, setMotivation] = useState("");
  const [sampleLinks, setSampleLinks] = useState<string[]>([""]);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchRequestStatus = async () => {
    try {
      setLoading(true);
      const res = await userEndpoints.getAuthorRequestStatus();
      if (res.data) {
        setRequest(res.data);
      }
    } catch (err: unknown) {
      // 404 means no request submitted yet
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setRequest(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestStatus();
  }, []);

  const handleAddLink = () => {
    setSampleLinks([...sampleLinks, ""]);
  };

  const handleLinkChange = (index: number, val: string) => {
    const updated = [...sampleLinks];
    updated[index] = val;
    setSampleLinks(updated);
  };

  const handleRemoveLink = (index: number) => {
    setSampleLinks(sampleLinks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validLinks = sampleLinks.map((l) => l.trim()).filter(Boolean);

    if (bio.trim().length < 10) {
      setError("Bio must be at least 10 characters.");
      return;
    }

    if (motivation.trim().length < 10) {
      setError("Motivation must be at least 10 characters.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await userEndpoints.applyForAuthor({
          bio: bio.trim(),
          sample_links: validLinks,
          motivation: motivation.trim(),
        });

        if (res.status === "success" && res.data) {
          toast.success("Author application submitted successfully!");
          setRequest(res.data);
        } else {
          toast.error(res.message || "Failed to submit application");
        }
      } catch (err: unknown) {
        let msg = "Failed to submit application";
        if (axios.isAxiosError(err)) {
          msg = err.response?.data?.message || err.message || msg;
        }
        setError(msg);
        toast.error(msg);
      }
    });
  };

  if (loading) {
    return (
      <div className="py-12 max-w-xl mx-auto">
        <div className="h-8 w-60 bg-gray-100 rounded-md animate-pulse mb-6" />
        <div className="h-64 bg-gray-50 border border-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  // If already an author or admin
  if (user?.role === "author" || user?.role === "admin") {
    return (
      <div className="py-12 max-w-xl mx-auto">
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-emerald-900">You Are an Author!</CardTitle>
            <CardDescription className="text-emerald-700">
              Your account has full author privileges to write, edit, and publish articles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard" className={buttonVariants()}>
              Go to Author Studio →
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pending application banner
  if (request?.status === "pending") {
    return (
      <div className="py-12 max-w-xl mx-auto">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <CardTitle className="text-amber-900">Application Under Review</CardTitle>
            <CardDescription className="text-amber-700">
              We have received your application to become an author. Our editorial team will review your submission shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-amber-200 text-sm space-y-2">
              <p className="text-gray-600">
                <strong className="text-gray-900">Submitted:</strong>{" "}
                {new Intl.DateTimeFormat("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(request.created_at))}
              </p>
              <p className="text-gray-600">
                <strong className="text-gray-900">Bio:</strong> {request.bio}
              </p>
            </div>
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              Return to Home
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Application form (if no active request or previously rejected)
  return (
    <div className="py-8 max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Become an Author</CardTitle>
          <CardDescription>
            Apply for publishing privileges to write articles, build an audience, and contribute to the community.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {request?.status === "rejected" && (
            <div className="mb-6 rounded-lg bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800">
              <p className="font-semibold mb-1">Previous Application Notice</p>
              <p className="text-rose-700 mb-2">
                Your previous application was not approved.
              </p>
              {request.review_notes && (
                <p className="italic bg-white/70 p-2.5 rounded border border-rose-100">
                  Feedback: &ldquo;{request.review_notes}&rdquo;
                </p>
              )}
              <p className="mt-2 text-xs">
                Feel free to update your application details below and reapply.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="bio">Author Biography</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about your background, expertise, and what you write about (min 10 characters)..."
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Sample Work & Portfolio Links</Label>
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="text-xs font-semibold text-[#ef862b] hover:underline"
                >
                  + Add URL
                </button>
              </div>
              <div className="space-y-2">
                {sampleLinks.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      type="url"
                      placeholder="https://github.com/... or https://dev.to/..."
                      value={link}
                      onChange={(e) => handleLinkChange(idx, e.target.value)}
                      disabled={isPending}
                    />
                    {sampleLinks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(idx)}
                        className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivation">Motivation</Label>
              <Textarea
                id="motivation"
                placeholder="Why do you want to write on this platform? (min 10 characters)..."
                rows={3}
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                required
                disabled={isPending}
              />
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Submitting Application..." : "Submit Author Application"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
