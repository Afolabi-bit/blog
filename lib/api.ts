import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";

// ─── Base Client ─────────────────────────────────────────────────────────────
// Used exclusively in the browser (Client Components, Route Handlers called
// from the client). Server-side fetches use the native fetch() directly.

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000",
  withCredentials: true, // send cookies on cross-origin requests
});

// ─── Request Interceptor ─────────────────────────────────────────────────────
// The access token lives in an httpOnly cookie so we cannot read it from JS.
// The browser will automatically attach it via withCredentials. This interceptor
// is therefore a no-op for the Authorization header — the cookie does the work.

// ─── Response Interceptor — Silent Refresh ───────────────────────────────────

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

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue the request until the in-flight refresh completes
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: originalRequest });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Call our own Next.js Route Handler which reads the httpOnly refresh
      // cookie, calls the Go API, and sets new cookies.
      await axios.post("/api/auth/refresh", null, { withCredentials: true });

      // Replay queued requests
      const queued = [...failedQueue];
      failedQueue = [];
      queued.forEach(({ resolve, reject, config }) =>
        apiClient(config).then(resolve).catch(reject),
      );

      return apiClient(originalRequest);
    } catch (refreshErr) {
      failedQueue.forEach(({ reject }) => reject(refreshErr));
      failedQueue = [];
      // Redirect to login — tokens are fully expired
      window.location.href = "/login";
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);
