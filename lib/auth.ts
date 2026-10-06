import { cookies } from "next/headers";
import type { AuthUser } from "./types";

const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";

// ─── Cookie Options ───────────────────────────────────────────────────────────

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function setTokenCookies(
  accessToken: string,
  refreshToken: string,
) {
  const jar = await cookies();

  // 7 days to match full session lifetime; edge middleware and client validate exp
  const maxAge = 60 * 60 * 24 * 7;

  jar.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...cookieBase,
    maxAge,
  });

  jar.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...cookieBase,
    maxAge,
  });
}

export async function clearTokenCookies() {
  const jar = await cookies();
  jar.delete(ACCESS_TOKEN_COOKIE);
  jar.delete(REFRESH_TOKEN_COOKIE);
}

export async function getAccessToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(REFRESH_TOKEN_COOKIE)?.value;
}

// ─── Server-Side Session Helper ───────────────────────────────────────────────
// Calls the Go API /user/iam using the access token from the cookie.
// Falls back to silent refresh if access token has expired.

import axios from "axios";
import { API_BASE_URL } from "./client";

export async function getServerSession(): Promise<AuthUser | null> {
  let token = await getAccessToken();

  if (!token) {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refresh_token: refreshToken },
        { headers: { "Content-Type": "application/json" }, timeout: 8000 },
      );
      const newToken = data.data?.token || data.token;
      const newRefreshToken = data.data?.refresh_token || data.refresh_token || refreshToken;
      if (newToken) {
        token = newToken;
        await setTokenCookies(newToken, newRefreshToken);
        if (data.data?.user) {
          return data.data.user as AuthUser;
        }
      }
    } catch {
      return null;
    }
  }

  try {
    const { data } = await axios.get(
      `${API_BASE_URL}/user/iam`,
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 8000,
      },
    );

    return (data.data as AuthUser) ?? null;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            { refresh_token: refreshToken },
            { headers: { "Content-Type": "application/json" }, timeout: 8000 },
          );
          const newToken = data.data?.token || data.token;
          const newRefreshToken = data.data?.refresh_token || data.refresh_token || refreshToken;
          if (newToken) {
            await setTokenCookies(newToken, newRefreshToken);
            if (data.data?.user) {
              return data.data.user as AuthUser;
            }
            const userRes = await axios.get(`${API_BASE_URL}/user/iam`, {
              headers: { Authorization: `Bearer ${newToken}` },
              timeout: 8000,
            });
            return (userRes.data?.data as AuthUser) ?? null;
          }
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}
