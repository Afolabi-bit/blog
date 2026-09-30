import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function stripMarkdown(md: string): string {
  if (!md) return "";
  return md
    .replace(/^#+\s+/gm, "") // headers
    .replace(/(\*\*|__)(.*?)\1/g, "$2") // bold
    .replace(/(\*|_)(.*?)\1/g, "$2") // italic
    .replace(/`{1,3}(.*?)`{1,3}/g, "$1") // inline code & blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "") // images
    .replace(/>\s+/gm, "") // blockquotes
    .replace(/^\s*[-*+]\s+/gm, "") // unordered lists
    .replace(/^\s*\d+\.\s+/gm, "") // ordered lists
    .replace(/\n+/g, " ") // newlines
    .trim();
}

export function calculateReadingTime(content: string): string {
  if (!content) return "1 min read";
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export function formatDate(dateString: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

