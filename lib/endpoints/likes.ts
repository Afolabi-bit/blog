import apiClient from "@/lib/client";
import type { ApiResponse } from "@/lib/types";

export interface LikeResponse {
  liked: boolean;
  likes_count: number;
}

export const likesEndpoints = {
  getLikeStatus: async (postId: string) => {
    const response = await apiClient.get<ApiResponse<LikeResponse>>(
      `/api/posts/${postId}/like`,
    );
    return response.data;
  },

  toggleLike: async (postId: string) => {
    const response = await apiClient.post<ApiResponse<LikeResponse>>(
      `/api/posts/${postId}/like`,
    );
    return response.data;
  },
};
