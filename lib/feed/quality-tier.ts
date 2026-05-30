/**
 * 质量分分级（0–100）：列表徽章与爆文榜色块共用。
 * 阈值与推荐侧「待审核折合 45 分」语义对齐：60 为及格线，90 为优质线。
 */

export type QualityTier = "exceptional" | "good" | "pass" | "weak";

export type QualityTierMeta = {
  tier: QualityTier;
  /** 可选短标签，用于 tooltip 或后续文案扩展 */
  label: string;
  badgeClass: string;
  blockClass: {
    container: string;
    score: string;
    caption: string;
  };
};

const TIER_ORDER: QualityTier[] = ["exceptional", "good", "pass", "weak"];

/** 按分数降序匹配的首个档位（score 已取整）。 */
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

/** 列表圆角徽章 class（与 badgeArticleTag 同形态前缀）。 */
export function getQualityScoreBadgeClass(score: number) {
  return [
    "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium",
    getQualityTierMeta(score).badgeClass,
  ].join(" ");
}

/** 供文档/调试：全部档位说明。 */
export const QUALITY_TIER_SUMMARY = TIER_ORDER.map((tier) => {
  const thresholds: Record<QualityTier, string> = {
    exceptional: "90–100",
    good: "75–89",
    pass: "60–74",
    weak: "0–59",
  };
  return { tier, range: thresholds[tier], label: TIER_META[tier].label };
});
