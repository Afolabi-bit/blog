import apiClient from "@/lib/client";
import type { ApiResponse, AuthUser, AuthorRequest } from "@/lib/types";

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  bio?: string;
  avatar_url?: string;
  username?: string;
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
}

export interface AuthorRequestPayload {
  bio: string;
  sample_links?: string[];
  motivation?: string;
  sample_work?: string;
  reason?: string;
}

export const userEndpoints = {
  getProfile: async () => {
    const response = await apiClient.get<ApiResponse<AuthUser>>("/user/iam");
    return response.data;
  },

  getIam: async () => {
    const response = await apiClient.get<ApiResponse<AuthUser>>("/user/iam");
    return response.data;
  },

  updateProfile: async (payload: UpdateProfilePayload) => {
    const response = await apiClient.patch<ApiResponse<AuthUser>>("/user/profile", payload);
    return response.data;
  },

  changePassword: async (payload: ChangePasswordPayload) => {
    const response = await apiClient.patch<ApiResponse<null>>("/user/change-password", payload);
    return response.data;
  },

  applyForAuthor: async (payload: AuthorRequestPayload) => {
    const response = await apiClient.post<ApiResponse<AuthorRequest>>("/user/author-request", payload);
    return response.data;
  },

  getAuthorRequestStatus: async () => {
    const response = await apiClient.get<ApiResponse<AuthorRequest>>("/user/author-request");
    return response.data;
  },
};
