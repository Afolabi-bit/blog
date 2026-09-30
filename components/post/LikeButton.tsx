"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { likesEndpoints } from "@/lib/endpoints";
import { getStoredAccessToken } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

interface LikeButtonProps {
  postId: string;
  initialLikesCount: number;
  initialLiked?: boolean;
}

export function LikeButton({
  postId,
  initialLikesCount,
  initialLiked = false,
}: LikeButtonProps) {
  const router = useRouter();
  const [liked, setLiked] = useState<boolean>(initialLiked);
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
        // Silently fall back to initial props
      });

    return () => {
      isMounted = false;
    };
  }, [postId]);

  const handleToggleLike = async () => {
    const token = getStoredAccessToken();
    if (!token) {
      toast.error("Please sign in to like this post", {
        action: {
          label: "Sign in",
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
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggleLike}
      disabled={loading}
      aria-pressed={liked}
      aria-label={liked ? `Unlike article, current likes ${likesCount}` : `Like article, current likes ${likesCount}`}
      className={`h-8 gap-2 rounded-full border px-3 text-xs font-medium transition-all duration-200 ${
        liked
          ? "border-accent-warm/40 bg-accent-warm/10 text-accent-warm hover:bg-accent-warm/15 hover:text-accent-warm"
          : "border-border text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
      }`}
    >
      <Heart
        className={`size-3.5 transition-transform duration-200 ${
          liked ? "scale-110 fill-accent-warm text-accent-warm" : ""
        }`}
      />
      <span>{likesCount}</span>
      <span className="sr-only">likes</span>
    </Button>
  );
}
