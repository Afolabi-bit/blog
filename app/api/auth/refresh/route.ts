import { NextResponse } from "next/server";
import { getRefreshToken, setTokenCookies, clearTokenCookies } from "@/lib/auth";
import type { ApiResponse, AuthTokens } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

// Called by the browser Axios interceptor when a 401 is received.
// Reads the httpOnly refresh_token cookie, exchanges it for a new pair,
// and re-sets the cookies. The client never sees either token value.
export async function POST() {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    return NextResponse.json(
      { status: "error", message: "No refresh token" },
      { status: 401 },
    );
  }

  const upstream = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  const data: ApiResponse<AuthTokens> = await upstream.json();

  if (!upstream.ok || data.status === "error" || !data.data) {
    await clearTokenCookies();
    return NextResponse.json(
      { status: "error", message: "Session expired, please log in again" },
      { status: 401 },
    );
  }

  await setTokenCookies(data.data.token, data.data.refresh_token);
  return NextResponse.json({ status: "success" });
}
