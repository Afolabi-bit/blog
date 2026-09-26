import apiClient from "@/lib/client";
import type { ApiResponse, AuthorRequest, Post } from "@/lib/types";

export interface ReviewAuthorRequestPayload {
  status: "approved" | "rejected";
  admin_note?: string;
}

export const adminEndpoints = {
  getAuthorRequests: async (status?: string) => {
    const response = await apiClient.get<ApiResponse<AuthorRequest[]>>(
      "/api/admin/author-requests",
      { params: status ? { status } : undefined },
    );
    return response.data;
  },

  reviewAuthorRequest: async (id: string, payload: ReviewAuthorRequestPayload) => {
    const response = await apiClient.patch<ApiResponse<AuthorRequest>>(
      `/api/admin/author-requests/${id}/review`,
      payload,
    );
    return response.data;
  },

  getAllPosts: async () => {
    const response = await apiClient.get<ApiResponse<Post[]>>("/api/admin/posts");
    return response.data;
  },
};
