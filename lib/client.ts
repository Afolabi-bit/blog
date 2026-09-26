import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://go-blog-k1kn.onrender.com";

// ─── Token Management Helpers ────────────────────────────────────────────────
// Kept in localStorage for client persistence and synced to document.cookie
// so Next.js Middleware can read access_token for edge route protection.

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

export function setStoredTokens(accessToken: string, refreshToken: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);

  // Sync to document.cookie for Next.js middleware (15 min access, 7 days refresh)
  document.cookie = `access_token=${accessToken}; path=/; max-age=${60 * 15}; SameSite=Lax`;
  document.cookie = `refresh_token=${refreshToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function clearStoredTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("auth_user");

  // Expire cookies
  document.cookie = `access_token=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `refresh_token=; path=/; max-age=0; SameSite=Lax`;
}

import type { AuthUser } from "./types";

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("auth_user");
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem("auth_user", JSON.stringify(user));
}

// ─── Axios Instance ──────────────────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor ─────────────────────────────────────────────────────

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response Interceptor (Silent Refresh on 401) ─────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: AxiosResponse) => void;
  reject: (reason: unknown) => void;
  config: InternalAxiosRequestConfig;
}> = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Do not attempt refresh if the failed request was the refresh or login request itself
    if (
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: originalRequest });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = getStoredRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      // Call Go backend /auth/refresh directly with axios
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refresh_token: refreshToken },
        { headers: { "Content-Type": "application/json" } },
      );

      const newAccessToken = data.data?.token || data.token;
      const newRefreshToken = data.data?.refresh_token || data.refresh_token || refreshToken;

      if (!newAccessToken) {
        throw new Error("Invalid token refresh response");
      }

      setStoredTokens(newAccessToken, newRefreshToken);

      // Replay failed requests
      const queued = [...failedQueue];
      failedQueue = [];
      queued.forEach(({ resolve, reject, config }) => {
        config.headers.Authorization = `Bearer ${newAccessToken}`;
        apiClient(config).then(resolve).catch(reject);
      });

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshErr) {
      failedQueue.forEach(({ reject }) => reject(refreshErr));
      failedQueue = [];
      clearStoredTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
