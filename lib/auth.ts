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

  jar.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...cookieBase,
    // 15 minutes
    maxAge: 60 * 15,
  });

  jar.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...cookieBase,
    // 7 days
    maxAge: 60 * 60 * 24 * 7,
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
// Calls the Go API /user/profile using the access token from the cookie.
// Returns null if not authenticated or token is expired (middleware will
// redirect before this is reached in protected routes).

import axios from "axios";
import { API_BASE_URL } from "./client";

export async function getServerSession(): Promise<AuthUser | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const { data } = await axios.get(
      `${API_BASE_URL}/user/iam`,
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 8000,
      },
    );

    return (data.data as AuthUser) ?? null;
  } catch {
    return null;
  }
}
