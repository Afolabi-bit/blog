import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import type { ApiResponse, AuthUser } from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://go-blog-k1kn.onrender.com";

// ─── Error & Unwrap Helpers ──────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly message: string,
    public readonly raw?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function unwrap<T>(response: AxiosResponse<ApiResponse<T>>): T {
  const data = response.data;
  if (!data) {
    throw new ApiError(response.status, "Empty response received");
  }
  if (data.status === "error") {
    throw new ApiError(response.status, data.message || "An error occurred", data);
  }
  return data.data as T;
}

// ─── Token Management Helpers ────────────────────────────────────────────────
// Kept in localStorage for client persistence and synced to document.cookie
// so Next.js Middleware can read tokens for edge route protection.

export function parseJwtPayload(token: string): { exp?: number; role?: string; sub?: string; email?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, skewSeconds: number = 60): boolean {
  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) return true;
  return payload.exp * 1000 - skewSeconds * 1000 <= Date.now();
}

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

  const isSecure = window.location.protocol === "https:";
  const secureFlag = isSecure ? "; Secure" : "";

  // Set cookies to 7 days (604,800s) to match full session lifetime.
  // Middleware inspects the JWT payload exp to determine when access token
  // needs to be refreshed via refresh_token, preventing premature cookie eviction.
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `access_token=${accessToken}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
  document.cookie = `refresh_token=${refreshToken}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
}

export function clearStoredTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("auth_user");

  const isSecure = window.location.protocol === "https:";
  const secureFlag = isSecure ? "; Secure" : "";

  // Expire cookies
  document.cookie = `access_token=; path=/; max-age=0; SameSite=Lax${secureFlag}`;
  document.cookie = `refresh_token=; path=/; max-age=0; SameSite=Lax${secureFlag}`;
}

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

// ─── Cold Start Event Helper ─────────────────────────────────────────────────

let activeColdStartRequests = 0;

function notifyColdStart(waking: boolean) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("bloggr:cold-start", { detail: { waking } }),
    );
  }
}

// ─── Axios Instance ──────────────────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

type CustomConfig = InternalAxiosRequestConfig & {
  _coldStartTimer?: NodeJS.Timeout;
  _retry?: boolean;
};

// ─── Request Interceptor ─────────────────────────────────────────────────────

apiClient.interceptors.request.use((config: CustomConfig) => {
  const token = getStoredAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 3-second threshold for Render free-tier cold-start indicator
  if (typeof window !== "undefined") {
    config._coldStartTimer = setTimeout(() => {
      activeColdStartRequests++;
      notifyColdStart(true);
    }, 3000);
  }

  return config;
});

// ─── Direct Refresh Helper ───────────────────────────────────────────────────

export async function refreshAuthTokens(): Promise<{ token: string; refreshToken: string } | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    return null;
  }

  // 45-second timeout to survive Render free-tier cold-start wake-up
  const { data } = await axios.post(
    `${API_BASE_URL}/auth/refresh`,
    { refresh_token: refreshToken },
    {
      headers: { "Content-Type": "application/json" },
      timeout: 45000,
    },
  );

  const newAccessToken = data.data?.token || data.token;
  const newRefreshToken =
    data.data?.refresh_token || data.refresh_token || refreshToken;

  if (!newAccessToken) {
    throw new Error("Invalid token refresh response");
  }

  setStoredTokens(newAccessToken, newRefreshToken);
  if (data.data?.user) {
    setStoredUser(data.data.user);
  }

  return { token: newAccessToken, refreshToken: newRefreshToken };
}

// ─── Response Interceptor (Silent Refresh on 401 & Cold Start Clear) ──────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: AxiosResponse) => void;
  reject: (reason: unknown) => void;
  config: CustomConfig;
}> = [];

function clearColdStart(config?: CustomConfig) {
  if (config?._coldStartTimer) {
    clearTimeout(config._coldStartTimer);
  }
  if (activeColdStartRequests > 0) {
    activeColdStartRequests--;
    if (activeColdStartRequests === 0) {
      notifyColdStart(false);
    }
  }
}

apiClient.interceptors.response.use(
  (response) => {
    clearColdStart(response.config as CustomConfig);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomConfig;
    clearColdStart(originalRequest);

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Do not attempt refresh if the failed request was the refresh or login request itself,
    // or change-password (where 401 indicates incorrect current password, per B16)
    if (
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/user/change-password")
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
      const refreshed = await refreshAuthTokens();
      if (!refreshed) {
        throw new ApiError(401, "No refresh token available");
      }

      // Replay failed requests
      const queued = [...failedQueue];
      failedQueue = [];
      queued.forEach(({ resolve, reject, config }) => {
        config._retry = true;
        if (config.headers?.set) {
          config.headers.set("Authorization", `Bearer ${refreshed.token}`);
        } else if (config.headers) {
          config.headers.Authorization = `Bearer ${refreshed.token}`;
        }
        apiClient(config).then(resolve).catch(reject);
      });

      if (originalRequest.headers?.set) {
        originalRequest.headers.set("Authorization", `Bearer ${refreshed.token}`);
      } else if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${refreshed.token}`;
      }
      return apiClient(originalRequest);
    } catch (refreshErr: unknown) {
      failedQueue.forEach(({ reject }) => reject(refreshErr));
      failedQueue = [];

      // ONLY clear tokens and redirect if the refresh token was explicitly rejected (401/403 or missing).
      // NEVER wipe credentials on Render cold-start timeouts (502/504) or transient offline/network glitches!
      const isExplicitAuthFailure =
        (axios.isAxiosError(refreshErr) &&
          (refreshErr.response?.status === 401 || refreshErr.response?.status === 403)) ||
        (refreshErr instanceof ApiError && refreshErr.status === 401) ||
        (refreshErr instanceof Error && refreshErr.message === "No refresh token available");

      if (isExplicitAuthFailure) {
        clearStoredTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }

      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
