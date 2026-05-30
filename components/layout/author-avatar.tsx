import { cn } from "@/lib/utils";

const AVATAR_SIZE_CLASS = {
  sm: "h-7 w-7 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-xl",
} as const;

type AuthorAvatarProps = {
  authorName: string;
  authorImage?: string | null;
  size?: keyof typeof AVATAR_SIZE_CLASS;
  className?: string;
};

/** 作者头像：有 image 时展示图片，否则首字母占位。 */
export function AuthorAvatar({
  authorName,
  authorImage,
  size = "md",
  className,
}: AuthorAvatarProps) {
  const initial = authorName.slice(0, 1) || "?";

  if (authorImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 作者头像可能为任意外部 OAuth URL
      <img
        alt={authorName}
        className={cn(
          "shrink-0 rounded-full object-cover",
          AVATAR_SIZE_CLASS[size],
          className
        )}
        height={size === "lg" ? 64 : size === "md" ? 40 : 28}
        src={authorImage}
        width={size === "lg" ? 64 : size === "md" ? 40 : 28}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-sky-100 font-semibold text-sky-700",
        AVATAR_SIZE_CLASS[size],
        className
      )}
    >
      {initial}
    </span>
  );
}
