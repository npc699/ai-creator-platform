import { getPostAgeHours, type FeedScoreInput } from "@/lib/feed/score-common";

const RISING_FAST_MAX_RANK = 10;
const RISING_FAST_MAX_AGE_HOURS = 48;
const SUSTAINED_HOT_MIN_DAYS = 2;

type ChannelBadgeInput = Pick<
  FeedScoreInput,
  "publishedAt" | "updatedAt" | "now"
>;

/** 发布 48 小时内且热点榜前 10 名，展示「快速上升」。 */
export function computeIsRisingFast(
  post: ChannelBadgeInput,
  rank: number | undefined
): boolean {
  if (rank == null || rank > RISING_FAST_MAX_RANK) {
    return false;
  }

  const ageHours = getPostAgeHours(
    { ...post, likeCount: 0, viewCount: 0 },
    0.5
  );
  return ageHours <= RISING_FAST_MAX_AGE_HOURS;
}

/** 已发布 ≥2 天且仍在爆文榜内，展示「持续热门 X 天」。 */
export function computeSustainedHotDays(
  post: ChannelBadgeInput
): number | null {
  const ageHours = getPostAgeHours(
    { ...post, likeCount: 0, viewCount: 0 },
    0.5
  );
  const days = Math.floor(ageHours / 24);

  if (days < SUSTAINED_HOT_MIN_DAYS) {
    return null;
  }

  return days;
}
