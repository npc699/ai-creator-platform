import { getPostAgeHours, type FeedScoreInput } from "@/lib/feed/scores/common";

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

/**
 * 质量分分级（0–100）：列表徽章与爆文榜色块共用。
 * 阈值与推荐侧「待审核折合 45 分」语义对齐：60 为及格线，90 为优质线。
 */

export type QualityTier = "exceptional" | "good" | "pass" | "weak";

export type QualityTierMeta = {
  tier: QualityTier;
  label: string;
  badgeClass: string;
  blockClass: {
    container: string;
    score: string;
    caption: string;
  };
};

const TIER_ORDER: QualityTier[] = ["exceptional", "good", "pass", "weak"];

export function getQualityTier(score: number): QualityTier {
  if (score >= 90) {
    return "exceptional";
  }
  if (score >= 75) {
    return "good";
  }
  if (score >= 60) {
    return "pass";
  }
  return "weak";
}

const TIER_META: Record<QualityTier, Omit<QualityTierMeta, "tier">> = {
  exceptional: {
    label: "优质",
    badgeClass:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    blockClass: {
      container: "bg-emerald-50",
      score: "text-emerald-600",
      caption: "text-emerald-600/80",
    },
  },
  good: {
    label: "良好",
    badgeClass: "bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200",
    blockClass: {
      container: "bg-teal-50",
      score: "text-teal-600",
      caption: "text-teal-600/80",
    },
  },
  pass: {
    label: "合格",
    badgeClass: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
    blockClass: {
      container: "bg-sky-50",
      score: "text-sky-600",
      caption: "text-sky-600/80",
    },
  },
  weak: {
    label: "待提升",
    badgeClass: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    blockClass: {
      container: "bg-amber-50",
      score: "text-amber-600",
      caption: "text-amber-600/80",
    },
  },
};

export function getQualityTierMeta(score: number): QualityTierMeta {
  const tier = getQualityTier(score);
  return { tier, ...TIER_META[tier] };
}

export function getQualityScoreBadgeClass(score: number) {
  return [
    "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium",
    getQualityTierMeta(score).badgeClass,
  ].join(" ");
}

export const QUALITY_TIER_SUMMARY = TIER_ORDER.map((tier) => {
  const thresholds: Record<QualityTier, string> = {
    exceptional: "90–100",
    good: "75–89",
    pass: "60–74",
    weak: "0–59",
  };
  return { tier, range: thresholds[tier], label: TIER_META[tier].label };
});

/** 热点榜排名色块：与右侧「热点话题」侧栏一致，前三暖色递进，其余灰色。 */
export function getHotRankBadgeClass(rank: number) {
  switch (rank) {
    case 1:
      return "bg-red-500 text-white";
    case 2:
      return "bg-orange-400 text-white";
    case 3:
      return "bg-amber-400 text-white";
    default:
      return "bg-zinc-100 text-zinc-500";
  }
}
