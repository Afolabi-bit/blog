import apiClient from "@/lib/client";
import type { ApiResponse, AuthorRequest, Post } from "@/lib/types";

export interface ReviewAuthorRequestPayload {
  status: "approved" | "rejected";
  review_notes?: string;
  admin_note?: string;
}

export interface AdminAuthorRequestsResponse {
  requests: AuthorRequest[];
  pagination?: {
    limit: number;
    has_next: boolean;
    next_cursor?: string;
    count?: number;
  };
}

export interface AdminPostsResponse {
  posts: Post[];
  pagination?: {
    limit: number;
    has_next: boolean;
    next_cursor?: string;
    count?: number;
  };
}

export const adminEndpoints = {
  getAuthorRequests: async (status?: string) => {
    const response = await apiClient.get<
      ApiResponse<AdminAuthorRequestsResponse | AuthorRequest[]>
    >("/api/admin/author-requests", {
      params: status ? { status } : undefined,
    });
    return response.data;
  },

  reviewAuthorRequest: async (
    id: string,
    payload: ReviewAuthorRequestPayload,
  ) => {
    const response = await apiClient.patch<ApiResponse<AuthorRequest>>(
      `/api/admin/author-requests/${id}/review`,
      payload,
    );
    return response.data;
  },

  getAllPosts: async (params?: { status?: string; search?: string; limit?: number }) => {
    const response = await apiClient.get<
      ApiResponse<AdminPostsResponse | Post[]>
    >("/api/admin/posts", { params });
    return response.data;
  },

  deletePost: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<null>>(
      `/api/admin/posts/${id}`,
    );
    return response.data;
  },

  setFeaturedPost: async (id: string, is_featured: boolean) => {
    const response = await apiClient.patch<ApiResponse<Post>>(
      `/api/admin/posts/${id}/feature`,
      { is_featured },
    );
    return response.data;
  },
};
