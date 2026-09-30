import { NextRequest, NextResponse } from "next/server";

interface JwtClaims {
  sub?: string;
  role?: "reader" | "author" | "admin";
  exp?: number;
  [key: string]: unknown;
}

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

// Routes that can be viewed without authentication
const PUBLIC_PATHS = ["/", "/post"];
const AUTH_ONLY_GUEST_PATHS = ["/login", "/register"];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAuthGuestPath(pathname: string): boolean {
  return AUTH_ONLY_GUEST_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get("access_token")?.value;

  const payload = accessToken ? parseJwtPayload(accessToken) : null;
  const isTokenValid = Boolean(payload && (!payload.exp || payload.exp * 1000 > Date.now()));

  // If user is already authenticated and visits /login or /register, redirect away
  if (isTokenValid && isAuthGuestPath(pathname)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Public paths don't require an active token
  if (isPublicPath(pathname) || isAuthGuestPath(pathname)) {
    return NextResponse.next();
  }

  // Protected paths: Require valid token
  if (!isTokenValid) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = payload?.role || "reader";

  // Role check: /admin requires admin
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Role check: /dashboard requires author or admin
  if (pathname.startsWith("/dashboard") && role !== "author" && role !== "admin") {
    return NextResponse.redirect(new URL("/settings/author-request", req.url));
  }

  // Role check: /settings/author-request is only for readers
  if (pathname.startsWith("/settings/author-request") && role !== "reader") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)",
  ],
};
