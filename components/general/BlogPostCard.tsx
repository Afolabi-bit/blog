import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/types";

interface BlogPostCardProps {
  data: Post;
}

export function BlogPostCard({ data }: BlogPostCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md transition-all hover:shadow-lg">
      <Link href={`/post/${data.slug}`} className="block w-full h-full">
        <div className="relative h-48 w-full overflow-hidden bg-gray-100">
          {data.cover_image ? (
            <Image
              src={data.cover_image}
              alt={data.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
              No image
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            {data.title}
          </h3>
          <p className="mb-4 text-sm text-gray-600 line-clamp-2">
            {data.content}
          </p>

          {data.tags?.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {data.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              {data.author_name}
            </p>
            <time className="text-xs text-gray-500">
              {new Intl.DateTimeFormat("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              }).format(new Date(data.created_at))}
            </time>
          </div>
        </div>
      </Link>
    </div>
  );
}
