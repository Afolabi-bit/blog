import { NextRequest, NextResponse } from "next/server";

interface JwtClaims {
  sub?: string;
  role?: "reader" | "author" | "admin";
  exp?: number;
  [key: string]: unknown;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://go-blog-k1kn.onrender.com";

function parseJwtPayload(token: string): JwtClaims | null {
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

// Routes that require authentication
const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/settings"];
const AUTH_ONLY_GUEST_PATHS = ["/login", "/register"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAuthGuestPath(pathname: string): boolean {
  return AUTH_ONLY_GUEST_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  let accessToken = req.cookies.get("access_token")?.value;
  let refreshToken = req.cookies.get("refresh_token")?.value;

  let payload = accessToken ? parseJwtPayload(accessToken) : null;
  let isTokenValid = Boolean(payload && (!payload.exp || payload.exp * 1000 > Date.now()));

  let newAccessToken: string | null = null;
  let newRefreshToken: string | null = null;

  // If access token is missing or expired, but a refresh token is present, attempt silent server-side refresh
  if (!isTokenValid && refreshToken) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        const data = await res.json();
        const refreshedToken = data.data?.token || data.token;
        const refreshedRefreshToken =
          data.data?.refresh_token || data.refresh_token || refreshToken;

        if (refreshedToken) {
          const refreshedPayload = parseJwtPayload(refreshedToken);
          if (refreshedPayload) {
            accessToken = refreshedToken;
            refreshToken = refreshedRefreshToken;
            payload = refreshedPayload;
            isTokenValid = true;
            newAccessToken = refreshedToken;
            newRefreshToken = refreshedRefreshToken;
          }
        }
      } else if (res.status === 401 || res.status === 403) {
        // Refresh token is invalid or expired
        refreshToken = undefined;
      }
    } catch {
      // Temporary network error or cold start: do not invalidate cookies
    }
  }

  function applyCookies(response: NextResponse) {
    if (newAccessToken && newRefreshToken) {
      const isProduction = process.env.NODE_ENV === "production";
      const cookieOptions = {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: "lax" as const,
        secure: isProduction,
      };
      response.cookies.set("access_token", newAccessToken, cookieOptions);
      response.cookies.set("refresh_token", newRefreshToken, cookieOptions);
    }
    return response;
  }

  // If user is already authenticated and visits /login or /register, redirect away
  if (isTokenValid && isAuthGuestPath(pathname)) {
    const redirectRes = NextResponse.redirect(new URL("/", req.url));
    return applyCookies(redirectRes);
  }

  // If path is not protected, allow it (public pages, robots.txt, sitemap.xml, 404s)
  if (!isProtectedPath(pathname)) {
    if (newAccessToken && newRefreshToken) {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set(
        "cookie",
        `access_token=${newAccessToken}; refresh_token=${newRefreshToken}`,
      );
      const nextRes = NextResponse.next({
        request: { headers: requestHeaders },
      });
      return applyCookies(nextRes);
    }
    return NextResponse.next();
  }

  // Protected paths: Require valid token
  if (!isTokenValid) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    const redirectRes = NextResponse.redirect(loginUrl);
    if (!refreshToken) {
      redirectRes.cookies.delete("access_token");
      redirectRes.cookies.delete("refresh_token");
    }
    return redirectRes;
  }

  const role = payload?.role || "reader";

  // Role check: /admin requires admin
  if (pathname.startsWith("/admin") && role !== "admin") {
    const redirectRes = NextResponse.redirect(new URL("/", req.url));
    return applyCookies(redirectRes);
  }

  // Role check: /dashboard requires author or admin
  if (pathname.startsWith("/dashboard") && role !== "author" && role !== "admin") {
    const redirectRes = NextResponse.redirect(new URL("/settings/author-request", req.url));
    return applyCookies(redirectRes);
  }

  // Role check: /settings/author-request is only for readers
  if (pathname.startsWith("/settings/author-request") && role !== "reader") {
    const redirectRes = NextResponse.redirect(new URL("/dashboard", req.url));
    return applyCookies(redirectRes);
  }

  if (newAccessToken && newRefreshToken) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set(
      "cookie",
      `access_token=${newAccessToken}; refresh_token=${newRefreshToken}`,
    );
    const nextRes = NextResponse.next({
      request: { headers: requestHeaders },
    });
    return applyCookies(nextRes);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)",
  ],
};
