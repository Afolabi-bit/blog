import apiClient from "@/lib/client";
import type { ApiResponse } from "@/lib/types";

export interface MediaUploadResponse {
  url: string;
}

export const mediaEndpoints = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<ApiResponse<MediaUploadResponse>>(
      "/api/media/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },
};
