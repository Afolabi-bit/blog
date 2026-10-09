"use client";

import { useState, useEffect, useTransition, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { postsEndpoints } from "@/lib/endpoints";
import { CreatePostSchema } from "@/lib/validations";
import { MarkdownRenderer } from "@/components/post/MarkdownRenderer";
import { CoverUploader } from "@/components/editor/CoverUploader";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const TiptapEditor = dynamic(
  () =>
    import("@/components/editor/TiptapEditor").then((mod) => mod.TiptapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[450px] w-full flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-border/50 pb-3">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        <Skeleton className="h-6 w-3/4 rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-5/6 rounded-md" />
      </div>
    ),
  }
);
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Post } from "@/lib/types";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Columns,
  Copy,
  Eye,
  FileEdit,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";

interface PostEditorProps {
  initialPost?: Post;
}

interface AutosaveDraft {
  title: string;
  content: string;
  coverImage: string;
  tags: string[];
  timestamp: number;
}

export function PostEditor({ initialPost }: PostEditorProps) {
  const router = useRouter();
  const isEditing = Boolean(initialPost);
  const draftKey = `noterverse:draft:${initialPost?.id || "new"}`;
  const legacyDraftKey = `bloggr:draft:${initialPost?.id || "new"}`;

  const [title, setTitle] = useState(initialPost?.title || "");
  const [content, setContent] = useState(initialPost?.content || "");
  const [coverImage, setCoverImage] = useState(initialPost?.cover_image || "");
  const [tags, setTags] = useState<string[]>(initialPost?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<"draft" | "published">(
    initialPost?.status || "draft",
  );

  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("edit");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [forbiddenError, setForbiddenError] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Autosave states
  const [autosaveStatus, setAutosaveStatus] = useState<"saved" | "saving" | "unsaved" | "idle">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasRestorableDraft, setHasRestorableDraft] = useState(false);
  const [restorableDraftData, setRestorableDraftData] = useState<AutosaveDraft | null>(null);

  // Backend draft autosave tracking (based on sizeable content changes)
  const savedPostIdRef = useRef<string | null>(initialPost?.id || null);
  const isSavingBackendRef = useRef(false);
  const lastBackendSavedSnapshotRef = useRef<{
    title: string;
    content: string;
    coverImage: string;
    tags: string[];
  }>({
    title: initialPost?.title?.trim() || "",
    content: initialPost?.content?.trim() || "",
    coverImage: initialPost?.cover_image || "",
    tags: initialPost?.tags || [],
  });

  // Detect legacy HTML posts
  const isLegacyHtml = initialPost?.content
    ? /<p>|<div|<span|<h[1-6]|<br\s*\/?>/i.test(initialPost.content)
    : false;

  // Slug generation helper for display
  const generatedSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Dirty state calculation
  const isDirty =
    title !== (initialPost?.title || "") ||
    content !== (initialPost?.content || "") ||
    coverImage !== (initialPost?.cover_image || "") ||
    tags.join(",") !== (initialPost?.tags || []).join("");

  // Unsaved changes guard (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !isPending) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isPending]);

  // Check for restorable draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey) || localStorage.getItem(legacyDraftKey);
      if (raw) {
        const data = JSON.parse(raw) as AutosaveDraft;
        const isDifferent =
          data.title !== (initialPost?.title || "") ||
          data.content !== (initialPost?.content || "") ||
          data.coverImage !== (initialPost?.cover_image || "") ||
          (data.tags || []).join(",") !== (initialPost?.tags || []).join(",");

        if (isDifferent && (data.title || data.content)) {
          setHasRestorableDraft(true);
          setRestorableDraftData(data);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [draftKey, legacyDraftKey, initialPost]);

  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    postsEndpoints
      .getTags()
      .then((res) => {
        if (res.data?.tags) {
          setAvailableTags(res.data.tags.map((t) => t.name));
        }
      })
      .catch(() => {});
  }, []);

  // Determines if the user has made a sizeable content or metadata change since last backend save
  const hasSizeableChange = useCallback(() => {
    const last = lastBackendSavedSnapshotRef.current;
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    // 1. Initial draft creation: when post has not yet been saved to backend,
    // trigger as soon as it meets minimum post requirements
    if (!last.title && !last.content) {
      return trimmedTitle.length >= 5 && trimmedContent.length >= 20;
    }

    // 2. Metadata changes (title, cover image, or tags modified)
    if (trimmedTitle !== last.title) return true;
    if ((coverImage || "") !== last.coverImage) return true;
    if (tags.join(",") !== last.tags.join(",")) return true;

    // 3. Sizeable character delta in content (>= 40 characters added or removed, ~8-10 words / sentence)
    const charDelta = Math.abs(trimmedContent.length - last.content.length);
    if (charDelta >= 40) return true;

    // 4. Structural content change: paragraph, heading, list, or block added/removed
    const currentBlocks = trimmedContent.split(/\n+/).filter(Boolean).length;
    const lastBlocks = last.content.split(/\n+/).filter(Boolean).length;
    if (Math.abs(currentBlocks - lastBlocks) >= 1) return true;

    return false;
  }, [title, content, coverImage, tags]);

  // Save draft to backend function
  const saveDraftToBackend = useCallback(async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    // Must satisfy minimum viable post requirements for backend schema
    if (trimmedTitle.length < 5 || trimmedContent.length < 20) {
      return;
    }

    if (!hasSizeableChange() || isSavingBackendRef.current) {
      return;
    }

    isSavingBackendRef.current = true;
    setAutosaveStatus("saving");

    try {
      const draftStatus: "draft" | "published" = initialPost?.status === "published" ? "published" : "draft";
      const targetId = isEditing && initialPost ? initialPost.id : savedPostIdRef.current;

      if (targetId) {
        await postsEndpoints.updatePost(targetId, {
          title: trimmedTitle,
          content: trimmedContent,
          cover_image: coverImage || undefined,
          status: draftStatus,
          tags,
        });
      } else {
        const res = await postsEndpoints.createPost({
          title: trimmedTitle,
          content: trimmedContent,
          cover_image: coverImage || undefined,
          status: "draft",
          tags,
        });
        if (res.data?.id) {
          savedPostIdRef.current = res.data.id;
        }
      }

      lastBackendSavedSnapshotRef.current = {
        title: trimmedTitle,
        content: trimmedContent,
        coverImage: coverImage || "",
        tags: [...tags],
      };
      setAutosaveStatus("saved");
      setLastSavedAt(new Date());
    } catch (err: unknown) {
      // Background autosave failure: preserve local backup without disruptive error modal
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setForbiddenError(true);
      }
      setAutosaveStatus("unsaved");
    } finally {
      isSavingBackendRef.current = false;
    }
  }, [title, content, coverImage, tags, isEditing, initialPost, hasSizeableChange]);

  // Immediate local backup in localStorage (1.5s debounce for local resilience)
  useEffect(() => {
    if (!isDirty || (!title.trim() && !content.trim())) {
      return;
    }

    const timer = setTimeout(() => {
      try {
        const draft: AutosaveDraft = {
          title,
          content,
          coverImage,
          tags,
          timestamp: Date.now(),
        };
        localStorage.setItem(draftKey, JSON.stringify(draft));
      } catch {
        // ignore
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [title, content, coverImage, tags, draftKey, isDirty]);

  // Backend draft autosave: triggers ONLY upon sizeable content changes after typing pauses (no interval polling)
  useEffect(() => {
    if (!isDirty || !title.trim() || !content.trim()) {
      if (!isDirty) setAutosaveStatus("idle");
      return;
    }

    // Only save when a sizeable content change has occurred
    if (!hasSizeableChange()) {
      return;
    }

    setAutosaveStatus("unsaved");
    const debounceTimer = setTimeout(() => {
      saveDraftToBackend();
    }, 2500);

    return () => clearTimeout(debounceTimer);
  }, [title, content, coverImage, tags, isDirty, hasSizeableChange, saveDraftToBackend]);

  const handleRestoreDraft = () => {
    if (!restorableDraftData) return;
    setTitle(restorableDraftData.title || "");
    setContent(restorableDraftData.content || "");
    setCoverImage(restorableDraftData.coverImage || "");
    setTags(restorableDraftData.tags || []);
    setHasRestorableDraft(false);
    toast.success("Draft restored from local backup");
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(draftKey);
    setHasRestorableDraft(false);
    setRestorableDraftData(null);
    toast.info("Autosaved draft discarded");
  };

  const handleAddTag = (specificTag?: string) => {
    const raw = specificTag || tagInput;
    const cleanTag = raw
      .trim()
      .toLowerCase()
      .replace(/[^\w-]/g, "");
    if (!cleanTag) return;
    if (tags.includes(cleanTag)) {
      toast.info(`Tag #${cleanTag} is already added`);
      setTagInput("");
      return;
    }
    if (tags.length >= 10) {
      toast.error("Maximum 10 tags allowed per article");
      return;
    }
    setTags((prev) => [...prev, cleanTag]);
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleCopyMarkdown = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMarkdown(true);
      toast.success("Markdown copied to clipboard");
      setTimeout(() => setCopiedMarkdown(false), 2500);
    } catch {
      toast.error("Failed to copy markdown to clipboard");
    }
  }, [content]);

  const handleSubmit = async (targetStatus?: "draft" | "published") => {
    setFormError(null);
    setFieldErrors({});
    setForbiddenError(false);

    const finalStatus = targetStatus || status;
    if (targetStatus) setStatus(targetStatus);

    const parseResult = CreatePostSchema.safeParse({
      title,
      content,
      cover_image: coverImage || undefined,
      status: finalStatus,
      tags,
    });

    if (!parseResult.success) {
      const errors: Record<string, string> = {};
      for (const issue of parseResult.error.issues) {
        if (issue.path[0]) {
          errors[String(issue.path[0])] = issue.message;
        }
      }
      setFieldErrors(errors);
      toast.error("Please resolve form validation issues before submitting");
      return;
    }

    startTransition(async () => {
      const actionText = isEditing ? "Updating post…" : "Creating post…";
      const toastId = toast.loading(actionText);

      try {
        const targetId = isEditing && initialPost ? initialPost.id : savedPostIdRef.current;

        if (targetId) {
          await postsEndpoints.updatePost(targetId, {
            title,
            content,
            cover_image: coverImage || undefined,
            status: finalStatus,
            tags,
          });
          const toastMsg = finalStatus === "published" ? "Published" : "Draft saved";
          toast.success(toastMsg, { id: toastId });
        } else {
          const res = await postsEndpoints.createPost({
            title,
            content,
            cover_image: coverImage || undefined,
            status: finalStatus,
            tags,
          });
          if (res.data?.id) {
            savedPostIdRef.current = res.data.id;
          }
          const toastMsg = finalStatus === "published" ? "Published" : "Draft saved";
          toast.success(toastMsg, { id: toastId });
        }

        // Clean up autosaved draft on successful save
        try {
          localStorage.removeItem(draftKey);
        } catch {
          // ignore
        }

        lastBackendSavedSnapshotRef.current = {
          title: title.trim(),
          content: content.trim(),
          coverImage: coverImage || "",
          tags: [...tags],
        };

        router.push("/dashboard");
        router.refresh();
      } catch (err: unknown) {
        let msg = "Failed to save article";
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 403) {
            setForbiddenError(true);
            try {
              sessionStorage.setItem(
                "noterverse:expired-session-draft",
                JSON.stringify({
                  title,
                  content,
                  coverImage,
                  tags,
                  timestamp: Date.now(),
                })
              );
            } catch {
              // ignore
            }
            msg = "Your session expired. Copy your work before leaving.";
          } else {
            msg =
              err.response?.data?.message ||
              err.response?.data?.error ||
              err.message ||
              msg;
          }
        } else if (err instanceof Error) {
          msg = err.message;
        }
        setFormError(msg);
        toast.error(msg, { id: toastId });
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Studio Header Bar */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Link href="/dashboard">
              <ArrowLeft className="size-4" />
              <span>Dashboard</span>
            </Link>
          </Button>

          <span className="text-muted-foreground/40">•</span>

          <span className="font-serif text-lg font-bold text-foreground">
            {isEditing ? "Edit Article" : "Write Article"}
          </span>

          {/* Autosave status indicator */}
          <div
            role="status"
            aria-live="polite"
            className="hidden items-center gap-1.5 font-mono text-xs tabular-nums text-muted-foreground sm:inline-flex"
          >
            {autosaveStatus === "saving" && (
              <>
                <Loader2 className="size-3 animate-spin text-muted-foreground" />
                <span>Saving…</span>
              </>
            )}
            {autosaveStatus === "saved" && (
              <>
                <Check className="size-3 text-status-success" />
                <span>
                  Saved
                  {lastSavedAt
                    ? ` ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    : ""}
                </span>
              </>
            )}
            {autosaveStatus === "unsaved" && (
              <>
                <span className="size-2 rounded-full bg-status-warning inline-block" />
                <span>Unsaved changes</span>
              </>
            )}
          </div>
        </div>

        {/* View Mode & Publish Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center rounded-lg border border-border bg-card p-0.5 shadow-2xs">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("edit")}
              className={`h-7 px-2.5 text-xs font-medium ${
                viewMode === "edit"
                  ? "bg-muted text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileEdit className="mr-1.5 size-3.5" />
              <span>Edit</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("preview")}
              className={`h-7 px-2.5 text-xs font-medium ${
                viewMode === "preview"
                  ? "bg-muted text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye className="mr-1.5 size-3.5" />
              <span>Preview</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("split")}
              className={`hidden lg:flex h-7 px-2.5 text-xs font-medium ${
                viewMode === "split"
                  ? "bg-muted text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Columns className="mr-1.5 size-3.5" />
              <span>Split</span>
            </Button>
          </div>

          {/* Save as Draft */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => handleSubmit("draft")}
            className="h-8 gap-1.5 text-xs"
          >
            {isPending && status === "draft" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            <span>Save Draft</span>
          </Button>

          {/* Publish Button */}
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() => handleSubmit("published")}
            className="h-8 gap-1.5 text-xs bg-accent-solid text-white hover:bg-accent-solid/90"
          >
            {isPending && status === "published" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            <span>{isEditing && initialPost?.status === "published" ? "Update Article" : "Publish"}</span>
          </Button>
        </div>
      </div>

      {/* Restorable Draft Banner */}
      {hasRestorableDraft && restorableDraftData && (
        <div
          role="region"
          aria-label="Restorable draft notification"
          className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 sm:gap-4 rounded-xl border border-border bg-muted/30 p-3.5 sm:p-4 shadow-xs backdrop-blur-xs transition-all animate-in fade-in duration-200"
        >
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground shadow-2xs">
              <RotateCcw className="size-4" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  Unsaved local draft found
                </span>
                <span className="inline-flex items-center rounded-full bg-accent-solid/15 px-2 py-0.5 text-[11px] font-mono font-medium text-accent-solid">
                  {new Date(restorableDraftData.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You have unsaved changes from{" "}
                <span className="font-medium text-foreground">
                  {new Date(restorableDraftData.timestamp).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                . Would you like to restore them?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 sm:self-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDiscardDraft}
              className="h-8 px-3 text-xs gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="size-3.5" />
              <span>Discard</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleRestoreDraft}
              className="h-8 px-3.5 text-xs gap-1.5 bg-accent-solid text-white hover:bg-accent-solid/90 shadow-2xs font-medium"
            >
              <RotateCcw className="size-3.5" />
              <span>Restore Draft</span>
            </Button>
          </div>
        </div>
      )}

      {/* 403 Permission Denied Mid-session Notice */}
      {forbiddenError && (
        <div
          role="alert"
          aria-live="assertive"
          className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3.5 sm:gap-4 rounded-xl border border-destructive/30 bg-destructive/[0.05] p-3.5 sm:p-4 shadow-xs"
        >
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/15 text-destructive shadow-2xs">
              <AlertCircle className="size-4" />
            </div>
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <span className="text-sm font-semibold text-destructive">
                Your session expired. Copy your work before leaving.
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your session expired or permissions were changed. Your draft has been preserved in session storage. Copy your content before leaving:
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 sm:self-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyMarkdown}
              className="h-8 px-3 text-xs gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              {copiedMarkdown ? (
                <>
                  <Check className="size-3.5 text-status-success" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Copy Markdown</span>
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push("/login")}
              className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              Go to Login
            </Button>
          </div>
        </div>
      )}

      {/* Legacy HTML Post Notice */}
      {isLegacyHtml && (
        <Alert className="border-border bg-muted/40">
          <AlertTitle className="text-sm font-semibold">
            This post was written in an older format.
          </AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            Saving changes will convert it to modern markdown.
          </AlertDescription>
        </Alert>
      )}

      {formError && !forbiddenError && (
        <Alert variant="destructive">
          <AlertTitle>Unable to save article</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {/* Title & Metadata Inputs */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-8">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title" className="text-sm font-semibold">
              Post title
            </Label>
            <Input
              id="title"
              placeholder="Post title"
              aria-label="Post title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
              aria-invalid={Boolean(fieldErrors.title)}
              className="font-serif text-2xl font-bold sm:text-3xl h-12 bg-card"
            />
            {fieldErrors.title && (
              <p className="text-xs text-destructive">{fieldErrors.title}</p>
            )}

            {/* B4: Stable slug notice when editing published post, or slug preview when creating */}
            {isEditing && initialPost?.slug ? (
              <p className="text-xs text-muted-foreground font-mono">
                URL: <span className="text-foreground">/post/{initialPost.slug}</span> (The URL stays the same when you rename this post)
              </p>
            ) : generatedSlug ? (
              <p className="text-xs text-muted-foreground font-mono">
                Slug: /post/{generatedSlug}
              </p>
            ) : null}
          </div>

          {/* Tags Manager */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold">Tags</Label>
            <div className="flex flex-wrap items-center gap-1.5">
              {tags.map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="gap-1.5 font-mono text-xs py-1 px-2.5 text-foreground bg-muted"
                >
                  <span>#{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Remove tag ${t}`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}

              <div className="relative flex items-center gap-1.5">
                <Input
                  type="text"
                  placeholder="Add tag…"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      handleAddTag();
                    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
                      handleRemoveTag(tags[tags.length - 1]);
                    }
                  }}
                  disabled={isPending}
                  className="h-8 w-36 text-xs font-mono bg-card"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddTag()}
                  disabled={isPending || !tagInput.trim()}
                  className="h-8 px-2 text-xs"
                  aria-label="Add tag"
                >
                  <Plus className="size-3.5" />
                </Button>

                {tagInput.trim() &&
                  availableTags.filter(
                    (t) =>
                      !tags.includes(t) &&
                      t.toLowerCase().includes(tagInput.toLowerCase().trim())
                  ).length > 0 && (
                    <div className="absolute left-0 top-full z-20 mt-1 flex flex-wrap gap-1 rounded-md border border-border bg-popover p-1.5 shadow-md max-w-xs">
                      {availableTags
                        .filter(
                          (t) =>
                            !tags.includes(t) &&
                            t.toLowerCase().includes(tagInput.toLowerCase().trim())
                        )
                        .slice(0, 5)
                        .map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => handleAddTag(suggestion)}
                            className="rounded px-2 py-0.5 font-mono text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            #{suggestion}
                          </button>
                        ))}
                    </div>
                  )}
              </div>
            </div>
            {fieldErrors.tags && (
              <p className="text-xs text-destructive">{fieldErrors.tags}</p>
            )}
          </div>
        </div>

        {/* Cover Image Column */}
        <div className="flex flex-col gap-1.5 lg:col-span-4">
          <Label className="text-sm font-semibold">Cover Image</Label>
          <CoverUploader
            value={coverImage}
            onChange={setCoverImage}
            disabled={isPending}
          />
          {fieldErrors.cover_image && (
            <p className="text-xs text-destructive">{fieldErrors.cover_image}</p>
          )}
        </div>
      </div>

      {/* Editor & Preview Workspace */}
      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="content" className="text-sm font-semibold">
            Article Body
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyMarkdown}
            className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            {copiedMarkdown ? (
              <Check className="size-3.5 text-green-600" />
            ) : (
              <Copy className="size-3.5" />
            )}
            <span>Copy Markdown</span>
          </Button>
        </div>

        <div className="min-h-[500px] w-full">
          {viewMode === "edit" && (
            <div className="flex flex-col gap-1">
              <TiptapEditor
                content={content}
                onChange={setContent}
                disabled={isPending}
                placeholder="Write your article in rich text or switch to Source mode for raw markdown..."
              />
              {fieldErrors.content && (
                <p className="text-xs text-destructive">{fieldErrors.content}</p>
              )}
            </div>
          )}

          {viewMode === "preview" && (
            <div className="h-[650px] min-h-[480px] max-h-[85vh] overflow-y-auto custom-scrollbar rounded-xl border border-border bg-card p-6 sm:p-8">
              {content.trim() ? (
                <MarkdownRenderer content={content} />
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Nothing to preview. Start writing on the Edit tab!
                </p>
              )}
            </div>
          )}

          {viewMode === "split" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="flex flex-col gap-1">
                <TiptapEditor
                  content={content}
                  onChange={setContent}
                  disabled={isPending}
                  placeholder="Write your article in rich text or raw markdown..."
                />
                {fieldErrors.content && (
                  <p className="text-xs text-destructive">{fieldErrors.content}</p>
                )}
              </div>

              <div className="h-[650px] min-h-[480px] max-h-[85vh] overflow-y-auto custom-scrollbar rounded-xl border border-border bg-card p-6 sm:p-8">
                {content.trim() ? (
                  <MarkdownRenderer content={content} />
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Live markdown preview will appear here as you write.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
