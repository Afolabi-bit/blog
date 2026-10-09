"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/general/AuthProvider";
import { ArrowLeft, Search } from "lucide-react";

export function ArticleNotFoundView() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Extract the slug from the URL: /post/my-article-slug -> "my-article-slug"
  const slugFromPath = pathname.startsWith("/post/")
    ? decodeURIComponent(pathname.replace(/^\/post\/?/, "").split("/")[0] || "")
    : "";

  // Convert slug to readable words for search hint: "getting-started-with-nextjs" -> "getting started with nextjs"
  const readableTerms = slugFromPath
    ? slugFromPath
        .replace(/[-_]+/g, " ")
        .replace(/[^\w\s]/g, "")
        .trim()
    : "";

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim() || readableTerms;
    if (query) {
      router.push(`/?q=${encodeURIComponent(query)}`);
    } else {
      router.push("/");
    }
  };

  return (
    <article className="mx-auto max-w-2xl py-8 sm:py-16">
      {/* Editorial back navigation */}
      <div className="mb-8 sm:mb-12">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 -ml-2 text-muted-foreground hover:text-foreground active:scale-[0.96] transition-[scale,color] duration-150"
        >
          <Link href="/">
            <ArrowLeft className="size-4" strokeWidth={1.75} />
            <span>All articles</span>
          </Link>
        </Button>
      </div>

      {/* Status indicator and title */}
      <header className="space-y-3">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance leading-tight">
          This article is unavailable
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed text-pretty">
          {slugFromPath ? (
            <>
              We couldn’t find an article matching the address{" "}
              <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground select-all">
                /post/{slugFromPath}
              </code>
              .
            </>
          ) : (
            "We couldn’t find the article you were trying to read."
          )}
        </p>
      </header>

      {/* Explanatory description: why this happens */}
      <section className="mt-8 border-t border-border/60 pt-6">
        <h2 className="text-sm font-semibold text-foreground">
          Why this happens
        </h2>
        <ul className="mt-4 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <li className="flex items-start gap-3">
            <span className="mt-2 size-1.5 rounded-full bg-accent-solid shrink-0" aria-hidden="true" />
            <span>
              <strong className="font-medium text-foreground">Draft or unpublished:</strong> The author may still be writing this post or took it offline to make revisions. Drafts are only accessible to their author.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-2 size-1.5 rounded-full bg-accent-solid shrink-0" aria-hidden="true" />
            <span>
              <strong className="font-medium text-foreground">Moved or deleted:</strong> The article may have been permanently removed, or its title slug was renamed when the story was updated.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-2 size-1.5 rounded-full bg-accent-solid shrink-0" aria-hidden="true" />
            <span>
              <strong className="font-medium text-foreground">Link mistake:</strong> Characters may have been omitted or accidentally appended when copying or sharing the link.
            </span>
          </li>
        </ul>
      </section>

      {/* Search recovery tool */}
      <section className="mt-8 border-t border-border/60 pt-6">
        <h2 className="text-sm font-semibold text-foreground">
          Search Noterverse
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Search for this article by title keywords, author name, or topic.
        </p>
        <form onSubmit={handleSearchSubmit} className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={readableTerms ? `e.g. ${readableTerms}` : "Search stories, topics, tags..."}
              className="h-10 pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground text-sm rounded-md"
              aria-label="Search articles by title or keyword"
            />
          </div>
          <Button
            type="submit"
            className="h-10 px-4 bg-accent-solid text-white hover:bg-accent-solid/90 active:scale-[0.96] transition-[scale,background-color] duration-150"
          >
            Search
          </Button>
        </form>

        {readableTerms && (
          <p className="mt-2.5 text-xs text-muted-foreground">
            Looking for this topic?{" "}
            <Link
              href={`/?q=${encodeURIComponent(readableTerms)}`}
              className="font-medium text-foreground underline underline-offset-4 hover:text-accent-solid transition-colors"
            >
              Search for “{readableTerms}”
            </Link>
          </p>
        )}
      </section>

      {/* Author hint if logged in */}
      {user && (
        <p className="mt-8 text-xs text-muted-foreground border-t border-border/60 pt-4">
          Are you the author of this post? Check your{" "}
          <Link
            href="/dashboard"
            className="font-medium text-foreground underline underline-offset-4 hover:text-accent-solid transition-colors"
          >
            Studio dashboard
          </Link>{" "}
          to review your unpublished drafts.
        </p>
      )}

      {/* Primary navigation actions */}
      <div className="mt-8 flex flex-wrap items-center gap-3 pt-6 border-t border-border/60">
        <Button
          asChild
          className="bg-accent-solid text-white hover:bg-accent-solid/90 active:scale-[0.96] transition-[scale,background-color] duration-150"
        >
          <Link href="/">
            Browse all articles
          </Link>
        </Button>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="active:scale-[0.96] transition-[scale,background-color] duration-150"
        >
          Go back
        </Button>
      </div>
    </article>
  );
}
