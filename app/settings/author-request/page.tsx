"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { userEndpoints } from "@/lib/endpoints";
import { useAuth } from "@/components/general/AuthProvider";
import { AuthorRequestSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { AuthorRequest } from "@/lib/types";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  PenSquare,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AuthorRequestPage() {
  const { user } = useAuth();
  const [request, setRequest] = useState<AuthorRequest | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [bio, setBio] = useState("");
  const [motivation, setMotivation] = useState("");
  const [sampleLinks, setSampleLinks] = useState<string[]>([""]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAlreadyAuthor = user?.role === "author" || user?.role === "admin";

  const fetchRequestStatus = async () => {
    try {
      setLoading(true);
      const res = await userEndpoints.getAuthorRequestStatus();
      if (res.data) {
        setRequest(res.data);
      }
    } catch (err: unknown) {
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

  // Cooldown calculation for rejected applications (7 days)
  const rejectionTimestamp =
    request?.status === "rejected"
      ? new Date(request.updated_at || request.created_at).getTime()
      : null;

  const cooldownPeriodMs = 7 * 24 * 60 * 60 * 1000;
  const cooldownEndsAt = rejectionTimestamp
    ? rejectionTimestamp + cooldownPeriodMs
    : 0;
  const now = Date.now();
  const isCooldownActive =
    request?.status === "rejected" && now < cooldownEndsAt;

  const handleAddLink = () => {
    if (sampleLinks.length >= 3) {
      toast.info("Maximum 3 links allowed");
      return;
    }
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
    if (isCooldownActive) {
      toast.error(
        "Please wait for the 7-day cooldown to finish before reapplying.",
      );
      return;
    }

    setFormError(null);
    setFieldErrors({});

    const validLinks = sampleLinks.map((l) => l.trim()).filter(Boolean);

    const result = AuthorRequestSchema.safeParse({
      bio: bio.trim(),
      sample_links: validLinks,
      motivation: motivation.trim(),
    });

    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        if (issue.path[0]) errs[String(issue.path[0])] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    startTransition(async () => {
      const toastId = toast.loading("Submitting application…");
      try {
        const res = await userEndpoints.applyForAuthor({
          bio: bio.trim(),
          sample_links: validLinks,
          motivation: motivation.trim(),
        });

        if (res.status === "success" && res.data) {
          toast.success("Application submitted successfully", {
            id: toastId,
          });
          setRequest(res.data);
        } else {
          toast.error(res.message || "Failed to submit application", {
            id: toastId,
          });
        }
      } catch (err: unknown) {
        let msg = "Failed to submit application";
        if (axios.isAxiosError(err)) {
          msg = err.response?.data?.message || err.message || msg;
        }
        setFormError(msg);
        toast.error(msg, { id: toastId });
      }
    });
  };

  if (isAlreadyAuthor) {
    return (
      <div className="mx-auto max-w-lg py-16 px-4 text-center">
        <Card className="rounded-2xl border border-border/80 bg-card p-8">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent-solid/10 text-accent-solid mb-4">
            <CheckCircle2 className="size-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-foreground">
            You are an author
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            You have active publishing privileges on Bloggr. You can create and publish articles directly from your studio.
          </p>
          <div className="mt-6">
            <Button
              asChild
              className="gap-2 bg-accent-solid text-white hover:bg-accent-solid/90"
            >
              <Link href="/dashboard">
                <PenSquare className="size-4" />
                <span>Go to Author Studio</span>
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg py-12 px-4 flex flex-col gap-4 animate-pulse">
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="h-96 bg-card rounded-2xl border border-border" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-10 px-4 flex flex-col gap-6">
      {/* Back link */}
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Settings</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {request?.status === "rejected" && !isCooldownActive
            ? "Reapply for Author Status"
            : "Author Application"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Tell us about your background and what topics you plan to write about.
        </p>
      </div>

      {/* Case 1: Pending Application */}
      {request && request.status === "pending" && (
        <Card className="rounded-2xl border border-border/80 bg-card p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base text-foreground">
              Application Under Review
            </h2>
            <Badge
              variant="outline"
              className="font-mono text-xs uppercase tracking-wider py-0.5 px-2 text-status-warning border-status-warning/40 bg-status-warning/10"
            >
              Pending
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Your application was submitted on {formatDate(request.created_at)}. We will review it shortly and update your account.
          </p>

          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-xs flex flex-col gap-3">
            <div>
              <span className="font-medium text-foreground">Bio:</span>
              <p className="text-muted-foreground mt-0.5 whitespace-pre-wrap">
                {request.bio}
              </p>
            </div>
            <div>
              <span className="font-medium text-foreground">Writing topics:</span>
              <p className="text-muted-foreground mt-0.5 whitespace-pre-wrap">
                {request.motivation}
              </p>
            </div>
            {request.sample_links && request.sample_links.length > 0 && (
              <div>
                <span className="font-medium text-foreground">Links:</span>
                <ul className="mt-1 flex flex-col gap-1">
                  {request.sample_links.map((link) => (
                    <li key={link}>
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-solid hover:underline inline-flex items-center gap-1"
                      >
                        <span className="truncate">{link}</span>
                        <ExternalLink className="size-3 shrink-0" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Case 2: Rejected Application with active cooldown */}
      {request && request.status === "rejected" && isCooldownActive && (
        <Card className="rounded-2xl border border-border/80 bg-card p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base text-foreground">
              Application Status
            </h2>
            <Badge
              variant="outline"
              className="font-mono text-xs uppercase tracking-wider py-0.5 px-2 text-status-danger border-status-danger/40 bg-status-danger/10"
            >
              Declined
            </Badge>
          </div>

          {request.review_notes && (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-xs flex flex-col gap-1">
              <span className="font-medium text-foreground">Feedback from editors:</span>
              <p className="text-muted-foreground leading-relaxed">
                {request.review_notes}
              </p>
            </div>
          )}

          <div className="flex items-start gap-2.5 text-xs text-muted-foreground pt-1">
            <Clock className="size-4 shrink-0 text-muted-foreground mt-0.5" />
            <span>
              You may submit a new application on{" "}
              <strong className="text-foreground font-semibold">
                {new Date(cooldownEndsAt).toLocaleDateString([], {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </strong>
              .
            </span>
          </div>
        </Card>
      )}

      {/* Case 3: Fresh Application or Cooldown Elapsed */}
      {(!request || (request.status === "rejected" && !isCooldownActive)) && (
        <Card className="rounded-2xl border border-border/80 bg-card p-6 sm:p-7">
          {request && request.status === "rejected" && (
            <div className="mb-6 rounded-xl border border-border/60 bg-muted/20 p-4 text-xs flex items-start gap-2.5">
              <RotateCcw className="size-4 text-accent-solid shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground">Previous feedback:</span>
                <p className="text-muted-foreground leading-relaxed">
                  {request.review_notes || request.admin_note || "You can now submit an updated application."}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* General form error */}
            {formError && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
              >
                <AlertCircle className="size-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Field 1: Bio */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bio" className="text-sm font-medium text-foreground">
                Author bio
              </Label>
              <Textarea
                id="bio"
                placeholder="Tell readers a bit about yourself, your background, or what you love writing about…"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={isPending}
                aria-invalid={Boolean(fieldErrors.bio)}
                className="custom-scrollbar resize-none text-sm bg-background border-border/80 focus-visible:ring-1.5 focus-visible:ring-accent-solid/30 focus-visible:border-accent-solid rounded-xl p-3 leading-relaxed"
                required
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className={fieldErrors.bio ? "text-destructive" : ""}>
                  {fieldErrors.bio || "Min. 10 characters"}
                </span>
                <span className="font-mono tabular-nums text-muted-foreground/70">
                  {bio.length}/1000
                </span>
              </div>
            </div>

            {/* Field 2: Motivation */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="motivation" className="text-sm font-medium text-foreground">
                What do you plan to write about?
              </Label>
              <Textarea
                id="motivation"
                placeholder="Share the topics, stories, essays, or ideas you'd like to publish on Bloggr…"
                rows={3}
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                disabled={isPending}
                aria-invalid={Boolean(fieldErrors.motivation)}
                className="custom-scrollbar resize-none text-sm bg-background border-border/80 focus-visible:ring-1.5 focus-visible:ring-accent-solid/30 focus-visible:border-accent-solid rounded-xl p-3 leading-relaxed"
                required
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className={fieldErrors.motivation ? "text-destructive" : ""}>
                  {fieldErrors.motivation || "Min. 10 characters"}
                </span>
                <span className="font-mono tabular-nums text-muted-foreground/70">
                  {motivation.length}/2000
                </span>
              </div>
            </div>

            {/* Field 3: Sample links */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-foreground">
                  Writing samples or portfolio <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                {sampleLinks.length < 3 && (
                  <button
                    type="button"
                    onClick={handleAddLink}
                    disabled={isPending}
                    className="text-xs font-semibold text-accent-solid hover:opacity-85 inline-flex items-center gap-1 transition-opacity"
                  >
                    <Plus className="size-3.5" />
                    <span>Add Link</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {sampleLinks.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      type="url"
                      aria-label={`Sample link ${idx + 1}`}
                      placeholder="https://example.com/my-writing"
                      value={link}
                      onChange={(e) => handleLinkChange(idx, e.target.value)}
                      disabled={isPending}
                      className="text-sm bg-background border-border/80 rounded-xl h-10"
                    />
                    {sampleLinks.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveLink(idx)}
                        className="size-10 text-muted-foreground hover:text-destructive shrink-0"
                        aria-label={`Remove link ${idx + 1}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {fieldErrors.sample_links && (
                <p className="text-xs text-destructive">
                  {fieldErrors.sample_links}
                </p>
              )}
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="gap-2 bg-accent-solid text-white hover:bg-accent-solid/90 rounded-xl px-5 py-2.5 h-10 text-sm font-semibold active:scale-[0.98] transition-all"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Submitting…</span>
                  </>
                ) : (
                  <span>Submit application</span>
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
