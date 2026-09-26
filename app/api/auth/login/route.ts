import { NextRequest, NextResponse } from "next/server";
import { setTokenCookies } from "@/lib/auth";
import { LoginSchema } from "@/lib/validations";
import type { ApiResponse, AuthResponse } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { status: "error", message: "Invalid input", error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const upstream = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    const data: ApiResponse<AuthResponse> = await upstream.json();

    if (!upstream.ok || data.status === "error" || !data.data) {
      return NextResponse.json(
        { status: "error", message: data.message ?? "Login failed" },
        { status: upstream.status },
      );
    }

    await setTokenCookies(data.data.token, data.data.refresh_token);

    // Return safe user info — never the tokens
    return NextResponse.json({ status: "success", data: { user: data.data.user } });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 },
    );
  }
}
