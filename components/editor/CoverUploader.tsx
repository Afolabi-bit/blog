"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import axios from "axios";
import { toast } from "sonner";
import { mediaEndpoints } from "@/lib/endpoints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadCloud, X, RefreshCw, Loader2 } from "lucide-react";

interface CoverUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function CoverUploader({
  value,
  onChange,
  disabled,
}: CoverUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid format. Please upload JPG, PNG, WEBP, or GIF.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Image file is too large. Maximum size is 5MB.");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Uploading cover image to storage…");

    try {
      const res = await mediaEndpoints.upload(file);
      if (res.status === "success" && res.data?.url) {
        onChange(res.data.url);
        toast.success("Cover image uploaded successfully!", { id: toastId });
      } else {
        toast.error(res.message || "Failed to upload image", { id: toastId });
      }
    } catch (err: unknown) {
      let msg = "Failed to upload image";
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

      {value ? (
        <div className="group relative h-48 sm:h-60 w-full overflow-hidden rounded-xl border border-border bg-muted/30">
          <Image
            src={value}
            alt="Cover preview"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="gap-1.5 h-8 text-xs font-medium"
            >
              <RefreshCw className="size-3.5" />
              <span>Replace</span>
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onChange("")}
              disabled={disabled || isUploading}
              className="gap-1.5 h-8 text-xs font-medium"
            >
              <X className="size-3.5" />
              <span>Remove</span>
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() =>
            !disabled && !isUploading && fileInputRef.current?.click()
          }
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors cursor-pointer ${
            isDragOver
              ? "border-accent-solid bg-accent-solid/5"
              : "border-border bg-card/50 hover:bg-card hover:border-accent-solid/40"
          } ${disabled || isUploading ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
            {isUploading ? (
              <Loader2 className="size-5 animate-spin text-accent-solid" />
            ) : (
              <UploadCloud className="size-5 text-accent-solid" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {isUploading ? (
                "Uploading to R2 storage…"
              ) : (
                <>
                  <span className="font-semibold text-accent-solid hover:underline">
                    Click to upload
                  </span>{" "}
                  or drag and drop
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PNG, JPG, WEBP, or GIF (max 5MB)
            </p>
          </div>
        </div>
      )}

      {/* Manual URL input fallback */}
      <div className="flex items-center gap-2">
        <Input
          type="url"
          placeholder="Or paste external image URL (e.g. https://images.unsplash.com/…)…"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || isUploading}
          className="h-8 text-xs bg-background"
        />
      </div>
    </div>
  );
}
