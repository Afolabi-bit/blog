"use client";

import { useActionState } from "react";
import { createPost, type ActionState } from "@/app/actions";
import { SubmitButton } from "@/components/general/SubmitButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CreatePostPage() {
  const [state, action] = useActionState<ActionState, FormData>(
    createPost,
    null,
  );

  const fieldErrors =
    state?.error && typeof state.error === "object" ? state.error : {};
  const globalError =
    state?.error && typeof state.error === "string" ? state.error : null;

  return (
    <div className="py-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create Post</CardTitle>
          <CardDescription>Share your ideas with the world</CardDescription>
        </CardHeader>

        <CardContent>
          <form className="flex flex-col gap-5" action={action}>
            {globalError && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {globalError}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                type="text"
                placeholder="My awesome post"
                required
              />
              {fieldErrors.title && (
                <p className="text-xs text-red-600">{fieldErrors.title[0]}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                name="content"
                placeholder="Write your content here…"
                rows={10}
                required
              />
              {fieldErrors.content && (
                <p className="text-xs text-red-600">{fieldErrors.content[0]}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="cover_image">Cover Image URL</Label>
              <Input
                id="cover_image"
                name="cover_image"
                type="url"
                placeholder="https://example.com/image.jpg"
              />
              {fieldErrors.cover_image && (
                <p className="text-xs text-red-600">
                  {fieldErrors.cover_image[0]}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                name="tags"
                type="text"
                placeholder="golang, devops, architecture (comma-separated)"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue="draft"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <SubmitButton />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
