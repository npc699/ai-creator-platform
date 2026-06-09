import Image from "next/image";

import { cn } from "@/lib/utils";

type ArticleListCoverSize = "default" | "compact";

const COVER_SIZE_CLASS: Record<ArticleListCoverSize, string> = {
  default: "h-[90px] w-[120px]",
  compact: "h-[72px] w-[96px]",
};

const COVER_IMAGE_SIZES: Record<ArticleListCoverSize, string> = {
  default: "120px",
  compact: "96px",
};

type ArticleListCoverProps = {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  size?: ArticleListCoverSize;
};

/** 文章列表封面：本站 /uploads 走 next/image。 */
export function ArticleListCover({
  src,
  alt,
  priority = false,
  className,
  size = "default",
}: ArticleListCoverProps) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-xl bg-zinc-100",
        COVER_SIZE_CLASS[size],
        className
      )}
    >
      <Image
        alt={alt}
        className="object-cover"
        fill
        priority={priority}
        sizes={COVER_IMAGE_SIZES[size]}
        src={src}
      />
    </div>
  );
}

/** @deprecated 使用 ArticleListCover */
export const FeedCardCover = ArticleListCover;
