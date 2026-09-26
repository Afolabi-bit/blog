"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import axios from "axios";
import { toast } from "sonner";
import { mediaEndpoints } from "@/lib/endpoints";

interface CoverUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function CoverUploader({ value, onChange, disabled }: CoverUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file format. Please upload JPG, PNG, WEBP, or GIF.");
      return;
    }

    // Validate size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File is too large. Maximum size is 5MB.");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Uploading cover image to Cloudflare R2...");

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
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 h-52 sm:h-64 w-full">
          <Image
            src={value}
            alt="Cover preview"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="px-3.5 py-1.5 text-xs font-semibold bg-white text-gray-800 rounded-lg shadow-sm hover:bg-gray-100 transition-colors"
            >
              Replace Image
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={disabled || isUploading}
              className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 transition-colors"
            >
              Remove
            </button>
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
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragOver
              ? "border-[#ef862b] bg-orange-50/50"
              : "border-gray-200 hover:border-gray-300 bg-gray-50/50 hover:bg-gray-50"
          } ${disabled || isUploading ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-orange-100/80 text-[#ef862b] flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {isUploading ? (
                  "Uploading to R2 storage..."
                ) : (
                  <>
                    <span className="text-[#ef862b] hover:underline font-semibold">
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, WEBP, or GIF (max 5MB)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Direct URL input fallback */}
      <div className="flex items-center gap-2">
        <input
          type="url"
          placeholder="Or paste external image URL..."
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || isUploading}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
    </div>
  );
}
