import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { postsEndpoints } from "@/lib/endpoints";
import type { AuthorProfile, Post } from "@/lib/types";
import { BlogPostCard } from "@/components/general/BlogPostCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, BookOpen, Calendar, FileText, PenTool } from "lucide-react";

export const revalidate = 120;

interface AuthorPageProps {
  params: Promise<{ id: string }>;
}

async function getAuthor(id: string): Promise<AuthorProfile | null> {
  try {
    const data = await postsEndpoints.getAuthorProfile(id);
    return data.data ?? null;
  } catch {
    return null;
  }
}

async function getAuthorPosts(authorId: string): Promise<Post[]> {
  try {
    const data = await postsEndpoints.getPosts({
      author_id: authorId,
      limit: 20,
    });
    return data.data?.posts ?? [];
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: AuthorPageProps): Promise<Metadata> {
  const { id } = await params;
  const author = await getAuthor(id);

  if (!author) {
    return {
      title: "Author Profile Unavailable",
      description: "The requested author profile could not be found.",
    };
  }

  const bioDescription =
    author.bio || `Read articles written by ${author.full_name} on Noterverse.`;

  return {
    title: `${author.full_name} — Noterverse`,
    description: bioDescription,
    alternates: {
      canonical: `/authors/${author.id}`,
    },
    openGraph: {
      title: `${author.full_name} — Noterverse Author`,
      description: bioDescription,
      type: "profile",
      images: author.avatar_url ? [{ url: author.avatar_url }] : [],
    },
    twitter: {
      card: "summary",
      title: `${author.full_name} — Noterverse`,
      description: bioDescription,
      images: author.avatar_url ? [author.avatar_url] : [],
    },
  };
}

export default async function AuthorProfilePage({ params }: AuthorPageProps) {
  const { id } = await params;
  const author = await getAuthor(id);

  if (!author) {
    return notFound();
  }

  const posts = await getAuthorPosts(author.id);

  const authorInitials = author.full_name
    ? author.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "AU";

  const formattedJoinDate = formatDate(author.created_at);

  return (
    <div className="mx-auto max-w-5xl py-6 sm:py-10">
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

      {/* Author Profile Header Card */}
      <header className="relative mb-12 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
          <Avatar className="size-24 border-2 border-border shadow-xs sm:size-28">
            {author.avatar_url && (
              <AvatarImage src={author.avatar_url} alt={author.full_name} />
            )}
            <AvatarFallback className="bg-muted text-2xl font-bold font-serif text-foreground">
              {authorInitials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-serif text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                {author.full_name}
              </h1>

              <Badge
                variant="outline"
                className="bg-accent-solid/10 text-accent-solid border-accent-solid/30 font-mono text-xs capitalize"
              >
                <PenTool className="mr-1 size-3" />
                {author.role || "Author"}
              </Badge>
            </div>

            {author.bio ? (
              <p className="text-base leading-relaxed text-muted-foreground max-w-2xl font-serif">
                {author.bio}
              </p>
            ) : (
              <p className="text-sm italic text-muted-foreground/80">
                Author has not shared a biography yet.
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border/50">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                <span>Joined {formattedJoinDate}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <FileText className="size-3.5 text-accent-solid" />
                <span>
                  <strong className="tabular-nums font-semibold">{author.total_posts}</strong>{" "}
                  published articles
                </span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Author's Articles Section */}
      <section aria-labelledby="author-articles-heading">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2
              id="author-articles-heading"
              className="font-serif text-2xl font-bold tracking-tight text-foreground"
            >
              Articles by {author.full_name}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Published stories, essays, and articles.
            </p>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="my-8 rounded-xl border border-dashed border-border bg-card/60 p-12 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
              <BookOpen className="size-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-foreground">
              No articles published yet
            </h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
              {author.full_name} has not published any public articles yet. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, idx) => (
              <BlogPostCard key={post.id} data={post} priority={idx < 2} />
            ))}
          </div>
        )}
      </section>

      {/* JSON-LD Structured Data for Person / SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: author.full_name,
            description: author.bio,
            image: author.avatar_url,
            jobTitle: author.role,
          }),
        }}
      />
    </div>
  );
}
