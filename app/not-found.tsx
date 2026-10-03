"use client";

import { usePathname } from "next/navigation";
import { BookOpen } from "lucide-react";
import { NotFoundView } from "@/components/general/NotFoundView";
import { ArticleNotFoundView } from "@/components/post/ArticleNotFoundView";

export default function NotFound() {
  const pathname = usePathname() || "";
  const isPostRoute = pathname.startsWith("/post");

  if (isPostRoute) {
    return <ArticleNotFoundView />;
  }

  return (
    <NotFoundView
      icon={BookOpen}
      heading="Page unavailable"
      description="The page you were looking for doesn't exist, has been relocated, or is temporarily offline."
      homeLabel="Browse stories"
    />
  );
}
