import Link from "next/link";

import { btnSoft } from "@/lib/utils/brand";

type FeaturePlaceholderProps = {
  title: string;
  description: string;
};

/** 尚未开放的功能页占位，避免侧栏链接 404 */
export function FeaturePlaceholder({
  title,
  description,
}: FeaturePlaceholderProps) {
  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center p-8">
      <div className="max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
        <Link
          className={`mt-6 inline-flex rounded-xl px-4 py-2 text-sm font-medium ${btnSoft}`}
          href="/"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
