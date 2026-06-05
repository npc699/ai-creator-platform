"use client";

import { useState } from "react";

type UseFeedLikeToggleOptions = {
  postId?: string;
  canLike?: boolean;
  initialLiked?: boolean;
  likes: number;
};

/** Feed 列表点赞乐观更新，供列表行共用。 */
export function useFeedLikeToggle({
  postId,
  canLike = false,
  initialLiked = false,
  likes,
}: UseFeedLikeToggleOptions) {
  const sourceKey = `${postId ?? ""}:${initialLiked}:${likes}`;
  const [syncedKey, setSyncedKey] = useState(sourceKey);
  const [optimisticLike, setOptimisticLike] = useState<{
    liked: boolean;
    likeCount: number;
  } | null>(null);
  const [isLikePending, setIsLikePending] = useState(false);
  const [likeError, setLikeError] = useState<string | null>(null);

  if (!isLikePending && sourceKey !== syncedKey) {
    setSyncedKey(sourceKey);
    setOptimisticLike(null);
  }

  const liked = optimisticLike?.liked ?? initialLiked;
  const likeCount = optimisticLike?.likeCount ?? likes;

  async function handleLikeToggle() {
    if (isLikePending) {
      return;
    }

    setLikeError(null);

    if (!postId) {
      const nextLiked = !liked;
      setOptimisticLike({
        liked: nextLiked,
        likeCount: nextLiked ? likeCount + 1 : likeCount - 1,
      });
      return;
    }

    if (!canLike) {
      setLikeError("请先登录后再点赞");
      return;
    }

    const nextLiked = !liked;
    const optimisticCount = nextLiked ? likeCount + 1 : likeCount - 1;
    setOptimisticLike({ liked: nextLiked, likeCount: optimisticCount });
    setIsLikePending(true);

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setOptimisticLike({ liked: !nextLiked, likeCount: likes });
        setLikeError(payload?.error ?? "点赞失败，请稍后重试");
        return;
      }

      const data = (await response.json()) as {
        liked: boolean;
        likeCount: number;
      };
      setOptimisticLike({ liked: data.liked, likeCount: data.likeCount });
    } catch {
      setOptimisticLike({ liked: !nextLiked, likeCount: likes });
      setLikeError("点赞失败，请稍后重试");
    } finally {
      setIsLikePending(false);
    }
  }

  return {
    liked,
    likeCount,
    isLikePending,
    likeError,
    handleLikeToggle,
  };
}
