import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LikeButton } from "@/components/post/LikeButton";
import { CommentSection } from "@/components/post/CommentSection";
import { postsEndpoints } from "@/lib/endpoints";
import type { Post } from "@/lib/types";

async function getPost(slug: string): Promise<Post | null> {
  try {
    const data = await postsEndpoints.getPostBySlug(slug);
    return data.data ?? null;
  } catch {
    return null;
  }
}

type Params = Promise<{ slug: string }>;

export default async function PostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) return notFound();

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Link className={buttonVariants({ variant: "secondary" })} href="/">
        ← Back to posts
      </Link>

      <div className="mb-8 mt-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
          {post.title}
        </h1>

        {post.tags?.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-[#ef862b] border border-orange-100"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-y border-gray-100 text-sm text-gray-500">
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-800">{post.author_name}</span>
            <span>•</span>
            <time>
              {new Intl.DateTimeFormat("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }).format(new Date(post.created_at))}
            </time>
          </div>
          <LikeButton postId={post.id} initialLikesCount={post.likes_count ?? 0} />
        </div>
      </div>

      {post.cover_image && (
        <div className="relative h-[320px] sm:h-[420px] w-full mb-8 overflow-hidden rounded-xl shadow-sm border border-gray-100">
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            priority
            className="object-cover"
          />
        </div>
      )}

      <Card className="border-none shadow-none">
        <CardContent className="px-0 pt-2 pb-6">
          <article className="prose prose-gray max-w-none text-gray-800 text-base leading-relaxed whitespace-pre-line">
            {post.content}
          </article>
        </CardContent>
      </Card>

      <CommentSection postId={post.id} postAuthorId={post.author_id} />
    </div>
  );
}
