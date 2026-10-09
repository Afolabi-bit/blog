import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { postsEndpoints } from "@/lib/endpoints";
import type { Post } from "@/lib/types";
import { MarkdownRenderer } from "@/components/post/MarkdownRenderer";
import { ArticleActionBar } from "@/components/post/ArticleActionBar";
import { CommentSection } from "@/components/post/CommentSection";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { calculateReadingTime, formatDate, stripMarkdown } from "@/lib/utils";
import { ArrowLeft, BookOpen, Clock, Calendar } from "lucide-react";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string): Promise<Post | null> {
  try {
    const data = await postsEndpoints.getPostBySlug(slug);
    return data.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: "Story Unavailable",
      description: "This story is unavailable or could not be found.",
    };
  }

  const snippet = post.excerpt || stripMarkdown(post.content).slice(0, 160);

  return {
    title: `${post.title} — Noterverse`,
    description: snippet || "Read full story on Noterverse.",
    alternates: {
      canonical: `/post/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: snippet,
      type: "article",
      authors: [post.author_name],
      tags: post.tags,
      images: post.cover_image ? [{ url: post.cover_image }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: snippet,
      images: post.cover_image ? [post.cover_image] : [],
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return notFound();
  }

  // ART-1: Canonical slug redirect
  if (post.slug !== slug) {
    redirect(`/post/${post.slug}`);
  }

  const readingTime = post.read_time
    ? `${post.read_time} min read`
    : calculateReadingTime(post.content);
  const formattedDate = formatDate(post.created_at);

  const authorInitials = post.author_name
    ? post.author_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "AU";

  return (
    <article className="mx-auto max-w-4xl py-6 sm:py-10">
      {/* Back button */}
      <div className="mb-8">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Link href="/">
            <ArrowLeft className="size-4" />
            <span>All articles</span>
          </Link>
        </Button>
      </div>

      {/* Article Header */}
      <header className="flex flex-col gap-6">
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="font-mono text-xs text-muted-foreground hover:text-foreground"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        <h1 className="font-serif text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
          {post.title}
        </h1>

        {/* Author & Meta Row */}
        <div className="flex flex-col gap-4 border-y border-border/50 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={`/authors/${post.author_id}`}
            className="flex items-center gap-3 group/author hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
          >
            <Avatar className="size-11 border border-border">
              <AvatarFallback className="bg-muted text-sm font-semibold text-foreground">
                {authorInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground group-hover/author:text-accent-solid transition-colors">
                  {post.author_name}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase font-mono tracking-wider py-0 px-1.5"
                >
                  Author
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  <time dateTime={post.created_at}>{formattedDate}</time>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  <span className="tabular-nums">{readingTime}</span>
                </span>
              </div>
            </div>
          </Link>

          <ArticleActionBar
            postId={post.id}
            initialLikesCount={post.likes_count ?? 0}
            commentsCount={post.comments_count ?? 0}
            initialLiked={Boolean(post.liked_by_me)}
          />
        </div>
      </header>

      {/* Cover Image */}
      {post.cover_image && (
        <div className="my-8 overflow-hidden rounded-2xl border border-border shadow-xs">
          <AspectRatio ratio={16 / 9}>
            <Image
              src={post.cover_image}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 896px"
              className="object-cover"
            />
          </AspectRatio>
        </div>
      )}

      {/* Article Content */}
      <div className="my-10">
        <MarkdownRenderer content={post.content} />
      </div>

      {/* Bottom Action Bar */}
      <div className="mt-12 flex flex-col items-center justify-between gap-4 border-y border-border/50 py-6 sm:flex-row">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="size-4" />
          <span>Thanks for reading this story.</span>
        </div>

        <ArticleActionBar
          postId={post.id}
          initialLikesCount={post.likes_count ?? 0}
          commentsCount={post.comments_count ?? 0}
          initialLiked={Boolean(post.liked_by_me)}
        />
      </div>

      {/* Comments Section */}
      <div id="comments" className="mt-12 scroll-mt-24">
        <CommentSection postId={post.id} postAuthorId={post.author_id} />
      </div>

      {/* JSON-LD Structured Data for Article / SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.excerpt || stripMarkdown(post.content).slice(0, 160),
            image: post.cover_image ? [post.cover_image] : undefined,
            datePublished: post.created_at,
            dateModified: post.updated_at || post.created_at,
            author: {
              "@type": "Person",
              name: post.author_name,
              url: `/authors/${post.author_id}`,
            },
          }),
        }}
      />
    </article>
  );
}
