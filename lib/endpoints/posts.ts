import apiClient from "@/lib/client";
import type { ApiResponse, Post, PostsResponse } from "@/lib/types";

export interface PostsQueryParams {
  limit?: number;
  cursor?: string;
  tag?: string;
  search?: string;
}

export interface CreatePostPayload {
  title: string;
  content: string;
  cover_image?: string;
  status: "draft" | "published";
  tags?: string[];
}

export interface UpdatePostPayload {
  title?: string;
  content?: string;
  cover_image?: string;
  status?: "draft" | "published";
  tags?: string[];
}

export const postsEndpoints = {
  getPosts: async (params?: PostsQueryParams) => {
    const response = await apiClient.get<ApiResponse<PostsResponse>>("/api/posts", {
      params,
    });
    return response.data;
  },

  getPostBySlug: async (slug: string) => {
    const response = await apiClient.get<ApiResponse<Post>>(`/api/posts/slug/${slug}`);
    return response.data;
  },

  getPostById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Post>>(`/api/posts/${id}`);
    return response.data;
  },

  getMyPosts: async () => {
    const response = await apiClient.get<ApiResponse<PostsResponse>>("/api/my-posts");
    return response.data;
  },

  createPost: async (payload: CreatePostPayload) => {
    const response = await apiClient.post<ApiResponse<Post>>("/api/posts", payload);
    return response.data;
  },

  updatePost: async (id: string, payload: UpdatePostPayload) => {
    const response = await apiClient.patch<ApiResponse<Post>>(`/api/posts/${id}`, payload);
    return response.data;
  },

  deletePost: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<null>>(`/api/posts/${id}`);
    return response.data;
  },
};
