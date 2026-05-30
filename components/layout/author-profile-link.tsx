"use client";

import Link from "next/link";
import type { MouseEvent, PointerEvent, ReactNode } from "react";

import { AuthorAvatar } from "@/components/layout/author-avatar";
import { buildAuthorProfileHref } from "@/lib/users/profile-navigation";
import { cn } from "@/lib/utils";

type AuthorProfileLinkProps = {
  authorId: string;
  authorName: string;
  authorImage?: string | null;
  returnPath?: string | null;
  showAvatar?: boolean;
  /** 名字下方附加信息（如发布时间）；仅展示，不纳入主页链接点击区。 */
  subtitle?: ReactNode;
  /** 嵌套在可点击卡片内时阻止冒泡，避免误触文章跳转。 */
  stopPropagation?: boolean;
  className?: string;
  nameClassName?: string;
};

function AuthorProfileFallback({
  authorName,
  authorImage,
  showAvatar,
  subtitle,
  className,
  nameClassName,
}: Pick<
  AuthorProfileLinkProps,
  "authorName" | "authorImage" | "showAvatar" | "subtitle" | "className" | "nameClassName"
>) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      {showAvatar ? (
        <AuthorAvatar authorImage={authorImage} authorName={authorName} />
      ) : null}
      <div className="min-w-0 flex flex-col gap-0.5">
        <span className={cn("text-sm font-medium text-zinc-900", nameClassName)}>
          {authorName}
        </span>
        {subtitle}
      </div>
    </div>
  );
}

/** 发布者主页入口：头像 + 昵称（+ 可选副信息），hover 时名字下划线。 */
export function AuthorProfileLink({
  authorId,
  authorName,
  authorImage,
  returnPath,
  showAvatar = true,
  subtitle,
  stopPropagation = false,
  className,
  nameClassName,
}: AuthorProfileLinkProps) {
  if (!authorId) {
    return (
      <AuthorProfileFallback
        authorImage={authorImage}
        authorName={authorName}
        className={className}
        nameClassName={nameClassName}
        showAvatar={showAvatar}
        subtitle={subtitle}
      />
    );
  }

  const linkProps = {
    href: buildAuthorProfileHref(authorId, returnPath),
    onClick: stopPropagation
      ? (event: MouseEvent) => {
          event.stopPropagation();
        }
      : undefined,
    onPointerDown: stopPropagation
      ? (event: PointerEvent) => {
          event.stopPropagation();
        }
      : undefined,
  };

  const nameNode = (
    <span
      className={cn(
        "truncate text-sm font-medium text-zinc-900 transition group-hover:underline",
        nameClassName
      )}
    >
      {authorName}
    </span>
  );

  if (showAvatar) {
    const linkClassName = cn(
      "group relative z-10",
      stopPropagation && "pointer-events-auto"
    );

    return (
      <div className={cn("flex min-w-0 items-start gap-3", className)}>
        <Link {...linkProps} className={cn(linkClassName, "shrink-0")}>
          <AuthorAvatar authorImage={authorImage} authorName={authorName} />
        </Link>
        <div className="min-w-0 flex flex-col gap-0.5">
          <Link {...linkProps} className={cn(linkClassName, "inline-flex min-w-0")}>
            {nameNode}
          </Link>
          {subtitle}
        </div>
      </div>
    );
  }

  return (
    <Link
      {...linkProps}
      className={cn(
        "group relative z-10 inline-flex min-w-0 items-center",
        stopPropagation && "pointer-events-auto",
        className
      )}
    >
      {nameNode}
    </Link>
  );
}
