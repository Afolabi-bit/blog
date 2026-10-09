import type { MetadataRoute } from "next";
import axios from "axios";
import { API_BASE_URL } from "@/lib/client";
import type { ApiResponse, PostsResponse, Post } from "@/lib/types";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://noterverse.vercel.app";

  let posts: Post[] = [];
  try {
    const res = await axios.get<ApiResponse<PostsResponse>>(
      `${API_BASE_URL}/api/posts?limit=100`,
      {
        timeout: 5000,
      },
    );
    posts = res.data?.data?.posts || [];
  } catch {
    posts = [];
  }

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/post/${post.slug}`,
    lastModified: new Date(post.updated_at || post.created_at),
    changeFrequency: "weekly",
    priority: post.is_featured ? 0.9 : 0.7,
  }));

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  return [...staticEntries, ...postEntries];
}
