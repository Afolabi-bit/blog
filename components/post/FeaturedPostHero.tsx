import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { calculateReadingTime, formatDate, stripMarkdown } from "@/lib/utils";
import { ArrowRight, BookOpen, Heart, MessageSquare, Sparkles } from "lucide-react";

interface FeaturedPostHeroProps {
  post: Post;
}

export function FeaturedPostHero({ post }: FeaturedPostHeroProps) {
  const readingTime = calculateReadingTime(post.content);
  const formattedDate = formatDate(post.created_at);
  const plainExcerpt = stripMarkdown(post.content);

  const authorInitials = post.author_name
    ? post.author_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "AU";

  return (
    <article className="group relative mb-12 overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all hover:border-accent-solid/35 hover:shadow-md">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Cover image container */}
        <div className="relative min-h-[260px] overflow-hidden bg-muted/40 sm:min-h-[340px] lg:col-span-7">
          {post.cover_image ? (
            <Image
              src={post.cover_image}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover transition-transform duration-500 group-hover:scale-102"
            />
          ) : (
            <div className="flex h-full w-full min-h-[300px] items-center justify-center bg-secondary/50 text-muted-foreground">
              <BookOpen className="size-12 opacity-30" />
            </div>
          )}
        </div>

        {/* Story content */}
        <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-5 lg:p-10">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-accent-solid/10 px-2.5 py-0.5 text-xs font-semibold text-accent-solid">
                <Sparkles className="size-3" />
                Featured Story
              </span>

              {post.tags && post.tags.length > 0 && (
                <Badge variant="outline" className="font-mono text-xs">
                  #{post.tags[0]}
                </Badge>
              )}
            </div>

            <Link
              href={`/post/${post.slug}`}
              className="focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
            >
              <h1 className="font-serif text-2xl font-bold leading-tight tracking-tight text-card-foreground transition-colors group-hover:text-accent-solid sm:text-3xl">
                {post.title}
              </h1>
            </Link>

            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base line-clamp-3 lg:line-clamp-4">
              {plainExcerpt}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-border/60 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Avatar className="size-8 border border-border">
                  <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                    {authorInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {post.author_name}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <time dateTime={post.created_at}>{formattedDate}</time>
                    <span>•</span>
                    <span>{readingTime}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Heart className="size-3.5" />
                  <span>{post.likes_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="size-3.5" />
                  <span>{post.comments_count}</span>
                </div>
              </div>
            </div>

            <Button asChild className="w-full sm:w-fit bg-accent-solid text-white hover:bg-accent-solid/90">
              <Link href={`/post/${post.slug}`} className="flex items-center gap-2">
                <span>Read full story</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
