"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { postsEndpoints } from "@/lib/endpoints";
import { CreatePostSchema } from "@/lib/validations";
import { MarkdownRenderer } from "@/components/post/MarkdownRenderer";
import { CoverUploader } from "@/components/editor/CoverUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Post } from "@/lib/types";
import {
  AlertTriangle,
  ArrowLeft,
  Columns,
  Eye,
  FileEdit,
  Loader2,
  Plus,
  Save,
  Send,
  X,
} from "lucide-react";

interface PostEditorProps {
  initialPost?: Post;
}

export function PostEditor({ initialPost }: PostEditorProps) {
  const router = useRouter();
  const isEditing = Boolean(initialPost);

  const [title, setTitle] = useState(initialPost?.title || "");
  const [content, setContent] = useState(initialPost?.content || "");
  const [coverImage, setCoverImage] = useState(initialPost?.cover_image || "");
  const [tags, setTags] = useState<string[]>(initialPost?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<"draft" | "published">(
    initialPost?.status || "draft",
  );

  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">(
    "split",
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Slug generation helper for display
  const generatedSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const hasSlugChanged =
    isEditing &&
    initialPost?.status === "published" &&
    title.trim() !== initialPost.title.trim();

  const handleAddTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanTag = tagInput
      .trim()
      .toLowerCase()
      .replace(/[^\w-]/g, "");
    if (!cleanTag) return;
    if (tags.includes(cleanTag)) {
      toast.info(`Tag #${cleanTag} is already added`);
      setTagInput("");
      return;
    }
    if (tags.length >= 8) {
      toast.error("Maximum 8 tags allowed per article");
      return;
    }
    setTags((prev) => [...prev, cleanTag]);
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (targetStatus?: "draft" | "published") => {
    setFormError(null);
    setFieldErrors({});

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
        if (isEditing && initialPost) {
          const res = await postsEndpoints.updatePost(initialPost.id, {
            title,
            content,
            cover_image: coverImage || undefined,
            status: finalStatus,
            tags,
          });
          toast.success(res.message || "Article updated successfully!", {
            id: toastId,
          });
        } else {
          const res = await postsEndpoints.createPost({
            title,
            content,
            cover_image: coverImage || undefined,
            status: finalStatus,
            tags,
          });
          toast.success(res.message || "Article created successfully!", {
            id: toastId,
          });
        }

        router.push("/dashboard");
        router.refresh();
      } catch (err: unknown) {
        let msg = "Failed to save article";
        if (axios.isAxiosError(err)) {
          msg =
            err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            msg;
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

      {formError && (
        <Alert variant="destructive">
          <AlertTitle>Unable to save article</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {hasSlugChanged && (
        <Alert className="border-accent-warm/40 bg-accent-warm/5">
          <AlertTriangle className="size-4 text-accent-warm" />
          <AlertTitle className="text-accent-warm font-semibold">
            URL Slug will regenerate
          </AlertTitle>
          <AlertDescription className="text-muted-foreground text-xs">
            Changing the title of this published article will update its URL slug to{" "}
            <code className="font-mono font-medium text-foreground bg-muted px-1 rounded">
              /post/{generatedSlug}
            </code>
            . Existing external links pointing to the old slug will no longer work.
          </AlertDescription>
        </Alert>
      )}

      {/* Title & Metadata Inputs */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-8">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title" className="text-sm font-semibold">
              Article Title
            </Label>
            <Input
              id="title"
              placeholder="e.g. Building High-Throughput Event Streams in Go"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
              aria-invalid={Boolean(fieldErrors.title)}
              className="font-serif text-lg font-bold sm:text-xl h-11 bg-card"
            />
            {fieldErrors.title && (
              <p className="text-xs text-destructive">{fieldErrors.title}</p>
            )}
            {generatedSlug && (
              <p className="text-xs text-muted-foreground font-mono">
                Slug: /post/{generatedSlug}
              </p>
            )}
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

              <div className="flex items-center gap-1.5">
                <Input
                  type="text"
                  placeholder="Add tag (e.g. golang)…"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      handleAddTag();
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
                >
                  <Plus className="size-3.5" />
                </Button>
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
        <Label htmlFor="content" className="text-sm font-semibold">
          Article Body (Markdown)
        </Label>

        <div className="min-h-[500px] w-full">
          {viewMode === "edit" && (
            <div className="flex flex-col gap-1">
              <Textarea
                id="content"
                placeholder="Write your article in Markdown. Use # for headers, ``` for code blocks, and > for quotes…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isPending}
                rows={24}
                className="w-full resize-y font-mono text-sm leading-relaxed p-4 bg-card rounded-xl border border-border"
              />
              {fieldErrors.content && (
                <p className="text-xs text-destructive">{fieldErrors.content}</p>
              )}
            </div>
          )}

          {viewMode === "preview" && (
            <div className="min-h-[500px] rounded-xl border border-border bg-card p-6 sm:p-8">
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
                <Textarea
                  id="content"
                  placeholder="Write your article in Markdown…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isPending}
                  rows={24}
                  className="w-full resize-y font-mono text-sm leading-relaxed p-4 bg-card rounded-xl border border-border min-h-[550px]"
                />
                {fieldErrors.content && (
                  <p className="text-xs text-destructive">{fieldErrors.content}</p>
                )}
              </div>

              <div className="min-h-[550px] max-h-[750px] overflow-y-auto rounded-xl border border-border bg-card p-6 sm:p-8">
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
