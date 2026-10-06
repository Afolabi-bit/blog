import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { calculateReadingTime, formatDate, stripMarkdown } from "@/lib/utils";
import { Heart, MessageSquare, BookOpen } from "lucide-react";

interface BlogPostCardProps {
  data: Post;
  priority?: boolean;
  variant?: "default" | "lead";
}

export function BlogPostCard({
  data,
  priority = false,
  variant = "default",
}: BlogPostCardProps) {
  const readingTime = data.read_time
    ? `${data.read_time} min read`
    : calculateReadingTime(data.content || "");
  const formattedDate = formatDate(data.created_at);
  const plainExcerpt = data.excerpt || stripMarkdown(data.content || "");

  const authorInitials = data.author_name
    ? data.author_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "AU";

  const isLead = variant === "lead";

  return (
    <Card
      className={`group flex flex-col overflow-hidden border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-md ${
        isLead ? "sm:col-span-2 lg:col-span-2" : "h-full"
      }`}
    >
      <Link
        href={`/post/${data.slug}`}
        className="block overflow-hidden focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Read article: ${data.title}`}
      >
        <div className="relative w-full overflow-hidden bg-muted/40">
          <AspectRatio ratio={isLead ? 21 / 9 : 16 / 9}>
            {data.cover_image ? (
              <Image
                src={data.cover_image}
                alt={data.title}
                fill
                priority={priority}
                sizes={
                  isLead
                    ? "(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 66vw"
                    : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                }
                className="object-cover transition-transform duration-300 group-hover:scale-102"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-secondary/60 text-muted-foreground">
                <BookOpen className="size-8 opacity-40" />
              </div>
            )}
          </AspectRatio>
        </div>
      </Link>

      <CardHeader className="flex flex-col gap-2 p-5 pb-3">
        <div className="flex items-center justify-between gap-2">
          {data.tags && data.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {data.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="font-mono text-[11px] font-medium text-muted-foreground hover:text-foreground"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
          {data.is_featured && (
            <Badge className="bg-accent-solid/15 text-accent-solid border-accent-solid/30 text-[10px]">
              Featured
            </Badge>
          )}
        </div>

        <Link
          href={`/post/${data.slug}`}
          className="group/title focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
        >
          <h3
            className={`font-serif font-bold leading-snug tracking-tight text-card-foreground transition-colors group-hover/title:text-accent-solid ${
              isLead ? "text-2xl sm:text-3xl line-clamp-2" : "text-xl line-clamp-2"
            }`}
          >
            {data.title}
          </h3>
        </Link>
      </CardHeader>

      <CardContent className="flex-1 px-5 py-0">
        <p
          className={`text-sm leading-relaxed text-muted-foreground ${
            isLead ? "line-clamp-4 text-base" : "line-clamp-3"
          }`}
        >
          {plainExcerpt || "No preview available for this article."}
        </p>
      </CardContent>

      <CardFooter className="mt-4 flex items-center justify-between border-t border-border/40 p-5 pt-4 text-xs text-muted-foreground">
        <Link
          href={`/authors/${data.author_id}`}
          className="flex items-center gap-2 group/author hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
          aria-label={`View author profile of ${data.author_name}`}
        >
          <Avatar className="size-6 border border-border">
            <AvatarFallback className="bg-muted text-[10px] font-semibold text-foreground">
              {authorInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col text-left">
            <span className="font-medium text-foreground group-hover/author:text-accent-solid transition-colors">
              {data.author_name}
            </span>
            <div className="flex items-center gap-1.5 text-[11px]">
              <time dateTime={data.created_at}>{formattedDate}</time>
              <span>•</span>
              <span className="tabular-nums">{readingTime}</span>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1 tabular-nums ${
              data.liked_by_me ? "text-accent-warm font-medium" : ""
            }`}
            title={`${data.likes_count} likes`}
            aria-label={`${data.likes_count} likes`}
          >
            <Heart
              className={`size-3.5 ${
                data.liked_by_me ? "fill-accent-warm text-accent-warm" : ""
              }`}
            />
            <span>{data.likes_count}</span>
          </div>
          <div
            className="flex items-center gap-1 tabular-nums"
            title={`${data.comments_count} comments`}
            aria-label={`${data.comments_count} comments`}
          >
            <MessageSquare className="size-3.5" />
            <span>{data.comments_count}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
