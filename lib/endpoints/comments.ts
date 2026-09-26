import apiClient from "@/lib/client";
import type { ApiResponse, Comment } from "@/lib/types";

export interface CreateCommentPayload {
  content: string;
  parent_id?: string;
}

export const commentsEndpoints = {
  getComments: async (postId: string) => {
    const response = await apiClient.get<ApiResponse<Comment[]>>(
      `/api/posts/${postId}/comments`,
    );
    return response.data;
  },

  createComment: async (postId: string, payload: CreateCommentPayload) => {
    const response = await apiClient.post<ApiResponse<Comment>>(
      `/api/posts/${postId}/comments`,
      payload,
    );
    return response.data;
  },

  deleteComment: async (commentId: string) => {
    const response = await apiClient.delete<ApiResponse<null>>(
      `/api/comments/${commentId}`,
    );
    return response.data;
  },
};
