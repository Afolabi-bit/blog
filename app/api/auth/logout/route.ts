import { NextResponse } from "next/server";
import { getAccessToken, clearTokenCookies } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export async function POST() {
  const token = await getAccessToken();

  if (token) {
    // Best-effort: tell the Go API to revoke the refresh token
    // The cookie will be cleared regardless of whether this succeeds
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }).catch(() => {
      // Silently ignore — local cookie clear is what matters
    });
  }

  await clearTokenCookies();
  return NextResponse.json({ status: "success" });
}
