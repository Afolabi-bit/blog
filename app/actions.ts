"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSession, getAccessToken } from "@/lib/auth";
import { CreatePostSchema } from "@/lib/validations";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export type ActionState = {
  error?: Record<string, string[]> | string;
} | null;

export async function createPost(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getServerSession();
  if (!user) redirect("/login");

  if (user.role === "reader") {
    return { error: "You must be an author to create posts." };
  }

  const raw = {
    title: formData.get("title"),
    content: formData.get("content"),
    cover_image: formData.get("cover_image") || undefined,
    status: formData.get("status") || "draft",
    tags: formData
      .get("tags")
      ?.toString()
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean) ?? [],
  };

  const parsed = CreatePostSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const token = await getAccessToken();

  const res = await fetch(`${API_URL}/api/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(parsed.data),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    return { error: json.message ?? "Failed to create post" };
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
