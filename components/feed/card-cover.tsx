import Image from "next/image";

import { cn } from "@/lib/utils";

type FeedCardCoverSize = "default" | "compact";

const COVER_SIZE_CLASS: Record<FeedCardCoverSize, string> = {
  default: "h-[90px] w-[120px]",
  compact: "h-[72px] w-[96px]",
};

const COVER_IMAGE_SIZES: Record<FeedCardCoverSize, string> = {
  default: "120px",
  compact: "96px",
};

type FeedCardCoverProps = {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  size?: FeedCardCoverSize;
};

/** Feed 卡片封面：本站 /uploads 走 next/image。 */
export function FeedCardCover({
  src,
  alt,
  priority = false,
  className,
  size = "default",
}: FeedCardCoverProps) {
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
