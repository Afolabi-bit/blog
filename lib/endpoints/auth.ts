import apiClient, { setStoredTokens, clearStoredTokens, setStoredUser } from "@/lib/client";
import type { ApiResponse, AuthResponse } from "@/lib/types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: "reader" | "author" | "admin";
}

export interface RefreshPayload {
  refresh_token: string;
}

export const authEndpoints = {
  login: async (credentials: LoginPayload) => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      credentials,
    );
    const data = response.data;
    if (data.status === "success" && data.data) {
      setStoredTokens(data.data.token, data.data.refresh_token);
      if (data.data.user) {
        setStoredUser(data.data.user);
      }
    }
    return data;
  },

  register: async (payload: RegisterPayload) => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      "/auth/register",
      payload,
    );
    const data = response.data;
    if (data.status === "success" && data.data) {
      setStoredTokens(data.data.token, data.data.refresh_token);
      if (data.data.user) {
        setStoredUser(data.data.user);
      }
    }
    return data;
  },

  refresh: async (payload: RefreshPayload) => {
    const response = await apiClient.post<ApiResponse<{ token: string; refresh_token: string }>>(
      "/auth/refresh",
      payload,
    );
    const data = response.data;
    if (data.status === "success" && data.data) {
      setStoredTokens(data.data.token, data.data.refresh_token);
    }
    return data;
  },

  logout: async (refreshToken?: string) => {
    try {
      if (refreshToken) {
        await apiClient.post("/auth/logout", { refresh_token: refreshToken });
      }
    } finally {
      clearStoredTokens();
    }
  },
};
