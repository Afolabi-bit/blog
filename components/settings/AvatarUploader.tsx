"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import axios from "axios";
import { toast } from "sonner";
import { mediaEndpoints } from "@/lib/endpoints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Loader2, UploadCloud, User, X } from "lucide-react";

interface AvatarUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function AvatarUploader({
  value,
  onChange,
  disabled = false,
}: AvatarUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast.error("Unsupported format. Use JPEG, PNG, WebP, or GIF.");
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB per B12 / SET-5
    if (file.size > maxSize) {
      toast.error("Image too large (max 2 MB)");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Uploading avatar…");

    try {
      const res = await mediaEndpoints.upload(file);
      if (res.status === "success" && res.data?.url) {
        onChange(res.data.url);
        toast.success("Avatar uploaded", { id: toastId });
      } else {
        toast.error(res.message || "Failed to upload avatar", { id: toastId });
      }
    } catch (err: unknown) {
      let msg = "Failed to upload avatar";
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || err.message || msg;
      }
      toast.error(msg, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleSetUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput("");
      setShowUrlInput(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />

      <div className="flex items-center gap-4">
        {/* Avatar Circle Preview */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`group relative flex size-20 sm:size-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 transition-all ${
            isDragOver
              ? "border-primary bg-primary/10"
              : "border-border bg-muted hover:border-foreground/30"
          }`}
          title="Click or drag to upload avatar"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          aria-label="Upload profile picture"
        >
          {value ? (
            <Image
              src={value}
              alt="Profile avatar preview"
              fill
              className="object-cover"
            />
          ) : (
            <User className="size-8 text-muted-foreground" />
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            {isUploading ? (
              <Loader2 className="size-6 animate-spin text-white" />
            ) : (
              <Camera className="size-6 text-white" />
            )}
          </div>
        </div>

        {/* Action Buttons & Guidance */}
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="h-8 text-xs gap-1.5"
            >
              {isUploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <UploadCloud className="size-3.5" />
              )}
              <span>Upload Picture</span>
            </Button>

            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || isUploading}
                onClick={() => onChange("")}
                className="h-8 text-xs gap-1 text-muted-foreground hover:text-destructive"
              >
                <X className="size-3.5" />
                <span>Remove</span>
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || isUploading}
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              {showUrlInput ? "Hide URL" : "Paste URL"}
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground">
            JPG, PNG, WEBP, or GIF up to 2MB. Square aspect ratio recommended.
          </p>
        </div>
      </div>

      {/* URL Input Accordion */}
      {showUrlInput && (
        <form onSubmit={handleSetUrl} className="flex items-center gap-2 mt-1">
          <Input
            type="url"
            placeholder="https://example.com/avatar.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            disabled={disabled || isUploading}
            className="h-8 text-xs bg-background"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!urlInput.trim() || disabled || isUploading}
            className="h-8 text-xs bg-accent-solid text-white hover:bg-accent-solid/90"
          >
            Apply
          </Button>
        </form>
      )}
    </div>
  );
}
