"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { userEndpoints } from "@/lib/endpoints";
import { useAuth } from "@/components/general/AuthProvider";
import { AuthorRequestSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { AuthorRequest } from "@/lib/types";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  Loader2,
  PenSquare,
  Plus,
  Send,
  Sparkles,
  Trash2,
  XCircle,
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

  const handleAddLink = () => {
    if (sampleLinks.length >= 5) {
      toast.info("Maximum 5 portfolio links allowed");
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
      const toastId = toast.loading("Submitting author application…");
      try {
        const res = await userEndpoints.applyForAuthor({
          bio: bio.trim(),
          sample_links: validLinks,
          motivation: motivation.trim(),
        });

        if (res.status === "success" && res.data) {
          toast.success("Author application submitted successfully!", {
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
      <div className="mx-auto max-w-xl py-12 text-center">
        <Card className="border-border bg-card p-8">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent-solid/10 text-accent-solid mb-4">
            <CheckCircle2 className="size-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-foreground">
            You are an Author!
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            You already have active author publishing privileges on Bloggr. You
            can create, draft, and publish articles directly from your studio.
          </p>
          <div className="mt-6">
            <Button asChild className="gap-2 bg-accent-solid text-white hover:bg-accent-solid/90">
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
      <div className="mx-auto max-w-2xl py-10 flex flex-col gap-4">
        <div className="h-8 w-48 bg-muted rounded-md animate-pulse" />
        <div className="h-64 bg-card rounded-xl border border-border animate-pulse" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-6 flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Become an Author
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Apply for author privileges to write, draft, and publish articles on Bloggr.
        </p>
      </div>

      {/* Existing Application Status Card */}
      {request ? (
        <Card className="border-border bg-card overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="size-5 text-accent-solid" />
                <CardTitle className="font-serif text-lg font-bold">
                  Application Status
                </CardTitle>
              </div>

              <Badge
                variant="outline"
                className={`font-mono text-xs uppercase tracking-wider py-1 px-2.5 font-semibold ${
                  request.status === "pending"
                    ? "border-status-warning/40 bg-status-warning/10 text-status-warning"
                    : request.status === "approved"
                      ? "border-status-success/40 bg-status-success/10 text-status-success"
                      : "border-status-danger/40 bg-status-danger/10 text-status-danger"
                }`}
              >
                {request.status === "pending" && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    <span>Under Review</span>
                  </span>
                )}
                {request.status === "approved" && (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="size-3" />
                    <span>Approved</span>
                  </span>
                )}
                {request.status === "rejected" && (
                  <span className="flex items-center gap-1">
                    <XCircle className="size-3" />
                    <span>Declined</span>
                  </span>
                )}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 flex flex-col gap-5">
            {request.status === "pending" && (
              <Alert className="border-status-warning/30 bg-status-warning/5">
                <Clock className="size-4 text-status-warning" />
                <AlertTitle className="text-foreground font-semibold">
                  Application Under Review
                </AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Thank you for applying to become an author on Bloggr! Our editorial team is currently reviewing your profile and portfolio samples. We typically respond within 24-48 hours.
                </AlertDescription>
              </Alert>
            )}

            {request.status === "approved" && (
              <Alert className="border-status-success/30 bg-status-success/5">
                <CheckCircle2 className="size-4 text-status-success" />
                <AlertTitle className="text-status-success font-semibold">
                  Application Approved!
                </AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Congratulations! Your application has been approved. You now have access to the Author Studio to create and publish articles.
                </AlertDescription>
              </Alert>
            )}

            {request.status === "rejected" && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertTitle>Application Declined</AlertTitle>
                <AlertDescription className="text-xs mt-1 leading-relaxed">
                  {request.review_notes ||
                    "Thank you for your interest. Unfortunately, your application was not approved at this time. You may re-apply with updated portfolio work."}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-4 text-xs">
              <div>
                <span className="font-semibold text-foreground">Submitted on: </span>
                <span className="text-muted-foreground">
                  {formatDate(request.created_at)}
                </span>
              </div>

              <div>
                <span className="font-semibold text-foreground">Bio: </span>
                <p className="mt-1 text-muted-foreground leading-relaxed">
                  {request.bio}
                </p>
              </div>

              <div>
                <span className="font-semibold text-foreground">Motivation: </span>
                <p className="mt-1 text-muted-foreground leading-relaxed">
                  {request.motivation}
                </p>
              </div>

              {request.sample_links && request.sample_links.length > 0 && (
                <div>
                  <span className="font-semibold text-foreground">Portfolio Links:</span>
                  <ul className="mt-1 flex flex-col gap-1 pl-4 list-disc">
                    {request.sample_links.map((link) => (
                      <li key={link}>
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent-solid hover:underline flex items-center gap-1 inline-flex"
                        >
                          <span>{link}</span>
                          <ExternalLink className="size-3" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {request.status === "approved" && (
              <Button asChild className="w-fit gap-2 bg-accent-solid text-white hover:bg-accent-solid/90">
                <Link href="/dashboard">
                  <span>Enter Author Studio</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Application Form */
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-serif text-xl font-bold flex items-center gap-2">
              <Sparkles className="size-5 text-accent-warm" />
              <span>Author Application</span>
            </CardTitle>
            <CardDescription>
              Tell us about your background, expertise, and what topics you plan to write about.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertTitle>Application Error</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bio">Author Biography</Label>
                <Textarea
                  id="bio"
                  placeholder="Senior software engineer with 5+ years building backend microservices in Go and distributed database architectures…"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={isPending}
                  aria-invalid={Boolean(fieldErrors.bio)}
                  className="bg-background text-sm resize-none"
                  required
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Min. 10 characters</span>
                  <span>{bio.length}/1000</span>
                </div>
                {fieldErrors.bio && (
                  <p className="text-xs text-destructive">{fieldErrors.bio}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="motivation">Motivation & Writing Topics</Label>
                <Textarea
                  id="motivation"
                  placeholder="I want to share deep dives on Go concurrency patterns, benchmark analysis, and production postmortems with the engineering community…"
                  rows={4}
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  disabled={isPending}
                  aria-invalid={Boolean(fieldErrors.motivation)}
                  className="bg-background text-sm resize-none"
                  required
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Min. 10 characters</span>
                  <span>{motivation.length}/2000</span>
                </div>
                {fieldErrors.motivation && (
                  <p className="text-xs text-destructive">{fieldErrors.motivation}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label>Sample Writing / Portfolio Links</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAddLink}
                    disabled={isPending || sampleLinks.length >= 5}
                    className="h-7 gap-1 text-xs text-accent-solid hover:text-accent-solid"
                  >
                    <Plus className="size-3.5" />
                    <span>Add Link</span>
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  {sampleLinks.map((link, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        type="url"
                        placeholder="https://github.com/username or blog article URL…"
                        value={link}
                        onChange={(e) => handleLinkChange(idx, e.target.value)}
                        disabled={isPending}
                        className="bg-background text-xs"
                      />
                      {sampleLinks.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveLink(idx)}
                          className="size-8 text-muted-foreground hover:text-destructive"
                          aria-label="Remove link"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {fieldErrors.sample_links && (
                  <p className="text-xs text-destructive">{fieldErrors.sample_links}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-fit mt-2 gap-2 bg-accent-solid text-white hover:bg-accent-solid/90"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                <span>Submit Application</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
