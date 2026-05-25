import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type PostReaderHeaderProps = {
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
};

/** 文章详情页顶栏：左侧返回，右侧由 actions 插槽承载作者操作。 */
export function PostReaderHeader({
  backHref = "/published",
  backLabel = "返回已发布",
  actions,
}: PostReaderHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 px-4 py-3">
      <Link
        className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900"
        href={backHref}
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>
      {actions}
    </div>
  );
}
