import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Post, ApiResponse } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function getPost(slug: string): Promise<Post | null> {
  const res = await fetch(`${API_URL}/api/posts/slug/${slug}`, {
    next: { revalidate: 60 },
  });

  if (res.status === 404) return null;
  if (!res.ok) return null;

  const json: ApiResponse<Post> = await res.json();
  return json.data ?? null;
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
        <h1 className="text-3xl font-bold tracking-tight mb-4">{post.title}</h1>

        {post.tags?.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="font-medium text-gray-700">{post.author_name}</span>
          <time>
            {new Intl.DateTimeFormat("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }).format(new Date(post.created_at))}
          </time>
          <span>{post.likes_count} likes</span>
          <span>{post.comments_count} comments</span>
        </div>
      </div>

      {post.cover_image && (
        <div className="relative h-[400px] w-full mb-8 overflow-hidden rounded-lg">
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            priority
            className="object-cover"
          />
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">
            {post.content}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
