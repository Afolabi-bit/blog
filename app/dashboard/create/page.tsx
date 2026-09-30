import { PostEditor } from "@/components/editor/PostEditor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Write Article — Bloggr Studio",
  description: "Create and publish a new article on Bloggr",
};

export default function CreatePostPage() {
  return (
    <div className="max-w-6xl mx-auto py-2">
      <PostEditor />
    </div>
  );
}
