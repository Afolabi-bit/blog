"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { likesEndpoints } from "@/lib/endpoints";
import { getStoredAccessToken } from "@/lib/client";

interface LikeButtonProps {
  postId: string;
  initialLikesCount: number;
}

export function LikeButton({ postId, initialLikesCount }: LikeButtonProps) {
  const router = useRouter();
  const [liked, setLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(initialLikesCount);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const token = getStoredAccessToken();
    if (!token) return;

    let isMounted = true;
    likesEndpoints
      .getLikeStatus(postId)
      .then((res) => {
        if (isMounted && res.data) {
          setLiked(Boolean(res.data.liked));
          if (typeof res.data.likes_count === "number") {
            setLikesCount(res.data.likes_count);
          }
        }
      })
      .catch(() => {
        // Silently fall back to initial props if unauthenticated or error
      });

    return () => {
      isMounted = false;
    };
  }, [postId]);

  const handleToggleLike = async () => {
    const token = getStoredAccessToken();
    if (!token) {
      toast.error("Please log in to like this post", {
        action: {
          label: "Login",
          onClick: () => router.push("/login"),
        },
      });
      return;
    }

    if (loading) return;

    const previousLiked = liked;
    const previousCount = likesCount;
    const newLiked = !liked;
    const newCount = previousCount + (newLiked ? 1 : -1);

    // Optimistic UI update
    setLiked(newLiked);
    setLikesCount(Math.max(0, newCount));
    setLoading(true);

    try {
      const res = await likesEndpoints.toggleLike(postId);
      if (res.data) {
        setLiked(Boolean(res.data.liked));
        if (typeof res.data.likes_count === "number") {
          setLikesCount(res.data.likes_count);
        }
      }
    } catch (err: unknown) {
      // Revert optimistic update on failure
      setLiked(previousLiked);
      setLikesCount(previousCount);
      let msg = "Failed to update like status";
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || err.message || msg;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleLike}
      disabled={loading}
      aria-label={liked ? "Unlike post" : "Like post"}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
        liked
          ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 shadow-sm"
          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
      }`}
    >
      <svg
        className={`w-4 h-4 transition-transform duration-200 ${
          liked ? "fill-rose-500 scale-110" : "fill-none stroke-current"
        }`}
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
      <span>{likesCount}</span>
      <span className="sr-only">likes</span>
    </button>
  );
}
